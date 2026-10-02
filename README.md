<div align="center">

# 🧭 DepthWizard

### Single-View Satellite Height Estimation & Interactive 3D Terrain Explorer

[![Live Demo](https://img.shields.io/badge/🌐_Live_App-depthwizard--2tf3.onrender.com-4f46e5?style=for-the-badge)](https://depthwizard-2tf3.onrender.com)
[![Backend API](https://img.shields.io/badge/⚡_Backend_API-depthwizard--q2f6.onrender.com-0f766e?style=for-the-badge)](https://depthwizard-q2f6.onrender.com/api/health)
[![AI Service](https://img.shields.io/badge/🤖_AI_Service-depthwizard--ai--9i23.onrender.com-7c3aed?style=for-the-badge)](https://depthwizard-ai-9i23.onrender.com/health)
[![SIH](https://img.shields.io/badge/Smart_India_Hackathon-SIH_26175-f59e0b?style=for-the-badge)](https://www.sih.gov.in)

[![Node](https://img.shields.io/badge/Node.js-v24-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.21-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)

> **DepthWizard** is a full-stack geospatial AI application built for **Smart India Hackathon (SIH 26175)**. It takes a single satellite or aerial image, runs a real **MiDaS v2.1-Small** monocular depth estimation model (TensorFlow Lite), optionally calibrates the output to metric elevation using a reference DEM or Ground Control Points, builds a **3D terrain mesh**, and lets you explore the landscape interactively — without needing stereo imagery or LiDAR.

</div>

---

## 🔗 Live Deployment

| Service | URL | Purpose |
|---|---|---|
| 🌐 **Frontend App** | [depthwizard-2tf3.onrender.com](https://depthwizard-2tf3.onrender.com) | React 19 single-page app |
| ⚡ **Backend API** | [depthwizard-q2f6.onrender.com/api/health](https://depthwizard-q2f6.onrender.com/api/health) | Express gateway + MongoDB |
| 🤖 **AI Microservice** | [depthwizard-ai-9i23.onrender.com/health](https://depthwizard-ai-9i23.onrender.com/health) | TensorFlow depth engine |

> The AI service runs on Render's free tier and may take **30–60 seconds to wake up** after inactivity. The UI detects this and shows a "waking up" status badge in the navbar.

---

## 📑 Table of Contents

- [What It Does](#-what-it-does)
- [System Architecture](#️-system-architecture)
- [Repository Structure](#-repository-structure)
- [Frontend — React Client](#️-frontend--react-client)
- [Backend — Node.js / Express](#-backend--nodejs--express)
- [AI Microservice — Python / FastAPI](#-ai-microservice--python--fastapi)
- [Technology Stack](#-technology-stack)
- [Local Setup](#-local-setup--installation)
- [Environment Variables](#️-environment-variables)
- [API Reference](#-full-api-reference)
- [Docker Deployment](#-docker-deployment)
- [Scientific Integrity](#-scientific-integrity--sih-compliance)
- [Roadmap](#️-roadmap)

---

## ✨ What It Does

DepthWizard extracts 3D terrain from a **single satellite or aerial image** — no stereo pairs, no LiDAR required.

```
Single Satellite Image (PNG / JPG / GeoTIFF, up to 1 GB)
          │
          ▼
  MiDaS v2.1-Small TFLite  (EfficientNet-Lite3, 256x256)
          │
          ▼
  Relative Disparity [0,1]  ──► Coloured PNG (turbo/viridis/inferno)
          │
          ├── (optional) Reference DEM or GCPs
          │         │
          │         ▼
          │   Linear Regression + held-out RMSE/MAE/Pearson guard
          │         │
          │         ▼
          │   Metric Elevation (metres) + GeoTIFF + Hillshade
          │
          ▼
  Float32 NumPy Raster  ──► Three.js Displacement Map
          │
          ▼
  Interactive 3D WebGL Terrain
  (Orbit / Free Flight / Path Flythrough)
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      BROWSER CLIENT                              │
│      React 19 · Vite · Tailwind CSS · Three.js · R3F            │
│                                                                  │
│  /dashboard → /new-analysis → /workspace → /terrain-viewer      │
│                                                                  │
│  projectStore  (localStorage cache + MongoDB remote sync)        │
│  api.js        (Axios wrappers for every REST call)              │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS REST
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│         BACKEND GATEWAY  :5000  (Node.js / Express)              │
│                                                                  │
│  Multer ──► Disk Storage (server/uploads/, UUID filenames)       │
│  POST /api/projects            → MongoDB Atlas                   │
│  POST /api/projects/:id/process → forwards image to AI           │
│  GET  /api/projects/:id/status  → polls processing state         │
│  GET  /api/projects/:id/results → returns inference JSON         │
│  Fallback: local JSON file store when MongoDB unavailable        │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP proxy (Axios, 120s)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│      AI MICROSERVICE  :8000  (Python / FastAPI / Uvicorn)        │
│                                                                  │
│  Lifespan: DepthEstimationEngine singleton loaded at startup     │
│                                                                  │
│  POST /api/inference/depth                                       │
│    1. Preprocessing  — OpenCV decode → validate → norm           │
│    2. TFLite Inference — MiDaS v2.1-Small (XNNPACK, 4 threads)  │
│    3. Postprocessing — resize → normalize → colormap PNG         │
│    4. Calibration    — DEM/GCP regression (guarded)              │
│    5. Export bundle  — .npy · .png · GeoTIFF · hillshade        │
│                                                                  │
│  GET /health · /api/v1/model/metadata · /docs                    │
│  Static /outputs — serves PNGs and .npy to browser              │
└────────────┬──────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
MongoDB Atlas    Local JSON
(cloud persist)  (file fallback)
```

---

## 📁 Repository Structure

```
DepthWizard/
├── client/
│   └── src/
│       ├── App.jsx                      # Root router + 10s health polling
│       ├── components/
│       │   ├── canvas3d/
│       │   │   ├── TerrainCanvas.jsx    # Three.js/R3F WebGL mesh + cameras
│       │   │   └── ElevationLegend.jsx  # Colour scale bar
│       │   ├── common/                  # MetricsCard, EmptyState, Modal,
│       │   │                            # Notification, StatusBadge, LoadingSpinner
│       │   ├── layout/                  # Navbar, Sidebar
│       │   ├── upload/                  # UploadDropzone (1 GB),
│       │   │                            # BatchProcessingModal, BatchQueuePreview
│       │   └── workspace/
│       │       └── VisualizationPanel.jsx  # Image panel + colormap selector
│       ├── pages/
│       │   ├── Dashboard.jsx            # Stats + recent projects
│       │   ├── NewAnalysis.jsx          # 3-step upload + config + submit
│       │   ├── Workspace.jsx            # Inference runner + 3-panel results
│       │   ├── TerrainViewer.jsx        # Full-screen 3D terrain viewer
│       │   ├── History.jsx              # Searchable project history table
│       │   └── NotFound.jsx
│       └── services/
│           ├── api.js                   # Axios client + all REST wrappers
│           └── projectStore.js          # localStorage + remote sync
│
├── server/
│   ├── index.js                         # Express entry point
│   └── src/
│       ├── config/index.js              # ENV config object
│       ├── config/db.js                 # MongoDB Atlas + fallback flag
│       ├── controllers/healthController.js
│       ├── middleware/errorHandler.js   # 413 / 422 / 500 mapping
│       ├── models/Project.js            # Mongoose schema (20+ fields)
│       ├── routes/projectRoutes.js      # CRUD + process/status/results
│       ├── routes/inferenceRoutes.js    # Direct inference proxy
│       └── services/
│           ├── aiService.js             # Axios → AI microservice
│           └── projectStore.js          # MongoDB + JSON fallback
│
├── ai-service/
│   ├── main.py                          # FastAPI app + lifespan + routes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── models/weights/
│   │   └── midas_v21_small.tflite       # (not in repo — download separately)
│   ├── outputs/                         # Runtime-generated files
│   └── src/
│       ├── model_engine.py              # Thread-safe TFLite singleton
│       ├── preprocessing.py             # Decode → validate → ImageNet norm
│       ├── postprocessing.py            # Resize → normalize → colormap save
│       ├── geospatial.py                # DEM align + GCP regression + RMSE
│       └── exporters.py                 # Export bundle writer
│
├── data/                                # Sample imagery + reference DEMs
├── docs/                                # Architecture diagrams + API specs
├── scripts/                             # PowerShell / .bat launchers
├── docker-compose.production.yml
├── .env.example
└── README.md
```

---

## 🖥️ Frontend — React Client

Built with **React 19** and **Vite**, styled with **Tailwind CSS** (custom `geo-*` dark palette). Health is polled every 10 seconds and shown as colour-coded badges in the Navbar.

---

### Dashboard — `/`

Home screen with instant `localStorage` render then background MongoDB sync.

- **Stats cards**: Total Analyses · Calibrated Metric · Relative Disparity · Completed · Megapixels Processed
- **Recent projects** with quick-open workspace links
- **"Load Sample"** — injects a built-in demo project (works without AI service)

---

### New Analysis — `/new-analysis`

3-step guided form:

**Step 1 — Upload**
- Drag-and-drop or browse, accepts PNG / JPG / GeoTIFF
- Client-side: file type check + **1 GB size limit**
- Reads image dimensions via `createImageBitmap`; auto-fills project name from filename

**Step 2 — Output Format**

| Mode | Output | Requirement |
|---|---|---|
| **Relative Depth** (default) | Unitless disparity `[0, 1]` | None |
| **Metric Elevation** (advanced) | Physical elevation in metres | Georeferenced GeoTIFF source + reference DEM |

DEM sources: Copernicus GLO-30 · NASA SRTM · ALOS AW3D30 · Survey GCPs

**Step 3 — Metadata**
- Project name + optional description (persisted to MongoDB)

On submit: `POST /api/projects` (multipart) → save to `projectStore` → navigate to `/workspace?id=<id>`

---

### Workspace — `/workspace?id=<projectId>`

Core analysis view managing the full inference lifecycle.

**Inference flow:**
1. `POST /api/projects/:id/process` — trigger AI job
2. Poll `GET /api/projects/:id/status` every 1s (up to 180s)
3. On `completed` → `GET /api/projects/:id/results`
4. Resolve output URLs via `resolveAiUrl()` (prepends AI base URL)

**Three-panel layout:**

| Panel | Content |
|---|---|
| 1. Optical Ingestion | Original satellite/aerial image |
| 2. Relative Depth Map | Coloured disparity + colormap selector (turbo / viridis / inferno / grayscale) |
| 3. Calibrated Elevation *(calibrated mode only)* | Metric elevation PNG |

**Calibration metrics** (shown when metric calibration succeeded):

| Metric | Source |
|---|---|
| RMSE (m) | Held-out pixels only |
| MAE (m) | Held-out pixels only |
| Pearson r | Held-out pixels only |
| Sample count | Held-out set size |

All results persisted to `projectStore` — survive page refresh.

---

### Terrain Viewer — `/terrain-viewer?id=<projectId>`

Full-screen 3D terrain powered by **Three.js** and **@react-three/fiber**.

**Raster loading:** Downloads `.npy` from AI `/outputs/`, validates NumPy magic bytes + header, reconstructs `Float32Array` for displacement.

**Shading modes:** Textured · Hypsometric · Wireframe

**Navigation modes:**

| Mode | Controls |
|---|---|
| Orbit | Click-drag rotate · Scroll zoom |
| Free Flight | Mouse capture · WASD/arrows · R/F rise/lower |
| Path Flight | Click 2 terrain points → speed + clearance sliders → auto-animate |

**Controls panel:** Mesh quality (Low / Balanced 256-grid / High 384-grid) · Elevation exaggeration 0.1×–5.0× · Hover elevation readout · Camera XYZ telemetry

---

### History — `/history`

Searchable archive of all saved projects.

- Search by name or filename · Filter by mode · Sort by date
- Columns: thumbnail · name · mode badge · dimensions · status · date
- Actions: Open Workspace · Open 3D Viewer · Delete (with confirmation modal)

---

## ⚡ Backend — Node.js / Express

**Node.js v24 / Express v5** secure gateway + project CRUD API.

### Project Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all (`persistence` field: `mongodb-atlas` or `local-file-fallback`) |
| `POST` | `/api/projects` | Create + upload: `image`, `name`, `description`, `mode`, `referenceDem?` |
| `GET` | `/api/projects/:id` | Get single project |
| `PUT` | `/api/projects/:id` | Update metadata |
| `DELETE` | `/api/projects/:id` | Delete + remove disk file |
| `POST` | `/api/projects/:id/process` | Body: `{ colormap }` — triggers AI inference |
| `GET` | `/api/projects/:id/status` | `{ status, stage }` poll endpoint |
| `GET` | `/api/projects/:id/results` | Full inference JSON |
| `POST` | `/api/projects/batch` | Multiple images: `images[]`, `mode`, `description` |
| `POST` | `/api/inference/depth` | Direct proxy to AI service |
| `GET` | `/api/inference/health` | Proxied AI health check |
| `GET` | `/api/health` | Backend + AI connectivity |

**Multer:** `diskStorage` → `server/uploads/` (UUIDv4 filenames) · allowed `.jpg .jpeg .png .tif .tiff .geotiff` · limit: `MAX_UPLOAD_SIZE_MB` (1 GB default)

### MongoDB Project Schema

| Field | Type | Notes |
|---|---|---|
| `id` | String | UUID, unique, indexed |
| `name` | String | Required |
| `mode` | Enum | `relative` or `calibrated` |
| `status` | Enum | `uploaded → queued → processing → completed → failed` |
| `stage` | String | `ready_for_inference`, `depth_ready`, `3d_ready` |
| `uploadPath` | String | Server-side only — never sent to client |
| `originalFilename`, `mimeType`, `fileSize` | — | Upload metadata |
| `referenceDemPath`, `referenceDemType`, `gcpJson` | — | Calibration inputs |
| `processing` | Mixed | Full AI inference result JSON |
| `metadata` | Mixed | Image dims, calibration metrics, stats |
| `imageSrc`, `depthMapSrc`, `grayscaleDepthSrc` | String | Output URLs |
| `rawDisparitySrc`, `elevationMapSrc`, `elevationRawSrc` | String | Raster URLs |
| `inferenceStats` | Mixed | Timing, model name, prediction dims |

**Dual persistence:** MongoDB Atlas (primary) → local JSON file (fallback). Selected automatically at runtime via `isMongoConnected()`.

---

## 🤖 AI Microservice — Python / FastAPI

Standalone **Python 3 / FastAPI** service owning all ML and geospatial computation. Call it directly at `https://depthwizard-ai-9i23.onrender.com/docs`.

### MiDaS Depth Engine (`src/model_engine.py`)

| Property | Value |
|---|---|
| Model | `midas_v21_small.tflite` — Intel ISL MiDaS v2.1-Small |
| Architecture | EfficientNet-Lite3 + MobileNet Multi-Scale Feature Fusion |
| Input | `[1, 256, 256, 3]` ImageNet-normalised float32 |
| Output | `[1, 256, 256, 1]` relative inverse depth (unitless) |
| Runtime | TFLite + XNNPACK Delegate, 4 threads |
| Load strategy | Singleton via `get_instance()`, loaded at FastAPI lifespan startup |
| Warmup | Zero-tensor dummy inference at load time (triggers XNNPACK JIT) |
| Thread safety | `threading.Lock()` wraps every `interpreter.invoke()` |

### Preprocessing (`src/preprocessing.py`)

1. OpenCV `imdecode` → `tifffile` fallback → `Pillow` fallback
2. Validate: min 32×32, max 16384×16384 → `PreprocessingError`
3. Normalise channels: grayscale→RGB · RGBA→RGB · multi-band→first 3
4. Bicubic resize to 256×256
5. Float32, ÷255, subtract ImageNet mean, divide ImageNet std
6. Unsqueeze → `[1, 256, 256, 3]`

### Postprocessing (`src/postprocessing.py`)

1. Bilinear upsample 256×256 → original dimensions
2. Min-max normalize to `[0, 1]`
3. Save raw float32 `.npy` (used by 3D viewer)
4. Apply OpenCV colormap → save PNG preview

| Colormap | Use case |
|---|---|
| `turbo` | General terrain — perceptually uniform |
| `viridis` | Accessible, print-friendly |
| `inferno` | High-contrast dark mode |
| `grayscale` | Raw disparity inspection |

### Metric Calibration Engine (`src/geospatial.py`)

**Guarded — no fabricated values.**

**DEM path:**
1. Parse reference DEM with `rasterio.MemoryFile`
2. Validate: source image must have CRS + geotransform
3. Reproject DEM onto source grid (bilinear, `rasterio.warp.reproject`)
4. Hold-out: every 5th pixel (sorted row, col) — never used in fitting
5. `numpy.polyfit(disparity[train], dem[train], 1)` → scale + offset
6. Metrics computed **on held-out pixels only**: RMSE, MAE, Pearson r
7. **Guard**: if `|r| < 0.35` → `CalibrationError`, no metric output

**GCP path:**
- Same regression with pixel-referenced `{row, col, elevation_m}`
- Min **25 valid GCPs**, every 5th held out, same guard

**Calibrated outputs:**

| File | Format |
|---|---|
| `*_calibrated_elevation.tif` | Cloud-Optimised GeoTIFF (LZW) with source CRS |
| `*_calibrated_elevation.npy` | Float32 elevation for 3D viewer |
| `*_calibrated_elevation_{colormap}.png` | Coloured preview |
| `*_hillshade.png` | Analytical hillshade (45° sun, 315° azimuth) |

---

## 🧪 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React | 19 |
| | Vite | latest |
| | Tailwind CSS | v3 |
| | Three.js + @react-three/fiber + Drei | latest |
| | React Router | v6 |
| | Axios, Lucide React | latest |
| **Backend** | Node.js | v24 |
| | Express.js | v5 |
| | Multer | v1 LTS |
| | Mongoose, Morgan, CORS | latest |
| **AI Service** | Python | 3.10+ |
| | FastAPI + Uvicorn | ≥0.110 |
| | TensorFlow | 2.21.0 |
| | Keras | 3.15.1 |
| | OpenCV headless | ≥4.9 |
| | Rasterio | ≥1.3.10 |
| | Tifffile, Pillow, SciPy | latest |
| **Database** | MongoDB Atlas | Cloud |
| | Local JSON | File fallback |
| **Model** | MiDaS v2.1-Small | TFLite |
| **Deployment** | Docker + Compose | Render.com |

---

## 🚀 Local Setup & Installation

### Prerequisites

- Node.js v18+ · Python 3.10+ · npm v9+

### 1 — Clone

```bash
git clone https://github.com/Anurag-snippet/DepthWizard.git
cd DepthWizard
```

### 2 — Install all dependencies

```bash
# Frontend
cd client && npm install && cd ..

# Backend
cd server && npm install && cd ..

# AI Service
cd ai-service
python -m venv --system-site-packages .venv
.\.venv\Scripts\pip install -r requirements.txt    # Windows
# .venv/bin/pip install -r requirements.txt        # macOS/Linux
cd ..
```

### 3 — Download MiDaS model weights

Place `midas_v21_small.tflite` at `ai-service/models/weights/midas_v21_small.tflite`

> Download: [github.com/isl-org/MiDaS/releases](https://github.com/isl-org/MiDaS/releases)

### 4 — Configure environment

```bash
cp .env.example server/.env
cp .env.example ai-service/.env
# Edit both files with your MongoDB URI and other values
```

### 5 — Launch

```powershell
# Windows (all at once)
.\scripts\run-all.ps1

# Or individually
.\scripts\run-ai.ps1      # → http://localhost:8000
.\scripts\run-server.ps1  # → http://localhost:5000
.\scripts\run-client.ps1  # → http://localhost:5173
```

```bash
# macOS / Linux
cd ai-service && .venv/bin/python main.py &
cd server && npm start &
cd client && npm run dev
```

Open **http://localhost:5173** 🎉

---

## ⚙️ Environment Variables

### `server/.env`

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/depthwizard
AI_SERVICE_URL=http://localhost:8000
MAX_UPLOAD_SIZE_MB=1024
ALLOWED_ORIGINS=http://localhost:5173
PERSISTENT_STORAGE_DIR=./server
```

### `ai-service/.env`

```dotenv
AI_PORT=8000
ENVIRONMENT=development
OUTPUTS_DIR=./ai-service/outputs
TF_ENABLE_ONEDNN_OPTS=0
TF_CPP_MIN_LOG_LEVEL=2
ALLOWED_ORIGINS=https://depthwizard-2tf3.onrender.com
```

### `client/.env`

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

---

## 🔌 Full API Reference

### Backend — `https://depthwizard-q2f6.onrender.com/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend + AI service health |
| `GET` | `/inference/health` | Proxied AI health |
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create project (multipart upload) |
| `GET` | `/projects/:id` | Get single project |
| `PUT` | `/projects/:id` | Update metadata |
| `DELETE` | `/projects/:id` | Delete + remove disk file |
| `POST` | `/projects/:id/process` | `{ colormap }` — trigger inference |
| `GET` | `/projects/:id/status` | Poll status |
| `GET` | `/projects/:id/results` | Full inference JSON |
| `POST` | `/projects/batch` | Batch upload |
| `POST` | `/inference/depth?colormap=turbo` | Direct proxy |

### AI Microservice — `https://depthwizard-ai-9i23.onrender.com`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Model loaded, TF/Keras/NumPy versions |
| `GET` | `/api/v1/model/metadata` | MiDaS architecture + metric notice |
| `POST` | `/api/inference/depth` | Full pipeline |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/outputs/<filename>` | Static file access |

**`POST /api/inference/depth` parameters:**

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | file | ✅ | PNG / JPG / GeoTIFF |
| `reference_dem` | file | ❌ | Reference DEM GeoTIFF (must share CRS with source) |
| `gcp_json` | form string | ❌ | `[{row, col, elevation_m}, ...]` |
| `colormap` | query | ❌ | `turbo` (default) / `viridis` / `inferno` / `grayscale` |

**Sample response:**

```json
{
  "success": true,
  "processing_id": "proc_abc123def456",
  "depth_map_preview_url": "/outputs/proc_abc123def456_depth_turbo.png",
  "raw_npy_download_url": "/outputs/proc_abc123def456_disparity.npy",
  "inference_duration_ms": 234.5,
  "model_name": "MiDaS v2.1 Small (TFLite)",
  "output_type": "relative_inverse_depth",
  "is_metric": false,
  "statistics": {
    "min_raw_disparity": 0.021,
    "max_raw_disparity": 0.994,
    "mean_raw_disparity": 0.412,
    "std_raw_disparity": 0.183
  },
  "calibration": {
    "status": "not_requested",
    "is_metric": false,
    "warning": "Relative depth is unitless; upload a spatially aligned reference DEM to request calibration."
  }
}
```

---

## 🐳 Docker Deployment

```bash
export ALLOWED_ORIGINS=https://yourdomain.com
docker compose -f docker-compose.production.yml up --build -d
docker compose -f docker-compose.production.yml ps
```

Services: `api` (port 5000, `/data` volume) + `ai` (port 8000, `/data/outputs` volume).  
Both have 30s healthchecks + `unless-stopped` restart policy.

---

## 🔬 Scientific Integrity & SIH Compliance

**Relative depth vs. metric elevation**
> MiDaS outputs scale-ambiguous disparity in `[0, 1]` — unitless, never presented as metres without calibration. Every API response includes a `scientific_notice` field.

**Calibration methodology**
> Metric elevation is only produced when a reference DEM/GCPs are supplied **and** the held-out Pearson correlation ≥ 0.35. Regression is fit on training pixels only; RMSE, MAE, and r are computed on **held-out pixels exclusively**.

**Zero fabricated values**
> Every inference runs the live TFLite interpreter on the actual uploaded image. `framework_verified: true` in the health response confirms the runtime is live.

---

## 🗺️ Roadmap

- [x] Phase 1 — Monorepo scaffolding, microservices, health endpoints, environment templates
- [x] Phase 2 — Image upload & geospatial preprocessing (GeoTIFF, PNG, JPG, batch queue)
- [x] Phase 3 — Monocular AI depth estimation (MiDaS TFLite via TensorFlow/Keras)
- [x] Phase 4 — Relative depth map visualization & inspection (colormaps, statistics)
- [x] Phase 5 — Elevation calibration engine (DEM + GCP regression + held-out RMSE/MAE)
- [x] Phase 6 — 3D terrain mesh generation (Three.js displacement mapping)
- [x] Phase 7 — Original image texture mapping & shading (textured / hypsometric / wireframe)
- [x] Phase 8 — Interactive 3D flythrough (orbit / free flight / spline path flight)
- [x] Phase 9 — Terrain analysis & calibration metrics panel
- [x] Phase 10 — Export bundle (PNG, GeoTIFF, .npy, hillshade) & persistent project history

---

<div align="center">

**Built for Smart India Hackathon — Problem Statement SIH 26175**

Made with ❤️ by [Anurag Yadav](https://github.com/Anurag-snippet)

⭐ Star this repo if you found it useful!

</div>
