// AURA — UNREACHABLE PATH GUARD
//
// WHAT THIS FILE IS FOR: it does NOT assert that these paths should stay dead. It locks the
// CURRENT FACT so that reviving one is a loud, deliberate event instead of a silent divergence
// between the code and the documents that describe it.
//
// WHY IT EXISTS: prompt line 218 (LAYER CLARIFICATION — REPETITION/STUCK DETECTION) resolves a
// documented four-way overlap in the repetition/stuck family by asserting that "Layer Gate" and
// "Pivot" are PRE-MODEL intercepts — "when either fires, generateResponse is never called for that
// turn" — and that this is what shadows REFLECTIVE CHECKPOINT and ANALYSIS LOOP. ADR-003 builds on
// the same claim. Neither mechanism can fire. Separately, decideTermination's compressionCount >= 2
// branch is a closed cycle that can never be entered. None of this is a functional bug today; it is
// a documentation-honesty problem, and that is what this guard protects.
//
// NOTHING WAS DELETED. Removal is a founder decision. If someone decides to revive or remove a
// path, these assertions fail and tell them which document to update.
//
// STRUCTURAL PARSING, NOT LEXICAL: same convention as test_entry_flow.js / test_detector_timing.js
// / test_output_tripwire.js — plain string/indexOf over the raw source, no AST parser available in
// this environment. The PROMPT/CODE split is copied from those files exactly, so nothing here can
// match text living inside the prompt template literal.

const fs = require('fs');
const path = require('path');

const raw = (() => {
  const candidates = ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx'];
  for (const c of candidates) {
    const p = path.join(__dirname, c);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');
})();

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

// ── PROMPT / CODE split ──
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
if (_i < 0) throw new Error('Could not find "const AURA_CORE_PERSONALITY" — file shape changed, this test needs updating.');
const _s = raw.indexOf('`', _i) + 1;
const _promptEnd = raw.indexOf('`;', _s);
if (_promptEnd < 0) throw new Error('Could not find AURA_CORE_PERSONALITY\'s closing "`;" — file shape changed, this test needs updating.');
const CODE_WITH_COMMENTS = raw.slice(0, _i) + raw.slice(_promptEnd);

// COMMENTS ARE STRIPPED BEFORE COUNTING, and this is not cosmetic — it is a correction this file
// needed on its first run. The unreachability comments added at the definition sites quote the very
// call sites this guard counts ("setMode(\"AUDIT\")", "setPivotPending(true)"), so counting raw text
// reported four false failures: the documentation of the dead path looked like the dead path. Only
// whole-line // comments are removed, which is exactly what those blocks are; trailing comments and
// anything inside the prompt literal are untouched, and no needle below occurs in a trailing comment.
const CODE = CODE_WITH_COMMENTS.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

assert('Structural sanity: CODE region is substantial (not an empty/truncated slice)', CODE.length > 100000);
assert('Comment stripping actually removed something (otherwise the counts below are measuring prose)',
  CODE.length < CODE_WITH_COMMENTS.length);

// Helper: body of a named useCallback / const arrow, up to the closing "}, [" of its dep array.
function callbackBody(name) {
  const s = CODE.indexOf('const ' + name + ' = useCallback(');
  if (s < 0) return null;
  const e = CODE.indexOf('}, [', s);
  return e < 0 ? null : CODE.slice(s, e);
}

// ── 1. LAYER GATE — the flag and its payload are never given a live value ──
const setGateCalls = CODE.match(/setLayerGatePending\(([^)]*)\)/g) || [];
assert('setLayerGatePending is called at least twice (the resets still exist)', setGateCalls.length >= 2);
assert('setLayerGatePending is NEVER called with true',
  setGateCalls.every(c => /\(false\)/.test(c)));

const setPendingCalls = CODE.match(/setPendingUserMessage\(([^)]*)\)/g) || [];
assert('setPendingUserMessage is NEVER called with a value — only null',
  setPendingCalls.length >= 2 && setPendingCalls.every(c => /\(null\)/.test(c)));

// handleLayerChoice returns early without a pending message, so even a stray call is inert.
const hlc = callbackBody('handleLayerChoice');
assert('handleLayerChoice exists', hlc !== null);
assert('handleLayerChoice guards on !pendingUserMessage and returns early',
  hlc !== null && /if \(!pendingUserMessage\) return;/.test(hlc));

