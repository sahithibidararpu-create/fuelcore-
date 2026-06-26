import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { isTokenBlacklisted } from '../config/redis';
import { AppError } from './errorHandler';
import { HTTP_STATUS } from '../config/constants';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
  stationId: string | null;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        stationId: string | null;
        firstName: string;
        lastName: string;
      };
    }
  }
}

let publicKey: string;

function getPublicKey(): string {
  if (!publicKey) {
    const keyPath = path.resolve(env.JWT_PUBLIC_KEY_PATH);
    if (!fs.existsSync(keyPath)) {
      throw new AppError('JWT public key not found. Run: npm run keys:generate', HTTP_STATUS.INTERNAL);
    }
    publicKey = fs.readFileSync(keyPath, 'utf-8');
  }
  return publicKey;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      throw new AppError('Token has been revoked', HTTP_STATUS.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'],
    }) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        email: true,
        role: true,
        stationId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new AppError('User not found or inactive', HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', HTTP_STATUS.UNAUTHORIZED));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }
    await authenticate(req, _res, next);
  } catch {
    next();
  }
};
