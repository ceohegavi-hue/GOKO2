import { createHmac, timingSafeEqual } from "node:crypto";
import { sendJson } from "./clownpay.js";

const SECRET = "goko-admin-v1";
const PASSWORD = process.env.ADMIN_PASSWORD || "goko2026";

function hash(value) {
  return createHmac("sha256", SECRET).update(String(value)).digest();
}

export function isAuthorized(req) {
  const provided = String(req.headers["x-admin-password"] || "").trim();
  if (!provided) return false;
  const a = hash(provided);
  const b = hash(PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireAdmin(req, res) {
  if (isAuthorized(req)) return true;
  sendJson(res, 401, { message: "Senha inválida." });
  return false;
}
