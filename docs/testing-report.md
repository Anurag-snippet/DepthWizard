# Phase 8 testing and evaluation report

## Environment and evidence

This report records only commands actually run in the repository on 2026-10-02.

| Area | Command | Result |
| --- | --- | --- |
| Frontend terrain unit tests | `node --test client/tests/terrainMesh.test.mjs` | **6 passed, 0 failed** |
| Frontend production build | `npm --prefix client run build` | **Passed**; Vite reports one non-fatal large-chunk warning (1.33 MB uncompressed JS) |
| Server test command | `npm --prefix server test` | **Passed, but 0 tests were discovered** |
| AI pytest suite | `ai-service/.venv/Scripts/python.exe -m pytest tests/test_exporters.py tests/test_geospatial.py tests/test_inference.py -q` | **Not run**: Windows returned `Access is denied` before Python/pytest started |
| Live AI inference | `POST /api/inference/depth` with `ai-service/tests/test_image.png` | **Passed**: MiDaS 2.1 Small returned a finite 256×256 relative-depth raster; inference 199.11 ms, total 309.95 ms |

The host has no `python` command on PATH. The live AI service did permit one direct real-inference check, but the service process was started before the Phase 8 source change and did not expose the new export fields. Corrupt-image recovery, GeoTIFF calibration, and the new export implementation therefore still lack an executed Python-test result for this run.

## Test coverage present in the repository

### AI and geospatial

- `ai-service/tests/test_inference.py` runs actual TFLite inference on five distinct generated optical inputs plus 32×32 and 1024×1024 bounds. It verifies preserved dimensions, finite arrays, output files, and non-identical predictions; it also checks empty and corrupt payload rejection.
- `ai-service/tests/test_geospatial.py` covers GeoTIFF CRS/transform preservation, DEM resampling/alignment, no-data treatment, held-out DEM/GCP calibration, and weak-reference rejection.
- `ai-service/tests/test_exporters.py` checks that the new glTF and JSON exports are generated from a supplied numeric raster and that a CSV evaluation report is produced only for metric calibration with held-out metrics.

### 3D and frontend

- `client/tests/terrainMesh.test.mjs` verifies flat and ramp elevation behavior, invalid-value face omission, bounded downsampling, raster-coordinate mapping, and terrain-clearance flight interpolation.
- The terrain mesh now emits UVs from the same raster grid as its elevation positions, which keeps the source texture aligned to the generated surface.

## Actual output and evaluation policy

Every inference already writes a normalized PNG preview and raw relative-depth NumPy raster. Phase 8 additionally writes:

- `*_terrain.gltf`: a bounded grid mesh derived from the numeric inference raster (maximum 256 cells along the longest side), including texture UVs.
- `*_processing.json`: model/version, timing, source dimensions, colormap configuration, and calibration status.
- `*_evaluation_report.csv`: only after a calibrated run returns held-out DEM/GCP validation metrics.

Calibrated runs continue to export the guarded elevation GeoTIFF, calibrated NumPy array, colorized preview, and hillshade. An uncalibrated JPG/PNG result is **never** represented as metres and does not receive an evaluation CSV.

## Method and limitations

Metric evaluation uses RMSE, MAE, and correlation on spatially held-out reference samples. The calibration fit uses the remaining samples, so it does not report an in-sample metric as an accuracy result. DEM resolution, reprojection, transform/CRS agreement, no-data cells, land-cover changes, image geometry, and monocular scale ambiguity can materially affect results. The error map itself is available only when an aligned reference raster exists; it is not fabricated for relative-depth-only inputs.

## Required final validation before demonstration

1. Restore execute permission for `ai-service/.venv/Scripts/python.exe` or recreate the virtual environment from a permitted terminal.
2. Run the AI pytest command shown above and preserve its exact output.
3. Start AI service, backend, and client; upload a real unseen JPG/PNG and verify a relative raster, PNG, NumPy, JSON, and glTF export.
4. Repeat with a source GeoTIFF plus spatially overlapping reference DEM; only then confirm GeoTIFF and held-out CSV evaluation export.
5. Measure browser frame rate on the intended demonstration laptop using a representative raster; no runtime performance number was recorded in this environment.
