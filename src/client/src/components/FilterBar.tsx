import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../types';

export const FilterBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentPriority = searchParams.get('priority') || '';
  const currentOverdue = searchParams.get('isOverdue') || '';

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = currentSearch || currentStatus || currentPriority || currentOverdue;

  return (
    <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={currentSearch}
            onChange={(e) => updateParam('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Status Select */}
        <select
          value={currentStatus}
          onChange={(e) => updateParam('status', e.target.value)}
          className="text-xs px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="TO_DO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        {/* Priority Select */}
        <select
          value={currentPriority}
          onChange={(e) => updateParam('priority', e.target.value)}
          className="text-xs px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:outline-none cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {/* Overdue Filter */}
        <button
          onClick={() => updateParam('isOverdue', currentOverdue === 'true' ? '' : 'true')}
          className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${
            currentOverdue === 'true'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          ⚠️ Overdue Only
        </button>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
