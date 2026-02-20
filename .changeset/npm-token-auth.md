---
"@slashgear/gdpr-cookie-scanner": minor
---

chore: simplify npm publishing — token-based auth, no GitHub Packages

The release pipeline now publishes exclusively to npmjs.org using a classic
NPM_TOKEN secret. GitHub Packages publishing and GitHub Releases creation have
been removed to reduce complexity. OIDC trusted publishing has been dropped in
favour of the more straightforward token approach.
