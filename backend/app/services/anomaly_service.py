import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

def detect_anomalies(
    signal_values: List[float],
    timestamps: List[float],
    method: str = "isolation_forest",
    sensitivity: float = 0.05
) -> Dict[str, Any]:
    x = np.array(signal_values, dtype=np.float64)
    t = np.array(timestamps, dtype=np.float64)
    n = len(x)

    anomalies = []
    flagged_indices = []

    if method == "isolation_forest" and n >= 15:
        # Multi-feature matrix:
        # Feature 0: raw amplitude
        # Feature 1: first derivative
        # Feature 2: rolling variance (window 7)
        diff = np.diff(x, prepend=x[0])
        rolling_var = np.zeros(n)
        for i in range(n):
            start = max(0, i - 3)
            end = min(n, i + 4)
            rolling_var[i] = np.var(x[start:end])

        X = np.column_stack([x, diff, rolling_var])
        clf = IsolationForest(
            contamination=max(0.01, min(0.20, sensitivity)),
            random_state=42,
            n_estimators=50
        )
        preds = clf.fit_predict(X)  # -1 for anomaly, 1 for normal
        scores = -clf.decision_function(X)  # higher = more anomalous

        for i in range(n):
            is_anom = bool(preds[i] == -1)
            if is_anom:
                flagged_indices.append(i)
            anomalies.append({
                "index": i,
                "timestamp": round(float(t[i]), 3),
                "value": round(float(x[i]), 4),
                "score": round(float(scores[i]), 3),
                "is_anomaly": is_anom,
                "reason": "Multivariate feature isolation anomaly" if is_anom else "Within baseline cluster"
            })
    else:
        # Robust MAD Z-Score
        median = np.median(x)
        mad = np.median(np.abs(x - median))
        scale = mad * 1.4826 if mad > 1e-6 else 1e-3
        z_scores = np.abs(x - median) / scale
        thresh = sensitivity if sensitivity >= 1.5 else 3.0

        for i in range(n):
            is_anom = bool(z_scores[i] >= thresh)
            if is_anom:
                flagged_indices.append(i)
            anomalies.append({
                "index": i,
                "timestamp": round(float(t[i]), 3),
                "value": round(float(x[i]), 4),
                "score": round(float(z_scores[i]), 2),
                "is_anomaly": is_anom,
                "reason": f"Deviated by {z_scores[i]:.2f}σ from empirical median" if is_anom else "Nominal distribution"
            })

    # Group contiguous intervals
    intervals = []
    if flagged_indices:
        in_interval = False
        start_idx = 0
        peak_score = 0.0

        for i in range(n):
            if anomalies[i]["is_anomaly"]:
                if not in_interval:
                    in_interval = True
                    start_idx = i
                    peak_score = anomalies[i]["score"]
                else:
                    if anomalies[i]["score"] > peak_score:
                        peak_score = anomalies[i]["score"]
            else:
                if in_interval:
                    in_interval = False
                    start_time = float(t[start_idx])
                    end_time = float(t[i - 1])
                    intervals.append({
                        "start": round(start_time, 2),
                        "end": round(end_time, 2),
                        "duration": round(end_time - start_time, 2),
                        "peak_score": round(peak_score, 2)
                    })

        if in_interval:
            start_time = float(t[start_idx])
            end_time = float(t[-1])
            intervals.append({
                "start": round(start_time, 2),
                "end": round(end_time, 2),
                "duration": round(end_time - start_time, 2),
                "peak_score": round(peak_score, 2)
            })

    return {
        "method": method,
        "total_samples": n,
        "anomaly_count": len(flagged_indices),
        "anomaly_percentage": round((len(flagged_indices) / max(1, n)) * 100, 2),
        "flagged_intervals": intervals,
        "anomalies": anomalies
    }
