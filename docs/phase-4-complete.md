# Phase 4 Complete — Frontend

## Files created or changed
- `frontend/index.html` — created

## Deviations from RDM
None

## Open questions / watch for next phase
- `API_URL` in index.html must stay as `/api/translate` — easy to accidentally commit the localhost value
- Backend CORS is set to `http://localhost:3000` in `.env`; production systemd service must set `ALLOWED_ORIGIN=https://selkokielelle.fi`
- Local HTTP server (`python3 -m http.server 3000`) may still be running as a background process
