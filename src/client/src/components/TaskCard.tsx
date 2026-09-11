import React from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, User, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onEdit }) => {
  const { user } = useAuth();
  const isDev = user?.role === 'DEVELOPER';

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">LOW</span>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'DONE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1"><CheckCircle2 className="w-3 h-3"/><span>Done</span></span>;
      case 'IN_REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">In Review</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">In Progress</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">To Do</span>;
    }
  };

  const isOverdue = task.isOverdue || (new Date(task.dueDate) < new Date() && task.status !== 'DONE');

  return (
    <div className={`p-4 rounded-2xl glass-card border transition-all duration-200 hover:border-indigo-500/40 space-y-3 ${
      isOverdue ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {getPriorityBadge(task.priority)}
            {isOverdue && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white flex items-center space-x-1 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                <span>OVERDUE</span>
              </span>
            )}
          </div>
          <h4
            onClick={() => onEdit?.(task)}
            className="text-sm font-bold text-slate-100 hover:text-indigo-300 cursor-pointer transition-colors line-clamp-1"
          >
            {task.title}
          </h4>
        </div>
        {getStatusBadge(task.status)}
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <User className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-medium text-slate-300">
            {task.assignedTo?.name || 'Unassigned'}
          </span>
        </div>

        <div className={`flex items-center space-x-1 text-[11px] font-mono ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Quick Status Dropdown / Action for Devs or PMs */}
      {onStatusChange && (
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Update Status:</span>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="text-[11px] font-medium px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      )}
    </div>
  );
};
