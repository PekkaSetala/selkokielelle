# Selkokielelle Chrome Extension — Complete Implementation Summary

**Date:** March 2026
**Status:** Development complete, ready for local testing
**Model used:** Claude Sonnet 4.6

---

## Strategic Direction

### Decision: Selection-based extension, not user-supplied API key

**Why:**
- Primary audience (support workers, social workers) cannot manage OpenRouter API keys
- System prompt (60+ lines of Selkokeskus guidelines) is core product differentiation — embedding in client-side JS exposes it
- Backend cost trivial at this scale (~€15/month for 1,000 daily conversions)
- Web tool already free with no login — extension requiring API key breaks accessibility mission
- Privacy story unchanged: text processed and discarded, covered by existing tietosuoja page

### Decision: Selection-based flow, no full-page translation in v1

**Why:**
- Full-page translation requires chunking (8–40k chars), DOM surgery, context preservation, reversal system = 3–4 weeks
- Selection-based maps directly to existing web tool workflow
- Real use case: user encounters difficult paragraph on a webpage, wants it simplified now
- 5000-char limit sufficient for selections

### Decision: Fixed sidebar panel, not floating anchor or tooltip

**Why:**
- Selected text can be anywhere on page — anchoring is fragile, covers original text
- Fixed sidebar is stable, does not obscure source, consistent viewport position
- Modal would feel intrusive; tooltip too fragile

---

## What Was Built

### Backend Changes

**File: `backend/main.py`**
- Added imports: `Request` from FastAPI, `Limiter` and `_rate_limit_exceeded_handler` from `slowapi`, `RateLimitExceeded`
- Added `EXTENSION_ORIGIN` env var (optional, for Chrome Web Store deployment)
- Initialized `limiter = Limiter(key_func=get_remote_address)`
- Added rate limiting exception handler to app
- Changed CORS from single `ALLOWED_ORIGIN` to a list that includes `EXTENSION_ORIGIN` if set
- Added `GET /api/health` endpoint (returns `{"status": "ok"}`)
- Decorated `POST /api/translate` with `@limiter.limit("30/hour")`
- Changed function signature to accept `request: Request, body: TranslateRequest` (required by slowapi)

**File: `backend/requirements.txt`**
- Added `limits==3.13.0`
- Added `slowapi==0.1.9`

### Extension Files Created

**`extension/manifest.json`**
- Manifest V3
- Permissions: `contextMenus`, `activeTab`
- Host permissions: `https://selkokielelle.online/*`
- Background service worker: `background.js`
- Content scripts: `content.js` (matches all URLs)
- Command: `Alt+S` to trigger translation
- Icon references: `icons/icon{16,48,128}.png`

**`extension/background.js`**
- Creates context menu item "Muunna selkokielelle" on `onInstalled`
- Listens to context menu clicks and sends `{ type: 'TRANSLATE', text }` to content script
- Listens to `Alt+S` command and sends `{ type: 'TRANSLATE_SELECTION' }` to content script

**`extension/content.js`** (~240 lines)
- **Shadow DOM setup:** isolates panel styles from host page CSS
- **Panel DOM:** header (wordmark + close button), body (3 states), footer (copy button)
- **4 States:**
  1. Loading: skeleton shimmer + "Tämä kestää hetken..." after 4s
  2. Result: translated text fades in, copy button appears
  3. Error: Finnish error message + "Yritä uudelleen" retry link
  4. Empty selection: ephemeral toast "Valitse ensin teksti" (no panel)
- **API call:** direct to `https://selkokielelle.online/api/translate`
- **Dismissal:** X button, Escape key, click outside
- **Copy button:** copies result to clipboard, shows "Kopioitu ✓" for 2s

