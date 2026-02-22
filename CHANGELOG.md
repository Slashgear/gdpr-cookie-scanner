# @slashgear/gdpr-cookie-scanner

## 2.0.0

### Major Changes

- 98880ac: feat!: require Node.js 24 LTS (breaking change for Node 20/22 users)

  Node.js 24 became Active LTS in October 2025. This is a breaking change for
  users running Node 20 or 22. A `.nvmrc` file is provided so `nvm use`
  automatically selects the correct version when entering the project directory.

### Minor Changes

- bd769d6: Add GitHub Pages landing page with live GDPR reports

  Adds a static landing page (`docs/`) hosted on GitHub Pages that showcases the tool
  with real scan results for 6 tech sites (reddit.com, dev.to, github.com, gitlab.com,
  stackoverflow.com, npmjs.com). The page is vanilla HTML/CSS with dark mode support
  and links directly to the rendered Markdown reports on GitHub.

  Also adds `.github/workflows/pages.yml` to automatically deploy `docs/` on every
  push to `main` that touches that directory.

- cf9c42a: feat: add Docker image for containerised usage

  A `Dockerfile` is now included at the root of the repository, enabling
  `gdpr-scan` to be run in any environment that supports Docker without
  needing a local Node.js or Playwright installation.

  The image uses a two-stage build:

  - **Builder** (`node:24-slim`) — compiles TypeScript to `dist/`
  - **Runtime** (`node:24-slim` + `playwright install chromium --with-deps`) —
    installs only Chromium and its system dependencies instead of the full
    official Playwright image (which bundles Chromium, Firefox and WebKit).
    This keeps the final image around **400–600 MB** vs ~1.5–1.8 GB for the
    unoptimised approach.

  A `.dockerignore` is also included to exclude source files, Git history,
  and dev artefacts from the build context.

  Usage:

  ```bash
  # Build
  docker build -t gdpr-scan .

  # Run a scan (mount a local directory to retrieve the reports)
  docker run --rm -v $(pwd)/reports:/reports gdpr-scan scan https://example.com -o /reports
  ```

- 5cba8a8: feat: add multi-format report output and a standalone HTML report

  The CLI now accepts a `-f, --format <formats>` option (comma-separated, defaults
  to `md,pdf`) that controls which report files are produced. Supported values:
  `md`, `html`, `json`, `pdf`.

  The new `html` format generates a self-contained, styled HTML report directly from
  the scan result — no external dependencies, no network requests. It includes a
  colour-coded grade badge, per-dimension score cards with progress bars,
  dark-pattern issue cards, modal details, cookies by phase, network tracker tables,
  recommendations, and a compliance checklist.

  This makes the report easier to share (single file, opens in any browser) and
  provides a better reading experience than the Markdown version.

## 1.4.0

### Minor Changes

- 5af8678: test: add Vitest unit and E2E test suite

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

## 1.3.0

### Minor Changes

- 1b7d5da: feat: check for privacy policy link in the consent modal and on the page

  Two new automated checks are now run on every scan:

  - **Privacy policy link in the modal** — the consent interface should include a
    link to the privacy policy (GDPR Art. 13). Absence deducts 5 points from
    Transparency and surfaces a warning in the checklist.
  - **Privacy policy link on the page** — a privacy policy must be accessible from
    every page (typically via a footer link). Absence deducts 3 points from
    Transparency and surfaces a warning in the checklist.

  The detected URL (if any) is shown in the modal analysis section of the main
  report and in both new checklist rows.

## 1.2.1

### Patch Changes

- 00fa85c: fix: update broken reference links in the compliance checklist

  The CNIL cookie recommendation URL and the EDPB Guidelines 03/2022 on dark
  patterns had both moved. Updated to the current working URLs.

## 1.2.0

### Minor Changes

- 15deb9e: chore: simplify npm publishing — token-based auth, no GitHub Packages

  The release pipeline now publishes exclusively to npmjs.org using a classic
  NPM_TOKEN secret. GitHub Packages publishing and GitHub Releases creation have
  been removed to reduce complexity. OIDC trusted publishing has been dropped in
  favour of the more straightforward token approach.

## 1.1.0

### Minor Changes

- 730e4d2: feat: generate a merged PDF report alongside the Markdown files

  A single `gdpr-report-{hostname}-{date}.pdf` is now produced at the end of
  each scan, combining the main compliance report, the checklist, and the cookie
  inventory into one A4 document. The PDF is rendered via the Playwright browser
  already installed as a dependency. The CLI prints the PDF path on completion.

## 1.0.1

### Patch Changes

- 56bfed3: fix: isolate navigation timeout in accept phase so cookies are captured even when networkidle times out

  The accept phase (phase 4) previously wrapped navigation and cookie capture in a single try/catch, causing the entire phase to be skipped when `networkidle` timed out on heavy sites. The navigation timeout is now isolated so detection and capture proceed regardless.

  feat: add cookie inventory report (`gdpr-cookies-*.md`)

  A new per-scan file lists all unique cookies detected across all three phases (before consent, after acceptance, after rejection) with their category, phases of presence, expiry, consent requirement, and an empty "Description / Purpose" column for the DPO or technical owner to fill in.

  feat: add hyperlinks to legal references in checklist

  Every reference in the compliance checklist (GDPR Art. 7, EDPB Guidelines 03/2022, CNIL Recommendation 2022, etc.) now links to the official source document.

## 1.0.0

### Major Changes

- Initial stable release — 4-phase GDPR compliance scanner with consent modal detection, dark pattern analysis, cookie/tracker behavior checks, and Markdown report + checklist generation.
