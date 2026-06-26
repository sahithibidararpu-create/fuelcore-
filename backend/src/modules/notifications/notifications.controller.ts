import { Request, Response } from 'express';
import { notificationService } from './notifications.service';
import { successResponse } from '../../utils/pagination';
import { CONSTANTS } from '../../config/constants';

export class NotificationsController {
  async getAll(req: Request, res: Response) {
    res.json(await notificationService.getAll(req.query as any, req.user!.id));
  }

  async getUnreadCount(req: Request, res: Response) {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json(successResponse({ count }));
  }

  async markRead(req: Request, res: Response) {
    await notificationService.markRead(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Marked as read' });
  }

  async markAllRead(req: Request, res: Response) {
    await notificationService.markAllRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  }

  async delete(req: Request, res: Response) {
    await notificationService.delete(req.params.id, req.user!.id);
    res.status(204).send();
  }

  // SSE Stream
  stream(req: Request, res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const userId = req.user!.id;
    const stationId = req.user!.stationId;

    notificationService.registerClient(userId, res, stationId);

    // Heartbeat
    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, CONSTANTS.SSE_HEARTBEAT_INTERVAL_MS);

    // Send initial connected event
    res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

    req.on('close', () => {
      clearInterval(heartbeat);
      notificationService.unregisterClient(userId);
    });
  }
}

export const notificationsController = new NotificationsController();
