# Selkokielelle Chrome Extension

A Chrome extension that converts selected Finnish text into **selkokieli** (Plain Finnish) using the main [selkokielelle.online](https://selkokielelle.online) service. Designed for accessibility—targeting people with reading disabilities, immigrants, and those learning Finnish.

## Features

- **One-click translation**: Right-click any selected text → "Muunna selkokielelle" → result slides in from the right
- **Keyboard shortcut**: Select text and press `Alt+S` (Windows/Linux) or `Option+S` (Mac) for instant translation
- **Clean sidebar UI**: Minimal design matching the main site, optimized for readability
- **Live feedback**: Skeleton loading animation during translation
- **Copy to clipboard**: One-click copy button with visual confirmation
- **Error handling**: Network issues and rate limits display helpful Finnish messages
- **Accessibility first**: WCAG compliant, keyboard navigable, screen reader friendly

## Architecture

The extension follows Manifest V3 and consists of three main components:

```
extension/
├── manifest.json          # Manifest V3 config: permissions, commands, icons
├── background.js          # Service worker: registers context menu + keyboard shortcut
├── content.js             # Content script: Shadow DOM panel, state management, API calls
├── content.css            # Panel styles (scoped in Shadow DOM)
└── icons/                 # Extension icons (16px, 48px, 128px)
```

### Request Flow

```
User selects text on any webpage
        ↓
Right-click OR Alt+S / Option+S (Mac)
        ↓
background.js sends message to content.js
        ↓
content.js opens Shadow DOM panel
        ↓
POST /api/translate to selkokielelle.online
        ↓
OpenRouter API (gpt-4o-mini) processes request
        ↓
Result displayed in panel
        ↓
User copies or closes panel
```

## Files Overview

### manifest.json

Declares extension metadata, permissions, and entry points:

- `contextMenus` + `activeTab` permissions: Required to add "Muunna selkokielelle" to right-click menus
- `host_permissions`: Allows API calls to `https://selkokielelle.online/*`
- `background.service_worker`: Registers the background script
- `content_scripts`: Injects content.js into all pages
- `commands`: Defines `Alt+S` keyboard shortcut

**Before Chrome Web Store submission**, update `host_permissions` if the API domain changes.

### background.js

Service worker that runs in the extension's isolated context:

1. **On install**: Creates the context menu item via `chrome.contextMenus.create()`
2. **On context menu click**: Sends `{ type: 'TRANSLATE', text: selectionText }` message to content script
3. **On keyboard shortcut** (`Alt+S`): Sends `{ type: 'TRANSLATE_SELECTION' }` message to content script (content.js reads `window.getSelection()`)

Error handling: `.catch(() => {})` silently ignores failures (page may not have injected content script).

### content.js

Injected into all webpages. Contains:

#### 1. Shadow DOM Panel (`buildPanel()`)

Creates an isolated DOM tree scoped inside a `<div id="selkokielelle-host">` with `attachShadow({ mode: 'closed' })`. Benefits:
- CSS never conflicts with page styles
- User cannot inspect/manipulate the extension UI
- Encapsulated event listeners

Panel structure:
```
┌─────────────────────────────────┐
│ Selkokielelle              [✕]  │  ← Header (56px, Instrument Serif)
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ LOADING STATE (skeleton)    │ │  ← or RESULT or ERROR (only one visible)
│ │ Muunnetaan…                 │ │
│ │ ▓▓▓▓▓▓▓▓▓▓ (shimmer)       │ │
│ │ Tämä kestää hetken...       │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### 2. State Management (`setState()`)

Three mutually exclusive states:

- **loading**: Shows skeleton placeholder lines + "Muunnetaan…" text. After 4 seconds, displays "Tämä kestää hetken..." (slow network hint).
- **result**: Displays translated text + copy button. Text area scrolls if content exceeds 400px panel width.
- **error**: Shows error message + "Yritä uudelleen" retry button. Triggered by network errors or API failures (e.g., rate limit).

The `hidden` attribute controls visibility (CSS: `[hidden] { display: none !important; }`).

#### 3. API Integration (`triggerTranslation()`)

```javascript
fetch('https://selkokielelle.online/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text })
})
```

- **Max input**: 5000 characters (validated before send; exceeding shows toast: "Valittu teksti on liian pitkä")
- **Response**: `{ result: "simplified text" }` or `{ error: "reason" }`
- **Rate limit**: Backend enforces 30 req/hour per IP. Breach returns HTTP 429 with Finnish error message.

#### 4. Interactivity

- **Copy button**: Uses `navigator.clipboard.writeText()`. On success, button shows checkmark ✓ + "Kopioitu" for 2 seconds, then reverts.
- **Close button**: Slides panel left off-screen (`transform: translateX(100%)`), removes margin-right from document.
- **Escape key**: Closes panel
- **Click outside panel**: Closes panel
- **Retry button**: Re-runs `triggerTranslation(lastText)` on error state

#### 5. UI/UX Features

**Toast notifications** (appear top-center, auto-dismiss after 2.5s):
- "Valitse ensin teksti." — triggered when user presses Alt+S with no selection
- "Valittu teksti on liian pitkä (yli 5 000 merkkiä)." — text exceeds limit
- Network/API errors from the backend

**Panel animation**: 220ms cubic-bezier slide-in (right to left), with smooth fade-in on result card (350ms).

**Design tokens** (synced with main site):
```
Background:    #F9F8F6  (warm beige)
Text:          #1C1B19  (dark brown)
Mid:           #6B6860  (muted gray)
Faint:         #908C83  (lighter gray)
Border:        #D0CCBF  (light beige)
Accent:        #2C4BFF  (blue, focus rings)
Fonts:         'DM Sans' (body), 'Instrument Serif' (headers)
Shadows:       0 1px 3px rgba(0,0,0,.04), 0 4px 20px rgba(0,0,0,.04)
Border-radius: 10px
```

### content.css

Stylesheet for the Shadow DOM. Imported via `<link>` in `buildPanel()`. Mirrors the inline `<style>` block in content.js for consistency.

## Development

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd extension
   ```

