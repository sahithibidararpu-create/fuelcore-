"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationsService = void 0;
const database_1 = require("../../config/database");
const pagination_1 = require("../../utils/pagination");
const logger_1 = require("../../config/logger");
// SSE client registry
const sseClients = new Map();
class NotificationsService {
    // Register SSE client
    registerClient(userId, res, stationId) {
        sseClients.set(userId, { res, stationId });
        logger_1.logger.info(`SSE client registered: ${userId}`);
    }
    // Unregister SSE client
    unregisterClient(userId) {
        sseClients.delete(userId);
        logger_1.logger.info(`SSE client unregistered: ${userId}`);
    }
    // Emit to specific user
    emitToUser(userId, event, data) {
        const client = sseClients.get(userId);
        if (client) {
            client.res.write(`event: ${event}\n`);
            client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    }
    // Emit to all users in a station
    emitToStation(stationId, event, data) {
        for (const [, client] of sseClients) {
            if (client.stationId === stationId || !client.stationId) {
                client.res.write(`event: ${event}\n`);
                client.res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
        }
    }
    async getAll(query, userId) {
        const { page, limit, skip } = (0, pagination_1.parsePagination)(query);
        const where = {
            userId,
            ...(query.unread === 'true' && { isRead: false }),
        };
        const [total, data] = await Promise.all([
            database_1.prisma.notification.count({ where }),
            database_1.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
            }),
        ]);
        return (0, pagination_1.paginatedResponse)(data, total, page, limit);
    }
    async markRead(id, userId) {
        return database_1.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllRead(userId) {
        return database_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async delete(id, userId) {
        return database_1.prisma.notification.deleteMany({ where: { id, userId } });
    }
    async getUnreadCount(userId) {
        return database_1.prisma.notification.count({ where: { userId, isRead: false } });
    }
    async createSystemNotification(stationId, title, message, type, priority = 'MEDIUM') {
        // Find all managers/admins for this station
        const users = await database_1.prisma.user.findMany({
            where: {
                isActive: true,
                OR: [
                    { stationId, role: 'STATION_MANAGER' },
                    { role: 'SUPER_ADMIN' },
                ],
            },
            select: { id: true },
        });
        const notifications = await database_1.prisma.notification.createMany({
            data: users.map((u) => ({
                userId: u.id,
                title,
                message,
                type,
                priority,
                stationId,
            })),
        });
        // Push via SSE
        const payload = { title, message, type, priority, createdAt: new Date() };
        this.emitToStation(stationId, 'notification', payload);
        return notifications;
    }
}
exports.NotificationsService = NotificationsService;
exports.notificationService = new NotificationsService();
//# sourceMappingURL=notifications.service.js.map