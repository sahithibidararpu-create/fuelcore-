import { Request, Response } from 'express';
import { pumpsService } from './pumps.service';
import { HTTP_STATUS } from '../../config/constants';
import { successResponse } from '../../utils/pagination';

const stationId = (req: Request) =>
  req.user!.role === 'SUPER_ADMIN' ? null : req.user!.stationId;

export class PumpsController {
  async getAll(req: Request, res: Response) {
    const result = await pumpsService.getAll(req.query as Record<string, string>, req.user!);
    res.json(result);
  }

  async getById(req: Request, res: Response) {
    const pump = await pumpsService.getById(req.params.id, stationId(req));
    res.json(successResponse(pump));
  }

  async create(req: Request, res: Response) {
    const pump = await pumpsService.create(req.body, req.user!.stationId || req.body.stationId);
    res.status(HTTP_STATUS.CREATED).json(successResponse(pump, 'Pump created'));
  }

  async update(req: Request, res: Response) {
    const pump = await pumpsService.update(req.params.id, req.body, stationId(req));
    res.json(successResponse(pump, 'Pump updated'));
  }

  async delete(req: Request, res: Response) {
    await pumpsService.delete(req.params.id, stationId(req));
    res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  async getStatusSummary(req: Request, res: Response) {
    const data = await pumpsService.getStatusSummary(stationId(req));
    res.json(successResponse(data));
  }

  async getMeterHistory(req: Request, res: Response) {
    const data = await pumpsService.getMeterHistory(req.params.id, stationId(req));
    res.json(successResponse(data));
  }
}

export const pumpsController = new PumpsController();
