import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ProcessedSignalResult, CHANNEL_CONFIGS } from '../../types/signal';

interface RawVsFilteredChartProps {
  result: ProcessedSignalResult;
  height?: number;
}

export const RawVsFilteredChart: React.FC<RawVsFilteredChartProps> = ({
  result,
  height = 340,
}) => {
  const [showResidual, setShowResidual] = useState(true);
  const channelMeta = CHANNEL_CONFIGS[result.channelId];

  const chartData = useMemo(() => {
    const len = result.timestamps.length;
    const step = len > 500 ? Math.ceil(len / 500) : 1;
    const points: {
      time: number;
      raw: number;
      filtered: number;
      residual: number;
    }[] = [];

    for (let i = 0; i < len; i += step) {
      const raw = result.rawSignal[i];
      const filtered = result.filteredSignal[i];
      points.push({
        time: result.timestamps[i],
        raw,
        filtered,
        residual: Number((raw - filtered).toFixed(4)),
      });
    }

    return points;
  }, [result]);

  return (
    <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Raw vs. Filtered Signal Comparison
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              [{channelMeta?.name || result.channelId}]
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Topology: {result.filterParams.filterType.replace('_', ' ').toUpperCase()} (Order: {result.filterParams.order})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResidual(!showResidual)}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
              showResidual
                ? 'bg-slate-900 border-slate-700 text-slate-200'
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {showResidual ? 'Hide Residual Noise' : 'Show Residual Noise'}
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="time"
              tickFormatter={(v) => `${v.toFixed(1)}s`}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => v.toFixed(3)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#07090e]/95 border border-slate-700 p-2.5 rounded shadow-xl text-xs font-mono">
                      <div className="text-slate-400 mb-1 border-b border-slate-800 pb-1">
                        Time: <span className="text-cyan-300">{Number(label).toFixed(3)} s</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 text-slate-400">
                          <span>Raw Unfiltered:</span>
                          <span className="text-slate-300 font-semibold">{Number(payload[0]?.value).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-cyan-400">
                          <span>Filtered Signal:</span>
                          <span className="font-semibold">{Number(payload[1]?.value).toFixed(4)}</span>
                        </div>
                        {showResidual && payload[2] && (
                          <div className="flex justify-between gap-4 text-amber-400">
                            <span>Residual Noise:</span>
                            <span className="font-semibold">{Number(payload[2]?.value).toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="raw"
              name="Raw Unfiltered"
              stroke="#64748b"
              strokeWidth={1}
              strokeOpacity={0.65}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="filtered"
              name="Filtered Signal"
              stroke={channelMeta?.color || '#06b6d4'}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {showResidual && (
              <Line
                type="monotone"
                dataKey="residual"
                name="Residual Noise"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Raw SNR</span>
          <span className="text-slate-300 text-sm font-semibold">{result.snrRaw.toFixed(1)} dB</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Filtered SNR</span>
          <span className="text-cyan-400 text-sm font-semibold">{result.snrFiltered.toFixed(1)} dB</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">Net SNR Gain</span>
          <span className="text-emerald-400 text-sm font-semibold">+{result.snrGainDb.toFixed(1)} dB</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase">RMS Noise</span>
          <span className="text-slate-300 text-sm font-semibold">{result.rmsNoise.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
};
