import { ChannelId, AnomalyDetectionResult, AnomalyPoint } from '../types/signal';

interface FeatureVector {
  index: number;
  val: number;
  diff: number; // 1st derivative / rate of change
  rollingVar: number; // local variance
  localDev: number; // deviation from rolling median
}

/**
 * Robust Median Absolute Deviation (MAD) calculation
 */
function calculateMedian(arr: number[]): number {
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function detectRobustZScoreAnomalies(
  signal: number[],
  timestamps: number[],
  channelId: ChannelId,
  thresholdSigma = 3.0
): AnomalyDetectionResult {
  const n = signal.length;
  if (n < 5) {
    return {
      channelId,
      method: 'robust_zscore',
      sensitivity: thresholdSigma,
      totalSamples: n,
      anomalyCount: 0,
      anomalyPercentage: 0,
      flaggedIntervals: [],
      anomalies: [],
    };
  }

  const median = calculateMedian(signal);
  const absDiffs = signal.map((v) => Math.abs(v - median));
  const mad = calculateMedian(absDiffs);
  // Normal consistency constant 0.6745 -> 1.4826
  const madScale = mad > 1e-6 ? mad * 1.4826 : 1e-3;

  const points: AnomalyPoint[] = [];
  let anomalyCount = 0;

  for (let i = 0; i < n; i++) {
    const val = signal[i];
    const zScore = Math.abs(val - median) / madScale;
    const isAnomaly = zScore >= thresholdSigma;

    if (isAnomaly) anomalyCount++;

    let reason = 'Signal within normal empirical distribution';
    if (isAnomaly) {
      const direction = val > median ? 'elevation above' : 'depression below';
      reason = `Signal ${direction} median by ${zScore.toFixed(2)}σ (threshold: ${thresholdSigma}σ)`;
    }

    points.push({
      index: i,
      timestamp: timestamps[i],
      value: val,
      score: Number(zScore.toFixed(2)),
      isAnomaly,
      reason,
    });
  }

  const flaggedIntervals = extractContiguousIntervals(points, timestamps);

  return {
    channelId,
    method: 'robust_zscore',
    sensitivity: thresholdSigma,
    totalSamples: n,
    anomalyCount,
    anomalyPercentage: Number(((anomalyCount / n) * 100).toFixed(2)),
    flaggedIntervals,
    anomalies: points,
  };
}

/**
 * Isolation Forest multi-feature anomaly detection
 */
export function detectIsolationForestAnomalies(
  signal: number[],
  timestamps: number[],
  channelId: ChannelId,
  contamination = 0.05 // e.g. 5% expected anomaly contamination
): AnomalyDetectionResult {
  const n = signal.length;
  if (n < 10) {
    return detectRobustZScoreAnomalies(signal, timestamps, channelId, 3.0);
  }

  // Feature extraction:
  // 1. Raw value
  // 2. First derivative (diff)
  // 3. Rolling variance (window size 5)
  // 4. Local median deviation
  const window = 7;
  const half = Math.floor(window / 2);
  const features: FeatureVector[] = [];

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(n, i + half + 1);
    const slice = signal.slice(start, end);
    const localMedian = calculateMedian(slice);

    let varSum = 0;
    for (const v of slice) varSum += Math.pow(v - localMedian, 2);
    const rollingVar = varSum / slice.length;

    const diff = i > 0 ? Math.abs(signal[i] - signal[i - 1]) : 0;
    const localDev = Math.abs(signal[i] - localMedian);

    features.push({
      index: i,
      val: signal[i],
      diff,
      rollingVar,
      localDev,
    });
  }

  // Multi-tree Isolation Forest simulation
  const numTrees = 25;
  const subSampleSize = Math.min(64, n);
  const maxDepth = Math.ceil(Math.log2(subSampleSize));

  // c(n) average path length normalization
  const c = (size: number): number => {
    if (size <= 1) return 0;
    if (size === 2) return 1;
    const eulerGamma = 0.5772156649;
    return 2 * (Math.log(size - 1) + eulerGamma) - (2 * (size - 1)) / size;
  };
  const cNorm = c(subSampleSize) || 1;

  const pathLengths: number[] = new Array(n).fill(0);

  for (let t = 0; t < numTrees; t++) {
    // Random subsample
    const sampleIndices: number[] = [];
    while (sampleIndices.length < subSampleSize) {
      const idx = Math.floor(Math.random() * n);
      if (!sampleIndices.includes(idx)) sampleIndices.push(idx);
    }

    // Build random isolation tree
    interface iNode {
      feature: 'val' | 'diff' | 'rollingVar' | 'localDev';
      splitValue: number;
      left?: iNode;
      right?: iNode;
      isLeaf: boolean;
      size: number;
    }

    const featureKeys: ('val' | 'diff' | 'rollingVar' | 'localDev')[] = ['val', 'diff', 'rollingVar', 'localDev'];

    const buildTree = (indices: number[], depth: number): iNode => {
      if (depth >= maxDepth || indices.length <= 1) {
        return { feature: 'val', splitValue: 0, isLeaf: true, size: indices.length };
      }

      const fKey = featureKeys[Math.floor(Math.random() * featureKeys.length)];
      const vals = indices.map((idx) => features[idx][fKey]);
      const minVal = Math.min(...vals);
      const maxVal = Math.max(...vals);

      if (Math.abs(maxVal - minVal) < 1e-6) {
        return { feature: fKey, splitValue: minVal, isLeaf: true, size: indices.length };
      }

      const split = minVal + Math.random() * (maxVal - minVal);
      const leftIdx = indices.filter((idx) => features[idx][fKey] < split);
      const rightIdx = indices.filter((idx) => features[idx][fKey] >= split);

      return {
        feature: fKey,
        splitValue: split,
        isLeaf: false,
        size: indices.length,
        left: buildTree(leftIdx, depth + 1),
        right: buildTree(rightIdx, depth + 1),
      };
    };

    const root = buildTree(sampleIndices, 0);

    const evaluatePath = (node: iNode, fv: FeatureVector, depth: number): number => {
      if (node.isLeaf) {
        return depth + c(node.size);
      }
      if (fv[node.feature] < node.splitValue) {
        return node.left ? evaluatePath(node.left, fv, depth + 1) : depth;
      } else {
        return node.right ? evaluatePath(node.right, fv, depth + 1) : depth;
      }
    };

    for (let i = 0; i < n; i++) {
      pathLengths[i] += evaluatePath(root, features[i], 0);
    }
  }

  // Calculate anomaly scores s = 2 ^ (-E(h) / c(subSample))
  // s close to 1 indicates an anomaly; s < 0.5 indicates normal.
  const rawScores: { index: number; score: number }[] = [];
  for (let i = 0; i < n; i++) {
    const avgH = pathLengths[i] / numTrees;
    const score = Math.pow(2, -avgH / cNorm);
    rawScores.push({ index: i, score });
  }

  // Determine threshold based on contamination
  const sortedScores = rawScores.map((s) => s.score).sort((a, b) => b - a);
  const cutoffIndex = Math.min(sortedScores.length - 1, Math.max(1, Math.floor(contamination * n)));
  const thresholdScore = sortedScores[cutoffIndex];

  const points: AnomalyPoint[] = [];
  let anomalyCount = 0;

  for (let i = 0; i < n; i++) {
    const score = Number(rawScores[i].score.toFixed(3));
    const isAnomaly = score >= thresholdScore;
    if (isAnomaly) anomalyCount++;

    const fv = features[i];
    let reason = 'Signal aligns with baseline isolation paths';
    if (isAnomaly) {
      if (fv.diff > 0.08) {
        reason = `High dynamic transition rate (Δy=${fv.diff.toFixed(3)}) with abnormal isolation depth`;
      } else if (fv.rollingVar > 0.005) {
        reason = `Local variance burst (σ²=${fv.rollingVar.toFixed(4)}) isolated in early tree splits`;
      } else {
        reason = `Multi-feature outlier (score=${score}) deviating from cluster`;
      }
    }

    points.push({
      index: i,
      timestamp: timestamps[i],
      value: signal[i],
      score,
      isAnomaly,
      reason,
    });
  }

  const flaggedIntervals = extractContiguousIntervals(points, timestamps);

  return {
    channelId,
    method: 'isolation_forest',
    sensitivity: contamination,
    totalSamples: n,
    anomalyCount,
    anomalyPercentage: Number(((anomalyCount / n) * 100).toFixed(2)),
    flaggedIntervals,
    anomalies: points,
  };
}

