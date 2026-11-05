import numpy as np
from typing import Dict, Any

def generate_synthetic_data(
    duration: float = 30.0,
    fs: int = 25,
    heart_rate_bpm: float = 72.0,
    respiration_rpm: float = 15.0,
    motion_intensity: float = 0.4,
    seed: int = 42,
    include_anomalies: bool = True
) -> Dict[str, Any]:
    np.random.seed(seed)
    total_samples = int(duration * fs)
    t = np.linspace(0, duration, total_samples, endpoint=False)

    f_hr = heart_rate_bpm / 60.0
    f_resp = respiration_rpm / 60.0
    f_mayer = 0.1

    # Cardiac pulsatile wave (systolic + dicrotic notch)
    cardiac = np.sin(2 * np.pi * f_hr * t) + 0.35 * np.sin(4 * np.pi * f_hr * t + 0.4)
    # Respiratory envelope
    resp = np.sin(2 * np.pi * f_resp * t)
    # Mayer vasomotor wave
    mayer = np.sin(2 * np.pi * f_mayer * t)

    noise = np.random.normal(0, 0.015, total_samples)

    # Injected motion disturbances
    motion_ref = np.random.normal(0, 0.04, total_samples)
    motion_disturbance = np.zeros(total_samples)

    # Motion event 1: t=8.5 to 10.5
    mask1 = (t >= 8.5) & (t <= 10.5)
    if np.any(mask1):
        tau1 = (t[mask1] - 8.5) / 2.0
        spike1 = np.sin(tau1 * 2 * np.pi) * 2.0 * motion_intensity
        motion_disturbance[mask1] += spike1
        motion_ref[mask1] += spike1 * 0.9

    # Baselines for four wavelengths
    ch680 = 1.45 + 0.04 * resp + 0.02 * mayer + 0.02 * cardiac + motion_disturbance * 0.75 + noise
    ch780 = 2.10 + 0.03 * resp + 0.03 * mayer + 0.04 * cardiac + motion_disturbance * 0.70 + noise
    ch850 = 1.85 + 0.05 * resp + 0.04 * mayer + 0.09 * cardiac + motion_disturbance * 0.82 + noise
    ch1064 = 0.95 + 0.01 * resp + 0.03 * mayer + 0.01 * cardiac + motion_disturbance * 0.45 + noise * 0.8

    # Physiological anomaly: cephalad fluid stasis at t=15.0 to 17.5
    if include_anomalies:
        mask_anom = (t >= 15.0) & (t <= 17.5)
        if np.any(mask_anom):
            env = np.sin((t[mask_anom] - 15.0) / 2.5 * np.pi)
            ch680[mask_anom] += env * 0.22
            ch850[mask_anom] -= env * 0.18
            ch1064[mask_anom] += env * 0.12

    points = []
    for i in range(total_samples):
        points.append({
            "timestamp": round(float(t[i]), 3),
            "channel_680": round(float(ch680[i]), 4),
            "channel_780": round(float(ch780[i]), 4),
            "channel_850": round(float(ch850[i]), 4),
            "channel_1064": round(float(ch1064[i]), 4),
            "motion_reference": round(float(motion_ref[i]), 4),
        })

    def get_stats(arr):
        std_val = float(np.std(arr))
        mean_val = float(np.mean(arr))
        snr = 20 * np.log10(max(1.0, abs(mean_val) / max(1e-6, std_val)))
        return {
            "min": round(float(np.min(arr)), 4),
            "max": round(float(np.max(arr)), 4),
            "mean": round(mean_val, 4),
            "std": round(std_val, 4),
            "snr_est": round(float(snr), 2)
        }

    return {
        "id": f"DS-PY-{seed}",
        "name": f"Python Synthetic Telemetry (fs={fs}Hz, Seed={seed})",
        "description": "Synthetic multi-spectral optical hemodynamic record generated via NumPy backend",
        "source": "synthetic",
        "sample_count": total_samples,
        "sampling_rate": fs,
        "duration_seconds": duration,
        "data": points,
        "column_names": ["timestamp", "channel_680", "channel_780", "channel_850", "channel_1064", "motion_reference"],
        "has_motion_reference": True,
        "statistics": {
            "channel_680": get_stats(ch680),
            "channel_780": get_stats(ch780),
            "channel_850": get_stats(ch850),
            "channel_1064": get_stats(ch1064),
            "motion_reference": get_stats(motion_ref)
        }
    }
