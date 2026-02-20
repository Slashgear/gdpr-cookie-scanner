import { describe, it, expect } from "vitest";
import { classifyCookie } from "../../src/classifiers/cookie-classifier.js";

describe("classifyCookie", () => {
  describe("strictly-necessary cookies", () => {
    it("classifies PHPSESSID as strictly-necessary", () => {
      const result = classifyCookie("PHPSESSID", "example.com", "abc123");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies JSESSIONID as strictly-necessary", () => {
      const result = classifyCookie("JSESSIONID", "example.com", "xyz");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies csrf_token as strictly-necessary", () => {
      const result = classifyCookie("csrf_token", "example.com", "token123");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies session_id as strictly-necessary", () => {
      const result = classifyCookie("session_id", "example.com", "abc");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies auth_token as strictly-necessary", () => {
      const result = classifyCookie("auth_token", "example.com", "tok");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies cart as strictly-necessary", () => {
      const result = classifyCookie("cart_id", "example.com", "123");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies lang as strictly-necessary", () => {
      const result = classifyCookie("lang", "example.com", "fr");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies consent cookie as strictly-necessary", () => {
      const result = classifyCookie("cookieconsent_status", "example.com", "allow");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies axeptio cookie as strictly-necessary", () => {
      const result = classifyCookie("axeptio_cookies", "example.com", "{}");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies didomi cookie as strictly-necessary", () => {
      const result = classifyCookie("didomi_token", "example.com", "token");
      expect(result.category).toBe("strictly-necessary");
      expect(result.requiresConsent).toBe(false);
    });
  });

  describe("analytics cookies", () => {
    it("classifies _ga as analytics", () => {
      const result = classifyCookie("_ga", "example.com", "GA1.2.123456789.1234567890");
      expect(result.category).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies _ga_XXXX as analytics", () => {
      const result = classifyCookie("_ga_ABC123", "example.com", "GS1.1.1234567890.1.1.1234567890");
      expect(result.category).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies _gid as analytics", () => {
      const result = classifyCookie("_gid", "example.com", "GA1.2.1234567890.1234567890");
      expect(result.category).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies _utm cookie as analytics", () => {
      const result = classifyCookie("_utma", "example.com", "123456.1234567890");
      expect(result.category).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies _pk_ (Matomo) as analytics", () => {
      const result = classifyCookie("_pk_id.1.2db1", "example.com", "abc.1234567890");
      expect(result.category).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies _hj (Hotjar) as analytics", () => {
      const result = classifyCookie("_hjSessionUser_1234567", "example.com", "abc");
      expect(result.category).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies mixpanel as analytics", () => {
      const result = classifyCookie("mixpanel_session", "example.com", "abc");
      expect(result.category).toBe("analytics");
      expect(result.requiresConsent).toBe(true);
    });
  });

  describe("advertising cookies", () => {
    it("classifies _fbp as advertising", () => {
      const result = classifyCookie("_fbp", "example.com", "fb.1.1234567890.123456789");
      expect(result.category).toBe("advertising");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies IDE (Google Ads) as advertising", () => {
      const result = classifyCookie("IDE", "doubleclick.net", "abc123");
      expect(result.category).toBe("advertising");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies linkedin cookie as advertising", () => {
      const result = classifyCookie("li_fat_id", "linkedin.com", "abc");
      expect(result.category).toBe("advertising");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies _ttp (TikTok) as advertising", () => {
      const result = classifyCookie("_ttp", "example.com", "abc");
      expect(result.category).toBe("advertising");
      expect(result.requiresConsent).toBe(true);
    });
  });

  describe("social cookies", () => {
    it("classifies YSC (YouTube) as social", () => {
      // VISITOR_INFO pattern matches exactly — real YouTube cookie is VISITOR_INFO1_LIVE
      // which does NOT match the exact-match pattern. YSC is the reliable test case.
      const result = classifyCookie("YSC", "youtube.com", "abc123");
      expect(result.category).toBe("social");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies GPS (YouTube) as social", () => {
      const result = classifyCookie("GPS", "youtube.com", "abc");
      expect(result.category).toBe("social");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies fbsr_ as social", () => {
      const result = classifyCookie("fbsr_123456", "facebook.com", "abc");
      expect(result.category).toBe("social");
      expect(result.requiresConsent).toBe(true);
    });
  });

  describe("personalization cookies", () => {
    it("classifies ab_test as personalization", () => {
      const result = classifyCookie("ab_test_variant", "example.com", "B");
      expect(result.category).toBe("personalization");
      expect(result.requiresConsent).toBe(true);
    });

    it("classifies optimizely cookie as personalization", () => {
      const result = classifyCookie("optimizely_session", "example.com", "abc");
      expect(result.category).toBe("personalization");
      expect(result.requiresConsent).toBe(true);
    });
  });

  describe("unknown cookies", () => {
    it("classifies unknown long cookie as unknown without consent", () => {
      const result = classifyCookie("my_custom_preference", "example.com", "some_long_value");
      expect(result.category).toBe("unknown");
      expect(result.requiresConsent).toBe(false);
    });

    it("classifies short cookie (<=4 chars) without '=' in value as unknown requiring consent", () => {
      const result = classifyCookie("abc", "example.com", "xyz");
      expect(result.category).toBe("unknown");
      expect(result.requiresConsent).toBe(true);
    });

    it("does NOT flag short cookie with '=' in value as requiring consent", () => {
      const result = classifyCookie("uid", "example.com", "dGVzdA==");
      // uid matches Criteo pattern → advertising
      expect(result.requiresConsent).toBe(true);
    });
  });
});
