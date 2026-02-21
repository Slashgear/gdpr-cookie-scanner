---
"@slashgear/gdpr-cookie-scanner": minor
---

feat: add multi-format report output and a standalone HTML report

The CLI now accepts a `-f, --format <formats>` option (comma-separated, defaults
to `md,pdf`) that controls which report files are produced. Supported values:
`md`, `html`, `json`, `pdf`.

The new `html` format generates a self-contained, styled HTML report directly from
the scan result — no external dependencies, no network requests. It includes a
colour-coded grade badge, per-dimension score cards with progress bars,
dark-pattern issue cards, modal details, cookies by phase, network tracker tables,
recommendations, and a compliance checklist.

This makes the report easier to share (single file, opens in any browser) and
provides a better reading experience than the Markdown version.