import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'STATION_MANAGER'));

router.get('/stats', dashboardController.getStats.bind(dashboardController));
router.get('/charts', dashboardController.getCharts.bind(dashboardController));
router.get('/recent-sales', dashboardController.getRecentSales.bind(dashboardController));
router.get('/alerts', dashboardController.getAlerts.bind(dashboardController));

export default router;
