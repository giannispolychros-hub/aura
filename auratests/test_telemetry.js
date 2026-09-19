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
  assert('The recorder never writes to persistent storage',
    !/localStorage|sessionStorage|saveMemory/.test(SRC));
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

// ── 7. The existing cost instrumentation is untouched ───────────────────────
assert('__auraUsageLog still exists (cost instrumentation not disturbed)',
  CODE.includes('__auraUsageLog'));
assert('Telemetry uses its own log, separate from cost counts',
  CODE.includes('__auraTelemetry'));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
