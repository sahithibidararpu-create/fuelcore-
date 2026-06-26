"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeesController = exports.EmployeesController = void 0;
const employees_service_1 = require("./employees.service");
const constants_1 = require("../../config/constants");
const pagination_1 = require("../../utils/pagination");
const errorHandler_1 = require("../../middleware/errorHandler");
const sid = (req) => req.user.role === 'SUPER_ADMIN' ? null : req.user.stationId;
class EmployeesController {
    async getAll(req, res) { res.json(await employees_service_1.employeesService.getAll(req.query, req.user)); }
    async getById(req, res) { res.json((0, pagination_1.successResponse)(await employees_service_1.employeesService.getById(req.params.id, sid(req)))); }
    async create(req, res) {
        if (req.user.role === 'STATION_MANAGER') {
            if (req.body.role === 'SUPER_ADMIN') {
                throw new errorHandler_1.AppError('Forbidden: Station Managers cannot create Super Admin accounts', constants_1.HTTP_STATUS.FORBIDDEN);
            }
            if (req.body.stationId && req.body.stationId !== req.user.stationId) {
                throw new errorHandler_1.AppError('Forbidden: Station Managers can only assign employees to their own station', constants_1.HTTP_STATUS.FORBIDDEN);
            }
        }
        const emp = await employees_service_1.employeesService.createEmployee(req.body, req.user.stationId || req.body.stationId);
        res.status(constants_1.HTTP_STATUS.CREATED).json((0, pagination_1.successResponse)(emp, 'Employee created'));
    }
    async update(req, res) { res.json((0, pagination_1.successResponse)(await employees_service_1.employeesService.updateEmployee(req.params.id, req.body, sid(req)), 'Employee updated')); }
    async getAttendance(req, res) { res.json(await employees_service_1.employeesService.getAttendance(req.query, sid(req))); }
    async checkIn(req, res) { res.json((0, pagination_1.successResponse)(await employees_service_1.employeesService.checkIn(req.user.id), 'Checked in successfully')); }
    async checkOut(req, res) { res.json((0, pagination_1.successResponse)(await employees_service_1.employeesService.checkOut(req.user.id), 'Checked out successfully')); }
    async getPayrollSummary(req, res) { res.json((0, pagination_1.successResponse)(await employees_service_1.employeesService.getPayrollSummary(req.params.id, sid(req)))); }
}
exports.EmployeesController = EmployeesController;
exports.employeesController = new EmployeesController();
//# sourceMappingURL=employees.controller.js.map