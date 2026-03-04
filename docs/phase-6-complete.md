# Phase 6 Complete — Deployment Script & Git Push

## Files created or changed
- `deploy.sh` — created and made executable

## Deviations from RDM
None

## Open questions / watch for next phase
- `deploy.sh` has not been run yet — that happens during the pre-launch phase
- Git global `user.name` and `user.email` are not configured on this machine; fix before the next commit if identity matters
- Server-side steps still pending: clone repo to `/var/www/selkokielelle`, create venv, write Nginx config, write systemd service, set `OPENROUTER_API_KEY` in the service file, run Certbot
- DNS A records must point to the VPS IP before Certbot will succeed
