---
"@slashgear/gdpr-cookie-scanner": patch
---

fix: copy scripts/ directory into Docker build stage

The `pnpm build` script now runs `tsc && node scripts/copy-data.mjs` to copy
the vendored Open Cookie Database into `dist/data/`. The Dockerfile only copied
`src/` and `tsconfig.json`, so the build stage was missing `scripts/`, causing
the Docker image build to fail with `Cannot find module '/app/scripts/copy-data.mjs'`.
