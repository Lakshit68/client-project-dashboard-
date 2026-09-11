import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { env } from '../config/env';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  public init(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
    });

    // JWT Authentication middleware on Socket Handshake
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.split(' ')[1] ||
        (socket.handshake.query?.token as string);

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      try {
        const payload = verifyAccessToken(token);
        socket.user = payload;
        next();
      } catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }
    });

    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const user = socket.user!;
      console.log(`🔌 Socket connected: ${user.name} (${user.role}) [ID: ${socket.id}]`);

      // Track online status
      if (!this.onlineUsers.has(user.userId)) {
        this.onlineUsers.set(user.userId, new Set());
      }
      this.onlineUsers.get(user.userId)!.add(socket.id);

      // Broadcast updated active online user count
      this.broadcastPresence();

      // Join user personal room for targeted notifications
      socket.join(`user:${user.userId}`);

      // Room subscriptions according to role
      if (user.role === Role.ADMIN) {
        socket.join('global:activity');
      } else if (user.role === Role.PROJECT_MANAGER) {
        // PM joins rooms for all projects they created
        const pmProjects = await prisma.project.findMany({
          where: { createdById: user.userId },
          select: { id: true },
        });
        pmProjects.forEach((p) => socket.join(`project:${p.id}`));
      } else if (user.role === Role.DEVELOPER) {
        // Developer joins rooms for projects where they have assigned tasks
        const devTasks = await prisma.task.findMany({
          where: { assignedToId: user.userId },
          select: { projectId: true },
          distinct: ['projectId'],
        });
        devTasks.forEach((t) => socket.join(`project:${t.projectId}`));
      }

      // Allow manually joining a specific project room when opening project detail view
      socket.on('join:project', (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${user.name} [ID: ${socket.id}]`);
        const userSockets = this.onlineUsers.get(user.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.onlineUsers.delete(user.userId);
          }
        }
        this.broadcastPresence();
      });
    });
  }

  public getOnlineUserCount(): number {
    return this.onlineUsers.size;
  }

  public broadcastPresence() {
    if (this.io) {
      this.io.emit('presence:update', {
        onlineCount: this.getOnlineUserCount(),
        onlineUserIds: Array.from(this.onlineUsers.keys()),
      });
    }
  }

  public broadcastActivity(activityLog: any, projectId: string, assignedDevId?: string | null) {
    if (!this.io) return;

    // 1. Send to global activity (Admins)
    this.io.to('global:activity').emit('activity:new', activityLog);

    // 2. Send to project room (PM & viewing Devs)
    this.io.to(`project:${projectId}`).emit('activity:new', activityLog);

    // 3. Send to assigned developer's personal room if set
    if (assignedDevId) {
      this.io.to(`user:${assignedDevId}`).emit('activity:new', activityLog);
    }
  }

  public emitTaskUpdate(projectId: string, task: any) {
    if (!this.io) return;
    this.io.to('global:activity').emit('task:updated', task);
    this.io.to(`project:${projectId}`).emit('task:updated', task);
    if (task.assignedToId) {
      this.io.to(`user:${task.assignedToId}`).emit('task:updated', task);
    }
  }

  public sendNotification(userId: string, notification: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }
}

export const socketService = new SocketService();
