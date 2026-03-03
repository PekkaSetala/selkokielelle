# Phase 3 Complete — Backend

## Files created or changed
- backend/main.py
- backend/.env

## Deviations from RDM
None

## Open questions / things to watch
- backend/.env contains a real API key — confirm it is in .gitignore before any commit
- The venv uses Python 3.14 (RDM requires 3.10+, so this is within spec but worth noting for production parity)
- CORS is locked to ALLOWED_ORIGIN — frontend local dev must be served from http://localhost:3000, not opened as file://
- For the frontend phase: API_URL must be set to http://localhost:8000/api/translate for local testing, then switched back to /api/translate before deploy
