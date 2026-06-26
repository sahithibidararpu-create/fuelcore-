"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
class InventoryService {
    // ─── Tanks ───────────────────────────────────────────────────────────────────
    async getTanks(query, user) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
        const where = {
            isActive: true,
            ...(stationId && { stationId }),
            ...(query.fuelType && { fuelType: query.fuelType }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.fuelTank.count({ where }),
            database_1.prisma.fuelTank.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ stationId: 'asc' }, { name: 'asc' }],
                include: {
                    station: { select: { id: true, name: true } },
                    _count: { select: { pumps: true } },
                },
            }),
        ]);
        const enriched = data.map((t) => ({
            ...t,
            percentFull: Math.round((t.currentLiters / t.capacityLiters) * 100),
            isLow: t.currentLiters <= t.minThreshold,
            isCritical: t.currentLiters <= t.minThreshold / 2,
        }));
        return (0, pagination_1.paginatedResponse)(enriched, total, page, limit);
    }
    async getTankById(id, stationId) {
        const tank = await database_1.prisma.fuelTank.findFirst({
            where: { id, ...(stationId && { stationId }) },
            include: {
                station: { select: { id: true, name: true } },
                pumps: { where: { isActive: true }, select: { id: true, pumpNumber: true, label: true, status: true } },
                refills: { orderBy: { deliveryDate: 'desc' }, take: 5, include: { supplier: { select: { name: true } } } },
            },
        });
        if (!tank)
            throw new errorHandler_1.AppError('Tank not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return tank;
    }
    async createTank(data, stationId) {
        return database_1.prisma.fuelTank.create({
            data: {
                name: data.name,
                fuelType: data.fuelType,
                capacityLiters: data.capacityLiters,
                currentLiters: data.currentLiters ?? 0,
                minThreshold: data.minThreshold ?? 500,
                stationId: data.stationId || stationId,
            },
        });
    }
    async updateTank(id, data, stationId) {
        const tank = await database_1.prisma.fuelTank.findFirst({ where: { id, ...(stationId && { stationId }) } });
        if (!tank)
            throw new errorHandler_1.AppError('Tank not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.fuelTank.update({ where: { id }, data });
    }
    async getSummary(stationId) {
        const tanks = await database_1.prisma.fuelTank.findMany({
            where: { ...(stationId ? { stationId } : {}), isActive: true },
            include: { station: { select: { name: true } } },
        });
        const byFuelType = {};
        tanks.forEach((t) => {
            if (!byFuelType[t.fuelType])
                byFuelType[t.fuelType] = { capacity: 0, current: 0, tanks: 0 };
            byFuelType[t.fuelType].capacity += t.capacityLiters;
            byFuelType[t.fuelType].current += t.currentLiters;
            byFuelType[t.fuelType].tanks++;
        });
        return {
            totalTanks: tanks.length,
            lowStockCount: tanks.filter((t) => t.currentLiters <= t.minThreshold).length,
            byFuelType,
            tanks: tanks.map((t) => ({
                id: t.id,
                name: t.name,
                fuelType: t.fuelType,
                currentLiters: t.currentLiters,
                capacityLiters: t.capacityLiters,
                percentFull: Math.round((t.currentLiters / t.capacityLiters) * 100),
                stationName: t.station.name,
            })),
        };
    }
    // ─── Refills ─────────────────────────────────────────────────────────────────
    async getRefills(query, user) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
        const where = {
            ...(stationId && { stationId }),
            ...(query.tankId && { tankId: query.tankId }),
            ...(query.supplierId && { supplierId: query.supplierId }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.fuelRefill.count({ where }),
            database_1.prisma.fuelRefill.findMany({
                where,
                skip,
                take: limit,
                orderBy: { deliveryDate: 'desc' },
                include: {
                    tank: { select: { name: true, fuelType: true } },
                    supplier: { select: { name: true } },
                    station: { select: { name: true } },
                },
            }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async createRefill(data, stationId) {
        const tank = await database_1.prisma.fuelTank.findFirst({
            where: { id: data.tankId, stationId },
        });
        if (!tank)
            throw new errorHandler_1.AppError('Tank not found', constants_1.HTTP_STATUS.NOT_FOUND);
        const volumeLiters = data.volumeLiters;
        const pricePerLiter = data.pricePerLiter;
        if (tank.currentLiters + volumeLiters > tank.capacityLiters) {
            throw new errorHandler_1.AppError(`Refill would exceed tank capacity. Available space: ${(tank.capacityLiters - tank.currentLiters).toFixed(0)}L`, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        return database_1.prisma.$transaction(async (tx) => {
            const refill = await tx.fuelRefill.create({
                data: {
                    volumeLiters,
                    pricePerLiter,
                    totalCost: volumeLiters * pricePerLiter,
                    deliveryDate: new Date(data.deliveryDate),
                    invoiceNumber: data.invoiceNumber,
                    notes: data.notes,
                    stationId,
                    tankId: data.tankId,
                    supplierId: data.supplierId,
                },
                include: {
                    tank: { select: { name: true, fuelType: true } },
                    supplier: { select: { name: true } },
                },
            });
            await tx.fuelTank.update({
                where: { id: data.tankId },
                data: { currentLiters: { increment: volumeLiters } },
            });
            return refill;
        });
    }
    // ─── Suppliers ───────────────────────────────────────────────────────────────
    async getSuppliers(query) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const where = {
            isActive: true,
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { contactName: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.supplier.count({ where }),
            database_1.prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async createSupplier(data) {
        return database_1.prisma.supplier.create({
            data: {
                name: data.name,
                contactName: data.contactName,
                phone: data.phone,
                email: data.email,
                address: data.address,
            },
        });
    }
    async updateSupplier(id, data) {
        return database_1.prisma.supplier.update({ where: { id }, data });
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map