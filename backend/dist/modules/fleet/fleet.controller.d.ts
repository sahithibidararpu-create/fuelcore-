import { Request, Response } from 'express';
export declare class FleetController {
    getAccounts(req: Request, res: Response): Promise<void>;
    getAccountById(req: Request, res: Response): Promise<void>;
    createAccount(req: Request, res: Response): Promise<void>;
    updateAccount(req: Request, res: Response): Promise<void>;
    recordPayment(req: Request, res: Response): Promise<void>;
    getTransactions(req: Request, res: Response): Promise<void>;
}
export declare const fleetController: FleetController;
//# sourceMappingURL=fleet.controller.d.ts.map