---
"@slashgear/gdpr-cookie-scanner": minor
---

feat: generate a merged PDF report alongside the Markdown files

A single `gdpr-report-{hostname}-{date}.pdf` is now produced at the end of
each scan, combining the main compliance report, the checklist, and the cookie
inventory into one A4 document. The PDF is rendered via the Playwright browser
already installed as a dependency. The CLI prints the PDF path on completion.
