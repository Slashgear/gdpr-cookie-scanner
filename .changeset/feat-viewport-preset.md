---
"@slashgear/gdpr-cookie-scanner": minor
---

Add `--viewport` option to scan with desktop, tablet, or mobile browser dimensions.

All scans previously used a fixed 1280×900 desktop viewport. Many consent banners
have different layouts on mobile (bottom sheets, full-screen overlays) that can only
be tested with the correct viewport and user-agent.

Three presets are available:

| Preset    | Dimensions | User-agent        |
|-----------|------------|-------------------|
| `desktop` | 1280×900   | Chrome on macOS   |
| `tablet`  | 768×1024   | Safari on iPad    |
| `mobile`  | 390×844    | Safari on iPhone  |

CLI: `gdpr-scan scan https://example.com --viewport mobile`

Programmatic API: `await scan(url, { viewport: 'mobile' })`

Default is `desktop` — no change to existing behaviour.
