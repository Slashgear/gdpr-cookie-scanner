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
import { resolveLocale, t as i18nT, type TranslationKey } from "../i18n/index.js";

export class ReportGenerator {
  constructor(private readonly options: ScanOptions) {}

  private t(key: TranslationKey, vars?: Record<string, string | number>): string {
    return i18nT(resolveLocale(this.options.locale), key, vars);
  }

  async generate(result: ScanResult): Promise<Record<string, string>> {
    const outputDir = this.options.outputDir;
    if (!outputDir) {
      throw new Error("ReportGenerator: outputDir is required to generate reports");
    }

    await mkdir(outputDir, { recursive: true });

    const hostname = new URL(result.url).hostname.replace(/^www\./, "");
    const date = new Date(result.scanDate).toISOString().split("T")[0];
    const base = `gdpr-report-${hostname}-${date}`;
    const formats = this.options.formats;

    const paths: Record<string, string> = {};

    // ── Markdown ──────────────────────────────────────────────────
    if (formats.includes("md")) {
      const mdPath = join(outputDir, `${base}.md`);
      await writeFile(mdPath, this.buildMarkdown(result), "utf-8");
      await execFileAsync(oxfmtBin, [mdPath]).catch(() => {});
      paths.md = mdPath;

      const checklistPath = join(outputDir, `gdpr-checklist-${hostname}-${date}.md`);
      await writeFile(checklistPath, this.buildChecklist(result), "utf-8");
      await execFileAsync(oxfmtBin, [checklistPath]).catch(() => {});

      const cookiesPath = join(outputDir, `gdpr-cookies-${hostname}-${date}.md`);
      await writeFile(cookiesPath, this.buildCookiesInventory(result), "utf-8");
      await execFileAsync(oxfmtBin, [cookiesPath]).catch(() => {});
    }

    // ── HTML ──────────────────────────────────────────────────────
    if (formats.includes("html")) {
      const htmlPath = join(outputDir, `${base}.html`);
      await writeFile(
        htmlPath,
        generateHtmlReport(result, resolveLocale(this.options.locale), this.options.locale),
        "utf-8",
      );
      paths.html = htmlPath;
    }

    // ── JSON ──────────────────────────────────────────────────────
    if (formats.includes("json")) {
      const jsonPath = join(outputDir, `${base}.json`);
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
      const body = await this.inlineImages(rawBody, outputDir);
      const html = this.wrapHtml(body, hostname);
      const pdfPath = join(outputDir, `${base}.pdf`);
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
<p class="toc-title">${this.t("HTML_TOC_TITLE")}</p>
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
    const lang = resolveLocale(this.options.locale);
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${this.t("REPORT_TITLE")} — ${hostname}</title>
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
    const scanDate = new Date(r.scanDate).toLocaleString(this.options.locale);
    const durationSec = (r.duration / 1000).toFixed(1);
    const grade = r.compliance.grade;
    const score = r.compliance.total;

    const gradeEmoji = grade === "A" ? "🟢" : grade === "B" ? "🟡" : grade === "C" ? "🟠" : "🔴";

    const sections: string[] = [];

    // ── Header ────────────────────────────────────────────────────
    sections.push(`# ${this.t("REPORT_TITLE")} — ${hostname}`);
    sections.push(`
> **${this.t("REPORT_SCAN_DATE")}:** ${scanDate}
> **${this.t("REPORT_SCANNED_URL")}:** ${r.url}
> **${this.t("REPORT_SCAN_DURATION")}:** ${durationSec}s
> **${this.t("REPORT_TOOL")}:** gdpr-cookie-scanner v0.1.0
`);

    // ── Global score ──────────────────────────────────────────────
    sections.push(`## ${this.t("SCORE_GLOBAL_LABEL")}\n`);
    sections.push(`### ${gradeEmoji} ${score}/100 — ${this.t("SCORE_GRADE")} ${grade}\n`);
    sections.push(this.buildScoreTable(r));

    // ── Executive summary ─────────────────────────────────────────
    sections.push(`## ${this.t("SECTION_EXEC_SUMMARY")}\n`);
    sections.push(this.buildExecutiveSummary(r));

    // ── Consent modal ─────────────────────────────────────────────
    sections.push(`## ${this.t("SECTION_CONSENT_MODAL")}\n`);
    sections.push(this.buildModalSection(r));

    // ── Dark patterns ─────────────────────────────────────────────
    sections.push(`## ${this.t("SECTION_DARK_PATTERNS")}\n`);
    sections.push(this.buildIssuesSection(r.compliance.issues));

    // ── Cookies before interaction ────────────────────────────────
    sections.push(`## ${this.t("SECTION_COOKIES_BEFORE")}\n`);
    sections.push(this.buildCookiesTable(r.cookiesBeforeInteraction, "before-interaction"));

    // ── Cookies after reject ──────────────────────────────────────
    sections.push(`## ${this.t("SECTION_COOKIES_AFTER_REJECT")}\n`);
    sections.push(this.buildCookiesAfterRejectSection(r));

    // ── Cookies after accept ──────────────────────────────────────
    sections.push(`## ${this.t("SECTION_COOKIES_AFTER_ACCEPT")}\n`);
    sections.push(this.buildCookiesTable(r.cookiesAfterAccept, "after-accept"));

    // ── Network tracker requests ──────────────────────────────────
    sections.push(`## ${this.t("SECTION_NETWORK")}\n`);
    sections.push(this.buildNetworkSection(r));

    // ── Recommendations ───────────────────────────────────────────
    sections.push(`## ${this.t("SECTION_RECOMMENDATIONS")}\n`);
    sections.push(this.buildRecommendations(r));

    // ── Scan errors ───────────────────────────────────────────────
    if (r.errors.length > 0) {
      sections.push(`## ${this.t("SECTION_ERRORS")}\n`);
      sections.push(r.errors.map((e) => `- ⚠️ ${e}`).join("\n"));
    }

    // ── Legal references ──────────────────────────────────────────
    sections.push(`## ${this.t("SECTION_LEGAL")}\n`);
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

    return `| ${this.t("SCORE_CRITERION")} | ${this.t("SCORE_SCORE")} | ${this.t("SCORE_PROGRESS")} | ${this.t("SCORE_STATUS")} |
|-----------|-------|----------|--------|
${row(this.t("SCORE_CONSENT_VALIDITY"), breakdown.consentValidity, 25)}
${row(this.t("SCORE_EASY_REFUSAL"), breakdown.easyRefusal, 25)}
${row(this.t("SCORE_TRANSPARENCY"), breakdown.transparency, 25)}
${row(this.t("SCORE_COOKIE_BEHAVIOR"), breakdown.cookieBehavior, 25)}
| **${this.t("SCORE_TOTAL")}** | **${r.compliance.total}/100** | | **${r.compliance.grade}** |
`;
  }

  private buildExecutiveSummary(r: ScanResult): string {
    const criticalCount = r.compliance.issues.filter((i) => i.severity === "critical").length;
    const warningCount = r.compliance.issues.filter((i) => i.severity === "warning").length;
    const illegalPreCookies = r.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
    const persistAfterReject = r.cookiesAfterReject.filter((c) => c.requiresConsent);
    const preInteractionTrackers = r.networkBeforeInteraction.filter((n) => n.requiresConsent);

    const lines: string[] = [];

    const consentRequired =
      [...r.cookiesBeforeInteraction, ...r.cookiesAfterAccept].some((c) => c.requiresConsent) ||
      [...r.networkBeforeInteraction, ...r.networkAfterAccept].some((n) => n.requiresConsent);

    if (!r.modal.detected && consentRequired) {
      lines.push(`❌ ${this.t("EXEC_NO_MODAL_DETECTED")}`);
    } else if (!r.modal.detected) {
      lines.push(`✅ ${this.t("EXEC_NO_MODAL_REQUIRED")}`);
    } else {
      lines.push(`✅ ${this.t("EXEC_MODAL_DETECTED", { selector: r.modal.selector ?? "" })}`);
    }

    if (illegalPreCookies.length > 0) {
      lines.push(`❌ ${this.t("EXEC_ILLEGAL_PRE_COOKIES", { count: illegalPreCookies.length })}`);
    } else {
      lines.push(`✅ ${this.t("EXEC_NO_ILLEGAL_PRE_COOKIES")}`);
    }

    if (persistAfterReject.length > 0) {
      lines.push(`❌ ${this.t("EXEC_PERSIST_AFTER_REJECT", { count: persistAfterReject.length })}`);
    } else {
      lines.push(`✅ ${this.t("EXEC_NO_PERSIST_AFTER_REJECT")}`);
    }

    if (preInteractionTrackers.length > 0) {
      lines.push(`❌ ${this.t("EXEC_PRE_TRACKERS", { count: preInteractionTrackers.length })}`);
    } else {
      lines.push(`✅ ${this.t("EXEC_NO_PRE_TRACKERS")}`);
    }

    lines.push(`\n${this.t("EXEC_SUMMARY_COUNTS", { criticalCount, warningCount })}`);

    return lines.join("\n");
  }

  private buildModalSection(r: ScanResult): string {
    if (!r.modal.detected) {
      return `${this.t("MODAL_NOT_DETECTED")}\n`;
    }

    const { modal } = r;
    const acceptBtn = modal.buttons.find((b) => b.type === "accept");
    const rejectBtn = modal.buttons.find((b) => b.type === "reject");
    const _prefBtn = modal.buttons.find((b) => b.type === "preferences");

    const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);

    const lines: string[] = [
      `**${this.t("MODAL_SELECTOR")}:** \`${modal.selector}\``,
      `**${this.t("MODAL_GRANULAR_CONTROLS")}:** ${modal.hasGranularControls ? "✅ Yes" : "❌ No"}`,
      `**${this.t("MODAL_LAYER_COUNT")}:** ${modal.layerCount}`,
      modal.privacyPolicyUrl
        ? `**${this.t("MODAL_PRIVACY_LINK")}:** ✅ [${modal.privacyPolicyUrl}](${modal.privacyPolicyUrl})`
        : `**${this.t("MODAL_PRIVACY_LINK")}:** ⚠️ ${this.t("MODAL_PRIVACY_LINK_NOT_FOUND")}`,
      "",
      `### ${this.t("MODAL_DETECTED_BUTTONS")}`,
      "",
      `| ${this.t("BTN_HEADER_TYPE")} | ${this.t("BTN_HEADER_LABEL")} | ${this.t("BTN_HEADER_VISIBLE")} | ${this.t("BTN_HEADER_FONT_SIZE")} | ${this.t("BTN_HEADER_CONTRAST")} |`,
      "|--------|------|---------|-----------|----------------|",
      ...modal.buttons.map((b) => this.buildButtonRow(b)),
      "",
    ];

    if (acceptBtn && rejectBtn) {
      lines.push(`### ${this.t("MODAL_BTN_COMPARISON")}\n`);
      if (
        acceptBtn.fontSize &&
        rejectBtn.fontSize &&
        acceptBtn.fontSize > rejectBtn.fontSize * 1.2
      ) {
        lines.push(
          `⚠️ ${this.t("MODAL_BTN_SIZE_WARN", { acceptPx: acceptBtn.fontSize, rejectPx: rejectBtn.fontSize })}`,
        );
      } else {
        lines.push(`✅ ${this.t("MODAL_BTN_SIZE_OK")}`);
      }

      const acceptArea = acceptBtn.boundingBox
        ? acceptBtn.boundingBox.width * acceptBtn.boundingBox.height
        : 0;
      const rejectArea = rejectBtn.boundingBox
        ? rejectBtn.boundingBox.width * rejectBtn.boundingBox.height
        : 0;
      if (acceptArea > rejectArea * 2) {
        lines.push(
          `⚠️ ${this.t("MODAL_BTN_AREA_WARN", { acceptArea: Math.round(acceptArea), rejectArea: Math.round(rejectArea) })}`,
        );
      }
    }

    if (preTicked.length > 0) {
      lines.push(`\n### ${this.t("MODAL_PRE_TICKED")}\n`);
      lines.push(`| ${this.t("COOKIE_NAME")} | ${this.t("BTN_HEADER_LABEL")} |`);
      lines.push("|------|-------|");
      for (const cb of preTicked) {
        lines.push(`| \`${cb.name}\` | ${cb.label} |`);
      }
    }

    if (modal.screenshotPath) {
      lines.push(`\n### ${this.t("MODAL_SCREENSHOT")}\n`);
      lines.push(`![${this.t("SECTION_CONSENT_MODAL")}](${basename(modal.screenshotPath)})`);
    }

    lines.push(`\n### ${this.t("MODAL_TEXT_EXCERPT")}\n`);
    lines.push(`> ${modal.text.substring(0, 500)}${modal.text.length > 500 ? "..." : ""}`);

    return lines.join("\n");
  }

