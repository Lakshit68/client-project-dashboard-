export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  client?: Client;
  createdById: string;
  createdBy?: User;
  tasks?: Task[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  project?: Project;
  assignedToId?: string | null;
  assignedTo?: User | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  project?: { id: string; title: string };
  taskId?: string | null;
  task?: { id: string; title: string };
  userId: string;
  user?: { id: string; name: string; role: Role };
  action: string;
  oldStatus?: TaskStatus | null;
  newStatus?: TaskStatus | null;
  message: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
