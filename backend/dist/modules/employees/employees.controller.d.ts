import { Request, Response } from 'express';
export declare class EmployeesController {
    getAll(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    getAttendance(req: Request, res: Response): Promise<void>;
    checkIn(req: Request, res: Response): Promise<void>;
    checkOut(req: Request, res: Response): Promise<void>;
    getPayrollSummary(req: Request, res: Response): Promise<void>;
}
export declare const employeesController: EmployeesController;
//# sourceMappingURL=employees.controller.d.ts.map