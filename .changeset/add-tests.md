---
"@slashgear/gdpr-cookie-scanner": minor
---

test: add Vitest unit and E2E test suite

Introduces a comprehensive test suite using Vitest:

- **Unit tests** (76 tests) covering the three pure-logic modules:
  `cookie-classifier`, `network-classifier`, `wording` analyzer, and
  `compliance` analyzer — verifying scoring rules, dark pattern detection,
  and cookie/tracker classification across French and English content.

- **E2E tests** (14 tests) that spin up a local HTTP server serving three
  HTML fixtures (compliant banner, non-compliant banner, no modal) and run
  the full Playwright scanner against them, asserting detected modals,
  cookie behavior, and compliance grades.

- **CI integration**: the GitHub Actions workflow now installs Playwright's
  Chromium browser and runs `pnpm test` after every build, blocking merges
  on test failures.
