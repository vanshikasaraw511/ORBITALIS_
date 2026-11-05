import numpy as np
from scipy import signal
from typing import List, Dict, Any

def apply_signal_processing(
    raw_signal: List[float],
    timestamps: List[float],
    fs: int = 25,
    filter_type: str = "butterworth_lowpass",
    cutoff_low: float = 2.5,
    cutoff_high: float = 0.1,
    order: int = 2,
    window_size: int = 7
) -> Dict[str, Any]:
    x = np.array(raw_signal, dtype=np.float64)
    nyq = 0.5 * fs

    if filter_type == "butterworth_lowpass":
        norm_cutoff = min(0.99, max(0.01, cutoff_low / nyq))
        b, a = signal.butter(order, norm_cutoff, btype='low', analog=False)
        filtered = signal.filtfilt(b, a, x)
    elif filter_type == "butterworth_highpass":
        norm_cutoff = min(0.99, max(0.01, cutoff_high / nyq))
        b, a = signal.butter(order, norm_cutoff, btype='high', analog=False)
        filtered = signal.filtfilt(b, a, x)
    elif filter_type == "butterworth_bandpass":
        low = min(0.98, max(0.01, cutoff_high / nyq))
        high = min(0.99, max(low + 0.01, cutoff_low / nyq))
        b, a = signal.butter(order, [low, high], btype='bandpass', analog=False)
        filtered = signal.filtfilt(b, a, x)
    elif filter_type == "moving_average":
        w = max(1, window_size)
        kernel = np.ones(w) / w
        filtered = np.convolve(x, kernel, mode='same')
    elif filter_type == "median":
        w = max(3, window_size if window_size % 2 != 0 else window_size + 1)
        filtered = signal.medfilt(x, kernel_size=w)
    else:
        filtered = x.copy()

    # Noise estimation
    residual = x - filtered
    rms_noise = float(np.sqrt(np.mean(residual ** 2)))
    rms_signal = float(np.sqrt(np.mean(filtered ** 2)))

    snr_gain = 20 * np.log10(max(1.0, rms_signal / max(1e-8, rms_noise)))
    raw_mean = float(np.mean(x))
    raw_std = float(np.std(x))
    snr_raw = 20 * np.log10(max(1.0, abs(raw_mean) / max(1e-6, raw_std)))
    snr_filtered = snr_raw + snr_gain

    return {
        "filtered_signal": [round(float(v), 4) for v in filtered],
        "snr_raw": round(float(snr_raw), 2),
        "snr_filtered": round(float(snr_filtered), 2),
        "snr_gain_db": round(float(snr_gain), 2),
        "rms_noise": round(float(rms_noise), 5),
    }
