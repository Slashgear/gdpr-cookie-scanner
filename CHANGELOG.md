# @slashgear/gdpr-cookie-scanner

## 3.5.1

### Patch Changes

- 2893782: fix: copy scripts/ directory into Docker build stage

  The `pnpm build` script now runs `tsc && node scripts/copy-data.mjs` to copy
  the vendored Open Cookie Database into `dist/data/`. The Dockerfile only copied
  `src/` and `tsconfig.json`, so the build stage was missing `scripts/`, causing
  the Docker image build to fail with `Cannot find module '/app/scripts/copy-data.mjs'`.

## 3.5.0

### Minor Changes

- f41d0a0: feat: pre-fill cookie descriptions from Open Cookie Database and add CSV output format

  Cookie reports now automatically include descriptions, platform names, retention
  periods, and privacy-policy links for ~2 000+ recognised cookies, sourced from the
  Open Cookie Database (Apache 2.0, vendored at `src/data/open-cookie-database.json`).

  Previously the Description column in the Markdown cookie inventory was left as a
  `<!-- fill in -->` placeholder. It is now pre-populated whenever the OCD contains a
  matching entry (exact name or wildcard prefix), with the placeholder kept only for
  unrecognised cookies.

  The same enrichment is applied to the HTML report (new Description column in every
  cookie table, with the platform and privacy-policy link surfaced in a tooltip) and to
  the new `csv` output format (`gdpr-cookies-*.csv`), which includes all cookie
  metadata plus the OCD fields in a machine-readable file suitable for DPA submissions
  or spreadsheet review.

  A `pnpm update:ocd` script and a monthly GitHub Actions workflow
  (`.github/workflows/update-cookie-db.yml`) keep the vendored database up to date.

### Patch Changes

- b88dad5: fix: truncate long cookie names with ellipsis in HTML cookie tables

  Cookie names that contain URLs or other unusually long strings (e.g. Optimizely
  session keys) were breaking the table layout in the HTML report. The Name column
  now clamps to 220 px with `text-overflow: ellipsis`; hovering the cell reveals
  the full name via the `title` attribute.

## 3.4.0

### Minor Changes

- 39794dc: Crop consent modal screenshot to the element; make after-reject/accept screenshots opt-in.

  Two behaviour changes:

  **Modal screenshot is now always captured (cropped)**
  The consent modal screenshot (`modal-initial.png`) is taken whenever a modal
  is detected and `outputDir` is set, regardless of the `--screenshots` flag.
  The screenshot is clipped to the bounding box of the modal element instead of
  capturing the full viewport, giving a tighter, more readable image. If the
  bounding box cannot be determined (rare), it falls back to the viewport
  screenshot.

  **`--no-screenshots` replaced by `--screenshots`**
  Previously all three screenshots were enabled by default and `--no-screenshots`
  opted out. Now only the modal screenshot is taken by default; passing
  `--screenshots` additionally captures `after-reject.png` and `after-accept.png`
  (full viewport, as before). The `screenshots` field in `ScanOptions` / the
  programmatic API retains the same type (`boolean`) with updated semantics:
  `false` (default) = modal only; `true` = modal + after-reject + after-accept.

- 6a71a18: Add multi-language consent button detection (de, es, it, nl, pl, pt).

  Previously, button classification only covered French and English, causing
  false "no reject button" findings on sites served in other EU locales.

  The fix has two parts:

  1. **Locale-aware pattern map** — `ACCEPT_PATTERNS` / `REJECT_PATTERNS` /
     `PREFERENCES_PATTERNS` are replaced by a `PATTERNS_BY_LOCALE` map keyed by
     BCP 47 primary subtag, covering `en`, `fr`, `de`, `es`, `it`, `nl`, `pl`,
     `pt`. Polish patterns use a negative lookbehind instead of `\b` because
     several Polish words end in non-ASCII characters (ć, ę, ó) that fall
     outside JS `\w`.

  2. **`<html lang>` detection** — `detectConsentModal` now reads the page's
     declared language from `document.documentElement.lang` and normalises it to
     a primary subtag (e.g. `"de-DE"` → `"de"`). When the language is
     recognised, only that locale's patterns plus English (universal fallback)
     are tested. When the language is missing or unsupported, all available
     patterns are tried — preserving the previous behaviour for unknown pages.

  The public export `classifyButtonText(text, lang)` is added for testing and
  programmatic use; 56 new unit tests cover every supported locale.

### Patch Changes

