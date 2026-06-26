import { Request, Response } from 'express';
import { fleetService } from './fleet.service';
import { HTTP_STATUS } from '../../config/constants';
import { successResponse } from '../../utils/pagination';

const sid = (req: Request) => req.user!.role === 'SUPER_ADMIN' ? null : req.user!.stationId;

export class FleetController {
  async getAccounts(req: Request, res: Response) { res.json(await fleetService.getAccounts(req.query as any, req.user!)); }
  async getAccountById(req: Request, res: Response) { res.json(successResponse(await fleetService.getAccountById(req.params.id, sid(req)))); }
  async createAccount(req: Request, res: Response) {
    const acc = await fleetService.createAccount(req.body, req.user!.stationId || req.body.stationId);
    res.status(HTTP_STATUS.CREATED).json(successResponse(acc, 'Fleet account created'));
  }
  async updateAccount(req: Request, res: Response) { res.json(successResponse(await fleetService.updateAccount(req.params.id, req.body, sid(req)), 'Account updated')); }
  async recordPayment(req: Request, res: Response) {
    const { amount, reference, notes } = req.body;
    const payment = await fleetService.recordPayment(req.params.id, amount, reference, notes, sid(req));
    res.status(HTTP_STATUS.CREATED).json(successResponse(payment, 'Payment recorded'));
  }
  async getTransactions(req: Request, res: Response) {
    res.json(successResponse(await fleetService.getTransactions(req.params.id, req.query as any, sid(req))));
  }
}

export const fleetController = new FleetController();
