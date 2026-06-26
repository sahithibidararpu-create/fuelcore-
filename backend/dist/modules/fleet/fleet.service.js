"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fleetService = exports.FleetService = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const constants_2 = require("../../config/constants");
class FleetService {
    async getAccounts(query, user) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
        const where = {
            isActive: true,
            ...(stationId && { stationId }),
            ...(query.search && {
                OR: [
                    { companyName: { contains: query.search, mode: 'insensitive' } },
                    { accountNumber: { contains: query.search, mode: 'insensitive' } },
                    { contactName: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.fleetAccount.count({ where }),
            database_1.prisma.fleetAccount.findMany({
                where,
                skip,
                take: limit,
                orderBy: { companyName: 'asc' },
                include: {
                    station: { select: { name: true } },
                    _count: { select: { sales: true, payments: true } },
                },
            }),
        ]);
        const enriched = data.map((a) => ({
            ...a,
            availableCredit: a.creditLimit - a.currentBalance,
            utilizationPercent: Math.round((a.currentBalance / a.creditLimit) * 100),
        }));
        return (0, pagination_1.paginatedResponse)(enriched, total, page, limit);
    }
    async getAccountById(id, stationId) {
        const account = await database_1.prisma.fleetAccount.findFirst({
            where: { id, ...(stationId && { stationId }) },
            include: {
                station: { select: { name: true } },
                sales: {
                    where: { isVoided: false },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: { tank: { select: { fuelType: true } }, pump: { select: { pumpNumber: true } } },
                },
                payments: { orderBy: { paymentDate: 'desc' }, take: 10 },
            },
        });
        if (!account)
            throw new errorHandler_1.AppError('Fleet account not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return account;
    }
    async createAccount(data, stationId) {
        return database_1.prisma.fleetAccount.create({
            data: {
                accountNumber: (0, pagination_1.generateAccountNumber)(constants_2.CONSTANTS.FLEET_ACCOUNT_PREFIX),
                companyName: data.companyName,
                contactName: data.contactName,
                contactPhone: data.contactPhone,
                contactEmail: data.contactEmail,
                creditLimit: data.creditLimit || 50000,
                notes: data.notes,
                stationId: data.stationId || stationId,
            },
        });
    }
    async updateAccount(id, data, stationId) {
        const account = await database_1.prisma.fleetAccount.findFirst({ where: { id, ...(stationId && { stationId }) } });
        if (!account)
            throw new errorHandler_1.AppError('Fleet account not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.fleetAccount.update({ where: { id }, data });
    }
    async recordPayment(accountId, amount, reference, notes, stationId) {
        const account = await database_1.prisma.fleetAccount.findFirst({
            where: { id: accountId, ...(stationId && { stationId }) },
        });
        if (!account)
            throw new errorHandler_1.AppError('Fleet account not found', constants_1.HTTP_STATUS.NOT_FOUND);
        if (amount > account.currentBalance) {
            throw new errorHandler_1.AppError(`Payment amount exceeds outstanding balance: ${account.currentBalance.toFixed(2)}`, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        return database_1.prisma.$transaction(async (tx) => {
            const payment = await tx.fleetPayment.create({
                data: { fleetAccountId: accountId, amount, reference, notes },
            });
            await tx.fleetAccount.update({
                where: { id: accountId },
                data: { currentBalance: { decrement: amount } },
            });
            return payment;
        });
    }
    async getTransactions(accountId, query, stationId) {
        const account = await database_1.prisma.fleetAccount.findFirst({
            where: { id: accountId, ...(stationId && { stationId }) },
        });
        if (!account)
            throw new errorHandler_1.AppError('Fleet account not found', constants_1.HTTP_STATUS.NOT_FOUND);
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const [sales, payments] = await Promise.all([
            database_1.prisma.sale.findMany({
                where: { fleetAccountId: accountId, isVoided: false },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { tank: { select: { fuelType: true } }, pump: { select: { pumpNumber: true } } },
            }),
            database_1.prisma.fleetPayment.findMany({
                where: { fleetAccountId: accountId },
                orderBy: { paymentDate: 'desc' },
            }),
        ]);
        return { account, sales, payments };
    }
}
exports.FleetService = FleetService;
exports.fleetService = new FleetService();
//# sourceMappingURL=fleet.service.js.map