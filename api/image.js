import { get } from "@vercel/blob";
import { Readable } from "node:stream";

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.searchParams.get("pathname");
  if (!pathname) {
    res.statusCode = 400;
    return res.end("Missing pathname");
  }
  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", result.blob.contentType || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    Readable.fromWeb(result.stream).pipe(res);
  } catch (err) {
    console.error("[image] failed:", err?.message);
    if (!res.headersSent) res.statusCode = 502;
    res.end("Failed");
  }
}