  private buildButtonRow(b: ConsentButton): string {
    const visible = b.isVisible ? "✅" : "❌";
    const fontSize = b.fontSize ? `${b.fontSize}px` : "—";
    const contrast = b.contrastRatio !== null ? `${b.contrastRatio}:1` : "—";
    const typeLabel = {
      accept: `🟢 ${this.t("BTN_ACCEPT")}`,
      reject: `🔴 ${this.t("BTN_REJECT")}`,
      preferences: `⚙️ ${this.t("BTN_PREFERENCES")}`,
      close: `✕ ${this.t("BTN_CLOSE")}`,
      unknown: `❓ ${this.t("BTN_UNKNOWN")}`,
    }[b.type];
    return `| ${typeLabel} | ${b.text.substring(0, 30)} | ${visible} | ${fontSize} | ${contrast} |`;
  }

  private buildIssuesSection(issues: DarkPatternIssue[]): string {
    if (issues.length === 0) {
      return `✅ ${this.t("ISSUES_NONE")}\n`;
    }

    const critical = issues.filter((i) => i.severity === "critical");
    const warnings = issues.filter((i) => i.severity === "warning");
    const infos = issues.filter((i) => i.severity === "info");

    const lines: string[] = [];

    if (critical.length > 0) {
      lines.push(`### ❌ ${this.t("ISSUES_CRITICAL")}\n`);
      for (const issue of critical) {
        lines.push(`**${issue.description}**`);
        lines.push(`> ${issue.evidence}\n`);
      }
    }

    if (warnings.length > 0) {
      lines.push(`### ⚠️ ${this.t("ISSUES_WARNINGS")}\n`);
      for (const issue of warnings) {
        lines.push(`**${issue.description}**`);
        lines.push(`> ${issue.evidence}\n`);
      }
    }

    if (infos.length > 0) {
      lines.push(`### ℹ️ ${this.t("ISSUES_INFO")}\n`);
      for (const issue of infos) {
        lines.push(`- ${issue.description}`);
      }
    }

    return lines.join("\n");
  }

