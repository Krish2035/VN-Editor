import { Request, Response, NextFunction } from 'express';
import { TracedRequest } from './logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: TracedRequest,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const traceId = req.traceId || 'unknown';

  const responsePayload = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      traceId,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack, details: err.details } : {})
    }
  };

  res.status(statusCode).json(responsePayload);
};
