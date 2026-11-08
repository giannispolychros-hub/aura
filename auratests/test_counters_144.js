// AURA — ROUND 9 (John, 8/11/2026, ADR «8 Νοεμβρίου», branch release-candidate): TWO COUNTERS IN THE TESTER EXPORT, AND ITEM 144.
//
// (α) Two numbers in the export the testers send (?rec=1 only, like every record of the device log), and nothing else:
//     finalCheckReplaced — how many times the final check replaced a reply with the app's fixed text: the exit (finishReply) said no,
//       the closing's own text did not pass (closingFinish), or the bubble guard drew the fixed text instead of a message;
//     apiFailed — how many requests the API refused or that failed: an error status (each request, a retry is a request of its own),
//       a reply of the wrong shape or empty, a timeout, no network. Once per request, never twice.
//     Each is one record with its name and its time only — no status, no text, no field at all.
// (β) Item 144: the map's one record (branchCount, ?rec=1 only) is written in the moment the map shows — and when the map shows as the
//     session ends, BEFORE the session's own record (session_completed), not after it.
// Nothing else changes: no detector, no text, no prompt, no safety behaviour. Proved here: with the changes of this round taken out,
// src/App.jsx is byte for byte the file of release-candidate 52f85dc, and api/aura.js is unchanged.
// The same on the screen: scripts/e2e_stage_a.cjs, section CT (the counters) and TM3 (the order of the two records).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Blob } = require('buffer');

