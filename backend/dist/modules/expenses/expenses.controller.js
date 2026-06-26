"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesController = exports.ExpensesController = void 0;
const expenses_service_1 = require("./expenses.service");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const sid = (req) => req.user.role === 'SUPER_ADMIN' ? null : req.user.stationId;
class ExpensesController {
    async getAll(req, res) { res.json(await expenses_service_1.expensesService.getAll(req.query, req.user)); }
    async getById(req, res) { res.json((0, pagination_1.successResponse)(await expenses_service_1.expensesService.getById(req.params.id, sid(req)))); }
    async create(req, res) {
        const expense = await expenses_service_1.expensesService.create(req.body, req.user.stationId || req.body.stationId);
        res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(expense, 'Expense recorded'));
    }
    async update(req, res) { res.json((0, pagination_1.successResponse)(await expenses_service_1.expensesService.update(req.params.id, req.body, sid(req)), 'Expense updated')); }
    async delete(req, res) {
        await expenses_service_1.expensesService.delete(req.params.id, sid(req));
        res.status(constants_1.HTTP_STATUS.NO_CONTENT).send();
    }
    async getSummary(req, res) {
        const data = await expenses_service_1.expensesService.getSummary(sid(req), req.query.from, req.query.to);
        res.json((0, pagination_1.successResponse)(data));
    }
}
exports.ExpensesController = ExpensesController;
exports.expensesController = new ExpensesController();
//# sourceMappingURL=expenses.controller.js.map