import numpy as np
from typing import List, Dict, Any

def decouple_motion(
    observed: List[float],
    motion_ref: List[float],
    timestamps: List[float]
) -> Dict[str, Any]:
    y = np.array(observed, dtype=np.float64)
    m = np.array(motion_ref, dtype=np.float64)

    y_mean = np.mean(y)
    m_mean = np.mean(m)

    y_cent = y - y_mean
    m_cent = m - m_mean

    ref_dot = np.sum(m_cent ** 2)
    cross_dot = np.sum(y_cent * m_cent)

    alpha = cross_dot / ref_dot if ref_dot > 1e-8 else 0.0

    artifact = alpha * m_cent
    corrected = y - artifact

    orig_var = float(np.var(y))
    res_var = float(np.var(corrected))

    reduction_ratio = max(0.0, min(99.9, ((orig_var - res_var) / orig_var) * 100)) if orig_var > 0 else 0.0

    snr_before = 20 * np.log10(max(1.0, abs(float(y_mean)) / max(1e-6, np.sqrt(orig_var))))
    snr_after = 20 * np.log10(max(1.0, abs(float(np.mean(corrected))) / max(1e-6, np.sqrt(res_var))))

    return {
        "corrected_signal": [round(float(v), 4) for v in corrected],
        "estimated_artifact": [round(float(v), 4) for v in artifact],
        "artifact_reduction_ratio": round(float(reduction_ratio), 1),
        "snr_before": round(float(snr_before), 2),
        "snr_after": round(float(snr_after), 2),
    }
