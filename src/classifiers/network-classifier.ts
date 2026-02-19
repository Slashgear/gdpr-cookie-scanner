import { TRACKER_DB, PIXEL_PATTERNS } from "./tracker-list.js";
import type { TrackerCategory } from "../types.js";

interface NetworkClassification {
  isThirdParty: boolean;
  trackerCategory: TrackerCategory | null;
  trackerName: string | null;
}

export function classifyNetworkRequest(url: string, resourceType: string): NetworkClassification {
  let hostname: string;

  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return { isThirdParty: false, trackerCategory: null, trackerName: null };
  }

  // Check tracker database (exact match or suffix match)
  for (const [domain, entry] of Object.entries(TRACKER_DB)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return {
        isThirdParty: true,
        trackerCategory: entry.category,
        trackerName: entry.name,
      };
    }
  }

  // Check pixel/beacon patterns in URL
  if (PIXEL_PATTERNS.some((p) => p.test(url))) {
    return {
      isThirdParty: true,
      trackerCategory: "pixel",
      trackerName: "Tracking Pixel",
    };
  }

  // Resource type heuristics
  if (resourceType === "image" && isLikelyPixel(url)) {
    return {
      isThirdParty: true,
      trackerCategory: "pixel",
      trackerName: "Tracking Pixel (image)",
    };
  }

  return {
    isThirdParty: false,
    trackerCategory: null,
    trackerName: null,
  };
}

/**
 * Heuristic: 1x1 gif / tiny image with tracking params
 */
function isLikelyPixel(url: string): boolean {
  const u = url.toLowerCase();
  return (
    (u.includes(".gif") || u.includes(".png")) &&
    u.includes("?") &&
    /[?&](uid|userid|sid|cid|vid|ts|t=|e=|ev=)/i.test(url)
  );
}
