"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'));
router.get('/daily', reports_controller_1.reportsController.getDaily.bind(reports_controller_1.reportsController));
router.get('/weekly', reports_controller_1.reportsController.getWeekly.bind(reports_controller_1.reportsController));
router.get('/monthly', reports_controller_1.reportsController.getMonthly.bind(reports_controller_1.reportsController));
router.get('/inventory', reports_controller_1.reportsController.getInventory.bind(reports_controller_1.reportsController));
exports.default = router;
//# sourceMappingURL=reports.router.js.map