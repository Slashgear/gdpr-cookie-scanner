---
"@slashgear/gdpr-cookie-scanner": patch
---

feat: add IAB TCF detection and consent string decoding

The scanner now detects TCF (Transparency & Consent Framework) implementations on scanned pages.
It checks for the `__tcfapi` JavaScript API, the `__tcfapiLocator` iframe, and `euconsent-v2`/`euconsent` cookies.
When a consent string is found, it is decoded (TCF v1 and v2 core segments) to extract CMP identity,
declared purposes, legitimate interests, and special features opt-ins.

This data is purely informational and does not affect the compliance score.
It appears as a new section in both the HTML and Markdown reports.
