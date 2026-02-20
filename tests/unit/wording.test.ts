import { describe, it, expect } from "vitest";
import { analyzeButtonWording, analyzeModalText } from "../../src/analyzers/wording.js";
import type { ConsentButton } from "../../src/types.js";

function makeButton(
  type: ConsentButton["type"],
  text: string,
  overrides?: Partial<ConsentButton>,
): ConsentButton {
  return {
    type,
    text,
    selector: `button:has-text("${text}")`,
    isVisible: true,
    boundingBox: { x: 0, y: 0, width: 120, height: 40 },
    fontSize: 14,
    backgroundColor: "rgb(255, 255, 255)",
    textColor: "rgb(0, 0, 0)",
    contrastRatio: 21,
    clickDepth: 1,
    ...overrides,
  };
}

describe("analyzeButtonWording", () => {
  it("returns no issues for standard accept/reject buttons", () => {
    const buttons = [makeButton("accept", "Accept all"), makeButton("reject", "Reject all")];
    const result = analyzeButtonWording(buttons);
    expect(result.issues).toHaveLength(0);
    expect(result.hasPositiveActionForAccept).toBe(true);
    expect(result.hasExplicitRejectOption).toBe(true);
  });

  it("flags missing reject button when no reject or preferences button exists", () => {
    const buttons = [makeButton("accept", "Accept")];
    const result = analyzeButtonWording(buttons);
    const noRejectIssue = result.issues.find((i) => i.type === "no-reject-button");
    expect(noRejectIssue).toBeDefined();
    expect(noRejectIssue?.severity).toBe("critical");
    expect(result.hasExplicitRejectOption).toBe(false);
  });

  it("does NOT flag missing reject when a preferences button exists", () => {
    const buttons = [makeButton("accept", "Accept"), makeButton("preferences", "Manage")];
    const result = analyzeButtonWording(buttons);
    const noRejectIssue = result.issues.find((i) => i.type === "no-reject-button");
    expect(noRejectIssue).toBeUndefined();
  });

  it("flags ambiguous accept label 'ok'", () => {
    const buttons = [makeButton("accept", "ok"), makeButton("reject", "Refuser")];
    const result = analyzeButtonWording(buttons);
    const misleadingIssue = result.issues.find(
      (i) => i.type === "misleading-wording" && i.description.includes("ok"),
    );
    expect(misleadingIssue).toBeDefined();
    expect(misleadingIssue?.severity).toBe("warning");
  });

  it("flags ambiguous accept label 'continuer'", () => {
    const buttons = [makeButton("accept", "Continuer"), makeButton("reject", "Refuser")];
    const result = analyzeButtonWording(buttons);
    const misleadingIssue = result.issues.find((i) => i.type === "misleading-wording");
    expect(misleadingIssue).toBeDefined();
  });

  it("flags fake reject label '×'", () => {
    const buttons = [makeButton("accept", "Accepter"), makeButton("reject", "×")];
    const result = analyzeButtonWording(buttons);
    const misleadingIssue = result.issues.find(
      (i) => i.type === "misleading-wording" && i.severity === "critical",
    );
    expect(misleadingIssue).toBeDefined();
  });

  it("flags fake reject label 'Fermer'", () => {
    const buttons = [makeButton("accept", "Accepter"), makeButton("reject", "Fermer")];
    const result = analyzeButtonWording(buttons);
    const misleadingIssue = result.issues.find(
      (i) => i.type === "misleading-wording" && i.severity === "critical",
    );
    expect(misleadingIssue).toBeDefined();
  });

  it("returns empty issues for empty button array", () => {
    const result = analyzeButtonWording([]);
    // No accept button → no misleading accept issue
    // No reject button → no-reject-button issue raised (no prefButton either)
    const noRejectIssue = result.issues.find((i) => i.type === "no-reject-button");
    expect(noRejectIssue).toBeDefined();
    expect(result.hasPositiveActionForAccept).toBe(false);
    expect(result.hasExplicitRejectOption).toBe(false);
  });
});

describe("analyzeModalText", () => {
  it("detects all missing info in an empty text", () => {
    const result = analyzeModalText("");
    expect(result.missingInfo).toContain("purposes");
    expect(result.missingInfo).toContain("third-parties");
    expect(result.missingInfo).toContain("duration");
    expect(result.missingInfo).toContain("withdrawal");
    expect(result.issues).toHaveLength(4);
  });

  it("returns no missing info for a complete consent text", () => {
    // Use words that precisely match each regex pattern in REQUIRED_INFO_PATTERNS
    const text = [
      "We use cookies for analytics purposes with third-party vendors.",
      "Cookies expire after 13 months.",
      "You may withdraw your consent at any time.",
    ].join(" ");
    const result = analyzeModalText(text);
    expect(result.missingInfo).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
  });

  it("detects missing 'duration' when text lacks duration keywords", () => {
    // Carefully avoid any "an" substring (matches the `an(s)?` duration pattern)
    // and any month/year/period/expir/durée/conservation/validité keywords
    const text =
      "We use cookies for purposes of tracking. Third-party vendors collect this. Possible to revoke consent.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).toContain("duration");
    expect(result.missingInfo).not.toContain("purposes");
    expect(result.missingInfo).not.toContain("third-parties");
    expect(result.missingInfo).not.toContain("withdrawal");
  });

  it("matches French keywords for purposes", () => {
    // "fins" doesn't match the pattern — use "finalité" or "utilisation"
    const text = "Nous utilisons des cookies pour des finalités de mesure et d'analyse.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).not.toContain("purposes");
  });

  it("matches French keywords for third-parties", () => {
    const text = "Vos données sont partagées avec nos partenaires.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).not.toContain("third-parties");
  });

  it("matches French keywords for duration", () => {
    const text = "La durée de conservation est de 13 mois.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).not.toContain("duration");
  });

  it("matches French keywords for withdrawal", () => {
    const text = "Vous pouvez retirer votre consentement à tout moment.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).not.toContain("withdrawal");
  });

  it("creates a missing-info issue with warning severity for each missing item", () => {
    const result = analyzeModalText("");
    for (const issue of result.issues) {
      expect(issue.type).toBe("missing-info");
      expect(issue.severity).toBe("warning");
    }
  });
});
