// WHY THIS TEST EXISTS: a detector that reads the USER's own message is only useful for the
// reply the model is about to give if it runs BEFORE dynamicSuffix is built and handed to
// callAura(). Several detectors in generateResponse() run AFTER the API call instead (inside the
// post-response tracking block) — their signal still gets recorded, but only reaches the model
// starting the NEXT turn, one full exchange later than the message that produced it. This is
// silent: no exception is thrown, no existing test fails, the ctx string the detector feeds
// (e.g. methodFailureCtx) simply stays empty for the turn that should have carried it. A value
// test ("methodFailureCtx === true") cannot catch this — it only proves the flag CAN become true,
// never WHEN. This test checks structure instead: the detector's call-site position in the raw
// source, relative to where `dynamicSuffix` is assembled, the same technique test_entry_flow.js
// already uses to prove entryDoorCtx reaches dynamicSuffix (membership) — this one proves ORDER.
//
// SCOPE, DELIBERATELY NARROW (causal-inventory audit, timing-correction follow-up — see the
// KNOWN PENDING list below): only detectors that are (a) purely USER-side and (b) able to run on
// `msgs` alone, with no dependency on the model's own not-yet-generated reply, are checked here.
// A detector that reads AURA's current-turn reply (`text`) structurally CANNOT run before the API
// call without changing its input source — that is not a timing fix, it is a different change,
// and is explicitly excluded, not silently skipped.
//
// STRUCTURAL PARSING, NOT LEXICAL: same convention as test_entry_flow.js and
// test_ref_reset_integrity.js — plain string/indexOf on the raw source, no AST parser available
// in this environment. The PROMPT/CODE split below is copied from test_entry_flow.js exactly, so
// none of these checks can accidentally match text living inside the prompt template literal.

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

// ── PROMPT / CODE split — identical technique to test_entry_flow.js ──
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
if (_i < 0) throw new Error('Could not find "const AURA_CORE_PERSONALITY" — file shape changed, this test needs updating.');
const _s = raw.indexOf('`', _i) + 1;
const _promptEnd = raw.indexOf('`;', _s);
if (_promptEnd < 0) throw new Error('Could not find AURA_CORE_PERSONALITY\'s closing "`;" — file shape changed, this test needs updating.');
const CODE = raw.slice(0, _i) + raw.slice(_promptEnd);

assert('Structural sanity: CODE region is substantial (not an empty/truncated slice)', CODE.length > 100000);

// ── Locate dynamicSuffix construction — everything checked below must run BEFORE this index ──
const dynSuffixIdx = CODE.indexOf('const dynamicSuffix = [');
if (dynSuffixIdx < 0) {
  throw new Error('Could not find "const dynamicSuffix = [" — file shape changed, this test needs updating.');
}

// ── USER-side detectors that must run pre-API, so their signal reaches the model on the SAME
// turn as the message that triggered them, not one turn later. Each needle is the detector's
// actual call-site text (including its argument), not just the function name — this both proves
// the call exists AND cannot accidentally match the function's own `function detectX(text) {`
// definition line, which uses a different, generic parameter name.
const CHECKED = [
  { name: 'detectsBinaryOppositionPhrasing', needle: 'detectsBinaryOppositionPhrasing(lastUserMsgForBinary.content)' },
  { name: 'detectSelfMarkedTension',         needle: 'tensionCtx = detectSelfMarkedTension(' },
  { name: 'detectUserStagnation',            needle: 'userStagnationCtx = detectUserStagnation(' },
  { name: 'detectAssistantSelfRepetition',   needle: 'selfRepCheck = detectAssistantSelfRepetition(' },
  { name: 'detectsMethodFailureSignal',      needle: 'detectsMethodFailureSignal(lastUserMsgForMethodFailure.content)' },
  { name: 'detectsConcreteStep',             needle: 'detectsConcreteStep(lastUserMsgForConcreteStep.content)' },
];

for (const { name, needle } of CHECKED) {
  const occurrences = CODE.split(needle).length - 1;
  assert(`${name}: call site found in CODE, exactly once ("${needle}")`, occurrences === 1);
  if (occurrences === 1) {
    const callIdx = CODE.indexOf(needle);
    assert(`${name}: call site runs BEFORE dynamicSuffix is built (pre-API, same-turn signal)`, callIdx < dynSuffixIdx);
  }
}

// ── KNOWN PENDING — deliberately NOT checked here yet. Each is timing-late today (post-API,
// same class of gap as detectsMethodFailureSignal above), but moving it is not a pure timing fix
// for the reason stated, so it stays out of this test's scope until that is separately decided: ──
//
// - detectsNoQuestionsRequest / informationModeActive — PERSISTENT flag (only ever cleared in
//   resetSession(), never one-shot). Moving its detection pre-API would change what the very
//   first reply after the trigger phrase looks like, not merely when the existing behavior
//   arrives — a real UX decision, out of scope today.
//
// - detectsCoreReadinessAsked / detectsShiftCheckAsked / detectsFriendPerspectiveAsked /
//   detectsStakesAsked / detectsAnchorsInvited — these read `text`, the model's OWN reply
//   generated THIS turn, which does not exist yet before the API call. Moving them pre-API is
//   not a relocation — it would require changing their INPUT SOURCE entirely (e.g. to the last
//   assistant message already present in `msgs`, instead of the freshly-generated `text`), a
//   different kind of change than the ones this test protects.

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
