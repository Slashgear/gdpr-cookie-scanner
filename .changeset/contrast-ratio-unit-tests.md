---
"@slashgear/gdpr-cookie-scanner": patch
---

Add unit tests for `computeContrastRatio`, `parseRgb`, and `relativeLuminance`.

These three pure functions in `consent-modal.ts` were previously only exercised
indirectly through the E2E suite. The new test file
(`tests/scanner/contrast-ratio.test.ts`) covers the happy path, edge cases
(identical colours, fully transparent rgba, non-integer ratios), and documents
the known limitations — named colours (`white`, `black`) and hex values (`#fff`)
return `null` until the parser is extended.

The functions are now exported so they can be imported by the test suite without
moving them to a separate module.
