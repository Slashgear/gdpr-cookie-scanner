export type Locale = "fr" | "en" | "de";

export function resolveLocale(tag: string): Locale {
  const lang = tag.toLowerCase().split(/[-_]/)[0];
  if (lang === "fr") return "fr";
  if (lang === "de") return "de";
  return "en";
}

const en = {
  // ── Report meta ────────────────────────────────────────────────
  REPORT_TITLE: "GDPR Compliance Report",
  REPORT_SCAN_DATE: "Scan date",
  REPORT_SCANNED_URL: "Scanned URL",
  REPORT_SCAN_DURATION: "Scan duration",
  REPORT_TOOL: "Tool",

  // ── Score dimensions ───────────────────────────────────────────
  SCORE_CONSENT_VALIDITY: "Consent validity",
  SCORE_EASY_REFUSAL: "Easy refusal",
  SCORE_TRANSPARENCY: "Transparency",
  SCORE_COOKIE_BEHAVIOR: "Cookie behavior",
  SCORE_CRITERION: "Criterion",
  SCORE_SCORE: "Score",
  SCORE_PROGRESS: "Progress",
  SCORE_STATUS: "Status",
  SCORE_TOTAL: "TOTAL",
  SCORE_GLOBAL_LABEL: "Global Compliance Score",
  SCORE_GRADE: "Grade",

  // ── Section titles (Markdown) ──────────────────────────────────
  SECTION_EXEC_SUMMARY: "Executive Summary",
  SECTION_CONSENT_MODAL: "1. Consent Modal",
  SECTION_DARK_PATTERNS: "2. Dark Patterns and Detected Issues",
  SECTION_COOKIES_BEFORE: "3. Cookies Set Before Any Interaction",
  SECTION_COOKIES_AFTER_REJECT: "4. Cookies After Consent Rejection",
  SECTION_COOKIES_AFTER_ACCEPT: "5. Cookies After Consent Acceptance",
  SECTION_NETWORK: "6. Network Requests — Detected Trackers",
  SECTION_RECOMMENDATIONS: "7. Recommendations",
  SECTION_ERRORS: "Scan Errors and Warnings",
  SECTION_LEGAL: "Legal References",

  // ── Executive summary ──────────────────────────────────────────
  EXEC_NO_MODAL_REQUIRED:
    "No consent modal required — no non-essential cookies or trackers detected.",
  EXEC_NO_MODAL_DETECTED:
    "**No consent modal detected.** The site sets cookies without requesting consent.",
  EXEC_MODAL_DETECTED: "Consent modal detected (`{selector}`).",
  EXEC_ILLEGAL_PRE_COOKIES:
    "**{count} non-essential cookie(s)** set before any interaction (RGPD violation).",
  EXEC_NO_ILLEGAL_PRE_COOKIES: "No non-essential cookie set before interaction.",
  EXEC_PERSIST_AFTER_REJECT:
    "**{count} non-essential cookie(s)** persisting after rejection (RGPD violation).",
  EXEC_NO_PERSIST_AFTER_REJECT: "Non-essential cookies are correctly removed after rejection.",
  EXEC_PRE_TRACKERS: "**{count} tracker request(s)** fired before consent.",
  EXEC_NO_PRE_TRACKERS: "No tracker requests before consent.",
  EXEC_SUMMARY_COUNTS:
    "**{criticalCount} critical issue(s)** and **{warningCount} warning(s)** identified.",

  // ── Consent modal section ──────────────────────────────────────
  MODAL_NOT_DETECTED: "_No consent modal detected on the page._",
  MODAL_SELECTOR: "CSS selector",
  MODAL_GRANULAR_CONTROLS: "Granular controls",
  MODAL_LAYER_COUNT: "Layer count",
  MODAL_PRIVACY_LINK: "Privacy policy link",
  MODAL_PRIVACY_LINK_NOT_FOUND: "Not found in the modal",
  MODAL_DETECTED_BUTTONS: "Detected buttons",
  MODAL_BTN_COMPARISON: "Comparative analysis: Accept / Reject",
  MODAL_BTN_SIZE_OK: "Accept / Reject button sizes are comparable.",
  MODAL_BTN_SIZE_WARN:
    "The **Accept** button ({acceptPx}px) is larger than the **Reject** button ({rejectPx}px).",
  MODAL_BTN_AREA_WARN:
    "**Accept** button area ({acceptArea}px²) is significantly larger than **Reject** ({rejectArea}px²).",
  MODAL_PRE_TICKED: "Pre-ticked checkboxes (RGPD violation)",
  MODAL_SCREENSHOT: "Screenshot",
  MODAL_TEXT_EXCERPT: "Modal text excerpt",

  // ── Button type labels ─────────────────────────────────────────
  BTN_ACCEPT: "Accept",
  BTN_REJECT: "Reject",
  BTN_PREFERENCES: "Preferences",
  BTN_CLOSE: "Close",
  BTN_UNKNOWN: "Unknown",
  BTN_HEADER_TYPE: "Button",
  BTN_HEADER_LABEL: "Text",
  BTN_HEADER_VISIBLE: "Visible",
  BTN_HEADER_FONT_SIZE: "Font size",
  BTN_HEADER_CONTRAST: "Contrast ratio",
  BTN_HEADER_CLICKS: "Clicks",

  // ── Issues section ─────────────────────────────────────────────
  ISSUES_NONE: "No dark pattern or compliance issue detected.",
  ISSUES_CRITICAL: "Critical issues",
  ISSUES_WARNINGS: "Warnings",
  ISSUES_INFO: "Information",

  // ── Cookie table ───────────────────────────────────────────────
  COOKIE_NAME: "Name",
  COOKIE_DOMAIN: "Domain",
  COOKIE_CATEGORY: "Category",
  COOKIE_EXPIRY: "Expiry",
  COOKIE_CONSENT_REQUIRED: "Consent required",
  COOKIE_NONE_DETECTED: "_No cookies detected._",
  COOKIE_PHASES: "Phases",

  // ── Expiry ─────────────────────────────────────────────────────
  EXPIRY_SESSION: "Session",
  EXPIRY_EXPIRED: "Expired",
  EXPIRY_LESS_THAN_1_DAY: "< 1 day",
  EXPIRY_DAYS: "{count} days",
  EXPIRY_MONTHS: "{count} months",

  // ── Cookie categories ──────────────────────────────────────────
  CAT_STRICTLY_NECESSARY: "Strictly necessary",
  CAT_ANALYTICS: "Analytics",
  CAT_ADVERTISING: "Advertising",
  CAT_SOCIAL: "Social",
  CAT_PERSONALIZATION: "Personalization",
  CAT_UNKNOWN: "Unknown",

  // ── Network section ────────────────────────────────────────────
  NETWORK_NONE: "_No known network tracker detected._",
  NETWORK_TRACKER: "Tracker",
  NETWORK_CATEGORY: "Category",
  NETWORK_URL: "URL",
  NETWORK_TYPE: "Type",
  NETWORK_PHASE: "Phase",
  NETWORK_BEFORE_CONSENT: "before consent",
  NETWORK_TRACKERS_COUNT: "{count} tracker(s)",

  // ── Recommendations ────────────────────────────────────────────
  REC_NO_MODAL:
    "1. **Deploy a CMP solution** (e.g. Axeptio, Didomi, OneTrust, Cookiebot) that displays a consent modal before any non-essential cookie.",
  REC_PRE_TICKED:
    "1. **Remove pre-ticked checkboxes.** Consent must result from an explicit positive action (RGPD Recital 32).",
  REC_NO_REJECT:
    '1. **Add a "Reject all" button** at the first layer of the modal, requiring no more clicks than "Accept all" (CNIL 2022).',
  REC_CLICK_ASYMMETRY:
    "1. **Balance the number of clicks** to accept and reject. Rejection must not require more steps than acceptance.",
  REC_VISUAL_ASYMMETRY:
    "1. **Equalise the styling** of the Accept / Reject buttons: same size, same colour, same level of visibility.",
  REC_AUTO_CONSENT:
    "1. **Do not set any non-essential cookie before consent.** Gate the initialisation of third-party scripts on acceptance.",
  REC_MISSING_INFO:
    "1. **Complete the modal information**: purposes, identity of sub-processors, retention period, right to withdraw.",
  REC_PERSIST_AFTER_REJECT:
    "1. **Remove or block non-essential cookies** after rejection, and verify consent handling server-side.",
  REC_NONE: "No critical recommendation. Conduct regular audits to maintain compliance.",

  // ── Cookie inventory ───────────────────────────────────────────
  INV_TITLE: "Cookie Inventory",
  INV_UNIQUE_COOKIES: "Unique cookies detected",
  INV_INSTRUCTIONS_HEADING: "Instructions",
  INV_INSTRUCTIONS_TEXT:
    'This table lists all cookies detected during the scan, across all phases.\nThe **Description / Purpose** column is to be filled in by the DPO or technical owner.\n\n- **Before consent** — cookie present from page load, before any interaction\n- **After acceptance** — cookie set or persisting after clicking "Accept all"\n- **After rejection** — cookie present after clicking "Reject all"',
  INV_COOKIE_TABLE: "Cookie table",
  INV_DESCRIPTION: "Description / Purpose",
  INV_FOOTER:
    '_Automatically generated by gdpr-cookie-scanner. Categories marked "Unknown" could not be identified automatically and should be verified manually._',

  // ── Checklist ──────────────────────────────────────────────────
  CHECKLIST_TITLE: "GDPR Compliance Checklist",
  CHECKLIST_GLOBAL_SCORE: "Global score",
  CHECKLIST_STATUS_OK: "✅ Compliant",
  CHECKLIST_STATUS_KO: "❌ Non-compliant",
  CHECKLIST_STATUS_WARN: "⚠️ Warning",
  CHECKLIST_STATUS_NA: "➖ Not applicable",
  CHECKLIST_RULES_COMPLIANT: "**{count} rule(s) compliant**",
  CHECKLIST_NON_COMPLIANT: "**{count} non-compliant**",
  CHECKLIST_WARNINGS: "**{count} warning(s)**",
  CHECKLIST_NOT_APPLICABLE: "**{count} not applicable**",
  CHECKLIST_RULE: "Rule",
  CHECKLIST_REFERENCE: "Reference",
  CHECKLIST_STATUS: "Status",
  CHECKLIST_DETAIL: "Detail",

  // ── Checklist categories ───────────────────────────────────────
  CHECKLIST_CAT_CONSENT: "Consent",
  CHECKLIST_CAT_EASY_REFUSAL: "Easy refusal",
  CHECKLIST_CAT_TRANSPARENCY: "Transparency",
  CHECKLIST_CAT_COOKIE_BEHAVIOR: "Cookie behavior",

  // ── Checklist rules ────────────────────────────────────────────
  CHECKLIST_RULE_MODAL_DETECTED: "Consent modal detected",
  CHECKLIST_RULE_NO_PRE_TICKED: "No pre-ticked checkboxes",
  CHECKLIST_RULE_ACCEPT_LABEL: "Accept button label is unambiguous",
  CHECKLIST_RULE_REJECT_BTN: "Reject button present at first layer",
  CHECKLIST_RULE_CLICK_PARITY: "Rejecting requires no more clicks than accepting",
  CHECKLIST_RULE_SIZE_SYMMETRY: "Size symmetry between Accept and Reject",
  CHECKLIST_RULE_FONT_SYMMETRY: "Font symmetry between Accept and Reject",
  CHECKLIST_RULE_GRANULAR: "Granular controls available",
  CHECKLIST_RULE_PURPOSES: "Processing purposes mentioned",
  CHECKLIST_RULE_THIRD_PARTIES: "Sub-processors / third parties mentioned",
  CHECKLIST_RULE_DURATION: "Retention period mentioned",
  CHECKLIST_RULE_WITHDRAWAL: "Right to withdraw consent mentioned",
  CHECKLIST_RULE_PRIVACY_MODAL: "Privacy policy link present in the consent modal",
  CHECKLIST_RULE_PRIVACY_PAGE: "Privacy policy accessible from the main page",
  CHECKLIST_RULE_NO_PRE_COOKIES: "No non-essential cookie before consent",
  CHECKLIST_RULE_COOKIES_REMOVED: "Non-essential cookies removed after rejection",
  CHECKLIST_RULE_NO_TRACKERS: "No network tracker before consent",

  // ── Checklist detail texts ─────────────────────────────────────
  DETAIL_MODAL_DETECTED: "Detected (`{selector}`)",
  DETAIL_NO_CONSENT_BANNER: "No consent banner detected",
  DETAIL_NOT_REQUIRED: "Not required — no non-essential cookies or trackers",
  DETAIL_NO_PRE_TICKED: "No pre-ticked checkbox detected",
  DETAIL_PRE_TICKED: "{count} pre-ticked box(es): {names}",
  DETAIL_ACCEPT_AMBIGUOUS: 'Ambiguous label: "{text}"',
  DETAIL_ACCEPT_CLEAR: 'Clear label: "{text}"',
  DETAIL_NO_ACCEPT_BTN: "No Accept button detected",
  DETAIL_REJECT_DETECTED: 'Detected: "{text}"',
  DETAIL_NO_REJECT_FIRST: "No Reject button at first layer",
  DETAIL_CLICK_PARITY: "Accept: {a} click(s) · Reject: {b} click(s)",
  DETAIL_CANNOT_VERIFY: "Cannot verify (missing buttons)",
  DETAIL_BTN_SIZES_OK: "Button sizes are comparable",
  DETAIL_BTN_FONTS_OK: "Font sizes are comparable",
  DETAIL_GRANULAR_COUNT: "{count} checkbox(es) or preferences panel detected",
  DETAIL_NO_GRANULAR: "No granular controls (checkboxes or panel) detected",
  DETAIL_INFO_ABSENT: "Information absent from the modal text",
  DETAIL_INFO_FOUND: "Mention found in the modal text",
  DETAIL_PRIVACY_LINK_FOUND: "Link found: {url}",
  DETAIL_NO_PRIVACY_MODAL: "No privacy policy link found inside the consent modal",
  DETAIL_NO_PRIVACY_PAGE: "No privacy policy link found on the main page",
  DETAIL_NO_ILLEGAL_PRE: "No non-essential cookie set before interaction",
  DETAIL_ILLEGAL_PRE: "{count} illegal cookie(s): {names}",
  DETAIL_NO_PERSIST: "No non-essential cookie persisting after rejection",
  DETAIL_PERSIST: "{count} cookie(s) persisting: {names}",
  DETAIL_NO_TRACKERS: "No tracker request fired before interaction",
  DETAIL_TRACKERS: "{count} tracker(s): {names}",

  // ── DarkPatternIssue descriptions/evidence ─────────────────────
  ISSUE_MISLEADING_ACCEPT_DESC: 'Accept button has ambiguous label: "{text}"',
  ISSUE_MISLEADING_ACCEPT_EVIDENCE: 'Button text "{text}" does not clearly express consent',
  ISSUE_NO_REJECT_DESC: "No reject/decline option found in the consent modal",
  ISSUE_NO_REJECT_EVIDENCE: "RGPD requires refusal to be as easy as acceptance (CNIL 2022)",
  ISSUE_FAKE_REJECT_DESC: 'Reject button has misleading label: "{text}"',
  ISSUE_FAKE_REJECT_EVIDENCE: "A close/dismiss button is not a valid rejection mechanism",
  ISSUE_MISSING_INFO_DESC: 'Missing required information: "{key}"',
  ISSUE_MISSING_INFO_EVIDENCE: "The consent text does not mention {key}",
  ISSUE_NO_MODAL_DESC: "No cookie consent modal detected",
  ISSUE_NO_MODAL_EVIDENCE:
    "A consent mechanism is required before depositing non-essential cookies",
  ISSUE_PRE_TICKED_DESC: "{count} checkbox(es) pre-ticked by default",
  ISSUE_PRE_TICKED_EVIDENCE:
    "Pre-ticked boxes are invalid consent under RGPD Recital 32. Affected: {names}",
  ISSUE_NO_REJECT_FIRST_DESC: "No reject button on first layer",
  ISSUE_NO_REJECT_FIRST_EVIDENCE:
    "CNIL (2022) requires reject to require no more clicks than accept",
  ISSUE_CLICK_ASYMM_DESC: "Reject requires more clicks than accept",
  ISSUE_CLICK_ASYMM_EVIDENCE: "Accept: {a} click(s), Reject: {b} click(s)",
  ISSUE_BTN_AREA_DESC: "Accept button is significantly larger than reject button",
  ISSUE_BTN_AREA_EVIDENCE: "Accept area: {acceptArea}px², Reject area: {rejectArea}px²",
  ISSUE_FONT_ASYMM_DESC: "Accept button font is significantly larger than reject button",
  ISSUE_FONT_ASYMM_EVIDENCE: "Accept: {acceptPx}px, Reject: {rejectPx}px",
  ISSUE_NO_PRIVACY_MODAL_DESC: "No privacy policy link found in the consent modal",
  ISSUE_NO_PRIVACY_MODAL_EVIDENCE:
    "GDPR Art. 13 requires the privacy policy to be accessible from the consent interface",
  ISSUE_NO_PRIVACY_PAGE_DESC: "No privacy policy link found on the page",
  ISSUE_NO_PRIVACY_PAGE_EVIDENCE:
    "A privacy policy must be accessible from every page (GDPR Art. 13)",
  ISSUE_PRE_CONSENT_COOKIES_DESC:
    "{count} non-essential cookie(s) deposited before any interaction",
  ISSUE_POST_REJECT_COOKIES_DESC: "{count} non-essential cookie(s) persist after rejection",
  ISSUE_PRE_TRACKERS_DESC: "{count} tracker request(s) fired before any consent",

  // ── Translated keys for missing-info issues ────────────────────
  INFO_KEY_PURPOSES: "purposes",
  INFO_KEY_THIRD_PARTIES: "third-parties",
  INFO_KEY_DURATION: "duration",
  INFO_KEY_WITHDRAWAL: "withdrawal",

  // ── HTML-specific labels ───────────────────────────────────────
  HTML_SCANNED_ON: "Scanned on",
  HTML_COMPLIANCE_SCORE: "Compliance score",
  HTML_NOT_DETECTED: "Not detected",
  HTML_DETECTED: "Detected",
  HTML_NO_ISSUES: "No compliance issue detected",
  HTML_NO_TRACKERS: "No network tracker detected",
  HTML_NO_REC: "No critical recommendation. Conduct regular audits to maintain compliance.",
  HTML_RULES_COUNT: "{count} rules",
  HTML_GENERATED_BY: "Generated by",
  HTML_TOC_TITLE: "Table of Contents",
  HTML_BUTTONS: "Buttons",
  HTML_SELECTOR: "Selector",
  HTML_GRANULAR_CONTROLS: "Granular controls",
  HTML_PRIVACY_LINK: "Privacy policy link",
  HTML_PRE_TICKED: "Pre-ticked checkboxes",
  HTML_COOKIES_BEFORE: "Before interaction",
  HTML_COOKIES_AFTER_REJECT: "After reject",
  HTML_COOKIES_AFTER_ACCEPT: "After accept",
  HTML_CONSENT_REQUIRED: "Required",
  HTML_NOT_REQUIRED: "No",
  HTML_BEFORE_CONSENT: "before consent",
  HTML_NO_BUTTONS: "No buttons detected.",
  HTML_NON_ESSENTIAL: "non-essential",
  HTML_NONE: "None",
  HTML_NONE_DETECTED: "None detected",
  HTML_COMPARABLE_SIZES: "Comparable sizes",
  HTML_ACCEPT_LARGER: "Accept button is significantly larger",
  HTML_CORRECTLY_REMOVED: "Correctly removed",
  HTML_CONTROLS_DETECTED: "{count} control(s) detected",
  HTML_NO_GRANULAR: "No granular controls",
  HTML_NO_ACCEPT_BTN: "No accept button",
  HTML_CANNOT_VERIFY: "Cannot verify",
  HTML_NO_CONSENT_BANNER: "No consent banner was found on the page.",
  HTML_REJECT_AT_FIRST: "Reject \u2264 clicks than accept",
  HTML_TRACKERS_BEFORE: "{count} before consent",
  HTML_ISSUES: "Issues",
  HTML_CONSENT_MODAL: "Consent modal",
  HTML_COOKIES: "Cookies",
  HTML_NETWORK_TRACKERS: "Network trackers",
  HTML_RECOMMENDATIONS: "Recommendations",
  HTML_COMPLIANCE_CHECKLIST: "Compliance checklist",
  HTML_CRITICAL: "critical",
  HTML_WARNING: "warning",
  HTML_WARNINGS: "warnings",

  // ── Phase labels (cookie inventory) ───────────────────────────
  PHASE_BEFORE_CONSENT: "before consent",
  PHASE_AFTER_ACCEPTANCE: "after acceptance",
  PHASE_AFTER_REJECTION: "after rejection",
} satisfies Record<string, string>;

