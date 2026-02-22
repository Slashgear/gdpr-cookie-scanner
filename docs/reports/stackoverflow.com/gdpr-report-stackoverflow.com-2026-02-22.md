# GDPR Compliance Report — stackoverflow.com

> **Scan date:** 22/02/2026, 19:24:00
> **Scanned URL:** https://stackoverflow.com
> **Scan duration:** 12.5s
> **Tool:** gdpr-cookie-scanner v0.1.0

## Global Compliance Score

### 🟠 66/100 — Grade C

| Criterion        | Score      | Progress   | Status |
| ---------------- | ---------- | ---------- | ------ |
| Consent validity | 25/25      | ██████████ | ✅     |
| Easy refusal     | 10/25      | ████░░░░░░ | ❌     |
| Transparency     | 20/25      | ████████░░ | ✅     |
| Cookie behavior  | 11/25      | ████░░░░░░ | ❌     |
| **TOTAL**        | **66/100** |            | **C**  |

## Executive Summary

✅ Consent modal detected (`#onetrust-banner-sdk`).
❌ **1 non-essential cookie(s)** set before any interaction (RGPD violation).
❌ **1 non-essential cookie(s)** persisting after rejection (RGPD violation).
❌ **7 tracker request(s)** fired before consent.

**3 critical issue(s)** and **1 warning(s)** identified.

## 1. Consent Modal

**CSS selector:** `#onetrust-banner-sdk`
**Granular controls:** ✅ Yes
**Layer count:** 2
**Privacy policy link:** ⚠️ Not found in the modal

### Detected buttons

| Button         | Text                       | Visible | Font size | Contrast ratio |
| -------------- | -------------------------- | ------- | --------- | -------------- |
| ❓ Unknown     | List of Partners (vendors) | ✅      | 13.12px   | 11.45:1        |
| 🟢 Accept      | Accept all cookies         | ✅      | 13.12px   | 8.27:1         |
| ❓ Unknown     | Necessary cookies only     | ✅      | 13.12px   | 8.27:1         |
| ⚙️ Preferences | Customize Settings         | ✅      | 13.12px   | 8.27:1         |

### Screenshot

![Consent modal](modal-initial.png)

### Modal text excerpt

> We Care About Your PrivacyWe and our 277 partners store and access personal data, like browsing data or unique identifiers, on your device. Selecting Accept all cookies enables tracking technologies to support the purposes shown under we and our partners process data to provide. Selecting Necessary cookies only or withdrawing your consent will disable them. If trackers are disabled, some content and ads you see may not be as relevant to you. You can resurface this menu to change your choices or ...

## 2. Dark Patterns and Detected Issues

### ❌ Critical issues

**No reject button on first layer**

> CNIL (2022) requires reject to require no more clicks than accept

**1 non-essential cookie(s) deposited before any interaction**

> prov (unknown)

**7 tracker request(s) fired before any consent**

> Google Tag Manager, Google AdSense, Google DoubleClick, Google Analytics, Tracking Pixel

### ⚠️ Warnings

**No privacy policy link found in the consent modal**

> GDPR Art. 13 requires the privacy policy to be accessible from the consent interface

## 3. Cookies Set Before Any Interaction

| Name             | Domain             | Category | Expiry    | Consent required |
| ---------------- | ------------------ | -------- | --------- | ---------------- |
| `prov`           | .stackoverflow.com | unknown  | 12 months | ⚠️ Yes           |
| `__cflb`         | stackoverflow.com  | unknown  | 1 days    | ✅ No            |
| `__cf_bm`        | .stackoverflow.com | unknown  | < 1 day   | ✅ No            |
| `_cfuvid`        | .stackoverflow.com | unknown  | Session   | ✅ No            |
| `__cf_bm`        | .i.sstatic.net     | unknown  | < 1 day   | ✅ No            |
| `_cfuvid`        | .i.sstatic.net     | unknown  | Session   | ✅ No            |
| `cf_clearance`   | .stackoverflow.com | unknown  | 12 months | ✅ No            |
| `g_state`        | stackoverflow.com  | unknown  | 6 months  | ✅ No            |
| `OptanonConsent` | .stackoverflow.com | unknown  | 12 months | ✅ No            |

## 4. Cookies After Consent Rejection

✅ No non-essential cookie detected after rejection.

_No cookies detected._

## 5. Cookies After Consent Acceptance

