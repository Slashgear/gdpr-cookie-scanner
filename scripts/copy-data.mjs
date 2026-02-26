import { cpSync } from "node:fs";

cpSync("src/data", "dist/data", { recursive: true });
console.log("✔ src/data → dist/data");
