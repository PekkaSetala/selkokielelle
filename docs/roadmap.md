# Roadmap — selkokielelle.fi

Forward-looking work items. Ordered by impact within each category.

Last updated: March 2026.

---

## Bugs

1. **Rate limit 429 returns English, not Finnish.** slowapi default handler returns `"Rate limit exceeded: 30 per 1 hour"`. CLAUDE.md and architecture.md claim Finnish — inaccurate. Fix: add custom 429 exception handler in `backend/main.py`.

2. **Extension error state has no padding.** `#skl-state-error` padding (`1.1rem 1rem`) only exists in dead `extension/content.css`, not in the Shadow DOM inline `<style>` in `content.js`. Currently invisible (CSS can't reach closed Shadow DOM anyway), but will break visually once `content.css` is deleted.

3. **Extension doesn't handle non-JSON error responses.** If nginx returns a 502 HTML error page, `res.json()` throws. Works by accident via `.catch()` but fragile. `extension/content.js` should check `response.ok` before parsing JSON.

---

## Immediate — Chrome Web Store track

4. **Replace placeholder extension icons** — Current icons in `extension/icons/` are 98–300 byte solid-color PNGs. Need proper designed icons (16px, 48px, 128px).

5. **Publish to Chrome Web Store** — Pay €5 developer fee. Submit with description, panel UI screenshots. Current `laajennos.html` dev-mode install instructions reach zero ordinary users.

6. **Tighten `EXTENSION_ORIGIN`** — Currently `*` in systemd override at `/etc/systemd/system/selkokielelle.service.d/override.conf`. Change to `chrome-extension://REAL_ID` after Store publication.

7. **Write extension privacy policy** — Can link to existing `tietosuoja.html`. Required for Chrome Web Store listing.

---

## Extension tech debt

8. **Delete `extension/content.css`** — Confirmed dead code. Chrome injects it into the page's main document, but all panel elements live inside a closed Shadow DOM (`host.attachShadow({ mode: 'closed' })`). CSS cannot pierce Shadow DOM boundaries. Remove from `manifest.json` `css` array. Before deleting, port `#skl-state-error { padding: 1.1rem 1rem; }` to the inline `<style>` in `content.js`.

9. **Bundle fonts locally** — `content.js` line 15 has `@import url('https://fonts.googleapis.com/...')` inside the Shadow DOM `<style>`. Fires a network request on every page load. Bundle Instrument Serif + DM Sans in `extension/fonts/` and replace with local `@font-face` declarations.

10. **Extension Phase 2 design alignment** — Panel visual style diverges from selkokielelle.fi. CSS-only changes: white card treatment, result text size/weight (`1rem`/`300` vs current `1.25rem`/`400`), SELKOKIELI uppercase label, Kopioi ghost button, wordmark size (`1.5rem`), skeleton shimmer colors.

---

## Operations

11. **Confirm log rotation on VPS** — Check `/etc/systemd/journald.conf` has `SystemMaxUse=200M` or similar. On a small VPS, uncontrolled log growth could fill disk.

12. **Set up uptime monitoring** — UptimeRobot (free) or Better Stack pinging `https://selkokielelle.fi/api/health` every 5 minutes. Email/SMS alert on failure.

---

## SEO & Growth

13. **Add robots.txt and sitemap.xml** — Two static files in `frontend/`. Sitemap lists `/`, `/laajennos.html`, `/tietosuoja.html`.

14. **Add Schema.org WebApplication structured data** — JSON-LD block in `<head>` of `index.html`. 15 minutes of work.

15. **Install Plausible analytics** — Self-hosted on existing VPS. One script tag. No cookie banner needed (GDPR-compliant without consent).

---

## UX

16. **Add "What is selkokieli?" explainer** — 2–3 sentences above the textarea for first-time visitors.

17. **Surface rate limit error (429)** — Frontend JS and `extension/content.js` fall through to generic error. Handle 429 explicitly — show message explaining the 30-request/hour limit. Depends on bug #1 being fixed first.

18. **Client-side timeout UI** — Add `AbortController` (20s) that replaces spinner with "Tämä kestää odotettua kauemmin" message.

19. **Accessibility controls** — Text size toggle (`A-`/`A+`) and high contrast mode. Two CSS classes toggled by minimal JS.

20. **Accessibility gaps from v1.3 audit** — Loading state button needs `aria-label`, `#output-text` hidden during loading prevents screen reader announcements, character counter color warning has no non-color signal.

21. **Translation quality feedback** — Thumbs up/down beneath output. Even client-side only would give directional signal. Prerequisite for future prompt iteration.

---

## Content

22. **Soften Selkokeskus disclaimer** — Current: "Ei yhteyttä Selkokeskukseen". Better: "Independent tool, based on Selkokeskus guidelines".

23. **Add Terms of Service page** — Free tool, no accuracy guarantee, don't submit sensitive data, maintainer identity. Link from footer.

---

## Future experiments

24. **Test Gemini model** — Compare `google/gemini-2.0-flash` output quality vs `gpt-4o-mini`. No code change needed: set `MODEL=google/gemini-2.0-flash` in systemd unit on VPS.

---

## Intentionally excluded

- **Dark mode** — Low utility for this audience, adds maintenance
- **Blog** — Indefinite content commitment, not a launch blocker
- **PWA** — API-dependent tool, offline mode has no benefit
- **File upload** — Narrow use case, paste covers 95% of needs
- **History** — localStorage complexity + multi-device problem
- **Swedish/EN toggle** — Significant i18n cost, low immediate priority
