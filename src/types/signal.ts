export type ChannelId = 'channel_680' | 'channel_780' | 'channel_850' | 'channel_1064';

export interface ChannelMeta {
  id: ChannelId;
  name: string;
  wavelength: number; // in nm
  targetChromophore: string;
  role: string;
  color: string;
  unit: string;
}

export const CHANNEL_CONFIGS: Record<ChannelId, ChannelMeta> = {
  channel_680: {
    id: 'channel_680',
    name: 'Channel 1 (680 nm)',
    wavelength: 680,
    targetChromophore: 'Deoxyhemoglobin (HHb)',
    role: 'Deoxygenation sensitivity, venous pooling',
    color: '#06b6d4', // cyan-500
    unit: 'a.u.',
  },
  channel_780: {
    id: 'channel_780',
    name: 'Channel 2 (780 nm)',
    wavelength: 780,
    targetChromophore: 'Near-Isosbestic Reference',
    role: 'Total blood volume normalization baseline',
    color: '#8b5cf6', // violet-500
    unit: 'a.u.',
  },
  channel_850: {
    id: 'channel_850',
    name: 'Channel 3 (850 nm)',
    wavelength: 850,
    targetChromophore: 'Oxyhemoglobin (HbO2)',
    role: 'Arterial oxygenation & pulsatile hemodynamics',
    color: '#f43f5e', // rose-500
    unit: 'a.u.',
  },
  channel_1064: {
    id: 'channel_1064',
    name: 'Channel 4 (1064 nm)',
    wavelength: 1064,
    targetChromophore: 'Tissue Hydration / H2O',
    role: 'Fluid shift & cerebral interstitial water index',
    color: '#10b981', // emerald-500
    unit: 'a.u.',
  },
};

export interface DataPoint {
  timestamp: number; // time in seconds
  channel_680: number;
  channel_780: number;
  channel_850: number;
  channel_1064: number;
  motion_reference?: number;
  [key: string]: number | undefined;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  source: 'synthetic' | 'uploaded';
  createdAt: string;
  sampleCount: number;
  samplingRate: number; // in Hz (e.g. 25 Hz)
  durationSeconds: number;
  data: DataPoint[];
  columnNames: string[];
  hasMotionReference: boolean;
  statistics: Record<string, ChannelStats>;
}

export interface ChannelStats {
  min: number;
  max: number;
  mean: number;
  std: number;
  snrEst: number; // in dB
}

export type FilterType = 'butterworth_lowpass' | 'butterworth_highpass' | 'butterworth_bandpass' | 'moving_average' | 'median';

export interface FilterParams {
  filterType: FilterType;
  cutoffLow?: number; // Hz
  cutoffHigh?: number; // Hz
  order: number;
  windowSize: number; // for moving average
}

export interface ProcessedSignalResult {
  channelId: ChannelId;
  rawSignal: number[];
  filteredSignal: number[];
  timestamps: number[];
  snrRaw: number;
  snrFiltered: number;
  snrGainDb: number;
  rmsNoise: number;
  filterParams: FilterParams;
}

export interface MotionSimulationResult {
  channelId: ChannelId;
  timestamps: number[];
  cleanSignal: number[];
  disturbedSignal: number[];
  correctedSignal: number[];
  motionArtifact: number[];
  motionReference: number[];
  artifactReductionRatio: number; // %
  snrBefore: number;
  snrAfter: number;
}

export interface AnomalyPoint {
  index: number;
  timestamp: number;
  value: number;
  score: number; // Anomaly score / Z-score
  isAnomaly: boolean;
  reason: string;
}

export interface AnomalyDetectionResult {
  channelId: ChannelId;
  method: 'isolation_forest' | 'robust_zscore';
  sensitivity: number; // 0.01 - 0.20 or sigma 2.0 - 5.0
  totalSamples: number;
  anomalyCount: number;
  anomalyPercentage: number;
  flaggedIntervals: { start: number; end: number; duration: number; peakScore: number }[];
  anomalies: AnomalyPoint[];
}