| Name                         | Domain              | Category    | Expiry    | Consent required |
| ---------------------------- | ------------------- | ----------- | --------- | ---------------- |
| `prov`                       | .stackoverflow.com  | unknown     | 12 months | ⚠️ Yes           |
| `__cflb`                     | stackoverflow.com   | unknown     | 1 days    | ✅ No            |
| `__cf_bm`                    | .stackoverflow.com  | unknown     | < 1 day   | ✅ No            |
| `_cfuvid`                    | .stackoverflow.com  | unknown     | Session   | ✅ No            |
| `__cf_bm`                    | .i.sstatic.net      | unknown     | < 1 day   | ✅ No            |
| `_cfuvid`                    | .i.sstatic.net      | unknown     | Session   | ✅ No            |
| `cf_clearance`               | .stackoverflow.com  | unknown     | 12 months | ✅ No            |
| `g_state`                    | stackoverflow.com   | unknown     | 6 months  | ✅ No            |
| `OptanonAlertBoxClosed`      | .stackoverflow.com  | unknown     | 12 months | ✅ No            |
| `_sharedID`                  | .stackoverflow.com  | unknown     | 1 months  | ✅ No            |
| `_sharedID_cst`              | .stackoverflow.com  | unknown     | 1 months  | ✅ No            |
| `eupubconsent-v2`            | .stackoverflow.com  | unknown     | 12 months | ✅ No            |
| `_ga`                        | .stackoverflow.com  | analytics   | 13 months | ⚠️ Yes           |
| `_ga_WCZ03SZFCQ`             | .stackoverflow.com  | analytics   | 13 months | ⚠️ Yes           |
| `OptanonConsent`             | .stackoverflow.com  | unknown     | 12 months | ✅ No            |
| `__eoi`                      | .stackoverflow.com  | unknown     | 6 months  | ✅ No            |
| `pbjs-unifiedid`             | stackoverflow.com   | unknown     | 2 months  | ✅ No            |
| `pbjs-unifiedid_cst`         | stackoverflow.com   | unknown     | 2 months  | ✅ No            |
| `_cc_dc`                     | .crwdcntrl.net      | unknown     | 9 months  | ✅ No            |
| `_cc_id`                     | .crwdcntrl.net      | unknown     | 9 months  | ✅ No            |
| `_cc_cc`                     | .crwdcntrl.net      | unknown     | 9 months  | ✅ No            |
| `_cc_aud`                    | .crwdcntrl.net      | unknown     | 9 months  | ✅ No            |
| `panoramaId_expiry`          | .stackoverflow.com  | unknown     | 7 days    | ✅ No            |
| `_cc_id`                     | .stackoverflow.com  | unknown     | 9 months  | ✅ No            |
| `panoramaId`                 | .stackoverflow.com  | unknown     | 7 days    | ✅ No            |
| `uid`                        | .criteo.com         | advertising | 13 months | ⚠️ Yes           |
| `cto_bidid`                  | .stackoverflow.com  | unknown     | 13 months | ✅ No            |
| `cto_bundle`                 | .criteo.com         | unknown     | 13 months | ✅ No            |
| `cto_bundle`                 | .stackoverflow.com  | unknown     | 13 months | ✅ No            |
| `__cflb`                     | cdn.sstatic.net     | unknown     | 1 days    | ✅ No            |
| `__cf_bm`                    | .sstatic.net        | unknown     | < 1 day   | ✅ No            |
| `_cfuvid`                    | .sstatic.net        | unknown     | Session   | ✅ No            |
| `receive-cookie-deprecation` | .3lift.com          | unknown     | 3 months  | ✅ No            |
| `DotomiUser`                 | .dotomi.com         | unknown     | 13 months | ✅ No            |
| `receive-cookie-deprecation` | .dotomi.com         | unknown     | 13 months | ✅ No            |
| `receive-cookie-deprecation` | prebid.media.net    | unknown     | 6 months  | ✅ No            |
| `receive-cookie-deprecation` | .casalemedia.com    | unknown     | 12 months | ✅ No            |
| `id5`                        | .id5-sync.com       | unknown     | 3 months  | ⚠️ Yes           |
| `khaos`                      | .rubiconproject.com | unknown     | 12 months | ✅ No            |
| `audit`                      | .rubiconproject.com | unknown     | 12 months | ✅ No            |
| `IDE`                        | .doubleclick.net    | advertising | 13 months | ⚠️ Yes           |
| `APC`                        | .doubleclick.net    | unknown     | 6 months  | ⚠️ Yes           |
| `flashtalkingad1`            | .flashtalking.com   | unknown     | 13 months | ✅ No            |
| `_D9J`                       | .flashtalking.com   | unknown     | 12 months | ⚠️ Yes           |

