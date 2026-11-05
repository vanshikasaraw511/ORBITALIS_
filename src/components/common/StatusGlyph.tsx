import React from 'react';

export type StatusType = 'nominal' | 'warning' | 'active' | 'calibrated' | 'idle';

interface StatusGlyphProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusGlyph: React.FC<StatusGlyphProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const configs: Record<
    StatusType,
    { text: string; glyph: string; colorClass: string }
  > = {
    nominal: {
      text: 'Nominal',
      glyph: '●',
      colorClass: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20',
    },
    active: {
      text: 'Active',
      glyph: '◆',
      colorClass: 'text-cyan-400 border-cyan-900/50 bg-cyan-950/20',
    },
    warning: {
      text: 'Drift / Anomaly',
      glyph: '▲',
      colorClass: 'text-amber-400 border-amber-900/50 bg-amber-950/20',
    },
    calibrated: {
      text: 'Calibrated',
      glyph: '✓',
      colorClass: 'text-violet-400 border-violet-900/50 bg-violet-950/20',
    },
    idle: {
      text: 'Standby',
      glyph: '○',
      colorClass: 'text-slate-400 border-slate-800 bg-slate-900/40',
    },
  };

  const current = configs[status];
  const displayText = label || current.text;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono ${
        size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      } rounded border ${current.colorClass}`}
    >
      <span aria-hidden="true" className="text-[10px]">
        {current.glyph}
      </span>
      <span>{displayText}</span>
    </span>
  );
};
