import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Database, Trash2, ExternalLink, LogOut, ShieldCheck, UserCheck, LogIn } from 'lucide-react';

interface TopNavProps {
  currentTabName: string;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onLoadDemo: () => Promise<void>;
  onResetData: () => Promise<void>;
  isLoading: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTabName,
  user,
  onLogout,
  onOpenLogin,
  onLoadDemo,
  onResetData,
  isLoading,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-white capitalize">{currentTabName}</h2>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3 w-3" />
          Autumn 2026-27 End-Semester
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Load Demo Data Button (Only for admin) */}
        {user?.role === 'ADMIN' && (
          <>
            <button
              onClick={onLoadDemo}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
              title="Load sample university departments, halls, and courses"
            >
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Load Sample Data</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-50"
              title="Reset all database records"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </>
        )}

        {/* API Docs link */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
        >
          <span>API Docs</span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </a>

        {/* User Profile Badge & Logout / Login */}
        {user && user.role === 'ADMIN' ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
                <span>{user.name}</span>
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-[10px] text-indigo-400 font-medium">
                {user.designation}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
              title="Sign Out of Examination Cell"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              Student / Guest Mode
            </span>
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Admin Login</span>
            </button>
          </div>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white">Reset Examination Database</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              This will clear all scheduled examinations, rooms, student groups, and generated timetables from the institutional database.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  await onResetData();
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