function extractContiguousIntervals(
  points: AnomalyPoint[],
  timestamps: number[]
): { start: number; end: number; duration: number; peakScore: number }[] {
  const intervals: { start: number; end: number; duration: number; peakScore: number }[] = [];
  let inInterval = false;
  let startIdx = 0;
  let peakScore = 0;

  for (let i = 0; i < points.length; i++) {
    if (points[i].isAnomaly) {
      if (!inInterval) {
        inInterval = true;
        startIdx = i;
        peakScore = points[i].score;
      } else {
        if (points[i].score > peakScore) peakScore = points[i].score;
      }
    } else {
      if (inInterval) {
        inInterval = false;
        const startTime = timestamps[startIdx];
        const endTime = timestamps[i - 1];
        intervals.push({
          start: startTime,
          end: endTime,
          duration: Number((endTime - startTime).toFixed(2)),
          peakScore: Number(peakScore.toFixed(2)),
        });
      }
    }
  }

  if (inInterval) {
    const startTime = timestamps[startIdx];
    const endTime = timestamps[timestamps.length - 1];
    intervals.push({
      start: startTime,
      end: endTime,
      duration: Number((endTime - startTime).toFixed(2)),
      peakScore: Number(peakScore.toFixed(2)),
    });
  }

  return intervals;
}
