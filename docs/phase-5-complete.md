# Phase 5 Complete — Nginx & Systemd Config

## Files created or changed
- `/etc/nginx/sites-available/selkokielelle.fi` — reviewed, not yet written to server
- `/etc/systemd/system/selkokielelle.service` — reviewed, not yet written to server

## Deviations from RDM
- `burst=5 nodelay` added to `limit_req` directive — RDM specifies the rate (10 req/min) but does not define a burst value; 5 is a conservative default and can be tuned post-launch per §16

## Open questions / watch for next phase
- Replace `sk-or-your-key-here` in the systemd service with the real key before enabling
- Run `sudo certbot --nginx -d selkokielelle.fi -d www.selkokielelle.fi` after DNS propagates — Certbot will modify the Nginx config
- Symlink must be created: `sites-available/selkokielelle.fi` → `sites-enabled/`
- Confirm `sudo nginx -t` passes before reloading Nginx
- `API_URL` in `frontend/index.html` must be `/api/translate` (relative) before any files are pushed to the server
