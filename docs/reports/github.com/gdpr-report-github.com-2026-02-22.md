# GDPR Compliance Report — github.com

> **Scan date:** 22/02/2026, 19:18:48
> **Scanned URL:** https://github.com
> **Scan duration:** 8.0s
> **Tool:** gdpr-cookie-scanner v0.1.0

## Global Compliance Score

### 🔴 15/100 — Grade F

| Criterion        | Score      | Progress   | Status |
| ---------------- | ---------- | ---------- | ------ |
| Consent validity | 0/25       | ░░░░░░░░░░ | ❌     |
| Easy refusal     | 0/25       | ░░░░░░░░░░ | ❌     |
| Transparency     | 0/25       | ░░░░░░░░░░ | ❌     |
| Cookie behavior  | 15/25      | ██████░░░░ | ⚠️     |
| **TOTAL**        | **15/100** |            | **F**  |

## Executive Summary

❌ **No consent modal detected.** The site sets cookies without requesting consent.
❌ **1 non-essential cookie(s)** set before any interaction (RGPD violation).
❌ **1 non-essential cookie(s)** persisting after rejection (RGPD violation).
❌ **3 tracker request(s)** fired before consent.

**3 critical issue(s)** and **0 warning(s)** identified.

## 1. Consent Modal

_No consent modal detected on the page._

## 2. Dark Patterns and Detected Issues

### ❌ Critical issues

**No cookie consent modal detected**

> A consent mechanism is required before depositing non-essential cookies

**1 non-essential cookie(s) deposited before any interaction**

> tz (unknown)

**3 tracker request(s) fired before any consent**

> Tracking Pixel

## 3. Cookies Set Before Any Interaction

| Name                   | Domain      | Category           | Expiry    | Consent required |
| ---------------------- | ----------- | ------------------ | --------- | ---------------- |
| `_gh_sess`             | github.com  | unknown            | Session   | ✅ No            |
| `_octo`                | .github.com | unknown            | 12 months | ✅ No            |
| `logged_in`            | .github.com | strictly-necessary | 12 months | ✅ No            |
| `cpu_bucket`           | .github.com | unknown            | Session   | ✅ No            |
| `preferred_color_mode` | .github.com | unknown            | Session   | ✅ No            |
| `tz`                   | .github.com | unknown            | Session   | ⚠️ Yes           |

## 4. Cookies After Consent Rejection

✅ No non-essential cookie detected after rejection.

_No cookies detected._

## 5. Cookies After Consent Acceptance

_No cookies detected._

## 6. Network Requests — Detected Trackers

### Before interaction (3 tracker(s))

| Tracker        | Category | URL                                           | Type |
| -------------- | -------- | --------------------------------------------- | ---- |
| Tracking Pixel | pixel    | `https://collector.github.com/github/collect` | ping |
| Tracking Pixel | pixel    | `https://collector.github.com/github/collect` | ping |
| Tracking Pixel | pixel    | `https://collector.github.com/github/collect` | ping |

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
