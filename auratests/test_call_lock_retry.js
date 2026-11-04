// AURA — ONE CALL AT A TIME, ALSO WHILE THE APP RETRIES (A4, ADR «4 Νοεμβρίου», branch hardening-2026-11, John's approval 4/11/2026).
//
// callAura sends one request to /api/aura and, on a 429 or a 5xx, waits 600 ms and tries once more. A module flag, _activeCall, keeps
// a second call out while one is running. The retry used to be `return callAura(…)` inside the try: the outer call returned at once,
// its finally set _activeCall = false, and the retry went on WITHOUT the lock. A second call started in that window ran in parallel —
// two charged requests, two replies in the wrong order, the history out of order for the rest of the session. Seen in the browser on
// main 24aab8e through door 2's «Δεν το βρήκα ακόμα, συνέχισε» (a call outside handleSubmit). The fix: `return await callAura(…)`.
//
// Everything here runs callAura from src/App.jsx itself, with a fake fetch whose replies are released by hand and a fake clock (the
// 600 ms and 300 ms waits run at once; the 26 s timeout fires only when the test says so). No network, no real time.
//  (Α) the lock holds for the whole retry — a second call is refused, exactly two requests (RED on 24aab8e)
//  (Β) 429 and every 5xx are retried once; a 4xx is not
//  (Γ) timeouts: a hanging first try, a hanging retry
//  (Δ) more than one failure: two failures in a row stop after two requests; an empty reply on the retry
//  (Ε) never locked for good: after each kind of failure the next call goes through
//  (ΣΤ) unchanged: the 300 ms grace, two calls one after the other, the first call's reply returned to it
const fs = require('fs');
const path = require('path');
const { Blob } = require('buffer');
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function extract(name) {
  let s = CODE.indexOf('\nasync function ' + name + '(');
  if (s < 0) s = CODE.indexOf('\nfunction ' + name + '(');
  if (s < 0) return '';
  return CODE.slice(s + 1, CODE.indexOf('\n}', s + 1) + 2);
}
const BUSY = 'Κάτι δεν λειτούργησε. Δοκίμασε ξανά.';
const SRC = ['let _activeCall = false;', 'const AURA_CORE_PERSONALITY = "CORE";', 'const __events = [];', 'function recordTelemetry(e, f) { __events.push(e); }',
  ...['apiErrorReasonCode', 'friendlyApiError', 'isEmptyModelResponse', 'capMessageHistory', 'callAura'].map(extract),
  'return { callAura, active: () => _activeCall, events: __events };'].join('\n');
assert('(load) callAura and the functions it calls are found in src/App.jsx', ['apiErrorReasonCode', 'friendlyApiError', 'isEmptyModelResponse', 'capMessageHistory', 'callAura'].every(n => extract(n).length > 0));

function makeClock() {   // waits under 1 s run on the next turn of the loop; the 26 s timeout is kept and fired only by fireTimeouts()
  const long = new Map(); let id = 0;
  return { setTimeout: (f, ms) => { id++; if (ms < 1000) setImmediate(f); else long.set(id, f); return id; },
    clearTimeout: t => { long.delete(t); }, fireTimeouts: () => { for (const [k, f] of [...long]) { long.delete(k); f(); } } };
}
function load(fetchImpl, clock) {
  const env = { fetch: fetchImpl, Blob, AbortController, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout, window: {}, console: { log() {}, warn() {} } };
  return new Function(...Object.keys(env), SRC)(...Object.values(env));
}
const tick = async (n = 12) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const deferred = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, res, rej }; };
const ok = t => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: t }], usage: {} }) });
const bad = s => ({ ok: false, status: s, json: async () => ({ error: { type: 'x' } }) });
const hangUntilAbort = o => new Promise((_, rej) => o.signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; rej(e); }));
const msgs = c => [{ role: 'user', content: c }];
const settle = p => p.then(r => 'ok:' + r, e => 'err:' + e.message);
// never wait forever: a call that does not end within a bounded number of loop turns reads as «still running» (a failed check)
const bounded = (p, turns = 400) => Promise.race([p, tick(turns).then(() => 'still running')]);

