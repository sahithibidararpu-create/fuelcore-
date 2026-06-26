import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../config/constants';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  stationId: string | null;
}

let privateKey: string;
let publicKey: string;

function getKeys(): { privateKey: string; publicKey: string } {
  if (!privateKey) {
    const privPath = path.resolve(env.JWT_PRIVATE_KEY_PATH);
    const pubPath = path.resolve(env.JWT_PUBLIC_KEY_PATH);

    if (!fs.existsSync(privPath) || !fs.existsSync(pubPath)) {
      throw new AppError(
        'JWT keys not found. Run: npm run keys:generate',
        HTTP_STATUS.INTERNAL
      );
    }

    privateKey = fs.readFileSync(privPath, 'utf-8');
    publicKey = fs.readFileSync(pubPath, 'utf-8');
  }
  return { privateKey, publicKey };
}

export function signAccessToken(payload: TokenPayload): string {
  const { privateKey } = getKeys();
  return jwt.sign(payload as object, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    jwtid: uuidv4(),
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  const { privateKey } = getKeys();
  return jwt.sign(payload as object, privateKey, {
    algorithm: 'RS256',
    expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
    jwtid: uuidv4(),
  });
}

export function verifyToken(token: string): jwt.JwtPayload & TokenPayload {
  const { publicKey } = getKeys();
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
  }) as jwt.JwtPayload & TokenPayload;
}

export function decodeToken(token: string): (jwt.JwtPayload & TokenPayload) | null {
  try {
    return jwt.decode(token) as jwt.JwtPayload & TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiry(expiresIn: string): Date {
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid token expiry: ${expiresIn}`);
  const [, amount, unit] = match;
  return new Date(Date.now() + parseInt(amount) * (units[unit] ?? 1) * 1000);
}
