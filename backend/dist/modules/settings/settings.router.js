"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("./settings.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const audit_1 = require("../../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'));
router.get('/', settings_controller_1.settingsController.getSettings.bind(settings_controller_1.settingsController));
router.patch('/', (0, audit_1.auditLog)('UPDATE', 'StationSettings'), settings_controller_1.settingsController.updateSettings.bind(settings_controller_1.settingsController));
router.patch('/station-profile', (0, audit_1.auditLog)('UPDATE', 'Station'), settings_controller_1.settingsController.updateStationProfile.bind(settings_controller_1.settingsController));
router.get('/fuel-prices', settings_controller_1.settingsController.getFuelPrices.bind(settings_controller_1.settingsController));
router.patch('/fuel-prices', (0, audit_1.auditLog)('UPDATE', 'FuelPrices'), settings_controller_1.settingsController.updateFuelPrices.bind(settings_controller_1.settingsController));
router.get('/stations', (0, rbac_1.requireRole)('SUPER_ADMIN'), settings_controller_1.settingsController.getAllStations.bind(settings_controller_1.settingsController));
router.post('/stations', (0, rbac_1.requireRole)('SUPER_ADMIN'), (0, audit_1.auditLog)('CREATE', 'Station'), settings_controller_1.settingsController.createStation.bind(settings_controller_1.settingsController));
exports.default = router;
//# sourceMappingURL=settings.router.js.map