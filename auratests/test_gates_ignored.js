// ── GATES DUE vs GATES DELIVERED: the measurement the override needs first ────
//
// WHY THIS EXISTS INSTEAD OF THE OVERRIDE. The obvious fix for Anchors and Stakes never firing is a
// hard override: compute the condition in code and replace the reply, exactly as the Outcome Scale
// already does. That change has been made before and was REVERTED for documented harm — App.jsx
// records "real, documented harm with the now-reverted Anchors/Stakes hard gates: intercepting a
// natural close with an unrelated question". Rebuilding it on three hand-counted sessions would be
// repeating the change that was undone, on less evidence than the revert had.
//
// So this is the step the standing rule asks for: pure telemetry, no consumer. The number it
// produces is the one the decision actually turns on — not "did the gates fire" but "how often was
// a gate due AND the model ignored it".
//
// WHAT IS ALREADY KNOWN BY HAND. gatesCtx names Anchors and Stakes as due and injects a reminder,
// and its own text says it is "deliberately advisory, not a command — the model still judges" and "a
// reminder, not a forced insertion". Measured over a 144-turn corpus: named as due on 144 turns,
// 0 occurrences. Measured again over the three real sessions of 2026-09-26: 0 out of 21, 0 out of
// 24, 0 out of 45. So the trigger works and the delivery does not. This counts that continuously
// instead of by hand, which is how the override gets decided on data rather than on three pastes.
//
// COUNTS ONLY, AND THE ABSENCE OF A CONSUMER IS ASSERTED. If a later commit reads these counters to
// change a reply, the assertion at the end of this file fails, and that is the intended friction.
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
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

// ── 1. THE HISTORY THIS DEFERS TO ────────────────────────────────────────────
assert('the revert of the hard gates is still recorded in the file, which is why this is telemetry',
  /now-reverted Anchors\/Stakes hard gates/.test(raw));
// The phrase is split across two comment lines in App.jsx, so the newline and the "//" prefix have
// to be tolerated — matching the raw string naively reported the sentence as absent.
assert("and gatesCtx still says in its own words that it is advisory rather than a command",
  /deliberately advisory, not a\s*(\/\/)?\s*command/.test(raw));

// ── 2. THE DUE SNAPSHOT IS TAKEN WHERE THE DUE LIST IS BUILT ─────────────────
const DUE_AT = CODE.indexOf("if (!anchorsInvited.current) due.push(");
assert('NON-VACUITY: the due list is findable', DUE_AT > 0);
const DUE_WIN = CODE.slice(Math.max(0, DUE_AT - 600), DUE_AT + 1400);
assert('a per-turn snapshot of WHICH gates were due is recorded beside the due list',
  /gatesDueSnapshot\.current\s*=/.test(DUE_WIN));
assert('the snapshot carries the three gates the list can contain',
  /anchors\s*:/.test(DUE_WIN) && /stakes\s*:/.test(DUE_WIN) && /scale\s*:/.test(DUE_WIN));
assert('it is a plain per-turn snapshot, reset each turn rather than accumulated',
  /gatesDueSnapshot\.current\s*=\s*\{/.test(DUE_WIN));

// ── 3. DELIVERY IS JUDGED POST-API, WITH THE DETECTORS THAT ALREADY EXIST ────
const CMP_AT = CODE.indexOf('const _snap = gatesDueSnapshot.current');
assert('NON-VACUITY: the comparison site is findable', CMP_AT > 0);
const CMP = CODE.slice(Math.max(0, CMP_AT - 700), CMP_AT + 1400);
assert('delivery is judged with the existing detectors, not a new one',
  /detectsAnchorsInvited\s*\(/.test(CMP) && /detectsStakesAsked\s*\(/.test(CMP) && /detectsOutcomeScaleAsked\s*\(/.test(CMP));
// PINNED WITH ITS GUARD. A surviving mutation removed the "if not delivered" condition and left the
// increment in place, so every due gate read as ignored and this assertion still passed. The guard
// is the whole meaning of the counter.
assert('a due gate that the reply did not deliver increments the ignored counter, and only then',
  /if \(!_delivered\[k\]\)\s*gatesIgnored\.current\s*\+=\s*1/.test(CMP));
assert('a due gate is also counted as due, so the ratio is computable',
  /gatesDue\.current\s*\+=\s*1/.test(CMP));
assert('the comparison is wrapped, so instrumentation cannot take a session down',
  /try\s*\{/.test(CMP));

// ── 4. BOTH COUNTERS REACH TELEMETRY, COUNTS ONLY ────────────────────────────
assert('both counters reset per session',
  /gatesDue\.current\s*=\s*0/.test(CODE) && /gatesIgnored\.current\s*=\s*0/.test(CODE));
const tele = CODE.slice(CODE.indexOf('session_completed'));
assert('both reach session_completed, reading their OWN counters',
  /gatesDue:[^\n]*gatesDue\.current/.test(tele) && /gatesIgnored:[^\n]*gatesIgnored\.current/.test(tele));
assert('NON-VACUITY: the fields exist, so the constraint below has a subject',
  /gatesDue:/.test(tele) && /gatesIgnored:/.test(tele));
assert('counts only — no reply text travels with them',
  !/(gatesDue|gatesIgnored):[^\n]*(content|text|reply|message)/i.test(tele));

// ── 5. NO CONSUMER — the friction that keeps this a measurement ──────────────
assert('nothing compares the ignored counter against a threshold',
  !/gatesIgnored\.current\s*(>=|>|===|!==)/.test(CODE));
assert('nothing rewrites a reply on the strength of these counters',
  !/gatesIgnored[^\n]*displayText\s*=/.test(CODE) && !/gatesDue[^\n]*displayText\s*=/.test(CODE));
assert('the Outcome Scale override is untouched — it keeps both its own closing guards',
  /!matchesClosingWord\(lastUserMsg\) && !declaresClosing\(lastUserMsg\)/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
