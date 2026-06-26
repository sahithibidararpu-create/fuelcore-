import { NotificationType, NotificationPriority } from '@prisma/client';
export declare class NotificationsService {
    registerClient(userId: string, res: any, stationId: string | null): void;
    unregisterClient(userId: string): void;
    emitToUser(userId: string, event: string, data: unknown): void;
    emitToStation(stationId: string, event: string, data: unknown): void;
    getAll(query: Record<string, string | undefined>, userId: string): Promise<{
        success: true;
        data: {
            message: string;
            type: import(".prisma/client").$Enums.NotificationType;
            priority: import(".prisma/client").$Enums.NotificationPriority;
            stationId: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            isRead: boolean;
            title: string;
            readAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    markRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    delete(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<number>;
    createSystemNotification(stationId: string, title: string, message: string, type: NotificationType, priority?: NotificationPriority): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
export declare const notificationService: NotificationsService;
//# sourceMappingURL=notifications.service.d.ts.map