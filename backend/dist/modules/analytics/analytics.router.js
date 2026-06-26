"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'));
router.get('/revenue-trends', analytics_controller_1.analyticsController.getRevenueTrends.bind(analytics_controller_1.analyticsController));
router.get('/fuel-mix', analytics_controller_1.analyticsController.getFuelMix.bind(analytics_controller_1.analyticsController));
router.get('/demand-forecast', analytics_controller_1.analyticsController.getDemandForecast.bind(analytics_controller_1.analyticsController));
router.get('/peak-hours', analytics_controller_1.analyticsController.getPeakHours.bind(analytics_controller_1.analyticsController));
router.get('/recommendations', analytics_controller_1.analyticsController.getRecommendations.bind(analytics_controller_1.analyticsController));
exports.default = router;
//# sourceMappingURL=analytics.router.js.map