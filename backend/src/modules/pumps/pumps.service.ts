import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import type { CreatePumpInput, UpdatePumpInput } from './pumps.schemas';

export class PumpsService {
  async getAll(query: Record<string, string | undefined>, user: { role: string; stationId: string | null }) {
    const { page, limit, skip } = parsePagination(query);
    const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);

    const where: Record<string, unknown> = {
      isActive: true,
      ...(stationId && { stationId }),
      ...(query.status && { status: query.status }),
      ...(query.search && { label: { contains: query.search, mode: 'insensitive' } }),
    };

    const [total, data] = await Promise.all([
      prisma.pump.count({ where }),
      prisma.pump.findMany({
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

    return paginatedResponse(data, total, page, limit);
  }

  async getById(id: string, stationId?: string | null) {
    const pump = await prisma.pump.findFirst({
      where: { id, ...(stationId && { stationId }) },
      include: {
        tank: true,
        station: { select: { id: true, name: true } },
        meterReadings: { orderBy: { recordedAt: 'desc' }, take: 20 },
      },
    });
    if (!pump) throw new AppError('Pump not found', HTTP_STATUS.NOT_FOUND);
    return pump;
  }

  async create(data: CreatePumpInput, stationId: string) {
    const actualStationId = data.stationId || stationId;

    const existing = await prisma.pump.findFirst({
      where: { stationId: actualStationId, pumpNumber: data.pumpNumber },
    });
    if (existing) throw new AppError('Pump number already exists in this station', HTTP_STATUS.CONFLICT);

    return prisma.pump.create({
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

  async update(id: string, data: UpdatePumpInput, stationId?: string | null) {
    const pump = await prisma.pump.findFirst({
      where: { id, ...(stationId && { stationId }) },
    });
    if (!pump) throw new AppError('Pump not found', HTTP_STATUS.NOT_FOUND);

    return prisma.pump.update({
      where: { id },
      data: {
        ...data,
        lastServiced: data.lastServiced ? new Date(data.lastServiced) : undefined,
      },
      include: { tank: { select: { name: true, fuelType: true } } },
    });
  }

  async delete(id: string, stationId?: string | null) {
    const pump = await prisma.pump.findFirst({
      where: { id, ...(stationId && { stationId }) },
    });
    if (!pump) throw new AppError('Pump not found', HTTP_STATUS.NOT_FOUND);

    return prisma.pump.update({ where: { id }, data: { isActive: false } });
  }

  async getStatusSummary(stationId?: string | null) {
    const where = stationId ? { stationId } : {};
    const pumps = await prisma.pump.groupBy({
      by: ['status'],
      where: { ...where, isActive: true },
      _count: { id: true },
    });

    const summary: Record<string, number> = { ACTIVE: 0, INACTIVE: 0, MAINTENANCE: 0 };
    pumps.forEach((p) => { summary[p.status] = p._count.id; });
    return summary;
  }

  async getMeterHistory(pumpId: string, stationId?: string | null) {
    const pump = await prisma.pump.findFirst({
      where: { id: pumpId, ...(stationId && { stationId }) },
    });
    if (!pump) throw new AppError('Pump not found', HTTP_STATUS.NOT_FOUND);

    return prisma.pumpMeterReading.findMany({
      where: { pumpId },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });
  }
}

export const pumpsService = new PumpsService();