export type TranslationKey = keyof typeof en;

type Dict = Partial<Record<TranslationKey, string>>;

const fr: Dict = {
  // ── Report meta ────────────────────────────────────────────────
  REPORT_TITLE: "Rapport de conformité RGPD",
  REPORT_SCAN_DATE: "Date d'analyse",
  REPORT_SCANNED_URL: "URL analysée",
  REPORT_SCAN_DURATION: "Durée d'analyse",
  REPORT_TOOL: "Outil",

  // ── Score dimensions ───────────────────────────────────────────
  SCORE_CONSENT_VALIDITY: "Validité du consentement",
  SCORE_EASY_REFUSAL: "Facilité de refus",
  SCORE_TRANSPARENCY: "Transparence",
  SCORE_COOKIE_BEHAVIOR: "Comportement des cookies",
  SCORE_CRITERION: "Critère",
  SCORE_SCORE: "Score",
  SCORE_PROGRESS: "Progression",
  SCORE_STATUS: "Statut",
  SCORE_TOTAL: "TOTAL",
  SCORE_GLOBAL_LABEL: "Score de conformité global",
  SCORE_GRADE: "Note",

  // ── Section titles ─────────────────────────────────────────────
  SECTION_EXEC_SUMMARY: "Résumé exécutif",
  SECTION_CONSENT_MODAL: "1. Bandeau de consentement",
  SECTION_DARK_PATTERNS: "2. Dark patterns et problèmes détectés",
  SECTION_COOKIES_BEFORE: "3. Cookies déposés avant toute interaction",
  SECTION_COOKIES_AFTER_REJECT: "4. Cookies après refus du consentement",
  SECTION_COOKIES_AFTER_ACCEPT: "5. Cookies après acceptation du consentement",
  SECTION_NETWORK: "6. Requêtes réseau — Traceurs détectés",
  SECTION_RECOMMENDATIONS: "7. Recommandations",
  SECTION_ERRORS: "Erreurs et avertissements d'analyse",
  SECTION_LEGAL: "Références légales",

  // ── Executive summary ──────────────────────────────────────────
  EXEC_NO_MODAL_REQUIRED:
    "Aucun bandeau de consentement requis — aucun cookie ou traceur non essentiel détecté.",
  EXEC_NO_MODAL_DETECTED:
    "**Aucun bandeau de consentement détecté.** Le site dépose des cookies sans demander le consentement.",
  EXEC_MODAL_DETECTED: "Bandeau de consentement détecté (`{selector}`).",
  EXEC_ILLEGAL_PRE_COOKIES:
    "**{count} cookie(s) non essentiel(s)** déposé(s) avant toute interaction (violation RGPD).",
  EXEC_NO_ILLEGAL_PRE_COOKIES: "Aucun cookie non essentiel déposé avant interaction.",
  EXEC_PERSIST_AFTER_REJECT:
    "**{count} cookie(s) non essentiel(s)** persistant après refus (violation RGPD).",
  EXEC_NO_PERSIST_AFTER_REJECT:
    "Les cookies non essentiels sont correctement supprimés après refus.",
  EXEC_PRE_TRACKERS: "**{count} requête(s) de traceur** émise(s) avant consentement.",
  EXEC_NO_PRE_TRACKERS: "Aucune requête de traceur avant consentement.",
  EXEC_SUMMARY_COUNTS:
    "**{criticalCount} problème(s) critique(s)** et **{warningCount} avertissement(s)** identifiés.",

  // ── Consent modal section ──────────────────────────────────────
  MODAL_NOT_DETECTED: "_Aucun bandeau de consentement détecté sur la page._",
  MODAL_SELECTOR: "Sélecteur CSS",
  MODAL_GRANULAR_CONTROLS: "Contrôles granulaires",
  MODAL_LAYER_COUNT: "Nombre de couches",
  MODAL_PRIVACY_LINK: "Lien politique de confidentialité",
  MODAL_PRIVACY_LINK_NOT_FOUND: "Non trouvé dans le bandeau",
  MODAL_DETECTED_BUTTONS: "Boutons détectés",
  MODAL_BTN_COMPARISON: "Analyse comparative : Accepter / Refuser",
  MODAL_BTN_SIZE_OK: "Les tailles des boutons Accepter / Refuser sont comparables.",
  MODAL_BTN_SIZE_WARN:
    "Le bouton **Accepter** ({acceptPx}px) est plus grand que le bouton **Refuser** ({rejectPx}px).",
  MODAL_BTN_AREA_WARN:
    "La surface du bouton **Accepter** ({acceptArea}px²) est significativement plus grande que celle de **Refuser** ({rejectArea}px²).",
  MODAL_PRE_TICKED: "Cases pré-cochées (violation RGPD)",
  MODAL_SCREENSHOT: "Capture d'écran",
  MODAL_TEXT_EXCERPT: "Extrait du texte du bandeau",

  // ── Button type labels ─────────────────────────────────────────
  BTN_ACCEPT: "Accepter",
  BTN_REJECT: "Refuser",
  BTN_PREFERENCES: "Préférences",
  BTN_CLOSE: "Fermer",
  BTN_UNKNOWN: "Inconnu",
  BTN_HEADER_TYPE: "Bouton",
  BTN_HEADER_LABEL: "Texte",
  BTN_HEADER_VISIBLE: "Visible",
  BTN_HEADER_FONT_SIZE: "Taille police",
  BTN_HEADER_CONTRAST: "Ratio de contraste",
  BTN_HEADER_CLICKS: "Clics",

  // ── Issues section ─────────────────────────────────────────────
  ISSUES_NONE: "Aucun dark pattern ou problème de conformité détecté.",
  ISSUES_CRITICAL: "Problèmes critiques",
  ISSUES_WARNINGS: "Avertissements",
  ISSUES_INFO: "Informations",

  // ── Cookie table ───────────────────────────────────────────────
  COOKIE_NAME: "Nom",
  COOKIE_DOMAIN: "Domaine",
  COOKIE_CATEGORY: "Catégorie",
  COOKIE_EXPIRY: "Expiration",
  COOKIE_CONSENT_REQUIRED: "Consentement requis",
  COOKIE_NONE_DETECTED: "_Aucun cookie détecté._",
  COOKIE_PHASES: "Phases",

  // ── Expiry ─────────────────────────────────────────────────────
  EXPIRY_SESSION: "Session",
  EXPIRY_EXPIRED: "Expiré",
  EXPIRY_LESS_THAN_1_DAY: "< 1 jour",
  EXPIRY_DAYS: "{count} jours",
  EXPIRY_MONTHS: "{count} mois",

  // ── Cookie categories ──────────────────────────────────────────
  CAT_STRICTLY_NECESSARY: "Strictement nécessaire",
  CAT_ANALYTICS: "Analytique",
  CAT_ADVERTISING: "Publicité",
  CAT_SOCIAL: "Réseaux sociaux",
  CAT_PERSONALIZATION: "Personnalisation",
  CAT_UNKNOWN: "Inconnu",

  // ── Network section ────────────────────────────────────────────
  NETWORK_NONE: "_Aucun traceur réseau connu détecté._",
  NETWORK_TRACKER: "Traceur",
  NETWORK_CATEGORY: "Catégorie",
  NETWORK_URL: "URL",
  NETWORK_TYPE: "Type",
  NETWORK_PHASE: "Phase",
  NETWORK_BEFORE_CONSENT: "avant consentement",
  NETWORK_TRACKERS_COUNT: "{count} traceur(s)",

  // ── Recommendations ────────────────────────────────────────────
  REC_NO_MODAL:
    "1. **Déployer une solution CMP** (ex. Axeptio, Didomi, OneTrust, Cookiebot) affichant un bandeau de consentement avant tout cookie non essentiel.",
  REC_PRE_TICKED:
    "1. **Supprimer les cases pré-cochées.** Le consentement doit résulter d'une action positive explicite (RGPD Considérant 32).",
  REC_NO_REJECT:
    "1. **Ajouter un bouton « Tout refuser »** en premier niveau du bandeau, nécessitant au plus autant de clics que « Tout accepter » (CNIL 2022).",
  REC_CLICK_ASYMMETRY:
    "1. **Équilibrer le nombre de clics** pour accepter et refuser. Le refus ne doit pas nécessiter davantage d'étapes que l'acceptation.",
  REC_VISUAL_ASYMMETRY:
    "1. **Uniformiser le style** des boutons Accepter / Refuser : même taille, même couleur, même niveau de visibilité.",
  REC_AUTO_CONSENT:
    "1. **Ne pas déposer de cookie non essentiel avant consentement.** Conditionner l'initialisation des scripts tiers au callback d'acceptation.",
  REC_MISSING_INFO:
    "1. **Compléter les informations du bandeau** : finalités, identité des sous-traitants, durée de conservation, droit de retrait.",
  REC_PERSIST_AFTER_REJECT:
    "1. **Supprimer ou bloquer les cookies non essentiels** après refus, et vérifier la gestion du consentement côté serveur.",
  REC_NONE:
    "Aucune recommandation critique. Procédez à des audits réguliers pour maintenir la conformité.",

  // ── Cookie inventory ───────────────────────────────────────────
  INV_TITLE: "Inventaire des cookies",
  INV_UNIQUE_COOKIES: "Cookies uniques détectés",
  INV_INSTRUCTIONS_HEADING: "Instructions",
  INV_INSTRUCTIONS_TEXT:
    "Ce tableau liste tous les cookies détectés durant l'analyse, toutes phases confondues.\nLa colonne **Description / Finalité** est à compléter par le DPO ou le responsable technique.\n\n- **Avant consentement** — cookie présent au chargement de la page, avant toute interaction\n- **Après acceptation** — cookie déposé ou persistant après « Tout accepter »\n- **Après refus** — cookie présent après « Tout refuser »",
  INV_COOKIE_TABLE: "Tableau des cookies",
  INV_DESCRIPTION: "Description / Finalité",
  INV_FOOTER:
    "_Généré automatiquement par gdpr-cookie-scanner. Les catégories marquées « Inconnu » n'ont pas pu être identifiées automatiquement et doivent être vérifiées manuellement._",

  // ── Checklist ──────────────────────────────────────────────────
  CHECKLIST_TITLE: "Checklist de conformité RGPD",
  CHECKLIST_GLOBAL_SCORE: "Score global",
  CHECKLIST_STATUS_OK: "✅ Conforme",
  CHECKLIST_STATUS_KO: "❌ Non conforme",
  CHECKLIST_STATUS_WARN: "⚠️ Avertissement",
  CHECKLIST_STATUS_NA: "➖ Non applicable",
  CHECKLIST_RULES_COMPLIANT: "**{count} règle(s) conforme(s)**",
  CHECKLIST_NON_COMPLIANT: "**{count} non conforme(s)**",
  CHECKLIST_WARNINGS: "**{count} avertissement(s)**",
  CHECKLIST_NOT_APPLICABLE: "**{count} non applicable(s)**",
  CHECKLIST_RULE: "Règle",
  CHECKLIST_REFERENCE: "Référence",
  CHECKLIST_STATUS: "Statut",
  CHECKLIST_DETAIL: "Détail",

  // ── Checklist categories ───────────────────────────────────────
  CHECKLIST_CAT_CONSENT: "Consentement",
  CHECKLIST_CAT_EASY_REFUSAL: "Facilité de refus",
  CHECKLIST_CAT_TRANSPARENCY: "Transparence",
  CHECKLIST_CAT_COOKIE_BEHAVIOR: "Comportement des cookies",

  // ── Checklist rules ────────────────────────────────────────────
  CHECKLIST_RULE_MODAL_DETECTED: "Bandeau de consentement détecté",
  CHECKLIST_RULE_NO_PRE_TICKED: "Aucune case pré-cochée",
  CHECKLIST_RULE_ACCEPT_LABEL: "Libellé du bouton d'acceptation non ambigu",
  CHECKLIST_RULE_REJECT_BTN: "Bouton de refus présent en premier niveau",
  CHECKLIST_RULE_CLICK_PARITY: "Refuser ne nécessite pas plus de clics qu'accepter",
  CHECKLIST_RULE_SIZE_SYMMETRY: "Symétrie de taille entre Accepter et Refuser",
  CHECKLIST_RULE_FONT_SYMMETRY: "Symétrie de police entre Accepter et Refuser",
  CHECKLIST_RULE_GRANULAR: "Contrôles granulaires disponibles",
  CHECKLIST_RULE_PURPOSES: "Finalités de traitement mentionnées",
  CHECKLIST_RULE_THIRD_PARTIES: "Sous-traitants / tiers mentionnés",
  CHECKLIST_RULE_DURATION: "Durée de conservation mentionnée",
  CHECKLIST_RULE_WITHDRAWAL: "Droit de retrait du consentement mentionné",
  CHECKLIST_RULE_PRIVACY_MODAL: "Lien vers la politique de confidentialité dans le bandeau",
  CHECKLIST_RULE_PRIVACY_PAGE: "Politique de confidentialité accessible depuis la page principale",
  CHECKLIST_RULE_NO_PRE_COOKIES: "Aucun cookie non essentiel avant consentement",
  CHECKLIST_RULE_COOKIES_REMOVED: "Cookies non essentiels supprimés après refus",
  CHECKLIST_RULE_NO_TRACKERS: "Aucun traceur réseau avant consentement",

  // ── Checklist detail texts ─────────────────────────────────────
  DETAIL_MODAL_DETECTED: "Détecté (`{selector}`)",
  DETAIL_NO_CONSENT_BANNER: "Aucun bandeau de consentement détecté",
  DETAIL_NOT_REQUIRED: "Non requis — aucun cookie ou traceur non essentiel",
  DETAIL_NO_PRE_TICKED: "Aucune case pré-cochée détectée",
  DETAIL_PRE_TICKED: "{count} case(s) pré-cochée(s) : {names}",
  DETAIL_ACCEPT_AMBIGUOUS: "Libellé ambigu : « {text} »",
  DETAIL_ACCEPT_CLEAR: "Libellé clair : « {text} »",
  DETAIL_NO_ACCEPT_BTN: "Aucun bouton Accepter détecté",
  DETAIL_REJECT_DETECTED: "Détecté : « {text} »",
  DETAIL_NO_REJECT_FIRST: "Aucun bouton Refuser en premier niveau",
  DETAIL_CLICK_PARITY: "Accepter : {a} clic(s) · Refuser : {b} clic(s)",
  DETAIL_CANNOT_VERIFY: "Impossible à vérifier (boutons manquants)",
  DETAIL_BTN_SIZES_OK: "Les tailles des boutons sont comparables",
  DETAIL_BTN_FONTS_OK: "Les tailles de police sont comparables",
  DETAIL_GRANULAR_COUNT: "{count} case(s) à cocher ou panneau de préférences détecté(s)",
  DETAIL_NO_GRANULAR: "Aucun contrôle granulaire (cases à cocher ou panneau) détecté",
  DETAIL_INFO_ABSENT: "Information absente du texte du bandeau",
  DETAIL_INFO_FOUND: "Mention trouvée dans le texte du bandeau",
  DETAIL_PRIVACY_LINK_FOUND: "Lien trouvé : {url}",
  DETAIL_NO_PRIVACY_MODAL: "Aucun lien vers la politique de confidentialité dans le bandeau",
  DETAIL_NO_PRIVACY_PAGE: "Aucun lien vers la politique de confidentialité sur la page principale",
  DETAIL_NO_ILLEGAL_PRE: "Aucun cookie non essentiel déposé avant interaction",
  DETAIL_ILLEGAL_PRE: "{count} cookie(s) illégal(aux) : {names}",
  DETAIL_NO_PERSIST: "Aucun cookie non essentiel persistant après refus",
  DETAIL_PERSIST: "{count} cookie(s) persistant(s) : {names}",
  DETAIL_NO_TRACKERS: "Aucune requête de traceur émise avant interaction",
  DETAIL_TRACKERS: "{count} traceur(s) : {names}",

  // ── DarkPatternIssue descriptions/evidence ─────────────────────
  ISSUE_MISLEADING_ACCEPT_DESC: "Le bouton d'acceptation a un libellé ambigu : « {text} »",
  ISSUE_MISLEADING_ACCEPT_EVIDENCE: "Le texte « {text} » n'exprime pas clairement un consentement",
  ISSUE_NO_REJECT_DESC: "Aucune option de refus trouvée dans le bandeau de consentement",
  ISSUE_NO_REJECT_EVIDENCE:
    "Le RGPD exige que le refus soit aussi facile que l'acceptation (CNIL 2022)",
  ISSUE_FAKE_REJECT_DESC: "Le bouton de refus a un libellé trompeur : « {text} »",
  ISSUE_FAKE_REJECT_EVIDENCE: "Un bouton fermer/ignorer n'est pas un mécanisme de refus valide",
  ISSUE_MISSING_INFO_DESC: "Information requise manquante : « {key} »",
  ISSUE_MISSING_INFO_EVIDENCE: "Le texte du consentement ne mentionne pas {key}",
  ISSUE_NO_MODAL_DESC: "Aucun bandeau de consentement aux cookies détecté",
  ISSUE_NO_MODAL_EVIDENCE:
    "Un mécanisme de consentement est requis avant le dépôt de cookies non essentiels",
  ISSUE_PRE_TICKED_DESC: "{count} case(s) pré-cochée(s) par défaut",
  ISSUE_PRE_TICKED_EVIDENCE:
    "Les cases pré-cochées constituent un consentement invalide (RGPD Considérant 32). Concerné(s) : {names}",
  ISSUE_NO_REJECT_FIRST_DESC: "Aucun bouton de refus en premier niveau",
  ISSUE_NO_REJECT_FIRST_EVIDENCE:
    "La CNIL (2022) exige que le refus ne nécessite pas plus de clics que l'acceptation",
  ISSUE_CLICK_ASYMM_DESC: "Refuser nécessite plus de clics qu'accepter",
  ISSUE_CLICK_ASYMM_EVIDENCE: "Accepter : {a} clic(s), Refuser : {b} clic(s)",
  ISSUE_BTN_AREA_DESC: "Le bouton Accepter est significativement plus grand que le bouton Refuser",
  ISSUE_BTN_AREA_EVIDENCE: "Surface Accepter : {acceptArea}px², Refuser : {rejectArea}px²",
  ISSUE_FONT_ASYMM_DESC:
    "La police du bouton Accepter est significativement plus grande que celle du bouton Refuser",
  ISSUE_FONT_ASYMM_EVIDENCE: "Accepter : {acceptPx}px, Refuser : {rejectPx}px",
  ISSUE_NO_PRIVACY_MODAL_DESC:
    "Aucun lien vers la politique de confidentialité dans le bandeau de consentement",
  ISSUE_NO_PRIVACY_MODAL_EVIDENCE:
    "L'art. 13 du RGPD exige que la politique de confidentialité soit accessible depuis l'interface de consentement",
  ISSUE_NO_PRIVACY_PAGE_DESC: "Aucun lien vers la politique de confidentialité sur la page",
  ISSUE_NO_PRIVACY_PAGE_EVIDENCE:
    "Une politique de confidentialité doit être accessible depuis chaque page (RGPD Art. 13)",
  ISSUE_PRE_CONSENT_COOKIES_DESC:
    "{count} cookie(s) non essentiel(s) déposé(s) avant toute interaction",
  ISSUE_POST_REJECT_COOKIES_DESC: "{count} cookie(s) non essentiel(s) persistant(s) après refus",
  ISSUE_PRE_TRACKERS_DESC: "{count} requête(s) de traceur émise(s) avant tout consentement",

  // ── Translated keys for missing-info issues ────────────────────
  INFO_KEY_PURPOSES: "finalités",
  INFO_KEY_THIRD_PARTIES: "tiers",
  INFO_KEY_DURATION: "durée",
  INFO_KEY_WITHDRAWAL: "droit de retrait",

  // ── HTML-specific labels ───────────────────────────────────────
  HTML_SCANNED_ON: "Analysé le",
  HTML_COMPLIANCE_SCORE: "Score de conformité",
  HTML_NOT_DETECTED: "Non détecté",
  HTML_DETECTED: "Détecté",
  HTML_NO_ISSUES: "Aucun problème de conformité détecté",
  HTML_NO_TRACKERS: "Aucun traceur réseau détecté",
  HTML_NO_REC:
    "Aucune recommandation critique. Procédez à des audits réguliers pour maintenir la conformité.",
  HTML_RULES_COUNT: "{count} règles",
  HTML_GENERATED_BY: "Généré par",
  HTML_TOC_TITLE: "Table des matières",
  HTML_BUTTONS: "Boutons",
  HTML_SELECTOR: "Sélecteur",
  HTML_GRANULAR_CONTROLS: "Contrôles granulaires",
  HTML_PRIVACY_LINK: "Politique de confidentialité",
  HTML_PRE_TICKED: "Cases pré-cochées",
  HTML_COOKIES_BEFORE: "Avant interaction",
  HTML_COOKIES_AFTER_REJECT: "Après refus",
  HTML_COOKIES_AFTER_ACCEPT: "Après acceptation",
  HTML_CONSENT_REQUIRED: "Requis",
  HTML_NOT_REQUIRED: "Non",
  HTML_BEFORE_CONSENT: "avant consentement",
  HTML_NO_BUTTONS: "Aucun bouton détecté.",
  HTML_NON_ESSENTIAL: "non essentiel(s)",
  HTML_NONE: "Aucun",
  HTML_NONE_DETECTED: "Aucun détecté",
  HTML_COMPARABLE_SIZES: "Tailles comparables",
  HTML_ACCEPT_LARGER: "Le bouton Accepter est significativement plus grand",
  HTML_CORRECTLY_REMOVED: "Correctement supprimés",
  HTML_CONTROLS_DETECTED: "{count} contrôle(s) détecté(s)",
  HTML_NO_GRANULAR: "Aucun contrôle granulaire",
  HTML_NO_ACCEPT_BTN: "Aucun bouton accepter",
  HTML_CANNOT_VERIFY: "Impossible à vérifier",
  HTML_NO_CONSENT_BANNER: "Aucun bandeau de consentement trouvé sur la page.",
  HTML_REJECT_AT_FIRST: "Refuser \u2264 clics qu'accepter",
  HTML_TRACKERS_BEFORE: "{count} avant consentement",
  HTML_ISSUES: "Problèmes",
  HTML_CONSENT_MODAL: "Bandeau de consentement",
  HTML_COOKIES: "Cookies",
  HTML_NETWORK_TRACKERS: "Traceurs réseau",
  HTML_RECOMMENDATIONS: "Recommandations",
  HTML_COMPLIANCE_CHECKLIST: "Checklist de conformité",
  HTML_CRITICAL: "critique(s)",
  HTML_WARNING: "avertissement",
  HTML_WARNINGS: "avertissements",

  // ── Phase labels ───────────────────────────────────────────────
  PHASE_BEFORE_CONSENT: "avant consentement",
  PHASE_AFTER_ACCEPTANCE: "après acceptation",
  PHASE_AFTER_REJECTION: "après refus",
};

