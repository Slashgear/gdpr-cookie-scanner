import type { TrackerCategory } from "../types.js";

interface TrackerEntry {
  name: string;
  category: TrackerCategory;
}

/**
 * Known tracker domains and their categories.
 * Based on open-source tracker databases (EasyPrivacy, Disconnect, DuckDuckGo Tracker Radar).
 */
export const TRACKER_DB: Record<string, TrackerEntry> = {
  // ── Google ────────────────────────────────────────────────────
  "google-analytics.com": { name: "Google Analytics", category: "analytics" },
  "analytics.google.com": { name: "Google Analytics", category: "analytics" },
  "googletagmanager.com": { name: "Google Tag Manager", category: "analytics" },
  "googletagservices.com": { name: "Google Tag Services", category: "advertising" },
  "googlesyndication.com": { name: "Google AdSense", category: "advertising" },
  "doubleclick.net": { name: "Google DoubleClick", category: "advertising" },
  "adservice.google.com": { name: "Google Ad Services", category: "advertising" },
  "google.com/ads": { name: "Google Ads", category: "advertising" },
  "googleadservices.com": { name: "Google Ad Services", category: "advertising" },
  "pagead2.googlesyndication.com": { name: "Google PageAd", category: "advertising" },

  // ── Meta / Facebook ───────────────────────────────────────────
  "connect.facebook.net": { name: "Facebook SDK", category: "social" },
  "graph.facebook.com": { name: "Facebook Graph API", category: "social" },
  "facebook.com/tr": { name: "Meta Pixel", category: "advertising" },
  "fbcdn.net": { name: "Facebook CDN", category: "social" },

  // ── Microsoft ─────────────────────────────────────────────────
  "bat.bing.com": { name: "Bing Ads", category: "advertising" },
  "clarity.ms": { name: "Microsoft Clarity", category: "analytics" },
  "ads.microsoft.com": { name: "Microsoft Ads", category: "advertising" },
  "scorecardresearch.com": { name: "Scorecard Research", category: "analytics" },

  // ── Hotjar ────────────────────────────────────────────────────
  "hotjar.com": { name: "Hotjar", category: "analytics" },
  "static.hotjar.com": { name: "Hotjar", category: "analytics" },

  // ── LinkedIn ─────────────────────────────────────────────────
  "snap.licdn.com": { name: "LinkedIn Insight Tag", category: "advertising" },
  "platform.linkedin.com": { name: "LinkedIn", category: "social" },

  // ── Twitter / X ──────────────────────────────────────────────
  "static.ads-twitter.com": { name: "Twitter Ads", category: "advertising" },
  "analytics.twitter.com": { name: "Twitter Analytics", category: "analytics" },
  "t.co": { name: "Twitter URL shortener", category: "advertising" },

  // ── TikTok ───────────────────────────────────────────────────
  "analytics.tiktok.com": { name: "TikTok Analytics", category: "analytics" },
  "ads-api.tiktok.com": { name: "TikTok Ads", category: "advertising" },

  // ── Criteo ───────────────────────────────────────────────────
  "dis.us.criteo.com": { name: "Criteo", category: "advertising" },
  "rtax.criteo.com": { name: "Criteo Retargeting", category: "advertising" },
  "static.criteo.net": { name: "Criteo", category: "advertising" },

  // ── Segment / Amplitude / Mixpanel ───────────────────────────
  "api.segment.io": { name: "Segment", category: "analytics" },
  "cdn.segment.com": { name: "Segment", category: "analytics" },
  "api2.amplitude.com": { name: "Amplitude", category: "analytics" },
  "api.mixpanel.com": { name: "Mixpanel", category: "analytics" },

  // ── Intercom / Drift / HubSpot ────────────────────────────────
  "js.intercomcdn.com": { name: "Intercom", category: "analytics" },
  "widget.intercom.io": { name: "Intercom Widget", category: "analytics" },
  "hubspot.com": { name: "HubSpot", category: "analytics" },
  "js.hs-scripts.com": { name: "HubSpot", category: "analytics" },
  "drift.com": { name: "Drift", category: "analytics" },

  // ── Fingerprinting ───────────────────────────────────────────
  "fingerprintjs.com": { name: "FingerprintJS", category: "fingerprinting" },
  "fpnpmcdn.net": { name: "FingerprintJS CDN", category: "fingerprinting" },

  // ── Advertising networks ─────────────────────────────────────
  "amazon-adsystem.com": { name: "Amazon Ads", category: "advertising" },
  "pubmatic.com": { name: "PubMatic", category: "advertising" },
  "rubiconproject.com": { name: "Rubicon Project", category: "advertising" },
  "openx.net": { name: "OpenX", category: "advertising" },
  "casalemedia.com": { name: "Casale Media", category: "advertising" },
  "akamaized.net": { name: "Akamai", category: "cdn" },
  "outbrain.com": { name: "Outbrain", category: "advertising" },
  "taboola.com": { name: "Taboola", category: "advertising" },
  "quantserve.com": { name: "Quantcast", category: "advertising" },
  "chartbeat.com": { name: "Chartbeat", category: "analytics" },

  // ── AB Testing ───────────────────────────────────────────────
  "optimizely.com": { name: "Optimizely", category: "analytics" },
  "vwo.com": { name: "VWO", category: "analytics" },
  "app.convert.com": { name: "Convert", category: "analytics" },
};

/**
 * Patterns for detecting tracking pixels and beacons by URL shape.
 */
export const PIXEL_PATTERNS: RegExp[] = [
  /\/pixel(\.gif|\.png|\.php)?(\?|$)/i,
  /\/beacon(\.gif|\.png|\.php)?(\?|$)/i,
  /\/track(ing)?(\.gif|\.png|\.php)?(\?|$)/i,
  /\/collect(\?|$)/i,
  /\/event(\?|$)/i,
  /\/(hit|ping|log)(\?|$)/i,
  /\?.*(?:pixel|beacon|track|event|hit)=/i,
];
