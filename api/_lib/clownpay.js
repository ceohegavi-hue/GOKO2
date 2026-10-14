const DEFAULT_TIMEOUT_MS = 15000;

function getConfig() {
  const baseUrl = (process.env.CLOWNPAY_API_URL || "").trim().replace(/\/+$/, "");
  const secretKey = (process.env.CLOWNPAY_SECRET_KEY || "").trim();
  if (!baseUrl || !secretKey) {
    throw new ClownPayError("Gateway de pagamento não configurado.", 503);
  }
  return { baseUrl, secretKey };
}

export class ClownPayError extends Error {
  constructor(message, status = 502, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const { baseUrl, secretKey } = getConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "X-API-Key": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.message || data?.error || `Erro ${res.status} no gateway.`;
      throw new ClownPayError(message, res.status === 401 ? 502 : res.status, data);
    }
    return data;
  } catch (err) {
    if (err instanceof ClownPayError) throw err;
    if (err?.name === "AbortError") throw new ClownPayError("Tempo esgotado ao falar com o gateway.", 504);
    throw new ClownPayError("Falha de conexão com o gateway.", 502);
  } finally {
    clearTimeout(timer);
  }
}

export function createTransaction(payload) {
  return request("/api/v1/transaction", { method: "POST", body: payload });
}

export function getTransaction(id) {
  return request(`/api/v1/query?action=get_transaction&id=${encodeURIComponent(id)}`);
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 100_000) return null;
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "null"); } catch { return null; }
}

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}
