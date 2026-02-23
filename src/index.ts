/**
 * Programmatic API for @slashgear/gdpr-cookie-scanner.
 *
 * @example
 * ```ts
 * import { scan } from '@slashgear/gdpr-cookie-scanner';
 *
 * const result = await scan('https://example.com');
 * console.log(result.compliance.grade); // 'A' | 'B' | 'C' | 'D' | 'F'
 * ```
 *
 * @example Advanced usage
 * ```ts
 * import { scan, ReportGenerator } from '@slashgear/gdpr-cookie-scanner';
 *
 * const result = await scan('https://example.com', { locale: 'fr-FR', timeout: 60_000 });
 * const generator = new ReportGenerator({ ...result, outputDir: './reports', formats: ['html'] });
 * const paths = await generator.generate(result);
 * ```
 */

export { Scanner } from "./scanner/index.js";
export { ReportGenerator } from "./report/generator.js";

// All public types
export type {
  ScanResult,
  ScanOptions,
  ComplianceScore,
  ConsentModal,
  ConsentButton,
  ConsentCheckbox,
  ScannedCookie,
  NetworkRequest,
  DarkPatternIssue,
  DarkPatternType,
  CookieCategory,
  TrackerCategory,
  ConsentButtonType,
  ReportFormat,
} from "./types.js";

import { Scanner } from "./scanner/index.js";
import type { ScanResult } from "./types.js";

/**
 * Options for the `scan()` convenience function.
 * All fields are optional — sensible defaults are applied.
 */
export interface ScanApiOptions {
  /** Browser navigation timeout in ms. Default: 30 000. */
  timeout?: number;
  /** Whether to capture screenshots. Requires `outputDir`. Default: false. */
  screenshots?: boolean;
  /** Directory where screenshots (and optionally reports) are saved. */
  outputDir?: string;
  /** Browser locale used for language detection. Default: 'en-US'. */
  locale?: string;
  /** Log verbose scanner output. Default: false. */
  verbose?: boolean;
}

/**
 * Scan a URL for GDPR cookie consent compliance.
 *
 * Returns the raw `ScanResult` without writing any file.
 * To generate reports, pass the result to `ReportGenerator`.
 *
 * @param url - Absolute URL to scan (e.g. `"https://example.com"`).
 * @param options - Optional scan configuration.
 */
export async function scan(url: string, options: ScanApiOptions = {}): Promise<ScanResult> {
  const normalizedUrl =
    url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  const scanner = new Scanner({
    url: normalizedUrl,
    timeout: options.timeout ?? 30_000,
    screenshots: options.screenshots ?? false,
    outputDir: options.outputDir,
    locale: options.locale ?? "en-US",
    verbose: options.verbose ?? false,
    formats: [],
  });

  return scanner.run();
}
