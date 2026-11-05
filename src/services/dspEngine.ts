import { FilterParams, ProcessedSignalResult, ChannelId, MotionSimulationResult } from '../types/signal';

/**
 * Standard Butterworth 2nd-order section (Biquad) coefficients calculation
 * using Bilinear Transform with pre-warping.
 */
function getButterworthLowpassBiquad(fc: number, fs: number, Q = 0.7071) {
  const normFc = Math.min(0.49, Math.max(0.001, fc / fs));
  const omega = 2 * Math.PI * normFc;
  const alpha = Math.sin(omega) / (2 * Q);
  const cosw = Math.cos(omega);

  const b0 = (1 - cosw) / 2;
  const b1 = 1 - cosw;
  const b2 = (1 - cosw) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw;
  const a2 = 1 - alpha;

  return {
    b: [b0 / a0, b1 / a0, b2 / a0],
    a: [1, a1 / a0, a2 / a0],
  };
}

function getButterworthHighpassBiquad(fc: number, fs: number, Q = 0.7071) {
  const normFc = Math.min(0.49, Math.max(0.001, fc / fs));
  const omega = 2 * Math.PI * normFc;
  const alpha = Math.sin(omega) / (2 * Q);
  const cosw = Math.cos(omega);

  const b0 = (1 + cosw) / 2;
  const b1 = -(1 + cosw);
  const b2 = (1 + cosw) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw;
  const a2 = 1 - alpha;

  return {
    b: [b0 / a0, b1 / a0, b2 / a0],
    a: [1, a1 / a0, a2 / a0],
  };
}

/**
 * Single-pass Direct Form II Transposed IIR filter
 */
function applyIIRSection(x: number[], b: number[], a: number[]): number[] {
  const y = new Array(x.length);
  let d1 = 0;
  let d2 = 0;

  for (let i = 0; i < x.length; i++) {
    const input = x[i];
    const out = b[0] * input + d1;
    d1 = b[1] * input - a[1] * out + d2;
    d2 = b[2] * input - a[2] * out;
    y[i] = out;
  }

  return y;
}

/**
 * Zero-phase forward-backward filtering (filtfilt equivalent)
 * Eliminates phase shift so peaks align perfectly with original timestamps.
 */
function filtfiltBiquad(x: number[], b: number[], a: number[]): number[] {
  // Forward pass
  const forward = applyIIRSection(x, b, a);
  // Reverse
  const reversed = forward.slice().reverse();
  // Backward pass
  const backwardReversed = applyIIRSection(reversed, b, a);
  // Reverse back
  return backwardReversed.reverse();
}

/**
 * Moving average filter with edge padding
 */
export function movingAverage(x: number[], windowSize: number): number[] {
  const N = Math.max(1, Math.min(windowSize, Math.floor(x.length / 2)));
  if (N <= 1) return x.slice();

  const half = Math.floor(N / 2);
  const result = new Array(x.length);

  for (let i = 0; i < x.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      if (idx >= 0 && idx < x.length) {
        sum += x[idx];
        count++;
      }
    }
    result[i] = sum / count;
  }

  return result;
}

/**
 * Median filter for impulsive noise & motion spike suppression
 */
export function medianFilter(x: number[], windowSize: number): number[] {
  const N = Math.max(3, windowSize % 2 === 0 ? windowSize + 1 : windowSize);
  const half = Math.floor(N / 2);
  const result = new Array(x.length);

  for (let i = 0; i < x.length; i++) {
    const windowVals: number[] = [];
    for (let j = -half; j <= half; j++) {
      const idx = Math.min(Math.max(i + j, 0), x.length - 1);
      windowVals.push(x[idx]);
    }
    windowVals.sort((a, b) => a - b);
    result[i] = windowVals[half];
  }

  return result;
}

/**
 * High-precision Butterworth filter implementation
 */
