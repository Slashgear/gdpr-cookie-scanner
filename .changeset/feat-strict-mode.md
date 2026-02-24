---
"@slashgear/gdpr-cookie-scanner": minor
---

Add `--strict` flag: treat unrecognised cookies and unknown third-party requests as requiring consent.

By default, cookies and network requests that do not match any known pattern are assumed
to be first-party and consent-free (conservative). This avoids false positives but lets
obfuscated or emerging tracking cookies slip through undetected.

With `--strict`, the classifier falls back to `requiresConsent: true` for anything
unrecognised, making the scan more aggressive. Use this when auditing sites where you
suspect custom tracking solutions not yet in the pattern database.

CLI: `gdpr-scan scan https://example.com --strict`

Programmatic API: `await scan(url, { strict: true })`