// ── 2. AUDIT MODE — reachable only through the dead gate ──
const setModeCalls = CODE.match(/setMode\("[A-Z]+"\)/g) || [];
assert('setMode is called exactly twice in CODE', setModeCalls.length === 2);
assert('Exactly one setMode("AUDIT") exists',
  setModeCalls.filter(c => c === 'setMode("AUDIT")').length === 1);
assert('setMode("AUDIT") appears ONLY inside handleLayerChoice',
  hlc !== null && hlc.includes('setMode("AUDIT")') &&
  (CODE.match(/setMode\("AUDIT"\)/g) || []).length === 1);

// ── 3. PIVOT — its only activation is gated on the unreachable AUDIT mode ──
const setPivotTrue = (CODE.match(/setPivotPending\(true\)/g) || []).length;
assert('setPivotPending(true) appears exactly once', setPivotTrue === 1);
assert('offerPivot — the sole guard on that call — requires mode === "AUDIT"',
  /const offerPivot =[\s\S]{0,200}?mode === "AUDIT"/.test(CODE));
assert('The live twin offerGate requires mode === "ANSWER" and does NOT intercept',
  /const offerGate =[\s\S]{0,120}?mode === "ANSWER"/.test(CODE) &&
  /if \(offerGate\) \{[\s\S]{0,600}?clarityPivotHint\.current =/.test(CODE));

// ── 4. compressionCount >= 2 — a closed cycle ──
assert('compressionCount is incremented in exactly one place',
  (CODE.match(/compressionCount\.current \+= 1/g) || []).length === 1);
assert('That increment is guarded by currentMode === "COMPRESSION"',
  /if \(currentMode === "COMPRESSION"\) \{\s*\n\s*compressionCount\.current \+= 1;/.test(CODE));

const compressionCalls = CODE.match(/generateResponse\([^,]+, "COMPRESSION"\)/g) || [];
assert('generateResponse is called with "COMPRESSION" exactly once', compressionCalls.length === 1);

const hwc = callbackBody('handleWarningChoice');
assert('handleWarningChoice exists', hwc !== null);
assert('The sole "COMPRESSION" call sits inside handleWarningChoice',
  hwc !== null && /generateResponse\([^,]+, "COMPRESSION"\)/.test(hwc));
assert('CRITICAL: handleWarningChoice zeroes compressionCount BEFORE that call — so a pass always starts from 0 and ends at 1',
  hwc !== null &&
  hwc.indexOf('compressionCount.current = 0') >= 0 &&
  hwc.indexOf('compressionCount.current = 0') < hwc.search(/generateResponse\([^,]+, "COMPRESSION"\)/));
assert('The dead branch itself is still present and unmodified',
  /\} else if \(compressionCount >= 2 \|\| modelSignalsEnd\) \{/.test(CODE));

// ── 5. No indirect invocation could bypass any of the above ──
for (const [label, needle] of [
  ['eval(', 'eval('],
  ['new Function(', 'new Function('],
  ['.apply(', '.apply('],
  ['.call(', '.call('],
]) {
  assert(`No ${label} anywhere in CODE — there is no indirect path to a dead setter`,
    !CODE.includes(needle));
}

// ── 6. The comments recording all of this are still there ──
// Reads CODE_WITH_COMMENTS on purpose: every assertion above deliberately cannot see comments, so
// this one must look at the unfiltered text or it would assert the absence of what it is checking.
assert('The unreachability comments survive (removing them re-hides the problem)',
  (CODE_WITH_COMMENTS.match(/UNREACHABLE/g) || []).length >= 3 &&
  /THE compressionCount >= 2 HALF OF THIS BRANCH IS DEAD/.test(CODE_WITH_COMMENTS));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n⚠ Αν αυτό αποτύχει, κάποιος ζωντάνεψε μια απρόσιτη διαδρομή.');
  console.log('  Δεν είναι bug — σημαίνει ότι η αρχιτεκτονική άλλαξε και το ADR-003 πρέπει να ενημερωθεί.');
  console.log('  Ενημέρωσε επίσης τη γρ. 218 του prompt (LAYER CLARIFICATION), που δηλώνει ότι τα');
  console.log('  Layer Gate/Pivot είναι pre-model intercepts, και τα σχόλια στα σημεία ορισμού.');
}
process.exit(failed > 0 ? 1 : 0);
