# GDPR Compliance Report — npmjs.com

> **Scan date:** 22/02/2026, 19:25:09
> **Scanned URL:** https://npmjs.com
> **Scan duration:** 7.1s
> **Tool:** gdpr-cookie-scanner v0.1.0

## Global Compliance Score

### 🔴 25/100 — Grade F

| Criterion        | Score      | Progress   | Status |
| ---------------- | ---------- | ---------- | ------ |
| Consent validity | 0/25       | ░░░░░░░░░░ | ❌     |
| Easy refusal     | 0/25       | ░░░░░░░░░░ | ❌     |
| Transparency     | 0/25       | ░░░░░░░░░░ | ❌     |
| Cookie behavior  | 25/25      | ██████████ | ✅     |
| **TOTAL**        | **25/100** |            | **F**  |

## Executive Summary

❌ **No consent modal detected.** The site sets cookies without requesting consent.
✅ No non-essential cookie set before interaction.
✅ Non-essential cookies are correctly removed after rejection.
✅ No tracker requests before consent.

**1 critical issue(s)** and **1 warning(s)** identified.

## 1. Consent Modal

_No consent modal detected on the page._

## 2. Dark Patterns and Detected Issues

### ❌ Critical issues

**No cookie consent modal detected**

> A consent mechanism is required before depositing non-essential cookies

### ⚠️ Warnings

**No privacy policy link found on the page**

> A privacy policy must be accessible from every page (GDPR Art. 13)

## 3. Cookies Set Before Any Interaction

| Name      | Domain     | Category | Expiry  | Consent required |
| --------- | ---------- | -------- | ------- | ---------------- |
| `__cf_bm` | .npmjs.com | unknown  | < 1 day | ✅ No            |
| `_cfuvid` | .npmjs.com | unknown  | Session | ✅ No            |

## 4. Cookies After Consent Rejection

✅ No non-essential cookie detected after rejection.

_No cookies detected._

## 5. Cookies After Consent Acceptance

_No cookies detected._

## 6. Network Requests — Detected Trackers

_No known network tracker detected._

## 7. Recommendations

1. **Deploy a CMP solution** (e.g. Axeptio, Didomi, OneTrust, Cookiebot) that displays a consent modal before any non-essential cookie.

1. **Add a "Reject all" button** at the first layer of the modal, requiring no more clicks than "Accept all" (CNIL 2022).

1. **Complete the modal information**: purposes, identity of sub-processors, retention period, right to withdraw.

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
