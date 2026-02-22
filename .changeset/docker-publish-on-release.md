---
"@slashgear/gdpr-cookie-scanner": patch
---

Publish Docker image automatically on every release.

When `changesets/action` publishes a new version to npm, the release workflow now logs in to the GitHub Container Registry (ghcr.io) and pushes the Docker image tagged with both `latest` and the exact semver version (e.g. `ghcr.io/slashgear/gdpr-cookie-scanner:2.0.2`). The `packages: write` permission is added to the job for this purpose.