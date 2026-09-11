import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { TaskStatus } from '@prisma/client';
import { socketService } from './socket.service.js';

export function startOverdueTaskScheduler() {
  console.log('⏰ Starting Overdue Task Scheduler cron job (runs every minute)...');

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
          isOverdue: false,
        },
        include: {
          project: true,
          assignedTo: true,
        },
      });

      if (overdueTasks.length === 0) return;

      console.log(`⏰ Cron Job: Flagging ${overdueTasks.length} task(s) as OVERDUE...`);

      for (const task of overdueTasks) {
        const updatedTask = await prisma.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, title: true, createdById: true } },
          },
        });

        const activityLog = await prisma.activityLog.create({
          include: {
            user: { select: { id: true, name: true, role: true } },
            project: { select: { id: true, title: true } },
          },
          data: {
            projectId: task.projectId,
            taskId: task.id,
            userId: task.project.createdById,
            action: 'OVERDUE_FLAGGED',
            oldStatus: task.status,
            newStatus: task.status,
            message: `⚠️ System: Task "${task.title}" in project "${task.project.title}" is now OVERDUE!`,
          },
        });

        socketService.broadcastActivity(activityLog, task.projectId, task.assignedToId);
        socketService.emitTaskUpdate(task.projectId, updatedTask);

        if (task.assignedToId) {
          const notif = await prisma.notification.create({
            data: {
              userId: task.assignedToId,
              title: 'Task Overdue Flagged',
              message: `Task "${task.title}" is past its due date and has been marked Overdue.`,
              link: `/projects/${task.projectId}`,
            },
          });
          socketService.sendNotification(task.assignedToId, notif);
        }

        const pmNotif = await prisma.notification.create({
          data: {
            userId: task.project.createdById,
            title: 'Project Task Overdue',
            message: `Task "${task.title}" in project "${task.project.title}" is now Overdue.`,
            link: `/projects/${task.projectId}`,
          },
        });
        socketService.sendNotification(task.project.createdById, pmNotif);
      }
    } catch (error) {
      console.error('Error running overdue task scheduler:', error);
    }
  });
}
