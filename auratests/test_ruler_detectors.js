// ── Ο ΧΑΡΑΚΑΣ: ανιχνευτές που βλέπουν όσα γράφει πραγματικά η AURA ───────────
//
// WHY THIS FILE EXISTS. A measurement pass over four real sessions (2026-10) replayed AURA's actual
// sentences through the detectors the repo already has. Eight phrases that break a written rule were
// invisible to every detector, and four "did AURA ask X?" checks did not recognise the wording AURA
// really used. Until the detectors can see what the model really writes, any comparison between two
// prompts is scored with a ruler that does not reach — a shorter prompt would look "clean" for a
// reason that has nothing to do with the prompt.
//
// THE CONSTRAINT THAT SHAPES EVERYTHING BELOW: THIS CHANGES NOTHING AURA SAYS.
// Three of the "blind" detectors are not counters. They drive behaviour:
//   • detectsConcreteStep  → concreteStepStated → the hard override that REPLACES the reply with the
//     1–10 scale question (see the "ROOT-CAUSE FIX" block). Its own comment says widening `base`
//     "would change which steps gate the Clarity + Ownership Scale, so it is a separate decision to
//     be made from a specification". A hard override of this kind already caused real, documented
//     harm once (the REVERTED block right below it).
//   • detectsStakesAsked / detectsFriendPerspectiveAsked / detectsShiftCheckAsked → latches → the
//     reminder text injected into the model next turn.
// Widening any of them would change what the model is told, therefore what it says. So the strict
// detectors are LEFT EXACTLY AS THEY ARE (and pinned below, gaps included), and the ruler gets
// OBSERVATION-ONLY twins that nothing in the live path reads for a decision:
//   detectsGateQuestionsLoose   {stakes}   (the friend/shift flags and detectsStepAnswerLoose were REMOVED on
//                               2026-10-01: nothing read them — see test_latches_real_wording.js header)
// plus two passive widenings of detectors that were already observation-only:
//   detectOutputViolation  — EVALUATION now also sees four approvals it missed
//   detectsClaimAboutUser  — FORM 8, "υπάρχει μία τάση … το βλέπεις ως …"
//
// FIXTURES ARE SYNTHETIC with the same grammatical shape as what was measured. No user text from a
// real session is stored here; the AURA-side phrases are the ones the prompt itself prohibits or
// prescribes, which are product text, not a person's words.
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
    console.log('FAIL — ' + name + ' evaluates standalone: ' + err.message); failed++; return null;
  }
}

// detectOutputViolation calls two siblings; the other suites lift them the same way.
eval(extract('parseRoadMap'));
eval(extract('looksLikeAdviceCascade'));
const V = lift('detectOutputViolation');
const C = lift('detectsClaimAboutUser');
const L = lift('detectsGateQuestionsLoose');
const strictStakes = lift('detectsStakesAsked');
const strictFriend = lift('detectsFriendPerspectiveAsked');
const strictShift = lift('detectsShiftCheckAsked');
const strictStep = lift('detectsConcreteStep');

