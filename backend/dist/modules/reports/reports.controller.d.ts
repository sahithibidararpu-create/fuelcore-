import { Request, Response } from 'express';
export declare class ReportsController {
    getDaily(req: Request, res: Response): Promise<void>;
    getWeekly(req: Request, res: Response): Promise<void>;
    getMonthly(req: Request, res: Response): Promise<void>;
    getInventory(req: Request, res: Response): Promise<void>;
}
export declare const reportsController: ReportsController;
//# sourceMappingURL=reports.controller.d.ts.map