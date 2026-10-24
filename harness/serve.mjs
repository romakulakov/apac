/** Tiny static server for prebuilt dist/ folders. */
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

export async function serveStatic(dir) {
  const server = http.createServer(async (req, res) => {
    let p = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
    try {
      if (p.endsWith("/")) p += "index.html";
      let body;
      try { body = await readFile(p); }
      catch { body = await readFile(path.join(dir, "index.html")); p = ".html"; } // SPA fallback
      res.writeHead(200, { "content-type": MIME[path.extname(p)] ?? "application/octet-stream" });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise(r => server.close(r)) };
}
