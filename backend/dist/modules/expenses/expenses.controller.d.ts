import { Request, Response } from 'express';
export declare class ExpensesController {
    getAll(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    getSummary(req: Request, res: Response): Promise<void>;
}
export declare const expensesController: ExpensesController;
//# sourceMappingURL=expenses.controller.d.ts.map