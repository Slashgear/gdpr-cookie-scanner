---
"@slashgear/gdpr-cookie-scanner": minor
---

feat: pre-fill cookie descriptions from Open Cookie Database and add CSV output format

Cookie reports now automatically include descriptions, platform names, retention
periods, and privacy-policy links for ~2 000+ recognised cookies, sourced from the
Open Cookie Database (Apache 2.0, vendored at `src/data/open-cookie-database.json`).

Previously the Description column in the Markdown cookie inventory was left as a
`<!-- fill in -->` placeholder. It is now pre-populated whenever the OCD contains a
matching entry (exact name or wildcard prefix), with the placeholder kept only for
unrecognised cookies.

The same enrichment is applied to the HTML report (new Description column in every
cookie table, with the platform and privacy-policy link surfaced in a tooltip) and to
the new `csv` output format (`gdpr-cookies-*.csv`), which includes all cookie
metadata plus the OCD fields in a machine-readable file suitable for DPA submissions
or spreadsheet review.

A `pnpm update:ocd` script and a monthly GitHub Actions workflow
(`.github/workflows/update-cookie-db.yml`) keep the vendored database up to date.
