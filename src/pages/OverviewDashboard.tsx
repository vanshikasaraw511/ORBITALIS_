import React from 'react';
import {
  Activity,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Database,
  FileText,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { StatusGlyph } from '../components/common/StatusGlyph';
import { MultiChannelChart } from '../components/charts/MultiChannelChart';
import { Dataset, CHANNEL_CONFIGS } from '../types/signal';
import { Experiment } from '../types/experiment';
import { PageId } from '../components/layout/Navbar';

interface OverviewDashboardProps {
  dataset: Dataset;
  experiments: Experiment[];
  onNavigate: (page: PageId) => void;
  onSelectExperiment: (exp: Experiment) => void;
  onGenerateNew: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  dataset,
  experiments,
  onNavigate,
  onSelectExperiment,
  onGenerateNew,
}) => {
  const latestExperiment = experiments[0];
  const totalDatasets = 4; // Simulated catalog count

  // Calculate overall signal quality estimate
  const avgSnr =
    dataset.statistics.channel_850?.snrEst ??
    dataset.statistics.channel_680?.snrEst ??
    24.5;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Active Mission Profile
            </span>
            <span className="text-slate-600">/</span>
            <StatusGlyph status="nominal" label="Simulation Active" size="sm" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Neuro-Hemodynamic Optical Telemetry Console
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Spaceflight biomedical simulation monitoring 4-wavelength cerebral optical absorption, cephalad fluid shift kinetics, and motion decoupling.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('explorer')}
            className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dataset Explorer</span>
          </button>
          <button
            onClick={() => onNavigate('dsp_lab')}
            className="px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Open DSP Lab</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Experiments"
          value={experiments.length}
          subtext="Persisted research log"
          highlightColor="cyan"
          delta={{
            value: `${experiments.filter((e) => e.status === 'completed').length}`,
            isPositive: true,
            label: 'completed',
          }}
        />
        <MetricCard
          label="Active Dataset Samples"
          value={dataset.sampleCount.toLocaleString()}
          unit="pts"
          subtext={`Duration: ${dataset.durationSeconds}s @ ${dataset.samplingRate}Hz`}
          highlightColor="violet"
        />
        <MetricCard
          label="Baseline Signal Quality"
          value={avgSnr.toFixed(1)}
          unit="dB"
          subtext="Estimated optical SNR"
          highlightColor="emerald"
          delta={{
            value: '+14.2 dB',
            isPositive: true,
            label: 'post-filter gain',
          }}
        />
        <MetricCard
          label="Flagged Signal Anomalies"
          value={latestExperiment?.anomaliesDetected ?? 4}
          unit="events"
          subtext="Contiguous unusual intervals"
          highlightColor="rose"
        />
      </div>

      {/* Main 4-Channel Optical Signal Visualisation */}
      <MultiChannelChart
        data={dataset.data}
        title={`Multi-Spectral Optical Sensor Feed // ${dataset.name}`}
        height={340}
      />

      {/* Channel Specifications Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(CHANNEL_CONFIGS).map((ch) => {
          const stats = dataset.statistics[ch.id];
          return (
            <div
              key={ch.id}
              className="bg-[#0c101a] border border-slate-800 rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-mono font-semibold"
                    style={{ color: ch.color }}
                  >
                    {ch.wavelength} nm
                  </span>
                  <span className="text-[10px] uppercase font-mono text-slate-500">
                    {ch.id.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-200">
                  {ch.targetChromophore}
                </div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {ch.role}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Mean: {stats ? stats.mean.toFixed(3) : '—'}</span>
                <span>SNR: {stats ? `${stats.snrEst} dB` : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Split: Recent Experiment Activity & System Blueprint */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Experiments (2 Cols) */}
        <div className="lg:col-span-2 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Recent Experiment Activity
              </h3>
              <p className="text-xs text-slate-400">
                Saved signal processing and anomaly detection runs
              </p>
            </div>
            <button
              onClick={() => onNavigate('experiments')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {experiments.slice(0, 3).map((exp) => (
              <div
                key={exp.id}
                onClick={() => onSelectExperiment(exp)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 p-2 rounded cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-cyan-400">
                      {exp.id}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-sm font-medium text-slate-200">
                      {exp.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                    <span>{exp.date}</span>
                    <span>·</span>
                    <span>Target: {exp.targetChannel.replace('channel_', '')} nm</span>
                    <span>·</span>
                    <span className="text-emerald-400">
                      +{exp.snrImprovementDb ?? 14} dB gain
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    {exp.anomaliesDetected ?? 0} anomalies
                  </span>
                  <StatusGlyph status="nominal" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Experiment Summary Card */}
        <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Selected Run Details
              </span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {latestExperiment?.id ?? 'EXP-ACTIVE'}
              </span>
            </div>

            <h4 className="text-base font-semibold text-white">
              {latestExperiment?.name ?? 'Cephalad Fluid Shift Simulation'}
            </h4>
            <p className="text-xs text-slate-400 mt-2 line-clamp-3">
              {latestExperiment?.description ??
                'Analysis of 680nm deoxyHb accumulation and 1064nm tissue hydration kinetics under simulated microgravity fluid shift.'}
            </p>

            <div className="mt-4 space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Investigator:</span>
                <span>{latestExperiment?.investigator ?? 'Research Team'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Filter Used:</span>
                <span>Butterworth 2nd-Order</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">SNR Improvement:</span>
                <span className="text-emerald-400 font-semibold">
                  +{latestExperiment?.snrImprovementDb ?? 14.8} dB
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate PDF Report</span>
            </button>
            <button
              onClick={() => onNavigate('dsp_lab')}
              className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1"
            >
              <span>Tune Parameters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
