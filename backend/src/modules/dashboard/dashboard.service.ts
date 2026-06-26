import { prisma } from '../../config/database';
import { getLastNDaysRange } from '../../utils/dateHelpers';
import { subDays, format, eachDayOfInterval } from 'date-fns';

function toDateStr(val: Date | string): string {
  if (val instanceof Date) return format(val, 'yyyy-MM-dd');
  return format(new Date(val), 'yyyy-MM-dd');
}

export class DashboardService {
  async getStats(stationId?: string | null) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const yesterdayStart = subDays(todayStart, 1);
    const yesterdayEnd = subDays(todayEnd, 1);

    const stationFilter = stationId ? { stationId } : {};

    const [todaySales, yesterdaySales, activePumps, totalPumps, totalTanks] =
      await Promise.all([
        prisma.sale.aggregate({
          where: { ...stationFilter, isVoided: false, createdAt: { gte: todayStart, lte: todayEnd } },
          _sum: { totalAmount: true, volumeLiters: true },
          _count: { id: true },
        }),
        prisma.sale.aggregate({
          where: { ...stationFilter, isVoided: false, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
          _sum: { totalAmount: true },
          _count: { id: true },
        }),
        prisma.pump.count({ where: { ...stationFilter, status: 'ACTIVE', isActive: true } }),
        prisma.pump.count({ where: { ...stationFilter, isActive: true } }),
        prisma.fuelTank.count({ where: { ...(stationId ? { stationId } : {}), isActive: true } }),
      ]);

    // Count low stock tanks using Prisma ORM (avoids raw SQL column name issues)
    const lowStockTanksCount = await prisma.fuelTank.count({
      where: {
        ...(stationId ? { stationId } : {}),
        isActive: true,
      },
    });

    // Use raw only for the threshold comparison
    let lowStockResult: [{ count: bigint }];
    if (stationId) {
      lowStockResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "fuel_tanks" 
        WHERE "isActive" = true 
        AND "currentLiters" <= "minThreshold"
        AND "stationId" = ${stationId}
      `;
    } else {
      lowStockResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "fuel_tanks" 
        WHERE "isActive" = true 
        AND "currentLiters" <= "minThreshold"
      `;
    }

    const todayRevenue = todaySales._sum.totalAmount ?? 0;
    const yesterdayRevenue = yesterdaySales._sum.totalAmount ?? 0;
    const revenueChange = yesterdayRevenue
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

    return {
      todayRevenue,
      todayVolume: todaySales._sum.volumeLiters ?? 0,
      todayTransactions: todaySales._count.id,
      revenueChange: Math.round(revenueChange * 10) / 10,
      activePumps,
      totalPumps,
      lowStockTanks: Number(lowStockResult[0]?.count ?? 0),
      totalTanks,
    };
  }

  async getCharts(stationId?: string | null, days = 30) {
    const { from, to } = getLastNDaysRange(days);

    // Build daily map
    const dailyMap: Record<string, { revenue: number; volume: number; transactions: number }> = {};
    const interval = eachDayOfInterval({ start: from, end: to });
    interval.forEach((day) => {
      dailyMap[format(day, 'yyyy-MM-dd')] = { revenue: 0, volume: 0, transactions: 0 };
    });

    let rawSales: Array<{ date: Date | string; revenue: number; volume: number; transactions: bigint }>;
    if (stationId) {
      rawSales = await prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          SUM("totalAmount")::float as revenue,
          SUM("volumeLiters")::float as volume,
          COUNT(id) as transactions
        FROM sales
        WHERE "isVoided" = false
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
          AND "stationId" = ${stationId}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
    } else {
      rawSales = await prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          SUM("totalAmount")::float as revenue,
          SUM("volumeLiters")::float as volume,
          COUNT(id) as transactions
        FROM sales
        WHERE "isVoided" = false
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
    }

    rawSales.forEach((row) => {
      const key = toDateStr(row.date);
      if (dailyMap[key] !== undefined) {
        dailyMap[key] = {
          revenue: Number(row.revenue ?? 0),
          volume: Number(row.volume ?? 0),
          transactions: Number(row.transactions ?? 0),
        };
      }
    });

    return Object.entries(dailyMap).map(([date, values]) => ({ date, ...values }));
  }

  async getRecentSales(stationId?: string | null, limit = 10) {
    return prisma.sale.findMany({
      where: { ...(stationId ? { stationId } : {}), isVoided: false },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        pump: { select: { pumpNumber: true, label: true } },
        tank: { select: { fuelType: true } },
        employee: { select: { firstName: true, lastName: true } },
        station: { select: { name: true } },
      },
    });
  }

  async getAlerts(stationId?: string | null) {
    const stationFilter = stationId ? { stationId } : {};

    // Use Prisma ORM instead of raw SQL for alerts — avoids column name issues
    const [allTanks, maintenancePumps, allFleets] = await Promise.all([
      prisma.fuelTank.findMany({
        where: { ...stationFilter, isActive: true },
        include: { station: { select: { name: true } } },
        take: 20,
      }),
      prisma.pump.findMany({
        where: { ...stationFilter, status: 'MAINTENANCE' },
        select: { id: true, pumpNumber: true, label: true, station: { select: { name: true } } },
        take: 5,
      }),
      prisma.fleetAccount.findMany({
        where: { ...stationFilter, isActive: true },
        take: 20,
      }),
    ]);

    const lowStockTanks = allTanks
      .filter((t) => t.currentLiters <= t.minThreshold)
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        name: t.name,
        fuelType: t.fuelType,
        currentLiters: t.currentLiters,
        minThreshold: t.minThreshold,
        stationName: t.station.name,
        severity: t.currentLiters <= t.minThreshold / 2 ? 'CRITICAL' : 'WARNING',
      }));

    const lowCreditFleets = allFleets
      .filter((f) => f.currentBalance / f.creditLimit >= 0.9)
      .slice(0, 5)
      .map((f) => ({
        id: f.id,
        companyName: f.companyName,
        usedPercent: Math.round((f.currentBalance / f.creditLimit) * 100),
        available: f.creditLimit - f.currentBalance,
      }));

    return {
      lowStockTanks,
      maintenancePumps,
      lowCreditFleets,
    };
  }
}

export const dashboardService = new DashboardService();
