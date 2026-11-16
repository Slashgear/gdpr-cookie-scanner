import { describe, it, expect } from "bun:test";
import { mergeSecondLayerButtons, needsSecondLayerProbe } from "../../src/scanner/consent-modal.js";
import { analyzeCompliance } from "../../src/analyzers/compliance.js";
import type { ConsentButton, ConsentModal } from "../../src/types.js";

function makeButton(
  type: ConsentButton["type"],
  overrides: Partial<ConsentButton> = {},
): ConsentButton {
  return {
    type,
    text: type,
    selector: `#btn-${type}`,
    isVisible: true,
    boundingBox: { x: 0, y: 0, width: 120, height: 40 },
    fontSize: 14,
    backgroundColor: "rgb(0, 0, 0)",
    textColor: "rgb(255, 255, 255)",
    contrastRatio: 21,
    clickDepth: 1,
    ...overrides,
  };
}

describe("needsSecondLayerProbe", () => {
  it("is false when a visible reject button is on the first layer", () => {
    expect(
      needsSecondLayerProbe([
        makeButton("accept"),
        makeButton("reject"),
        makeButton("preferences"),
      ]),
    ).toBe(false);
  });

  it("is true when reject is missing but a preferences button is visible", () => {
    expect(needsSecondLayerProbe([makeButton("accept"), makeButton("preferences")])).toBe(true);
  });

  it("is true when the only reject button is hidden (second layer already in the DOM)", () => {
    expect(
      needsSecondLayerProbe([
        makeButton("accept"),
        makeButton("preferences"),
        makeButton("reject", { isVisible: false }),
      ]),
    ).toBe(true);
  });

  it("is false when there is no preferences button to open", () => {
    expect(needsSecondLayerProbe([makeButton("accept")])).toBe(false);
  });
});

describe("mergeSecondLayerButtons", () => {
  it("adds second-layer reject buttons with clickDepth 2", () => {
    const merged = mergeSecondLayerButtons(
      [makeButton("accept"), makeButton("preferences")],
      [makeButton("reject", { selector: "#reject-all" })],
    );
    const reject = merged.find((b) => b.type === "reject");
    expect(reject?.selector).toBe("#reject-all");
    expect(reject?.clickDepth).toBe(2);
    expect(merged.find((b) => b.type === "accept")?.clickDepth).toBe(1);
  });

  it("replaces a hidden first-layer reject by its now-visible second-layer twin", () => {
    const merged = mergeSecondLayerButtons(
      [makeButton("accept"), makeButton("preferences"), makeButton("reject", { isVisible: false })],
      [makeButton("reject", { isVisible: true })],
    );
    const rejects = merged.filter((b) => b.type === "reject");
    expect(rejects).toHaveLength(1);
    expect(rejects[0].isVisible).toBe(true);
    expect(rejects[0].clickDepth).toBe(2);
  });

  it("drops hidden first-layer rejects when no visible reject is found on the second layer", () => {
    const merged = mergeSecondLayerButtons(
      [makeButton("accept"), makeButton("preferences"), makeButton("reject", { isVisible: false })],
      [],
    );
    expect(merged.some((b) => b.type === "reject")).toBe(false);
  });

  it("ignores non-reject and hidden second-layer buttons, and duplicates", () => {
    const merged = mergeSecondLayerButtons(
      [makeButton("accept"), makeButton("preferences")],
      [
        makeButton("accept", { selector: "#accept-2" }),
        makeButton("reject", { selector: "#r1", isVisible: false }),
        makeButton("reject", { selector: "#r2" }),
        makeButton("reject", { selector: "#r2" }),
      ],
    );
    expect(merged.map((b) => b.selector)).toEqual(["#btn-accept", "#btn-preferences", "#r2"]);
  });
});

describe("click asymmetry end-to-end (merge + scoring)", () => {
  it("flags click-asymmetry when reject is only reachable through preferences", () => {
    const modal: ConsentModal = {
      detected: true,
      selector: "#cookie-banner",
      text: "We use cookies for analytics purposes. Third-party vendors process data. Cookies are kept 13 months. You can withdraw consent at any time.",
      buttons: mergeSecondLayerButtons(
        [makeButton("accept"), makeButton("preferences")],
        [makeButton("reject")],
      ),
      checkboxes: [],
      hasGranularControls: true,
      layerCount: 2,
      screenshotPath: null,
      privacyPolicyUrl: "https://example.com/privacy",
    };
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    const issue = result.issues.find((i) => i.type === "click-asymmetry");
    expect(issue).toBeDefined();
    expect(issue?.evidence).toBe("Accept: 1 click(s), Reject: 2 click(s)");
    expect(result.issues.some((i) => i.type === "buried-reject")).toBe(false);
  });
});
