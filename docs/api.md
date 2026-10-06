# DepthWizard API overview

This project exposes two relevant API layers:

1. the Express backend at `http://localhost:5000/api`
2. the Python AI service at `http://localhost:8000`

The frontend uses the backend as its primary integration layer, while the backend proxies deeper AI calls.

## 1. Backend API

### `GET /api/health`

Returns backend health plus AI connectivity and database status.

Example response:

```json
{
  "success": true,
  "service": "DepthWizard Backend Gateway",
  "status": "healthy",
  "database": {
    "status": "disconnected",
    "provider": "Local File Persistence Fallback"
  },
  "aiService": {
    "url": "http://localhost:8000",
    "status": "connected",
    "details": {
      "status": "healthy",
      "model_loaded": true
    }
  }
}
```

### `GET /api/projects`

Returns all stored projects and persistence mode.

### `POST /api/projects`

Uploads a single project image using `multipart/form-data`.

Required field:

- `image`: image file

Optional fields:

- `name`
- `description`
- `mode`
- `referenceDem`: optional DEM file

The backend saves the original file under `server/uploads` and stores metadata in the project store.

### `POST /api/projects/batch`

Uploads several images in a single request. The field is `images` and accepts up to `20` files in the current implementation.

### `GET /api/projects/:id`

Returns one project by ID.

### `PUT /api/projects/:id`

Updates project metadata and some result fields.

### `POST /api/projects/:id/process`

Starts the asynchronous inference flow. The response returns a processing record:

```json
{
  "success": true,
  "processing": {
    "id": "proc_...",
    "status": "queued"
  }
}
```

The processing lifecycle is:

- `queued`
- `processing`
- `completed`
- `failed`

### `GET /api/projects/:id/status`

Returns the current project status and processing object.

### `GET /api/projects/:id/results`

Returns the result payload once processing completed. Calls before completion return a `409` with `RESULTS_NOT_READY`.

### `DELETE /api/projects/:id`

Deletes project metadata and removes the source upload if it is still under the configured upload directory.

## 2. Direct AI inference API

### `GET /health`

AI service health endpoint.

### `GET /api/inference/health`

Health endpoint with model and dependency details.

### `GET /api/v1/model/metadata`

Returns model metadata from the TensorFlow Lite stack.

### `POST /api/inference/depth`

This is the main inference endpoint.

Request method:

- `multipart/form-data`

Form fields:

- `image`: required image file
- `reference_dem`: optional DEM file
- `gcp_json`: optional JSON string with GCP data

Query parameter:

- `colormap`: `turbo`, `viridis`, `inferno`, or `grayscale`

Example:

```bash
curl -X POST "http://localhost:8000/api/inference/depth?colormap=turbo" \
  -F "image=@sample.png"
```

Response includes fields such as:

- `success`
- `processing_id`
- `filename`
- `prediction_dimensions`
- `depth_map_preview_url`
- `grayscale_preview_url`
- `raw_npy_download_url`
- `inference_duration_ms`
- `total_processing_duration_ms`
- `calibration`

## 3. File upload expectations

Accepted image extensions in the backend filter are:

- `.jpg`
- `.jpeg`
- `.png`
- `.tif`
- `.tiff`
- `.geotiff`

The AI service is also designed to accept GeoTIFF-related payloads.

## 4. Calibration contract

When `reference_dem` or `gcp_json` are supplied, the service may populate the `calibration` block with metric output and warnings. If calibration is not possible, the result remains relative depth and the API returns a warning instead of metric values.

See [calibration.md](calibration.md) for the validation rules and limitations.

## 5. Current caveat

The routes above are the routes implemented in the repo. They should be treated as the source of truth when testing or integrating the application. Documentation should be updated if route behavior changes in future code revisions.

