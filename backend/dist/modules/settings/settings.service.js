"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const database_1 = require("../../config/database");
class SettingsService {
    async getStationSettings(stationId) {
        const settings = await database_1.prisma.stationSettings.findUnique({
            where: { stationId },
            include: { station: { select: { id: true, name: true, address: true, city: true, state: true, phone: true, email: true, logoUrl: true } } },
        });
        if (!settings) {
            // Auto-create with defaults
            return database_1.prisma.stationSettings.create({
                data: { stationId },
                include: { station: { select: { id: true, name: true, address: true, city: true, state: true, phone: true, email: true, logoUrl: true } } },
            });
        }
        return settings;
    }
    async updateStationSettings(stationId, data) {
        return database_1.prisma.stationSettings.upsert({
            where: { stationId },
            create: { stationId, ...data },
            update: data,
        });
    }
    async updateStationProfile(stationId, data) {
        return database_1.prisma.station.update({
            where: { id: stationId },
            data: {
                name: data.name,
                address: data.address,
                city: data.city,
                state: data.state,
                phone: data.phone,
                email: data.email,
            },
        });
    }
    async getFuelPrices(stationId) {
        const settings = await this.getStationSettings(stationId);
        return {
            DIESEL: settings.dieselPrice,
            PETROL: settings.petrolPrice,
            PREMIUM: settings.premiumPrice,
            KEROSENE: settings.kerosenePrice,
        };
    }
    async updateFuelPrices(stationId, prices) {
        return database_1.prisma.stationSettings.upsert({
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
        return database_1.prisma.station.findMany({
            where: { isActive: true },
            include: {
                settings: true,
                _count: { select: { tanks: true, pumps: true, employees: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async createStation(data) {
        const station = await database_1.prisma.station.create({
            data: {
                name: data.name,
                address: data.address,
                city: data.city,
                state: data.state,
                phone: data.phone,
                email: data.email,
            },
        });
        // Create default settings
        await database_1.prisma.stationSettings.create({ data: { stationId: station.id } });
        return station;
    }
}
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService();
//# sourceMappingURL=settings.service.js.map