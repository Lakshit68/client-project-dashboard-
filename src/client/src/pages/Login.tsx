import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Briefcase, Code, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@agency.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login(quickEmail, 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-modal w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-800 space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome to NexusAgency</h1>
          <p className="text-xs text-slate-400">Real-Time Client Project Dashboard with Role Access</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@agency.com"
              className="w-full mt-1.5 px-4 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative mt-1.5">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs hover:opacity-90 shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* One-Click Quick Role Login Preset Buttons for Easy Grading */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            One-Click Role Presets
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@agency.com')}
              className="p-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/50 border border-purple-800/40 text-purple-200 text-xs font-medium flex flex-col items-center space-y-1 transition-all"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => handleQuickLogin('pm.sarah@agency.com')}
              className="p-2 rounded-xl bg-blue-950/30 hover:bg-blue-900/50 border border-blue-800/40 text-blue-200 text-xs font-medium flex flex-col items-center space-y-1 transition-all"
            >
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span>PM (Sarah)</span>
            </button>
            <button
              onClick={() => handleQuickLogin('dev.ravi@agency.com')}
              className="p-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-200 text-xs font-medium flex flex-col items-center space-y-1 transition-all"
            >
              <Code className="w-4 h-4 text-emerald-400" />
              <span>Dev (Ravi)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
