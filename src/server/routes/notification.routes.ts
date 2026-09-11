import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/errors.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.userId, read: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = req.user!;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return next(ApiError.notFound('Notification not found'));
    if (notif.userId !== user.userId) return next(ApiError.forbidden());

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ notification: updated });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    await prisma.notification.updateMany({
      where: { userId: user.userId, read: false },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
