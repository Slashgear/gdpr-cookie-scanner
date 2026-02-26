import type { ScanResult, ScannedCookie, DarkPatternIssue, ConsentButton } from "../types.js";
import { lookupCookie } from "../classifiers/cookie-lookup.js";

const GRADE_COLOR: Record<string, string> = {
  A: "#16a34a",
  B: "#65a30d",
  C: "#ca8a04",
  D: "#ea580c",
  F: "#dc2626",
};

const GRADE_BG: Record<string, string> = {
  A: "#f0fdf4",
  B: "#f7fee7",
  C: "#fefce8",
  D: "#fff7ed",
  F: "#fef2f2",
};

export function generateHtmlReport(result: ScanResult): string {
  const hostname = new URL(result.url).hostname.replace(/^www\./, "");
  const scanDate = new Date(result.scanDate).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const durationSec = (result.duration / 1000).toFixed(1);
  const { grade, total, breakdown, issues } = result.compliance;
  const color = GRADE_COLOR[grade] ?? "#64748b";
  const bg = GRADE_BG[grade] ?? "#f8fafc";
  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const warningIssues = issues.filter((i) => i.severity === "warning");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GDPR Report — ${esc(hostname)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --grade: ${color};
      --grade-bg: ${bg};
      --surface: #ffffff;
      --bg: #f1f5f9;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --critical: #dc2626;
      --critical-bg: #fef2f2;
      --critical-border: #fecaca;
      --warning: #d97706;
      --warning-bg: #fffbeb;
      --warning-border: #fde68a;
      --ok: #16a34a;
      --ok-bg: #f0fdf4;
      --ok-border: #bbf7d0;
      --radius: 10px;
      --shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
      --shadow-md: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.06);
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }

    /* ── Layout ── */
    .page { max-width: 1000px; margin: 0 auto; padding: 24px 16px 64px; }

    /* ── Hero ── */
    .hero {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      padding: 32px 36px;
      display: flex;
      align-items: center;
      gap: 32px;
      margin-bottom: 20px;
      border-top: 4px solid var(--grade);
    }
    .grade-badge {
      flex-shrink: 0;
      width: 80px; height: 80px;
      border-radius: 16px;
      background: var(--grade);
      color: #fff;
      font-size: 42px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: -2px;
    }
    .hero-info { flex: 1; min-width: 0; }
    .hero-info h1 {
      margin: 0 0 4px;
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hero-meta {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }
    .hero-score {
      flex-shrink: 0;
      text-align: right;
    }
    .hero-score .score-num {
      font-size: 40px;
      font-weight: 800;
      color: var(--grade);
      line-height: 1;
    }
    .hero-score .score-den { font-size: 18px; color: var(--text-muted); font-weight: 400; }
    .hero-score .score-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    /* ── Score grid ── */
    .score-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (max-width: 640px) {
      .score-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .score-card {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 16px 18px;
      box-shadow: var(--shadow);
    }
    .score-card-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .score-card-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }
    .score-card-value span { font-size: 14px; font-weight: 400; color: var(--text-muted); }
    .progress-track {
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      background: var(--grade-color, #64748b);
    }

    /* ── Section ── */
    .section {
      background: var(--surface);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      margin-bottom: 16px;
      overflow: hidden;
    }
    .section-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-header h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }
    .section-body { padding: 20px; }
    .section-body.no-pad { padding: 0; }

    /* ── Badges ── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-critical { background: var(--critical-bg); color: var(--critical); border: 1px solid var(--critical-border); }
    .badge-warning { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning-border); }
    .badge-ok { background: var(--ok-bg); color: var(--ok); border: 1px solid var(--ok-border); }
    .badge-muted { background: var(--bg); color: var(--text-muted); border: 1px solid var(--border); }
    .count-badge {
      background: var(--bg);
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      padding: 1px 8px;
      border-radius: 99px;
      margin-left: auto;
    }

    /* ── Issue cards ── */
    .issue-list { display: flex; flex-direction: column; gap: 10px; }
    .issue-card {
      border-radius: 8px;
      padding: 14px 16px;
      border: 1px solid;
    }
    .issue-card.critical { background: var(--critical-bg); border-color: var(--critical-border); }
    .issue-card.warning { background: var(--warning-bg); border-color: var(--warning-border); }
    .issue-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .issue-card.critical .issue-title { color: var(--critical); }
    .issue-card.warning .issue-title { color: var(--warning); }
    .issue-evidence {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
    }
    .no-issues {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ok);
      font-weight: 500;
      font-size: 14px;
    }

    /* ── Tables ── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table th {
      background: var(--bg);
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #fafafa; }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      background: var(--bg);
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    .cookie-name {
      display: inline-block;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
    .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--text-muted);
      font-size: 13px;
    }

    /* ── Checklist status ── */
    .status-ok { color: var(--ok); font-weight: 600; }
    .status-ko { color: var(--critical); font-weight: 600; }
    .status-warn { color: var(--warning); font-weight: 600; }

    /* ── Info grid ── */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 640px) { .info-grid { grid-template-columns: 1fr; } }
    .info-item { }
    .info-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin-bottom: 2px; }
    .info-value { font-size: 13px; color: var(--text); }

    /* ── Buttons table ── */
    .btn-chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .btn-chip.accept { background: #dcfce7; color: #166534; }
    .btn-chip.reject { background: #fee2e2; color: #991b1b; }
    .btn-chip.preferences { background: #dbeafe; color: #1e40af; }
    .btn-chip.unknown, .btn-chip.close { background: var(--bg); color: var(--text-muted); }

    /* ── Recommendations ── */
    .rec-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .rec-item {
      display: flex;
      gap: 12px;
      padding: 12px 14px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 13px;
    }
    .rec-num {
      flex-shrink: 0;
      width: 24px; height: 24px;
      border-radius: 50%;
      background: var(--text);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 1px;
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      margin-top: 40px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .footer a { color: var(--text-muted); }

    @media print {
      body { background: #fff; }
      .section { box-shadow: none; border: 1px solid var(--border); }
      .page { padding: 0; }
    }
  </style>
</head>
<body>
<div class="page">

  ${buildHero(hostname, scanDate, durationSec, grade, total, color)}

  ${buildScoreGrid(breakdown)}

  ${buildIssuesSection(criticalIssues, warningIssues)}

  ${buildModalSection(result)}

  ${buildCookiesSection(result)}

  ${buildNetworkSection(result)}

  ${buildRecommendationsSection(result)}

  ${buildChecklistSection(result)}

  <div class="footer">
    Generated by <a href="https://github.com/Slashgear/gdpr-report">gdpr-cookie-scanner</a>
    on ${esc(scanDate)}
  </div>

</div>
</body>
</html>`;
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function buildHero(
  hostname: string,
  scanDate: string,
  durationSec: string,
  grade: string,
  total: number,
  color: string,
): string {
  return `<div class="hero">
  <div class="grade-badge" style="background:${color}">${esc(grade)}</div>
  <div class="hero-info">
    <h1>${esc(hostname)}</h1>
    <p class="hero-meta">Scanned on ${esc(scanDate)} · ${durationSec}s</p>
  </div>
  <div class="hero-score">
    <div><span class="score-num" style="color:${color}">${total}</span><span class="score-den">/100</span></div>
    <div class="score-label">Compliance score</div>
  </div>
</div>`;
}

// ── Score grid ────────────────────────────────────────────────────────────────

function buildScoreGrid(breakdown: {
  consentValidity: number;
  easyRefusal: number;
  transparency: number;
  cookieBehavior: number;
}): string {
  const card = (label: string, value: number) => {
    const pct = Math.round((value / 25) * 100);
    const color =
      pct >= 80
        ? GRADE_COLOR.A
        : pct >= 60
          ? GRADE_COLOR.C
          : pct >= 40
            ? GRADE_COLOR.D
            : GRADE_COLOR.F;
    return `<div class="score-card">
  <div class="score-card-label">${label}</div>
  <div class="score-card-value">${value}<span>/25</span></div>
  <div class="progress-track">
    <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
  </div>
</div>`;
  };

  return `<div class="score-grid">
  ${card("Consent validity", breakdown.consentValidity)}
  ${card("Easy refusal", breakdown.easyRefusal)}
  ${card("Transparency", breakdown.transparency)}
  ${card("Cookie behavior", breakdown.cookieBehavior)}
</div>`;
}

// ── Issues ────────────────────────────────────────────────────────────────────

function buildIssuesSection(
  criticalIssues: DarkPatternIssue[],
  warningIssues: DarkPatternIssue[],
): string {
  if (criticalIssues.length === 0 && warningIssues.length === 0) {
    return `<div class="section">
  <div class="section-header">
    <h2>Issues</h2>
  </div>
  <div class="section-body">
    <div class="no-issues">✓ No compliance issue detected</div>
  </div>
</div>`;
  }

  const cards = [
    ...criticalIssues.map(issueCard("critical")),
    ...warningIssues.map(issueCard("warning")),
  ].join("\n");

  const total = criticalIssues.length + warningIssues.length;

  return `<div class="section">
  <div class="section-header">
    <h2>Issues</h2>
    <span class="count-badge">${total}</span>
    ${criticalIssues.length > 0 ? `<span class="badge badge-critical">${criticalIssues.length} critical</span>` : ""}
    ${warningIssues.length > 0 ? `<span class="badge badge-warning">${warningIssues.length} warning${warningIssues.length > 1 ? "s" : ""}</span>` : ""}
  </div>
  <div class="section-body">
    <div class="issue-list">
      ${cards}
    </div>
  </div>
</div>`;
}

function issueCard(severity: "critical" | "warning") {
  return (issue: DarkPatternIssue) => `<div class="issue-card ${severity}">
  <div class="issue-title">${esc(issue.description)}</div>
  <p class="issue-evidence">${esc(issue.evidence)}</p>
</div>`;
}

// ── Consent modal ─────────────────────────────────────────────────────────────

function buildModalSection(result: ScanResult): string {
  const { modal } = result;

  if (!modal.detected) {
    return `<div class="section">
  <div class="section-header"><h2>Consent modal</h2></div>
  <div class="section-body">
    <span class="badge badge-critical">Not detected</span>
    <p style="margin:12px 0 0;color:var(--text-muted);font-size:13px">No consent banner was found on the page.</p>
  </div>
</div>`;
  }

  const privacyLink = modal.privacyPolicyUrl
    ? `<a href="${esc(modal.privacyPolicyUrl)}" target="_blank" rel="noopener">${esc(modal.privacyPolicyUrl)}</a>`
    : `<span class="badge badge-warning">Not found</span>`;

  const buttonsHtml =
    modal.buttons.length === 0
      ? `<p style="color:var(--text-muted);font-size:13px">No buttons detected.</p>`
      : `<table class="data-table">
    <thead><tr>
      <th>Type</th><th>Label</th><th>Font size</th><th>Contrast</th><th>Clicks</th>
    </tr></thead>
    <tbody>
      ${modal.buttons.map(buttonRow).join("\n")}
    </tbody>
  </table>`;

  const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);

  return `<div class="section">
  <div class="section-header">
    <h2>Consent modal</h2>
    <span class="badge badge-ok">Detected</span>
  </div>
  <div class="section-body">
    <div class="info-grid" style="margin-bottom:20px">
      <div class="info-item">
        <div class="info-label">Selector</div>
        <div class="info-value"><code>${esc(modal.selector ?? "—")}</code></div>
      </div>
      <div class="info-item">
        <div class="info-label">Granular controls</div>
        <div class="info-value">${modal.hasGranularControls ? '<span class="status-ok">✓ Yes</span>' : '<span class="status-warn">✗ No</span>'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Privacy policy link</div>
        <div class="info-value">${privacyLink}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Pre-ticked checkboxes</div>
        <div class="info-value">${preTicked.length === 0 ? '<span class="status-ok">✓ None</span>' : `<span class="status-ko">✗ ${preTicked.length} (${preTicked.map((c) => esc(c.label || c.name)).join(", ")})</span>`}</div>
      </div>
    </div>
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);margin-bottom:8px">Buttons</div>
    ${buttonsHtml}
  </div>
</div>`;
}

function buttonRow(b: ConsentButton): string {
  const chip = `<span class="btn-chip ${b.type}">${esc(b.type)}</span>`;
  const fontSize = b.fontSize ? `${b.fontSize}px` : "—";
  const contrast = b.contrastRatio !== null ? `${b.contrastRatio}:1` : "—";
  return `<tr>
    <td>${chip}</td>
    <td>${esc(b.text.substring(0, 40))}</td>
    <td>${fontSize}</td>
    <td>${contrast}</td>
    <td>${b.clickDepth}</td>
  </tr>`;
}

// ── Cookies ───────────────────────────────────────────────────────────────────

function buildCookiesSection(result: ScanResult): string {
  const phases: Array<{
    label: string;
    cookies: ScannedCookie[];
    phase: ScannedCookie["capturedAt"];
  }> = [
    {
      label: "Before interaction",
      cookies: result.cookiesBeforeInteraction,
      phase: "before-interaction",
    },
    { label: "After reject", cookies: result.cookiesAfterReject, phase: "after-reject" },
    { label: "After accept", cookies: result.cookiesAfterAccept, phase: "after-accept" },
  ];

  const illegalPre = result.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
  const illegalPost = result.cookiesAfterReject.filter(
    (c) => c.requiresConsent && c.capturedAt === "after-reject",
  );

  const phaseTables = phases
    .map(({ label, cookies, phase }) => {
      const filtered = cookies.filter((c) => c.capturedAt === phase);
      return `<div style="margin-bottom:24px">
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;gap:8px">
      ${esc(label)}
      <span class="count-badge">${filtered.length}</span>
      ${phase === "before-interaction" && illegalPre.length > 0 ? `<span class="badge badge-critical">${illegalPre.length} non-essential</span>` : ""}
      ${phase === "after-reject" && illegalPost.length > 0 ? `<span class="badge badge-critical">${illegalPost.length} non-essential</span>` : ""}
    </div>
    ${cookieTable(filtered)}
  </div>`;
    })
    .join("\n");

  return `<div class="section">
  <div class="section-header"><h2>Cookies</h2></div>
  <div class="section-body">
    ${phaseTables}
  </div>
</div>`;
}

function cookieTable(cookies: ScannedCookie[]): string {
  if (cookies.length === 0) {
    return `<p class="empty-state">No cookies detected.</p>`;
  }

  const rows = cookies
    .map((c) => {
      const consent = c.requiresConsent
        ? `<span class="badge badge-warning">Required</span>`
        : `<span class="badge badge-muted">No</span>`;
      const ocd = lookupCookie(c.name);
      const descCell = ocd
        ? `<span title="${esc(ocd.platform)}${ocd.privacyLink ? ` — ${esc(ocd.privacyLink)}` : ""}">${esc(ocd.description)}</span>`
        : `<span style="color:var(--text-muted)">—</span>`;
      return `<tr>
      <td><code class="cookie-name" title="${esc(c.name)}">${esc(c.name)}</code></td>
      <td style="color:var(--text-muted)">${esc(c.domain)}</td>
      <td><span class="badge badge-muted">${esc(c.category)}</span></td>
      <td>${descCell}</td>
      <td style="color:var(--text-muted)">${formatExpiry(c)}</td>
      <td>${consent}</td>
    </tr>`;
    })
    .join("\n");

  return `<table class="data-table">
  <thead><tr>
    <th>Name</th><th>Domain</th><th>Category</th><th>Description</th><th>Expiry</th><th>Consent</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

function formatExpiry(c: ScannedCookie): string {
  if (c.expires === null) return "Session";
  const days = Math.round((c.expires * 1000 - Date.now()) / 86_400_000);
  if (days < 0) return "Expired";
  if (days === 0) return "< 1 day";
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

// ── Network ───────────────────────────────────────────────────────────────────

function buildNetworkSection(result: ScanResult): string {
  const trackers = [
    ...result.networkBeforeInteraction,
    ...result.networkAfterReject,
    ...result.networkAfterAccept,
  ].filter((r) => r.trackerCategory !== null);

  if (trackers.length === 0) {
    return `<div class="section">
  <div class="section-header"><h2>Network trackers</h2></div>
  <div class="section-body">
    <div class="no-issues">✓ No network tracker detected</div>
  </div>
</div>`;
  }

  const preTrackers = result.networkBeforeInteraction.filter((r) => r.trackerCategory !== null);

  const rows = trackers
    .slice(0, 50)
    .map((req) => {
      const isBefore = req.capturedAt === "before-interaction";
      const url = req.url.length > 70 ? req.url.substring(0, 67) + "…" : req.url;
      return `<tr>
      <td>${esc(req.trackerName ?? "Unknown")}</td>
      <td><span class="badge badge-muted">${esc(req.trackerCategory ?? "")}</span></td>
      <td>${isBefore ? `<span class="badge badge-critical">before consent</span>` : `<span class="badge badge-muted">${esc(req.capturedAt)}</span>`}</td>
      <td style="font-size:11px;color:var(--text-muted);word-break:break-all"><code>${esc(url)}</code></td>
    </tr>`;
    })
    .join("\n");

  return `<div class="section">
  <div class="section-header">
    <h2>Network trackers</h2>
    <span class="count-badge">${trackers.length}</span>
    ${preTrackers.length > 0 ? `<span class="badge badge-critical">${preTrackers.length} before consent</span>` : ""}
  </div>
  <div class="section-body no-pad">
    <table class="data-table">
      <thead><tr><th>Tracker</th><th>Category</th><th>Phase</th><th>URL</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${trackers.length > 50 ? `<p style="padding:12px 14px;font-size:12px;color:var(--text-muted)">… and ${trackers.length - 50} more.</p>` : ""}
  </div>
</div>`;
}

// ── Recommendations ───────────────────────────────────────────────────────────

function buildRecommendationsSection(result: ScanResult): string {
  const recs: string[] = [];
  const { modal, compliance } = result;
  const { issues } = compliance;
  const has = (type: string) => issues.some((i) => i.type === type);

  if (!modal.detected)
    recs.push(
      "Deploy a CMP solution (Axeptio, Didomi, OneTrust, Cookiebot) that displays a consent modal before any non-essential cookie.",
    );
  if (has("pre-ticked"))
    recs.push(
      "Remove pre-ticked checkboxes. Consent must result from an explicit positive action (GDPR Recital 32).",
    );
  if (has("no-reject-button") || has("buried-reject"))
    recs.push(
      'Add a "Reject all" button at the first layer of the modal, requiring no more clicks than "Accept all" (CNIL 2022).',
    );
  if (has("click-asymmetry"))
    recs.push(
      "Balance the number of clicks to accept and reject. Rejection must not require more steps than acceptance.",
    );
  if (has("asymmetric-prominence") || has("nudging"))
    recs.push(
      "Equalise the styling of Accept / Reject buttons: same size, same colour, same level of visibility.",
    );
  if (has("auto-consent"))
    recs.push(
      "Do not set any non-essential cookie before consent. Gate the initialisation of third-party scripts on the acceptance callback.",
    );
  if (has("missing-info"))
    recs.push(
      "Complete the modal information: processing purposes, identity of sub-processors, retention period, right to withdraw.",
    );
  if (result.cookiesAfterReject.filter((c) => c.requiresConsent).length > 0)
    recs.push(
      "Remove or block non-essential cookies after rejection, and verify consent handling server-side.",
    );

  if (recs.length === 0) {
    return `<div class="section">
  <div class="section-header"><h2>Recommendations</h2></div>
  <div class="section-body">
    <div class="no-issues">✓ No critical recommendation. Conduct regular audits to maintain compliance.</div>
  </div>
</div>`;
  }

  const items = recs
    .map(
      (rec, i) => `<li class="rec-item">
    <span class="rec-num">${i + 1}</span>
    <span>${esc(rec)}</span>
  </li>`,
    )
    .join("\n");

  return `<div class="section">
  <div class="section-header"><h2>Recommendations</h2><span class="count-badge">${recs.length}</span></div>
  <div class="section-body">
    <ul class="rec-list">${items}</ul>
  </div>
</div>`;
}

// ── Checklist ─────────────────────────────────────────────────────────────────

function buildChecklistSection(result: ScanResult): string {
  const { modal, compliance } = result;
  const { issues } = compliance;
  const hasIssue = (type: string) => issues.some((i) => i.type === type);

  type Row = { category: string; rule: string; status: "ok" | "ko" | "warn"; detail: string };
  const rows: Row[] = [];

  const push = (category: string, rule: string, status: "ok" | "ko" | "warn", detail: string) =>
    rows.push({ category, rule, status, detail });

  push(
    "Consent",
    "Consent modal detected",
    modal.detected ? "ok" : "ko",
    modal.detected ? `Detected (${modal.selector})` : "No consent banner found",
  );

  const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);
  push(
    "Consent",
    "No pre-ticked checkboxes",
    preTicked.length === 0 ? "ok" : "ko",
    preTicked.length === 0 ? "None detected" : `${preTicked.length} pre-ticked`,
  );

  push(
    "Consent",
    "Unambiguous accept label",
    !modal.detected || !hasIssue("misleading-wording") ? "ok" : "warn",
    modal.buttons.find((b) => b.type === "accept")?.text ?? "No accept button",
  );

  push(
    "Easy refusal",
    "Reject button at first layer",
    !modal.detected
      ? "ko"
      : hasIssue("no-reject-button") || hasIssue("buried-reject")
        ? "ko"
        : "ok",
    modal.buttons.find((b) => b.type === "reject")?.text ?? "Not found",
  );

  push(
    "Easy refusal",
    "Reject ≤ clicks than accept",
    !modal.detected ? "ko" : hasIssue("click-asymmetry") ? "ko" : "ok",
    (() => {
      const a = modal.buttons.find((b) => b.type === "accept");
      const r = modal.buttons.find((b) => b.type === "reject");
      return a && r ? `Accept: ${a.clickDepth} · Reject: ${r.clickDepth}` : "Cannot verify";
    })(),
  );

  push(
    "Easy refusal",
    "Button size symmetry",
    !modal.detected ? "ko" : hasIssue("asymmetric-prominence") ? "warn" : "ok",
    hasIssue("asymmetric-prominence")
      ? "Accept button is significantly larger"
      : "Comparable sizes",
  );

  push(
    "Transparency",
    "Granular controls available",
    !modal.detected ? "ko" : modal.hasGranularControls ? "ok" : "warn",
    modal.hasGranularControls
      ? `${modal.checkboxes.length} control(s) detected`
      : "No granular controls",
  );

  push(
    "Transparency",
    "Privacy policy in modal",
    !modal.detected ? "ko" : modal.privacyPolicyUrl ? "ok" : "warn",
    modal.privacyPolicyUrl ?? "Not found",
  );

  push(
    "Transparency",
    "Privacy policy on page",
    result.privacyPolicyUrl ? "ok" : "warn",
    result.privacyPolicyUrl ?? "Not found",
  );

  const illegalPre = result.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
  push(
    "Cookie behavior",
    "No non-essential cookie before consent",
    illegalPre.length === 0 ? "ok" : "ko",
    illegalPre.length === 0
      ? "None"
      : `${illegalPre.length}: ${illegalPre.map((c) => c.name).join(", ")}`,
  );

  const persistAfterReject = result.cookiesAfterReject.filter(
    (c) => c.requiresConsent && c.capturedAt === "after-reject",
  );
  push(
    "Cookie behavior",
    "Non-essential cookies removed after reject",
    persistAfterReject.length === 0 ? "ok" : "ko",
    persistAfterReject.length === 0
      ? "Correctly removed"
      : `${persistAfterReject.length} persisting`,
  );

  const preTrackers = result.networkBeforeInteraction.filter(
    (r) => r.trackerCategory !== null && r.trackerCategory !== "cdn",
  );
  push(
    "Cookie behavior",
    "No tracker before consent",
    preTrackers.length === 0 ? "ok" : "ko",
    preTrackers.length === 0 ? "None" : `${preTrackers.length} tracker(s)`,
  );

  const categories = [...new Set(rows.map((r) => r.category))];
  const okCount = rows.filter((r) => r.status === "ok").length;
  const koCount = rows.filter((r) => r.status === "ko").length;
  const warnCount = rows.filter((r) => r.status === "warn").length;

  const statusCell = (status: "ok" | "ko" | "warn") =>
    status === "ok"
      ? `<span class="status-ok">✓ Compliant</span>`
      : status === "ko"
        ? `<span class="status-ko">✗ Non-compliant</span>`
        : `<span class="status-warn">⚠ Warning</span>`;

  const tableRows = categories
    .map((cat) => {
      const catRows = rows.filter((r) => r.category === cat);
      return catRows
        .map(
          (row, i) =>
            `<tr>
          ${i === 0 ? `<td rowspan="${catRows.length}" style="font-weight:600;vertical-align:top;background:var(--bg)">${esc(cat)}</td>` : ""}
          <td>${esc(row.rule)}</td>
          <td>${statusCell(row.status)}</td>
          <td style="color:var(--text-muted);font-size:12px">${esc(row.detail)}</td>
        </tr>`,
        )
        .join("\n");
    })
    .join("\n");

  const totalRules = rows.length;

  return `<div class="section">
  <div class="section-header">
    <h2>Compliance checklist</h2>
    <span class="count-badge">${totalRules} rules</span>
    <span class="badge badge-ok">${okCount} ✓</span>
    <span class="badge badge-critical">${koCount} ✗</span>
    ${warnCount > 0 ? `<span class="badge badge-warning">${warnCount} ⚠</span>` : ""}
  </div>
  <div class="section-body no-pad">
    <table class="data-table">
      <thead><tr><th>Category</th><th>Rule</th><th>Status</th><th>Detail</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
</div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
