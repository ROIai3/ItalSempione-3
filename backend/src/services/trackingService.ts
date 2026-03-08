import { db } from '../config/database';
import { adapterRegistry } from '../adapters/registry';
import { TrackingResult } from '../adapters/base';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/** Statuses that indicate a shipment has finished transit. */
const TERMINAL_STATUSES = new Set(['arrived', 'delivered', 'completed']);

interface ShipmentRow {
  id: string;
  mbl: string;
  carrier_normalized: string | null;
  current_eta: Date | null;
  shipment_status: string;
  is_active: boolean;
  check_count: number;
}

/**
 * Execute tracking for a single shipment.
 * Loads the correct carrier adapter, calls track(), and updates the DB accordingly.
 */
export async function executeTracking(shipmentId: string): Promise<{
  shipmentId: string;
  result: TrackingResult;
  etaChanged: boolean;
}> {
  const shipment = await db<ShipmentRow>('shipments')
    .where({ id: shipmentId })
    .first();

  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  if (!shipment.is_active) {
    throw new AppError('Shipment is no longer active', 400);
  }

  if (!shipment.carrier_normalized) {
    throw new AppError(
      `Shipment ${shipmentId} has no normalized carrier — cannot determine adapter`,
      400
    );
  }

  const adapter = adapterRegistry.get(shipment.carrier_normalized);
  if (!adapter) {
    throw new AppError(
      `No tracking adapter registered for carrier: ${shipment.carrier_normalized}`,
      400
    );
  }

  const startTime = Date.now();
  let result: TrackingResult;
  let trackingError: string | null = null;

  try {
    result = await adapter.track(shipment.mbl);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    trackingError = err instanceof Error ? err.message : 'Unknown tracking error';

    // Log the failed attempt
    await db('tracking_log').insert({
      shipment_id: shipmentId,
      carrier: shipment.carrier_normalized,
      request_payload: JSON.stringify({ mbl: shipment.mbl }),
      response_payload: null,
      http_status: null,
      status: 'failed',
      error_message: trackingError,
      duration_ms: durationMs,
    });

    // Update shipment check metadata
    await db('shipments')
      .where({ id: shipmentId })
      .update({
        last_check_date: new Date(),
        check_status: 'failed',
        check_error: trackingError,
        check_count: shipment.check_count + 1,
        updated_at: new Date(),
      });

    logger.error(
      { shipmentId, carrier: shipment.carrier_normalized, err },
      'Tracking execution failed'
    );

    throw new AppError(`Tracking failed: ${trackingError}`, 502);
  }

  const durationMs = Date.now() - startTime;

  // Log successful tracking
  await db('tracking_log').insert({
    shipment_id: shipmentId,
    carrier: shipment.carrier_normalized,
    request_payload: JSON.stringify({ mbl: shipment.mbl }),
    response_payload: JSON.stringify(result.rawResponse),
    http_status: 200,
    status: 'success',
    error_message: null,
    duration_ms: durationMs,
  });

  // Check if ETA changed
  let etaChanged = false;
  const newEtaStr = result.eta ? result.eta.toISOString().split('T')[0] : null;
  const oldEtaStr = shipment.current_eta
    ? new Date(shipment.current_eta).toISOString().split('T')[0]
    : null;

  if (newEtaStr !== oldEtaStr) {
    etaChanged = true;

    // Insert ETA history record
    await db('eta_history').insert({
      shipment_id: shipmentId,
      previous_eta: shipment.current_eta,
      new_eta: result.eta,
    });

    logger.info(
      { shipmentId, oldEta: oldEtaStr, newEta: newEtaStr },
      'ETA changed'
    );
  }

  // Determine if shipment should be deactivated
  const isTerminal = TERMINAL_STATUSES.has(result.shipmentStatus);

  // Update shipment record
  await db('shipments')
    .where({ id: shipmentId })
    .update({
      shipment_status: result.shipmentStatus,
      current_eta: result.eta,
      eta_changed: etaChanged || shipment.current_eta !== null ? etaChanged : false,
      last_check_date: new Date(),
      check_status: 'success',
      check_error: null,
      check_count: shipment.check_count + 1,
      is_active: !isTerminal,
      monitoring_stopped_at: isTerminal ? new Date() : null,
      updated_at: new Date(),
    });

  logger.info(
    {
      shipmentId,
      carrier: shipment.carrier_normalized,
      status: result.shipmentStatus,
      etaChanged,
      durationMs,
    },
    'Tracking executed successfully'
  );

  return { shipmentId, result, etaChanged };
}

/**
 * Get the tracking log for a shipment.
 */
export async function getTrackingLog(
  shipmentId: string,
  limit = 50,
  offset = 0
) {
  const shipment = await db('shipments').where({ id: shipmentId }).first();
  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  return db('tracking_log')
    .where({ shipment_id: shipmentId })
    .orderBy('checked_at', 'desc')
    .limit(limit)
    .offset(offset);
}

/**
 * Get the ETA change history for a shipment.
 */
export async function getEtaHistory(
  shipmentId: string,
  limit = 50,
  offset = 0
) {
  const shipment = await db('shipments').where({ id: shipmentId }).first();
  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  return db('eta_history')
    .where({ shipment_id: shipmentId })
    .orderBy('changed_at', 'desc')
    .limit(limit)
    .offset(offset);
}
