import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { securityHeaders } from "./security.js";

const app = new Hono();

app.use("/*", securityHeaders);
app.use("/*", serveStatic({ root: "./public", precompressed: true }));

const port = Number(process.env.PORT) || 8080;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});
