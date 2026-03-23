# Vibe Check Report — v1.5

**Project:** selkokielelle.fi
**Date:** 2026-03-23
**Score:** 79/100 — ✓ Ready

*Last updated: 2026-03-23 — v1.5.1 resolved: dependency security, error logging, prompt injection*

---

## Open items

### ◐ OpenGraph Tags · Discoverability · Medium
`index.html` and `laajennos.html` have `og:title`, `og:description`, `og:url` but no `og:image`. `tietosuoja.html` has no OG tags at all. Every shared link renders as a bare URL with no preview image.

**Fix:** Add `og:image` to `index.html` and `laajennos.html`. Add a full OG block to `tietosuoja.html`.
**Blocked on:** You need to create a 1200×630px share image first. Agent adds the tags once the asset exists.

---

### ◐ Visitor Tracking · Analytics · Medium
No analytics anywhere. Zero visibility into page views, feature usage, or whether the extension is being used at all.

**Fix:** Add Plausible (privacy-safe, no cookie consent needed, consistent with existing privacy policy).
**Blocked on:** Create account at plausible.io and provide a site ID. Agent adds the script tag.

---

### ◐ Cost Signals · Platform · Medium
The `slowapi` rate limiter uses in-memory storage and resets on every service restart — including every `./deploy.sh` run. The 30 req/hour/IP cap briefly resets after each deploy. Low risk at current traffic.

**Fix:** Redis-backed limiter — `slowapi` supports it natively.
**Blocked on:** You install Redis on the VPS. Agent writes the code change.

---

### ○ Twitter Cards · Discoverability · Low
No `twitter:card` tags. Depends on `og:image` existing first (see OpenGraph Tags above).

---

### ○ Conversion Tracking · Analytics · Low
No instrumentation at translation success or copy-click. Depends on visitor tracking being set up first.

---

### ○ Semantic HTML · Discoverability · Low
Heading structure and landmark elements (`<main>`, `<nav>`) were not verified. `laajennos.html` and `tietosuoja.html` use `<div class="content">` instead of `<main>`.

**Fix:** Manually check each HTML file for a single `<h1>`, no skipped heading levels, and a `<main>` landmark.
**Not agent-doable** — requires human judgment on visual structure intent.

---

### ○ Managed Services · Platform · Low
Informational. Self-managed VPS means no zero-downtime deploys, no automated rollback, and manual SSL renewal. Not a failure at current scale.

---

## Resolved in v1.5.1

- ✓ **Dependency Security** — removed `annotated-doc==0.0.4`, added `pip-audit` GitHub Actions workflow (weekly + on requirements.txt changes)
- ✓ **Error Tracking** — added structured Python logging to all error branches in `backend/main.py` (timeout, non-200, parse failure, finish_reason=length)
- ✓ **Health Checks** — `/api/health` endpoint confirmed present (was already in code)
- ✓ **Prompt Injection Prevention** — user input now wrapped in `<teksti>` delimiters before sending to model
