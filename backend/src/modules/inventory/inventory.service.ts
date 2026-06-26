import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

export class InventoryService {
  // ─── Tanks ───────────────────────────────────────────────────────────────────
  async getTanks(query: Record<string, string | undefined>, user: { role: string; stationId: string | null }) {
    const { page, limit, skip } = parsePagination(query);
    const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);

    const where: Record<string, unknown> = {
      isActive: true,
      ...(stationId && { stationId }),
      ...(query.fuelType && { fuelType: query.fuelType }),
    };

    const [total, data] = await Promise.all([
      prisma.fuelTank.count({ where }),
      prisma.fuelTank.findMany({
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

    return paginatedResponse(enriched, total, page, limit);
  }

  async getTankById(id: string, stationId?: string | null) {
    const tank = await prisma.fuelTank.findFirst({
      where: { id, ...(stationId && { stationId }) },
      include: {
        station: { select: { id: true, name: true } },
        pumps: { where: { isActive: true }, select: { id: true, pumpNumber: true, label: true, status: true } },
        refills: { orderBy: { deliveryDate: 'desc' }, take: 5, include: { supplier: { select: { name: true } } } },
      },
    });
    if (!tank) throw new AppError('Tank not found', HTTP_STATUS.NOT_FOUND);
    return tank;
  }

  async createTank(data: Record<string, unknown>, stationId: string) {
    return prisma.fuelTank.create({
      data: {
        name: data.name as string,
        fuelType: data.fuelType as 'DIESEL' | 'PETROL' | 'PREMIUM' | 'KEROSENE',
        capacityLiters: data.capacityLiters as number,
        currentLiters: (data.currentLiters as number) ?? 0,
        minThreshold: (data.minThreshold as number) ?? 500,
        stationId: (data.stationId as string) || stationId,
      },
    });
  }

  async updateTank(id: string, data: Record<string, unknown>, stationId?: string | null) {
    const tank = await prisma.fuelTank.findFirst({ where: { id, ...(stationId && { stationId }) } });
    if (!tank) throw new AppError('Tank not found', HTTP_STATUS.NOT_FOUND);
    return prisma.fuelTank.update({ where: { id }, data });
  }

  async getSummary(stationId?: string | null) {
    const tanks = await prisma.fuelTank.findMany({
      where: { ...(stationId ? { stationId } : {}), isActive: true },
      include: { station: { select: { name: true } } },
    });

    const byFuelType: Record<string, { capacity: number; current: number; tanks: number }> = {};
    tanks.forEach((t) => {
      if (!byFuelType[t.fuelType]) byFuelType[t.fuelType] = { capacity: 0, current: 0, tanks: 0 };
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
  async getRefills(query: Record<string, string | undefined>, user: { role: string; stationId: string | null }) {
    const { page, limit, skip } = parsePagination(query);
    const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);

    const where: Record<string, unknown> = {
      ...(stationId && { stationId }),
      ...(query.tankId && { tankId: query.tankId }),
      ...(query.supplierId && { supplierId: query.supplierId }),
    };

    const [total, data] = await Promise.all([
      prisma.fuelRefill.count({ where }),
      prisma.fuelRefill.findMany({
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

    return paginatedResponse(data, total, page, limit);
  }

  async createRefill(data: Record<string, unknown>, stationId: string) {
    const tank = await prisma.fuelTank.findFirst({
      where: { id: data.tankId as string, stationId },
    });
    if (!tank) throw new AppError('Tank not found', HTTP_STATUS.NOT_FOUND);

    const volumeLiters = data.volumeLiters as number;
    const pricePerLiter = data.pricePerLiter as number;

    if (tank.currentLiters + volumeLiters > tank.capacityLiters) {
      throw new AppError(
        `Refill would exceed tank capacity. Available space: ${(tank.capacityLiters - tank.currentLiters).toFixed(0)}L`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return prisma.$transaction(async (tx) => {
      const refill = await tx.fuelRefill.create({
        data: {
          volumeLiters,
          pricePerLiter,
          totalCost: volumeLiters * pricePerLiter,
          deliveryDate: new Date(data.deliveryDate as string),
          invoiceNumber: data.invoiceNumber as string | undefined,
          notes: data.notes as string | undefined,
          stationId,
          tankId: data.tankId as string,
          supplierId: data.supplierId as string,
        },
        include: {
          tank: { select: { name: true, fuelType: true } },
          supplier: { select: { name: true } },
        },
      });

      await tx.fuelTank.update({
        where: { id: data.tankId as string },
        data: { currentLiters: { increment: volumeLiters } },
      });

      return refill;
    });
  }

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  async getSuppliers(query: Record<string, string | undefined>) {
    const { page, limit, skip } = parsePagination(query);
    const where: Record<string, unknown> = {
      isActive: true,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { contactName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async createSupplier(data: Record<string, unknown>) {
    return prisma.supplier.create({
      data: {
        name: data.name as string,
        contactName: data.contactName as string | undefined,
        phone: data.phone as string | undefined,
        email: data.email as string | undefined,
        address: data.address as string | undefined,
      },
    });
  }

  async updateSupplier(id: string, data: Record<string, unknown>) {
    return prisma.supplier.update({ where: { id }, data });
  }
}

export const inventoryService = new InventoryService();
