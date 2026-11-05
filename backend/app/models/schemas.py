from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class DataPoint(BaseModel):
    timestamp: float
    channel_680: float
    channel_780: float
    channel_850: float
    channel_1064: float
    motion_reference: Optional[float] = 0.0

class DatasetStatistics(BaseModel):
    min: float
    max: float
    mean: float
    std: float
    snr_est: float

class DatasetResponse(BaseModel):
    id: str
    name: str
    description: str
    source: str
    sample_count: int
    sampling_rate: int
    duration_seconds: float
    data: List[DataPoint]
    column_names: List[str]
    has_motion_reference: bool
    statistics: Dict[str, DatasetStatistics]

class ProcessSignalRequest(BaseModel):
    raw_signal: List[float]
    timestamps: List[float]
    sampling_rate: int = 25
    filter_type: str = "butterworth_lowpass"  # butterworth_lowpass, butterworth_bandpass, moving_average, median
    cutoff_low: Optional[float] = 2.5
    cutoff_high: Optional[float] = 0.1
    order: Optional[int] = 2
    window_size: Optional[int] = 7

class ProcessSignalResponse(BaseModel):
    filtered_signal: List[float]
    snr_raw: float
    snr_filtered: float
    snr_gain_db: float
    rms_noise: float

class SimulateMotionRequest(BaseModel):
    observed_signal: List[float]
    motion_reference: List[float]
    timestamps: List[float]

class SimulateMotionResponse(BaseModel):
    corrected_signal: List[float]
    estimated_artifact: List[float]
    artifact_reduction_ratio: float
    snr_before: float
    snr_after: float

class AnomalyDetectRequest(BaseModel):
    signal: List[float]
    timestamps: List[float]
    method: str = "isolation_forest"  # isolation_forest or robust_zscore
    sensitivity: float = 0.05

class AnomalyPoint(BaseModel):
    index: int
    timestamp: float
    value: float
    score: float
    is_anomaly: bool
    reason: str

class FlaggedInterval(BaseModel):
    start: float
    end: float
    duration: float
    peak_score: float

class AnomalyDetectResponse(BaseModel):
    method: str
    total_samples: int
    anomaly_count: int
    anomaly_percentage: float
    flagged_intervals: List[FlaggedInterval]
    anomalies: List[AnomalyPoint]
