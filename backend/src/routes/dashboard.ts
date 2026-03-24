import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(requireAuth);

/**
 * GET /api/dashboard/stats
 * Return aggregate counts for the dashboard overview.
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      [totalResult],
      [activeResult],
      [arrivedResult],
      [failedChecksResult],
      [inTransitResult],
      [pendingResult],
      [etaChangedResult],
    ] = await Promise.all([
      db('shipments').count('id as count'),
      db('shipments').where({ is_active: true }).count('id as count'),
      db('shipments')
        .whereIn('shipment_status', ['arrived', 'delivered', 'completed'])
        .count('id as count'),
      db('shipments').where({ check_status: 'failed' }).count('id as count'),
      db('shipments').where({ shipment_status: 'in_transit' }).count('id as count'),
      db('shipments').where({ shipment_status: 'pending' }).count('id as count'),
      db('shipments').where({ eta_changed: true }).count('id as count'),
    ]);

    // Carrier breakdown for active shipments
    const carrierBreakdown = await db('shipments')
      .select('carrier_normalized')
      .where({ is_active: true })
      .count('id as count')
      .groupBy('carrier_normalized')
      .orderBy('count', 'desc');

    res.json({
      success: true,
      data: {
        total: Number(totalResult.count),
        active: Number(activeResult.count),
        arrived: Number(arrivedResult.count),
        failedChecks: Number(failedChecksResult.count),
        inTransit: Number(inTransitResult.count),
        pending: Number(pendingResult.count),
        etaChanged: Number(etaChangedResult.count),
        carrierBreakdown: carrierBreakdown.map((row) => ({
          carrier: row.carrier_normalized || 'UNKNOWN',
          count: Number(row.count),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dashboard/reset
 * Reset the entire tracking system (shipments and batches).
 */
router.post('/reset', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Delete shipments first to satisfy FK from eta_history & tracking_log, then batches
    await db('shipments').del();
    await db('upload_batches').del();

    res.json({
      success: true,
      message: 'System reset successfully',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
