import { Request, Response } from 'express';
export declare class PumpsController {
    getAll(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    getStatusSummary(req: Request, res: Response): Promise<void>;
    getMeterHistory(req: Request, res: Response): Promise<void>;
}
export declare const pumpsController: PumpsController;
//# sourceMappingURL=pumps.controller.d.ts.map