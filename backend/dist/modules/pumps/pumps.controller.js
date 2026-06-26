"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pumpsController = exports.PumpsController = void 0;
const pumps_service_1 = require("./pumps.service");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const stationId = (req) => req.user.role === 'SUPER_ADMIN' ? null : req.user.stationId;
class PumpsController {
    async getAll(req, res) {
        const result = await pumps_service_1.pumpsService.getAll(req.query, req.user);
        res.json(result);
    }
    async getById(req, res) {
        const pump = await pumps_service_1.pumpsService.getById(req.params.id, stationId(req));
        res.json((0, pagination_1.successResponse)(pump));
    }
    async create(req, res) {
        const pump = await pumps_service_1.pumpsService.create(req.body, req.user.stationId || req.body.stationId);
        res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(pump, 'Pump created'));
    }
    async update(req, res) {
        const pump = await pumps_service_1.pumpsService.update(req.params.id, req.body, stationId(req));
        res.json((0, pagination_1.successResponse)(pump, 'Pump updated'));
    }
    async delete(req, res) {
        await pumps_service_1.pumpsService.delete(req.params.id, stationId(req));
        res.status(constants_1.HTTP_STATUS.NO_CONTENT).send();
    }
    async getStatusSummary(req, res) {
        const data = await pumps_service_1.pumpsService.getStatusSummary(stationId(req));
        res.json((0, pagination_1.successResponse)(data));
    }
    async getMeterHistory(req, res) {
        const data = await pumps_service_1.pumpsService.getMeterHistory(req.params.id, stationId(req));
        res.json((0, pagination_1.successResponse)(data));
    }
}
exports.PumpsController = PumpsController;
exports.pumpsController = new PumpsController();
//# sourceMappingURL=pumps.controller.js.map