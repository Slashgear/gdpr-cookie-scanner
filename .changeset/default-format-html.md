---
"@slashgear/gdpr-cookie-scanner": major
---

Change the default output format from `md,pdf` to `html`.

Previously running `gdpr-scan scan <url>` with no `--format` flag produced both a Markdown bundle (3 files) and a PDF — requiring a full Playwright PDF render on every invocation. The HTML report is self-contained, opens in any browser without extra tooling, and is faster to generate, making it a better default for first-time users and CI pipelines alike. Pipelines that relied on the implicit `md` or `pdf` output must now pass `--format md,pdf` explicitly.

Also fixes the erroneous `npx` invocation in the README (issue #22): the correct command is `npx @slashgear/gdpr-cookie-scanner scan <url>`, not `npx @slashgear/gdpr-cookie-scanner gdpr-scan scan <url>`.
