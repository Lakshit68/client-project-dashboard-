import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/users - List users for selection/assignment
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.query;

    const where: any = {};
    if (role) {
      where.role = role as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

export default router;
