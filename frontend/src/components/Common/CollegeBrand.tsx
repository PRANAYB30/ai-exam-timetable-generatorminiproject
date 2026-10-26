import React from 'react';
import { Award, ShieldCheck } from 'lucide-react';

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
  const badgeSize =
    size === 'sm'
      ? 'h-8 px-2 text-xs font-black'
      : size === 'lg'
      ? 'h-12 px-3.5 text-base font-black'
      : 'h-10 px-2.5 text-sm font-black';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official VIT Monogram / Crest Badge */}
      <div
        className={`${badgeSize} rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-serif tracking-wider shadow-lg shadow-blue-700/25 flex-shrink-0 border border-blue-400/30`}
      >
        <span className="tracking-widest">VIT</span>
      </div>

      {/* College Official Text Details */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-extrabold text-white tracking-tight truncate ${
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
            }`}
          >
            Vidyalankar Institute of Technology
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-cyan-300 border border-blue-500/25">
            <ShieldCheck className="h-2.5 w-2.5 text-cyan-400" />
            Autonomous • Mumbai Univ.
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`text-slate-400 truncate font-medium ${
              size === 'sm' ? 'text-[10px]' : 'text-[11px]'
            }`}
          >
            Office of the Controller of Examinations • www.vit.edu.in
          </p>
        )}
      </div>
    </div>
  );
};

export default CollegeBrand;
