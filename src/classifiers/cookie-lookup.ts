import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface OcdEntry {
  description: string;
  platform: string;
  retentionPeriod: string;
  privacyLink: string;
}

interface RawOcdEntry {
  id: string;
  category: string;
  cookie: string;
  domain: string;
  description: string;
  retentionPeriod: string;
  dataController: string;
  privacyLink: string;
  wildcardMatch: string;
}

// Build indexes once at module load time
const exactIndex = new Map<string, OcdEntry>();
const wildcardEntries: Array<{ prefix: string; entry: OcdEntry }> = [];

function buildIndexes(): void {
  const dbPath = join(dirname(fileURLToPath(import.meta.url)), "../data/open-cookie-database.json");
  const raw = JSON.parse(readFileSync(dbPath, "utf-8")) as Record<string, RawOcdEntry[]>;

  for (const entries of Object.values(raw)) {
    for (const e of entries) {
      if (!e.cookie) continue;
      const ocdEntry: OcdEntry = {
        description: e.description,
        platform: e.dataController,
        retentionPeriod: e.retentionPeriod,
        privacyLink: e.privacyLink,
      };
      if (e.wildcardMatch === "1") {
        wildcardEntries.push({ prefix: e.cookie.toLowerCase(), entry: ocdEntry });
      } else {
        const key = e.cookie.toLowerCase();
        if (!exactIndex.has(key)) {
          exactIndex.set(key, ocdEntry);
        }
      }
    }
  }
}

buildIndexes();

export function lookupCookie(name: string): OcdEntry | null {
  const lower = name.toLowerCase();

  // 1. Exact match
  const exact = exactIndex.get(lower);
  if (exact) return exact;

  // 2. Wildcard prefix match (longest prefix wins)
  let best: OcdEntry | null = null;
  let bestLen = 0;
  for (const { prefix, entry } of wildcardEntries) {
    if (lower.startsWith(prefix) && prefix.length > bestLen) {
      best = entry;
      bestLen = prefix.length;
    }
  }
  return best;
}
