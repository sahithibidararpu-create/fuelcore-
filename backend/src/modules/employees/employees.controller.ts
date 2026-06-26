import { Request, Response } from 'express';
import { employeesService } from './employees.service';
import { HTTP_STATUS } from '../../config/constants';
import { successResponse } from '../../utils/pagination';
import { AppError } from '../../middleware/errorHandler';

const sid = (req: Request) => req.user!.role === 'SUPER_ADMIN' ? null : req.user!.stationId;

export class EmployeesController {
  async getAll(req: Request, res: Response) { res.json(await employeesService.getAll(req.query as any, req.user!)); }
  async getById(req: Request, res: Response) { res.json(successResponse(await employeesService.getById(req.params.id, sid(req)))); }
  async create(req: Request, res: Response) {
    if (req.user!.role === 'STATION_MANAGER') {
      if (req.body.role === 'SUPER_ADMIN') {
        throw new AppError('Forbidden: Station Managers cannot create Super Admin accounts', HTTP_STATUS.FORBIDDEN);
      }
      if (req.body.stationId && req.body.stationId !== req.user!.stationId) {
        throw new AppError('Forbidden: Station Managers can only assign employees to their own station', HTTP_STATUS.FORBIDDEN);
      }
    }
    const emp = await employeesService.createEmployee(req.body, req.user!.stationId || req.body.stationId);
    res.status(HTTP_STATUS.CREATED).json(successResponse(emp, 'Employee created'));
  }
  async update(req: Request, res: Response) { res.json(successResponse(await employeesService.updateEmployee(req.params.id, req.body, sid(req)), 'Employee updated')); }
  async getAttendance(req: Request, res: Response) { res.json(await employeesService.getAttendance(req.query as any, sid(req))); }
  async checkIn(req: Request, res: Response) { res.json(successResponse(await employeesService.checkIn(req.user!.id), 'Checked in successfully')); }
  async checkOut(req: Request, res: Response) { res.json(successResponse(await employeesService.checkOut(req.user!.id), 'Checked out successfully')); }
  async getPayrollSummary(req: Request, res: Response) { res.json(successResponse(await employeesService.getPayrollSummary(req.params.id, sid(req)))); }
}

export const employeesController = new EmployeesController();
