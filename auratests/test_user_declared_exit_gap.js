// ── decideTermination's userDeclaredExit: a closing that carries content ────
//
// THE GAP, found in a read-only forensic audit and proven by an isolated probe before any
// production line was touched. isExplicitClosure requires the WHOLE message to reduce to closing
// words; declaresClosing was built for exactly the messages that fail that requirement while still
// unambiguously declaring an end. Three real sessions produced this shape at the OUTPUT-suppression
// sites (gates suffix, Outcome Scale override, road Q/A capture, decideTermination's own
// question-override) and those were fixed already. This is the ACTION side: whether the session
// ever reaches decision === "confirm" at all for such a message.
//
// MEASURED, not assumed: for "δεν ξέρω θα το σκεφτώ άλλη στιγμή σε ευχαριστώ κλείνουμε" —
//   isExplicitClosure  = false   (whole-message reduction fails — real content precedes the close)
//   declaresClosing    = true   (tier A: an unambiguous declaration anywhere in the message)
//   matchesClosingWord = false  (the BROAD detector ALSO fails the same whole-message requirement —
//                                 ruling out "just use the broad one instead" as a fix)
//
// ONLY ONE CONSUMER EXISTS. Grepped before this fix was written: userDeclaredExit is read in
// exactly one place, the disjunction that sets decision = "confirm" three lines below its
// definition. There is no second caller to reason about.
//
// THE FIX IS ONE LINE: userDeclaredExit now reads isExplicitClosure(...) || declaresClosing(...).
// Nothing else in decideTermination changed — not naturalExitReady, not the Outcome Scale gate,
// not the textAsksRealQuestion override, not the compression/modelSignalsEnd branch.
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) throw new Error('MISSING DEPENDENCY: ' + name);
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}
// Same six dependencies test_first_why_session.js pins from decideTermination's own source — not
// a hand-picked subset, so this cannot silently omit a real dependency and fail misleadingly.
const DEPS = ['matchesClosingWord', 'isBareEmojiOrAcknowledgment', 'wasThirdTriggerAsked',
              'isExplicitClosure', 'isModelPreClosing', 'declaresClosing'];
