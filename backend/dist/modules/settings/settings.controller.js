"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const settings_service_1 = require("./settings.service");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const database_1 = require("../../config/database");
const errorHandler_1 = require("../../middleware/errorHandler");
class SettingsController {
    async getSettings(req, res) {
        let stationId = req.query.stationId || req.user.stationId;
        if (!stationId) {
            const firstStation = await database_1.prisma.station.findFirst({ select: { id: true } });
            if (firstStation)
                stationId = firstStation.id;
        }
        if (!stationId) {
            return res.json((0, pagination_1.successResponse)({
                id: '',
                stationId: '',
                station: { id: '', name: 'No Stations Configured', address: '', city: '', state: '', phone: '', email: '' },
                dieselPrice: 0, petrolPrice: 0, premiumPrice: 0, kerosenePrice: 0,
                lowStockThreshold: 500, criticalStockThreshold: 200,
            }));
        }
        res.json((0, pagination_1.successResponse)(await settings_service_1.settingsService.getStationSettings(stationId)));
    }
    async updateSettings(req, res) {
        let stationId = req.body.stationId || req.user.stationId;
        if (!stationId) {
            const firstStation = await database_1.prisma.station.findFirst({ select: { id: true } });
            if (firstStation)
                stationId = firstStation.id;
        }
        if (!stationId) {
            throw new errorHandler_1.AppError('No stations configured to update settings', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        res.json((0, pagination_1.successResponse)(await settings_service_1.settingsService.updateStationSettings(stationId, req.body)));
    }
    async updateStationProfile(req, res) {
        let stationId = req.body.stationId || req.user.stationId;
        if (!stationId) {
            const firstStation = await database_1.prisma.station.findFirst({ select: { id: true } });
            if (firstStation)
                stationId = firstStation.id;
        }
        if (!stationId) {
            throw new errorHandler_1.AppError('No stations configured to update profile', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        res.json((0, pagination_1.successResponse)(await settings_service_1.settingsService.updateStationProfile(stationId, req.body), 'Station profile updated'));
    }
    async getFuelPrices(req, res) {
        let stationId = req.query.stationId || req.user.stationId;
        if (!stationId) {
            const firstStation = await database_1.prisma.station.findFirst({ select: { id: true } });
            if (firstStation)
                stationId = firstStation.id;
        }
        if (!stationId) {
            return res.json((0, pagination_1.successResponse)({
                DIESEL: 0,
                PETROL: 0,
                PREMIUM: 0,
                KEROSENE: 0,
            }));
        }
        res.json((0, pagination_1.successResponse)(await settings_service_1.settingsService.getFuelPrices(stationId)));
    }
    async updateFuelPrices(req, res) {
        let stationId = req.body.stationId || req.user.stationId;
        if (!stationId) {
            const firstStation = await database_1.prisma.station.findFirst({ select: { id: true } });
            if (firstStation)
                stationId = firstStation.id;
        }
        if (!stationId) {
            throw new errorHandler_1.AppError('No stations configured to update fuel prices', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        res.json((0, pagination_1.successResponse)(await settings_service_1.settingsService.updateFuelPrices(stationId, req.body.prices), 'Fuel prices updated'));
    }
    async getAllStations(req, res) {
        res.json((0, pagination_1.successResponse)(await settings_service_1.settingsService.getAllStations()));
    }
    async createStation(req, res) {
        const station = await settings_service_1.settingsService.createStation(req.body);
        res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(station, 'Station created'));
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
//# sourceMappingURL=settings.controller.js.map