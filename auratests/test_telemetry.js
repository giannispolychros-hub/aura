// AURA — TELEMETRY GUARD (counts only, never content)
//
// WHY THIS FILE EXISTS. The final gap audit found that nothing in the product observes whether
// the chain CHAOS → QUESTION → EVIDENCE → STRUCTURE → PATTERN → REFLECTION actually completes.
// The single hardest finding of the whole audit — that the ROAD MAP rule lives in the prompt,
// has zero code enforcement, and produced ZERO maps across two real live sessions — was learned
// only because the founder pasted two transcripts by hand. That is not a measurement system.
//
// WHAT IS BEING MEASURED, and nothing else:
//   session_started       — a session began
//   session_completed     — it reached a real ending; turns, roadMap yes/no, explicit closure y/n
//   blueprint_generated   — zones 0-4, commitment y/n, recurring y/n
//   ownership_confirmed   — the Κ4 answer, as 0 (Όχι) / 1 (Μερικώς) / 2 (Ναι)
//
// THE CONSTRAINT THIS FILE ENFORCES IS THE POINT. "Counts only" is not a promise the call sites
// make and this file trusts. recordTelemetry must be a HARD SCHEMA: booleans and small
// non-negative integers pass, and EVERYTHING else — strings, objects, arrays, functions — is
// dropped by the function itself. A future call site that passes msg.content by mistake must
// produce a dropped field, not a leak. So the assertions below are behavioural: they feed real
// conversation text into the recorder and assert it does not come out the other side.
//
// The same trap that hit the cost instrumentation applies: a guard anchored on the LAST statement
// of a block passes a mutation that adds a leak earlier in it. Source checks here scan the WHOLE
// extracted function body, not a window around a marker.

const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();

const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

function extract(name) {
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  const e = CODE.indexOf('\n}', s);
  if (e < 0) return null;
  return CODE.slice(s, e + 2);
}

// ── 1. The recorder exists and is self-contained ────────────────────────────
const SRC = extract('recordTelemetry');
assert('recordTelemetry is defined in App.jsx', !!SRC);

let recordTelemetry = null;
if (SRC) {
  // Loaded by assignment, never `let X = null` + `eval(function X(){})` — that is a
  // redeclaration SyntaxError, and a SyntaxError here is a SILENT SUITE, strictly worse
  // than a failure. Same reason the eval is top-level and not inside an arrow function.
  try { recordTelemetry = eval('(' + SRC + ')'); } catch (err) {
    console.log('FAIL — recordTelemetry could not be evaluated standalone: ' + err.message);
    failed++;
  }
}
assert('recordTelemetry evaluates standalone (no module-level dependencies)',
  typeof recordTelemetry === 'function');

// A window shim, because the recorder writes to window.__auraTelemetry — a phone has no console.
if (typeof global.window === 'undefined') global.window = {};
function log() { return global.window.__auraTelemetry || []; }
function reset() { global.window.__auraTelemetry = []; }

const CONTENT = 'Δουλεύω στην ειδική αγωγή και θέλω 4000 ευρώ τον μήνα.';

