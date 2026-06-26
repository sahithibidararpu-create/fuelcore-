"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const constants_1 = require("./config/constants");
// Route imports
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const dashboard_router_1 = __importDefault(require("./modules/dashboard/dashboard.router"));
const sales_router_1 = __importDefault(require("./modules/sales/sales.router"));
const pumps_router_1 = __importDefault(require("./modules/pumps/pumps.router"));
const inventory_router_1 = __importDefault(require("./modules/inventory/inventory.router"));
const employees_router_1 = __importDefault(require("./modules/employees/employees.router"));
const fleet_router_1 = __importDefault(require("./modules/fleet/fleet.router"));
const expenses_router_1 = __importDefault(require("./modules/expenses/expenses.router"));
const reports_router_1 = __importDefault(require("./modules/reports/reports.router"));
const analytics_router_1 = __importDefault(require("./modules/analytics/analytics.router"));
const notifications_router_1 = __importDefault(require("./modules/notifications/notifications.router"));
const settings_router_1 = __importDefault(require("./modules/settings/settings.router"));
// Cron jobs
require("./utils/cronJobs");
const app = (0, express_1.default)();
// ─── Security Middleware ──────────────────────────────────────────────────────
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            connectSrc: ["'self'"],
            workerSrc: ["'self'", 'blob:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
const corsOrigins = env_1.env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS policy: origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ─── General Middleware ───────────────────────────────────────────────────────
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static uploads
app.use('/uploads', express_1.default.static(path_1.default.resolve(env_1.env.UPLOAD_DIR)));
// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(constants_1.CONSTANTS.API_PREFIX, rateLimiter_1.apiLimiter);
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'FuelCore API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        env: env_1.env.NODE_ENV,
    });
});
app.get(`${constants_1.CONSTANTS.API_PREFIX}/health`, (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── Routes ───────────────────────────────────────────────────────────────────
const prefix = constants_1.CONSTANTS.API_PREFIX;
app.use(`${prefix}/auth`, auth_router_1.default);
app.use(`${prefix}/dashboard`, dashboard_router_1.default);
app.use(`${prefix}/sales`, sales_router_1.default);
app.use(`${prefix}/pumps`, pumps_router_1.default);
app.use(`${prefix}/inventory`, inventory_router_1.default);
app.use(`${prefix}/employees`, employees_router_1.default);
app.use(`${prefix}/fleet`, fleet_router_1.default);
app.use(`${prefix}/expenses`, expenses_router_1.default);
app.use(`${prefix}/reports`, reports_router_1.default);
app.use(`${prefix}/analytics`, analytics_router_1.default);
app.use(`${prefix}/notifications`, notifications_router_1.default);
app.use(`${prefix}/settings`, settings_router_1.default);
// ─── Frontend Static Files (SPA) ─────────────────────────────────────────────
const frontendDist = path_1.default.resolve(__dirname, '../../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
    app.use(express_1.default.static(frontendDist, { maxAge: '1d' }));
    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith(constants_1.CONSTANTS.API_PREFIX) || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
            return next();
        }
        res.sendFile(path_1.default.join(frontendDist, 'index.html'));
    });
    logger_1.logger.info(`📦 Serving frontend from ${frontendDist}`);
}
// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
    try {
        await (0, database_1.connectDatabase)();
        logger_1.logger.info('✅ PostgreSQL connected');
        // Redis is optional — server works without it (in-memory fallback)
        await (0, redis_1.connectRedis)();
        const server = app.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`🚀 FuelCore API running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
        });
        // Graceful shutdown
        const shutdown = async (signal) => {
            logger_1.logger.info(`${signal} received – shutting down gracefully`);
            server.close(async () => {
                await (0, database_1.disconnectDatabase)();
                await (0, redis_1.disconnectRedis)();
                logger_1.logger.info('Server shut down');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (err) {
        logger_1.logger.error('Failed to start server', { err });
        process.exit(1);
    }
}
bootstrap();
exports.default = app;
//# sourceMappingURL=server.js.map