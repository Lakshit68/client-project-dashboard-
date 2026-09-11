import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/errors';
import { socketService } from '../services/socket.service';
import { z } from 'zod';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  assignedToId: z.string().uuid().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string(),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().optional(),
});

// GET /api/tasks - Query filtered task listing with role security
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { projectId, status, priority, search, isOverdue } = req.query;

    const where: any = {};

    if (user.role === Role.DEVELOPER) {
      where.assignedToId = user.userId;
    } else if (user.role === Role.PROJECT_MANAGER) {
      where.project = { createdById: user.userId };
    }

    if (projectId) where.projectId = String(projectId);
    if (status) where.status = status as TaskStatus;
    if (priority) where.priority = priority as TaskPriority;
    if (isOverdue !== undefined) where.isOverdue = isOverdue === 'true';
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, createdById: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Admin & PM only
router.post(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.PROJECT_MANAGER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createTaskSchema.safeParse(req.body);
      if (!parseResult.success) {
        return next(ApiError.badRequest('Invalid task payload', parseResult.error.format()));
      }

      const { projectId, title, description, assignedToId, priority, dueDate } = parseResult.data;
      const user = req.user!;

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return next(ApiError.notFound('Project not found'));

      if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.userId) {
        return next(ApiError.forbidden('PM cannot create tasks in projects created by another PM'));
      }

      const parsedDueDate = new Date(dueDate);
      const isOverdue = parsedDueDate < new Date();

      const task = await prisma.task.create({
        data: {
          title,
          description,
          projectId,
          assignedToId: assignedToId || null,
          priority,
          dueDate: parsedDueDate,
          isOverdue,
          status: TaskStatus.TO_DO,
        },
        include: {
          project: { select: { id: true, title: true, createdById: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      const activityLog = await prisma.activityLog.create({
        include: {
          user: { select: { id: true, name: true, role: true } },
          project: { select: { id: true, title: true } },
        },
        data: {
          projectId,
          taskId: task.id,
          userId: user.userId,
          action: 'TASK_CREATED',
          oldStatus: null,
          newStatus: TaskStatus.TO_DO,
          message: `${user.name} created task "${title}"`,
        },
      });

      socketService.broadcastActivity(activityLog, projectId, assignedToId);
      socketService.emitTaskUpdate(projectId, task);

      if (assignedToId) {
        const notif = await prisma.notification.create({
          data: {
            userId: assignedToId,
            title: 'New Task Assigned',
            message: `You were assigned task "${title}" in project "${project.title}"`,
            link: `/projects/${projectId}`,
          },
        });
        socketService.sendNotification(assignedToId, notif);
      }

      res.status(201).json({ task });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/tasks/:id - Update status / details
router.put('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = req.user!;

    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(ApiError.badRequest('Invalid update task payload', parseResult.error.format()));
    }

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, createdById: true } },
      },
    });

    if (!existingTask) return next(ApiError.notFound('Task not found'));

    if (user.role === Role.DEVELOPER) {
      if (existingTask.assignedToId !== user.userId) {
        return next(ApiError.forbidden('Developer can only update their assigned tasks'));
      }

      const allowedKeys = ['status'];
      const requestedKeys = Object.keys(req.body);
      const invalidKeys = requestedKeys.filter((k) => !allowedKeys.includes(k));

      if (invalidKeys.length > 0) {
        return next(ApiError.forbidden(`Developers are only permitted to update task status. Restricted fields: ${invalidKeys.join(', ')}`));
      }
    } else if (user.role === Role.PROJECT_MANAGER) {
      if (existingTask.project.createdById !== user.userId) {
        return next(ApiError.forbidden('PM cannot update tasks in projects created by another PM'));
      }
    }

    const updateData: any = {};
    const { title, description, assignedToId, status, priority, dueDate } = parseResult.data;

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) {
      const parsedDate = new Date(dueDate);
      updateData.dueDate = parsedDate;
      updateData.isOverdue = parsedDate < new Date() && status !== TaskStatus.DONE;
    }

    const isStatusChanged = status && status !== existingTask.status;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, title: true, createdById: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (isStatusChanged) {
      const activityMessage = `${user.name} moved Task "${updatedTask.title}" from ${existingTask.status.replace('_', ' ')} → ${status.replace('_', ' ')}`;

      const activityLog = await prisma.activityLog.create({
        include: {
          user: { select: { id: true, name: true, role: true } },
          project: { select: { id: true, title: true } },
        },
        data: {
          projectId: updatedTask.projectId,
          taskId: updatedTask.id,
          userId: user.userId,
          action: 'STATUS_UPDATE',
          oldStatus: existingTask.status,
          newStatus: status,
          message: activityMessage,
        },
      });

      socketService.broadcastActivity(activityLog, updatedTask.projectId, updatedTask.assignedToId);

      if (status === TaskStatus.IN_REVIEW) {
        const pmId = updatedTask.project.createdById;
        const pmNotif = await prisma.notification.create({
          data: {
            userId: pmId,
            title: 'Task Moved to In Review',
            message: `${user.name} moved task "${updatedTask.title}" to In Review for project "${updatedTask.project.title}"`,
            link: `/projects/${updatedTask.projectId}`,
          },
        });
        socketService.sendNotification(pmId, pmNotif);
      }
    }

    if (assignedToId && assignedToId !== existingTask.assignedToId) {
      const newDevNotif = await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: 'Task Reassigned',
          message: `Task "${updatedTask.title}" in project "${updatedTask.project.title}" was assigned to you`,
          link: `/projects/${updatedTask.projectId}`,
        },
      });
      socketService.sendNotification(assignedToId, newDevNotif);
    }

    socketService.emitTaskUpdate(updatedTask.projectId, updatedTask);

    res.json({ task: updatedTask });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Admin & PM creator only
router.delete(
  '/:id',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.PROJECT_MANAGER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = req.user!;

      const task = await prisma.task.findUnique({
        where: { id },
        include: { project: { select: { createdById: true } } },
      });
      if (!task) return next(ApiError.notFound('Task not found'));

      if (user.role === Role.PROJECT_MANAGER && task.project.createdById !== user.userId) {
        return next(ApiError.forbidden('PM cannot delete tasks in projects created by another PM'));
      }

      await prisma.task.delete({ where: { id } });
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
