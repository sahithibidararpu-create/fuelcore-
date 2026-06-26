"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
const pagination_1 = require("../../utils/pagination");
const sid = (req) => req.user.role === 'SUPER_ADMIN' ? req.query.stationId || null : req.user.stationId;
class AnalyticsController {
    async getRevenueTrends(req, res) {
        const days = parseInt(req.query.days || '30');
        res.json((0, pagination_1.successResponse)(await analytics_service_1.analyticsService.getRevenueTrends(sid(req), days)));
    }
    async getFuelMix(req, res) {
        const days = parseInt(req.query.days || '30');
        res.json((0, pagination_1.successResponse)(await analytics_service_1.analyticsService.getFuelMix(sid(req), days)));
    }
    async getDemandForecast(req, res) {
        res.json((0, pagination_1.successResponse)(await analytics_service_1.analyticsService.getDemandForecast(sid(req))));
    }
    async getPeakHours(req, res) {
        res.json((0, pagination_1.successResponse)(await analytics_service_1.analyticsService.getPeakHours(sid(req))));
    }
    async getRecommendations(req, res) {
        res.json((0, pagination_1.successResponse)(await analytics_service_1.analyticsService.getRecommendations(sid(req))));
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analytics.controller.js.map