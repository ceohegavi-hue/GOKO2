import { generateText } from "ai";
import { readJsonBody, sendJson } from "../_lib/clownpay.js";
import { requireAdmin } from "../_lib/admin.js";

const MODEL = "google/gemini-2.5-flash";

function extractJson(text) {
  const cleaned = String(text || "").trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : cleaned;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Resposta da IA sem JSON válido.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { message: "Método não permitido." });
  if (!requireAdmin(req, res)) return;

  const body = await readJsonBody(req);
  const nome = String(body?.nome || "").trim();
  const tipo = String(body?.tipo || "tudo").trim();
  if (!nome) return sendJson(res, 400, { message: "Informe o nome do produto." });

  const prompt = `Você é um redator de vendas especialista em e-commerce brasileiro (estilo TikTok Shop / dropshipping).

Produto: "${nome}"

Gere conteúdo de venda em português do Brasil, persuasivo e realista. Responda APENAS com um JSON válido (sem markdown, sem comentários) no seguinte formato:

{
  "descricao": "parágrafo curto e persuasivo de venda (2 a 3 frases)",
  "beneficios": ["benefício 1", "benefício 2", "benefício 3", "benefício 4", "benefício 5", "benefício 6"],
  "avaliacoes": [
    { "nome": "Nome Sobrenome", "estrelas": 5, "texto": "comentário realista de cliente satisfeito, 1 a 2 frases" }
  ]
}

Regras:
- Gere exatamente 8 avaliações, com nomes brasileiros variados e estrelas entre 4 e 5.
- Os comentários devem parecer reais (mencionam uso, entrega, resultado), sem exageros absurdos.
- A descrição e os benefícios devem destacar o valor do produto de forma natural.`;

  try {
    const { text } = await generateText({ model: MODEL, prompt });
    const data = extractJson(text);
    return sendJson(res, 200, data);
  } catch (err) {
    console.error("[admin] generate failed:", err?.message);
    return sendJson(res, 502, { message: "Falha ao gerar conteúdo. Tente novamente." });
  }
}
