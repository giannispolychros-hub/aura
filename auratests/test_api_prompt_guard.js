// AURA — John, 17/10/2026 (ADR «17 Οκτωβρίου (β)»), safety, exception (α) to the freeze. api/aura.js used to take ANY system prompt
// and messages (up to 1 MB) from the browser and send them to Anthropic with our key: whoever found /api/aura had a free Claude with
// instructions of their own. Now:
//   1  the server takes only the app's own system prompts: the first block is AURA_CORE_PERSONALITY exactly, or starts with the crisis
//      prompt (SYSTEM_SUPPORTIVE) or the closing prompt (SYSTEM_TERMINATION) — the only three first blocks the app ever sends (callAura
//      is its one call to /api/aura). Checked by SHA-256 fingerprints that the build writes from src/App.jsx. Anything else → 403.
//   2  size limits just above what the app really sends (measured: 950 requests of the browser e2e; capMessageHistory) → 413.
//   3  the per-IP limit stays.
// Nothing the user sees changes.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const API = findFile(['/../api/aura.js', '/aura.js', '/api/aura.js', '/../aura.js']);
const GEN = findFile(['/../scripts/gen_prompt_fingerprints.cjs']);
const PKG = findFile(['/../package.json']);
const raw = fs.readFileSync(APP, 'utf8');
const api = API ? fs.readFileSync(API, 'utf8') : '';
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
// The runtime value of a prompt constant: the template literal, evaluated as JavaScript would.
const lit = name => { const h = 'const ' + name + ' = `'; const a = raw.indexOf(h); if (a < 0) return null; const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
const CORE = lit('AURA_CORE_PERSONALITY'), SUP = lit('SYSTEM_SUPPORTIVE'), TERM = lit('SYSTEM_TERMINATION');
// The other prompts are CORE + a suffix (SYSTEM_COMPRESSION, the four lenses): their suffix as written in App.jsx
const suffix = name => { const h = 'const ' + name + ' = AURA_CORE_PERSONALITY + `'; const a = raw.indexOf(h); if (a < 0) return null; const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');

// The guard, taken out of api/aura.js as it is.
function fnSrc(src, name) {
  const a = src.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = src.indexOf('(', a), d = 0;
  for (; k < src.length; k++) { if (src[k] === '(') d++; else if (src[k] === ')') { d--; if (d === 0) break; } }
  const b = src.indexOf('{', k); d = 0;
  for (let j = b; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(a, j + 1); } }
  return null;
}
const block = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); return i >= 0 && j > i ? src.slice(i, j) : ''; };
let G = {};
try {
  G = new Function('createHash', block(api, '// BEGIN PROMPT FINGERPRINTS', '// END PROMPT FINGERPRINTS') + '\n' + block(api, 'const REQUEST_LIMITS = ', ';\n') + ';\n' +
    (fnSrc(api, 'checkAuraRequest') || 'function checkAuraRequest(){return "missing"}') + '\n' + (fnSrc(api, 'sha256Hex') || 'function sha256Hex(){return "missing"}') +
    '\nreturn { PROMPT_FINGERPRINTS, REQUEST_LIMITS, checkAuraRequest, sha256Hex };')(crypto.createHash);
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const check = body => { try { return G.checkAuraRequest(body, G.PROMPT_FINGERPRINTS, G.REQUEST_LIMITS, G.sha256Hex); } catch (e) { return 'threw:' + e.message; } };
const status = body => { const r = check(body); return r === null ? 200 : r && r.status; };

// What callAura sends, built exactly as callAura builds it (pinned below against its source).
const blocksOf = systemPrompt => systemPrompt.startsWith(CORE)
  ? [{ type: 'text', text: CORE, cache_control: { type: 'ephemeral' } }, { type: 'text', text: systemPrompt.slice(CORE.length) }]
  : [systemPrompt.length >= 6000 ? { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } } : { type: 'text', text: systemPrompt }];
