import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

// In-memory fallback cache (used when Redis is unavailable)
const memCache = new Map<string, { value: string; expiresAt: number }>();
const memBlacklist = new Set<string>();

function cleanMemCache() {
  const now = Date.now();
  memCache.forEach((v, k) => { if (v.expiresAt < now) memCache.delete(k); });
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 2) return null; // Stop retrying after 2 attempts
        return Math.min(times * 100, 500);
      },
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      logger.info('✅ Redis connected');
    });
    redisClient.on('error', () => {
      redisAvailable = false;
    });
    redisClient.on('close', () => {
      redisAvailable = false;
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedis();
    await client.connect();
    await client.ping();
    redisAvailable = true;
    logger.info('✅ Redis connected');
  } catch {
    redisAvailable = false;
    logger.warn('⚠️  Redis unavailable — using in-memory fallback (not for production)');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try { await redisClient.quit(); } catch { /* ignore */ }
    redisClient = null;
  }
  redisAvailable = false;
}

// ─── Redis Helpers (with in-memory fallback) ──────────────────────────────────

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const serialized = JSON.stringify(value);
  if (redisAvailable && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, serialized);
      return;
    } catch { /* fall through */ }
  }
  cleanMemCache();
  memCache.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (redisAvailable && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch { /* fall through */ }
  }
  cleanMemCache();
  const entry = memCache.get(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return JSON.parse(entry.value) as T;
}

export async function delCache(key: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try { await redisClient.del(key); return; } catch { /* fall through */ }
  }
  memCache.delete(key);
}

export async function blacklistToken(token: string, ttlSeconds: number): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.setex(`blacklist:${token}`, ttlSeconds, '1');
      return;
    } catch { /* fall through */ }
  }
  memBlacklist.add(token);
  // Auto-remove after TTL
  setTimeout(() => memBlacklist.delete(token), ttlSeconds * 1000);
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (redisAvailable && redisClient) {
    try {
      const result = await redisClient.get(`blacklist:${token}`);
      return result === '1';
    } catch { /* fall through */ }
  }
  return memBlacklist.has(token);
}
