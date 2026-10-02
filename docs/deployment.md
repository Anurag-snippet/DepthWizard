# Deployment guide

DepthWizard has three independently deployable services: a static Vite client, Express API, and TensorFlow/FastAPI inference worker. A production deployment requires persistent volumes for the API's uploads/project metadata and the AI service's results. Free or serverless hosts are generally unsuitable for TensorFlow inference and durable outputs.

## Minimum production capacity

| Service | Minimum | Recommended |
| --- | --- | --- |
| Client | Static hosting | CDN-backed static hosting |
| Express API | 1 vCPU, 512 MB RAM | 1–2 vCPU, 1 GB RAM with persistent disk |
| TensorFlow AI | 4 vCPU, 8 GB RAM, 20 GB persistent disk | GPU host with 8+ GB VRAM, 16 GB RAM, durable object storage/volume |

The supplied container uses Python 3.11 and Debian GDAL packages (`libgdal-dev`, `gdal-bin`) before installing Rasterio. Verify the image on the selected host; TensorFlow/Rasterio wheels, CPU instruction sets, and GPU driver/CUDA versions must match the target architecture. The supplied TensorFlow workload runs on CPU by default.

## Required environment variables

Never commit a real `.env` file. Copy the examples and set public URLs at build time.

```bash
# Express
NODE_ENV=production
PORT=5000
AI_SERVICE_URL=https://ai.example.org
ALLOWED_ORIGINS=https://app.example.org
MAX_UPLOAD_SIZE_MB=50
PERSISTENT_STORAGE_DIR=/data

# FastAPI
ENVIRONMENT=production
PORT=8000
ALLOWED_ORIGINS=https://app.example.org
OUTPUTS_DIR=/data/outputs

# Vite, at build time only
VITE_API_URL=https://api.example.org/api
VITE_AI_URL=https://ai.example.org
```

`ALLOWED_ORIGINS` accepts a comma-separated allow-list. In production it must contain the exact HTTPS frontend origin. The API stops accepting arbitrary browser origins; do not set it to `*`.

## Container deployment

1. Obtain the model artifact legally and place `midas_v21_small.tflite` at `ai-service/models/weights/midas_v21_small.tflite`. It is intentionally ignored by Git.
2. Set `ALLOWED_ORIGINS=https://app.example.org` in the shell or an untracked `.env` file.
3. Start API and AI with durable named volumes:

```powershell
docker compose -f docker-compose.production.yml up --build -d
curl http://localhost:8000/health
curl http://localhost:5000/api/health
```

Build the client with the deployed service URLs, then upload `client/dist` to a static host such as Cloudflare Pages, Netlify, Vercel static output, S3+CloudFront, or an equivalent CDN:

```powershell
Copy-Item client/.env.production.example client/.env.production
# Edit client/.env.production with the real HTTPS URLs; do not add secrets.
npm --prefix client ci
npm --prefix client run build
```

Configure static-host fallback rewrites so client routes return `index.html`.

## Health, retention, and logging

- API readiness: `GET /api/health`; AI readiness: `GET /health`.
- The API shuts down gracefully on `SIGTERM` and `SIGINT`.
- Source uploads are deliberately not publicly served by Express. Only generated AI output URLs are published after processing.
- Keep `/data` volumes or replace them with an object-storage persistence adapter before deploying. Deleting a project removes its source uploads; generated AI outputs must be retained by the configured volume/object-store lifecycle for the duration promised to users.
- Capture API stdout/stderr and FastAPI logs in the host logging service. Do not log request bodies or upload contents.

## Production verification checklist

Do this against the actual production URL before calling the app deployed:

1. Open every client route, including a direct refresh of `/workspace`, `/terrain-viewer`, and `/history`.
2. Confirm browser requests use only the configured HTTPS API/AI URLs and CORS allows the frontend origin.
3. Upload an unseen JPG/PNG; wait for real inference; open the depth preview and raw NumPy output; launch the 3D viewer and test orbit, point inspection, free-flight, and path flight.
4. If a spatially aligned source GeoTIFF and DEM are available, verify held-out metrics and GeoTIFF/CSV exports. Do not claim metre accuracy for relative-only runs.
5. Upload an invalid image and verify the frontend displays the server error. Test maximum permitted file size and a failed/unavailable AI service.
6. Delete a project and verify both its metadata and upload are removed while unrelated projects remain.
7. Restart both services and verify expected retained output files remain accessible from durable storage.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Browser CORS error | Exact HTTPS frontend URL is in both services' `ALLOWED_ORIGINS`; rebuild Vite after changing `VITE_*` values. |
| API reports AI unavailable | Confirm `AI_SERVICE_URL`, AI health response, DNS/network policy, and the 120-second API-to-AI timeout. |
| AI fails to start | Confirm model file exists, inspect TensorFlow/Rasterio/GDAL startup logs, and confirm host CPU/GPU compatibility. |
| Results disappear after restart | Attach persistent `/data` volumes or configure object storage; ephemeral disks are not sufficient. |
| 413 upload error | Increase `MAX_UPLOAD_SIZE_MB` deliberately and align reverse-proxy body-size limits. |

## Deployment status

No hosting account, production domain, or live production URL was provided during Phase 9. Therefore this repository is deployment-prepared but **not claimed as deployed or production-tested**.
