import { prisma } from '../../config/database';
import { parseDateRange, getTodayRange, getWeekRange, getMonthRange } from '../../utils/dateHelpers';
import { format } from 'date-fns';

function toDateStr(val: Date | string): string {
  if (val instanceof Date) return format(val, 'yyyy-MM-dd');
  return format(new Date(val), 'yyyy-MM-dd');
}

export class ReportsService {
  private getSalesAggregate(filter: object) {
    return prisma.sale.aggregate({
      where: { ...filter, isVoided: false },
      _sum: { totalAmount: true, volumeLiters: true },
      _count: { id: true },
    });
  }

  async getDaily(stationId?: string | null, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const from = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const to = new Date(from.getTime() + 86399999);

    const stationFilter = stationId ? { stationId } : {};
    const filter = { ...stationFilter, createdAt: { gte: from, lte: to } };

    const [sales, expenses, byFuelType, byPaymentMethod, byPump] = await Promise.all([
      this.getSalesAggregate(filter),
      prisma.expense.aggregate({
        where: { ...(stationId && { stationId }), expenseDate: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      prisma.sale.groupBy({
        by: ['tankId'],
        where: { ...filter },
        _sum: { volumeLiters: true, totalAmount: true },
        _count: { id: true },
      }),
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: { ...filter },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.sale.groupBy({
        by: ['pumpId'],
        where: { ...filter },
        _sum: { volumeLiters: true, totalAmount: true },
        _count: { id: true },
      }),
    ]);

    const tankIds = byFuelType.map((b) => b.tankId);
    const tanks = await prisma.fuelTank.findMany({
      where: { id: { in: tankIds } },
      select: { id: true, fuelType: true, name: true },
    });
    const tankMap = Object.fromEntries(tanks.map((t) => [t.id, t]));

    const pumpIds = byPump.map((b) => b.pumpId);
    const pumps = await prisma.pump.findMany({
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

  async getWeekly(stationId?: string | null) {
    const { from, to } = getWeekRange();
    const stationFilter = stationId ? { stationId } : {};

    let dailyRows: Array<{ date: Date | string; revenue: number; volume: number; count: bigint }>;
    if (stationId) {
      dailyRows = await prisma.$queryRaw`
        SELECT DATE("createdAt") as date, SUM("totalAmount")::float as revenue, SUM("volumeLiters")::float as volume, COUNT(id) as count
        FROM sales WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND "stationId" = ${stationId}
        GROUP BY DATE("createdAt") ORDER BY date
      `;
    } else {
      dailyRows = await prisma.$queryRaw`
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

  async getMonthly(stationId?: string | null, year?: number, month?: number) {
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || now.getMonth() + 1;
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0, 23, 59, 59);

    const [salesTotal, expenseTotal, weeklyBreakdown] = await Promise.all([
      prisma.sale.aggregate({
        where: { ...(stationId && { stationId }), isVoided: false, createdAt: { gte: from, lte: to } },
        _sum: { totalAmount: true, volumeLiters: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: { ...(stationId && { stationId }), expenseDate: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      stationId
        ? prisma.$queryRaw<Array<{ week: number; revenue: number; volume: number; count: bigint }>>`
            SELECT EXTRACT(WEEK FROM "createdAt")::int as week, SUM("totalAmount")::float as revenue, SUM("volumeLiters")::float as volume, COUNT(id) as count
            FROM sales WHERE "isVoided" = false AND "createdAt" >= ${from} AND "createdAt" <= ${to}
              AND "stationId" = ${stationId}
            GROUP BY EXTRACT(WEEK FROM "createdAt") ORDER BY week
          `
        : prisma.$queryRaw<Array<{ week: number; revenue: number; volume: number; count: bigint }>>`
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

  async getInventoryReport(stationId?: string | null) {
    const tanks = await prisma.fuelTank.findMany({
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

export const reportsService = new ReportsService();
