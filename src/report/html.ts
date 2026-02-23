import type { ScanResult, ScannedCookie, DarkPatternIssue, ConsentButton } from "../types.js";
import { type Locale, t as i18nT } from "../i18n/index.js";

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

function tt(
  locale: Locale,
  key: Parameters<typeof i18nT>[1],
  vars?: Record<string, string | number>,
): string {
  return i18nT(locale, key, vars);
}

export function generateHtmlReport(result: ScanResult, locale: Locale, localeTag?: string): string {
  const hostname = new URL(result.url).hostname.replace(/^www\./, "");
  const scanDate = new Date(result.scanDate).toLocaleString(localeTag ?? locale, {
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
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tt(locale, "REPORT_TITLE")} — ${esc(hostname)}</title>
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

  ${buildHero(hostname, scanDate, durationSec, grade, total, color, locale)}

  ${buildScoreGrid(breakdown, locale)}

  ${buildIssuesSection(criticalIssues, warningIssues, locale)}

  ${buildModalSection(result, locale)}

  ${buildCookiesSection(result, locale)}

  ${buildNetworkSection(result, locale)}

  ${buildRecommendationsSection(result, locale)}

  ${buildChecklistSection(result, locale)}

  <div class="footer">
    ${tt(locale, "HTML_GENERATED_BY")} <a href="https://github.com/Slashgear/gdpr-report">gdpr-cookie-scanner</a>
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
  locale: Locale,
): string {
  return `<div class="hero">
  <div class="grade-badge" style="background:${color}">${esc(grade)}</div>
  <div class="hero-info">
    <h1>${esc(hostname)}</h1>
    <p class="hero-meta">${tt(locale, "HTML_SCANNED_ON")} ${esc(scanDate)} · ${durationSec}s</p>
  </div>
  <div class="hero-score">
    <div><span class="score-num" style="color:${color}">${total}</span><span class="score-den">/100</span></div>
    <div class="score-label">${tt(locale, "HTML_COMPLIANCE_SCORE")}</div>
  </div>
</div>`;
}

// ── Score grid ────────────────────────────────────────────────────────────────

function buildScoreGrid(
  breakdown: {
    consentValidity: number;
    easyRefusal: number;
    transparency: number;
    cookieBehavior: number;
  },
  locale: Locale,
): string {
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
  ${card(tt(locale, "SCORE_CONSENT_VALIDITY"), breakdown.consentValidity)}
  ${card(tt(locale, "SCORE_EASY_REFUSAL"), breakdown.easyRefusal)}
  ${card(tt(locale, "SCORE_TRANSPARENCY"), breakdown.transparency)}
  ${card(tt(locale, "SCORE_COOKIE_BEHAVIOR"), breakdown.cookieBehavior)}
</div>`;
}

// ── Issues ────────────────────────────────────────────────────────────────────

function buildIssuesSection(
  criticalIssues: DarkPatternIssue[],
  warningIssues: DarkPatternIssue[],
  locale: Locale,
): string {
  if (criticalIssues.length === 0 && warningIssues.length === 0) {
    return `<div class="section">
  <div class="section-header">
    <h2>${tt(locale, "HTML_ISSUES")}</h2>
  </div>
  <div class="section-body">
    <div class="no-issues">✓ ${tt(locale, "HTML_NO_ISSUES")}</div>
  </div>
</div>`;
  }

  const cards = [
    ...criticalIssues.map(issueCard("critical")),
    ...warningIssues.map(issueCard("warning")),
  ].join("\n");

  const total = criticalIssues.length + warningIssues.length;
  const criticalLabel = `${criticalIssues.length} ${tt(locale, "HTML_CRITICAL")}`;
  const warningLabel =
    warningIssues.length > 1
      ? `${warningIssues.length} ${tt(locale, "HTML_WARNINGS")}`
      : `${warningIssues.length} ${tt(locale, "HTML_WARNING")}`;

  return `<div class="section">
  <div class="section-header">
    <h2>${tt(locale, "HTML_ISSUES")}</h2>
    <span class="count-badge">${total}</span>
    ${criticalIssues.length > 0 ? `<span class="badge badge-critical">${criticalLabel}</span>` : ""}
    ${warningIssues.length > 0 ? `<span class="badge badge-warning">${warningLabel}</span>` : ""}
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

function buildModalSection(result: ScanResult, locale: Locale): string {
  const { modal } = result;

  if (!modal.detected) {
    return `<div class="section">
  <div class="section-header"><h2>${tt(locale, "HTML_CONSENT_MODAL")}</h2></div>
  <div class="section-body">
    <span class="badge badge-critical">${tt(locale, "HTML_NOT_DETECTED")}</span>
    <p style="margin:12px 0 0;color:var(--text-muted);font-size:13px">${tt(locale, "HTML_NO_CONSENT_BANNER")}</p>
  </div>
</div>`;
  }

  const privacyLink = modal.privacyPolicyUrl
    ? `<a href="${esc(modal.privacyPolicyUrl)}" target="_blank" rel="noopener">${esc(modal.privacyPolicyUrl)}</a>`
    : `<span class="badge badge-warning">${tt(locale, "HTML_NOT_DETECTED")}</span>`;

  const buttonsHtml =
    modal.buttons.length === 0
      ? `<p style="color:var(--text-muted);font-size:13px">${tt(locale, "HTML_NO_BUTTONS")}</p>`
      : `<table class="data-table">
    <thead><tr>
      <th>${tt(locale, "SCORE_STATUS")}</th><th>${tt(locale, "BTN_HEADER_LABEL")}</th><th>${tt(locale, "BTN_HEADER_FONT_SIZE")}</th><th>${tt(locale, "BTN_HEADER_CONTRAST")}</th><th>${tt(locale, "BTN_HEADER_CLICKS")}</th>
    </tr></thead>
    <tbody>
      ${modal.buttons.map(buttonRow).join("\n")}
    </tbody>
  </table>`;

  const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);

  return `<div class="section">
  <div class="section-header">
    <h2>${tt(locale, "HTML_CONSENT_MODAL")}</h2>
    <span class="badge badge-ok">${tt(locale, "HTML_DETECTED")}</span>
  </div>
  <div class="section-body">
    <div class="info-grid" style="margin-bottom:20px">
      <div class="info-item">
        <div class="info-label">${tt(locale, "HTML_SELECTOR")}</div>
        <div class="info-value"><code>${esc(modal.selector ?? "—")}</code></div>
      </div>
      <div class="info-item">
        <div class="info-label">${tt(locale, "HTML_GRANULAR_CONTROLS")}</div>
        <div class="info-value">${modal.hasGranularControls ? '<span class="status-ok">✓ Yes</span>' : '<span class="status-warn">✗ No</span>'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${tt(locale, "HTML_PRIVACY_LINK")}</div>
        <div class="info-value">${privacyLink}</div>
      </div>
      <div class="info-item">
        <div class="info-label">${tt(locale, "HTML_PRE_TICKED")}</div>
        <div class="info-value">${preTicked.length === 0 ? `<span class="status-ok">✓ ${tt(locale, "HTML_NONE")}</span>` : `<span class="status-ko">✗ ${preTicked.length} (${preTicked.map((c) => esc(c.label || c.name)).join(", ")})</span>`}</div>
      </div>
    </div>
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);margin-bottom:8px">${tt(locale, "HTML_BUTTONS")}</div>
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

function buildCookiesSection(result: ScanResult, locale: Locale): string {
  const phases: Array<{
    label: string;
    cookies: ScannedCookie[];
    phase: ScannedCookie["capturedAt"];
  }> = [
    {
      label: tt(locale, "HTML_COOKIES_BEFORE"),
      cookies: result.cookiesBeforeInteraction,
      phase: "before-interaction",
    },
    {
      label: tt(locale, "HTML_COOKIES_AFTER_REJECT"),
      cookies: result.cookiesAfterReject,
      phase: "after-reject",
    },
    {
      label: tt(locale, "HTML_COOKIES_AFTER_ACCEPT"),
      cookies: result.cookiesAfterAccept,
      phase: "after-accept",
    },
  ];

  const illegalPre = result.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
  const illegalPost = result.cookiesAfterReject.filter(
    (c) => c.requiresConsent && c.capturedAt === "after-reject",
  );

  const phaseTables = phases
    .map(({ label, cookies, phase }) => {
      const filtered = cookies.filter((c) => c.capturedAt === phase);
      const nonEssentialLabel = tt(locale, "HTML_NON_ESSENTIAL");
      return `<div style="margin-bottom:24px">
    <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;gap:8px">
      ${esc(label)}
      <span class="count-badge">${filtered.length}</span>
      ${phase === "before-interaction" && illegalPre.length > 0 ? `<span class="badge badge-critical">${illegalPre.length} ${nonEssentialLabel}</span>` : ""}
      ${phase === "after-reject" && illegalPost.length > 0 ? `<span class="badge badge-critical">${illegalPost.length} ${nonEssentialLabel}</span>` : ""}
    </div>
    ${cookieTable(filtered, locale)}
  </div>`;
    })
    .join("\n");

  return `<div class="section">
  <div class="section-header"><h2>${tt(locale, "HTML_COOKIES")}</h2></div>
  <div class="section-body">
    ${phaseTables}
  </div>
</div>`;
}

function cookieTable(cookies: ScannedCookie[], locale: Locale): string {
  if (cookies.length === 0) {
    return `<p class="empty-state">${tt(locale, "COOKIE_NONE_DETECTED")}</p>`;
  }

  const rows = cookies
    .map((c) => {
      const consent = c.requiresConsent
        ? `<span class="badge badge-warning">${tt(locale, "HTML_CONSENT_REQUIRED")}</span>`
        : `<span class="badge badge-muted">${tt(locale, "HTML_NOT_REQUIRED")}</span>`;
      return `<tr>
      <td><code>${esc(c.name)}</code></td>
      <td style="color:var(--text-muted)">${esc(c.domain)}</td>
      <td><span class="badge badge-muted">${esc(c.category)}</span></td>
      <td style="color:var(--text-muted)">${formatExpiry(c, locale)}</td>
      <td>${consent}</td>
    </tr>`;
    })
    .join("\n");

  return `<table class="data-table">
  <thead><tr>
    <th>${tt(locale, "COOKIE_NAME")}</th><th>${tt(locale, "COOKIE_DOMAIN")}</th><th>${tt(locale, "COOKIE_CATEGORY")}</th><th>${tt(locale, "COOKIE_EXPIRY")}</th><th>${tt(locale, "COOKIE_CONSENT_REQUIRED")}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

function formatExpiry(c: ScannedCookie, locale: Locale): string {
  if (c.expires === null) return tt(locale, "EXPIRY_SESSION");
  const days = Math.round((c.expires * 1000 - Date.now()) / 86_400_000);
  if (days < 0) return tt(locale, "EXPIRY_EXPIRED");
  if (days === 0) return tt(locale, "EXPIRY_LESS_THAN_1_DAY");
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

// ── Network ───────────────────────────────────────────────────────────────────

function buildNetworkSection(result: ScanResult, locale: Locale): string {
  const trackers = [
    ...result.networkBeforeInteraction,
    ...result.networkAfterReject,
    ...result.networkAfterAccept,
  ].filter((r) => r.trackerCategory !== null);

  if (trackers.length === 0) {
    return `<div class="section">
  <div class="section-header"><h2>${tt(locale, "HTML_NETWORK_TRACKERS")}</h2></div>
  <div class="section-body">
    <div class="no-issues">✓ ${tt(locale, "HTML_NO_TRACKERS")}</div>
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
      <td>${isBefore ? `<span class="badge badge-critical">${tt(locale, "HTML_BEFORE_CONSENT")}</span>` : `<span class="badge badge-muted">${esc(req.capturedAt)}</span>`}</td>
      <td style="font-size:11px;color:var(--text-muted);word-break:break-all"><code>${esc(url)}</code></td>
    </tr>`;
    })
    .join("\n");

  const beforeConsentLabel = tt(locale, "HTML_TRACKERS_BEFORE", { count: preTrackers.length });

  return `<div class="section">
  <div class="section-header">
    <h2>${tt(locale, "HTML_NETWORK_TRACKERS")}</h2>
    <span class="count-badge">${trackers.length}</span>
    ${preTrackers.length > 0 ? `<span class="badge badge-critical">${beforeConsentLabel}</span>` : ""}
  </div>
  <div class="section-body no-pad">
    <table class="data-table">
      <thead><tr><th>${tt(locale, "NETWORK_TRACKER")}</th><th>${tt(locale, "NETWORK_CATEGORY")}</th><th>${tt(locale, "NETWORK_PHASE")}</th><th>${tt(locale, "NETWORK_URL")}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${trackers.length > 50 ? `<p style="padding:12px 14px;font-size:12px;color:var(--text-muted)">… and ${trackers.length - 50} more.</p>` : ""}
  </div>
</div>`;
}

// ── Recommendations ───────────────────────────────────────────────────────────

function buildRecommendationsSection(result: ScanResult, locale: Locale): string {
  const recs: string[] = [];
  const { modal, compliance } = result;
  const { issues } = compliance;
  const has = (type: string) => issues.some((i) => i.type === type);

  if (!modal.detected)
    recs.push(
      tt(locale, "REC_NO_MODAL")
        .replace(/^1\. \*\*(.+?)\*\*/, "$1")
        .replace(/^1\. /, ""),
    );
  if (has("pre-ticked"))
    recs.push(
      tt(locale, "REC_PRE_TICKED")
        .replace(/^1\. \*\*(.+?)\*\*\s*/, "")
        .replace(/^1\. /, ""),
    );
  if (has("no-reject-button") || has("buried-reject"))
    recs.push(
      tt(locale, "REC_NO_REJECT")
        .replace(/^1\. \*\*(.+?)\*\*\s*/, "")
        .replace(/^1\. /, ""),
    );
  if (has("click-asymmetry"))
    recs.push(
      tt(locale, "REC_CLICK_ASYMMETRY")
        .replace(/^1\. \*\*(.+?)\*\*\s*/, "")
        .replace(/^1\. /, ""),
    );
  if (has("asymmetric-prominence") || has("nudging"))
    recs.push(
      tt(locale, "REC_VISUAL_ASYMMETRY")
        .replace(/^1\. \*\*(.+?)\*\*\s*/, "")
        .replace(/^1\. /, ""),
    );
  if (has("auto-consent"))
    recs.push(
      tt(locale, "REC_AUTO_CONSENT")
        .replace(/^1\. \*\*(.+?)\*\*\s*/, "")
        .replace(/^1\. /, ""),
    );
  if (has("missing-info"))
    recs.push(
      tt(locale, "REC_MISSING_INFO")
        .replace(/^1\. \*\*(.+?)\*\*\s*:\s*/, "")
        .replace(/^1\. /, ""),
    );
  if (result.cookiesAfterReject.filter((c) => c.requiresConsent).length > 0)
    recs.push(
      tt(locale, "REC_PERSIST_AFTER_REJECT")
        .replace(/^1\. \*\*(.+?)\*\*\s*/, "")
        .replace(/^1\. /, ""),
    );

  if (recs.length === 0) {
    return `<div class="section">
  <div class="section-header"><h2>${tt(locale, "HTML_RECOMMENDATIONS")}</h2></div>
  <div class="section-body">
    <div class="no-issues">✓ ${tt(locale, "HTML_NO_REC")}</div>
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
  <div class="section-header"><h2>${tt(locale, "HTML_RECOMMENDATIONS")}</h2><span class="count-badge">${recs.length}</span></div>
  <div class="section-body">
    <ul class="rec-list">${items}</ul>
  </div>
</div>`;
}

// ── Checklist ─────────────────────────────────────────────────────────────────

function buildChecklistSection(result: ScanResult, locale: Locale): string {
  const { modal, compliance } = result;
  const { issues } = compliance;
  const hasIssue = (type: string) => issues.some((i) => i.type === type);

  type Row = { category: string; rule: string; status: "ok" | "ko" | "warn"; detail: string };
  const rows: Row[] = [];

  const push = (category: string, rule: string, status: "ok" | "ko" | "warn", detail: string) =>
    rows.push({ category, rule, status, detail });

  push(
    tt(locale, "CHECKLIST_CAT_CONSENT"),
    tt(locale, "CHECKLIST_RULE_MODAL_DETECTED"),
    modal.detected ? "ok" : "ko",
    modal.detected
      ? `${tt(locale, "HTML_DETECTED")} (${modal.selector})`
      : tt(locale, "DETAIL_NO_CONSENT_BANNER"),
  );

  const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);
  push(
    tt(locale, "CHECKLIST_CAT_CONSENT"),
    tt(locale, "CHECKLIST_RULE_NO_PRE_TICKED"),
    preTicked.length === 0 ? "ok" : "ko",
    preTicked.length === 0
      ? tt(locale, "DETAIL_NO_PRE_TICKED")
      : `${preTicked.length} ${tt(locale, "HTML_PRE_TICKED").toLowerCase()}`,
  );

  push(
    tt(locale, "CHECKLIST_CAT_CONSENT"),
    tt(locale, "CHECKLIST_RULE_ACCEPT_LABEL"),
    !modal.detected || !hasIssue("misleading-wording") ? "ok" : "warn",
    modal.buttons.find((b) => b.type === "accept")?.text ?? tt(locale, "HTML_NO_ACCEPT_BTN"),
  );

  push(
    tt(locale, "CHECKLIST_CAT_EASY_REFUSAL"),
    tt(locale, "CHECKLIST_RULE_REJECT_BTN"),
    !modal.detected
      ? "ko"
      : hasIssue("no-reject-button") || hasIssue("buried-reject")
        ? "ko"
        : "ok",
    modal.buttons.find((b) => b.type === "reject")?.text ?? tt(locale, "DETAIL_NO_REJECT_FIRST"),
  );

  push(
    tt(locale, "CHECKLIST_CAT_EASY_REFUSAL"),
    tt(locale, "HTML_REJECT_AT_FIRST"),
    !modal.detected ? "ko" : hasIssue("click-asymmetry") ? "ko" : "ok",
    (() => {
      const a = modal.buttons.find((b) => b.type === "accept");
      const r = modal.buttons.find((b) => b.type === "reject");
      return a && r
        ? `Accept: ${a.clickDepth} · Reject: ${r.clickDepth}`
        : tt(locale, "HTML_CANNOT_VERIFY");
    })(),
  );

  push(
    tt(locale, "CHECKLIST_CAT_EASY_REFUSAL"),
    tt(locale, "CHECKLIST_RULE_SIZE_SYMMETRY"),
    !modal.detected ? "ko" : hasIssue("asymmetric-prominence") ? "warn" : "ok",
    hasIssue("asymmetric-prominence")
      ? tt(locale, "HTML_ACCEPT_LARGER")
      : tt(locale, "HTML_COMPARABLE_SIZES"),
  );

  push(
    tt(locale, "CHECKLIST_CAT_TRANSPARENCY"),
    tt(locale, "CHECKLIST_RULE_GRANULAR"),
    !modal.detected ? "ko" : modal.hasGranularControls ? "ok" : "warn",
    modal.hasGranularControls
      ? tt(locale, "HTML_CONTROLS_DETECTED", { count: modal.checkboxes.length })
      : tt(locale, "HTML_NO_GRANULAR"),
  );

  push(
    tt(locale, "CHECKLIST_CAT_TRANSPARENCY"),
    tt(locale, "CHECKLIST_RULE_PRIVACY_MODAL"),
    !modal.detected ? "ko" : modal.privacyPolicyUrl ? "ok" : "warn",
    modal.privacyPolicyUrl ?? tt(locale, "DETAIL_NO_PRIVACY_MODAL"),
  );

  push(
    tt(locale, "CHECKLIST_CAT_TRANSPARENCY"),
    tt(locale, "CHECKLIST_RULE_PRIVACY_PAGE"),
    result.privacyPolicyUrl ? "ok" : "warn",
    result.privacyPolicyUrl ?? tt(locale, "DETAIL_NO_PRIVACY_PAGE"),
  );

  const illegalPre = result.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
  push(
    tt(locale, "CHECKLIST_CAT_COOKIE_BEHAVIOR"),
    tt(locale, "CHECKLIST_RULE_NO_PRE_COOKIES"),
    illegalPre.length === 0 ? "ok" : "ko",
    illegalPre.length === 0
      ? tt(locale, "HTML_NONE")
      : `${illegalPre.length}: ${illegalPre.map((c) => c.name).join(", ")}`,
  );

  const persistAfterReject = result.cookiesAfterReject.filter(
    (c) => c.requiresConsent && c.capturedAt === "after-reject",
  );
  push(
    tt(locale, "CHECKLIST_CAT_COOKIE_BEHAVIOR"),
    tt(locale, "CHECKLIST_RULE_COOKIES_REMOVED"),
    persistAfterReject.length === 0 ? "ok" : "ko",
    persistAfterReject.length === 0
      ? tt(locale, "HTML_CORRECTLY_REMOVED")
      : `${persistAfterReject.length} ${tt(locale, "DETAIL_PERSIST", { count: persistAfterReject.length, names: "" }).split(":")[0].trim()}`,
  );

  const preTrackers = result.networkBeforeInteraction.filter(
    (r) => r.trackerCategory !== null && r.trackerCategory !== "cdn",
  );
  push(
    tt(locale, "CHECKLIST_CAT_COOKIE_BEHAVIOR"),
    tt(locale, "CHECKLIST_RULE_NO_TRACKERS"),
    preTrackers.length === 0 ? "ok" : "ko",
    preTrackers.length === 0
      ? tt(locale, "HTML_NONE")
      : `${preTrackers.length} ${tt(locale, "NETWORK_TRACKERS_COUNT", { count: preTrackers.length }).toLowerCase()}`,
  );

  const categories = [...new Set(rows.map((r) => r.category))];
  const okCount = rows.filter((r) => r.status === "ok").length;
  const koCount = rows.filter((r) => r.status === "ko").length;
  const warnCount = rows.filter((r) => r.status === "warn").length;

  const stripLeadingEmoji = (s: string) => s.replace(/^[\p{Emoji}]\s*/u, "");
  const statusCell = (status: "ok" | "ko" | "warn") =>
    status === "ok"
      ? `<span class="status-ok">✓ ${stripLeadingEmoji(tt(locale, "CHECKLIST_STATUS_OK"))}</span>`
      : status === "ko"
        ? `<span class="status-ko">✗ ${stripLeadingEmoji(tt(locale, "CHECKLIST_STATUS_KO"))}</span>`
        : `<span class="status-warn">⚠ ${stripLeadingEmoji(tt(locale, "CHECKLIST_STATUS_WARN"))}</span>`;

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
  const rulesLabel = tt(locale, "HTML_RULES_COUNT", { count: totalRules });

  return `<div class="section">
  <div class="section-header">
    <h2>${tt(locale, "HTML_COMPLIANCE_CHECKLIST")}</h2>
    <span class="count-badge">${rulesLabel}</span>
    <span class="badge badge-ok">${okCount} ✓</span>
    <span class="badge badge-critical">${koCount} ✗</span>
    ${warnCount > 0 ? `<span class="badge badge-warning">${warnCount} ⚠</span>` : ""}
  </div>
  <div class="section-body no-pad">
    <table class="data-table">
      <thead><tr><th>${tt(locale, "CHECKLIST_CAT_CONSENT").split(" ")[0]}</th><th>${tt(locale, "CHECKLIST_RULE")}</th><th>${tt(locale, "CHECKLIST_STATUS")}</th><th>${tt(locale, "CHECKLIST_DETAIL")}</th></tr></thead>
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
