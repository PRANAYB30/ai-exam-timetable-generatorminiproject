import React from 'react';
import { UserProfile } from '../../types';
import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  ShieldAlert,
  Brain,
  BookOpen,
  Users,
  Building2,
  Sliders,
  GraduationCap,
  ShieldCheck,
  Lock,
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
  user: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  conflictCount = 0,
  user,
}) => {
  const isAdmin = user?.role === 'ADMIN';

  const scheduleNavItems = [
    { id: 'dashboard' as NavTab, label: 'Executive Dashboard', icon: LayoutDashboard },
    {
      id: 'generator' as NavTab,
      label: 'Set Exam Timetable',
      icon: CalendarCheck,
      adminOnly: true,
      badge: 'Admin',
    },
    { id: 'viewer' as NavTab, label: 'Official Timetable', icon: Calendar },
    {
      id: 'conflicts' as NavTab,
      label: 'Clash & Audit Center',
      icon: ShieldAlert,
      count: conflictCount,
    },
    { id: 'analytics' as NavTab, label: 'Scheduling Rationale', icon: Brain },
  ];

  const registryNavItems = [
    { id: 'exams' as NavTab, label: 'Course Curriculum', icon: BookOpen, adminOnly: true },
    { id: 'groups' as NavTab, label: 'Student Batches', icon: Users, adminOnly: true },
    { id: 'rooms' as NavTab, label: 'Halls & Venues', icon: Building2, adminOnly: true },
    { id: 'config' as NavTab, label: 'Academic Policies', icon: Sliders, adminOnly: true },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 print:hidden">
      <div>
        {/* University Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Apex Institute
            </h1>
            <p className="text-[11px] text-indigo-400 font-semibold tracking-wide">
              Examination Cell (CoE)
            </p>
          </div>
        </div>

        {/* Section 1: Timetable Operations */}
        <div className="px-3 py-3">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Timetable Planning
          </p>
          <nav className="space-y-1">
            {scheduleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = item.adminOnly && !isAdmin;

              return (
                <button
                  key={item.id}
                  disabled={isLocked}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isLocked
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : isLocked ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.badge}
                      </span>
                    )}
                    {isLocked && <Lock className="h-3 w-3 text-slate-600" />}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Academic Registries */}
        <div className="px-3 py-2 border-t border-slate-800/80">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Institutional Registries {isAdmin ? '' : '(Admin Only)'}
          </p>
          <nav className="space-y-1">
            {registryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = item.adminOnly && !isAdmin;

              return (
                <button
                  key={item.id}
                  disabled={isLocked}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isLocked
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : isLocked ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isLocked && <Lock className="h-3 w-3 text-slate-600" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Staff ID & Institutional Security Badge */}
      <div className="p-3.5 m-3 rounded-2xl border border-slate-800 bg-slate-950/60 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-white">
            {isAdmin ? 'CoE Administrator' : 'Guest Student View'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          {isAdmin ? (
            <>Staff ID: <span className="text-indigo-300 font-mono font-medium">{user.staff_id}</span></>
          ) : (
            'Read-only schedule viewer'
          )}
        </p>
      </div>
    </aside>
  );
};
