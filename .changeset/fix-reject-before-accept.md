---
"@slashgear/gdpr-cookie-scanner": patch
---

fix: classify reject before accept to handle "continuer sans accepter" dark pattern

Buttons like "Continuer sans accepter" or "Continue without accepting" contain the
word "accept/accepter" and were being incorrectly classified as accept buttons because
accept patterns were tested first. Swapping the check order (reject → accept) ensures
these rejection-phrased labels are correctly identified, preventing false negatives on
a very common dark pattern used by French and other European sites.
