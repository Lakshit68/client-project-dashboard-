import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/errors.js';
import { z } from 'zod';

const router = Router();

const createClientSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

// GET /api/clients - Admin & PM can view clients
router.get(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.PROJECT_MANAGER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clients = await prisma.client.findMany({
        include: {
          _count: { select: { projects: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ clients });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/clients - Admin & PM can create clients
router.post(
  '/',
  authenticateJWT,
  requireRole([Role.ADMIN, Role.PROJECT_MANAGER]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = createClientSchema.safeParse(req.body);
      if (!parseResult.success) {
        return next(ApiError.badRequest('Invalid client input data', parseResult.error.format()));
      }

      const existingClient = await prisma.client.findUnique({
        where: { email: parseResult.data.email },
      });
      if (existingClient) {
        return next(ApiError.badRequest('Client with this email already exists'));
      }

      const client = await prisma.client.create({
        data: parseResult.data,
      });

      res.status(201).json({ client });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
