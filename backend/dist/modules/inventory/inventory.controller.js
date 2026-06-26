"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const inventory_service_1 = require("./inventory.service");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const sid = (req) => req.user.role === 'SUPER_ADMIN' ? null : req.user.stationId;
const getSid = (req) => req.user.stationId || req.body.stationId;
class InventoryController {
    // Tanks
    async getTanks(req, res) { res.json(await inventory_service_1.inventoryService.getTanks(req.query, req.user)); }
    async getTankById(req, res) { res.json((0, pagination_1.successResponse)(await inventory_service_1.inventoryService.getTankById(req.params.id, sid(req)))); }
    async createTank(req, res) { res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(await inventory_service_1.inventoryService.createTank(req.body, getSid(req)), 'Tank created')); }
    async updateTank(req, res) { res.json((0, pagination_1.successResponse)(await inventory_service_1.inventoryService.updateTank(req.params.id, req.body, sid(req)), 'Tank updated')); }
    async getSummary(req, res) { res.json((0, pagination_1.successResponse)(await inventory_service_1.inventoryService.getSummary(sid(req)))); }
    // Refills
    async getRefills(req, res) { res.json(await inventory_service_1.inventoryService.getRefills(req.query, req.user)); }
    async createRefill(req, res) { res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(await inventory_service_1.inventoryService.createRefill(req.body, getSid(req)), 'Refill recorded')); }
    // Suppliers
    async getSuppliers(req, res) { res.json(await inventory_service_1.inventoryService.getSuppliers(req.query)); }
    async createSupplier(req, res) { res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(await inventory_service_1.inventoryService.createSupplier(req.body), 'Supplier created')); }
    async updateSupplier(req, res) { res.json((0, pagination_1.successResponse)(await inventory_service_1.inventoryService.updateSupplier(req.params.id, req.body), 'Supplier updated')); }
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map