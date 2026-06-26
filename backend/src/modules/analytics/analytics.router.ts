import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'STATION_MANAGER'));

router.get('/revenue-trends', analyticsController.getRevenueTrends.bind(analyticsController));
router.get('/fuel-mix', analyticsController.getFuelMix.bind(analyticsController));
router.get('/demand-forecast', analyticsController.getDemandForecast.bind(analyticsController));
router.get('/peak-hours', analyticsController.getPeakHours.bind(analyticsController));
router.get('/recommendations', analyticsController.getRecommendations.bind(analyticsController));

export default router;
