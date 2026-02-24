---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix: "Tout rejeter" and "rejeter" were not recognised as valid reject buttons.

The `REJECT_PATTERNS` regex only covered the `refus*` stem (refuser, tout refuser) but missed the `rejet*` stem (rejeter, tout rejeter) which is used by many CMPs including Didomi and OneTrust in French. This caused the scanner to incorrectly report a missing reject button and penalise the easy-refusal score on sites that do provide one.