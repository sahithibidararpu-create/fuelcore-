import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import { parseDateRange } from '../../utils/dateHelpers';

export class ExpensesService {
  async getAll(query: Record<string, string | undefined>, user: { role: string; stationId: string | null }) {
    const { page, limit, skip } = parsePagination(query);
    const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
    const { from, to } = parseDateRange(query.from, query.to);

    const where: Record<string, unknown> = {
      expenseDate: { gte: from, lte: to },
      ...(stationId && { stationId }),
      ...(query.category && { category: query.category }),
      ...(query.search && { title: { contains: query.search, mode: 'insensitive' } }),
    };

    const [total, data] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
        include: { station: { select: { name: true } } },
      }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async getById(id: string, stationId?: string | null) {
    const expense = await prisma.expense.findFirst({
      where: { id, ...(stationId && { stationId }) },
      include: { station: { select: { name: true } } },
    });
    if (!expense) throw new AppError('Expense not found', HTTP_STATUS.NOT_FOUND);
    return expense;
  }

  async create(data: Record<string, unknown>, stationId: string) {
    return prisma.expense.create({
      data: {
        title: data.title as string,
        description: data.description as string | undefined,
        amount: data.amount as number,
        category: data.category as any,
        expenseDate: new Date(data.expenseDate as string),
        stationId: (data.stationId as string) || stationId,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>, stationId?: string | null) {
    const expense = await prisma.expense.findFirst({ where: { id, ...(stationId && { stationId }) } });
    if (!expense) throw new AppError('Expense not found', HTTP_STATUS.NOT_FOUND);
    return prisma.expense.update({ where: { id }, data });
  }

  async delete(id: string, stationId?: string | null) {
    const expense = await prisma.expense.findFirst({ where: { id, ...(stationId && { stationId }) } });
    if (!expense) throw new AppError('Expense not found', HTTP_STATUS.NOT_FOUND);
    return prisma.expense.delete({ where: { id } });
  }

  async getSummary(stationId?: string | null, from?: string, to?: string) {
    const { from: start, to: end } = parseDateRange(from, to);
    const filter = {
      expenseDate: { gte: start, lte: end },
      ...(stationId && { stationId }),
    };

    const [total, byCategory] = await Promise.all([
      prisma.expense.aggregate({
        where: filter,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: filter,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    return {
      totalAmount: total._sum.amount ?? 0,
      totalCount: total._count.id,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amount: c._sum.amount ?? 0,
        count: c._count.id,
      })),
    };
  }
}

export const expensesService = new ExpensesService();
