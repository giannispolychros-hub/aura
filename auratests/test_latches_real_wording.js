// ── ΤΑ ΔΥΟ LATCHES (STAKES, ΦΙΛΟΣ) ΑΝΑΓΝΩΡΙΖΟΥΝ ΤΑ ΠΡΑΓΜΑΤΙΚΑ ΛΟΓΙΑ ΤΗΣ AURA (το shift check γύρισε πίσω) (απόφαση ιδρυτή, 2026-10-01) ─────────────
//
// WHY. test_ruler_detectors.js §5 pinned three KNOWN GAPS on purpose: the stakes, friend-perspective
// and shift-check latches did not recognise the wording the model REALLY used, so a question that
// had been asked still read as "not asked". Widening them changes what the model is told next turn
// (these are not counters), so it was left as a founder decision. The founder decided: widen exactly
// these three, nothing else — and NOT detectsConcreteStep, which gates a hard override of the reply.
//
// WHAT EACH LATCH DRIVES (read from the code, so the consequences below are not guesses):
//   stakesAsked  → the "Stakes Question" line of the GATES DUE reminder (gatesCtx) + the ledger.
//                  Recognised sooner ⇒ the reminder stops asking for it ⇒ AURA asks LESS.
//   shiftCheckAsked / friendPerspectiveAsked → ONLY the confirmation path: a short affirmative
//                  answer next turn sets *Confirmed, which injects "proceed" (shiftCheckCtx /
//                  friendPerspectiveCtx). Recognised ⇒ AURA proceeds instead of probing again.
//
// THE FRIEND LATCH IS WIDENED FOR THE SECOND QUESTION ONLY, and the reason is measured, not stylistic.
// It tracks the yes/no CONFIRMATION question, not the open "τι θα του έλεγες;". A real user answered
// that open question with "Ναι , γιατί όχι..?" — a short message starting with "ναι", which
// detectsAffirmativeShort reads as an affirmative. Marking the open question as "asked" would turn
// that reply into a false "yes, different" confirmation. So the open question stays unrecognised, and
// that is pinned below.
//
// KNOWN, PINNED CONSEQUENCES (documented rather than hidden):
//   • POLARITY (CLOSED the same day). The real confirmation wording is "…το επιτρέπεις και στον εαυτό
//     σου;" — there "Ναι" means "I allow it to myself too" (the SAME), while friendPerspectiveCtx told the
//     model the user confirmed "yes, DIFFERENT". The ctx now says only that the user answered "yes"
//     (true for both wordings); its directive is unchanged. Pinned in §5.
//   • SHIFT LATCH — WIDENING REMOVED THE SAME DAY (2026-10-01, founder decision). The widened wording was an
//     OPEN question ("Τι άλλαξε μέσα σου…"); the one real reply to it was a non-answer, so nothing changed in
//     practice, and detectsAffirmativeShort accepts any short reply starting with "νιώθω", so "Νιώθω το ίδιο"
//     would have counted as a yes. Small benefit, known risk: §3 pins the latch back to its original form.
//     The same day the unused observation twins (friend/shift flags, detectsStepAnswerLoose) were removed too.
//
// Fixtures are synthetic with the same grammatical shape as what was measured; no user text is stored.
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
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}
function lift(name) {
  const src = extract(name);
  if (!src) { console.log('FAIL — ' + name + ' is defined in App.jsx'); failed++; return null; }
  try { return eval('(' + src + ')'); } catch (err) {
    console.log('FAIL — ' + name + ' evaluates standalone (no sibling calls): ' + err.message); failed++; return null;
  }
}
const stakes = lift('detectsStakesAsked');
const friend = lift('detectsFriendPerspectiveAsked');
const shift = lift('detectsShiftCheckAsked');
const affirm = lift('detectsAffirmativeShort');
const spont = lift('detectsSpontaneousShiftRecognition');
const loose = lift('detectsGateQuestionsLoose');
const step = lift('detectsConcreteStep');

