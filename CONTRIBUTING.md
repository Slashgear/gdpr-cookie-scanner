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

## Conventions

- Local imports must include the `.js` extension (ESM NodeNext module)
- Formatting is handled by oxfmt (`pnpm format`), do not format manually
- Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) convention
