"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const notifications_service_1 = require("../modules/notifications/notifications.service");
// ─── Clean up expired refresh tokens (daily at 2am) ──────────────────────────
node_cron_1.default.schedule('0 2 * * *', async () => {
    try {
        const result = await database_1.prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isBlacklisted: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                ],
            },
        });
        logger_1.logger.info(`Cron: Cleaned ${result.count} expired refresh tokens`);
    }
    catch (err) {
        logger_1.logger.error('Cron: Failed to clean refresh tokens', { err });
    }
});
// ─── Low stock check (every 2 hours) ─────────────────────────────────────────
node_cron_1.default.schedule('0 */2 * * *', async () => {
    try {
        const lowStockTanks = await database_1.prisma.$queryRaw `
      SELECT id, name, "currentLiters", "minThreshold", "stationId", "fuelType"
      FROM fuel_tanks
      WHERE "isActive" = true AND "currentLiters" <= "minThreshold"
    `;
        for (const tank of lowStockTanks) {
            await notifications_service_1.notificationService.createSystemNotification(tank.stationId, '⚠️ Low Fuel Stock', `${tank.name} (${tank.fuelType}) is at ${tank.currentLiters.toFixed(0)}L — below minimum threshold of ${tank.minThreshold}L`, 'LOW_STOCK', tank.currentLiters <= tank.minThreshold / 2 ? 'CRITICAL' : 'HIGH');
        }
        if (lowStockTanks.length > 0) {
            logger_1.logger.info(`Cron: Low stock alert sent for ${lowStockTanks.length} tanks`);
        }
    }
    catch (err) {
        logger_1.logger.error('Cron: Low stock check failed', { err });
    }
});
// ─── Fleet overdue balance check (daily at 9am) ───────────────────────────────
node_cron_1.default.schedule('0 9 * * *', async () => {
    try {
        const nearLimitAccounts = await database_1.prisma.fleetAccount.findMany({
            where: { isActive: true },
        });
        for (const account of nearLimitAccounts) {
            const pct = (account.currentBalance / account.creditLimit) * 100;
            if (pct >= 90) {
                await notifications_service_1.notificationService.createSystemNotification(account.stationId, '💳 Fleet Credit Warning', `${account.companyName} is at ${pct.toFixed(0)}% of credit limit ($${account.currentBalance.toFixed(2)} / $${account.creditLimit.toFixed(2)})`, 'FLEET_CREDIT_LOW', pct >= 98 ? 'CRITICAL' : 'HIGH');
            }
        }
    }
    catch (err) {
        logger_1.logger.error('Cron: Fleet balance check failed', { err });
    }
});
// ─── Clean old notifications (weekly on Sunday at 3am) ───────────────────────
node_cron_1.default.schedule('0 3 * * 0', async () => {
    try {
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
        const result = await database_1.prisma.notification.deleteMany({
            where: { isRead: true, createdAt: { lt: cutoff } },
        });
        logger_1.logger.info(`Cron: Cleaned ${result.count} old notifications`);
    }
    catch (err) {
        logger_1.logger.error('Cron: Notification cleanup failed', { err });
    }
});
logger_1.logger.info('✅ Cron jobs initialized');
//# sourceMappingURL=cronJobs.js.map