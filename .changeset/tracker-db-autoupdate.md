---
"@slashgear/gdpr-cookie-scanner": minor
---

feat: add automated tracker DB update script

Adds `scripts/update-trackers.ts`, a maintenance script that fetches
Disconnect.me and DuckDuckGo Tracker Radar and merges new tracker entries
into `src/classifiers/tracker-list.ts`. Manually curated entries (including
`consentRequired: false` overrides like Plausible) are preserved as-is; only
previously unknown domains are appended in a clearly delimited auto-generated
section.

Also adds a monthly GitHub Actions workflow (`.github/workflows/update-trackers.yml`)
that runs the script automatically and opens a PR when new trackers are found.