  private buildCookiesTable(cookies: ScannedCookie[], phase: ScannedCookie["capturedAt"]): string {
    const filtered = cookies.filter((c) => c.capturedAt === phase);

    if (filtered.length === 0) {
      return `${this.t("COOKIE_NONE_DETECTED")}\n`;
    }

    const consent = (c: ScannedCookie) => (c.requiresConsent ? "⚠️ Yes" : "✅ No");

    const expires = (c: ScannedCookie) => {
      if (c.expires === null) return this.t("EXPIRY_SESSION");
      const days = Math.round((c.expires * 1000 - Date.now()) / 86400000);
      if (days < 0) return this.t("EXPIRY_EXPIRED");
      if (days === 0) return this.t("EXPIRY_LESS_THAN_1_DAY");
      if (days < 30) return this.t("EXPIRY_DAYS", { count: days });
      return this.t("EXPIRY_MONTHS", { count: Math.round(days / 30) });
    };

    const rows = filtered.map(
      (c) => `| \`${c.name}\` | ${c.domain} | ${c.category} | ${expires(c)} | ${consent(c)} |`,
    );

    return `| ${this.t("COOKIE_NAME")} | ${this.t("COOKIE_DOMAIN")} | ${this.t("COOKIE_CATEGORY")} | ${this.t("COOKIE_EXPIRY")} | ${this.t("COOKIE_CONSENT_REQUIRED")} |
|------|--------|----------|--------|------------------|
${rows.join("\n")}
`;
  }

