"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_controller_1 = require("./sales.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const sales_schemas_1 = require("./sales.schemas");
const audit_1 = require("../../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(rbac_1.requireStationAccess);
router.get('/', (0, validate_1.validate)(sales_schemas_1.saleQuerySchema, 'query'), sales_controller_1.salesController.getSales.bind(sales_controller_1.salesController));
router.get('/daily-summary', sales_controller_1.salesController.getDailySummary.bind(sales_controller_1.salesController));
router.get('/:id', sales_controller_1.salesController.getSaleById.bind(sales_controller_1.salesController));
router.post('/', (0, validate_1.validate)(sales_schemas_1.createSaleSchema), (0, audit_1.auditLog)('CREATE', 'Sale'), sales_controller_1.salesController.createSale.bind(sales_controller_1.salesController));
router.patch('/:id/void', (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), (0, validate_1.validate)(sales_schemas_1.voidSaleSchema), (0, audit_1.auditLog)('UPDATE', 'Sale'), sales_controller_1.salesController.voidSale.bind(sales_controller_1.salesController));
exports.default = router;
//# sourceMappingURL=sales.router.js.map