- ceed240: Add unit tests for `computeContrastRatio`, `parseRgb`, and `relativeLuminance`.

  These three pure functions in `consent-modal.ts` were previously only exercised
  indirectly through the E2E suite. The new test file
  (`tests/scanner/contrast-ratio.test.ts`) covers the happy path, edge cases
  (identical colours, fully transparent rgba, non-integer ratios), and documents
  the known limitations — named colours (`white`, `black`) and hex values (`#fff`)
  return `null` until the parser is extended.

  The functions are now exported so they can be imported by the test suite without
  moving them to a separate module.

- df24a36: Fix consent modal detection for CMPs that start hidden (e.g. Axeptio).

  `MODAL_SELECTORS` was a single flat list where every candidate was required to
  pass `isVisible()`. CMPs such as Axeptio inject their overlay as `display:none`
  during initialisation and reveal it via JS animation a few hundred milliseconds
  later. The visibility check caused the scanner to skip `#axeptio_overlay` and
  fall through to the first matching generic heuristic (e.g. `[id*='consent']`),
  which could be a completely unrelated element.

  The list is now split into two:

  - **`CMP_SELECTORS`** — precise, platform-specific identifiers. DOM presence
    alone is treated as a reliable signal. Once the element is found the scanner
    waits up to 3 s for it to become visible (so button extraction sees an
    interactive state) but proceeds regardless, preventing a slow CMP from
    silently falling back to a wrong heuristic.
  - **`HEURISTIC_SELECTORS`** — broad patterns that could match unrelated
    elements. Visibility is still required to avoid false positives.

- f9efe0b: Normalise button text whitespace before classification.

  `classifyButtonType` previously received raw `textContent` that had only been
  `.trim()`-ed. CMP HTML templates frequently embed `&nbsp;` (U+00A0), newlines,
  or tabs inside button labels, causing pattern matching to silently fail.

  A `normalizeText` helper now collapses any whitespace sequence (including
  U+00A0 and all Unicode spaces covered by JS `\s`) into a single ASCII space
  before the regex is tested. The normalisation is applied in two places:

  - `classifyButtonText` (public export) — defensive normalisation of any caller-
    provided string.
  - `extractButtons` — the raw `el.textContent()` result is normalised before
    being stored in `ConsentButton.text` and before classification, so the
    report also shows the cleaned label.

## 3.3.0

### Minor Changes

- 7c128b9: Add `--json-summary` flag to emit a machine-readable JSON line on stdout after the scan.

  CI pipelines that use `--fail-on` previously had to parse the full report file to extract
  score, grade, and issue details programmatically. With `--json-summary`, a single JSON line
  is written to stdout at the end of every scan (pass or fail), containing the URL, score,
  grade, pass/fail status, threshold, score breakdown, and issue list.

  ```bash
  gdpr-scan scan https://example.com --fail-on B --json-summary \
    | grep '^{' | jq '{grade: .grade, passed: .passed}'
  ```

- faa6da8: Add `--strict` flag: treat unrecognised cookies and unknown third-party requests as requiring consent.

  By default, cookies and network requests that do not match any known pattern are assumed
  to be first-party and consent-free (conservative). This avoids false positives but lets
  obfuscated or emerging tracking cookies slip through undetected.

  With `--strict`, the classifier falls back to `requiresConsent: true` for anything
  unrecognised, making the scan more aggressive. Use this when auditing sites where you
  suspect custom tracking solutions not yet in the pattern database.

  CLI: `gdpr-scan scan https://example.com --strict`

  Programmatic API: `await scan(url, { strict: true })`

- df30f31: Add `--viewport` option to scan with desktop, tablet, or mobile browser dimensions.

  All scans previously used a fixed 1280×900 desktop viewport. Many consent banners
  have different layouts on mobile (bottom sheets, full-screen overlays) that can only
  be tested with the correct viewport and user-agent.

  Three presets are available:

  | Preset    | Dimensions | User-agent       |
  | --------- | ---------- | ---------------- |
  | `desktop` | 1280×900   | Chrome on macOS  |
  | `tablet`  | 768×1024   | Safari on iPad   |
  | `mobile`  | 390×844    | Safari on iPhone |

  CLI: `gdpr-scan scan https://example.com --viewport mobile`

  Programmatic API: `await scan(url, { viewport: 'mobile' })`

  Default is `desktop` — no change to existing behaviour.

### Patch Changes

- 6eb4c3d: Add Fathom, Simple Analytics, Cabin, and Pirsch to the consent-exempt analytics list.

  These tools are cookieless, collect no personal data, and do not cross-reference data
  with other processing — meeting the CNIL conditions for analytics exempt from the
  ePrivacy consent requirement. Only Plausible was previously listed; sites using any
  of these four tools were incorrectly flagged as loading trackers before consent.

  Domains added: `cdn.usefathom.com`, `scripts.simpleanalyticscdn.com`,
  `api.simpleanalytics.io`, `scripts.withcabin.com`, `api.pirsch.io`.

