"""Geospatial metadata, DEM alignment, and guarded metric calibration utilities."""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np

try:
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.warp import reproject
except ImportError:  # Keeps ordinary JPG/PNG relative-depth inference available.
    rasterio = None


class CalibrationError(Exception):
    """Raised for unsupported calibration inputs, never silently fabricated."""


@dataclass
class RasterMetadata:
    width: int
    height: int
    crs: str | None
    transform: Any | None
    nodata: float | None

    @property
    def georeferenced(self) -> bool:
        return self.crs is not None and self.transform is not None


def read_raster_metadata(image_bytes: bytes | None) -> RasterMetadata | None:
    if not image_bytes or rasterio is None:
        return None
    try:
        with rasterio.io.MemoryFile(image_bytes) as memory_file, memory_file.open() as source:
            return RasterMetadata(source.width, source.height, str(source.crs) if source.crs else None, source.transform, source.nodata)
    except Exception:
        return None


def align_reference_dem(reference_bytes: bytes, source_metadata: RasterMetadata) -> np.ndarray:
    """Reproject DEM band one onto the source image grid with bilinear resampling."""
    if rasterio is None:
        raise CalibrationError("GeoTIFF calibration requires rasterio. Install the AI service requirements first.")
    if not source_metadata or not source_metadata.georeferenced:
        raise CalibrationError("Metric calibration requires a source GeoTIFF with both CRS and geotransform.")
    with rasterio.io.MemoryFile(reference_bytes) as memory_file, memory_file.open() as reference:
        if reference.crs is None:
            raise CalibrationError("Reference DEM has no coordinate reference system and cannot be aligned.")
        destination = np.full((source_metadata.height, source_metadata.width), np.nan, dtype=np.float32)
        reproject(
            source=rasterio.band(reference, 1), destination=destination,
            src_transform=reference.transform, src_crs=reference.crs, src_nodata=reference.nodata,
            dst_transform=source_metadata.transform, dst_crs=source_metadata.crs, dst_nodata=np.nan,
            resampling=Resampling.bilinear,
        )
    return destination


def _validation_metrics(observed: np.ndarray, predicted: np.ndarray) -> dict:
    error = predicted - observed
    correlation = float(np.corrcoef(observed, predicted)[0, 1]) if observed.size > 1 and np.std(observed) > 0 and np.std(predicted) > 0 else float("nan")
    return {"rmse_m": float(np.sqrt(np.mean(error ** 2))), "mae_m": float(np.mean(np.abs(error))), "correlation": correlation, "sample_count": int(observed.size)}


def calibrate_with_dem(relative_depth: np.ndarray, aligned_dem: np.ndarray) -> tuple[np.ndarray, dict]:
    """Fit elevation = scale * relative depth + offset using spatially disjoint held-out samples."""
    if relative_depth.shape != aligned_dem.shape:
        raise CalibrationError("Aligned DEM and depth raster dimensions do not match.")
    valid = np.isfinite(relative_depth) & np.isfinite(aligned_dem)
    rows, cols = np.where(valid)
    if rows.size < 125:
        raise CalibrationError("Calibration needs at least 125 overlapping finite DEM samples.")
    # Deterministic spatially distributed hold-out: every fifth valid sample is held out.
    order = np.lexsort((cols, rows))
    holdout = np.zeros(rows.size, dtype=bool)
    holdout[order[::5]] = True
    train = ~holdout
    if np.unique(relative_depth[rows[train], cols[train]]).size < 2:
        raise CalibrationError("Relative-depth variation is insufficient to estimate a scale and offset.")
    scale, offset = np.polyfit(relative_depth[rows[train], cols[train]], aligned_dem[rows[train], cols[train]], 1)
    predicted_holdout = scale * relative_depth[rows[holdout], cols[holdout]] + offset
    metrics = _validation_metrics(aligned_dem[rows[holdout], cols[holdout]], predicted_holdout)
    # A metric output is withheld when independent validation does not support a relationship.
    if not np.isfinite(metrics["correlation"]) or abs(metrics["correlation"]) < 0.35:
        raise CalibrationError(f"Held-out elevation correlation ({metrics['correlation']:.3f}) is too weak for metric calibration.")
    elevation = (scale * relative_depth + offset).astype(np.float32)
    elevation[~valid] = np.nan
    return elevation, {"method": "linear_relative_depth_to_dem", "scale": float(scale), "offset_m": float(offset), "held_out": True, "metrics": metrics, "valid_samples": int(rows.size)}


