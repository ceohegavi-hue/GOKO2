import { getTransaction, sendJson } from "../../_lib/clownpay.js";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;
const PAID = new Set(["approved", "paid"]);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { message: "Método não permitido." });
  }

  const url = new URL(req.url, "http://localhost");
  const ids = (url.searchParams.get("id") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => ID_PATTERN.test(s))
    .slice(0, 3);

  if (!ids.length) return sendJson(res, 400, { status: "unknown", message: "ID inválido." });

  let lastStatus = "pending";
  for (const id of ids) {
    try {
      const tx = await getTransaction(id);
      const status = String(tx?.status || "").toLowerCase();
      if (PAID.has(status)) return sendJson(res, 200, { status: "paid" });
      if (status) {
        lastStatus = status;
        break;
      }
    } catch {
      // Try the next identifier (numeric id vs. reference).
    }
  }
  return sendJson(res, 200, { status: lastStatus });
}