## 3.2.2

### Patch Changes

- f83c693: Restrict CI workflow to least-privilege permissions (CodeQL alert #1).

  The CI workflow had no explicit `permissions:` block, meaning the default GitHub Actions
  token was granted broad write access to repository contents. Added `permissions: contents: read`
  to enforce the minimum permissions required for the job.

- f83c693: Fix incomplete URL scheme check in privacy policy link detection (CodeQL alert #2).

  `findPrivacyPolicyUrl` only blocked `javascript:` and `#` hrefs. An attacker-controlled
  page could bypass this check with `data:`, `vbscript:`, or a mixed-case variant such as
  `JavaScript:` (the check was not case-normalised). The fix adds `data:` and `vbscript:`
  to the blocklist and lowercases the href before comparing scheme prefixes.

## 3.2.1

### Patch Changes

- 9ab986f: Fix: "Tout rejeter" and "rejeter" were not recognised as valid reject buttons.

  The `REJECT_PATTERNS` regex only covered the `refus*` stem (refuser, tout refuser) but missed the `rejet*` stem (rejeter, tout rejeter) which is used by many CMPs including Didomi and OneTrust in French. This caused the scanner to incorrectly report a missing reject button and penalise the easy-refusal score on sites that do provide one.

## 3.2.0

### Minor Changes

- 51e7d6a: Add `--fail-on` option to the `scan` command to exit with code 1 when the compliance score falls below a specified threshold.

  The threshold can be expressed as a **letter grade** (`A`, `B`, `C`, `D`, `F`) or a **numeric score** (`0–100`). Defaults to `F` (preserves existing behaviour).

  Examples:

  - `--fail-on B` — fail if the site scores below B (i.e. grade C, D, or F)
  - `--fail-on 70` — fail if the total score is below 70/100

  Useful for CI pipelines where you want to enforce a minimum compliance level.

  The README now includes ready-to-use examples for **GitHub Actions** and **GitLab CI** using the Docker image.

## 3.1.0

### Minor Changes

- 305c80d: Add programmatic API (`scan()` function and public exports)

  Exposes a `scan(url, options?)` convenience function and re-exports `Scanner`, `ReportGenerator`, and all public TypeScript types from the package entry point (`dist/index.js`).

  This allows using the scanner as a library without going through the CLI:

  ```ts
  import { scan, ReportGenerator } from "@slashgear/gdpr-cookie-scanner";

  const result = await scan("https://example.com", { locale: "fr-FR" });
  console.log(result.compliance.grade);

  // Optionally generate a report
  const generator = new ReportGenerator({
    outputDir: "./reports",
    formats: ["html"],
    ...result,
  });
  const paths = await generator.generate(result);
  ```

  `ScanOptions.outputDir` is now optional: it is only required when screenshots or report generation is needed. `ReportGenerator.generate()` throws a clear error if called without `outputDir`.

- cd4d616: feat: add automated tracker DB update script

  Adds `scripts/update-trackers.ts`, a maintenance script that fetches
  Disconnect.me and DuckDuckGo Tracker Radar and merges new tracker entries
  into `src/classifiers/tracker-list.ts`. Manually curated entries (including
  `consentRequired: false` overrides like Plausible) are preserved as-is; only
  previously unknown domains are appended in a clearly delimited auto-generated
  section.

  Also adds a monthly GitHub Actions workflow (`.github/workflows/update-trackers.yml`)
  that runs the script automatically and opens a PR when new trackers are found.

### Patch Changes

- 578a778: Wire `contrastRatio` into compliance scoring (section B — Easy Refusal).

  The contrast ratio was already computed and displayed in reports but had no effect on the score. A "Refuser" button rendered in grey on white would silently pass. Now:

  - Reject button contrast < 3.0 → critical issue, −10 pts
  - Reject button contrast < 4.5 (WCAG AA) → warning, −5 pts
  - Accept contrast ≥ 1.5× reject contrast → relative asymmetry warning, −3 pts

- 6113643: Add unit test suite (224 tests) and fix two classifier bugs

  Introduces a full vitest test suite covering the four pure-function modules:
  `cookie-classifier`, `network-classifier`, `wording` analyzer, and `compliance` analyzer.

  Two production bugs were discovered and fixed in the process:

  - **`cookie-classifier`**: the YouTube pattern `^(yt-|VISITOR_INFO|YSC|GPS)$` used a `$` anchor
    that prevented `VISITOR_INFO1_LIVE` (the real cookie name) from matching. Split into two
    entries so `VISITOR_INFO` is matched as a prefix.
  - **`tracker-list`**: the entry `"facebook.com/tr"` included a URL path, making it unmatchable
    by the hostname-only classifier. Replaced with the dedicated `pixel.facebook.com` hostname.

## 3.0.0

### Major Changes

- db3e538: Change the default output format from `md,pdf` to `html`.

  Previously running `gdpr-scan scan <url>` with no `--format` flag produced both a Markdown bundle (3 files) and a PDF — requiring a full Playwright PDF render on every invocation. The HTML report is self-contained, opens in any browser without extra tooling, and is faster to generate, making it a better default for first-time users and CI pipelines alike. Pipelines that relied on the implicit `md` or `pdf` output must now pass `--format md,pdf` explicitly.

  Also fixes the erroneous `npx` invocation in the README (issue #22): the correct command is `npx @slashgear/gdpr-cookie-scanner scan <url>`, not `npx @slashgear/gdpr-cookie-scanner gdpr-scan scan <url>`.

### Minor Changes

- db3e538: Add `requiresConsent` field to `NetworkRequest`, mark Plausible Analytics as consent-exempt, and fix scoring for tracking-free sites.

  Two related issues are fixed:

  1. **Plausible Analytics false positive** — Plausible is cookieless and exempt from ePrivacy consent under CNIL guidance, but requests to `plausible.io/api/event` were matching the generic pixel pattern and penalising the score. A `requiresConsent: boolean` field is added to `NetworkRequest` (mirroring the same field on `ScannedCookie`). A new optional `consentRequired` flag on `TrackerEntry` lets known-exempt services opt out of the default consent requirement. All compliance and report logic now uses `requiresConsent` instead of testing `trackerCategory !== "cdn"` directly. Plausible Analytics is added to `TRACKER_DB` with `consentRequired: false`.

  2. **Tracking-free sites capped at 97** — The "no privacy policy link on page" check deducted 3 points unconditionally, even when no consent was required. A site with no non-essential cookies or trackers now correctly scores 100/100.

### Patch Changes

- 5f0e14e: Fix false non-compliance for sites with no cookies or trackers

  A site with no consent modal but also no non-essential cookies and no
  third-party trackers was previously scored 0/75 and graded F, because
  the three consent-related dimensions (consent validity, easy refusal,
  transparency) were zeroed out whenever no modal was detected.

  GDPR and the ePrivacy Directive only require a consent mechanism when
  the site actually uses cookies or trackers that need consent. A
  tracking-free site has no such obligation and must now correctly receive
  a full score (grade A) and raise no compliance issues.

  The fix adds a `consentRequired` guard in `analyzeCompliance`: the
  three modal-related dimensions are only penalised when non-essential
  cookies or non-CDN trackers are present. The report generator
  (executive summary, recommendations, checklist) is updated to reflect
  the same distinction. Unit and E2E tests are updated accordingly.

## 2.0.4

### Patch Changes

- 81d9b79: Replace `chalk` and `ora` with lighter, zero/minimal-dependency alternatives.

  - `chalk` → `node:util styleText` (Node.js built-in, no dependency at all)
  - `ora` → `nanospinner` (single dependency, same spinner UX)

  This reduces the install footprint and removes two runtime dependencies in favour of the e18e ecosystem recommendations. The only visual difference is that the orange score color (formerly `chalk.hex("#FFA500")`) is now rendered as `yellowBright`, since `styleText` does not support hex colors.

## 2.0.3

### Patch Changes

- cc8b0dc: Fix Docker image tags using lowercase repository name.

  `github.repository` can contain uppercase letters (e.g. `Slashgear/gdpr-cookie-scanner`), which is rejected by the OCI registry spec. The image name is now lowercased via `tr '[:upper:]' '[:lower:]'` before being passed to `docker/build-push-action`.

## 2.0.2

### Patch Changes

- ec906f4: Publish Docker image automatically on every release.

  When `changesets/action` publishes a new version to npm, the release workflow now logs in to the GitHub Container Registry (ghcr.io) and pushes the Docker image tagged with both `latest` and the exact semver version (e.g. `ghcr.io/slashgear/gdpr-cookie-scanner:2.0.2`). The `packages: write` permission is added to the job for this purpose.

## 2.0.1

### Patch Changes

- 469c8e8: Fix Docker image not being published on release.

  The `docker.yml` workflow was triggered on `release: published`, but GitHub Actions blocks workflows using `GITHUB_TOKEN` from cascading into other workflows, so the Docker build never ran. Merged the Docker build steps directly into `release.yml`, gated on `changesets/action` reporting `published == 'true'`.

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