const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
function extract(name) {
  let s = CODE.indexOf('\nasync function ' + name + '(');
  if (s < 0) s = CODE.indexOf('\nfunction ' + name + '(');
  if (s < 0) return '';
  return CODE.slice(s + 1, CODE.indexOf('\n}', s + 1) + 2);
}
// the loader of test_rc_coexistence.js: a top-level function with everything it needs from the top of the file
function load(names) {
  const code = raw.slice(0, ci) + 'const AURA_CORE_PERSONALITY = "";' + raw.slice(ce + 2);
  const top = code.slice(0, code.indexOf('\nexport default function AURAv2'));
  const re = /^(?:async )?function ([A-Za-z_$][\w$]*)\(|^(?:const|let) ([A-Za-z_$][\w$]*) =/gm;
  const starts = []; let m; while ((m = re.exec(top))) starts.push({ name: m[1] || m[2], at: m.index });
  const blocks = Object.create(null);
  for (let i = 0; i < starts.length; i++) { const b = top.slice(starts[i].at, i + 1 < starts.length ? starts[i + 1].at : top.length).replace(/(\n\/\/[^\n]*)+\s*$/, '\n');
    if (/return \(\s*</.test(b) || /^const [A-Za-z_$][\w$]* = memo\(/.test(b)) continue; blocks[starts[i].name] = b; }
  const seen = new Set(), order = [];
  const visit = n => { if (seen.has(n) || !blocks[n]) return; seen.add(n); for (const id of new Set(blocks[n].match(/\b[A-Za-z_$][\w$]*\b/g) || [])) if (id !== n && blocks[id]) visit(id); order.push(n); };
  names.forEach(visit);
  try { return new Function(order.map(n => blocks[n]).join('\n') + '\nreturn {' + names.filter(n => blocks[n]).join(',') + '};')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); return {}; }
}
const blockFrom = start => { const a = raw.indexOf(start); if (a < 0) return ''; let d = 0, s = false;
  for (let k = raw.indexOf('{', a); k < raw.length; k++) { if (raw[k] === '{') { d++; s = true; } else if (raw[k] === '}') { d--; if (s && !d) return raw.slice(a, k + 1); } } return ''; };
const keysOf = r => JSON.stringify(Object.keys(r || {}).sort());

// ── (Α) apiFailed: callAura from App.jsx, with a fake fetch, a fake clock and the real recordTelemetry ─────────────────────────────
const CALL_NAMES = ['recordTelemetry', 'apiErrorReasonCode', 'friendlyApiError', 'isEmptyModelResponse', 'capMessageHistory', 'callAura'];
const SRC = ['let _activeCall = false;', 'const AURA_CORE_PERSONALITY = "CORE";', ...CALL_NAMES.map(extract),
  'return { callAura, active: () => _activeCall, recs: () => (window.__auraTelemetry || []) };'].join('\n');
assert('(load) callAura, the real recordTelemetry and what they call are found in src/App.jsx', CALL_NAMES.every(n => extract(n).length > 0));
function makeClock() {   // waits under 1 s run on the next turn of the loop; the 26 s timeout fires only by fireTimeouts()
  const long = new Map(); let id = 0;
  return { setTimeout: (f, ms) => { id++; if (ms < 1000) setImmediate(f); else long.set(id, f); return id; },
    clearTimeout: t => { long.delete(t); }, fireTimeouts: () => { for (const [k, f] of [...long]) { long.delete(k); f(); } } };
}
function boot(fetchImpl, clock) {
  const env = { fetch: fetchImpl, Blob, AbortController, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout,
    window: { location: { search: '' } }, console: { log() {}, warn() {} } };
  return new Function(...Object.keys(env), SRC)(...Object.values(env));
}
const tick = async (n = 12) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const deferred = () => { let res, rej; const p = new Promise((a, b) => { res = a; rej = b; }); return { p, res, rej }; };
const ok = t => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: t }], usage: {} }) });
const bad = s => ({ ok: false, status: s, json: async () => ({ error: { type: 'x', message: 'Φοβάμαι την απόρριψη' } }) });
const hangUntilAbort = o => new Promise((_, rej) => o.signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; rej(e); }));
const offline = () => Promise.reject(new TypeError('Failed to fetch'));
const settle = p => p.then(r => 'ok:' + r, e => 'err:' + e.message);
const bounded = (p, turns = 400) => Promise.race([p, tick(turns).then(() => 'still running')]);
const TIMEOUT_TEXT = 'Η σύνδεση έληξε. Έλεγξε το δίκτυό σου και δοκίμασε ξανά.';
// one scenario: the replies of the fake fetch in order (a function gets the fetch options), → { r, sent, failedRecs, apiErrors, recs }
async function scenario(replies, opts) {
  const o = opts || {}; const clock = makeClock(); let n = 0;
  const M = boot((u, fo) => { const r = replies[Math.min(n++, replies.length - 1)]; return typeof r === 'function' ? r(fo) : Promise.resolve(r); }, clock);
  const p = settle(M.callAura([{ role: 'user', content: 'Φοβάμαι την απόρριψη' }], 'CORE x'));
  if (o.timeouts) for (let i = 0; i < o.timeouts; i++) { await tick(); clock.fireTimeouts(); }
  const r = await bounded(p);
  const recs = M.recs();
  return { r, sent: n, failedRecs: recs.filter(x => x.ev === 'api_failed'), apiErrors: recs.filter(x => x.ev === 'api_error').length, recs, M };
}

// ── (Β) finalCheckReplaced: finishReply and the guard's counter from App.jsx, with a fake window ──────────────────────────────────
const F = load(['finishReply', 'countGuardReplaced', 'buildTesterExport', 'recordTelemetry']);
const W = { location: { search: '' } };
const quiet = f => { const l = console.log; const g = globalThis.window; console.log = () => {}; globalThis.window = W; try { return f(); } catch (e) { return { threw: e && e.message }; } finally { console.log = l; globalThis.window = g; } };
const replaced = () => (W.__auraTelemetry || []).filter(r => r.ev === 'final_check_replaced');
const ctx = o => Object.assign({ kind: 'model', mode: 'ANSWER', lastUserText: 'Δεν ξέρω.', modelText: '', safetyPath: false, danger: null, supportShown: false, dangerShown: [] }, o);
const REPLY = 'Σε ακούω. Τι γίνεται τώρα;';
const LONG = ('Αυτό είναι ένα πολύ μεγάλο κείμενο που δεν τελειώνει. ').repeat(140);

