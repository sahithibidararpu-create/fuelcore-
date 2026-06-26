"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenses_controller_1 = require("./expenses.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const audit_1 = require("../../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, rbac_1.requireRole)('SUPER_ADMIN', 'STATION_MANAGER'), rbac_1.requireStationAccess);
router.get('/', expenses_controller_1.expensesController.getAll.bind(expenses_controller_1.expensesController));
router.get('/summary', expenses_controller_1.expensesController.getSummary.bind(expenses_controller_1.expensesController));
router.get('/:id', expenses_controller_1.expensesController.getById.bind(expenses_controller_1.expensesController));
router.post('/', (0, audit_1.auditLog)('CREATE', 'Expense'), expenses_controller_1.expensesController.create.bind(expenses_controller_1.expensesController));
router.patch('/:id', (0, audit_1.auditLog)('UPDATE', 'Expense'), expenses_controller_1.expensesController.update.bind(expenses_controller_1.expensesController));
router.delete('/:id', (0, audit_1.auditLog)('DELETE', 'Expense'), expenses_controller_1.expensesController.delete.bind(expenses_controller_1.expensesController));
exports.default = router;
//# sourceMappingURL=expenses.router.js.map