(async () => {
  try {
    // ── (Α) the lock holds for the whole retry ────────────────────────────────────────────────────────────────────────────────────
    for (const first of [529, 429, 503]) {
      const clock = makeClock(); const sent = []; const slow = deferred();
      const M = load((u, o) => { sent.push(JSON.parse(o.body).messages[0].content);
        return sent.length === 1 ? Promise.resolve(bad(first)) : sent.length === 2 ? slow.p : Promise.resolve(ok('second')); }, clock);
      const a = settle(M.callAura(msgs('A'), 'CORE x'));
      await tick();
      assert(`(Α ${first}) the retry is on its way (two requests, both for the same message)`, sent.length === 2 && sent[1] === 'A');
      assert(`(Α ${first}) the lock is held while the retry runs`, M.active() === true);
      const b = settle(M.callAura(msgs('B'), 'CORE x'));
      await tick();
      assert(`(Α ${first}) a second call started during the retry never reaches the network`, sent.length === 2);
      slow.res(ok('first'));
      const [ra, rb] = [await bounded(a), await bounded(b)];
      assert(`(Α ${first}) the first call gets the retry's reply`, ra === 'ok:first');
      assert(`(Α ${first}) the second call is refused with the app's own words`, rb === 'err:' + BUSY);
      assert(`(Α ${first}) exactly two requests in all — no second charge`, sent.length === 2);
      assert(`(Α ${first}) the lock is free afterwards`, M.active() === false);
    }
    // ── (Β) which failures are retried ───────────────────────────────────────────────────────────────────────────────────────────
    for (const s of [429, 500, 502, 503, 504, 529]) {
      let n = 0; const M = load(() => (++n === 1 ? Promise.resolve(bad(s)) : Promise.resolve(ok('again'))), makeClock());
      const r = await bounded(settle(M.callAura(msgs('A'), 'CORE x')));
      assert(`(Β ${s}) retried once: two requests, the reply of the second`, r === 'ok:again' && n === 2 && M.active() === false);
    }
    for (const s of [400, 401, 403, 413]) {
      let n = 0; const M = load(() => { n++; return Promise.resolve(bad(s)); }, makeClock());
      const r = await bounded(settle(M.callAura(msgs('A'), 'CORE x')));
      assert(`(Β ${s}) not retried: one request, an error in the app's words, the lock free`, r.startsWith('err:') && n === 1 && M.active() === false && !/x"|type/.test(r));
    }
    // ── (Γ) timeouts ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
    {
      const clock = makeClock(); let n = 0;
      const M = load((u, o) => { n++; return hangUntilAbort(o); }, clock);
      const p = settle(M.callAura(msgs('A'), 'CORE x'));
      await tick();
      assert('(Γ) a hanging first try holds the lock', M.active() === true && n === 1);
      clock.fireTimeouts(); const r = await bounded(p);
      assert('(Γ) at the timeout: «Η σύνδεση έληξε…», no retry, the lock free', r.startsWith('err:Η σύνδεση έληξε') && n === 1 && M.active() === false);
    }
    {
      const clock = makeClock(); let n = 0;
      const M = load((u, o) => (++n === 1 ? Promise.resolve(bad(529)) : hangUntilAbort(o)), clock);
      const p = settle(M.callAura(msgs('A'), 'CORE x'));
      await tick();
      assert('(Γ) a hanging retry holds the lock', M.active() === true && n === 2);
      const q = settle(M.callAura(msgs('B'), 'CORE x')); await tick();
      const rq = await Promise.race([q, tick(40).then(() => 'still running')]);   // never wait forever on a call that slipped through
      assert('(Γ) … and a call started meanwhile is refused, nothing more is sent', rq === 'err:' + BUSY && n === 2);
      clock.fireTimeouts(); const r = await bounded(p);
      assert('(Γ) the retry times out: «Η σύνδεση έληξε…», two requests, the lock free', r.startsWith('err:Η σύνδεση έληξε') && n === 2 && M.active() === false);
    }
    // ── (Δ) more than one failure ────────────────────────────────────────────────────────────────────────────────────────────────
    {
      let n = 0; const M = load(() => { n++; return Promise.resolve(bad(529)); }, makeClock());
      const r = await bounded(settle(M.callAura(msgs('A'), 'CORE x')));
      assert('(Δ) two failures in a row: it stops after two requests (one retry, never a loop), an error, the lock free', r.startsWith('err:') && n === 2 && M.active() === false);
    }
    {
      let n = 0; const M = load(() => (++n === 1 ? Promise.resolve(bad(503)) : Promise.resolve(ok('   '))), makeClock());
      const r = await bounded(settle(M.callAura(msgs('A'), 'CORE x')));
      assert('(Δ) an empty reply on the retry is an error, never an empty message; the lock free', r.startsWith('err:') && n === 2 && M.active() === false);
    }
    {
      let n = 0; const M = load(() => (++n === 1 ? Promise.resolve(bad(503)) : Promise.reject(new TypeError('Failed to fetch'))), makeClock());
      const r = await bounded(settle(M.callAura(msgs('A'), 'CORE x')));
      assert('(Δ) the network drops during the retry: an error, the lock free', r.startsWith('err:') && n === 2 && M.active() === false);
    }
    // ── (Ε) never locked for good ────────────────────────────────────────────────────────────────────────────────────────────────
    for (const [name, script] of [['two failures', [bad(529), bad(529)]], ['a 4xx', [bad(400)]], ['an empty reply', [ok('')]], ['a dropped network', ['throw']]]) {
      let n = 0; const M = load(() => { const s = script[n++]; return s === 'throw' ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(s || ok('next')); }, makeClock());
      await bounded(settle(M.callAura(msgs('A'), 'CORE x')));
      const r = await bounded(settle(M.callAura(msgs('B'), 'CORE x')));
      assert(`(Ε) after ${name}, the next call goes through and gets its reply`, r === 'ok:next' && M.active() === false);
    }
    {
      const clock = makeClock(); let n = 0;
      const M = load((u, o) => (++n <= 2 ? (n === 1 ? Promise.resolve(bad(529)) : hangUntilAbort(o)) : Promise.resolve(ok('next'))), clock);
      const p = settle(M.callAura(msgs('A'), 'CORE x')); await tick(); clock.fireTimeouts(); await bounded(p);
      const r = await bounded(settle(M.callAura(msgs('B'), 'CORE x')));
      assert('(Ε) after a retry that timed out, the next call goes through', r === 'ok:next' && M.active() === false);
    }
    // ── (ΣΤ) unchanged behaviour ─────────────────────────────────────────────────────────────────────────────────────────────────
    {
      const first = deferred(); let n = 0;
      const M = load(() => (++n === 1 ? first.p : Promise.resolve(ok('second'))), makeClock());
      const a = settle(M.callAura(msgs('A'), 'CORE x')); await tick(2);
      const b = settle(M.callAura(msgs('B'), 'CORE x'));   // waits its 300 ms grace …
      first.res(ok('first'));                               // … during which the first call ends
      assert('(ΣΤ) the 300 ms grace: a call that overlaps a call ending within it still goes through', (await bounded(a)) === 'ok:first' && (await bounded(b)) === 'ok:second' && n === 2);
    }
    {
      const first = deferred(); let n = 0; const clock = makeClock();
      const M = load(() => (++n === 1 ? first.p : Promise.resolve(ok('second'))), clock);
      const a = settle(M.callAura(msgs('A'), 'CORE x')); await tick();
      const b = settle(M.callAura(msgs('B'), 'CORE x')); await tick();
      assert('(ΣΤ) two calls at once without a retry: the second is refused after its grace (as before)', (await bounded(b)) === 'err:' + BUSY && n === 1);
      first.res(ok('first')); assert('(ΣΤ) … and the first still gets its own reply', (await bounded(a)) === 'ok:first' && M.active() === false);
    }
    {
      let n = 0; const M = load(() => Promise.resolve(ok('r' + (++n))), makeClock());
      const a = await bounded(settle(M.callAura(msgs('A'), 'CORE x'))), b = await bounded(settle(M.callAura(msgs('B'), 'CORE x')));
      assert('(ΣΤ) two calls one after the other both go through, each with its own reply', a === 'ok:r1' && b === 'ok:r2' && n === 2 && M.active() === false);
    }
    // the request itself is unchanged: model, max_tokens, the core prompt split into its cached block
    {
      let body = null; const M = load((u, o) => { body = JSON.parse(o.body); return Promise.resolve(ok('x')); }, makeClock());
      await bounded(settle(M.callAura(msgs('A'), 'CORE x')));
      assert('(ΣΤ) the request is as before: one POST to /api/aura, the core prompt in a cached first block, the rest second',
        !!body && body.max_tokens === 1000 && body.system.length === 2 && body.system[0].text === 'CORE' && !!body.system[0].cache_control && body.system[1].text === ' x');
    }
  } catch (e) { failed++; console.log('FAIL — the test crashed: ' + (e && e.message)); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
