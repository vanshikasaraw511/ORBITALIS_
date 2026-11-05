import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface SpectrumChartProps {
  spectrum: { frequency: number; power: number }[];
  title?: string;
  height?: number;
}

export const SpectrumChart: React.FC<SpectrumChartProps> = ({
  spectrum,
  title = 'Power Spectral Density (PSD)',
  height = 200,
}) => {
  return (
    <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
          {title}
        </h4>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="text-cyan-400">0.8–2.0 Hz: Cardiac</span>
          <span>·</span>
          <span className="text-violet-400">0.2–0.35 Hz: Resp</span>
          <span>·</span>
          <span className="text-emerald-400">0.05–0.15 Hz: Mayer</span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spectrum} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.5} />
            <XAxis
              dataKey="frequency"
              tickFormatter={(v) => `${v} Hz`}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#07090e]/95 border border-slate-700 p-2 rounded shadow text-xs font-mono">
                      <div className="text-slate-400">Freq: {label} Hz</div>
                      <div className="text-cyan-300 font-semibold">
                        Power: {payload[0]?.value} dB/Hz
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="power"
              stroke="#06b6d4"
              strokeWidth={1.5}
              fill="url(#spectrumGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
