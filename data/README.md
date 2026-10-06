# Data folder

This directory is intended to hold sample imagery and reference geospatial data used in validation.

## Structure

- `optical/`: source satellite or aerial images used for inference
- `elevation/`: reference DEMs or calibration data that can be used to test metric conversion

## How to use the data

Use optical images to exercise the AI inference flow and DEMs to validate the metric calibration logic. The calibration path is only meaningful when the DEM and the image share enough spatial alignment for valid overlap.

## Data quality guidance

- prefer cloud-free images where possible
- keep source and reference products spatially aligned
- avoid mixing incompatible coordinate systems or non-overlapping rasters
- use GCP or DEM validation only when the reference grid is meaningful for the source image

## Important note

The code supports calibration, but the data must be valid. The repository does not guarantee that any particular sample image or DEM is scientifically accurate for a deployment-grade evaluation without runtime testing.
