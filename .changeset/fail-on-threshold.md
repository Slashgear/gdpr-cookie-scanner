---
"@slashgear/gdpr-cookie-scanner": minor
---

Add `--fail-on` option to the `scan` command to exit with code 1 when the compliance score falls below a specified threshold.

The threshold can be expressed as a **letter grade** (`A`, `B`, `C`, `D`, `F`) or a **numeric score** (`0–100`). Defaults to `F` (preserves existing behaviour).

Examples:
- `--fail-on B` — fail if the site scores below B (i.e. grade C, D, or F)
- `--fail-on 70` — fail if the total score is below 70/100

Useful for CI pipelines where you want to enforce a minimum compliance level.

The README now includes ready-to-use examples for **GitHub Actions** and **GitLab CI** using the Docker image.