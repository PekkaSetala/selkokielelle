# Phase 5 Complete — v1.2

## Summary

Two changes made in this session: a new tietosuoja page was created and the index.html footer was updated to link to it. No other changes were made to index.html.

---

## Task 1 — Created frontend/tietosuoja.html

New file at `frontend/tietosuoja.html`.

### Design decisions

- Shares the same CSS variables, font stack, body layout, `.wrap`, `.top`, `.wordmark`, `.tagline`, `hr`, `footer`, and `@keyframes fadein` as index.html — visually identical baseline.
- Section headings use the same `.editor-label` style (`.7rem`, `500` weight, `.07em` letter-spacing, uppercase, `var(--faint)`) applied via `.section h2`.
- Body text uses the same prose style as the output panel (`1rem`, `300` weight, `1.75` line-height).
- `← Takaisin` back-link placed above the wordmark in `.top`, styled in `var(--mid)` muted grey, no underline, hover darkens to `var(--ink)`.
- Footer contains plain text `Tietosuoja ja tietoja palvelusta` — no `<a>` tag, since this is the tietosuoja page itself.
- No `<script>` block — this is a static content page.

### Sections included

1. Mitä tämä palvelu tekee
2. Tietoja ei tallenneta
3. Teksti lähetetään tekoälypalveluun
4. Ei yhteyttä Selkokeskukseen
5. Tekoälymalli

---

## Task 2 — Added tietosuoja link to index.html footer

### Lines changed (index.html)

| Line | Before | After |
|---|---|---|
| footer (was 1 line) | `<a href="https://selkokielelle.online"…>selkokielelle.online</a>` | same, plus `&ensp;·&ensp;` separator and `<a href="tietosuoja.html">Tietosuoja ja tietoja palvelusta</a>` |

The separator `&ensp;·&ensp;` (en-space · en-space) matches the existing footer's typographic style — minimal, no decorative elements. The link uses the existing `footer a` CSS rule already in index.html, so no new CSS was needed.

### Diff (this session only)

```diff
   <footer>
     <a href="https://selkokielelle.online" target="_blank" rel="noopener">selkokielelle.online</a>
+    &ensp;·&ensp;
+    <a href="tietosuoja.html">Tietosuoja ja tietoja palvelusta</a>
   </footer>
```

No other changes were made to index.html in this session.

---

## Confirmation

- API_URL in index.html: `'/api/translate'` — untouched.
- No colour, font, spacing, or JavaScript changes were made to index.html.
