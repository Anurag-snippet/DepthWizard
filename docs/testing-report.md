# Testing status and verification notes

This file records the current state of verification for the repository as it exists in the workspace. It is intentionally conservative: it documents what is present in the code and what has or has not been validated in the current environment.

## Current status

The repo contains test files for the frontend and the AI/geospatial components, but no fresh end-to-end validation should be claimed without a live run on the actual target machine.

## Repository test files present

- `client/tests/terrainMesh.test.mjs`
- `ai-service/tests/test_exporters.py`
- `ai-service/tests/test_geospatial.py`
- `ai-service/tests/test_inference.py`

These files indicate the intended test coverage areas:

- frontend terrain behavior
- AI inference behavior
- geospatial calibration routines
- export generation

## What was previously documented in this repo

The earlier report in this folder contains specific command output and a historical validation log. That log is useful as a reference for what was attempted previously, but it should not be treated as a guarantee of the current runtime state.

## Recommended validation before calling the app ready

1. Start the AI service.
2. Start the backend gateway.
3. Start the frontend.
4. Upload a real sample image.
5. Confirm the project reaches `completed` or `failed` without server-side errors.
6. Inspect the preview and raw output URLs.
7. For DEM/GCP calibration, run a georeferenced test and verify metric output only when valid spatial constraints are satisfied.

## Important caution

The project structure includes real inference and calibration logic, but the actual runtime quality depends on environment setup, TF model availability, data quality, and the geospatial fit. Until a fresh live run is completed on this machine, the safest documentation position is:

- the code is structured correctly
- the intended workflow is clear
- runtime validation is still a required step before making any production-quality claims
