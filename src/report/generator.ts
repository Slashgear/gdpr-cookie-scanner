import { execFile } from "child_process";
import { writeFile, mkdir, readFile } from "fs/promises";
import { basename, dirname, extname, join } from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { Marked } from "marked";
import { generatePdf } from "./pdf.js";
import { generateHtmlReport } from "./html.js";

const execFileAsync = promisify(execFile);
const oxfmtBin = join(dirname(fileURLToPath(import.meta.url)), "../../node_modules/.bin/oxfmt");
import type {
  ScanResult,
  ScannedCookie,
  NetworkRequest,
  DarkPatternIssue,
  ConsentButton,
} from "../types.js";
import type { ScanOptions } from "../types.js";

export class ReportGenerator {
  constructor(private readonly options: ScanOptions) {}

  async generate(result: ScanResult): Promise<Record<string, string>> {
    await mkdir(this.options.outputDir, { recursive: true });

    const hostname = new URL(result.url).hostname.replace(/^www\./, "");
    const date = new Date(result.scanDate).toISOString().split("T")[0];
    const base = `gdpr-report-${hostname}-${date}`;
    const formats = this.options.formats;

    const paths: Record<string, string> = {};

    // ── Markdown ──────────────────────────────────────────────────
    if (formats.includes("md")) {
      const mdPath = join(this.options.outputDir, `${base}.md`);
      await writeFile(mdPath, this.buildMarkdown(result), "utf-8");
      await execFileAsync(oxfmtBin, [mdPath]).catch(() => {});
      paths.md = mdPath;

      const checklistPath = join(this.options.outputDir, `gdpr-checklist-${hostname}-${date}.md`);
      await writeFile(checklistPath, this.buildChecklist(result), "utf-8");
      await execFileAsync(oxfmtBin, [checklistPath]).catch(() => {});

      const cookiesPath = join(this.options.outputDir, `gdpr-cookies-${hostname}-${date}.md`);
      await writeFile(cookiesPath, this.buildCookiesInventory(result), "utf-8");
      await execFileAsync(oxfmtBin, [cookiesPath]).catch(() => {});
    }

    // ── HTML ──────────────────────────────────────────────────────
    if (formats.includes("html")) {
      const htmlPath = join(this.options.outputDir, `${base}.html`);
      await writeFile(htmlPath, generateHtmlReport(result), "utf-8");
      paths.html = htmlPath;
    }

    // ── JSON ──────────────────────────────────────────────────────
    if (formats.includes("json")) {
      const jsonPath = join(this.options.outputDir, `${base}.json`);
      await writeFile(jsonPath, JSON.stringify(result, null, 2), "utf-8");
      paths.json = jsonPath;
    }

    // ── PDF (via Markdown → HTML → Playwright) ────────────────────
    if (formats.includes("pdf")) {
      const markdown = paths.md
        ? await import("fs/promises").then((m) => m.readFile(paths.md!, "utf-8"))
        : this.buildMarkdown(result);
      const checklist = this.buildChecklist(result);
      const cookiesInventory = this.buildCookiesInventory(result);
      const combined = [markdown, checklist, cookiesInventory].join("\n\n---\n\n");
      const rawBody = await this.buildHtmlBody(combined);
      const body = await this.inlineImages(rawBody, this.options.outputDir);
      const html = this.wrapHtml(body, hostname);
      const pdfPath = join(this.options.outputDir, `${base}.pdf`);
      await generatePdf(html, pdfPath);
      paths.pdf = pdfPath;
    }

    return paths;
  }

  private async buildHtmlBody(markdown: string): Promise<string> {
    type TocEntry = { level: number; text: string; id: string };
    const entries: TocEntry[] = [];
    const idCounts = new Map<string, number>();

    const slugify = (text: string): string => {
      const base =
        text
          .replace(/[^\p{L}\p{N}\s-]/gu, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-") || "section";
      const count = idCounts.get(base) ?? 0;
      idCounts.set(base, count + 1);
      return count === 0 ? base : `${base}-${count}`;
    };

    const localMarked = new Marked();
    localMarked.use({
      renderer: {
        heading({ text, depth }: { text: string; depth: number }) {
          const id = slugify(text);
          if (depth <= 2) entries.push({ level: depth, text, id });
          return `<h${depth} id="${id}">${text}</h${depth}>\n`;
        },
      },
    });

    const body = await localMarked.parse(markdown);

    if (entries.length === 0) return body;

    const tocItems = entries
      .map(({ level, text, id }) => {
        const cls = level === 1 ? "toc-h1" : "toc-h2";
        return `<li class="${cls}"><a href="#${id}">${text}</a></li>`;
      })
      .join("\n");

    const toc = `<nav class="toc">
<p class="toc-title">Table of Contents</p>
<ul>
${tocItems}
</ul>
</nav>`;

    return toc + "\n" + body;
  }

  private async inlineImages(html: string, outputDir: string): Promise<string> {
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };

    const imgRegex = /<img([^>]*)\ssrc="([^"#][^"]*)"([^>]*)>/gi;
    const replacements: Array<{ original: string; replacement: string }> = [];

    for (const match of html.matchAll(imgRegex)) {
      const [full, before, src, after] = match;
      if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://"))
        continue;
      const mime = mimeTypes[extname(src).toLowerCase()];
      if (!mime) continue;
      try {
        const buf = await readFile(join(outputDir, src));
        replacements.push({
          original: full,
          replacement: `<img${before} src="data:${mime};base64,${buf.toString("base64")}"${after}>`,
        });
      } catch {
        // file not found — leave the tag as-is
      }
    }

    return replacements.reduce(
      (acc, { original, replacement }) => acc.replace(original, replacement),
      html,
    );
  }

