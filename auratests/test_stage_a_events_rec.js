// AURA — STAGE A, John's decision of 10/10/2026 (ADR «10 Οκτωβρίου», 2 and 3), exceptions to the freeze so that the 20
// sessions measure something.
//   2  IMMEDIATE MEASUREMENT (SPEC 2.2, device only, numbers only, never text). Each event is written the moment it happens:
//      the root card shown (door 1 button · 2 readiness · 3 spontaneous · 4 the first closing), the answer to it (1 «Ναι,
//      αυτό είναι» · 2 «Διόρθωσε» · 3 «Δεν το βρήκα ακόμα», from 1 the question · 2 the card · 3 the correction), the €6
//      offer shown, «Θέλω να συνεχίσω» (1) / «Όχι τώρα» (0), the clarity value 1–10, and session_abandoned (turns,
//      stageReached) when the page is closed or hidden before the end. coach_help_asked / coach_help_choice: unchanged.
//   3  TESTER MODE (?rec=1, with ?stageA=1): records like ?debug=1, WITHOUT the debug panel. On the last screen of a
//      session, and on the start screen when stored data exist, a small button «Στείλε τα στοιχεία της δοκιμής» under the
//      line «Μόνο αριθμοί — κανένα κείμενο της συζήτησης.» downloads / copies the numbers-only file. No network. Without
//      ?rec=1 nothing changes.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name) {
  const a = CODE.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = CODE.indexOf('(', a), depth = 0;
  for (; k < CODE.length; k++) { if (CODE[k] === '(') depth++; else if (CODE[k] === ')') { depth--; if (depth === 0) break; } }
  const b = CODE.indexOf('{', k); depth = 0;
  for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') depth++; else if (CODE[j] === '}') { depth--; if (depth === 0) return CODE.slice(a, j + 1); } }
  return null;
}
function extractBlock(startToken) {
  const a = CODE.indexOf(startToken);
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1); }
  }
  return null;
}
let F = {};
try {
  F = new Function(['initialStageAState', 'stageAStep', 'stageAFlowTelemetry', 'stageAHelpTelemetry', 'buildTesterExport', 'storedTelemetryCount'].map(n => fullFnSrc(n) || `function ${n}(){return undefined}`).join('\n') +
    '\nreturn { initialStageAState, stageAStep, stageAFlowTelemetry, stageAHelpTelemetry, buildTesterExport, storedTelemetryCount };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };

// Walk the real state machine; record what the app would record, step by step (flow events, then the existing help events).
function walk(evs, start) {
  let s = start || T('initialStageAState');
  const recs = [];
  for (const ev of evs) {
    const n = T('stageAStep', s, ev);
    const flow = T('stageAFlowTelemetry', s, n, ev);
    (Array.isArray(flow) ? flow : [{ event: 'BROKEN' }]).forEach(r => recs.push(r));
    const h = T('stageAHelpTelemetry', s, n, ev); if (h) recs.push(h);
    s = n;
  }
  return { s, recs, names: recs.map(r => r.event + (r.fields ? JSON.stringify(r.fields) : '')) };
}
const OPEN = d => ({ type: 'open', door: d, found: 'Φοβάμαι την απόρριψη', assistantReplies: 3, riskKind: 0 });

// ── 2: every step, the moment it happens ─────────────────────────────────────
{
  const w = walk([{ type: 'press' }, OPEN(1), { type: 'yes', riskKind: 0 }, { type: 'want' }, { type: 'help', choice: 2 }, { type: 'clarity', value: 8 }]);
  assert('FULL SESSION: card (door 1) → «Ναι» → offer shown → «Θέλω να συνεχίσω» → the one-tap question → choice → clarity, in this order',
    JSON.stringify(w.names) === JSON.stringify(['root_card_shown{"door":1}', 'root_answer{"answer":1,"from":2}', 'coach_offer_shown{"shown":1}',
      'coach_offer_answer{"want":1}', 'coach_help_asked{"asked":1}', 'coach_help_choice{"choice":2}', 'clarity_scale{"value":8}']));
  const n = walk([{ type: 'press' }, OPEN(1), { type: 'yes', riskKind: 0 }, { type: 'notNow' }, { type: 'clarity', value: 3 }]);
  assert('«Όχι τώρα» → coach_offer_answer want 0, then the clarity value', JSON.stringify(n.names.slice(2)) === JSON.stringify(['coach_offer_shown{"shown":1}', 'coach_offer_answer{"want":0}', 'clarity_scale{"value":3}']));
  const r = walk([{ type: 'press' }, OPEN(1), { type: 'yes', riskKind: 3 }]);
  assert('DISTRESS / crisis B earlier: «Ναι» is recorded, NO offer is shown, so none is recorded', JSON.stringify(r.names) === JSON.stringify(['root_card_shown{"door":1}', 'root_answer{"answer":1,"from":2}']));
}
{
  const S0 = T('initialStageAState');
  const d2 = walk([{ type: 'ready' }, OPEN(2)]); const d3 = walk([OPEN(3)]); const d4 = walk([{ type: 'leaving' }, OPEN(1)]);
  assert('DOOR: 2 after the readiness «Ναι», 3 for a spontaneous recognition, 4 for the first closing (the door is 1 in the stats, «κλείσιμο» here)',
    d2.names[0] === 'root_card_shown{"door":2}' && d3.names[0] === 'root_card_shown{"door":3}' && d4.names[0] === 'root_card_shown{"door":4}');
  const c = walk([{ type: 'press' }, OPEN(1), { type: 'correctStart' }, { type: 'correctDone', found: 'Φοβάμαι ότι θα με απορρίψουν' }, { type: 'yes', riskKind: 0 }]);
  assert('«Διόρθωσε» → answer 2; the corrected card is NOT counted as a second card; then «Ναι»',
    JSON.stringify(c.names.slice(0, 3)) === JSON.stringify(['root_card_shown{"door":1}', 'root_answer{"answer":2,"from":2}', 'root_answer{"answer":1,"from":2}']));
  const bq = walk([{ type: 'press' }, { type: 'back' }]), bc = walk([{ type: 'press' }, OPEN(1), { type: 'back' }]), bx = walk([{ type: 'press' }, OPEN(1), { type: 'correctStart' }, { type: 'back' }]);
  assert('«Δεν το βρήκα ακόμα» → answer 3, from the question (1), the card (2) or the correction (3)',
    bq.names[0] === 'root_answer{"answer":3,"from":1}' && bc.names[1] === 'root_answer{"answer":3,"from":2}' && bx.names[2] === 'root_answer{"answer":3,"from":3}');
  const a = walk([{ type: 'press' }, OPEN(1)], S0);
  const sup = T('stageAStep', T('stageAStep', S0, { type: 'press' }), Object.assign(OPEN(1), { riskKind: 1 }));
  assert('NOT RECORDED: tier A (no card is shown), an event that does not fit, a missing argument',
    (T('stageAFlowTelemetry', T('stageAStep', S0, { type: 'press' }), sup, Object.assign(OPEN(1), { riskKind: 1 })) || ['x']).length === 0 &&
    T('stageAFlowTelemetry', a.s, a.s, { type: 'want' }).length === 0 && T('stageAFlowTelemetry', null, a.s, { type: 'yes' }).length === 0 && T('stageAFlowTelemetry', a.s, null, {}).length === 0);
  assert('NO TEXT: the rule reads the step, the door, the phase and the clarity number — never the root text',
    !/\.found|\.knew|content|userText/.test(fullFnSrc('stageAFlowTelemetry') || 'found'));
}

// ── Written at once, and kept if the user leaves right after (persisted for ?debug=1 OR ?rec=1) ─────
{
  const src = fullFnSrc('recordTelemetry');
  const run = search => { const store = {}; const win = { location: { search }, localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } } };
    try { const rt = new Function('window', 'console', 'URLSearchParams', src + '\nreturn recordTelemetry;')(win, { log() {} }, URLSearchParams); rt('root_card_shown', { door: 2 }); rt('root_answer', { answer: 1, from: 2 }); } catch (e) { return null; }
    return JSON.parse(store['aura_telemetry_log'] || '[]'); };
  const rec = run('?stageA=1&rec=1'), dbg = run('?stageA=1&debug=1'), none = run('?stageA=1');
  assert('?rec=1 → every record is written to the device log immediately (a page closed right after loses nothing)', Array.isArray(rec) && rec.length === 2 && rec[0].ev === 'root_card_shown' && rec[0].door === 2);
  assert('?debug=1 → as before', Array.isArray(dbg) && dbg.length === 2);
  assert('neither → nothing is written to the device (as before)', Array.isArray(none) && none.length === 0);
}
{
  const d = (CODE.match(/const stageADispatch = useCallback\(\(ev\) => \{[\s\S]*?\n  \}, \[\]\);/) || [''])[0];
  assert('WIRING: stageADispatch records the flow events right after the step, then the one-tap ones (unchanged)',
    /stageARef\.current = stageAStep\(_prev, ev\);\s*setStageAPhase\(stageARef\.current\.phase\);\s*for \(const _r of stageAFlowTelemetry\(_prev, stageARef\.current, ev\)\) recordTelemetry\(_r\.event, _r\.fields\);[^\n]*\n\s*const _tel = stageAHelpTelemetry\(_prev, stageARef\.current, ev\);/.test(d));
}
// session_abandoned
{
  const at = CODE.indexOf('// ADR «10 Οκτωβρίου», 2 — session_abandoned');
  const eff = at >= 0 ? CODE.slice(at, at + 1800) : '';
  assert('ABANDONED: listens to pagehide AND visibilitychange (hidden) — what a phone gives when the tab is closed or left',
    /window\.addEventListener\("pagehide", _onLeave\);/.test(eff) && /document\.addEventListener\("visibilitychange", _onVis\);/.test(eff) && /document\.visibilityState === "hidden"/.test(eff));
  assert('ABANDONED: once per session, only after it started and before it ended',
    /if \(!_a\.started \|\| _a\.ended \|\| _a\.done\) return;\s*_a\.done = true;/.test(eff));
  assert('ABANDONED: turns and stageReached (stageReached only with the switch open), numbers only',
    /recordTelemetry\("session_abandoned", \{ turns: Math\.min\(9999, turnCount\.current \|\| 0\), \.\.\.\(stageAActive\.current \? \{ stageReached: stageARef\.current\.stats\.stageReached \|\| 0 \} : \{\}\) \}\);/.test(eff));
  assert('ABANDONED: the listeners are removed on unmount', /window\.removeEventListener\("pagehide", _onLeave\);/.test(eff) && /document\.removeEventListener\("visibilitychange", _onVis\);/.test(eff));
  assert('ABANDONED: started / ended follow the session; a new session can be abandoned again',
    /abandonMark\.current\.started = sessionStarted \|\| messages\.length > 0;/.test(CODE) && /abandonMark\.current\.ended = sessionEnded;/.test(CODE) &&
    /abandonMark\.current = \{ started: false, ended: false, done: false \};/.test(extractBlock('const resetSession = () =>') || ''));
}

