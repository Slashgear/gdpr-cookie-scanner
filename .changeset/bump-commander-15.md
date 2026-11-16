---
"@slashgear/gdpr-cookie-scanner": patch
---

Upgrade `commander` from 14 to 15. Commander 14 is now in maintenance mode; 15 is ESM-only and needs Node ≥ 22.12, both already satisfied by this ESM package targeting Node 24. The CLI does not use `--no-*` options, so the one behavioural change (implicit defaults for negated flags) does not apply.
