"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const database_1 = require("../../config/database");
const dateHelpers_1 = require("../../utils/dateHelpers");
const date_fns_1 = require("date-fns");
function toDateStr(val) {
    if (val instanceof Date)
        return (0, date_fns_1.format)(val, 'yyyy-MM-dd');
    return (0, date_fns_1.format)(new Date(val), 'yyyy-MM-dd');
}
class DashboardService {
    async getStats(stationId) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        const yesterdayStart = (0, date_fns_1.subDays)(todayStart, 1);
        const yesterdayEnd = (0, date_fns_1.subDays)(todayEnd, 1);
        const stationFilter = stationId ? { stationId } : {};
        const [todaySales, yesterdaySales, activePumps, totalPumps, totalTanks] = await Promise.all([
            database_1.prisma.sale.aggregate({
                where: { ...stationFilter, isVoided: false, createdAt: { gte: todayStart, lte: todayEnd } },
                _sum: { totalAmount: true, volumeLiters: true },
                _count: { id: true },
            }),
            database_1.prisma.sale.aggregate({
                where: { ...stationFilter, isVoided: false, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
                _sum: { totalAmount: true },
                _count: { id: true },
            }),
            database_1.prisma.pump.count({ where: { ...stationFilter, status: 'ACTIVE', isActive: true } }),
            database_1.prisma.pump.count({ where: { ...stationFilter, isActive: true } }),
            database_1.prisma.fuelTank.count({ where: { ...(stationId ? { stationId } : {}), isActive: true } }),
        ]);
        // Count low stock tanks using Prisma ORM (avoids raw SQL column name issues)
        const lowStockTanksCount = await database_1.prisma.fuelTank.count({
            where: {
                ...(stationId ? { stationId } : {}),
                isActive: true,
            },
        });
        // Use raw only for the threshold comparison
        let lowStockResult;
        if (stationId) {
            lowStockResult = await database_1.prisma.$queryRaw `
        SELECT COUNT(*) as count FROM "fuel_tanks" 
        WHERE "isActive" = true 
        AND "currentLiters" <= "minThreshold"
        AND "stationId" = ${stationId}
      `;
        }
        else {
            lowStockResult = await database_1.prisma.$queryRaw `
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
    async getCharts(stationId, days = 30) {
        const { from, to } = (0, dateHelpers_1.getLastNDaysRange)(days);
        // Build daily map
        const dailyMap = {};
        const interval = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
        interval.forEach((day) => {
            dailyMap[(0, date_fns_1.format)(day, 'yyyy-MM-dd')] = { revenue: 0, volume: 0, transactions: 0 };
        });
        let rawSales;
        if (stationId) {
            rawSales = await database_1.prisma.$queryRaw `
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
        }
        else {
            rawSales = await database_1.prisma.$queryRaw `
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
    async getRecentSales(stationId, limit = 10) {
        return database_1.prisma.sale.findMany({
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
    async getAlerts(stationId) {
        const stationFilter = stationId ? { stationId } : {};
        // Use Prisma ORM instead of raw SQL for alerts — avoids column name issues
        const [allTanks, maintenancePumps, allFleets] = await Promise.all([
            database_1.prisma.fuelTank.findMany({
                where: { ...stationFilter, isActive: true },
                include: { station: { select: { name: true } } },
                take: 20,
            }),
            database_1.prisma.pump.findMany({
                where: { ...stationFilter, status: 'MAINTENANCE' },
                select: { id: true, pumpNumber: true, label: true, station: { select: { name: true } } },
                take: 5,
            }),
            database_1.prisma.fleetAccount.findMany({
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
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
//# sourceMappingURL=dashboard.service.js.map