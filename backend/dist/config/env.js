"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3000').transform(Number),
    API_BASE_URL: zod_1.z.string().url().default('http://localhost:3000/api/v1'),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:5173'),
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:5173'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    JWT_PRIVATE_KEY_PATH: zod_1.z.string().default('./keys/private.pem'),
    JWT_PUBLIC_KEY_PATH: zod_1.z.string().default('./keys/public.pem'),
    JWT_ACCESS_EXPIRES: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES: zod_1.z.string().default('7d'),
    BCRYPT_ROUNDS: zod_1.z.string().default('12').transform(Number),
    SMTP_HOST: zod_1.z.string().default('smtp.gmail.com'),
    SMTP_PORT: zod_1.z.string().default('587').transform(Number),
    SMTP_SECURE: zod_1.z.string().default('false').transform((v) => v === 'true'),
    SMTP_USER: zod_1.z.string().default(''),
    SMTP_PASS: zod_1.z.string().default(''),
    EMAIL_FROM: zod_1.z.string().default('FuelCore <no-reply@fuelcore.io>'),
    UPLOAD_MAX_SIZE_MB: zod_1.z.string().default('10').transform(Number),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000').transform(Number),
    RATE_LIMIT_MAX: zod_1.z.string().default('100').transform(Number),
    AUTH_RATE_LIMIT_MAX: zod_1.z.string().default('5').transform(Number),
    LOG_LEVEL: zod_1.z.string().default('info'),
    LOG_DIR: zod_1.z.string().default('./logs'),
    CURRENCY_SYMBOL: zod_1.z.string().default('$'),
    CURRENCY_LOCALE: zod_1.z.string().default('en-US'),
    SEED_ADMIN_EMAIL: zod_1.z.string().email().default('admin@fuelcore.io'),
    SEED_ADMIN_PASSWORD: zod_1.z.string().default('Admin@1234'),
});
const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parseResult.error.format());
    process.exit(1);
}
exports.env = parseResult.data;
//# sourceMappingURL=env.js.map