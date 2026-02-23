---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix false non-compliance for sites with no cookies or trackers

A site with no consent modal but also no non-essential cookies and no
third-party trackers was previously scored 0/75 and graded F, because
the three consent-related dimensions (consent validity, easy refusal,
transparency) were zeroed out whenever no modal was detected.

GDPR and the ePrivacy Directive only require a consent mechanism when
the site actually uses cookies or trackers that need consent. A
tracking-free site has no such obligation and must now correctly receive
a full score (grade A) and raise no compliance issues.

The fix adds a `consentRequired` guard in `analyzeCompliance`: the
three modal-related dimensions are only penalised when non-essential
cookies or non-CDN trackers are present. The report generator
(executive summary, recommendations, checklist) is updated to reflect
the same distinction. Unit and E2E tests are updated accordingly.