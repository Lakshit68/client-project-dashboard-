import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskCard } from '../components/TaskCard';
import { Project, Task, TaskStatus } from '../types';
import { safeFetchJson } from '../config/api';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  Shield,
  Briefcase,
  Code,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, accessToken } = useAuth();
  const { onlineCount, socket } = useSocket();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!accessToken) return;
    try {
      const [pData, tData] = await Promise.all([
        safeFetchJson('/api/projects', { headers: { Authorization: `Bearer ${accessToken}` } }),
        safeFetchJson('/api/tasks', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      if (pData?.projects) setProjects(pData.projects);
      if (tData?.tasks) setTasks(tData.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;
    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === updatedTask.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        }
        return [updatedTask, ...prev];
      });
    };

    socket.on('task:updated', handleTaskUpdated);
    return () => {
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const data = await safeFetchJson(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (data?.task) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const overdueTasksCount = tasks.filter((t) => t.isOverdue || (new Date(t.dueDate) < new Date() && t.status !== 'DONE')).length;
  const doneTasksCount = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const inReviewTasksCount = tasks.filter((t) => t.status === 'IN_REVIEW').length;
  const todoTasksCount = tasks.filter((t) => t.status === 'TO_DO').length;

  const priorityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const sortedDevTasks = [...tasks].sort((a, b) => {
    const pA = priorityOrder[a.priority] || 0;
    const pB = priorityOrder[b.priority] || 0;
    if (pB !== pA) return pB - pA;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-8">
      {/* Role Banner */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ROLE: {user?.role}
              </span>
              <span className="text-xs text-slate-400">• Workspace Active</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}
            </h2>
            <p className="text-xs text-slate-400">
              {user?.role === 'ADMIN' && 'Global System Governance & Live Activity Monitor'}
              {user?.role === 'PROJECT_MANAGER' && 'Personal Managed Projects & Upcoming Deliverables'}
              {user?.role === 'DEVELOPER' && 'Personal Task Queue — sorted by Priority & Due Date'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/tasks"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-all"
            >
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>View All Tasks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ADMIN DASHBOARD VIEW */}
      {user?.role === 'ADMIN' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Projects</span>
                <FolderKanban className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{totalProjects}</div>
              <p className="text-[11px] text-slate-500">Across all clients</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Tasks In Progress</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-blue-400">{inProgressTasksCount}</div>
              <p className="text-[11px] text-slate-500">{inReviewTasksCount} currently in review</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Overdue Tasks</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-extrabold text-rose-400">{overdueTasksCount}</div>
              <p className="text-[11px] text-rose-500/80 font-medium">Flagged by cron scheduler</p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Active Users Online</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">{onlineCount}</div>
              <p className="text-[11px] text-emerald-500/80 font-medium">Live Socket presence</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">System Tasks Overview</h3>
                <span className="text-xs text-slate-400">{totalTasks} total tasks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tasks.slice(0, 6).map((t) => (
                  <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>

            <div>
              <ActivityFeed maxItems={15} />
            </div>
          </div>
        </div>
      )}

      {/* PM DASHBOARD VIEW */}
      {user?.role === 'PROJECT_MANAGER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">My Managed Projects</span>
              <div className="text-3xl font-extrabold text-indigo-300">{totalProjects}</div>
              <p className="text-[11px] text-slate-500">Only created by you</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">In Review Tasks</span>
              <div className="text-3xl font-extrabold text-purple-400">{inReviewTasksCount}</div>
              <p className="text-[11px] text-slate-500">Requires review approval</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Overdue Tasks</span>
              <div className="text-3xl font-extrabold text-rose-400">{overdueTasksCount}</div>
              <p className="text-[11px] text-slate-500">Requires attention</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">My Managed Projects</h3>
                <Link to="/projects" className="text-xs text-indigo-400 hover:underline">
                  Manage Projects →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl glass-card border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {p.client?.name}
                      </span>
                      <span className="text-xs text-slate-400">{p.tasks?.length || 0} tasks</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{p.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                    <Link
                      to={`/projects/${p.id}`}
                      className="inline-flex items-center space-x-1 text-xs text-indigo-400 font-semibold hover:text-indigo-300"
                    >
                      <span>Open Project Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <ActivityFeed maxItems={15} />
            </div>
          </div>
        </div>
      )}

      {/* DEVELOPER DASHBOARD VIEW */}
      {user?.role === 'DEVELOPER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Assigned Tasks Queue</span>
              <div className="text-3xl font-extrabold text-emerald-400">{totalTasks}</div>
              <p className="text-[11px] text-slate-500">Sorted by Priority & Due Date</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">In Progress</span>
              <div className="text-3xl font-extrabold text-blue-400">{inProgressTasksCount}</div>
              <p className="text-[11px] text-slate-500">Currently active work</p>
            </div>
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Overdue Tasks</span>
              <div className="text-3xl font-extrabold text-rose-400">{overdueTasksCount}</div>
              <p className="text-[11px] text-slate-500">Past due date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-200">My Assigned Tasks Queue</h3>
              {sortedDevTasks.length === 0 ? (
                <div className="p-8 text-center glass-card rounded-2xl text-slate-500">
                  No tasks assigned to you right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedDevTasks.map((t) => (
                    <TaskCard key={t.id} task={t} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <ActivityFeed maxItems={15} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
