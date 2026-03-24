import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All shipment routes require authentication
router.use(requireAuth);

const listQuerySchema = z.object({
  is_active: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  carrier: z.string().optional(),
  status: z.string().optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => Math.min(200, Math.max(1, parseInt(val, 10) || 50))),
});

/**
 * GET /api/shipments
 * List shipments with optional filters and pagination.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('Invalid query parameters', 400);
    }

    const { is_active, carrier, status, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    let query = db('shipments').select('*');
    let countQuery = db('shipments').count('id as total');

    if (is_active !== undefined) {
      query = query.where({ is_active });
      countQuery = countQuery.where({ is_active });
    }

    if (carrier) {
      query = query.where({ carrier_normalized: carrier.toUpperCase() });
      countQuery = countQuery.where({ carrier_normalized: carrier.toUpperCase() });
    }

    if (status) {
      query = query.where({ shipment_status: status });
      countQuery = countQuery.where({ shipment_status: status });
    }

    const [shipments, [countResult]] = await Promise.all([
      query.orderBy('created_at', 'desc').limit(limit).offset(offset),
      countQuery,
    ]);

    const total = Number(countResult.total);

    res.json({
      success: true,
      data: {
        shipments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/shipments/:id
 * Get a single shipment by ID.
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const shipment = await db('shipments').where({ id }).first();

    if (!shipment) {
      throw new AppError('Shipment not found', 404);
    }

    res.json({
      success: true,
      data: shipment,
    });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  shipment_status: z
    .enum(['pending', 'in_transit', 'arrived', 'delivered', 'completed', 'unknown'])
    .optional(),
  current_eta: z.string().datetime().optional().nullable(),
  is_active: z.boolean().optional(),
  carrier_normalized: z.string().optional(),
}).strict();

/**
 * PATCH /api/shipments/:id
 * Update shipment fields.
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new AppError(`Validation error: ${message}`, 400);
    }

    const updates = parsed.data;

    if (Object.keys(updates).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const existing = await db('shipments').where({ id }).first();
    if (!existing) {
      throw new AppError('Shipment not found', 404);
    }

    const [updated] = await db('shipments')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()),
});

/**
 * POST /api/shipments/delete-bulk
 * Delete multiple shipments by ID.
 */
router.post('/delete-bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = bulkDeleteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid request body, Expected array of current UUIDs', 400);
    }

    const { ids } = parsed.data;
    if (ids.length === 0) {
      res.json({ success: true, message: 'No records to delete' });
      return;
    }

    const count = await db('shipments').whereIn('id', ids).del();

    res.json({
      success: true,
      message: `Successfully deleted ${count} shipments`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/shipments/:id
 * Delete a single shipment by ID.
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if UUID is valid format
    if (!z.string().uuid().safeParse(id).success) {
      throw new AppError('Invalid ID format', 400);
    }

    const deleted = await db('shipments').where({ id }).del();
    
    if (!deleted) {
      throw new AppError('Shipment not found', 404);
    }

    res.json({
      success: true,
      message: 'Shipment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
