---
"@slashgear/gdpr-cookie-scanner": minor
---

Merge Markdown output into a single file

`-f md` now produces a single `gdpr-report-<host>-<date>.md` file containing
the compliance report, the checklist, and the cookie inventory separated by
`---` horizontal rules, instead of three separate files.

The separate `gdpr-checklist-*.md` and `gdpr-cookies-*.md` files are no longer
generated.