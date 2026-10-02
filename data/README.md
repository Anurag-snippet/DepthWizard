# DepthWizard Dataset Directory (SIH 26175)

This directory organizes test data and reference ground truth for evaluating single-view height estimation.

## Structure

* `optical/`: Single-view satellite or aerial optical crops (GeoTIFF, PNG, JPEG).
* `elevation/`: Reference Digital Elevation Models (DEMs: SRTM, ALOS World 3D, TanDEM-X, Copernicus DEM) and Ground Control Points (GCPs in CSV or GeoJSON).

## Verification Guidelines
1. Optical satellite crops should ideally be cloud-free and have known or estimated ground sampling distance (GSD).
2. Reference DEMs must share bounding box coordinates with optical crops to allow spatial interpolation and metric height calibration.
