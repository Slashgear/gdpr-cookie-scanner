import { execFile } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { basename, dirname, join } from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";

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

  async generate(result: ScanResult): Promise<string> {
    await mkdir(this.options.outputDir, { recursive: true });

    const hostname = new URL(result.url).hostname.replace(/^www\./, "");
    const date = new Date(result.scanDate).toISOString().split("T")[0];
    const filename = `gdpr-report-${hostname}-${date}.md`;
    const outputPath = join(this.options.outputDir, filename);

    const markdown = this.buildMarkdown(result);
    await writeFile(outputPath, markdown, "utf-8");
    await execFileAsync(oxfmtBin, [outputPath]).catch(() => {});

    const checklistFilename = `gdpr-checklist-${hostname}-${date}.md`;
    const checklistPath = join(this.options.outputDir, checklistFilename);
    const checklist = this.buildChecklist(result);
    await writeFile(checklistPath, checklist, "utf-8");
    await execFileAsync(oxfmtBin, [checklistPath]).catch(() => {});

    return outputPath;
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
    const prefBtn = modal.buttons.find((b) => b.type === "preferences");

    const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);

    const lines: string[] = [
      `**CSS selector:** \`${modal.selector}\``,
      `**Granular controls:** ${modal.hasGranularControls ? "✅ Yes" : "❌ No"}`,
      `**Layer count:** ${modal.layerCount}`,
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
      reference: "RGPD Art. 7 · Dir. ePrivacy Art. 5(3)",
      status: r.modal.detected ? ok : ko,
      detail: r.modal.detected
        ? `Detected (\`${r.modal.selector}\`)`
        : "No consent banner detected",
    });

    const preTicked = r.modal.checkboxes.filter((c) => c.isCheckedByDefault);
    rows.push({
      category: "Consent",
      rule: "No pre-ticked checkboxes",
      reference: "RGPD Recital 32",
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
      reference: "RGPD Art. 4(11)",
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
      reference: "CNIL Recommendation 2022",
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
      reference: "CNIL Recommendation 2022",
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
      reference: "CEPD Guidelines 03/2022",
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
      reference: "CEPD Guidelines 03/2022",
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
      reference: "CEPD Guidelines 05/2020",
      status: !r.modal.detected ? ko : r.modal.hasGranularControls ? ok : warn,
      detail: !r.modal.detected
        ? "Modal not detected"
        : r.modal.hasGranularControls
          ? `${r.modal.checkboxes.length} checkbox(es) or preferences panel detected`
          : "No granular controls (checkboxes or panel) detected",
    });

    const infoChecks: Array<{ key: string; label: string; ref: string }> = [
      { key: "purposes", label: "Processing purposes mentioned", ref: "RGPD Art. 13-14" },
      {
        key: "third-parties",
        label: "Sub-processors / third parties mentioned",
        ref: "RGPD Art. 13-14",
      },
      {
        key: "duration",
        label: "Retention period mentioned",
        ref: "RGPD Art. 13(2)(a)",
      },
      {
        key: "withdrawal",
        label: "Right to withdraw consent mentioned",
        ref: "RGPD Art. 7(3)",
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

    // ── D. Cookie behavior ────────────────────────────────────────
    const illegalPre = r.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
    rows.push({
      category: "Cookie behavior",
      rule: "No non-essential cookie before consent",
      reference: "RGPD Art. 7 · Dir. ePrivacy Art. 5(3)",
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
      reference: "RGPD Art. 7 · CNIL Recommendation 2022",
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
      reference: "RGPD Art. 7 · Dir. ePrivacy Art. 5(3)",
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
