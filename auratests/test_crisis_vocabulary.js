// ── ΚΡΙΣΗ: ΛΕΞΙΛΟΓΙΟ ΤΟΥ ΑΝΙΧΝΕΥΤΗ (απόφαση ιδρυτή, 2026-10-01) ─────────────────────────────────────────
//
// WHY. A measurement (AURA_UNFINISHED_INVENTORY.md §3β) found two faults in the CRISIS word list of
// detectSafetySignal:
//   FALSE ALARM — the bare "να τελειώσω" and "να χαθώ" turn "να τελειώσω τη δουλειά μου" into CRISIS.
//     That is not a harmless mistake: CRISIS switches the reply to SYSTEM_SUPPORTIVE, appends the
//     helpline line, and sets safetyMode, which makes decideTermination return "none" for the REST of
//     the session — a person who said they want to finish a task can no longer close their session.
//   MISSED SIGNAL — 4 of 8 indirect phrasings of wanting to die were not in the list at all:
//     «κουράστηκα να ζω», «δεν θέλω να είμαι πια εδώ», «σκέφτομαι να τα τελειώσω όλα»,
//     «δεν έχει νόημα να συνεχίζω».
//
// THE RULE THE FOUNDER SET, which decides every borderline case below: if a phrase can be read BOTH
// ways, it is CAUGHT — a false alarm costs less than a missed real signal. So "δεν έχει νόημα να
// συνεχίζω αυτή τη συζήτηση" and "θέλω να χαθώ από εδώ για διακοπές" stay CRISIS; they are pinned
// below as AMBIGUOUS-BY-DESIGN so nobody "fixes" them later by narrowing the list.
//
// SCOPE: this changes ONLY the CRISIS list. DISTRESS and the helpline line 10306 are untouched (the founder
// is confirming the number); pinned in §5. UPDATE 2026-10-01: the accent-less / UPPERCASE gap found while
// measuring ("θελω να πεθανω" was not caught at all) is now closed for the CRISIS list — §4.
//
// Fixtures are synthetic or generic phrases; no user text from a real session is stored.
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
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}
const SRC = extract('detectSafetySignal');
assert('detectSafetySignal is defined in App.jsx', !!SRC);
let D = null;
try { D = eval('(' + SRC + ')'); } catch (e) { console.log('FAIL — evaluates standalone: ' + e.message); failed++; }
assert('it evaluates standalone, so the suites can lift it without siblings', typeof D === 'function');