**`extension/content.css`** (~170 lines)
- Shadow DOM scoped styles
- Design tokens: exact colors from `index.html` (#F9F8F6 bg, #1C1B19 text, #2C4BFF accent, #D0CCBF borders)
- Typography: 1.1rem, 300 weight, 1.85 line-height (per selkokieli guidelines)
- Animations: skeleton shimmer, fade-in (350ms), slide-in panel (220ms, cubic-bezier(0.22,1,0.36,1))
- Shadow: `-4px 0 24px rgba(0,0,0,0.08)`

**`extension/icons/{icon16,48,128}.png`**
- Placeholder solid-color PNGs (accent blue, #2C4BFF)
- Replace with proper icons before Chrome Web Store submission

### Documentation Changes

**File: `CLAUDE.md`**
- Added extension architecture section
- Documented CORS behavior with `EXTENSION_ORIGIN`
- Added extension dev loading instructions
- Documented rate limiting (30 req/hour, 429 response)

---

## Local Testing Instructions

### Setup

1. **Install dependencies:**
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Set backend env for dev:**
   Edit `backend/.env`:
   ```
   OPENROUTER_API_KEY=your-actual-key
   ALLOWED_ORIGIN=http://localhost:3000
   ```
   For extension testing against local backend, temporarily add:
   ```
   EXTENSION_ORIGIN=*
   ```
   (Revert before deploying to production.)

3. **Start backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```
   Backend runs on `http://localhost:8000`

4. **Load extension in Chrome:**
   - Open `chrome://extensions`
   - Enable Developer Mode (top right)
   - Click "Load unpacked"
   - Select `/Users/pekkasetala/Documents/Vibe/Prod/selkokielelle/extension/`

### Testing

**Test 1: Right-click context menu**
1. Open any Finnish webpage (e.g., `kela.fi`, `suomi.fi`, `yle.fi`)
2. Select a paragraph of Finnish text
3. Right-click → "Muunna selkokielelle"
4. Verify: panel slides in from right, skeleton appears, result text fades in after 2–5s
5. Verify: copy button works (copies to clipboard)
6. Verify: Escape key closes panel
7. Verify: click outside panel closes it
8. Verify: X button closes it

**Test 2: Keyboard shortcut (Alt+S)**
1. Select text on a webpage
2. Press `Alt+S`
3. Same behavior as right-click → should open panel and translate

**Test 3: No selection**
1. Trigger right-click menu or Alt+S without selecting text
2. Verify: toast notification appears ("Valiske ensin teksti"), fades after 2.5s
3. Verify: no panel opens

**Test 4: Text > 5000 chars**
1. Select text longer than 5000 characters
2. Verify: toast appears ("Valittu teksti on liian pitkä (yli 5 000 merkkiä)")

**Test 5: Rate limiting**
1. Manually send 31 rapid requests to `https://localhost:8000/api/translate` (or let it happen naturally)
2. Verify: 31st request returns 429 with error message

**Test 6: Health check**
```bash
curl https://selkokielelle.online/api/health
# Should return: {"status":"ok"}
```

---

## Files Modified/Created

| File | Status | Action |
|------|--------|--------|
| `backend/main.py` | Modified | Added slowapi, health endpoint, CORS list, rate limiter |
| `backend/requirements.txt` | Modified | Added limits, slowapi |
| `extension/manifest.json` | Created | Manifest V3, permissions, background, content scripts |
| `extension/background.js` | Created | Context menu + command registration |
| `extension/content.js` | Created | Panel DOM, 4 states, Shadow DOM, API call |
| `extension/content.css` | Created | Panel styles, animations, design tokens |
| `extension/icons/icon{16,48,128}.png` | Created | Placeholder PNGs |
| `CLAUDE.md` | Modified | Added extension architecture docs |

---

## Before Chrome Web Store Submission

### Critical tasks:

1. **Replace placeholder icons** in `extension/icons/`
   - Design proper 16x16, 48x48, 128x128 PNG icons
   - Suggested: simple "S" lettermark in accent blue (#2C4BFF) or wordmark

2. **Set `EXTENSION_ORIGIN` in production**
   - Publish extension to Chrome Web Store (get extension ID)
   - Set `EXTENSION_ORIGIN=chrome-extension://YOUR_PRODUCTION_ID` in systemd unit file
   - Redeploy

3. **Update `host_permissions` in `manifest.json`**
   - If API URL changes, update `"host_permissions": ["https://your-domain/*"]`

4. **Add privacy policy link**
   - Chrome Web Store requires privacy policy
   - Link to existing `tietosuoja.html` or create extension-specific policy

5. **Test on production API**
   - Before submitting, test against live `selkokielelle.online` API
   - Verify rate limiting works as expected

---

## Key Technical Notes

### Rate Limiting

- **Backend:** `slowapi` library with per-IP key
- **Limit:** 30 requests/hour per IP (can be adjusted in `main.py`)
- **Response:** 429 status with message "rate limit exceeded" (or custom Finnish message)
- **Why not higher?** Protective against cost abuse; can be increased later if needed

### CORS Strategy

**Development:**
```python
ALLOWED_ORIGIN = "http://localhost:3000"  # web tool
EXTENSION_ORIGIN = "*"                     # temporary for testing
```

**Production:**
```python
ALLOWED_ORIGIN = "https://selkokielelle.online"           # web tool
EXTENSION_ORIGIN = "chrome-extension://abc123..."         # published extension
```

### API Contract

**Endpoint:** `POST https://selkokielelle.online/api/translate`

**Request:**
```json
{ "text": "Finnish text here" }
```

**Response (success):**
```json
{ "result": "Simplified Finnish text here" }
```

**Response (error):**
```json
{ "error": "Teksti on liian pitkä" }
```

**Status codes:**
- 200: success
- 400: empty or > 5000 chars
- 429: rate limited
- 504: timeout
- 502: API error

### Shadow DOM Isolation

Content script injects panel into Shadow DOM to isolate CSS. Critical because:
- Host pages often have aggressive CSS resets (`* { ... }`)
- Shadow DOM prevents host page styles from breaking panel
- Panel styles never leak into host page

---

## Next Steps (Post-Testing)

1. Fix icons (design real ones)
2. Test on production API (not localhost)
3. Prepare Chrome Web Store account
4. Write privacy policy
5. Get extension ID from submission
6. Update `EXTENSION_ORIGIN` in systemd unit
7. Redeploy backend with `EXTENSION_ORIGIN` set
8. Submit to Chrome Web Store
9. Monitor usage via backend logs

---

## Files Reference (Absolute Paths)

```
/Users/pekkasetala/Documents/Vibe/Prod/selkokielelle/
├── backend/
│   ├── main.py                          (modified)
│   └── requirements.txt                 (modified)
├── extension/
│   ├── manifest.json                    (new)
│   ├── background.js                    (new)
│   ├── content.js                       (new)
│   ├── content.css                      (new)
│   └── icons/
│       ├── icon16.png                   (placeholder, replace)
│       ├── icon48.png                   (placeholder, replace)
│       └── icon128.png                  (placeholder, replace)
├── CLAUDE.md                            (modified)
├── EXTENSION_IMPLEMENTATION.md          (this file)
└── .claude/plans/deep-bubbling-owl.md   (strategic plan)
```

---

## Questions/Debugging

**Extension not loading?**
- Check manifest.json syntax (JSON validator)
- Ensure all referenced files exist
- Check browser console for errors (right-click → Inspect → Console)

**Panel not appearing?**
- Check background service worker logs (`chrome://extensions` → Details → Errors)
- Verify backend is running and API is accessible
- Check network tab (Developer Tools → Network) for failed API calls

**CORS errors?**
- Ensure `ALLOWED_ORIGIN` or `EXTENSION_ORIGIN` includes the request origin
- For development, temporarily set to `*`

**Rate limit being hit too fast?**
- Adjust `@limiter.limit("30/hour")` in `main.py` to a higher value
- Or add IP whitelisting (not implemented yet)

---

**End of documentation. Context window can now be cleared.**
