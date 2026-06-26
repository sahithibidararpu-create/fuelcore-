import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { HTTP_STATUS, PERMISSIONS } from '../config/constants';

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Access denied. Required role: ${roles.join(' or ')}`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      throw new AppError(`Unknown permission: ${permission}`, HTTP_STATUS.INTERNAL);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        `You don't have permission to perform this action`,
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

// Ensure station-level isolation: employee/manager can only access their station
export const requireStationAccess = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }

  if (req.user.role === 'SUPER_ADMIN') {
    return next(); // SUPER_ADMIN can access all stations
  }

  // For station-scoped roles, inject stationId from user context
  const stationId = req.query.stationId || req.params.stationId || req.body?.stationId;

  if (stationId && stationId !== req.user.stationId) {
    throw new AppError('Access denied to this station', HTTP_STATUS.FORBIDDEN);
  }

  // Auto-inject stationId for non-super-admins
  if (req.user.stationId) {
    req.query.stationId = req.user.stationId;
    if (req.method !== 'GET') {
      req.body = req.body || {};
      req.body.stationId = req.user.stationId;
    }
  }

  next();
};
