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
// STRICTER (ADR «4 Νοεμβρίου (β)», branch hardening-2026-11, John's approval): the closing prompt exactly, nothing after it; after the
// core prompt (and, when there is one, one of the five per-mode texts) or after the crisis prompt, only blocks that begin the way the
// app's own per-turn notes begin — the list («openings») is written by the build, next to the fingerprints. This checks the shape of
// the app's requests. It is not user authentication and is not presented as such.
// BEGIN PROMPT FINGERPRINTS — written by scripts/gen_prompt_fingerprints.cjs from src/App.jsx («npm run build»). Do not edit by hand.
const PROMPT_FINGERPRINTS = {
  core: { length: 311822, sha256: "b5f303cc9405aa216e92e481f24507b03f6d878c2475733063c42733074c5b01" },
  supportive: { length: 851, sha256: "c7815b96d83ebae85ab1dd6856ae343c7ba114f0e8ba20362d26ce853266b298" },
  termination: { length: 20032, sha256: "d5a77ca926f9490b1d1a38c7164474c6935747964cac778a0f60754eef8e279a" },
  // the per-mode texts that may follow the core prompt (SYSTEM_LENS_SIMPLIFY, SYSTEM_LENS_CHALLENGE, SYSTEM_LENS_PERSPECTIVE, SYSTEM_LENS_EXPLORE, SYSTEM_COMPRESSION)
  modes: [
    { length: 1004, sha256: "5daccb02dfcea96d3501cd255fe9740673ec4ba37bd7d29423bd28335284e3ce" },
    { length: 931, sha256: "010b992227f558d976789e62daf2dcb1b1bf27bce098dbc2fb8e3c9962ebf50a" },
    { length: 865, sha256: "9f60117893e214c3458f39b562ae12c6cac7e62e171dfc386e3e3ad65e317af6" },
    { length: 1011, sha256: "5117d2a8dc97b72dac02e2ac084da1f62d95eca9e842964967a668eebcbbb2f9" },
    { length: 1137, sha256: "e2c9883ce005ce7bca746e1432b02e5c0407c631cd09993ad34baab035e8227b" },
  ],
  // how the app's own per-turn notes begin
  openings: [
    "MISFIRE RECOVERY:",
    "[AUTO-KILL — CODE-V",
    "[CODE-VERIFIED KNOW",
    "[CODE-VERIFIED: ",
    "[CODE-VERIFIED: a s",
    "[CODE-VERIFIED: a Δ",
    "[CODE-VERIFIED: the",
    "[CODE-VERIFIED: thi",
    "[Deliver Part 1 now",
    "[Deliver Part 2 now",
    "[ESCALATION LEVEL 1",
    "[ESCALATION LEVEL 2",
    "[ESCALATION LEVEL 3",
    "[EXPLICIT PAUSE AVA",
    "[FIRST REPLY FLOOR ",
    "[FIRST REPLY OF THI",
    "[FREE PART: ENDS AT",
    "[Final compression ",
    "[GATES DUE CHECK — ",
    "[INFORMATION MODE A",
    "[MASTER PRIORITY RU",
    "[MEMORY CONTEXT — d",
    "[ROAD QUESTION — on",
    "[SESSION COVERAGE —",
    "[SILENT PROFILE USA",
    "[SILENT PROFILE — i",
    "[STAGE A, FIRST REP",
    "[STRUCTURAL EVIDENC",
    "[SYSTEM CONTEXT REF",
    "[The user has now u",
    "[The user just answ",
    "[The user just conf",
    "[User indicated the",
  ],
};
// END PROMPT FINGERPRINTS

// Size limits just above what the app really sends → 413. Measured 17/10/2026 over the 950 requests of the browser e2e: the per-turn
// part after the fixed prompt at most 7,134 characters; capMessageHistory (src/App.jsx) sends at most 200 messages, each cut at
// 4,000 characters, at most 40,000 in all. The per-turn part after the crisis prompt has a limit of its own (4/11/2026: measured at most
// 1,516 over the 263 crisis requests of the browser e2e).
const REQUEST_LIMITS = { rest: 24000, restSupportive: 8000, messages: 220, messageChars: 4400, totalChars: 44000 };

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
  const exact = k => !!fp[k] && first.length === fp[k].length && sha(first) === fp[k].sha256;
  const startsWith = k => !!fp[k] && first.length >= fp[k].length && sha(first.slice(0, fp[k].length)) === fp[k].sha256;
  let rest, cap;
  if (exact("core")) {
    rest = sys.length === 2 ? sys[1].text : "";
    const mode = (Array.isArray(fp.modes) ? fp.modes : []).find(m => rest.length >= m.length && sha(rest.slice(0, m.length)) === m.sha256);
    if (mode) rest = rest.slice(mode.length);
    cap = limits.rest;
  } else if (sys.length === 1 && exact("termination")) {
    rest = "";
    cap = 0;
  } else if (sys.length === 1 && startsWith("supportive")) {
    rest = first.slice(fp.supportive.length);
    cap = typeof limits.restSupportive === "number" ? limits.restSupportive : limits.rest;
  } else return forbidden;
  const tooLarge = { status: 413, error: "Payload too large" };
  if (rest.length > cap) return tooLarge;
  const openings = Array.isArray(fp.openings) ? fp.openings : [];
  const blocks = rest.split(/\n(?=\[)/).map(p => p.replace(/^\s+/, "")).filter(Boolean);
  if (!blocks.every(p => openings.some(o => p.startsWith(o)))) return forbidden;
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
  // PAUSE SWITCH (John, 25/10/2026, safety): AURA_PAUSED=1 in the server's environment stops AURA in minutes after a serious incident —
  // no request reaches the model: 503 and a plain message, before the key, the per-IP limit or the body are read. The app shows its own
  // line for a failed call and, on a crisis or danger turn, the help line from its own code. Any other value, or none: nothing changes.
  if (process.env.AURA_PAUSED === "1") {
    return res.status(503).json({ error: "Η AURA είναι σε παύση για λίγο. Δοκίμασε ξανά αργότερα." });
  }
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