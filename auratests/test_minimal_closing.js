// AURA — THE CLOSING STOPS TELLING THE SAME STORY FOUR TIMES
//
// LIVE EVIDENCE, 2026-09-21. After the user typed «Κλείνουμε», one real session told the same
// story four times over:
//
//   1  «Ήρθες με μια παράξενη διάθεση… Βρήκες τρεις κατευθύνσεις… Φεύγεις με δύο βήματα.
//       Καλή συνέχεια.»                                    ← the three-beat, in the normal reply
//   2  «Ξεκίνησες από μία «παράξενη διάθεση»…» + word request      ← Part 1, Reflection Summary
//   3  «Ξεκίνησες με ένα αίσθημα που δεν είχε όνομα…»              ← Part 2
//   4  to the point of mind → «Απλά δεν είχε μπει στη σειρά ακόμα.» ← finalDistillation
//
// #4 is #3's own last sentence, reprinted directly underneath. Deterministic, every session.
// And #1 had already said «Καλή συνέχεια» — the session said goodbye, then closed twice more.
//
// TWO REMOVALS, both approved:
//
// A1  The duplicate render goes. finalDistillation the STATE stays, because it is load-bearing
//     as a "a real closing happened" gate for the paywall block, the Blueprint button and the
//     Νέα συνεδρία button — removing it would take the Blueprint away. What goes is the second
//     rendering of a sentence the reader has just read.
//
// A2  Part 1 stops narrating. The three-beat has already told this session's story once; a
//     second prose retelling of the same material is exactly what this removes. Part 1 keeps
//     the one thing only it does: the word-to-remember question, which is load-bearing for the
//     anchor, RECURRING, Κ4 and the Blueprint zones.
//
// ZERO PROMPT CHANGE. A2 is done in the per-call TRIGGER MESSAGE, the same override mechanism
// the earlyCapturedWord branch already uses. SYSTEM_TERMINATION and AURA_CORE_PERSONALITY are
// both asserted byte-unchanged, so no cache entry is invalidated.
//
// OUT OF SCOPE, stated so it is not mistaken for fixed: Part 2 can still retell. Its own
// instruction already forbids that and the model ignored it once. With Part 1's narrative gone
// the worst case is two tellings instead of four; the rest waits for measurement.

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

// ══ A1 — THE DUPLICATE RENDER IS GONE ══════════════════════════════════════
assert('A1: the second rendering of the closing sentence is gone',
  CODE.indexOf('to the point of mind') === -1);
assert('A1: its markup is gone with it',
  !/className="distillation-label"/.test(CODE) && !/className="distillation-text"/.test(CODE));
assert('A1: the dead three-beat branch under it is gone too — it could never fire on one sentence',
  !/className="shift-beat"/.test(CODE));
