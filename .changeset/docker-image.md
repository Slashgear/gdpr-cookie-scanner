---
"@slashgear/gdpr-cookie-scanner": minor
---

feat: add Docker image for containerised usage

A `Dockerfile` is now included at the root of the repository, enabling
`gdpr-scan` to be run in any environment that supports Docker without
needing a local Node.js or Playwright installation.

The image uses a two-stage build:

- **Builder** (`node:24-slim`) — compiles TypeScript to `dist/`
- **Runtime** (`node:24-slim` + `playwright install chromium --with-deps`) —
  installs only Chromium and its system dependencies instead of the full
  official Playwright image (which bundles Chromium, Firefox and WebKit).
  This keeps the final image around **400–600 MB** vs ~1.5–1.8 GB for the
  unoptimised approach.

A `.dockerignore` is also included to exclude source files, Git history,
and dev artefacts from the build context.

Usage:

```bash
# Build
docker build -t gdpr-scan .

# Run a scan (mount a local directory to retrieve the reports)
docker run --rm -v $(pwd)/reports:/reports gdpr-scan scan https://example.com -o /reports
```