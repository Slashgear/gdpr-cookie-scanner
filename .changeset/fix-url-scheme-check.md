---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix incomplete URL scheme check in privacy policy link detection (CodeQL alert #2).

`findPrivacyPolicyUrl` only blocked `javascript:` and `#` hrefs. An attacker-controlled
page could bypass this check with `data:`, `vbscript:`, or a mixed-case variant such as
`JavaScript:` (the check was not case-normalised). The fix adds `data:` and `vbscript:`
to the blocklist and lowercases the href before comparing scheme prefixes.