(async () => {
  try {
    // (Α)
    const a1 = await scenario([ok('reply')]);
    assert('(Α1) a reply that comes back as it should — no api_failed', a1.r === 'ok:reply' && a1.failedRecs.length === 0);
    const a2 = await scenario([bad(403)]);
    assert('(Α2) the API refuses the request (403, not retried) — one api_failed; the person still gets the app\'s own words', a2.r.startsWith('err:') && a2.sent === 1 && a2.failedRecs.length === 1);
    const a3 = await scenario([bad(500), bad(500)]);
    assert('(Α3) a 500 and its retry fails too — two requests failed: two api_failed', a3.sent === 2 && a3.failedRecs.length === 2 && a3.r.startsWith('err:'));
    const a4 = await scenario([bad(500), ok('again')]);
    assert('(Α4) a 500 and the retry answers — the first request failed: one api_failed, and the person gets the reply', a4.r === 'ok:again' && a4.sent === 2 && a4.failedRecs.length === 1);
    const a5 = await scenario([bad(429), ok('again')]);
    assert('(Α5) a 429 and the retry answers — one api_failed', a5.r === 'ok:again' && a5.failedRecs.length === 1);
    const a6 = await scenario([{ ok: true, status: 200, json: async () => ({ id: 'x' }) }]);
    assert('(Α6) a reply of the wrong shape — one api_failed', a6.r.startsWith('err:') && a6.failedRecs.length === 1);
    const a7 = await scenario([{ ok: true, status: 200, json: async () => { throw new SyntaxError('not json'); } }]);
    assert('(Α7) a body that is not JSON — one api_failed', a7.r.startsWith('err:') && a7.failedRecs.length === 1);
    const a8 = await scenario([ok('   ')]);
    assert('(Α8) an empty reply — one api_failed (the old api_error record of it stays as it was)', a8.r.startsWith('err:') && a8.failedRecs.length === 1 && a8.apiErrors === 1);
    const a9 = await scenario([hangUntilAbort], { timeouts: 1 });
    assert('(Α9) a timeout — one api_failed; callAura still throws its own text (how the app knows it was a timeout)', a9.r === 'err:' + TIMEOUT_TEXT && a9.sent === 1 && a9.failedRecs.length === 1);
    const a10 = await scenario([offline]);
    assert('(Α10) no network (fetch\'s own error) — one api_failed, not two; not retried', a10.r === 'err:Failed to fetch' && a10.sent === 1 && a10.failedRecs.length === 1);
    const a11 = await scenario([bad(503), offline]);
    assert('(Α11) a 503, then no network on the retry — two requests, two api_failed (never three: each request once)', a11.sent === 2 && a11.failedRecs.length === 2);
    const a12 = await scenario([bad(502), hangUntilAbort], { timeouts: 2 });
    assert('(Α12) a 502, then a timeout on the retry — two api_failed', a12.r === 'err:' + TIMEOUT_TEXT && a12.sent === 2 && a12.failedRecs.length === 2);
    { const clock = makeClock(); const slow = deferred(); let n = 0;
      const M = boot(() => { n++; return n === 1 ? slow.p : Promise.resolve(ok('x')); }, clock);
      const first = settle(M.callAura([{ role: 'user', content: 'Α' }], 'CORE x')); await tick();
      const second = await bounded(settle(M.callAura([{ role: 'user', content: 'Β' }], 'CORE x')));
      slow.res(ok('first')); await bounded(first);
      assert('(Α13) a second call the app refuses while one runs never reached the API — no api_failed', second.startsWith('err:') && n === 1 && M.recs().filter(r => r.ev === 'api_failed').length === 0); }
    const all = [a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12].flatMap(s => s.failedRecs);
    assert('(Α14) every api_failed record is its name and its time — no status, no reason, no text', all.length === 14 && all.every(r => keysOf(r) === '["ev","t"]' && Number.isInteger(r.t)));
    assert('(Α15) the old api_error records are as they were — a 4xx: one; a 500 then a 500: one (the last failure\'s body); a 500 then a reply: none',
      a2.apiErrors === 1 && a3.apiErrors === 1 && a4.apiErrors === 0);
    assert('(Α16) the app has exactly one place that writes api_failed, inside callAura', (raw.match(/recordTelemetry\("api_failed"/g) || []).length === 1 && extract('callAura').includes('recordTelemetry("api_failed")'));

    // (Β)
    assert('(load) finishReply, the guard\'s counter and the export are found in src/App.jsx', ['finishReply', 'countGuardReplaced', 'buildTesterExport'].every(n => typeof F[n] === 'function'));
    const b1 = quiet(() => F.finishReply(REPLY, ctx({ modelText: REPLY })));
    assert('(Β1) a reply that passes the exit — nothing counted', b1 && b1.failed === false && b1.content === REPLY && replaced().length === 0);
    const b2 = quiet(() => F.finishReply(LONG, ctx({ modelText: LONG })));
    assert('(Β2) a reply the exit refuses (' + LONG.length + ' characters) — replaced by the app\'s fixed text: one final_check_replaced', b2 && b2.failed === true && b2.why === 'long' && replaced().length === 1);
    const THROWS = Object.defineProperty(ctx({}), 'kind', { get() { throw new Error('x'); } });
    const b3 = quiet(() => F.finishReply(REPLY, THROWS));
    assert('(Β3) the exit fails inside (it never throws) — replaced as well: one more', b3 && b3.failed === true && b3.why === 'threw' && replaced().length === 2);
    const b4 = quiet(() => F.finishReply('', ctx({ modelText: 'Μια περίληψη του μοντέλου πριν από τη ρίζα.' })));
    assert('(Β4) a reply its path took away ON PURPOSE (Stage A, before the root) — not a replacement: nothing counted', b4 && b4.failed === false && b4.content === '' && replaced().length === 2);
    const b4b = quiet(() => F.finishReply('', ctx({ modelText: '' })));
    assert('(Β4) … but an empty reply of the model itself is refused — counted', b4b && b4b.failed === true && replaced().length === 3);
    assert('(Β5) each final_check_replaced record is its name and its time — no reason, no text', replaced().length === 3 && replaced().every(r => keysOf(r) === '["ev","t"]'));
    { const before = replaced().length;
      quiet(() => { F.countGuardReplaced({ id: 'm1' }); F.countGuardReplaced({ id: 'm1' }); F.countGuardReplaced({ id: 'm1', content: 'x' }); });
      const one = replaced().length - before;
      quiet(() => F.countGuardReplaced({ id: 'm2' }));
      const two = replaced().length - before;
      const noId = { role: 'assistant', content: 'x' };
      quiet(() => { F.countGuardReplaced(noId); F.countGuardReplaced(noId); });
      assert('(Β6) the bubble guard\'s counter: once per message, however many times its bubble is drawn (a message without an id: once per message object)',
        one === 1 && two === 2 && replaced().length - before === 3); }
    { const MB = (() => { const a = raw.indexOf('const MessageBubble = memo(function MessageBubble('); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n});', a)); })();
      assert('(Β7) the guard counts the message it replaces, right where it draws the fixed text — and only there',
        /if \(!isUser && !fkShownOk\(visibleText\(msg, roadMap, displayContent, shownContent\)\)\) \{\n    countGuardReplaced\(msg\);\n    return \(\n      <div className="turn turn-aura" data-final-check="failed">/.test(MB) &&
        (raw.match(/countGuardReplaced\(/g) || []).length === 2); }
    { const CF = blockFrom('const closingFinish = useCallback(');
      assert('(Β8) the closing: its own text not the text that passed — counted there; a «no» of the exit is already counted inside finishReply, not twice',
        CF.includes('if (base !== text) { recordTelemetry("final_check_replaced"); return { failed: true }; }') && CF.includes('    if (r.failed) return { failed: true };\n') &&
        (CF.match(/final_check_replaced/g) || []).length === 1); }
    assert('(Β9) four places write final_check_replaced and no other — the exit (its two «no»), the closing\'s own text, the bubble guard',
      (raw.match(/recordTelemetry\("final_check_replaced"\)/g) || []).length === 4 && (raw.match(/final_check_replaced/g) || []).length === 6);

    // (Γ) the export
    const TXT = 'Φοβάμαι την απόρριψη';
    const rows = [{ ev: 'api_failed', t: 1 }, { ev: 'session_started', t: 2, n: 1 }, { ev: 'api_failed', t: 3, text: TXT }, { ev: 'final_check_replaced', t: 4 },
      { ev: 'api_error', t: 5, status: 500, reason: 1 }, { ev: 'Bad Name', t: 6 }, null, { ev: 'final_check_replaced', t: 7, why: TXT }, { ev: 'api_failed', t: 8 }];
    const x = quiet(() => F.buildTesterExport(rows, '2026-11-08T10:00:00.000Z'));
    assert('(Γ1) the export carries the two counters — from the records of the device log: 2 replaced, 3 failed requests',
      !!x && !!x.counters && keysOf(x.counters) === '["apiFailed","finalCheckReplaced"]' && x.counters.finalCheckReplaced === 2 && x.counters.apiFailed === 3);
    const z = quiet(() => F.buildTesterExport([], '2026-11-08')), zb = quiet(() => F.buildTesterExport('broken', ''));
    assert('(Γ2) nothing in the log (or a broken log) — both 0', !!z && !!z.counters && z.counters.finalCheckReplaced === 0 && z.counters.apiFailed === 0 && !!zb && !!zb.counters && zb.counters.apiFailed === 0);
    assert('(Γ3) everything else exactly as before — the time, the note, the number of records, the records filtered the same way (no text)',
      !!x && keysOf(x) === '["counters","events","exportedAt","note","records"]' && x.exportedAt === '2026-11-08T10:00:00.000Z' && /counts and flags only/.test(x.note) &&
      x.records === 7 && x.events.length === 7 && !JSON.stringify(x).includes(TXT) && x.events.every(e => Object.values(e).every(v => typeof v !== 'string' || v === e.ev)));
    assert('(Γ4) only numbers: the two counters are integers; the export as a whole holds no letter of the Greek alphabet', !!x && !!x.counters && Number.isInteger(x.counters.apiFailed) && Number.isInteger(x.counters.finalCheckReplaced) && !/[Α-Ωα-ωά-ώ]/.test(JSON.stringify(x)));
    assert('(Γ5) only with ?rec=1, like the existing records: the device log, how it is kept and how it is exported are untouched (recordTelemetry and exportTesterData byte for byte)',
      sha(extract('recordTelemetry')).slice(0, 16) === 'bc79a4b2654cf306' && sha(extract('exportTesterData')).slice(0, 16) === 'd3ee9ebe10c78f7a');

    // (Δ) item 144
    { const H = blockFrom('const logThoughtMapOnce = thoughtMap => {');
      assert('(Δ1) the map\'s one record in one helper — once per session (the latch), only thoughtMapRecFields\' field, only with ?rec=1',
        H === 'const logThoughtMapOnce = thoughtMap => {\n    if (!thoughtMap || thoughtMapLogged.current) return;\n    thoughtMapLogged.current = true;\n    const f = thoughtMapRecFields(thoughtMap, recMode.current);\n    if (f) recordTelemetry("thought_map", f);\n  }');
      assert('(Δ2) the map\'s effect writes it through the helper, in the moment the map shows',
        raw.includes('  useEffect(() => { if (thoughtMapShown) logThoughtMapOnce(thoughtMap); }, [thoughtMapShown]); // eslint-disable-line react-hooks/exhaustive-deps'));
      const SE = (() => { const a = raw.indexOf('  useEffect(() => {\n    if (!sessionEnded) return;'); return a < 0 ? '' : raw.slice(a, raw.indexOf('}, [sessionEnded]);', a)); })();
      assert('(Δ3) item 144: the session\'s end writes a map shown now BEFORE its own record (session_completed) — right before it',
        SE.length > 0 && /\n      logThoughtMapOnce\(thoughtMap\);[^\n]*\n      recordTelemetry\("session_completed", \{/.test(SE));
      assert('(Δ4) one record of the map in the whole app, one latch set and one reset — so it is written once per session, whoever writes it first',
        (raw.match(/recordTelemetry\("thought/g) || []).length === 1 && (raw.match(/thoughtMapLogged\.current = /g) || []).length === 2 &&
        /thoughtMapLogged\.current = false; \/\/ Thought Map/.test(raw) && (raw.match(/logThoughtMapOnce\(/g) || []).length === 2); }

    // (Ε) nothing else changed
    assert('(Ε1) the prompt is b5f303cc9405aa21', sha(raw.slice(cs, ce)).slice(0, 16) === 'b5f303cc9405aa21');
    assert('(Ε2) api/aura.js is byte for byte the file of release-candidate 52f85dc', sha(fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8')) === 'e791b19471f0813246550e9d5a47bf7d95e46b4385814e4758d4abf8dea66053');
    // each change of this round, new → old, exactly as written; once taken out, the whole file must be release-candidate 52f85dc's
    const UNDO = [["// → { content, failed, why, supportShown, dangerShown, lines, hidden }. Never throws: anything that goes wrong is { failed: true }.\n// THE COUNTER (John, 8/11/2026, ADR «8 Νοεμβρίου»): each time the exit says no — the reply is replaced by the app's fixed text — one\n// record, final_check_replaced, with no field at all.\nfunction finishReply(text, ctx) {", "// → { content, failed, why, supportShown, dangerShown, lines, hidden }. Never throws: anything that goes wrong is { failed: true }.\nfunction finishReply(text, ctx) {"], ["    if (!ck.ok) { recordTelemetry(\"final_check_replaced\"); return { content: \"\", failed: true, why: ck.why, lines: [], ...keep }; }", "    if (!ck.ok) return { content: \"\", failed: true, why: ck.why, lines: [], ...keep };"], ["  } catch (e) {\n    recordTelemetry(\"final_check_replaced\");\n    return { content: \"\", failed: true, why: \"threw\", lines: [], ...keep };", "  } catch (e) {\n    return { content: \"\", failed: true, why: \"threw\", lines: [], ...keep };"], ["  return FK_PASSED.has(fkStamp(typeof visible === \"string\" ? visible : \"\"));\n}\n// THE COUNTER (John, 8/11/2026, ADR «8 Νοεμβρίου»): a message the bubble guard replaced with the fixed text — counted once per message\n// (a bubble is drawn many times), with no field at all.\nconst FK_GUARD_COUNTED = new Set();\nfunction countGuardReplaced(msg) {\n  const key = msg && msg.id != null ? msg.id : msg;\n  if (FK_GUARD_COUNTED.has(key)) return;\n  FK_GUARD_COUNTED.add(key);\n  recordTelemetry(\"final_check_replaced\");\n}\n", "  return FK_PASSED.has(fkStamp(typeof visible === \"string\" ? visible : \"\"));\n}\n"], ["  // THE COUNTER (John, 8/11/2026, ADR «8 Νοεμβρίου»): a request the API refused or that failed — an error status, a reply of the wrong\n  // shape or empty, a timeout, no network — one record, api_failed, with no field at all; once per request (a retry is a request of its own).\n  let _apiFailedCounted = false;\n  const apiFailed = () => { if (!_apiFailedCounted) { _apiFailedCounted = true; recordTelemetry(\"api_failed\"); } };\n  // FIX 1: AbortController — 30s timeout for mobile network stalls\n  const controller = new AbortController();", "  // FIX 1: AbortController — 30s timeout for mobile network stalls\n  const controller = new AbortController();"], ["    if (!res.ok) {\n      apiFailed();\n      if (retries > 0 && (res.status === 429 || res.status >= 500)) {", "    if (!res.ok) {\n      if (retries > 0 && (res.status === 429 || res.status >= 500)) {"], ["    if (!data || !Array.isArray(data.content)) { apiFailed(); throw new Error(friendlyApiError(0)); }", "    if (!data || !Array.isArray(data.content)) throw new Error(friendlyApiError(0));"], ["      recordTelemetry(\"api_error\", { status: 0, reason: 2 });\n      apiFailed();\n      throw new Error(friendlyApiError(0));", "      recordTelemetry(\"api_error\", { status: 0, reason: 2 });\n      throw new Error(friendlyApiError(0));"], ["  } catch (err) {\n    if (err && (err.name === \"AbortError\" || err.name === \"TypeError\")) apiFailed(); // a timeout, or no network (fetch's own error)\n    if (err.name === \"AbortError\") {", "  } catch (err) {\n    if (err.name === \"AbortError\") {"], ["    if (base !== text) { recordTelemetry(\"final_check_replaced\"); return { failed: true }; } // the closing itself must be the text that passed", "    if (base !== text) return { failed: true }; // the closing itself must be the text that passed"], ["  if (!isUser && !fkShownOk(visibleText(msg, roadMap, displayContent, shownContent))) {\n    countGuardReplaced(msg);\n    return (", "  if (!isUser && !fkShownOk(visibleText(msg, roadMap, displayContent, shownContent))) {\n    return ("], ["  const thoughtMapLogged = useRef(false);\n  // THOUGHT MAP, item 144 (John, 8/11/2026, ADR «8 Νοεμβρίου»): the map's one record, once per session (the latch), in the moment the map\n  // shows — written by the map's effect, or, when the map shows as the session ends, by the session's end BEFORE its own record.\n  const logThoughtMapOnce = thoughtMap => {\n    if (!thoughtMap || thoughtMapLogged.current) return;\n    thoughtMapLogged.current = true;\n    const f = thoughtMapRecFields(thoughtMap, recMode.current);\n    if (f) recordTelemetry(\"thought_map\", f);\n  };\n", "  const thoughtMapLogged = useRef(false);\n"], ["      logThoughtMapOnce(thoughtMap); // item 144: a map shown now is recorded before the session's own record, not after it\n      recordTelemetry(\"session_completed\", {\n        turns: turnCount.current || 0,", "      recordTelemetry(\"session_completed\", {\n        turns: turnCount.current || 0,"], ["  useEffect(() => { if (thoughtMapShown) logThoughtMapOnce(thoughtMap); }, [thoughtMapShown]); // eslint-disable-line react-hooks/exhaustive-deps", "  useEffect(() => {\n    if (!thoughtMapShown || thoughtMapLogged.current) return;\n    thoughtMapLogged.current = true;\n    const f = thoughtMapRecFields(thoughtMap, recMode.current);\n    if (f) recordTelemetry(\"thought_map\", f);\n  }, [thoughtMapShown]); // eslint-disable-line react-hooks/exhaustive-deps"], ["  // THE TWO COUNTERS (John, 8/11/2026, ADR «8 Νοεμβρίου»): how many times the final check replaced a reply with the fixed text, and how\n  // many requests the API refused or that failed — two numbers, counted from the records above; nothing else.\n  const counters = { finalCheckReplaced: events.filter(e => e.ev === \"final_check_replaced\").length, apiFailed: events.filter(e => e.ev === \"api_failed\").length };\n  return { exportedAt: String(exportedAt || \"\"), note: \"AURA tester log — counts and flags only, never anything a person typed.\", records: events.length, counters, events };", "  return { exportedAt: String(exportedAt || \"\"), note: \"AURA tester log — counts and flags only, never anything a person typed.\", records: events.length, events };"]];
    const present = UNDO.filter(([nw]) => raw.split(nw).length === 2).length;
    let back = raw; for (const [nw, old] of UNDO) back = back.split(nw).join(old);
    assert('(Ε3) each of the ' + UNDO.length + ' changes of this round is in src/App.jsx exactly once', present === UNDO.length);
    assert('(Ε4) … and with them taken out, src/App.jsx is byte for byte the file of release-candidate 52f85dc (sha256 c7083048…) — nothing else changed',
      present === UNDO.length && sha(back) === 'c708304863efc654dccb8d5d869ca97dd0943e18aa033cd04fb25daf240937b7');
  } catch (e) { failed++; console.log('FAIL — the test crashed: ' + (e && e.message)); }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
