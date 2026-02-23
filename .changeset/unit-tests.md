---
"@slashgear/gdpr-cookie-scanner": patch
---

Add unit test suite (224 tests) and fix two classifier bugs

Introduces a full vitest test suite covering the four pure-function modules:
`cookie-classifier`, `network-classifier`, `wording` analyzer, and `compliance` analyzer.

Two production bugs were discovered and fixed in the process:

- **`cookie-classifier`**: the YouTube pattern `^(yt-|VISITOR_INFO|YSC|GPS)$` used a `$` anchor
  that prevented `VISITOR_INFO1_LIVE` (the real cookie name) from matching. Split into two
  entries so `VISITOR_INFO` is matched as a prefix.
- **`tracker-list`**: the entry `"facebook.com/tr"` included a URL path, making it unmatchable
  by the hostname-only classifier. Replaced with the dedicated `pixel.facebook.com` hostname.