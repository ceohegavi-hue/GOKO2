import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 3000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

async function isFile(p) {
  try { return (await stat(p)).isFile(); } catch { return false; }
}

async function handleApi(req, res, pathname) {
  const file = join(root, normalize(pathname).replace(/^(\.\.[/\\])+/, "") + ".js");
  if (pathname.includes("/_") || !(await isFile(file))) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.default(req, res);
}

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    if (pathname.startsWith("/api/")) return await handleApi(req, res, pathname);

    const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
    const candidates = safe.endsWith("/")
      ? [join(root, safe, "index.html")]
      : [join(root, safe), join(root, `${safe}.html`)];
    for (const file of candidates) {
      if (file.startsWith(root) && (await isFile(file))) {
        res.setHeader("Content-Type", MIME[extname(file)] || "application/octet-stream");
        return res.end(await readFile(file));
      }
    }
    res.statusCode = 404;
    res.end("Not found");
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.statusCode = 500;
    res.end("Internal error");
  }
}).listen(port, () => console.log(`Dev server on http://localhost:${port}`));
