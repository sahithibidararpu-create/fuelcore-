import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';

export class SettingsService {
  async getStationSettings(stationId: string) {
    const settings = await prisma.stationSettings.findUnique({
      where: { stationId },
      include: { station: { select: { id: true, name: true, address: true, city: true, state: true, phone: true, email: true, logoUrl: true } } },
    });
    if (!settings) {
      // Auto-create with defaults
      return prisma.stationSettings.create({
        data: { stationId },
        include: { station: { select: { id: true, name: true, address: true, city: true, state: true, phone: true, email: true, logoUrl: true } } },
      });
    }
    return settings;
  }

  async updateStationSettings(stationId: string, data: Record<string, unknown>) {
    return prisma.stationSettings.upsert({
      where: { stationId },
      create: { stationId, ...data },
      update: data,
    });
  }

  async updateStationProfile(stationId: string, data: Record<string, unknown>) {
    return prisma.station.update({
      where: { id: stationId },
      data: {
        name: data.name as string | undefined,
        address: data.address as string | undefined,
        city: data.city as string | undefined,
        state: data.state as string | undefined,
        phone: data.phone as string | undefined,
        email: data.email as string | undefined,
      },
    });
  }

  async getFuelPrices(stationId: string) {
    const settings = await this.getStationSettings(stationId);
    return {
      DIESEL: settings.dieselPrice,
      PETROL: settings.petrolPrice,
      PREMIUM: settings.premiumPrice,
      KEROSENE: settings.kerosenePrice,
    };
  }

  async updateFuelPrices(stationId: string, prices: Record<string, number>) {
    return prisma.stationSettings.upsert({
      where: { stationId },
      create: {
        stationId,
        dieselPrice: prices.DIESEL || 0,
        petrolPrice: prices.PETROL || 0,
        premiumPrice: prices.PREMIUM || 0,
        kerosenePrice: prices.KEROSENE || 0,
      },
      update: {
        dieselPrice: prices.DIESEL,
        petrolPrice: prices.PETROL,
        premiumPrice: prices.PREMIUM,
        kerosenePrice: prices.KEROSENE,
      },
    });
  }

  async getAllStations() {
    return prisma.station.findMany({
      where: { isActive: true },
      include: {
        settings: true,
        _count: { select: { tanks: true, pumps: true, employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createStation(data: Record<string, unknown>) {
    const station = await prisma.station.create({
      data: {
        name: data.name as string,
        address: data.address as string,
        city: data.city as string,
        state: data.state as string,
        phone: data.phone as string | undefined,
        email: data.email as string | undefined,
      },
    });
    // Create default settings
    await prisma.stationSettings.create({ data: { stationId: station.id } });
    return station;
  }
}

export const settingsService = new SettingsService();
