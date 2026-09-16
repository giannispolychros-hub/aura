// AURA — MATERIAL EVIDENCE DETECTORS (structural, observation-only)
//
// WHY THIS FILE EXISTS. Today's forensic pass established, with code paths, that AURA judges
// "is there enough material yet?" in sixteen separate prompt-only places and zero code places:
// every code-side check (parseRoadMap γρ.1774, parseThreeBeatShift γρ.1784) validates the SHAPE OF
// AURA'S OWN OUTPUT, never the user's material, and a grep for any detector of ROAD DISCOVERY's
// three criteria returns 0. The prompt itself names the consequence at γρ.159: "a threshold stated
// only as 'when the material suffices' is never reached ... the map keeps receding by one turn
// indefinitely". A real transcript showed exactly that — a 41-year-old teacher stated a €3.000
// target, four dependants, a hard time ceiling and a legal blocker, and no map was ever produced.
//
// WHAT THIS IS NOT. These three detectors do NOT decide anything, are NOT wired to any gate, and
// do NOT measure the three criteria. They expose counted facts as context, in the same spirit as
// the existing observation-only blocks. The assertions below therefore test two things with equal
// weight: that the detectors FIRE CORRECTLY, and that the ctx they feed STAYS NON-BINDING. If a
// future change turns this into a gate, the "non-binding" assertions fail first, on purpose.
//
// EVERY NEW WRITE SITE / DETECTOR ADDED TO THIS FAMILY MUST BE REGISTERED HERE.
//
// STRUCTURAL PARSING, NOT LEXICAL: same convention as test_entry_flow.js / test_dead_paths.js —
// plain string/indexOf over the raw source, no AST parser in this environment. The PROMPT/CODE
// split is copied from those files exactly, so nothing here can match text inside the prompt.

const fs = require('fs');
const path = require('path');

