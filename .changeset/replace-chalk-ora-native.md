---
"@slashgear/gdpr-cookie-scanner": patch
---

Replace `chalk` and `ora` with lighter, zero/minimal-dependency alternatives.

- `chalk` → `node:util styleText` (Node.js built-in, no dependency at all)
- `ora` → `nanospinner` (single dependency, same spinner UX)

This reduces the install footprint and removes two runtime dependencies in favour of the e18e ecosystem recommendations. The only visual difference is that the orange score color (formerly `chalk.hex("#FFA500")`) is now rendered as `yellowBright`, since `styleText` does not support hex colors.
