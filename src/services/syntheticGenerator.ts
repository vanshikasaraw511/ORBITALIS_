import { DataPoint, Dataset, ChannelStats } from '../types/signal';

/**
 * Seedable pseudo-random number generator (Mulberry32)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SyntheticGeneratorOptions {
  durationSeconds?: number;
  samplingRate?: number;
  seed?: number;
  includeMotionArtifacts?: boolean;
  motionIntensity?: number; // 0 to 1
  includeAnomalies?: boolean;
  heartRateBpm?: number;
  respirationRateRpm?: number;
}

export function generateSyntheticDataset(
  name = 'SANS Simulation Baseline Dataset',
  options: SyntheticGeneratorOptions = {}
): Dataset {
  const duration = options.durationSeconds ?? 30; // 30 seconds
  const fs = options.samplingRate ?? 25; // 25 Hz
  const totalPoints = Math.round(duration * fs);
  const seed = options.seed ?? 42;
  const rng = mulberry32(seed);

  const heartRateHz = (options.heartRateBpm ?? 72) / 60; // ~1.2 Hz
  const respRateHz = (options.respirationRateRpm ?? 15) / 60; // ~0.25 Hz
  const mayerRateHz = 0.1; // ~0.1 Hz vasomotor Mayer wave

  const includeMotion = options.includeMotionArtifacts ?? true;
  const motionScale = options.motionIntensity ?? 0.4;
  const includeAnomalies = options.includeAnomalies ?? true;

  const data: DataPoint[] = [];

  // Motion transient profiles at specific time intervals
  // e.g. at t = 8.5s - 10.5s (head rotation), t = 21.0s - 22.8s (sensor bump)
  const motionEvent1Start = 8.5;
  const motionEvent1End = 10.5;
  const motionEvent2Start = 21.0;
  const motionEvent2End = 22.8;

  // Anomalous physiological interval (e.g., sudden microgravity venous stasis at t = 15.0s - 17.5s)
  const anomalyStart = 15.0;
  const anomalyEnd = 17.5;

  for (let i = 0; i < totalPoints; i++) {
    const t = Number((i / fs).toFixed(3));

    // Normal random noise generator (Box-Muller)
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    const gaussian = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Cardiac pulsatile wave (systolic peak + dicrotic notch)
    const cardiacPhase = 2 * Math.PI * heartRateHz * t;
    const cardiacPulse =
      Math.sin(cardiacPhase) +
      0.35 * Math.sin(2 * cardiacPhase + 0.4) +
      0.15 * Math.sin(3 * cardiacPhase + 0.9);

    // Respiratory envelope
    const respWave = Math.sin(2 * Math.PI * respRateHz * t);

    // Vasomotor Mayer wave
    const mayerWave = Math.sin(2 * Math.PI * mayerRateHz * t);

    // Motion reference generation (e.g. simulated 3-axis accelerometer norm or short separation optical channel)
    let motionRef = 0.05 * gaussian;
    let motionDisturbance = 0;

    if (includeMotion) {
      if (t >= motionEvent1Start && t <= motionEvent1End) {
        const localT = (t - motionEvent1Start) / (motionEvent1End - motionEvent1Start);
        // Biphasic jerk motion
        const spike = Math.sin(localT * 2 * Math.PI) * (1.8 + gaussian * 0.4) * motionScale;
        motionDisturbance += spike;
        motionRef += spike * 0.85 + gaussian * 0.1;
      }
      if (t >= motionEvent2Start && t <= motionEvent2End) {
        const localT = (t - motionEvent2Start) / (motionEvent2End - motionEvent2Start);
        const spike = Math.exp(-Math.pow((localT - 0.5) * 6, 2)) * 2.2 * motionScale;
        motionDisturbance += spike;
        motionRef += spike * 0.9 + gaussian * 0.1;
      }
    }

    // Physiological baseline values (simulated optical density / attenuation arbitrary units)
    // 680 nm: sensitive to deoxyhemoglobin (HHb). Increases with venous pooling.
    // 780 nm: near-isosbestic reference point. Reflects total blood volume.
    // 850 nm: sensitive to oxyhemoglobin (HbO2). High pulsatile amplitude.
    // 1064 nm: tissue hydration / interstitial fluid channel. Slower drift.

    let ch680Base = 1.45 + 0.04 * respWave + 0.02 * mayerWave + 0.02 * cardiacPulse;
    let ch780Base = 2.10 + 0.03 * respWave + 0.03 * mayerWave + 0.04 * cardiacPulse;
    let ch850Base = 1.85 + 0.05 * respWave + 0.04 * mayerWave + 0.09 * cardiacPulse;
    let ch1064Base = 0.95 + 0.01 * respWave + 0.03 * mayerWave + 0.01 * cardiacPulse;

    // Injected physiological anomaly (simulated microgravity cephalad fluid rush or transient IJV stagnation)
    if (includeAnomalies && t >= anomalyStart && t <= anomalyEnd) {
      const anomalyLocalT = (t - anomalyStart) / (anomalyEnd - anomalyStart);
      const envelope = Math.sin(anomalyLocalT * Math.PI);
      ch680Base += envelope * 0.22; // venous pooling of deoxyHb
      ch850Base -= envelope * 0.18; // oxyHb dip
      ch1064Base += envelope * 0.12; // interstitial fluid accumulation
    }

    // Combine with instrumentation noise (high frequency) and motion disturbance
    const noiseAmp = 0.015;
    const ch680Val = Number((ch680Base + motionDisturbance * 0.75 + gaussian * noiseAmp).toFixed(4));
    const ch780Val = Number((ch780Base + motionDisturbance * 0.70 + gaussian * noiseAmp).toFixed(4));
    const ch850Val = Number((ch850Base + motionDisturbance * 0.82 + gaussian * noiseAmp).toFixed(4));
    const ch1064Val = Number((ch1064Base + motionDisturbance * 0.45 + gaussian * (noiseAmp * 0.8)).toFixed(4));

    data.push({
      timestamp: t,
      channel_680: ch680Val,
      channel_780: ch780Val,
      channel_850: ch850Val,
      channel_1064: ch1064Val,
      motion_reference: Number(motionRef.toFixed(4)),
    });
  }

  // Calculate descriptive statistics for each channel
  const statistics = calculateDatasetStatistics(data);

  return {
    id: `DS-${Date.now().toString().slice(-6)}`,
    name,
    description: `Synthetic 4-channel neuro-hemodynamic dataset generated with fs = ${fs} Hz over ${duration} s. Includes cardiac (~${options.heartRateBpm ?? 72} bpm), respiratory (~${options.respirationRateRpm ?? 15} rpm), and Mayer oscillations.`,
    source: 'synthetic',
    createdAt: new Date().toISOString(),
    sampleCount: data.length,
    samplingRate: fs,
    durationSeconds: duration,
    data,
    columnNames: ['timestamp', 'channel_680', 'channel_780', 'channel_850', 'channel_1064', 'motion_reference'],
    hasMotionReference: true,
    statistics,
  };
}

export function calculateDatasetStatistics(data: DataPoint[]): Record<string, ChannelStats> {
  const channels = ['channel_680', 'channel_780', 'channel_850', 'channel_1064', 'motion_reference'] as const;
  const result: Record<string, ChannelStats> = {};

  for (const ch of channels) {
    const vals = data.map((d) => d[ch] ?? 0);
    if (vals.length === 0) continue;

    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    const mean = sum / vals.length;
    let varSum = 0;
    for (let i = 0; i < vals.length; i++) {
      varSum += Math.pow(vals[i] - mean, 2);
    }
    const std = Math.sqrt(varSum / vals.length);

    // Approximate Signal-to-Noise Ratio (mean / std in linear, converted to dB: 20 * log10(mean/std))
    const snrLinear = std > 0 ? Math.abs(mean) / std : 1;
    const snrEst = Number((20 * Math.log10(Math.max(1, snrLinear))).toFixed(2));

    result[ch] = {
      min: Number(min.toFixed(4)),
      max: Number(max.toFixed(4)),
      mean: Number(mean.toFixed(4)),
      std: Number(std.toFixed(4)),
      snrEst,
    };
  }

  return result;
}
