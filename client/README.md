# DepthWizard client

This folder contains the React frontend for the DepthWizard monorepo. It is the browser-facing side of the project and communicates with the Express API in `server/`.

## What the client does

- creates and lists project entries
- uploads images to the backend
- triggers AI processing
- polls processing status
- loads output images and NumPy URLs
- renders the terrain in a 3D viewer when outputs are ready

## Main frontend flow

1. User uploads a source image.
2. The client creates a project via `POST /api/projects`.
3. The user triggers a process via `POST /api/projects/:id/process`.
4. The client polls `/api/projects/:id/status`.
5. When complete, the client calls `/api/projects/:id/results` and resolves AI URLs.
6. The 3D viewer renders the depth or elevation map from the generated output.

## Important implementation detail

The frontend resolves image output URLs using `resolveAiUrl()` in `client/src/services/api.js`. This keeps the browser pointed at the AI service even when the data are produced there and exposed through the backend metadata.

## Local development

From the repo root:

```bash
npm run dev:client
```

The default Vite port is `5173`, and the client expects the backend on `http://localhost:5000/api` unless overridden by `VITE_API_URL`.

## Related files

- `client/src/services/api.js`
- `client/src/pages/NewAnalysis.jsx`
- `client/src/pages/Workspace.jsx`
- `client/src/pages/TerrainViewer.jsx`
- `client/src/App.jsx`

## Validation note

The frontend itself may be buildable and testable, but any deployment claim should be validated with a real upload and processing flow on the target environment. The docs here describe the implemented architecture rather than a guaranteed production state.
