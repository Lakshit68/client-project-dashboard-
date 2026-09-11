import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/errors.js';
import { z } from 'zod';

const router = Router();

const createProjectSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  clientId: z.string().uuid(),
});

// GET /api/projects - Role-scoped project listing
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    let whereClause = {};

    if (user.role === Role.PROJECT_MANAGER) {
      whereClause = { createdById: user.userId };
    } else if (user.role === Role.DEVELOPER) {
      whereClause = {
        tasks: {
          some: {
            assignedToId: user.userId,
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, company: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            isOverdue: true,
            assignedToId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Admin & PM only
router.post(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.PROJECT_MANAGER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createProjectSchema.safeParse(req.body);
      if (!parseResult.success) {
        return next(ApiError.badRequest('Invalid project input data', parseResult.error.format()));
      }

      const client = await prisma.client.findUnique({ where: { id: parseResult.data.clientId } });
      if (!client) {
        return next(ApiError.notFound('Associated Client not found'));
      }

      const project = await prisma.project.create({
        data: {
          ...parseResult.data,
          createdById: req.user!.userId,
        },
        include: {
          client: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:id - Details with role check
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = req.user!;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
      },
    });

    if (!project) {
      return next(ApiError.notFound('Project not found'));
    }

    if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.userId) {
      return next(ApiError.forbidden('PM cannot view projects created by another PM'));
    }

    if (user.role === Role.DEVELOPER) {
      const isAssigned = project.tasks.some((t: any) => t.assignedToId === user.userId);
      if (!isAssigned) {
        return next(ApiError.forbidden('Developer is not assigned to any tasks in this project'));
      }
      project.tasks = project.tasks.filter((t: any) => t.assignedToId === user.userId);
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Admin & PM creator only
router.delete(
  '/:id',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.PROJECT_MANAGER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user!;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) return next(ApiError.notFound('Project not found'));

      if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.userId) {
        return next(ApiError.forbidden('PM cannot delete projects created by another PM'));
      }

      await prisma.project.delete({ where: { id } });
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
