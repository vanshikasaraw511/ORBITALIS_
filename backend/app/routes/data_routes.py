from fastapi import APIRouter, Query, UploadFile, File, HTTPException
import pandas as pd
import io
from ..models.schemas import DatasetResponse
from ..services.generator_service import generate_synthetic_data

router = APIRouter(tags=["Dataset Operations"])

@router.get("/sample-data", response_model=DatasetResponse)
async def get_sample_data(
    duration: float = Query(30.0, ge=10.0, le=120.0),
    sampling_rate: int = Query(25, ge=10, le=100),
    seed: int = Query(42),
    motion_intensity: float = Query(0.4, ge=0.0, le=1.0),
):
    """Generate reproducible 4-channel synthetic optical telemetry."""
    data = generate_synthetic_data(
        duration=duration,
        fs=sampling_rate,
        seed=seed,
        motion_intensity=motion_intensity
    )
    return data

@router.post("/validate-data")
async def validate_uploaded_csv(file: UploadFile = File(...)):
    """Validate user uploaded CSV structure and return column summary."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        required_channels = ["channel_680", "channel_780", "channel_850", "channel_1064"]
        missing = [ch for ch in required_channels if ch not in df.columns]

        if missing:
            return {
                "is_valid": False,
                "error": f"Missing required optical wavelength channels: {missing}",
                "detected_columns": list(df.columns)
            }

        return {
            "is_valid": True,
            "row_count": len(df),
            "columns": list(df.columns),
            "has_motion_reference": "motion_reference" in df.columns,
            "null_count": int(df.isnull().sum().sum()),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
