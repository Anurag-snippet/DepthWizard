# DepthWizard Architecture (SIH 26175)

## 1. System Overview
DepthWizard is a high-performance scientific geospatial application that processes a single satellite or aerial image, predicts a relative depth map using a pretrained monocular depth estimation model in TensorFlow/Keras, calibrates the prediction against reference elevation data, generates a 3D terrain mesh, and allows interactive flythrough exploration.

## 2. Monorepo Structure

```
DepthWizard/
├── client/                     # Frontend (React 19 + Vite + Tailwind CSS + Three.js)
│   ├── src/
│   │   ├── components/         # Reusable UI & 3D canvas modules
│   │   │   ├── common/         # Badges, modals, buttons
│   │   │   ├── layout/         # Navbar, Sidebar, Panels
│   │   │   ├── upload/         # Ingestion components
│   │   │   ├── viewers/        # 2D split viewers & colormaps
│   │   │   ├── canvas3d/       # Three.js terrain mesh & flythrough
│   │   │   └── analysis/       # Transect charts & calibration table
│   │   ├── pages/              # Dashboard, Workspace, History
│   │   ├── services/           # REST API client
│   │   └── App.jsx             # Main router
│   └── package.json
│
├── server/                     # Backend Gateway (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Environment & path configuration
│   │   ├── controllers/        # Health & project controllers
│   │   ├── middleware/         # Centralized error handler & CORS
│   │   ├── routes/             # REST route endpoints
│   │   └── services/           # AI service client & elevation calibrator
│   ├── uploads/                # Managed upload & artifact directory
│   └── index.js
│
├── ai-service/                 # AI Inference Engine (FastAPI + TensorFlow 2.21)
│   ├── models/                 # Model architectures & weights
│   ├── .venv/                  # Python isolated virtual environment
│   ├── main.py                 # FastAPI application
│   └── requirements.txt        # Verified dependencies
│
├── data/                       # Sample test datasets (Optical imagery & DEMs)
│   ├── optical/
│   └── elevation/
│
├── docs/                       # Architectural & API specifications
├── scripts/                    # PowerShell and Batch startup scripts
├── .gitignore
├── .env.example
└── README.md
```

## 3. Geospatial Integrity Protocol
- **Relative Depth:** Raw output from monocular neural networks represents unitless relative disparity $[0, 1]$.
- **Metric Elevation:** Absolute elevation (metres above mean sea level) is calculated only when reference Digital Elevation Models (DEMs) or Ground Control Points (GCPs) are supplied.
- **Accuracy Verification:** Calibration calculates Root Mean Square Error (RMSE) and Mean Absolute Error (MAE) against ground truth validation points.
