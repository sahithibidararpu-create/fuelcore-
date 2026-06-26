"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesService = exports.ExpensesService = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const dateHelpers_1 = require("../../utils/dateHelpers");
class ExpensesService {
    async getAll(query, user) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
        const { from, to } = (0, dateHelpers_1.parseDateRange)(query.from, query.to);
        const where = {
            expenseDate: { gte: from, lte: to },
            ...(stationId && { stationId }),
            ...(query.category && { category: query.category }),
            ...(query.search && { title: { contains: query.search, mode: 'insensitive' } }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.expense.count({ where }),
            database_1.prisma.expense.findMany({
                where,
                skip,
                take: limit,
                orderBy: { expenseDate: 'desc' },
                include: { station: { select: { name: true } } },
            }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async getById(id, stationId) {
        const expense = await database_1.prisma.expense.findFirst({
            where: { id, ...(stationId && { stationId }) },
            include: { station: { select: { name: true } } },
        });
        if (!expense)
            throw new errorHandler_1.AppError('Expense not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return expense;
    }
    async create(data, stationId) {
        return database_1.prisma.expense.create({
            data: {
                title: data.title,
                description: data.description,
                amount: data.amount,
                category: data.category,
                expenseDate: new Date(data.expenseDate),
                stationId: data.stationId || stationId,
            },
        });
    }
    async update(id, data, stationId) {
        const expense = await database_1.prisma.expense.findFirst({ where: { id, ...(stationId && { stationId }) } });
        if (!expense)
            throw new errorHandler_1.AppError('Expense not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.expense.update({ where: { id }, data });
    }
    async delete(id, stationId) {
        const expense = await database_1.prisma.expense.findFirst({ where: { id, ...(stationId && { stationId }) } });
        if (!expense)
            throw new errorHandler_1.AppError('Expense not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.expense.delete({ where: { id } });
    }
    async getSummary(stationId, from, to) {
        const { from: start, to: end } = (0, dateHelpers_1.parseDateRange)(from, to);
        const filter = {
            expenseDate: { gte: start, lte: end },
            ...(stationId && { stationId }),
        };
        const [total, byCategory] = await Promise.all([
            database_1.prisma.expense.aggregate({
                where: filter,
                _sum: { amount: true },
                _count: { id: true },
            }),
            database_1.prisma.expense.groupBy({
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
exports.ExpensesService = ExpensesService;
exports.expensesService = new ExpensesService();
//# sourceMappingURL=expenses.service.js.map