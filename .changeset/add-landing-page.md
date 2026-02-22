---
"@slashgear/gdpr-cookie-scanner": minor
---

Add GitHub Pages landing page with live GDPR reports

Adds a static landing page (`docs/`) hosted on GitHub Pages that showcases the tool
with real scan results for 6 tech sites (reddit.com, dev.to, github.com, gitlab.com,
stackoverflow.com, npmjs.com). The page is vanilla HTML/CSS with dark mode support
and links directly to the rendered Markdown reports on GitHub.

Also adds `.github/workflows/pages.yml` to automatically deploy `docs/` on every
push to `main` that touches that directory.
