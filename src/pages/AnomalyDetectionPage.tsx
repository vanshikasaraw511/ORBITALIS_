import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Play,
  Sliders,
  CheckCircle2,
  Table as TableIcon,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  Dataset,
  ChannelId,
  CHANNEL_CONFIGS,
  AnomalyDetectionResult,
} from '../types/signal';
import {
  detectIsolationForestAnomalies,
  detectRobustZScoreAnomalies,
} from '../services/anomalyEngine';
import { AnomalyIntervalChart } from '../components/charts/AnomalyIntervalChart';
import { MetricCard } from '../components/common/MetricCard';

interface AnomalyDetectionPageProps {
  dataset: Dataset;
  onSaveResult?: (result: AnomalyDetectionResult) => void;
}

export const AnomalyDetectionPage: React.FC<AnomalyDetectionPageProps> = ({
  dataset,
  onSaveResult,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>('channel_680');
  const [method, setMethod] = useState<'isolation_forest' | 'robust_zscore'>('isolation_forest');
  const [contamination, setContamination] = useState<number>(0.05); // 5%
  const [sigmaThreshold, setSigmaThreshold] = useState<number>(3.0); // 3.0 sigma

  // Table pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const rowsPerPage = 10;

  const rawSignal = useMemo(() => {
    return dataset.data.map((d) => d[selectedChannel] ?? 0);
  }, [dataset, selectedChannel]);

  const timestamps = useMemo(() => {
    return dataset.data.map((d) => d.timestamp);
  }, [dataset]);

  // Compute anomaly results
  const detectionResult: AnomalyDetectionResult = useMemo(() => {
    if (method === 'isolation_forest') {
      return detectIsolationForestAnomalies(
        rawSignal,
        timestamps,
        selectedChannel,
        contamination
      );
    } else {
      return detectRobustZScoreAnomalies(
        rawSignal,
        timestamps,
        selectedChannel,
        sigmaThreshold
      );
    }
  }, [rawSignal, timestamps, selectedChannel, method, contamination, sigmaThreshold]);

  // Filter only flagged points for the table
  const flaggedPoints = useMemo(() => {
    return detectionResult.anomalies.filter((p) => p.isAnomaly);
  }, [detectionResult]);

  const paginatedFlagged = flaggedPoints.slice(
    pageIndex * rowsPerPage,
    (pageIndex + 1) * rowsPerPage
  );
  const totalPages = Math.ceil(flaggedPoints.length / rowsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Unsupervised Signal Intelligence
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Signal Anomaly & Unusual Interval Detector
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Detects unusual signal intervals and transients using Isolation Forest multi-feature tree isolation and Robust Median Absolute Deviation (MAD) statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Active Channel: <span className="text-cyan-400 font-semibold">{CHANNEL_CONFIGS[selectedChannel]?.wavelength} nm</span>
          </span>
        </div>
      </div>

      {/* Control Panel Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-4">
        {/* Channel Selection (4 Cols) */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-xs font-mono text-slate-400 block">
            Target Optical Channel
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.values(CHANNEL_CONFIGS).map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setSelectedChannel(ch.id);
                  setPageIndex(0);
                }}
                className={`px-2.5 py-1.5 text-xs font-mono rounded border transition-colors flex items-center gap-1.5 ${
                  selectedChannel === ch.id
                    ? 'bg-slate-900 border-slate-700 text-white font-semibold'
                    : 'bg-transparent border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                <span>{ch.wavelength} nm</span>
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Selection (4 Cols) */}
        <div className="md:col-span-4 space-y-1">
          <label className="text-xs font-mono text-slate-400 block">
            Detection Algorithm
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setMethod('isolation_forest');
                setPageIndex(0);
              }}
              className={`px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
                method === 'isolation_forest'
                  ? 'bg-slate-900 border-cyan-500/50 text-cyan-300 font-semibold'
                  : 'bg-transparent border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Isolation Forest
            </button>
            <button
              onClick={() => {
                setMethod('robust_zscore');
                setPageIndex(0);
              }}
              className={`px-2.5 py-1.5 text-xs font-mono rounded border transition-colors ${
                method === 'robust_zscore'
                  ? 'bg-slate-900 border-cyan-500/50 text-cyan-300 font-semibold'
                  : 'bg-transparent border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Robust MAD Z-Score
            </button>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">
            {method === 'isolation_forest'
              ? 'Multi-feature tree isolation (value, 1st diff, rolling var)'
              : 'Empirical Median Absolute Deviation fallback'}
          </span>
        </div>

        {/* Sensitivity Adjustment (4 Cols) */}
        <div className="md:col-span-4 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">
              {method === 'isolation_forest' ? 'Contamination Rate:' : 'Threshold Sigma:'}
            </span>
            <span className="text-cyan-300 font-semibold">
              {method === 'isolation_forest'
                ? `${(contamination * 100).toFixed(1)}%`
                : `${sigmaThreshold.toFixed(1)} σ`}
            </span>
          </div>

          {method === 'isolation_forest' ? (
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={contamination}
              onChange={(e) => {
                setContamination(Number(e.target.value));
                setPageIndex(0);
              }}
              className="w-full accent-cyan-400"
            />
          ) : (
            <input
              type="range"
              min="2.0"
              max="5.0"
              step="0.2"
              value={sigmaThreshold}
              onChange={(e) => {
                setSigmaThreshold(Number(e.target.value));
                setPageIndex(0);
              }}
              className="w-full accent-cyan-400"
            />
          )}

          <span className="text-[10px] text-slate-500 font-mono block">
            Higher sensitivity flags smaller deviations
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Flagged Samples"
          value={detectionResult.anomalyCount}
          unit={`/ ${detectionResult.totalSamples}`}
          subtext="Individual time-series samples"
          highlightColor="amber"
        />
        <MetricCard
          label="Contamination Rate"
          value={detectionResult.anomalyPercentage}
          unit="%"
          subtext="Dataset anomaly ratio"
          highlightColor="rose"
        />
        <MetricCard
          label="Contiguous Intervals"
          value={detectionResult.flaggedIntervals.length}
          unit="zones"
          subtext="Clustered temporal episodes"
          highlightColor="cyan"
        />
        <MetricCard
          label="Peak Anomaly Score"
          value={
            detectionResult.flaggedIntervals.length > 0
              ? Math.max(...detectionResult.flaggedIntervals.map((i) => i.peakScore))
              : '0.00'
          }
          unit={method === 'isolation_forest' ? 'idx' : 'σ'}
          subtext="Maximum recorded severity"
          highlightColor="violet"
        />
      </div>

      {/* Interactive Visualisation */}
      <AnomalyIntervalChart result={detectionResult} height={340} />

      {/* Flagged Regions Table & Diagnostics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contiguous Interval Cards (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-100">
              Flagged Unusual Signal Intervals
            </h3>
            <span className="text-xs font-mono text-cyan-400">
              {detectionResult.flaggedIntervals.length} Identified
            </span>
          </div>

          {detectionResult.flaggedIntervals.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No unusual signal intervals detected at the current sensitivity setting.
            </div>
          ) : (
            <div className="space-y-3">
              {detectionResult.flaggedIntervals.map((interval, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-rose-400">
                      Interval #{idx + 1}
                    </span>
                    <span className="text-slate-400">
                      Duration: {interval.duration.toFixed(2)}s
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>
                      Window: {interval.start.toFixed(2)}s — {interval.end.toFixed(2)}s
                    </span>
                    <span className="text-amber-400 font-semibold">
                      Peak: {interval.peakScore}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                    Temporal deviation observed exceeding expected baseline variance. Characteristic of simulated venous blood volume shift or transient optical probe motion.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Flagged Points Table (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Flagged Sample Diagnostics
              </h3>
              <span className="text-xs font-mono text-slate-500">
                (Page {pageIndex + 1} of {totalPages})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
                className="px-2.5 py-1 text-xs font-mono rounded border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900"
              >
                Previous
              </button>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
                className="px-2.5 py-1 text-xs font-mono rounded border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-3">Time (s)</th>
                  <th className="py-2 px-3">Value (a.u.)</th>
                  <th className="py-2 px-3">Anomaly Score</th>
                  <th className="py-2 px-3">Isolation Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {paginatedFlagged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No points flagged under current sensitivity.
                    </td>
                  </tr>
                ) : (
                  paginatedFlagged.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-semibold text-cyan-300 tabular-nums">
                        {p.timestamp.toFixed(3)}
                      </td>
                      <td className="py-2 px-3 tabular-nums">{p.value.toFixed(4)}</td>
                      <td className="py-2 px-3 tabular-nums text-rose-400 font-semibold">
                        {p.score}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                        {p.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
