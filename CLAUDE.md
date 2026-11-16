# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

The project uses [Bun](https://bun.sh) (version pinned in `package.json` → `packageManager`, currently 1.4.4) as package manager, script runner and test runner. Node.js ≥ 24 is still required: `tsc` runs on it and the published CLI targets it.

```bash
bun install            # Install dependencies (bun.lock)
bun run build          # Compile TypeScript → dist/ and copy src/data/ → dist/data/
bun run dev            # Watch mode compilation
bun run typecheck      # Type-check without emitting
bun run lint           # oxlint (Bun has no linter, so oxlint stays)
bun run lint:fix       # oxlint --fix
bun run format         # bun fmt (auto-format, config in bunfig.toml → [fmt])
bun run format:check   # bun fmt --check (used in CI)

# Run the CLI after building
node dist/cli.js scan <url>
node dist/cli.js scan <url> -o ./reports --locale fr-FR --verbose
node dist/cli.js list-trackers
```

## Tests

Tests use Bun's built-in test runner (`bun test`). Import helpers from `bun:test` (`describe`, `it`, `expect`, `beforeAll`…), not from Vitest. Test files live in `tests/` and mirror the source structure:

- `tests/analyzers/`, `tests/classifiers/`, `tests/scanner/`, `tests/unit/` — unit tests on pure functions
- `tests/e2e/` — end-to-end scans of local HTML fixtures (`tests/e2e/fixtures/*.html`) served by `tests/helpers/test-server.ts`, run in real Chromium

```bash
bun run test           # unit tests, then e2e tests (120 s timeout per test)
bun run test:watch     # unit tests in watch mode
bun test tests/unit    # run a single folder or file
```

The e2e suite needs a Playwright browser: `npx playwright install chromium-headless-shell`.

**When to write tests:** every new feature or bug fix must include tests. Pure functions (decoders, classifiers, analyzers) are the primary targets. Browser-dependent behaviour (scanner phases, modal detection) is covered by adding a fixture to `tests/e2e/fixtures/` and a case in `tests/e2e/scanner.test.ts`.

**When to update the README:** every new user-facing feature must be documented in `README.md` — CLI flags, output formats, new report sections, etc.

## Commit checklist

Before every commit, always run in order:

```bash
bun run lint        # must show 0 errors (warnings tolerated if pre-existing)
bun run format      # auto-fix formatting — never commit with format issues
bun run typecheck   # must pass with 0 errors
```

Then create a changeset (see below) and commit everything together.

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, etc.).

## Release process

