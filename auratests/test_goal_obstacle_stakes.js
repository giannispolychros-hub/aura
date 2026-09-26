// AURA — GOAL / OBSTACLE / STAKES coverage, the gap ARCHITECTURE_DECISIONS.md already named:
// "The GOAL / OBSTACLE / STAKES gap the teacher session exposed (time pressure, psychological
// pressure, what was tried and rejected)... runs whenever convenient and must not delay 1→6."
//
// Founder's own framing for this step (paraphrased from the conversation that requested it): not a
// behaviour change — the model already decides everything about strategy, depth, and timing. This
// only tells it, in plain terms, which of GOAL / OBSTACLE / STAKES the user has and has not yet
// named in their own words, so it can judge when a gap is covered, when to go deeper, when a
// strategy change is due — without a new "brain" and without forcing a fourth question just to
// fill a category.
//
// ARCHITECTURE: same pattern as materialEvidenceCtx (money amounts / explicit constraints /
// permission uncertainty) just above it in the file — recomputed fresh from `msgs` every turn, no
// session ref, no reset-block edit needed, never wired to any gate. Purely informational tier.
//
// KNOWN, ACCEPTED LIMITATION, stated deliberately: the three detectors below are broad, common
// Greek phrasings, not tight grammatical forms like detectsBinaryOppositionPhrasing — a false
// "stated" reading is plausible and not yet measured against real transcripts. The asymmetry is
// safe by construction: a false positive here means silence (no nudge), never a forced question.

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
eval(extract('detectsGoalStated'));
eval(extract('detectsObstacleStated'));
eval(extract('detectsStakesStated'));
eval(extract('describeGoalObstacleStakesCtx'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── NON-VACUITY: the gap this closes is still named, unaltered, in the doc ─────────────────────
const doc = fs.readFileSync(path.join(__dirname, '/../ARCHITECTURE_DECISIONS.md'), 'utf8');
assert('NON-VACUITY: the GOAL/OBSTACLE/STAKES gap is still documented as the thing this closes',
  /GOAL \/ OBSTACLE \/ STAKES gap the teacher session exposed/.test(doc));

// ── detectsGoalStated ────────────────────────────────────────────────────────────────────────────
assert('GOAL: "θέλω να φύγω από τη δουλειά" is recognised', detectsGoalStated('Θέλω να φύγω από τη δουλειά') === true);
assert('GOAL: "ο στόχος μου είναι να τελειώσω τις σπουδές" is recognised', detectsGoalStated('Ο στόχος μου είναι να τελειώσω τις σπουδές') === true);
assert('GOAL: an unrelated factual statement is not recognised', detectsGoalStated('Ο καιρός σήμερα είναι συννεφιασμένος') === false);
assert('GOAL: empty/null text does not crash and returns false', detectsGoalStated('') === false && detectsGoalStated(null) === false);

// ── detectsObstacleStated ───────────────────────────────────────────────────────────────────────
assert('OBSTACLE: "δεν μπορώ να αποφασίσω" is recognised', detectsObstacleStated('Δεν μπορώ να αποφασίσω τι να κάνω') === true);
assert('OBSTACLE: "το πρόβλημα είναι ο χρόνος" is recognised', detectsObstacleStated('Το πρόβλημα είναι ο χρόνος που έχω') === true);
assert('OBSTACLE: a plain goal statement alone is not recognised as an obstacle', detectsObstacleStated('Θέλω να αλλάξω δουλειά') === false);
assert('OBSTACLE: empty/null text does not crash', detectsObstacleStated('') === false && detectsObstacleStated(undefined) === false);

// ── detectsStakesStated ─────────────────────────────────────────────────────────────────────────
assert('STAKES: "αν δεν το κάνω τώρα θα χάσω την ευκαιρία" is recognised', detectsStakesStated('Αν δεν το κάνω τώρα θα χάσω την ευκαιρία') === true);
assert('STAKES: "έχω ήδη δοκιμάσει και δεν βοήθησε" is recognised', detectsStakesStated('Έχω ήδη δοκιμάσει να μιλήσω και δεν βοήθησε') === true);
assert('STAKES: a plain obstacle statement alone is not recognised as stakes', detectsStakesStated('Δεν μπορώ να αποφασίσω') === false);
assert('STAKES: empty/null text does not crash', detectsStakesStated('') === false && detectsStakesStated(null) === false);

// ── describeGoalObstacleStakesCtx ───────────────────────────────────────────────────────────────
assert('all three known → returns \'\' (nothing to flag once complete)',
  describeGoalObstacleStakesCtx(true, true, true) === '');
assert('none known → names all three, in the doc\'s own vocabulary (GOAL/OBSTACLE/STAKES)',
  /GOAL/.test(describeGoalObstacleStakesCtx(false, false, false)) &&
  /OBSTACLE/.test(describeGoalObstacleStakesCtx(false, false, false)) &&
  /STAKES/.test(describeGoalObstacleStakesCtx(false, false, false)));
assert('only GOAL known → names OBSTACLE and STAKES, not GOAL, as missing',
  !/GOAL \(/.test(describeGoalObstacleStakesCtx(true, false, false)) &&
  /OBSTACLE \(/.test(describeGoalObstacleStakesCtx(true, false, false)) &&
  /STAKES \(/.test(describeGoalObstacleStakesCtx(true, false, false)));
assert('explicitly says this never forces a question or blocks anything',
  /never forces a question/.test(describeGoalObstacleStakesCtx(false, true, true)) &&
  /authorizes nothing and blocks nothing/.test(describeGoalObstacleStakesCtx(false, true, true)));

// ── PURITY: all four functions are pure — no ref access ────────────────────────────────────────
for (const name of ['detectsGoalStated', 'detectsObstacleStated', 'detectsStakesStated', 'describeGoalObstacleStakesCtx']) {
  assert('PURITY: ' + name + ' contains no \'.current\'', !/\.current/.test(extract(name)));
}

// ── WIRING: computed fresh from msgs every turn (materialEvidenceCtx's own pattern), no new ref,
// no new reset-block line — verified structurally rather than assumed ───────────────────────────
assert('WIRING: goalObstacleStakesCtx is defined as an IIFE scanning msgs, same pattern as materialEvidenceCtx',
  /const goalObstacleStakesCtx = \(\(\) => \{[^]*?userMsgs\.some\(m => detectsGoalStated/.test(raw));
// Each of the three known-flags must come from its OWN detector, not a hardcoded value or a
// different detector substituted in — checked individually so any one being dropped is caught.
assert('WIRING: goalKnown is derived from detectsGoalStated over every user message, not hardcoded',
  /const goalKnown = userMsgs\.some\(m => detectsGoalStated\(m\.content\)\);/.test(raw));
assert('WIRING: obstacleKnown is derived from detectsObstacleStated over every user message, not hardcoded',
  /const obstacleKnown = userMsgs\.some\(m => detectsObstacleStated\(m\.content\)\);/.test(raw));
assert('WIRING: stakesKnown is derived from detectsStakesStated over every user message, not hardcoded',
  /const stakesKnown = userMsgs\.some\(m => detectsStakesStated\(m\.content\)\);/.test(raw));
assert('WIRING: goalObstacleStakesCtx is part of dynamicSuffix', /dynamicSuffix = \[[^\]]*goalObstacleStakesCtx/s.test(raw));
assert('WIRING: goalObstacleStakesCtx is part of the fired/familiesUsed tracker',
  /const fired = Object\.entries\(\{[^}]*goalObstacleStakesCtx/s.test(raw));
assert('NO NEW REF: this feature adds no useRef — it is derived fresh from msgs, same discipline as materialEvidenceCtx',
  !/const goalStated\s*=\s*useRef|const obstacleStated\s*=\s*useRef|const stakesStated\s*=\s*useRef|const goalObstacleStakes\w*\s*=\s*useRef/.test(raw));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
