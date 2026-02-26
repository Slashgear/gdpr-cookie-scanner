# gdpr-cookie-scanner

[![CI](https://github.com/Slashgear/gdpr-cookie-scanner/actions/workflows/ci.yml/badge.svg)](https://github.com/Slashgear/gdpr-cookie-scanner/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@slashgear/gdpr-cookie-scanner?logo=npm)](https://www.npmjs.com/package/@slashgear/gdpr-cookie-scanner)
[![npm downloads](https://img.shields.io/npm/dw/@slashgear/gdpr-cookie-scanner?logo=npm&label=downloads%2Fweek)](https://www.npmjs.com/package/@slashgear/gdpr-cookie-scanner)
[![License: MIT](https://img.shields.io/npm/l/@slashgear/gdpr-cookie-scanner)](LICENSE)
[![Node ≥ 24](https://img.shields.io/node/v/@slashgear/gdpr-cookie-scanner?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Playwright](https://img.shields.io/badge/Playwright-✓-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Docker image](https://img.shields.io/badge/docker%20image-~500%20MB-2496ed?logo=docker&logoColor=white)](https://ghcr.io/slashgear/gdpr-cookie-scanner)

A CLI tool that **automates a subset of GDPR cookie consent checks** on any website — consent modal detection, dark patterns, cookie behaviour before/after interaction, and network trackers. It produces a scored report (0–100) with a per-rule checklist and a cookie inventory.

> [!IMPORTANT]
> **This tool is not a substitute for a full GDPR compliance audit.**
> It automates the checks that _can_ be automated (observable browser behaviour), but GDPR compliance is broader: lawful basis, data retention policies, DPA agreements, privacy notices, subject rights, and more are **out of scope**.
> A grade of **A does not mean your site is GDPR-compliant** — it means it passes the automated checks covered by this tool.

### What problem does it solve?

Manually verifying that a consent banner behaves correctly — no cookies dropped before consent, reject as easy as accept, no pre-ticked boxes, no trackers firing before interaction — is tedious and hard to do consistently across environments or over time. `gdpr-scan` makes these checks **repeatable, scriptable, and CI-friendly**, giving DPOs, developers, and privacy engineers a fast feedback loop on the most common consent implementation mistakes.

## Installation

```bash
npm install -g @slashgear/gdpr-cookie-scanner
npx playwright install chromium
```

Or run without installing:

```bash
npx @slashgear/gdpr-cookie-scanner scan https://example.com
# Playwright is still required the first time:
npx playwright install chromium
```

## Docker

No Node.js required — pull and run directly:

```bash
docker run --rm \
  -v $(pwd)/reports:/reports \
  ghcr.io/slashgear/gdpr-cookie-scanner \
  scan https://example.com -o /reports
```

The image is published to [GitHub Container Registry](https://ghcr.io/slashgear/gdpr-cookie-scanner)
on every release and supports `linux/amd64` and `linux/arm64`.

> [!NOTE]
> The image is ~500 MB compressed (~1.2 GB unpacked). This is inherent to shipping a full Chromium
> browser — significantly smaller than the official Playwright image (~1.8 GB) which bundles all
> three browser stacks. No browser installation step is needed when using Docker.

## Usage

```bash
gdpr-scan scan <url> [options]
```

### Options

| Option                   | Default          | Description                                                                                                                       |
| ------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `-o, --output <dir>`     | `./gdpr-reports` | Output directory for the report                                                                                                   |
| `-t, --timeout <ms>`     | `30000`          | Navigation timeout                                                                                                                |
| `-f, --format <formats>` | `html`           | Output formats: `md`, `html`, `json`, `pdf`, `csv` (comma-separated)                                                              |
| `--viewport <preset>`    | `desktop`        | Viewport preset: `desktop` (1280×900), `tablet` (768×1024), `mobile` (390×844)                                                    |
| `--fail-on <threshold>`  | `F`              | Exit with code 1 if grade is below this letter (`A`/`B`/`C`/`D`/`F`) or score is below this number (`0–100`)                      |
| `--json-summary`         | —                | Emit a machine-readable JSON line to stdout after the scan (parseable by `jq`)                                                    |
| `--strict`               | —                | Treat unrecognised cookies and unknown third-party requests as requiring consent                                                  |
| `--screenshots`          | —                | Also capture full-page screenshots after reject and accept interactions (the consent modal is always screenshotted when detected) |
| `-l, --locale <locale>`  | `fr-FR`          | Browser locale                                                                                                                    |
| `-v, --verbose`          | —                | Show full stack trace on error                                                                                                    |

### Examples

```bash
# Basic scan — produces an HTML report by default
gdpr-scan scan https://example.com

# With custom output directory
gdpr-scan scan https://example.com -o ./reports

# Scan in English with full interaction screenshots (reject + accept)
gdpr-scan scan https://example.com --locale en-US --screenshots

# Generate a Markdown report instead
gdpr-scan scan https://example.com -f md

# Generate all formats at once
gdpr-scan scan https://example.com -f md,html,json,pdf,csv

# Scan with a mobile viewport (390×844, iPhone UA)
gdpr-scan scan https://example.com --viewport mobile

# Scan with a tablet viewport (768×1024, iPad UA)
gdpr-scan scan https://example.com --viewport tablet

# Fail (exit 1) if the site is graded below B — useful in CI
gdpr-scan scan https://example.com --fail-on B

# Fail if the numeric score is below 70/100
gdpr-scan scan https://example.com --fail-on 70

# Show the built-in tracker database
gdpr-scan list-trackers
```

## CI integration

Use `--fail-on` to gate a pipeline on compliance: the process exits with code `1` when the threshold is not met, causing the job to fail.

### GitHub Actions

```yaml
# .github/workflows/gdpr.yml
name: GDPR compliance

on:
  schedule:
    - cron: "0 6 * * 1" # every Monday at 06:00 UTC
  workflow_dispatch:

jobs:
  scan:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/slashgear/gdpr-cookie-scanner:latest
    steps:
      - name: Scan
        run: |
          gdpr-scan scan https://example.com \
            --fail-on B \
            --format json,html \
            -o /tmp/reports

      - name: Upload report
        if: always() # keep the report even when the scan fails
        uses: actions/upload-artifact@v4
        with:
          name: gdpr-report
          path: /tmp/reports/
```

> [!TIP]
> Using `if: always()` on the upload step ensures the report is available even when the job fails due to `--fail-on`.

### GitLab CI

```yaml
# .gitlab-ci.yml
gdpr-scan:
  image: ghcr.io/slashgear/gdpr-cookie-scanner:latest
  stage: test
  script:
    - gdpr-scan scan https://example.com --fail-on B --format json,html -o reports
  artifacts:
    when: always # keep report on failure too
    paths:
      - reports/
    expire_in: 30 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - if: $CI_PIPELINE_SOURCE == "web"
```

### Machine-readable output

Add `--json-summary` to get a single JSON line on stdout after the scan — useful when
you need to parse results in a script or post them to a webhook without reading the full
report file.

```bash
gdpr-scan scan https://example.com --fail-on B --json-summary 2>/dev/null \
  | grep '^{' | jq '{grade: .grade, score: .score, passed: .passed}'
```

The JSON line is always emitted (pass or fail) and contains:

```jsonc
{
  "url": "https://example.com",
  "scanDate": "2026-01-01T00:00:00.000Z",
  "score": 62,
  "grade": "C",
  "passed": false,
  "threshold": "B",
  "breakdown": {
    "consentValidity": 20,
    "easyRefusal": 12,
    "transparency": 15,
    "cookieBehavior": 15,
  },
  "issues": {
    "total": 4,
    "critical": 2,
    "items": [{ "type": "buried-reject", "severity": "critical", "description": "..." }],
  },
  "reportPaths": { "html": "./gdpr-reports/example.com/gdpr-report-example.com-2026-01-01.html" },
}
```

### Threshold reference

| `--fail-on` value | Fails when grade is… | Fails when score is… |
| ----------------- | -------------------- | -------------------- |
| `A`               | B, C, D, or F        | < 90                 |
| `B`               | C, D, or F           | < 75                 |
| `C`               | D or F               | < 55                 |
| `D`               | F                    | < 35                 |
| `F` _(default)_   | F only               | < 35                 |
| `70` _(number)_   | any grade            | < 70                 |

## Programmatic API

The package can be used as a Node.js library — no CLI required.

```bash
npm install @slashgear/gdpr-cookie-scanner
npx playwright install chromium
```

### Quick scan

```ts
import { scan } from "@slashgear/gdpr-cookie-scanner";

const result = await scan("https://example.com");
console.log(result.compliance.grade); // 'A' | 'B' | 'C' | 'D' | 'F'
console.log(result.compliance.totalScore); // 0–100
console.log(result.compliance.issues); // DarkPatternIssue[]
```

All fields of `ScanResult` — cookies, network requests, modal analysis, compliance score — are available in the returned object.

### Options

```ts
const result = await scan("https://example.com", {
  locale: "fr-FR", // browser locale, also controls report language
  timeout: 60_000, // navigation timeout in ms (default: 30 000)
  screenshots: true, // also capture after-reject and after-accept screenshots (modal is always screenshotted)
  outputDir: "./reports", // where to save screenshots
  verbose: false, // log scanner phases to stdout
  viewport: "mobile", // 'desktop' (default) | 'tablet' | 'mobile'
});
```

### Generating reports

Pass the result to `ReportGenerator` to write files in one or more formats:

```ts
import { scan, ReportGenerator } from "@slashgear/gdpr-cookie-scanner";

const result = await scan("https://example.com", { locale: "fr-FR" });

const generator = new ReportGenerator({
  url: result.url,
  outputDir: "./reports",
  formats: ["html", "json"], // 'md' | 'html' | 'json' | 'pdf' | 'csv'
  locale: "fr-FR",
  timeout: 30_000,
  screenshots: false,
  verbose: false,
});

const paths = await generator.generate(result);
console.log(paths.html); // './reports/example.com/gdpr-report-example.com-2024-01-01.html'
```

### TypeScript types

All interfaces are exported from the package root:

```ts
import type {
  ScanResult,
  ScanOptions,
  ComplianceScore,
  DarkPatternIssue,
  ScannedCookie,
  NetworkRequest,
  ConsentModal,
} from "@slashgear/gdpr-cookie-scanner";
```

## How it works

```mermaid
flowchart LR
    URL([URL]) --> Chromium[Chromium] --> Classify[Classify] --> Score[Score] --> Report[Report]
```

A real Chromium browser loads the page, interacts with the consent modal (reject then accept in a fresh session), and captures cookies and network requests at each step. Results are classified, scored across 4 compliance dimensions, and rendered into one or more report files depending on `--format`.

## Generated reports

Each scan produces up to 5 file types in `<output-dir>/<hostname>/`:

| Format | Files                                                          | Description                                                                                                                                        |
| ------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `md`   | `gdpr-report-*.md`, `gdpr-checklist-*.md`, `gdpr-cookies-*.md` | Main compliance report, per-rule checklist with legal references, and deduplicated cookie inventory                                                |
| `html` | `gdpr-report-*.html`                                           | Self-contained styled report — grade badge, score cards, dark-pattern issues, cookie and tracker tables. Opens in any browser, no dependencies     |
| `json` | `gdpr-report-*.json`                                           | Full raw scan result for programmatic processing or CI integration                                                                                 |
| `pdf`  | `gdpr-report-*.pdf`                                            | PDF built from the Markdown reports via Playwright                                                                                                 |
| `csv`  | `gdpr-cookies-*.csv`                                           | Deduplicated cookie inventory with OCD descriptions, platform, retention period and privacy link — ready for spreadsheet review or DPA submissions |

All formats contain:

- **Global score** (0–100) and **grade** A/B/C/D/F
- Modal analysis: buttons, checkboxes, font size, screenshots
- Detected dark patterns (missing reject button, visual asymmetry, pre-ticked boxes, misleading wording…)
- Cookie table before interaction, after reject, after accept
- Network tracker requests by phase
- Targeted recommendations
- Legal references (RGPD, ePrivacy directive, CEPD guidelines, CNIL 2022)

## Scoring

The score is made up of 4 criteria (25 points each):

| Criterion            | What is evaluated                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Consent validity** | Pre-ticked boxes, ambiguous wording, missing information                                       |
| **Easy refusal**     | Missing or buried reject button, click asymmetry, visual asymmetry                             |
| **Transparency**     | Granular controls, mention of purposes / third parties / duration / right to withdraw          |
| **Cookie behavior**  | Non-essential cookies before consent, cookies persisting after reject, trackers before consent |

**Grade scale:** A ≥ 90 · B ≥ 75 · C ≥ 55 · D ≥ 35 · F < 35

**Exit codes:** `0` success · `1` threshold not met (see `--fail-on`) · `2` scan error

## Detected dark patterns

| Type                    | Severity         | Description                                           |
| ----------------------- | ---------------- | ----------------------------------------------------- |
| `no-reject-button`      | Critical         | No reject option in the modal                         |
| `buried-reject`         | Critical         | Reject button not present at the first layer          |
| `click-asymmetry`       | Critical         | Rejecting requires more clicks than accepting         |
| `pre-ticked`            | Critical         | Pre-ticked checkboxes (invalid under RGPD Recital 32) |
| `auto-consent`          | Critical         | Non-essential cookies/trackers before any consent     |
| `asymmetric-prominence` | Warning          | Accept button significantly larger than reject        |
| `nudging`               | Warning          | Accept button font larger than reject button font     |
| `misleading-wording`    | Warning/Critical | Ambiguous labels ("OK", "Continue"…)                  |
| `missing-info`          | Warning          | Mandatory information absent from the text            |

## Automatically recognised CMPs

Axeptio, Cookiebot, OneTrust, Didomi, Tarteaucitron, Usercentrics, and about twenty others via their specific CSS selectors. A heuristic fallback (fixed/sticky element with cookie-related text) covers custom banners.

## Development

```bash
pnpm dev          # Watch-mode compilation
pnpm typecheck    # Type-check without compiling
pnpm lint         # oxlint
pnpm format       # oxfmt
```

## Release

Releases are published automatically to [npm](https://www.npmjs.com/package/@slashgear/gdpr-cookie-scanner) via [Changesets](https://github.com/changesets/changesets). See [CONTRIBUTING.md](CONTRIBUTING.md) for the release process.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md) code of conduct.
