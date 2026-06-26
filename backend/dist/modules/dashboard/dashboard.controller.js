"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
const pagination_1 = require("../../utils/pagination");
const getStationId = (req) => req.user.role === 'SUPER_ADMIN'
    ? req.query.stationId || null
    : req.user.stationId;
class DashboardController {
    async getStats(req, res) {
        const data = await dashboard_service_1.dashboardService.getStats(getStationId(req));
        res.json((0, pagination_1.successResponse)(data));
    }
    async getCharts(req, res) {
        const days = parseInt(req.query.days || '30');
        const data = await dashboard_service_1.dashboardService.getCharts(getStationId(req), days);
        res.json((0, pagination_1.successResponse)(data));
    }
    async getRecentSales(req, res) {
        const data = await dashboard_service_1.dashboardService.getRecentSales(getStationId(req));
        res.json((0, pagination_1.successResponse)(data));
    }
    async getAlerts(req, res) {
        const data = await dashboard_service_1.dashboardService.getAlerts(getStationId(req));
        res.json((0, pagination_1.successResponse)(data));
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map