# DepthWizard API Specification (SIH 26175)

## 1. Backend Gateway (Port 5000)

### `GET /api/health`
Returns health telemetry for Node.js Express server and downstream connectivity to the Python AI service.

**Sample Response:**
```json
{
  "success": true,
  "service": "DepthWizard Backend Gateway",
  "version": "1.0.0-sih26175",
  "status": "healthy",
  "timestamp": "2026-10-02T09:50:00.000Z",
  "environment": "development",
  "port": 5000,
  "aiService": {
    "url": "http://localhost:8000",
    "status": "connected"
  }
}
```

### `GET /api/projects`
Retrieves stored project sessions and processing history.

### `POST /api/projects`
Creates a new project session.

---

## 2. AI Microservice (Port 8000)

### `GET /health`
Returns diagnostic health metrics for Python, TensorFlow, Keras, and available hardware accelerators (CPU/GPU).

**Sample Response:**
```json
{
  "status": "healthy",
  "service": "ai-service",
  "python_version": "3.13.15",
  "tensorflow_version": "2.21.0",
  "keras_version": "3.15.1",
  "numpy_version": "2.5.2",
  "gpu_accelerated": false,
  "physical_devices": {
    "gpu_count": 0,
    "cpu_count": 1,
    "devices": ["/physical_device:CPU:0"]
  },
  "framework_verified": true
}
```

### `GET /api/v1/model/metadata`
Returns information regarding the neural architecture and output representation.

### `POST /api/v1/depth/estimate`
Placeholder for TensorFlow monocular depth estimation pipeline (Scheduled for Phase 3).
Returns `HTTP 501 Not Implemented` with SIH compliance notice prohibiting fabricated predictions.
