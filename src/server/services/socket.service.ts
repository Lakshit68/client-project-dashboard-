import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private onlineUsers = new Map<string, Set<string>>();

  public init(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },
    });

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

      if (!this.onlineUsers.has(user.userId)) {
        this.onlineUsers.set(user.userId, new Set());
      }
      this.onlineUsers.get(user.userId)!.add(socket.id);

      this.broadcastPresence();

      socket.join(`user:${user.userId}`);

      if (user.role === Role.ADMIN) {
        socket.join('global:activity');
      } else if (user.role === Role.PROJECT_MANAGER) {
        const pmProjects = await prisma.project.findMany({
          where: { createdById: user.userId },
          select: { id: true },
        });
        pmProjects.forEach((p: { id: string }) => socket.join(`project:${p.id}`));
      } else if (user.role === Role.DEVELOPER) {
        const devTasks = await prisma.task.findMany({
          where: { assignedToId: user.userId },
          select: { projectId: true },
          distinct: ['projectId'],
        });
        devTasks.forEach((t: { projectId: string }) => socket.join(`project:${t.projectId}`));
      }

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

    this.io.to('global:activity').emit('activity:new', activityLog);
    this.io.to(`project:${projectId}`).emit('activity:new', activityLog);

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
