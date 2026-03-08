import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload } from '../middleware/auth';
import logger from '../utils/logger';

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

const TOKEN_EXPIRY = '24h';

/**
 * Authenticate a user by username and password.
 * Returns a signed JWT and user info on success.
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResult> {
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const user = await db<UserRow>('users')
    .where({ username: username.trim().toLowerCase() })
    .first();

  if (!user) {
    logger.warn({ username }, 'Login attempt with unknown username');
    throw new AppError('Invalid username or password', 401);
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    logger.warn({ username }, 'Login attempt with incorrect password');
    throw new AppError('Invalid username or password', 401);
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  logger.info({ userId: user.id, username: user.username }, 'User logged in');

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
}

/**
 * Get user profile by ID.
 */
export async function getUserById(
  userId: string
): Promise<Omit<UserRow, 'password_hash'> | null> {
  const user = await db<UserRow>('users')
    .select('id', 'username', 'role', 'created_at', 'updated_at')
    .where({ id: userId })
    .first();

  return user || null;
}
