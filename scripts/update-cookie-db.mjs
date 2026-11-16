import { writeFileSync } from "node:fs";

const url =
  "https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/master/open-cookie-database.json";

const data = await fetch(url).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r.text();
});

const parsed = JSON.parse(data);
const count = Object.values(parsed).flat().length;

// Upstream uses 4-space indentation while the vendored copy is formatted by
// `bun fmt` (2 spaces). Writing the raw payload made every run look like a
// change, so normalise it to the repository's format before writing.
writeFileSync(
  "src/data/open-cookie-database.json",
  `${JSON.stringify(parsed, null, 2)}\n`,
  "utf-8",
);
console.log(`✔ Open Cookie Database updated — ${count} entries`);
