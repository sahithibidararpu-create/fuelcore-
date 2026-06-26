"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fleet_controller_1 = require("./fleet.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const audit_1 = require("../../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), rbac_1.requireStationAccess);
router.get('/accounts', fleet_controller_1.fleetController.getAccounts.bind(fleet_controller_1.fleetController));
router.get('/accounts/:id', fleet_controller_1.fleetController.getAccountById.bind(fleet_controller_1.fleetController));
router.get('/accounts/:id/transactions', fleet_controller_1.fleetController.getTransactions.bind(fleet_controller_1.fleetController));
router.post('/accounts', (0, audit_1.auditLog)('CREATE', 'FleetAccount'), fleet_controller_1.fleetController.createAccount.bind(fleet_controller_1.fleetController));
router.patch('/accounts/:id', (0, audit_1.auditLog)('UPDATE', 'FleetAccount'), fleet_controller_1.fleetController.updateAccount.bind(fleet_controller_1.fleetController));
router.post('/accounts/:id/payments', (0, audit_1.auditLog)('CREATE', 'FleetPayment'), fleet_controller_1.fleetController.recordPayment.bind(fleet_controller_1.fleetController));
exports.default = router;
//# sourceMappingURL=fleet.router.js.map