---
"@slashgear/gdpr-cookie-scanner": patch
---

Fix false non-compliance indicators for sites using only consent-exempt analytics (Plausible, Fathom, etc.)

Sites that use privacy-respecting, cookieless analytics tools (exempt under the CNIL exemption) and have no consent banner should score 100 with no non-compliance flags. Two bugs in the HTML report were causing the opposite:

1. The HTML network section was showing a red "before consent" badge for all trackers fired before interaction, regardless of whether they require consent — Plausible was being flagged as a violation even though it is explicitly marked `consentRequired: false`.
2. The HTML checklist "No tracker before consent" rule was not filtering by `requiresConsent`, so it displayed ❌ Non-compliant for sites that only use Plausible.

Fixes:
- HTML network section: consent-exempt trackers fired before interaction now show a green "exempt" badge instead of the red "before consent" badge. The header count badge only counts consent-requiring trackers.
- HTML checklist: "No tracker before consent" now correctly filters by `requiresConsent`.
- Markdown network section: added a "Consent req." column so readers can immediately see which trackers require consent and which are exempt.