for (const n of DEPS) eval(extract(n));
eval(extract('decideTermination'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── WIRING: userDeclaredExit has exactly one consumer ────────────────────────
// Pinned so a future refactor that adds a second reader is forced to revisit this file's premise.
const DT_SRC = extract('decideTermination');
const UDE_USES = (DT_SRC.match(/\buserDeclaredExit\b/g) || []).length;
assert('NON-VACUITY: userDeclaredExit appears in decideTermination\'s own source', UDE_USES > 0);
assert('userDeclaredExit has exactly one consumer (its definition + the one disjunction) — 2 occurrences total',
  UDE_USES === 2);

const TARGET = 'δεν ξέρω θα το σκεφτώ άλλη στιγμή σε ευχαριστώ κλείνουμε';

// ── THE CAUSAL DIAGNOSIS ──────────────────────────────────────────────────────
assert('isExplicitClosure alone still returns false on this message (the narrow detector is untouched)',
  isExplicitClosure(TARGET) === false);
assert('declaresClosing returns true on the same message (the fix target)',
  declaresClosing(TARGET) === true);
assert('matchesClosingWord (the broad detector) also misses it — ruling out "widen the broad one instead"',
  matchesClosingWord(TARGET) === false);

// ── THE ISOLATION FIXTURE (kept permanently — this IS the causal-isolation test) ──
const wordCount = TARGET.trim().split(/\s+/).length;
assert('naturalExitReady disjunct (a) is structurally false — TARGET has more than 8 words (' + wordCount + ')',
  wordCount > 8);
const PAD_1 = 'Νομίζω ότι είχα επίσκεψη από εξωγήινους';
const PAD_ASSISTANT_1 = 'Πες μου τι συνέβη.';
const PAD_2 = 'Με 2 φίλους. 3 τη νύχτα. Το είδαν κ αυτοί';
const PAD_ASSISTANT_2 = 'Τι λένε οι φίλοι σου για το τι ήταν;';
const msgs = [
  { role: 'user', content: PAD_1 },
  { role: 'assistant', content: PAD_ASSISTANT_1 },
  { role: 'user', content: PAD_2 },
  { role: 'assistant', content: PAD_ASSISTANT_2 },
  { role: 'user', content: TARGET },
];
assert('NON-VACUITY: the last 3 user messages are genuinely distinct, so hasRepeat cannot be a confound',
  new Set(msgs.filter(m => m.role === 'user').map(m => m.content)).size === msgs.filter(m => m.role === 'user').length);
assert('wasThirdTriggerAsked is false — no "third trigger" prompt was ever injected into msgs',
  wasThirdTriggerAsked(msgs) === false);
assert('the padding assistant messages are not themselves closing words (rules out assistantAlreadyClosed)',
  matchesClosingWord(PAD_ASSISTANT_1) === false && matchesClosingWord(PAD_ASSISTANT_2) === false);

const NEUTRAL_TEXT = 'μια απλή απάντηση χωρίς ερωτηματικό';
assert('the neutral placeholder AURA reply is not itself a real question',
  !/[;?]\s*$/.test(NEUTRAL_TEXT.trim()));
assert('the neutral placeholder does not trigger isModelPreClosing',
  isModelPreClosing(NEUTRAL_TEXT) === false);

const OPTIONS = {
  safetyMode: false,
  currentMode: 'ANSWER',
  warningIssued: false,
  compressionCount: 0,
  modelJudgesEnd: false,
  concreteStepStated: false,
  outcomeScaleAsked: true,
  outcomeScaleBlockUsed: true,
  duringOnboarding: false,
  duringDeclineCooldown: false,
};

// ── THE REGRESSION TARGET — RED before the fix, GREEN after it ──────────────
const decision = decideTermination(msgs, NEUTRAL_TEXT, OPTIONS);
assert('FIX: decideTermination reaches "confirm" for a closing declaration that carries content ("' + TARGET + '")',
  decision === 'confirm');

// ── THE OLD PATH, EXPLICITLY UNCHANGED — not just "suite is green" ──────────
// A pure isExplicitClosure=true case (declaresClosing may be true too, but isExplicitClosure alone
// already decided this before the fix) must still reach "confirm", by the SAME mechanism as before.
const PURE_NARROW = 'Κλείνουμε';
assert('NON-VACUITY: the pure-narrow case really does satisfy isExplicitClosure on its own',
  isExplicitClosure(PURE_NARROW) === true);
const msgsNarrow = [
  { role: 'user', content: PAD_1 },
  { role: 'assistant', content: PAD_ASSISTANT_1 },
  { role: 'user', content: PAD_2 },
  { role: 'assistant', content: PAD_ASSISTANT_2 },
  { role: 'user', content: PURE_NARROW },
];
assert('OLD PATH UNCHANGED: a pure isExplicitClosure closing still reaches "confirm", exactly as before this fix',
  decideTermination(msgsNarrow, NEUTRAL_TEXT, OPTIONS) === 'confirm');

// A case where NEITHER detector fires must still fail to reach "confirm" via this branch — proving
// the OR did not silently become "always true" or broaden beyond the two named detectors.
const NEITHER = 'Δεν ξέρω τι να κάνω με αυτό το θέμα ακόμα';
assert('NON-VACUITY: NEITHER detector fires on this ordinary, non-closing message',
  isExplicitClosure(NEITHER) === false && declaresClosing(NEITHER) === false);
const msgsNeither = [
  { role: 'user', content: PAD_1 },
  { role: 'assistant', content: PAD_ASSISTANT_1 },
  { role: 'user', content: PAD_2 },
  { role: 'assistant', content: PAD_ASSISTANT_2 },
  { role: 'user', content: NEITHER },
];
assert('an ordinary, non-closing message still does not reach "confirm" via userDeclaredExit',
  decideTermination(msgsNeither, NEUTRAL_TEXT, OPTIONS) === 'none');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
