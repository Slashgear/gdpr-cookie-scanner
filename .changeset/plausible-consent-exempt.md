---
"@slashgear/gdpr-cookie-scanner": minor
---

Add `requiresConsent` field to `NetworkRequest`, mark Plausible Analytics as consent-exempt, and fix scoring for tracking-free sites.

Two related issues are fixed:

1. **Plausible Analytics false positive** — Plausible is cookieless and exempt from ePrivacy consent under CNIL guidance, but requests to `plausible.io/api/event` were matching the generic pixel pattern and penalising the score. A `requiresConsent: boolean` field is added to `NetworkRequest` (mirroring the same field on `ScannedCookie`). A new optional `consentRequired` flag on `TrackerEntry` lets known-exempt services opt out of the default consent requirement. All compliance and report logic now uses `requiresConsent` instead of testing `trackerCategory !== "cdn"` directly. Plausible Analytics is added to `TRACKER_DB` with `consentRequired: false`.

2. **Tracking-free sites capped at 97** — The "no privacy policy link on page" check deducted 3 points unconditionally, even when no consent was required. A site with no non-essential cookies or trackers now correctly scores 100/100.
