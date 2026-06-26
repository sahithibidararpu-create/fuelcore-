import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env';
import { HTTP_STATUS } from '../config/constants';

// Lazy-load Redis store — only created if Redis is actually available
function createRedisStore(prefix: string) {
  try {
    // Dynamic require to avoid circular deps and crash if Redis unavailable
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redis = require('../config/redis');
    if (!redis.isRedisAvailable()) return undefined;
    const client = redis.getRedis();
    return new RedisStore({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sendCommand: (command: string, ...args: string[]) => client.call(command, ...args) as any,
      prefix,
    });
  } catch {
    return undefined; // Fallback to memory store
  }
}

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:api:'),
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:auth:'),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true,
});

export const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many export requests',
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});
