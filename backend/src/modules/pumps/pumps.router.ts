import { Router } from 'express';
import { pumpsController } from './pumps.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireStationAccess } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createPumpSchema, updatePumpSchema, pumpQuerySchema } from './pumps.schemas';
import { auditLog } from '../../middleware/audit';

const router = Router();
router.use(authenticate);
router.use(requireStationAccess);

router.get('/', validate(pumpQuerySchema, 'query'), pumpsController.getAll.bind(pumpsController));
router.get('/status', pumpsController.getStatusSummary.bind(pumpsController));
router.get('/:id', pumpsController.getById.bind(pumpsController));
router.get('/:id/meter-history', pumpsController.getMeterHistory.bind(pumpsController));
router.post('/', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), validate(createPumpSchema), auditLog('CREATE', 'Pump'), pumpsController.create.bind(pumpsController));
router.patch('/:id', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), validate(updatePumpSchema), auditLog('UPDATE', 'Pump'), pumpsController.update.bind(pumpsController));
router.delete('/:id', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), auditLog('DELETE', 'Pump'), pumpsController.delete.bind(pumpsController));

export default router;