## 6. Network Requests — Detected Trackers

### Before interaction (7 tracker(s))

| Tracker            | Category    | URL                                                            | Type   |
| ------------------ | ----------- | -------------------------------------------------------------- | ------ |
| Google Tag Manager | analytics   | `https://www.googletagmanager.com/gtag/js?id=G-WCZ03SZFCQ`     | script |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/tag/js/gpt.js`          | script |
| Google DoubleClick | advertising | `https://securepubads.g.doubleclick.net/tag/js/gpt.js`         | script |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/pagead/managed/js/g...` | script |
| Google Analytics   | analytics   | `https://region1.google-analytics.com/g/collect?v=2&tid=G-...` | fetch  |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/pagead/managed/dict...` | other  |
| Tracking Pixel     | pixel       | `https://accounts.google.com/gsi/log?client_id=71776232868...` | xhr    |

### After acceptance (68 tracker(s))

| Tracker            | Category    | URL                                                            | Type     |
| ------------------ | ----------- | -------------------------------------------------------------- | -------- |
| Google Tag Manager | analytics   | `https://www.googletagmanager.com/gtag/js?id=G-WCZ03SZFCQ`     | script   |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/tag/js/gpt.js`          | script   |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/pagead/managed/js/g...` | script   |
| Google DoubleClick | advertising | `https://securepubads.g.doubleclick.net/tag/js/gpt.js`         | script   |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/pagead/managed/dict...` | other    |
| Google Analytics   | analytics   | `https://region1.google-analytics.com/g/collect?v=2&tid=G-...` | fetch    |
| Tracking Pixel     | pixel       | `https://accounts.google.com/gsi/log?client_id=71776232868...` | xhr      |
| Google Analytics   | analytics   | `https://region1.google-analytics.com/g/collect?v=2&tid=G-...` | fetch    |
| Google Analytics   | analytics   | `https://region1.analytics.google.com/g/collect?v=2&tid=G-...` | fetch    |
| Google DoubleClick | advertising | `https://stats.g.doubleclick.net/g/collect?v=2&tid=G-WCZ03...` | ping     |
| Criteo             | advertising | `https://static.criteo.net/js/ld/publishertag.ids.js`          | script   |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/gampad/ads?pvsid=67...` | fetch    |
| Google AdSense     | advertising | `https://d888e23a329526dc9ce3f0b7b6578905.safeframe.google...` | document |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/gampad/ads?pvsid=67...` | fetch    |
| Google AdSense     | advertising | `https://d888e23a329526dc9ce3f0b7b6578905.safeframe.google...` | document |
| Google AdSense     | advertising | `https://d888e23a329526dc9ce3f0b7b6578905.safeframe.google...` | document |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/bg/xBXdrLeq7aQZSZ_B...` | script   |
| Google AdSense     | advertising | `https://tpc.googlesyndication.com/safeframe/1-0-45/js/ext.js` | script   |
| Google AdSense     | advertising | `https://pagead2.googlesyndication.com/pagead/js/r20260218...` | script   |
| Google AdSense     | advertising | `https://tpc.googlesyndication.com/simgad/1623626705182823...` | image    |

_... and 48 additional request(s)._

## 7. Recommendations

1. **Add a "Reject all" button** at the first layer of the modal, requiring no more clicks than "Accept all" (CNIL 2022).

1. **Do not set any non-essential cookie before consent.** Gate the initialisation of third-party scripts on acceptance.

1. **Complete the modal information**: purposes, identity of sub-processors, retention period, right to withdraw.

1. **Remove or block non-essential cookies** after rejection, and verify consent handling server-side.

## Scan Errors and Warnings

- ⚠️ No reject button found — could not test rejection flow

## Legal References

- **RGPD Art. 7** — Conditions for consent
- **RGPD Recital 32** — Consent must result from an unambiguous positive action
- **ePrivacy Directive 2002/58/EC** — Consent requirement for non-essential cookies
- **CEPD Guidelines 05/2020** — Consent under the RGPD
- **CEPD Guidelines 03/2022** — Dark patterns on platforms
- **CNIL Recommendation 2022** — Rejection must be as easy as acceptance (same number of clicks)
