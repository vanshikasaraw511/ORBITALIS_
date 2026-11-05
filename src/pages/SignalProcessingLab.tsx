import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Filter,
  Waves,
  RefreshCw,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  Dataset,
  ChannelId,
  FilterType,
  FilterParams,
  CHANNEL_CONFIGS,
  ProcessedSignalResult,
  MotionSimulationResult,
} from '../types/signal';
import {
  processSignal,
  decoupleMotionArtifact,
  computePowerSpectrum,
} from '../services/dspEngine';
import { RawVsFilteredChart } from '../components/charts/RawVsFilteredChart';
import { MotionArtifactChart } from '../components/charts/MotionArtifactChart';
import { SpectrumChart } from '../components/charts/SpectrumChart';

interface SignalProcessingLabProps {
  dataset: Dataset;
  onSaveToExperiment?: (processed: ProcessedSignalResult) => void;
}

export const SignalProcessingLab: React.FC<SignalProcessingLabProps> = ({
  dataset,
  onSaveToExperiment,
}) => {
  // Active channel selection
  const [selectedChannel, setSelectedChannel] = useState<ChannelId>('channel_680');

  // Filter configuration
  const [filterType, setFilterType] = useState<FilterType>('butterworth_lowpass');
  const [cutoffLow, setCutoffLow] = useState<number>(2.5); // Hz
  const [cutoffHigh, setCutoffHigh] = useState<number>(0.1); // Hz
  const [filterOrder, setFilterOrder] = useState<number>(2);
  const [windowSize, setWindowSize] = useState<number>(7);

  // Active laboratory tab: 'filtering' | 'motion' | 'spatial'
  const [labTab, setLabTab] = useState<'filtering' | 'motion' | 'spatial'>('filtering');

  // Motion simulation controls
  const [motionIntensity, setMotionIntensity] = useState<number>(0.4);

  // Compute processed signal dynamically
  const filterParams: FilterParams = useMemo(
    () => ({
      filterType,
      cutoffLow,
      cutoffHigh,
      order: filterOrder,
      windowSize,
    }),
    [filterType, cutoffLow, cutoffHigh, filterOrder, windowSize]
  );

  const rawSignal = useMemo(() => {
    return dataset.data.map((d) => d[selectedChannel] ?? 0);
  }, [dataset, selectedChannel]);

  const timestamps = useMemo(() => {
    return dataset.data.map((d) => d.timestamp);
  }, [dataset]);

  const processedResult: ProcessedSignalResult = useMemo(() => {
    return processSignal(
      rawSignal,
      timestamps,
      selectedChannel,
      dataset.samplingRate,
      filterParams
    );
  }, [rawSignal, timestamps, selectedChannel, dataset.samplingRate, filterParams]);

  // Compute frequency power spectrum
  const powerSpectrum = useMemo(() => {
    return computePowerSpectrum(rawSignal, dataset.samplingRate, 4.0);
  }, [rawSignal, dataset.samplingRate]);

  // Motion artifact decoupling computation
  const motionResult: MotionSimulationResult = useMemo(() => {
    const motionRef = dataset.data.map((d) => d.motion_reference ?? 0);
    return decoupleMotionArtifact(
      rawSignal,
      motionRef,
      timestamps,
      selectedChannel
    );
  }, [rawSignal, dataset.data, timestamps, selectedChannel]);

  // Reset to optimal defaults
  const handleResetDefaults = () => {
    setFilterType('butterworth_lowpass');
    setCutoffLow(2.5);
    setCutoffHigh(0.1);
    setFilterOrder(2);
    setWindowSize(7);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
            Digital Signal Processing & Decoupling Laboratory
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            DSP & Motion Artifact Laboratory
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Zero-phase Butterworth IIR filtering, windowed smoothing, adaptive motion reference subtraction, and spectral power density analysis.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setLabTab('filtering')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              labTab === 'filtering'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            IIR & FIR Filtering
          </button>
          <button
            onClick={() => setLabTab('motion')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              labTab === 'motion'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Motion Decoupling
          </button>
          <button
            onClick={() => setLabTab('spatial')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              labTab === 'spatial'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Spatial Analysis
          </button>
        </div>
      </div>

      {/* Channel Selector Ribbon */}
      <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Target Wavelength Channel:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.values(CHANNEL_CONFIGS).map((ch) => {
            const isSelected = selectedChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 border-slate-700 text-white font-semibold'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                <span>{ch.wavelength} nm</span>
                <span className="text-slate-400 text-[11px]">({ch.targetChromophore.split(' ')[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {labTab === 'filtering' && (
        <div className="space-y-6">
          {/* Main Filter Canvas Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Filter Parameter Controller (4 Cols) */}
            <div className="lg:col-span-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Filter Parameters
                    </h3>
                  </div>
                  <button
                    onClick={handleResetDefaults}
                    className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 font-mono"
                    title="Reset to defaults"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Filter Topology Selection */}
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5">
                    Filter Topology
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2 font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="butterworth_lowpass">Butterworth Lowpass (Zero-Phase)</option>
                    <option value="butterworth_bandpass">Butterworth Bandpass (0.1 - 3.0 Hz)</option>
                    <option value="butterworth_highpass">Butterworth Highpass (DC drift removal)</option>
                    <option value="moving_average">Moving Average (FIR Smoothing)</option>
                    <option value="median">Median Filter (Impulsive Spike Filter)</option>
                  </select>
                </div>

                {/* Butterworth Lowpass cutoff */}
                {(filterType === 'butterworth_lowpass' || filterType === 'butterworth_bandpass') && (
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Lowpass Cutoff (fc):</span>
                      <span className="text-cyan-300 font-semibold">{cutoffLow.toFixed(1)} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max={Math.min(10, dataset.samplingRate / 2 - 0.5)}
                      step="0.1"
                      value={cutoffLow}
                      onChange={(e) => setCutoffLow(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      Nyquist limit: {(dataset.samplingRate / 2).toFixed(1)} Hz
                    </span>
                  </div>
                )}

                {/* Butterworth Highpass cutoff */}
                {(filterType === 'butterworth_highpass' || filterType === 'butterworth_bandpass') && (
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Highpass Cutoff:</span>
                      <span className="text-violet-300 font-semibold">{cutoffHigh.toFixed(2)} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="1.5"
                      step="0.02"
                      value={cutoffHigh}
                      onChange={(e) => setCutoffHigh(Number(e.target.value))}
                      className="w-full accent-violet-400"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      Removes slow thermal and hydrostatic drift
                    </span>
                  </div>
                )}

                {/* Filter Order */}
                {filterType.startsWith('butterworth') && (
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Filter Order (N):</span>
                      <span className="text-slate-200 font-semibold">{filterOrder}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 4, 6].map((ord) => (
                        <button
                          key={ord}
                          onClick={() => setFilterOrder(ord)}
                          className={`py-1 text-xs font-mono rounded border transition-colors ${
                            filterOrder === ord
                              ? 'bg-slate-800 border-cyan-500/50 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          N={ord}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Window Size (for moving average & median) */}
                {(filterType === 'moving_average' || filterType === 'median') && (
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Window Size (W):</span>
                      <span className="text-slate-200 font-semibold">{windowSize} taps</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="31"
                      step="2"
                      value={windowSize}
                      onChange={(e) => setWindowSize(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 font-mono">
                      Span: {((windowSize / dataset.samplingRate) * 1000).toFixed(0)} ms window
                    </span>
                  </div>
                )}
              </div>

              {/* Theoretical Explanation Card */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Mathematical Principle</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {filterType === 'butterworth_lowpass' &&
                    'Butterworth 2nd-order maximally flat response. Zero-phase forward-backward convolution (filtfilt) prevents phase distortion, preserving systolic peak alignment.'}
                  {filterType === 'butterworth_bandpass' &&
                    'Cascaded highpass (0.1Hz) and lowpass (3.0Hz) filters isolate hemodynamic cardiac pulsatility while suppressing baseline drifts and high-frequency instrumentation noise.'}
                  {filterType === 'butterworth_highpass' &&
                    'Removes quasi-static baseline drift caused by crew postural changes or probe warm-up, passing frequencies above cutoff.'}
                  {filterType === 'moving_average' &&
                    'Linear finite impulse response (FIR) boxcar filter. Uniform moving average smooths high-frequency fluctuations with linear group delay.'}
                  {filterType === 'median' &&
                    'Non-linear rank-order filter. Highly effective at rejecting isolated movement spikes without rounding off sharp physiological wave edges.'}
                </p>
              </div>
            </div>

            {/* Signal Visualisation & Power Spectrum (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              <RawVsFilteredChart result={processedResult} height={340} />
              <SpectrumChart spectrum={powerSpectrum} height={180} />
            </div>
          </div>
        </div>
      )}

      {labTab === 'motion' && (
        <div className="space-y-6">
          {/* Motion Artifact Decoupling View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-[#0c101a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Motion Artifact Disturbance
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Microgravity crew movement simulation
                  </p>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Movement Disturbance Profile:
                  </label>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded text-xs space-y-2 text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Event 1 (t=8.5s–10.5s):</span>
                      <span className="text-amber-400">Head Rotation</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Event 2 (t=21.0s–22.8s):</span>
                      <span className="text-rose-400">Sensor Slippage</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">
                    Motion Reference Channel:
                  </label>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses the synchronized inertial/short-distance sensor channel to model the correlated disturbance vector.
                  </p>
                </div>

                <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded text-xs text-cyan-300">
                  <div className="font-semibold font-mono uppercase text-[11px]">
                    Adaptive Projection Method
                  </div>
                  <div className="mt-1 text-slate-300 text-[11px] font-mono leading-relaxed">
                    s_clean = s_obs - α · m_ref
                    <br />
                    α = ⟨s, m⟩ / ⟨m, m⟩
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex justify-between py-1">
                  <span>Artifact Reduction:</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {motionResult.artifactReductionRatio}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Pre-Decoupling SNR:</span>
                  <span className="text-rose-400 font-mono">{motionResult.snrBefore} dB</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Post-Decoupling SNR:</span>
                  <span className="text-cyan-400 font-mono font-semibold">{motionResult.snrAfter} dB</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <MotionArtifactChart result={motionResult} height={360} />
            </div>
          </div>
        </div>
      )}

      {labTab === 'spatial' && (
        <div className="space-y-6">
          {/* Spatial Analysis Demonstration */}
          <div className="bg-[#0c101a] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
              <Waves className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">
                Four-Channel Multi-Distance Spatial Decomposition Demonstration
              </h3>
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-lg mb-6 text-xs text-amber-300 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold uppercase tracking-wider block font-mono text-[11px]">
                  Methodological Boundary Notice
                </span>
                <span className="text-slate-300 text-xs mt-0.5 block leading-relaxed">
                  This multi-distance spatial analysis demonstrates an illustrative reference-subtraction concept on synthetic signals. It does NOT claim to reproduce SpaceLith’s proprietary Monte Carlo photon transport model or clinical intracranial hemodynamic reconstruction.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(CHANNEL_CONFIGS).map((ch) => (
                <div
                  key={ch.id}
                  className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold" style={{ color: ch.color }}>
                      {ch.wavelength} nm
                    </span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">
                      Layer Sensitivity
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    {ch.targetChromophore}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {ch.id === 'channel_680' &&
                      'Superficial scalp venous drainage vs. deep jugular venous backpressure under headward microgravity fluid shift.'}
                    {ch.id === 'channel_780' &&
                      'Isosbestic cross-normalization eliminates non-specific optical scattering and source intensity fluctuations.'}
                    {ch.id === 'channel_850' &&
                      'High optical absorption in oxygenated arterial blood monitors cerebral autoregulatory pulsatility.'}
                    {ch.id === 'channel_1064' &&
                      'Differential water absorption band indexes interstitial brain hydration and perivascular space dynamics in SANS.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
