/**
 * Reads docs/reports/<host>/ directories, extracts grade/score/date from
 * each HTML report, and regenerates the "Live Reports" cards in docs/index.html.
 *
 * Usage:  node scripts/build-showcase.mjs
 * Or:     pnpm build:showcase
 */

import { readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { existsSync } from "fs";

const DOCS_DIR = resolve("docs");
const REPORTS_DIR = join(DOCS_DIR, "reports");
const INDEX_HTML = join(DOCS_DIR, "index.html");

const START_MARKER = "<!-- ── REPORTS_START ── -->";
const END_MARKER = "<!-- ── REPORTS_END ── -->";

async function extractMeta(hostDir) {
  const files = await readdir(join(REPORTS_DIR, hostDir));
  const htmlFile = files.find((f) => f.endsWith(".html"));
  if (!htmlFile) return null;

  const content = await readFile(join(REPORTS_DIR, hostDir, htmlFile), "utf8");

  // oxfmt may split closing tags across lines — match opening tag content only
  const grade = content.match(/"grade-badge"[^>]*>([A-F])<\/div>/)?.[1] ?? "?";
  const score = content.match(/"score-num"[^>]*>(\d+)/)?.[1] ?? "?";

  // Date from filename: gdpr-report-<host>-YYYY-MM-DD.html
  const dateRaw = htmlFile.match(/(\d{4}-\d{2}-\d{2})\.html$/)?.[1];
  const dateStr = dateRaw
    ? new Date(dateRaw).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const displayHost = hostDir.replace(/^www\./, "");

  // Inject modal screenshot if PNG exists alongside the HTML but isn't referenced yet
  const pngPath = join(REPORTS_DIR, hostDir, "modal-initial.png");
  const htmlPath = join(REPORTS_DIR, hostDir, htmlFile);
  if (existsSync(pngPath) && !content.includes("modal-initial.png")) {
    const IMG = `<img src="modal-initial.png" alt="Consent modal screenshot" class="modal-screenshot" />`;
    // Insert right after the section-body div that follows <h2>Consent modal</h2>
    const patched = content.replace(
      /(<h2>Consent modal<\/h2>[\s\S]*?<div class="section-body">)/,
      `$1\n          ${IMG}`,
    );
    if (patched !== content) {
      await writeFile(htmlPath, patched, "utf8");
    }
  }

  return { grade, score: parseInt(score, 10) || 0, dateStr, displayHost, hostDir, htmlFile };
}

function buildCard({ grade, score, dateStr, displayHost, hostDir, htmlFile }) {
  return `          <!-- ${displayHost} — ${score}/100 ${grade} -->
          <div class="report-card">
            <div class="report-header">
              <div class="grade-badge grade-${grade}">${grade}</div>
              <div class="report-meta">
                <h3>${displayHost}</h3>
                <span class="score">${score} / 100</span>
              </div>
            </div>
            <p class="report-date">Scanned ${dateStr}</p>
            <a class="btn btn-outline" href="reports/${hostDir}/${htmlFile}">
              View report →
            </a>
          </div>`;
}

async function main() {
  const hosts = (await readdir(REPORTS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const reports = (await Promise.all(hosts.map(extractMeta))).filter(Boolean);

  // Sort by score descending (best first)
  reports.sort((a, b) => b.score - a.score);

  const cards = reports.map(buildCard).join("\n\n");

  let index = await readFile(INDEX_HTML, "utf8");
  const startIdx = index.indexOf(START_MARKER);
  const endIdx = index.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found in ${INDEX_HTML}. Add:\n  ${START_MARKER}\n  ${END_MARKER}`);
  }

  const newIndex =
    index.slice(0, startIdx + START_MARKER.length) +
    "\n" +
    cards +
    "\n          " +
    index.slice(endIdx);

  await writeFile(INDEX_HTML, newIndex, "utf8");
  console.log(`✓ ${INDEX_HTML} updated with ${reports.length} report cards`);
  reports.forEach((r) => console.log(`  ${r.grade} ${r.score}/100  ${r.displayHost}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
