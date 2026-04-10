# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

**selkokielelle.fi** — a web tool and Chrome extension that converts Finnish text into selkokieli (Plain Finnish). Users paste Finnish text, click Muunna, and receive a simplified version. The extension lets users translate selected text on any webpage via right-click or `Alt+S`. No login, no data storage.

Stack: vanilla HTML/CSS/JS frontend · Python/FastAPI backend · OpenRouter API (`openai/gpt-4o-mini`) · Nginx + systemd on Ubuntu VPS.

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

**Frontend:**
```bash
cd frontend
python3 -m http.server 3000
```
For local testing, temporarily change `API_URL` in `frontend/app.js` (line 1) from `'/api/translate'` to `'http://localhost:8000/api/translate'`. **Always reset it before committing.**

**Install dependencies:**
```bash
cd backend && source venv/bin/activate && pip install -r requirements.txt
```

## Deployment

Run on the production server:
```bash
./deploy.sh
```
This pulls main, updates pip dependencies, and restarts the `selkokielelle` systemd service. Production env vars (`OPENROUTER_API_KEY`, `ALLOWED_ORIGIN`) live in the systemd unit file — not in `.env`.

## Architecture

```
frontend/
  index.html          # entire frontend: HTML + <style> + <script> in one file
  tietosuoja.html     # privacy page
  laajennos.html      # Chrome extension info and installation guide
backend/
  main.py             # single FastAPI app: one POST /api/translate endpoint
  requirements.txt
  .env                # local only, never committed
deploy.sh             # production deploy script
extension/
  manifest.json       # Manifest V3, contextMenus + activeTab permissions
  background.js       # service worker: registers context menu item + Alt+S command
  content.js          # injected into all pages: Shadow DOM panel, 4 states, API call (styles inlined)
  icons/              # placeholder PNGs — replace before Chrome Web Store submission
```

**Request flow:** `index.html` → `POST /api/translate` → FastAPI validates (5000 char max) → OpenRouter (`gpt-4o-mini`, temperature 0.3) → returns `{"result": "..."}`.

**CORS:** backend allows `ALLOWED_ORIGIN` (web tool) and `EXTENSION_ORIGIN` (extension, optional). Set `EXTENSION_ORIGIN=chrome-extension://YOUR_ID` in the systemd unit file after publishing to the Chrome Web Store. During development `EXTENSION_ORIGIN` can be left unset — the extension must be tested against the live API or a local backend with CORS temporarily opened to `*`.

**Frontend API_URL:** hardcoded as `const API_URL = '/api/translate';` on line 1 of `frontend/app.js`. Nginx proxies `/api/` to FastAPI on `127.0.0.1:8000`.

## Chrome extension

**Loading for dev:** go to `chrome://extensions`, enable Developer Mode, click "Load unpacked", select the `extension/` folder.

**How it works:** user selects text on any page → right-click "Muunna selkokielelle" (or `Alt+S`) → `background.js` sends a message to `content.js` → `content.js` calls `POST /api/translate` directly → result shown in a Shadow DOM sidebar panel that slides in from the right.

**Rate limiting:** the backend enforces 30 requests/hour per IP via `slowapi`. Returns 429 with a Finnish error message on breach.

**Before Chrome Web Store submission:** replace placeholder icons in `extension/icons/`, set `EXTENSION_ORIGIN` in the systemd unit, and update the `host_permissions` in `manifest.json` if the API URL changes.

## System prompt

The selkokieli conversion system prompt is defined directly in `backend/main.py` as `SYSTEM_PROMPT`. It encodes official Selkokeskus guidelines: vocabulary rules, sentence structure, passive→active voice, slang substitutions, and reader-first framing. When modifying it, preserve all sections and their constraints — the prompt is the core product logic.
