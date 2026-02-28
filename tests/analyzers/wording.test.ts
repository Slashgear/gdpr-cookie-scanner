import { describe, it, expect } from "vitest";
import { analyzeButtonWording, analyzeModalText } from "../../src/analyzers/wording.js";
import type { ConsentButton } from "../../src/types.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeButton(
  type: ConsentButton["type"],
  text: string,
  overrides: Partial<ConsentButton> = {},
): ConsentButton {
  return {
    type,
    text,
    selector: `button:has-text("${text}")`,
    isVisible: true,
    boundingBox: { x: 0, y: 0, width: 120, height: 40 },
    fontSize: 14,
    backgroundColor: "rgb(0,0,0)",
    textColor: "rgb(255,255,255)",
    contrastRatio: 21,
    clickDepth: 1,
    ...overrides,
  };
}

// ── analyzeButtonWording ─────────────────────────────────────────────────────

describe("analyzeButtonWording", () => {
  describe("clear labels — no issues", () => {
    it("raises no issue for explicit Accept / Reject buttons", () => {
      const buttons = [makeButton("accept", "Accept all"), makeButton("reject", "Reject all")];
      const result = analyzeButtonWording(buttons);
      expect(result.issues).toHaveLength(0);
      expect(result.hasPositiveActionForAccept).toBe(true);
      expect(result.hasExplicitRejectOption).toBe(true);
    });

    it("raises no issue when a preferences button replaces reject", () => {
      const buttons = [
        makeButton("accept", "Accept all"),
        makeButton("preferences", "Manage preferences"),
      ];
      const result = analyzeButtonWording(buttons);
      const noRejectIssue = result.issues.find((i) => i.type === "no-reject-button");
      expect(noRejectIssue).toBeUndefined();
    });
  });

  describe("misleading-wording on accept button", () => {
    it.each(["ok", "OK", "Got it", "Continue", "J'ai compris", "D'accord", "Proceed"])(
      'flags "%s" as misleading accept label',
      (text) => {
        const buttons = [makeButton("accept", text), makeButton("reject", "Refuse")];
        const result = analyzeButtonWording(buttons);
        const issue = result.issues.find((i) => i.type === "misleading-wording");
        expect(issue).toBeDefined();
        expect(issue?.severity).toBe("warning");
      },
    );

    it("does NOT flag explicit Accept all label", () => {
      const buttons = [makeButton("accept", "Accept all cookies")];
      const result = analyzeButtonWording(buttons);
      const issue = result.issues.find((i) => i.type === "misleading-wording");
      expect(issue).toBeUndefined();
    });
  });

  describe("no-reject-button", () => {
    it("raises critical issue when no reject or preferences button is present", () => {
      const buttons = [makeButton("accept", "Accept all")];
      const result = analyzeButtonWording(buttons);
      const issue = result.issues.find((i) => i.type === "no-reject-button");
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe("critical");
      expect(result.hasExplicitRejectOption).toBe(false);
    });

    it("raises critical issue when button list is empty", () => {
      const result = analyzeButtonWording([]);
      const issue = result.issues.find((i) => i.type === "no-reject-button");
      expect(issue).toBeDefined();
    });
  });

  describe("indirect reject — refusal implied, not stated", () => {
    it.each([
      "Continuer sans accepter",
      "Continue without accepting",
      "Continue without consent",
      "Proceed without accepting",
      "Continuar sin aceptar",
      "Continua senza accettare",
      "Weiter ohne akzeptieren",
    ])('flags "%s" as indirect reject (warning)', (text) => {
      const buttons = [makeButton("accept", "Accept all"), makeButton("reject", text)];
      const result = analyzeButtonWording(buttons);
      expect(result.hasIndirectRejectLabel).toBe(true);
      const issue = result.issues.find(
        (i) => i.type === "misleading-wording" && i.severity === "warning",
      );
      expect(issue).toBeDefined();
    });

    it("does NOT flag an explicit Reject button as indirect", () => {
      const buttons = [makeButton("accept", "Accept all"), makeButton("reject", "Reject all")];
      const result = analyzeButtonWording(buttons);
      expect(result.hasIndirectRejectLabel).toBe(false);
    });

    it("does NOT flag 'Tout refuser' as indirect", () => {
      const buttons = [makeButton("accept", "Tout accepter"), makeButton("reject", "Tout refuser")];
      const result = analyzeButtonWording(buttons);
      expect(result.hasIndirectRejectLabel).toBe(false);
    });

    it("returns hasIndirectRejectLabel: false when there is no reject button", () => {
      const buttons = [makeButton("accept", "Accept all")];
      const result = analyzeButtonWording(buttons);
      expect(result.hasIndirectRejectLabel).toBe(false);
    });
  });

  describe("fake reject — close/dismiss button disguised as reject", () => {
    it.each(["×", "✕", "close", "Fermer", "dismiss", "skip"])(
      'flags "%s" reject button as misleading (fake reject)',
      (text) => {
        const buttons = [makeButton("accept", "Accept all"), makeButton("reject", text)];
        const result = analyzeButtonWording(buttons);
        const issue = result.issues.find(
          (i) => i.type === "misleading-wording" && i.severity === "critical",
        );
        expect(issue).toBeDefined();
      },
    );
  });
});

// ── analyzeModalText ─────────────────────────────────────────────────────────

describe("analyzeModalText", () => {
  const FULL_TEXT = `
    We use cookies to improve your experience. The purposes include analytics and advertising.
    Third-party partners and vendors process data on our behalf.
    Cookies are retained for a period of 13 months. You can withdraw your consent at any time.
  `;

  it("finds no missing info when all required elements are present", () => {
    const result = analyzeModalText(FULL_TEXT);
    expect(result.missingInfo).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
  });

  it("reports missing purposes when no purpose keyword is found", () => {
    const text = "We use cookies. Third-party partners. 13 months. Withdraw consent.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).toContain("purposes");
    expect(result.issues.some((i) => i.type === "missing-info")).toBe(true);
  });

  it("reports missing third-parties when no partner keyword is found", () => {
    const text = "We use cookies for analytics purposes. 13 months. Withdraw consent.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).toContain("third-parties");
  });

  it("reports missing duration when no retention keyword is found", () => {
    // Avoid words containing "an" (e.g. "analytics") — the /an(s)?/ pattern would false-positive
    const text = "We use cookies for security purposes. Third-party partners. Withdraw consent.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).toContain("duration");
  });

  it("reports missing withdrawal when no withdraw keyword is found", () => {
    const text = "We use cookies for analytics purposes. Third-party partners. 13 months.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).toContain("withdrawal");
  });

  it("reports all four missing items on an empty modal text", () => {
    const result = analyzeModalText("");
    expect(result.missingInfo).toEqual(
      expect.arrayContaining(["purposes", "third-parties", "duration", "withdrawal"]),
    );
    expect(result.issues).toHaveLength(4);
  });

  it("accepts French keywords for purposes (finalité)", () => {
    const text =
      "Finalité : améliorer votre expérience. Partenaires. 13 mois. Retrait du consentement.";
    const result = analyzeModalText(text);
    expect(result.missingInfo).not.toContain("purposes");
    expect(result.missingInfo).not.toContain("third-parties");
    expect(result.missingInfo).not.toContain("duration");
    expect(result.missingInfo).not.toContain("withdrawal");
  });
});
