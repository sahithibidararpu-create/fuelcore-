import { Router } from 'express';
import { salesController } from './sales.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireStationAccess } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createSaleSchema, saleQuerySchema, voidSaleSchema } from './sales.schemas';
import { auditLog } from '../../middleware/audit';

const router = Router();

router.use(authenticate);
router.use(requireStationAccess);

router.get('/', validate(saleQuerySchema, 'query'), salesController.getSales.bind(salesController));
router.get('/daily-summary', salesController.getDailySummary.bind(salesController));
router.get('/:id', salesController.getSaleById.bind(salesController));
router.post(
  '/',
  validate(createSaleSchema),
  auditLog('CREATE', 'Sale'),
  salesController.createSale.bind(salesController)
);
router.patch(
  '/:id/void',
  requireRole('SUPER_ADMIN', 'STATION_MANAGER'),
  validate(voidSaleSchema),
  auditLog('UPDATE', 'Sale'),
  salesController.voidSale.bind(salesController)
);

export default router;
