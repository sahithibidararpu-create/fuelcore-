import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { successResponse } from '../../utils/pagination';

const getStationId = (req: Request) =>
  req.user!.role === 'SUPER_ADMIN'
    ? (req.query.stationId as string | null) || null
    : req.user!.stationId;

export class DashboardController {
  async getStats(req: Request, res: Response) {
    const data = await dashboardService.getStats(getStationId(req));
    res.json(successResponse(data));
  }

  async getCharts(req: Request, res: Response) {
    const days = parseInt((req.query.days as string) || '30');
    const data = await dashboardService.getCharts(getStationId(req), days);
    res.json(successResponse(data));
  }

  async getRecentSales(req: Request, res: Response) {
    const data = await dashboardService.getRecentSales(getStationId(req));
    res.json(successResponse(data));
  }

  async getAlerts(req: Request, res: Response) {
    const data = await dashboardService.getAlerts(getStationId(req));
    res.json(successResponse(data));
  }
}

export const dashboardController = new DashboardController();
