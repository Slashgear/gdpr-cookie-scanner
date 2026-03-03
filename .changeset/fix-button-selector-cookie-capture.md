---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix cookie capture after accept/reject on sites with non-unique button CSS classes

Two bugs prevented cookies from being captured after interacting with the consent modal:

1. **Non-unique button selector** — on sites built with a design system (e.g. Scaleway), all CMP buttons share identical CSS classes. The generated selector matched multiple elements and Playwright resolved to the first one, which was often hidden. The selector generator now checks that the class-based selector is unique in the DOM; if not, it falls back to Playwright's `:has-text()` pseudo-selector so each button is targeted individually.

2. **Page navigation not awaited** — some CMPs trigger a full page reload when the user accepts or rejects. The scanner was capturing cookies after a fixed delay, before the server had time to set them via `Set-Cookie`. The delay is now replaced by `waitForLoadState("networkidle")` so cookies are captured once the page (and any post-navigation requests) has settled.