# selkokielelle.online

A web tool and browser extension that converts Finnish text into **selkokieli** — Plain Finnish, following official Selkokeskus guidelines.

**Live:** [selkokielelle.online](https://selkokielelle.online)

---

## What is selkokieli?

Selkokieli is a formally defined simplified register of Finnish. It uses:
- Shorter sentences (one idea per sentence)
- Common, everyday vocabulary
- Active voice instead of passive
- Clear structure and concise wording

Around **750 000 people in Finland** benefit from selkokieli, including those with cognitive disabilities, learning difficulties, or limited Finnish proficiency.

The [Selkokeskus](https://www.selkokeskus.fi/) (Plain Language Center) publishes official guidelines for selkokieli translation.

## How it works

### Web Tool

Paste any Finnish text into **[selkokielelle.online](https://selkokielelle.online)** and click **Muunna**. The text is sent to an AI model instructed to follow Selkokeskus guidelines and returns a simplified version.

- Input limit: 5 000 characters
- No login, no data storage, no history
- Entire UI in Finnish

### Chrome Extension

Select text on any website → right-click **Muunna selkokielelle** (or press `Alt+S`) → result appears in a side panel.

**Installation (dev mode):**
1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder from this repository

Before submitting to the Chrome Web Store, replace placeholder icons in `extension/icons/` and set `EXTENSION_ORIGIN` in the systemd unit file.

## Architecture

```
frontend/
  index.html              # Entire web tool: HTML + CSS + JS (single file)
  tietosuoja.html         # Privacy policy page
  laajennos.html          # Chrome extension information page

backend/
  main.py                 # FastAPI server with single /api/translate endpoint
  requirements.txt        # Python dependencies (httpx, fastapi, slowapi, pydantic)

extension/
  manifest.json           # Manifest V3: contextMenus + activeTab permissions
  background.js           # Service worker: registers context menu + Alt+S command
  content.js              # Injected script: Shadow DOM panel, 4 states, API call
  content.css             # Panel styles (scoped inside Shadow DOM)
  icons/                  # Placeholder icon files — replace before Store submission

deploy.sh                 # Production deployment script
```

## System Design

**Request flow:**
1. Client sends `POST /api/translate` with `{ "text": "..." }`
2. Backend validates input (max 5 000 chars, non-empty)
3. OpenRouter API receives request with system prompt encoding Selkokeskus rules
4. Response returned as `{ "result": "..." }`

**CORS policy:**
- Web tool: `ALLOWED_ORIGIN` env var (e.g., `https://selkokielelle.online`)
- Extension: `EXTENSION_ORIGIN` env var (e.g., `chrome-extension://YOUR_ID`)
- Both configured via environment variables in the systemd unit file

**Rate limiting:**
- 30 requests/hour per IP via `slowapi`
- Returns HTTP 429 with Finnish error message on breach
- Requires `X-Forwarded-For` header forwarding from Nginx for accurate per-client limiting

## Prompt Engineering

The system prompt in `backend/main.py` encodes Selkokeskus guidelines as explicit rules:

### Vocabulary
- Use everyday words (`tarkistaa` instead of `tsekkata`)
- Avoid idioms, jargon, and long compound words
- Preserve established loanwords (`bussi`, `puhelin`, `stressi`)
- Keep consistent terminology throughout the text

### Sentence Structure
- One main idea per sentence; target 10–15 words
- Active voice over passive (except when actor is unknown)
- Avoid participles, infinitives, and subordinate clauses
- Imperative for instructions: `Lähetä lomake.`

### Content Preservation
- Never omit facts or essential information
- Remove only redundancy and unnecessary elaboration
- Add brief explanations only for unavoidable complex concepts
- Return **only** the simplified text — no introduction or commentary

### Reader Focus
- Use `sinä` (you) when text concerns the reader's rights or obligations
- Frame readers as active agents, not passive recipients
- Accessible, respectful tone — never patronising

## Injection Defense

The system prompt explicitly prevents prompt injection:
- Inputs that are not recognisable text (questions, commands, meta-instructions) are rejected
- The model returns a fixed Finnish error message instead of processing them
- Only selkokieli translation occurs — no other tasks

## Running Locally

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create .env with your OpenRouter API key
echo 'OPENROUTER_API_KEY=your-key-here' > .env
echo 'ALLOWED_ORIGIN=http://localhost:3000' >> .env

uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`.

### Frontend
```bash
cd frontend
python3 -m http.server 3000
```

**Note:** For local testing, change `API_URL` in `frontend/index.html` from `'/api/translate'` to `'http://localhost:8000/api/translate'`. Always reset before committing.

### Environment Variables

For production, set env vars in the systemd unit file:
```ini
[Service]
Environment="OPENROUTER_API_KEY=your-key"
Environment="ALLOWED_ORIGIN=https://selkokielelle.online"
Environment="EXTENSION_ORIGIN=chrome-extension://YOUR_PUBLISHED_ID"
Environment="MODEL=openai/gpt-4o-mini"
```

## Deployment

```bash
./deploy.sh
```

Pulls the latest `main` branch, updates Python dependencies, and restarts the `selkokielelle` systemd service.

## Security Notes

- **Nginx:** Add `proxy_set_header X-Forwarded-For $remote_addr;` in the `/api/` location block for accurate rate limiting
- **Systemd:** Add `--proxy-headers --forwarded-allow-ips='127.0.0.1'` to the uvicorn `ExecStart` line
- **OpenRouter:** Set a monthly spending cap in the account dashboard
- **Secrets:** Never commit `.env`, `*.key`, or `*.pem` files

## Changelog

### v1.4.0 — 2026-03-17
- Chrome extension: translate selected text on any webpage via right-click or `Alt+S`
- Responsive layout: side-by-side input/output on desktop (800px+)
- Extension landing page (`laajennos.html`) with installation guide
- System prompt v3.1: paragraph, list, heading, and date formatting guidance; strengthened injection defense
- Paragraph rendering: semantic `<p>` elements replace `white-space: pre-wrap`
- Input muting: visual feedback directing focus to output after translation
- Startup assertions: fail fast if required environment variables are missing
- `MODEL` environment variable for model selection (default: `openai/gpt-4o-mini`)
- Reduced `max_tokens` from 4000 to 2500
- Rate limiting: 30 requests/hour per IP via `slowapi`
- `GET /api/health` endpoint

### v1.3.0 — 2026-03-06
- Added tagline below wordmark
- Added SEO meta description and canonical tag
- Fixed copy button on mobile (iOS Safari fallback)
- Fixed header layout
- Fixed tietosuoja page issues

### v1.2.0 — 2026-03-04
- Increased input limit from 3 000 to 5 000 characters with live counter
- Redesigned UI (v2 visual design)
- Added Tyhjennä (clear) button
- Added tietosuoja (privacy) page
- Improved system prompt for slang handling and output quality

### v1.0.0
- Initial release

## License

MIT
