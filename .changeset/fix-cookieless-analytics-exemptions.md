---
"@slashgear/gdpr-cookie-scanner": patch
---

Add Fathom, Simple Analytics, Cabin, and Pirsch to the consent-exempt analytics list.

These tools are cookieless, collect no personal data, and do not cross-reference data
with other processing — meeting the CNIL conditions for analytics exempt from the
ePrivacy consent requirement. Only Plausible was previously listed; sites using any
of these four tools were incorrectly flagged as loading trackers before consent.

Domains added: `cdn.usefathom.com`, `scripts.simpleanalyticscdn.com`,
`api.simpleanalytics.io`, `scripts.withcabin.com`, `api.pirsch.io`.
