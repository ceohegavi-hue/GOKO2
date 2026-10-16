const YT_API = "https://www.googleapis.com/youtube/v3/search";

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { message: "Método não permitido." });
  }

  const url = new URL(req.url, "http://localhost");
  const q = (url.searchParams.get("q") || "").trim();
  const max = Math.min(parseInt(url.searchParams.get("max") || "10", 10) || 10, 25);

  if (!q) return sendJson(res, 400, { message: "Termo de busca obrigatório." });

  const key = (process.env.YOUTUBE_API_KEY || "").trim();
  if (!key) {
    return sendJson(res, 503, { message: "YOUTUBE_API_KEY não configurada." });
  }

  const params = new URLSearchParams({
    part: "snippet",
    q: `${q} review`,
    type: "video",
    maxResults: String(max),
    key,
    relevanceLanguage: "pt",
    videoEmbeddable: "true",
  });

  try {
    const r = await fetch(`${YT_API}?${params.toString()}`, { cache: "no-store" });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      const msg = data?.error?.message || `Erro ${r.status} na YouTube API.`;
      return sendJson(res, r.status, { message: msg });
    }

    const items = (data.items || [])
      .filter((it) => it.id && it.id.videoId)
      .map((it) => ({
        id: it.id.videoId,
        title: it.snippet?.title || "",
        channel: it.snippet?.channelTitle || "",
        thumb: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || "",
        url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
      }));

    return sendJson(res, 200, { items });
  } catch (err) {
    console.error("[youtube] search failed:", err?.message);
    return sendJson(res, 502, { message: "Falha ao buscar vídeos no YouTube." });
  }
}
