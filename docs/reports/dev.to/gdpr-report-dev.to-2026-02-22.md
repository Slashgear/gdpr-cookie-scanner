# GDPR Compliance Report — dev.to

> **Scan date:** 22/02/2026, 19:18:28
> **Scanned URL:** https://dev.to
> **Scan duration:** 8.4s
> **Tool:** gdpr-cookie-scanner v0.1.0

## Global Compliance Score

### 🔴 13/100 — Grade F

| Criterion        | Score      | Progress   | Status |
| ---------------- | ---------- | ---------- | ------ |
| Consent validity | 0/25       | ░░░░░░░░░░ | ❌     |
| Easy refusal     | 0/25       | ░░░░░░░░░░ | ❌     |
| Transparency     | 0/25       | ░░░░░░░░░░ | ❌     |
| Cookie behavior  | 13/25      | █████░░░░░ | ⚠️     |
| **TOTAL**        | **13/100** |            | **F**  |

## Executive Summary

❌ **No consent modal detected.** The site sets cookies without requesting consent.
❌ **2 non-essential cookie(s)** set before any interaction (RGPD violation).
❌ **2 non-essential cookie(s)** persisting after rejection (RGPD violation).
❌ **2 tracker request(s)** fired before consent.

**3 critical issue(s)** and **0 warning(s)** identified.

## 1. Consent Modal

_No consent modal detected on the page._

## 2. Dark Patterns and Detected Issues

### ❌ Critical issues

**No cookie consent modal detected**

> A consent mechanism is required before depositing non-essential cookies

**2 non-essential cookie(s) deposited before any interaction**

> \_ga_TYEM8Y3JN3 (analytics), \_ga (analytics)

**2 tracker request(s) fired before any consent**

> Google Tag Manager, Google Analytics

## 3. Cookies Set Before Any Interaction

| Name                   | Domain  | Category  | Expiry    | Consent required |
| ---------------------- | ------- | --------- | --------- | ---------------- |
| `ahoy_visit`           | dev.to  | unknown   | < 1 day   | ✅ No            |
| `ahoy_visitor`         | dev.to  | unknown   | 13 months | ✅ No            |
| `_Devto_Forem_Session` | .dev.to | unknown   | 2 months  | ✅ No            |
| `_ga_TYEM8Y3JN3`       | .dev.to | analytics | 13 months | ⚠️ Yes           |
| `_ga`                  | .dev.to | analytics | 13 months | ⚠️ Yes           |

## 4. Cookies After Consent Rejection

✅ No non-essential cookie detected after rejection.

_No cookies detected._

## 5. Cookies After Consent Acceptance

_No cookies detected._

## 6. Network Requests — Detected Trackers

### Before interaction (2 tracker(s))

| Tracker            | Category  | URL                                                            | Type   |
| ------------------ | --------- | -------------------------------------------------------------- | ------ |
| Google Tag Manager | analytics | `https://www.googletagmanager.com/gtag/js?id=G-TYEM8Y3JN3`     | script |
| Google Analytics   | analytics | `https://region1.google-analytics.com/g/collect?v=2&tid=G-...` | fetch  |

## 7. Recommendations

1. **Deploy a CMP solution** (e.g. Axeptio, Didomi, OneTrust, Cookiebot) that displays a consent modal before any non-essential cookie.

1. **Add a "Reject all" button** at the first layer of the modal, requiring no more clicks than "Accept all" (CNIL 2022).

1. **Do not set any non-essential cookie before consent.** Gate the initialisation of third-party scripts on acceptance.

1. **Remove or block non-essential cookies** after rejection, and verify consent handling server-side.

## Scan Errors and Warnings

- ⚠️ No reject button found — could not test rejection flow
- ⚠️ No accept button found — could not test acceptance flow

## Legal References

- **RGPD Art. 7** — Conditions for consent
- **RGPD Recital 32** — Consent must result from an unambiguous positive action
- **ePrivacy Directive 2002/58/EC** — Consent requirement for non-essential cookies
- **CEPD Guidelines 05/2020** — Consent under the RGPD
- **CEPD Guidelines 03/2022** — Dark patterns on platforms
- **CNIL Recommendation 2022** — Rejection must be as easy as acceptance (same number of clicks)
