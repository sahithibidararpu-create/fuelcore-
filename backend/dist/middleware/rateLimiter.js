"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const env_1 = require("../config/env");
const constants_1 = require("../config/constants");
// Lazy-load Redis store — only created if Redis is actually available
function createRedisStore(prefix) {
    try {
        // Dynamic require to avoid circular deps and crash if Redis unavailable
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const redis = require('../config/redis');
        if (!redis.isRedisAvailable())
            return undefined;
        const client = redis.getRedis();
        return new rate_limit_redis_1.RedisStore({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sendCommand: (command, ...args) => client.call(command, ...args),
            prefix,
        });
    }
    catch {
        return undefined; // Fallback to memory store
    }
}
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('rl:api:'),
    message: {
        success: false,
        message: 'Too many requests, please try again later',
    },
    statusCode: constants_1.HTTP_STATUS.TOO_MANY_REQUESTS,
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env_1.env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('rl:auth:'),
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again in 15 minutes',
    },
    statusCode: constants_1.HTTP_STATUS.TOO_MANY_REQUESTS,
    skipSuccessfulRequests: true,
});
exports.exportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many export requests',
    },
    statusCode: constants_1.HTTP_STATUS.TOO_MANY_REQUESTS,
});
//# sourceMappingURL=rateLimiter.js.map