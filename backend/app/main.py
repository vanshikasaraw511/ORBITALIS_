from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import data_routes, signal_routes, anomaly_routes

app = FastAPI(
    title="ORBITALIS — Space Biomedical Intelligence Backend API",
    description="REST API for 4-channel spaceflight neuro-hemodynamic optical signal processing, motion decoupling, and anomaly detection.",
    version="1.0.0"
)

# CORS configuration to allow local Vite frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(data_routes.router)
app.include_router(signal_routes.router)
app.include_router(anomaly_routes.router)

@app.get("/health", tags=["Health & Status"])
async def health_check():
    """Health check endpoint to verify backend availability."""
    return {
        "status": "nominal",
        "service": "ORBITALIS Backend Engine",
        "version": "1.0.0",
        "frameworks": ["FastAPI", "NumPy", "SciPy", "Scikit-learn", "Pandas"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
