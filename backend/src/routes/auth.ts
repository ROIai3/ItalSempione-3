import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { login, getUserById } from '../services/authService';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(', ');
      throw new AppError(message, 400);
    }

    const { username, password } = parsed.data;
    const result = await login(username, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info.
 */
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('User not found in request', 401);
    }

    const user = await getUserById(req.user.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
