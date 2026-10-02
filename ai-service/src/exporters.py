"""Portable exports produced from real DepthWizard inference arrays."""
from __future__ import annotations

import base64
import csv
import json
import os
import struct
from typing import Any

import numpy as np


def _terrain_gltf(depth: np.ndarray, max_side: int = 256) -> dict[str, Any]:
    """Build a bounded, textured grid glTF from the supplied relative-depth raster."""
    height, width = depth.shape
    scale = min(1.0, max_side / max(width, height))
    grid_w, grid_h = max(2, round(width * scale)), max(2, round(height * scale))
    xs = np.round(np.linspace(0, width - 1, grid_w)).astype(int)
    ys = np.round(np.linspace(0, height - 1, grid_h)).astype(int)
    sampled = np.nan_to_num(depth[np.ix_(ys, xs)], nan=0.0).astype(np.float32)
    finite = sampled[np.isfinite(sampled)]
    low, high = (float(finite.min()), float(finite.max())) if finite.size else (0.0, 1.0)
    normalized = (sampled - low) / max(high - low, 1e-7)
    positions, uvs = [], []
    for row in range(grid_h):
        for col in range(grid_w):
            positions.extend([(col / (grid_w - 1) - .5) * 200, float(normalized[row, col] * 35), (row / (grid_h - 1) - .5) * 200])
            uvs.extend([col / (grid_w - 1), 1 - row / (grid_h - 1)])
    indices = []
    for row in range(grid_h - 1):
        for col in range(grid_w - 1):
            a, b, c, d = row * grid_w + col, row * grid_w + col + 1, (row + 1) * grid_w + col, (row + 1) * grid_w + col + 1
            indices.extend([a, c, b, b, c, d])
    chunks = [np.asarray(positions, dtype='<f4').tobytes(), np.asarray(uvs, dtype='<f4').tobytes(), np.asarray(indices, dtype='<u4').tobytes()]
    offsets, cursor = [], 0
    for chunk in chunks:
        offsets.append(cursor); cursor += len(chunk)
    encoded = base64.b64encode(b''.join(chunks)).decode('ascii')
    return {
        "asset": {"version": "2.0", "generator": "DepthWizard real-raster exporter"},
        "extras": {"source": "AI-generated relative-depth raster", "grid": [grid_w, grid_h], "metric": False},
        "buffers": [{"uri": f"data:application/octet-stream;base64,{encoded}", "byteLength": cursor}],
        "bufferViews": [{"buffer": 0, "byteOffset": offsets[i], "byteLength": len(chunk), "target": target} for i, (chunk, target) in enumerate(zip(chunks, [34962, 34962, 34963]))],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": grid_w * grid_h, "type": "VEC3", "min": [-100, 0, -100], "max": [100, 35, 100]},
            {"bufferView": 1, "componentType": 5126, "count": grid_w * grid_h, "type": "VEC2"},
            {"bufferView": 2, "componentType": 5125, "count": len(indices), "type": "SCALAR"},
        ],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "TEXCOORD_0": 1}, "indices": 2, "mode": 4}]}],
        "nodes": [{"mesh": 0}], "scenes": [{"nodes": [0]}], "scene": 0,
    }


def write_export_bundle(depth: np.ndarray, output_dir: str, processing_id: str, metadata: dict[str, Any], calibration: dict[str, Any]) -> dict[str, str]:
    """Write JSON always, glTF from the actual raster, and CSV only for held-out metric validation."""
    os.makedirs(output_dir, exist_ok=True)
    gltf_name, metadata_name = f"{processing_id}_terrain.gltf", f"{processing_id}_processing.json"
    with open(os.path.join(output_dir, gltf_name), 'w', encoding='utf-8') as handle:
        json.dump(_terrain_gltf(depth), handle, separators=(',', ':'))
    report = {"processing": metadata, "calibration": calibration, "limitations": "Relative depth is unitless. Metric accuracy fields exist only after held-out DEM/GCP validation."}
    with open(os.path.join(output_dir, metadata_name), 'w', encoding='utf-8') as handle:
        json.dump(report, handle, indent=2)
    exports = {"terrain_gltf_filename": gltf_name, "metadata_json_filename": metadata_name}
    metrics = calibration.get("metrics") if calibration.get("is_metric") else None
    if metrics:
        csv_name = f"{processing_id}_evaluation_report.csv"
        with open(os.path.join(output_dir, csv_name), 'w', newline='', encoding='utf-8') as handle:
            writer = csv.DictWriter(handle, fieldnames=["metric", "value", "units", "evaluation_set"])
            writer.writeheader()
            for key, value in metrics.items():
                writer.writerow({"metric": key, "value": value, "units": "metres" if key in {"rmse_m", "mae_m"} else "unitless", "evaluation_set": "spatially held-out reference samples"})
        exports["evaluation_csv_filename"] = csv_name
    return exports