// ── 3: tester mode ───────────────────────────────────────────────────────────
{
  assert('TEXTS: exactly the two approved lines', /const TESTER_TEXTS = \{ line: "Μόνο αριθμοί — κανένα κείμενο της συζήτησης\.", button: "Στείλε τα στοιχεία της δοκιμής" \};/.test(CODE));
  assert('MODE: ?rec=1, read once per visit like ?debug=1', /const recMode = useRef\(typeof window !== 'undefined' && new URLSearchParams\(window\.location\.search\)\.get\('rec'\) === '1'\);/.test(CODE));
  assert('NO PANEL: the debug panel still depends on ?debug=1 only', /\{debugMode\.current && \(/.test(CODE) && !/\{recMode\.current \|\| debugMode\.current/.test(CODE) && !/debugMode\.current \|\| recMode/.test(CODE));
  const end = CODE.slice(CODE.indexOf('{/* Session end */}'), CODE.indexOf('{/* Session end */}') + 1600);
  assert('END SCREEN: the line, then the small button, only with ?rec=1',
    /\{recMode\.current && \(\s*<div[^>]*>\s*<div[^>]*>\{TESTER_TEXTS\.line\}<\/div>\s*<button[^>]*onClick=\{exportTesterData\}[^>]*>\{TESTER_TEXTS\.button\}<\/button>/.test(end));
  const intro = CODE.slice(CODE.indexOf('{messages.length === 0 && !sessionStarted && introChoice === null && ('), CODE.indexOf('{/* ── Intro overlay'));
  assert('START SCREEN: the same, only with ?rec=1 AND stored data on the device',
    /\{recMode\.current && storedTelemetryCount\(\) > 0 && \(\s*<div[^>]*>\s*<div[^>]*>\{TESTER_TEXTS\.line\}<\/div>\s*<button[^>]*onClick=\{exportTesterData\}[^>]*>\{TESTER_TEXTS\.button\}<\/button>/.test(intro));
  const ex = fullFnSrc('exportTesterData') || '';
  assert('EXPORT: from the device log, through buildTesterExport, downloaded AND copied — no fetch, no network of any kind',
    /buildTesterExport\(/.test(ex) && /aura_telemetry_log/.test(ex) && /a\.download = /.test(ex) && /navigator\.clipboard/.test(ex) && !/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(ex));
  assert('EXPORT: the file is named aura_dokimi_YYYY-MM-DD.json (the date of the export) — what the tester attaches',
    /a\.download = "aura_dokimi_" \+ now\.slice\(0, 10\) \+ "\.json";/.test(ex) && /const now = new Date\(\)\.toISOString\(\);/.test(ex));
  assert('NETWORK: the app still has exactly one fetch — /api/aura — and no beacon / XHR / socket anywhere',
    (CODE.match(/fetch\(/g) || []).length === 1 && CODE.includes('fetch("/api/aura"') && !/sendBeacon|new XMLHttpRequest|new WebSocket/.test(CODE));
  // the export filter itself
  const out = T('buildTesterExport', [{ ev: 'root_card_shown', t: 1700000000000, door: 2 }, { ev: 'x', text: 'Φοβάμαι την απόρριψη', nested: { a: 1 }, ok: true },
    { ev: 'Bad Name', n: 1 }, null, 'string', { n: 3 }], '2026-10-10T10:00:00.000Z');
  assert('FILTER: keeps the event name and numbers / booleans, drops any text, object, bad name or broken record',
    out && out.records === 2 && out.events[0].door === 2 && out.events[1].ok === true && !JSON.stringify(out.events).includes('Φοβάμαι') && !('nested' in out.events[1]));
  assert('FILTER: the note is plain and says the same thing in English (no conversation text)', out && /counts and flags only/.test(out.note) && out.exportedAt === '2026-10-10T10:00:00.000Z');
  // stored count (start-screen condition)
  const cnt = (v, throws) => { try { const g = globalThis; const old = g.window; g.window = { localStorage: { getItem: () => { if (throws) throw new Error('blocked'); return v; } } }; const r = F.storedTelemetryCount(); g.window = old; return r; } catch (e) { return 'threw'; } };
  assert('STORED COUNT: the number of records in the device log; 0 when empty, broken or blocked', cnt('[{"ev":"a"},{"ev":"b"}]') === 2 && cnt(null) === 0 && cnt('{bad') === 0 && cnt('[]', true) === 0);
  assert('NEVER SENDS: a tester device (?rec=1) is excluded from the remote channel, like ?debug=1 (the channel itself stays closed)',
    /const REMOTE_TELEMETRY_ENABLED = false;/.test(CODE) && /return p\.get\("debug"\) !== "1" && p\.get\("rec"\) !== "1";/.test(fullFnSrc('isRemoteTelemetryActive') || ''));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
