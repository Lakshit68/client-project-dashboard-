import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ApiError } from '../utils/errors';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
}

// Middleware to ensure PM can only access projects they created, or Admin can access all
export async function verifyProjectAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) return next(ApiError.unauthorized());

  const projectId = req.params.projectId || req.params.id || req.body.projectId;

  if (!projectId) {
    return next(ApiError.badRequest('Project ID is required'));
  }

  // Admin has global access
  if (req.user.role === Role.ADMIN) {
    return next();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return next(ApiError.notFound('Project not found'));
  }

  // PM can only manage their own projects
  if (req.user.role === Role.PROJECT_MANAGER) {
    if (project.createdById !== req.user.userId) {
      return next(ApiError.forbidden('Forbidden: PM cannot access projects created by another PM'));
    }
    return next();
  }

  // Developer can access project if assigned to at least one task in that project
  if (req.user.role === Role.DEVELOPER) {
    const assignedTask = await prisma.task.findFirst({
      where: {
        projectId,
        assignedToId: req.user.userId,
      },
    });

    if (!assignedTask) {
      return next(ApiError.forbidden('Forbidden: Developer is not assigned to any tasks in this project'));
    }
    return next();
  }

  return next(ApiError.forbidden());
}
