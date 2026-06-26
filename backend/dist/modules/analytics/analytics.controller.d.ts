import { Request, Response } from 'express';
export declare class AnalyticsController {
    getRevenueTrends(req: Request, res: Response): Promise<void>;
    getFuelMix(req: Request, res: Response): Promise<void>;
    getDemandForecast(req: Request, res: Response): Promise<void>;
    getPeakHours(req: Request, res: Response): Promise<void>;
    getRecommendations(req: Request, res: Response): Promise<void>;
}
export declare const analyticsController: AnalyticsController;
//# sourceMappingURL=analytics.controller.d.ts.map