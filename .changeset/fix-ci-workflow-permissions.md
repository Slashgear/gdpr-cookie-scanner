---
"@slashgear/gdpr-cookie-scanner": patch
---

Restrict CI workflow to least-privilege permissions (CodeQL alert #1).

The CI workflow had no explicit `permissions:` block, meaning the default GitHub Actions
token was granted broad write access to repository contents. Added `permissions: contents: read`
to enforce the minimum permissions required for the job.