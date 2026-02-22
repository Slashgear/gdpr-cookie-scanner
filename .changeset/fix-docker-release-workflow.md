---
"gdpr-cookie-scanner": patch
---

Fix Docker image not being published on release.

The `docker.yml` workflow was triggered on `release: published`, but GitHub Actions blocks workflows using `GITHUB_TOKEN` from cascading into other workflows, so the Docker build never ran. Merged the Docker build steps directly into `release.yml`, gated on `changesets/action` reporting `published == 'true'`.