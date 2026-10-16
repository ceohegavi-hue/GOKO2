import { sendJson } from "../_lib/clownpay.js";
import { isAuthorized } from "../_lib/admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { message: "Método não permitido." });
  if (isAuthorized(req)) return sendJson(res, 200, { ok: true });
  return sendJson(res, 401, { message: "Senha inválida." });
}