2. No build step required. The extension is vanilla JavaScript/CSS.

### Loading for Testing

1. Go to `chrome://extensions`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The extension appears in your toolbar

### Testing Workflow

1. Open any page with Finnish text (e.g., Wikipedia)
2. Select some text
3. Right-click → "Muunna selkokielelle" OR press `Alt+S` (Windows/Linux) / `Option+S` (Mac)
4. Panel slides in; skeleton animation plays
5. After ~1-2 seconds, translated text appears
6. Click copy button to copy result
7. Close with Escape, the [✕] button, or click outside

**To reload after code changes**:
- In `chrome://extensions`, click the ⟳ reload icon on the Selkokielelle extension
- Refresh the webpage (the content script reloads)

### Debugging

Open DevTools on the webpage (`F12`) and check the **Console** tab. The extension logs minimal output (errors from API calls will appear here).

To inspect the Shadow DOM:
1. In DevTools → Settings → Preferences
2. Enable "Show user agent shadow DOM"
3. In the Elements tab, you'll now see `#selkokielelle-host` with the shadow root

## API Integration

The extension calls the same backend endpoint as the main site:

**Endpoint**: `POST https://selkokielelle.online/api/translate`

**Request**:
```json
{
  "text": "Finnish text to translate"
}
```

**Response (success)**:
```json
{
  "result": "Simplified Finnish text"
}
```

**Response (error)**:
```json
{
  "error": "Verkkoyhteysongelma. Yritä myöhemmin uudelleen."
}
```

**Rate Limiting**: Backend uses `slowapi` to enforce 30 requests/hour per IP. Exceeding this returns HTTP 429.

**CORS**: Backend allows `ALLOWED_ORIGIN` (web tool) and `EXTENSION_ORIGIN` (extension). During development, `EXTENSION_ORIGIN` can be omitted—the extension tests against the live API.

### Configuring EXTENSION_ORIGIN (Post-Release)

After publishing to the Chrome Web Store, you'll receive a permanent `chrome-extension://` ID. Update the backend's systemd unit file:

```bash
# On the production server
sudo nano /etc/systemd/system/selkokielelle.service
```

Add the ID:
```
Environment="EXTENSION_ORIGIN=chrome-extension://YOUR_ID_HERE"
```

Then reload the service:
```bash
sudo systemctl daemon-reload
sudo systemctl restart selkokielelle
```

