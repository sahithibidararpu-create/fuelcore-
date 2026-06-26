import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { notificationService } from '../modules/notifications/notifications.service';
import { formatCurrency } from './dateHelpers';

// ─── Clean up expired refresh tokens (daily at 2am) ──────────────────────────
cron.schedule('0 2 * * *', async () => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isBlacklisted: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    logger.info(`Cron: Cleaned ${result.count} expired refresh tokens`);
  } catch (err) {
    logger.error('Cron: Failed to clean refresh tokens', { err });
  }
});

// ─── Low stock check (every 2 hours) ─────────────────────────────────────────
cron.schedule('0 */2 * * *', async () => {
  try {
    const lowStockTanks = await prisma.$queryRaw<
      Array<{ id: string; name: string; currentLiters: number; minThreshold: number; stationId: string; fuelType: string }>
    >`
      SELECT id, name, "currentLiters", "minThreshold", "stationId", "fuelType"
      FROM fuel_tanks
      WHERE "isActive" = true AND "currentLiters" <= "minThreshold"
    `;

    for (const tank of lowStockTanks) {
      await notificationService.createSystemNotification(
        tank.stationId,
        '⚠️ Low Fuel Stock',
        `${tank.name} (${tank.fuelType}) is at ${tank.currentLiters.toFixed(0)}L — below minimum threshold of ${tank.minThreshold}L`,
        'LOW_STOCK',
        tank.currentLiters <= tank.minThreshold / 2 ? 'CRITICAL' : 'HIGH'
      );
    }

    if (lowStockTanks.length > 0) {
      logger.info(`Cron: Low stock alert sent for ${lowStockTanks.length} tanks`);
    }
  } catch (err) {
    logger.error('Cron: Low stock check failed', { err });
  }
});

// ─── Fleet overdue balance check (daily at 9am) ───────────────────────────────
cron.schedule('0 9 * * *', async () => {
  try {
    const nearLimitAccounts = await prisma.fleetAccount.findMany({
      where: { isActive: true },
    });

    for (const account of nearLimitAccounts) {
      const pct = (account.currentBalance / account.creditLimit) * 100;
      if (pct >= 90) {
        await notificationService.createSystemNotification(
          account.stationId,
          '💳 Fleet Credit Warning',
          `${account.companyName} is at ${pct.toFixed(0)}% of credit limit (${formatCurrency(account.currentBalance)} / ${formatCurrency(account.creditLimit)})`,
          'FLEET_CREDIT_LOW',
          pct >= 98 ? 'CRITICAL' : 'HIGH'
        );
      }
    }
  } catch (err) {
    logger.error('Cron: Fleet balance check failed', { err });
  }
});

// ─── Clean old notifications (weekly on Sunday at 3am) ───────────────────────
cron.schedule('0 3 * * 0', async () => {
  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
    const result = await prisma.notification.deleteMany({
      where: { isRead: true, createdAt: { lt: cutoff } },
    });
    logger.info(`Cron: Cleaned ${result.count} old notifications`);
  } catch (err) {
    logger.error('Cron: Notification cleanup failed', { err });
  }
});

logger.info('✅ Cron jobs initialized');
