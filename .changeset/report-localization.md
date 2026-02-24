---
"gdpr-scan": minor
---

Add i18n support: reports can now be generated in English, French, or German

The `--locale` flag was previously accepted but ignored during report generation — all output was hardcoded in English. This change wires locale throughout the entire pipeline:

- New `src/i18n/index.ts` module with ~130 translation keys in EN/FR/DE and a `t(locale, key, vars?)` helper with template interpolation
- `resolveLocale()` maps BCP-47 tags (`fr-FR`, `de-DE`, …) to the three supported locales, defaulting to `en`
- All report text (section titles, scores, recommendations, dark-pattern descriptions, checklist labels, cookie table headers, …) is now rendered in the requested language
- HTML reports set `<html lang="…">` and format dates with the correct locale
- Added `key?: string` on `DarkPatternIssue` for locale-independent matching of missing-info issues in the checklist
