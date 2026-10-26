import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  ShieldAlert,
  Brain,
  BookOpen,
  Users,
  Building2,
  Sliders,
  GraduationCap,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'generator'
  | 'viewer'
  | 'conflicts'
  | 'analytics'
  | 'exams'
  | 'groups'
  | 'rooms'
  | 'config';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  conflictCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  conflictCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generator' as NavTab, label: 'Generate Timetable', icon: Sparkles, badge: 'AI CSP' },
    { id: 'viewer' as NavTab, label: 'Timetable Viewer', icon: Calendar },
    {
      id: 'conflicts' as NavTab,
      label: 'Conflict Center',
      icon: ShieldAlert,
      count: conflictCount,
    },
    { id: 'analytics' as NavTab, label: 'AI Analytics & Decisions', icon: Brain },
    { id: 'exams' as NavTab, label: 'Examinations', icon: BookOpen },
    { id: 'groups' as NavTab, label: 'Student Groups', icon: Users },
    { id: 'rooms' as NavTab, label: 'Rooms & Venues', icon: Building2 },
    { id: 'config' as NavTab, label: 'Scheduling Config', icon: Sliders },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 print:hidden">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/80">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              AutoScheduler
            </h1>
            <p className="text-[11px] text-indigo-400 font-medium tracking-wide uppercase">
              AI Timetable Engine
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wider ${
                    isActive ? 'bg-indigo-900/60 text-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* College Project Badge Footer */}
      <div className="p-4 m-3 rounded-xl border border-slate-800/80 bg-slate-950/40 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-slate-300">PBL-I Project Ready</span>
        </div>
        <p className="mt-1 text-slate-500 text-[10px] leading-relaxed">
          CSP Backtracking + MRV + Degree + LCV + Forward Checking.
        </p>
      </div>
    </aside>
  );
};
