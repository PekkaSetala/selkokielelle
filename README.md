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

Before submitting to the Chrome Web Store, update `extension/icons/` with proper icons and set `EXTENSION_ORIGIN` in the systemd unit file.

## Architecture

```
frontend/
  index.html              # Entire web tool: HTML + CSS + JS (single file)
  tietosuoja.html         # Privacy policy page
  laajennos.html          # Extension information page (future)

backend/
  main.py                 # FastAPI server with single /api/translate endpoint
  requirements.txt        # Python dependencies (httpx, fastapi, slowapi, pydantic)

extension/
  manifest.json           # Manifest V3: contextMenus + activeTab permissions
  background.js           # Service worker: registers context menu + Alt+S command
  content.js              # Injected script: Shadow DOM panel, 4 states, API call
  content.css             # Panel styles (scoped inside Shadow DOM)
  icons/                  # Placeholder icon files

deploy.sh                 # Production deployment script
```

## System Design

**Request flow:**
1. Client sends POST request to `/api/translate` with `{ text: "..." }`
2. Backend validates input (max 5000 chars, non-empty)
3. OpenRouter API receives request with system prompt defining selkokieli rules
4. Response returned as `{ result: "..." }`

**CORS Policy:**
- Web tool: `ALLOWED_ORIGIN` (e.g., `https://selkokielelle.online`)
- Extension: `EXTENSION_ORIGIN` (e.g., `chrome-extension://YOUR_PUBLISHED_ID`)
- Both configured via environment variables in systemd unit

**Rate limiting:**
- 30 requests/hour per IP via slowapi
- Returns 429 with Finnish error message on breach
- Note: Requires `X-Forwarded-For` header forwarding from Nginx for accurate rate limiting

## Prompt Engineering: Why This Works

The system prompt in `backend/main.py` encodes **30 years of Selkokeskus expertise**:

### Vocabulary Rules
- Use everyday words (e.g., "tarkistaa" instead of "tsekkata")
- Avoid idioms and figures of speech
- Preserve established loanwords (bussi, puhelin, stressi)
- Keep consistent terminology throughout

### Sentence Structure
- One main idea per sentence
- Short, simple sentences
- Active voice > passive voice (except when actor unknown)
- Avoid participles, infinitives, and subordinate clauses

### Content Preservation
- Never omit facts or essential information
- Remove only redundancy and unnecessary elaboration
- Add brief explanations for unavoidable complex concepts
- Return **only** the simplified text — no introduction, no commentary

### Reader Focus
- Use "sinä" (you) when addressing the reader's rights/obligations
- Frame readers as active agents, not passive recipients
- Accessible, respectful tone (never patronizing or oversimplified)

## Injection Defense

The system prompt explicitly prevents prompt injection attacks:
- If the input requests task deviation, the system ignores it
- If input is not translatable text, returns error message
- Only selkokieli translation occurs — nothing else

This is enforced by both:
1. System prompt boundaries (clearest rules take precedence)
2. Response validation (backend returns only text content)

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

Frontend available at `http://localhost:3000`.

**Note:** Change `API_URL` in `frontend/index.html` from `'/api/translate'` to `'http://localhost:8000/api/translate'` for local testing. **Always reset before committing.**

### Environment Variables

For production on systemd, set env vars in the service unit file:
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

This script:
1. Pulls the latest code from `main` branch
2. Updates Python dependencies
3. Restarts the `selkokielelle` systemd service

## Security Notes

- **VPS Configuration:**
  - Nginx: Forward `X-Forwarded-For` header for accurate rate limiting
  - Systemd: Add `--proxy-headers --forwarded-allow-ips='127.0.0.1'` flags
- **OpenRouter:** Set monthly spending cap in account dashboard ($10/month recommended)
- **Secrets:** Never commit `.env`, `*.key`, or `*.pem` files

## Changelog

### v1.4.0 — 2026-03-14 (In Progress)
- Added startup assertions for required environment variables
- Reduced `max_tokens` from 4000 to 1200 for cost efficiency
- Added `MODEL` environment variable for model selection
- Implemented paragraph rendering (split on `\n\n`)
- Enhanced system prompt with paragraph, list, heading, and date formatting guidance
- Improved `.gitignore` to exclude sensitive files

### v1.3.0 — 2026-03-06
- Added tagline below wordmark
- Added SEO meta description and canonical tag
- Fixed copy button on mobile
- Fixed header layout
- Fixed tietosuoja page issues

### v1.2 — 2026-03-04
- Increased input limit from 3 000 to 5 000 characters with live counter
- Redesigned UI (v2 visual design)
- Added Tyhjennä (clear) button
- Added tietosuoja (privacy) page
- Improved system prompt for better slang handling and Plain Finnish output quality

### v1.0
- Initial release

## License

MIT
