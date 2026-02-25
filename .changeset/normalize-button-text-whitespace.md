---
"@slashgear/gdpr-cookie-scanner": patch
---

Normalise button text whitespace before classification.

`classifyButtonType` previously received raw `textContent` that had only been
`.trim()`-ed. CMP HTML templates frequently embed `&nbsp;` (U+00A0), newlines,
or tabs inside button labels, causing pattern matching to silently fail.

A `normalizeText` helper now collapses any whitespace sequence (including
U+00A0 and all Unicode spaces covered by JS `\s`) into a single ASCII space
before the regex is tested. The normalisation is applied in two places:

- `classifyButtonText` (public export) — defensive normalisation of any caller-
  provided string.
- `extractButtons` — the raw `el.textContent()` result is normalised before
  being stored in `ConsentButton.text` and before classification, so the
  report also shows the cleaned label.
