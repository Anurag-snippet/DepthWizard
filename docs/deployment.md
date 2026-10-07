# Deployment guide

DepthWizard consists of three deployable runtime pieces:

- a React frontend
- an Express API gateway
- a Python FastAPI AI worker

This repository includes the local startup flow and production-style configuration values, but the code should be treated as the source of truth. The docs below describe the intended deployment model and the exact environment variables currently used by the project.

## 1. Service roles

### Frontend

The frontend is a Vite app under `client/`. It is intended to be served as a static site.

### Backend gateway

The Express service runs on port `5000` by default. It is responsible for project storage, upload handling, health checks, and proxying inference requests to the AI service.

### AI service

The FastAPI service runs on port `8000` by default. It owns the TensorFlow Lite model and output generation for depth maps and calibration outputs.

## 2. Required environment variables

The backend config is defined in `server/src/config/index.js`. The important variables are:

```bash
PORT=5000
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8000
MAX_UPLOAD_SIZE_MB=50
ALLOWED_ORIGINS=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/depthwizard
PERSISTENT_STORAGE_DIR=/path/to/project-root
```

The frontend reads environment values from `import.meta.env` and defaults to:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

The exact values depend on your local environment and deployment host.

## 3. Local startup

From the repo root:

```bash
npm install
npm run dev:server
npm run dev:client
```

Then start the AI worker in a second terminal:

```powershell
.\ai-service\.venv\Scripts\python ai-service\main.py
```

The expected local endpoints are:

- frontend: `http://localhost:5173`
- backend: `http://localhost:5000`
- AI service: `http://localhost:8000`

## 4. Render / cold-start health model

The AI worker must expose two separate concepts:

- `GET /health` for process liveness only
- `GET /ready` for model readiness

This matters for Render free-tier deployments. A sleeping service can still come back online quickly, but the model may take longer to initialize. The Render health check path should be `/health`, not `/ready`, because `/ready` is intentionally a model-state check that can return `503` while the model is still loading.

Recommended health semantics:

- `/health` → `200` when the FastAPI process is alive
- `/ready` → `200` when `status: ready`
- `/ready` → `503` when `status: loading` or `status: failed`

This prevents health-check failures from being mistaken for a generic AI outage or from making the frontend show `AI Unavailable` during a normal cold start.

## 5. Docker deployment

A production stack is defined in `docker-compose.production.yml`. It should be used with a real model file placed at:

```text
ai-service/models/weights/midas_v21_small.tflite
```

The model file is intentionally not tracked in Git, so it must be added to the local environment before runtime execution.

## 6. Persistence and storage

The code explicitly uses:

- `server/uploads/` for uploaded inputs
- `ai-service/outputs/` for generated AI outputs
- optional MongoDB for metadata
- fallback local storage when MongoDB is unavailable

For production-like deployments, the storage volumes must survive service restarts. The repository does not hide the fact that source uploads and output artifacts must be persisted by the deployment environment.

## 6. CORS and origin policy

The backend applies CORS using `ALLOWED_ORIGINS`. In production, the allow-list should match the frontend origin exactly rather than using a broad wildcard.

## 7. Operational checklist

Before calling a deployment ready, validate these runtime conditions:

1. AI service returns `200` at `/health` while the process is alive.
2. Backend AI health checks `/health` first and then `/ready` to distinguish liveness from model readiness.
3. A cold start shows `waking_up` or `loading` instead of a hard `AI Unavailable` without context.
4. A sample image can be uploaded and processed end-to-end once the model is ready.
5. Project status transitions from queued to processing to completed or failed.
6. Output URLs are served from the AI service and can be opened successfully.
7. When calibration metadata is provided, metric output appears only if the spatial constraints are valid.

## 8. Deployment caution

This is not a guarantee of production maturity. The repository contains working local logic and scripts, but any hosted deployment still needs live verification on the target infrastructure before it can be called production-ready.

