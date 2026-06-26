"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
const pagination_1 = require("../../utils/pagination");
const constants_1 = require("../../config/constants");
class NotificationsController {
    async getAll(req, res) {
        res.json(await notifications_service_1.notificationService.getAll(req.query, req.user.id));
    }
    async getUnreadCount(req, res) {
        const count = await notifications_service_1.notificationService.getUnreadCount(req.user.id);
        res.json((0, pagination_1.successResponse)({ count }));
    }
    async markRead(req, res) {
        await notifications_service_1.notificationService.markRead(req.params.id, req.user.id);
        res.json({ success: true, message: 'Marked as read' });
    }
    async markAllRead(req, res) {
        await notifications_service_1.notificationService.markAllRead(req.user.id);
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    async delete(req, res) {
        await notifications_service_1.notificationService.delete(req.params.id, req.user.id);
        res.status(204).send();
    }
    // SSE Stream
    stream(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });
        const userId = req.user.id;
        const stationId = req.user.stationId;
        notifications_service_1.notificationService.registerClient(userId, res, stationId);
        // Heartbeat
        const heartbeat = setInterval(() => {
            res.write(':heartbeat\n\n');
        }, constants_1.CONSTANTS.SSE_HEARTBEAT_INTERVAL_MS);
        // Send initial connected event
        res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);
        req.on('close', () => {
            clearInterval(heartbeat);
            notifications_service_1.notificationService.unregisterClient(userId);
        });
    }
}
exports.NotificationsController = NotificationsController;
exports.notificationsController = new NotificationsController();
//# sourceMappingURL=notifications.controller.js.map