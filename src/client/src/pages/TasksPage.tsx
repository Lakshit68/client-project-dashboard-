import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Task, TaskStatus, Project, User } from '../types';
import { FilterBar } from '../components/FilterBar';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { CheckSquare, Plus } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [devUsers, setDevUsers] = useState<User[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const canCreateTask = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  const fetchTasks = async () => {
    if (!accessToken) return;
    try {
      const queryString = searchParams.toString();
      const url = `/api/tasks${queryString ? `?${queryString}` : ''}`;

      const [taskRes, projRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } }),
        canCreateTask
          ? fetch('/api/projects', { headers: { Authorization: `Bearer ${accessToken}` } })
          : Promise.resolve(null),
      ]);

      if (taskRes.ok) {
        const tData = await taskRes.json();
        setTasks(tData.tasks);
      }

      if (projRes && projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects);
      }

      if (canCreateTask) {
        const devRes = await fetch('/api/users?role=DEVELOPER', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (devRes.ok) {
          const dData = await devRes.json();
          setDevUsers(dData.users);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [accessToken, searchParams]);

  // Real-time task update listener
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
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to create task');
      }
    }
    await fetchTasks();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            <span>Task Directory</span>
          </h1>
          <p className="text-xs text-slate-400">
            {user?.role === 'DEVELOPER'
              ? 'Tasks assigned specifically to you'
              : 'Tasks list with shareable query URL filters'}
          </p>
        </div>

        {canCreateTask && (
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs flex items-center space-x-2 hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Shareable URL Filter Bar */}
      <FilterBar />

      {tasks.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl border border-slate-800 text-slate-500">
          <CheckSquare className="w-8 h-8 mx-auto opacity-30 mb-2" />
          <p className="text-sm font-medium">No tasks match your active filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onEdit={(taskToEdit) => {
                setSelectedTask(taskToEdit);
                setIsTaskModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
        projects={projects}
        devUsers={devUsers}
      />
    </div>
  );
};
