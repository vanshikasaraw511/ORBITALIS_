from fastapi import APIRouter
from ..models.schemas import (
    ProcessSignalRequest,
    ProcessSignalResponse,
    SimulateMotionRequest,
    SimulateMotionResponse
)
from ..services.signal_service import apply_signal_processing
from ..services.motion_service import decouple_motion

router = APIRouter(tags=["Signal Processing"])

@router.post("/process-signal", response_model=ProcessSignalResponse)
async def process_signal_endpoint(payload: ProcessSignalRequest):
    """Apply selected digital filter (Butterworth low/band/highpass, moving average, median)."""
    res = apply_signal_processing(
        raw_signal=payload.raw_signal,
        timestamps=payload.timestamps,
        fs=payload.sampling_rate,
        filter_type=payload.filter_type,
        cutoff_low=payload.cutoff_low or 2.5,
        cutoff_high=payload.cutoff_high or 0.1,
        order=payload.order or 2,
        window_size=payload.window_size or 7
    )
    return res

@router.post("/simulate-motion", response_model=SimulateMotionResponse)
async def simulate_motion_endpoint(payload: SimulateMotionRequest):
    """Perform adaptive least-squares reference subtraction for motion artifact reduction."""
    res = decouple_motion(
        observed=payload.observed_signal,
        motion_ref=payload.motion_reference,
        timestamps=payload.timestamps
    )
    return res
