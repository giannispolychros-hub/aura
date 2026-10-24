/**
 * AURA — Serverless API Proxy (Vercel)
 *
 * Keeps the Anthropic API key server-side only.
 * Required environment variable: ANTHROPIC_API_KEY
 * Set in: Vercel Dashboard → Project → Settings → Environment Variables
 */
import { createHash } from "node:crypto";

// SECURITY (ADR «17 Οκτωβρίου (β)», exception (α) to the freeze): this endpoint used to send ANY system prompt and messages to
// Anthropic with our key — whoever found it had a free Claude with instructions of their own. It now takes only the app's own
// system prompts. The app makes ONE call to /api/aura (callAura in src/App.jsx), and its first block is always one of three:
// AURA_CORE_PERSONALITY exactly (the lenses, compression, misfire, pivot and First-WHY prompts are CORE + a per-turn part, sent as a
// second block), or a single block that starts with SYSTEM_SUPPORTIVE (crisis) or SYSTEM_TERMINATION (closing). Anything else → 403.
// The fingerprints below are length + SHA-256 only, never the text; «npm run build» rewrites them from src/App.jsx.
// BEGIN PROMPT FINGERPRINTS — written by scripts/gen_prompt_fingerprints.cjs from src/App.jsx («npm run build»). Do not edit by hand.
const PROMPT_FINGERPRINTS = {
  core: { length: 315448, sha256: "edd45f6581b45b01326227c08e3016aa2d7c1c692584049b85a1a185172d4be7" },
  supportive: { length: 851, sha256: "c7815b96d83ebae85ab1dd6856ae343c7ba114f0e8ba20362d26ce853266b298" },
  termination: { length: 20032, sha256: "d5a77ca926f9490b1d1a38c7164474c6935747964cac778a0f60754eef8e279a" },
};
// END PROMPT FINGERPRINTS

// Size limits just above what the app really sends → 413. Measured 17/10/2026 over the 950 requests of the browser e2e: the per-turn
// part after the fixed prompt at most 7,134 characters; capMessageHistory (src/App.jsx) sends at most 200 messages, each cut at
// 4,000 characters, at most 40,000 in all.
const REQUEST_LIMITS = { rest: 24000, messages: 220, messageChars: 4400, totalChars: 44000 };

