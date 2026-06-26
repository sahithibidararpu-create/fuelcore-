import { Router } from 'express';
import { employeesController } from './employees.controller';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireStationAccess } from '../../middleware/rbac';
import { auditLog } from '../../middleware/audit';
import { validate } from '../../middleware/validate';
import { createEmployeeSchema } from './employees.schemas';

const router = Router();
router.use(authenticate, requireStationAccess);

router.get('/', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), employeesController.getAll.bind(employeesController));
router.get('/attendance', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), employeesController.getAttendance.bind(employeesController));
router.post('/attendance/check-in', employeesController.checkIn.bind(employeesController));
router.post('/attendance/check-out', employeesController.checkOut.bind(employeesController));
router.get('/:id', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), employeesController.getById.bind(employeesController));
router.get('/:id/payroll-summary', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), employeesController.getPayrollSummary.bind(employeesController));
router.post('/', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), validate(createEmployeeSchema), auditLog('CREATE', 'Employee'), employeesController.create.bind(employeesController));
router.patch('/:id', requireRole('SUPER_ADMIN', 'STATION_MANAGER'), auditLog('UPDATE', 'Employee'), employeesController.update.bind(employeesController));

export default router;
