"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fleetController = exports.FleetController = void 0;
const fleet_service_1 = require("./fleet.service");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const sid = (req) => req.user.role === 'SUPER_ADMIN' ? null : req.user.stationId;
class FleetController {
    async getAccounts(req, res) { res.json(await fleet_service_1.fleetService.getAccounts(req.query, req.user)); }
    async getAccountById(req, res) { res.json((0, pagination_1.successResponse)(await fleet_service_1.fleetService.getAccountById(req.params.id, sid(req)))); }
    async createAccount(req, res) {
        const acc = await fleet_service_1.fleetService.createAccount(req.body, req.user.stationId || req.body.stationId);
        res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(acc, 'Fleet account created'));
    }
    async updateAccount(req, res) { res.json((0, pagination_1.successResponse)(await fleet_service_1.fleetService.updateAccount(req.params.id, req.body, sid(req)), 'Account updated')); }
    async recordPayment(req, res) {
        const { amount, reference, notes } = req.body;
        const payment = await fleet_service_1.fleetService.recordPayment(req.params.id, amount, reference, notes, sid(req));
        res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(payment, 'Payment recorded'));
    }
    async getTransactions(req, res) {
        res.json((0, pagination_1.successResponse)(await fleet_service_1.fleetService.getTransactions(req.params.id, req.query, sid(req))));
    }
}
exports.FleetController = FleetController;
exports.fleetController = new FleetController();
//# sourceMappingURL=fleet.controller.js.map