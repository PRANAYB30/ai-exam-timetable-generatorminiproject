import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'purple';
  trend?: {
    label: string;
    positive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      glow: 'group-hover:border-indigo-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'group-hover:border-emerald-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'group-hover:border-amber-500/40',
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      glow: 'group-hover:border-rose-500/40',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      glow: 'group-hover:border-cyan-500/40',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
      glow: 'group-hover:border-purple-500/40',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/50 ${scheme.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trend.label}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${scheme.bg} ${scheme.border} border`}>
          <Icon className={`h-5 w-5 ${scheme.text}`} />
        </div>
      </div>
    </div>
  );
};
