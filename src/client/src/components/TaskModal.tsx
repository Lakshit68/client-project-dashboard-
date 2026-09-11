import React, { useState, useEffect } from 'react';
import { Task, Project, User, TaskPriority, TaskStatus } from '../types';
import { X, Calendar, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => Promise<void>;
  task?: Task | null;
  projects: Project[];
  devUsers: User[];
  defaultProjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  projects,
  devUsers,
  defaultProjectId,
}) => {
  const { user } = useAuth();
  const isDev = user?.role === 'DEVELOPER';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TO_DO');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setProjectId(task.projectId);
      setAssignedToId(task.assignedToId || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
    } else {
      setTitle('');
      setDescription('');
      setProjectId(defaultProjectId || (projects[0]?.id || ''));
      setAssignedToId('');
      setPriority('MEDIUM');
      setStatus('TO_DO');
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10));
    }
    setError('');
  }, [task, isOpen, defaultProjectId, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isDev && task) {
        // Dev can only save status update
        await onSave({ id: task.id, status });
      } else {
        await onSave({
          id: task?.id,
          title,
          description,
          projectId,
          assignedToId: assignedToId || null,
          priority,
          status,
          dueDate: new Date(dueDate).toISOString(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-lg rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-slate-100">
            {task ? (isDev ? 'Update Task Status' : 'Edit Task') : 'Create New Task'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isDev && task ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Task Title</label>
                <div className="text-sm font-bold text-slate-100 mt-1">{task.title}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">Task Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TO_DO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth2 Refresh Token Endpoint"
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details and acceptance criteria..."
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Project *</label>
                  <select
                    required
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Assign Developer</label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {devUsers.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="TO_DO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
