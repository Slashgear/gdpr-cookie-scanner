/**
 * scripts/update-trackers.ts
 *
 * Maintenance script: fetches Disconnect.me and DuckDuckGo Tracker Radar,
 * maps their categories to TrackerCategory, and merges new entries into
 * src/classifiers/tracker-list.ts — preserving all manually curated entries.
 *
 * Usage:
 *   node --experimental-strip-types scripts/update-trackers.ts
 *   node --experimental-strip-types scripts/update-trackers.ts --dry-run
 *
 * Or via npm:
 *   pnpm update-trackers
 *   pnpm update-trackers -- --dry-run
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ── Types (inlined so the script runs without tsc) ────────────────────────────

type TrackerCategory =
  | "analytics"
  | "advertising"
  | "social"
  | "fingerprinting"
  | "pixel"
  | "cdn"
  | "unknown";

interface TrackerEntry {
  name: string;
  category: TrackerCategory;
}

// ── Disconnect.me ─────────────────────────────────────────────────────────────

type DisconnectDomainMap = Record<string, string[]>;
type DisconnectService = Record<string, DisconnectDomainMap | string>;
type DisconnectData = { categories: Record<string, DisconnectService[]> };

const DISCONNECT_CATEGORY_MAP: Record<string, TrackerCategory> = {
  Analytics: "analytics",
  Advertising: "advertising",
  Social: "social",
  Content: "cdn",
  Fingerprinting: "fingerprinting",
  Email: "advertising",
  Disconnect: "advertising",
};

async function fetchDisconnect(): Promise<Map<string, TrackerEntry>> {
  const url =
    "https://raw.githubusercontent.com/disconnectme/disconnect-tracking-protection/master/services.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Disconnect.me fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as DisconnectData;
  const result = new Map<string, TrackerEntry>();

  for (const [catName, services] of Object.entries(data.categories)) {
    const category = DISCONNECT_CATEGORY_MAP[catName];
    if (!category) continue;
    for (const serviceObj of services) {
      for (const [serviceName, value] of Object.entries(serviceObj)) {
        if (typeof value !== "object" || value === null) continue;
        const domainMap = value as DisconnectDomainMap;
        for (const [mainDomain, subDomains] of Object.entries(domainMap)) {
          result.set(mainDomain, { name: serviceName, category });
          for (const sub of subDomains) {
            // Subdomain inherits parent name/category unless already set
            if (!result.has(sub)) {
              result.set(sub, { name: serviceName, category });
            }
          }
        }
      }
    }
  }

  return result;
}

// ── DuckDuckGo Tracker Radar ──────────────────────────────────────────────────

interface DDGTracker {
  domain: string;
  owner?: { name: string; displayName: string };
  prevalence: number;
  categories?: string[];
}

type DDGData = { trackers: Record<string, DDGTracker> };

const DDG_CATEGORY_MAP: Record<string, TrackerCategory> = {
  Analytics: "analytics",
  Advertising: "advertising",
  "Social Network": "social",
  Fingerprinting: "fingerprinting",
  CDN: "cdn",
  "Action Pixels": "pixel",
  "Embedded Content": "cdn",
  "Session Replay": "analytics",
  "Email Tracking": "advertising",
  "Ad Motivated Tracking": "advertising",
  "Audience Measurement": "analytics",
  "Third-Party Analytics Marketing": "advertising",
};

/** Minimum prevalence (fraction of crawled sites) to include in the DB. */
const MIN_PREVALENCE = 0.001; // ≥ 0.1 %

async function fetchDDG(): Promise<Map<string, TrackerEntry>> {
  const url =
    "https://raw.githubusercontent.com/duckduckgo/tracker-radar/main/build-data/generated/tds.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DDG Tracker Radar fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as DDGData;
  const result = new Map<string, TrackerEntry>();

  for (const tracker of Object.values(data.trackers)) {
    if ((tracker.prevalence ?? 0) < MIN_PREVALENCE) continue;

    let category: TrackerCategory | undefined;
    for (const cat of tracker.categories ?? []) {
      const mapped = DDG_CATEGORY_MAP[cat];
      if (mapped) {
        category = mapped;
        break;
      }
    }
    if (!category) continue;

    const name = tracker.owner?.displayName ?? tracker.domain;
    result.set(tracker.domain, { name, category });
  }

  return result;
}

// ── Tracker-list.ts patcher ───────────────────────────────────────────────────

