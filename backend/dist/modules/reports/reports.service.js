"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const database_1 = require("../../config/database");
const dateHelpers_1 = require("../../utils/dateHelpers");
const date_fns_1 = require("date-fns");
function toDateStr(val) {
    if (val instanceof Date)
        return (0, date_fns_1.format)(val, 'yyyy-MM-dd');
    return (0, date_fns_1.format)(new Date(val), 'yyyy-MM-dd');
}
class ReportsService {
    getSalesAggregate(filter) {
        return database_1.prisma.sale.aggregate({
            where: { ...filter, isVoided: false },
            _sum: { totalAmount: true, volumeLiters: true },
            _count: { id: true },
        });
    }
    async getDaily(stationId, date) {
        const targetDate = date ? new Date(date) : new Date();
        const from = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const to = new Date(from.getTime() + 86399999);
        const stationFilter = stationId ? { stationId } : {};
        const filter = { ...stationFilter, createdAt: { gte: from, lte: to } };
        const [sales, expenses, byFuelType, byPaymentMethod, byPump] = await Promise.all([
            this.getSalesAggregate(filter),
            database_1.prisma.expense.aggregate({
                where: { ...(stationId && { stationId }), expenseDate: { gte: from, lte: to } },
                _sum: { amount: true },
            }),
            database_1.prisma.sale.groupBy({
                by: ['tankId'],
                where: { ...filter },
                _sum: { volumeLiters: true, totalAmount: true },
                _count: { id: true },
            }),
            database_1.prisma.sale.groupBy({
                by: ['paymentMethod'],
                where: { ...filter },
                _sum: { totalAmount: true },
                _count: { id: true },
            }),
            database_1.prisma.sale.groupBy({
                by: ['pumpId'],
                where: { ...filter },
                _sum: { volumeLiters: true, totalAmount: true },
                _count: { id: true },
            }),
        ]);
        const tankIds = byFuelType.map((b) => b.tankId);
        const tanks = await database_1.prisma.fuelTank.findMany({
            where: { id: { in: tankIds } },
            select: { id: true, fuelType: true, name: true },
        });
        const tankMap = Object.fromEntries(tanks.map((t) => [t.id, t]));
        const pumpIds = byPump.map((b) => b.pumpId);
        const pumps = await database_1.prisma.pump.findMany({
            where: { id: { in: pumpIds } },
            select: { id: true, pumpNumber: true, label: true },
        });
        const pumpMap = Object.fromEntries(pumps.map((p) => [p.id, p]));
        const revenue = sales._sum.totalAmount ?? 0;
        const expenseTotal = expenses._sum.amount ?? 0;
        return {
            date: from.toISOString().split('T')[0],
            revenue,
            volume: sales._sum.volumeLiters ?? 0,
            transactions: sales._count.id,
            expenses: expenseTotal,
            netProfit: revenue - expenseTotal,
            byFuelType: byFuelType.map((b) => ({
                fuelType: tankMap[b.tankId]?.fuelType,
                volume: b._sum.volumeLiters ?? 0,
                revenue: b._sum.totalAmount ?? 0,
                transactions: b._count.id,
            })),
            byPaymentMethod: byPaymentMethod.map((b) => ({
                method: b.paymentMethod,
                revenue: b._sum.totalAmount ?? 0,
                transactions: b._count.id,
            })),
            byPump: byPump.map((b) => ({
                pump: pumpMap[b.pumpId]?.pumpNumber,
                label: pumpMap[b.pumpId]?.label,
                volume: b._sum.volumeLiters ?? 0,
                revenue: b._sum.totalAmount ?? 0,
            })),
        };
    }
    async getWeekly(stationId) {
        const { from, to } = (0, dateHelpers_1.getWeekRange)();
        const stationFilter = stationId ? { stationId } : {};
        let dailyRows;
        if (stationId) {
            dailyRows = await database_1.prisma.$queryRaw `
        SELECT DATE("createdAt") as date, SUM("totalAmount")::float as revenue, SUM("volumeLiters")::float as volume, COUNT(id) as count
        FROM sales WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND "stationId" = ${stationId}
        GROUP BY DATE("createdAt") ORDER BY date
      `;
        }
        else {
            dailyRows = await database_1.prisma.$queryRaw `
        SELECT DATE("createdAt") as date, SUM("totalAmount")::float as revenue, SUM("volumeLiters")::float as volume, COUNT(id) as count
        FROM sales WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY DATE("createdAt") ORDER BY date
      `;
        }
        return {
            from: from.toISOString().split('T')[0],
            to: to.toISOString().split('T')[0],
            days: dailyRows.map((r) => ({
                date: toDateStr(r.date),
                revenue: Number(r.revenue),
                volume: Number(r.volume),
                transactions: Number(r.count),
            })),
            totals: {
                revenue: dailyRows.reduce((s, r) => s + Number(r.revenue), 0),
                volume: dailyRows.reduce((s, r) => s + Number(r.volume), 0),
                transactions: dailyRows.reduce((s, r) => s + Number(r.count), 0),
            },
        };
    }
    async getMonthly(stationId, year, month) {
        const now = new Date();
        const y = year || now.getFullYear();
        const m = month || now.getMonth() + 1;
        const from = new Date(y, m - 1, 1);
        const to = new Date(y, m, 0, 23, 59, 59);
        const [salesTotal, expenseTotal, weeklyBreakdown] = await Promise.all([
            database_1.prisma.sale.aggregate({
                where: { ...(stationId && { stationId }), isVoided: false, createdAt: { gte: from, lte: to } },
                _sum: { totalAmount: true, volumeLiters: true },
                _count: { id: true },
            }),
            database_1.prisma.expense.aggregate({
                where: { ...(stationId && { stationId }), expenseDate: { gte: from, lte: to } },
                _sum: { amount: true },
            }),
            stationId
                ? database_1.prisma.$queryRaw `
            SELECT EXTRACT(WEEK FROM "createdAt")::int as week, SUM("totalAmount")::float as revenue, SUM("volumeLiters")::float as volume, COUNT(id) as count
            FROM sales WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
              AND "stationId" = ${stationId}
            GROUP BY EXTRACT(WEEK FROM "createdAt") ORDER BY week
          `
                : database_1.prisma.$queryRaw `
            SELECT EXTRACT(WEEK FROM "createdAt")::int as week, SUM("totalAmount")::float as revenue, SUM("volumeLiters")::float as volume, COUNT(id) as count
            FROM sales WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
            GROUP BY EXTRACT(WEEK FROM "createdAt") ORDER BY week
          `,
        ]);
        const revenue = salesTotal._sum.totalAmount ?? 0;
        const expenses = expenseTotal._sum.amount ?? 0;
        return {
            year: y,
            month: m,
            revenue,
            volume: salesTotal._sum.volumeLiters ?? 0,
            transactions: salesTotal._count.id,
            expenses,
            netProfit: revenue - expenses,
            weeklyBreakdown: weeklyBreakdown.map((w) => ({
                week: w.week,
                revenue: Number(w.revenue),
                volume: Number(w.volume),
                transactions: Number(w.count),
            })),
        };
    }
    async getInventoryReport(stationId) {
        const tanks = await database_1.prisma.fuelTank.findMany({
            where: { isActive: true, ...(stationId && { stationId }) },
            include: {
                refills: { orderBy: { deliveryDate: 'desc' }, take: 3, include: { supplier: { select: { name: true } } } },
                station: { select: { name: true } },
            },
        });
        return tanks.map((t) => ({
            id: t.id,
            name: t.name,
            fuelType: t.fuelType,
            capacityLiters: t.capacityLiters,
            currentLiters: t.currentLiters,
            percentFull: Math.round((t.currentLiters / t.capacityLiters) * 100),
            isLow: t.currentLiters <= t.minThreshold,
            stationName: t.station.name,
            lastRefills: t.refills,
        }));
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
//# sourceMappingURL=reports.service.js.map