  private buildCookiesAfterRejectSection(r: ScanResult): string {
    const afterReject = r.cookiesAfterReject.filter((c) => c.capturedAt === "after-reject");
    const violating = afterReject.filter((c) => c.requiresConsent);

    const lines: string[] = [];

    if (violating.length > 0) {
      lines.push(`❌ **${this.t("EXEC_PERSIST_AFTER_REJECT", { count: violating.length })}**\n`);
    } else {
      lines.push(`✅ ${this.t("EXEC_NO_PERSIST_AFTER_REJECT")}\n`);
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
      return `${this.t("NETWORK_NONE")}\n`;
    }

    const phases: Array<{ labelKey: TranslationKey; requests: NetworkRequest[] }> = [
      {
        labelKey: "HTML_COOKIES_BEFORE",
        requests: r.networkBeforeInteraction.filter((r) => r.trackerCategory !== null),
      },
      {
        labelKey: "HTML_COOKIES_AFTER_ACCEPT",
        requests: r.networkAfterAccept.filter((r) => r.trackerCategory !== null),
      },
      {
        labelKey: "HTML_COOKIES_AFTER_REJECT",
        requests: r.networkAfterReject.filter((r) => r.trackerCategory !== null),
      },
    ];

    const lines: string[] = [];

    for (const { labelKey, requests } of phases) {
      if (requests.length === 0) continue;
      lines.push(
        `### ${this.t(labelKey)} (${this.t("NETWORK_TRACKERS_COUNT", { count: requests.length })})\n`,
      );
      lines.push(
        `| ${this.t("NETWORK_TRACKER")} | ${this.t("NETWORK_CATEGORY")} | ${this.t("NETWORK_URL")} | ${this.t("NETWORK_TYPE")} |`,
      );
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

    const needsConsent =
      [...r.cookiesBeforeInteraction, ...r.cookiesAfterAccept].some((c) => c.requiresConsent) ||
      [...r.networkBeforeInteraction, ...r.networkAfterAccept].some((n) => n.requiresConsent);

    if (!r.modal.detected && needsConsent) {
      recs.push(this.t("REC_NO_MODAL"));
    }

    if (issues.some((i) => i.type === "pre-ticked")) {
      recs.push(this.t("REC_PRE_TICKED"));
    }

    if (issues.some((i) => i.type === "no-reject-button" || i.type === "buried-reject")) {
      recs.push(this.t("REC_NO_REJECT"));
    }

    if (issues.some((i) => i.type === "click-asymmetry")) {
      recs.push(this.t("REC_CLICK_ASYMMETRY"));
    }

    if (issues.some((i) => i.type === "asymmetric-prominence" || i.type === "nudging")) {
      recs.push(this.t("REC_VISUAL_ASYMMETRY"));
    }

    if (issues.some((i) => i.type === "auto-consent")) {
      recs.push(this.t("REC_AUTO_CONSENT"));
    }

    if (issues.some((i) => i.type === "missing-info")) {
      recs.push(this.t("REC_MISSING_INFO"));
    }

    if (r.cookiesAfterReject.filter((c) => c.requiresConsent).length > 0) {
      recs.push(this.t("REC_PERSIST_AFTER_REJECT"));
    }

    if (recs.length === 0) {
      recs.push(`✅ ${this.t("REC_NONE")}`);
    }

    return recs.join("\n\n");
  }

  private buildCookiesInventory(r: ScanResult): string {
    const hostname = new URL(r.url).hostname;
    const scanDate = new Date(r.scanDate).toLocaleString(this.options.locale);

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
      "before-interaction": this.t("PHASE_BEFORE_CONSENT"),
      "after-accept": this.t("PHASE_AFTER_ACCEPTANCE"),
      "after-reject": this.t("PHASE_AFTER_REJECTION"),
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
      if (entry.expires === null) return this.t("EXPIRY_SESSION");
      const days = Math.round((entry.expires * 1000 - Date.now()) / 86400000);
      if (days < 0) return this.t("EXPIRY_EXPIRED");
      if (days === 0) return this.t("EXPIRY_LESS_THAN_1_DAY");
      if (days < 30) return this.t("EXPIRY_DAYS", { count: days });
      return this.t("EXPIRY_MONTHS", { count: Math.round(days / 30) });
    };

    const categoryLabel: Record<string, string> = {
      "strictly-necessary": this.t("CAT_STRICTLY_NECESSARY"),
      analytics: this.t("CAT_ANALYTICS"),
      advertising: this.t("CAT_ADVERTISING"),
      social: this.t("CAT_SOCIAL"),
      personalization: this.t("CAT_PERSONALIZATION"),
      unknown: this.t("CAT_UNKNOWN"),
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

    lines.push(`# ${this.t("INV_TITLE")} — ${hostname}`);
    lines.push(`
> **${this.t("REPORT_SCAN_DATE")}:** ${scanDate}
> **${this.t("REPORT_SCANNED_URL")}:** ${r.url}
> **${this.t("INV_UNIQUE_COOKIES")}:** ${entries.length}
`);

    lines.push(`## ${this.t("INV_INSTRUCTIONS_HEADING")}`);
    lines.push(`\n${this.t("INV_INSTRUCTIONS_TEXT")}\n`);

    lines.push(`## ${this.t("INV_COOKIE_TABLE")}\n`);
    lines.push(
      `| ${this.t("COOKIE_NAME")} | ${this.t("COOKIE_DOMAIN")} | ${this.t("COOKIE_CATEGORY")} | ${this.t("COOKIE_PHASES")} | ${this.t("COOKIE_EXPIRY")} | ${this.t("COOKIE_CONSENT_REQUIRED")} | ${this.t("INV_DESCRIPTION")} |`,
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
    lines.push(`\n${this.t("INV_FOOTER")}\n`);

    return lines.join("\n") + "\n";
  }

  private buildChecklist(r: ScanResult): string {
    const hostname = new URL(r.url).hostname;
    const scanDate = new Date(r.scanDate).toLocaleString(this.options.locale);
    const issues = r.compliance.issues;
    const hasIssue = (type: string) => issues.some((i) => i.type === type);
    const getIssue = (type: string) => issues.find((i) => i.type === type);

    const ok = this.t("CHECKLIST_STATUS_OK");
    const ko = this.t("CHECKLIST_STATUS_KO");
    const warn = this.t("CHECKLIST_STATUS_WARN");
    const na = this.t("CHECKLIST_STATUS_NA");

    const consentRequired =
      [...r.cookiesBeforeInteraction, ...r.cookiesAfterAccept].some((c) => c.requiresConsent) ||
      [...r.networkBeforeInteraction, ...r.networkAfterAccept].some((n) => n.requiresConsent);
    const noModalStatus = consentRequired ? ko : na;
    const noModalDetail = consentRequired
      ? this.t("DETAIL_NO_CONSENT_BANNER")
      : this.t("DETAIL_NOT_REQUIRED");

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
      category: this.t("CHECKLIST_CAT_CONSENT"),
      rule: this.t("CHECKLIST_RULE_MODAL_DETECTED"),
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058)",
      status: r.modal.detected ? ok : noModalStatus,
      detail: r.modal.detected
        ? this.t("DETAIL_MODAL_DETECTED", { selector: r.modal.selector ?? "" })
        : noModalDetail,
    });

