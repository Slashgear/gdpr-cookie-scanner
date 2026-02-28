import type { ConsentButton, DarkPatternIssue } from "../types.js";

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
 * Indirect reject labels: the button does refuse, but without using a clear negative
 * word like "refuse/reject". The user has to infer the refusal from context.
 * Flagged as a dark pattern per EDPB Guidelines 03/2022 (§ 3.3.3 — hiding choices).
 *
 * Pattern logic: "continue/proceed + without/sans/sin/senza/ohne + consent-related word".
 */
const INDIRECT_REJECT_LABELS = [
  // English
  /\bcontinue\s+without\b/i,
  /\bproceed\s+without\b/i,
  /\bwithout\s+(accepting|accept|consent|consenting)\b/i,
  // French
  /\bcontinuer\s+sans\b/i,
  /\bsans\s+(accepter|consentir|cookies)\b/i,
  // Spanish
  /\bcontinuar\s+sin\b/i,
  /\bsin\s+(aceptar|consentir)\b/i,
  // Italian
  /\bcontinua\s+senza\b/i,
  /\bsenza\s+(accettare|consenso)\b/i,
  // German
  /\bweiter\s+ohne\b/i,
  /\bohne\s+(akzeptieren|zustimmen)\b/i,
  // Dutch
  /\bvervolgenen?\s+zonder\b/i,
  /\bzonder\s+(accepteren|toestemming)\b/i,
];

/**
 * Required informational elements in consent text (RGPD Art. 13-14).
 */
const REQUIRED_INFO_PATTERNS = [
  { key: "purposes", patterns: [/finalit[eé]|purpose|objectif|utilisation/i] },
  { key: "third-parties", patterns: [/partenaire|tiers|third.part|sous.traitant|vendor/i] },
  {
    key: "duration",
    patterns: [/dur[eé]e|expir|conservation|validit[eé]|period|month|year|mois|an(s)?/i],
  },
  { key: "withdrawal", patterns: [/retrait|retirer|withdraw|revok|modif|changer|chang/i] },
];

export interface WordingAnalysis {
  issues: DarkPatternIssue[];
  missingInfo: string[];
  hasPositiveActionForAccept: boolean;
  hasExplicitRejectOption: boolean;
  hasIndirectRejectLabel: boolean;
}

export function analyzeButtonWording(buttons: ConsentButton[]): WordingAnalysis {
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
          description: `Accept button has ambiguous label: "${acceptButton.text}"`,
          evidence: `Button text "${acceptButton.text}" does not clearly express consent`,
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
      description: "No reject/decline option found in the consent modal",
      evidence: "RGPD requires refusal to be as easy as acceptance (CNIL 2022)",
    });
  }

  // ── Fake reject (close button instead) ───────────────────────
  if (rejectButton) {
    for (const pattern of FAKE_REJECT_LABELS) {
      if (pattern.test(rejectButton.text.trim())) {
        issues.push({
          type: "misleading-wording",
          severity: "critical",
          description: `Reject button has misleading label: "${rejectButton.text}"`,
          evidence: "A close/dismiss button is not a valid rejection mechanism",
        });
        break;
      }
    }
  }

  // ── Indirect reject (refusal implied, not stated) ─────────────
  const hasIndirectRejectLabel =
    !!rejectButton && INDIRECT_REJECT_LABELS.some((p) => p.test(rejectButton.text));
  if (hasIndirectRejectLabel && rejectButton) {
    issues.push({
      type: "misleading-wording",
      severity: "warning",
      description: `Reject button uses indirect wording: "${rejectButton.text}"`,
      evidence:
        'EDPB Guidelines 03/2022: the refusal option must be as clear as acceptance — indirect phrases like "continue without accepting" obscure the user\'s choice',
    });
  }

  return {
    issues,
    missingInfo: [], // filled in by analyzeModalText
    hasPositiveActionForAccept: !!acceptButton,
    hasExplicitRejectOption: !!rejectButton,
    hasIndirectRejectLabel,
  };
}

export function analyzeModalText(text: string): {
  missingInfo: string[];
  issues: DarkPatternIssue[];
} {
  const missingInfo: string[] = [];
  const issues: DarkPatternIssue[] = [];

  for (const { key, patterns } of REQUIRED_INFO_PATTERNS) {
    const found = patterns.some((p) => p.test(text));
    if (!found) {
      missingInfo.push(key);
      issues.push({
        type: "missing-info",
        severity: "warning",
        description: `Missing required information: "${key}"`,
        evidence: `The consent text does not mention ${key}`,
      });
    }
  }

  return { missingInfo, issues };
}
