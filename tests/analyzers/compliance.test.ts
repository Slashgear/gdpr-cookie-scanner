import { describe, it, expect } from "vitest";
import { analyzeCompliance } from "../../src/analyzers/compliance.js";
import type {
  ConsentModal,
  ConsentButton,
  ScannedCookie,
  NetworkRequest,
} from "../../src/types.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeModal(overrides: Partial<ConsentModal> = {}): ConsentModal {
  return {
    detected: true,
    selector: "#cookie-banner",
    text: "We use cookies for analytics purposes. Third-party vendors process data. Cookies are kept 13 months. You can withdraw consent at any time.",
    buttons: [makeButton("accept", "Accept all", 1), makeButton("reject", "Reject all", 1)],
    checkboxes: [],
    hasGranularControls: true,
    layerCount: 1,
    screenshotPath: null,
    privacyPolicyUrl: "https://example.com/privacy",
    ...overrides,
  };
}

function makeButton(
  type: ConsentButton["type"],
  text: string,
  clickDepth: number,
  overrides: Partial<ConsentButton> = {},
): ConsentButton {
  return {
    type,
    text,
    selector: `#btn-${type}`,
    isVisible: true,
    boundingBox: { x: 0, y: 0, width: 120, height: 40 },
    fontSize: 14,
    backgroundColor: "rgb(0,0,0)",
    textColor: "rgb(255,255,255)",
    contrastRatio: 21,
    clickDepth,
    ...overrides,
  };
}

function makeCookie(
  name: string,
  requiresConsent: boolean,
  capturedAt: ScannedCookie["capturedAt"] = "before-interaction",
): ScannedCookie {
  return {
    name,
    domain: "example.com",
    path: "/",
    value: "abc",
    expires: null,
    httpOnly: false,
    secure: true,
    sameSite: "Lax",
    category: requiresConsent ? "analytics" : "strictly-necessary",
    requiresConsent,
    capturedAt,
  };
}

function makeTracker(
  capturedAt: NetworkRequest["capturedAt"] = "before-interaction",
): NetworkRequest {
  return {
    url: "https://google-analytics.com/collect",
    method: "GET",
    resourceType: "xhr",
    initiator: null,
    isThirdParty: true,
    trackerCategory: "analytics",
    trackerName: "Google Analytics",
    requiresConsent: true,
    capturedAt,
    responseStatus: 200,
    contentType: null,
  };
}

const EMPTY_INPUT = {
  modal: makeModal({
    detected: false,
    selector: null,
    text: "",
    buttons: [],
    checkboxes: [],
    hasGranularControls: false,
    privacyPolicyUrl: null,
  }),
  privacyPolicyUrl: null,
  cookiesBeforeInteraction: [],
  cookiesAfterAccept: [],
  cookiesAfterReject: [],
  networkBeforeInteraction: [],
  networkAfterAccept: [],
  networkAfterReject: [],
};

// ── Grade thresholds ──────────────────────────────────────────────────────────

describe("grade thresholds", () => {
  it("returns grade A (≥90) when site has no tracking at all", () => {
    const result = analyzeCompliance(EMPTY_INPUT);
    expect(result.grade).toBe("A");
    expect(result.total).toBe(100);
  });

  it("returns grade A when modal is compliant and cookies are clean", () => {
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [makeCookie("session", false, "before-interaction")],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.grade).toBe("A");
    expect(result.total).toBeGreaterThanOrEqual(90);
  });

  it("returns grade F (<35) when there is no modal and non-essential cookies are set", () => {
    const result = analyzeCompliance({
      ...EMPTY_INPUT,
      cookiesBeforeInteraction: [makeCookie("_ga", true, "before-interaction")],
    });
    expect(result.grade).toBe("F");
    expect(result.total).toBeLessThan(35);
  });
});

// ── A. Consent validity ───────────────────────────────────────────────────────