    const preTicked = r.modal.checkboxes.filter((c) => c.isCheckedByDefault);
    rows.push({
      category: this.t("CHECKLIST_CAT_CONSENT"),
      rule: this.t("CHECKLIST_RULE_NO_PRE_TICKED"),
      reference: "[GDPR Recital 32](https://gdpr-info.eu/recitals/no-32/)",
      status: !r.modal.detected ? (consentRequired ? ko : na) : preTicked.length === 0 ? ok : ko,
      detail: !r.modal.detected
        ? noModalDetail
        : preTicked.length === 0
          ? this.t("DETAIL_NO_PRE_TICKED")
          : this.t("DETAIL_PRE_TICKED", {
              count: preTicked.length,
              names: preTicked.map((c) => c.label || c.name).join(", "),
            }),
    });

    const misleadingAccept = getIssue("misleading-wording");
    const acceptBtn = r.modal.buttons.find((b) => b.type === "accept");
    rows.push({
      category: this.t("CHECKLIST_CAT_CONSENT"),
      rule: this.t("CHECKLIST_RULE_ACCEPT_LABEL"),
      reference: "[GDPR Art. 4(11)](https://gdpr-info.eu/art-4-gdpr/)",
      status: !r.modal.detected
        ? consentRequired
          ? ko
          : na
        : !misleadingAccept
          ? ok
          : misleadingAccept.severity === "critical"
            ? ko
            : warn,
      detail: !r.modal.detected
        ? noModalDetail
        : acceptBtn
          ? misleadingAccept
            ? this.t("DETAIL_ACCEPT_AMBIGUOUS", { text: acceptBtn.text })
            : this.t("DETAIL_ACCEPT_CLEAR", { text: acceptBtn.text })
          : this.t("DETAIL_NO_ACCEPT_BTN"),
    });

