# DepthWizard

[![Prototype](https://img.shields.io/badge/🌐_Prototype-depthwizard--2tf3.onrender.com-4f46e5?style=for-the-badge)](https://depthwizard-2tf3.onrender.com)
[![SIH](https://img.shields.io/badge/Smart_India_Hackathon-SIH_26175-f59e0b?style=for-the-badge)](https://www.sih.gov.in)

## 🔗 Prototype

[Open the DepthWizard prototype](https://depthwizard-2tf3.onrender.com)

---

DepthWizard is a monorepo for single-image terrain estimation and interactive 3D exploration. The project accepts a single optical image, sends it to a TensorFlow Lite monocular depth model, and optionally calibrates the result to metric elevation using a DEM or ground control points. The frontend, backend gateway, and AI inference worker are separated so the UI can run independently of the Python model pipeline.

## ✨ What it does

DepthWizard extracts 3D terrain from a single aerial or satellite image without requiring stereo pairs or LiDAR.

```text
Single image (PNG / JPG / GeoTIFF)
          │
          ▼
  MiDaS v2.1-Small TFLite
          │
          ▼
  Relative disparity / inverse depth
          │
          ├── optional DEM or GCP calibration
          │          │
          │          ▼
          │   metric elevation + GeoTIFF / hillshade
          │
          ▼
  Float32 raster → Three.js terrain viewer
```

## 🏗️ System architecture

```text
Browser
  └─ React + Vite client
        │ HTTPS REST
        ▼
Express backend :5000
  - stores uploads and project metadata
  - proxies inference requests
  - exposes project status/results APIs
        │ HTTP proxy
        ▼
FastAPI AI service :8000
  - validates image input
  - runs MiDaS TFLite inference
  - postprocesses disparity output
  - optionally calibrates to DEM/GCP metric elevation
  - writes .npy / .png / GeoTIFF outputs
```

## 📁 Repository structure

```text
DepthWizard/
├── ai-service/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── models/weights/midas_v21_small.tflite
│   ├── outputs/
│   └── src/
│       ├── exporters.py
│       ├── geospatial.py
│       ├── model_engine.py
│       ├── postprocessing.py
│       └── preprocessing.py
├── client/
│   ├── package.json
│   ├── src/
│   ├── public/
│   └── tests/
├── data/
│   ├── README.md
│   ├── elevation/
│   └── optical/
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── calibration.md
│   ├── deployment.md
│   ├── terrain-viewer.md
│   └── testing-report.md
├── server/
│   ├── index.js
│   ├── package.json
│   ├── data/projects.json
│   ├── uploads/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── services/
├── scripts/
├── docker-compose.production.yml
├── package.json
├── README.md
├── .gitignore
└── .env.example
```

## 🖥️ Frontend, backend, and AI endpoints

### Backend gateway

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/batch`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `POST /api/projects/:id/process`
- `GET /api/projects/:id/status`
- `GET /api/projects/:id/results`
- `DELETE /api/projects/:id`
- `GET /api/inference/health`
- `POST /api/inference/depth?colormap=<name>`

### AI service

- `GET /health`
- `GET /api/inference/health`
- `GET /api/v1/model/metadata`
- `POST /api/inference/depth`

The Python service is the one that actually performs inference and writes output files into `ai-service/outputs/`.

## 🚀 Local development

From the repo root:

```bash
npm install
npm run dev:client
npm run dev:server
```

The root `package.json` also provides:

```bash
npm run dev:ai
npm run build:client
npm run install:all
```

The AI service can be started directly with:

```powershell
.\ai-service\.venv\Scripts\python ai-service\main.py
```

## ⚙️ Environment and persistence

The backend configuration in `server/src/config/index.js` sets:

- `PORT` default `5000`
- `AI_SERVICE_URL` default `http://localhost:8000`
- upload directory under the working repo root by default
- `MAX_UPLOAD_SIZE_MB` fallback `50`
- optional `MONGODB_URI`

MongoDB is attempted if `MONGODB_URI` is set, but the code includes local file fallback behavior. In other words, the project is designed to degrade gracefully when MongoDB is unavailable.

## 🧪 Scientific integrity and calibration notes

This project estimates a relative depth map from an image. The raw MiDaS output is scale-ambiguous and unitless unless a spatial reference is supplied.

Metric elevation is only produced when calibration data is present and the fit passes the project guard checks. The repository documentation in [docs/calibration.md](docs/calibration.md) explains the allowed DEM/GCP workflow and the correlation threshold used before declaring calibrated metric outputs.

## 📚 Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/api.md](docs/api.md)
- [docs/calibration.md](docs/calibration.md)
- [docs/deployment.md](docs/deployment.md)
- [docs/terrain-viewer.md](docs/terrain-viewer.md)
- [docs/testing-report.md](docs/testing-report.md)

## ⚠️ Important caveat

This repository contains a working project structure and documentation aligned to the checked-in code, but each runtime path should still be verified on the target machine before claiming the full stack is production-ready.

---

Built for the DepthWizard project and its local/remote deployment workflows.
