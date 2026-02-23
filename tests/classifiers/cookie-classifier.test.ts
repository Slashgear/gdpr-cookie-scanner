import { describe, it, expect } from "vitest";
import { classifyCookie } from "../../src/classifiers/cookie-classifier.js";

describe("classifyCookie", () => {
  // ── Strictly necessary ───────────────────────────────────────────

  describe("strictly-necessary", () => {
    it.each(["PHPSESSID", "JSESSIONID", "ASP.NET_SessionId", "__session"])(
      "classifies %s as strictly-necessary",
      (name) => {
        const result = classifyCookie(name, "example.com", "abc123");
        expect(result).toEqual({ category: "strictly-necessary", requiresConsent: false });
      },
    );

    it("classifies session_id as strictly-necessary", () => {
      expect(classifyCookie("session_id", "example.com", "xyz")).toEqual({
        category: "strictly-necessary",
        requiresConsent: false,
      });
    });

    it.each(["csrf_token", "xsrf_token", "_token", "authenticity_token"])(
      "classifies CSRF cookie %s as strictly-necessary",
      (name) => {
        expect(classifyCookie(name, "example.com", "token")).toEqual({
          category: "strictly-necessary",
          requiresConsent: false,
        });
      },
    );

    it.each(["auth_token", "authenticated", "login_session", "logged_in"])(
      "classifies auth cookie %s as strictly-necessary",
      (name) => {
        expect(classifyCookie(name, "example.com", "1")).toEqual({
          category: "strictly-necessary",
          requiresConsent: false,
        });
      },
    );

    it.each(["cart_id", "basket", "checkout_token"])(
      "classifies cart/checkout cookie %s as strictly-necessary",
      (name) => {
        expect(classifyCookie(name, "example.com", "abc")).toEqual({
          category: "strictly-necessary",
          requiresConsent: false,
        });
      },
    );

    it.each(["lang", "locale", "language", "country", "currency"])(
      "classifies preference cookie %s as strictly-necessary",
      (name) => {
        expect(classifyCookie(name, "example.com", "fr")).toEqual({
          category: "strictly-necessary",
          requiresConsent: false,
        });
      },
    );

    it.each(["cookieconsent_status", "cookie_consent", "cc_cookie"])(
      "classifies CMP storage cookie %s as strictly-necessary",
      (name) => {
        expect(classifyCookie(name, "example.com", "granted")).toEqual({
          category: "strictly-necessary",
          requiresConsent: false,
        });
      },
    );

    it.each(["axeptio_cookies", "didomi_token", "CookieConsent", "tarteaucitron"])(
      "classifies known CMP cookie %s as strictly-necessary",
      (name) => {
        expect(classifyCookie(name, "example.com", "{}")).toEqual({
          category: "strictly-necessary",
          requiresConsent: false,
        });
      },
    );
  });

  // ── Analytics ────────────────────────────────────────────────────

  describe("analytics", () => {
    it.each(["_ga", "_gid"])(
      "classifies Google Analytics cookie %s as analytics requiring consent",
      (name) => {
        expect(classifyCookie(name, "example.com", "GA1.2.xxx")).toEqual({
          category: "analytics",
          requiresConsent: true,
        });
      },
    );

    it("classifies _ga_XXXXX (GA4 stream) as analytics", () => {
      expect(classifyCookie("_ga_K1A2B3C4D5", "example.com", "GS1.1.xxx")).toEqual({
        category: "analytics",
        requiresConsent: true,
      });
    });

    it.each(["_gat", "_gat_UA-123456"])(
      "classifies GA rate-limiter cookie %s as analytics",
      (name) => {
        expect(classifyCookie(name, "example.com", "1")).toEqual({
          category: "analytics",
          requiresConsent: true,
        });
      },
    );

    it.each(["_utma", "_utmb", "_utmz"])("classifies legacy UTM cookie %s as analytics", (name) => {
      expect(classifyCookie(name, "example.com", "xxx")).toEqual({
        category: "analytics",
        requiresConsent: true,
      });
    });

    it("classifies __utmz as analytics", () => {
      expect(classifyCookie("__utmz", "example.com", "xxx")).toEqual({
        category: "analytics",
        requiresConsent: true,
      });
    });

    it("classifies Matomo _pk_ cookie as analytics", () => {
      expect(classifyCookie("_pk_id.1.1fff", "example.com", "xxx")).toEqual({
        category: "analytics",
        requiresConsent: true,
      });
    });

    it("classifies Amplitude amp_ cookie as analytics", () => {
      expect(classifyCookie("amp_abc123", "example.com", "xxx")).toEqual({
        category: "analytics",
        requiresConsent: true,
      });
    });

    it("classifies Hotjar _hj cookie as analytics", () => {
      expect(classifyCookie("_hjSessionUser_123", "example.com", "xxx")).toEqual({
        category: "analytics",
        requiresConsent: true,
      });
    });

    it("classifies Microsoft Clarity CLID as analytics", () => {
      expect(classifyCookie("CLID", "example.com", "xxx")).toEqual({
        category: "analytics",
        requiresConsent: true,
      });
    });
  });

  // ── Advertising ──────────────────────────────────────────────────

  describe("advertising", () => {
    it.each(["_fbp", "_fbc", "fb_id"])(
      "classifies Meta/Facebook cookie %s as advertising",
      (name) => {
        expect(classifyCookie(name, "example.com", "xxx")).toEqual({
          category: "advertising",
          requiresConsent: true,
        });
      },
    );

    it.each(["IDE", "NID", "DSID", "ANID", "__gads", "__gpi", "FCNEC"])(
      "classifies Google Ads cookie %s as advertising",
      (name) => {
        expect(classifyCookie(name, "example.com", "xxx")).toEqual({
          category: "advertising",
          requiresConsent: true,
        });
      },
    );

    it("classifies MUID (Microsoft) as advertising", () => {
      expect(classifyCookie("MUID", "example.com", "xxx")).toEqual({
        category: "advertising",
        requiresConsent: true,
      });
    });

    it("classifies li_fat_id (LinkedIn) as advertising", () => {
      expect(classifyCookie("li_fat_id", "example.com", "xxx")).toEqual({
        category: "advertising",
        requiresConsent: true,
      });
    });

    it("classifies _ttp (TikTok) as advertising", () => {
      expect(classifyCookie("_ttp", "example.com", "xxx")).toEqual({
        category: "advertising",
        requiresConsent: true,
      });
    });
  });

  // ── Social ───────────────────────────────────────────────────────

  describe("social", () => {
    it("classifies fbsr_ (Facebook login) as social", () => {
      expect(classifyCookie("fbsr_123456", "example.com", "xxx")).toEqual({
        category: "social",
        requiresConsent: true,
      });
    });

    it.each(["YSC", "VISITOR_INFO1_LIVE", "GPS"])(
      "classifies YouTube cookie %s as social",
      (name) => {
        expect(classifyCookie(name, "example.com", "xxx")).toEqual({
          category: "social",
          requiresConsent: true,
        });
      },
    );
  });

  // ── Personalization ──────────────────────────────────────────────

  describe("personalization", () => {
    it.each(["ab_test", "abt_variant", "abtest_bucket"])(
      "classifies A/B test cookie %s as personalization",
      (name) => {
        expect(classifyCookie(name, "example.com", "variant_b")).toEqual({
          category: "personalization",
          requiresConsent: true,
        });
      },
    );

    it("classifies optimizely cookie as personalization", () => {
      expect(classifyCookie("optimizely_data", "example.com", "xxx")).toEqual({
        category: "personalization",
        requiresConsent: true,
      });
    });
  });

  // ── Unknown / heuristics ─────────────────────────────────────────

  describe("unknown", () => {
    it("classifies unrecognised long-name cookie as unknown without consent", () => {
      expect(classifyCookie("my_custom_app_cookie", "example.com", "somevalue=abc")).toEqual({
        category: "unknown",
        requiresConsent: false,
      });
    });

    it("classifies short-name cookie (≤4 chars, no = in value) as unknown requiring consent", () => {
      // Heuristic: suspicious session-like short cookie
      expect(classifyCookie("sid", "example.com", "abc123")).toEqual({
        category: "unknown",
        requiresConsent: true,
      });
    });

    it("does NOT flag short-name cookie as suspicious when value contains =", () => {
      // Base64-encoded values contain = — should not be flagged
      expect(classifyCookie("tok", "example.com", "abc=def")).toEqual({
        category: "unknown",
        requiresConsent: false,
      });
    });
  });
});