if (typeof D === 'function') {
  // ── 1. MUST BE CAUGHT ────────────────────────────────────────────────────────────────────────
  const MUST = [
    // the four indirect phrasings that were missing
    ['κουράστηκα να ζω', 'MISSED before: "κουράστηκα να …" had four verbs, not "ζω"'],
    ['δεν θέλω να είμαι πια εδώ', 'MISSED before'],
    ['σκέφτομαι να τα τελειώσω όλα', 'MISSED before: "να τα τελειώσω" is not "να τελειώσω"'],
    ['δεν έχει νόημα να συνεχίζω', 'MISSED before'],
    // their near variants
    ['δεν θέλω να είμαι εδώ πλέον', 'variant with πλέον after'],
    ['δεν θέλω να είμαι πλέον εδώ', 'variant with πλέον before "εδώ"'],
    ['δεν θέλω να είμαι εδώ', 'no "πια" at all'],
    ['κουράστηκα να ζω έτσι', 'longer tail'],
    ['δεν έχει νόημα να ζω', 'with "ζω"'],
    ['δεν έχει νόημα να συνεχίσω', 'with the aorist "συνεχίσω"'],
    ['να τα τελειώσω όλα', 'bare, without "σκέφτομαι"'],
    // what the removed bare "να χαθώ" used to catch and must still catch, in its crisis forms
    ['να χαθώ από προσώπου γης', 'the founder\'s own example'],
    ['θα ήθελα να χαθώ από προσώπου γης', '"θα ήθελα", not "θέλω": the bare form was the only thing catching it'],
    ['να χαθώ για πάντα', 'crisis form'],
    ['να χαθώ από τον κόσμο', 'crisis form'],
    ['ήθελα να χαθώ', 'past wish'],
    ['θέλω να χαθώ', 'kept from before'],
    // what the removed bare "να τελειώσω" used to catch and must still catch, in its crisis forms
    ['θέλω να τελειώσω τα πάντα', 'crisis form'],
    ['θέλω να τελειώσω με όλα', 'crisis form'],
    ['θέλω να τελειώσω με τα πάντα', 'crisis form, "με τα πάντα"'],
    ['θέλω να τελειώσω τη ζωή μου', 'crisis form'],
    ['θέλω να τελειώσω όλα', 'crisis form: "όλα" at the end of the clause'],
    ['δεν αντέχω και θέλω να τελειώσω με τη ζωή μου', 'crisis form inside a longer message'],
    // everything that was already caught must STILL be caught
    ['δεν αντέχω άλλο', 'unchanged'],
    ['θέλω να πεθάνω', 'unchanged'],
    ['σκέφτομαι την αυτοκτονία', 'unchanged'],
    ['θέλω να εξαφανιστώ', 'unchanged'],
    ['θα ήταν καλύτερα χωρίς εμένα', 'unchanged'],
    ['θέλω να κοιμηθώ και να μην ξυπνήσω', 'unchanged'],
    ['θέλω να βάλω τέλος', 'unchanged'],
    ['τελειώνω με όλα', 'unchanged'],
    ['δεν βλέπω νόημα', 'unchanged'],
    ['δεν θέλω να ζω', 'unchanged'],
    ['κουράστηκα να προσπαθώ', 'unchanged'],
    ['i want to die', 'unchanged, English'],
  ];
  for (const [t, why] of MUST) assert('CAUGHT: «' + t + '» — ' + why, D(t) === 'CRISIS');

  // ── 2. MUST NOT BE CAUGHT (not CRISIS) ───────────────────────────────────────────────────────
  const MUST_NOT = [
    ['να τελειώσω τη δουλειά μου μέχρι αύριο', 'the founder\'s example'],
    ['να τελειώσω το έργο', 'the founder\'s example'],
    ['πρέπει να τελειώσω το έργο πριν την Παρασκευή', 'a task, longer'],
    ['πρέπει να τελειώσω όλα τα έργα μέχρι αύριο', '"όλα" followed by a noun is the task'],
    ['θέλω να τελειώσω όλα μου τα έργα', '"όλα μου τα" is the task'],
    ['θέλω να τελειώσω όλα αυτά πριν φύγω', '"όλα αυτά" is the task'],
    ['θέλω να τελειώσω τις σπουδές μου', 'studies'],
    ['να τελειώσω αυτή τη συζήτηση', 'a conversation'],
    ['δεν θέλω να τελειώσω την ημέρα χωρίς να τα πω', 'the day'],
    ['φοβάμαι να χαθώ στις λεπτομέρειες', 'details, no "θέλω"'],
    ['μην χαθώ στη διαδρομή', 'no "να"'],
    ['Τι σε φέρνει εδώ;', 'neutral'],
    ['θέλω να αλλάξω δουλειά', 'neutral'],
  ];
  for (const [t, why] of MUST_NOT) assert('NOT CRISIS: «' + t + '» — ' + why, D(t) !== 'CRISIS');

  // ── 3. AMBIGUOUS BY DESIGN — can be read both ways, so it is CAUGHT (founder's rule) ─────────
  const AMBIGUOUS = [
    ['δεν έχει νόημα να συνεχίζω αυτή τη συζήτηση', 'could be only about the conversation'],
    ['κουράστηκα να ζω σε αυτό το σπίτι', 'could be only about the house'],
    ['δεν θέλω να είμαι εδώ σε αυτή τη σύσκεψη', 'could be only about a meeting'],
    ['θέλω να χαθώ από εδώ για λίγες μέρες διακοπές', 'could be only about a holiday ("θέλω να χαθώ" was kept)'],
    ['δεν θέλω να χαθώ στις λεπτομέρειες', 'a NEGATION that still contains "θέλω να χαθώ" — known, accepted false alarm'],
    ['να τα τελειώσω όλα μέχρι αύριο', 'could be only about tasks'],
  ];
  for (const [t, why] of AMBIGUOUS) assert('AMBIGUOUS-BY-DESIGN, CAUGHT: «' + t + '» — ' + why, D(t) === 'CRISIS');

  // ── 4. TYPED WITHOUT ACCENTS / IN CAPITALS (closed 2026-10-01; before, NONE of these were caught) ──
  // The CRISIS list is matched on the folded text as well (accents stripped, lowercase, final sigma
  // normalised) — a phone keyboard in Greek very often produces no accents at all. Only the CRISIS
  // list is folded; DISTRESS is matched exactly as before (see §5).
  const UNACCENTED = [
    ['θελω να πεθανω', 'the exact phrase that was missed'],
    ['ΘΕΛΩ ΝΑ ΠΕΘΑΝΩ', 'UPPERCASE, no accents (the way Greek capitals are written)'],
    ['ΘΈΛΩ ΝΑ ΠΕΘΆΝΩ', 'uppercase with accents'],
    ['Θέλω Να Πεθάνω', 'mixed case'],
    ['δεν αντεχω αλλο', 'unchanged phrase, no accents'],
    ['κουραστηκα να ζω', 'one of the four new phrases, no accents'],
    ['δεν θελω να ειμαι πια εδω', 'one of the four new phrases, no accents'],
    ['σκεφτομαι να τα τελειωσω ολα', 'one of the four new phrases, no accents'],
    ['δεν εχει νοημα να συνεχιζω', 'one of the four new phrases, no accents'],
    ['ΔΕΝ ΕΧΕΙ ΝΟΗΜΑ ΝΑ ΣΥΝΕΧΙΖΩ', 'one of the four new phrases, uppercase'],
    ['θα ηθελα να χαθω απο προσωπου γης', 'no accents, with the final sigma written as ς'],
    ['θελω να τελειωσω τη ζωη μου', 'crisis form, no accents'],
    ['δεν θελω να ζω', 'unchanged phrase, no accents'],
    ['θελω να βαλω τελοσ', 'a final σ typed instead of ς (pattern «βάλω τέλος» ends in ς)'],
    ['ΝΑ ΒΑΛΩ ΤΕΛΟΣ', 'capitals, final sigma'],
    ['θελω να εξαφανιστω', 'unchanged phrase, no accents'],
    ['θα ηταν καλυτερα χωρις εμενα', 'unchanged phrase, no accents'],
    ['αυτοκτονια', 'stem, no accents'],
  ];
  for (const [t, why] of UNACCENTED) assert('CAUGHT without accents/case: «' + t + '» — ' + why, D(t) === 'CRISIS');
  const UNACCENTED_NOT = [
    ['να τελειωσω τη δουλεια μου μεχρι αυριο', 'the founder\'s example, no accents'],
    ['ΝΑ ΤΕΛΕΙΩΣΩ ΤΟ ΕΡΓΟ', 'the founder\'s example, uppercase'],
    ['πρεπει να τελειωσω ολα τα εργα μεχρι αυριο', '"ολα" before a noun, no accents'],
    ['θελω να τελειωσω ολα μου τα εργα', '"ολα μου τα", no accents'],
    ['φοβαμαι να χαθω στις λεπτομερειες', 'details, no accents'],
    ['θελω να αλλαξω δουλεια', 'neutral, no accents'],
    ['ΤΙ ΣΕ ΦΕΡΝΕΙ ΕΔΩ', 'neutral, uppercase'],
  ];
  for (const [t, why] of UNACCENTED_NOT) assert('NOT CRISIS without accents/case: «' + t + '» — ' + why, D(t) !== 'CRISIS');
  assert('non-string input does not throw', D(null) === null && D(undefined) === null && D('') === null);

  // ── 4b. KNOWN GAPS, pinned and NOT fixed here ───────────────────────────────────────────────
  assert('KNOWN GAP, not fixed: grief with no keyword ("πέθανε ο πατέρας μου") reads as nothing',
    D('πέθανε ο πατέρας μου') === null);
  assert('KNOWN GAP, not fixed: "δεν αντέχω" needs "άλλο" ("χώρισα και δεν αντέχω")',
    D('χώρισα και δεν αντέχω') === null);
  assert('KNOWN GAP, not fixed: DISTRESS is still accent-sensitive ("εχω κριση πανικου" reads as nothing) — DISTRESS is untouched by design',
    D('εχω κριση πανικου') === null);

  // ── 5. DISTRESS IS UNTOUCHED ─────────────────────────────────────────────────────────────────
  assert('DISTRESS unchanged: «έχω κρίση πανικού»', D('έχω κρίση πανικού') === 'DISTRESS');
  assert('DISTRESS unchanged: «είμαι σε οικονομική κρίση» (known false DISTRESS, not touched here)', D('είμαι σε οικονομική κρίση') === 'DISTRESS');
  assert('DISTRESS unchanged: «πένθος»', D('περνάω πένθος') === 'DISTRESS');
  assert('DISTRESS unchanged: English «grief»', D('i am in grief') === 'DISTRESS');
  assert('a CRISIS phrase still wins over a DISTRESS word in the same message',
    D('έχω κρίση και θέλω να πεθάνω') === 'CRISIS');
  assert('the DISTRESS pattern is byte-identical',
    CODE.includes('/(πένθος|τραύμα|κατάρρευση|κρίση|κακοποίηση|απώλεια αγαπημένου)/i,') &&
    CODE.includes('/\\b(grief|bereaved|bereavement|trauma|traumatic|abuse|abused|assault|crisis|breakdown|panic attack)\\b/i,'));
  // UPDATED 2026-10-02: this assertion used to pin the OLD unconditional «…10306 — είναι εκεί.» append as untouched, while the
  // founder confirmed the number. He then approved the two-tier design (test_crisis_tiers.js): the old inline append is
  // REPLACED by buildCrisisLine (1018 + 112 for tier A, 10306 once for tier B). It is still appended only in SUPPORTIVE mode.
  assert('the helpline line is still appended only in SUPPORTIVE mode, now through buildCrisisLine (old inline append gone)',
    /if \(currentMode === "SUPPORTIVE"\) \{\s*const _crisisLine = buildCrisisLine\(/.test(CODE) &&
    !CODE.includes('let displayText = (currentMode === "SUPPORTIVE" && !/10306/.test(text))'));
  assert('the helpline line is untouched in the prompt',
    PROMPT.includes('"Αν ποτέ φτάσεις σε εκείνη τη στιγμή, υπάρχει η γραμμή 10306 — είναι εκεί."'));
  assert('the English CRISIS pattern is untouched',
    CODE.includes("/\\b(suicide|suicidal|self.harm|self.hurt|kill myself|end my life|don't want to (live|be here)|want to die|want to disappear|can't go on)\\b/i,"));
  assert('the send path still branches on the signal exactly as before',
    CODE.includes('if (safetySignal === "CRISIS") {') && CODE.includes('if (safetySignal === "DISTRESS") {'));

  // ── 6. THE BARE FORMS ARE REALLY GONE (not merely shadowed by a longer match) ────────────────
  assert('the bare «να τελειώσω» is no longer an alternative of the CRISIS list',
    !/[(|]να τελειώσω[|)]/.test(SRC));
  assert('the bare «να χαθώ» is no longer an alternative of the CRISIS list',
    !/[(|]να χαθώ[|)]/.test(SRC));
  assert('NON-VACUITY: the list still contains its other alternatives, so the two checks above have a subject',
    /αυτοκτον/.test(SRC) && /θέλω να χαθώ/.test(SRC));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
