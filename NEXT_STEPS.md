# Next steps

Ideas and improvement areas for `gdpr-cookie-scanner`. Not a roadmap — pick what matters most.

---

## Bug fixes / quick wins

- **Hex & named colour support in contrast ratio parser** — `computeContrastRatio` only handles `rgba?()` strings (parsed via regex in `consent-modal.ts:329`). Named colours (`white`, `black`) and hex values (`#fff`) silently return `null`, causing false negatives in the easy-refusal contrast check.

- **Button text matching is whitespace-sensitive** — `classifyButtonType` calls `.trim()` but embedded line breaks or `&nbsp;` characters (common in CMP HTML) can still break the regex. Worth normalising whitespace fully before matching.

- **Cookie value truncation is silent** — values are truncated to 100 chars (`cookies.ts:19`) with no indication in the output. Add an `isTruncated` flag to `ScannedCookie` so reports can flag it.

---

## Dark pattern detection gaps

Patterns that are explicitly listed in CNIL/EDPB guidelines but not yet detected:

- **Cookie wall** — detect when the page content is blurred, hidden, or inaccessible before consent is given. Requires comparing DOM structure / visible content area before and after interaction.

- **Colour nudging** — accept button in green / reject button in grey or red is a documented dark pattern. Detect hue of each button's background colour and flag when accept is visually "positive" (green hue) and reject is "negative" (grey or red hue). Deduct from `easyRefusal`.

- **Scroll- or navigation-as-consent** — some sites display a banner and treat scrolling as acceptance. Would require simulating a scroll event and checking whether the banner disappears without an explicit click.

- **Bundled opt-outs** — some CMPs only provide "reject analytics + marketing" as a single checkbox rather than granular controls. Could be inferred from `hasGranularControls` combined with a single reject-all path.

- **Legitimate interest abuse** — sites often declare legitimate interest for purposes 2–10 (advertising, profiling), bypassing consent entirely. When TCF is detected, flag when `purposesLegitimateInterest` includes ad-related IAB purposes (2, 3, 4, 7, 8, 9, 10).

- **Consent fatigue / re-prompting** — detect if the consent banner reappears on page reload after rejection. Requires a 5th scan phase: reload after reject and check for modal re-appearance.

---

## Scanner robustness

- **Configurable wait times** — the `waitForTimeout(2000)` / `waitForTimeout(3000)` values in `scanner/index.ts` are hardcoded. Some pages need more time (heavy SPAs); others waste time. Expose them as `ScanOptions` fields with sensible defaults.

- **Multi-page scanning** — run the scan across several URLs of the same domain (home page + one inner page) and merge results. Useful for detecting banners that only appear on the first visit, or trackers that fire on specific pages.

- **Batch mode** — accept a list of URLs (file or `--url` repeated) and produce a summary report alongside individual reports. Useful for agencies auditing multiple client sites.

- **Firefox / WebKit** — Playwright supports both. Firefox in particular is relevant because some CMPs behave differently across engines. A `--browser chromium|firefox|webkit` flag would be low-effort to wire up.

- **Screenshot capture** — capture a screenshot of the consent modal at detection time and embed it in the HTML report as visual evidence. Useful for audit trails and regulatory submissions.

---

## Tracker & cookie classification

- **Tracker database size** — the hardcoded list (`src/classifiers/tracker-list.ts`) currently has ~55 entries. The monthly auto-update workflow merges Disconnect.me and DuckDuckGo Tracker Radar entries but the result needs review before merge. Consider auto-approving updates that only add entries (no removals or category changes).

---

## Report improvements

- **JSON output format** — export the full `ScanResult` as a `gdpr-report-*.json` file. Enables programmatic consumption in CI pipelines, dashboards, and historical comparisons without parsing Markdown or HTML.

- **CMP fingerprinting** — identify which CMP is in use (OneTrust, Didomi, Axeptio, Cookiebot, TrustArc, Usercentrics…) from script URLs, global objects (`window.Didomi`, `window.OneTrust`…), or CSS class names. Enrich the report and correlate compliance scores with specific vendors.

- **Report localisation** — recommendations and section headings are hardcoded in French even when `--locale en-US` is used. The report language should follow `--locale`.

- **Historical comparison** — if a previous JSON report for the same hostname exists in the output directory, surface a diff (score delta, issues resolved/introduced). Useful for tracking progress over time.

- **TCF consent string cross-check** — after rejection, re-read the TCF consent string and verify `purposesConsent` is empty. Currently we capture the string before interaction only; a mismatch between the declared rejection and a non-empty consent string would be a critical finding.

---

## Website (`docs/`)

The site is served as GitHub Pages from the `docs/` directory. Reports and cards are maintained manually.

- **HTML reports on the site** — generate `.html` reports into `docs/reports/<host>/` and point the "Live Reports" cards directly at the GitHub Pages URL instead of GitHub's Markdown renderer. Visitors stay on the site and get the full styled report experience.

- **Per-report `<title>` and `<meta description>`** — each HTML report should carry a specific page title (`"github.com — Grade F (15/100) | gdpr-cookie-scanner"`) and a meta description summarising the scan result. Currently the generator uses a generic title.

- **Open Graph / Twitter Card tags** — add `og:title`, `og:description`, `og:url` (and ideally `og:image` with a grade badge) to each report page so social shares display a meaningful preview card.

- **`sitemap.xml`** — auto-generated file listing the home page + every report page. Critical for search engine discovery of individual report pages. Can be a simple script that reads `docs/reports/` and writes the XML.

- **JSON-LD structured data** — `SoftwareApplication` schema on the home page; a `Dataset` or `Article` schema on each report page with `name`, `url`, `datePublished`, and a custom `score` property. Enables Google rich snippets.

- **`robots.txt`** — confirm (or add) a `robots.txt` that allows full crawling of `docs/` including report sub-directories.

- **Screenshots in the HTML report** — `after-reject.png` and `after-accept.png` are already captured alongside each report. Embedding them in the HTML report as visual evidence would make reports significantly more compelling.

- **Fix outdated copy** — the "What it checks" feature card still says "3 Markdown reports". Update to reflect the current single-file output and the HTML format.

- **"Submit a site" workflow** — a GitHub Issues template that lets users request a scan. A workflow picks it up, runs the scanner, commits the HTML report to `docs/reports/`, and posts a link back in the issue.

- **Dark mode** — `style.css` has no `@media (prefers-color-scheme: dark)` support. The design is simple enough that adding a dark palette would be straightforward.

---

## Testing

- **Report output tests** — no tests currently validate the content of generated Markdown, HTML, or JSON files. Add snapshot tests for at least the JSON output and spot-checks for key sections in HTML.

---

## Infrastructure

- **Pre-built GitHub Action** — a dedicated `uses: slashgear/gdpr-cookie-scanner-action@v1` action would make the GitHub Actions integration one step instead of running the Docker container manually. The action wrapper would handle artifact upload and PR comments automatically.
