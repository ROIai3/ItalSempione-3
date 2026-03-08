import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // Log the error
  if (statusCode >= 500) {
    logger.error({ err, statusCode }, 'Unhandled server error');
  } else {
    logger.warn({ err: err.message, statusCode }, 'Client error');
  }

  const response: {
    error: string;
    message: string;
    statusCode: number;
    stack?: string;
  } = {
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message: isOperational ? err.message : 'An unexpected error occurred',
    statusCode,
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