const MARKER_START = "// ── AUTO-GENERATED: DO NOT EDIT BELOW THIS LINE";
const MARKER_END = "// ── END AUTO-GENERATED";

const CAT_ORDER: TrackerCategory[] = [
  "analytics",
  "advertising",
  "social",
  "fingerprinting",
  "pixel",
  "cdn",
];

/** Extract domain keys that already exist in the manual section of the file. */
function extractExistingKeys(manualSection: string): Set<string> {
  const keys = new Set<string>();
  // Matches tracker entry lines:  "domain.com": { name:
  const re = /^\s+"([^"]+)":\s*\{\s*name:/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(manualSection)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function renderAutoSection(entries: Map<string, TrackerEntry>, date: string): string {
  const lines: string[] = [
    `  ${MARKER_START} ──────────────────────────`,
    `  // Last updated: ${date}`,
    `  // Sources: Disconnect.me · DuckDuckGo Tracker Radar (prevalence ≥ ${MIN_PREVALENCE * 100}%)`,
    `  // New entries: ${entries.size} domains`,
  ];

  if (entries.size === 0) {
    lines.push(`  ${MARKER_END}`);
    return lines.join("\n");
  }

  lines.push("");

  const byCategory = new Map<TrackerCategory, Array<[string, TrackerEntry]>>();
  for (const [domain, entry] of entries) {
    const bucket = byCategory.get(entry.category) ?? [];
    bucket.push([domain, entry]);
    byCategory.set(entry.category, bucket);
  }

  const sorted = [...byCategory.entries()].sort(
    ([a], [b]) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b),
  );

  for (const [cat, domainEntries] of sorted) {
    domainEntries.sort(([a], [b]) => a.localeCompare(b));
    const pad = "─".repeat(Math.max(0, 45 - cat.length));
    lines.push(`  // ── ${cat} (auto) ${pad}`);
    for (const [domain, { name, category }] of domainEntries) {
      const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push(`  "${domain}": { name: "${escaped}", category: "${category}" },`);
    }
    lines.push("");
  }

  lines.push(`  ${MARKER_END}`);
  return lines.join("\n");
}

function patchFile(content: string, newEntries: Map<string, TrackerEntry>, date: string): string {
  const autoSection = renderAutoSection(newEntries, date);
  const startMarker = `  ${MARKER_START}`;
  const endMarker = `  ${MARKER_END}`;

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx >= 0 && endIdx >= 0) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx + endMarker.length);
    return before + autoSection + after;
  }

  // First run: insert before the closing `};` of TRACKER_DB
  const closingIdx = content.lastIndexOf("\n};");
  return content.slice(0, closingIdx) + "\n\n" + autoSection + "\n" + content.slice(closingIdx + 1);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const trackerListPath = resolve(__dirname, "../src/classifiers/tracker-list.ts");

  console.log("Fetching Disconnect.me…");
  const disconnectEntries = await fetchDisconnect();
  console.log(`  → ${disconnectEntries.size} domains`);

  console.log(`Fetching DuckDuckGo Tracker Radar (prevalence ≥ ${MIN_PREVALENCE * 100}%)…`);
  const ddgEntries = await fetchDDG();
  console.log(`  → ${ddgEntries.size} domains`);

  const content = readFileSync(trackerListPath, "utf-8");
  const startIdx = content.indexOf(`  ${MARKER_START}`);
  const manualSection = startIdx >= 0 ? content.slice(0, startIdx) : content;
  const existingKeys = extractExistingKeys(manualSection);
  console.log(`  → ${existingKeys.size} existing entries kept as-is`);

  // Merge: Disconnect first, DDG overrides (more precise display names)
  const merged = new Map<string, TrackerEntry>();
  for (const [domain, entry] of disconnectEntries) {
    if (!existingKeys.has(domain)) merged.set(domain, entry);
  }
  for (const [domain, entry] of ddgEntries) {
    if (!existingKeys.has(domain)) merged.set(domain, entry);
  }
  console.log(`  → ${merged.size} new entries to write`);

  const date = new Date().toISOString().slice(0, 10);
  const newContent = patchFile(content, merged, date);

  if (dryRun) {
    console.log("\n[dry-run] Result preview (last 60 lines):\n");
    console.log(newContent.split("\n").slice(-60).join("\n"));
  } else {
    writeFileSync(trackerListPath, newContent, "utf-8");
    console.log(`\nWrote ${trackerListPath}`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
