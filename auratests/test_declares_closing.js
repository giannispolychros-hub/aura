// ── DECLARES CLOSING: the gap the other two detectors document and cannot cover ──
//
// THE HARM, three times in three real sessions. isExplicitClosure requires the WHOLE message to
// reduce to closing words, and its own comment in App.jsx records the consequence in advance:
// "Θα το σκεφτώ. Κλείνουμε." is not caught. Then three real sessions produced almost that sentence,
// three different ways, and neither existing detector saw any of them:
//
//   session 1  "δεν ξέρω θα το σκεφτώ άλλη στιγμή σε ευχαριστώ κλείνουμε"
//   session 2  "Ναι θα το κάνω. Ευχαριστώ"
//   session 3  "Θα το σκεφτώ... ευχαριστώ"
//
// Session 1's cost is measured, not inferred: the gates suffix was not suppressed, AURA asked
// another question after "κλείνουμε", and the road artifact then recorded that departure as the
// user's own thinking about ΔΡΟΜΟΣ 1 — a violation of User Ownership in the flagship output.
//
// THE WORDLIST WAS NEVER THE PROBLEM, which is the finding that shaped this. "ευχαριστω" is already
// in BOTH existing detectors' lists. What fails is the whole-message requirement. So this is not
// broader vocabulary — it is the same vocabulary with a narrower SCOPE.
//
// WHY NOT JUST MATCH THE EXISTING LIST ANYWHERE. That list contains "παω", and session 2 says
// "Απλά πάω στο πάρκο" mid-session; "γεια", which opens conversations; "φτανει", while "δεν
// φτάνουν τα χρήματα" is the subject of two whole sessions. Measured, not imagined.
//
// SCOPE OF THE WIRING IN THIS COMMIT, stated because it is a deliberate limit. Of the nine
// user-side consumers, three SUPPRESS something when the user is closing and six ACT (terminate,
// mark closure, pick an index). A false positive in a suppression site withholds one question; in
// an action site it ends someone's session early. Only the three suppression sites are wired here.
// The six action sites wait for telemetry from a real session, which is now collectable.
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

const SRC = extract('declaresClosing');
assert('declaresClosing is defined in App.jsx', !!SRC);
let D = null;
if (SRC) { try { D = eval('(' + SRC + ')'); } catch (e) { console.log('FAIL — not standalone: ' + e.message); failed++; } }
assert('it evaluates standalone', typeof D === 'function');

// The two existing detectors, lifted so the gap is demonstrated rather than asserted.
let isExplicitClosure = null, matchesClosingWord = null;
try { isExplicitClosure = eval('(' + extract('isExplicitClosure') + ')'); } catch (e) {}
try { matchesClosingWord = eval('(' + extract('matchesClosingWord') + ')'); } catch (e) {}

