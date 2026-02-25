---
"@slashgear/gdpr-cookie-scanner": minor
---

Add multi-language consent button detection (de, es, it, nl, pl, pt).

Previously, button classification only covered French and English, causing
false "no reject button" findings on sites served in other EU locales.

The fix has two parts:

1. **Locale-aware pattern map** — `ACCEPT_PATTERNS` / `REJECT_PATTERNS` /
   `PREFERENCES_PATTERNS` are replaced by a `PATTERNS_BY_LOCALE` map keyed by
   BCP 47 primary subtag, covering `en`, `fr`, `de`, `es`, `it`, `nl`, `pl`,
   `pt`. Polish patterns use a negative lookbehind instead of `\b` because
   several Polish words end in non-ASCII characters (ć, ę, ó) that fall
   outside JS `\w`.

2. **`<html lang>` detection** — `detectConsentModal` now reads the page's
   declared language from `document.documentElement.lang` and normalises it to
   a primary subtag (e.g. `"de-DE"` → `"de"`). When the language is
   recognised, only that locale's patterns plus English (universal fallback)
   are tested. When the language is missing or unsupported, all available
   patterns are tried — preserving the previous behaviour for unknown pages.

The public export `classifyButtonText(text, lang)` is added for testing and
programmatic use; 56 new unit tests cover every supported locale.
