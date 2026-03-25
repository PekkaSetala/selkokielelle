# Architecture — selkokielelle.fi

**Current version:** v1.5.0
**Live:** [selkokielelle.fi](https://selkokielelle.fi)

---

## Overview

selkokielelle.fi converts standard Finnish text into selkokieli — a formally defined simplified register of Finnish using shorter sentences, common vocabulary, and clear structure. Around 750,000 people in Finland benefit from selkokieli. The tool serves writers, public sector workers, and educators who need accessible versions of complex text.

**Core interaction:** Paste Finnish text → click Muunna → get selkokieli version on the same page. No login, no accounts, no stored data.

---

## Request flow

```
User browser
    |
    | HTTPS (port 443)
    v
Nginx (public entry point)
    |                         |
    | GET /                   | POST /api/translate
    v                         v
Serves static files      FastAPI on 127.0.0.1:8000
(index.html, etc.)            |
                              | HTTPS to OpenRouter
                              v
                       openai/gpt-4o-mini
                              |
                       JSON → user browser
```

Chrome extension follows the same path — `content.js` calls `POST /api/translate` directly.

**Non-negotiable rules:**
- FastAPI binds to `127.0.0.1:8000` only — never exposed publicly
- OpenRouter API key lives exclusively in environment variables
- Nginx is the single public entry point
- Frontend communicates only with `/api/translate` on same domain

---

## Directory structure

```
selkokielelle/
├── frontend/
│   ├── index.html          # Main app — HTML + CSS + JS in one file
│   ├── tietosuoja.html     # Privacy and transparency page
│   ├── laajennos.html      # Chrome extension info and install guide
│   └── favicon.svg         # Finnish cross mark icon
├── backend/
│   ├── main.py             # FastAPI app — translate endpoint, health, rate limiting
│   ├── requirements.txt    # Python dependencies (pinned)
│   ├── venv/               # Virtual environment (never committed)
│   └── .env                # Local dev only (never committed)
├── extension/
│   ├── manifest.json       # Manifest V3, contextMenus + activeTab
│   ├── background.js       # Service worker: context menu + Alt+S command
│   ├── content.js          # Shadow DOM panel injected into pages (styles inlined)
│   └── icons/              # Placeholder PNGs — replace before Store submission
├── docs/
│   ├── CHANGELOG.md        # Version history
│   ├── architecture.md     # This file
│   └── roadmap.md          # Forward-looking work items
├── deploy.sh               # Production deploy script (run on server)
├── README.md
├── CLAUDE.md               # Dev workflow and local setup instructions
└── .gitignore
```

---

## Tech stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend | Vanilla HTML/CSS/JS | Single interaction, zero dependencies, fast load |
| Backend | Python + FastAPI + Uvicorn | Lightweight, async, excellent validation |
| AI Provider | OpenRouter | Model-swappable without code changes |
| AI Model | `openai/gpt-4o-mini` | Strong Finnish support, reliable prompt following. ~€2/month at normal traffic |
| Web Server | Nginx | Static serving + API proxy. Industry standard |
| SSL | Certbot / Let's Encrypt | Free, auto-renews every 90 days |
| Hosting | Ubuntu VPS (37.27.14.199) | Full control, no additional cost |

---

## Backend — `backend/main.py`

Single-file FastAPI application. Stateless — each request is independent (system prompt + user input only).

### Endpoints

**`POST /api/translate`**
- Request: `{"text": "Finnish input"}`
- Success: `{"result": "Simplified output"}` (200)
- Errors: `{"error": "Finnish message"}` (400/429/502/504)

**`GET /api/health`**
- Returns `{"status": "ok"}` (200)

### Validation

| Condition | Status | Message |
|-----------|--------|---------|
| Empty or whitespace | 400 | Teksti ei voi olla tyhjä |
| Exceeds 5000 chars | 400 | Teksti on liian pitkä |
| Rate limit exceeded | 429 | Finnish rate limit message |
| OpenRouter timeout (>15s) | 504 | Palvelu ei vastaa juuri nyt, yritä uudelleen |
| Unexpected upstream error | 502 | Jokin meni pieleen, yritä uudelleen |

### Rate limiting

`slowapi` enforces 30 requests/hour per IP at the application level. Nginx also rate-limits at 10 req/min per IP on `/api/`. Two independent layers.

### Configuration

| Env var | Required | Description |
|---------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Never in code or version control |
| `ALLOWED_ORIGIN` | Yes | `https://selkokielelle.fi` in prod, `http://localhost:3000` locally |
| `MODEL` | No | Defaults to `openai/gpt-4o-mini` |
| `EXTENSION_ORIGIN` | No | `chrome-extension://ID` for extension CORS (currently `*`) |

Startup assertions fail fast if `OPENROUTER_API_KEY` or `ALLOWED_ORIGIN` are missing.

### AI integration

- Model: `openai/gpt-4o-mini` via OpenRouter API, temperature 0.3
- System prompt defined as `SYSTEM_PROMPT` constant in `main.py` — this is the source of truth
- Based on official Selkokeskus guidelines: vocabulary rules, sentence structure, passive→active voice, slang substitutions, reader framing
- Injection defense: prompt explicitly rejects questions, commands, and meta-instructions in user input
- No preamble rule: model returns only converted text, no explanatory prefix
- Timeout: 15 seconds on all httpx calls

---

## Frontend — `frontend/index.html`

Single HTML file with embedded CSS and JS. Entire UI in Finnish.

### Design system (CSS variables)

```css
--bg: #F9F8F6    --ink: #1C1B19    --mid: #6B6860
--faint: #706C63  --rule: #D0CCBF   --accent: #2C4BFF
--surface: #FFFFFF --radius: 10px
```

Fonts: Instrument Serif (wordmark), DM Sans (body) — Google Fonts.

### Layout

- **Mobile:** Single column, stacked input → arrow → output
- **Desktop (≥800px):** Side-by-side CSS grid, input left / output right, 1080px max-width, 400px textareas, arrow hidden

### Interactive behaviour

- **Character counter:** Live update, `!` prefix at >85% + amber, `⚠` prefix + red at limit
- **Submit:** Disabled when empty or during request. Shows spinner + "Muunnetaan..."
- **Clear (Tyhjennä):** Resets everything, no confirmation
- **Copy:** Two-path — `navigator.clipboard.writeText()` primary, `execCommand('copy')` fallback for iOS Safari. Shows "Kopioitu" or "✕ Kopiointi epäonnistui"
- **Loading:** Skeleton shimmer animation, fade-in on result
- **Input muting:** Textarea visually muted after translation
- **Paragraph rendering:** Result as `<p>` elements, XSS-safe via `textContent`
- **Error handling:** Finnish messages in output area, input preserved

### SEO

```html
<title>Selkokielelle – Muunna teksti selkokielelle</title>
<meta name="description" content="Ilmainen työkalu tekstin muuntamiseen selkokielelle tekoälyn avulla." />
<link rel="canonical" href="https://selkokielelle.fi/" />
```

OG meta tags on `index.html` and `laajennos.html`. Canonical on all pages.

---

## Chrome extension

Manifest V3. User selects text on any page → right-click "Muunna selkokielelle" or `Alt+S` → translated result in sidebar.

### Architecture

- `background.js` — Service worker. Registers context menu item and keyboard shortcut. Sends message to content script on trigger
- `content.js` — Injected into all pages. Creates Shadow DOM panel (open mode) attached to `document.documentElement`. Calls `POST /api/translate` directly. 4 states: loading (skeleton shimmer), result, error, empty-selection toast. Panel styles inlined in `buildPanel()`

### Panel features

- 400px width, slides in from right
- Copy to clipboard with visual confirmation
- Dismiss via Escape key, click-outside, or X button
- Slow-network hint after 4 seconds
- Appended to `document.documentElement` (not `body`) to escape host page stacking contexts

---

## Deployment & operations

### Production server

| Detail | Value |
|--------|-------|
| Host | webserve |
| IP | 37.27.14.199 |
| OS | Ubuntu 22.04 |
| Path | `/var/www/selkokielelle` |
| Service | `selkokielelle.service` (systemd) |
| Backend | `127.0.0.1:8000` (internal) |
| Public | Nginx on 80/443 |
| SSL | Certbot / Let's Encrypt |

### Systemd service

- ExecStart: `uvicorn main:app --host 127.0.0.1 --port 8000`
- Working directory: `/var/www/selkokielelle/backend`
- Restart on failure (5s delay), enabled on boot
- Env vars set in systemd unit file (not `.env`)
- `EXTENSION_ORIGIN=*` currently in override at `/etc/systemd/system/selkokielelle.service.d/override.conf`

### Deployment

```bash
# On server:
cd /var/www/selkokielelle && ./deploy.sh
```

`deploy.sh` pulls main, installs pip deps, restarts service. Frontend-only changes need only `git pull` (no restart).

### DNS

A records for `@` and `www` → 37.27.14.199. Nginx redirects `www` → non-www and HTTP → HTTPS.

### Nginx

- Serves `frontend/` as static files for all non-API paths
- Proxies `/api/` → `http://127.0.0.1:8000`
- Rate limiting: 10 req/min per IP on `/api/`
- Passes `X-Real-IP`, `X-Forwarded-For`, `Host` headers

---

## Security model

### Active measures

| Layer | Mechanism | Detail |
|-------|-----------|--------|
| Network | Nginx rate limiting | 10 req/min per IP on `/api/` |
| Application | `slowapi` rate limiting | 30 req/hour per IP. Custom handler returns Finnish message |
| Application | CORS | Only `ALLOWED_ORIGIN` + `EXTENSION_ORIGIN` |
| Application | Input validation | Non-empty, ≤5000 chars — before any OpenRouter call |
| Application | Request timeout | 15s on all httpx calls |
| Application | Startup assertions | Fail-fast on missing API key or origin |
| AI | Prompt injection defense | System prompt rejects off-task instructions |
| Frontend | XSS prevention | Output rendered via `textContent` before `innerHTML` |
| Infra | API key isolation | Only in env vars, never in code or git |

### Deliberately out of scope

- CAPTCHA / bot verification
- User authentication
- Content filtering (gpt-4o-mini has built-in moderation)
- DDoS mitigation beyond rate limiting

---

## Versioning rules

| Change type | Example | Bump |
|-------------|---------|------|
| Typo, one-line fix | Fix a label | `v1.3.0` → `v1.3.1` |
| New feature or meaningful change | New UI element | `v1.3.0` → `v1.4.0` |
| Full rebuild or breaking change | New tech stack | `v1.x.x` → `v2.0.0` |

Branch naming: `v1.3`, `v1.4` for dev branches. Tags: always three numbers (`v1.3.0`). Patch releases don't need separate branches.
