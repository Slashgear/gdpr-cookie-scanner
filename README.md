# gdpr-cookie-scanner

[![CI](https://github.com/Slashgear/gdpr-report/actions/workflows/ci.yml/badge.svg)](https://github.com/Slashgear/gdpr-report/actions/workflows/ci.yml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

CLI tool to automatically audit the GDPR cookie consent compliance of a website: consent modal, dark patterns, cookies set before/after interaction, network trackers. Generates a detailed Markdown report.

## Installation

```bash
npm install -g @slashgear/gdpr-cookie-scanner
npx playwright install chromium
```

Or run without installing:

```bash
npx @slashgear/gdpr-cookie-scanner gdpr-scan scan https://example.com
# Playwright is still required the first time:
npx playwright install chromium
```

## Usage

```bash
gdpr-scan scan <url> [options]
```

### Options

| Option                  | Default          | Description                     |
| ----------------------- | ---------------- | ------------------------------- |
| `-o, --output <dir>`    | `./gdpr-reports` | Output directory for the report |
| `-t, --timeout <ms>`    | `30000`          | Navigation timeout              |
| `--no-screenshots`      | —                | Disable screenshot capture      |
| `-l, --locale <locale>` | `fr-FR`          | Browser locale                  |
| `-v, --verbose`         | —                | Show full stack trace on error  |

### Examples

```bash
# Basic scan
gdpr-scan scan https://example.com

# With custom output directory
gdpr-scan scan https://example.com -o ./reports

# Scan in English, without screenshots
gdpr-scan scan https://example.com --locale en-US --no-screenshots

# Show the built-in tracker database
gdpr-scan list-trackers
```

## How it works

The scanner runs **4 phases** using a real Chromium browser (Playwright):

1. **Initial load** — The page is loaded without any interaction. All cookies and network requests are captured (`before-interaction`).
2. **Modal analysis** — The consent banner is detected (CSS selectors of known CMPs + DOM heuristics). Buttons are extracted with their visual properties (size, color, contrast ratio).
3. **Reject test** — The "Reject" button is clicked. Cookies and requests are captured (`after-reject`).
4. **Accept test** — A new browser session (clean state) loads the page and clicks "Accept". Cookies and requests are captured (`after-accept`).

## Generated report

The Markdown report contains:

- **Global score** (0–100) and **grade** A/B/C/D/F
- Executive summary
- Modal analysis: buttons, checkboxes, font size, screenshots
- Detected dark patterns (missing reject button, visual asymmetry, pre-ticked boxes, misleading wording…)
- Cookie table before interaction, after reject, after accept
- Network tracker requests by phase
- Targeted recommendations
- Legal references (RGPD, ePrivacy directive, CEPD guidelines, CNIL 2022)

The file is created at: `<output-dir>/gdpr-report-<domain>-<date>.md`

## Scoring

The score is made up of 4 criteria (25 points each):

| Criterion            | What is evaluated                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Consent validity** | Pre-ticked boxes, ambiguous wording, missing information                                       |
| **Easy refusal**     | Missing or buried reject button, click asymmetry, visual asymmetry                             |
| **Transparency**     | Granular controls, mention of purposes / third parties / duration / right to withdraw          |
| **Cookie behavior**  | Non-essential cookies before consent, cookies persisting after reject, trackers before consent |

**Grade scale:** A ≥ 90 · B ≥ 75 · C ≥ 55 · D ≥ 35 · F < 35

The process exits with code `1` if the grade is F, `2` on scan error.

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

Releases are published automatically to [npm](https://www.npmjs.com/package/@slashgear/gdpr-cookie-scanner) and [GitHub Packages](https://github.com/Slashgear/gdpr-report/pkgs/npm/gdpr-cookie-scanner) via [Changesets](https://github.com/changesets/changesets). See [CONTRIBUTING.md](CONTRIBUTING.md) for the release process.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md) code of conduct.
