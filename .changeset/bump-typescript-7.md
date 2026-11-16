---
"@slashgear/gdpr-cookie-scanner": patch
---

Build with TypeScript 7 (the native Go compiler) instead of 5.9. The emitted JavaScript and `.d.ts` files are byte-identical to the 5.9 output, and builds/type-checks now take ~0.3 s. `tsconfig.json` now lists `"types": ["node"]` explicitly, because TypeScript 6+ no longer auto-includes every `@types/*` package.
