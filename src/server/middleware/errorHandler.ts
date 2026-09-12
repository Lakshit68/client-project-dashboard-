import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
        details: err.details || null,
      },
    });
  }

  console.error('Unhandled Server Error:', err);

  // Return descriptive message for database/initialization errors
  const message = err?.message || 'Internal server error';

  return res.status(500).json({
    error: {
      message,
      statusCode: 500,
    },
  });
}
