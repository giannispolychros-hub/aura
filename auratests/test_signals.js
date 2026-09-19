// AURA — SIGNAL LAYER
//
// WHAT A SIGNAL IS, and why this file exists separately from the detectors' own tests. A full
// classification of every point where AURA produces a claim about the user established one rule
// that everything here obeys: a SIGNAL requires at least TWO pieces of evidence, both verbatim,
// both code-computed. Never one sentence, never a model judgement, never word frequency.
//
// A measured stress test over the session's real transcripts then split the six candidate signal
// types in two. Types defined by a DIFFERENCE BETWEEN TWO DECLARATIONS (COMMITMENT, SHIFT,
// CONTRADICTION) cannot be true-but-empty: if the two differ, something changed by definition.
// Types defined by FREQUENCY OR ABSENCE (RECURRING within a session, DROPOUT, EMERGENCE) can be
// perfectly true and tell the person nothing — "εισόδημα appeared 3 times" to someone whose stated
// problem is income. That distinction is the relevance gate, and it is a property of the type
// rather than a filter bolted on afterwards.
//
// COMMITMENT is the first signal built because it was the only one with a clean, measured source:
// detectsConcreteStep already separates "θα μιλήσω" from "σκέφτομαι να μιλήσω" with no false
// positives in testing. But it only ever reported the AFTER. The BEFORE — the hedged version it
// deliberately rejects as conditional — was computed and discarded on the same line, which is the
// fourth time that exact pattern has been found in this codebase. A transition needs both halves.
//
// STRICTLY PASSIVE, like the material-evidence and provenance instrumentation before it: nothing
// here reaches the prompt, changes a gate, or is written to storage. Measurement before
// modification. The assertions below hold that, and will fail first if it changes.

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
  const a = CODE.indexOf('function ' + name + '(');
  return a < 0 ? null : CODE.slice(a, CODE.indexOf('\n}', a) + 2);
}

// Self-contained, per the suite-wide convention: each is eval'd on its own, so a function that
// reached for a module-level const would break here first.
const SRC_CLASSIFY = extract('classifyStepIntent');
const SRC_BUILD = extract('buildCommitmentSignal');
const SRC_STEP = extract('detectsConcreteStep');
assert('classifyStepIntent exists', SRC_CLASSIFY !== null);
assert('buildCommitmentSignal exists', SRC_BUILD !== null);
assert('detectsConcreteStep still exists', SRC_STEP !== null);
// Assignment form, not bare eval: `let X = null` followed by eval of `function X(){}` is a
// redeclaration SyntaxError, which surfaces as a failing assertion about the source rather than
// about the harness. Same class of self-inflicted extraction bug hit twice already today.
let classifyStepIntent = null, buildCommitmentSignal = null, detectsConcreteStep = null;
const load = (src, name, set) => {
  if (!src) return;
  try { set(eval('(' + src.slice(src.indexOf('function')) + ')')); }
  catch (e) { assert(name + ' evaluates alone: ' + e.message, false); }
};
load(SRC_CLASSIFY, 'classifyStepIntent', f => { classifyStepIntent = f; });
load(SRC_BUILD, 'buildCommitmentSignal', f => { buildCommitmentSignal = f; });
load(SRC_STEP, 'detectsConcreteStep', f => { detectsConcreteStep = f; });

// ── LOCKSTEP ───────────────────────────────────────────────────────────────
// The two functions must recognise the SAME set of action phrases, or the pair goes out of step:
// a "before" whose verb the committed side cannot produce is a transition that can never complete.
// Same coupling discipline as parseRoadMap and its display strip.
if (SRC_CLASSIFY && SRC_STEP) {
  const baseOf = src => { const m = src.match(/const base = (\/[\s\S]*?\/i);/); return m ? m[1] : null; };
  assert('LOCKSTEP: both declare a `base` pattern', baseOf(SRC_CLASSIFY) !== null && baseOf(SRC_STEP) !== null);
  assert('LOCKSTEP: the two base patterns are character-identical',
    baseOf(SRC_CLASSIFY) === baseOf(SRC_STEP));
}

