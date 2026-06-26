"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("./notifications.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', notifications_controller_1.notificationsController.getAll.bind(notifications_controller_1.notificationsController));
router.get('/unread-count', notifications_controller_1.notificationsController.getUnreadCount.bind(notifications_controller_1.notificationsController));
router.get('/stream', notifications_controller_1.notificationsController.stream.bind(notifications_controller_1.notificationsController));
router.patch('/:id/read', notifications_controller_1.notificationsController.markRead.bind(notifications_controller_1.notificationsController));
router.patch('/read-all', notifications_controller_1.notificationsController.markAllRead.bind(notifications_controller_1.notificationsController));
router.delete('/:id', notifications_controller_1.notificationsController.delete.bind(notifications_controller_1.notificationsController));
exports.default = router;
//# sourceMappingURL=notifications.router.js.map