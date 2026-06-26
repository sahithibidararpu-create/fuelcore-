import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireStationAccess } from '../../middleware/rbac';
import { auditLog } from '../../middleware/audit';

const router = Router();
router.use(authenticate, requireStationAccess);

// Summary
router.get('/summary', inventoryController.getSummary.bind(inventoryController));

// Tanks
router.get('/tanks', inventoryController.getTanks.bind(inventoryController));
router.get('/tanks/:id', inventoryController.getTankById.bind(inventoryController));
router.post('/tanks', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), auditLog('CREATE', 'FuelTank'), inventoryController.createTank.bind(inventoryController));
router.patch('/tanks/:id', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), auditLog('UPDATE', 'FuelTank'), inventoryController.updateTank.bind(inventoryController));

// Refills
router.get('/refills', inventoryController.getRefills.bind(inventoryController));
router.post('/refills', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), auditLog('CREATE', 'FuelRefill'), inventoryController.createRefill.bind(inventoryController));

// Suppliers
router.get('/suppliers', inventoryController.getSuppliers.bind(inventoryController));
router.post('/suppliers', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), inventoryController.createSupplier.bind(inventoryController));
router.patch('/suppliers/:id', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), inventoryController.updateSupplier.bind(inventoryController));

export default router;
