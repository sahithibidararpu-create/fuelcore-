"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
const pagination_1 = require("../../utils/pagination");
const sid = (req) => req.user.role === 'SUPER_ADMIN' ? req.query.stationId || null : req.user.stationId;
class ReportsController {
    async getDaily(req, res) {
        res.json((0, pagination_1.successResponse)(await reports_service_1.reportsService.getDaily(sid(req), req.query.date)));
    }
    async getWeekly(req, res) {
        res.json((0, pagination_1.successResponse)(await reports_service_1.reportsService.getWeekly(sid(req))));
    }
    async getMonthly(req, res) {
        const year = parseInt(req.query.year) || undefined;
        const month = parseInt(req.query.month) || undefined;
        res.json((0, pagination_1.successResponse)(await reports_service_1.reportsService.getMonthly(sid(req), year, month)));
    }
    async getInventory(req, res) {
        res.json((0, pagination_1.successResponse)(await reports_service_1.reportsService.getInventoryReport(sid(req))));
    }
}
exports.ReportsController = ReportsController;
exports.reportsController = new ReportsController();
//# sourceMappingURL=reports.controller.js.map