import { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { HTTP_STATUS } from '../../config/constants';
import { successResponse } from '../../utils/pagination';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class SettingsController {
  async getSettings(req: Request, res: Response) {
    let stationId = (req.query.stationId as string) || req.user!.stationId;
    if (!stationId) {
      const firstStation = await prisma.station.findFirst({ select: { id: true } });
      if (firstStation) stationId = firstStation.id;
    }

    if (!stationId) {
      return res.json(successResponse({
        id: '',
        stationId: '',
        station: { id: '', name: 'No Stations Configured', address: '', city: '', state: '', phone: '', email: '' },
        dieselPrice: 0, petrolPrice: 0, premiumPrice: 0, kerosenePrice: 0,
        lowStockThreshold: 500, criticalStockThreshold: 200,
      }));
    }

    res.json(successResponse(await settingsService.getStationSettings(stationId)));
  }

  async updateSettings(req: Request, res: Response) {
    let stationId = (req.body.stationId as string) || req.user!.stationId;
    if (!stationId) {
      const firstStation = await prisma.station.findFirst({ select: { id: true } });
      if (firstStation) stationId = firstStation.id;
    }

    if (!stationId) {
      throw new AppError('No stations configured to update settings', HTTP_STATUS.BAD_REQUEST);
    }

    res.json(successResponse(await settingsService.updateStationSettings(stationId, req.body)));
  }

  async updateStationProfile(req: Request, res: Response) {
    let stationId = (req.body.stationId as string) || req.user!.stationId;
    if (!stationId) {
      const firstStation = await prisma.station.findFirst({ select: { id: true } });
      if (firstStation) stationId = firstStation.id;
    }

    if (!stationId) {
      throw new AppError('No stations configured to update profile', HTTP_STATUS.BAD_REQUEST);
    }

    res.json(successResponse(await settingsService.updateStationProfile(stationId, req.body), 'Station profile updated'));
  }

  async getFuelPrices(req: Request, res: Response) {
    let stationId = (req.query.stationId as string) || req.user!.stationId;
    if (!stationId) {
      const firstStation = await prisma.station.findFirst({ select: { id: true } });
      if (firstStation) stationId = firstStation.id;
    }

    if (!stationId) {
      return res.json(successResponse({
        DIESEL: 0,
        PETROL: 0,
        PREMIUM: 0,
        KEROSENE: 0,
      }));
    }

    res.json(successResponse(await settingsService.getFuelPrices(stationId)));
  }

  async updateFuelPrices(req: Request, res: Response) {
    let stationId = (req.body.stationId as string) || req.user!.stationId;
    if (!stationId) {
      const firstStation = await prisma.station.findFirst({ select: { id: true } });
      if (firstStation) stationId = firstStation.id;
    }

    if (!stationId) {
      throw new AppError('No stations configured to update fuel prices', HTTP_STATUS.BAD_REQUEST);
    }

    res.json(successResponse(await settingsService.updateFuelPrices(stationId, req.body.prices), 'Fuel prices updated'));
  }

  async getAllStations(req: Request, res: Response) {
    res.json(successResponse(await settingsService.getAllStations()));
  }

  async createStation(req: Request, res: Response) {
    const station = await settingsService.createStation(req.body);
    res.status(HTTP_STATUS.CREATED).json(successResponse(station, 'Station created'));
  }
}

export const settingsController = new SettingsController();
