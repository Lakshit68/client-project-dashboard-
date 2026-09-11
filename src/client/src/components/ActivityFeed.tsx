import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Activity, Clock, User as UserIcon, ArrowRight, AlertTriangle } from 'lucide-react';

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export const ActivityFeed: React.FC<{ maxItems?: number }> = ({ maxItems = 20 }) => {
  const { activities, isConnected } = useSocket();
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Activity Feed</h3>
            <p className="text-[11px] text-slate-400">Real-time team project log</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            )}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            {isConnected ? 'LIVE' : 'RECONNECTING'}
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {displayedActivities.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Clock className="w-6 h-6 mx-auto opacity-30" />
            <p className="text-xs">No recent activities recorded</p>
          </div>
        ) : (
          displayedActivities.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition-all space-y-1.5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center space-x-1">
                    <UserIcon className="w-3 h-3 text-slate-400" />
                    <span>{act.user?.name || 'System User'}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">•</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {act.project?.title || 'Project'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 flex items-center space-x-1 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(act.createdAt)}</span>
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-snug">{act.message}</p>

              {act.oldStatus && act.newStatus && (
                <div className="flex items-center space-x-2 text-[10px] pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                    {act.oldStatus.replace('_', ' ')}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                    {act.newStatus.replace('_', ' ')}
                  </span>
                </div>
              )}

              {act.action === 'OVERDUE_FLAGGED' && (
                <div className="flex items-center space-x-1 text-[10px] text-rose-400 pt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Flagged as Overdue by background scheduler</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
