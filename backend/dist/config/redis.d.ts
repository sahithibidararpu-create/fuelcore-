import Redis from 'ioredis';
export declare function isRedisAvailable(): boolean;
export declare function getRedis(): Redis;
export declare function connectRedis(): Promise<void>;
export declare function disconnectRedis(): Promise<void>;
export declare function setCache(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
export declare function getCache<T>(key: string): Promise<T | null>;
export declare function delCache(key: string): Promise<void>;
export declare function blacklistToken(token: string, ttlSeconds: number): Promise<void>;
export declare function isTokenBlacklisted(token: string): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map