// ── 1. EVALUATION sees the approvals the prompt itself forbids (UNIVERSAL NO-EVALUATION) ──────────
if (V) {
  assert('REAL SHAPE: "Καλή αρχή" said about the user\'s own plan — named by the rule, was invisible',
    V('Αυτή η ανάγκη είναι αληθινή. Αυτό είναι καλή αρχή για ιδέα.', {}) === 'EVALUATION');
  assert('REAL SHAPE: "Χαίρομαι που πήγε καλά" — AURA approving an outcome',
    V('Εντάξει. Χαίρομαι που πήγε καλά.', {}) === 'EVALUATION');
  assert('REAL SHAPE: "δεν είναι αίσθηση μόνο — είναι πραγματικό" — AURA ruling on whether a feeling is real',
    V('Αυτό δεν είναι αίσθηση μόνο — είναι πραγματικό.', {}) === 'EVALUATION');
  assert('REAL SHAPE: "Δύο ώρες τη μέρα είναι αρκετές για να ξεκινήσεις" — AURA ruling the plan sufficient',
    V('Δύο ώρες τη μέρα είναι αρκετές για να ξεκινήσεις.', {}) === 'EVALUATION');
  assert('the evaluation is caught INSIDE a longer reply too, not only as the whole text',
    V('Σημείωσα. Τρεις μέρες την εβδομάδα είναι αρκετές για να το δοκιμάσεις. Τι θα κάνεις πρώτα;', {}) === 'EVALUATION');

  // NOT OVER-SENSITIVE — the phrases that sit closest to each one above and are legitimate.
  assert('NOT FLAGGED: the user\'s own claim handed back with attribution (Mirror Rule)',
    V('Είπες ότι δύο ώρες τη μέρα είναι αρκετές για να ξεκινήσεις.', {}) === null);
  assert('NOT FLAGGED: a question asking about sufficiency — AURA asking, not ruling',
    V('Δύο ώρες τη μέρα — είναι αρκετές για να ξεκινήσεις;', {}) === null);
  assert('NOT FLAGGED: the negation is a limit the person reported, not an approval',
    V('Δεν είναι αρκετές οι ώρες που έχεις, είπες.', {}) === null);
  assert('NOT FLAGGED: the user\'s words printed back inside « »',
    V('Έγραψες «καλή αρχή» και μετά σταμάτησες. Τι ακολούθησε;', {}) === null);
  assert('NOT FLAGGED: "αρχή" with no approving word',
    V('Η αρχή του project ήταν πριν από δύο χρόνια.', {}) === null);
  assert('NOT FLAGGED: "Χαίρομαι" without the outcome-approval clause',
    V('Χαίρομαι που ήρθες.', {}) === null);
  assert('NOT FLAGGED: "αίσθηση" and "πραγματικό" in a question',
    V('Είναι αίσθηση ή κάτι που έχει συμβεί πραγματικά;', {}) === null);
  assert('EXISTING BEHAVIOUR UNCHANGED: the original evaluation phrase still reports EVALUATION',
    V('Καλή επιλογή αυτό που σκέφτεσαι.', {}) === 'EVALUATION');
  assert('EXISTING BEHAVIOUR UNCHANGED: an imperative is still ADVICE',
    V('Κατέβασε την εφαρμογή. Ξεκίνα από εκεί.', {}) === 'ADVICE');
  assert('EXISTING BEHAVIOUR UNCHANGED: a plain question is still null',
    V('Τι σε εμποδίζει να το κάνεις αύριο;', {}) === null);
}

// ── 2. FORM 8 — a tendency named in AURA's own words ─────────────────────────────────────────────
if (C) {
  assert('REAL SHAPE: "Υπάρχει μία τάση: … το βλέπεις ως παγίδα" — a label in AURA\'s words, unattributed',
    C('Εδώ υπάρχει μία τάση: την πρόταση την βλέπεις ως παγίδα.') === true);
  assert('a "μοτίβο" named the same way is the same construction',
    C('Υπάρχει ένα μοτίβο: το θεωρείς πάντα απειλή.') === true);
  assert('NOT FLAGGED: a tendency in the world, no second-person verb',
    C('Υπάρχει μία τάση στην αγορά να ανεβαίνουν οι τιμές.') === false);
  assert('NOT FLAGGED: AURA asking whether the person sees one',
    C('Υπάρχει μία τάση που βλέπεις εσύ σε αυτό;') === false);
  assert('NOT FLAGGED: the person\'s own words printed back in « »',
    C('«υπάρχει μία τάση να το βλέπω ως παγίδα» — αυτό έγραψες.') === false);
  assert('NOT FLAGGED: a different sentence that merely contains "βλέπεις"',
    C('Βλέπεις ότι ο χρόνος σου είναι περιορισμένος.') === false);
  assert('EXISTING BEHAVIOUR UNCHANGED: FORM 7 still flags knowledge asserted',
    C('Κάνεις κάτι, αλλά ξέρεις ότι δεν αγγίζει τη ρίζα.') === true);
}

