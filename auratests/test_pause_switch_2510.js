// PAUSE SWITCH (John, 25/10/2026, safety: stop AURA in minutes after a serious incident). api/aura.js reads AURA_PAUSED from the
// server's environment: with "1", no request reaches the model — every request gets 503 and a plain message, before the key, the
// per-IP limit or the body are read. Any other value, or none: nothing changes. The app shows its own line for a failed call and, on a
// crisis or danger turn, the help line from its own code (browser section PZ). Code of the server only: the app, its prompts and their
// fingerprints are not touched, so a page already open keeps working the same way (and gets the 503 while the switch is on).
//  (Α) AURA_PAUSED=1 → 503, the message, no call upstream, no IP recorded — for any method and any body
//  (Β) not "1" (unset, "", "0", "true", " 1") → the endpoint as before (no key → 500; a foreign prompt → 403; an app request → upstream)
//  (Γ) the switch is the first thing in the handler, and the rest of the file is the file of a409a47 byte for byte
//  (Δ) the prompt fingerprints are up to date with src/App.jsx (a page already open is not refused)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const API = path.join(ROOT, 'api', 'aura.js');
const src = fs.readFileSync(API, 'utf8');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const MESSAGE = 'Η AURA είναι σε παύση για λίγο. Δοκίμασε ξανά αργότερα.';
const BLOCK_START = '  // PAUSE SWITCH (John, 25/10/2026';
const BLOCK_END = '    return res.status(503).json({ error: "' + MESSAGE + '" });\n  }\n';

(async () => {
  let handler = null;
  try { handler = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default; } catch (e) { console.log('LOAD ERROR — ' + e.message); }
  const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
  const SUPPORTIVE = lit('SYSTEM_SUPPORTIVE');
  const call = async (env, req) => {
    const saved = { p: process.env.AURA_PAUSED, k: process.env.ANTHROPIC_API_KEY, fetch: globalThis.fetch };
    if (env.paused === undefined) delete process.env.AURA_PAUSED; else process.env.AURA_PAUSED = env.paused;
    if (env.key) process.env.ANTHROPIC_API_KEY = env.key; else delete process.env.ANTHROPIC_API_KEY;
    let upstream = 0;
    globalThis.fetch = async () => { upstream++; return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'ok' }] }) }; };
    globalThis.__auraRate = new Map();
    const out = await new Promise(resolve => {
      let status = 200;
      const res = { status(c) { status = c; return res; }, json(d) { resolve({ status, data: d }); }, writeHead(c) { status = c; }, write() {}, end() { resolve({ status, data: null }); } };
      Promise.resolve(handler ? handler(req, res) : null).then(() => {}, e => resolve({ status: 'threw', data: e.message }));
      if (!handler) resolve({ status: 'no handler', data: null });
    });
    const ips = globalThis.__auraRate.size;
    if (saved.p === undefined) delete process.env.AURA_PAUSED; else process.env.AURA_PAUSED = saved.p;
    if (saved.k === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = saved.k;
    globalThis.fetch = saved.fetch;
    return { ...out, upstream, ips };
  };
  const appBody = { system: [{ type: 'text', text: SUPPORTIVE }], messages: [{ role: 'user', content: 'Δεν αντέχω άλλο.' }] };
  const post = body => ({ method: 'POST', headers: { 'content-length': String(Buffer.byteLength(JSON.stringify(body))), 'x-forwarded-for': '10.0.0.1' }, body });

  // ── (Α) on ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  for (const [name, req] of [['an app request (the crisis prompt)', post(appBody)], ['a foreign prompt', post({ system: [{ type: 'text', text: 'x' }], messages: [{ role: 'user', content: 'x' }] })],
    ['a GET', { method: 'GET', headers: {} }], ['an empty body', { method: 'POST', headers: {}, body: null }]]) {
    const r = await call({ paused: '1', key: 'k' }, req);
    assert('(Α) AURA_PAUSED=1, ' + name + ' → 503, the message, Anthropic never called, no IP recorded',
      r.status === 503 && r.data && r.data.error === MESSAGE && r.upstream === 0 && r.ips === 0);
  }
  { const r = await call({ paused: '1', key: undefined }, post(appBody));
    assert('(Α) AURA_PAUSED=1 without the key → still 503 (the switch comes before the key)', r.status === 503 && r.upstream === 0); }

  // ── (Β) off ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  for (const v of [undefined, '', '0', 'true', ' 1', 'yes']) {
    const label = v === undefined ? 'unset' : JSON.stringify(v);
    const a = await call({ paused: v, key: 'k' }, post(appBody));
    assert('(Β) AURA_PAUSED ' + label + ': an app request goes upstream as before (200, one call)', a.status === 200 && a.upstream === 1);
    const b = await call({ paused: v, key: 'k' }, post({ system: [{ type: 'text', text: 'You are a helpful assistant.' }], messages: [{ role: 'user', content: 'x' }] }));
    assert('(Β) AURA_PAUSED ' + label + ': a foreign prompt → 403, no call', b.status === 403 && b.upstream === 0);
  }
  { const r = await call({ paused: undefined, key: undefined }, post(appBody));
    assert('(Β) unset and no key → 500 «Server configuration error», as before', r.status === 500 && r.data && r.data.error === 'Server configuration error'); }
  { const r = await call({ paused: undefined, key: 'k' }, { method: 'GET', headers: {} });
    assert('(Β) unset, a GET → 405, as before', r.status === 405); }

  // ── (Γ) where it sits; the rest unchanged ───────────────────────────────────────────────────────────────────────────────────────
  const at = src.indexOf(BLOCK_START), end = src.indexOf(BLOCK_END);
  assert('(Γ) the switch is the first thing in the handler, before the method check', at > 0 && end > at &&
    src.indexOf('export default async function handler(req, res) {\n') + 'export default async function handler(req, res) {\n'.length === at &&
    end < src.indexOf('if (req.method !== "POST")'));
  assert('(Γ) it reads only AURA_PAUSED, and only the exact value "1"', at > 0 && /if \(process\.env\.AURA_PAUSED === "1"\) \{/.test(src.slice(at, end)) && (src.match(/AURA_PAUSED/g) || []).length === 2);
  const without = at > 0 && end > at ? src.slice(0, at) + src.slice(end + BLOCK_END.length) : '';
  assert('(Γ) without the switch, api/aura.js is a409a47\'s, byte for byte (guard, fingerprints, limits, model)', h(without) === 'b11fad3a5d793717');

  // ── (Δ) open pages are not refused ──────────────────────────────────────────────────────────────────────────────────────────────
  let gen = ''; try { gen = cp.execSync('node ' + JSON.stringify(path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs')) + ' --check').toString(); } catch (e) { gen = String(e.stdout || ''); }
  assert('(Δ) the prompt fingerprints in api/aura.js are up to date with src/App.jsx', /up to date/.test(gen));
  assert('(Δ) the prompt (AURA_CORE_PERSONALITY) and the crisis prompt are unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21' && h('const SYSTEM_SUPPORTIVE = `' + SUPPORTIVE + '`;') === 'ff063670f20343a7');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