    // ── B. Easy refusal ───────────────────────────────────────────
    const rejectBtn = r.modal.buttons.find((b) => b.type === "reject");
    const noReject = hasIssue("no-reject-button") || hasIssue("buried-reject");
    rows.push({
      category: this.t("CHECKLIST_CAT_EASY_REFUSAL"),
      rule: this.t("CHECKLIST_RULE_REJECT_BTN"),
      reference:
        "[CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)",
      status: !r.modal.detected ? (consentRequired ? ko : na) : noReject ? ko : ok,
      detail: !r.modal.detected
        ? noModalDetail
        : rejectBtn
          ? this.t("DETAIL_REJECT_DETECTED", { text: rejectBtn.text })
          : this.t("DETAIL_NO_REJECT_FIRST"),
    });

    const clickIssue = getIssue("click-asymmetry");
    rows.push({
      category: this.t("CHECKLIST_CAT_EASY_REFUSAL"),
      rule: this.t("CHECKLIST_RULE_CLICK_PARITY"),
      reference:
        "[CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)",
      status: !r.modal.detected ? (consentRequired ? ko : na) : clickIssue ? ko : ok,
      detail: !r.modal.detected
        ? noModalDetail
        : clickIssue
          ? clickIssue.evidence
          : acceptBtn && rejectBtn
            ? this.t("DETAIL_CLICK_PARITY", {
                a: acceptBtn.clickDepth,
                b: rejectBtn.clickDepth,
              })
            : this.t("DETAIL_CANNOT_VERIFY"),
    });