// ── 3. THE GATE-QUESTION TWIN: sees the wording AURA really used ──────────────────────────────────
if (L) {
  assert('returns {stakes:false} for empty or non-string input',
    JSON.stringify(L('')) === '{"stakes":false}' && JSON.stringify(L(null)) === '{"stakes":false}' &&
    JSON.stringify(L(42)) === '{"stakes":false}');

  // STAKES
  assert('STAKES, real wording: "τι πιστεύεις ότι θα κοστίσει περισσότερο … για έναν ακόμα χρόνο;"',
    L('Αν αυτό δεν ξεκαθαρίσει για έναν ακόμα χρόνο — τι πιστεύεις ότι θα κοστίσει περισσότερο;').stakes === true);
  assert('STAKES, canonical wording from the prompt is still seen',
    L('Αν αυτή η απόφαση μείνει θολή για άλλον έναν χρόνο, τι πιστεύεις ότι θα σου κοστίσει περισσότερο;').stakes === true);
  assert('STAKES: NOT a declarative',
    L('Αυτό θα σου κοστίσει περισσότερο αν περιμένεις έναν ακόμα χρόνο.').stakes === false);
  assert('STAKES: NOT a price question about a thing',
    L('Πόσο θα κοστίσει το εισιτήριο του χρόνου;').stakes === false);
  assert('STAKES: NOT a cost question with no horizon of waiting',
    L('Θα κοστίσει περισσότερο η μετακόμιση;').stakes === false);

}

