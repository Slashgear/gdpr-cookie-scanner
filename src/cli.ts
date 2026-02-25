#!/usr/bin/env node
import { Command } from "commander";
import { styleText } from "node:util";
import { createSpinner } from "nanospinner";
import { join, resolve } from "path";
import { Scanner } from "./scanner/index.js";
import { ReportGenerator } from "./report/generator.js";
import type { ScanOptions, ReportFormat, ViewportPreset } from "./types.js";

const program = new Command();

program
  .name("gdpr-scan")
  .description("Scan a website for GDPR cookie consent compliance")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a website and generate a GDPR compliance report")
  .argument("<url>", "URL of the website to scan")
  .option("-o, --output <dir>", "Output directory for the report", "./gdpr-reports")
  .option("-t, --timeout <ms>", "Navigation timeout in milliseconds", "30000")
  .option(
    "--screenshots",
    "Capture full-page screenshots after reject and accept interactions (the consent modal is always screenshotted when detected)",
  )
  .option("-l, --locale <locale>", "Browser locale for language detection", "fr-FR")
  .option("-v, --verbose", "Show detailed output", false)
  .option("-f, --format <formats>", "Output formats: md, html, json, pdf (comma-separated)", "html")
  .option(
    "--viewport <preset>",
    "Viewport preset: desktop (1280×900), tablet (768×1024), mobile (390×844)",
    "desktop",
  )
  .option(
    "--fail-on <threshold>",
    "Exit with code 1 if grade is below this letter (A/B/C/D/F) or score is below this number",
    "F",
  )
  .option(
    "--json-summary",
    "Emit a JSON summary line to stdout after the scan (machine-readable)",
    false,
  )
  .option(
    "--strict",
    "Treat unrecognised cookies and unknown third-party requests as requiring consent",
    false,
  )
  .action(async (url: string, opts) => {
    console.log();
    console.log(styleText(["bold", "blue"], "  GDPR Cookie Scanner"));
    console.log(styleText("gray", "  ─────────────────────────────────────"));
    const normalizedUrl = normalizeUrl(url);
    const hostname = new URL(normalizedUrl).hostname;
    const outputDir = join(resolve(opts.output), hostname);

    const validViewports = new Set<ViewportPreset>(["desktop", "tablet", "mobile"]);
    const viewport = (opts.viewport as string).toLowerCase();
    if (!validViewports.has(viewport as ViewportPreset)) {
      console.error(
        styleText("red", "  Invalid --viewport value. Valid options: desktop, tablet, mobile"),
      );
      process.exit(2);
    }

    console.log(styleText("gray", `  Target   : ${url}`));
    console.log(styleText("gray", `  Output   : ${outputDir}`));
    console.log(styleText("gray", `  Viewport : ${viewport}`));
    console.log();

    const validFormats = new Set<ReportFormat>(["md", "html", "json", "pdf"]);
    const formats = (opts.format as string)
      .split(",")
      .map((f) => f.trim().toLowerCase())
      .filter((f): f is ReportFormat => validFormats.has(f as ReportFormat));

    if (formats.length === 0) {
      console.error(
        styleText("red", "  Invalid --format value. Valid options: md, html, json, pdf"),
      );
      process.exit(2);
    }

    const options: ScanOptions = {
      url: normalizedUrl,
      outputDir,
      timeout: parseInt(opts.timeout, 10),
      screenshots: Boolean(opts.screenshots),
      locale: opts.locale,
      verbose: opts.verbose,
      formats,
      viewport: viewport as ViewportPreset,
      strict: opts.strict as boolean,
    };

    const spinner = createSpinner("Launching browser...").start();

    try {
      const scanner = new Scanner(options);

      spinner.update({ text: "Loading page (before interaction)..." });
      const result = await scanner.run((phase) => {
        spinner.update({ text: phase });
      });

      spinner.success({ text: "Scan complete" });
      console.log();

      const generator = new ReportGenerator(options);
      const paths = await generator.generate(result);

      console.log(
        styleText(
          "bold",
          `  Compliance score: ${formatScore(result.compliance.total)} ${result.compliance.grade}`,
        ),
      );
      console.log();

      if (result.compliance.issues.length > 0) {
        console.log(styleText("yellow", `  ${result.compliance.issues.length} issue(s) detected:`));
        for (const issue of result.compliance.issues.slice(0, 5)) {
          const icon =
            issue.severity === "critical" ? styleText("red", "✗") : styleText("yellow", "⚠");
          console.log(`    ${icon} ${issue.description}`);
        }
        if (result.compliance.issues.length > 5) {
          console.log(
            styleText(
              "gray",
              `    ... and ${result.compliance.issues.length - 5} more (see report)`,
            ),
          );
        }
        console.log();
      }

      const labels: Record<string, string> = {
        md: "Markdown",
        html: "HTML",
        json: "JSON",
        pdf: "PDF",
      };
      for (const [fmt, path] of Object.entries(paths)) {
        console.log(styleText("green", `  ${(labels[fmt] ?? fmt).padEnd(8)} ${path}`));
      }
      console.log();

      const threshold = opts.failOn as string;
      const failed = isBeforeThreshold(result.compliance.total, result.compliance.grade, threshold);
      if (failed) {
        console.log(
          styleText(
            "red",
            `  Failed threshold: score ${result.compliance.total}/100 (grade ${result.compliance.grade}) is below --fail-on ${threshold.toUpperCase()}`,
          ),
        );
        console.log();
      }

      if (opts.jsonSummary) {
        process.stdout.write(
          JSON.stringify({
            url: result.url,
            scanDate: result.scanDate,
            score: result.compliance.total,
            grade: result.compliance.grade,
            passed: !failed,
            threshold: threshold.toUpperCase(),
            breakdown: result.compliance.breakdown,
            issues: {
              total: result.compliance.issues.length,
              critical: result.compliance.issues.filter((i) => i.severity === "critical").length,
              items: result.compliance.issues.map((i) => ({
                type: i.type,
                severity: i.severity,
                description: i.description,
              })),
            },
            reportPaths: paths,
          }) + "\n",
        );
      }

      process.exit(failed ? 1 : 0);
    } catch (err) {
      spinner.error({ text: "Scan failed" });
      console.error(
        styleText("red", `\n  Error: ${err instanceof Error ? err.message : String(err)}`),
      );
      if (opts.verbose && err instanceof Error && err.stack) {
        console.error(styleText("gray", err.stack));
      }
      process.exit(2);
    }
  });

