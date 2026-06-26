import { Request, Response } from 'express';
export declare class InventoryController {
    getTanks(req: Request, res: Response): Promise<void>;
    getTankById(req: Request, res: Response): Promise<void>;
    createTank(req: Request, res: Response): Promise<void>;
    updateTank(req: Request, res: Response): Promise<void>;
    getSummary(req: Request, res: Response): Promise<void>;
    getRefills(req: Request, res: Response): Promise<void>;
    createRefill(req: Request, res: Response): Promise<void>;
    getSuppliers(req: Request, res: Response): Promise<void>;
    createSupplier(req: Request, res: Response): Promise<void>;
    updateSupplier(req: Request, res: Response): Promise<void>;
}
export declare const inventoryController: InventoryController;
//# sourceMappingURL=inventory.controller.d.ts.map