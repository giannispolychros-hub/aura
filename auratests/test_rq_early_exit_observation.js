// AURA — OBSERVATION-ONLY: does _rqEarlyExit actually become true when decision === "confirm"?
//
// DEFERRED SINCE THE userDeclaredExit FIX (355bbd5, this same day): that fix made declaresClosing
// feed decision === "confirm" for a closing that carries content (session 1's target message).
// Static grep at the time showed _rqEarlyExit (γρ. 6035-6036, inside the road-question emit site)
// reads that SAME shared `decision` variable — so the fix should cascade here too, closing a road-
// question sequence the instant such a message arrives, not just reaching decision === "confirm"
// in isolation. That claim was static-only, never runtime-verified. This file verifies it, without
// touching _rqEarlyExit's own logic at all — pure observation, same discipline as the road-trace
// diagnostics already in App.jsx ("STRICTLY SHADOW... never affects a session").
//
// LOCKSTEP, not re-implementation: _rqEarlyExit's own expression is copied here character-for-
// character from the production line and pinned against it below, the same coupling discipline
// test_signals already uses for detectsConcreteStep/classifyStepIntent's shared `base` pattern. If
// the production line ever changes, this test's mirror is checked to still match it — a silent
// drift is caught, never assumed away.

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
// Same six dependencies decideTermination's own source pins — not a hand-picked subset.
const DEPS = ['matchesClosingWord', 'isBareEmojiOrAcknowledgment', 'wasThirdTriggerAsked',
              'isExplicitClosure', 'isModelPreClosing', 'declaresClosing'];
for (const n of DEPS) eval(extract(n));
eval(extract('decideTermination'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── LOCKSTEP PIN: the production _rqEarlyExit line, verbatim ────────────────────────────────────
const PROD_LINE_START = raw.indexOf('const _rqEarlyExit = safetyMode ||');
assert('NON-VACUITY: the production _rqEarlyExit line is findable, unrenamed', PROD_LINE_START > 0);
const PROD_LINE = raw.slice(PROD_LINE_START, raw.indexOf(';', PROD_LINE_START) + 1);
const normalize = s => s.replace(/\s+/g, ' ').trim();
const MIRROR = 'const _rqEarlyExit = safetyMode || isExplicitClosure(lastUserMsg) || decision === "confirm" || decision === "terminate";';
assert('LOCKSTEP: this file\'s mirror of _rqEarlyExit is character-for-character the same expression as production (whitespace-normalized) — a silent drift would fail here first',
  normalize(PROD_LINE) === normalize(MIRROR));

// ── THE TARGET, same fixture test_user_declared_exit_gap.js already proved reaches "confirm" ────
const TARGET = 'δεν ξέρω θα το σκεφτώ άλλη στιγμή σε ευχαριστώ κλείνουμε';
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
const NEUTRAL_TEXT = 'μια απλή απάντηση χωρίς ερωτηματικό';
const OPTIONS = {
  safetyMode: false, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0,
  modelJudgesEnd: false, concreteStepStated: false, outcomeScaleAsked: true,
  outcomeScaleBlockUsed: true, duringOnboarding: false, duringDeclineCooldown: false,
};

// ── THE ACTUAL RUNTIME CHAIN, executed, not assumed ──────────────────────────────────────────────
const decision = decideTermination(msgs, NEUTRAL_TEXT, OPTIONS);
assert('decision reaches "confirm" for the session-1 target (re-derived here, not assumed from the other file)',
  decision === 'confirm');

// The exact production expression, evaluated here as data (not a new function) — this IS the
// runtime proof: a road-question sequence in progress, with this exact message as the user's last
// word, closes on this turn rather than asking its next road question.
const safetyMode = false; // OPTIONS.safetyMode mirrored — a road question sequence is never active during safety mode anyway (roadQuestionState.current requires a map to have been delivered)
const lastUserMsg = TARGET;
const _rqEarlyExit = safetyMode || isExplicitClosure(lastUserMsg) || decision === "confirm" || decision === "terminate";
assert('THE CASCADE, RUNTIME-VERIFIED: _rqEarlyExit is true for the session-1 target — a road-question sequence would end this turn, not ask its next question over a declared closing',
  _rqEarlyExit === true);
assert('AND SPECIFICALLY VIA declaresClosing, not isExplicitClosure — the narrow detector alone would NOT have produced this',
  isExplicitClosure(lastUserMsg) === false && declaresClosing(lastUserMsg) === true);

// ── NON-VACUITY: _rqEarlyExit is NOT always true — a real, ongoing road answer keeps it false ───
const ONGOING_ANSWER = 'Νομίζω η πρώτη επιλογή ταιριάζει καλύτερα με αυτά που θέλω μακροπρόθεσμα';
const msgsOngoing = [
  { role: 'user', content: PAD_1 },
  { role: 'assistant', content: PAD_ASSISTANT_1 },
  { role: 'user', content: PAD_2 },
  { role: 'assistant', content: PAD_ASSISTANT_2 },
  { role: 'user', content: ONGOING_ANSWER },
];
const decisionOngoing = decideTermination(msgsOngoing, NEUTRAL_TEXT, OPTIONS);
const lastUserMsgOngoing = ONGOING_ANSWER;
const _rqEarlyExitOngoing = safetyMode || isExplicitClosure(lastUserMsgOngoing) || decisionOngoing === "confirm" || decisionOngoing === "terminate";
assert('NON-VACUITY: an ordinary road-question answer does NOT trip _rqEarlyExit — the road sequence would continue normally',
  _rqEarlyExitOngoing === false);

// ── OLD PATH UNCHANGED: a pure isExplicitClosure case still trips it, exactly as before this fix ──
const PURE_NARROW = 'Κλείνουμε';
const msgsNarrow = [
  { role: 'user', content: PAD_1 },
  { role: 'assistant', content: PAD_ASSISTANT_1 },
  { role: 'user', content: PAD_2 },
  { role: 'assistant', content: PAD_ASSISTANT_2 },
  { role: 'user', content: PURE_NARROW },
];
const decisionNarrow = decideTermination(msgsNarrow, NEUTRAL_TEXT, OPTIONS);
const lastUserMsgNarrow = PURE_NARROW;
const _rqEarlyExitNarrow = safetyMode || isExplicitClosure(lastUserMsgNarrow) || decisionNarrow === "confirm" || decisionNarrow === "terminate";
assert('OLD PATH UNCHANGED: a pure isExplicitClosure closing still trips _rqEarlyExit, by the same mechanism as before this fix',
  _rqEarlyExitNarrow === true && isExplicitClosure(lastUserMsgNarrow) === true);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
