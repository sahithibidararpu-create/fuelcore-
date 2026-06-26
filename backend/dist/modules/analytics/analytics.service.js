"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const database_1 = require("../../config/database");
const dateHelpers_1 = require("../../utils/dateHelpers");
const date_fns_1 = require("date-fns");
// Helper to convert a Date or string to yyyy-MM-dd
function toDateStr(val) {
    if (val instanceof Date)
        return (0, date_fns_1.format)(val, 'yyyy-MM-dd');
    return (0, date_fns_1.format)(new Date(val), 'yyyy-MM-dd');
}
class AnalyticsService {
    async getRevenueTrends(stationId, days = 30) {
        const { from, to } = (0, dateHelpers_1.getLastNDaysRange)(days);
        let rows;
        if (stationId) {
            rows = await database_1.prisma.$queryRaw `
        SELECT 
          DATE("createdAt") as date,
          SUM("totalAmount")::float as revenue,
          SUM("volumeLiters")::float as volume,
          COUNT(id) as transactions,
          AVG("pricePerLiter")::float as avg_price
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
            rows = await database_1.prisma.$queryRaw `
        SELECT 
          DATE("createdAt") as date,
          SUM("totalAmount")::float as revenue,
          SUM("volumeLiters")::float as volume,
          COUNT(id) as transactions,
          AVG("pricePerLiter")::float as avg_price
        FROM sales
        WHERE "isVoided" = false
          AND "createdAt" >= ${from}
          AND "createdAt" <= ${to}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
        }
        const map = {};
        rows.forEach((r) => {
            const key = toDateStr(r.date);
            map[key] = {
                date: key,
                revenue: Number(r.revenue),
                volume: Number(r.volume),
                transactions: Number(r.transactions),
                avgPrice: Number(r.avg_price),
            };
        });
        const allDays = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
        return allDays.map((d) => {
            const key = (0, date_fns_1.format)(d, 'yyyy-MM-dd');
            return map[key] || { date: key, revenue: 0, volume: 0, transactions: 0, avgPrice: 0 };
        });
    }
    async getFuelMix(stationId, days = 30) {
        const { from, to } = (0, dateHelpers_1.getLastNDaysRange)(days);
        const result = await database_1.prisma.sale.groupBy({
            by: ['tankId'],
            where: {
                isVoided: false,
                createdAt: { gte: from, lte: to },
                ...(stationId && { stationId }),
            },
            _sum: { volumeLiters: true, totalAmount: true },
            _count: { id: true },
        });
        const tanks = await database_1.prisma.fuelTank.findMany({
            where: { id: { in: result.map((r) => r.tankId) } },
            select: { id: true, fuelType: true, name: true },
        });
        const tankMap = Object.fromEntries(tanks.map((t) => [t.id, t]));
        const byFuelType = {};
        result.forEach((r) => {
            const tank = tankMap[r.tankId];
            if (!tank)
                return;
            const key = tank.fuelType;
            if (!byFuelType[key])
                byFuelType[key] = { volume: 0, revenue: 0, transactions: 0 };
            byFuelType[key].volume += r._sum.volumeLiters ?? 0;
            byFuelType[key].revenue += r._sum.totalAmount ?? 0;
            byFuelType[key].transactions += r._count.id;
        });
        return Object.entries(byFuelType).map(([fuelType, data]) => ({
            fuelType,
            ...data,
        }));
    }
    async getDemandForecast(stationId) {
        const { from, to } = (0, dateHelpers_1.getLastNDaysRange)(60);
        let rows;
        if (stationId) {
            rows = await database_1.prisma.$queryRaw `
        SELECT DATE("createdAt") as date, SUM("volumeLiters")::float as volume
        FROM sales
        WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND "stationId" = ${stationId}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
        }
        else {
            rows = await database_1.prisma.$queryRaw `
        SELECT DATE("createdAt") as date, SUM("volumeLiters")::float as volume
        FROM sales
        WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
        }
        const map = {};
        rows.forEach((r) => { map[toDateStr(r.date)] = Number(r.volume); });
        const allDays = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
        const volumes = allDays.map((d) => {
            const key = (0, date_fns_1.format)(d, 'yyyy-MM-dd');
            return { date: key, volume: map[key] ?? 0 };
        });
        // 7-day moving average
        const withMA = volumes.map((v, i) => {
            const window = volumes.slice(Math.max(0, i - 6), i + 1);
            const avg = window.reduce((s, w) => s + w.volume, 0) / window.length;
            return { ...v, movingAvg: Math.round(avg * 100) / 100 };
        });
        // Forecast next 7 days
        const lastWeek = withMA.slice(-7);
        const avgVolume = lastWeek.reduce((s, v) => s + v.volume, 0) / 7;
        const forecast = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            return {
                date: (0, date_fns_1.format)(date, 'yyyy-MM-dd'),
                volume: 0,
                movingAvg: Math.round(avgVolume * (0.95 + Math.random() * 0.1) * 100) / 100,
                isForecast: true,
            };
        });
        return [...withMA.slice(-30), ...forecast];
    }
    async getPeakHours(stationId) {
        const { from, to } = (0, dateHelpers_1.getLastNDaysRange)(30);
        let rows;
        if (stationId) {
            rows = await database_1.prisma.$queryRaw `
        SELECT 
          EXTRACT(HOUR FROM "createdAt")::int as hour,
          EXTRACT(DOW FROM "createdAt")::int as day_of_week,
          COUNT(id) as transactions,
          SUM("totalAmount")::float as revenue
        FROM sales
        WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND "stationId" = ${stationId}
        GROUP BY EXTRACT(HOUR FROM "createdAt"), EXTRACT(DOW FROM "createdAt")
        ORDER BY day_of_week, hour
      `;
        }
        else {
            rows = await database_1.prisma.$queryRaw `
        SELECT 
          EXTRACT(HOUR FROM "createdAt")::int as hour,
          EXTRACT(DOW FROM "createdAt")::int as day_of_week,
          COUNT(id) as transactions,
          SUM("totalAmount")::float as revenue
        FROM sales
        WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY EXTRACT(HOUR FROM "createdAt"), EXTRACT(DOW FROM "createdAt")
        ORDER BY day_of_week, hour
      `;
        }
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days.map((day, dayIdx) => ({
            day,
            hours: Array.from({ length: 24 }, (_, hour) => {
                const row = rows.find((r) => Number(r.hour) === hour && Number(r.day_of_week) === dayIdx);
                return {
                    hour,
                    transactions: Number(row?.transactions ?? 0),
                    revenue: Number(row?.revenue ?? 0),
                };
            }),
        }));
    }
    async getRecommendations(stationId) {
        const recommendations = [];
        const { from, to } = (0, dateHelpers_1.getLastNDaysRange)(7);
        const [lowTanks, maintenancePumps, nearLimitFleet, salesData] = await Promise.all([
            database_1.prisma.fuelTank.findMany({
                where: { isActive: true, ...(stationId && { stationId }) },
            }),
            database_1.prisma.pump.count({
                where: { ...(stationId && { stationId }), status: 'MAINTENANCE' },
            }),
            database_1.prisma.fleetAccount.findMany({
                where: { isActive: true, ...(stationId && { stationId }) },
            }),
            database_1.prisma.sale.aggregate({
                where: {
                    ...(stationId && { stationId }),
                    isVoided: false,
                    createdAt: { gte: from, lte: to },
                },
                _sum: { totalAmount: true },
            }),
        ]);
        lowTanks.forEach((t) => {
            const pct = (t.currentLiters / t.capacityLiters) * 100;
            if (pct < 20) {
                recommendations.push({
                    type: 'INVENTORY',
                    title: `Refill ${t.name}`,
                    description: `${t.name} is at ${pct.toFixed(0)}% capacity (${t.currentLiters.toFixed(0)}L). Schedule a delivery soon.`,
                    priority: pct < 10 ? 'CRITICAL' : 'HIGH',
                });
            }
        });
        if (maintenancePumps > 0) {
            recommendations.push({
                type: 'MAINTENANCE',
                title: `${maintenancePumps} pump(s) need attention`,
                description: `You have ${maintenancePumps} pump(s) in maintenance mode. Review and restore service.`,
                priority: 'MEDIUM',
            });
        }
        nearLimitFleet.forEach((f) => {
            const pct = (f.currentBalance / f.creditLimit) * 100;
            if (pct >= 85) {
                recommendations.push({
                    type: 'FLEET',
                    title: `${f.companyName} credit limit warning`,
                    description: `Account is at ${pct.toFixed(0)}% of credit limit. Contact customer for payment.`,
                    priority: pct >= 95 ? 'HIGH' : 'MEDIUM',
                });
            }
        });
        if (!salesData._sum.totalAmount || salesData._sum.totalAmount < 1000) {
            recommendations.push({
                type: 'SALES',
                title: 'Low sales this week',
                description: 'Sales this week are lower than expected. Consider promotions or pricing review.',
                priority: 'LOW',
            });
        }
        return recommendations;
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.service.js.map