// ── REGRESSION: detectsConcreteStep is untouched ───────────────────────────
// It gates the Clarity + Ownership Scale and decideTermination. This commit must not move it.
if (typeof detectsConcreteStep === 'function') {
  assert('REGRESSION: a committed step is still detected',
    detectsConcreteStep('Θα μιλήσω στον διευθυντή τη Δευτέρα') === true);
  assert('REGRESSION: a weighed thought is still rejected',
    detectsConcreteStep('Σκέφτομαι να μιλήσω στον διευθυντή') === false);
  assert('REGRESSION: a negation is still rejected',
    detectsConcreteStep('Δεν θα μιλήσω στον διευθυντή') === false);
  assert('REGRESSION: ordinary text is still rejected',
    detectsConcreteStep('Τι ώρα είναι;') === false);
}

// ── classifyStepIntent — the BEFORE half, recovered ────────────────────────
if (typeof classifyStepIntent === 'function') {
  const stage = t => { const r = classifyStepIntent(t); return r ? r.stage : null; };
  assert('CLASSIFY: "Θα μιλήσω στον διευθυντή" is committed', stage('Θα μιλήσω στον διευθυντή') === 'committed');
  assert('CLASSIFY: "Ίσως θα μιλήσω" is considered — the half that was discarded',
    stage('Ίσως θα μιλήσω') === 'considered');
  assert('CLASSIFY: "Μήπως θα του πω" is considered', stage('Μήπως θα του πω') === 'considered');
  assert('CLASSIFY: "Σκέφτομαι μήπως θα του πω" is considered',
    stage('Σκέφτομαι μήπως θα του πω') === 'considered');
  assert('CLASSIFY: "Αν θα μιλήσω…" is considered', stage('Αν θα μιλήσω, θα αλλάξει κάτι;') === 'considered');

  // KNOWN LIMIT, PINNED RATHER THAN HIDDEN. The shared `base` pattern requires "θα". The most
  // natural Greek hesitation — "σκέφτομαι να μιλήσω", with να and no θα — never reaches the
  // conditional branch at all, so the BEFORE half is only recoverable when the hedge still carries
  // θα. An earlier draft of this file asserted the opposite and was wrong about its own mechanism.
  // Widening `base` would break lockstep with detectsConcreteStep and change which steps gate the
  // Clarity + Ownership Scale — a separate decision, made from a specification rather than by
  // chasing examples, which is the rule that came out of the parseRoadMap fix. Until then this
  // signal is NARROW BY CONSTRUCTION, and that is stated here so nobody reads its silence as
  // evidence that no transition happened.
  assert('KNOWN LIMIT: "Σκέφτομαι να μιλήσω" is invisible — no θα, so `base` never matches',
    classifyStepIntent('Σκέφτομαι να μιλήσω στον διευθυντή') === null);
  assert('KNOWN LIMIT: and detectsConcreteStep agrees — the limit is shared, not introduced here',
    detectsConcreteStep('Σκέφτομαι να μιλήσω στον διευθυντή') === false);
  assert('CLASSIFY: a negation is NEITHER — it is not a stage of commitment',
    classifyStepIntent('Δεν θα μιλήσω στον διευθυντή') === null);
  assert('CLASSIFY: text with no action phrase returns null', classifyStepIntent('Τι ώρα είναι;') === null);
  assert('CLASSIFY: empty and non-string inputs return null',
    classifyStepIntent('') === null && classifyStepIntent(null) === null && classifyStepIntent(undefined) === null);
  assert('CLASSIFY: it reports the verb, so a pair can be matched on the same action',
    (classifyStepIntent('Θα μιλήσω στον διευθυντή') || {}).verb === 'μιλήσω');
  assert('CLASSIFY: the verb is the same on both sides of the transition',
    (classifyStepIntent('Ίσως θα μιλήσω στον διευθυντή') || {}).verb ===
    (classifyStepIntent('Θα μιλήσω στον διευθυντή') || {}).verb);
  assert('CLASSIFY: it returns the sentence verbatim, since a signal must cite evidence',
    (classifyStepIntent('Θα μιλήσω στον διευθυντή') || {}).text === 'Θα μιλήσω στον διευθυντή');
  // EXACT AGREEMENT with the untouched detector — one boolean, one classification, same verdict.
  for (const t of ['Θα μιλήσω στον διευθυντή', 'Σκέφτομαι να μιλήσω', 'Δεν θα μιλήσω', 'Τι ώρα είναι;',
                   'Θα το κάνω', 'Ίσως θα φύγω', 'Μήπως θα του πω']) {
    assert(`AGREEMENT on «${t.slice(0, 30)}»`,
      (stage(t) === 'committed') === detectsConcreteStep(t));
  }
}

