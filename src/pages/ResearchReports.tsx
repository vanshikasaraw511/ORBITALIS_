import React, { useState } from 'react';
import {
  Download,
  Printer,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Experiment } from '../types/experiment';
import { Dataset, CHANNEL_CONFIGS } from '../types/signal';
import { generateResearchReportPdf } from '../services/pdfReportGenerator';

interface ResearchReportsProps {
  currentDataset: Dataset;
  experiments: Experiment[];
  selectedExperiment?: Experiment | null;
}

export const ResearchReports: React.FC<ResearchReportsProps> = ({
  currentDataset,
  experiments,
  selectedExperiment,
}) => {
  const [activeExpId, setActiveExpId] = useState<string>(
    selectedExperiment?.id || experiments[0]?.id || 'EXP-2026-084'
  );

  const activeExp =
    experiments.find((e) => e.id === activeExpId) || experiments[0];

  const handleDownloadPdf = () => {
    if (!activeExp) return;
    generateResearchReportPdf({
      experiment: activeExp,
      dataset: currentDataset,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeExp) {
    return (
      <div className="py-20 text-center text-slate-500 font-mono text-xs">
        No experiment data available to generate report.
      </div>
    );
  }

  const channelMeta = CHANNEL_CONFIGS[activeExp.targetChannel];

  return (
    <div className="space-y-6">
      {/* Top Controls Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Formal Documentation & Output
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Research Reports & PDF Export
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Generates standardized aerospace biomedical research briefs summarizing multi-spectral optical filtering, SNR performance, and unusual signal intervals.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Experiment Selector Dropdown */}
          <select
            value={activeExp.id}
            onChange={(e) => setActiveExpId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-3 py-2 font-mono focus:outline-none focus:border-cyan-400"
          >
            {experiments.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.id} — {exp.name.slice(0, 24)}...
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 rounded hover:bg-cyan-300 transition-colors flex items-center gap-1.5 font-sans"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Report Document Sheet (Emulates standard research brief on dark slate paper) */}
      <div className="bg-[#0b0e17] border border-slate-800 rounded-lg p-8 max-w-4xl mx-auto shadow-2xl relative space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              ORBITALIS // SPACE BIOMEDICAL INTELLIGENCE PLATFORM
            </div>
            <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
              {activeExp.name}
            </h2>
            <div className="text-xs text-slate-400 font-mono mt-1">
              REPORT REFERENCE: <span className="text-slate-200 font-semibold">{activeExp.id}</span> · DATE: {activeExp.date}
            </div>
          </div>

          <div className="text-right font-mono text-xs text-slate-400">
            <div>INVESTIGATOR: {activeExp.investigator}</div>
            <div className="text-cyan-400 mt-0.5">STATUS: {activeExp.status.toUpperCase()}</div>
          </div>
        </div>

        {/* Mandatory Research Prototype Disclaimer Banner */}
        <div className="p-4 bg-slate-900/80 border border-rose-900/40 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-2 text-rose-400 font-semibold font-mono text-[11px] uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Demonstration Environment — Synthetic Data Only</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            This software prototype is built for engineering and computational exploration inspired by SpaceLith’s Project CEREBRO-ORBIT technical whitepaper. It is not an intracranial diagnostic tool, medical device, or flight-qualified life support system.
          </p>
        </div>

        {/* Section 1: Dataset & Sensing Setup */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-slate-800">
            01. Telemetry & Dataset Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">Dataset Name & Source</span>
              <span className="text-slate-200 font-semibold">{activeExp.datasetName}</span>
              <span className="text-slate-400 block text-[11px]">Source: {activeExp.datasetSource.toUpperCase()}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">Target Wavelength Channel</span>
              <span className="text-cyan-300 font-semibold">{channelMeta?.name || activeExp.targetChannel}</span>
              <span className="text-slate-400 block text-[11px]">{channelMeta?.targetChromophore}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Four-Wavelength Optical Architecture Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-slate-800">
            02. Multi-Spectral Optical Sensing Architecture
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded space-y-1">
              <span className="text-cyan-400 font-bold">[680 nm] Deoxyhemoglobin (HHb)</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Monitors venous blood accumulation and internal jugular vein (IJV) stasis under microgravity cephalad fluid redistribution.
              </p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded space-y-1">
              <span className="text-violet-400 font-bold">[780 nm] Near-Isosbestic Reference</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Serves as a total blood volume reference channel, unaffected by oxygenation changes for spatial cross-normalization.
              </p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded space-y-1">
              <span className="text-rose-400 font-bold">[850 nm] Oxyhemoglobin (HbO2)</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Captures pulsatile arterial waveforms and cerebral autoregulation dynamics in response to elevated ambient CO2.
              </p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded space-y-1">
              <span className="text-emerald-400 font-bold">[1064 nm] Tissue Hydration Index</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Measures interstitial water shifts and cerebral edema precursors relevant to Spaceflight-Associated Neuro-Ocular Syndrome (SANS).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Signal Processing & Anomaly Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-slate-800">
            03. Signal Processing Performance & Anomaly Analytics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px] uppercase">Net SNR Improvement</span>
              <span className="text-emerald-400 font-bold text-base mt-0.5 block">
                +{activeExp.snrImprovementDb ?? 14.8} dB
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px] uppercase">Filter Topology</span>
              <span className="text-slate-200 font-semibold text-xs mt-1 block">
                Butterworth Zero-Phase
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px] uppercase">Flagged Intervals</span>
              <span className="text-amber-400 font-bold text-base mt-0.5 block">
                {activeExp.anomaliesDetected ?? 4} Events
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded">
              <span className="text-slate-500 block text-[10px] uppercase">Detection Engine</span>
              <span className="text-slate-200 font-semibold text-xs mt-1 block truncate">
                Isolation Forest
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Key Findings */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 pb-1 border-b border-slate-800">
            04. Observations & Investigator Notes
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeExp.notes ||
              'Zero-phase Butterworth filtering suppressed high-frequency motion artifacts while retaining key hemodynamic pulsation harmonics. Anomaly clustering flagged suspicious transient deviation during simulated cephalad venous stasis.'}
          </p>

          <ul className="space-y-2 pt-2 text-xs text-slate-300 font-mono">
            {activeExp.keyFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">[{idx + 1}]</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Document Footer */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-3">
          <div>ORBITALIS RESEARCH PROTOTYPE // CEREBRO-ORBIT CONCEPT BENCHMARK</div>
          <div>AUTHORIZED FOR RESEARCH USE ONLY</div>
        </div>
      </div>
    </div>
  );
};
