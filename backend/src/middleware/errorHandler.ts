import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { HTTP_STATUS } from '../config/constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode: number = HTTP_STATUS.INTERNAL;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = err.message;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      statusCode = HTTP_STATUS.CONFLICT;
      message = `A record with this ${prismaError.meta?.target?.join(', ')} already exists`;
    } else if (prismaError.code === 'P2025') {
      statusCode = HTTP_STATUS.NOT_FOUND;
      message = 'Record not found';
    }
  } else if (err.name === 'ZodError') {
    statusCode = HTTP_STATUS.UNPROCESSABLE;
    message = 'Validation failed';
    details = err;
  }

  // Log server errors
  if (statusCode >= 500) {
    logger.error('Server Error', {
      statusCode,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    });
  } else {
    logger.warn('Client Error', {
      statusCode,
      message,
      path: req.path,
      method: req.method,
    });
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    message,
  };
  if (details) responseBody.details = details;
  if (process.env.NODE_ENV === 'development') responseBody.stack = err.stack;

  res.status(statusCode).json(responseBody);
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, HTTP_STATUS.NOT_FOUND));
};
