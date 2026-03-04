# Phase 7 Complete — Production Deployment

## Files created or changed
- `/var/www/selkokielelle/` — repo cloned to server
- `/var/www/selkokielelle/backend/venv/` — Python virtual environment created on server
- `/etc/nginx/sites-available/selkokielelle` — created and enabled
- `/etc/systemd/system/selkokielelle.service` — created and enabled
- `/etc/letsencrypt/` — SSL certificate issued by Certbot (auto-managed)
- `~/.ssh/github_deploy` — deploy key generated on server for GitHub access

## Deviations from RDM
- Domain is `selkokielelle.online` not `selkokielelle.fi` — permanent domain not yet acquired; all config uses `.online` for now
- `ALLOWED_ORIGIN` set to `https://selkokielelle.online` instead of `https://selkokielelle.fi`

## Open questions / watch for next phase
- When `selkokielelle.fi` is acquired: update nginx `server_name`, update `ALLOWED_ORIGIN` in the systemd service, and re-run Certbot
- 15.3 frontend and 15.4 AI output quality checks not yet verified — require manual browser testing
- SSL certificate expires 2026-06-01; Certbot auto-renewal is configured but should be confirmed with `certbot renew --dry-run`
