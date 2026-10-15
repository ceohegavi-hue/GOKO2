import { randomUUID } from "node:crypto";
import { ClownPayError, createTransaction, readJsonBody, sendJson } from "../../_lib/clownpay.js";

const MIN_CENTS = 100;
const MAX_CENTS = 500_000;
const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck"];

const digits = (v) => String(v ?? "").replace(/\D/g, "");
const text = (v, max = 120) => String(v ?? "").trim().slice(0, max);

function isValidCpf(cpf) {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(cpf[i]) * (t + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(cpf[t])) return false;
  }
  return true;
}

function buildDescription(products, origin) {
  const names = Array.isArray(products)
    ? products.map((p) => text(p?.name, 60)).filter(Boolean)
    : [];
  if (names.length) return names.join(" + ").slice(0, 120);
  return origin === "upsell" ? "Oferta especial" : "Pedido";
}

function pickTracking(tracking) {
  if (!tracking || typeof tracking !== "object") return undefined;
  const out = {};
  for (const key of TRACKING_KEYS) if (tracking[key]) out[key] = text(tracking[key], 200);
  return Object.keys(out).length ? out : undefined;
}

function pickAddress(shipping) {
  if (!shipping || typeof shipping !== "object") return undefined;
  const address = {
    street: text(shipping.logradouro),
    number: text(shipping.numero, 20),
    complement: text(shipping.complemento),
    neighborhood: text(shipping.bairro),
    city: text(shipping.cidade),
    state: text(shipping.uf, 2).toUpperCase(),
    zipcode: digits(shipping.cep).slice(0, 8),
  };
  return Object.values(address).some(Boolean) ? address : undefined;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { message: "Método não permitido." });
  }

  const body = await readJsonBody(req);
  if (!body) return sendJson(res, 400, { message: "Requisição inválida." });

  const amountCents = Math.round(Number(body.amount) * 100);
  if (!Number.isFinite(amountCents) || amountCents < MIN_CENTS || amountCents > MAX_CENTS) {
    return sendJson(res, 400, { message: "Valor inválido." });
  }

  const client = body.client || {};
  const document = digits(client.document);
  if (!isValidCpf(document) && document.length !== 14) {
    return sendJson(res, 400, { code: "invalid_document", error: "CPF inválido. Verifique e tente novamente." });
  }

  const reference = `GOKO-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const productHash = (process.env.CLOWNPAY_PRODUCT_HASH || "").trim();
  const postbackUrl = (process.env.CLOWNPAY_POSTBACK_URL || "").trim();

  const payload = {
    amount: amountCents,
    description: buildDescription(body.products, body.origin),
    reference,
    customer: {
      name: text(client.name) || "Cliente",
      email: text(client.email, 160) || "cliente@email.com",
      document,
      phone: digits(client.phone).slice(0, 13) || "11999999999",
    },
    ...(productHash ? { productHash } : { source: "api_externa" }),
    ...(postbackUrl ? { postback_url: postbackUrl } : {}),
  };
  const address = pickAddress(body.shipping);
  if (address) payload.address = address;
  const tracking = pickTracking(body.tracking);
  if (tracking) payload.tracking = tracking;

  try {
    const tx = await createTransaction(payload);
    if (!tx?.qr_code) {
      return sendJson(res, 502, { message: tx?.message || "Não foi possível gerar o PIX. Tente novamente." });
    }
    return sendJson(res, 200, {
      copyPaste: tx.qr_code,
      qrCode: tx.qr_code_base64 || "",
      transactionId: String(tx.transaction_id ?? tx.id ?? reference),
      gatewayTransactionId: reference,
      orderId: reference,
      amount: amountCents / 100,
      expiresAt: tx.expires_at || null,
    });
  } catch (err) {
    const status = err instanceof ClownPayError ? err.status : 500;
    console.error("[clownpay] create failed:", err?.message, err?.details ?? "");
    return sendJson(res, status >= 400 && status < 600 ? status : 502, {
      message: "Não foi possível gerar o PIX. Tente novamente.",
    });
  }
}
