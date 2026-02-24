---
"@slashgear/gdpr-cookie-scanner": minor
---

Add `--json-summary` flag to emit a machine-readable JSON line on stdout after the scan.

CI pipelines that use `--fail-on` previously had to parse the full report file to extract
score, grade, and issue details programmatically. With `--json-summary`, a single JSON line
is written to stdout at the end of every scan (pass or fail), containing the URL, score,
grade, pass/fail status, threshold, score breakdown, and issue list.

```bash
gdpr-scan scan https://example.com --fail-on B --json-summary \
  | grep '^{' | jq '{grade: .grade, passed: .passed}'
```
