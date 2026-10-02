"""
Comprehensive Phase 3 Test Suite for DepthWizard AI Monocular Depth Estimation.
Validates:
1. Model loading once and single-instance integrity.
2. Inference across >= 5 diverse geospatial synthetic / real optical crops.
3. Dimension preservation (prediction shape matches source shape).
4. Finite numerical values (no NaNs, no Infs).
5. Different inputs produce measurably different predictions.
6. Boundary conditions: Very small images, large images.
7. Error handling: Corrupted bytes, empty files, non-image formats.
"""
import os
import io
import sys
import time
import pytest
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.model_engine import DepthEstimationEngine
from src.preprocessing import PreprocessingError

TEST_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_outputs")
os.makedirs(TEST_OUTPUT_DIR, exist_ok=True)

def generate_synthetic_landscape(h: int, w: int, terrain_type: str) -> bytes:
    """Generates synthetic multi-spectral / optical test images for diverse terrain types."""
    x = np.linspace(-3, 3, w)
    y = np.linspace(-3, 3, h)
    xx, yy = np.meshgrid(x, y)

    if terrain_type == "mountain":
        # Sharp high-frequency peaks
        z = np.sin(xx * 2.5) * np.cos(yy * 2.5) + 0.5 * np.cos(xx * 5.0)
    elif terrain_type == "volcano":
        # Radial conical crater
        r = np.sqrt(xx**2 + yy**2)
        z = np.exp(-r**2 / 2.0) - 0.3 * np.exp(-((r - 1.2)**2) / 0.1)
    elif terrain_type == "coastal":
        # Abrupt stepped cliff edge
        z = np.tanh(xx * 2.0 + yy * 0.5)
    elif terrain_type == "dunes":
        # Wavy parallel sand ripples
        z = np.sin(xx * 4.0 + np.sin(yy * 2.0))
    elif terrain_type == "urban_grid":
        # Discrete geometric grid blocks
        z = (np.sin(xx * 10) > 0).astype(float) * (np.cos(yy * 10) > 0).astype(float)
    else:
        z = np.random.uniform(0, 1, (h, w))

    # Normalize to [0, 255]
    z_norm = (z - z.min()) / (z.max() - z.min() + 1e-7)
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    rgb[..., 0] = (z_norm * 180 + 40).astype(np.uint8)
    rgb[..., 1] = (z_norm * 160 + 50).astype(np.uint8)
    rgb[..., 2] = (z_norm * 140 + 60).astype(np.uint8)

    img = Image.fromarray(rgb)
    bio = io.BytesIO()
    img.save(bio, format="PNG")
    return bio.getvalue()

def test_engine_singleton():
    """Verify DepthEstimationEngine adheres to singleton pattern."""
    engine1 = DepthEstimationEngine.get_instance()
    engine2 = DepthEstimationEngine.get_instance()
    assert engine1 is engine2
    assert engine1.interpreter is not None

def test_five_diverse_samples_and_variance():
    """
    Test 5 different terrain types.
    Verify:
    - Successful execution
    - Finite predictions
    - Output dimensions match source
    - Different inputs produce different outputs
    """
    engine = DepthEstimationEngine.get_instance()
    terrains = ["mountain", "volcano", "coastal", "dunes", "urban_grid"]
    predictions = []

    for terrain in terrains:
        img_bytes = generate_synthetic_landscape(384, 512, terrain)
        result = engine.run_inference(
            image_bytes=img_bytes,
            filename=f"sample_{terrain}.png",
            output_dir=TEST_OUTPUT_DIR,
            processing_id=f"test_{terrain}",
            colormap="turbo"
        )

        assert result["prediction_dimensions"]["width"] == 512
        assert result["prediction_dimensions"]["height"] == 384
        assert result["statistics"]["is_finite"] is True
        assert os.path.exists(result["files"]["raw_npy_path"])
        assert os.path.exists(result["files"]["preview_png_path"])

        raw_arr = np.load(result["files"]["raw_npy_path"])
        assert raw_arr.shape == (384, 512)
        assert not np.isnan(raw_arr).any()
        assert not np.isinf(raw_arr).any()
        predictions.append(raw_arr)

    # Verify that different inputs produced different depth predictions
    for i in range(len(predictions)):
        for j in range(i + 1, len(predictions)):
            diff = np.abs(predictions[i] - predictions[j]).mean()
            assert diff > 1.0, f"Predictions for terrain {terrains[i]} and {terrains[j]} were identical!"

def test_small_image():
    """Test boundary condition: small 32x32 image."""
    engine = DepthEstimationEngine.get_instance()
    small_bytes = generate_synthetic_landscape(32, 32, "mountain")
    result = engine.run_inference(
        image_bytes=small_bytes,
        filename="small.png",
        output_dir=TEST_OUTPUT_DIR,
        processing_id="test_small",
        colormap="viridis"
    )
    assert result["prediction_dimensions"]["width"] == 32
    assert result["prediction_dimensions"]["height"] == 32
    assert result["statistics"]["is_finite"] is True

def test_large_image():
    """Test boundary condition: large 1024x1024 image."""
    engine = DepthEstimationEngine.get_instance()
    large_bytes = generate_synthetic_landscape(1024, 1024, "volcano")
    result = engine.run_inference(
        image_bytes=large_bytes,
        filename="large.png",
        output_dir=TEST_OUTPUT_DIR,
        processing_id="test_large",
        colormap="inferno"
    )
    assert result["prediction_dimensions"]["width"] == 1024
    assert result["prediction_dimensions"]["height"] == 1024
    assert result["statistics"]["is_finite"] is True

def test_empty_image_fails():
    """Test exception on 0-byte file."""
    engine = DepthEstimationEngine.get_instance()
    with pytest.raises(PreprocessingError):
        engine.run_inference(
            image_bytes=b"",
            filename="empty.png",
            output_dir=TEST_OUTPUT_DIR,
            processing_id="test_empty"
        )

def test_corrupted_image_fails():
    """Test exception on corrupted binary payload."""
    engine = DepthEstimationEngine.get_instance()
    corrupted_bytes = b"CORRUPTED_GEOSPATIAL_HEADER_NOT_A_VALID_IMAGE" * 20
    with pytest.raises(PreprocessingError):
        engine.run_inference(
            image_bytes=corrupted_bytes,
            filename="corrupt.jpg",
            output_dir=TEST_OUTPUT_DIR,
            processing_id="test_corrupt"
        )

if __name__ == "__main__":
    print("Running DepthWizard AI Inference test suite...")
    test_engine_singleton()
    print("[PASS] test_engine_singleton")
    test_five_diverse_samples_and_variance()
    print("[PASS] test_five_diverse_samples_and_variance (5 terrain types validated)")
    test_small_image()
    print("[PASS] test_small_image (32x32)")
    test_large_image()
    print("[PASS] test_large_image (1024x1024)")
    test_empty_image_fails()
    print("[PASS] test_empty_image_fails")
    test_corrupted_image_fails()
    print("[PASS] test_corrupted_image_fails")
    print("\nALL INFERENCE PIPELINE TESTS PASSED SUCCESSFULLY!")
