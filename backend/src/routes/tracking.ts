import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  executeTracking,
  getTrackingLog,
  getEtaHistory,
} from '../services/trackingService';

const router = Router();

// All tracking routes require authentication
router.use(requireAuth);

const executeSchema = z.object({
  shipment_id: z.string().uuid('shipment_id must be a valid UUID'),
});

/**
 * POST /api/tracking/execute
 * Trigger tracking for a single shipment.
 */
router.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = executeSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      throw new AppError(message, 400);
    }

    const result = await executeTracking(parsed.data.shipment_id);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tracking/shipments/:id/log
 * Get the tracking log for a shipment.
 */
router.get(
  '/shipments/:id/log',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

      const logs = await getTrackingLog(id as string, limit, offset);

      res.json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/tracking/shipments/:id/eta-history
 * Get ETA change history for a shipment.
 */
router.get(
  '/shipments/:id/eta-history',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

      const history = await getEtaHistory(id as string, limit, offset);

      res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
