import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AuditAction } from '@prisma/client';

export const auditLog = (action: AuditAction, entity: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    next();

    // Post-response audit
    if (req.user) {
      setImmediate(async () => {
        try {
          await prisma.auditLog.create({
            data: {
              userId: req.user!.id,
              action,
              entity,
              entityId: req.params.id,
              newValues: req.body ? JSON.parse(JSON.stringify(req.body)) : undefined,
              ipAddress: req.ip ?? req.socket.remoteAddress,
              userAgent: req.get('user-agent'),
            },
          });
        } catch (err) {
          logger.error('Failed to write audit log', { err });
        }
      });
    }
  };
};