program
  .command("list-trackers")
  .description("Show the built-in tracker database summary")
  .action(async () => {
    const { TRACKER_DB } = await import("./classifiers/tracker-list.js");
    const categories = new Map<string, number>();
    for (const entry of Object.values(TRACKER_DB)) {
      const cat = entry.category;
      categories.set(cat, (categories.get(cat) ?? 0) + 1);
    }
    console.log(styleText("bold", "\n  Built-in tracker database:"));
    for (const [cat, count] of categories.entries()) {
      console.log(`    ${styleText("cyan", cat.padEnd(20))} ${count} domains`);
    }
    console.log(`\n  Total: ${Object.keys(TRACKER_DB).length} tracked domains\n`);
  });

program.parse(process.argv);

function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

const GRADE_ORDER: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };

function isBeforeThreshold(score: number, grade: string, threshold: string): boolean {
  const asNumber = Number(threshold);
  if (!Number.isNaN(asNumber)) {
    return score < asNumber;
  }
  const upper = threshold.toUpperCase();
  if (!(upper in GRADE_ORDER)) {
    console.error(
      styleText(
        "red",
        `  Invalid --fail-on value "${threshold}". Use a grade (A/B/C/D/F) or a number (0-100).`,
      ),
    );
    process.exit(2);
  }
  return (GRADE_ORDER[grade] ?? 0) < GRADE_ORDER[upper];
}

function formatScore(score: number): string {
  const colored =
    score >= 80
      ? styleText("green", String(score))
      : score >= 60
        ? styleText("yellow", String(score))
        : score >= 40
          ? styleText("yellowBright", String(score))
          : styleText("red", String(score));
  return `${colored}/100`;
}