describe("consentValidity dimension", () => {
  it("scores 0 when no modal and consent is required", () => {
    const result = analyzeCompliance({
      ...EMPTY_INPUT,
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
    });
    expect(result.breakdown.consentValidity).toBe(0);
    expect(result.issues.some((i) => i.type === "no-reject-button")).toBe(true);
  });

  it("deducts 10 for pre-ticked checkboxes", () => {
    const modal = makeModal({
      checkboxes: [
        {
          name: "analytics",
          label: "Analytics",
          isCheckedByDefault: true,
          category: "analytics",
          selector: "#cb-analytics",
        },
      ],
    });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.issues.some((i) => i.type === "pre-ticked")).toBe(true);
    expect(result.breakdown.consentValidity).toBeLessThanOrEqual(15);
  });

  it("deducts 5 per missing required info item", () => {
    // Modal text with no required info keywords → 4 missing items → -5 for purposes, -5 for third-parties
    const modal = makeModal({ text: "We use cookies." });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: null,
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.breakdown.consentValidity).toBeLessThan(20);
  });
});

// ── B. Easy refusal ───────────────────────────────────────────────────────────

describe("easyRefusal dimension", () => {
  it("scores 0 when no modal and consent is required", () => {
    const result = analyzeCompliance({
      ...EMPTY_INPUT,
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
    });
    expect(result.breakdown.easyRefusal).toBe(0);
  });

  it("deducts 15 when no reject button is present at first layer", () => {
    const modal = makeModal({
      buttons: [makeButton("accept", "Accept all", 1)],
    });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.breakdown.easyRefusal).toBeLessThanOrEqual(10);
    expect(
      result.issues.some((i) => i.type === "buried-reject" || i.type === "no-reject-button"),
    ).toBe(true);
  });

  it("deducts 15 for click asymmetry (reject needs more clicks than accept)", () => {
    const modal = makeModal({
      buttons: [
        makeButton("accept", "Accept all", 1),
        makeButton("reject", "Reject all", 2), // 2 clicks vs 1
      ],
    });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.issues.some((i) => i.type === "click-asymmetry")).toBe(true);
    expect(result.breakdown.easyRefusal).toBeLessThanOrEqual(10);
  });

  it("deducts 5 when accept button area is 3× larger than reject", () => {
    const modal = makeModal({
      buttons: [
        makeButton("accept", "Accept all", 1, {
          boundingBox: { x: 0, y: 0, width: 360, height: 40 },
        }), // 14 400 px²
        makeButton("reject", "Reject all", 1, {
          boundingBox: { x: 0, y: 0, width: 60, height: 20 },
        }), //  1 200 px²
      ],
    });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.issues.some((i) => i.type === "asymmetric-prominence")).toBe(true);
    expect(result.breakdown.easyRefusal).toBeLessThanOrEqual(20);
  });

  it("deducts 5 for font-size nudging (accept font 1.3× larger)", () => {
    const modal = makeModal({
      buttons: [
        makeButton("accept", "Accept all", 1, { fontSize: 20 }),
        makeButton("reject", "Reject all", 1, { fontSize: 12 }),
      ],
    });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.issues.some((i) => i.type === "nudging")).toBe(true);
  });

  it("deducts 5 for indirect reject label ('continuer sans accepter' dark pattern)", () => {
    const modal = makeModal({
      buttons: [
        makeButton("accept", "Tout accepter", 1),
        makeButton("reject", "Continuer sans accepter", 1),
      ],
    });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.breakdown.easyRefusal).toBeLessThanOrEqual(20);
    expect(
      result.issues.some((i) => i.type === "misleading-wording" && i.severity === "warning"),
    ).toBe(true);
  });

  it("does NOT deduct for an explicit reject label", () => {
    const modal = makeModal({
      buttons: [makeButton("accept", "Tout accepter", 1), makeButton("reject", "Tout refuser", 1)],
    });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.breakdown.easyRefusal).toBe(25);
  });
});

// ── C. Transparency ───────────────────────────────────────────────────────────

