"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const audit_1 = require("../../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, rbac_1.requireStationAccess);
// Summary
router.get('/summary', inventory_controller_1.inventoryController.getSummary.bind(inventory_controller_1.inventoryController));
// Tanks
router.get('/tanks', inventory_controller_1.inventoryController.getTanks.bind(inventory_controller_1.inventoryController));
router.get('/tanks/:id', inventory_controller_1.inventoryController.getTankById.bind(inventory_controller_1.inventoryController));
router.post('/tanks', (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), (0, audit_1.auditLog)('CREATE', 'FuelTank'), inventory_controller_1.inventoryController.createTank.bind(inventory_controller_1.inventoryController));
router.patch('/tanks/:id', (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), (0, audit_1.auditLog)('UPDATE', 'FuelTank'), inventory_controller_1.inventoryController.updateTank.bind(inventory_controller_1.inventoryController));
// Refills
router.get('/refills', inventory_controller_1.inventoryController.getRefills.bind(inventory_controller_1.inventoryController));
router.post('/refills', (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), (0, audit_1.auditLog)('CREATE', 'FuelRefill'), inventory_controller_1.inventoryController.createRefill.bind(inventory_controller_1.inventoryController));
// Suppliers
router.get('/suppliers', inventory_controller_1.inventoryController.getSuppliers.bind(inventory_controller_1.inventoryController));
router.post('/suppliers', (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), inventory_controller_1.inventoryController.createSupplier.bind(inventory_controller_1.inventoryController));
router.patch('/suppliers/:id', (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), inventory_controller_1.inventoryController.updateSupplier.bind(inventory_controller_1.inventoryController));
exports.default = router;
//# sourceMappingURL=inventory.router.js.map