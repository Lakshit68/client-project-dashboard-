import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  LogOut,
  Sparkles,
  UserCheck,
  ChevronDown,
  Shield,
  Briefcase,
  Code,
} from 'lucide-react';
import { Role } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const { onlineCount } = useSocket();
  const location = useLocation();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const demoAccounts = [
    { email: 'admin@agency.com', role: 'ADMIN' as Role, label: 'Admin (Victoria)' },
    { email: 'pm.sarah@agency.com', role: 'PROJECT_MANAGER' as Role, label: 'PM (Sarah Connor)' },
    { email: 'pm.marcus@agency.com', role: 'PROJECT_MANAGER' as Role, label: 'PM (Marcus Holloway)' },
    { email: 'dev.ravi@agency.com', role: 'DEVELOPER' as Role, label: 'Dev (Ravi Kumar)' },
    { email: 'dev.alex@agency.com', role: 'DEVELOPER' as Role, label: 'Dev (Alex Mercer)' },
  ];

  const handleQuickSwitch = async (email: string) => {
    try {
      await login(email, 'password123');
      setSwitcherOpen(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Shield className="w-3 h-3" />
            <span>ADMIN</span>
          </span>
        );
      case 'PROJECT_MANAGER':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Briefcase className="w-3 h-3" />
            <span>PM</span>
          </span>
        );
      case 'DEVELOPER':
        return (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Code className="w-3 h-3" />
            <span>DEV</span>
          </span>
        );
      default:
        return null;
    }
  };

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <header className="sticky top-0 z-40 glass-nav backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  NexusAgency
                </span>
                <span className="block text-[9px] font-mono text-indigo-400 tracking-wider">
                  REAL-TIME DASHBOARD
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center space-x-4">
            {/* Live Online Users Count Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 text-[11px]">
                <strong className="text-emerald-400 font-bold">{onlineCount}</strong> Active
              </span>
            </div>

            {/* Notification Badge */}
            <NotificationDropdown />

            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition-colors"
                title="Switch role account"
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Switch Role</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {switcherOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-modal rounded-xl shadow-2xl z-50 p-2 border border-slate-800 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Role Switch
                  </div>
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleQuickSwitch(acc.email)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        user?.email === acc.email ? 'bg-indigo-600/30 text-indigo-200 font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{acc.label}</span>
                      {getRoleBadge(acc.role)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="text-right hidden lg:block">
                <div className="text-xs font-semibold text-slate-100">{user?.name}</div>
                <div className="flex justify-end">{getRoleBadge(user?.role)}</div>
              </div>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