    const sizeIssue = getIssue("asymmetric-prominence");
    rows.push({
      category: this.t("CHECKLIST_CAT_EASY_REFUSAL"),
      rule: this.t("CHECKLIST_RULE_SIZE_SYMMETRY"),
      reference:
        "[EDPB Guidelines 03/2022](https://www.edpb.europa.eu/system/files/2022-03/edpb_03-2022_guidelines_on_dark_patterns_in_social_media_platform_interfaces_en.pdf)",
      status: !r.modal.detected ? (consentRequired ? ko : na) : sizeIssue ? warn : ok,
      detail: !r.modal.detected
        ? noModalDetail
        : sizeIssue
          ? sizeIssue.evidence
          : this.t("DETAIL_BTN_SIZES_OK"),
    });

    const nudgeIssue = getIssue("nudging");
    rows.push({
      category: this.t("CHECKLIST_CAT_EASY_REFUSAL"),
      rule: this.t("CHECKLIST_RULE_FONT_SYMMETRY"),
      reference:
        "[EDPB Guidelines 03/2022](https://www.edpb.europa.eu/system/files/2022-03/edpb_03-2022_guidelines_on_dark_patterns_in_social_media_platform_interfaces_en.pdf)",
      status: !r.modal.detected ? (consentRequired ? ko : na) : nudgeIssue ? warn : ok,
      detail: !r.modal.detected
        ? noModalDetail
        : nudgeIssue
          ? nudgeIssue.evidence
          : this.t("DETAIL_BTN_FONTS_OK"),
    });

    // ── C. Transparency ───────────────────────────────────────────
    rows.push({
      category: this.t("CHECKLIST_CAT_TRANSPARENCY"),
      rule: this.t("CHECKLIST_RULE_GRANULAR"),
      reference:
        "[EDPB Guidelines 05/2020](https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en)",
      status: !r.modal.detected
        ? consentRequired
          ? ko
          : na
        : r.modal.hasGranularControls
          ? ok
          : warn,
      detail: !r.modal.detected
        ? noModalDetail
        : r.modal.hasGranularControls
          ? this.t("DETAIL_GRANULAR_COUNT", { count: r.modal.checkboxes.length })
          : this.t("DETAIL_NO_GRANULAR"),
    });

    const infoChecks: Array<{ key: string; ruleKey: TranslationKey; ref: string }> = [
      {
        key: "purposes",
        ruleKey: "CHECKLIST_RULE_PURPOSES",
        ref: "[GDPR Art. 13-14](https://gdpr-info.eu/art-13-gdpr/)",
      },
      {
        key: "third-parties",
        ruleKey: "CHECKLIST_RULE_THIRD_PARTIES",
        ref: "[GDPR Art. 13-14](https://gdpr-info.eu/art-13-gdpr/)",
      },
      {
        key: "duration",
        ruleKey: "CHECKLIST_RULE_DURATION",
        ref: "[GDPR Art. 13(2)(a)](https://gdpr-info.eu/art-13-gdpr/)",
      },
      {
        key: "withdrawal",
        ruleKey: "CHECKLIST_RULE_WITHDRAWAL",
        ref: "[GDPR Art. 7(3)](https://gdpr-info.eu/art-7-gdpr/)",
      },
    ];

    for (const { key, ruleKey, ref } of infoChecks) {
      const missing = issues.find((i) => i.type === "missing-info" && i.key === key);
      rows.push({
        category: this.t("CHECKLIST_CAT_TRANSPARENCY"),
        rule: this.t(ruleKey),
        reference: ref,
        status: !r.modal.detected ? (consentRequired ? ko : na) : missing ? warn : ok,
        detail: !r.modal.detected
          ? noModalDetail
          : missing
            ? this.t("DETAIL_INFO_ABSENT")
            : this.t("DETAIL_INFO_FOUND"),
      });
    }

    rows.push({
      category: this.t("CHECKLIST_CAT_TRANSPARENCY"),
      rule: this.t("CHECKLIST_RULE_PRIVACY_MODAL"),
      reference: "[GDPR Art. 13](https://gdpr-info.eu/art-13-gdpr/)",
      status: !r.modal.detected
        ? consentRequired
          ? ko
          : na
        : r.modal.privacyPolicyUrl
          ? ok
          : warn,
      detail: !r.modal.detected
        ? noModalDetail
        : r.modal.privacyPolicyUrl
          ? this.t("DETAIL_PRIVACY_LINK_FOUND", { url: r.modal.privacyPolicyUrl })
          : this.t("DETAIL_NO_PRIVACY_MODAL"),
    });