// ── 4b. EVERY ALTERNATIVE AND EVERY BOUND HAS ITS OWN FIXTURE ─────────────────────────────────────
// Added after mutation testing: a pattern with seven alternatives and one fixture proves one of them.
if (V) {
  assert('EVAL: "όμορφα" is the second outcome word of "Χαίρομαι που …"', V('Χαίρομαι που βγήκε όμορφα.', {}) === 'EVALUATION');
  assert('EVAL: "εντύπωση" and "αληθινό" are the second noun and second verdict word',
    V('Αυτό δεν είναι εντύπωση μόνο — είναι αληθινό.', {}) === 'EVALUATION');
  assert('EVAL: "μόνο" BEFORE the noun is the same construction',
    V('Δεν είναι μόνο αίσθηση, είναι πραγματικό.', {}) === 'EVALUATION');
  assert('EVAL QUOTES: the same words inside curly quotes “…” are the person speaking',
    V('Έγραψες “καλή αρχή” και μετά σταμάτησες.', {}) === null);
  assert('EVAL QUOTES: …and inside straight quotes',
    V('Έγραψες "καλή αρχή" και μετά σταμάτησες.', {}) === null);
  assert('EVAL BOUND: "είναι πραγματικό" far from "δεν είναι αίσθηση" is not the construction',
    V('Αυτό δεν είναι αίσθηση μόνο, και σκέφτηκες πολύ ότι είναι πραγματικό.', {}) === null);
  assert('EVAL BOUND: "Χαίρομαι που" far from the outcome word is not the construction',
    V('Χαίρομαι που ήρθες σήμερα εδώ και μιλήσαμε για τόσα πολλά πράγματα, καλά.', {}) === null);
  for (const lead of ['Είπες ότι', 'Είπατε ότι', 'Λες ότι', 'Λέτε ότι', 'Ανέφερες ότι', 'Έγραψες ότι', 'Έχεις πει ότι']) {
    assert('EVAL ATTRIBUTION: "' + lead + ' …" is the Mirror Rule, not a ruling',
      V(lead + ' δύο ώρες τη μέρα είναι αρκετές για να ξεκινήσεις.', {}) === null);
  }
  assert('EVAL: "για το πρώτο βήμα" — the object after "για" need not be "να"',
    V('Δύο ώρες είναι αρκετές για το πρώτο βήμα.', {}) === 'EVALUATION');
  assert('EVAL NEGATION: "Δεν είναι αρκετές για να ξεκινήσεις." is a limit, not an approval',
    V('Δεν είναι αρκετές για να ξεκινήσεις.', {}) === null);
  assert('EVAL SENTENCES: a "." ends a sentence, so a later question does not excuse an earlier ruling',
    V('Δύο ώρες είναι αρκετές για να ξεκινήσεις. Τι λες;', {}) === 'EVALUATION');
  assert('EVAL SENTENCES: so does "!"', V('Δύο ώρες είναι αρκετές για να ξεκινήσεις! Τι λες;', {}) === 'EVALUATION');
  assert('EVAL SENTENCES: so does the ano teleia', V('Δύο ώρες είναι αρκετές για να ξεκινήσεις· τι λες;', {}) === 'EVALUATION');
  assert('EVAL SENTENCES: a Greek question mark ends the question, and it stays excluded',
    V('Δύο ώρες τη μέρα — είναι αρκετές για να ξεκινήσεις; Και μετά τι θα κάνεις.', {}) === null);
  assert('EVAL SENTENCES: …and so does a Latin one',
    V('Δύο ώρες τη μέρα — είναι αρκετές για να ξεκινήσεις? Και μετά τι θα κάνεις.', {}) === null);
}
if (C) {
  assert('FORM 8: "πρότυπο" is a third name for the same label',
    C('Υπάρχει ένα πρότυπο: το βλέπεις ως απειλή.') === true);
  assert('FORM 8: "νιώθεις" as the second-person verb', C('Υπάρχει μία τάση: νιώθεις ότι δεν σε ακούν.') === true);
  assert('FORM 8: "φοβάσαι" as the second-person verb', C('Υπάρχει μία τάση: φοβάσαι κάθε αλλαγή.') === true);
  assert('FORM 8 BOUND: a second-person verb a whole paragraph away is not the construction',
    C('Υπάρχει μία τάση ' + 'ααα '.repeat(30) + 'βλέπεις') === false);
}
if (L) {
  assert('STAKES: "στοιχίσει" is a cost word too',
    L('Αν αυτό παραμείνει έτσι για έναν χρόνο, τι θα σου στοιχίσει περισσότερο;').stakes === true);
  assert('STAKES: "έναν χρόνο" without "ακόμα"', L('Για έναν χρόνο, τι θα κοστίσει περισσότερο;').stakes === true);
  assert('STAKES: "μείνει θολό" is a horizon by itself', L('Αν αυτό μείνει θολό, τι θα σου κοστίσει περισσότερο;').stakes === true);
  assert('STAKES: "αν δεν …" is a horizon by itself', L('Αν δεν αλλάξει κάτι, τι θα κοστίσει περισσότερο;').stakes === true);
  assert('STAKES: "αν περιμένεις" is a horizon by itself', L('Αν περιμένεις, τι θα κοστίσει περισσότερο;').stakes === true);
  assert('STAKES: a Latin question mark closes the question as well',
    L('Αν δεν αλλάξει κάτι, τι θα κοστίσει περισσότερο?').stakes === true);
  assert('STAKES: a horizon with NO cost word is not the stakes question',
    L('Αν περιμένεις έναν ακόμα χρόνο, τι θα αλλάξει;').stakes === false);
  assert('STAKES: the cost word and the horizon must sit in the SAME question',
    L('Αυτό θα κοστίσει. Τι θα κάνεις αν περιμένεις;').stakes === false);
}

