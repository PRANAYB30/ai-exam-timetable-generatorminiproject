import React from 'react';
import { GraduationCap, Award, Shield } from 'lucide-react';

interface CollegeBrandProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const CollegeBrand: React.FC<CollegeBrandProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const capSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* College Crest Emblem */}
      <div
        className={`${iconSize} rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-amber-400 p-[1.5px] shadow-lg shadow-indigo-600/25 flex-shrink-0`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-transparent to-amber-500/10 pointer-events-none" />
          <GraduationCap className={`${capSize} text-amber-300 relative z-10`} />
        </div>
      </div>

      {/* College Text Details */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-extrabold text-white tracking-tight truncate ${
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
            }`}
          >
            Apex Institute of Technology & Science
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-300 border border-amber-400/20">
            <Award className="h-2.5 w-2.5" />
            NAAC 'A+'
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`text-slate-400 truncate font-medium ${
              size === 'sm' ? 'text-[10px]' : 'text-[11px]'
            }`}
          >
            Office of the Controller of Examinations (Examination Cell)
          </p>
        )}
      </div>
    </div>
  );
};

export default CollegeBrand;