const de: Dict = {
  // ── Report meta ────────────────────────────────────────────────
  REPORT_TITLE: "DSGVO-Konformitätsbericht",
  REPORT_SCAN_DATE: "Scan-Datum",
  REPORT_SCANNED_URL: "Gescannte URL",
  REPORT_SCAN_DURATION: "Scan-Dauer",
  REPORT_TOOL: "Tool",

  // ── Score dimensions ───────────────────────────────────────────
  SCORE_CONSENT_VALIDITY: "Einwilligungsgültigkeit",
  SCORE_EASY_REFUSAL: "Ablehnungskomfort",
  SCORE_TRANSPARENCY: "Transparenz",
  SCORE_COOKIE_BEHAVIOR: "Cookie-Verhalten",
  SCORE_CRITERION: "Kriterium",
  SCORE_SCORE: "Punkte",
  SCORE_PROGRESS: "Fortschritt",
  SCORE_STATUS: "Status",
  SCORE_TOTAL: "GESAMT",
  SCORE_GLOBAL_LABEL: "Gesamtkonformitätswert",
  SCORE_GRADE: "Note",

  // ── Section titles ─────────────────────────────────────────────
  SECTION_EXEC_SUMMARY: "Zusammenfassung",
  SECTION_CONSENT_MODAL: "1. Einwilligungsbanner",
  SECTION_DARK_PATTERNS: "2. Dark Patterns und erkannte Probleme",
  SECTION_COOKIES_BEFORE: "3. Cookies vor jeder Interaktion",
  SECTION_COOKIES_AFTER_REJECT: "4. Cookies nach Ablehnung",
  SECTION_COOKIES_AFTER_ACCEPT: "5. Cookies nach Zustimmung",
  SECTION_NETWORK: "6. Netzwerkanfragen — Erkannte Tracker",
  SECTION_RECOMMENDATIONS: "7. Empfehlungen",
  SECTION_ERRORS: "Scan-Fehler und Warnungen",
  SECTION_LEGAL: "Rechtliche Grundlagen",

  // ── Executive summary ──────────────────────────────────────────
  EXEC_NO_MODAL_REQUIRED:
    "Kein Einwilligungsbanner erforderlich — keine nicht-essenziellen Cookies oder Tracker erkannt.",
  EXEC_NO_MODAL_DETECTED:
    "**Kein Einwilligungsbanner erkannt.** Die Website setzt Cookies ohne Einwilligung.",
  EXEC_MODAL_DETECTED: "Einwilligungsbanner erkannt (`{selector}`).",
  EXEC_ILLEGAL_PRE_COOKIES:
    "**{count} nicht-essenzielle(r) Cookie(s)** vor jeder Interaktion gesetzt (DSGVO-Verstoß).",
  EXEC_NO_ILLEGAL_PRE_COOKIES: "Kein nicht-essenzieller Cookie vor Interaktion gesetzt.",
  EXEC_PERSIST_AFTER_REJECT:
    "**{count} nicht-essenzielle(r) Cookie(s)** nach Ablehnung persistent (DSGVO-Verstoß).",
  EXEC_NO_PERSIST_AFTER_REJECT: "Nicht-essenzielle Cookies werden nach Ablehnung korrekt entfernt.",
  EXEC_PRE_TRACKERS: "**{count} Tracker-Anfrage(n)** vor Einwilligung gesendet.",
  EXEC_NO_PRE_TRACKERS: "Keine Tracker-Anfragen vor der Einwilligung.",
  EXEC_SUMMARY_COUNTS:
    "**{criticalCount} kritisches/kritische Problem(e)** und **{warningCount} Warnung(en)** identifiziert.",

  // ── Consent modal section ──────────────────────────────────────
  MODAL_NOT_DETECTED: "_Kein Einwilligungsbanner auf der Seite erkannt._",
  MODAL_SELECTOR: "CSS-Selektor",
  MODAL_GRANULAR_CONTROLS: "Granulare Steuerelemente",
  MODAL_LAYER_COUNT: "Ebenenanzahl",
  MODAL_PRIVACY_LINK: "Link zur Datenschutzerklärung",
  MODAL_PRIVACY_LINK_NOT_FOUND: "Nicht im Banner gefunden",
  MODAL_DETECTED_BUTTONS: "Erkannte Schaltflächen",
  MODAL_BTN_COMPARISON: "Vergleichsanalyse: Akzeptieren / Ablehnen",
  MODAL_BTN_SIZE_OK: "Die Größen der Schaltflächen Akzeptieren / Ablehnen sind vergleichbar.",
  MODAL_BTN_SIZE_WARN:
    "Die Schaltfläche **Akzeptieren** ({acceptPx}px) ist größer als **Ablehnen** ({rejectPx}px).",
  MODAL_BTN_AREA_WARN:
    "Die Fläche der Schaltfläche **Akzeptieren** ({acceptArea}px²) ist erheblich größer als **Ablehnen** ({rejectArea}px²).",
  MODAL_PRE_TICKED: "Vorausgewählte Kontrollkästchen (DSGVO-Verstoß)",
  MODAL_SCREENSHOT: "Screenshot",
  MODAL_TEXT_EXCERPT: "Textauszug des Banners",

  // ── Button type labels ─────────────────────────────────────────
  BTN_ACCEPT: "Akzeptieren",
  BTN_REJECT: "Ablehnen",
  BTN_PREFERENCES: "Einstellungen",
  BTN_CLOSE: "Schließen",
  BTN_UNKNOWN: "Unbekannt",
  BTN_HEADER_TYPE: "Schaltfläche",
  BTN_HEADER_LABEL: "Text",
  BTN_HEADER_VISIBLE: "Sichtbar",
  BTN_HEADER_FONT_SIZE: "Schriftgröße",
  BTN_HEADER_CONTRAST: "Kontrastverhältnis",
  BTN_HEADER_CLICKS: "Klicks",

  // ── Issues section ─────────────────────────────────────────────
  ISSUES_NONE: "Kein Dark Pattern oder Konformitätsproblem erkannt.",
  ISSUES_CRITICAL: "Kritische Probleme",
  ISSUES_WARNINGS: "Warnungen",
  ISSUES_INFO: "Informationen",

  // ── Cookie table ───────────────────────────────────────────────
  COOKIE_NAME: "Name",
  COOKIE_DOMAIN: "Domain",
  COOKIE_CATEGORY: "Kategorie",
  COOKIE_EXPIRY: "Ablauf",
  COOKIE_CONSENT_REQUIRED: "Einwilligung erforderlich",
  COOKIE_NONE_DETECTED: "_Keine Cookies erkannt._",
  COOKIE_PHASES: "Phasen",

  // ── Expiry ─────────────────────────────────────────────────────
  EXPIRY_SESSION: "Sitzung",
  EXPIRY_EXPIRED: "Abgelaufen",
  EXPIRY_LESS_THAN_1_DAY: "< 1 Tag",
  EXPIRY_DAYS: "{count} Tage",
  EXPIRY_MONTHS: "{count} Monate",

  // ── Cookie categories ──────────────────────────────────────────
  CAT_STRICTLY_NECESSARY: "Unbedingt erforderlich",
  CAT_ANALYTICS: "Analytik",
  CAT_ADVERTISING: "Werbung",
  CAT_SOCIAL: "Soziale Medien",
  CAT_PERSONALIZATION: "Personalisierung",
  CAT_UNKNOWN: "Unbekannt",

  // ── Network section ────────────────────────────────────────────
  NETWORK_NONE: "_Keine bekannten Netzwerk-Tracker erkannt._",
  NETWORK_TRACKER: "Tracker",
  NETWORK_CATEGORY: "Kategorie",
  NETWORK_URL: "URL",
  NETWORK_TYPE: "Typ",
  NETWORK_PHASE: "Phase",
  NETWORK_BEFORE_CONSENT: "vor Einwilligung",
  NETWORK_TRACKERS_COUNT: "{count} Tracker",

  // ── Recommendations ────────────────────────────────────────────
  REC_NO_MODAL:
    "1. **Eine CMP-Lösung bereitstellen** (z. B. Axeptio, Didomi, OneTrust, Cookiebot), die ein Einwilligungsbanner vor jedem nicht-essenziellen Cookie anzeigt.",
  REC_PRE_TICKED:
    "1. **Vorausgewählte Kontrollkästchen entfernen.** Die Einwilligung muss durch eine ausdrückliche positive Handlung erfolgen (DSGVO Erwägungsgrund 32).",
  REC_NO_REJECT:
    "1. **Schaltfläche „Alles ablehnen“ hinzufügen**, die im ersten Level des Banners nicht mehr Klicks erfordert als „Alles akzeptieren“ (CNIL 2022).",
  REC_CLICK_ASYMMETRY:
    "1. **Die Klickanzahl** für Akzeptieren und Ablehnen angleichen. Das Ablehnen darf nicht mehr Schritte erfordern als das Akzeptieren.",
  REC_VISUAL_ASYMMETRY:
    "1. **Das Styling der Schaltflächen** Akzeptieren / Ablehnen vereinheitlichen: gleiche Größe, gleiche Farbe, gleiche Sichtbarkeit.",
  REC_AUTO_CONSENT:
    "1. **Keinen nicht-essenziellen Cookie vor der Einwilligung setzen.** Die Initialisierung von Drittanbieter-Skripten an den Akzeptieren-Callback binden.",
  REC_MISSING_INFO:
    "1. **Die Banner-Informationen vervollständigen**: Zwecke, Identität der Auftragsverarbeiter, Aufbewahrungsfrist, Widerrufsrecht.",
  REC_PERSIST_AFTER_REJECT:
    "1. **Nicht-essenzielle Cookies nach Ablehnung entfernen oder blockieren** und die serverseitige Einwilligungsverwaltung überprüfen.",
  REC_NONE:
    "Keine kritischen Empfehlungen. Führen Sie regelmäßige Audits durch, um die Konformität aufrechtzuerhalten.",

  // ── Cookie inventory ───────────────────────────────────────────
  INV_TITLE: "Cookie-Inventar",
  INV_UNIQUE_COOKIES: "Erkannte eindeutige Cookies",
  INV_INSTRUCTIONS_HEADING: "Anweisungen",
  INV_INSTRUCTIONS_TEXT:
    "Diese Tabelle listet alle während des Scans erkannten Cookies über alle Phasen hinweg auf.\nDie Spalte **Beschreibung / Zweck** ist vom DSB oder technischen Verantwortlichen auszufüllen.\n\n- **Vor der Einwilligung** — Cookie beim Seitenaufruf vorhanden, vor jeder Interaktion\n- **Nach Akzeptierung** — Cookie nach Klick auf „Alles akzeptieren“ gesetzt oder persistent\n- **Nach Ablehnung** — Cookie nach Klick auf „Alles ablehnen“ vorhanden",
  INV_COOKIE_TABLE: "Cookie-Tabelle",
  INV_DESCRIPTION: "Beschreibung / Zweck",
  INV_FOOTER:
    "_Automatisch generiert von gdpr-cookie-scanner. Als „Unbekannt“ markierte Kategorien konnten nicht automatisch identifiziert werden und sollten manuell überprüft werden._",

  // ── Checklist ──────────────────────────────────────────────────
  CHECKLIST_TITLE: "DSGVO-Konformitäts-Checkliste",
  CHECKLIST_GLOBAL_SCORE: "Gesamtwert",
  CHECKLIST_STATUS_OK: "✅ Konform",
  CHECKLIST_STATUS_KO: "❌ Nicht konform",
  CHECKLIST_STATUS_WARN: "⚠️ Warnung",
  CHECKLIST_STATUS_NA: "➖ Nicht anwendbar",
  CHECKLIST_RULES_COMPLIANT: "**{count} Regel(n) konform**",
  CHECKLIST_NON_COMPLIANT: "**{count} nicht konform**",
  CHECKLIST_WARNINGS: "**{count} Warnung(en)**",
  CHECKLIST_NOT_APPLICABLE: "**{count} nicht anwendbar**",
  CHECKLIST_RULE: "Regel",
  CHECKLIST_REFERENCE: "Referenz",
  CHECKLIST_STATUS: "Status",
  CHECKLIST_DETAIL: "Detail",

  // ── Checklist categories ───────────────────────────────────────
  CHECKLIST_CAT_CONSENT: "Einwilligung",
  CHECKLIST_CAT_EASY_REFUSAL: "Ablehnungskomfort",
  CHECKLIST_CAT_TRANSPARENCY: "Transparenz",
  CHECKLIST_CAT_COOKIE_BEHAVIOR: "Cookie-Verhalten",

  // ── Checklist rules ────────────────────────────────────────────
  CHECKLIST_RULE_MODAL_DETECTED: "Einwilligungsbanner erkannt",
  CHECKLIST_RULE_NO_PRE_TICKED: "Keine vorausgewählten Kontrollkästchen",
  CHECKLIST_RULE_ACCEPT_LABEL: "Eindeutige Bezeichnung der Akzeptieren-Schaltfläche",
  CHECKLIST_RULE_REJECT_BTN: "Ablehnen-Schaltfläche im ersten Level vorhanden",
  CHECKLIST_RULE_CLICK_PARITY: "Ablehnen erfordert nicht mehr Klicks als Akzeptieren",
  CHECKLIST_RULE_SIZE_SYMMETRY: "Größensymmetrie zwischen Akzeptieren und Ablehnen",
  CHECKLIST_RULE_FONT_SYMMETRY: "Schriftgrößensymmetrie zwischen Akzeptieren und Ablehnen",
  CHECKLIST_RULE_GRANULAR: "Granulare Steuerelemente verfügbar",
  CHECKLIST_RULE_PURPOSES: "Verarbeitungszwecke angegeben",
  CHECKLIST_RULE_THIRD_PARTIES: "Auftragsverarbeiter / Dritte angegeben",
  CHECKLIST_RULE_DURATION: "Aufbewahrungsfrist angegeben",
  CHECKLIST_RULE_WITHDRAWAL: "Widerrufsrecht angegeben",
  CHECKLIST_RULE_PRIVACY_MODAL: "Link zur Datenschutzerklärung im Banner",
  CHECKLIST_RULE_PRIVACY_PAGE: "Datenschutzerklärung von der Hauptseite erreichbar",
  CHECKLIST_RULE_NO_PRE_COOKIES: "Keine nicht-essenziellen Cookies vor Einwilligung",
  CHECKLIST_RULE_COOKIES_REMOVED: "Nicht-essenzielle Cookies nach Ablehnung entfernt",
  CHECKLIST_RULE_NO_TRACKERS: "Keine Netzwerk-Tracker vor Einwilligung",

  // ── Checklist detail texts ─────────────────────────────────────
  DETAIL_MODAL_DETECTED: "Erkannt (`{selector}`)",
  DETAIL_NO_CONSENT_BANNER: "Kein Einwilligungsbanner erkannt",
  DETAIL_NOT_REQUIRED: "Nicht erforderlich — keine nicht-essenziellen Cookies oder Tracker",
  DETAIL_NO_PRE_TICKED: "Kein vorausgewähltes Kontrollkästchen erkannt",
  DETAIL_PRE_TICKED: "{count} vorausgewähltes/vorausgewählte Kontrollkästchen: {names}",
  DETAIL_ACCEPT_AMBIGUOUS: "Mehrdeutige Bezeichnung: „{text}“",
  DETAIL_ACCEPT_CLEAR: "Klare Bezeichnung: „{text}“",
  DETAIL_NO_ACCEPT_BTN: "Keine Akzeptieren-Schaltfläche erkannt",
  DETAIL_REJECT_DETECTED: "Erkannt: „{text}“",
  DETAIL_NO_REJECT_FIRST: "Keine Ablehnen-Schaltfläche im ersten Level",
  DETAIL_CLICK_PARITY: "Akzeptieren: {a} Klick(s) · Ablehnen: {b} Klick(s)",
  DETAIL_CANNOT_VERIFY: "Nicht überprüfbar (fehlende Schaltflächen)",
  DETAIL_BTN_SIZES_OK: "Schaltflächengrößen sind vergleichbar",
  DETAIL_BTN_FONTS_OK: "Schriftgrößen sind vergleichbar",
  DETAIL_GRANULAR_COUNT: "{count} Kontrollkästchen oder Einstellungsbereich erkannt",
  DETAIL_NO_GRANULAR: "Keine granularen Steuerelemente erkannt",
  DETAIL_INFO_ABSENT: "Information im Banner-Text nicht vorhanden",
  DETAIL_INFO_FOUND: "Erwähnung im Banner-Text gefunden",
  DETAIL_PRIVACY_LINK_FOUND: "Link gefunden: {url}",
  DETAIL_NO_PRIVACY_MODAL: "Kein Link zur Datenschutzerklärung im Einwilligungsbanner",
  DETAIL_NO_PRIVACY_PAGE: "Kein Link zur Datenschutzerklärung auf der Hauptseite",
  DETAIL_NO_ILLEGAL_PRE: "Kein nicht-essenzieller Cookie vor Interaktion gesetzt",
  DETAIL_ILLEGAL_PRE: "{count} illegale(r) Cookie(s): {names}",
  DETAIL_NO_PERSIST: "Kein nicht-essenzieller Cookie nach Ablehnung persistent",
  DETAIL_PERSIST: "{count} persistente(r) Cookie(s): {names}",
  DETAIL_NO_TRACKERS: "Keine Tracker-Anfrage vor Interaktion gesendet",
  DETAIL_TRACKERS: "{count} Tracker: {names}",

  // ── DarkPatternIssue descriptions/evidence ─────────────────────
  ISSUE_MISLEADING_ACCEPT_DESC:
    "Akzeptieren-Schaltfläche hat eine mehrdeutige Bezeichnung: „{text}“",
  ISSUE_MISLEADING_ACCEPT_EVIDENCE: "Der Text „{text}“ drückt keine eindeutige Einwilligung aus",
  ISSUE_NO_REJECT_DESC: "Keine Ablehnungsoption im Einwilligungsbanner gefunden",
  ISSUE_NO_REJECT_EVIDENCE:
    "Die DSGVO verlangt, dass Ablehnen so einfach ist wie Akzeptieren (CNIL 2022)",
  ISSUE_FAKE_REJECT_DESC: "Ablehnen-Schaltfläche hat eine irreführende Bezeichnung: „{text}“",
  ISSUE_FAKE_REJECT_EVIDENCE:
    "Eine Schließen/Ignorieren-Schaltfläche ist kein gültiger Ablehnungsmechanismus",
  ISSUE_MISSING_INFO_DESC: "Erforderliche Information fehlt: „{key}“",
  ISSUE_MISSING_INFO_EVIDENCE: "Der Einwilligungstext erwähnt {key} nicht",
  ISSUE_NO_MODAL_DESC: "Kein Cookie-Einwilligungsbanner erkannt",
  ISSUE_NO_MODAL_EVIDENCE:
    "Ein Einwilligungsmechanismus ist erforderlich, bevor nicht-essenzielle Cookies gesetzt werden",
  ISSUE_PRE_TICKED_DESC: "{count} vorausgewählte(s) Kontrollkästchen",
  ISSUE_PRE_TICKED_EVIDENCE:
    "Vorausgewählte Kontrollkästchen sind nach DSGVO Erwägungsgrund 32 ungültig. Betroffen: {names}",
  ISSUE_NO_REJECT_FIRST_DESC: "Keine Ablehnen-Schaltfläche im ersten Level",
  ISSUE_NO_REJECT_FIRST_EVIDENCE:
    "Die CNIL (2022) verlangt, dass Ablehnen nicht mehr Klicks erfordert als Akzeptieren",
  ISSUE_CLICK_ASYMM_DESC: "Ablehnen erfordert mehr Klicks als Akzeptieren",
  ISSUE_CLICK_ASYMM_EVIDENCE: "Akzeptieren: {a} Klick(s), Ablehnen: {b} Klick(s)",
  ISSUE_BTN_AREA_DESC: "Akzeptieren-Schaltfläche ist erheblich größer als Ablehnen-Schaltfläche",
  ISSUE_BTN_AREA_EVIDENCE: "Fläche Akzeptieren: {acceptArea}px², Ablehnen: {rejectArea}px²",
  ISSUE_FONT_ASYMM_DESC:
    "Schrift der Akzeptieren-Schaltfläche ist erheblich größer als die der Ablehnen-Schaltfläche",
  ISSUE_FONT_ASYMM_EVIDENCE: "Akzeptieren: {acceptPx}px, Ablehnen: {rejectPx}px",
  ISSUE_NO_PRIVACY_MODAL_DESC: "Kein Link zur Datenschutzerklärung im Einwilligungsbanner",
  ISSUE_NO_PRIVACY_MODAL_EVIDENCE:
    "Art. 13 DSGVO verlangt, dass die Datenschutzerklärung über die Einwilligungsschnittstelle erreichbar ist",
  ISSUE_NO_PRIVACY_PAGE_DESC: "Kein Link zur Datenschutzerklärung auf der Seite",
  ISSUE_NO_PRIVACY_PAGE_EVIDENCE:
    "Eine Datenschutzerklärung muss von jeder Seite erreichbar sein (DSGVO Art. 13)",
  ISSUE_PRE_CONSENT_COOKIES_DESC:
    "{count} nicht-essenzielle(r) Cookie(s) vor jeder Interaktion gesetzt",
  ISSUE_POST_REJECT_COOKIES_DESC:
    "{count} nicht-essenzielle(r) Cookie(s) nach Ablehnung persistent",
  ISSUE_PRE_TRACKERS_DESC: "{count} Tracker-Anfrage(n) vor jeglicher Einwilligung gesendet",

  // ── Translated keys for missing-info issues ────────────────────
  INFO_KEY_PURPOSES: "Verarbeitungszwecke",
  INFO_KEY_THIRD_PARTIES: "Drittparteien",
  INFO_KEY_DURATION: "Aufbewahrungsfrist",
  INFO_KEY_WITHDRAWAL: "Widerrufsrecht",

  // ── HTML-specific labels ───────────────────────────────────────
  HTML_SCANNED_ON: "Gescannt am",
  HTML_COMPLIANCE_SCORE: "Konformitätswert",
  HTML_NOT_DETECTED: "Nicht erkannt",
  HTML_DETECTED: "Erkannt",
  HTML_NO_ISSUES: "Kein Konformitätsproblem erkannt",
  HTML_NO_TRACKERS: "Kein Netzwerk-Tracker erkannt",
  HTML_NO_REC:
    "Keine kritischen Empfehlungen. Führen Sie regelmäßige Audits durch, um die Konformität aufrechtzuerhalten.",
  HTML_RULES_COUNT: "{count} Regeln",
  HTML_GENERATED_BY: "Generiert von",
  HTML_TOC_TITLE: "Inhaltsverzeichnis",
  HTML_BUTTONS: "Schaltflächen",
  HTML_SELECTOR: "Selektor",
  HTML_GRANULAR_CONTROLS: "Granulare Steuerelemente",
  HTML_PRIVACY_LINK: "Datenschutzerklärung",
  HTML_PRE_TICKED: "Vorausgewählte Kontrollkästchen",
  HTML_COOKIES_BEFORE: "Vor Interaktion",
  HTML_COOKIES_AFTER_REJECT: "Nach Ablehnung",
  HTML_COOKIES_AFTER_ACCEPT: "Nach Akzeptierung",
  HTML_CONSENT_REQUIRED: "Erforderlich",
  HTML_NOT_REQUIRED: "Nein",
  HTML_BEFORE_CONSENT: "vor Einwilligung",
  HTML_NO_BUTTONS: "Keine Schaltflächen erkannt.",
  HTML_NON_ESSENTIAL: "nicht-essenzielle(r)",
  HTML_NONE: "Keine",
  HTML_NONE_DETECTED: "Keine erkannt",
  HTML_COMPARABLE_SIZES: "Vergleichbare Größen",
  HTML_ACCEPT_LARGER: "Akzeptieren-Schaltfläche erheblich größer",
  HTML_CORRECTLY_REMOVED: "Korrekt entfernt",
  HTML_CONTROLS_DETECTED: "{count} Steuerelement(e) erkannt",
  HTML_NO_GRANULAR: "Keine granularen Steuerelemente",
  HTML_NO_ACCEPT_BTN: "Keine Akzeptieren-Schaltfläche",
  HTML_CANNOT_VERIFY: "Nicht überprüfbar",
  HTML_NO_CONSENT_BANNER: "Kein Einwilligungsbanner auf der Seite gefunden.",
  HTML_REJECT_AT_FIRST: "Ablehnen \u2264 Klicks als Akzeptieren",
  HTML_TRACKERS_BEFORE: "{count} vor Einwilligung",
  HTML_ISSUES: "Probleme",
  HTML_CONSENT_MODAL: "Einwilligungsbanner",
  HTML_COOKIES: "Cookies",
  HTML_NETWORK_TRACKERS: "Netzwerk-Tracker",
  HTML_RECOMMENDATIONS: "Empfehlungen",
  HTML_COMPLIANCE_CHECKLIST: "Konformitäts-Checkliste",
  HTML_CRITICAL: "kritisch",
  HTML_WARNING: "Warnung",
  HTML_WARNINGS: "Warnungen",

  // ── Phase labels ───────────────────────────────────────────────
  PHASE_BEFORE_CONSENT: "vor Einwilligung",
  PHASE_AFTER_ACCEPTANCE: "nach Akzeptierung",
  PHASE_AFTER_REJECTION: "nach Ablehnung",
};

const dictionaries: Record<Locale, Dict> = { en, fr, de };

export function t(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale];
  const template = dict[key] ?? en[key];
  if (!vars) return template;
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template);
}
