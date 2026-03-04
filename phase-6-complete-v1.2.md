# Phase 6 — v1.2 Integration Test Results

Date: 2026-03-04

## Backend Tests

All tests run against `http://localhost:8000/api/translate`.

| ID | Test | Result | Detail |
|----|------|--------|--------|
| B1 | Empty input returns 400 | **PASSED** | HTTP 400 |
| B2 | Whitespace-only input returns 400 | **PASSED** | HTTP 400 |
| B3 | Input at 5001 characters returns 400 | **PASSED** | HTTP 400 |
| B4 | Valid Finnish input returns 200 with result field | **PASSED** | HTTP 200 — `{"result":"Sinun täytyy toimittaa hakemus ja liitteet viimeiseen hakupäivään mennessä."}` — no preamble |
| B5 | System prompt slang handling | **PASSED** | HTTP 200 — `{"result":"Muista tarkistaa sosiaalisen median tilisi ja vahvistaa julkaisuja säännöllisesti."}` — "tsekkata", "some", "boostata" absent |

## Frontend Checks

Verified by source inspection of `frontend/index.html` and `frontend/tietosuoja.html`.

| ID | Test | Result | Detail |
|----|------|--------|--------|
| F1 | Page loads without errors | **PASSED** | HTML/JS is syntactically valid; no error-producing code paths on static load |
| F2 | Character counter shows "0 / 5000" on load | **PASSED** | Hard-coded in HTML: `<span class="char-count" id="char-count">0 / 5000</span>` (index.html:338) |
| F3 | Counter updates correctly on every keystroke | **PASSED** | `input` event listener: `countEl.textContent = \`${len} / ${MAX}\`` (index.html:411) |
| F4 | Textarea does not expand the page when filled with long text | **PASSED** | CSS: `height: 300px; overflow-y: auto`; parent `.editor` has `overflow: hidden` (index.html:108–124, 79) |
| F5 | Output area does not expand the page when result is long | **PASSED** | CSS: `.output-body { height: 300px; overflow-y: auto }` (index.html:219–225) |
| F6 | Submit button is disabled during a request | **PASSED** | `btnConv.disabled = true` before fetch; restored in `finally` (index.html:421, 453–454) |
| F7 | Tyhjennä clears textarea, output, resets counter to "0 / 5000" | **PASSED** | Clear handler resets `inputEl.value`, `countEl.textContent = "0 / 5000"`, clears `outputEl.textContent`, returns output to `state-empty` (index.html:458–467) |
| F8 | Footer link navigates to tietosuoja.html | **PASSED** | `<a href="tietosuoja.html">Tietosuoja ja tietoja palvelusta</a>` (index.html:390) |
| F9 | tietosuoja.html back link navigates to index.html | **PASSED** | `<a class="back-link" href="index.html">← Takaisin</a>` (tietosuoja.html:135) |
| F10 | API_URL in index.html is '/api/translate' (relative path) | **PASSED** | `const API_URL = '/api/translate';` (index.html:396) |

## Summary

**15 / 15 tests passed. No failures.**

All backend validation, API response, and slang-handling tests pass. All frontend structural and behavioural checks confirmed by source inspection.
