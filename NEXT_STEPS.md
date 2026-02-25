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

- **Colour nudging** — accept button in green / reject button in grey or red is a documented dark pattern. Detect hue of each button's background colour and flag when accept is visually "positive" and reject is "negative".

- **Scroll- or navigation-as-consent** — some sites display a banner and treat scrolling as acceptance. Would require simulating a scroll event and checking whether the banner disappears without an explicit click.

- **Bundled opt-outs** — some CMPs only provide "reject analytics + marketing" as a single checkbox rather than granular controls. Could be inferred from `hasGranularControls` combined with a single reject-all path.

- **Consent fatigue / re-prompting** — detecting a banner reappearing on the next page load after rejection is hard without multi-page scanning, but worth exploring.

---

## Scanner robustness

- **Configurable wait times** — the `waitForTimeout(2000)` / `waitForTimeout(3000)` values in `scanner/index.ts` are hardcoded. Some pages need more time (heavy SPAs); others waste time. Expose them as `ScanOptions` fields with sensible defaults.

- **Multi-page scanning** — run the scan across several URLs of the same domain (home page + one inner page) and merge results. Useful for detecting banners that only appear on the first visit, or trackers that fire on specific pages.

- **Batch mode** — accept a list of URLs (file or `--url` repeated) and produce a summary report alongside individual reports. Useful for agencies auditing multiple client sites.

- **Firefox / WebKit** — Playwright supports both. Firefox in particular is relevant because some CMPs behave differently across engines. A `--browser chromium|firefox|webkit` flag would be low-effort to wire up.

---

## Tracker & cookie classification

- **Tracker database size** — the hardcoded list (`src/classifiers/tracker-list.ts`) currently has ~55 entries. The monthly auto-update workflow merges Disconnect.me and DuckDuckGo Tracker Radar entries but the result needs review before merge. Consider auto-approving updates that only add entries (no removals or category changes).

---

## Report improvements

- **Single-file Markdown** — the current 3-file split (report + checklist + inventory) is logical but awkward to share or attach in a ticket. An optional `--merge-md` flag that concatenates the three files would help.

- **Report localisation** — recommendations and section headings are hardcoded in French even when `--locale en-US` is used. The report language should follow `--locale`.

- **Historical comparison** — if a previous JSON report for the same hostname exists in the output directory, surface a diff (score delta, issues resolved/introduced). Useful for tracking progress over time.

---

## Testing

- **Report output tests** — no tests currently validate the content of generated Markdown, HTML, or JSON files. Add snapshot tests for at least the JSON output and spot-checks for key sections in HTML.

---

## Infrastructure

- **Pre-built GitHub Action** — a dedicated `uses: slashgear/gdpr-cookie-scanner-action@v1` action would make the GitHub Actions integration one step instead of running the Docker container manually. The action wrapper would handle artifact upload and PR comments automatically.
