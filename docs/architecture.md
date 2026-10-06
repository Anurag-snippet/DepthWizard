# DepthWizard architecture

## 1. Scope

DepthWizard is a three-part system:

- a browser UI in `client/`
- an Express API gateway in `server/`
- a FastAPI inference service in `ai-service/`

The application accepts a single image, runs monocular depth estimation, and optionally calibrates the output to metric elevation using a reference DEM or GCPs.

## 2. Monorepo structure

```text
DepthWizard/
├── ai-service/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── models/weights/
│   ├── outputs/
│   └── src/
│       ├── exporters.py
│       ├── geospatial.py
│       ├── model_engine.py
│       ├── postprocessing.py
│       └── preprocessing.py
├── client/
│   ├── src/
│   ├── public/
│   ├── tests/
│   └── package.json
├── data/
│   ├── README.md
│   ├── elevation/
│   └── optical/
├── docs/
├── server/
│   ├── index.js
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
└── .gitignore
```

## 3. Responsibility split

### Frontend (`client/`)

The UI is a React + Vite application. It manages project creation, restarts, health checks, result visualization, and the interactive terrain viewer. It calls the Express backend for metadata operations and uses AI output URLs served by the Python service.

### Backend gateway (`server/`)

The Express service is the primary integration layer. It:

- hosts project CRUD routes
- stores upload metadata and file paths
- accepts image uploads via Multer
- forwards inference requests to the AI microservice
- tracks processing state and final outputs
- uses MongoDB when configured, otherwise falls back to local file-based persistence

### AI microservice (`ai-service/`)

The FastAPI service is where the actual depth estimation happens. It loads a TensorFlow Lite model once on startup, validates uploaded image bytes, runs inference, and writes depth outputs to `ai-service/outputs/`.

## 4. Request flow

1. A browser uploads an image through the client.
2. The Express server stores the file and creates a project entry.
3. When processing starts, the endpoint calls the Python AI service using `AiServiceClient`.
4. The AI service reads the image, validates it, runs inference, and returns JSON metadata.
5. The backend updates the project record with output URLs and status.
6. The client polls the project status and displays the result.

## 5. Data and persistence model

The actual backend writes uploads under `server/uploads` and keeps metadata in project records. MongoDB is optional and integrated through `server/src/config/db.js` and `server/src/services/projectStore.js`; when MongoDB is unavailable, the project continues with local fallback storage.

## 6. Calibration and scientific behavior

DepthWizard separates two outputs clearly:

- relative depth: unitless output from the monocular model
- metric elevation: produced only when the service has enough valid geospatial information

The code intentionally avoids treating relative depth as metric data. Model output is only converted to physical elevation when a valid reference DEM or GCP configuration is used.

## 7. Runtime notes

The current implementation is a working codebase, but the real validation status depends on starting the services and running a real sample image. The repository contains unit-test files but the docs should not claim production verification without fresh runtime evidence.

