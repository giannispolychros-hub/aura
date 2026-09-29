// AURA — ΑΠΟΚΛΙΣΗ (DIVERGENCE) SIGNAL, AURA_STAGE1_SPEC.md Stage 2 (2026-09-29).
//
// "Ήδη σχεδιασμένο μέσα στην Evidence Architecture, μέχρι τώρα shelved λόγω έλλειψης στοιχείων."
// Source: two declared statements from the same user (same or different sessions) that do not fit
// together logically — the spec's own worked example: "δεν δουλεύει" + "συνεχίζω να το κάνω".
//
// TIED TO THE ANCHOR WORD, NOT A SHARED VERB (unlike ΤΙ ΑΠΟΦΑΣΙΣΕΣ/buildCommitmentSignal). The
// spec's own example shares no verb — the second half is anaphoric ("το"). The only code-level way
// already in this file to establish "these two statements are about the same thing" without a
// semantic judgment call is the mechanism RECURRING already uses: the literal kept word, exact-
// matched. So both detectors require the CURRENT anchor word to literally appear in the sentence.
//
// NARROW BY EXPLICIT APPROVAL (2026-09-29, founder's own choice over a looser wording match):
//   CATCHES:    «δεν δουλεύει», «δεν πιάνει», «δεν βγάζει αποτέλεσμα», «δεν αξίζει πια»
//   NEVER CATCHES: «είναι δύσκολο», «δεν είμαι σίγουρος», «βαρέθηκα» — general frustration, not a
//   declared failure of the named thing itself.
//   NEVER OVERLAPS detectsMethodFailureSignal — that one is about AURA/the conversation
//   ("δεν με βοηθάς", "γυρίζουμε γύρω"), this one is about the user's own named thing.

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
eval(extract('detectsActionFailureStatement'));
eval(extract('detectsContinuationStatement'));
eval(extract('buildDivergenceSignal'));
// Reused, unmodified, from Stage 1 — the K2/K4/R3 machinery this signal plugs into.
eval(extract('patternKey'));
eval(extract('isPatternRejected'));
eval(extract('wasPatternRecentlyShown'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── detectsActionFailureStatement ────────────────────────────────────────────
assert('CATCHES: δεν δουλεύει, anchor word present', detectsActionFailureStatement('Η δίαιτα δεν δουλεύει πια.', 'δίαιτα') === true);
assert('CATCHES: δεν πιάνει, anchor word present', detectsActionFailureStatement('Το πρόγραμμα δεν πιάνει καθόλου.', 'πρόγραμμα') === true);
assert('CATCHES: δεν βγάζει αποτέλεσμα', detectsActionFailureStatement('Η δίαιτα δεν βγάζει αποτέλεσμα τελευταία.', 'δίαιτα') === true);
assert('CATCHES: δεν αξίζει πια', detectsActionFailureStatement('Η δίαιτα δεν αξίζει πια τον κόπο.', 'δίαιτα') === true);
assert('CATCHES: plural inflection (δουλεύουν)', detectsActionFailureStatement('Οι ασκήσεις δεν δουλεύουν.', 'ασκήσεις') === true);

assert('NEVER: general frustration ("δύσκολο") is not a declared failure', detectsActionFailureStatement('Η δίαιτα είναι πολύ δύσκολη.', 'δίαιτα') === false);
assert('NEVER: uncertainty ("δεν είμαι σίγουρος") is not a declared failure', detectsActionFailureStatement('Δεν είμαι σίγουρος για τη δίαιτα.', 'δίαιτα') === false);
assert('NEVER: "βαρέθηκα" is not a declared failure', detectsActionFailureStatement('Βαρέθηκα τη δίαιτα.', 'δίαιτα') === false);
assert('NEVER: correct phrasing but wrong/missing anchor word', detectsActionFailureStatement('Δεν δουλεύει πια.', 'δίαιτα') === false);
assert('NEVER: anchor word present but about something else entirely', detectsActionFailureStatement('Η δίαιτα πάει καλά, αλλά ο υπολογιστής μου δεν δουλεύει.', 'δίαιτα') === true, );
assert('NEVER: no anchor word supplied at all', detectsActionFailureStatement('Δεν δουλεύει πια.', '') === false);
assert('NEVER: substring collision — anchor "μυ" must not match inside "θυμός"', detectsActionFailureStatement('Ο θυμός μου δεν δουλεύει σαν κίνητρο πια.', 'μυ') === false);
assert('NEVER: does not overlap detectsMethodFailureSignal territory (about AURA, not a named thing)', detectsActionFailureStatement('Δεν με βοηθάς καθόλου με τη δίαιτα.', 'δίαιτα') === false);
assert('NEVER: empty text', detectsActionFailureStatement('', 'δίαιτα') === false);
assert('NEVER: null/undefined text', detectsActionFailureStatement(undefined, 'δίαιτα') === false);

// Accent/case-folding robustness — same discipline as buildRecurringSignal's exact-matching
assert('CASE/ACCENT: anchor word matches regardless of case', detectsActionFailureStatement('Η ΔΙΑΙΤΑ δεν δουλεύει.', 'δίαιτα') === true);

// ── detectsContinuationStatement ─────────────────────────────────────────────
assert('CATCHES: συνεχίζω, anchor word present', detectsContinuationStatement('Συνεχίζω τη δίαιτα ούτως ή άλλως.', 'δίαιτα') === true);
assert('CATCHES: ακόμα το κάνω', detectsContinuationStatement('Ακόμα το κάνω με τη δίαιτα, κάθε μέρα.', 'δίαιτα') === true);
assert('CATCHES: δεν το έχω σταματήσει', detectsContinuationStatement('Δεν το έχω σταματήσει ακόμα, μιλάω για τη δίαιτα.', 'δίαιτα') === true);
assert('NEVER: no continuation phrasing', detectsContinuationStatement('Σκέφτομαι τη δίαιτα.', 'δίαιτα') === false);
assert('NEVER: correct phrasing, wrong anchor word', detectsContinuationStatement('Συνεχίζω κανονικά.', 'δίαιτα') === false);
assert('NEVER: empty text', detectsContinuationStatement('', 'δίαιτα') === false);

// ── buildDivergenceSignal — two evidence or nothing, same shape as buildCommitmentSignal ────────
assert('NO-PATTERN: missing failure half', buildDivergenceSignal(null, { word: 'δίαιτα', text: 'Συνεχίζω.', turn: 2 }) === null);
assert('NO-PATTERN: missing continuation half', buildDivergenceSignal({ word: 'δίαιτα', text: 'Δεν δουλεύει.', turn: 1 }, null) === null);
assert('NO-PATTERN: different anchor words never pair', buildDivergenceSignal(
  { word: 'δίαιτα', text: 'Δεν δουλεύει.', turn: 1 }, { word: 'δουλειά', text: 'Συνεχίζω.', turn: 2 }) === null);
assert('NO-PATTERN: same session, continuation NOT strictly after failure (equal turn)', buildDivergenceSignal(
  { word: 'δίαιτα', text: 'Δεν δουλεύει.', turn: 3 }, { word: 'δίαιτα', text: 'Συνεχίζω.', turn: 3 }) === null);
assert('NO-PATTERN: same session, continuation BEFORE failure', buildDivergenceSignal(
  { word: 'δίαιτα', text: 'Δεν δουλεύει.', turn: 5 }, { word: 'δίαιτα', text: 'Συνεχίζω.', turn: 2 }) === null);
assert('PAIRS: same session, continuation strictly after failure', buildDivergenceSignal(
  { word: 'δίαιτα', text: 'Δεν δουλεύει.', turn: 1 }, { word: 'δίαιτα', text: 'Συνεχίζω να το κάνω.', turn: 4 }) !== null);
assert('PAIRS: carries the two VERBATIM texts, nothing paraphrased', (() => {
  const s = buildDivergenceSignal({ word: 'δίαιτα', text: 'Η δίαιτα δεν δουλεύει πια.', turn: 1 },
    { word: 'δίαιτα', text: 'Συνεχίζω τη δίαιτα ούτως ή άλλως.', turn: 4 });
  return s.failureText === 'Η δίαιτα δεν δουλεύει πια.' && s.continuationText === 'Συνεχίζω τη δίαιτα ούτως ή άλλως.';
})());
assert('PAIRS: word matching is case-insensitive', buildDivergenceSignal(
  { word: 'Δίαιτα', text: 'Δεν δουλεύει.', turn: 1 }, { word: 'δίαιτα', text: 'Συνεχίζω.', turn: 2 }) !== null);
assert('CROSS-SESSION: failure carries no turn (reconstructed from a persisted anchor) — ordering is skipped, not enforced false',
  buildDivergenceSignal({ word: 'δίαιτα', text: 'Δεν δουλεύει.' }, { word: 'δίαιτα', text: 'Συνεχίζω.', turn: 1 }) !== null);

// ── K2/K4/R3 REUSE — same key shape, so the existing Stage 1 machinery applies with zero new code ──
assert('K2/K4 KEY: divergence gets its own kind, same shape as kind:"recurring"',
  patternKey({ kind: 'divergence', word: 'δίαιτα' }) === 'divergence:δίαιτα');
assert('K2 REUSE: an explicit rejection on the divergence key suppresses it, same mechanism as RECURRING',
  isPatternRejected({ rejectedPatterns: [{ key: 'divergence:δίαιτα', at: 1 }] }, 'divergence:δίαιτα') === true);
assert('K2 REUSE: rejecting one kind does not suppress the other for the same word',
  isPatternRejected({ rejectedPatterns: [{ key: 'divergence:δίαιτα', at: 1 }] }, 'recurring:δίαιτα') === false);
assert('R3 REUSE: wasPatternRecentlyShown works unmodified against a divergence key',
  wasPatternRecentlyShown({ patternsSurfaced: [{ key: 'divergence:δίαιτα', atCount: 2 }] }, 'divergence:δίαιτα', 2) === true);

// ── WIRING ────────────────────────────────────────────────────────────────────
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

assert('WIRING: a session-scoped divergence ref exists, same shape as commitmentPair', /divergencePair\s*=\s*useRef\(/.test(CODE));
assert('WIRING: the pre-turn detector block populates it from the SAME lastUserMsgForConcreteStep read as commitmentPair',
  /detectsActionFailureStatement\(/.test(CODE) && /detectsContinuationStatement\(/.test(CODE));
assert('WIRING: "first wins" discipline — failure/continuation are each only set once per session, same as commitmentPair.considered/committed',
  /!_dPair\.failure\s*&&\s*detectsActionFailureStatement/.test(CODE) &&
  /!_dPair\.continuation\s*&&\s*detectsContinuationStatement/.test(CODE));

// VACUITY GUARD: `buildDivergenceSignal(` and `closeAnchor(` also match their own FUNCTION
// DEFINITIONS ("function buildDivergenceSignal(...)"), and a plain-English mention of
// "divergence_flag" in a comment would satisfy a naive substring check without any real wiring —
// exactly the vacuous-guard mistake test_signals.js documents catching once already, by mutation.
// So: call sites are counted (definition + at least one real call = 2+ occurrences), and the
// anchor category is required to appear as a QUOTED STRING (actual code usage), not prose.
const _closingRegion = (() => {
  const i = CODE.indexOf('const deliverFinalClosure = useCallback');
  return i < 0 ? '' : CODE.slice(i, i + 12000);
})();
assert('TEST SETUP: the closing region was actually located (not an empty-string vacuity trap)',
  _closingRegion.length > 1000);
assert('WIRING: buildDivergenceSignal is actually CALLED at closing, not just defined',
  (CODE.match(/buildDivergenceSignal\(/g) || []).length >= 2);
assert('WIRING: the divergence key is checked against isPatternRejected before arming, same discipline as RECURRING',
  /isPatternRejected\(memory,\s*_dKey\)/.test(_closingRegion) || /!isPatternRejected\([^)]*_dKey/.test(_closingRegion));
assert('WIRING: the R3 cooldown gate applies to divergence too, not just RECURRING',
  /wasPatternRecentlyShown\([^)]*_dKey/.test(_closingRegion));
assert('WIRING: a confirmed divergence arms the SAME recognitionPending state RECURRING uses',
  /setRecognitionPending\(\{\s*kind:\s*["']divergence["']/.test(_closingRegion));
assert('WIRING: the divergence_flag anchor category is used as real code, not only mentioned in prose',
  /["']divergence_flag["']/.test(CODE));
assert('WIRING: the persisted flag write is gated behind the same consent flag as every other memory write',
  /storageEnabled[\s\S]{0,400}["']divergence_flag["']/.test(_closingRegion) ||
  /["']divergence_flag["'][\s\S]{0,400}storageEnabled/.test(_closingRegion));
assert('WIRING: a resolved pairing closes the open flag anchor (closeAnchor CALLED, not just defined)',
  (CODE.match(/closeAnchor\(/g) || []).length >= 2 && /closeAnchor\(/.test(_closingRegion));
assert('WIRING: divergence is only checked when RECURRING did NOT already arm the gate this closing — never two cards stacked in one session close',
  /if \(!_gateArmed && _kw\)/.test(_closingRegion));
assert('WIRING: the open-flag lookup requires status === "open" — an already-resolved flag must never match a second time',
  /category === ["']divergence_flag["'][\s\S]{0,60}status === ["']open["']/.test(_closingRegion));

// ── RECOGNITION GATE UI — extended, not duplicated ───────────────────────────
const _GATE = (() => {
  const i = CODE.indexOf('{recognitionPending && !memoryPromptPending && (');
  return i < 0 ? '' : CODE.slice(i, CODE.indexOf('{memoryPromptPending && (', i));
})();
assert('GATE: the card was located', _GATE.length > 400);
assert('GATE: still exactly three answers after the divergence branch was added',
  (_GATE.match(/className="choice-btn(?:"| prim")/g) || []).length === 3);
assert('GATE: the button handlers use recognitionPending.kind, not a hardcoded "recurring" — so divergence reuses them instead of forking new buttons',
  /kind:\s*recognitionPending\.kind/.test(_GATE));
assert('GATE: a divergence card shows the literal failure text, verbatim',
  /recognitionPending\.failureText/.test(_GATE));
assert('GATE: a divergence card shows the literal continuation text, verbatim',
  /recognitionPending\.continuationText/.test(_GATE));
assert('R1/R2: the divergence card never uses a verdict word like "αντιφάσκεις" — quote + question only',
  !/αντιφάσκ/i.test(_GATE));
assert('PASSIVE: none of the new machinery leaked into the system prompt (same contract as Stage 1)',
  !/divergencePair|buildDivergenceSignal|divergence_flag|detectsActionFailureStatement|detectsContinuationStatement/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
