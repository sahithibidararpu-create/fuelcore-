import { Request, Response } from 'express';
import { expensesService } from './expenses.service';
import { HTTP_STATUS } from '../../config/constants';
import { successResponse } from '../../utils/pagination';

const sid = (req: Request) => req.user!.role === 'SUPER_ADMIN' ? null : req.user!.stationId;

export class ExpensesController {
  async getAll(req: Request, res: Response) { res.json(await expensesService.getAll(req.query as any, req.user!)); }
  async getById(req: Request, res: Response) { res.json(successResponse(await expensesService.getById(req.params.id, sid(req)))); }
  async create(req: Request, res: Response) {
    const expense = await expensesService.create(req.body, req.user!.stationId || req.body.stationId);
    res.status(HTTP_STATUS.CREATED).json(successResponse(expense, 'Expense recorded'));
  }
  async update(req: Request, res: Response) { res.json(successResponse(await expensesService.update(req.params.id, req.body, sid(req)), 'Expense updated')); }
  async delete(req: Request, res: Response) {
    await expensesService.delete(req.params.id, sid(req));
    res.status(HTTP_STATUS.NO_CONTENT).send();
  }
  async getSummary(req: Request, res: Response) {
    const data = await expensesService.getSummary(sid(req), req.query.from as string, req.query.to as string);
    res.json(successResponse(data));
  }
}

export const expensesController = new ExpensesController();
