import React, { useState, useEffect } from 'react';
import { DashboardData, UserProfile } from '../types';
import { StatCard } from '../components/Common/StatCard';
import { Badge } from '../components/Common/Badge';
import { CollegeBrand } from '../components/Common/CollegeBrand';
import {
  BookOpen,
  CalendarCheck,
  Building2,
  ShieldCheck,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Printer,
  CheckCircle2,
  FileCheck2,
  Lock,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DashboardPageProps {
  data: DashboardData | null;
  user?: UserProfile | null;
  onNavigate: (tab: any) => void;
  onLoadDemo: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY_PUB_STATUS = 'apex_ems_is_published';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  user,
  onNavigate,
  onLoadDemo,
  isLoading,
}) => {
  const [isPublished, setIsPublished] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PUB_STATUS);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const isAdmin = user?.role === 'ADMIN';

  const togglePublished = () => {
    const next = !isPublished;
    setIsPublished(next);
    try {
      localStorage.setItem(STORAGE_KEY_PUB_STATUS, JSON.stringify(next));
    } catch {}
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading university examination records...</p>
        </div>
      </div>
    );
  }

  const latest = data.latest_timetable;
  const isHealthy = latest ? latest.hard_violations_count === 0 : true;

  // Chart data: daily exams
  const dailyChartData = latest?.day_distribution
    ? Object.entries(latest.day_distribution).map(([date, count]) => ({
        date: date.substring(5), // MM-DD
        exams: count,
      }))
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* University Official Notice & Publication Status Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 sm:p-7 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <CollegeBrand size="lg" showSubtitle={true} />

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Autumn Semester 2026-27 End-Semester
              </span>

              {isPublished ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Officially Published & Released</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Draft Schedule • Internal Review</span>
                </span>
              )}

              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Memo Ref: VIT/COE/EXAM-CIR/2026/04
              </span>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <button
                onClick={togglePublished}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isPublished
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>{isPublished ? 'Revert to Draft' : 'Publish Timetable'}</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('viewer')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Browse Timetable</span>
            </button>

            <button
              onClick={onLoadDemo}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Populate CSE, IT, ECE departments, halls, and electives"
            >
              <RotateCcw className="h-3.5 w-3.5 text-indigo-400" />
              <span>Load College Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Prominent Primary Action Cards (Simplified User Journey) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Master Timetable */}
        <div
          onClick={() => onNavigate('viewer')}
          className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/40 cursor-pointer transition-all shadow-lg backdrop-blur-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
                <CalendarDays className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Primary View
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
              Official Master Timetable
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Browse session matrix, filter by student batch (CS-Y3, IT-Y3, EC-Y3), view study rest intervals, and print official circular.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400">
            <span>Open Timetable Viewer</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Set Exam Schedule (Admin) */}
        <div
          onClick={() => onNavigate('generator')}
          className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/40 cursor-pointer transition-all shadow-lg backdrop-blur-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                Admin Planner
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
              Set Exam Schedule
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Launch the CSP solver to auto-assign dates and venues with guaranteed zero student clashes and seating overflows.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400">
            <span>Configure & Solve</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Clash Audit */}
        <div
          onClick={() => onNavigate('conflicts')}
          className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-emerald-500/40 cursor-pointer transition-all shadow-lg backdrop-blur-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Verification Seal
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
              Clash Audit & Resolution
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Independent constraint audit confirming zero simultaneous student exams, double-booked halls, or undersized classrooms.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>Audit Constraints (0 Clashes)</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Streamlined KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          title="Curriculum Exams"
          value={data.total_exams}
          subtitle="Enrolled subjects"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Scheduled Papers"
          value={latest ? latest.scheduled_exams : 0}
          subtitle={latest ? `${Math.round((latest.scheduled_exams / (latest.total_exams || 1)) * 100)}% allocated` : '0%'}
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Venues & Halls"
          value={data.total_rooms}
          subtitle={`${data.total_slots} daily sessions`}
          icon={Building2}
          color="cyan"
        />
        <StatCard
          title="Hard Violations"
          value={latest ? latest.hard_violations_count : 0}
          subtitle={isHealthy ? '0 Clashes (Verified)' : 'Conflicts detected'}
          icon={ShieldCheck}
          color={isHealthy ? 'emerald' : 'rose'}
        />
      </div>

      {/* Main Visuals & Institutional Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Distribution Chart (Spacious & Clean) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Examination Spread</h3>
              <p className="text-[11px] text-slate-400">Papers scheduled across session dates</p>
            </div>
            <button
              onClick={() => onNavigate('viewer')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>Full Matrix</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {dailyChartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-slate-500">
              Generate a timetable or load sample data to display daily spread.
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="exams" fill="#6366f1" radius={[4, 4, 0, 0]} name="Scheduled Exams" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Session Timings: Morning (09:30–12:30) • Afternoon (14:00–17:00)</span>
            <span className="text-emerald-400 font-medium">Balanced Distribution</span>
          </div>
        </div>

        {/* Examination Cell Directives (Institutional Rules) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Examination Directives</h3>
            <p className="text-[11px] text-slate-400">Enforced by Office of CoE</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80">
              <span className="font-semibold text-emerald-400 block mb-0.5">
                1. Zero Cohort Clashes
              </span>
              <span className="text-[11px] text-slate-300">
                Shared batch courses & electives never overlap in the same slot.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80">
              <span className="font-semibold text-indigo-400 block mb-0.5">
                2. Seating Guarantee
              </span>
              <span className="text-[11px] text-slate-300">
                Hall capacity strictly exceeds registered student counts.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800/80">
              <span className="font-semibold text-cyan-400 block mb-0.5">
                3. Lab Facility Matching
              </span>
              <span className="text-[11px] text-slate-300">
                Programming practicals allocated only to computer laboratories.
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('viewer')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-400" />
            <span>Print Official Notice Circular</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
