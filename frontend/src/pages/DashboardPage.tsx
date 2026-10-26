import React from 'react';
import { DashboardData } from '../types';
import { StatCard } from '../components/Common/StatCard';
import { Badge } from '../components/Common/Badge';
import {
  BookOpen,
  CalendarCheck,
  Building2,
  ShieldCheck,
  Percent,
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
  Download,
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
  onNavigate: (tab: any) => void;
  onLoadDemo: () => Promise<void>;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  onNavigate,
  onLoadDemo,
  isLoading,
}) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading dashboard metrics...</p>
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

  // Chart data: room sessions
  const roomChartData = latest?.room_utilization_data
    ? latest.room_utilization_data.map((r) => ({
        name: r.room_number,
        sessions: r.sessions_scheduled,
        capacity: r.capacity,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 p-6 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PBL-I Academic AI Project
              </span>
              <span className="text-xs text-slate-400">Constraint Satisfaction Engine</span>
            </div>
            <h1 className="mt-2 text-xl font-bold text-white tracking-tight">
              AI-Based Examination Timetable Generator
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
              Autonomous backtracking search with Minimum Remaining Values (MRV), Degree Heuristic,
              Least Constraining Value (LCV), and Forward Checking for conflict-free college scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('generator')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Timetable</span>
            </button>
            <button
              onClick={onLoadDemo}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all"
            >
              <RotateCcw className="h-4 w-4 text-indigo-400" />
              <span>Reset & Load Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Exams"
          value={data.total_exams}
          subtitle="Registered subjects"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Scheduled Papers"
          value={latest ? latest.scheduled_exams : 0}
          subtitle={latest ? `${Math.round((latest.scheduled_exams / (latest.total_exams || 1)) * 100)}% scheduled` : '0%'}
          icon={CalendarCheck}
          color="emerald"
        />
        <StatCard
          title="Active Venues"
          value={data.total_rooms}
          subtitle={`${data.total_slots} daily time slots`}
          icon={Building2}
          color="cyan"
        />
        <StatCard
          title="Hard Violations"
          value={latest ? latest.hard_violations_count : 0}
          subtitle={isHealthy ? '0 clashes • 100% Valid' : 'Conflicts detected'}
          icon={ShieldCheck}
          color={isHealthy ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Room Capacity"
          value={`${latest ? latest.room_utilization_percent : 0}%`}
          subtitle="Seat allocation efficiency"
          icon={Percent}
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Distribution Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Examination Distribution</h3>
              <p className="text-[11px] text-slate-400">Papers scheduled per examination date</p>
            </div>
            <Badge variant="primary" size="sm">
              Balanced Spread
            </Badge>
          </div>

          {dailyChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              Generate or load a timetable to visualize daily distribution.
            </div>
          ) : (
            <div className="h-56">
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
                  <Bar dataKey="exams" fill="#6366f1" radius={[4, 4, 0, 0]} name="Examinations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Room Sessions Allocation Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Room Venue Utilization</h3>
              <p className="text-[11px] text-slate-400">Sessions scheduled per room venue</p>
            </div>
            <Badge variant="info" size="sm">
              Venue Load
            </Badge>
          </div>

          {roomChartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              Generate a timetable to analyze venue load.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="sessions" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Exam Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Generations & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Timetables Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Timetable Generations</h3>
              <p className="text-[11px] text-slate-400">History of AI CSP solver executions</p>
            </div>
            <button
              onClick={() => onNavigate('viewer')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View Active</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {data.recent_timetables.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No generated timetables found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium pb-2">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Scheduled</th>
                    <th className="pb-2">Violations</th>
                    <th className="pb-2">Backtracks</th>
                    <th className="pb-2">Solver Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data.recent_timetables.map((tt) => (
                    <tr
                      key={tt.id}
                      onClick={() => onNavigate('viewer')}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 font-semibold text-white">{tt.name}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            tt.status === 'SUCCESS'
                              ? 'success'
                              : tt.status === 'INFEASIBLE'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {tt.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-300">
                        {tt.scheduled_exams} / {tt.total_exams}
                      </td>
                      <td className="py-3">
                        {tt.hard_violations_count === 0 ? (
                          <span className="text-emerald-400 font-semibold">0 (Clean)</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">
                            {tt.hard_violations_count}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400">{tt.backtracks_count}</td>
                      <td className="py-3 text-indigo-300 font-mono">
                        {tt.execution_time_ms}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions & AI Status Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-2">Algorithm Diagnostics</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Real-time CSP metrics from the latest schedule generation:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Solver Engine:</span>
                <span className="font-semibold text-indigo-300">Python Backtracking</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Variable Heuristic:</span>
                <span className="font-semibold text-white">MRV + Degree</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Value Heuristic:</span>
                <span className="font-semibold text-white">LCV</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Pruning Strategy:</span>
                <span className="font-semibold text-emerald-400">Forward Checking</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('analytics')}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
            >
              <span>Inspect AI Decision Logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