// ── 2. BEHAVIOURAL: content cannot pass, whatever a call site does ──────────
if (typeof recordTelemetry === 'function') {
  reset();
  const r1 = recordTelemetry('session_completed', { turns: 12, roadMap: false, explicitClosure: true });
  assert('A well-formed counts-only record is accepted',
    !!r1 && r1.turns === 12 && r1.roadMap === false && r1.explicitClosure === true);
  assert('The accepted record reaches window.__auraTelemetry', log().length === 1);

  reset();
  const r2 = recordTelemetry('session_completed', { turns: 3, preview: CONTENT });
  assert('A STRING field is dropped — conversation text cannot reach the log',
    !!r2 && r2.turns === 3 && !('preview' in r2));
  assert('No stored record anywhere contains the conversation text',
    JSON.stringify(log()).indexOf('ειδική αγωγή') === -1);

  reset();
  const r3 = recordTelemetry('session_completed', { turns: 1, msg: { role: 'user', content: CONTENT } });
  assert('An OBJECT field is dropped', !!r3 && !('msg' in r3));
  assert('No nested object smuggles text into the log',
    JSON.stringify(log()).indexOf('ειδική αγωγή') === -1);

  reset();
  const r4 = recordTelemetry('session_completed', { turns: 1, words: [CONTENT, 'χρήματα'] });
  assert('An ARRAY field is dropped', !!r4 && !('words' in r4));
  assert('No array smuggles text into the log',
    JSON.stringify(log()).indexOf('χρήματα') === -1);

  reset();
  const r5 = recordTelemetry('session_completed', { turns: 1, f: () => CONTENT });
  assert('A FUNCTION field is dropped', !!r5 && !('f' in r5));

  // Numbers are the one open door, so it is a narrow one: integers only, bounded, non-negative.
  reset();
  const r6 = recordTelemetry('session_completed', { a: 1.5, b: -3, c: 999999999, d: NaN, e: 4 });
  assert('A non-integer number is dropped', !!r6 && !('a' in r6));
  assert('A negative number is dropped', !!r6 && !('b' in r6));
  assert('An out-of-range number is dropped', !!r6 && !('c' in r6));
  assert('NaN is dropped', !!r6 && !('d' in r6));
  assert('A small non-negative integer is kept', !!r6 && r6.e === 4);

  // A long or exotic KEY is itself a channel — someone could encode text in it.
  reset();
  const r7 = recordTelemetry('session_completed', {});
  const keyProbe = {}; keyProbe[CONTENT] = 1;
  const r8 = recordTelemetry('session_completed', keyProbe);
  assert('An empty field set still records the event', !!r7 && r7.ev === 'session_completed');
  assert('A long / non-ASCII KEY is dropped — keys are not a smuggling channel',
    !!r8 && Object.keys(r8).filter(k => k !== 'ev' && k !== 't').length === 0);
  assert('No record contains text passed as a key',
    JSON.stringify(log()).indexOf('ειδική αγωγή') === -1);

  // The event name is a closed vocabulary, not free text.
  reset();
  const r9 = recordTelemetry(CONTENT, { turns: 1 });
  assert('A free-text event NAME is rejected outright', r9 === null || r9 === undefined);
  assert('A rejected event writes nothing to the log', log().length === 0);

  reset();
  assert('A non-string event name is rejected',
    !recordTelemetry(null, { turns: 1 }) && !recordTelemetry({ a: 1 }, { turns: 1 }));

  // Instrumentation must never break a session.
  reset();
  let threw = false;
  try { recordTelemetry('session_started'); recordTelemetry('session_started', null); }
  catch (e) { threw = true; }
  assert('Missing / null fields never throw — instrumentation cannot break a session', !threw);
}

