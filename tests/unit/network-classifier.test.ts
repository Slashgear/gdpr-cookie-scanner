import { describe, it, expect } from "vitest";
import { classifyNetworkRequest } from "../../src/classifiers/network-classifier.js";

describe("classifyNetworkRequest", () => {
  describe("known trackers in TRACKER_DB", () => {
    it("identifies Google Analytics as analytics tracker", () => {
      const result = classifyNetworkRequest(
        "https://www.google-analytics.com/j/collect?v=1&t=event",
        "xhr",
      );
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("analytics");
      expect(result.trackerName).toMatch(/google analytics/i);
    });

    it("identifies a subdomain of a known tracker domain", () => {
      const result = classifyNetworkRequest("https://stats.google-analytics.com/collect", "xhr");
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("analytics");
    });

    it("identifies Facebook SDK (connect.facebook.net) as social", () => {
      const result = classifyNetworkRequest(
        "https://connect.facebook.net/en_US/fbevents.js",
        "script",
      );
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("social");
    });

    it("identifies DoubleClick as advertising", () => {
      const result = classifyNetworkRequest("https://ad.doubleclick.net/ddm/trackimp", "image");
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("advertising");
    });

    it("identifies Google Tag Manager as analytics", () => {
      const result = classifyNetworkRequest(
        "https://www.googletagmanager.com/gtm.js?id=GTM-XXXX",
        "script",
      );
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("analytics");
    });
  });

  describe("pixel/beacon patterns", () => {
    it("identifies tracking pixel via URL pattern", () => {
      const result = classifyNetworkRequest(
        "https://example.com/pixel.gif?uid=123&ts=1234567890",
        "image",
      );
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("pixel");
    });
  });

  describe("non-tracker requests", () => {
    it("does not flag first-party requests", () => {
      const result = classifyNetworkRequest("https://example.com/api/data", "xhr");
      expect(result.isThirdParty).toBe(false);
      expect(result.trackerCategory).toBeNull();
      expect(result.trackerName).toBeNull();
      expect(result.requiresConsent).toBe(false);
    });

    it("does not flag CDN requests for known CDN domains", () => {
      const result = classifyNetworkRequest("https://cdn.cloudflare.com/some-asset.js", "script");
      // cloudflare may or may not be in tracker DB — check it doesn't come back as advertising/analytics
      if (result.isThirdParty) {
        expect(result.trackerCategory).toBe("cdn");
      } else {
        expect(result.isThirdParty).toBe(false);
      }
    });

    it("returns safe defaults for an invalid URL", () => {
      const result = classifyNetworkRequest("not-a-url", "xhr");
      expect(result.isThirdParty).toBe(false);
      expect(result.trackerCategory).toBeNull();
      expect(result.trackerName).toBeNull();
      expect(result.requiresConsent).toBe(false);
    });
  });

  describe("www prefix stripping", () => {
    it("strips www from hostname before matching", () => {
      const result = classifyNetworkRequest("https://www.google-analytics.com/collect", "xhr");
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("analytics");
    });
  });

  describe("requiresConsent field", () => {
    it("Plausible Analytics (/api/event) is classified as analytics but does not require consent", () => {
      const result = classifyNetworkRequest("https://plausible.io/api/event", "xhr");
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("analytics");
      expect(result.trackerName).toBe("Plausible Analytics");
      expect(result.requiresConsent).toBe(false);
    });

    it("Google Analytics requires consent", () => {
      const result = classifyNetworkRequest(
        "https://www.google-analytics.com/j/collect?v=1&t=event",
        "xhr",
      );
      expect(result.requiresConsent).toBe(true);
    });

    it("CDN domain (akamaized.net) does not require consent", () => {
      const result = classifyNetworkRequest("https://assets.akamaized.net/bundle.js", "script");
      expect(result.isThirdParty).toBe(true);
      expect(result.trackerCategory).toBe("cdn");
      expect(result.requiresConsent).toBe(false);
    });
  });
});
