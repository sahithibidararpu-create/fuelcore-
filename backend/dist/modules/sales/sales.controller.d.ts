import { Request, Response } from 'express';
export declare class SalesController {
    createSale(req: Request, res: Response): Promise<void>;
    getSales(req: Request, res: Response): Promise<void>;
    getSaleById(req: Request, res: Response): Promise<void>;
    voidSale(req: Request, res: Response): Promise<void>;
    getDailySummary(req: Request, res: Response): Promise<void>;
}
export declare const salesController: SalesController;
//# sourceMappingURL=sales.controller.d.ts.map