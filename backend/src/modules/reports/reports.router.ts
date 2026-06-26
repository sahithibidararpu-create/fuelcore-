import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'STATION_MANAGER'));

router.get('/daily', reportsController.getDaily.bind(reportsController));
router.get('/weekly', reportsController.getWeekly.bind(reportsController));
router.get('/monthly', reportsController.getMonthly.bind(reportsController));
router.get('/inventory', reportsController.getInventory.bind(reportsController));

export default router;
