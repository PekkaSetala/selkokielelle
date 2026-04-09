# Changelog

All notable changes to selkokielelle.fi are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/). Tags follow semantic versioning.

---

## v1.5.2 — 2026-04-02

**Tag:** `v1.5.2` · **Previous:** `v1.5.1`

Analytics and reading ergonomics.

### Added
- **GoatCounter analytics** — privacy-friendly page view tracking added to all frontend pages. File: `frontend/index.html` (and other pages)
- **Extension request tagging** — extension-originated API calls tagged with a source identifier for analytics separation. File: `extension/content.js`

### Changed
- **Adaptive output card height on mobile** — output card grows to fit content instead of a fixed height, improving reading ergonomics on small screens. File: `frontend/index.html`

---

## v1.5.0 — 2026-03-23

**Tag:** `v1.5.0` · **Previous:** `v1.4.0`

Security hardening, accessibility, error handling improvements.

### Fixed
- **Rate limit 429 now returns Finnish** — custom exception handler replaces English slowapi default. File: `backend/main.py`
- **Extension handles non-JSON error responses** — checks `response.ok` before parsing JSON. File: `extension/content.js`
- **Extension error state padding** — ported from dead `content.css` to inline Shadow DOM style. File: `extension/content.js`
- **429 surfaced in frontend** — explicit handling with Finnish message. File: `frontend/index.html`
- **Desktop zoom works** — `overflow: hidden` changed to `overflow: auto`. File: `frontend/index.html`
- **Contrast ratio** — `--faint` darkened from `#908C83` to `#706C63` (4.8:1 on background). All pages
- **Character counter non-color signal** — `!` prefix at warn, `⚠` at over-limit. File: `frontend/index.html`

### Added
- **Server-side HTML stripping** on LLM output (defense-in-depth against prompt injection XSS). File: `backend/main.py`
- **FastAPI validation error suppression** — generic Finnish error instead of Pydantic details. File: `backend/main.py`
- **Accessibility landmarks** — `<header>`, `<main>`, `<h1>` headings on all pages. All pages
- **Skip link** — "Siirry tekstikenttään" on `index.html`
- **Focus-visible styles** on textarea and buttons. File: `frontend/index.html`
- **aria-live region fix** — `#output-text` stays in accessibility tree during loading. File: `frontend/index.html`
- **Loading button state** — `aria-label` and `aria-busy` during translation. File: `frontend/index.html`
- **Copy feedback for screen readers** — `aria-live="assertive"` region. File: `frontend/index.html`
- **Client-side 20s timeout** via AbortController with Finnish message. File: `frontend/index.html`
- **prefers-reduced-motion** support. File: `frontend/index.html`
- **robots.txt and sitemap.xml**. Files: `frontend/robots.txt`, `frontend/sitemap.xml`
- **Schema.org WebApplication** structured data. File: `frontend/index.html`
- **Deploy rollback tagging** — prints current commit hash before pulling. File: `deploy.sh`
- **Extension panel ARIA** — `role="dialog"`, `aria-label`, `aria-live` on result, `role="status"` on loading, `role="alert"` on toast. File: `extension/content.js`
- **Extension focus management** — panel focuses close button on open, returns focus on close. File: `extension/content.js`

### Changed
- **Extension Shadow DOM** — `closed` → `open` for screen reader compatibility. File: `extension/content.js`
- **Selkokeskus disclaimer softened** on tietosuoja.html
- **Consistent navigation** — back link on all subpages, standardized footer order
- **`content.css` deleted** — was dead code (Shadow DOM blocks external CSS injection). Files: `extension/content.css` (deleted), `extension/manifest.json`

