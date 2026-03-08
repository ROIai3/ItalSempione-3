import * as XLSX from 'xlsx';
import { db } from '../config/database';
import { normalizeCarrier } from '../utils/carrierNormalizer';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * Column header mapping: fuzzy-match Excel column names to internal field names.
 * Each key is the internal field; values are possible header variations (lowercase).
 */
const COLUMN_MAPPINGS: Record<string, string[]> = {
  mbl: [
    'mbl',
    'master bl',
    'master bill',
    'master bill of lading',
    'bill of lading',
    'b/l',
    'bl',
    'bol',
    'bl number',
    'mbl number',
    'bl no',
    'mbl no',
    'booking number',
    'booking',
  ],
  carrier: [
    'carrier',
    'shipping line',
    'line',
    'carrier name',
    'ship line',
    'vessel operator',
    'operator',
    'compagnia',
    'vettore',
  ],
  eta: [
    'eta',
    'estimated arrival',
    'arrival date',
    'est. arrival',
    'expected arrival',
    'arrival eta',
    'data arrivo',
  ],
};

interface ParsedRow {
  mbl: string;
  carrier: string;
  eta: string | null;
  rawData: Record<string, unknown>;
}

interface BatchSummary {
  batchId: string;
  filename: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  carrierBreakdown: Record<string, number>;
  warnings: string[];
}

/**
 * Match a header string to an internal field name using fuzzy matching.
 */
function matchHeader(header: string): string | null {
  const cleaned = header.trim().toLowerCase().replace(/[_\-\.]+/g, ' ');

  for (const [field, patterns] of Object.entries(COLUMN_MAPPINGS)) {
    for (const pattern of patterns) {
      if (cleaned === pattern || cleaned.includes(pattern) || pattern.includes(cleaned)) {
        return field;
      }
    }
  }

  return null;
}

/**
 * Build a mapping from column index to internal field name.
 */
function buildColumnMap(headers: string[]): Record<number, string> {
  const map: Record<number, string> = {};
  const assigned = new Set<string>();

  for (let i = 0; i < headers.length; i++) {
    const field = matchHeader(headers[i]);
    if (field && !assigned.has(field)) {
      map[i] = field;
      assigned.add(field);
    }
  }

  return map;
}

/**
 * Parse an Excel file buffer and extract shipment rows.
 */
function parseExcelBuffer(buffer: Buffer, filename: string): {
  rows: ParsedRow[];
  warnings: string[];
} {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

  if (workbook.SheetNames.length === 0) {
    throw new AppError('Excel file contains no sheets', 400);
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rawData.length < 2) {
    throw new AppError('Excel file must contain a header row and at least one data row', 400);
  }

  const headers = (rawData[0] as string[]).map((h) =>
    h != null ? String(h).trim() : ''
  );
  const columnMap = buildColumnMap(headers);

  // Validate required columns are present
  const mappedFields = new Set(Object.values(columnMap));
  if (!mappedFields.has('mbl')) {
    throw new AppError(
      `Could not find MBL/Bill of Lading column. Found headers: ${headers.join(', ')}`,
      400
    );
  }
  if (!mappedFields.has('carrier')) {
    throw new AppError(
      `Could not find Carrier/Shipping Line column. Found headers: ${headers.join(', ')}`,
      400
    );
  }

  const rows: ParsedRow[] = [];
  const warnings: string[] = [];

  for (let rowIdx = 1; rowIdx < rawData.length; rowIdx++) {
    const row = rawData[rowIdx] as unknown[];
    if (!row || row.every((cell) => cell == null || String(cell).trim() === '')) {
      continue; // skip empty rows
    }

    // Build raw data object with original headers
    const rawObj: Record<string, unknown> = {};
    for (let col = 0; col < headers.length; col++) {
      if (headers[col]) {
        rawObj[headers[col]] = row[col] ?? null;
      }
    }

    // Extract mapped fields
    const mapped: Record<string, string | null> = { mbl: null, carrier: null, eta: null };
    for (const [colIdx, field] of Object.entries(columnMap)) {
      const value = row[Number(colIdx)];
      mapped[field] = value != null ? String(value).trim() : null;
    }

    if (!mapped.mbl) {
      warnings.push(`Row ${rowIdx + 1}: Missing MBL, skipped`);
      continue;
    }

    if (!mapped.carrier) {
      warnings.push(`Row ${rowIdx + 1}: Missing carrier, skipped`);
      continue;
    }

    rows.push({
      mbl: mapped.mbl,
      carrier: mapped.carrier,
      eta: mapped.eta,
      rawData: rawObj,
    });
  }

  logger.info(
    { filename, totalRows: rawData.length - 1, parsedRows: rows.length },
    'Excel file parsed'
  );

  return { rows, warnings };
}

