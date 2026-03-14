# TO-DO LIST — selkokielelle.online

## Execution Order

### 1. Security fixes
- [ ] Fix rate limiting: Nginx `proxy_set_header X-Forwarded-For $remote_addr;` in `/api/` location
- [ ] Fix rate limiting: systemd unit ExecStart add `--proxy-headers --forwarded-allow-ips='127.0.0.1'`
- [ ] Add startup assertions in backend/main.py for OPENROUTER_API_KEY and ALLOWED_ORIGIN
- [ ] Update .gitignore: add `*.key`, `*.pem`, `*.env` entries
- [ ] (Dashboard action) Set monthly spending cap in OpenRouter ($10/month)

### 2. Cost model evaluation
- [ ] Reduce `max_tokens` from 4000 to 1200 in backend/main.py (gpt-4o-mini)
- [ ] Add MODEL env var to backend/main.py (default: openrouter gpt-4o-mini)
- [ ] Add Gemini 2.0 Flash code path (Google AI Studio) on separate branch
- [ ] Test Finnish output quality with both models
- [ ] Decide which model to use going forward

### 3. Prompt refinement
- [ ] Add paragraph guidance to SYSTEM_PROMPT (split on \n\n for multiple ideas)
- [ ] Add list guidance to SYSTEM_PROMPT (use bullet lists for enumerations)
- [ ] Add headings guidance to SYSTEM_PROMPT (use sparingly for clear sections)
- [ ] Add numbers and dates guidance to SYSTEM_PROMPT (Finnish format: 14.3.2026, spell under 12)

### 4. Paragraph rendering
- [ ] Implement paragraph rendering on website (split on \n\n, create <p> elements)
- [ ] Implement paragraph rendering in extension (same approach in content.js)

### 5. GitHub / README overhaul
- [ ] Rewrite README.md: what selkokieli is, extension section, architecture diagram, prompt engineering rationale
- [ ] Add Chrome extension how-to-load in dev mode to README
- [ ] Explain injection defense and Selkokeskus guidelines in README
- [ ] (Optional) Clean up or remove TO-DO-LIST.md from public visibility

### 6. Responsive layout
- [ ] Add responsive 800px+ breakpoint to index.html (side-by-side layout)
- [ ] Expand `.wrap` max-width to ~1080px on desktop
- [ ] Update `.arrow-sep` styling (rotate 90° or hide on desktop)
- [ ] Adjust textarea heights for desktop layout

### 7. Extension landing page
- [ ] Create `frontend/laajennos.html` (extension description + installation instructions)
- [ ] Add footer links in `index.html` pointing to laajennos.html
- [ ] Add footer link in `tietosuoja.html` pointing to laajennos.html

### 8. Extension tech debt
- [ ] Self-host Google Fonts (or use system font stack) to eliminate privacy leak
- [ ] Remove CSS duplication between content.js inline styles and content.css
- [ ] Fix @import position in content.js

---

## Key Files to Modify
- `backend/main.py` — startup assertions, max_tokens, MODEL env var, prompt additions
- `.gitignore` — add *.key, *.pem, *.env
- Nginx config (on VPS) — X-Forwarded-For fix
- systemd unit (on VPS) — --proxy-headers flag
- `frontend/index.html` — paragraph rendering, responsive layout, footer link
- `extension/content.js` — paragraph rendering, font handling
- `README.md` — full rewrite
- `frontend/laajennos.html` — new file

---

**Git history:** Clean (no secrets ever committed, safe for public repo)

**Plan reference:** `/Users/pekkasetala/.claude/plans/happy-discovering-sedgewick.md`
