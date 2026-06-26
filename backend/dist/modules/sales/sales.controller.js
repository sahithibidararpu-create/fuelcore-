"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesController = exports.SalesController = void 0;
const sales_service_1 = require("./sales.service");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
class SalesController {
    async createSale(req, res) {
        const sale = await sales_service_1.salesService.createSale(req.body, req.user.id, req.body.stationId || req.user.stationId);
        res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Sale created successfully',
            data: sale,
        });
    }
    async getSales(req, res) {
        const result = await sales_service_1.salesService.getSales(req.query, req.user);
        res.json(result);
    }
    async getSaleById(req, res) {
        const sale = await sales_service_1.salesService.getSaleById(req.params.id, req.user.role === 'SUPER_ADMIN' ? null : req.user.stationId);
        res.json((0, pagination_1.successResponse)(sale));
    }
    async voidSale(req, res) {
        const sale = await sales_service_1.salesService.voidSale(req.params.id, req.body, req.user.id, req.user.role === 'SUPER_ADMIN' ? null : req.user.stationId);
        res.json((0, pagination_1.successResponse)(sale, 'Sale voided successfully'));
    }
    async getDailySummary(req, res) {
        const stationId = req.query.stationId || req.user.stationId;
        const summary = await sales_service_1.salesService.getDailySummary(stationId);
        res.json((0, pagination_1.successResponse)(summary));
    }
}
exports.SalesController = SalesController;
exports.salesController = new SalesController();
//# sourceMappingURL=sales.controller.js.map