if (typeof D === 'function') {
  // ── 1. THE THREE REAL CLOSINGS, AND THE GAP PROVEN ────────────────────────
  const REAL = [
    ['session 1 — tier A, no sentence boundary anywhere in the message', 'δεν ξέρω θα το σκεφτώ άλλη στιγμή σε ευχαριστώ κλείνουμε'],
    ['session 2 — tier B, the final sentence is the leave-taking', 'Ναι θα το κάνω. Ευχαριστώ'],
    ['session 3 — tier B, an ellipsis is the sentence boundary', 'Θα το σκεφτώ... ευχαριστώ'],
  ];
  REAL.forEach(([label, msg]) => {
    assert('REAL: ' + label, D(msg) === true);
    if (isExplicitClosure && matchesClosingWord) {
      assert('GAP PROVEN: neither existing detector catches it — ' + label.split(' —')[0],
        isExplicitClosure(msg) === false && matchesClosingWord(msg) === false);
    }
  });

  // ── 2. THE 13-OF-15 RISK THAT MUST NOT COME BACK ──────────────────────────
  // matchesClosingWord treats a bare agreement as closing, measured at 13 of 15 realistic
  // mid-session acknowledgments. Those words appear only in tier B's REDUCTION list, where they
  // can help a final sentence reduce but can never trigger on their own.
  ['Ναι', 'Οκ', 'Κατάλαβα', 'Ακριβώς', 'Ωραία', 'Σωστό', 'Εντάξει', 'Καλά'].forEach(w => {
    assert('a bare "' + w + '" is not a closing declaration', D(w) === false);
  });
  if (matchesClosingWord) {
    assert('NON-VACUITY: the broad detector DOES flag those, which is why they are excluded here',
      matchesClosingWord('Ναι') === true && matchesClosingWord('Κατάλαβα') === true);
  }

  // ── 3. THE WORDS DELIBERATELY KEPT OUT OF TIER A, each with its real sentence ─
  assert('"πάω" is not a closing — session 2 says "Απλά πάω στο πάρκο" mid-session',
    D('Απλά πάω στο πάρκο... Τα ίδια και τα ίδια... Δυστυχώς είναι η πάγια έξοδος') === false);
  assert('"γεια" is not a closing — it opens conversations',
    D('Γεια, θέλω να μιλήσουμε για τη δουλειά μου') === false);
  // Both inflections, because the fold collapses doubled letters but does not stem: a fixture with
  // "φτάνουν" leaves "φτάνει" untested, which a surviving mutation proved.
  assert('"φτάνουν" is not a closing — two whole sessions are about money not being enough',
    D('τα 1300 ευρώ δε φτάνουν για ποιοτική ζωή') === false);
  assert('"φτάνει" in the singular is not a closing either',
    D('ο μισθός δεν φτάνει για τα βασικά') === false);
  assert('"τέλος" is not a closing — "τέλος πάντων" means anyway',
    D('Τέλος πάντων, ας πούμε για το άλλο θέμα') === false);

  // ── 4. THANKS THAT IS NOT LEAVE-TAKING ────────────────────────────────────
  // The discriminator is that the leave-taking must be the whole of the FINAL sentence. Thanks that
  // opens a sentence which then continues is not a departure.
  assert('thanks followed by a further question does not flag',
    D('ευχαριστώ, και τι γίνεται με το δάνειο;') === false);
  assert('thanks inside a sentence that continues does not flag',
    D('Σε ευχαριστώ που το εξήγησες, αλλά δεν κατάλαβα το δεύτερο') === false);
  assert('a deferral that continues into a commitment does not flag',
    D('θα το σκεφτώ και θα σου πω τι αποφάσισα αύριο το πρωί') === false);

  // ── 5. TIER A REACHES A DECLARATION BURIED MID-MESSAGE ────────────────────
  assert('a declaration in the middle of a long message is still a declaration',
    D('Λοιπόν δεν ξέρω τι να κάνω με όλα αυτά, κλείνουμε εδώ και τα λέμε άλλη φορά') === true);
  assert('the documented example from the isExplicitClosure comment is caught',
    D('Θα το σκεφτώ. Κλείνουμε.') === true);
  if (isExplicitClosure) {
    assert('NON-VACUITY: that documented example really was missed by the narrow detector',
      isExplicitClosure('Θα το σκεφτώ. Κλείνουμε.') === false);
  }

  // ── 6. WHAT THE NARROW DETECTOR ALREADY CATCHES STILL COUNTS HERE ──────────
  assert('a pure closing is still a closing', D('Κλείνουμε') === true);
  assert('a farewell is still a closing', D('Καληνύχτα') === true);

  // ── 7. DEGENERATE INPUT ───────────────────────────────────────────────────
  [undefined, null, '', '   ', 42, {}, [], '...', '???'].forEach(v => {
    let threw = false, res = null;
    try { res = D(v); } catch (e) { threw = true; }
    assert('degenerate input ' + JSON.stringify(v) + ' neither throws nor flags', !threw && res === false);
  });
  assert('it takes exactly one parameter, text', D.length === 1);
  assert('its body reads no message, no content field and no history',
    !/\.content\b/.test(SRC) && !/\bmessages\b/.test(SRC));
}

