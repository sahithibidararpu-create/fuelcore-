import { Request, Response } from 'express';
export declare class SettingsController {
    getSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateSettings(req: Request, res: Response): Promise<void>;
    updateStationProfile(req: Request, res: Response): Promise<void>;
    getFuelPrices(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateFuelPrices(req: Request, res: Response): Promise<void>;
    getAllStations(req: Request, res: Response): Promise<void>;
    createStation(req: Request, res: Response): Promise<void>;
}
export declare const settingsController: SettingsController;
//# sourceMappingURL=settings.controller.d.ts.map