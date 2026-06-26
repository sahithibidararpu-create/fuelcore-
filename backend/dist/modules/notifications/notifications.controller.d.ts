import { Request, Response } from 'express';
export declare class NotificationsController {
    getAll(req: Request, res: Response): Promise<void>;
    getUnreadCount(req: Request, res: Response): Promise<void>;
    markRead(req: Request, res: Response): Promise<void>;
    markAllRead(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    stream(req: Request, res: Response): void;
}
export declare const notificationsController: NotificationsController;
//# sourceMappingURL=notifications.controller.d.ts.map