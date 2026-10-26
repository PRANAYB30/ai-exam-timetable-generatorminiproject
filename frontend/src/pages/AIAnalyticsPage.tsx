import React, { useState } from 'react';
import { Timetable } from '../types';
import { Badge } from '../components/Common/Badge';
import {
  Brain,
  Cpu,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AIAnalyticsPageProps {
  timetable: Timetable | null;
  onNavigate: (tab: any) => void;
}

export const AIAnalyticsPage: React.FC<AIAnalyticsPageProps> = ({ timetable, onNavigate }) => {
  const [filterEvent, setFilterEvent] = useState<string>('ALL');
  const [searchCode, setSearchCode] = useState<string>('');

  if (!timetable) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
        <Brain className="h-10 w-10 text-slate-500 mb-3" />
        <h3 className="text-base font-bold text-white">No Timetable Execution Available</h3>
        <p className="mt-1 text-xs text-slate-400">Generate a timetable to inspect AI decision traces.</p>
        <button
          onClick={() => onNavigate('generator')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
        >
          Go to Generator
        </button>
      </div>
    );
  }

  const decisionLogs = timetable.decision_logs || [];
  const aiSummary = timetable.ai_summary || {};
  const highlights = aiSummary.highlights || [];

  const filteredLogs = decisionLogs.filter((log) => {
    const matchesEvent = filterEvent === 'ALL' || log.event === filterEvent;
    const matchesCode =
      !searchCode ||
      (log.exam_code && log.exam_code.toLowerCase().includes(searchCode.toLowerCase())) ||
      log.reason.toLowerCase().includes(searchCode.toLowerCase());
    return matchesEvent && matchesCode;
  });

  // Soft penalty chart data
  const penaltyBreakdown = aiSummary.soft_penalty_breakdown || {};
  const penaltyPieData = [
    { name: 'Gap Days Penalty', value: penaltyBreakdown.gap || 0, color: '#f59e0b' },
    { name: 'Daily Balance Variance', value: penaltyBreakdown.distribution || 0, color: '#6366f1' },
    { name: 'Seat Utilization Waste', value: penaltyBreakdown.utilization || 0, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              AI Decision Explanation & Algorithm Analytics
            </h1>
            <p className="text-xs text-slate-400">
              Transparent, white-box insights into CSP Backtracking search, MRV variable selection, and LCV value ordering.
            </p>
          </div>
        </div>
      </div>

      {/* Decision Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase mb-2">
            <Sparkles className="h-4 w-4" />
            <span>MRV Fail-First Strategy</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Variables with the fewest legal values in their domain were scheduled first, minimizing dead-end tree exploration.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase mb-2">
            <GitCommit className="h-4 w-4" />
            <span>LCV Value Ordering</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Values that eliminate the fewest candidate options in neighboring domains were prioritized, maximizing future solver flexibility.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Forward Checking</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Incompatible room and time options were pruned dynamically after each assignment, detecting domain wipeouts early.
          </p>
        </div>
      </div>

      {/* Key Highlights from Algorithm Run */}
      {highlights.length > 0 && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Solver Run Highlights
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {highlights.map((hl: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Analytics Charts: Performance & Soft Penalty Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Soft Penalty Breakdown */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">Soft Constraint Penalties</h3>
          <p className="text-[11px] text-slate-400 mb-4">
            Total Penalty: <span className="text-cyan-400 font-mono font-bold">{timetable.soft_penalty_score}</span> (Lower is better)
          </p>

          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={penaltyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {penaltyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-[11px] text-slate-300 mt-2">
            {penaltyPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Solver Execution Stats */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Search Complexity Metrics</h3>
            <p className="text-[11px] text-slate-400 mb-4">Tree exploration and backtrack counters</p>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Total Backtracks:</span>
                <span className="font-bold text-white font-mono">{timetable.backtracks_count}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Assignments Attempted:</span>
                <span className="font-bold text-indigo-400 font-mono">
                  {timetable.assignments_attempted}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Constraint Checks:</span>
                <span className="font-bold text-cyan-400 font-mono">
                  {timetable.constraint_checks_count}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400">Total Time:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {timetable.execution_time_ms} ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Logs Filter & Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white">CSP Decision Trace Log</h3>
            <p className="text-[11px] text-slate-400">
              Live chronological step record from the Python solver
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Event Filter */}
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Events</option>
              <option value="SELECT_VARIABLE">Variable Selection (MRV)</option>
              <option value="ASSIGN">Assignment (LCV)</option>
              <option value="BACKTRACK">Backtrack Events</option>
              <option value="DEAD_END">Dead Ends</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Search subject or reason..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Logs Table / Timeline */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching decision logs found for this filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const eventColors: Record<string, string> = {
                SELECT_VARIABLE: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
                ASSIGN: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                BACKTRACK: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
                DEAD_END: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                SOLUTION_FOUND: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
              };

              return (
                <div
                  key={log.step}
                  className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 text-xs flex items-start justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[10px] text-slate-500 mt-0.5">
                      #{log.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                            eventColors[log.event] || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {log.event}
                        </span>
                        {log.exam_code && (
                          <span className="font-bold text-white">{log.exam_code}</span>
                        )}
                      </div>
                      <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                        {log.reason}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
