# TO-DO LIST — selkokielelle.online

## Remaining Work

### 1. Chrome Web Store preparation
- [ ] Replace placeholder icons in `extension/icons/` (16×16, 48×48, 128×128)
- [ ] Set `EXTENSION_ORIGIN` in systemd unit to real extension ID after Store submission
- [ ] Submit to Chrome Web Store

### 2. Extension tech debt
- [ ] Self-host fonts or switch to system font stack in extension (eliminates Google Fonts privacy leak)
- [ ] Remove CSS duplication between `extension/content.js` inline styles and `extension/content.css`

### 3. Operations
- [ ] Confirm log rotation on VPS (`/etc/systemd/journald.conf` — `SystemMaxUse`)
- [ ] Pin exact package versions in `backend/requirements.txt` (`pip freeze`)
- [ ] Set up uptime monitoring (UptimeRobot or similar) on `https://selkokielelle.online`

### 4. Future features
- [ ] Add `MODEL=google/gemini-2.0-flash` code path and test output quality vs. gpt-4o-mini
- [ ] Translation quality feedback (thumbs up/down) — prerequisite for future prompt iteration

---

## Completed

### Security
- [x] Fix rate limiting: Nginx `proxy_set_header X-Forwarded-For` (done on VPS)
- [x] Fix rate limiting: systemd `--proxy-headers --forwarded-allow-ips='127.0.0.1'` (done on VPS)
- [x] Startup assertions for `OPENROUTER_API_KEY` and `ALLOWED_ORIGIN`
- [x] Updated `.gitignore` — added `*.key`, `*.pem`, `*.env`
- [x] Set monthly spending cap in OpenRouter dashboard

### Backend
- [x] Rate limiting — 30 requests/hour per IP via `slowapi`
- [x] `GET /api/health` endpoint
- [x] `MODEL` environment variable (default: `openai/gpt-4o-mini`)
- [x] Reduced `max_tokens` from 4000 to 2500

### Prompt
- [x] Paragraph guidance (split on `\n\n`)
- [x] List guidance (`-` or `•` for enumerations)
- [x] Heading guidance (use sparingly)
- [x] Number and date formatting (Finnish format, spell 1–11)
- [x] Strengthened injection defense

### Frontend
- [x] Paragraph rendering (semantic `<p>` elements)
- [x] Responsive layout — 800px+ side-by-side grid
- [x] Extension landing page (`frontend/laajennos.html`)
- [x] Footer links updated in `index.html` and `tietosuoja.html`
- [x] Input muting after translation
- [x] OG meta tags added to `index.html` and `laajennos.html`; canonical added to `tietosuoja.html` (2026-03-17)
- [x] Favicon (`favicon.svg`) created and linked on all three pages (2026-03-17)
- [x] `laajennos.html` install step 1: added ZIP download button, GitHub link, and clone command (2026-03-17)
- [x] `laajennos.html` dev-mode note corrected — persistence behaviour was inaccurate (2026-03-17)
- [x] `laajennos.html` footer: added self-link for consistent nav (2026-03-17)

### Extension
- [x] Chrome extension — Manifest V3, Shadow DOM panel, 4 states
- [x] Right-click context menu + `Alt+S` keyboard shortcut
- [x] Paragraph rendering in extension

### Documentation
- [x] README overhaul — architecture, system design, prompt engineering rationale
- [x] `docs/v1.4.0.md` release notes
