import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { processUpload, listBatches, getBatchDetail } from '../services/uploadService';

const router = Router();

// All upload routes require authentication
router.use(requireAuth);

// Configure multer for file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      cb(new AppError('Only Excel files (.xlsx, .xls) and CSV files are allowed', 400));
      return;
    }

    cb(null, true);
  },
});

/**
 * POST /api/upload
 * Upload an Excel file, parse it, and create a batch with shipments.
 */
router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded. Use form field name "file".', 400);
      }

      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await processUpload(
        req.file.buffer,
        req.file.originalname,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/upload/batches
 * List all upload batches.
 */
router.get('/batches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

    const batches = await listBatches(limit, offset);

    res.json({
      success: true,
      data: batches,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/upload/batches/:id
 * Get batch detail with its shipments.
 */
router.get('/batches/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const detail = await getBatchDetail(id as string);

    res.json({
      success: true,
      data: detail,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
