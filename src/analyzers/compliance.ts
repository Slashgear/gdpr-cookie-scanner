import type {
  ComplianceScore,
  ConsentModal,
  DarkPatternIssue,
  ScannedCookie,
  NetworkRequest,
} from "../types.js";
import { analyzeButtonWording, analyzeModalText } from "./wording.js";
import { type Locale, t } from "../i18n/index.js";

interface ComplianceInput {
  modal: ConsentModal;
  privacyPolicyUrl: string | null;
  cookiesBeforeInteraction: ScannedCookie[];
  cookiesAfterAccept: ScannedCookie[];
  cookiesAfterReject: ScannedCookie[];
  networkBeforeInteraction: NetworkRequest[];
  networkAfterAccept: NetworkRequest[];
  networkAfterReject: NetworkRequest[];
  locale: Locale;
}

export function analyzeCompliance(input: ComplianceInput): ComplianceScore {
  const { locale } = input;
  const issues: DarkPatternIssue[] = [];

  // Determine whether a consent mechanism is actually required
  const hasNonEssentialCookies = [
    ...input.cookiesBeforeInteraction,
    ...input.cookiesAfterAccept,
  ].some((c) => c.requiresConsent);
  const hasNonEssentialTrackers = [
    ...input.networkBeforeInteraction,
    ...input.networkAfterAccept,
  ].some((r) => r.requiresConsent);
  const consentRequired = hasNonEssentialCookies || hasNonEssentialTrackers;

  // ── A. Consent validity (0-25) ────────────────────────────────
  let consentValidity = 25;

  if (!input.modal.detected && consentRequired) {
    issues.push({
      type: "no-reject-button",
      severity: "critical",
      description: t(locale, "ISSUE_NO_MODAL_DESC"),
      evidence: t(locale, "ISSUE_NO_MODAL_EVIDENCE"),
    });
    consentValidity = 0;
  } else if (input.modal.detected) {
    // Wording analysis
    const wordingResult = analyzeButtonWording(input.modal.buttons, locale);
    const textResult = analyzeModalText(input.modal.text, locale);
    issues.push(...wordingResult.issues, ...textResult.issues);

    // Pre-ticked checkboxes
    const preTicked = input.modal.checkboxes.filter((c) => c.isCheckedByDefault);
    if (preTicked.length > 0) {
      issues.push({
        type: "pre-ticked",
        severity: "critical",
        description: t(locale, "ISSUE_PRE_TICKED_DESC", { count: preTicked.length }),
        evidence: t(locale, "ISSUE_PRE_TICKED_EVIDENCE", {
          names: preTicked.map((c) => c.label || c.name).join(", "),
        }),
      });
      consentValidity -= 10;
    }

    // Missing info deductions
    if (textResult.missingInfo.includes("purposes")) consentValidity -= 5;
    if (textResult.missingInfo.includes("third-parties")) consentValidity -= 5;
    if (textResult.missingInfo.length >= 3) consentValidity -= 5;
  }

  // ── B. Easy refusal (0-25) ────────────────────────────────────
  let easyRefusal = 25;

  if (!input.modal.detected && consentRequired) {
    easyRefusal = 0;
  } else if (input.modal.detected) {
    const acceptButton = input.modal.buttons.find((b) => b.type === "accept");
    const rejectButton = input.modal.buttons.find((b) => b.type === "reject");

    if (!rejectButton) {
      issues.push({
        type: "buried-reject",
        severity: "critical",
        description: t(locale, "ISSUE_NO_REJECT_FIRST_DESC"),
        evidence: t(locale, "ISSUE_NO_REJECT_FIRST_EVIDENCE"),
      });
      easyRefusal -= 15;
    } else if (rejectButton.clickDepth > (acceptButton?.clickDepth ?? 1)) {
      issues.push({
        type: "click-asymmetry",
        severity: "critical",
        description: t(locale, "ISSUE_CLICK_ASYMM_DESC"),
        evidence: t(locale, "ISSUE_CLICK_ASYMM_EVIDENCE", {
          a: acceptButton?.clickDepth ?? 1,
          b: rejectButton.clickDepth,
        }),
      });
      easyRefusal -= 15;
    }

    // Visual asymmetry: if accept button is significantly larger/more prominent
    if (acceptButton && rejectButton && acceptButton.boundingBox && rejectButton.boundingBox) {
      const acceptArea = acceptButton.boundingBox.width * acceptButton.boundingBox.height;
      const rejectArea = rejectButton.boundingBox.width * rejectButton.boundingBox.height;
      if (acceptArea > rejectArea * 3) {
        issues.push({
          type: "asymmetric-prominence",
          severity: "warning",
          description: t(locale, "ISSUE_BTN_AREA_DESC"),
          evidence: t(locale, "ISSUE_BTN_AREA_EVIDENCE", {
            acceptArea: Math.round(acceptArea),
            rejectArea: Math.round(rejectArea),
          }),
        });
        easyRefusal -= 5;
      }
    }

    // Font size asymmetry
    if (acceptButton?.fontSize && rejectButton?.fontSize) {
      if (acceptButton.fontSize > rejectButton.fontSize * 1.3) {
        issues.push({
          type: "nudging",
          severity: "warning",
          description: t(locale, "ISSUE_FONT_ASYMM_DESC"),
          evidence: t(locale, "ISSUE_FONT_ASYMM_EVIDENCE", {
            acceptPx: acceptButton.fontSize,
            rejectPx: rejectButton.fontSize,
          }),
        });
        easyRefusal -= 5;
      }
    }

    // Contrast ratio: reject button must meet minimum legibility
    if (rejectButton && rejectButton.contrastRatio !== null) {
      const ratio = rejectButton.contrastRatio;
      if (ratio < 3.0) {
        issues.push({
          type: "asymmetric-prominence",
          severity: "critical",
          description: "Reject button has critically low contrast ratio",
          evidence: `Contrast ratio ${ratio}:1 — WCAG AA requires 4.5:1 for normal text (${rejectButton.backgroundColor ?? "?"} / ${rejectButton.textColor ?? "?"})`,
        });
        easyRefusal -= 10;
      } else if (ratio < 4.5) {
        issues.push({
          type: "asymmetric-prominence",
          severity: "warning",
          description: "Reject button contrast ratio is below WCAG AA threshold",
          evidence: `Contrast ratio ${ratio}:1 — WCAG AA requires 4.5:1 for normal text (${rejectButton.backgroundColor ?? "?"} / ${rejectButton.textColor ?? "?"})`,
        });
        easyRefusal -= 5;
      }

      // Relative contrast asymmetry: accept visually pops, reject is muted
      const acceptContrast = acceptButton?.contrastRatio ?? null;
      if (acceptContrast !== null && acceptContrast >= rejectButton.contrastRatio * 1.5) {
        issues.push({
          type: "asymmetric-prominence",
          severity: "warning",
          description: "Accept button has significantly higher contrast than reject button",
          evidence: `Accept: ${acceptContrast}:1, Reject: ${rejectButton.contrastRatio}:1`,
        });
        easyRefusal -= 3;
      }
    }
  }

  // ── C. Transparency (0-25) ────────────────────────────────────
  let transparency = 25;

  if (!input.modal.detected && consentRequired) {
    transparency = 0;
  } else if (input.modal.detected) {
    if (!input.modal.hasGranularControls) {
      transparency -= 10;
    }
    // Already deducted in consentValidity for missing info
    const wordingResult = analyzeModalText(input.modal.text, locale);
    if (wordingResult.missingInfo.length > 0) {
      transparency -= wordingResult.missingInfo.length * 3;
    }
    // No privacy policy link in the modal
    if (!input.modal.privacyPolicyUrl) {
      issues.push({
        type: "missing-info",
        severity: "warning",
        description: t(locale, "ISSUE_NO_PRIVACY_MODAL_DESC"),
        evidence: t(locale, "ISSUE_NO_PRIVACY_MODAL_EVIDENCE"),
      });
      transparency -= 5;
    }
  }

  // No privacy policy link anywhere on the page (only relevant when consent is required)
  if (!input.privacyPolicyUrl && consentRequired) {
    issues.push({
      type: "missing-info",
      severity: "warning",
      description: t(locale, "ISSUE_NO_PRIVACY_PAGE_DESC"),
      evidence: t(locale, "ISSUE_NO_PRIVACY_PAGE_EVIDENCE"),
    });
    transparency -= 3;
  }

  // ── D. Cookie behavior (0-25) ─────────────────────────────────
  let cookieBehavior = 25;

  // Cookies deposited before any interaction that require consent
  const illegalPreConsentCookies = input.cookiesBeforeInteraction.filter((c) => c.requiresConsent);

  if (illegalPreConsentCookies.length > 0) {
    issues.push({
      type: "auto-consent",
      severity: "critical",
      description: t(locale, "ISSUE_PRE_CONSENT_COOKIES_DESC", {
        count: illegalPreConsentCookies.length,
      }),
      evidence: illegalPreConsentCookies.map((c) => `${c.name} (${c.category})`).join(", "),
    });
    cookieBehavior -= Math.min(20, illegalPreConsentCookies.length * 4);
  }

  // Non-essential cookies persisting after reject
  const consentCookiesAfterReject = input.cookiesAfterReject.filter(
    (c) => c.requiresConsent && c.capturedAt === "after-reject",
  );

  if (consentCookiesAfterReject.length > 0) {
    issues.push({
      type: "auto-consent",
      severity: "critical",
      description: t(locale, "ISSUE_POST_REJECT_COOKIES_DESC", {
        count: consentCookiesAfterReject.length,
      }),
      evidence: consentCookiesAfterReject.map((c) => `${c.name} (${c.category})`).join(", "),
    });
    cookieBehavior -= Math.min(15, consentCookiesAfterReject.length * 3);
  }

  // Network trackers firing before interaction
  const preInteractionTrackers = input.networkBeforeInteraction.filter((r) => r.requiresConsent);

  if (preInteractionTrackers.length > 0) {
    issues.push({
      type: "auto-consent",
      severity: "critical",
      description: t(locale, "ISSUE_PRE_TRACKERS_DESC", { count: preInteractionTrackers.length }),
      evidence: [...new Set(preInteractionTrackers.map((r) => r.trackerName ?? r.url))]
        .slice(0, 5)
        .join(", "),
    });
    cookieBehavior -= Math.min(10, preInteractionTrackers.length * 2);
  }

  // Clamp all scores
  const clamp = (v: number) => Math.max(0, Math.min(25, v));
  const breakdown = {
    consentValidity: clamp(consentValidity),
    easyRefusal: clamp(easyRefusal),
    transparency: clamp(transparency),
    cookieBehavior: clamp(cookieBehavior),
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    total,
    breakdown,
    issues,
    grade: scoreToGrade(total),
  };
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 55) return "C";
  if (score >= 35) return "D";
  return "F";
}
