import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { HTTP_STATUS } from '../../config/constants';
import { successResponse } from '../../utils/pagination';

const sid = (req: Request) => req.user!.role === 'SUPER_ADMIN' ? null : req.user!.stationId;
const getSid = (req: Request) => req.user!.stationId || (req.body.stationId as string);

export class InventoryController {
  // Tanks
  async getTanks(req: Request, res: Response) { res.json(await inventoryService.getTanks(req.query as any, req.user!)); }
  async getTankById(req: Request, res: Response) { res.json(successResponse(await inventoryService.getTankById(req.params.id, sid(req)))); }
  async createTank(req: Request, res: Response) { res.status(HTTP_STATUS.CREATED).json(successResponse(await inventoryService.createTank(req.body, getSid(req)), 'Tank created')); }
  async updateTank(req: Request, res: Response) { res.json(successResponse(await inventoryService.updateTank(req.params.id, req.body, sid(req)), 'Tank updated')); }
  async getSummary(req: Request, res: Response) { res.json(successResponse(await inventoryService.getSummary(sid(req)))); }

  // Refills
  async getRefills(req: Request, res: Response) { res.json(await inventoryService.getRefills(req.query as any, req.user!)); }
  async createRefill(req: Request, res: Response) { res.status(HTTP_STATUS.CREATED).json(successResponse(await inventoryService.createRefill(req.body, getSid(req)), 'Refill recorded')); }

  // Suppliers
  async getSuppliers(req: Request, res: Response) { res.json(await inventoryService.getSuppliers(req.query as any)); }
  async createSupplier(req: Request, res: Response) { res.status(HTTP_STATUS.CREATED).json(successResponse(await inventoryService.createSupplier(req.body), 'Supplier created')); }
  async updateSupplier(req: Request, res: Response) { res.json(successResponse(await inventoryService.updateSupplier(req.params.id, req.body), 'Supplier updated')); }
}

export const inventoryController = new InventoryController();
