---
"@slashgear/gdpr-cookie-scanner": minor
---

feat: check for privacy policy link in the consent modal and on the page

Two new automated checks are now run on every scan:

- **Privacy policy link in the modal** — the consent interface should include a
  link to the privacy policy (GDPR Art. 13). Absence deducts 5 points from
  Transparency and surfaces a warning in the checklist.
- **Privacy policy link on the page** — a privacy policy must be accessible from
  every page (typically via a footer link). Absence deducts 3 points from
  Transparency and surfaces a warning in the checklist.

The detected URL (if any) is shown in the modal analysis section of the main
report and in both new checklist rows.
