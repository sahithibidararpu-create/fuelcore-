import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';

import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { CONSTANTS } from './config/constants';

// Route imports
import authRouter from './modules/auth/auth.router';
import dashboardRouter from './modules/dashboard/dashboard.router';
import salesRouter from './modules/sales/sales.router';
import pumpsRouter from './modules/pumps/pumps.router';
import inventoryRouter from './modules/inventory/inventory.router';
import employeesRouter from './modules/employees/employees.router';
import fleetRouter from './modules/fleet/fleet.router';
import expensesRouter from './modules/expenses/expenses.router';
import reportsRouter from './modules/reports/reports.router';
import analyticsRouter from './modules/analytics/analytics.router';
import notificationsRouter from './modules/notifications/notifications.router';
import settingsRouter from './modules/settings/settings.router';

// Cron jobs
import './utils/cronJobs';

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
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
  })
);

const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(CONSTANTS.API_PREFIX, apiLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FuelCore API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

app.get(`${CONSTANTS.API_PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const prefix = CONSTANTS.API_PREFIX;
app.use(`${prefix}/auth`, authRouter);
app.use(`${prefix}/dashboard`, dashboardRouter);
app.use(`${prefix}/sales`, salesRouter);
app.use(`${prefix}/pumps`, pumpsRouter);
app.use(`${prefix}/inventory`, inventoryRouter);
app.use(`${prefix}/employees`, employeesRouter);
app.use(`${prefix}/fleet`, fleetRouter);
app.use(`${prefix}/expenses`, expensesRouter);
app.use(`${prefix}/reports`, reportsRouter);
app.use(`${prefix}/analytics`, analyticsRouter);
app.use(`${prefix}/notifications`, notificationsRouter);
app.use(`${prefix}/settings`, settingsRouter);

// ─── Frontend Static Files (SPA) ─────────────────────────────────────────────
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { maxAge: '1d' }));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith(CONSTANTS.API_PREFIX) || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  logger.info(`📦 Serving frontend from ${frontendDist}`);
}

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    logger.info('✅ PostgreSQL connected');

    // Redis is optional — server works without it (in-memory fallback)
    await connectRedis();

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 FuelCore API running on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received – shutting down gracefully`);
      server.close(async () => {
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Server shut down');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
}

bootstrap();

export default app;
