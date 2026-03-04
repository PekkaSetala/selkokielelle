# Phase 3 Complete — v1.2

## Summary

Two backend limits increased to support longer input texts.

---

## Change 1 — Character limit 3000 → 5000

**File:** `backend/main.py`
**Line:** `if len(text) > 5000:`

The validation check that rejects input exceeding the character limit was updated from 3000 to 5000 characters. The error message text (`"Teksti on liian pitkä"`) is unchanged.

---

## Change 2 — max_tokens 2000 → 4000

**File:** `backend/main.py`
**Key:** `"max_tokens": 4000`

The OpenRouter API call body `max_tokens` was updated from 2000 to 4000. A 5000-character Finnish input can produce a selkokieli output that exceeds 2000 tokens — without this change the result would be silently truncated mid-sentence.

---

## Test Results

**Backend startup:** `uvicorn main:app --host 127.0.0.1 --port 8000 --reload` — started without errors.

**Test A** — input at exactly 5000 characters (`"a " * 2500`):
```
Test A PASSED: HTTP 200
```

**Test B** — input at 5001 characters (`"a" * 5001`):
```
Test B PASSED: HTTP 400
```

Both tests passed on 2026-03-04.
