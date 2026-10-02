# Elevation calibration methodology

DepthWizard's MiDaS output is relative inverse depth, not elevation in metres. JPG and PNG uploads always remain relative depth because they do not carry the geospatial transform needed to align a reference DEM.

Metric processing is requested only by supplying both a georeferenced source GeoTIFF (CRS and affine geotransform) and a reference DEM GeoTIFF. The service reprojects DEM band one to the source grid using rasterio bilinear resampling, ignoring DEM no-data values. It then fits `elevation = scale × normalized_relative_depth + offset` using finite overlapping cells.

Pixel-referenced ground control points are also accepted through the AI API as JSON records of `{row, col, elevation_m}`. At least 25 valid GCPs are required; they use the same held-out validation procedure. GCP calibration still requires a georeferenced source GeoTIFF before a metric elevation raster is written.

Every fifth spatially ordered overlap sample is held out before fitting. RMSE, MAE, and correlation are reported from those held-out samples only. Metric output is withheld when fewer than 125 overlap samples exist, depth has insufficient variation, spatial alignment is absent, or the absolute held-out correlation is below 0.35. The output then remains unitless relative depth with an explicit warning.

When calibration passes, the service writes a float32, LZW-compressed GeoTIFF with the source CRS and affine transform, plus a colorized elevation preview and hillshade. The resulting values are model-to-DEM regression estimates, not survey-grade point elevations; occlusion, image acquisition geometry, land cover, DEM age/resolution mismatch, and monocular scale ambiguity remain material limitations.
