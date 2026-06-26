import { Request, Response } from 'express';
import { reportsService } from './reports.service';
import { successResponse } from '../../utils/pagination';

const sid = (req: Request) => req.user!.role === 'SUPER_ADMIN' ? (req.query.stationId as string | null) || null : req.user!.stationId;

export class ReportsController {
  async getDaily(req: Request, res: Response) {
    res.json(successResponse(await reportsService.getDaily(sid(req), req.query.date as string)));
  }
  async getWeekly(req: Request, res: Response) {
    res.json(successResponse(await reportsService.getWeekly(sid(req))));
  }
  async getMonthly(req: Request, res: Response) {
    const year = parseInt(req.query.year as string) || undefined;
    const month = parseInt(req.query.month as string) || undefined;
    res.json(successResponse(await reportsService.getMonthly(sid(req), year, month)));
  }
  async getInventory(req: Request, res: Response) {
    res.json(successResponse(await reportsService.getInventoryReport(sid(req))));
  }
}

export const reportsController = new ReportsController();
