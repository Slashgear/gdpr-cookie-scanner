---
"@slashgear/gdpr-cookie-scanner": patch
---

Replace oxfmt with Bun's built-in formatter (`bun fmt`, available since Bun 1.4). This drops a dev dependency, and Markdown reports are now tidied with `bun fmt` when Bun is available, which also covers the Docker image (oxfmt was a dev dependency, so production installs never formatted them).