// ── 1. STAKES ────────────────────────────────────────────────────────────────────────────────────
if (stakes) {
  assert('STAKES, real wording: "τι πιστεύεις ότι θα κοστίσει περισσότερο … για έναν ακόμα χρόνο;"',
    stakes('Αν αυτό δεν ξεκαθαρίσει για έναν ακόμα χρόνο — τι πιστεύεις ότι θα κοστίσει περισσότερο;') === true);
  assert('STAKES, "έναν χρόνο" without "ακόμα"', stakes('Για έναν χρόνο, τι θα κοστίσει περισσότερο;') === true);
  assert('STAKES, "μείνει θολό" as the horizon', stakes('Αν αυτό μείνει θολό, τι θα κοστίσει περισσότερο;') === true);
  assert('STAKES, a Latin question mark closes the question as well', stakes('Για έναν χρόνο, τι θα κοστίσει περισσότερο?') === true);
  assert('UNCHANGED: the canonical wording is still recognised',
    stakes('Αν αυτή η απόφαση μείνει θολή για άλλον έναν χρόνο, τι πιστεύεις ότι θα σου κοστίσει περισσότερο;') === true);
  assert('UNCHANGED: the canonical wording is recognised even as a bare fragment (the original regex)',
    stakes('τι πιστεύεις ότι θα σου κοστίσει περισσότερο') === true);
  assert('MUST NOT CHANGE: a DECLARATIVE with the same words is AURA stating, not asking',
    stakes('Αυτό θα σου κοστίσει περισσότερο αν περιμένεις έναν ακόμα χρόνο.') === false);
  assert('MUST NOT CHANGE: a price question about a thing', stakes('Πόσο θα κοστίσει το εισιτήριο του χρόνου;') === false);
  assert('MUST NOT CHANGE: a cost question with no horizon of waiting', stakes('Θα κοστίσει περισσότερο η μετακόμιση;') === false);
  assert('MUST NOT CHANGE: a horizon with no cost word', stakes('Τι θα αλλάξει για έναν ακόμα χρόνο;') === false);
  assert('MUST NOT CHANGE: the cost word and the horizon in DIFFERENT sentences',
    stakes('Αυτό θα κοστίσει. Τι θα κάνεις για έναν ακόμα χρόνο;') === false);
  assert('MUST NOT CHANGE: unrelated question', stakes('Τι σε φέρνει εδώ;') === false);
  assert('MUST NOT CHANGE: empty / null / non-string do not throw',
    stakes('') === false && stakes(null) === false && stakes(undefined) === false && stakes(42) === false);
}

// ── 2. FRIEND (the confirmation question only) ───────────────────────────────────────────────────
if (friend) {
  assert('FRIEND, real wording: "Αυτό που θα έλεγες στον φίλο — το επιτρέπεις και στον εαυτό σου;"',
    friend('Αυτό που θα έλεγες στον φίλο — το επιτρέπεις και στον εαυτό σου;') === true);
  assert('FRIEND, without "και"', friend('Αυτό που θα έλεγες στον φίλο — το επιτρέπεις στον εαυτό σου;') === true);
  assert('FRIEND, "ο φίλος σου" as the subject', friend('Ό,τι θα έλεγε ο φίλος σου — το επιτρέπεις και στον εαυτό σου;') === true);
  assert('FRIEND, a Latin question mark closes the question as well',
    friend('Αυτό που θα έλεγες στον φίλο — το επιτρέπεις και στον εαυτό σου?') === true);
  assert('UNCHANGED: the canonical wording is recognised even as a bare fragment, no question mark (the original regex)',
    friend('αυτό που θα έλεγες στον φίλο σου είναι διαφορετικό από αυτό που επιτρέπεις στον εαυτό σου') === true);
  assert('UNCHANGED: the canonical confirmation wording is still recognised',
    friend('Αυτό που θα έλεγες στον φίλο σου είναι διαφορετικό από αυτό που επιτρέπεις στον εαυτό σου;') === true);
  assert('MUST NOT CHANGE: the OPEN first question is NOT the confirmation question',
    friend('Αν ένας φίλος σου έλεγε ακριβώς αυτά που μου είπες — τι θα του έλεγες;') === false);
  assert('MUST NOT CHANGE: the open question with the "ερχόταν" wording',
    friend('Αν ένας φίλος σου ερχόταν με αυτό — τι θα του έλεγες;') === false);
  assert('MUST NOT CHANGE: the self-permission wording with no friend in the sentence',
    friend('Το επιτρέπεις και στον εαυτό σου;') === false);
  assert('MUST NOT CHANGE: a friend asked about, no self-permission', friend('Ο φίλος σου ήξερε για αυτό;') === false);
  assert('MUST NOT CHANGE: "φιλοσοφία" is not a friend',
    friend('Τι θα έλεγες για τη φιλοσοφία σου — το επιτρέπεις και στον εαυτό σου;') === false);
  assert('MUST NOT CHANGE: a declarative', friend('Αυτό που θα έλεγες στον φίλο το επιτρέπεις και στον εαυτό σου.') === false);
  assert('MUST NOT CHANGE: empty / null / non-string do not throw',
    friend('') === false && friend(null) === false && friend(undefined) === false && friend(42) === false);
}

