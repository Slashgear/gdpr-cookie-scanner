---
"@slashgear/gdpr-cookie-scanner": patch
---

fix: truncate long cookie names with ellipsis in HTML cookie tables

Cookie names that contain URLs or other unusually long strings (e.g. Optimizely
session keys) were breaking the table layout in the HTML report. The Name column
now clamps to 220 px with `text-overflow: ellipsis`; hovering the cell reveals
the full name via the `title` attribute.
