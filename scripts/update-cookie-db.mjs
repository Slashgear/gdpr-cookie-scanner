import { writeFileSync } from "node:fs";

const url =
  "https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/master/open-cookie-database.json";

const data = await fetch(url).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r.text();
});

const parsed = JSON.parse(data);
const count = Object.values(parsed).flat().length;

writeFileSync("src/data/open-cookie-database.json", data, "utf-8");
console.log(`✔ Open Cookie Database updated — ${count} entries`);
