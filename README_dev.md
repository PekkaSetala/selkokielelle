# selkokielelle.fi

A single-page web application that converts Finnish text into *selkokieli* — Plain Finnish — using AI.

## What is selkokieli?

Selkokieli is a formally defined simplified register of Finnish, maintained by [Selkokeskus](https://selkokeskus.fi). It uses shorter sentences, everyday vocabulary, and clear structure to make text accessible to people with reading or language difficulties — including those with cognitive disabilities, learning difficulties, or limited Finnish proficiency.

This tool accepts any Finnish text and returns a selkokieli version of it, guided by a system prompt based on official Selkokeskus guidelines.

## Features

- Paste Finnish text (up to 3 000 characters) and receive a simplified version in seconds
- Live character counter with limit enforcement
- Finnish error messages throughout
- No user accounts, no stored data, no history
- Stateless — each request is independent

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vanilla HTML / CSS / JS | Single file, no framework, no external dependencies |
| Backend | Python 3.10+ / FastAPI / Uvicorn | Single endpoint |
| AI | OpenRouter → `openai/gpt-4o-mini` | Temperature 0.3, max 2 000 tokens |
| Web server | Nginx | Static files + reverse proxy + rate limiting |
| SSL | Certbot / Let's Encrypt | Auto-renewing |
| Hosting | Ubuntu VPS | Owner-managed |

## Architecture

```
User browser
    |
    | HTTPS (port 443)
    v
  Nginx ──────────────────────────────────────
    |  GET /                  |  POST /api/*
    v                         v
Serves index.html     FastAPI on 127.0.0.1:8000
                              |
                              | HTTPS
                              v
                        OpenRouter API
                        (openai/gpt-4o-mini)
```

**Rules:**
- FastAPI binds to `127.0.0.1:8000` only — never exposed on a public port
- Nginx is the single public entry point
- The OpenRouter API key lives exclusively in an environment variable — never in code or version control
- The frontend calls only `/api/translate` on the same domain — never OpenRouter directly

## Project Structure

```
selkokielelle/
├── frontend/
│   └── index.html        # Entire frontend — one file
├── backend/
│   ├── main.py           # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   ├── venv/             # Virtual environment — not committed
│   └── .env              # Local dev only — not committed
├── .gitignore
└── README.md
```

## Local Development

**Requirements:** Python 3.10 or higher.

**1. Set up the backend**

```bash
cd backend
python3 --version          # Must be 3.10+
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**2. Create `backend/.env`**

```
OPENROUTER_API_KEY=sk-or-your-key-here
ALLOWED_ORIGIN=http://localhost:3000
```

**3. Start the backend**

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**4. Serve the frontend**

In a separate terminal — do **not** open `index.html` as a `file://` URL; the browser will block all API calls due to CORS.

```bash
cd frontend
python3 -m http.server 3000
```

**5. Set the API URL for local dev**

In `frontend/index.html`, find the constant at the top of the `<script>` block and change it:

```js
const API_URL = 'http://localhost:8000/api/translate';
```

**6. Open the app**

```
http://localhost:3000
```

Before pushing or deploying, revert the API URL to `'/api/translate'`.

## Production Deployment

### Initial server setup (one time)

```bash
# Verify Python version
python3 --version   # Must be 3.10+

# Open firewall
sudo ufw allow 80
sudo ufw allow 443

# Clone the repo
git clone <repo-url> /var/www/selkokielelle
cd /var/www/selkokielelle/backend

# Create venv and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create the systemd service at `/etc/systemd/system/selkokielelle.service`:

```ini
[Unit]
Description=selkokielelle.fi FastAPI backend
After=network.target

[Service]
ExecStart=/var/www/selkokielelle/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
WorkingDirectory=/var/www/selkokielelle/backend
Restart=on-failure
RestartSec=5
Environment=OPENROUTER_API_KEY=sk-or-your-key-here
Environment=ALLOWED_ORIGIN=https://selkokielelle.fi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable selkokielelle
sudo systemctl start selkokielelle
```

Configure Nginx to serve `frontend/` for all non-API paths and proxy `/api/` to `127.0.0.1:8000`, with a rate limit zone of 10 requests/minute per IP applied to `/api/` only.

Issue SSL certificate after DNS has propagated:

```bash
sudo certbot --nginx -d selkokielelle.fi -d www.selkokielelle.fi
```

### Deploying a change

```bash
# Local machine
git add .
git commit -m "Description of change"
git push origin main

# Server (via SSH)
cd /var/www/selkokielelle
git pull origin main
sudo systemctl restart selkokielelle   # Skip for frontend-only changes
```

### Useful service commands

```bash
sudo systemctl status selkokielelle
sudo journalctl -u selkokielelle -f       # Stream live logs
sudo journalctl -u selkokielelle -n 50    # Last 50 lines
sudo nginx -t                             # Test Nginx config
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key. Never commit. Set in `.env` locally, in the systemd `Environment=` line in production. |
| `ALLOWED_ORIGIN` | Yes | CORS-allowed origin. `https://selkokielelle.fi` in production, `http://localhost:3000` locally. |

## API Reference

### `POST /api/translate`

**Request**

```json
{ "text": "Finnish input text here" }
```

**Success — HTTP 200**

```json
{ "result": "Simplified Finnish text here" }
```

**Error — HTTP 4xx / 5xx**

```json
{ "error": "Finnish error message here" }
```

**Validation**

| Condition | Status | Message |
|---|---|---|
| Empty or whitespace-only input | 400 | Teksti ei voi olla tyhjä |
| Input exceeds 3 000 characters | 400 | Teksti on liian pitkä |
| OpenRouter timeout > 15 s | 504 | Palvelu ei vastaa juuri nyt, yritä uudelleen |
| Unexpected response from OpenRouter | 502 | Jokin meni pieleen, yritä uudelleen |

## Security

- **Rate limiting:** 10 requests/minute per IP enforced by Nginx (HTTP 429)
- **CORS:** API accepts requests only from `https://selkokielelle.fi`
- **Timeout:** OpenRouter calls are cancelled after 15 seconds
- **API key:** Read from environment variable only — never hardcoded, never committed

## License

MIT
