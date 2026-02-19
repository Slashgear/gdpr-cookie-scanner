# Contributing to gdpr-cookie-scanner

## Prerequisites

- Node.js ≥ 20
- pnpm
- Playwright: `npx playwright install chromium`

## Getting started

```bash
git clone https://github.com/Slashgear/gdpr-report.git
cd gdpr-report
pnpm install
pnpm build
```

## Workflow

1. Fork the repository and create a branch from `main`
2. Make your changes
3. Verify that CI passes locally:
   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm build
   ```
4. Open a Pull Request targeting `main`

## Areas to contribute

- **Classifiers** — add cookie patterns or tracker domains in `src/classifiers/`
- **Consent modal detection** — improve CMP detection in `src/scanner/consent-modal.ts`
- **Compliance rules** — refine scoring rules in `src/analyzers/compliance.ts`
- **Report** — improve report rendering in `src/report/generator.ts`

## Releasing

This project uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

### As a contributor — document your change

Every PR that changes behaviour (bug fix, new feature, breaking change) must include a changeset:

```bash
pnpm changeset
```

The interactive prompt asks:

- **Which packages** are affected (only one here: `@slashgear/gdpr-cookie-scanner`)
- **Bump type**: `patch` (bug fix) · `minor` (new feature) · `major` (breaking change)
- **Summary**: one-line description that will appear in `CHANGELOG.md`

This creates a file in `.changeset/` — commit it alongside your changes.

> PRs without a changeset are fine for docs, tests, or CI changes that don't affect the published package.

### As a maintainer — publish a release

When changesets are merged into `main`, the [release workflow](.github/workflows/release.yml) automatically opens a **"chore: release new version"** PR that:

- Bumps `package.json` version
- Aggregates all changeset summaries into `CHANGELOG.md`

Merging that PR triggers the workflow again, which:

1. Publishes `@slashgear/gdpr-cookie-scanner` to [GitHub Packages](https://github.com/Slashgear/gdpr-report/pkgs/npm/gdpr-cookie-scanner)
2. Creates the corresponding GitHub Release with the generated changelog

## Conventions

- Local imports must include the `.js` extension (ESM NodeNext module)
- Formatting is handled by oxfmt (`pnpm format`), do not format manually
- Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) convention
