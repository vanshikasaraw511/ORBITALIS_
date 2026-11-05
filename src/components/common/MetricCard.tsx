import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  delta?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  highlightColor?: 'cyan' | 'violet' | 'rose' | 'emerald' | 'slate' | 'amber';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  delta,
  highlightColor = 'cyan',
}) => {
  const accentBorder = {
    cyan: 'border-slate-800 hover:border-cyan-500/40',
    violet: 'border-slate-800 hover:border-violet-500/40',
    rose: 'border-slate-800 hover:border-rose-500/40',
    emerald: 'border-slate-800 hover:border-emerald-500/40',
    slate: 'border-slate-800 hover:border-slate-700',
    amber: 'border-slate-800 hover:border-amber-500/40',
  }[highlightColor];

  return (
    <div
      className={`bg-[#0c101a] border ${accentBorder} rounded-lg p-4 transition-colors relative flex flex-col justify-between`}
    >
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-2xl sm:text-3xl font-mono font-semibold tabular-nums text-slate-100">
            {value}
          </span>
          {unit && (
            <span className="text-xs uppercase font-mono text-slate-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      {(subtext || delta) && (
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          {subtext && <span className="truncate">{subtext}</span>}
          {delta && (
            <span
              className={`font-mono tabular-nums text-[11px] ${
                delta.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {delta.value} {delta.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
