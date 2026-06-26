"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesService = exports.SalesService = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const dateHelpers_1 = require("../../utils/dateHelpers");
const notifications_service_1 = require("../notifications/notifications.service");
class SalesService {
    async createSale(data, employeeId, stationId) {
        // 1. Validate pump
        const pump = await database_1.prisma.pump.findFirst({
            where: { id: data.pumpId, stationId, isActive: true },
            include: { tank: true, station: { include: { settings: true } } },
        });
        if (!pump)
            throw new errorHandler_1.AppError('Pump not found or inactive', constants_1.HTTP_STATUS.NOT_FOUND);
        if (pump.status !== 'ACTIVE')
            throw new errorHandler_1.AppError(`Pump is ${pump.status}`, constants_1.HTTP_STATUS.BAD_REQUEST);
        if (!pump.tank)
            throw new errorHandler_1.AppError('Pump has no assigned tank', constants_1.HTTP_STATUS.BAD_REQUEST);
        // 2. Check tank volume
        if (pump.tank.currentLiters < data.volumeLiters) {
            throw new errorHandler_1.AppError(`Insufficient fuel: ${pump.tank.currentLiters.toFixed(2)}L available`, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        // 3. Validate fleet if applicable
        if (data.paymentMethod === 'FLEET') {
            if (!data.fleetAccountId) {
                throw new errorHandler_1.AppError('Fleet account required for FLEET payment', constants_1.HTTP_STATUS.BAD_REQUEST);
            }
            const fleet = await database_1.prisma.fleetAccount.findFirst({
                where: { id: data.fleetAccountId, stationId, isActive: true },
            });
            if (!fleet)
                throw new errorHandler_1.AppError('Fleet account not found', constants_1.HTTP_STATUS.NOT_FOUND);
            const saleTotal = data.volumeLiters * data.pricePerLiter;
            if (fleet.currentBalance + saleTotal > fleet.creditLimit) {
                throw new errorHandler_1.AppError(`Fleet credit limit exceeded. Available: ${(fleet.creditLimit - fleet.currentBalance).toFixed(2)}`, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
        }
        const totalAmount = data.volumeLiters * data.pricePerLiter;
        const invoiceNumber = (0, pagination_1.generateInvoiceNumber)();
        const newMeterReading = pump.currentMeter + data.volumeLiters;
        // 4. Atomic transaction
        const sale = await database_1.prisma.$transaction(async (tx) => {
            // Deduct from tank
            const updatedTank = await tx.fuelTank.update({
                where: { id: pump.tankId },
                data: { currentLiters: { decrement: data.volumeLiters } },
            });
            // Update pump meter
            await tx.pump.update({
                where: { id: pump.id },
                data: { currentMeter: newMeterReading },
            });
            // Record meter reading
            await tx.pumpMeterReading.create({
                data: {
                    pumpId: pump.id,
                    readingValue: newMeterReading,
                    recordedBy: employeeId,
                },
            });
            // Create sale
            const newSale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    volumeLiters: data.volumeLiters,
                    pricePerLiter: data.pricePerLiter,
                    totalAmount,
                    paymentMethod: data.paymentMethod,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    vehicleNumber: data.vehicleNumber,
                    notes: data.notes,
                    stationId,
                    pumpId: pump.id,
                    tankId: pump.tankId,
                    employeeId,
                    fleetAccountId: data.fleetAccountId,
                },
                include: {
                    pump: { select: { pumpNumber: true, label: true } },
                    tank: { select: { name: true, fuelType: true } },
                    employee: { select: { firstName: true, lastName: true } },
                    fleetAccount: { select: { companyName: true, accountNumber: true } },
                },
            });
            // Update fleet balance if fleet payment
            if (data.paymentMethod === 'FLEET' && data.fleetAccountId) {
                await tx.fleetAccount.update({
                    where: { id: data.fleetAccountId },
                    data: { currentBalance: { increment: totalAmount } },
                });
            }
            // Check low stock after sale
            const settings = pump.station.settings;
            const threshold = settings?.lowStockThreshold ?? 500;
            const criticalThreshold = settings?.criticalStockThreshold ?? 200;
            if (updatedTank.currentLiters <= criticalThreshold) {
                setImmediate(() => {
                    notifications_service_1.notificationService.createSystemNotification(stationId, '🚨 Critical Stock Level', `${updatedTank.name} is critically low: ${updatedTank.currentLiters.toFixed(0)}L remaining`, 'LOW_STOCK', 'CRITICAL');
                });
            }
            else if (updatedTank.currentLiters <= threshold) {
                setImmediate(() => {
                    notifications_service_1.notificationService.createSystemNotification(stationId, '⚠️ Low Stock Alert', `${updatedTank.name} is running low: ${updatedTank.currentLiters.toFixed(0)}L remaining`, 'LOW_STOCK', 'HIGH');
                });
            }
            return newSale;
        });
        return sale;
    }
    async getSales(query, user) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const { from, to } = (0, dateHelpers_1.parseDateRange)(query.from, query.to);
        const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
        const where = {
            isVoided: false,
            createdAt: { gte: from, lte: to },
            ...(stationId && { stationId }),
            ...(query.pumpId && { pumpId: query.pumpId }),
            ...(query.paymentMethod && { paymentMethod: query.paymentMethod }),
            ...(query.search && {
                OR: [
                    { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
                    { customerName: { contains: query.search, mode: 'insensitive' } },
                    { vehicleNumber: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        if (query.fuelType) {
            where.tank = { fuelType: query.fuelType };
        }
        const [total, data] = await Promise.all([
            database_1.prisma.sale.count({ where }),
            database_1.prisma.sale.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    pump: { select: { pumpNumber: true, label: true } },
                    tank: { select: { name: true, fuelType: true } },
                    employee: { select: { firstName: true, lastName: true } },
                    station: { select: { name: true } },
                    fleetAccount: { select: { companyName: true, accountNumber: true } },
                },
            }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async getSaleById(id, stationId) {
        const sale = await database_1.prisma.sale.findFirst({
            where: { id, ...(stationId && { stationId }) },
            include: {
                pump: true,
                tank: true,
                employee: { select: { firstName: true, lastName: true, email: true } },
                station: true,
                fleetAccount: true,
            },
        });
        if (!sale)
            throw new errorHandler_1.AppError('Sale not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return sale;
    }
    async voidSale(id, data, userId, stationId) {
        const sale = await database_1.prisma.sale.findFirst({
            where: { id, ...(stationId && { stationId }), isVoided: false },
        });
        if (!sale)
            throw new errorHandler_1.AppError('Sale not found or already voided', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.$transaction(async (tx) => {
            // Reverse tank deduction
            await tx.fuelTank.update({
                where: { id: sale.tankId },
                data: { currentLiters: { increment: sale.volumeLiters } },
            });
            // Reverse fleet balance
            if (sale.fleetAccountId && sale.paymentMethod === 'FLEET') {
                await tx.fleetAccount.update({
                    where: { id: sale.fleetAccountId },
                    data: { currentBalance: { decrement: sale.totalAmount } },
                });
            }
            return tx.sale.update({
                where: { id },
                data: { isVoided: true, voidReason: data.voidReason },
            });
        });
    }
    async getDailySummary(stationId) {
        const today = new Date();
        const from = new Date(today.setHours(0, 0, 0, 0));
        const to = new Date();
        const result = await database_1.prisma.sale.aggregate({
            where: { stationId, isVoided: false, createdAt: { gte: from, lte: to } },
            _sum: { totalAmount: true, volumeLiters: true },
            _count: { id: true },
        });
        return {
            totalRevenue: result._sum.totalAmount ?? 0,
            totalVolume: result._sum.volumeLiters ?? 0,
            totalTransactions: result._count.id,
        };
    }
}
exports.SalesService = SalesService;
exports.salesService = new SalesService();
//# sourceMappingURL=sales.service.js.map