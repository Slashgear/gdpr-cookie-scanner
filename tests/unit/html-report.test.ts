import { describe, it, expect } from "bun:test";
import { generateHtmlReport } from "../../src/report/html.js";
import { analyzeCompliance } from "../../src/analyzers/compliance.js";
import type { ScanResult, ScannedCookie } from "../../src/types.js";

function makeCookie(name: string, capturedAt: ScannedCookie["capturedAt"]): ScannedCookie {
  return {
    name,
    domain: "example.com",
    path: "/",
    value: "abc",
    expires: null,
    httpOnly: false,
    secure: true,
    sameSite: "Lax",
    category: "analytics",
    requiresConsent: true,
    capturedAt,
  };
}

function makeResult(
  cookiesBeforeInteraction: ScannedCookie[],
  cookiesAfterReject: ScannedCookie[],
): ScanResult {
  const base = {
    modal: {
      detected: true,
      selector: "#cookie-banner",
      text: "We use cookies.",
      buttons: [],
      checkboxes: [],
      hasGranularControls: false,
      layerCount: 1,
      screenshotPath: null,
      privacyPolicyUrl: null,
    },
    privacyPolicyUrl: null,
    cookiesBeforeInteraction,
    cookiesAfterAccept: [],
    cookiesAfterReject,
    networkBeforeInteraction: [],
    networkAfterAccept: [],
    networkAfterReject: [],
  };
  return {
    ...base,
    url: "https://example.com",
    scanDate: "2026-01-01T00:00:00.000Z",
    duration: 1000,
    compliance: analyzeCompliance(base),
    screenshotPaths: [],
    errors: [],
    tcf: {
      detected: false,
      version: null,
      apiPresent: false,
      locatorFramePresent: false,
      cookieName: null,
      cmpId: null,
      consentString: null,
    },
  };
}

describe("HTML report — after-reject badge", () => {
  it("does not count pre-consent cookies still present after reject", () => {
    const html = generateHtmlReport(
      makeResult([makeCookie("_ga", "before-interaction")], [makeCookie("_ga", "after-reject")]),
    );
    expect(html).not.toContain("non-essential set after reject");
  });

  it("counts only cookies added after the reject click", () => {
    const html = generateHtmlReport(
      makeResult(
        [makeCookie("_ga", "before-interaction")],
        [makeCookie("_ga", "after-reject"), makeCookie("_fbp", "after-reject")],
      ),
    );
    expect(html).toContain("1 non-essential set after reject");
  });
});
