"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisAvailable = isRedisAvailable;
exports.getRedis = getRedis;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
exports.setCache = setCache;
exports.getCache = getCache;
exports.delCache = delCache;
exports.blacklistToken = blacklistToken;
exports.isTokenBlacklisted = isTokenBlacklisted;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const logger_1 = require("./logger");
let redisClient = null;
let redisAvailable = false;
// In-memory fallback cache (used when Redis is unavailable)
const memCache = new Map();
const memBlacklist = new Set();
function cleanMemCache() {
    const now = Date.now();
    memCache.forEach((v, k) => { if (v.expiresAt < now)
        memCache.delete(k); });
}
function isRedisAvailable() {
    return redisAvailable;
}
function getRedis() {
    if (!redisClient) {
        redisClient = new ioredis_1.default(env_1.env.REDIS_URL, {
            password: env_1.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            lazyConnect: true,
            connectTimeout: 3000,
            retryStrategy(times) {
                if (times > 2)
                    return null; // Stop retrying after 2 attempts
                return Math.min(times * 100, 500);
            },
        });
        redisClient.on('connect', () => {
            redisAvailable = true;
            logger_1.logger.info('✅ Redis connected');
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
async function connectRedis() {
    try {
        const client = getRedis();
        await client.connect();
        await client.ping();
        redisAvailable = true;
        logger_1.logger.info('✅ Redis connected');
    }
    catch {
        redisAvailable = false;
        logger_1.logger.warn('⚠️  Redis unavailable — using in-memory fallback (not for production)');
    }
}
async function disconnectRedis() {
    if (redisClient) {
        try {
            await redisClient.quit();
        }
        catch { /* ignore */ }
        redisClient = null;
    }
    redisAvailable = false;
}
// ─── Redis Helpers (with in-memory fallback) ──────────────────────────────────
async function setCache(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);
    if (redisAvailable && redisClient) {
        try {
            await redisClient.setex(key, ttlSeconds, serialized);
            return;
        }
        catch { /* fall through */ }
    }
    cleanMemCache();
    memCache.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
}
async function getCache(key) {
    if (redisAvailable && redisClient) {
        try {
            const data = await redisClient.get(key);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch { /* fall through */ }
    }
    cleanMemCache();
    const entry = memCache.get(key);
    if (!entry || entry.expiresAt < Date.now())
        return null;
    return JSON.parse(entry.value);
}
async function delCache(key) {
    if (redisAvailable && redisClient) {
        try {
            await redisClient.del(key);
            return;
        }
        catch { /* fall through */ }
    }
    memCache.delete(key);
}
async function blacklistToken(token, ttlSeconds) {
    if (redisAvailable && redisClient) {
        try {
            await redisClient.setex(`blacklist:${token}`, ttlSeconds, '1');
            return;
        }
        catch { /* fall through */ }
    }
    memBlacklist.add(token);
    // Auto-remove after TTL
    setTimeout(() => memBlacklist.delete(token), ttlSeconds * 1000);
}
async function isTokenBlacklisted(token) {
    if (redisAvailable && redisClient) {
        try {
            const result = await redisClient.get(`blacklist:${token}`);
            return result === '1';
        }
        catch { /* fall through */ }
    }
    return memBlacklist.has(token);
}
//# sourceMappingURL=redis.js.map