  private wrapHtml(body: string, hostname: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GDPR Report — ${hostname}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           font-size: 11pt; line-height: 1.6; color: #1a1a1a; max-width: 900px;
           margin: 0 auto; padding: 0 8px; }
    h1 { font-size: 18pt; border-bottom: 2px solid #1a1a2e; padding-bottom: 6px;
         color: #1a1a2e; margin-top: 2em; }
    h2 { font-size: 14pt; color: #1a1a2e; margin-top: 1.5em; }
    h3 { font-size: 12pt; margin-top: 1.2em; }
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt;
            margin: 1em 0; page-break-inside: auto; }
    th { background: #f0f0f4; padding: 6px 10px; text-align: left;
         border-bottom: 2px solid #ccc; }
    td { padding: 5px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr { page-break-inside: avoid; }
    code { font-family: "SFMono-Regular", Consolas, monospace; background: #f4f4f4;
           padding: 1px 5px; border-radius: 3px; font-size: 9pt; }
    pre { background: #f4f4f4; padding: 12px; border-radius: 4px;
          overflow-x: auto; font-size: 9pt; }
    blockquote { border-left: 3px solid #ccc; margin: 0.5em 0;
                 padding: 0.5em 1em; color: #555; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0;
         page-break-after: always; }
    a { color: #0066cc; }
    img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
    nav.toc { background: #f4f5f8; border-left: 4px solid #1a1a2e; border-radius: 4px;
              padding: 14px 20px; margin: 0 0 2.5em 0; page-break-inside: avoid; }
    .toc-title { font-weight: 700; font-size: 11pt; margin: 0 0 10px 0; color: #1a1a2e; }
    nav.toc ul { list-style: none; margin: 0; padding: 0; }
    nav.toc li { margin: 3px 0; line-height: 1.4; }
    .toc-h1 { font-weight: 600; margin-top: 6px; }
    .toc-h2 { padding-left: 1.2em; font-size: 9.5pt; }
    nav.toc a { color: #0055aa; text-decoration: none; }
    @media print {
      h1 { page-break-before: always; }
      h1:first-child { page-break-before: avoid; }
    }
  </style>
</head>
<body>${body}</body>
</html>`;
  }

  private buildMarkdown(r: ScanResult): string {
    const hostname = new URL(r.url).hostname;
    const scanDate = new Date(r.scanDate).toLocaleString("en-GB");
    const durationSec = (r.duration / 1000).toFixed(1);
    const grade = r.compliance.grade;
    const score = r.compliance.total;

    const gradeEmoji = grade === "A" ? "🟢" : grade === "B" ? "🟡" : grade === "C" ? "🟠" : "🔴";

    const sections: string[] = [];

    // ── Header ────────────────────────────────────────────────────
    sections.push(`# GDPR Compliance Report — ${hostname}`);
    sections.push(`
> **Scan date:** ${scanDate}
> **Scanned URL:** ${r.url}
> **Scan duration:** ${durationSec}s
> **Tool:** gdpr-cookie-scanner v0.1.0
`);

    // ── Global score ──────────────────────────────────────────────
    sections.push(`## Global Compliance Score\n`);
    sections.push(`### ${gradeEmoji} ${score}/100 — Grade ${grade}\n`);
    sections.push(this.buildScoreTable(r));

    // ── Executive summary ─────────────────────────────────────────
    sections.push(`## Executive Summary\n`);
    sections.push(this.buildExecutiveSummary(r));

    // ── Consent modal ─────────────────────────────────────────────
    sections.push(`## 1. Consent Modal\n`);
    sections.push(this.buildModalSection(r));

    // ── Dark patterns ─────────────────────────────────────────────
    sections.push(`## 2. Dark Patterns and Detected Issues\n`);
    sections.push(this.buildIssuesSection(r.compliance.issues));

    // ── Cookies before interaction ────────────────────────────────
    sections.push(`## 3. Cookies Set Before Any Interaction\n`);
    sections.push(this.buildCookiesTable(r.cookiesBeforeInteraction, "before-interaction"));

    // ── Cookies after reject ──────────────────────────────────────
    sections.push(`## 4. Cookies After Consent Rejection\n`);
    sections.push(this.buildCookiesAfterRejectSection(r));

    // ── Cookies after accept ──────────────────────────────────────
    sections.push(`## 5. Cookies After Consent Acceptance\n`);
    sections.push(this.buildCookiesTable(r.cookiesAfterAccept, "after-accept"));

    // ── Network tracker requests ──────────────────────────────────
    sections.push(`## 6. Network Requests — Detected Trackers\n`);
    sections.push(this.buildNetworkSection(r));

    // ── Recommendations ───────────────────────────────────────────
    sections.push(`## 7. Recommendations\n`);
    sections.push(this.buildRecommendations(r));

    // ── Scan errors ───────────────────────────────────────────────
    if (r.errors.length > 0) {
      sections.push(`## Scan Errors and Warnings\n`);
      sections.push(r.errors.map((e) => `- ⚠️ ${e}`).join("\n"));
    }

    // ── Legal references ──────────────────────────────────────────
    sections.push(`## Legal References\n`);
    sections.push(`
- **RGPD Art. 7** — Conditions for consent
- **RGPD Recital 32** — Consent must result from an unambiguous positive action
- **ePrivacy Directive 2002/58/EC** — Consent requirement for non-essential cookies
- **CEPD Guidelines 05/2020** — Consent under the RGPD
- **CEPD Guidelines 03/2022** — Dark patterns on platforms
- **CNIL Recommendation 2022** — Rejection must be as easy as acceptance (same number of clicks)
`);

    return sections.join("\n\n") + "\n";
  }

  private buildScoreTable(r: ScanResult): string {
    const { breakdown } = r.compliance;
    const row = (label: string, score: number, max: number) => {
      const pct = Math.round((score / max) * 100);
      const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
      const status = pct >= 80 ? "✅" : pct >= 50 ? "⚠️" : "❌";
      return `| ${label} | ${score}/${max} | ${bar} | ${status} |`;
    };

    return `| Criterion | Score | Progress | Status |
|-----------|-------|----------|--------|
${row("Consent validity", breakdown.consentValidity, 25)}
${row("Easy refusal", breakdown.easyRefusal, 25)}
${row("Transparency", breakdown.transparency, 25)}
${row("Cookie behavior", breakdown.cookieBehavior, 25)}
| **TOTAL** | **${r.compliance.total}/100** | | **${r.compliance.grade}** |
`;
  }

  private buildExecutiveSummary(r: ScanResult): string {
    const criticalCount = r.compliance.issues.filter((i) => i.severity === "critical").length;
    const warningCount = r.compliance.issues.filter((i) => i.severity === "warning").length;
    const illegalPreCookies = r.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
    const persistAfterReject = r.cookiesAfterReject.filter((c) => c.requiresConsent);
    const preInteractionTrackers = r.networkBeforeInteraction.filter(
      (n) => n.trackerCategory !== null,
    );

    const lines: string[] = [];

    if (!r.modal.detected) {
      lines.push(
        "❌ **No consent modal detected.** The site sets cookies without requesting consent.",
      );
    } else {
      lines.push(`✅ Consent modal detected (\`${r.modal.selector}\`).`);
    }

    if (illegalPreCookies.length > 0) {
      lines.push(
        `❌ **${illegalPreCookies.length} non-essential cookie(s)** set before any interaction (RGPD violation).`,
      );
    } else {
      lines.push("✅ No non-essential cookie set before interaction.");
    }

    if (persistAfterReject.length > 0) {
      lines.push(
        `❌ **${persistAfterReject.length} non-essential cookie(s)** persisting after rejection (RGPD violation).`,
      );
    } else {
      lines.push("✅ Non-essential cookies are correctly removed after rejection.");
    }

    if (preInteractionTrackers.length > 0) {
      lines.push(
        `❌ **${preInteractionTrackers.length} tracker request(s)** fired before consent.`,
      );
    } else {
      lines.push("✅ No tracker requests before consent.");
    }

    lines.push(
      `\n**${criticalCount} critical issue(s)** and **${warningCount} warning(s)** identified.`,
    );

    return lines.join("\n");
  }

  private buildModalSection(r: ScanResult): string {
    if (!r.modal.detected) {
      return "_No consent modal detected on the page._\n";
    }

    const { modal } = r;
    const acceptBtn = modal.buttons.find((b) => b.type === "accept");
    const rejectBtn = modal.buttons.find((b) => b.type === "reject");
    const _prefBtn = modal.buttons.find((b) => b.type === "preferences");

    const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);

    const lines: string[] = [
      `**CSS selector:** \`${modal.selector}\``,
      `**Granular controls:** ${modal.hasGranularControls ? "✅ Yes" : "❌ No"}`,
      `**Layer count:** ${modal.layerCount}`,
      modal.privacyPolicyUrl
        ? `**Privacy policy link:** ✅ [${modal.privacyPolicyUrl}](${modal.privacyPolicyUrl})`
        : `**Privacy policy link:** ⚠️ Not found in the modal`,
      "",
      "### Detected buttons",
      "",
      "| Button | Text | Visible | Font size | Contrast ratio |",
      "|--------|------|---------|-----------|----------------|",
      ...modal.buttons.map((b) => this.buildButtonRow(b)),
      "",
    ];

    if (acceptBtn && rejectBtn) {
      lines.push("### Comparative analysis: Accept / Reject\n");
      if (
        acceptBtn.fontSize &&
        rejectBtn.fontSize &&
        acceptBtn.fontSize > rejectBtn.fontSize * 1.2
      ) {
        lines.push(
          `⚠️ The **Accept** button (${acceptBtn.fontSize}px) is larger than the **Reject** button (${rejectBtn.fontSize}px).`,
        );
      } else {
        lines.push("✅ Accept / Reject button sizes are comparable.");
      }

      const acceptArea = acceptBtn.boundingBox
        ? acceptBtn.boundingBox.width * acceptBtn.boundingBox.height
        : 0;
      const rejectArea = rejectBtn.boundingBox
        ? rejectBtn.boundingBox.width * rejectBtn.boundingBox.height
        : 0;
      if (acceptArea > rejectArea * 2) {
        lines.push(
          `⚠️ **Accept** button area (${Math.round(acceptArea)}px²) is significantly larger than **Reject** (${Math.round(rejectArea)}px²).`,
        );
      }
    }

    if (preTicked.length > 0) {
      lines.push("\n### Pre-ticked checkboxes (RGPD violation)\n");
      lines.push("| Name | Label |");
      lines.push("|------|-------|");
      for (const cb of preTicked) {
        lines.push(`| \`${cb.name}\` | ${cb.label} |`);
      }
    }

    if (modal.screenshotPath) {
      lines.push(`\n### Screenshot\n`);
      lines.push(`![Consent modal](${basename(modal.screenshotPath)})`);
    }

    lines.push("\n### Modal text excerpt\n");
    lines.push(`> ${modal.text.substring(0, 500)}${modal.text.length > 500 ? "..." : ""}`);

    return lines.join("\n");
  }

  private buildButtonRow(b: ConsentButton): string {
    const visible = b.isVisible ? "✅" : "❌";
    const fontSize = b.fontSize ? `${b.fontSize}px` : "—";
    const contrast = b.contrastRatio !== null ? `${b.contrastRatio}:1` : "—";
    const typeLabel = {
      accept: "🟢 Accept",
      reject: "🔴 Reject",
      preferences: "⚙️ Preferences",
      close: "✕ Close",
      unknown: "❓ Unknown",
    }[b.type];
    return `| ${typeLabel} | ${b.text.substring(0, 30)} | ${visible} | ${fontSize} | ${contrast} |`;
  }

  private buildIssuesSection(issues: DarkPatternIssue[]): string {
    if (issues.length === 0) {
      return "✅ No dark pattern or compliance issue detected.\n";
    }

    const critical = issues.filter((i) => i.severity === "critical");
    const warnings = issues.filter((i) => i.severity === "warning");
    const infos = issues.filter((i) => i.severity === "info");

    const lines: string[] = [];

    if (critical.length > 0) {
      lines.push("### ❌ Critical issues\n");
      for (const issue of critical) {
        lines.push(`**${issue.description}**`);
        lines.push(`> ${issue.evidence}\n`);
      }
    }

    if (warnings.length > 0) {
      lines.push("### ⚠️ Warnings\n");
      for (const issue of warnings) {
        lines.push(`**${issue.description}**`);
        lines.push(`> ${issue.evidence}\n`);
      }
    }

    if (infos.length > 0) {
      lines.push("### ℹ️ Information\n");
      for (const issue of infos) {
        lines.push(`- ${issue.description}`);
      }
    }

    return lines.join("\n");
  }

  private buildCookiesTable(cookies: ScannedCookie[], phase: ScannedCookie["capturedAt"]): string {
    const filtered = cookies.filter((c) => c.capturedAt === phase);

    if (filtered.length === 0) {
      return "_No cookies detected._\n";
    }

    const consent = (c: ScannedCookie) => (c.requiresConsent ? "⚠️ Yes" : "✅ No");

    const expires = (c: ScannedCookie) => {
      if (c.expires === null) return "Session";
      const days = Math.round((c.expires * 1000 - Date.now()) / 86400000);
      if (days < 0) return "Expired";
      if (days === 0) return "< 1 day";
      if (days < 30) return `${days} days`;
      return `${Math.round(days / 30)} months`;
    };

    const rows = filtered.map(
      (c) => `| \`${c.name}\` | ${c.domain} | ${c.category} | ${expires(c)} | ${consent(c)} |`,
    );

    return `| Name | Domain | Category | Expiry | Consent required |
|------|--------|----------|--------|------------------|
${rows.join("\n")}
`;
  }

  private buildCookiesAfterRejectSection(r: ScanResult): string {
    const afterReject = r.cookiesAfterReject.filter((c) => c.capturedAt === "after-reject");
    const violating = afterReject.filter((c) => c.requiresConsent);

    const lines: string[] = [];

    if (violating.length > 0) {
      lines.push(`❌ **${violating.length} non-essential cookie(s)** detected after rejection:\n`);
    } else {
      lines.push("✅ No non-essential cookie detected after rejection.\n");
    }

    lines.push(this.buildCookiesTable(r.cookiesAfterReject, "after-reject"));

    return lines.join("\n");
  }

  private buildNetworkSection(r: ScanResult): string {
    const allRequests = [
      ...r.networkBeforeInteraction,
      ...r.networkAfterAccept,
      ...r.networkAfterReject,
    ].filter((req) => req.trackerCategory !== null);

    if (allRequests.length === 0) {
      return "_No known network tracker detected._\n";
    }

    const phases: Array<{ label: string; requests: NetworkRequest[] }> = [
      {
        label: "Before interaction",
        requests: r.networkBeforeInteraction.filter((r) => r.trackerCategory !== null),
      },
      {
        label: "After acceptance",
        requests: r.networkAfterAccept.filter((r) => r.trackerCategory !== null),
      },
      {
        label: "After rejection",
        requests: r.networkAfterReject.filter((r) => r.trackerCategory !== null),
      },
    ];

    const lines: string[] = [];

    for (const { label, requests } of phases) {
      if (requests.length === 0) continue;
      lines.push(`### ${label} (${requests.length} tracker(s))\n`);
      lines.push("| Tracker | Category | URL | Type |");
      lines.push("|---------|-----------|-----|------|");
      for (const req of requests.slice(0, 20)) {
        const url = req.url.length > 60 ? req.url.substring(0, 57) + "..." : req.url;
        lines.push(
          `| ${req.trackerName ?? "Unknown"} | ${req.trackerCategory} | \`${url}\` | ${req.resourceType} |`,
        );
      }
      if (requests.length > 20) {
        lines.push(`\n_... and ${requests.length - 20} additional request(s)._`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  private buildRecommendations(r: ScanResult): string {
    const recs: string[] = [];
    const issues = r.compliance.issues;

    if (!r.modal.detected) {
      recs.push(
        "1. **Deploy a CMP solution** (e.g. Axeptio, Didomi, OneTrust, Cookiebot) that displays a consent modal before any non-essential cookie.",
      );
    }

    if (issues.some((i) => i.type === "pre-ticked")) {
      recs.push(
        "1. **Remove pre-ticked checkboxes.** Consent must result from an explicit positive action (RGPD Recital 32).",
      );
    }

    if (issues.some((i) => i.type === "no-reject-button" || i.type === "buried-reject")) {
      recs.push(
        '1. **Add a "Reject all" button** at the first layer of the modal, requiring no more clicks than "Accept all" (CNIL 2022).',
      );
    }

    if (issues.some((i) => i.type === "click-asymmetry")) {
      recs.push(
        "1. **Balance the number of clicks** to accept and reject. Rejection must not require more steps than acceptance.",
      );
    }

    if (issues.some((i) => i.type === "asymmetric-prominence" || i.type === "nudging")) {
      recs.push(
        "1. **Equalise the styling** of the Accept / Reject buttons: same size, same colour, same level of visibility.",
      );
    }

    if (issues.some((i) => i.type === "auto-consent")) {
      recs.push(
        "1. **Do not set any non-essential cookie before consent.** Gate the initialisation of third-party scripts on acceptance.",
      );
    }

    if (issues.some((i) => i.type === "missing-info")) {
      recs.push(
        "1. **Complete the modal information**: purposes, identity of sub-processors, retention period, right to withdraw.",
      );
    }

    if (r.cookiesAfterReject.filter((c) => c.requiresConsent).length > 0) {
      recs.push(
        "1. **Remove or block non-essential cookies** after rejection, and verify consent handling server-side.",
      );
    }

    if (recs.length === 0) {
      recs.push("✅ No critical recommendation. Conduct regular audits to maintain compliance.");
    }

    return recs.join("\n\n");
  }

  private buildCookiesInventory(r: ScanResult): string {
    const hostname = new URL(r.url).hostname;
    const scanDate = new Date(r.scanDate).toLocaleString("en-GB");

    // Collect all cookies across all phases, keyed by name+domain
    type CookieEntry = {
      name: string;
      domain: string;
      category: string;
      phases: Set<string>;
      expires: number | null;
      httpOnly: boolean;
      secure: boolean;
      requiresConsent: boolean;
    };

    const cookieMap = new Map<string, CookieEntry>();

    const phaseLabel: Record<ScannedCookie["capturedAt"], string> = {
      "before-interaction": "before consent",
      "after-accept": "after acceptance",
      "after-reject": "after rejection",
    };

    const allCookies = [
      ...r.cookiesBeforeInteraction,
      ...r.cookiesAfterAccept,
      ...r.cookiesAfterReject,
    ];

    for (const c of allCookies) {
      const key = `${c.name}||${c.domain}`;
      if (!cookieMap.has(key)) {
        cookieMap.set(key, {
          name: c.name,
          domain: c.domain,
          category: c.category,
          phases: new Set(),
          expires: c.expires,
          httpOnly: c.httpOnly,
          secure: c.secure,
          requiresConsent: c.requiresConsent,
        });
      }
      cookieMap.get(key)!.phases.add(phaseLabel[c.capturedAt]);
    }

    const expires = (entry: CookieEntry): string => {
      if (entry.expires === null) return "Session";
      const days = Math.round((entry.expires * 1000 - Date.now()) / 86400000);
      if (days < 0) return "Expired";
      if (days === 0) return "< 1 day";
      if (days < 30) return `${days} days`;
      return `${Math.round(days / 30)} months`;
    };

    const categoryLabel: Record<string, string> = {
      "strictly-necessary": "Strictly necessary",
      analytics: "Analytics",
      advertising: "Advertising",
      social: "Social",
      personalization: "Personalization",
      unknown: "Unknown",
    };

    const entries = [...cookieMap.values()].sort((a, b) => {
      // Sort: strictly-necessary first, then by category, then by name
      const order = [
        "strictly-necessary",
        "analytics",
        "advertising",
        "social",
        "personalization",
        "unknown",
      ];
      const oa = order.indexOf(a.category);
      const ob = order.indexOf(b.category);
      if (oa !== ob) return oa - ob;
      return a.name.localeCompare(b.name);
    });

    const lines: string[] = [];

    lines.push(`# Cookie Inventory — ${hostname}`);
    lines.push(`
> **Scan date:** ${scanDate}
> **Scanned URL:** ${r.url}
> **Unique cookies detected:** ${entries.length}
`);

    lines.push(`## Instructions`);
    lines.push(`
This table lists all cookies detected during the scan, across all phases.
The **Description / Purpose** column is to be filled in by the DPO or technical owner.

- **Before consent** — cookie present from page load, before any interaction
- **After acceptance** — cookie set or persisting after clicking "Accept all"
- **After rejection** — cookie present after clicking "Reject all"
`);

    lines.push(`## Cookie table\n`);
    lines.push(
      `| Cookie | Domain | Category | Phases | Expiry | Consent required | Description / Purpose |`,
    );
    lines.push(
      `|--------|--------|----------|--------|--------|------------------|-----------------------|`,
    );

    for (const entry of entries) {
      const phases = [...entry.phases].join(", ");
      const consent = entry.requiresConsent ? "⚠️ Yes" : "✅ No";
      const cat = categoryLabel[entry.category] ?? entry.category;
      lines.push(
        `| \`${entry.name}\` | ${entry.domain} | ${cat} | ${phases} | ${expires(entry)} | ${consent} | <!-- fill in --> |`,
      );
    }

    lines.push(`\n---`);
    lines.push(
      `\n_Automatically generated by gdpr-cookie-scanner. Categories marked "Unknown" could not be identified automatically and should be verified manually._\n`,
    );

    return lines.join("\n") + "\n";
  }

  private buildChecklist(r: ScanResult): string {
    const hostname = new URL(r.url).hostname;
    const scanDate = new Date(r.scanDate).toLocaleString("en-GB");
    const issues = r.compliance.issues;
    const hasIssue = (type: string) => issues.some((i) => i.type === type);
    const getIssue = (type: string) => issues.find((i) => i.type === type);

    const ok = "✅ Compliant";
    const ko = "❌ Non-compliant";
    const warn = "⚠️ Warning";

    type Row = {
      category: string;
      rule: string;
      reference: string;
      status: string;
      detail: string;
    };

    const rows: Row[] = [];

    // ── A. Consent presence and validity ─────────────────────────
    rows.push({
      category: "Consent",
      rule: "Consent modal detected",
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058)",
      status: r.modal.detected ? ok : ko,
      detail: r.modal.detected
        ? `Detected (\`${r.modal.selector}\`)`
        : "No consent banner detected",
    });

    const preTicked = r.modal.checkboxes.filter((c) => c.isCheckedByDefault);
    rows.push({
      category: "Consent",
      rule: "No pre-ticked checkboxes",
      reference: "[GDPR Recital 32](https://gdpr-info.eu/recitals/no-32/)",
      status: preTicked.length === 0 ? ok : ko,
      detail:
        preTicked.length === 0
          ? "No pre-ticked checkbox detected"
          : `${preTicked.length} pre-ticked box(es): ${preTicked.map((c) => c.label || c.name).join(", ")}`,
    });

    const misleadingAccept = getIssue("misleading-wording");
    const acceptBtn = r.modal.buttons.find((b) => b.type === "accept");
    rows.push({
      category: "Consent",
      rule: "Accept button label is unambiguous",
      reference: "[GDPR Art. 4(11)](https://gdpr-info.eu/art-4-gdpr/)",
      status:
        !r.modal.detected || !misleadingAccept
          ? ok
          : misleadingAccept.severity === "critical"
            ? ko
            : warn,
      detail: !r.modal.detected
        ? "Modal not detected"
        : acceptBtn
          ? misleadingAccept
            ? `Ambiguous label: "${acceptBtn.text}"`
            : `Clear label: "${acceptBtn.text}"`
          : "No Accept button detected",
    });

    // ── B. Easy refusal ───────────────────────────────────────────
    const rejectBtn = r.modal.buttons.find((b) => b.type === "reject");
    const noReject = hasIssue("no-reject-button") || hasIssue("buried-reject");
    rows.push({
      category: "Easy refusal",
      rule: "Reject button present at first layer",
      reference:
        "[CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)",
      status: !r.modal.detected ? ko : noReject ? ko : ok,
      detail: !r.modal.detected
        ? "Modal not detected"
        : rejectBtn
          ? `Detected: "${rejectBtn.text}"`
          : "No Reject button at first layer",
    });

    const clickIssue = getIssue("click-asymmetry");
    rows.push({
      category: "Easy refusal",
      rule: "Rejecting requires no more clicks than accepting",
      reference:
        "[CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)",
      status: !r.modal.detected ? ko : clickIssue ? ko : ok,
      detail: !r.modal.detected
        ? "Modal not detected"
        : clickIssue
          ? clickIssue.evidence
          : acceptBtn && rejectBtn
            ? `Accept: ${acceptBtn.clickDepth} click(s) · Reject: ${rejectBtn.clickDepth} click(s)`
            : "Cannot verify (missing buttons)",
    });

    const sizeIssue = getIssue("asymmetric-prominence");
    rows.push({
      category: "Easy refusal",
      rule: "Size symmetry between Accept and Reject",
      reference:
        "[EDPB Guidelines 03/2022](https://www.edpb.europa.eu/system/files/2022-03/edpb_03-2022_guidelines_on_dark_patterns_in_social_media_platform_interfaces_en.pdf)",
      status: !r.modal.detected ? ko : sizeIssue ? warn : ok,
      detail: !r.modal.detected
        ? "Modal not detected"
        : sizeIssue
          ? sizeIssue.evidence
          : "Button sizes are comparable",
    });

    const nudgeIssue = getIssue("nudging");
    rows.push({
      category: "Easy refusal",
      rule: "Font symmetry between Accept and Reject",
      reference:
        "[EDPB Guidelines 03/2022](https://www.edpb.europa.eu/system/files/2022-03/edpb_03-2022_guidelines_on_dark_patterns_in_social_media_platform_interfaces_en.pdf)",
      status: !r.modal.detected ? ko : nudgeIssue ? warn : ok,
      detail: !r.modal.detected
        ? "Modal not detected"
        : nudgeIssue
          ? nudgeIssue.evidence
          : "Font sizes are comparable",
    });

    // ── C. Transparency ───────────────────────────────────────────
    rows.push({
      category: "Transparency",
      rule: "Granular controls available",
      reference:
        "[EDPB Guidelines 05/2020](https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en)",
      status: !r.modal.detected ? ko : r.modal.hasGranularControls ? ok : warn,
      detail: !r.modal.detected
        ? "Modal not detected"
        : r.modal.hasGranularControls
          ? `${r.modal.checkboxes.length} checkbox(es) or preferences panel detected`
          : "No granular controls (checkboxes or panel) detected",
    });

    const infoChecks: Array<{ key: string; label: string; ref: string }> = [
      {
        key: "purposes",
        label: "Processing purposes mentioned",
        ref: "[GDPR Art. 13-14](https://gdpr-info.eu/art-13-gdpr/)",
      },
      {
        key: "third-parties",
        label: "Sub-processors / third parties mentioned",
        ref: "[GDPR Art. 13-14](https://gdpr-info.eu/art-13-gdpr/)",
      },
      {
        key: "duration",
        label: "Retention period mentioned",
        ref: "[GDPR Art. 13(2)(a)](https://gdpr-info.eu/art-13-gdpr/)",
      },
      {
        key: "withdrawal",
        label: "Right to withdraw consent mentioned",
        ref: "[GDPR Art. 7(3)](https://gdpr-info.eu/art-7-gdpr/)",
      },
    ];

    for (const { key, label, ref } of infoChecks) {
      const missing = issues.find(
        (i) => i.type === "missing-info" && i.description.includes(`"${key}"`),
      );
      rows.push({
        category: "Transparency",
        rule: label,
        reference: ref,
        status: !r.modal.detected ? ko : missing ? warn : ok,
        detail: !r.modal.detected
          ? "Modal not detected"
          : missing
            ? `Information absent from the modal text`
            : "Mention found in the modal text",
      });
    }

    rows.push({
      category: "Transparency",
      rule: "Privacy policy link present in the consent modal",
      reference: "[GDPR Art. 13](https://gdpr-info.eu/art-13-gdpr/)",
      status: !r.modal.detected ? ko : r.modal.privacyPolicyUrl ? ok : warn,
      detail: !r.modal.detected
        ? "Modal not detected"
        : r.modal.privacyPolicyUrl
          ? `Link found: ${r.modal.privacyPolicyUrl}`
          : "No privacy policy link found inside the consent modal",
    });

    rows.push({
      category: "Transparency",
      rule: "Privacy policy accessible from the main page",
      reference: "[GDPR Art. 13](https://gdpr-info.eu/art-13-gdpr/)",
      status: r.privacyPolicyUrl ? ok : warn,
      detail: r.privacyPolicyUrl
        ? `Link found: ${r.privacyPolicyUrl}`
        : "No privacy policy link found on the main page",
    });

    // ── D. Cookie behavior ────────────────────────────────────────
    const illegalPre = r.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
    rows.push({
      category: "Cookie behavior",
      rule: "No non-essential cookie before consent",
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058)",
      status: illegalPre.length === 0 ? ok : ko,
      detail:
        illegalPre.length === 0
          ? "No non-essential cookie set before interaction"
          : `${illegalPre.length} illegal cookie(s): ${illegalPre.map((c) => `\`${c.name}\` (${c.category})`).join(", ")}`,
    });

    const persistAfterReject = r.cookiesAfterReject.filter(
      (c) => c.requiresConsent && c.capturedAt === "after-reject",
    );
    rows.push({
      category: "Cookie behavior",
      rule: "Non-essential cookies removed after rejection",
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)",
      status: persistAfterReject.length === 0 ? ok : ko,
      detail:
        persistAfterReject.length === 0
          ? "No non-essential cookie persisting after rejection"
          : `${persistAfterReject.length} cookie(s) persisting: ${persistAfterReject.map((c) => `\`${c.name}\``).join(", ")}`,
    });

    const preTrackers = r.networkBeforeInteraction.filter(
      (req) => req.trackerCategory !== null && req.trackerCategory !== "cdn",
    );
    rows.push({
      category: "Cookie behavior",
      rule: "No network tracker before consent",
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058)",
      status: preTrackers.length === 0 ? ok : ko,
      detail:
        preTrackers.length === 0
          ? "No tracker request fired before interaction"
          : `${preTrackers.length} tracker(s): ${[...new Set(preTrackers.map((r) => r.trackerName ?? r.url))].slice(0, 3).join(", ")}`,
    });

    // ── Totals ────────────────────────────────────────────────────
    const conformeCount = rows.filter((r) => r.status === ok).length;
    const nonConformeCount = rows.filter((r) => r.status === ko).length;
    const avertissementCount = rows.filter((r) => r.status === warn).length;

    const lines: string[] = [];
    lines.push(`# GDPR Compliance Checklist — ${hostname}`);
    lines.push(`
> **Scan date:** ${scanDate}
> **Scanned URL:** ${r.url}
> **Global score:** ${r.compliance.total}/100 — Grade **${r.compliance.grade}**
`);
    lines.push(
      `**${conformeCount} rule(s) compliant** · **${nonConformeCount} non-compliant** · **${avertissementCount} warning(s)**\n`,
    );

    const categories = [...new Set(rows.map((r) => r.category))];
    for (const category of categories) {
      lines.push(`## ${category}\n`);
      lines.push("| Rule | Reference | Status | Detail |");
      lines.push("|------|-----------|--------|--------|");
      for (const row of rows.filter((r) => r.category === category)) {
        lines.push(`| ${row.rule} | ${row.reference} | ${row.status} | ${row.detail} |`);
      }
      lines.push("");
    }

    return lines.join("\n") + "\n";
  }
}