## Accessibility

The extension is designed for users with reading disabilities, immigrants, and Finnish learners:

- **Clear typography**: DM Sans at 17px base, 300–500 font-weights for visual hierarchy
- **High contrast**: Text (#1C1B19) on light background (#F9F8F6) meets WCAG AA standards
- **Keyboard accessible**: All interactions (copy, close, retry) work via Tab + Enter
- **Focus indicators**: Blue 2px outlines (`#2C4BFF`) on all buttons
- **Semantic HTML**: Buttons use proper `<button>` tags; SVG icons have `aria-hidden="true"`; labels are descriptive ("Kopioi", "Yritä uudelleen")
- **Screen reader support**: Hidden elements properly marked with `hidden` attribute; loading state announced via aria-live text (future enhancement)
- **No distractions**: Minimal UI, single-purpose sidebar, no ads or tracking

## Chrome Web Store Submission Checklist

Before submitting to the Chrome Web Store:

- [ ] **Icons**: Replace placeholder PNGs in `icons/` with proper 16×16, 48×48, 128×128 images
- [ ] **Manifest description**: Ensure `description` is clear and concise (currently: "Muunna valittu teksti selkokielelle yhdellä klikkauksella.")
- [ ] **Version**: Update `version` in manifest.json
- [ ] **Privacy policy**: Provide a privacy policy URL (extension collects no user data; all requests are to selkokielelle.online API)
- [ ] **Test on multiple sites**: Verify context menu and shortcuts work on Gmail, Reddit, Medium, etc.
- [ ] **Check for console errors**: Run on various pages, ensure no JavaScript errors in DevTools
- [ ] **EXTENSION_ORIGIN**: Set in backend systemd config once you have the permanent ID
- [ ] **host_permissions**: If API domain changes, update manifest.json and redeploy

## Troubleshooting

### Panel doesn't appear when I right-click or press Alt+S / Option+S

**Check**: Is the extension loaded? Go to `chrome://extensions` and verify Selkokielelle is listed and **enabled**.

**Check**: Is the webpage in a restricted context? Extensions can't inject content scripts into:
- `chrome://` pages
- Other extensions' pages
- `file://` URLs (unless explicitly granted)

**Solution**: Test on a standard website like Wikipedia.

### Text doesn't translate; I see an error message

**"Yhteysongelma"** (network error):
- Check your internet connection
- Verify selkokielelle.online is up (visit the site in a browser)
- Check if your network has a proxy or firewall blocking the API

**"Liian monta pyyntöä"** (rate limit):
- You've made >30 requests in the past hour from this IP
- Wait an hour and try again
- If using a shared network, the limit is per IP, not per user

**Other error**:
- Check the browser's **DevTools Console** (`F12`) for details
- Report the error message in GitHub Issues

### Keyboard shortcut (Alt+S / Option+S) doesn't work

**Check**: Is `Alt+S` / `Option+S` being handled by the browser or page?
- Some pages define their own `Alt+S` handlers (e.g., Google Docs uses it for "Explore")
- Try right-click context menu instead

**Solution**: The shortcut can be remapped. Go to `chrome://extensions/shortcuts` to rebind it.

### Panel styling looks wrong; colors are off

**Check**: Is the page using aggressive CSS resets?
- The Shadow DOM isolates styles, but `:host { all: initial; }` ensures clean slate
- If styling is broken, check for invalid inline CSS in content.js

**Check browser DevTools**:
1. Open DevTools, enable "Show user agent shadow DOM"
2. Inspect `#selkokielelle-host` and its shadow root
3. Verify computed styles match the CSS in content.css

## Future Enhancements

- [ ] **Drag-to-resize panel**: Allow users to adjust panel width
- [ ] **History**: Store recent translations for quick access
- [ ] **Offline mode**: Cache translations for common phrases
- [ ] **Voice input/output**: Read selected text aloud, speak the translation
- [ ] **Custom vocabulary**: Users can define personal jargon replacements
- [ ] **Language selection**: Extend beyond Finnish (English → Plain English, Swedish → Plain Swedish)

## License

Same as the main [selkokielelle.online](https://github.com/pekkasetala/selkokielelle) project.

## Support

For issues, feature requests, or questions, open an issue on GitHub or contact the project maintainers.
