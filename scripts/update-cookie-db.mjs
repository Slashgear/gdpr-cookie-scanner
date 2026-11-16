import { writeFileSync } from "node:fs";

const url =
  "https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/master/open-cookie-database.json";

const data = await fetch(url).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r.text();
});

const parsed = JSON.parse(data);
const count = Object.values(parsed).flat().length;

// Re-serialize with a stable layout (2-space indent, trailing newline) so the
// diff only reflects real upstream changes, not formatting differences.
writeFileSync(
  "src/data/open-cookie-database.json",
  `${JSON.stringify(parsed, null, 2)}\n`,
  "utf-8",
);
console.log(`✔ Open Cookie Database updated — ${count} entries`);
