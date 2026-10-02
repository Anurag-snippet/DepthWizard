# DepthWizard API

Local base URL: `http://localhost:5000/api`. Production base URL: `https://depthwizard-q2f6.onrender.com/api`. The client reads its API base from `VITE_API_URL`; Express reads the AI service from `AI_SERVICE_URL`.

## Project and processing API

`POST /projects` accepts `multipart/form-data`: required `image`, optional `name` and `description`. It validates PNG, JPEG, TIFF, and GeoTIFF extensions, applies `MAX_UPLOAD_SIZE_MB`, writes a UUID-named file under `server/uploads`, and responds `201` with a project in `uploaded` status. Internal source paths are never returned.

`GET /projects` lists metadata and processing history. `GET /projects/:id` returns one project. Project identifiers accept only letters, digits, `_`, and `-`.

`POST /projects/:id/process` queues the source image for FastAPI inference and responds `202` immediately:

```json
{ "success": true, "processing": { "id": "proc_...", "status": "queued" } }
```

Jobs transition through `queued`, `processing`, `completed`, or `failed`. Completed results come directly from FastAPI and include real preview and raw NumPy output URLs; server filesystem paths are never exposed.

`GET /projects/:id/status` returns the current state. `GET /projects/:id/results` returns completed output, or `409 RESULTS_NOT_READY` before completion. `DELETE /projects/:id` removes metadata and only deletes a source file resolved directly within the configured upload directory; it returns `204`.

## Direct inference and health

`POST /inference/depth?colormap=turbo` remains for legacy clients; it uses Multer before proxying to FastAPI. `GET /inference/health` proxies AI health. `GET /health` reports backend/downstream health.

`POST /projects` also accepts an optional `referenceDem` GeoTIFF and `gcpJson` (pixel-referenced GCP records). These are forwarded as `reference_dem` and `gcp_json` to FastAPI. Results expose `calibration.status`, warning text, held-out RMSE/MAE/correlation, and georeferenced elevation/hillshade URLs only when calibration is supported. See [calibration.md](calibration.md).

Inference results include `raw_npy_download_url` for the real float32 relative-disparity raster. Supported metric calibration additionally returns `calibration.elevation_npy_url`, a real float32 elevation raster for the 3D viewer. See [terrain-viewer.md](terrain-viewer.md).

Errors use `{ "success": false, "error": { "code", "message", "status", "timestamp", "path" } }`; oversized uploads return `413`.

## Persistence and verification

MongoDB is not currently a runtime dependency. The documented development fallback is `server/data/projects.json`, with source images in `server/uploads`; `server/src/services/projectStore.js` is the replacement seam for a Mongo repository.

Start FastAPI (8000), Express (5000), and Vite (5173). Upload an actual image through the client, open its workspace, and choose **Run Inference** to see the real queued/processing/completed state. Service failures are returned to the UI for retry.