function sha256Hex(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
// null = the request is the app's own; otherwise { status, error }.
function checkAuraRequest(body, fp, limits, sha) {
  const b = body || {};
  const sys = b.system;
  const forbidden = { status: 403, error: "Forbidden" };
  if (!Array.isArray(sys) || sys.length < 1 || sys.length > 2) return forbidden;
  if (!sys.every(x => x && x.type === "text" && typeof x.text === "string")) return forbidden;
  const first = sys[0].text;
  const startsWith = k => !!fp[k] && first.length >= fp[k].length && sha(first.slice(0, fp[k].length)) === fp[k].sha256;
  let rest;
  if (fp.core && first.length === fp.core.length && sha(first) === fp.core.sha256) rest = sys.length === 2 ? sys[1].text : "";
  else if (sys.length === 1 && startsWith("supportive")) rest = first.slice(fp.supportive.length);
  else if (sys.length === 1 && startsWith("termination")) rest = first.slice(fp.termination.length);
  else return forbidden;
  const tooLarge = { status: 413, error: "Payload too large" };
  if (rest.length > limits.rest) return tooLarge;
  const msgs = b.messages;
  if (!Array.isArray(msgs) || msgs.length < 1 || !msgs.every(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")) {
    return { status: 400, error: "Bad request" };
  }
  if (msgs.length > limits.messages) return tooLarge;
  let total = 0;
  for (const m of msgs) {
    if (m.content.length > limits.messageChars) return tooLarge;
    total += m.content.length;
  }
  if (total > limits.totalChars) return tooLarge;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  // SECURITY (confirmed cost-attack vector — no rate limiting existed anywhere, client or
  // server, so a scripted attacker could issue unlimited requests and drain the API budget).
  // Simple in-memory sliding window, per IP. Serverless instances are recycled, so this is a
  // deterrent against casual/scripted abuse rather than a hard guarantee — a persistent store
  // (Upstash/Redis) would be the next step if real abuse is ever observed.
  const RATE_WINDOW_MS = 60_000;
  const RATE_MAX = 20;
  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  globalThis.__auraRate = globalThis.__auraRate || new Map();
  const now = Date.now();
  const hits = (globalThis.__auraRate.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }
  hits.push(now);
  globalThis.__auraRate.set(ip, hits);
  // Bound the map so it cannot grow without limit across many IPs.
  if (globalThis.__auraRate.size > 5000) globalThis.__auraRate.clear();

  // Body size guard — real production evidence (2026-07-12): the system prompt alone is
  // now ~54KB after today's additions, leaving almost no room under the old 64KB limit for
  // any real conversation history — a 29-exchange session hit this and failed with 413.
  // Raised to 300KB: generous headroom over current system-prompt size plus room for long
  // conversations, while still rejecting genuinely abusive (multi-MB) payloads. The client
  // also caps conversation history by character budget (capMessageHistory in App.jsx) as a
  // second, independent layer of defense — this guard and that cap are not the same fix.
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  // C1 FIX (verified 413 in production, measured): this ceiling was set when the system prompt was
  // ~54 KB. The prompt is now ~275 KB, leaving under 5 KB for conversation history — so any real
  // session failed. Vercel's own platform limit is 4.5 MB (documented), making 300 KB roughly 15x
  // more conservative than necessary. Raised to 1 MB: still 4.5x under the platform ceiling, but
  // with genuine room for the prompt plus a full session. capMessageHistory in App.jsx computes a
  // dynamic budget against this same number as a second, independent layer.
  if (contentLength > 1000000) {
    return res.status(413).json({ error: "Payload too large" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Only the app's own prompts, within the app's own sizes (ADR «17 Οκτωβρίου (β)»).
    const _bad = checkAuraRequest(body, PROMPT_FINGERPRINTS, REQUEST_LIMITS, sha256Hex);
    if (_bad) return res.status(_bad.status).json({ error: _bad.error });

    // STREAMING SUPPORT (added — perceived-speed improvement): pass-through, backward
    // compatible. wantsStream defaults to false, so any existing caller that doesn't send
    // stream:true gets the exact original, unchanged behavior below.
    const wantsStream = body.stream === true;

    // Whitelist only the fields AURA needs — strip anything else
    // SECURITY (confirmed cost-attack vector): model was previously passed straight through
    // from the request body, so anyone could request an arbitrary — potentially far more
    // expensive — model and burn API credits. max_tokens was already capped here, which shows
    // this was an oversight rather than a choice. The model is now pinned server-side; the
    // client's value is ignored entirely.
    const ALLOWED_MODEL = "claude-sonnet-4-6";
    const safeBody = {
      model: ALLOWED_MODEL,
      max_tokens: Math.min(body.max_tokens || 1000, 1000),
      system: body.system,
      messages: body.messages,
      ...(wantsStream ? { stream: true } : {}),
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

    if (!wantsStream) {
      // ORIGINAL, UNCHANGED PATH — exact same behavior as before this change.
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }

    // STREAMING PATH: pipe Anthropic's Server-Sent Events straight through to the client,
    // unmodified. AURA's own text-processing (tag stripping, ΑΡΑ backstop) stays entirely
    // client-side and entirely unchanged — this only changes how bytes arrive, not what
    // they mean.
    if (!upstream.ok || !upstream.body) {
      const errData = await upstream.json().catch(() => ({ error: "Upstream error" }));
      return res.status(upstream.status || 502).json(errData);
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    });

    const reader = upstream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      res.end();
    }
  } catch (err) {
    return res.status(502).json({ error: "Upstream error" });
  }
}