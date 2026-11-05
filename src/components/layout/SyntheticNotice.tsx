import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const SyntheticNotice: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 border-b border-cyan-900/40 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between backdrop-blur-sm z-30">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="font-mono uppercase tracking-wider text-cyan-300 font-medium">
          Demonstration Environment
        </span>
        <span className="text-slate-500" aria-hidden="true">·</span>
        <span className="text-slate-400 hidden sm:inline">
          All sensor records and time-series are simulated synthetic data for software testing.
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
        <span className="hidden md:inline">NOT A CLINICAL DIAGNOSTIC TOOL</span>
        <span className="text-slate-600 hidden md:inline" aria-hidden="true">/</span>
        <span className="text-cyan-400/90">PROJECT CEREBRO-ORBIT PROTOTYPE</span>
      </div>
    </div>
  );
};
