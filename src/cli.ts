#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { join, resolve } from "path";
import { Scanner } from "./scanner/index.js";
import { ReportGenerator } from "./report/generator.js";
import type { ScanOptions, ReportFormat } from "./types.js";

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
  .option("--no-screenshots", "Disable screenshot capture")
  .option("-l, --locale <locale>", "Browser locale for language detection", "fr-FR")
  .option("-v, --verbose", "Show detailed output", false)
  .option(
    "-f, --format <formats>",
    "Output formats: md, html, json, pdf (comma-separated)",
    "md,pdf",
  )
  .action(async (url: string, opts) => {
    console.log();
    console.log(chalk.bold.blue("  GDPR Cookie Scanner"));
    console.log(chalk.gray("  ─────────────────────────────────────"));
    const normalizedUrl = normalizeUrl(url);
    const hostname = new URL(normalizedUrl).hostname;
    const outputDir = join(resolve(opts.output), hostname);

    console.log(chalk.gray(`  Target : ${url}`));
    console.log(chalk.gray(`  Output : ${outputDir}`));
    console.log();

    const validFormats = new Set<ReportFormat>(["md", "html", "json", "pdf"]);
    const formats = (opts.format as string)
      .split(",")
      .map((f) => f.trim().toLowerCase())
      .filter((f): f is ReportFormat => validFormats.has(f as ReportFormat));

    if (formats.length === 0) {
      console.error(chalk.red("  Invalid --format value. Valid options: md, html, json, pdf"));
      process.exit(2);
    }

    const options: ScanOptions = {
      url: normalizedUrl,
      outputDir,
      timeout: parseInt(opts.timeout, 10),
      screenshots: opts.screenshots !== false,
      locale: opts.locale,
      verbose: opts.verbose,
      formats,
    };

    const spinner = ora("Launching browser...").start();

    try {
      const scanner = new Scanner(options);

      spinner.text = "Loading page (before interaction)...";
      const result = await scanner.run((phase) => {
        spinner.text = phase;
      });

      spinner.succeed("Scan complete");
      console.log();

      const generator = new ReportGenerator(options);
      const paths = await generator.generate(result);

      console.log(
        chalk.bold(
          `  Compliance score: ${formatScore(result.compliance.total)} ${result.compliance.grade}`,
        ),
      );
      console.log();

      if (result.compliance.issues.length > 0) {
        console.log(chalk.yellow(`  ${result.compliance.issues.length} issue(s) detected:`));
        for (const issue of result.compliance.issues.slice(0, 5)) {
          const icon = issue.severity === "critical" ? chalk.red("✗") : chalk.yellow("⚠");
          console.log(`    ${icon} ${issue.description}`);
        }
        if (result.compliance.issues.length > 5) {
          console.log(
            chalk.gray(`    ... and ${result.compliance.issues.length - 5} more (see report)`),
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
        console.log(chalk.green(`  ${(labels[fmt] ?? fmt).padEnd(8)} ${path}`));
      }
      console.log();

      process.exit(result.compliance.grade === "F" ? 1 : 0);
    } catch (err) {
      spinner.fail("Scan failed");
      console.error(chalk.red(`\n  Error: ${err instanceof Error ? err.message : String(err)}`));
      if (opts.verbose && err instanceof Error && err.stack) {
        console.error(chalk.gray(err.stack));
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
    console.log(chalk.bold("\n  Built-in tracker database:"));
    for (const [cat, count] of categories.entries()) {
      console.log(`    ${chalk.cyan(cat.padEnd(20))} ${count} domains`);
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

function formatScore(score: number): string {
  const colored =
    score >= 80
      ? chalk.green(score)
      : score >= 60
        ? chalk.yellow(score)
        : score >= 40
          ? chalk.hex("#FFA500")(score)
          : chalk.red(score);
  return `${colored}/100`;
}
