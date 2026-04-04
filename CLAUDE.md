# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**selkokielelle.fi** — a web tool and Chrome extension that converts Finnish text into selkokieli (Plain Finnish). Users paste Finnish text, click Muunna, and receive a simplified version. The extension lets users translate selected text on any webpage via right-click or `Alt+S`. No login, no data storage.

Stack: vanilla HTML/CSS/JS frontend · Python/FastAPI backend · OpenRouter API (default `openai/gpt-4o-mini`, configurable via `MODEL` env var) · Nginx + systemd on Ubuntu VPS.

## Local development

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```
Requires `backend/.env` with:
```
OPENROUTER_API_KEY=your-key-here
ALLOWED_ORIGIN=http://localhost:3000
```
Optional env vars: `MODEL` (default `openai/gpt-4o-mini`), `EXTENSION_ORIGIN` (for Chrome extension CORS).

**Frontend:**
```bash
cd frontend
python3 -m http.server 3000
```
For local testing, temporarily change `API_URL` in `frontend/app.js` from `'/api/translate'` to `'http://localhost:8000/api/translate'`. **Always reset it before committing.**

**Install dependencies:**
```bash
cd backend && source venv/bin/activate && pip install -r requirements.txt
```

**Health check:** `GET /api/health` returns `{"status": "ok"}` — useful for verifying the backend is running.

## Deployment

Run on the production server:
```bash
./deploy.sh
```
This pulls main, updates pip dependencies, and restarts the `selkokielelle` systemd service. The script prints the pre-deploy commit hash for rollback. Production env vars (`OPENROUTER_API_KEY`, `ALLOWED_ORIGIN`, `MODEL`, `EXTENSION_ORIGIN`) live in the systemd unit file — not in `.env`.

## CI/CD

- **Dependency audit** (`.github/workflows/audit.yml`): runs `pip-audit` on every push/PR that changes `backend/requirements.txt`, plus weekly on Mondays. Uses Python 3.12.

## Architecture

```
frontend/
  index.html          # main page: HTML + <style>, loads app.js
  app.js              # all frontend logic: API calls, UI state, char counting, copy
  tietosuoja.html     # privacy policy page
  tietoja.html        # about page
  laajennos.html      # Chrome extension info and installation guide
  favicon.svg         # site icon
  robots.txt          # search engine directives
  sitemap.xml         # sitemap for SEO
backend/
  main.py             # single FastAPI app: POST /api/translate + GET /api/health
  requirements.txt    # pinned dependencies
  .env                # local only, never committed
deploy.sh             # production deploy script (with rollback info)
extension/
  manifest.json       # Manifest V3, contextMenus + activeTab permissions
  background.js       # service worker: registers context menu item + Alt+S command
  content.js          # injected into all pages: Shadow DOM panel, 4 states, API call
  icons/              # extension icons (16, 48, 128px PNGs)
  README.md           # extension-specific documentation
docs/
  architecture.md     # architectural overview
  CHANGELOG.md        # project changelog
.github/
  workflows/audit.yml # dependency audit CI
```

**Request flow:** `index.html` → `app.js` → `POST /api/translate` → FastAPI validates (5000 char max) → OpenRouter (configurable model, temperature 0.3) → HTML tags stripped from LLM output → returns `{"result": "..."}`.

**Security:** LLM output is sanitized server-side via regex HTML tag stripping (`re.sub(r'<[^>]+>', '', result)`). The system prompt includes an instruction-injection guard. Frontend uses `textContent` for safe rendering.

**CORS:** backend allows `ALLOWED_ORIGIN` (web tool) and `EXTENSION_ORIGIN` (extension, optional). Set `EXTENSION_ORIGIN=chrome-extension://YOUR_ID` in the systemd unit file after publishing to the Chrome Web Store. During development `EXTENSION_ORIGIN` can be left unset — the extension must be tested against the live API or a local backend with CORS temporarily opened to `*`.

**Frontend API_URL:** hardcoded as `const API_URL = '/api/translate';` in `frontend/app.js`. Nginx proxies `/api/` to FastAPI on `127.0.0.1:8000`.

**Error handling:** The backend returns Finnish-language error messages for all failure modes: validation errors (400), rate limits (429), upstream timeouts (504), and OpenRouter failures (502). A `finish_reason=length` response also returns 502 with a "text too long" message.

## Chrome extension

**Loading for dev:** go to `chrome://extensions`, enable Developer Mode, click "Load unpacked", select the `extension/` folder.

**How it works:** user selects text on any page → right-click "Muunna selkokielelle" (or `Alt+S`) → `background.js` sends a message to `content.js` → `content.js` calls `POST /api/translate` directly → result shown in a Shadow DOM sidebar panel that slides in from the right.

**Rate limiting:** the backend enforces 30 requests/hour per IP via `slowapi`. Returns 429 with a Finnish error message on breach.

**Before Chrome Web Store submission:** replace placeholder icons in `extension/icons/`, set `EXTENSION_ORIGIN` in the systemd unit, and update the `host_permissions` in `manifest.json` if the API URL changes.

## System prompt

The selkokieli conversion system prompt is defined directly in `backend/main.py` as `SYSTEM_PROMPT`. It encodes official Selkokeskus guidelines: vocabulary rules, sentence structure, passive→active voice, slang substitutions, and reader-first framing. When modifying it, preserve all sections and their constraints — the prompt is the core product logic.

## Key conventions

- **All user-facing text is in Finnish.** Error messages, UI labels, and button text must remain in Finnish.
- **No build step.** Frontend is vanilla HTML/CSS/JS served as static files — no bundler, no transpiler.
- **Single-file backend.** All backend logic lives in `main.py`. Keep it that way unless complexity genuinely demands splitting.
- **Pinned dependencies.** `requirements.txt` uses exact versions. Update versions explicitly, not with ranges.
- **No tests currently.** There is no test suite. If adding tests, use `pytest` for the backend.
- **`.gitignore` whitelist for docs/.** Only `docs/architecture.md` and `docs/CHANGELOG.md` are tracked; other files in `docs/` are ignored.
