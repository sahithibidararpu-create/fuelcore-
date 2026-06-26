import { prisma } from '../../config/database';
import { parsePagination, paginatedResponse } from '../../utils/pagination';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { logger } from '../../config/logger';

// SSE client registry
const sseClients: Map<string, { res: any; stationId: string | null }> = new Map();

export class NotificationsService {
  // Register SSE client
  registerClient(userId: string, res: any, stationId: string | null) {
    sseClients.set(userId, { res, stationId });
    logger.info(`SSE client registered: ${userId}`);
  }

  // Unregister SSE client
  unregisterClient(userId: string) {
    sseClients.delete(userId);
    logger.info(`SSE client unregistered: ${userId}`);
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: unknown) {
    const client = sseClients.get(userId);
    if (client) {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  // Emit to all users in a station
  emitToStation(stationId: string, event: string, data: unknown) {
    for (const [, client] of sseClients) {
      if (client.stationId === stationId || !client.stationId) {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    }
  }

  async getAll(query: Record<string, string | undefined>, userId: string) {
    const { page, limit, skip } = parsePagination(query);
    const where: Record<string, unknown> = {
      userId,
      ...(query.unread === 'true' && { isRead: false }),
    };

    const [total, data] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async createSystemNotification(
    stationId: string,
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority = 'MEDIUM'
  ) {
    // Find all managers/admins for this station
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { stationId, role: 'STATION_MANAGER' },
          { role: 'SUPER_ADMIN' },
        ],
      },
      select: { id: true },
    });

    const notifications = await prisma.notification.createMany({
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

export const notificationService = new NotificationsService();
