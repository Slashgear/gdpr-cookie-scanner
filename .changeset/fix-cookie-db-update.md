---
"@slashgear/gdpr-cookie-scanner": patch
---

Refresh the vendored Open Cookie Database and fix its monthly update workflow. The fetch script wrote the upstream JSON with 4-space indentation, so every run looked like a change and opened a PR containing only a changeset; it now writes the file in the repository's format. The update workflows also format before diffing, quote the PR title date (titles were ending in "()"), and dispatch CI on the new branch since PRs opened with `GITHUB_TOKEN` don't trigger it.
