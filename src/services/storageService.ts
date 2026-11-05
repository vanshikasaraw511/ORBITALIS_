import { Experiment } from '../types/experiment';
import { Dataset } from '../types/signal';

const STORAGE_KEY_EXPERIMENTS = 'orbitalis_experiments_v1';
const STORAGE_KEY_ACTIVE_DATASET = 'orbitalis_active_dataset_v1';

const DEFAULT_EXPERIMENTS: Experiment[] = [
  {
    id: 'EXP-2026-084',
    name: 'Cephalad Fluid Shift & Venous Stasis Simulation',
    description: 'Investigation of 680nm deoxyHb accumulation and 1064nm interstitial fluid index under simulated microgravity headward fluid redistribution.',
    date: '2026-10-28',
    investigator: 'V. Saraw (PI)',
    datasetId: 'DS-840192',
    datasetName: 'SANS Simulation Baseline Dataset',
    datasetSource: 'synthetic',
    targetChannel: 'channel_680',
    filterParams: {
      filterType: 'butterworth_lowpass',
      cutoffLow: 2.5,
      order: 2,
      windowSize: 7,
    },
    snrImprovementDb: 14.8,
    anomaliesDetected: 4,
    anomalyMethod: 'Isolation Forest (Contamination: 0.05)',
    notes: 'Low-pass filtering at 2.5Hz eliminated high-frequency shot noise while preserving cardiac pulse harmonics. Venous pooling anomaly flagged between t=15.0s and t=17.5s.',
    status: 'completed',
    keyFindings: [
      '680nm channel exhibited 0.22 a.u. baseline elevation during simulated stasis event',
      'Butterworth 2nd-order zero-phase filter improved SNR by +14.8 dB',
      'Adaptive motion reference subtraction reduced simulated movement artifact variance by 82.4%',
    ],
  },
  {
    id: 'EXP-2026-079',
    name: 'Four-Wavelength Multi-Distance Cross-Normalization',
    description: 'Benchmarking isosbestic 780nm reference channel against 850nm oxyhemoglobin arterial pulsatility during high-intensity crew exercise disturbance.',
    date: '2026-10-15',
    investigator: 'V. Saraw (PI)',
    datasetId: 'DS-791024',
    datasetName: 'Crew Exercise Motion Disturbance Run',
    datasetSource: 'synthetic',
    targetChannel: 'channel_850',
    filterParams: {
      filterType: 'butterworth_bandpass',
      cutoffLow: 3.0,
      cutoffHigh: 0.1,
      order: 4,
      windowSize: 9,
    },
    snrImprovementDb: 18.2,
    anomaliesDetected: 2,
    anomalyMethod: 'Robust MAD Z-Score (Threshold: 3.2σ)',
    notes: 'Bandpass filtering (0.1–3.0 Hz) isolated cardiac hemodynamic waveforms and removed low-frequency thermal drifts.',
    status: 'completed',
    keyFindings: [
      'Arterial pulse amplitude of 850nm remained identifiable through 0.4 intensity motion disturbances',
      'Near-isosbestic 780nm channel functioned effectively as optical normalization baseline',
    ],
  },
  {
    id: 'EXP-2026-062',
    name: '1064nm Optical Hydration Transient Benchmark',
    description: 'Initial verification of long-wavelength 1064nm channel sensitivity to extracellular tissue hydration in microgravity simulation.',
    date: '2026-09-30',
    investigator: 'V. Saraw (PI)',
    datasetId: 'DS-620411',
    datasetName: 'Hydration Transient Phase A',
    datasetSource: 'synthetic',
    targetChannel: 'channel_1064',
    filterParams: {
      filterType: 'moving_average',
      order: 1,
      windowSize: 11,
    },
    snrImprovementDb: 9.6,
    anomaliesDetected: 1,
    anomalyMethod: 'Isolation Forest (Contamination: 0.03)',
    notes: 'Moving average window of 11 samples effectively smoothed hydration drift while maintaining slow transient kinetics.',
    status: 'completed',
    keyFindings: [
      'Slow transient hydration shift detected at t=15.2s with isolation score 0.81',
      'Demonstrated compatibility with synthetic multi-spectral pipeline',
    ],
  },
];

export function loadExperiments(): Experiment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPERIMENTS);
    if (!raw) {
      saveExperiments(DEFAULT_EXPERIMENTS);
      return DEFAULT_EXPERIMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_EXPERIMENTS;
  } catch {
    return DEFAULT_EXPERIMENTS;
  }
}

export function saveExperiments(experiments: Experiment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXPERIMENTS, JSON.stringify(experiments));
  } catch (e) {
    console.error('Failed to save experiments to localStorage', e);
  }
}

export function addExperiment(exp: Experiment): Experiment[] {
  const current = loadExperiments();
  const updated = [exp, ...current.filter((e) => e.id !== exp.id)];
  saveExperiments(updated);
  return updated;
}

export function deleteExperiment(id: string): Experiment[] {
  const current = loadExperiments();
  const updated = current.filter((e) => e.id !== id);
  saveExperiments(updated);
  return updated;
}

export function loadActiveDataset(): Dataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_DATASET);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveDataset(dataset: Dataset): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_DATASET, JSON.stringify(dataset));
  } catch (e) {
    console.error('Failed to save dataset to localStorage', e);
  }
}
