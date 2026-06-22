/**
 * AURA — Serverless API Proxy (Vercel)
 *
 * Keeps the Anthropic API key server-side only.
 * Required environment variable: ANTHROPIC_API_KEY
 * Set in: Vercel Dashboard → Project → Settings → Environment Variables
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Body size guard — reject payloads over 64KB to prevent abuse
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  if (contentLength > 65536) {
    return res.status(413).json({ error: "Payload too large" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Whitelist only the fields AURA needs — strip anything else
    const safeBody = {
      model: body.model,
      max_tokens: Math.min(body.max_tokens || 1000, 1000),
      system: body.system,
      messages: body.messages,
    };

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(safeBody),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: "Upstream error" });
  }
}
