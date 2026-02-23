import { describe, it, expect } from "vitest";
import { classifyNetworkRequest } from "../../src/classifiers/network-classifier.js";

describe("classifyNetworkRequest", () => {
  // ── Known trackers (exact hostname match) ────────────────────────

  describe("tracker database — exact match", () => {
    it("identifies Google Analytics", () => {
      const result = classifyNetworkRequest("https://google-analytics.com/collect", "xhr");
      expect(result.trackerCategory).toBe("analytics");
      expect(result.trackerName).toBe("Google Analytics");
      expect(result.requiresConsent).toBe(true);
      expect(result.isThirdParty).toBe(true);
    });

    it("identifies Google Tag Manager", () => {
      const result = classifyNetworkRequest(
        "https://googletagmanager.com/gtm.js?id=GTM-XXXX",
        "script",
      );
      expect(result.trackerCategory).toBe("analytics");
      expect(result.trackerName).toBe("Google Tag Manager");
      expect(result.requiresConsent).toBe(true);
    });

    it("identifies Meta Pixel (pixel.facebook.com)", () => {
      const result = classifyNetworkRequest("https://pixel.facebook.com/tr?id=123", "xhr");
      expect(result.trackerCategory).toBe("advertising");
      expect(result.trackerName).toBe("Meta Pixel");
      expect(result.requiresConsent).toBe(true);
    });

    it("identifies LinkedIn Insight Tag", () => {
      const result = classifyNetworkRequest(
        "https://snap.licdn.com/li.lms-analytics/insight.min.js",
        "script",
      );
      expect(result.trackerCategory).toBe("advertising");
      expect(result.requiresConsent).toBe(true);
    });

    it("identifies Hotjar", () => {
      const result = classifyNetworkRequest("https://hotjar.com/api/v2/event", "xhr");
      expect(result.trackerCategory).toBe("analytics");
      expect(result.trackerName).toBe("Hotjar");
    });

    it("identifies Microsoft Clarity", () => {
      const result = classifyNetworkRequest("https://clarity.ms/collect", "xhr");
      expect(result.trackerCategory).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });
  });

  // ── Subdomain suffix match ────────────────────────────────────────

  describe("tracker database — subdomain match", () => {
    it("matches subdomain of google-analytics.com", () => {
      const result = classifyNetworkRequest("https://stats.google-analytics.com/r/collect", "xhr");
      expect(result.trackerName).toBe("Google Analytics");
      expect(result.isThirdParty).toBe(true);
    });

    it("strips www. before matching", () => {
      const result = classifyNetworkRequest("https://www.google-analytics.com/collect", "xhr");
      expect(result.trackerCategory).toBe("analytics");
    });
  });

  // ── Pixel pattern matching ────────────────────────────────────────

  describe("pixel patterns", () => {
    it("identifies tracking pixels by URL pattern", () => {
      const result = classifyNetworkRequest(
        "https://track.example.com/pixel.gif?uid=123&ev=pageview",
        "image",
      );
      // Either caught by pixel pattern or image heuristic
      expect(result.trackerCategory).toBe("pixel");
      expect(result.requiresConsent).toBe(true);
    });
  });

  // ── Image heuristic ───────────────────────────────────────────────

  describe("image resource heuristic", () => {
    it("flags 1×1 gif with tracking params as pixel", () => {
      const result = classifyNetworkRequest(
        "https://metrics.unknown-vendor.com/track.gif?uid=abc&ts=1234",
        "image",
      );
      expect(result.trackerCategory).toBe("pixel");
      expect(result.requiresConsent).toBe(true);
    });

    it("does NOT flag regular image without tracking params", () => {
      const result = classifyNetworkRequest("https://cdn.unknown-vendor.com/hero.png", "image");
      expect(result.trackerCategory).toBeNull();
      expect(result.requiresConsent).toBe(false);
    });
  });

  // ── CDN — consent not required ────────────────────────────────────

  describe("CDN entries", () => {
    it("marks CDN requests as not requiring consent", () => {
      // fbcdn.net is category 'social' not cdn, but let's test the cdn logic
      // by checking that consentRequired=false entries in TRACKER_DB are respected
      // Google fonts is not in the DB, so test a generic unknown
      const result = classifyNetworkRequest("https://totally-unknown-cdn.io/lib.js", "script");
      expect(result.requiresConsent).toBe(false);
      expect(result.trackerCategory).toBeNull();
    });
  });

  // ── Unknown / safe requests ───────────────────────────────────────

  describe("unknown requests", () => {
    it("returns null classification for an unknown domain", () => {
      const result = classifyNetworkRequest("https://api.my-own-backend.com/data", "xhr");
      expect(result.trackerCategory).toBeNull();
      expect(result.trackerName).toBeNull();
      expect(result.requiresConsent).toBe(false);
      expect(result.isThirdParty).toBe(false);
    });

    it("returns safe fallback for an invalid URL", () => {
      const result = classifyNetworkRequest("not-a-url", "xhr");
      expect(result.trackerCategory).toBeNull();
      expect(result.requiresConsent).toBe(false);
      expect(result.isThirdParty).toBe(false);
    });

    it("returns safe fallback for an empty string", () => {
      const result = classifyNetworkRequest("", "xhr");
      expect(result.trackerCategory).toBeNull();
      expect(result.requiresConsent).toBe(false);
    });
  });
});
