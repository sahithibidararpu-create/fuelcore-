import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', notificationsController.getAll.bind(notificationsController));
router.get('/unread-count', notificationsController.getUnreadCount.bind(notificationsController));
router.get('/stream', notificationsController.stream.bind(notificationsController));
router.patch('/:id/read', notificationsController.markRead.bind(notificationsController));
router.patch('/read-all', notificationsController.markAllRead.bind(notificationsController));
router.delete('/:id', notificationsController.delete.bind(notificationsController));

export default router;