// ── 3. SHIFT CHECK — THE WIDENING WAS REMOVED THE SAME DAY (founder decision, 2026-10-01) ─────────────
// Why: for the open wording "Τι άλλαξε μέσα σου από πριν ως τώρα;" the real reply was a non-answer, so nothing
// changed in practice, and detectsAffirmativeShort accepts any short reply starting with "νιώθω", so
// "Νιώθω το ίδιο" would have counted as a yes. Small benefit, known risk: the latch is back to its original form.
if (shift) {
  assert('SHIFT, original wording is still recognised', shift('Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;') === true);
  assert('SHIFT, original wording with the "Πριν κλείσουμε —" lead-in',
    shift('Πριν κλείσουμε — νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;') === true);
  assert('SHIFT, REVERTED: the open variant "Τι άλλαξε μέσα σου από πριν ως τώρα;" is NOT recognised (known gap, deliberate)',
    shift('Τι άλλαξε μέσα σου από πριν ως τώρα;') === false);
  assert('MUST NOT CHANGE: the SECOND-step question is not the shift check (protects the two-step sequence)',
    shift('Με τι μπήκες εδώ... και με τι φεύγεις τώρα;') === false);
  assert('MUST NOT CHANGE: a change in the world', shift('Τι άλλαξε στην εταιρεία από πριν ως τώρα;') === false);
  assert('MUST NOT CHANGE: an unrelated question', shift('Τι σε κρατάει περισσότερο σε αυτό;') === false);
  assert('MUST NOT CHANGE: empty / null / non-string do not throw',
    shift('') === false && shift(null) === false && shift(undefined) === false && shift(42) === false);
  assert('the widening code is gone from the source (no "μεσα σου" fold in detectsShiftCheckAsked)',
    !/μεσα σου/.test(extract('detectsShiftCheckAsked')));
}

// ── 4. THE LATCH PATHS, as the code runs them (lines "shiftCheckConfirmed" / "friendPerspectiveConfirmed") ──
// Same order as generateResponse: the user's message is judged first (spontaneous, or short affirmative
// after an ask), and only then is AURA's own reply inspected for the question.
function runShift(exchanges) {
  let asked = false, confirmed = false;
  for (const ex of exchanges) {
    if (confirmed) break;
    if (ex.user && spont(ex.user)) confirmed = true;
    else if (asked && ex.user && affirm(ex.user)) confirmed = true;
    else if (ex.aura && shift(ex.aura)) asked = true;
  }
  return { asked, confirmed };
}
function runFriend(exchanges) {
  let asked = false, confirmed = false;
  for (const ex of exchanges) {
    if (confirmed) break;
    if (asked && ex.user && affirm(ex.user)) confirmed = true;
    else if (ex.aura && friend(ex.aura)) asked = true;
  }
  return { asked, confirmed };
}
if (shift && friend && affirm && spont) {
  assert('SHIFT FLOW, original: the old wording + "Ναι" confirms',
    runShift([{ aura: 'Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;' }, { user: 'Ναι' }]).confirmed === true);
  assert('SHIFT FLOW, original: the second-step question never arms the latch, so a later "Ναι" confirms nothing',
    runShift([{ aura: 'Με τι μπήκες εδώ... και με τι φεύγεις τώρα;' }, { user: 'Ναι' }]).confirmed === false);
  assert('SHIFT FLOW, reverted: the open variant never arms the latch, so "Νιώθω το ίδιο" confirms nothing (the risk that led to the removal)',
    runShift([{ aura: 'Τι άλλαξε μέσα σου από πριν ως τώρα;' }, { user: 'Νιώθω το ίδιο' }]).confirmed === false);

  const F2 = 'Αυτό που θα έλεγες στον φίλο — το επιτρέπεις και στον εαυτό σου;';
  const F1 = 'Αν ένας φίλος σου έλεγε ακριβώς αυτά που μου είπες — τι θα του έλεγες;';
  assert('FRIEND FLOW: a real reply to the OPEN question ("Ναι , γιατί όχι..?") does NOT confirm — the latch is not armed by it',
    (r => r.asked === false && r.confirmed === false)(runFriend([{ aura: F1 }, { user: 'Ναι , γιατί όχι..?' }])));
  assert('FRIEND FLOW: the real confirmation question is recognised and a real "Ναι" confirms',
    (r => r.asked === true && r.confirmed === true)(runFriend([{ aura: F1 }, { user: 'Καλή αρχή', aura: F2 }, { user: 'Ναι' }])));
  assert('FRIEND FLOW: a "Όχι" to the confirmation question does not confirm',
    runFriend([{ aura: F2 }, { user: 'Όχι' }]).confirmed === false);
}