/**
 * Parse an uploaded Excel file and create a batch with shipment records.
 */
export async function processUpload(
  fileBuffer: Buffer,
  filename: string,
  userId: string
): Promise<BatchSummary> {
  const { rows, warnings } = parseExcelBuffer(fileBuffer, filename);

  if (rows.length === 0) {
    throw new AppError('No valid shipment rows found in the uploaded file', 400);
  }

  // Create batch record
  const [batch] = await db('upload_batches')
    .insert({
      user_id: userId,
      filename,
      row_count: rows.length,
      status: 'processing',
    })
    .returning('*');

  const carrierBreakdown: Record<string, number> = {};
  let importedRows = 0;
  let skippedRows = 0;

  try {
    // Insert shipments in a transaction
    await db.transaction(async (trx) => {
      for (const row of rows) {
        const carrierNormalized = normalizeCarrier(row.carrier);

        if (!carrierNormalized) {
          warnings.push(
            `MBL ${row.mbl}: Unknown carrier "${row.carrier}", imported with null carrier_normalized`
          );
        }

        let etaDate: Date | null = null;
        if (row.eta) {
          const parsed = new Date(row.eta);
          if (!isNaN(parsed.getTime())) {
            etaDate = parsed;
          } else {
            warnings.push(`MBL ${row.mbl}: Could not parse ETA "${row.eta}"`);
          }
        }

        await trx('shipments').insert({
          batch_id: batch.id,
          mbl: row.mbl,
          carrier: row.carrier,
          carrier_normalized: carrierNormalized,
          current_eta: etaDate,
          original_eta: etaDate,
          shipment_status: 'pending',
          check_status: 'pending',
          is_active: true,
          raw_data: JSON.stringify(row.rawData),
        });

        importedRows++;
        const key = carrierNormalized || 'UNKNOWN';
        carrierBreakdown[key] = (carrierBreakdown[key] || 0) + 1;
      }
    });

    // Update batch status
    await db('upload_batches')
      .where({ id: batch.id })
      .update({ status: 'completed', row_count: importedRows });

    logger.info(
      { batchId: batch.id, importedRows, skippedRows: rows.length - importedRows },
      'Upload batch completed'
    );
  } catch (err) {
    // Mark batch as failed
    const message = err instanceof Error ? err.message : 'Unknown error';
    await db('upload_batches')
      .where({ id: batch.id })
      .update({ status: 'failed', error_message: message });

    logger.error({ batchId: batch.id, err }, 'Upload batch failed');
    throw new AppError(`Failed to process upload: ${message}`, 500);
  }

  skippedRows = rows.length - importedRows;

  return {
    batchId: batch.id,
    filename,
    totalRows: rows.length,
    importedRows,
    skippedRows,
    carrierBreakdown,
    warnings,
  };
}

/**
 * List all upload batches, ordered by most recent first.
 */
export async function listBatches(limit = 50, offset = 0) {
  return db('upload_batches')
    .select('*')
    .orderBy('uploaded_at', 'desc')
    .limit(limit)
    .offset(offset);
}

/**
 * Get a single batch with its shipments.
 */
export async function getBatchDetail(batchId: string) {
  const batch = await db('upload_batches').where({ id: batchId }).first();

  if (!batch) {
    throw new AppError('Batch not found', 404);
  }

  const shipments = await db('shipments')
    .where({ batch_id: batchId })
    .orderBy('created_at', 'asc');

  return { batch, shipments };
}
