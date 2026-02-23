---
"@slashgear/gdpr-cookie-scanner": minor
---

Add programmatic API (`scan()` function and public exports)

Exposes a `scan(url, options?)` convenience function and re-exports `Scanner`, `ReportGenerator`, and all public TypeScript types from the package entry point (`dist/index.js`).

This allows using the scanner as a library without going through the CLI:

```ts
import { scan, ReportGenerator } from '@slashgear/gdpr-cookie-scanner';

const result = await scan('https://example.com', { locale: 'fr-FR' });
console.log(result.compliance.grade);

// Optionally generate a report
const generator = new ReportGenerator({ outputDir: './reports', formats: ['html'], ...result });
const paths = await generator.generate(result);
```

`ScanOptions.outputDir` is now optional: it is only required when screenshots or report generation is needed. `ReportGenerator.generate()` throws a clear error if called without `outputDir`.