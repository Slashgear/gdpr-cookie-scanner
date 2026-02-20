import { createServer } from "http";
import { readFile } from "fs/promises";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES_DIR = join(__dirname, "../e2e/fixtures");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

export interface TestServer {
  url: string;
  close(): Promise<void>;
}

/**
 * Starts a minimal HTTP server serving static HTML fixtures.
 * Returns the base URL and a close() function.
 */
export async function startTestServer(port = 0): Promise<TestServer> {
  const server = createServer(async (req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : (req.url ?? "/");
    // Map /privacy-policy → privacy-policy.html or return a stub
    const filePath = urlPath.endsWith(".html")
      ? join(FIXTURES_DIR, urlPath)
      : join(FIXTURES_DIR, `${urlPath.slice(1)}.html`);

    try {
      const content = await readFile(filePath);
      const ext = extname(filePath) || ".html";
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "text/plain" });
      res.end(content);
    } catch {
      // Return a minimal stub for unknown paths (e.g., /privacy-policy)
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!DOCTYPE html><html><body><h1>Privacy Policy</h1></body></html>");
    }
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unexpected server address type");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  };
}
