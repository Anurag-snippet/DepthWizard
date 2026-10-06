# Calibration and metric elevation rules

DepthWizard separates relative depth from metric elevation. The model output is a relative inverse depth, not a physically meaningful elevation value. A standard JPG or PNG input remains relative depth unless the service can validate a geospatial relationship.

## When metric output is allowed

Metric calibration is attempted only when the project includes enough valid geospatial context. In the current implementation, the AI service may process:

- a reference DEM uploaded as `reference_dem`
- a GCP JSON payload via `gcp_json`
- a georeferenced source image or GeoTIFF that preserves CRS and transform metadata

The backend can pass a DEM file through the project route as `referenceDem` when creating a project, and the AI endpoint accepts the same concept as `reference_dem` in `multipart/form-data`.

## Calibration behavior

The Python service uses the geospatial helpers in `ai-service/src/geospatial.py`. In general, the workflow is:

1. validate source georeferencing
2. align the reference DEM to the source grid
3. fit a regression between normalized disparity and the DEM values
4. validate using held-out samples
5. write metric outputs only if the calibration is valid enough

The code explicitly warns users that metric conversion is a model-to-DEM regression estimate, not a survey-grade elevation product.

## Held-out validation

The project preserves a scientific check based on spatially separated validation points. If the number of valid overlap samples is too small or the calibration quality is weak, the output is kept as relative depth with a clear warning rather than pretending the values are metric elevation.

## Output behavior

When calibration passes, the service can generate:

- a calibrated elevation raster
- a hillshade output
- a GeoTIFF with source CRS and transform
- a preview image of the metric elevation surface

When the calibration cannot be trusted, only the relative depth outputs are returned.

## Important limitations

Metric elevation is still subject to:

- image geometry and monocular scale ambiguity
- DEM resolution mismatch
- land cover or temporal differences
- georeferencing quality
- insufficient valid overlap samples

This is an estimate layer, not a substitute for direct measurement or rigorous geodetic control.
