"""
DepthWizard AI Microservice (SIH 26175)
FastAPI service orchestrating TensorFlow monocular depth estimation.
"""
import os
import sys
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Prevent noisy oneDNN logs from cluttering stdout
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("depthwizard.ai")

# Setup directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
MODELS_DIR = os.path.join(BASE_DIR, "models", "weights")
os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Import model engine modules
from src.model_engine import DepthEstimationEngine, MODEL_METADATA
from src.preprocessing import PreprocessingError

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler: Preloads the TensorFlow depth model ONCE at service startup.
    """
    logger.info("Initializing DepthWizard AI Service Lifespan...")
    model_path = os.path.join(MODELS_DIR, "midas_v21_small.tflite")
    try:
        engine = DepthEstimationEngine.get_instance(model_path=model_path)
        app.state.engine = engine
        logger.info("TensorFlow Monocular Depth Engine successfully initialized and ready.")
    except Exception as e:
        logger.error(f"Failed to preload depth model on startup: {e}")
        app.state.engine = None
    yield
    logger.info("Shutting down DepthWizard AI Service...")

app = FastAPI(
    title="DepthWizard AI Service",
    description="SIH 26175 — TensorFlow Monocular Depth Estimation & Metric Calibration Engine",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static outputs directory for direct preview and raw array access
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

@app.get("/")
def get_root():
    return {
        "service": "DepthWizard AI Inference Engine",
        "problemStatement": "SIH 26175",
        "status": "operational",
        "endpoints": {
            "health": "/api/inference/health",
            "inference": "/api/inference/depth",
            "metadata": "/api/v1/model/metadata"
        }
    }

@app.get("/health")
@app.get("/api/inference/health")
def get_inference_health():
    """
    Returns service health and model loading status.
    """
    try:
        import tensorflow as tf
        import keras
        import numpy as np

        engine = getattr(app.state, "engine", None)
        model_ready = engine is not None and engine.interpreter is not None

        return {
            "status": "healthy" if model_ready else "degraded",
            "service": "ai-service",
            "python_version": sys.version.split()[0],
            "tensorflow_version": tf.__version__,
            "keras_version": keras.__version__,
            "numpy_version": np.__version__,
            "model_loaded": model_ready,
            "model_metadata": MODEL_METADATA if model_ready else None,
            "framework_verified": True
        }
    except Exception as e:
        logger.error(f"Health check failure: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.get("/api/v1/model/metadata")
def get_model_metadata():
    """Returns technical metadata for the monocular depth neural network."""
    return MODEL_METADATA

@app.post("/api/inference/depth")
async def estimate_depth(
    image: UploadFile = File(..., description="Satellite or aerial image crop (PNG, JPG, GeoTIFF)"),
    colormap: str = Query("turbo", description="Color map for visualization: turbo, viridis, inferno, grayscale")
):
    """
    Executes real TensorFlow monocular depth estimation on the uploaded image.
    Returns preview paths, raw float32 .npy location, and execution metrics.
    """
    engine: Optional[DepthEstimationEngine] = getattr(app.state, "engine", None)
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Depth estimation engine is not loaded or failed initialization."
        )

    # 1. Read uploaded payload
    try:
        image_bytes = await image.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {e}"
        )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # 2. Run inference pipeline
    processing_id = f"proc_{uuid.uuid4().hex[:12]}"
    try:
        result = engine.run_inference(
            image_bytes=image_bytes,
            filename=image.filename or "uploaded_image.png",
            output_dir=OUTPUTS_DIR,
            processing_id=processing_id,
            colormap=colormap
        )
    except PreprocessingError as pe:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "PreprocessingValidationError", "message": str(pe)}
        )
    except Exception as e:
        logger.exception("Inference execution failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal inference failure: {e}"
        )

    # 3. Construct response matching required API specification
    host_base = "" # relative URL paths for frontend consumption
    preview_url = f"/outputs/{result['files']['preview_png_filename']}"
    grayscale_url = f"/outputs/{result['files']['grayscale_png_filename']}"
    raw_npy_url = f"/outputs/{result['files']['raw_npy_filename']}"

    return {
        "success": True,
        "processing_id": processing_id,
        "filename": image.filename,
        "prediction_dimensions": result["prediction_dimensions"],
        "depth_map_preview_url": preview_url,
        "grayscale_preview_url": grayscale_url,
        "raw_output_location": result["files"]["raw_npy_path"],
        "raw_npy_download_url": raw_npy_url,
        "inference_duration_ms": result["inference_duration_ms"],
        "total_processing_duration_ms": result["total_processing_duration_ms"],
        "model_name": result["model_info"]["model_name"],
        "model_version": "2.1-small",
        "output_type": result["output_type"],
        "is_metric": result["is_metric"],
        "scientific_notice": result["model_info"]["metric_notice"],
        "statistics": result["statistics"]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting DepthWizard AI Service on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
