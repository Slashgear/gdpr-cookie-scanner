import type { ConsentButton, DarkPatternIssue } from "../types.js";
import { type Locale, type TranslationKey, t } from "../i18n/index.js";

/**
 * Ambiguous button labels that don't clearly express consent.
 * These are used as "accept" but don't say "accept" — a dark pattern.
 */
const MISLEADING_ACCEPT_LABELS = [
  /^(ok|okay|got it|understood|d'accord|compris|j'ai compris|c'est ok|continuer|continue|proceed|go ahead|next|suivant|proceed)$/i,
  /^(i agree|i understand|i consent)$/i, // acceptable but worth flagging as borderline
];

/**
 * Labels that suggest rejection but are actually just "close" or navigate away.
 */
const FAKE_REJECT_LABELS = [/^(×|✕|✖|close|fermer|dismiss|ignorer|skip|passer)$/i];

/**
 * Required informational elements in consent text (RGPD Art. 13-14).
 */
const REQUIRED_INFO_PATTERNS = [
  {
    key: "purposes",
    i18nKey: "INFO_KEY_PURPOSES" as TranslationKey,
    patterns: [/finalit[eé]|purpose|objectif|utilisation/i],
  },
  {
    key: "third-parties",
    i18nKey: "INFO_KEY_THIRD_PARTIES" as TranslationKey,
    patterns: [/partenaire|tiers|third.part|sous.traitant|vendor/i],
  },
  {
    key: "duration",
    i18nKey: "INFO_KEY_DURATION" as TranslationKey,
    patterns: [/dur[eé]e|expir|conservation|validit[eé]|period|month|year|mois|an(s)?/i],
  },
  {
    key: "withdrawal",
    i18nKey: "INFO_KEY_WITHDRAWAL" as TranslationKey,
    patterns: [/retrait|retirer|withdraw|revok|modif|changer|chang/i],
  },
];

export interface WordingAnalysis {
  issues: DarkPatternIssue[];
  missingInfo: string[];
  hasPositiveActionForAccept: boolean;
  hasExplicitRejectOption: boolean;
}

export function analyzeButtonWording(buttons: ConsentButton[], locale: Locale): WordingAnalysis {
  const issues: DarkPatternIssue[] = [];
  const acceptButton = buttons.find((b) => b.type === "accept");
  const rejectButton = buttons.find((b) => b.type === "reject");
  const prefButton = buttons.find((b) => b.type === "preferences");

  // ── Misleading "accept" wording ──────────────────────────────
  if (acceptButton) {
    for (const pattern of MISLEADING_ACCEPT_LABELS) {
      if (pattern.test(acceptButton.text.trim())) {
        issues.push({
          type: "misleading-wording",
          severity: "warning",
          description: t(locale, "ISSUE_MISLEADING_ACCEPT_DESC", { text: acceptButton.text }),
          evidence: t(locale, "ISSUE_MISLEADING_ACCEPT_EVIDENCE", { text: acceptButton.text }),
        });
        break;
      }
    }
  }

  // ── No reject button at all ───────────────────────────────────
  if (!rejectButton && !prefButton) {
    issues.push({
      type: "no-reject-button",
      severity: "critical",
      description: t(locale, "ISSUE_NO_REJECT_DESC"),
      evidence: t(locale, "ISSUE_NO_REJECT_EVIDENCE"),
    });
  }

  // ── Fake reject (close button instead) ───────────────────────
  if (rejectButton) {
    for (const pattern of FAKE_REJECT_LABELS) {
      if (pattern.test(rejectButton.text.trim())) {
        issues.push({
          type: "misleading-wording",
          severity: "critical",
          description: t(locale, "ISSUE_FAKE_REJECT_DESC", { text: rejectButton.text }),
          evidence: t(locale, "ISSUE_FAKE_REJECT_EVIDENCE"),
        });
        break;
      }
    }
  }

  return {
    issues,
    missingInfo: [], // filled in by analyzeModalText
    hasPositiveActionForAccept: !!acceptButton,
    hasExplicitRejectOption: !!rejectButton,
  };
}

export function analyzeModalText(
  text: string,
  locale: Locale,
): {
  missingInfo: string[];
  issues: DarkPatternIssue[];
} {
  const missingInfo: string[] = [];
  const issues: DarkPatternIssue[] = [];

  for (const { key, i18nKey, patterns } of REQUIRED_INFO_PATTERNS) {
    const found = patterns.some((p) => p.test(text));
    if (!found) {
      const translatedKey = t(locale, i18nKey);
      missingInfo.push(key);
      issues.push({
        type: "missing-info",
        key,
        severity: "warning",
        description: t(locale, "ISSUE_MISSING_INFO_DESC", { key: translatedKey }),
        evidence: t(locale, "ISSUE_MISSING_INFO_EVIDENCE", { key: translatedKey }),
      });
    }
  }

  return { missingInfo, issues };
}
