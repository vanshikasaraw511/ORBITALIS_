from fastapi import APIRouter
from ..models.schemas import AnomalyDetectRequest, AnomalyDetectResponse
from ..services.anomaly_service import detect_anomalies

router = APIRouter(tags=["Anomaly Detection"])

@router.post("/detect-anomalies", response_model=AnomalyDetectResponse)
async def detect_anomalies_endpoint(payload: AnomalyDetectRequest):
    """Detect unusual signal intervals using Isolation Forest or MAD Z-Score."""
    res = detect_anomalies(
        signal_values=payload.signal,
        timestamps=payload.timestamps,
        method=payload.method,
        sensitivity=payload.sensitivity
    )
    return res
