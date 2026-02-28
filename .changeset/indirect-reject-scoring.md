---
"@slashgear/gdpr-cookie-scanner": patch
---

fix: deduct points for indirect reject button labels in easyRefusal score

Buttons like "Continuer sans accepter" or "Continue without accepting" are technically
reject buttons but use indirect wording that makes the refusal non-obvious to users.
This is a dark pattern covered by EDPB Guidelines 03/2022 (§ 3.3.3 — hiding choices).

The easyRefusal score now deducts 5 points when such indirect wording is detected,
and a warning issue is surfaced in the report alongside the existing detection logic.
