"""Phase 5 tests: metadata preservation, DEM alignment, no-data, and guarded calibration."""
import os
import sys
import numpy as np
import pytest

try:
    import rasterio
except ImportError as exc:
    pytest.skip(f"rasterio is unavailable in this environment: {exc}", allow_module_level=True)
from rasterio.io import MemoryFile
from rasterio.transform import from_origin

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.geospatial import RasterMetadata, align_reference_dem, calibrate_with_dem, calibrate_with_gcps, read_raster_metadata, save_calibrated_outputs, CalibrationError


def geotiff_bytes(values, transform=from_origin(77, 29, 0.01, 0.01), crs="EPSG:4326", nodata=None):
    profile = {"driver": "GTiff", "height": values.shape[0], "width": values.shape[1], "count": 1, "dtype": "float32", "crs": crs, "transform": transform, "nodata": nodata}
    with MemoryFile() as memory_file:
        with memory_file.open(**profile) as dataset:
            dataset.write(values.astype(np.float32), 1)
        return memory_file.read()


def test_metadata_retains_dimensions_crs_and_transform():
    transform = from_origin(77, 29, 0.01, 0.01)
    metadata = read_raster_metadata(geotiff_bytes(np.ones((10, 12)), transform))
    assert (metadata.width, metadata.height, metadata.crs) == (12, 10, "EPSG:4326")
    assert metadata.transform == transform


def test_dem_alignment_respects_source_grid_and_nodata():
    transform = from_origin(77, 29, 0.01, 0.01)
    source = read_raster_metadata(geotiff_bytes(np.ones((10, 12)), transform))
    reference = np.arange(600, dtype=np.float32).reshape(20, 30)
    aligned = align_reference_dem(geotiff_bytes(reference, from_origin(77, 29, 0.004, 0.005)), source)
    assert aligned.shape == (10, 12)
    assert np.isfinite(aligned).any()


def test_dem_nodata_is_preserved_as_invalid_alignment_samples():
    transform = from_origin(77, 29, 0.01, 0.01)
    source = read_raster_metadata(geotiff_bytes(np.ones((10, 12)), transform))
    reference = np.full((10, 12), -9999, dtype=np.float32)
    aligned = align_reference_dem(geotiff_bytes(reference, transform, nodata=-9999), source)
    assert not np.isfinite(aligned).any()


def test_calibration_uses_held_out_metrics_and_writes_geotiff(tmp_path):
    relative = np.linspace(0, 1, 400, dtype=np.float32).reshape(20, 20)
    dem = 120 + 80 * relative
    elevation, info = calibrate_with_dem(relative, dem)
    assert info["held_out"] is True
    assert info["metrics"]["sample_count"] > 0
    assert info["metrics"]["rmse_m"] < 0.01
    metadata = RasterMetadata(20, 20, "EPSG:4326", from_origin(77, 29, 0.01, 0.01), None)
    output = save_calibrated_outputs(elevation, metadata, str(tmp_path), "calibration")
    with rasterio.open(tmp_path / output["elevation_geotiff_filename"]) as result:
        assert result.crs.to_string() == "EPSG:4326"
        assert result.transform == metadata.transform
        assert result.read(1).shape == (20, 20)


def test_weak_reference_is_not_calibrated():
    relative = np.linspace(0, 1, 400, dtype=np.float32).reshape(20, 20)
    dem = np.random.default_rng(4).normal(size=(20, 20)).astype(np.float32)
    with pytest.raises(CalibrationError, match="too weak"):
        calibrate_with_dem(relative, dem)


def test_gcps_use_held_out_validation():
    relative = np.linspace(0, 1, 400, dtype=np.float32).reshape(20, 20)
    gcps = [{"row": row, "col": col, "elevation_m": float(25 + 50 * relative[row, col])} for row in range(0, 20, 2) for col in range(0, 20, 2)]
    elevation, info = calibrate_with_gcps(relative, gcps)
    assert elevation.shape == relative.shape
    assert info["metrics"]["rmse_m"] < 0.01
