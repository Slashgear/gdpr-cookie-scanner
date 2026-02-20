import { describe, it, expect } from "vitest";
import { analyzeCompliance } from "../../src/analyzers/compliance.js";
import type {
  ConsentModal,
  ConsentButton,
  ScannedCookie,
  NetworkRequest,
} from "../../src/types.js";

// ── Helpers ────────────────────────────────────────────────────────────────

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
    backgroundColor: "rgb(0, 128, 0)",
    textColor: "rgb(255, 255, 255)",
    contrastRatio: 8.59,
    clickDepth: 1,
    ...overrides,
  };
}

function makeModal(overrides?: Partial<ConsentModal>): ConsentModal {
  return {
    detected: true,
    selector: "#cookie-banner",
    // Text carefully matches all 4 REQUIRED_INFO_PATTERNS:
    //   purposes → "purposes" (matches /purpose/)
    //   third-parties → "third-party vendors" (matches /third.part|vendor/)
    //   duration → "13 months" (matches /month/)
    //   withdrawal → "withdraw" (matches /withdraw/)
    text: "We use cookies for analytics purposes with third-party vendors. Cookies expire after 13 months. You may withdraw your consent at any time.",
    buttons: [makeButton("accept", "Accept all"), makeButton("reject", "Reject all")],
    checkboxes: [],
    hasGranularControls: false,
    layerCount: 1,
    screenshotPath: null,
    privacyPolicyUrl: "https://example.com/privacy",
    ...overrides,
  };
}

function makeCookie(
  name: string,
  category: ScannedCookie["category"],
  requiresConsent: boolean,
  capturedAt: ScannedCookie["capturedAt"],
): ScannedCookie {
  return {
    name,
    domain: "example.com",
    path: "/",
    value: "abc123",
    expires: null,
    httpOnly: false,
    secure: false,
    sameSite: null,
    category,
    requiresConsent,
    capturedAt,
  };
}

function makeRequest(
  url: string,
  trackerCategory: NetworkRequest["trackerCategory"],
  capturedAt: NetworkRequest["capturedAt"],
): NetworkRequest {
  return {
    url,
    method: "GET",
    resourceType: "xhr",
    initiator: null,
    isThirdParty: trackerCategory !== null,
    trackerCategory,
    trackerName: trackerCategory ? "Tracker" : null,
    capturedAt,
    responseStatus: 200,
    contentType: null,
  };
}

