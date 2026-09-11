import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Project, Task, User, TaskStatus } from '../types';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { ArrowLeft, Plus, FolderKanban, Activity, Layers } from 'lucide-react';
import { ActivityFeed } from '../components/ActivityFeed';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken } = useAuth();
  const { socket } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [devUsers, setDevUsers] = useState<User[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManageTask = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const fetchProjectData = async () => {
    if (!id || !accessToken) return;
    try {
      const pRes = await fetch(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!pRes.ok) {
        const errData = await pRes.json();
        throw new Error(errData.error?.message || 'Failed to load project details');
      }

      const pData = await pRes.json();
      setProject(pData.project);
      setTasks(pData.project.tasks || []);

      if (canManageTask) {
        const devRes = await fetch('/api/users?role=DEVELOPER', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (devRes.ok) {
          const devData = await devRes.json();
          setDevUsers(devData.users);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id, accessToken]);

  // Join Socket Project Room & listen for real-time task updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:project', id);

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.projectId !== id) return;
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
      socket.emit('leave:project', id);
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket, id]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTask = async (taskData: any) => {
    if (taskData.id) {
      // Update
      const res = await fetch(`/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to update task');
      }
    } else {
      // Create
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ...taskData, projectId: id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to create task');
      }
    }
    await fetchProjectData();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading project data...</div>;
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-rose-500/30 text-rose-300 space-y-4">
        <p className="text-sm font-semibold">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-xs text-indigo-400 underline">
          Back to Projects List
        </Link>
      </div>
    );
  }

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'TO_DO', label: 'To Do', color: 'border-slate-700' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/40' },
    { status: 'IN_REVIEW', label: 'In Review', color: 'border-purple-500/40' },
    { status: 'DONE', label: 'Done', color: 'border-emerald-500/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/projects" className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </Link>
          <div className="flex items-center space-x-3 pt-1">
            <h1 className="text-2xl font-extrabold text-white">{project.title}</h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {project.client?.name}
            </span>
          </div>
          {project.description && <p className="text-xs text-slate-400 max-w-3xl">{project.description}</p>}
        </div>

        {canManageTask && (
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs flex items-center space-x-2 hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="glass-card p-4 rounded-2xl border border-slate-800/90 space-y-3 flex flex-col">
              <div className={`flex items-center justify-between pb-2 border-b ${col.color}`}>
                <span className="text-xs font-bold text-slate-200">{col.label}</span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-slate-800">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 min-h-[300px]">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl">
                    Empty column
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onStatusChange={handleStatusChange}
                      onEdit={(taskToEdit) => {
                        setSelectedTask(taskToEdit);
                        setIsTaskModalOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
        projects={[project]}
        devUsers={devUsers}
        defaultProjectId={project.id}
      />
    </div>
  );
};