This project uses [Changesets](https://github.com/changesets/changesets).

- **Contributors**: write a `.changeset/<slug>.md` file manually (the interactive CLI doesn't work in non-TTY environments) before every meaningful commit. Use `patch` for bug fixes, `minor` for new features, `major` for breaking changes. The summary should explain *what* changed and *why* — not just restate the diff. Skip for docs/CI-only changes.
- **Maintainers**: merging changesets into `main` triggers the release workflow, which opens a "chore: release new version" PR (bumps version + updates `CHANGELOG.md`). Merging that PR publishes the package to npm, creates the GitHub Release and pushes the Docker image to `ghcr.io` automatically.

## Architecture

This is a TypeScript CLI tool (`gdpr-scan`) that audits websites for GDPR/RGPD cookie consent compliance using Playwright. It produces reports in English (HTML by default; Markdown, JSON, CSV and PDF on demand). It can also be used as a library through `src/index.ts` (`scan()`, `Scanner`, `ReportGenerator`).

### Scan pipeline (`src/scanner/index.ts`)

The scanner runs **4 sequential phases** using real Chromium browsers:

1. **Phase 1** — Load page with no interaction; capture cookies + network requests (`before-interaction`)
2. **Phase 2** — Detect the consent modal/banner (CSS selectors + heuristics). If the first layer has no visible reject button but has a "preferences/customize" button, open it and look for the reject button on the second layer (recorded with `clickDepth: 2`)
3. **Phase 3** — Click the reject button in the same session; capture state (`after-reject`)
4. **Phase 4** — Fresh browser session, load page, click accept; capture state (`after-accept`)

Phase 3 and 4 require two separate browser sessions so cookie state is fully isolated. IAB TCF detection (`src/scanner/tcf.ts`) runs at the end of Phase 1 and is informational only.

`captureCookies()` returns every cookie present in the context, tagged with the current phase. To find what a phase actually added, diff against the previous snapshot with `diffCookies()` (this is how cookies set after reject are computed, so pre-consent cookies are not penalised twice).

### Module responsibilities

- **`src/scanner/browser.ts`** — Playwright browser/context lifecycle helpers
- **`src/scanner/cookies.ts`** — Extract and classify cookies from Playwright context
- **`src/scanner/network.ts`** — Intercept and classify network requests via Playwright events
- **`src/scanner/consent-modal.ts`** — Detect consent modal by trying known CMP selectors (`CMP_SELECTORS`) then falling back to DOM heuristics (`HEURISTIC_SELECTORS`); extracts buttons/checkboxes with visual properties (font size, bounding box, contrast ratio, click depth) needed for dark-pattern detection; probes the second layer when refusal is not on the first one
- **`src/scanner/tcf.ts`** — Detect IAB TCF (`__tcfapi`, consent string cookies)
- **`src/classifiers/cookie-classifier.ts`** — Pattern-match cookie names against a static list to assign `CookieCategory` and `requiresConsent`
- **`src/classifiers/cookie-lookup.ts`** — Lookup in the vendored Open Cookie Database (see below)
- **`src/classifiers/network-classifier.ts`** — Look up request hostnames in `TRACKER_DB` and match URL patterns against `PIXEL_PATTERNS`
- **`src/classifiers/tracker-list.ts`** — Static database of tracker domains by category
- **`src/analyzers/compliance.ts`** — Scores 4 dimensions (0–25 each) and surfaces `DarkPatternIssue` objects: consent validity, easy refusal, transparency, cookie behavior
- **`src/analyzers/wording.ts`** — Text analysis of button labels and modal copy
- **`src/analyzers/colour.ts`** — Colour nudging detection (green accept vs grey/red reject)
- **`src/analyzers/tcf-decoder.ts`** — Decode TCF v2 consent strings (purposes, vendors)
- **`src/report/generator.ts`** — Renders report files from `ScanResult` in the requested formats (`-f md,html,json,csv,pdf`, default `html`). Markdown output is a single file (`gdpr-report-*.md`) combining the compliance report, the checklist and the cookie inventory, tidied with `bun fmt` when Bun is available (best-effort)
- **`src/report/html.ts`** — Self-contained HTML report (also the source of the PDF)
- **`src/report/pdf.ts`** — Prints the HTML report to PDF with Playwright
- **`src/types.ts`** — All shared TypeScript interfaces (`ScanResult`, `ScanOptions`, `ComplianceScore`, `ConsentModal`, etc.)

### Compliance scoring

Each of the 4 score dimensions starts at 25 and gets deducted based on detected issues:

- `consentValidity` — pre-ticked boxes, misleading wording, missing info
- `easyRefusal` — absent/buried reject button, click asymmetry, visual asymmetry
- `transparency` — no granular controls, missing info fields
- `cookieBehavior` — non-essential cookies/trackers before consent, consent-requiring cookies set after reject (only the ones added after the click)

Grade thresholds: A ≥ 90, B ≥ 75, C ≥ 55, D ≥ 35, F < 35. Exit codes: `0` success, `1` below the `--fail-on` threshold (default `F`), `2` scan error.

### Module system

The project uses `"type": "module"` with `"moduleResolution": "NodeNext"`. All local imports **must** include the `.js` extension even for `.ts` source files.

## Cookie database (Open Cookie Database)

The file `src/data/open-cookie-database.json` is vendored from
https://github.com/jkwakman/Open-Cookie-Database (Apache 2.0).

To update manually:

```bash
bun run update:ocd   # fetches latest JSON, overwrites src/data/open-cookie-database.json
```

A GitHub Actions workflow (`.github/workflows/update-cookie-db.yml`) runs this
automatically on the 1st of each month and opens a PR if the file changed.

The lookup module (`src/classifiers/cookie-lookup.ts`) builds an exact-match index
and a wildcard-prefix index at startup. `src/data/` is copied to `dist/data/` by
`scripts/copy-data.mjs` as part of the `bun run build` step.

## Tracker database

`src/classifiers/tracker-list.ts` is refreshed by `bun run update-trackers`
(`bun run update-trackers:dry` to preview), which merges Disconnect.me and
DuckDuckGo Tracker Radar entries. `.github/workflows/update-trackers.yml` runs it
on the 1st of each month and opens a PR.