export function applyButterworthFilter(
  x: number[],
  fs: number,
  type: 'lowpass' | 'highpass' | 'bandpass',
  fcLow = 3.0,
  fcHigh = 0.5,
  order = 2
): number[] {
  let filtered = x.slice();

  if (type === 'lowpass') {
    const cascades = Math.ceil(order / 2);
    for (let c = 0; c < cascades; c++) {
      const biquad = getButterworthLowpassBiquad(fcLow, fs);
      filtered = filtfiltBiquad(filtered, biquad.b, biquad.a);
    }
  } else if (type === 'highpass') {
    const cascades = Math.ceil(order / 2);
    for (let c = 0; c < cascades; c++) {
      const biquad = getButterworthHighpassBiquad(fcHigh, fs);
      filtered = filtfiltBiquad(filtered, biquad.b, biquad.a);
    }
  } else if (type === 'bandpass') {
    // Cascade highpass then lowpass
    const biquadHp = getButterworthHighpassBiquad(fcHigh, fs);
    const biquadLp = getButterworthLowpassBiquad(fcLow, fs);
    filtered = filtfiltBiquad(filtered, biquadHp.b, biquadHp.a);
    filtered = filtfiltBiquad(filtered, biquadLp.b, biquadLp.a);
  }

  return filtered;
}

/**
 * Calculate signal-to-noise ratio (SNR) in dB and noise statistics
 */
export function calculateSnrMetrics(raw: number[], filtered: number[]): {
  snrRaw: number;
  snrFiltered: number;
  snrGainDb: number;
  rmsNoise: number;
} {
  const len = Math.min(raw.length, filtered.length);
  if (len === 0) return { snrRaw: 0, snrFiltered: 0, snrGainDb: 0, rmsNoise: 0 };

  // Residual noise estimate = raw - filtered
  let noiseSumSq = 0;
  let signalSumSq = 0;

  for (let i = 0; i < len; i++) {
    const residual = raw[i] - filtered[i];
    noiseSumSq += residual * residual;
    signalSumSq += filtered[i] * filtered[i];
  }

  const rmsNoise = Math.sqrt(noiseSumSq / len);
  const rmsSignal = Math.sqrt(signalSumSq / len);

  const snrLinear = rmsNoise > 1e-9 ? rmsSignal / rmsNoise : 100;
  const snrGainDb = Number((20 * Math.log10(Math.max(1, snrLinear))).toFixed(2));

  // Baseline standard deviation noise estimate for raw
  const rawMean = raw.reduce((a, b) => a + b, 0) / len;
  const rawStd = Math.sqrt(raw.reduce((a, b) => a + Math.pow(b - rawMean, 2), 0) / len);
  const snrRaw = Number((20 * Math.log10(Math.max(1, Math.abs(rawMean) / (rawStd || 1)))).toFixed(2));
  const snrFiltered = Number((snrRaw + snrGainDb).toFixed(2));

  return {
    snrRaw,
    snrFiltered,
    snrGainDb,
    rmsNoise: Number(rmsNoise.toFixed(5)),
  };
}

/**
 * Complete Signal Processing execution function
 */
export function processSignal(
  raw: number[],
  timestamps: number[],
  channelId: ChannelId,
  fs: number,
  params: FilterParams
): ProcessedSignalResult {
  let filtered: number[] = [];

  switch (params.filterType) {
    case 'butterworth_lowpass':
      filtered = applyButterworthFilter(raw, fs, 'lowpass', params.cutoffLow ?? 2.5, undefined, params.order ?? 2);
      break;
    case 'butterworth_highpass':
      filtered = applyButterworthFilter(raw, fs, 'highpass', undefined, params.cutoffHigh ?? 0.1, params.order ?? 2);
      break;
    case 'butterworth_bandpass':
      filtered = applyButterworthFilter(
        raw,
        fs,
        'bandpass',
        params.cutoffLow ?? 2.5,
        params.cutoffHigh ?? 0.1,
        params.order ?? 2
      );
      break;
    case 'moving_average':
      filtered = movingAverage(raw, params.windowSize ?? 7);
      break;
    case 'median':
      filtered = medianFilter(raw, params.windowSize ?? 5);
      break;
    default:
      filtered = raw.slice();
  }

  const metrics = calculateSnrMetrics(raw, filtered);

  return {
    channelId,
    rawSignal: raw,
    filteredSignal: filtered,
    timestamps,
    snrRaw: metrics.snrRaw,
    snrFiltered: metrics.snrFiltered,
    snrGainDb: metrics.snrGainDb,
    rmsNoise: metrics.rmsNoise,
    filterParams: params,
  };
}