// ── 5. KNOWN, PINNED CONSEQUENCES — documented, not fixed (out of scope) ──────────────────────────
if (shift && friend && affirm && spont) {
  assert('CLOSED 2026-10-01: after "…το επιτρέπεις και στον εαυτό σου;" a "Ναι" still confirms (the latch is unchanged) …',
    runFriend([{ aura: 'Αυτό που θα έλεγες στον φίλο — το επιτρέπεις και στον εαυτό σου;' }, { user: 'Ναι' }]).confirmed === true);
  assert('… but the ctx no longer claims the user said "yes, DIFFERENT" — for this wording "Ναι" means the SAME. It now says only that they answered "yes"',
    /The user just answered "yes" to the friend-perspective question/.test(CODE) &&
    !/just confirmed "yes, different"/.test(CODE));
  assert('the directive is unchanged: proceed to the Reflection Summary, no further exploratory question',
    /feeds directly into the Reflection Summary sequence now\. Do NOT ask another exploratory question first/.test(CODE));
}

// ── 6. ONLY THESE THREE CHANGED ───────────────────────────────────────────────────────────────────
if (step) {
  assert('detectsConcreteStep is NOT widened: "Έκτακτο συμβούλιο" is still not a step', step('Έκτακτο συμβούλιο') === false);
  assert('detectsConcreteStep is NOT widened: "Θα το ψάξω" is still not a step', step('Θα το ψάξω') === false);
  assert('detectsConcreteStep still reads its documented case', step('Θα το κάνω') === true);
}
assert('the Outcome Scale override is untouched',
  /if \(concreteStepStated\.current && !outcomeScaleAsked\.current && parseThreeBeatShift\(displayText\) !== null && !matchesClosingWord\(lastUserMsg\) && !declaresClosing\(lastUserMsg\)\)/.test(CODE));
assert('the three latch call sites are unchanged',
  CODE.includes('if (!stakesAsked.current && detectsStakesAsked(text)) {') &&
  CODE.includes('} else if (detectsShiftCheckAsked(text)) {') &&
  CODE.includes('} else if (detectsFriendPerspectiveAsked(text)) {'));
assert('the gatesIgnored counter still reads the strict detector OR the twin (not touched)',
  /stakes:\s*detectsStakesAsked\(_clean\)\s*\|\|\s*detectsGateQuestionsLoose\(_clean\)\.stakes/.test(CODE));
assert('detectsAffirmativeShort and detectsSpontaneousShiftRecognition are untouched (the confirmation side)',
  /return \/\^\(ναι\|ακριβώς\|σωστά\|όντως\|νιώθω\|νομίζω ναι\|έτσι νομίζω\|κάπως έτσι\)\/i\.test\(t\);/.test(CODE));
assert('the gate-reminder lines read the latches exactly as before',
  CODE.includes(`if (!stakesAsked.current) due.push('Stakes Question`) &&
  /shiftCheckCtx = deliverOnce\(shiftCheckConfirmed\.current/.test(CODE) &&
  /friendPerspectiveCtx = deliverOnce\(friendPerspectiveConfirmed\.current/.test(CODE));

// ── 7. LOCKSTEP WITH THE OBSERVATION TWIN — so the two cannot drift apart ─────────────────────────
// The twin (detectsGateQuestionsLoose) is deliberately BROADER (it also takes "αν δεν …", "στοιχίσει", and
// the open friend question), so the relation asserted is: whatever the latch recognises, the twin does too.
if (stakes && loose) {
  const corpus = [
    'Αν αυτό δεν ξεκαθαρίσει για έναν ακόμα χρόνο — τι πιστεύεις ότι θα κοστίσει περισσότερο;',
    'Αν αυτή η απόφαση μείνει θολή για άλλον έναν χρόνο, τι πιστεύεις ότι θα σου κοστίσει περισσότερο;',
    'Για έναν χρόνο, τι θα κοστίσει περισσότερο;',
    'Αυτό που θα έλεγες στον φίλο — το επιτρέπεις και στον εαυτό σου;',
    'Αυτό που θα έλεγες στον φίλο σου είναι διαφορετικό από αυτό που επιτρέπεις στον εαυτό σου;',
    'Τι άλλαξε μέσα σου από πριν ως τώρα;',
    'Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;',
    'Πόσο θα κοστίσει το εισιτήριο του χρόνου;', 'Με τι μπήκες εδώ... και με τι φεύγεις τώρα;', 'Τι σε φέρνει εδώ;',
  ];
  const bad = [];
  for (const t of corpus) {
    const L = loose(t);
    if (stakes(t) && !L.stakes) bad.push('stakes: ' + t);
  }
  assert('LOCKSTEP: nothing a latch recognises is missed by the twin (' + (bad.length ? bad.join(' | ') : 'ok') + ')', bad.length === 0);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
