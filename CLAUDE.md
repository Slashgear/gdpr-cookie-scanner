# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build         # Compile TypeScript → dist/
pnpm dev           # Watch mode compilation
pnpm typecheck     # Type-check without emitting
pnpm lint          # oxlint
pnpm lint:fix      # oxlint --fix
pnpm format        # oxfmt (auto-format)
pnpm format:check  # oxfmt --check (used in CI)

# Run the CLI after building
node dist/cli.js scan <url>
node dist/cli.js scan <url> -o ./reports --locale fr-FR --verbose
node dist/cli.js list-trackers
```

There are no tests currently.

## Release process

This project uses [Changesets](https://github.com/changesets/changesets).

- **Contributors**: run `pnpm changeset` before opening a PR to document the change (patch/minor/major + summary). Commit the generated `.changeset/*.md` file with your PR. Skip for docs/CI-only changes.
- **Maintainers**: merging changesets into `main` triggers the release workflow, which opens a "chore: release new version" PR (bumps version + updates `CHANGELOG.md`). Merging that PR publishes to GitHub Packages and creates the GitHub Release automatically.

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, etc.).

## Architecture

This is a TypeScript CLI tool (`gdpr-scan`) that audits websites for GDPR/RGPD cookie consent compliance using Playwright. It produces a Markdown report in French.

### Scan pipeline (`src/scanner/index.ts`)

The scanner runs **4 sequential phases** using real Chromium browsers:

1. **Phase 1** — Load page with no interaction; capture cookies + network requests (`before-interaction`)
2. **Phase 2** — Detect the consent modal/banner (CSS selectors + heuristics)
3. **Phase 3** — Click the reject button in the same session; capture state (`after-reject`)
4. **Phase 4** — Fresh browser session, load page, click accept; capture state (`after-accept`)

Phase 3 and 4 require two separate browser sessions so cookie state is fully isolated.

### Module responsibilities

- **`src/scanner/browser.ts`** — Playwright browser/context lifecycle helpers
- **`src/scanner/cookies.ts`** — Extract and classify cookies from Playwright context
- **`src/scanner/network.ts`** — Intercept and classify network requests via Playwright events
- **`src/scanner/consent-modal.ts`** — Detect consent modal by trying known CMP selectors (`MODAL_SELECTORS`) then falling back to DOM heuristics; extracts buttons/checkboxes with visual properties (font size, bounding box, contrast ratio) needed for dark-pattern detection
- **`src/classifiers/cookie-classifier.ts`** — Pattern-match cookie names against a static list to assign `CookieCategory` and `requiresConsent`
- **`src/classifiers/network-classifier.ts`** — Look up request hostnames in `TRACKER_DB` and match URL patterns against `PIXEL_PATTERNS`
- **`src/classifiers/tracker-list.ts`** — Static database of tracker domains by category
- **`src/analyzers/compliance.ts`** — Scores 4 dimensions (0–25 each) and surfaces `DarkPatternIssue` objects: consent validity, easy refusal, transparency, cookie behavior
- **`src/analyzers/wording.ts`** — Text analysis of button labels and modal copy
- **`src/report/generator.ts`** — Renders a Markdown report and checklist from `ScanResult`; runs `oxfmt` on generated files
- **`src/types.ts`** — All shared TypeScript interfaces (`ScanResult`, `ScanOptions`, `ComplianceScore`, `ConsentModal`, etc.)

### Compliance scoring

Each of the 4 score dimensions starts at 25 and gets deducted based on detected issues:

- `consentValidity` — pre-ticked boxes, misleading wording, missing info
- `easyRefusal` — absent/buried reject button, click asymmetry, visual asymmetry
- `transparency` — no granular controls, missing info fields
- `cookieBehavior` — non-essential cookies/trackers before consent, consent-requiring cookies persisting after reject

Grade thresholds: A ≥ 90, B ≥ 75, C ≥ 55, D ≥ 35, F < 35. Exit code 1 on grade F.

### Module system

The project uses `"type": "module"` with `"moduleResolution": "NodeNext"`. All local imports **must** include the `.js` extension even for `.ts` source files.
