import { put, get } from "@vercel/blob";
import { readJsonBody, sendJson } from "../_lib/clownpay.js";
import { requireAdmin } from "../_lib/admin.js";

const PATH = "goko/product.json";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await get(PATH, { access: "private" });
      if (!result || result.statusCode !== 200) {
        return sendJson(res, 404, { message: "Produto não encontrado." });
      }
      const text = await new Response(result.stream).text();
      return sendJson(res, 200, JSON.parse(text));
    } catch (err) {
      console.error("[admin] get product failed:", err?.message);
      return sendJson(res, 502, { message: "Falha ao ler produto." });
    }
  }

  if (req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await readJsonBody(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return sendJson(res, 400, { message: "Dados inválidos." });
    }
    try {
      const json = JSON.stringify(body, null, 2);
      const blob = await put(PATH, json, {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return sendJson(res, 200, { ok: true, url: blob.url });
    } catch (err) {
      console.error("[admin] save product failed:", err?.message);
      return sendJson(res, 502, { message: "Falha ao salvar produto." });
    }
  }

  return sendJson(res, 405, { message: "Método não permitido." });
}