describe("transparency dimension", () => {
  it("deducts 10 when there are no granular controls", () => {
    const modal = makeModal({ hasGranularControls: false, checkboxes: [] });
    const before = analyzeCompliance({
      modal: makeModal({ hasGranularControls: true }),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    const after = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(after.breakdown.transparency).toBeLessThan(before.breakdown.transparency);
  });

  it("deducts 5 when no privacy policy link in modal", () => {
    const modal = makeModal({ privacyPolicyUrl: null });
    const result = analyzeCompliance({
      modal,
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(
      result.issues.some((i) => i.type === "missing-info" && i.description.includes("modal")),
    ).toBe(true);
  });

  it("deducts 3 when no privacy policy link found anywhere on the page", () => {
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: null,
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(
      result.issues.some((i) => i.type === "missing-info" && i.description.includes("on the page")),
    ).toBe(true);
  });
});

// ── D. Cookie behavior ────────────────────────────────────────────────────────

describe("cookieBehavior dimension", () => {
  it("deducts for cookies set before any interaction", () => {
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [makeCookie("_ga", true, "before-interaction")],
      cookiesAfterAccept: [],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(
      result.issues.some(
        (i) => i.type === "auto-consent" && i.description.includes("before any interaction"),
      ),
    ).toBe(true);
    expect(result.breakdown.cookieBehavior).toBeLessThan(25);
  });

  it("caps cookie-before-consent deduction at 20", () => {
    const manyCookies = Array.from({ length: 10 }, (_, i) =>
      makeCookie(`_ga_${i}`, true, "before-interaction"),
    );
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: manyCookies,
      cookiesAfterAccept: [],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.breakdown.cookieBehavior).toBeGreaterThanOrEqual(5); // 25 - min(20, 10*4) = 5
  });

  it("deducts for non-essential cookies persisting after rejection", () => {
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [],
      cookiesAfterReject: [makeCookie("_ga", true, "after-reject")],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(
      result.issues.some(
        (i) => i.type === "auto-consent" && i.description.includes("persist after rejection"),
      ),
    ).toBe(true);
    expect(result.breakdown.cookieBehavior).toBeLessThan(25);
  });

  it("deducts for tracker requests fired before consent", () => {
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [],
      cookiesAfterReject: [],
      networkBeforeInteraction: [makeTracker("before-interaction")],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(
      result.issues.some((i) => i.type === "auto-consent" && i.description.includes("tracker")),
    ).toBe(true);
    expect(result.breakdown.cookieBehavior).toBeLessThan(25);
  });

  it("does NOT deduct for strictly-necessary cookies set before interaction", () => {
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [makeCookie("PHPSESSID", false, "before-interaction")],
      cookiesAfterAccept: [],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.breakdown.cookieBehavior).toBe(25);
  });
});

// ── Score clamping ────────────────────────────────────────────────────────────

describe("score clamping", () => {
  it("never produces a negative score dimension", () => {
    const result = analyzeCompliance({
      modal: makeModal({
        detected: false,
        selector: null,
        text: "",
        buttons: [],
        checkboxes: [],
        hasGranularControls: false,
        privacyPolicyUrl: null,
      }),
      privacyPolicyUrl: null,
      cookiesBeforeInteraction: Array.from({ length: 10 }, (_, i) => makeCookie(`_ga_${i}`, true)),
      cookiesAfterAccept: [makeCookie("_ga", true, "after-accept")],
      cookiesAfterReject: Array.from({ length: 10 }, (_, i) =>
        makeCookie(`_ga_${i}`, true, "after-reject"),
      ),
      networkBeforeInteraction: Array.from({ length: 10 }, () => makeTracker()),
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    expect(result.breakdown.consentValidity).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.easyRefusal).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.transparency).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.cookieBehavior).toBeGreaterThanOrEqual(0);
  });

  it("never produces a dimension score above 25", () => {
    const result = analyzeCompliance({
      modal: makeModal(),
      privacyPolicyUrl: "https://example.com/privacy",
      cookiesBeforeInteraction: [],
      cookiesAfterAccept: [],
      cookiesAfterReject: [],
      networkBeforeInteraction: [],
      networkAfterAccept: [],
      networkAfterReject: [],
    });
    for (const score of Object.values(result.breakdown)) {
      expect(score).toBeLessThanOrEqual(25);
    }
  });
});
