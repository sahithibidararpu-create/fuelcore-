import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { successResponse } from '../../utils/pagination';

const sid = (req: Request) => req.user!.role === 'SUPER_ADMIN' ? (req.query.stationId as string | null) || null : req.user!.stationId;

export class AnalyticsController {
  async getRevenueTrends(req: Request, res: Response) {
    const days = parseInt((req.query.days as string) || '30');
    res.json(successResponse(await analyticsService.getRevenueTrends(sid(req), days)));
  }
  async getFuelMix(req: Request, res: Response) {
    const days = parseInt((req.query.days as string) || '30');
    res.json(successResponse(await analyticsService.getFuelMix(sid(req), days)));
  }
  async getDemandForecast(req: Request, res: Response) {
    res.json(successResponse(await analyticsService.getDemandForecast(sid(req))));
  }
  async getPeakHours(req: Request, res: Response) {
    res.json(successResponse(await analyticsService.getPeakHours(sid(req))));
  }
  async getRecommendations(req: Request, res: Response) {
    res.json(successResponse(await analyticsService.getRecommendations(sid(req))));
  }
}

export const analyticsController = new AnalyticsController();
