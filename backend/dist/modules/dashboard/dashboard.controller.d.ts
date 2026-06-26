import { Request, Response } from 'express';
export declare class DashboardController {
    getStats(req: Request, res: Response): Promise<void>;
    getCharts(req: Request, res: Response): Promise<void>;
    getRecentSales(req: Request, res: Response): Promise<void>;
    getAlerts(req: Request, res: Response): Promise<void>;
}
export declare const dashboardController: DashboardController;
//# sourceMappingURL=dashboard.controller.d.ts.map