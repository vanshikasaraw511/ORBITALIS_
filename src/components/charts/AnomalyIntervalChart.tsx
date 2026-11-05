import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { AnomalyDetectionResult, CHANNEL_CONFIGS } from '../../types/signal';

interface AnomalyIntervalChartProps {
  result: AnomalyDetectionResult;
  height?: number;
}

export const AnomalyIntervalChart: React.FC<AnomalyIntervalChartProps> = ({
  result,
  height = 340,
}) => {
  const channelMeta = CHANNEL_CONFIGS[result.channelId];

  const chartData = useMemo(() => {
    const len = result.anomalies.length;
    const step = len > 600 ? Math.ceil(len / 600) : 1;
    const points: {
      time: number;
      value: number;
      anomalyValue: number | null;
      score: number;
      isAnomaly: boolean;
      reason: string;
    }[] = [];

    for (let i = 0; i < len; i += step) {
      const p = result.anomalies[i];
      points.push({
        time: p.timestamp,
        value: p.value,
        anomalyValue: p.isAnomaly ? p.value : null,
        score: p.score,
        isAnomaly: p.isAnomaly,
        reason: p.reason,
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
              Unusual Signal Intervals & Anomaly Highlights
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              [{channelMeta?.name || result.channelId}]
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Engine: {result.method === 'isolation_forest' ? 'Isolation Forest' : 'Robust MAD Z-Score'} · Sensitivity: {result.sensitivity}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Anomalous Points</span>
            <span className="text-amber-400 font-semibold text-sm">
              {result.anomalyCount} ({result.anomalyPercentage}%)
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Flagged Intervals</span>
            <span className="text-rose-400 font-semibold text-sm">
              {result.flaggedIntervals.length}
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

            {/* Shaded flagged intervals */}
            {result.flaggedIntervals.map((interval, idx) => (
              <ReferenceArea
                key={idx}
                x1={interval.start}
                x2={interval.end}
                stroke="#f43f5e"
                strokeOpacity={0.4}
                fill="#f43f5e"
                fillOpacity={0.15}
              />
            ))}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataObj = payload[0]?.payload;
                  return (
                    <div className="bg-[#07090e]/95 border border-slate-700 p-2.5 rounded shadow-xl text-xs font-mono max-w-xs">
                      <div className="text-slate-400 mb-1 border-b border-slate-800 pb-1 flex justify-between">
                        <span>Time: {Number(dataObj.time).toFixed(3)}s</span>
                        <span className={dataObj.isAnomaly ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {dataObj.isAnomaly ? 'ANOMALOUS' : 'NOMINAL'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Value:</span>
                          <span className="text-slate-200 font-semibold">{Number(dataObj.value).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Score:</span>
                          <span className="text-cyan-400 font-semibold">{dataObj.score}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 border-t border-slate-800/80 pt-1">
                          {dataObj.reason}
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
              dataKey="value"
              name="Signal"
              stroke={channelMeta?.color || '#06b6d4'}
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />

            {/* Render highlighted dots for anomalous points */}
            <Line
              type="monotone"
              dataKey="anomalyValue"
              name="Flagged Interval Point"
              stroke="transparent"
              dot={{ r: 3, fill: '#f43f5e', stroke: '#fff', strokeWidth: 1 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>Pink shaded bands indicate contiguous anomalous intervals</div>
        <div>Hover any flagged point to view isolation depth / deviation rationale</div>
      </div>
    </div>
  );
};
