# Contributing to gdpr-cookie-scanner

## Prerequisites

- [Bun](https://bun.sh) 1.4.4 (the version pinned in `package.json` → `packageManager`)
- Node.js ≥ 24 (used by `tsc` and by the published CLI)
- Playwright browser: `npx playwright install chromium-headless-shell`
- [Git LFS](https://git-lfs.com) if you work on the website (report screenshots are stored with LFS)

## Repository structure

| Path              | Description                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `src/`            | The `@slashgear/gdpr-cookie-scanner` CLI and library, published to npm                          |
| `tests/`          | Unit tests (`bun test`) and end-to-end scans of local HTML fixtures (`tests/e2e/`)              |
| `scripts/`        | Build and maintenance scripts (data copy, cookie DB and tracker list updates, website showcase) |
| `website/public/` | Static website deployed with GitHub Pages to [gdpr.slashgear.dev](https://gdpr.slashgear.dev)   |

## Getting started

```bash
git clone https://github.com/Slashgear/gdpr-cookie-scanner.git
cd gdpr-cookie-scanner
bun install           # installs dependencies from bun.lock
bun run build         # builds the CLI into dist/

# Run the CLI locally
node dist/cli.js scan https://example.com
```

## Workflow

1. Fork the repository and create a branch from `main`
2. Make your changes, with tests (see below)
3. Verify that CI passes locally:
   ```bash
   bun run format:check
   bun run lint
   bun run typecheck
   bun run build
   bun run test
   ```
4. Add a changeset if the change affects the published package (see [Releasing](#releasing))
5. Open a Pull Request targeting `main`

## Tests

Tests run with Bun's built-in test runner (import from `bun:test`).

```bash
bun run test          # unit tests, then e2e tests
bun run test:watch    # unit tests in watch mode
bun test tests/unit   # a single folder or file
```

Pure logic (classifiers, analyzers, decoders) goes in `tests/analyzers/`, `tests/classifiers/`, `tests/scanner/` or `tests/unit/`.
Behaviour that needs a real browser is covered by adding an HTML fixture to `tests/e2e/fixtures/` and a case to `tests/e2e/scanner.test.ts`.

## Areas to contribute

- **Classifiers** — add cookie patterns or tracker domains in `src/classifiers/`
- **Consent modal detection** — improve CMP detection in `src/scanner/consent-modal.ts`
- **Compliance rules** — refine scoring rules in `src/analyzers/compliance.ts`
- **Report** — improve report rendering in `src/report/generator.ts`
- **Website** — static landing page and showcase reports in `website/public/`

## Website — live reports showcase

The `website/public/reports/` directory contains pre-generated HTML reports (grades A–D only).
After adding new reports, run:

```bash
bun run build:showcase   # regenerates the report cards in website/public/index.html
```

The script reads `website/public/reports/` and injects sorted report cards between the
`<!-- ── REPORTS_START ── -->` / `<!-- ── REPORTS_END ── -->` markers.

Report screenshots (`.png`) are tracked via **Git LFS** — make sure `git lfs` is installed before cloning.
The site is deployed by the [website workflow](.github/workflows/website.yml) on every push to `main` that touches `website/public/`.

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

### As a contributor — document your change

Every PR that changes behaviour (bug fix, new feature, breaking change) must include a changeset:

```bash
bun run changeset
```

The interactive prompt asks:

- **Which packages** are affected (only one here: `@slashgear/gdpr-cookie-scanner`)
- **Bump type**: `patch` (bug fix) · `minor` (new feature) · `major` (breaking change)
- **Summary**: what changed and why; it will appear in `CHANGELOG.md`

This creates a file in `.changeset/` — commit it alongside your changes. In a non-interactive environment, write the `.changeset/<slug>.md` file by hand:

```md
---
"@slashgear/gdpr-cookie-scanner": patch
---

What changed and why.
```

> PRs without a changeset are fine for docs, tests, or CI changes that don't affect the published package.

### As a maintainer — publish a release

When changesets are merged into `main`, the [release workflow](.github/workflows/release.yml) automatically opens a **"chore: release new version"** PR that:

- Bumps `package.json` version
- Aggregates all changeset summaries into `CHANGELOG.md`

Merging that PR triggers the workflow again, which:

1. Publishes `@slashgear/gdpr-cookie-scanner` to [npm](https://www.npmjs.com/package/@slashgear/gdpr-cookie-scanner)
2. Creates the corresponding GitHub Release with the generated changelog
3. Builds and pushes the Docker image to `ghcr.io/slashgear/gdpr-cookie-scanner`

## Conventions

- Local imports must include the `.js` extension (ESM NodeNext module)
- Formatting is handled by `bun fmt` (`bun run format`, options in `bunfig.toml`), do not format manually
- Linting is handled by oxlint (`bun run lint`)
- Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) convention
