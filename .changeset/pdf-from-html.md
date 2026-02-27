---
"@slashgear/gdpr-cookie-scanner": minor
---

Generate PDF directly from the HTML report instead of Markdown

The PDF output now uses the same styled HTML report as the browser view,
giving a visually consistent result (score grid, coloured badges, issue cards,
modal screenshot when available) instead of the previous plain Markdown → HTML
conversion.

`@media print` rules added to the HTML report: colour-accurate printing
(`print-color-adjust: exact`), page-break hints on sections and table rows,
screenshot height capped at 280px, and link colours reset to inherit.

`buildHtmlBody` and `wrapHtml` methods removed from `ReportGenerator` as they
are no longer needed. The `marked` dependency is no longer imported by the
generator.