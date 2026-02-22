# GDPR Compliance Checklist — gitlab.com

> **Scan date:** 22/02/2026, 19:20:20
> **Scanned URL:** https://gitlab.com
> **Global score:** 50/100 — Grade **D**

**10 rule(s) compliant** · **1 non-compliant** · **6 warning(s)**

## Consent

| Rule                               | Reference                                                                                                                                           | Status       | Detail                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------- |
| Consent modal detected             | [GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058) | ✅ Compliant | Detected (`#onetrust-banner-sdk`) |
| No pre-ticked checkboxes           | [GDPR Recital 32](https://gdpr-info.eu/recitals/no-32/)                                                                                             | ✅ Compliant | No pre-ticked checkbox detected   |
| Accept button label is unambiguous | [GDPR Art. 4(11)](https://gdpr-info.eu/art-4-gdpr/)                                                                                                 | ✅ Compliant | Clear label: "Accept All Cookies" |

## Easy refusal

| Rule                                             | Reference                                                                                                                                                      | Status       | Detail                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------- |
| Reject button present at first layer             | [CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)                                                                   | ✅ Compliant | Detected: "Reject All"                  |
| Rejecting requires no more clicks than accepting | [CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)                                                                   | ✅ Compliant | Accept: 1 click(s) · Reject: 1 click(s) |
| Size symmetry between Accept and Reject          | [EDPB Guidelines 03/2022](https://www.edpb.europa.eu/system/files/2022-03/edpb_03-2022_guidelines_on_dark_patterns_in_social_media_platform_interfaces_en.pdf) | ✅ Compliant | Button sizes are comparable             |
| Font symmetry between Accept and Reject          | [EDPB Guidelines 03/2022](https://www.edpb.europa.eu/system/files/2022-03/edpb_03-2022_guidelines_on_dark_patterns_in_social_media_platform_interfaces_en.pdf) | ✅ Compliant | Font sizes are comparable               |

## Transparency

| Rule                                             | Reference                                                                                                                                       | Status       | Detail                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------- |
| Granular controls available                      | [EDPB Guidelines 05/2020](https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en) | ⚠️ Warning   | No granular controls (checkboxes or panel) detected   |
| Processing purposes mentioned                    | [GDPR Art. 13-14](https://gdpr-info.eu/art-13-gdpr/)                                                                                            | ⚠️ Warning   | Information absent from the modal text                |
| Sub-processors / third parties mentioned         | [GDPR Art. 13-14](https://gdpr-info.eu/art-13-gdpr/)                                                                                            | ⚠️ Warning   | Information absent from the modal text                |
| Retention period mentioned                       | [GDPR Art. 13(2)(a)](https://gdpr-info.eu/art-13-gdpr/)                                                                                         | ✅ Compliant | Mention found in the modal text                       |
| Right to withdraw consent mentioned              | [GDPR Art. 7(3)](https://gdpr-info.eu/art-7-gdpr/)                                                                                              | ⚠️ Warning   | Information absent from the modal text                |
| Privacy policy link present in the consent modal | [GDPR Art. 13](https://gdpr-info.eu/art-13-gdpr/)                                                                                               | ⚠️ Warning   | No privacy policy link found inside the consent modal |
| Privacy policy accessible from the main page     | [GDPR Art. 13](https://gdpr-info.eu/art-13-gdpr/)                                                                                               | ⚠️ Warning   | No privacy policy link found on the main page         |

## Cookie behavior

| Rule                                          | Reference                                                                                                                                           | Status           | Detail                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------- |
| No non-essential cookie before consent        | [GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058) | ✅ Compliant     | No non-essential cookie set before interaction                    |
| Non-essential cookies removed after rejection | [GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)      | ✅ Compliant     | No non-essential cookie persisting after rejection                |
| No network tracker before consent             | [GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058) | ❌ Non-compliant | 11 tracker(s): Google Tag Manager, Google AdSense, Tracking Pixel |
