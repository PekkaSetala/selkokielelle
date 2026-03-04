# Phase 4 Complete — v1.2

## Summary

Three changes applied to `frontend/index.html` in a single session. No other aspect of the page was modified: API_URL, Finnish text labels, error messages, colour scheme, and font are all unchanged.

---

## Selectors identified

- **Textarea**: CSS rule `textarea`, HTML element `id="input-text"`
- **Output content area**: CSS class `.output-body` (the scrollable container inside `.output` / `#output-wrap`)
- **Output text**: `id="output-text"` (the `<p>` element rendered inside `.output-body`)

---

## Change 1 — Fixed-height scrollable layout

**Goal**: Both the textarea and the output area scroll internally at a fixed 300 px height.

### Lines changed

| Selector | Property | Before | After |
|---|---|---|---|
| `textarea` (CSS, line 108) | `min-height` → `height` | `min-height: 180px` | `height: 300px` |
| `textarea` (CSS, line 115) | `resize` | `resize: none` | `resize: vertical` |
| `textarea` (CSS, new line) | `overflow-y` | _(absent)_ | `overflow-y: auto` |
| `.output-body` (CSS, line 219) | `min-height` → `height` | `min-height: 120px` | `height: 300px` |
| `.output-body` (CSS, new line) | `overflow-y` | _(absent)_ | `overflow-y: auto` |

The `.output-body` already had `overflow: hidden` on the parent `.output` block (which was left untouched); adding `overflow-y: auto` directly on `.output-body` overrides that at the content level.

---

## Change 2 — Character limit 3000 → 5000

Three occurrences updated:

| Location | Line | Before | After |
|---|---|---|---|
| HTML `<span>` display | 338 | `0 / 3000` | `0 / 5000` |
| HTML `<textarea>` attribute | 342 | `maxlength="3000"` | `maxlength="5000"` |
| JS constant | 403 | `const MAX = 3000;` | `const MAX = 5000;` |

The `MAX` constant drives both the counter display (`${len} / ${MAX}`) and the `.warn` threshold (`len > MAX * .85`), so no further edits were needed.

---

## Change 3 — Clear button ("Tyhjennä")

### Placement decision

Added as the first child of `.action-row`, to the **left** of the "Muunna selkokielelle" button. The action-row flex layout was changed from `justify-content: flex-end` to `justify-content: space-between` (with `align-items: center` for vertical alignment) so the clear button sits on the left and the convert button remains on the right.

### Styling decision

Used the existing `.btn-ghost` class — already defined in the stylesheet as:
- `background: transparent`
- `color: var(--mid)` (muted grey, not the primary `var(--ink)`)
- `border: 1px solid var(--rule)`
- `font-size: .75rem` (smaller than `.btn-primary` at `.82rem`)
- `padding: .35rem .9rem` (smaller than `.btn-primary`)

No new CSS was added. The ghost style is already visually secondary to the primary button.

### HTML added (line 348)

```html
<button class="btn btn-ghost" id="clear-btn" type="button">Tyhjennä</button>
```

### JS added

```js
const btnClear = document.getElementById('clear-btn');

btnClear.addEventListener('click', () => {
  inputEl.value = '';
  countEl.textContent = `0 / ${MAX}`;
  countEl.className = 'char-count';
  btnConv.disabled = true;
  outputEl.textContent = '';
  outputEl.classList.remove('visible');
  outputWrap.className = 'output state-empty';
  copyRow.classList.remove('visible');
});
```

Behaviour:
- Clears textarea content
- Resets character counter to `0 / 5000` and removes `.warn`/`.over` classes
- Re-disables the convert button (consistent with empty-input state)
- Clears the output text element
- Returns output wrapper to `state-empty` (shows "Tulos ilmestyy tähän" placeholder)
- Hides the copy row
- Makes no API call
- Is never disabled (`disabled` attribute is not set)

---

## API_URL confirmation

```js
const API_URL = '/api/translate'; // PRODUCTION — change to 'http://localhost:8000/api/translate' for local dev
```

Relative path `/api/translate` is intact and unchanged.