assert('A1: the CSS that only that block used is gone',
  !/\.distillation-label\{/.test(CODE) && !/\.shift-beat\{/.test(CODE));
assert('A1: the state it needed is gone',
  !/isFirstDistillation/.test(CODE));

// THE REGRESSION THAT MATTERS. finalDistillation is not decoration — it gates three things.
// Deleting the state instead of the render would silently remove the Blueprint.
// MEASURED: `/setFinalDistillation\(/` alone passed a mutation that set it to null — which would
// have silently removed the Blueprint button, the paywall block and left only Νέα συνεδρία. The
// assertion now checks what it is set FROM.
assert('A1 REGRESSION: the closing flag is still set from the reply, never to null',
  /setFinalDistillation\(sentences\[sentences\.length - 1\]\)/.test(CODE));
assert('A1 REGRESSION: the failure path still sets it too, so a failed close still reaches the sheet',
  /setFinalDistillation\("[^"]+"\)/.test(CODE));
assert('A1 REGRESSION: it still gates the paywall block',
  /sessionEnded && !loading && finalDistillation && !valueUnlocked/.test(CODE));
assert('A1 REGRESSION: it still gates the Blueprint download button',
  /valueUnlocked && finalDistillation/.test(CODE));
assert('A1 REGRESSION: it still gates the Νέα συνεδρία button',
  /!finalDistillation \|\| valueUnlocked/.test(CODE));
assert('A1: and it is never rendered as text anywhere',
  !/\{finalDistillation\}/.test(CODE));

// ══ A2 — PART 1 STOPS NARRATING ════════════════════════════════════════════
const TRIG = (() => {
  const i = CODE.indexOf('const triggerTermination');
  return i < 0 ? '' : CODE.slice(i, CODE.indexOf('}, [safetyMode, memory, deliverFinalClosure]);', i));
})();
assert('A2: triggerTermination was located', TRIG.length > 500);
assert('A2: no trigger asks for the Reflection Summary any more',
  TRIG.indexOf('the Reflection Summary, ending exactly with') === -1 &&
  TRIG.indexOf('Deliver Part 1 now: the Reflection Summary') === -1);
assert('A2: BOTH branches are covered — the early-word one had its own copy',
  (TRIG.match(/Deliver Part 1 now/g) || []).length === 2);
assert('A2: both say plainly not to write a summary',
  (TRIG.match(/DO NOT write a reflection summary/g) || []).length === 2);
assert('A2: the reason is given, not just the prohibition — the three-beat already told it',
  /three-beat/.test(TRIG));

// THE ONE THING PART 1 STILL DOES, and everything downstream depends on it.
assert('A2 REGRESSION: the word-to-remember question still happens',
  /setAwaitingRememberedWord\(true\)/.test(TRIG));
// MEASURED: deleting the API call outright left every other assertion green — the app would have
// waited for a word it never asked for. Both branches must still reach the model.
assert('A2 REGRESSION: both Part 1 branches still call the model with SYSTEM_TERMINATION',
  (TRIG.match(/await callAura\([^)]*SYSTEM_TERMINATION\)/g) || []).length === 2);
assert('A2 REGRESSION: each call is handed its own trigger message, not a bare history',
  /callAura\(termMsgsEarly, SYSTEM_TERMINATION\)/.test(TRIG) &&
  /callAura\(termMsgs, SYSTEM_TERMINATION\)/.test(TRIG));
// MEASURED: searching for the identifier matched its own declaration, so dropping the
// interpolation from the trigger changed nothing. Checked where it is actually used.
assert('A2 REGRESSION: the previous-word wording is interpolated INTO the trigger, not just declared',
  /\$\{wordContextNote\}/.test(TRIG));
assert('A2 REGRESSION: the early-word branch still skips re-asking',
  /do NOT ask for it again|Do not ask for it again/i.test(TRIG));
assert('A2 REGRESSION: it still stops before Part 2 and waits',
  /Do not continue to Ownership Statement/.test(TRIG));
// EXACTLY TWO: the normal path and the fallback. ">= 2" and a loose proximity regex both
// survived a mutation that deleted one of them.
assert('A2 REGRESSION: both the normal path and the failure fallback ask for the word',
  (TRIG.match(/setAwaitingRememberedWord\(true\)/g) || []).length === 2);

// ══ THE CLOSING STILL CLOSES ═══════════════════════════════════════════════
const FINAL = (() => {
  const i = CODE.indexOf('const deliverFinalClosure');
  return i < 0 ? '' : CODE.slice(i, CODE.indexOf('}, [applyTerminationIllumination]);', i));
})();
assert('CLOSING: deliverFinalClosure was located', FINAL.length > 500);
assert('CLOSING: Part 2 still runs', /Deliver Part 2 now/.test(FINAL));
assert('CLOSING: the session still ends', /setSessionEnded\(true\)/.test(FINAL));
assert('CLOSING: the Κ4 recognition gate still arms', /setRecognitionPending\(/.test(FINAL));
assert('CLOSING: the closing flag is still set, so the Blueprint stays reachable',
  /setFinalDistillation\(/.test(FINAL));
assert('CLOSING: Part 2 is still told not to repeat the summary',
  /Do not repeat the Reflection Summary/.test(FINAL));

// ══ THE CACHE PIN ══════════════════════════════════════════════════════════
// A2 itself lives in the per-call trigger message, not in a prompt, and this pin was written to
// prove that. HASHED, NOT COUNTED. A raw length pin is ambiguous: the prompt contains one character
// outside the BMP, so JavaScript counts UTF-16 units where Python counts code points. Both are
// right for their runtime and neither identifies the text. The digest does.
//
// THE DIGEST CHANGED ONCE, DELIBERATELY, on 2026-09-26 (2066c6c9dfefa1bb → bb44fc9e364a6a26). The
// status-quo road was added to the map-composition rules: a founder's finding from a real session
// where someone weighing a job change was shown one road and the direction of changing nothing
// never appeared, although it is the only one that requires no decision. +1763 characters, one
// cache invalidation, paid knowingly. See test_status_quo_road.js for what the block must contain.
// This pin is not a rule against editing the prompt — it is a rule against editing it by accident.
const PROMPT_SHA = require('crypto').createHash('sha256').update(PROMPT, 'utf8').digest('hex');
assert('CACHE: AURA_CORE_PERSONALITY matches the recorded digest (sha256 bb44fc9e364a6a26…)',
  PROMPT_SHA.slice(0, 16) === 'bb44fc9e364a6a26');
assert('CACHE: SYSTEM_TERMINATION still carries its own PART 1 spec — the prompt was not edited',
  /── PART 1 \(first reply — REFLECTION SUMMARY \+ word request\) ──/.test(raw));
assert('CACHE: the removal is in code, not in either prompt',
  !/DO NOT write a reflection summary/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