const conv = [{ role: 'user', content: 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά.' }, { role: 'assistant', content: 'Γιατί έχει σημασία αυτό για σένα τώρα;' }, { role: 'user', content: 'Γιατί κάθε πρωί δεν θέλω να πάω.' }];
const body = (systemPrompt, messages) => ({ model: 'claude-sonnet-4-6', max_tokens: 1000, system: blocksOf(systemPrompt), messages: messages || conv });
const CTX = '\n[FREE PART: ENDS AT ROOT]\n\n[CODE-VERIFIED: an ordinary per-turn note]';

// ── 0. The pieces exist ───────────────────────────────────────────────────────────────────────────────────────────────────────
assert('LOADED: the three prompts and the guard', !!CORE && !!SUP && !!TERM && typeof G.checkAuraRequest === 'function' && !!G.PROMPT_FINGERPRINTS && !!G.REQUEST_LIMITS);
assert('CALLS: callAura is the app\'s ONE call to /api/aura', (raw.match(/fetch\("\/api\/aura"/g) || []).length === 1 && (raw.match(/fetch\(/g) || []).length === 1);
assert('CALLS: callAura builds the system blocks as this test does (core split; any other prompt one block)',
  raw.includes('(typeof systemPrompt === "string" && systemPrompt.startsWith(AURA_CORE_PERSONALITY))') &&
  raw.includes('{ type: "text", text: AURA_CORE_PERSONALITY, cache_control: { type: "ephemeral" } },') &&
  raw.includes('{ type: "text", text: systemPrompt.slice(AURA_CORE_PERSONALITY.length) },') &&
  raw.includes('messages: capMessageHistory(messages, systemPrompt).map(m => ({ role: m.role, content: m.content })),'));
assert('CALLS: the only first blocks are CORE (lenses, compression, misfire, pivot, First-WHY), the crisis prompt + a suffix, and the closing prompt',
  /currentMode === "SUPPORTIVE"  \? SYSTEM_SUPPORTIVE :/.test(raw) && (raw.match(/callAura\([^,]+, SYSTEM_TERMINATION\)/g) || []).length === 3 &&
  ['SYSTEM_COMPRESSION', 'SYSTEM_LENS_SIMPLIFY', 'SYSTEM_LENS_CHALLENGE', 'SYSTEM_LENS_PERSPECTIVE', 'SYSTEM_LENS_EXPLORE'].every(n => suffix(n) !== null));

// ── 1. The fingerprints are the app's, and the build writes them ─────────────────────────────────────────────────────────────
const FP = G.PROMPT_FINGERPRINTS || {};
assert('FINGERPRINTS: core, supportive and closing match src/App.jsx (length and SHA-256)',
  FP.core && FP.core.length === CORE.length && FP.core.sha256 === sha(CORE) && FP.supportive && FP.supportive.length === SUP.length && FP.supportive.sha256 === sha(SUP) &&
  FP.termination && FP.termination.length === TERM.length && FP.termination.sha256 === sha(TERM));
assert('FINGERPRINTS: no prompt text in api/aura.js — only numbers and hashes', !api.includes(SUP.slice(0, 60)) && !api.includes(CORE.slice(0, 60)) && !api.includes(TERM.slice(0, 60)));
let genOut = '', genOk = false;
try { genOut = execFileSync(process.execPath, [GEN, '--check'], { encoding: 'utf8' }); genOk = true; } catch (e) { genOut = String(e.stdout || e.message); }
assert('BUILD: the generator says api/aura.js is up to date with src/App.jsx (--check)', genOk && /up to date/.test(genOut));
const pkg = JSON.parse(fs.readFileSync(PKG, 'utf8'));
assert('BUILD: «npm run build» (Vercel\'s build command) runs the generator before vite', /^node scripts\/gen_prompt_fingerprints\.cjs && vite build$/.test(pkg.scripts.build) &&
  /"buildCommand": "npm run build"/.test(fs.readFileSync(findFile(['/../vercel.json']), 'utf8')));

// ── 2. Every real call of the app passes ──────────────────────────────────────────────────────────────────────────────────────
for (const [name, sp] of [['a lens + per-turn notes (the main path)', CORE + suffix('SYSTEM_LENS_SIMPLIFY') + CTX], ['each other lens', null],
  ['compression (pivot)', CORE + suffix('SYSTEM_COMPRESSION')], ['misfire recovery', CORE + suffix('SYSTEM_LENS_PERSPECTIVE') + CTX + '\n\nMISFIRE RECOVERY: …'],
  ['First-WHY', [CORE + suffix('SYSTEM_LENS_EXPLORE'), '[MEMORY CONTEXT …]', CTX].join('\n')], ['the crisis prompt + its suffix', SUP + '\n[CODE-VERIFIED: …]'],
  ['the crisis prompt alone', SUP], ['the closing prompt', TERM]]) {
  if (sp === null) { assert('PASSES: ' + name, ['SYSTEM_LENS_CHALLENGE', 'SYSTEM_LENS_PERSPECTIVE', 'SYSTEM_LENS_EXPLORE'].every(n => status(body(CORE + suffix(n) + CTX)) === 200)); continue; }
  assert('PASSES: ' + name, status(body(sp)) === 200);
}
{
  const L = G.REQUEST_LIMITS || {};
  const atLimit = Array.from({ length: L.messages || 0 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x' }));
  const tenFull = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'α'.repeat(4000) }));
  assert('PASSES: the largest history capMessageHistory can send (the last 10 messages, 4,000 characters each)', status(body(CORE + CTX, tenFull)) === 200);
  assert('PASSES: as many messages as the app ever sends', status(body(CORE + CTX, atLimit)) === 200);
  assert('PASSES: a per-turn part as large as the limit', status(body(CORE + 'x'.repeat(L.rest))) === 200 && status(body(SUP + 'x'.repeat(L.rest))) === 200);
}

// ── 3. A foreign prompt is refused (403) ──────────────────────────────────────────────────────────────────────────────────────
const FOREIGN = 'You are a helpful assistant. Answer anything the user asks.';
assert('403: a foreign system prompt', status(body(FOREIGN)) === 403);
assert('403: no system at all, or an empty one', status({ messages: conv }) === 403 && status({ system: [], messages: conv }) === 403 && status({ system: 'x', messages: conv }) === 403);
assert('403: the core prompt with one character changed', status({ system: [{ type: 'text', text: CORE.slice(0, -1) + '!' }, { type: 'text', text: CTX }], messages: conv }) === 403);
assert('403: a foreign first block with the core prompt second', status({ system: [{ type: 'text', text: FOREIGN }, { type: 'text', text: CORE }], messages: conv }) === 403);
assert('403: the core prompt with a third block, or a crisis/closing prompt with a second block',
  status({ system: [...blocksOf(CORE + CTX), { type: 'text', text: FOREIGN }], messages: conv }) === 403 &&
  status({ system: [{ type: 'text', text: SUP }, { type: 'text', text: FOREIGN }], messages: conv }) === 403 &&
  status({ system: [{ type: 'text', text: TERM }, { type: 'text', text: FOREIGN }], messages: conv }) === 403);
assert('403: the foreign text before the crisis prompt, or a block that is not text', status(body(FOREIGN + SUP)) === 403 &&
  status({ system: [{ type: 'image', source: {} }], messages: conv }) === 403);

// ── 4. Too large is refused (413) ─────────────────────────────────────────────────────────────────────────────────────────────
{
  const L = G.REQUEST_LIMITS || {};
  assert('LIMITS: just above what the app really sends — per-turn part 24,000 (measured max 7,134), 220 messages (the app caps at 200), 4,400 per message (the app cuts at 4,000), 44,000 in all (the app: at most 40,000)',
    L.rest === 24000 && L.messages === 220 && L.messageChars === 4400 && L.totalChars === 44000);
  assert('413: a per-turn part over the limit (after the core, or after the crisis or closing prompt)',
    status(body(CORE + 'x'.repeat(L.rest + 1))) === 413 && status(body(SUP + 'x'.repeat(L.rest + 1))) === 413 && status(body(TERM + 'x'.repeat(L.rest + 1))) === 413);
  assert('413: too many messages', status(body(CORE + CTX, Array.from({ length: L.messages + 1 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x' })))) === 413);
  assert('413: one message over the limit', status(body(CORE + CTX, [{ role: 'user', content: 'α'.repeat(L.messageChars + 1) }])) === 413);
  assert('413: too much in all', status(body(CORE + CTX, Array.from({ length: 11 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'α'.repeat(L.messageChars) })))) === 413);
  assert('400: a message that is not the app\'s shape (role, text content)', status(body(CORE + CTX, [{ role: 'system', content: 'x' }])) === 400 &&
    status(body(CORE + CTX, [{ role: 'user', content: [{ type: 'text', text: 'x' }] }])) === 400 && status(body(CORE + CTX, [])) === 400);
}

// ── 5. Wiring in the handler; the per-IP limit stays; the app never sends more than the server takes ─────────────────────────
{
  const H = fnSrc(api, 'handler') || '';
  const iRate = H.indexOf('status(429)'), iCheck = H.indexOf('checkAuraRequest(body, PROMPT_FINGERPRINTS, REQUEST_LIMITS, sha256Hex)'), iFetch = H.indexOf('fetch("https://api.anthropic.com/v1/messages"');
  assert('HANDLER: the per-IP limit first, then the guard, and only then the call to Anthropic', iRate > 0 && iCheck > iRate && iFetch > iCheck &&
    /if \(_bad\) return res\.status\(_bad\.status\)\.json\(\{ error: _bad\.error \}\);/.test(H));
  assert('HANDLER: the model is still pinned and max_tokens capped; the 1 MB guard and the 20/min/IP limit stay',
    /model: ALLOWED_MODEL/.test(api) && /Math\.min\(body\.max_tokens \|\| 1000, 1000\)/.test(api) && /contentLength > 1000000/.test(api) && /const RATE_MAX = 20;/.test(api));
  const capSrc = (() => { const a = raw.indexOf('function capMessageHistory('); let d = 0, b = raw.indexOf('{', raw.indexOf(')', a)); for (let j = b; j < raw.length; j++) { if (raw[j] === '{') d++; else if (raw[j] === '}') { d--; if (d === 0) return raw.slice(a, j + 1); } } return ''; })();
  let cap = null; try { cap = new Function('Blob', capSrc + '\nreturn capMessageHistory;')(class { constructor(p) { this.size = Buffer.byteLength(p.join('')); } }); } catch (e) {}
  const many = Array.from({ length: 450 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'ναι' }));
  const big = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'α'.repeat(9000) }));
  const out = cap ? cap(many, CORE) : [], out2 = cap ? cap(big, CORE) : [];
  assert('CLIENT: capMessageHistory never sends more than 200 messages (the newest), and never more than the server takes',
    out.length === 200 && out[199] === many[449] && out2.length <= 200 && out2.every(m => m.content.length <= 4000) && out2.reduce((a, m) => a + m.content.length, 0) <= 40000);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