const emptyInputBase = {
  cookiesBeforeInteraction: [],
  cookiesAfterAccept: [],
  cookiesAfterReject: [],
  networkBeforeInteraction: [],
  networkAfterAccept: [],
  networkAfterReject: [],
  privacyPolicyUrl: "https://example.com/privacy",
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("analyzeCompliance", () => {
  describe("no consent modal detected", () => {
    it("scores 0 on consentValidity, easyRefusal, and transparency", () => {
      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal({ detected: false }),
      });

      expect(result.breakdown.consentValidity).toBe(0);
      expect(result.breakdown.easyRefusal).toBe(0);
      expect(result.breakdown.transparency).toBe(0);
    });

    it("issues a critical no-reject-button issue", () => {
      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal({ detected: false }),
      });
      const issue = result.issues.find((i) => i.type === "no-reject-button");
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe("critical");
    });
  });

  describe("perfect modal", () => {
    it("scores 100 when all dimensions are maximised (granular controls present)", () => {
      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal({ hasGranularControls: true }),
      });

      expect(result.breakdown.consentValidity).toBe(25);
      expect(result.breakdown.easyRefusal).toBe(25);
      expect(result.breakdown.transparency).toBe(25);
      expect(result.breakdown.cookieBehavior).toBe(25);
      expect(result.total).toBe(100);
      expect(result.grade).toBe("A");
      expect(result.issues).toHaveLength(0);
    });

    it("scores 90 (grade A) when modal is correct but lacks granular controls", () => {
      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal({ hasGranularControls: false }),
      });

      expect(result.breakdown.consentValidity).toBe(25);
      expect(result.breakdown.easyRefusal).toBe(25);
      // -10 for no granular controls
      expect(result.breakdown.transparency).toBe(15);
      expect(result.breakdown.cookieBehavior).toBe(25);
      expect(result.total).toBe(90);
      expect(result.grade).toBe("A");
    });
  });

  describe("pre-ticked checkboxes", () => {
    it("deducts 10 from consentValidity and raises a critical pre-ticked issue", () => {
      const modal = makeModal({
        hasGranularControls: true, // ensure no other transparency deductions
        checkboxes: [
          {
            name: "analytics",
            label: "Analytics",
            isCheckedByDefault: true,
            category: "analytics",
            selector: "#analytics-cb",
          },
        ],
      });

      const result = analyzeCompliance({ ...emptyInputBase, modal });

      // 25 - 10 (pre-ticked) = 15
      expect(result.breakdown.consentValidity).toBe(15);
      const issue = result.issues.find((i) => i.type === "pre-ticked");
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe("critical");
    });
  });

  describe("missing reject button", () => {
    it("deducts 15 from easyRefusal and raises a buried-reject issue", () => {
      const modal = makeModal({ buttons: [makeButton("accept", "Accept all")] });
      const result = analyzeCompliance({ ...emptyInputBase, modal });

      expect(result.breakdown.easyRefusal).toBe(10);
      const issue = result.issues.find((i) => i.type === "buried-reject");
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe("critical");
    });
  });

  describe("reject requires more clicks than accept", () => {
    it("deducts 15 from easyRefusal for click asymmetry", () => {
      const modal = makeModal({
        buttons: [
          makeButton("accept", "Accept", { clickDepth: 1 }),
          makeButton("reject", "Reject", { clickDepth: 2 }),
        ],
      });

      const result = analyzeCompliance({ ...emptyInputBase, modal });

      expect(result.breakdown.easyRefusal).toBe(10);
      const issue = result.issues.find((i) => i.type === "click-asymmetry");
      expect(issue).toBeDefined();
    });
  });

  describe("large accept button compared to reject", () => {
    it("deducts 5 from easyRefusal for visual asymmetry (accept >3x reject area)", () => {
      const modal = makeModal({
        buttons: [
          makeButton("accept", "Accept", {
            boundingBox: { x: 0, y: 0, width: 300, height: 60 }, // 18000 px²
          }),
          makeButton("reject", "Reject", {
            boundingBox: { x: 0, y: 60, width: 60, height: 30 }, // 1800 px²
          }),
        ],
      });

      const result = analyzeCompliance({ ...emptyInputBase, modal });

      expect(result.breakdown.easyRefusal).toBe(20);
      const issue = result.issues.find((i) => i.type === "asymmetric-prominence");
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe("warning");
    });
  });

  describe("font size asymmetry", () => {
    it("deducts 5 from easyRefusal when accept font is 30%+ larger than reject", () => {
      const modal = makeModal({
        buttons: [
          makeButton("accept", "Accept", { fontSize: 20 }),
          makeButton("reject", "Reject", { fontSize: 12 }),
        ],
      });

      const result = analyzeCompliance({ ...emptyInputBase, modal });

      expect(result.breakdown.easyRefusal).toBe(20);
      const issue = result.issues.find((i) => i.type === "nudging");
      expect(issue).toBeDefined();
    });
  });

  describe("no granular controls", () => {
    it("deducts 10 from transparency when hasGranularControls is false", () => {
      const result = analyzeCompliance({
        ...emptyInputBase,
        // Page-level privacy link present, modal link present, good text → only -10 for no granular
        modal: makeModal({ hasGranularControls: false }),
      });

      // 25 - 10 (no granular) = 15
      expect(result.breakdown.transparency).toBe(15);
    });

    it("keeps full transparency (25) when hasGranularControls is true", () => {
      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal({ hasGranularControls: true }),
      });

      expect(result.breakdown.transparency).toBe(25);
    });
  });

  describe("missing privacy policy link in modal", () => {
    it("deducts 5 from transparency and raises a missing-info warning", () => {
      // hasGranularControls: true so only -5 deduction (no -10 for granular)
      const modal = makeModal({ hasGranularControls: true, privacyPolicyUrl: null });
      const result = analyzeCompliance({ ...emptyInputBase, modal });

      // 25 - 5 (no modal privacy link) = 20
      expect(result.breakdown.transparency).toBe(20);
      const issue = result.issues.find(
        (i) =>
          i.type === "missing-info" &&
          i.description.includes("privacy policy link") &&
          i.description.includes("modal"),
      );
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe("warning");
    });
  });

  describe("missing privacy policy link on page", () => {
    it("deducts 3 from transparency and raises a missing-info warning", () => {
      // hasGranularControls: true so only -3 deduction (no -10 for granular)
      const result = analyzeCompliance({
        ...emptyInputBase,
        privacyPolicyUrl: null,
        modal: makeModal({ hasGranularControls: true }),
      });

      // 25 - 3 (no page privacy link) = 22
      expect(result.breakdown.transparency).toBe(22);
      const issue = result.issues.find(
        (i) => i.type === "missing-info" && i.description.includes("page"),
      );
      expect(issue).toBeDefined();
    });
  });

  describe("non-essential cookies before consent", () => {
    it("deducts from cookieBehavior for each illegal pre-consent cookie (max -20)", () => {
      const illegalCookies = Array.from({ length: 3 }, (_, i) =>
        makeCookie(`_ga_${i}`, "analytics", true, "before-interaction"),
      );

      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal(),
        cookiesBeforeInteraction: illegalCookies,
      });

      // 3 cookies × 4 = -12
      expect(result.breakdown.cookieBehavior).toBe(13);
      const issue = result.issues.find(
        (i) => i.type === "auto-consent" && i.description.includes("before any interaction"),
      );
      expect(issue).toBeDefined();
      expect(issue?.severity).toBe("critical");
    });

    it("deduction is capped at -20 for many pre-consent cookies", () => {
      const illegalCookies = Array.from({ length: 10 }, (_, i) =>
        makeCookie(`_ga_${i}`, "analytics", true, "before-interaction"),
      );

      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal(),
        cookiesBeforeInteraction: illegalCookies,
      });

      expect(result.breakdown.cookieBehavior).toBe(5); // 25 - 20
    });
  });

  describe("non-essential cookies persisting after reject", () => {
    it("deducts from cookieBehavior for cookies persisting after rejection", () => {
      const cookiesAfterReject = [
        makeCookie("_fbp", "advertising", true, "after-reject"),
        makeCookie("_ga", "analytics", true, "after-reject"),
      ];

      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal(),
        cookiesAfterReject,
      });

      // 2 cookies × 3 = -6
      expect(result.breakdown.cookieBehavior).toBe(19);
      const issue = result.issues.find(
        (i) => i.type === "auto-consent" && i.description.includes("after rejection"),
      );
      expect(issue).toBeDefined();
    });
  });

  describe("trackers firing before consent", () => {
    it("deducts from cookieBehavior for pre-interaction tracker requests", () => {
      const trackerRequests = [
        makeRequest("https://www.google-analytics.com/collect", "analytics", "before-interaction"),
        makeRequest(
          "https://connect.facebook.net/fbevents.js",
          "advertising",
          "before-interaction",
        ),
      ];

      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal(),
        networkBeforeInteraction: trackerRequests,
      });

      // 2 trackers × 2 = -4
      expect(result.breakdown.cookieBehavior).toBe(21);
      const issue = result.issues.find(
        (i) => i.type === "auto-consent" && i.description.includes("tracker request"),
      );
      expect(issue).toBeDefined();
    });

    it("does not flag CDN requests as pre-consent trackers", () => {
      const cdnRequest = makeRequest(
        "https://cdn.example.com/font.woff2",
        "cdn",
        "before-interaction",
      );

      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal(),
        networkBeforeInteraction: [cdnRequest],
      });

      expect(result.breakdown.cookieBehavior).toBe(25);
    });
  });

  describe("score clamping", () => {
    it("clamps each dimension to [0, 25]", () => {
      // Trigger many deductions at once
      const illegalCookies = Array.from({ length: 10 }, (_, i) =>
        makeCookie(`_ga_${i}`, "analytics", true, "before-interaction"),
      );
      const trackers = Array.from({ length: 10 }, (_, i) =>
        makeRequest(`https://tracker${i}.example.com/collect`, "analytics", "before-interaction"),
      );

      const result = analyzeCompliance({
        ...emptyInputBase,
        privacyPolicyUrl: null,
        modal: makeModal({ detected: false }),
        cookiesBeforeInteraction: illegalCookies,
        networkBeforeInteraction: trackers,
      });

      for (const score of Object.values(result.breakdown)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(25);
      }
    });
  });

  describe("grade assignment", () => {
    it("assigns grade A for score >= 90", () => {
      const result = analyzeCompliance({
        ...emptyInputBase,
        modal: makeModal({ hasGranularControls: true }),
      });
      expect(result.total).toBe(100);
      expect(result.grade).toBe("A");
    });

    it("assigns grade F for very low score", () => {
      const illegalCookies = Array.from({ length: 10 }, (_, i) =>
        makeCookie(`_ga_${i}`, "analytics", true, "before-interaction"),
      );
      const result = analyzeCompliance({
        ...emptyInputBase,
        privacyPolicyUrl: null,
        modal: makeModal({ detected: false }),
        cookiesBeforeInteraction: illegalCookies,
      });
      expect(result.grade).toBe("F");
    });
  });
});
