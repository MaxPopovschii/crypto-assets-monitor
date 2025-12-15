import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@crypto-monitor/types';
import { logger } from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    logger.error(
      {
        error: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
        isOperational: err.isOperational,
        path: req.path,
        method: req.method,
      },
      'API Error occurred'
    );

    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    });
  }

  // Unhandled errors
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    'Unhandled error occurred'
  );

  return res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
