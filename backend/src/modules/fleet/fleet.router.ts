import { Router } from 'express';
import { fleetController } from './fleet.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireStationAccess } from '../../middleware/rbac';
import { auditLog } from '../../middleware/audit';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'STATION_MANAGER'), requireStationAccess);

router.get('/accounts', fleetController.getAccounts.bind(fleetController));
router.get('/accounts/:id', fleetController.getAccountById.bind(fleetController));
router.get('/accounts/:id/transactions', fleetController.getTransactions.bind(fleetController));
router.post('/accounts', auditLog('CREATE', 'FleetAccount'), fleetController.createAccount.bind(fleetController));
router.patch('/accounts/:id', auditLog('UPDATE', 'FleetAccount'), fleetController.updateAccount.bind(fleetController));
router.post('/accounts/:id/payments', auditLog('CREATE', 'FleetPayment'), fleetController.recordPayment.bind(fleetController));

export default router;
