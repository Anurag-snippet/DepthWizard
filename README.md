<div align="center">

# 🧭 DepthWizard

### Single-View Satellite Height Estimation & Interactive 3D Terrain Explorer

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-depthwizard--2tf3.onrender.com-4f46e5?style=for-the-badge)](https://depthwizard-2tf3.onrender.com)
[![SIH](https://img.shields.io/badge/Smart_India_Hackathon-SIH_26175-f59e0b?style=for-the-badge)](https://www.sih.gov.in)
[![Node](https://img.shields.io/badge/Node.js-v24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.21-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)

<br/>

> **DepthWizard** accepts a single satellite or aerial image, predicts relative depth maps using a pretrained **MiDaS monocular depth model** (TensorFlow/Keras), optionally calibrates predictions against real reference elevation data (DEM or GCPs), generates a 3D terrain mesh, and lets you fly through the landscape interactively — all in the browser.

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🧪 Technology Stack](#-technology-stack)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🖥️ Running the Services](#️-running-the-services)
- [🛣️ Application Pages](#️-application-pages)
- [🔌 API Reference](#-api-reference)
- [🐳 Docker Deployment](#-docker-deployment)
- [🔬 Scientific Integrity](#-scientific-integrity)
- [📁 Project Structure](#-project-structure)
- [🗺️ Roadmap](#️-roadmap)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🛰️ **Multi-format Upload** | PNG, JPG, JPEG, GeoTIFF (.tif/.tiff) up to **1 GB** |
| 🧠 **AI Depth Estimation** | MiDaS v2.1-Small TFLite — real TensorFlow inference, zero hardcoded values |
| 📐 **Metric Calibration** | Calibrate relative depth against a reference DEM or Ground Control Points (GCPs) |
| 🗺️ **Error Metrics** | RMSE, MAE, Max Error, Pearson correlation — computed on held-out reference samples |
| 🌋 **3D Terrain Mesh** | WebGL terrain from the predicted depth map via Three.js displacement mapping |
| ✈️ **Interactive Flythrough** | Spline-based camera animation over the reconstructed terrain |
| 📊 **Batch Processing** | Queue and process multiple images in a single session |
| 💾 **Project History** | Persistent project management via MongoDB Atlas (fallback: local JSON) |
| 📤 **Export Bundle** | Download as PNG, GeoTIFF, raw NumPy `.npy`, and hillshade renders |
| 🔄 **Live Health Monitoring** | Real-time AI service and backend status polling from the UI navbar |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                               │
│   React 19 · Vite · Tailwind CSS · Three.js · @react-three/fiber   │
│                                                                     │
│  Dashboard ──► New Analysis ──► Workspace ──► Terrain Viewer        │
│                     │               │                               │
│               Upload + Config   Results Panel                       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ REST (Axios)
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   BACKEND GATEWAY  :5000                             │
│              Node.js · Express · Multer · Morgan                     │
│                                                                      │
│  /api/projects  ──► MongoDB Atlas (or local JSON fallback)           │
│  /api/inference ──────────────────────────────────────┐              │
│  /api/health                                           │             │
└────────────────────────────────────────────────────────┼─────────────┘
                                                         │ HTTP proxy
                                                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   AI MICROSERVICE  :8000                             │
│           Python · FastAPI · Uvicorn · TensorFlow 2.21               │
│                                                                      │
│  POST /api/inference/depth                                           │
│    ├── Preprocessing  (OpenCV · Pillow · Tifffile)                   │
│    ├── MiDaS TFLite Inference  (DepthEstimationEngine)               │
│    ├── Postprocessing (normalize_disparity · colormaps)              │
│    ├── Calibration    (DEM alignment · GCP regression · RMSE/MAE)    │
│    └── Export Bundle  (PNG · GeoTIFF · .npy · hillshade)            │
│                                                                      │
│  GET /health  ·  GET /api/v1/model/metadata  ·  GET /docs            │
└──────────────────────────────────────────────────────────────────────┘
                       │
               ┌───────┴───────┐
               ▼               ▼
        MongoDB Atlas     Local JSON
        (persistence)     (fallback)
```

---

## 🧪 Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React | 19 |
| | Vite | latest |
| | Tailwind CSS | v3 |
| | Three.js + @react-three/fiber + Drei | latest |
| | React Router | v6 |
| | Axios · Lucide React | latest |
| **Backend** | Node.js | v24 |
| | Express.js | v5 |
| | Multer | v1 (LTS) |
| | Morgan · CORS · Dotenv | latest |
| **AI Service** | Python | 3.10+ |
| | FastAPI + Uvicorn | ≥0.110 |
| | TensorFlow | 2.21.0 |
| | Keras | 3.15.1 |
| | OpenCV (headless) · Pillow | ≥4.9 / ≥10 |
| | Rasterio · Tifffile · SciPy | latest |
| **Database** | MongoDB Atlas | Cloud (+ local JSON fallback) |
| **Model** | MiDaS v2.1-Small | TFLite |
| **Deployment** | Docker + Docker Compose | Render.com (cloud) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (tested on v24)
- **Python** 3.10+ (tested on 3.13)
- **npm** v9+
- **Git**

### 1 — Clone the repository

```bash
git clone https://github.com/Anurag-snippet/DepthWizard.git
cd DepthWizard
```

### 2 — Configure environment

```bash
cp .env.example server/.env
cp .env.example ai-service/.env
```

Edit both files with your values (see [Environment Configuration](#️-environment-configuration)).

### 3 — Install dependencies

```bash
# Frontend
cd client && npm install && cd ..

# Backend
cd server && npm install && cd ..

# AI Service — Python virtual environment
cd ai-service
python -m venv --system-site-packages .venv
.\.venv\Scripts\pip install -r requirements.txt
cd ..
```

### 4 — Download the MiDaS model weights

Place `midas_v21_small.tflite` into:

```
ai-service/models/weights/midas_v21_small.tflite
```

> Download from the [MiDaS releases page](https://github.com/isl-org/MiDaS/releases) or the official TFLite model hub.

### 5 — Launch everything

**Windows (recommended):**

```powershell
# Launch all three services at once
.\scripts\run-all.ps1

# Or individually
.\scripts\run-ai.ps1      # AI Service  → http://localhost:8000
.\scripts\run-server.ps1  # Backend     → http://localhost:5000
.\scripts\run-client.ps1  # Frontend    → http://localhost:5173
```

**macOS / Linux:**

```bash
cd ai-service && .venv/bin/python main.py &
cd server && npm start &
cd client && npm run dev
```

Open **http://localhost:5173** in your browser. 🎉

---

## ⚙️ Environment Configuration

Copy `.env.example` to `server/.env` and `ai-service/.env`. Supported variables:

```dotenv
# ─── Backend (server/.env) ───────────────────────────────────────────
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/depthwizard   # Use Atlas URI for production
AI_SERVICE_URL=http://localhost:8000
MAX_UPLOAD_SIZE_MB=1024                             # 1 GB
ALLOWED_ORIGINS=http://localhost:5173               # Comma-separated; never use * in prod
PERSISTENT_STORAGE_DIR=./server                    # Durable volume mount path in production

# ─── AI Microservice (ai-service/.env) ──────────────────────────────
AI_PORT=8000
ENVIRONMENT=development
OUTPUTS_DIR=./ai-service/outputs
TF_ENABLE_ONEDNN_OPTS=0
TF_CPP_MIN_LOG_LEVEL=2

# ─── Frontend (client/.env) ─────────────────────────────────────────
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:8000
```

> **Security:** `server/.env` and `ai-service/.env` are git-ignored. Never commit real credentials. Use your hosting platform's environment secret manager in production.

---

## 🖥️ Running the Services

### Service URLs

| Service | URL | Verify |
|---|---|---|
| Frontend | http://localhost:5173 | Open in browser |
| Backend Gateway | http://localhost:5000 | `GET /api/health` |
| AI Microservice | http://localhost:8000 | `GET /health` |
| Swagger UI | http://localhost:8000/docs | Interactive API docs |

### Health Check Responses

**Backend — `GET http://localhost:5000/api/health`**

```json
{
  "success": true,
  "service": "DepthWizard Backend Gateway",
  "version": "1.0.0-sih26175",
  "status": "healthy",
  "aiService": {
    "url": "http://localhost:8000",
    "status": "connected"
  }
}
```

**AI Service — `GET http://localhost:8000/health`**

```json
{
  "status": "healthy",
  "service": "ai-service",
  "python_version": "3.13.x",
  "tensorflow_version": "2.21.0",
  "keras_version": "3.15.1",
  "numpy_version": "2.x.x",
  "model_loaded": true,
  "framework_verified": true
}
```

---

## 🛣️ Application Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Dashboard** | Project statistics, recent analyses, quick-start actions |
| `/new-analysis` | **New Analysis** | Upload image, configure colormap & calibration, submit |
| `/workspace` | **Workspace** | Depth map results, calibration metrics, export controls |
| `/terrain-viewer` | **Terrain Viewer** | Interactive 3D WebGL terrain mesh + flythrough camera |
| `/history` | **History** | Persistent project list, search, re-open previous analyses |

---

## 🔌 API Reference

### Backend Gateway — `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend + AI service health |
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create a new project (multipart image upload) |
| `GET` | `/projects/:id` | Get project by ID |
| `PATCH` | `/projects/:id` | Update project metadata |
| `DELETE` | `/projects/:id` | Delete a project |
| `POST` | `/projects/:id/analyze` | Trigger depth inference for a project |
| `POST` | `/inference/depth` | Direct depth inference (multipart form) |

### AI Microservice — `http://localhost:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Model loading status + framework versions |
| `GET` | `/api/v1/model/metadata` | MiDaS architecture details |
| `POST` | `/api/inference/depth` | Run the full depth estimation pipeline |
| `GET` | `/docs` | Auto-generated FastAPI Swagger UI |

#### `POST /api/inference/depth` — Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | `file` | ✅ | Satellite/aerial image (PNG, JPG, GeoTIFF) |
| `reference_dem` | `file` | ❌ | Reference DEM GeoTIFF for metric calibration |
| `gcp_json` | `string` | ❌ | JSON array of `{row, col, elevation_m}` GCPs |
| `colormap` | `string` | ❌ | `turbo` (default) · `viridis` · `inferno` · `grayscale` |

---

## 🐳 Docker Deployment

A production-ready Docker Compose file is included:

```bash
# Set environment variables
export ALLOWED_ORIGINS=https://yourdomain.com

# Build and start all services
docker compose -f docker-compose.production.yml up --build -d

# Check status
docker compose -f docker-compose.production.yml ps
```

Services exposed:
- **Backend API**: `0.0.0.0:5000`
- **AI Service**: `0.0.0.0:8000`

Both services include Docker healthchecks (30-second interval) and `unless-stopped` restart policies.

---

## 🔬 Scientific Integrity

This project adheres to strict scientific honesty principles required by the SIH evaluation committee.

**Relative Depth vs. Metric Elevation**
> Monocular depth networks output unitless relative disparity values `[0, 1]`. Uncalibrated model predictions are **never** presented as actual heights in metres.

**Metric Calibration**
> Metric elevation is derived **only** when a spatially aligned reference DEM or GCPs are supplied. Calibration uses linear regression and error metrics (RMSE, MAE, Max Error, Pearson correlation) are computed on **held-out** reference samples — not the fitting samples.

**Zero Fabricated Metrics**
> Every inference uses the live TensorFlow TFLite runtime. No values are hardcoded or artificially generated anywhere in the pipeline.

---

## 📁 Project Structure

```
DepthWizard/
│
├── client/                          # React 19 + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── canvas3d/            # Three.js / R3F terrain mesh components
│       │   ├── common/              # StatusBadge, MetricsCard, EmptyState, …
│       │   ├── layout/              # Navbar, Sidebar
│       │   ├── upload/              # UploadDropzone, BatchProcessingModal, BatchQueuePreview
│       │   └── workspace/           # Results panels, calibration displays
│       ├── pages/
│       │   ├── Dashboard.jsx        # Project overview & statistics
│       │   ├── NewAnalysis.jsx      # Upload + configuration workflow
│       │   ├── Workspace.jsx        # Inference results & exports
│       │   ├── TerrainViewer.jsx    # 3D flythrough viewer
│       │   └── History.jsx          # Project history browser
│       └── services/
│           ├── api.js               # Axios client + health check wrappers
│           └── projectStore.js      # Client-side project cache + remote sync
│
├── server/                          # Node.js + Express gateway
│   └── src/
│       ├── config/                  # Environment config, MongoDB connection
│       ├── controllers/             # Health controller
│       ├── middleware/              # Error handler (LIMIT_FILE_SIZE → HTTP 413)
│       ├── models/                  # Mongoose Project schema
│       ├── routes/                  # projectRoutes.js, inferenceRoutes.js
│       └── services/
│           ├── aiService.js         # HTTP proxy to AI microservice
│           └── projectStore.js      # MongoDB Atlas + local JSON fallback
│
├── ai-service/                      # Python FastAPI + TensorFlow engine
│   ├── main.py                      # FastAPI app, lifespan loader, all endpoints
│   ├── requirements.txt
│   ├── models/weights/              # MiDaS v2.1-Small TFLite weights (not in repo)
│   ├── outputs/                     # Generated depth maps, GeoTIFFs, .npy exports
│   └── src/
│       ├── model_engine.py          # DepthEstimationEngine singleton (TFLite)
│       ├── preprocessing.py         # Image decode, resize, normalize
│       ├── postprocessing.py        # Disparity normalization, colormap rendering
│       ├── geospatial.py            # Rasterio DEM alignment, GCP calibration, RMSE
│       └── exporters.py             # Export bundle writer (PNG, GeoTIFF, .npy)
│
├── data/                            # Sample satellite imagery + reference DEMs
├── docs/                            # Architecture diagrams, API specifications
├── scripts/                         # PowerShell / Batch launch scripts
├── docker-compose.production.yml    # Production Docker Compose
├── .env.example                     # Environment variable template
└── README.md
```

---

## 🗺️ Roadmap

- [x] **Phase 1** — Monorepo scaffolding, microservices, health endpoints, environment templates
- [x] **Phase 2** — Image upload & geospatial preprocessing (GeoTIFF, PNG, JPG, batch queue)
- [x] **Phase 3** — Monocular AI depth estimation (MiDaS TFLite via TensorFlow/Keras)
- [x] **Phase 4** — Relative depth map visualization & inspection (colormaps, statistics)
- [x] **Phase 5** — Elevation calibration engine (DEM alignment + GCP regression + RMSE/MAE)
- [x] **Phase 6** — 3D terrain mesh generation (Three.js displacement mapping)
- [x] **Phase 7** — Original image texture mapping & material shading
- [x] **Phase 8** — Interactive 3D flythrough & camera navigation
- [x] **Phase 9** — Terrain analysis & elevation comparison panels
- [x] **Phase 10** — Export bundle (PNG, GeoTIFF, .npy, hillshade) & project history management

---

<div align="center">

**Built for Smart India Hackathon — Problem Statement SIH 26175**

Made with ❤️ by [Anurag Yadav](https://github.com/Anurag-snippet)

</div>


---

## Key Principles & Scientific Integrity

* **Relative Depth vs. Metric Elevation:** Monocular depth networks output unitless relative disparity values $[0, 1]$. In strict adherence to SIH evaluation criteria, uncalibrated model predictions are **never** presented as actual heights in metres.
* **Metric Calibration Engine:** Calibrated metric elevation is derived only when reference elevation data (DEM or GCPs) is supplied, accompanied by rigorous residual error metrics (RMSE, MAE, Max Error).
* **Zero Fabricated Metrics:** Evaluation and inference use genuine machine learning pipelines without hardcoded or artificial values.

---

## Architecture & Monorepo Structure

```
DepthWizard/
├── client/                     # Frontend: React 19, Vite, Tailwind CSS, Three.js, R3F, Drei
├── server/                     # Backend: Node.js, Express, Multer, REST APIs
├── ai-service/                 # AI Engine: Python 3, FastAPI, TensorFlow 2.21, Keras 3.15, OpenCV
├── data/                       # Curated test satellite imagery and reference elevation models
├── docs/                       # Architecture diagrams and API specifications
├── scripts/                    # Launch scripts for PowerShell and Windows Command Prompt
├── .gitignore                  # Git ignore rules for node_modules, .venv, uploads, outputs
├── .env.example                # Global environment configuration template
└── README.md                   # Project documentation
```

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Three.js, @react-three/fiber, @react-three/drei, Lucide React, Axios |
| **Backend** | Node.js (v24), Express.js, Multer, CORS, Morgan, Dotenv |
| **AI Service** | Python 3, FastAPI, Uvicorn, TensorFlow 2.21, Keras 3.15, OpenCV (headless), NumPy, SciPy, Tifffile |
| **3D & Geospatial**| Three.js WebGL, GeoTIFF parsing, Spline Flightpath, Terrain displacement mapping |

---

## Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.13)
- **npm**: v9+

### 2. Installation

#### Clone & Enter Directory:
```bash
cd DepthWizard
```

#### Install Frontend Dependencies:
```bash
cd client
npm install
cd ..
```

#### Install Backend Dependencies:
```bash
cd server
npm install
cd ..
```

#### Set Up AI Service Virtual Environment:
```bash
cd ai-service
python -m venv --system-site-packages .venv
.\.venv\Scripts\pip install -r requirements.txt
cd ..
```

---

## Running the Services

### Option A: Launch All (Windows)
Double-click `scripts\run-all.bat` or run:
```powershell
.\scripts\run-all.ps1
```

### Option B: Run Services Separately

1. **AI Microservice (FastAPI + TensorFlow on Port 8000):**
   ```powershell
   .\scripts\run-ai.ps1
   # Or directly:
   cd ai-service
   .\.venv\Scripts\python main.py
   ```
   Verify at: [http://localhost:8000/health](http://localhost:8000/health)

2. **Backend Gateway (Express on Port 5000):**
   ```powershell
   .\scripts\run-server.ps1
   # Or directly:
   cd server
   npm start
   ```
   Verify at: [http://localhost:5000/api/health](http://localhost:5000/api/health)

3. **Frontend Client (Vite on Port 5173):**
   ```powershell
   .\scripts\run-client.ps1
   # Or directly:
   cd client
   npm run dev
   ```
   Open browser at: [http://localhost:5173](http://localhost:5173)

---

## API Health Check Telemetry

### Backend Gateway: `GET http://localhost:5000/api/health`
```json
{
  "success": true,
  "service": "DepthWizard Backend Gateway",
  "version": "1.0.0-sih26175",
  "status": "healthy",
  "aiService": {
    "url": "http://localhost:8000",
    "status": "connected"
  }
}
```

### AI Microservice: `GET http://localhost:8000/health`
```json
{
  "status": "healthy",
  "service": "ai-service",
  "tensorflow_version": "2.21.0",
  "keras_version": "3.15.1",
  "numpy_version": "2.5.2",
  "gpu_accelerated": false,
  "framework_verified": true
}
```

---

## Implementation Roadmap

- [x] **Phase 1: Project Setup and Architecture** (Scaffolding, microservices, health endpoints, environment templates, routers)
- [ ] **Phase 2: Image Upload & Geospatial Preprocessing**
- [ ] **Phase 3: Monocular AI Depth Estimation (TensorFlow/Keras)**
- [ ] **Phase 4: Relative Depth Map Visualization & Inspection**
- [ ] **Phase 5: Elevation Calibration (DEM & GCP Regression)**
- [ ] **Phase 6: 3D Terrain Mesh Generation**
- [ ] **Phase 7: Original Image Texture Mapping & Material Shading**
- [ ] **Phase 8: Interactive 3D Flythrough & Camera Navigation**
- [ ] **Phase 9: Terrain Analysis & Elevation Comparison**
- [ ] **Phase 10: Export & Project History Management**
