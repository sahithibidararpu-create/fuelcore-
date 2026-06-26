import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { auditLog } from '../../middleware/audit';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'STATION_MANAGER'));

router.get('/', settingsController.getSettings.bind(settingsController));
router.patch('/', auditLog('UPDATE', 'StationSettings'), settingsController.updateSettings.bind(settingsController));
router.patch('/station-profile', auditLog('UPDATE', 'Station'), settingsController.updateStationProfile.bind(settingsController));
router.get('/fuel-prices', settingsController.getFuelPrices.bind(settingsController));
router.patch('/fuel-prices', auditLog('UPDATE', 'FuelPrices'), settingsController.updateFuelPrices.bind(settingsController));
router.get('/stations', requireRole('SUPER_ADMIN'), settingsController.getAllStations.bind(settingsController));
router.post('/stations', requireRole('SUPER_ADMIN'), auditLog('CREATE', 'Station'), settingsController.createStation.bind(settingsController));

export default router;