/**
 * Adaptive Reference Subtraction for Motion Artifact Decoupling
 * Models: s_observed(t) = s_clean(t) + alpha * motion_ref(t)
 * Estimates alpha via least squares projection: alpha = sum(s * m) / sum(m * m)
 */
export function decoupleMotionArtifact(
  observed: number[],
  motionRef: number[],
  timestamps: number[],
  channelId: ChannelId
): MotionSimulationResult {
  const len = Math.min(observed.length, motionRef.length);

  // Mean-center both signals for least-squares regression
  const obsMean = observed.reduce((a, b) => a + b, 0) / len;
  const refMean = motionRef.reduce((a, b) => a + b, 0) / len;

  let crossDot = 0;
  let refDot = 0;

  for (let i = 0; i < len; i++) {
    const dObs = observed[i] - obsMean;
    const dRef = motionRef[i] - refMean;
    crossDot += dObs * dRef;
    refDot += dRef * dRef;
  }

  const alpha = refDot > 1e-8 ? crossDot / refDot : 0;

  const corrected: number[] = new Array(len);
  const estimatedArtifact: number[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const artifact = alpha * (motionRef[i] - refMean);
    estimatedArtifact[i] = Number(artifact.toFixed(4));
    corrected[i] = Number((observed[i] - artifact).toFixed(4));
  }

  // Calculate artifact reduction metrics
  let origVar = 0;
  let residualVar = 0;
  const corrMean = corrected.reduce((a, b) => a + b, 0) / len;

  for (let i = 0; i < len; i++) {
    origVar += Math.pow(observed[i] - obsMean, 2);
    residualVar += Math.pow(corrected[i] - corrMean, 2);
  }

  const reductionRatio = origVar > 0 ? Math.max(0, Math.min(99.9, ((origVar - residualVar) / origVar) * 100)) : 0;

  return {
    channelId,
    timestamps,
    cleanSignal: corrected, // Estimated true physiological signal
    disturbedSignal: observed,
    correctedSignal: corrected,
    motionArtifact: estimatedArtifact,
    motionReference: motionRef,
    artifactReductionRatio: Number(reductionRatio.toFixed(1)),
    snrBefore: Number((20 * Math.log10(Math.max(1, Math.abs(obsMean) / Math.sqrt(origVar / len)))).toFixed(2)),
    snrAfter: Number((20 * Math.log10(Math.max(1, Math.abs(corrMean) / Math.sqrt(residualVar / len)))).toFixed(2)),
  };
}

/**
 * Fast Fourier Transform (FFT) Power Spectral Density estimation
 * Returns frequency (Hz) vs Power Spectral Density (dB/Hz)
 */
export function computePowerSpectrum(
  signal: number[],
  fs: number,
  maxFreq = 5.0
): { frequency: number; power: number }[] {
  const N = Math.min(512, Math.pow(2, Math.floor(Math.log2(signal.length))));
  if (N < 16) return [];

  // Remove mean DC offset
  const mean = signal.slice(0, N).reduce((a, b) => a + b, 0) / N;
  const x = signal.slice(0, N).map((v) => v - mean);

  // Apply Hanning window
  for (let i = 0; i < N; i++) {
    x[i] *= 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
  }

  const spectrum: { frequency: number; power: number }[] = [];
  const numBins = Math.floor((maxFreq * N) / fs);

  for (let k = 1; k < Math.min(numBins, N / 2); k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += x[n] * Math.cos(angle);
      im -= x[n] * Math.sin(angle);
    }
    const mag = Math.sqrt(re * re + im * im) / N;
    const powerDb = 20 * Math.log10(Math.max(1e-5, mag));
    const freq = Number(((k * fs) / N).toFixed(2));
    spectrum.push({ frequency: freq, power: Number(powerDb.toFixed(2)) });
  }

  return spectrum;
}
