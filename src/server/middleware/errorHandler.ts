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

  return res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  });
}