const raw = (() => {
  const candidates = ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx'];
  for (const c of candidates) {
    const p = path.join(__dirname, c);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _promptEnd = raw.indexOf('`;', _s);
if (_promptEnd < 0) throw new Error('Could not find the prompt terminator — file shape changed.');
const CODE = raw.slice(0, _i) + raw.slice(_promptEnd);
assert('Structural sanity: CODE region is substantial', CODE.length > 100000);

// ── 1. THE THREE DETECTORS EXIST AND ARE CALLED ──
const NAMES = ['detectsStatedMoneyFigure', 'detectsExplicitConstraint', 'detectsPermissionUncertainty'];
for (const n of NAMES) {
  assert(`${n} is DEFINED in src/App.jsx`, (CODE.match(new RegExp('function ' + n + '\\(', 'g')) || []).length === 1);
  const calls = (CODE.match(new RegExp(n + '\\(', 'g')) || []).length - 1;
  assert(`${n} is CALLED at least once (defined-but-unused is the same failure)`, calls >= 1);
}

// ── 2. BEHAVIOUR — the real transcript that motivated this file ──
function extract(name) { const s = raw.indexOf('function ' + name + '('); return raw.slice(s, raw.indexOf('\n}', s) + 2); }
// Guarded on purpose: before the detectors exist this file must still report every assertion
// cleanly rather than dying on a ReferenceError halfway through — a test that throws tells you
// less than a test that fails.
const ready = NAMES.every(n => raw.indexOf('function ' + n + '(') >= 0);
// Each eval is top-level on purpose: `NAMES.forEach(n => eval(...))` would define the functions
// inside the arrow's own scope, where nothing below can see them — a mistake already made once in
// this codebase's tooling.
if (ready) { eval(extract(NAMES[0])); eval(extract(NAMES[1])); eval(extract(NAMES[2])); }
assert('All three detectors extracted and evaluable', ready);

if (ready) {
  // Verbatim fragments from the real session (41-year-old nurse-turned-special-education teacher).
  const MONEY_POS = [
    ['θα μου έφερνε στο σπίτι 3.000€', 3000],
    ['στα 45 μου να μπορώ να βγάζω 3.000€ το μήνα', 3000],
    ['το εισόδιο μου εκπαιδευτικού πολυτέκνου δηλαδή στα 1200-1300€', 1200],
    ['ο μισθός είναι γύρω στα 1.150 ευρώ', 1150],
  ];
  for (const [t, v] of MONEY_POS) {
    const r = detectsStatedMoneyFigure(t);
    assert(`MONEY fires and extracts ${v} from «${t.slice(0, 34)}…»`, r.found === true && r.values.includes(v));
  }
  assert('MONEY captures BOTH ends of a stated range («1200-1300€»)',
    (() => { const r = detectsStatedMoneyFigure('στα 1200-1300€'); return r.values.includes(1200) && r.values.includes(1300); })());

  const CONSTRAINT_POS = [
    ['γιατί έχω 4 παιδιά και ο μισθός δεν ανταποκρίνεται πλέον', 'dependants'],
    ['έχω οικογένεια με τέσσερα παιδιά τα μικρά είναι δίδυμα 2,5 ετών', 'dependants'],
    ['έχουν δραστηριότητες έχουν αγγλικά ο χρόνος είναι ελάχιστος', 'time'],
    ['αυτό έχει μεγάλο κίνδυνο και ρίσκω πάνω στο μηχανάκι', 'risk'],
    ['αυτό μου αποφέρει ελάχιστα έξτρα εισοδήματα', 'money'],
  ];
  for (const [t, kind] of CONSTRAINT_POS) {
    const r = detectsExplicitConstraint(t);
    assert(`CONSTRAINT «${kind}» fires on «${t.slice(0, 34)}…»`, r.found === true && r.kinds.includes(kind));
  }

  const PERM_POS = [
    'δεν ξέρω κατά ποιες από αυτές είναι νόμιμες γιατί είμαι δημόσιος υπάλληλος',
    'αν επιτρέπεται επίσης θα μπορούσα να κάνω κάτι μέσω εοπυυ',
    'δεν ξέρω αν αυτό μέσω εοπυυ επιτρέπεται',
  ];
  for (const t of PERM_POS) {
    assert(`PERMISSION fires on «${t.slice(0, 40)}…»`, detectsPermissionUncertainty(t) === true);
  }

  // ── 3. NEGATIVE — phrases that look close but must NOT fire ──
  // Each is chosen because it would trip a naive version of the same detector.
  const NEG = [
    ['είμαι 41 ετών', 'bare age — a number with no currency marker'],
    ['τα παιδιά είναι 12 και 9 ετών', 'two numbers, still no currency'],
    ['μπορώ να διαθέσω 6 ώρες την εβδομάδα', 'hours are not euros'],
    ['πλήρωσα 50€ για το βιβλίο', 'a currency figure BELOW the income floor — an everyday purchase'],
    ['δεν ξέρω τι να κάνω', 'generic uncertainty is not a named constraint'],
    ['θα ήθελα κάποιες ιδέες', 'a request is not a constraint'],
    ['αυτό που θα έλεγες στον φίλο σου είναι διαφορετικό από αυτό που επιτρέπεις στον εαυτό σου;',
     "AURA's own friend-perspective question (prompt γρ.66) contains «επιτρέπεις» — echoing it must not read as a legal question"],
    ['δεν επιτρέπω στον εαυτό μου να ξεκουραστώ', 'self-permission, not institutional permission'],
    ['Οκ', 'bare acknowledgment'],
  ];
  for (const [t, why] of NEG) {
    const fired = detectsStatedMoneyFigure(t).found || detectsExplicitConstraint(t).found || detectsPermissionUncertainty(t);
    assert(`NEGATIVE: «${t.slice(0, 40)}…» fires nothing — ${why}`, fired === false);
  }

  assert('Empty / null input is safe on all three', (() => {
    for (const v of [null, undefined, '', '   ']) {
      if (detectsStatedMoneyFigure(v).found || detectsExplicitConstraint(v).found || detectsPermissionUncertainty(v)) return false;
    }
    return true;
  })());
}

// ── 4. THE CTX IS EXPOSED — and is OBSERVATION ONLY ──
const ctxStart = CODE.indexOf('const materialEvidenceCtx');
assert('materialEvidenceCtx exists', ctxStart >= 0);
const ctxBlock = ctxStart >= 0 ? CODE.slice(ctxStart, CODE.indexOf('})();', ctxStart) + 5) : '';

assert('materialEvidenceCtx is a member of dynamicSuffix (it must actually reach the model)',
  /const dynamicSuffix = \[[^\]]*materialEvidenceCtx/s.test(CODE));
assert('materialEvidenceCtx is registered in the collision logger too (the two lists must not drift)',
  /const fired = Object\.entries\(\{[^}]*materialEvidenceCtx/s.test(CODE));

// NON-BINDING, asserted on the produced text rather than on the source shape: the whole point of
// this block is that it reports and never directs. These are the assertions that must fail first
// if someone later wires it to a gate.
assert('NON-BINDING: the block carries an explicit "not a sufficiency judgment" disclaimer',
  /NOT A SUFFICIENCY JUDGMENT/.test(ctxBlock));
assert('NON-BINDING: it explicitly states it authorizes nothing and blocks nothing',
  /authorizes nothing and blocks nothing/.test(ctxBlock));
assert('NON-BINDING: it names ROAD DISCOVERY only to DISCLAIM measuring its criteria',
  /does not measure ROAD DISCOVERY/.test(ctxBlock));
for (const banned of ['proceed now', 'you have enough', 'the next reply is the map', 'is due', 'take priority']) {
  assert(`NON-BINDING: the block contains no directive phrase «${banned}»`,
    !new RegExp(banned, 'i').test(ctxBlock));
}

// ── 5. NO NEW SESSION STATE — the ref-reset contract stays untouched ──
// Deliberate design constraint, not an accident: everything here is recomputed from `msgs` each
// turn, so there is no ref to leak across sessions and nothing for test_ref_reset_integrity to
// have to learn about. A future rewrite that introduces a ref here must add it to resetSession.
assert('NO NEW REFS: the ctx block declares no useRef of its own',
  ctxBlock.length > 0 && !/useRef\(/.test(ctxBlock));
assert('NO NEW REFS: the ctx block reads `msgs`, i.e. it is recomputed per turn rather than latched',
  /msgs\.filter\(/.test(ctxBlock));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n⚠ Αν έπεσαν οι έλεγχοι NON-BINDING: κάποιος σύνδεσε τους ανιχνευτές με απόφαση.');
  console.log('  Αυτό ΔΕΝ ήταν το συμβόλαιο. Είναι evidence-exposure, όχι gate — δες την κεφαλίδα.');
}
process.exit(failed > 0 ? 1 : 0);
