"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'));
router.get('/stats', dashboard_controller_1.dashboardController.getStats.bind(dashboard_controller_1.dashboardController));
router.get('/charts', dashboard_controller_1.dashboardController.getCharts.bind(dashboard_controller_1.dashboardController));
router.get('/recent-sales', dashboard_controller_1.dashboardController.getRecentSales.bind(dashboard_controller_1.dashboardController));
router.get('/alerts', dashboard_controller_1.dashboardController.getAlerts.bind(dashboard_controller_1.dashboardController));
exports.default = router;
//# sourceMappingURL=dashboard.router.js.map