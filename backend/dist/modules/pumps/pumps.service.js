"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pumpsService = exports.PumpsService = void 0;
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
class PumpsService {
    async getAll(query, user) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);
        const where = {
            isActive: true,
            ...(stationId && { stationId }),
            ...(query.status && { status: query.status }),
            ...(query.search && { label: { contains: query.search, mode: 'insensitive' } }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.pump.count({ where }),
            database_1.prisma.pump.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ stationId: 'asc' }, { pumpNumber: 'asc' }],
                include: {
                    tank: { select: { id: true, name: true, fuelType: true, currentLiters: true, capacityLiters: true } },
                    station: { select: { id: true, name: true } },
                    _count: { select: { sales: true } },
                },
            }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async getById(id, stationId) {
        const pump = await database_1.prisma.pump.findFirst({
            where: { id, ...(stationId && { stationId }) },
            include: {
                tank: true,
                station: { select: { id: true, name: true } },
                meterReadings: { orderBy: { recordedAt: 'desc' }, take: 20 },
            },
        });
        if (!pump)
            throw new errorHandler_1.AppError('Pump not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return pump;
    }
    async create(data, stationId) {
        const actualStationId = data.stationId || stationId;
        const existing = await database_1.prisma.pump.findFirst({
            where: { stationId: actualStationId, pumpNumber: data.pumpNumber },
        });
        if (existing)
            throw new errorHandler_1.AppError('Pump number already exists in this station', constants_1.HTTP_STATUS.CONFLICT);
        return database_1.prisma.pump.create({
            data: {
                pumpNumber: data.pumpNumber,
                label: data.label,
                tankId: data.tankId,
                stationId: actualStationId,
                openingMeter: data.openingMeter,
                currentMeter: data.openingMeter,
            },
            include: { tank: true, station: { select: { id: true, name: true } } },
        });
    }
    async update(id, data, stationId) {
        const pump = await database_1.prisma.pump.findFirst({
            where: { id, ...(stationId && { stationId }) },
        });
        if (!pump)
            throw new errorHandler_1.AppError('Pump not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.pump.update({
            where: { id },
            data: {
                ...data,
                lastServiced: data.lastServiced ? new Date(data.lastServiced) : undefined,
            },
            include: { tank: { select: { name: true, fuelType: true } } },
        });
    }
    async delete(id, stationId) {
        const pump = await database_1.prisma.pump.findFirst({
            where: { id, ...(stationId && { stationId }) },
        });
        if (!pump)
            throw new errorHandler_1.AppError('Pump not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.pump.update({ where: { id }, data: { isActive: false } });
    }
    async getStatusSummary(stationId) {
        const where = stationId ? { stationId } : {};
        const pumps = await database_1.prisma.pump.groupBy({
            by: ['status'],
            where: { ...where, isActive: true },
            _count: { id: true },
        });
        const summary = { ACTIVE: 0, INACTIVE: 0, MAINTENANCE: 0 };
        pumps.forEach((p) => { summary[p.status] = p._count.id; });
        return summary;
    }
    async getMeterHistory(pumpId, stationId) {
        const pump = await database_1.prisma.pump.findFirst({
            where: { id: pumpId, ...(stationId && { stationId }) },
        });
        if (!pump)
            throw new errorHandler_1.AppError('Pump not found', constants_1.HTTP_STATUS.NOT_FOUND);
        return database_1.prisma.pumpMeterReading.findMany({
            where: { pumpId },
            orderBy: { recordedAt: 'desc' },
            take: 50,
        });
    }
}
exports.PumpsService = PumpsService;
exports.pumpsService = new PumpsService();
//# sourceMappingURL=pumps.service.js.map