// ── 5. THE STRICT DETECTORS ARE UNTOUCHED — gaps included, on purpose ─────────────────────────────
// Each assertion below pins a KNOWN, DELIBERATE blind spot. If one of them starts failing, someone
// widened a latch that drives the injected reminder or the Outcome Scale override: that is a change
// to what AURA says, a decision for the founder, and the failure is meant to make it conscious.
// UPDATE 2026-10-01: the founder decided to widen the stakes, friend and shift latches; the SHIFT widening was
// removed the same day (small benefit, a known false-confirmation risk). Stakes and friend gaps are closed below.
// The shift latch and detectsConcreteStep stay pinned gaps.
if (strictStakes && strictFriend && strictShift && strictStep) {
  assert('strict stakes latch: canonical wording is seen',
    strictStakes('Αν αυτή η απόφαση μείνει θολή για άλλον έναν χρόνο, τι πιστεύεις ότι θα σου κοστίσει περισσότερο;') === true);
  assert('FORMER KNOWN GAP, closed 2026-10-01 by founder decision: the stakes latch now reads "θα κοστίσει περισσότερο" (no "σου") — see test_latches_real_wording.js',
    strictStakes('Αν αυτό δεν ξεκαθαρίσει για έναν ακόμα χρόνο — τι πιστεύεις ότι θα κοστίσει περισσότερο;') === true);
  assert('FORMER KNOWN GAP, closed 2026-10-01 by founder decision: the friend latch now reads "το επιτρέπεις και στον εαυτό σου"',
    strictFriend('Αυτό που θα έλεγες στον φίλο — το επιτρέπεις και στον εαυτό σου;') === true);
  assert('KNOWN GAP, deliberate again (the widening was REMOVED 2026-10-01, founder decision): the shift latch does not read "Τι άλλαξε μέσα σου από πριν ως τώρα;"',
    strictShift('Τι άλλαξε μέσα σου από πριν ως τώρα;') === false);
  assert('the shift latch still reads its original wording',
    strictShift('Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;') === true);
  assert('KNOWN GAP, deliberate: the live step detector still has no reading for a bare noun phrase',
    strictStep('Έκτακτο συμβούλιο') === false);
  assert('KNOWN GAP, deliberate: …nor for "Θα το ψάξω"', strictStep('Θα το ψάξω') === false);
  assert('the live step detector still reads its own documented case',
    strictStep('Θα το κάνω') === true);
}

// ── 6. WIRING — the twins decide nothing ───────────────────────────────────────────────────────────
const gateCmpAt = CODE.indexOf('const _snap = gatesDueSnapshot.current');
const gateCmp = CODE.slice(Math.max(0, gateCmpAt - 200), gateCmpAt + 700);
assert('NON-VACUITY: the gatesDue/gatesIgnored comparison site is findable', gateCmpAt > 0);
assert('the delivered-stakes counter reads the strict detector OR the twin, so a real wording is no longer "ignored"',
  /stakes:\s*detectsStakesAsked\(_clean\)\s*\|\|\s*detectsGateQuestionsLoose\(_clean\)\.stakes/.test(gateCmp));
const latchAt = CODE.indexOf('if (!stakesAsked.current && detectsStakesAsked(text))');
assert('NON-VACUITY: the stakes latch is findable', latchAt > 0);
assert('the stakes LATCH still uses only the strict detector',
  !/Loose/.test(CODE.slice(latchAt, latchAt + 160)));
const shiftLatchAt = CODE.indexOf('} else if (detectsShiftCheckAsked(text)) {');
const friendLatchAt = CODE.indexOf('} else if (detectsFriendPerspectiveAsked(text)) {');
assert('NON-VACUITY: the shift and friend latches are findable', shiftLatchAt > 0 && friendLatchAt > 0);
assert('the shift and friend LATCHES still use only the strict detectors',
  !/Loose/.test(CODE.slice(shiftLatchAt, shiftLatchAt + 140)) && !/Loose/.test(CODE.slice(friendLatchAt, friendLatchAt + 140)));
const gateAt = CODE.indexOf('if (concreteStepStated.current && !outcomeScaleAsked.current && parseThreeBeatShift(displayText) !== null');
assert('NON-VACUITY: the Outcome Scale override is findable', gateAt > 0);
assert('the Outcome Scale override is untouched — it keeps its own closing guards',
  /!matchesClosingWord\(lastUserMsg\) && !declaresClosing\(lastUserMsg\)/.test(CODE.slice(gateAt, gateAt + 260)));
assert('the step twin and the friend/shift flags of the gate twin were REMOVED (nothing read them)',
  !/detectsStepAnswerLoose/.test(CODE) && !/out\.friend|out\.shift/.test(CODE));
assert('the gate-question twin is not read by any reminder or context builder',
  !/(Ctx|Suffix|dynamicSuffix)[^\n]*detectsGateQuestionsLoose/.test(CODE));
assert('the twin counts nothing that reaches a reply: no assignment to displayText on its verdict',
  !/detectsGateQuestionsLoose\([^)]*\)[^\n]*displayText\s*=/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
