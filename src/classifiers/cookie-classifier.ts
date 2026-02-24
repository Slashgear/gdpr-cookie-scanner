import type { CookieCategory } from "../types.js";

interface CookieClassification {
  category: CookieCategory;
  requiresConsent: boolean;
}

/**
 * Cookie name patterns mapped to categories.
 * Patterns are checked against the cookie name (case-insensitive).
 */
const COOKIE_PATTERNS: Array<{
  pattern: RegExp;
  category: CookieCategory;
  requiresConsent: boolean;
}> = [
  // ── Strictly necessary ────────────────────────────────────────
  {
    pattern: /^(PHPSESSID|JSESSIONID|ASP\.NET_SessionId|__session)$/i,
    category: "strictly-necessary",
    requiresConsent: false,
  },
  { pattern: /^sess(ion)?[-_]?id$/i, category: "strictly-necessary", requiresConsent: false },
  {
    pattern: /^(csrf|xsrf|_token|authenticity_token)[-_]?/i,
    category: "strictly-necessary",
    requiresConsent: false,
  },
  {
    pattern: /^(auth|authenticated|login|logged[-_]in)[-_]?/i,
    category: "strictly-necessary",
    requiresConsent: false,
  },
  {
    pattern: /^(cart|basket|bag|checkout)[-_]?/i,
    category: "strictly-necessary",
    requiresConsent: false,
  },
  {
    pattern: /^(lang|locale|language|country|currency)$/i,
    category: "strictly-necessary",
    requiresConsent: false,
  },
  {
    pattern: /^(consent|cookie[-_]consent|cc[-_]cookie|cookieconsent)[-_]?/i,
    category: "strictly-necessary",
    requiresConsent: false,
  },
  {
    pattern: /^(axeptio|didomi|cookiebot|onetrust|tarteaucitron)[-_]?/i,
    category: "strictly-necessary",
    requiresConsent: false,
  },

  // ── Analytics ──────────────────────────────────────────────────
  { pattern: /^_ga$/i, category: "analytics", requiresConsent: true },
  { pattern: /^_ga_/i, category: "analytics", requiresConsent: true },
  { pattern: /^_gid$/i, category: "analytics", requiresConsent: true },
  { pattern: /^_gat/i, category: "analytics", requiresConsent: true },
  { pattern: /^_utm/i, category: "analytics", requiresConsent: true },
  { pattern: /^__utm/i, category: "analytics", requiresConsent: true },
  { pattern: /^_pk_/i, category: "analytics", requiresConsent: true }, // Matomo/Piwik
  { pattern: /^pk_/i, category: "analytics", requiresConsent: true },
  { pattern: /^amp_/i, category: "analytics", requiresConsent: true }, // Amplitude
  { pattern: /^(ajs_|segment_)/i, category: "analytics", requiresConsent: true }, // Segment
  { pattern: /^_hjSessionUser/i, category: "analytics", requiresConsent: true }, // Hotjar
  { pattern: /^_hj/i, category: "analytics", requiresConsent: true },
  { pattern: /^mixpanel/i, category: "analytics", requiresConsent: true },
  { pattern: /^(heap_|heap\.)/i, category: "analytics", requiresConsent: true },
  { pattern: /^(clarity_|clid|CLID)$/i, category: "analytics", requiresConsent: true }, // Microsoft Clarity

  // ── Advertising ────────────────────────────────────────────────
  { pattern: /^(_fbp|_fbc|fb_)/, category: "advertising", requiresConsent: true }, // Meta/Facebook
  {
    pattern: /^(IDE|NID|DSID|ANID|__gads|__gpi|FCNEC)$/i,
    category: "advertising",
    requiresConsent: true,
  }, // Google Ads
  {
    pattern: /^(muid|MUID|at_check|atidvisitor)$/i,
    category: "advertising",
    requiresConsent: true,
  }, // Microsoft
  { pattern: /^(li_|linkedin_|bcookie|bscookie)/, category: "advertising", requiresConsent: true }, // LinkedIn
  {
    pattern: /^(twitter|_twitter_sess|personalization_id|guest_id)$/i,
    category: "advertising",
    requiresConsent: true,
  },
  { pattern: /^(criteo_|cto_|uid)$/i, category: "advertising", requiresConsent: true }, // Criteo
  { pattern: /^(tapad|tapid)$/i, category: "advertising", requiresConsent: true },
  { pattern: /^(DoubleClick|DCLK)$/i, category: "advertising", requiresConsent: true },
  { pattern: /^_ttp$/i, category: "advertising", requiresConsent: true }, // TikTok

  // ── Social ─────────────────────────────────────────────────────
  { pattern: /^(fbsr_|fbm_)/, category: "social", requiresConsent: true }, // Facebook login
  { pattern: /^(yt-|YSC|GPS)$/i, category: "social", requiresConsent: true }, // YouTube
  { pattern: /^VISITOR_INFO/i, category: "social", requiresConsent: true }, // YouTube VISITOR_INFO1_LIVE etc.

  // ── Personalization ────────────────────────────────────────────
  {
    pattern: /^(ab_|abt_|abtest|experiment|variant|split[-_]test)/i,
    category: "personalization",
    requiresConsent: true,
  },
  {
    pattern: /^(optimizely|vwo_|convert_|cxense)/i,
    category: "personalization",
    requiresConsent: true,
  },
];

export function classifyCookie(
  name: string,
  domain: string,
  value: string,
  strict = false,
): CookieClassification {
  for (const { pattern, category, requiresConsent } of COOKIE_PATTERNS) {
    if (pattern.test(name)) {
      return { category, requiresConsent };
    }
  }

  // Heuristic: very short session cookie with no clear purpose
  if (name.length <= 4 && !value.includes("=")) {
    return { category: "unknown", requiresConsent: true };
  }

  // In strict mode, unrecognised cookies are assumed to require consent
  return { category: "unknown", requiresConsent: strict };
}
