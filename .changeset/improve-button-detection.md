---
"@slashgear/gdpr-cookie-scanner": minor
---

Improve consent button detection and classification

**Wider element selector**: `extractButtons` now captures `input[type="button"]`, `input[type="submit"]`, and `<a>` elements with `href=""`, `href^="javascript:"`, or no `href` attribute — covering CMP implementations that do not use `<button>` or `[role="button"]`.

**Text fallback for icon-only buttons**: when `textContent` is empty, the button label is now resolved from `aria-label`, `value` (for `<input>`), then `title` in order.

**Icon component name stripping**: `normalizeText` now inserts spaces at camelCase boundaries, preventing React icon component names (e.g. `ArrowRightIcon`) leaked into `textContent` from breaking word-boundary anchors in classification patterns.

**All-locale classification**: button classification now always tests all locale pattern sets regardless of the page's declared `lang` attribute. This fixes misses when a page declares `lang="en"` but its CMP renders buttons in another language.

**Fixed close button detection**: replaced the broken `\bferm\b` / `\b×\b` pattern with explicit word forms (`fermer`, `close`, …) and a standalone-symbol regex (`^[×✕✗✖✘]$`).

**Removed ambiguous "continue"/"continuer" from accept patterns**: these words appear in both accept ("Continuer") and reject ("Continuer sans accepter") button labels; removing them from accept patterns prevents false positives while the reject patterns still cover the full phrases.

**Extended language patterns**: added common variants for EN, FR, DE, ES, IT, NL — including "allow all", "decline all", "necessary only", "nécessaires uniquement", "nur notwendige", etc.