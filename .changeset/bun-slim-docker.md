---
"@slashgear/gdpr-cookie-scanner": patch
---

chore: switch Docker runtime base to oven/bun:slim

Replaces `node:24-slim` (~200 MB) with `oven/bun:slim` (~90 MB) as the runtime stage base image, saving ~110 MB. The build stage keeps `node:24-slim` (needed for `tsc`). Playwright's `chromium-headless-shell` and its system dependencies are installed normally via `--with-deps` in the runtime stage. Verified locally: `docker run --rm gdpr-bun-test --help` works correctly.
