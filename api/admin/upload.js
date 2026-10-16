import { put } from "@vercel/blob";
import { sendJson } from "../_lib/clownpay.js";
import { requireAdmin } from "../_lib/admin.js";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function readRawBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { message: "Método não permitido." });
  if (!requireAdmin(req, res)) return;

  const raw = await readRawBody(req);
  if (!raw) return sendJson(res, 413, { message: "Imagem muito grande (máx. 5 MB)." });

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return sendJson(res, 400, { message: "Corpo inválido." });
  }

  const dataUrl = body?.dataUrl;
  if (typeof dataUrl !== "string") {
    return sendJson(res, 400, { message: "Imagem inválida." });
  }

  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return sendJson(res, 400, { message: "Formato de imagem inválido." });

  const contentType = m[1];
  const ext = contentType.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
  const buf = Buffer.from(m[2], "base64");
  const name = `goko/images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const blob = await put(name, buf, {
      access: "private",
      contentType,
      addRandomSuffix: false,
    });
    // Store é privado: servimos a imagem por uma rota própria.
    return sendJson(res, 200, { url: "/api/image?pathname=" + encodeURIComponent(blob.pathname) });
  } catch (err) {
    console.error("[admin] upload failed:", err?.message);
    return sendJson(res, 502, { message: "Falha ao enviar imagem." });
  }
}
