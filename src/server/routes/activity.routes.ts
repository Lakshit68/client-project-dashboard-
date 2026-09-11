import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';

const router = Router();

// GET /api/activity - Role-filtered activity log (last 20 missed events)
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId } = req.query;

    let whereClause: any = {};

    if (projectId) {
      whereClause.projectId = String(projectId);
    }

    if (user.role === Role.PROJECT_MANAGER) {
      whereClause.project = { createdById: user.userId };
    } else if (user.role === Role.DEVELOPER) {
      whereClause.OR = [
        { task: { assignedToId: user.userId } },
        { userId: user.userId },
      ];
    }

    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, title: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ activities });
  } catch (error) {
    next(error);
  }
});

export default router;