    rows.push({
      category: this.t("CHECKLIST_CAT_TRANSPARENCY"),
      rule: this.t("CHECKLIST_RULE_PRIVACY_PAGE"),
      reference: "[GDPR Art. 13](https://gdpr-info.eu/art-13-gdpr/)",
      status: r.privacyPolicyUrl ? ok : consentRequired ? warn : na,
      detail: r.privacyPolicyUrl
        ? this.t("DETAIL_PRIVACY_LINK_FOUND", { url: r.privacyPolicyUrl })
        : this.t("DETAIL_NO_PRIVACY_PAGE"),
    });

    // ── D. Cookie behavior ────────────────────────────────────────
    const illegalPre = r.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
    rows.push({
      category: this.t("CHECKLIST_CAT_COOKIE_BEHAVIOR"),
      rule: this.t("CHECKLIST_RULE_NO_PRE_COOKIES"),
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058)",
      status: illegalPre.length === 0 ? ok : ko,
      detail:
        illegalPre.length === 0
          ? this.t("DETAIL_NO_ILLEGAL_PRE")
          : this.t("DETAIL_ILLEGAL_PRE", {
              count: illegalPre.length,
              names: illegalPre.map((c) => `\`${c.name}\` (${c.category})`).join(", "),
            }),
    });

    const persistAfterReject = r.cookiesAfterReject.filter(
      (c) => c.requiresConsent && c.capturedAt === "after-reject",
    );
    rows.push({
      category: this.t("CHECKLIST_CAT_COOKIE_BEHAVIOR"),
      rule: this.t("CHECKLIST_RULE_COOKIES_REMOVED"),
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [CNIL Recommendation 2022](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies)",
      status: persistAfterReject.length === 0 ? ok : ko,
      detail:
        persistAfterReject.length === 0
          ? this.t("DETAIL_NO_PERSIST")
          : this.t("DETAIL_PERSIST", {
              count: persistAfterReject.length,
              names: persistAfterReject.map((c) => `\`${c.name}\``).join(", "),
            }),
    });

    const preTrackers = r.networkBeforeInteraction.filter((req) => req.requiresConsent);
    rows.push({
      category: this.t("CHECKLIST_CAT_COOKIE_BEHAVIOR"),
      rule: this.t("CHECKLIST_RULE_NO_TRACKERS"),
      reference:
        "[GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/) · [ePrivacy Dir. Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058)",
      status: preTrackers.length === 0 ? ok : ko,
      detail:
        preTrackers.length === 0
          ? this.t("DETAIL_NO_TRACKERS")
          : this.t("DETAIL_TRACKERS", {
              count: preTrackers.length,
              names: [...new Set(preTrackers.map((r) => r.trackerName ?? r.url))]
                .slice(0, 3)
                .join(", "),
            }),
    });

    // ── Totals ────────────────────────────────────────────────────
    const conformeCount = rows.filter((r) => r.status === ok).length;
    const nonConformeCount = rows.filter((r) => r.status === ko).length;
    const avertissementCount = rows.filter((r) => r.status === warn).length;
    const naCount = rows.filter((r) => r.status === na).length;

    const lines: string[] = [];
    lines.push(`# ${this.t("CHECKLIST_TITLE")} — ${hostname}`);
    lines.push(`
> **${this.t("REPORT_SCAN_DATE")}:** ${scanDate}
> **${this.t("REPORT_SCANNED_URL")}:** ${r.url}
> **${this.t("CHECKLIST_GLOBAL_SCORE")}:** ${r.compliance.total}/100 — ${this.t("SCORE_GRADE")} **${r.compliance.grade}**
`);
    const totalsSummary = [
      this.t("CHECKLIST_RULES_COMPLIANT", { count: conformeCount }),
      this.t("CHECKLIST_NON_COMPLIANT", { count: nonConformeCount }),
      this.t("CHECKLIST_WARNINGS", { count: avertissementCount }),
      ...(naCount > 0 ? [this.t("CHECKLIST_NOT_APPLICABLE", { count: naCount })] : []),
    ].join(" · ");
    lines.push(`${totalsSummary}\n`);

    const categories = [...new Set(rows.map((r) => r.category))];
    for (const category of categories) {
      lines.push(`## ${category}\n`);
      lines.push(
        `| ${this.t("CHECKLIST_RULE")} | ${this.t("CHECKLIST_REFERENCE")} | ${this.t("CHECKLIST_STATUS")} | ${this.t("CHECKLIST_DETAIL")} |`,
      );
      lines.push("|------|-----------|--------|--------|");
      for (const row of rows.filter((r) => r.category === category)) {
        lines.push(`| ${row.rule} | ${row.reference} | ${row.status} | ${row.detail} |`);
      }
      lines.push("");
    }

    return lines.join("\n") + "\n";
  }
}
