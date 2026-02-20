---
"@slashgear/gdpr-cookie-scanner": patch
---

fix: isolate navigation timeout in accept phase so cookies are captured even when networkidle times out

The accept phase (phase 4) previously wrapped navigation and cookie capture in a single try/catch, causing the entire phase to be skipped when `networkidle` timed out on heavy sites. The navigation timeout is now isolated so detection and capture proceed regardless.

feat: add cookie inventory report (`gdpr-cookies-*.md`)

A new per-scan file lists all unique cookies detected across all three phases (before consent, after acceptance, after rejection) with their category, phases of presence, expiry, consent requirement, and an empty "Description / Purpose" column for the DPO or technical owner to fill in.

feat: add hyperlinks to legal references in checklist

Every reference in the compliance checklist (GDPR Art. 7, EDPB Guidelines 03/2022, CNIL Recommendation 2022, etc.) now links to the official source document.