# 3D terrain viewer

Open **Launch 3D Viewer** after inference. The viewer downloads the project’s real float32 NumPy output: relative disparity for uncalibrated projects, or the calibrated elevation raster only after Phase 5 validation succeeds. It never derives terrain height from a color preview image.

Use drag to orbit, scroll to zoom, right-drag to pan, **Nadir** for a top-down view, and **Reset** to restore the perspective camera. Toggle textured, hypsometric, and wireframe rendering; the original uploaded image is the texture. The exaggeration slider is visual-only and does not change downloaded measurements.

## Flythrough

Choose **Free Flight** to enter first-person navigation. Click the scene to enable mouse-look; use `WASD` or arrow keys to move and `R`/`F` to rise or lower. Camera movement is constrained to the terrain bounds and raised to the selected terrain-clearance height if it would intersect the mesh.

Choose **Path Flight**, click the mesh to set a green start marker and orange end marker, then select **Start**. The camera follows a smooth eased path between those actual terrain points. Speed and terrain-clearance sliders control the route; pause, resume, restart, or switch back to Orbit at any time. The inspector shows the selected point’s relative depth, or estimated metres only for a successfully calibrated project, plus current camera coordinates.

Meshes are downsampled to at most 192 vertices per side, invalid/no-data cells do not create faces, and geometry/materials are disposed when changing projects. Relative meshes are explicitly unitless. Calibrated meshes display metres only when the held-out DEM/GCP validation passed.