def calibrate_with_gcps(relative_depth: np.ndarray, gcps: list[dict]) -> tuple[np.ndarray, dict]:
    """Calibrate against explicitly pixel-referenced GCPs: {row, col, elevation_m}."""
    samples = [(int(item["row"]), int(item["col"]), float(item["elevation_m"])) for item in gcps]
    samples = [(row, col, elevation) for row, col, elevation in samples if 0 <= row < relative_depth.shape[0] and 0 <= col < relative_depth.shape[1] and np.isfinite(elevation)]
    if len(samples) < 25:
        raise CalibrationError("Calibration needs at least 25 valid pixel-referenced ground control points.")
    rows, cols, elevations = (np.array(values) for values in zip(*samples))
    holdout = np.zeros(len(samples), dtype=bool); holdout[::5] = True
    depth_values = relative_depth[rows, cols]
    if np.unique(depth_values[~holdout]).size < 2:
        raise CalibrationError("Ground-control points do not span enough relative-depth variation.")
    scale, offset = np.polyfit(depth_values[~holdout], elevations[~holdout], 1)
    metrics = _validation_metrics(elevations[holdout], scale * depth_values[holdout] + offset)
    if not np.isfinite(metrics["correlation"]) or abs(metrics["correlation"]) < 0.35:
        raise CalibrationError(f"Held-out GCP correlation ({metrics['correlation']:.3f}) is too weak for metric calibration.")
    return (scale * relative_depth + offset).astype(np.float32), {"method": "linear_relative_depth_to_gcp", "scale": float(scale), "offset_m": float(offset), "held_out": True, "metrics": metrics, "valid_samples": len(samples)}


def save_calibrated_outputs(elevation: np.ndarray, source_metadata: RasterMetadata, output_dir: str, base_id: str, colormap: str = "turbo") -> dict:
    if rasterio is None or not source_metadata.georeferenced:
        raise CalibrationError("A georeferenced output requires rasterio plus source CRS and geotransform.")
    os.makedirs(output_dir, exist_ok=True)
    tif_name = f"{base_id}_calibrated_elevation.tif"
    npy_name = f"{base_id}_calibrated_elevation.npy"
    preview_name = f"{base_id}_calibrated_elevation_{colormap}.png"
    hillshade_name = f"{base_id}_hillshade.png"
    tif_path, npy_path, preview_path, hillshade_path = (os.path.join(output_dir, name) for name in (tif_name, npy_name, preview_name, hillshade_name))
    profile = {"driver": "GTiff", "height": elevation.shape[0], "width": elevation.shape[1], "count": 1, "dtype": "float32", "crs": source_metadata.crs, "transform": source_metadata.transform, "nodata": np.nan, "compress": "lzw"}
    with rasterio.open(tif_path, "w", **profile) as target:
        target.write(elevation, 1)
    np.save(npy_path, elevation.astype(np.float32))
    finite = elevation[np.isfinite(elevation)]
    if finite.size == 0:
        raise CalibrationError("Calibrated raster contains no finite elevation values.")
    normalized = np.clip((elevation - finite.min()) / max(float(finite.max() - finite.min()), 1e-7), 0, 1)
    normalized[~np.isfinite(normalized)] = 0
    cmap = {"turbo": cv2.COLORMAP_TURBO, "viridis": cv2.COLORMAP_VIRIDIS, "inferno": cv2.COLORMAP_INFERNO}.get(colormap, cv2.COLORMAP_TURBO)
    cv2.imwrite(preview_path, cv2.applyColorMap((normalized * 255).astype(np.uint8), cmap))
    gradient_y, gradient_x = np.gradient(np.nan_to_num(elevation, nan=float(np.nanmedian(finite))))
    slope = np.pi / 2 - np.arctan(np.hypot(gradient_x, gradient_y)); aspect = np.arctan2(-gradient_x, gradient_y)
    shaded = np.clip(255 * (np.cos(np.deg2rad(45)) * np.cos(slope) + np.sin(np.deg2rad(45)) * np.sin(slope) * np.cos(np.deg2rad(315) - aspect)), 0, 255).astype(np.uint8)
    cv2.imwrite(hillshade_path, shaded)
    return {"elevation_geotiff_filename": tif_name, "elevation_npy_filename": npy_name, "elevation_preview_filename": preview_name, "hillshade_filename": hillshade_name, "min_elevation_m": float(finite.min()), "max_elevation_m": float(finite.max())}