// ── buildCommitmentSignal — two evidence or nothing ────────────────────────
if (typeof buildCommitmentSignal === 'function') {
  const considered = { stage: 'considered', verb: 'μιλήσω', text: 'Σκέφτομαι να μιλήσω στον διευθυντή', turn: 2 };
  const committed = { stage: 'committed', verb: 'μιλήσω', text: 'Θα μιλήσω στον διευθυντή τη Δευτέρα', turn: 5 };
  const sig = buildCommitmentSignal({ considered, committed });
  assert('SIGNAL: a complete pair produces a signal', sig !== null);
  assert('SIGNAL: it carries BOTH pieces of evidence, verbatim',
    sig && sig.before === considered.text && sig.after === committed.text);
  assert('SIGNAL: it names the action the transition is about', sig && sig.verb === 'μιλήσω');

  // NO-PATTERN is a valid, explicit outcome. Each of these is a real half-signal that must not
  // become a finding — the third is exactly the gap this commit exists to close.
  assert('NO-PATTERN: considered alone is not a signal',
    buildCommitmentSignal({ considered, committed: null }) === null);
  assert('NO-PATTERN: committed alone is not a signal — what the old code had, and not enough',
    buildCommitmentSignal({ considered: null, committed }) === null);
  assert('NO-PATTERN: an empty or missing pair is not a signal',
    buildCommitmentSignal(null) === null && buildCommitmentSignal({}) === null);
  assert('NO-PATTERN: two different actions are not one transition',
    buildCommitmentSignal({ considered, committed: { ...committed, verb: 'φύγω' } }) === null);
  assert('NO-PATTERN: commitment must come AFTER the hesitation, never before',
    buildCommitmentSignal({ considered: { ...considered, turn: 7 }, committed }) === null);
  assert('NO-PATTERN: same turn is not a transition either',
    buildCommitmentSignal({ considered: { ...considered, turn: 5 }, committed }) === null);
}

// ── CAPTURE WIRING ─────────────────────────────────────────────────────────
assert('CAPTURE: a session ref holds the pair', /const commitmentPair\s*=\s*useRef\(/.test(CODE));
assert('CAPTURE: it is cleared by resetSession — a pair must never cross sessions',
  /commitmentPair\.current = null/.test(CODE));
const _capIdx = CODE.indexOf('classifyStepIntent(');
const _capCall = CODE.indexOf('classifyStepIntent(', _capIdx + 1);
const _dynIdx = CODE.indexOf('const dynamicSuffix = [');
assert('CAPTURE: the capture runs BEFORE dynamicSuffix is built — same pre-API rule as every other user-side detector',
  _capCall > 0 && _dynIdx > 0 && _capCall < _dynIdx);
assert('CAPTURE: it reads the user\'s own message, not AURA\'s reply',
  /classifyStepIntent\(\s*lastUserMsgForConcreteStep/.test(CODE));

// ── PASSIVITY ──────────────────────────────────────────────────────────────
// Nothing here may reach the model or the disk yet. The Blueprint consumes it later, by its own
// commit; until then this is measurement only.
assert('PASSIVE: no commitment signal is registered in dynamicSuffix',
  !/dynamicSuffix\s*=\s*\[[^\]]*commitment/is.test(CODE));
assert('PASSIVE: nothing about it is written to storage',
  !/commitmentPair[\s\S]{0,300}(saveMemory|setItem|setMemory)/.test(CODE));
assert('PASSIVE: the prompt knows nothing about it',
  !/commitmentPair|classifyStepIntent|buildCommitmentSignal/.test(PROMPT));
assert('PASSIVE: concreteStepStated — the existing gate — is untouched by the new capture',
  /if \(!concreteStepStated\.current && lastUserMsgForConcreteStep && detectsConcreteStep\(/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
