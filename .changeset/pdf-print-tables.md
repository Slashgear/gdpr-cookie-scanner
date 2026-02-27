---
"@slashgear/gdpr-cookie-scanner": patch
---

Improve PDF table density and readability

In `@media print`, data tables now use a smaller font (10px) and tighter
cell padding (5px 8px) to reduce cramping. Cookie description and tracker
URL cells get dedicated classes (`cell-desc`, `cell-url`) and are further
reduced to 9px and 7.5px respectively, keeping narrow columns (name,
domain, category, expiry) readable without being squeezed by long values.
Long code values wrap instead of overflowing, and sections containing
tables are allowed to break across pages.