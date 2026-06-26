import { Request, Response } from 'express';
import { salesService } from './sales.service';
import { HTTP_STATUS } from '../../config/constants';
import { successResponse } from '../../utils/pagination';

export class SalesController {
  async createSale(req: Request, res: Response) {
    const sale = await salesService.createSale(
      req.body,
      req.user!.id,
      req.body.stationId || req.user!.stationId || null
    );
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Sale created successfully',
      data: sale,
    });
  }

  async getSales(req: Request, res: Response) {
    const result = await salesService.getSales(req.query as any, req.user!);
    res.json(result);
  }

  async getSaleById(req: Request, res: Response) {
    const sale = await salesService.getSaleById(
      req.params.id,
      req.user!.role === 'SUPER_ADMIN' ? null : req.user!.stationId
    );
    res.json(successResponse(sale));
  }

  async voidSale(req: Request, res: Response) {
    const sale = await salesService.voidSale(
      req.params.id,
      req.body,
      req.user!.id,
      req.user!.role === 'SUPER_ADMIN' ? null : req.user!.stationId
    );
    res.json(successResponse(sale, 'Sale voided successfully'));
  }

  async getDailySummary(req: Request, res: Response) {
    const stationId = (req.query.stationId as string) || req.user!.stationId!;
    const summary = await salesService.getDailySummary(stationId);
    res.json(successResponse(summary));
  }
}

export const salesController = new SalesController();
