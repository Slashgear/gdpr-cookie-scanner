---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix Docker image tags using lowercase repository name.

`github.repository` can contain uppercase letters (e.g. `Slashgear/gdpr-cookie-scanner`), which is rejected by the OCI registry spec. The image name is now lowercased via `tr '[:upper:]' '[:lower:]'` before being passed to `docker/build-push-action`.