// ── 3. SOURCE: the whole function body, not a window around a marker ────────
if (SRC) {
  assert('The recorder whitelists by TYPE, not by field name',
    /typeof\s+v\s*===\s*["']boolean["']/.test(SRC) && /Number\.isInteger/.test(SRC));
  assert('Nothing in the recorder body reads a message, its content, or the input box',
    !/\.content\b/.test(SRC) && !/\bmessages\b/.test(SRC) && !/\binput\b/.test(SRC));
  // CHANGED DELIBERATELY on 2026-09-26, recorded rather than quietly relaxed. This was a blanket
  // ban on any storage call, written when the recorder was window-only. What the ban actually
  // protected was two things, and both are now asserted directly and more strictly than before:
  // no coupling to the MEMORY system, and no unconditional write. §8 adds the behavioural proof
  // the blanket ban never gave — that content cannot reach the disk even if a call site regresses.
  assert('The recorder is never coupled to the memory system or its key',
    !/saveMemory|MEMORY_KEY|_writeMemoryNow/.test(SRC));
  assert('The recorder never uses sessionStorage — one persistence path, not two',
    !/sessionStorage/.test(SRC));
  assert('The recorder writes exactly one storage key, its own',
    (SRC.match(/setItem\(/g) || []).length === 1 && /setItem\(\s*["']aura_telemetry_log["']/.test(SRC));
  assert('Every write is gated — the debug check precedes the write in the body, never after it',
    SRC.indexOf("get(\"debug\")") > -1 && SRC.indexOf("get(\"debug\")") < SRC.indexOf('setItem('));
  assert('The recorder never calls the API', !/fetch\s*\(|callAura/.test(SRC));
  assert('The recorder is wrapped so it can never throw into a session', /try\s*{/.test(SRC));
}

// ── 4. The four measurement points are actually wired ───────────────────────
const CALLS = (CODE.match(/recordTelemetry\(/g) || []).length;
assert('recordTelemetry has real call sites, not zero (the checkAnchorCoverage failure mode)',
  CALLS >= 5); // 1 definition-adjacent + at least 4 measurement points
for (const ev of ['session_started', 'session_completed', 'blueprint_generated', 'ownership_confirmed']) {
  assert('Event wired at a real call site: ' + ev,
    new RegExp("recordTelemetry\\(\\s*[\"']" + ev + "[\"']").test(CODE));
}

// ── 5. NO CALL SITE passes a content-bearing expression ─────────────────────
// This is the check that matters most in review: it reads every argument list actually written.
const SITES = [];
{
  let idx = CODE.indexOf('recordTelemetry(');
  while (idx >= 0) {
    const head = CODE.slice(Math.max(0, idx - 40), idx);
    if (!/function\s+$/.test(head)) SITES.push(CODE.slice(idx, CODE.indexOf('\n', idx) + 400));
    idx = CODE.indexOf('recordTelemetry(', idx + 1);
  }
}
assert('Call sites were located for inspection', SITES.length >= 4);
const BAD = /\.content\b|\btext\b\s*[,}]|\bword\b\s*:|msg\.|input\b\s*[,}]/;
assert('No call site passes message content, a word, or the input box',
  SITES.length >= 4 && SITES.every(s => {
    const args = s.slice(0, s.indexOf(')') + 1);
    return !BAD.test(args);
  }));

// ── 6. G1: the Road Map is measured, because the decision depends on it ─────
// The audit's leading finding cannot be decided without this one boolean. If it is ever
// dropped, the Road Map question becomes unanswerable again and this suite must object.
//
// MEASURED, NOT ASSUMED: an earlier draft of this check searched the whole file for
// parseRoadMap near the word roadMap, and PASSED BEFORE THE FEATURE EXISTED — MessageBubble
// already had `const roadMap = parseRoadMap(...)`. A guard that is green on an empty
// implementation guards nothing. It is now scoped to the ending effect's own body.
const EFFECT = (() => {
  const a = CODE.indexOf('// TELEMETRY — one measurement per ending');
  if (a < 0) return '';
  const b = CODE.indexOf('}, [sessionEnded]);', a);
  return b < 0 ? '' : CODE.slice(a, b);
})();
assert('The ending-measurement effect was located', EFFECT.length > 200);
assert('session_completed is recorded from that effect, not scattered',
  /recordTelemetry\(\s*["']session_completed["']/.test(EFFECT));
assert('roadMap is computed INSIDE the effect, from the real parser',
  /parseRoadMap\s*\(/.test(EFFECT) && /roadMap\s*:/.test(EFFECT));
assert('explicitClosure is computed INSIDE the effect, from isExplicitClosure',
  /isExplicitClosure\s*\(/.test(EFFECT) && /explicitClosure\s*:/.test(EFFECT));
assert('The effect emits only counts — no content-bearing field reaches the recorder',
  (() => {
    const args = EFFECT.slice(EFFECT.indexOf('recordTelemetry('));
    return !/\.content\s*[,}]/.test(args) && !/\btext\s*:/.test(args) && !/\bword\s*:/.test(args);
  })());
assert('The effect is guarded so it does not fire on reset (sessionEnded going false)',
  /if\s*\(!sessionEnded\)\s*return/.test(EFFECT));

// ── 6b. THE ROAD-CHAIN COUNTERS ──────────────────────────────────────────
// session_completed already carries roadMap and roadLabels, but both are measured on
// `messages` — the text AFTER hidden-tag removal and stripAraDeclarative. The shadow
// trace measures the RAW model output and then each stage of that same chain
// (parseRaw → parseAfterTags → parseAfterStrip), and until now all of it went only to
// the ?debug=1 panel, which is unreachable on the phones these sessions run on.
//
// The difference is the point. If a map parses on the raw text and not after stripping,
// OUR OWN pipeline destroyed it — a failure class nothing has ever measured, and one the
// existing booleans cannot see because they only ever look at the surviving text.
// This is the signal the queued G1 compliance decision is waiting on.
//
// Counts only, per session, same schema as everything else here: small non-negative
// integers, keys within the 24-character limit, no text ever.
// The end marker must be searched FORWARD from the start: the collision logger sits
// BEFORE the trace in this file, so slicing to its first occurrence gave a reversed,
// empty range and the assertion below proved nothing. Second time this exact slice bug
// has appeared in a test written today — the marker is now the trace's own catch.
const TRACE_START = CODE.indexOf('DIAGNOSTIC SHADOW TRACE');
const TRACE = CODE.slice(TRACE_START, CODE.indexOf('diagnostics must never affect the session', TRACE_START));
assert('the trace slice is non-empty — a reversed range would make the next assertion vacuous',
  TRACE.length > 500);
// Sliced to the END OF THE CALL, not a fixed window. A 700-character window was enough
// when it was written and stopped being enough the moment two more fields were added
// above these — the assertions then read past nothing and failed on a correct file.
const EFFECT2_AT = CODE.indexOf('recordTelemetry("session_completed"');
const EFFECT2 = CODE.slice(EFFECT2_AT, CODE.indexOf('});', EFFECT2_AT) + 3);
assert('a per-session accumulator exists for the road chain',
  /roadTraceTotals\s*=\s*useRef\(/.test(CODE));
assert('the accumulator is filled from the trace that already computes these values',
  /roadTraceTotals\.current\s*=\s*tallyRoadTrace\(/.test(TRACE));
// BEHAVIOUR, not presence. Found by mutation: asserting the three lines exist survived
// each counter being disabled, inverted, or pointed at the wrong stage.
eval((() => { const i = CODE.indexOf('function tallyRoadTrace('); return CODE.slice(i, CODE.indexOf('\n}', i) + 2); })());
const Z = { rawLabels: 0, rawMap: 0, strippedMap: 0 };
assert('a reply with labels that parses cleanly counts in all three stages',
  JSON.stringify(tallyRoadTrace(Z, { rawHasLabels: true, parseRaw: 2, parseAfterStrip: 2 }))
    === JSON.stringify({ rawLabels: 1, rawMap: 1, strippedMap: 1 }));
assert('labels written but never parsed counts ONLY as labels',
  JSON.stringify(tallyRoadTrace(Z, { rawHasLabels: true, parseRaw: 0, parseAfterStrip: 0 }))
    === JSON.stringify({ rawLabels: 1, rawMap: 1 - 1, strippedMap: 0 }));
// THE CASE THE WHOLE COUNTER EXISTS FOR: it parsed on the raw output and not after our
// own stripping. rawMap must move and strippedMap must not.
assert('a map destroyed by our own stripping is visible — rawMap moves, strippedMap does not',
  JSON.stringify(tallyRoadTrace(Z, { rawHasLabels: true, parseRaw: 3, parseAfterStrip: 0 }))
    === JSON.stringify({ rawLabels: 1, rawMap: 1, strippedMap: 0 }));
assert('a reply with nothing counts nothing',
  JSON.stringify(tallyRoadTrace(Z, { rawHasLabels: false, parseRaw: 0, parseAfterStrip: 0 })) === JSON.stringify(Z));
assert('totals accumulate across turns rather than being replaced',
  tallyRoadTrace(tallyRoadTrace(Z, { rawHasLabels: true, parseRaw: 1, parseAfterStrip: 1 }),
                 { rawHasLabels: true, parseRaw: 1, parseAfterStrip: 0 }).rawLabels === 2);
assert('malformed input never throws and never invents a count',
  JSON.stringify(tallyRoadTrace(null, null)) === JSON.stringify(Z) &&
  JSON.stringify(tallyRoadTrace(Z, { rawHasLabels: "yes", parseRaw: "3" })) === JSON.stringify(Z));
assert('session_completed reports how many replies carried labels in the RAW output',
  /roadRawLabelTurns:/.test(EFFECT2));
assert('session_completed reports how many parsed on the RAW output',
  /roadRawMapTurns:/.test(EFFECT2));
assert('session_completed reports how many still parsed AFTER our own stripping',
  /roadStrippedMapTurns:/.test(EFFECT2));
assert('all three keys are inside the 24-character schema limit',
  ['roadRawLabelTurns','roadRawMapTurns','roadStrippedMapTurns'].every(k => /^[a-zA-Z]{1,24}$/.test(k)));
assert('the counters survive the recorder as integers, and text in their place is dropped',
  (() => {
    const ok = recordTelemetry('session_completed', { turns: 5, roadRawLabelTurns: 3, roadRawMapTurns: 1, roadStrippedMapTurns: 0 });
    const bad = recordTelemetry('session_completed', { roadRawLabelTurns: 'ΔΡΟΜΟΣ: μετανάστευση' });
    return ok.roadRawLabelTurns === 3 && ok.roadRawMapTurns === 1 && ok.roadStrippedMapTurns === 0
        && !('roadRawLabelTurns' in bad);
  })());
assert('the accumulator is reset per session',
  /roadTraceTotals\.current\s*=\s*\{/.test(CODE.slice(CODE.indexOf('roadTraceLast.current = null'))));
assert('the existing displayed-text booleans are kept, not replaced — the two measure different things',
  /roadMap: _roadMap/.test(EFFECT2) && /roadLabels: _roadLabels/.test(EFFECT2));

// ── 7. The existing cost instrumentation is untouched ───────────────────────
assert('__auraUsageLog still exists (cost instrumentation not disturbed)',
  CODE.includes('__auraUsageLog'));
assert('Telemetry uses its own log, separate from cost counts',
  CODE.includes('__auraTelemetry'));

// ── 8. PERSISTENCE — because the console is unreachable where the sessions happen ─────
//
// THE HARM THIS CLOSES, and this file's own header already named it: "learned only because the
// founder pasted two transcripts by hand. That is not a measurement system." On 2026-09-26 that
// cost us twice in one day. Two real Road Map sessions were run from a phone; both produced a
// verified First-WHY card, a measured lens, five located bugs — and ZERO numbers, because
// window.__auraTelemetry is in-memory with no persistence and console.log is invisible on mobile.
// Every number reported from those sessions was recovered by re-running the detectors over pasted
// text, by hand. Meanwhile localStorage is used elsewhere in the file without difficulty.
//
// WHY THIS NEEDS NO CONSENT DECISION, and the argument is structural rather than a promise. The
// schema above physically cannot hold conversation content: sections 1-3 feed real transcript text
// into the recorder and prove strings, objects and arrays are dropped by the recorder itself. A
// record that cannot contain content does not become a new category of stored data by being
// written to disk. So persistence introduces nothing the existing disclosure does not cover.
//
// DEBUG-GATED ON PURPOSE, and this is a deliberate limit, not an oversight. Persistence happens
// only when ?debug=1 is on the URL — the founder's own instrument on his own device. It does NOT
// collect from real users, and it is not a step toward doing so: opening that question is a
// product decision with a consent gate attached, and it is not this change.
const LS_KEY = 'aura_telemetry_log';
function fakeStore(opts) {
  const o = opts || {};
  const m = {};
  return {
    getItem: k => (o.throwOnRead ? (() => { throw new Error('blocked'); })() : (k in m ? m[k] : null)),
    setItem: (k, v) => { if (o.throwOnWrite) throw new Error('quota'); m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    _raw: () => m,
  };
}
function withWindow(search, store, fn) {
  const prev = global.window;
  global.window = { __auraTelemetry: [], location: { search }, localStorage: store };
  try { return fn(); } finally { global.window = prev; }
}
function storedIn(store) {
  const s = store._raw()[LS_KEY];
  if (s === undefined) return null;
  try { return JSON.parse(s); } catch (e) { return 'UNPARSEABLE'; }
}

if (typeof recordTelemetry === 'function') {
  // 8a — it persists when the instrument is on.
  const s1 = fakeStore();
  withWindow('?debug=1', s1, () => {
    recordTelemetry('session_completed', { turns: 24, roadMap: false });
  });
  const p1 = storedIn(s1);
  assert('with ?debug=1 the record is written to localStorage, so a phone session survives reload',
    Array.isArray(p1) && p1.length === 1 && p1[0].ev === 'session_completed' && p1[0].turns === 24);

  // 8b — it collects nothing when the instrument is off. A measurement tool that writes to every
  // visitor's device by default is a different product decision, and this is not it.
  const s2 = fakeStore();
  withWindow('', s2, () => { recordTelemetry('session_started', { turns: 0 }); });
  assert('without the debug flag NOTHING is written — no silent collection from real users',
    storedIn(s2) === null);

  // 8c — it accumulates across sessions, which is the whole point: a reload must not erase the
  // previous session's numbers, because that is exactly how both real sessions were lost.
  const s3 = fakeStore();
  withWindow('?debug=1', s3, () => { recordTelemetry('session_completed', { turns: 20 }); });
  withWindow('?debug=1', s3, () => { recordTelemetry('session_completed', { turns: 24 }); });
  const p3 = storedIn(s3);
  assert('a second session appends rather than replacing — the first session is still there',
    Array.isArray(p3) && p3.length === 2 && p3[0].turns === 20 && p3[1].turns === 24);

  // 8d — bounded, like every other persisted array in this file (trajectories/obstacles/anchors
  // are all capped in _writeMemoryNow). An unbounded log fills the quota and then the failure is
  // silent, which is the state we are trying to leave.
  const s4 = fakeStore();
  withWindow('?debug=1', s4, () => {
    for (let i = 0; i < 620; i++) recordTelemetry('session_started', { turns: Math.min(9999, i) });
  });
  const p4 = storedIn(s4);
  assert('the persisted log is capped, so it can never grow without bound',
    Array.isArray(p4) && p4.length <= 500 && p4.length > 0);
  assert('the cap keeps the MOST RECENT records, not the oldest',
    Array.isArray(p4) && p4[p4.length - 1].turns === 619);

  // 8e — instrumentation must never take a session down. A full or blocked store is normal on a
  // phone, and the record must still reach memory and still be returned.
  const s5 = fakeStore({ throwOnWrite: true });
  let r5 = null;
  const mem5 = withWindow('?debug=1', s5, () => {
    r5 = recordTelemetry('session_completed', { turns: 7 });
    return global.window.__auraTelemetry.slice();
  });
  assert('a localStorage that throws on write does not break recording',
    r5 && r5.turns === 7 && mem5.length === 1);
  const s6 = fakeStore({ throwOnRead: true });
  let r6 = null;
  withWindow('?debug=1', s6, () => { r6 = recordTelemetry('session_completed', { turns: 8 }); });
  assert('a localStorage that throws on read does not break recording either',
    r6 && r6.turns === 8);

  // 8f — THE CONSTRAINT, re-asserted at the NEW boundary. Sections 1-3 prove content never enters
  // a record; this proves it never reaches the disk, which is a different surface and the one that
  // would matter if a future call site regressed.
  const s7 = fakeStore();
  withWindow('?debug=1', s7, () => {
    recordTelemetry('session_completed', { turns: 3, preview: CONTENT, msg: { content: CONTENT } });
  });
  const rawWritten = s7._raw()[LS_KEY] || '';
  assert('conversation content never reaches the persisted log',
    rawWritten.length > 0 && !rawWritten.includes('παιδι') && !rawWritten.includes(CONTENT.slice(0, 12)));
}

// ── 9. GETTING IT OFF THE PHONE ──────────────────────────────────────────────────────
// Persisting is half the fix. `?debug=1` already exists precisely because "the console is
// unreachable on mobile, which is where the real Road Map sessions happen" — yet the panel showed
// violations, a road trace and provenance, and offered no way to remove any of it from the device.
// exportMemory has done exactly this for memory since long before: a Blob and a download click.
const EXP = extract('exportTelemetry');
assert('exportTelemetry exists', !!EXP);
if (EXP) {
  assert('it reads the persisted log, so it can carry sessions earlier than this one',
    EXP.includes('aura_telemetry_log'));
  assert('it downloads a file, reusing the same Blob path exportMemory already uses',
    /new Blob\(/.test(EXP) && /download/.test(EXP));
  assert('it carries no conversation content — nothing but the records themselves',
    !/(content|messages|reply|transcript)/i.test(EXP.replace(/\/\/[^\n]*/g, '')));
}
// WIRING, by containment rather than by proximity. The first version of this assertion looked for
// `exportTelemetry(` and failed against correct code: React takes the handler by reference,
// `onClick={exportTelemetry}`, with no call site to find. Anchored on the panel's own gate so it
// cannot pass on a reference sitting anywhere else in the file.
const PANEL_AT = CODE.indexOf('{debugMode.current && (');
assert('the debug panel block is findable, so the checks below cannot be vacuous', PANEL_AT > 0);
const PANEL = CODE.slice(PANEL_AT, CODE.indexOf('{/* ── Open anchors ── */}', PANEL_AT));
assert('the panel slice is bounded and real, not the rest of the file', PANEL.length > 200 && PANEL.length < 6000);
assert('WIRING: the debug panel offers the export, so the numbers can leave a phone',
  PANEL.includes('exportTelemetry'));
assert('WIRING: the export is reachable — the panel sets pointerEvents:none, so the control re-enables its own',
  /pointerEvents:\s*["']auto["']/.test(PANEL));
assert('the panel still paints counters only — no reply text is rendered beside the button',
  !/\.content\b/.test(PANEL) && !/displayText/.test(PANEL));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
