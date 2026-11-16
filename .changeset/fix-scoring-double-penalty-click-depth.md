---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix two scoring bugs:

- **No more double penalty after reject.** `captureCookies()` tags every cookie present in the browser with the current phase, so a non-essential cookie set before any interaction was counted again as "persisting after rejection" and penalised twice. The after-reject check (and the matching checklist row) now only counts cookies the site added after the reject click, using `diffCookies()` against the pre-interaction snapshot.
- **Click asymmetry is now actually detected.** `clickDepth` was hard-coded to `1`, so the "reject requires more clicks than accept" check could never fire. When the first layer has no visible reject button but has a "preferences/customize" button, the scanner now opens it and looks for the reject button there, recording `clickDepth: 2`. Reject buttons hidden on the first layer are no longer counted as one-click refusal.
