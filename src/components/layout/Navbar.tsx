import React from 'react';
import { Activity, Plus, Server } from 'lucide-react';

export type PageId =
  | 'overview'
  | 'explorer'
  | 'dsp_lab'
  | 'anomalies'
  | 'experiments'
  | 'reports'
  | 'methodology';

interface NavbarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onNewAnalysis: () => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  onNewAnalysis,
  backendOnline,
}) => {
  const navItems: { id: PageId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'explorer', label: 'Data Explorer' },
    { id: 'dsp_lab', label: 'DSP Laboratory' },
    { id: 'anomalies', label: 'Anomaly Detection' },
    { id: 'experiments', label: 'Experiments' },
    { id: 'reports', label: 'Reports' },
    { id: 'methodology', label: 'Methodology' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#07090e] sticky top-0 z-20">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate('overview')}
          className="text-left group flex items-center gap-2.5 focus:outline-none"
        >
          <div className="w-8 h-8 rounded border border-cyan-500/30 bg-cyan-950/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
              ORBITALIS
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500">Engine:</span>
          <span className="text-cyan-300">
            {backendOnline ? 'FastAPI Py' : 'Web DSP'}
          </span>
        </div>

        <button
          onClick={onNewAnalysis}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>
      </div>
    </header>
  );
};
