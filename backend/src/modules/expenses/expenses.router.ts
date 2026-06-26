import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireStationAccess } from '../../middleware/rbac';
import { auditLog } from '../../middleware/audit';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN', 'STATION_MANAGER'), requireStationAccess);

router.get('/', expensesController.getAll.bind(expensesController));
router.get('/summary', expensesController.getSummary.bind(expensesController));
router.get('/:id', expensesController.getById.bind(expensesController));
router.post('/', auditLog('CREATE', 'Expense'), expensesController.create.bind(expensesController));
router.patch('/:id', auditLog('UPDATE', 'Expense'), expensesController.update.bind(expensesController));
router.delete('/:id', auditLog('DELETE', 'Expense'), expensesController.delete.bind(expensesController));

export default router;
