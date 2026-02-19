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
    const scanDate = new Date(r.scanDate).toLocaleString("fr-FR");
    const durationSec = (r.duration / 1000).toFixed(1);
    const grade = r.compliance.grade;
    const score = r.compliance.total;

    const gradeEmoji = grade === "A" ? "🟢" : grade === "B" ? "🟡" : grade === "C" ? "🟠" : "🔴";

    const sections: string[] = [];

    // ── Header ────────────────────────────────────────────────────
    sections.push(`# Rapport de conformité RGPD — ${hostname}`);
    sections.push(`
> **Date du scan :** ${scanDate}
> **URL analysée :** ${r.url}
> **Durée du scan :** ${durationSec}s
> **Outil :** gdpr-cookie-scanner v0.1.0
`);

    // ── Score global ──────────────────────────────────────────────
    sections.push(`## Score de conformité global\n`);
    sections.push(`### ${gradeEmoji} ${score}/100 — Note ${grade}\n`);
    sections.push(this.buildScoreTable(r));

    // ── Résumé exécutif ───────────────────────────────────────────
    sections.push(`## Résumé exécutif\n`);
    sections.push(this.buildExecutiveSummary(r));

    // ── Modale de consentement ────────────────────────────────────
    sections.push(`## 1. Modale de consentement\n`);
    sections.push(this.buildModalSection(r));

    // ── Dark patterns ─────────────────────────────────────────────
    sections.push(`## 2. Dark patterns et problèmes détectés\n`);
    sections.push(this.buildIssuesSection(r.compliance.issues));

    // ── Cookies avant interaction ─────────────────────────────────
    sections.push(`## 3. Cookies déposés avant toute interaction\n`);
    sections.push(this.buildCookiesTable(r.cookiesBeforeInteraction, "before-interaction"));

    // ── Cookies après refus ───────────────────────────────────────
    sections.push(`## 4. Cookies après refus du consentement\n`);
    sections.push(this.buildCookiesAfterRejectSection(r));

    // ── Cookies après acceptation ─────────────────────────────────
    sections.push(`## 5. Cookies après acceptation du consentement\n`);
    sections.push(this.buildCookiesTable(r.cookiesAfterAccept, "after-accept"));

    // ── Requêtes réseau suspectes ─────────────────────────────────
    sections.push(`## 6. Requêtes réseau — trackers détectés\n`);
    sections.push(this.buildNetworkSection(r));

    // ── Recommandations ───────────────────────────────────────────
    sections.push(`## 7. Recommandations\n`);
    sections.push(this.buildRecommendations(r));

    // ── Erreurs de scan ───────────────────────────────────────────
    if (r.errors.length > 0) {
      sections.push(`## Erreurs et avertissements du scan\n`);
      sections.push(r.errors.map((e) => `- ⚠️ ${e}`).join("\n"));
    }

    // ── Références légales ────────────────────────────────────────
    sections.push(`## Références légales\n`);
    sections.push(`
- **RGPD Art. 7** — Conditions applicables au consentement
- **RGPD Considérant 32** — Le consentement doit résulter d'une action positive univoque
- **Directive ePrivacy 2002/58/CE** — Obligation de consentement pour les cookies non essentiels
- **Lignes directrices CEPD 05/2020** — Consentement au sens du RGPD
- **Lignes directrices CEPD 03/2022** — Dark patterns sur les plateformes
- **Recommandation CNIL 2022** — Refus aussi facile qu'accepter (même nombre de clics)
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

    return `| Critère | Score | Progression | Statut |
|---------|-------|-------------|--------|
${row("Validité du consentement", breakdown.consentValidity, 25)}
${row("Facilité de refus", breakdown.easyRefusal, 25)}
${row("Transparence", breakdown.transparency, 25)}
${row("Comportement des cookies", breakdown.cookieBehavior, 25)}
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
        "❌ **Aucune modale de consentement détectée.** Le site dépose des cookies sans demander le consentement.",
      );
    } else {
      lines.push(`✅ Modale de consentement détectée (\`${r.modal.selector}\`).`);
    }

    if (illegalPreCookies.length > 0) {
      lines.push(
        `❌ **${illegalPreCookies.length} cookie(s) non essentiels** déposés avant toute interaction (violation RGPD).`,
      );
    } else {
      lines.push("✅ Aucun cookie non essentiel déposé avant interaction.");
    }

    if (persistAfterReject.length > 0) {
      lines.push(
        `❌ **${persistAfterReject.length} cookie(s) non essentiels** persistent après refus (violation RGPD).`,
      );
    } else {
      lines.push("✅ Les cookies non essentiels sont correctement supprimés après refus.");
    }

    if (preInteractionTrackers.length > 0) {
      lines.push(
        `❌ **${preInteractionTrackers.length} requête(s) trackers** émises avant consentement.`,
      );
    } else {
      lines.push("✅ Aucune requête tracker avant consentement.");
    }

    lines.push(
      `\n**${criticalCount} problème(s) critique(s)** et **${warningCount} avertissement(s)** identifiés.`,
    );

    return lines.join("\n");
  }

  private buildModalSection(r: ScanResult): string {
    if (!r.modal.detected) {
      return "_Aucune modale de consentement détectée sur la page._\n";
    }

    const { modal } = r;
    const acceptBtn = modal.buttons.find((b) => b.type === "accept");
    const rejectBtn = modal.buttons.find((b) => b.type === "reject");
    const prefBtn = modal.buttons.find((b) => b.type === "preferences");

    const preTicked = modal.checkboxes.filter((c) => c.isCheckedByDefault);

    const lines: string[] = [
      `**Sélecteur CSS :** \`${modal.selector}\``,
      `**Contrôles granulaires :** ${modal.hasGranularControls ? "✅ Oui" : "❌ Non"}`,
      `**Nombre de couches :** ${modal.layerCount}`,
      "",
      "### Boutons détectés",
      "",
      "| Bouton | Texte | Visible | Taille police | Ratio contraste |",
      "|--------|-------|---------|---------------|-----------------|",
      ...modal.buttons.map((b) => this.buildButtonRow(b)),
      "",
    ];

    if (acceptBtn && rejectBtn) {
      lines.push("### Analyse comparative Accept / Refuser\n");
      if (
        acceptBtn.fontSize &&
        rejectBtn.fontSize &&
        acceptBtn.fontSize > rejectBtn.fontSize * 1.2
      ) {
        lines.push(
          `⚠️ Le bouton **Accepter** (${acceptBtn.fontSize}px) est plus grand que **Refuser** (${rejectBtn.fontSize}px).`,
        );
      } else {
        lines.push("✅ Taille des boutons Accepter / Refuser comparable.");
      }

      const acceptArea = acceptBtn.boundingBox
        ? acceptBtn.boundingBox.width * acceptBtn.boundingBox.height
        : 0;
      const rejectArea = rejectBtn.boundingBox
        ? rejectBtn.boundingBox.width * rejectBtn.boundingBox.height
        : 0;
      if (acceptArea > rejectArea * 2) {
        lines.push(
          `⚠️ Surface du bouton **Accepter** (${Math.round(acceptArea)}px²) bien supérieure à **Refuser** (${Math.round(rejectArea)}px²).`,
        );
      }
    }

    if (preTicked.length > 0) {
      lines.push("\n### Cases pré-cochées (violation RGPD)\n");
      lines.push("| Nom | Label |");
      lines.push("|-----|-------|");
      for (const cb of preTicked) {
        lines.push(`| \`${cb.name}\` | ${cb.label} |`);
      }
    }

    if (modal.screenshotPath) {
      lines.push(`\n### Capture d'écran\n`);
      lines.push(`![Modale de consentement](${basename(modal.screenshotPath)})`);
    }

    lines.push("\n### Extrait du texte de la modale\n");
    lines.push(`> ${modal.text.substring(0, 500)}${modal.text.length > 500 ? "..." : ""}`);

    return lines.join("\n");
  }

  private buildButtonRow(b: ConsentButton): string {
    const visible = b.isVisible ? "✅" : "❌";
    const fontSize = b.fontSize ? `${b.fontSize}px` : "—";
    const contrast = b.contrastRatio !== null ? `${b.contrastRatio}:1` : "—";
    const typeLabel = {
      accept: "🟢 Accepter",
      reject: "🔴 Refuser",
      preferences: "⚙️ Paramètres",
      close: "✕ Fermer",
      unknown: "❓ Inconnu",
    }[b.type];
    return `| ${typeLabel} | ${b.text.substring(0, 30)} | ${visible} | ${fontSize} | ${contrast} |`;
  }

  private buildIssuesSection(issues: DarkPatternIssue[]): string {
    if (issues.length === 0) {
      return "✅ Aucun dark pattern ou problème de conformité détecté.\n";
    }

    const critical = issues.filter((i) => i.severity === "critical");
    const warnings = issues.filter((i) => i.severity === "warning");
    const infos = issues.filter((i) => i.severity === "info");

    const lines: string[] = [];

    if (critical.length > 0) {
      lines.push("### ❌ Problèmes critiques\n");
      for (const issue of critical) {
        lines.push(`**${issue.description}**`);
        lines.push(`> ${issue.evidence}\n`);
      }
    }

    if (warnings.length > 0) {
      lines.push("### ⚠️ Avertissements\n");
      for (const issue of warnings) {
        lines.push(`**${issue.description}**`);
        lines.push(`> ${issue.evidence}\n`);
      }
    }

    if (infos.length > 0) {
      lines.push("### ℹ️ Informations\n");
      for (const issue of infos) {
        lines.push(`- ${issue.description}`);
      }
    }

    return lines.join("\n");
  }

  private buildCookiesTable(cookies: ScannedCookie[], phase: ScannedCookie["capturedAt"]): string {
    const filtered = cookies.filter((c) => c.capturedAt === phase);

    if (filtered.length === 0) {
      return "_Aucun cookie détecté._\n";
    }

    const consent = (c: ScannedCookie) => (c.requiresConsent ? "⚠️ Oui" : "✅ Non");

    const expires = (c: ScannedCookie) => {
      if (c.expires === null) return "Session";
      const days = Math.round((c.expires * 1000 - Date.now()) / 86400000);
      if (days < 0) return "Expiré";
      if (days === 0) return "< 1 jour";
      if (days < 30) return `${days} jours`;
      return `${Math.round(days / 30)} mois`;
    };

    const rows = filtered.map(
      (c) => `| \`${c.name}\` | ${c.domain} | ${c.category} | ${expires(c)} | ${consent(c)} |`,
    );

    return `| Nom | Domaine | Catégorie | Expiration | Consentement requis |
|-----|---------|-----------|------------|---------------------|
${rows.join("\n")}
`;
  }

  private buildCookiesAfterRejectSection(r: ScanResult): string {
    const afterReject = r.cookiesAfterReject.filter((c) => c.capturedAt === "after-reject");
    const violating = afterReject.filter((c) => c.requiresConsent);

    const lines: string[] = [];

    if (violating.length > 0) {
      lines.push(`❌ **${violating.length} cookie(s) non essentiels** détectés après refus :\n`);
    } else {
      lines.push("✅ Aucun cookie non essentiel détecté après refus.\n");
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
      return "_Aucun tracker réseau connu détecté._\n";
    }

    const phases: Array<{ label: string; requests: NetworkRequest[] }> = [
      {
        label: "Avant interaction",
        requests: r.networkBeforeInteraction.filter((r) => r.trackerCategory !== null),
      },
      {
        label: "Après acceptation",
        requests: r.networkAfterAccept.filter((r) => r.trackerCategory !== null),
      },
      {
        label: "Après refus",
        requests: r.networkAfterReject.filter((r) => r.trackerCategory !== null),
      },
    ];

    const lines: string[] = [];

    for (const { label, requests } of phases) {
      if (requests.length === 0) continue;
      lines.push(`### ${label} (${requests.length} tracker(s))\n`);
      lines.push("| Tracker | Catégorie | URL | Type |");
      lines.push("|---------|-----------|-----|------|");
      for (const req of requests.slice(0, 20)) {
        const url = req.url.length > 60 ? req.url.substring(0, 57) + "..." : req.url;
        lines.push(
          `| ${req.trackerName ?? "Inconnu"} | ${req.trackerCategory} | \`${url}\` | ${req.resourceType} |`,
        );
      }
      if (requests.length > 20) {
        lines.push(`\n_... et ${requests.length - 20} requête(s) supplémentaires._`);
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
        "1. **Mettre en place une solution CMP** (ex. Axeptio, Didomi, OneTrust, Cookiebot) affichant une modale de consentement avant tout cookie non essentiel.",
      );
    }

    if (issues.some((i) => i.type === "pre-ticked")) {
      recs.push(
        "1. **Supprimer les cases pré-cochées.** Le consentement doit résulter d'une action positive explicite (RGPD Considérant 32).",
      );
    }

    if (issues.some((i) => i.type === "no-reject-button" || i.type === "buried-reject")) {
      recs.push(
        '1. **Ajouter un bouton "Tout refuser"** au premier niveau de la modale, sans nécessiter plus de clics que "Tout accepter" (CNIL 2022).',
      );
    }

    if (issues.some((i) => i.type === "click-asymmetry")) {
      recs.push(
        "1. **Équilibrer le nombre de clics** pour accepter et refuser. Le refus ne doit pas nécessiter plus d'étapes que l'acceptation.",
      );
    }

    if (issues.some((i) => i.type === "asymmetric-prominence" || i.type === "nudging")) {
      recs.push(
        "1. **Uniformiser la mise en page** des boutons Accepter / Refuser : même taille, même couleur, même niveau de visibilité.",
      );
    }

    if (issues.some((i) => i.type === "auto-consent")) {
      recs.push(
        "1. **Ne déposer aucun cookie non essentiel avant le consentement.** Conditionner l'initialisation des scripts tiers à l'acceptation.",
      );
    }

    if (issues.some((i) => i.type === "missing-info")) {
      recs.push(
        "1. **Compléter les informations de la modale** : finalités, identité des sous-traitants, durée de conservation, droit de retrait.",
      );
    }

    if (r.cookiesAfterReject.filter((c) => c.requiresConsent).length > 0) {
      recs.push(
        "1. **Supprimer ou bloquer les cookies non essentiels** après refus, et vérifier la gestion du consentement côté serveur.",
      );
    }

    if (recs.length === 0) {
      recs.push(
        "✅ Aucune recommandation critique. Effectuez un audit régulier pour maintenir la conformité.",
      );
    }

    return recs.join("\n\n");
  }

  private buildChecklist(r: ScanResult): string {
    const hostname = new URL(r.url).hostname;
    const scanDate = new Date(r.scanDate).toLocaleString("fr-FR");
    const issues = r.compliance.issues;
    const hasIssue = (type: string) => issues.some((i) => i.type === type);
    const getIssue = (type: string) => issues.find((i) => i.type === type);

    const ok = "✅ Conforme";
    const ko = "❌ Non conforme";
    const warn = "⚠️ Avertissement";

    type Row = {
      category: string;
      rule: string;
      reference: string;
      status: string;
      detail: string;
    };

    const rows: Row[] = [];

    // ── A. Présence et validité du consentement ───────────────────
    rows.push({
      category: "Consentement",
      rule: "Modale de consentement présente",
      reference: "RGPD Art. 7 · Dir. ePrivacy Art. 5(3)",
      status: r.modal.detected ? ok : ko,
      detail: r.modal.detected
        ? `Détectée (\`${r.modal.selector}\`)`
        : "Aucune bannière de consentement détectée",
    });

    const preTicked = r.modal.checkboxes.filter((c) => c.isCheckedByDefault);
    rows.push({
      category: "Consentement",
      rule: "Aucune case pré-cochée",
      reference: "RGPD Considérant 32",
      status: preTicked.length === 0 ? ok : ko,
      detail:
        preTicked.length === 0
          ? "Aucune case pré-cochée détectée"
          : `${preTicked.length} case(s) pré-cochée(s) : ${preTicked.map((c) => c.label || c.name).join(", ")}`,
    });

    const misleadingAccept = getIssue("misleading-wording");
    const acceptBtn = r.modal.buttons.find((b) => b.type === "accept");
    rows.push({
      category: "Consentement",
      rule: "Libellé du bouton Accepter non ambigu",
      reference: "RGPD Art. 4(11)",
      status:
        !r.modal.detected || !misleadingAccept
          ? ok
          : misleadingAccept.severity === "critical"
            ? ko
            : warn,
      detail:
        !r.modal.detected
          ? "Modale non détectée"
          : acceptBtn
            ? misleadingAccept
              ? `Libellé ambigu : « ${acceptBtn.text} »`
              : `Libellé clair : « ${acceptBtn.text} »`
            : "Aucun bouton Accepter détecté",
    });

    // ── B. Facilité de refus ──────────────────────────────────────
    const rejectBtn = r.modal.buttons.find((b) => b.type === "reject");
    const noReject = hasIssue("no-reject-button") || hasIssue("buried-reject");
    rows.push({
      category: "Facilité de refus",
      rule: "Bouton Refuser présent au premier niveau",
      reference: "CNIL Recommandation 2022",
      status: !r.modal.detected ? ko : noReject ? ko : ok,
      detail: !r.modal.detected
        ? "Modale non détectée"
        : rejectBtn
          ? `Détecté : « ${rejectBtn.text} »`
          : "Aucun bouton Refuser au premier niveau",
    });

    const clickIssue = getIssue("click-asymmetry");
    rows.push({
      category: "Facilité de refus",
      rule: "Refuser ne nécessite pas plus de clics qu'Accepter",
      reference: "CNIL Recommandation 2022",
      status: !r.modal.detected ? ko : clickIssue ? ko : ok,
      detail: !r.modal.detected
        ? "Modale non détectée"
        : clickIssue
          ? clickIssue.evidence
          : acceptBtn && rejectBtn
            ? `Accepter : ${acceptBtn.clickDepth} clic(s) · Refuser : ${rejectBtn.clickDepth} clic(s)`
            : "Impossible à vérifier (boutons manquants)",
    });

    const sizeIssue = getIssue("asymmetric-prominence");
    rows.push({
      category: "Facilité de refus",
      rule: "Symétrie de taille entre Accepter et Refuser",
      reference: "CEPD Lignes directrices 03/2022",
      status: !r.modal.detected ? ko : sizeIssue ? warn : ok,
      detail: !r.modal.detected
        ? "Modale non détectée"
        : sizeIssue
          ? sizeIssue.evidence
          : "Tailles des boutons comparables",
    });

    const nudgeIssue = getIssue("nudging");
    rows.push({
      category: "Facilité de refus",
      rule: "Symétrie de police entre Accepter et Refuser",
      reference: "CEPD Lignes directrices 03/2022",
      status: !r.modal.detected ? ko : nudgeIssue ? warn : ok,
      detail: !r.modal.detected
        ? "Modale non détectée"
        : nudgeIssue
          ? nudgeIssue.evidence
          : "Taille de police comparable",
    });

    // ── C. Transparence ───────────────────────────────────────────
    rows.push({
      category: "Transparence",
      rule: "Contrôles granulaires disponibles",
      reference: "CEPD Lignes directrices 05/2020",
      status: !r.modal.detected ? ko : r.modal.hasGranularControls ? ok : warn,
      detail: !r.modal.detected
        ? "Modale non détectée"
        : r.modal.hasGranularControls
          ? `${r.modal.checkboxes.length} case(s) ou panneau de préférences détecté(s)`
          : "Aucun contrôle granulaire (cases à cocher ou panneau) détecté",
    });

    const infoChecks: Array<{ key: string; label: string; ref: string }> = [
      { key: "purposes", label: "Finalités du traitement mentionnées", ref: "RGPD Art. 13-14" },
      {
        key: "third-parties",
        label: "Sous-traitants / tiers mentionnés",
        ref: "RGPD Art. 13-14",
      },
      {
        key: "duration",
        label: "Durée de conservation mentionnée",
        ref: "RGPD Art. 13(2)(a)",
      },
      { key: "withdrawal", label: "Droit de retrait du consentement mentionné", ref: "RGPD Art. 7(3)" },
    ];

    for (const { key, label, ref } of infoChecks) {
      const missing = issues.find((i) => i.type === "missing-info" && i.description.includes(`"${key}"`));
      rows.push({
        category: "Transparence",
        rule: label,
        reference: ref,
        status: !r.modal.detected ? ko : missing ? warn : ok,
        detail: !r.modal.detected
          ? "Modale non détectée"
          : missing
            ? `Information absente du texte de la modale`
            : "Mention trouvée dans le texte de la modale",
      });
    }

    // ── D. Comportement des cookies ───────────────────────────────
    const illegalPre = r.cookiesBeforeInteraction.filter((c) => c.requiresConsent);
    rows.push({
      category: "Comportement cookies",
      rule: "Aucun cookie non essentiel avant consentement",
      reference: "RGPD Art. 7 · Dir. ePrivacy Art. 5(3)",
      status: illegalPre.length === 0 ? ok : ko,
      detail:
        illegalPre.length === 0
          ? "Aucun cookie non essentiel déposé avant interaction"
          : `${illegalPre.length} cookie(s) illégaux : ${illegalPre.map((c) => `\`${c.name}\` (${c.category})`).join(", ")}`,
    });

    const persistAfterReject = r.cookiesAfterReject.filter(
      (c) => c.requiresConsent && c.capturedAt === "after-reject",
    );
    rows.push({
      category: "Comportement cookies",
      rule: "Cookies non essentiels supprimés après refus",
      reference: "RGPD Art. 7 · CNIL Recommandation 2022",
      status: persistAfterReject.length === 0 ? ok : ko,
      detail:
        persistAfterReject.length === 0
          ? "Aucun cookie non essentiel persistant après refus"
          : `${persistAfterReject.length} cookie(s) persistent : ${persistAfterReject.map((c) => `\`${c.name}\``).join(", ")}`,
    });

    const preTrackers = r.networkBeforeInteraction.filter(
      (req) => req.trackerCategory !== null && req.trackerCategory !== "cdn",
    );
    rows.push({
      category: "Comportement cookies",
      rule: "Aucun tracker réseau avant consentement",
      reference: "RGPD Art. 7 · Dir. ePrivacy Art. 5(3)",
      status: preTrackers.length === 0 ? ok : ko,
      detail:
        preTrackers.length === 0
          ? "Aucune requête tracker émise avant interaction"
          : `${preTrackers.length} tracker(s) : ${[...new Set(preTrackers.map((r) => r.trackerName ?? r.url))].slice(0, 3).join(", ")}`,
    });

    // ── Totaux ────────────────────────────────────────────────────
    const conformeCount = rows.filter((r) => r.status === ok).length;
    const nonConformeCount = rows.filter((r) => r.status === ko).length;
    const avertissementCount = rows.filter((r) => r.status === warn).length;

    const lines: string[] = [];
    lines.push(`# Checklist de conformité RGPD — ${hostname}`);
    lines.push(`
> **Date du scan :** ${scanDate}
> **URL analysée :** ${r.url}
> **Score global :** ${r.compliance.total}/100 — Note **${r.compliance.grade}**
`);
    lines.push(
      `**${conformeCount} règle(s) conforme(s)** · **${nonConformeCount} non conforme(s)** · **${avertissementCount} avertissement(s)**\n`,
    );

    const categories = [...new Set(rows.map((r) => r.category))];
    for (const category of categories) {
      lines.push(`## ${category}\n`);
      lines.push("| Règle | Référence | Statut | Détail |");
      lines.push("|-------|-----------|--------|--------|");
      for (const row of rows.filter((r) => r.category === category)) {
        lines.push(`| ${row.rule} | ${row.reference} | ${row.status} | ${row.detail} |`);
      }
      lines.push("");
    }

    return lines.join("\n") + "\n";
  }
}
