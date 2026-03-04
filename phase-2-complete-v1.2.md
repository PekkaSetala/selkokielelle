# Phase 2 Complete — System Prompt Update

**Date:** 2026-03-04
**Branch at completion:** v1.2

---

## What changed

`SYSTEM_PROMPT` constant in `backend/main.py` replaced with the verbatim v1.2 string from RDM section 8.4.

Changes within the prompt:
1. Added `## VIERASKIELISET SANAT JA SLÄNGI` section between `## RAKENNE` and `## LUKIJA`
2. Added two new ESIMERKKEJÄ lines: `"some" → "sosiaalinen media"` and `"tsekkata" → "tarkistaa"`
3. Removed blank lines between sections (matching verbatim RDM spec)
4. Fixed typo: `"tekemaan"` → `"tekemään"` in TEHTÄVÄN RAJAUS
5. Fixed example: `"1.1.2026 alkaen"` → `"1.1.2026 alusta"` in ESIMERKKEJÄ

Nothing else changed. Imports, endpoints, validation, error messages, max_tokens — all untouched.

## Test result

```
curl -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hakemus tulee lähettää viimeistään hakuajan päättymispäivänä."}'

Response: {"result":"Lähetä hakemus viimeistään viimeisenä hakupäivänä."}
```

- HTTP 200 ✓
- `result` field present ✓
- No preamble ✓
- `## VIERASKIELISET SANAT JA SLÄNGI` section present in SYSTEM_PROMPT ✓

## Deviations

None.

## Open questions

None.
