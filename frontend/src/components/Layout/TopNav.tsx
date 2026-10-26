import React, { useState } from 'react';
import { Database, RefreshCw, Trash2, ExternalLink, Activity } from 'lucide-react';

interface TopNavProps {
  currentTabName: string;
  onLoadDemo: () => Promise<void>;
  onResetData: () => Promise<void>;
  isLoading: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTabName,
  onLoadDemo,
  onResetData,
  isLoading,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-white capitalize">{currentTabName}</h2>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Activity className="h-3 w-3 animate-pulse" />
          AI Engine Online
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Load Demo Data Button */}
        <button
          onClick={onLoadDemo}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
          title="Load realistic CS, IT, and ECE exam datasets and auto-generate timetable"
        >
          <Database className="h-3.5 w-3.5 text-indigo-400" />
          <span>Load Demo Data</span>
        </button>

        {/* Reset Database Button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all disabled:opacity-50"
          title="Clear all examinations and database tables"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Swagger Docs Link */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
        >
          <span>API Docs</span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </a>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white">Confirm Complete Reset</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              This will erase all examinations, rooms, student groups, and generated timetables from the SQLite database.
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
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