// ── 8. WIRING — the three SUPPRESSION sites, and only those ──────────────────
// Each is "do not do X when the user is closing". The detector is added BESIDE the existing check,
// never replacing it, so the narrow detector's own behaviour is untouched.
// ANCHORED ON THE CONDITION ITSELF, never on a fixed character window. A ±700-char window around
// "textAsksRealQuestion" missed its own call site by 7717 characters, because the first occurrence
// of that name is its declaration far above. Fixed-width windows have expired six times in this
// repo; each site is now identified by the whole line that must contain the call.
const SITES = [
  ['decideTermination keeps a real question from being overridden at a close',
   /if \(\(decision === "confirm" \|\| decision === "terminate"\)[^\n]*\n?[^\n]*$/m,
   'textAsksRealQuestion'],
  ['the gates suffix is withheld when the user is closing', null, 'lastUserMsgForGates'],
  ['the Outcome Scale is not forced onto a closing turn', null, 'parseThreeBeatShift(displayText)'],
];
SITES.forEach(([label, _re, name]) => {
  // Every executable line that mentions this name, so the check cannot land on a declaration.
  const lines = raw.split('\n').filter(l => l.includes(name) && !/^\s*(\/\/|\*)/.test(l));
  assert('NON-VACUITY: at least one executable line mentions "' + name + '"', lines.length > 0);
  const withCall = lines.filter(l => /declaresClosing\s*\(/.test(l));
  assert('WIRING: ' + label, withCall.length === 1);
  assert('WIRING: it is ADDED beside the existing check, not replacing it — ' + label.slice(0, 28),
    withCall.length === 1 && /isExplicitClosure\s*\(|matchesClosingWord\s*\(/.test(withCall[0]));
});
// ── 9. THE FOURTH SUPPRESSION SITE: the road artifact must not record a departure ──
// THE HARM THIS CLOSES, and it is the one that reached the flagship output. Session 1: the road
// question for ΔΡΟΜΟΣ 1 went out, the user replied "…ευχαριστώ κλείνουμε", and the capture below
// recorded that departure as his answer. The artifact then printed, under "Η ΣΚΕΨΗ ΣΟΥ, ΑΝΑ ΔΡΟΜΟ":
//
//     ΔΡΟΜΟΣ 1 — Αγορά + ανακαίνιση στούντιο, μετά πώληση
//     Μένει το ερώτημα που ξεκίνησες: δουλειά ή κάτι άλλο…
//     «δεν ξέρω θα το σκεφτώ άλλη στιγμή σε ευχαριστώ κλείνουμε»
//
// Neither line is about that road. This is User Ownership failing in the output the Blueprint
// charges for, and it is a suppression, not an action: buildRoadArtifact already OMITS unanswered
// roads on purpose — "show it thinner rather than completing it" — so a false positive costs one
// omitted row, which is the behaviour the artifact already documents as correct.
//
// NOT A FIX FOR THE OTHER HALF, stated so it is not mistaken for one. The same reply was also not a
// road-1 question: the model received "Ask EXACTLY ONE question about ΔΡΟΜΟΣ 1" and asked a generic
// one instead. That is prompt compliance and no code here addresses it.
const CAP_AT = raw.indexOf('if (st.qa.length < st.asked) {');
assert('NON-VACUITY: the road Q/A capture site is findable', CAP_AT > 0);
const CAP = raw.slice(CAP_AT, raw.indexOf('const cap = Math.min(st.roads.length, 3);', CAP_AT));
assert('NON-VACUITY: the capture slice is bounded by its real neighbour', CAP.length > 200 && CAP.length < 2200);
assert('WIRING: a departure is not recorded as the answer to a road question',
  /declaresClosing\s*\(/.test(CAP));
assert('WIRING: the guard is on the USER message, which is the one that would be misread as an answer',
  /declaresClosing\([^)]*lastUser/.test(CAP));
// NEGATED, and pinned as negated. A surviving mutation inverted the guard so that ONLY a departure
// was recorded — the exact opposite behaviour — and every other assertion passed, because they all
// checked that the call and the push exist rather than which way the condition runs.
assert('the guard is NEGATED: a departure withholds the pair, it does not select it',
  /&&\s*!declaresClosing\(/.test(CAP));
assert('the pair is still pushed when the message is a real answer — the guard only withholds',
  /st\.qa\.push\(/.test(CAP));

// UPDATED DELIBERATELY, not silently: a 5th call site joined on 2026-09-26, in decideTermination's
// own userDeclaredExit (found by a read-only forensic audit — until then, isExplicitClosure alone
// decided whether a declared closing ever reached decision==="confirm" at all, so a closing that
// carried content, proven caught by declaresClosing at the four suppression sites above, still
// never terminated the session through this branch). This one is an ACTION site, not a suppression
// site — it is what decides whether the closure-confirm card is offered in the first place, not
// merely whether an unrelated question or gate is withheld. The count below is the thing this
// assertion exists to keep honest, so it moves with the real number rather than being deleted.
assert('exactly five call sites are wired, matching the current stated scope',
  (raw.match(/declaresClosing\s*\(/g) || []).length === 6); // 5 call sites + the definition

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
