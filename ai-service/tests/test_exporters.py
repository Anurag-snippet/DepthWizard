import json
import os
import sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.exporters import write_export_bundle


def test_real_raster_exports_include_gltf_and_metadata(tmp_path):
    depth = np.linspace(0, 1, 12 * 16, dtype=np.float32).reshape(12, 16)
    exports = write_export_bundle(depth, str(tmp_path), "real", {"model_version": "test", "inference_duration_ms": 1.2}, {"is_metric": False})
    with open(tmp_path / exports["terrain_gltf_filename"], encoding="utf-8") as handle:
        gltf = json.load(handle)
    assert gltf["asset"]["version"] == "2.0"
    assert gltf["extras"]["source"] == "AI-generated relative-depth raster"
    assert os.path.exists(tmp_path / exports["metadata_json_filename"])


def test_evaluation_csv_is_only_exported_for_real_metric_validation(tmp_path):
    depth = np.ones((4, 4), dtype=np.float32)
    exports = write_export_bundle(depth, str(tmp_path), "metric", {}, {"is_metric": True, "metrics": {"rmse_m": 2.5, "mae_m": 1.2, "correlation": .8}})
    text = (tmp_path / exports["evaluation_csv_filename"]).read_text(encoding="utf-8")
    assert "spatially held-out reference samples" in text
