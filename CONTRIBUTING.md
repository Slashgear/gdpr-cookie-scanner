# Contribuer à gdpr-cookie-scanner

## Prérequis

- Node.js ≥ 20
- pnpm
- Playwright : `npx playwright install chromium`

## Démarrage

```bash
git clone https://github.com/Slashgear/gdpr-report.git
cd gdpr-report
pnpm install
pnpm build
```

## Workflow

1. Fork le dépôt et crée une branche depuis `main`
2. Effectue tes modifications
3. Vérifie que la CI passe en local :
   ```bash
   pnpm format:check
   pnpm lint
   pnpm typecheck
   pnpm build
   ```
4. Ouvre une Pull Request vers `main`

## Domaines où contribuer

- **Classifiers** — ajouter des patterns de cookies ou des domaines trackers dans `src/classifiers/`
- **Consent modal detection** — améliorer la détection des CMP dans `src/scanner/consent-modal.ts`
- **Compliance rules** — affiner les règles de scoring dans `src/analyzers/compliance.ts`
- **Report** — améliorer le rendu des rapports dans `src/report/generator.ts`

## Conventions

- Les imports locaux doivent inclure l'extension `.js` (module ESM NodeNext)
- Le formatage est géré par oxfmt (`pnpm format`), ne pas formater manuellement
- Les messages de commit suivent la convention [Conventional Commits](https://www.conventionalcommits.org/)
