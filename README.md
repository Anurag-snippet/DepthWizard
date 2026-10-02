# DepthWizard — Single-View Height Estimation and 3D Flythrough
### Smart India Hackathon Prototype (SIH 26175)

DepthWizard is an advanced scientific geospatial web application engineered to accept a single satellite or aerial image, predict relative depth maps using a pretrained monocular depth estimation model implemented in **TensorFlow/Keras**, calibrate the predictions against reference elevation data (Digital Elevation Models or Ground Control Points), generate a 3D terrain mesh, and enable users to explore the landscape through an interactive flythrough.

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
