import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { MotionSimulationResult, CHANNEL_CONFIGS } from '../../types/signal';

interface MotionArtifactChartProps {
  result: MotionSimulationResult;
  height?: number;
}

export const MotionArtifactChart: React.FC<MotionArtifactChartProps> = ({
  result,
  height = 320,
}) => {
  const channelMeta = CHANNEL_CONFIGS[result.channelId];

  const chartData = useMemo(() => {
    const len = result.timestamps.length;
    const step = len > 500 ? Math.ceil(len / 500) : 1;
    const points: {
      time: number;
      disturbed: number;
      corrected: number;
      motionRef: number;
    }[] = [];

    for (let i = 0; i < len; i += step) {
      points.push({
        time: result.timestamps[i],
        disturbed: result.disturbedSignal[i],
        corrected: result.correctedSignal[i],
        motionRef: result.motionReference[i],
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
              Motion Artifact Decoupling & Reference Subtraction
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              [{channelMeta?.name || result.channelId}]
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Adaptive least-squares reference subtraction via synchronized motion reference channel
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Artifact Reduction</span>
            <span className="text-emerald-400 font-semibold text-sm">
              {result.artifactReductionRatio}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Post-Decoupling SNR</span>
            <span className="text-cyan-400 font-semibold text-sm">
              {result.snrAfter} dB
            </span>
          </div>
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
              tickFormatter={(v) => v.toFixed(2)}
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
                        <div className="flex justify-between gap-4 text-rose-400">
                          <span>Motion Disturbed:</span>
                          <span className="font-semibold">{Number(payload[0]?.value).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-emerald-400">
                          <span>Decoupled / Corrected:</span>
                          <span className="font-semibold">{Number(payload[1]?.value).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between gap-4 text-slate-400">
                          <span>Motion Reference:</span>
                          <span className="font-semibold">{Number(payload[2]?.value).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="disturbed"
              name="Motion Disturbed"
              stroke="#f43f5e"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="corrected"
              name="Decoupled / Corrected"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="motionRef"
              name="Motion Reference"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>Model: s_clean(t) = s_obs(t) - α · m(t)</div>
        <div className="text-slate-400">Reference channel: Synthetic 3-axis accelerometer norm</div>
      </div>
    </div>
  );
};