### Server-side changes (not in repo — apply on VPS)
- Set `EXTENSION_ORIGIN` to empty string (remove wildcard `*`)
- Add HTTP security headers in nginx (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Fix `proxy_set_header X-Forwarded-For $remote_addr;` in nginx
- Set `client_max_body_size 32k;` in nginx API location
- Confirm log rotation (`SystemMaxUse=200M` in journald.conf)
- Set up uptime monitoring (UptimeRobot → `/api/health`)

---

## Post-v1.4.0 patches (untagged)

Committed directly to main after v1.4.0 release.

### Domain migration (2026-03-21)
- Migrated all references from `selkokielelle.online` to `selkokielelle.fi` — code, configs, docs, meta tags
- Files: `frontend/index.html`, `frontend/tietosuoja.html`, `frontend/laajennos.html`, `backend/main.py`, `README.md`, `extension/README.md`

### Content rewrites (2026-03-19 – 2026-03-21)
- Rewrote `tietosuoja.html` and `laajennos.html` in selkokieli for target audience
- GDPR compliance rewrite on tietosuoja page — identity consistency, removed incorrect legal basis sentence
- Rephrased contact info on tietosuoja page

### Documentation (2026-03-18 – 2026-03-19)
- Added Mac `Option+S` keyboard shortcut to `laajennos.html` and both READMEs
- Removed incorrect `ß` character note from Mac shortcut troubleshooting

---

## v1.4.0 — 2026-03-17

**Tag:** `v1.4.0` · **Previous:** `v1.3.0`

Largest release to date. Chrome extension, responsive layout, backend hardening.

### Added
- **Chrome extension** — Manifest V3, right-click "Muunna selkokielelle" or `Alt+S` on selected text. Shadow DOM sidebar panel with 4 states (loading/result/error/empty-selection), copy to clipboard, slow-network hint after 4s. Files: `extension/manifest.json`, `extension/background.js`, `extension/content.js`, `extension/content.css`, `extension/icons/`
- **Responsive layout** — `@media (min-width: 800px)` breakpoint: side-by-side CSS grid, max-width 1080px, 400px textareas, arrow hidden on desktop. File: `frontend/index.html`
- **Extension landing page** — `frontend/laajennos.html` with install guide, usage instructions, limitations, privacy info
- **Paragraph rendering** — Output rendered as semantic `<p>` elements instead of `white-space: pre-wrap`. XSS-safe via `textContent`. Files: `frontend/index.html`, `extension/content.js`
- **Input muting** — Input textarea visually muted after translation to direct focus to output
- **Rate limiting** — `slowapi` at 30 requests/hour per IP, returns HTTP 429 with Finnish message. Files: `backend/main.py`, `backend/requirements.txt`
- **Health endpoint** — `GET /api/health` → `{"status": "ok"}`
- **Startup assertions** — `assert OPENROUTER_API_KEY` and `assert ALLOWED_ORIGIN` for fail-fast on missing config
- **`MODEL` env var** — AI model configurable at runtime, defaults to `openai/gpt-4o-mini`
- **`EXTENSION_ORIGIN` CORS** — CORS list conditionally includes extension origin for Chrome extension support

### Changed
- **System prompt v3.1** — Strengthened injection defense, added paragraph/list/heading guidance, number/date formatting rules, expanded vocabulary examples
- **`max_tokens`** — Reduced from 4000 to 2500 (plain Finnish output rarely exceeds 800 tokens)
- **`.gitignore`** — Added `*.key`, `*.pem`, `*.env` to prevent accidental secret commits

### Post-release patches (same day)
- `frontend/favicon.svg` created (Finnish cross mark) and linked on all pages
- OG meta tags added to `index.html` and `laajennos.html`, canonical added to `tietosuoja.html`
- `laajennos.html` install step 1: added ZIP download button, GitHub link, `git clone` command
- Dev-mode persistence note corrected
- Footer nav: `laajennos.html` self-link for consistent navigation

### Known remaining work at release
- Extension icons are placeholders — replace before Chrome Web Store submission
- `EXTENSION_ORIGIN` set to `*` — tighten to real extension ID after Store publication
- CSS duplication between `extension/content.js` inline styles and `extension/content.css`
- Google Fonts loaded in extension (privacy tech debt)

---

## v1.3.0 — 2026-03-06

**Tag:** `v1.3.0` · **Commit:** `3d4ec2b` · **Previous:** `v1.2.0`

SEO foundations, mobile copy fix, accuracy corrections.

### Fixed
- **HTTP-Referer / X-Title headers** — corrected domain in OpenRouter request headers. File: `backend/main.py`
- **Copy button on iOS Safari** — added `execCommandFallback()` using `document.execCommand('copy')` as fallback when `navigator.clipboard` unavailable. Explicit failure state: `✕ Kopiointi epäonnistui`. File: `frontend/index.html`
- **tietosuoja button label** — `"Muunna selkokielelle"` → `"Muunna"` to match actual button. File: `frontend/tietosuoja.html`
- **tietosuoja logging claim** — Updated to accurately state that server logs standard technical data (timestamps, IPs) but not text content. Previous wording incorrectly claimed nothing is logged. File: `frontend/tietosuoja.html`

### Changed
- **Page title** — `Selkokielelle` → `Selkokielelle – Muunna teksti selkokielelle`
- **Meta description** added: `Ilmainen työkalu tekstin muuntamiseen selkokielelle tekoälyn avulla.`
- **Canonical tag** added: `<link rel="canonical" href="https://selkokielelle.fi/" />`
- **Tagline** — `Muuta teksti selkosuomeksi.` → `Muunna teksti selkokielelle.` (consistent verb and terminology)

### Test results
12/12 checks passed (3 backend, 8 frontend, 1 production smoke test).

---

## v1.2.0 — 2026-03-04

**Tag:** `v1.2.0` · **Commit:** `754d3d4` · **Previous:** `v1.1.0`

UI redesign, expanded limits, new features.

### Added
- **Clear button (Tyhjennä)** — clears textarea + output, resets counter. Always enabled, no confirmation dialog. File: `frontend/index.html`
- **tietosuoja.html** — Privacy and transparency page. Linked from footer. New file
- **System prompt: slang/anglicism section** — `## VIERASKIELISET SANAT JA SLÄNGI` added. Examples: `tsekkata` → `tarkistaa`, `some` → `sosiaalinen media`, `boostata` → `vahvistaa`. File: `backend/main.py`

### Changed
- **Character limit** — 3000 → 5000 characters. Files: `frontend/index.html`, `backend/main.py`
- **`max_tokens`** — 2000 → 4000 (to accommodate longer selkokieli output from 5000-char input)
- **Layout** — Fixed-height scrollable areas (300px each) for input and output. Page no longer grows with content
- **Frontend redesign** — Full v2 visual design with CSS variables, Google Fonts (Instrument Serif + DM Sans)

### Build methodology
7-phase process: branch setup → 4 implementation phases → integration testing (15/15 tests) → merge and deploy.

---

## v1.1.0 — 2026-03-03

**Tag:** `v1.1.0` · **Commit:** `9e6b1c2` · **Previous:** `v1.0.0`

### Fixed
- README corrections and live URL fix (pointed to `selkokielelle.online`)

---

## v1.0.0 — Early March 2026

**Tag:** `v1.0.0` · **Commit:** `995dd2a`

Initial public release.

### What was built
- Single-page application: textarea input → selkokieli output
- FastAPI backend with `POST /api/translate` endpoint
- OpenRouter integration with `openai/gpt-4o-mini`, temperature 0.3
- System prompt v1 based on Selkokeskus guidelines (vocabulary, sentence structure, passive→active voice, reader framing)
- Nginx reverse proxy + SSL via Certbot/Let's Encrypt
- Input validation: non-empty, max 3000 characters
- Character counter with color states (normal/warning/limit)
- Finnish-language error messages
- CORS locked to `ALLOWED_ORIGIN`
- Nginx rate limiting: 10 requests/min per IP on `/api/`
- `deploy.sh` automated deployment script

### Out of scope (deferred)
- Copy-to-clipboard button (added v1.2.0)
- Mobile-specific layout (added v1.4.0)
- Analytics
- Clear button (added v1.2.0)
- Privacy page (added v1.2.0)
