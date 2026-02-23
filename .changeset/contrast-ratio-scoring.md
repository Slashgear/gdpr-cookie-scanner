---
"@slashgear/gdpr-cookie-scanner": patch
---

Wire `contrastRatio` into compliance scoring (section B — Easy Refusal).

The contrast ratio was already computed and displayed in reports but had no effect on the score. A "Refuser" button rendered in grey on white would silently pass. Now:

- Reject button contrast < 3.0 → critical issue, −10 pts
- Reject button contrast < 4.5 (WCAG AA) → warning, −5 pts
- Accept contrast ≥ 1.5× reject contrast → relative asymmetry warning, −3 pts