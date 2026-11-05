import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DataPoint, CHANNEL_CONFIGS, ChannelId } from '../../types/signal';

interface MultiChannelChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  highlightInterval?: { start: number; end: number };
}

export const MultiChannelChart: React.FC<MultiChannelChartProps> = ({
  data,
  title,
  height = 360,
}) => {
  const [activeChannels, setActiveChannels] = useState<Record<ChannelId | 'motion_reference', boolean>>({
    channel_680: true,
    channel_780: true,
    channel_850: true,
    channel_1064: true,
    motion_reference: false,
  });

  const [normalizeView, setNormalizeView] = useState(false);

  // Downsample for rendering speed if sample count is large
  const displayData = useMemo(() => {
    if (data.length <= 600) return data;
    const step = Math.ceil(data.length / 600);
    const sampled: DataPoint[] = [];
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }
    return sampled;
  }, [data]);

  const toggleChannel = (ch: ChannelId | 'motion_reference') => {
    setActiveChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const channelList: { id: ChannelId | 'motion_reference'; label: string; color: string }[] = [
    { id: 'channel_680', label: '680 nm (HHb)', color: CHANNEL_CONFIGS.channel_680.color },
    { id: 'channel_780', label: '780 nm (Isosbestic)', color: CHANNEL_CONFIGS.channel_780.color },
    { id: 'channel_850', label: '850 nm (HbO2)', color: CHANNEL_CONFIGS.channel_850.color },
    { id: 'channel_1064', label: '1064 nm (H2O)', color: CHANNEL_CONFIGS.channel_1064.color },
    { id: 'motion_reference', label: 'Motion Ref', color: '#94a3b8' },
  ];

  return (
    <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
            {title || 'Four-Channel Multi-Spectral Optical Signals'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized optical attenuation time-series across target chromophores
          </p>
        </div>

        {/* Channel toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {channelList.map((ch) => {
            const isActive = activeChannels[ch.id];
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? ch.color : '#475569' }}
                />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="timestamp"
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
                    <div className="bg-[#07090e]/95 border border-slate-700 p-2.5 rounded shadow-xl text-xs font-mono backdrop-blur-md">
                      <div className="text-slate-400 mb-1.5 border-b border-slate-800 pb-1">
                        Time: <span className="text-cyan-300">{Number(label).toFixed(3)} s</span>
                      </div>
                      <div className="space-y-1">
                        {payload.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4">
                            <span style={{ color: p.color }}>{p.name}:</span>
                            <span className="text-slate-100 tabular-nums font-semibold">
                              {Number(p.value).toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {activeChannels.channel_680 && (
              <Line
                type="monotone"
                dataKey="channel_680"
                name="680 nm (HHb)"
                stroke={CHANNEL_CONFIGS.channel_680.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeChannels.channel_780 && (
              <Line
                type="monotone"
                dataKey="channel_780"
                name="780 nm (Isosbestic)"
                stroke={CHANNEL_CONFIGS.channel_780.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeChannels.channel_850 && (
              <Line
                type="monotone"
                dataKey="channel_850"
                name="850 nm (HbO2)"
                stroke={CHANNEL_CONFIGS.channel_850.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeChannels.channel_1064 && (
              <Line
                type="monotone"
                dataKey="channel_1064"
                name="1064 nm (H2O)"
                stroke={CHANNEL_CONFIGS.channel_1064.color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {activeChannels.motion_reference && (
              <Line
                type="monotone"
                dataKey="motion_reference"
                name="Motion Ref"
                stroke="#94a3b8"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>Sampling Frequency: {data.length > 1 ? (data.length / (data[data.length - 1]?.timestamp || 1)).toFixed(0) : '25'} Hz</div>
        <div>Total Points: {data.length.toLocaleString()}</div>
      </div>
    </div>
  );
};
