---
"@slashgear/gdpr-cookie-scanner": patch
---

Switch Playwright browser from `chromium` to `chromium-headless-shell` in Docker and CI.

The headless-shell binary is a stripped-down Chromium build without UI layers, reducing the Docker image size by ~150–200 MB. All scanner features (cookie capture, network interception, DOM interaction, screenshots, bounding boxes) are fully supported. The scanner already runs in headless mode exclusively.
