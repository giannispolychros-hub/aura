// ── ΚΡΙΣΗ: ΔΥΟ ΕΠΙΠΕΔΑ ΚΑΙ ΣΩΣΤΟΣ ΑΡΙΘΜΟΣ (απόφαση ιδρυτή, 2026-10-02) ──────────────────────────────────────
//
// WHY. Before this change every CRISIS match did the same thing: opened safetyMode (which locks the closing for the
// rest of the session) and appended the line «…υπάρχει η γραμμή 10306 — είναι εκεί.» to EVERY crisis turn. The founder
// confirmed what the two numbers are: 10306 = the free, anonymous Psychosocial Support Line of the Ministry of Health;
// 1018 = a suicide-intervention line. A person showing suicidal thoughts was shown the first and never the second.
//
// THE DESIGN (founder-approved):
//   TIER A — suicidal thoughts / self-harm (and every AMBIGUOUS phrase): shown 1018 + 112, on EVERY tier-A message
//            unless the model's own text already contains «1018»; safetyMode opens exactly as before.
//   TIER B — general despair with no stated self-harm («δεν αντέχω άλλο»…): shown 10306 ONCE per session; NO safetyMode,
//            so the session can still close. The model turn itself is unchanged (still the SUPPORTIVE prompt).
//   DISTRESS (grief, trauma, panic, «κρίση») — UNTOUCHED, still no number from code.
//   The prompt, rule 755 and SYSTEM_SUPPORTIVE are NOT touched (pinned below).
//
// HOW THE TIER IS DECIDED, and why it cannot drift from the vocabulary: classifyCrisisTier first asks detectSafetySignal
// whether the message is CRISIS at all; then it removes the few TIER-B phrases and asks detectSafetySignal AGAIN. Still
// CRISIS ⇒ A; otherwise ⇒ B. So A ∪ B is exactly CRISIS by construction, and the only vocabulary stated twice is the short
// B list. A B phrase followed by «να ζω / να συνεχίσω / …» is NOT B («δεν αντέχω άλλο να ζω» is suicidal).
//
// Fixtures are generic phrases; no user text from a real session is stored.
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
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function extract(name) { const s = raw.indexOf('function ' + name + '('); return s < 0 ? null : raw.slice(s, raw.indexOf('\n}', s) + 2); }

eval(extract('detectSafetySignal'));
const CT_SRC = extract('classifyCrisisTier');
const BL_SRC = extract('buildCrisisLine');
assert('classifyCrisisTier is defined in App.jsx', !!CT_SRC);
assert('buildCrisisLine is defined in App.jsx', !!BL_SRC);
let T = null, L = null;
try { T = eval('(' + CT_SRC + ')'); } catch (e) { console.log('FAIL — classifyCrisisTier evaluates: ' + e.message); failed++; }
try { L = eval('(' + BL_SRC + ')'); } catch (e) { console.log('FAIL — buildCrisisLine evaluates standalone: ' + e.message); failed++; }

const LINE_A = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const LINE_B = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';

// ── 1. EVERY ALTERNATIVE OF THE CRISIS LIST HAS A TIER (so a new phrase cannot be added unclassified) ──
const dsrc = extract('detectSafetySignal');
const body = dsrc.match(/\/\((αυτοκτον[^\n]*)\)\/i,/)[1];
const alts = []; { let d = 0, cur = ''; for (const ch of body) { if (ch === '(') d++; if (ch === ')') d--; if (ch === '|' && d === 0) { alts.push(cur); cur = ''; } else cur += ch; } alts.push(cur); }
const PLAN = {
  'αυτοκτον': ['A', 'σκέφτομαι την αυτοκτονία'], 'αυτοτραυματ': ['A', 'σκέφτομαι τον αυτοτραυματισμό'],
  'δεν θέλω να ζω': ['A', 'δεν θέλω να ζω'], 'θέλω να πεθάν': ['A', 'θέλω να πεθάνω'], 'θέλω να χαθώ': ['A', 'θέλω να χαθώ'],
  'ήθελα να χαθώ': ['A', 'ήθελα να χαθώ'], 'να χαθώ (από προσώπου|για πάντα|από τον κόσμο)': ['A', 'θέλω να χαθώ από προσώπου γης'],
  'να τελειώσω (τα πάντα|με όλα|με τα πάντα|τη ζωή μου|με τη ζωή μου)': ['A', 'θέλω να τελειώσω τη ζωή μου'],
  'να τελειώσω όλα(?! (μου )?(τα|τις|τους|αυτά))': ['A', 'θέλω να τελειώσω όλα'], 'να τα τελειώσω όλα': ['A', 'σκέφτομαι να τα τελειώσω όλα'],
  'δεν αντέχω άλλο': ['B', 'δεν αντέχω άλλο'], 'δεν βλέπω νόημα': ['B', 'δεν βλέπω νόημα'],
  'δεν υπάρχει λόγος να συνεχίσω': ['A', 'δεν υπάρχει λόγος να συνεχίσω'], 'δεν βλέπω λόγο να συνεχίσω': ['A', 'δεν βλέπω λόγο να συνεχίσω'],
  'ίσως (ούτε )?η ζωή μου': ['A', 'ίσως ούτε η ζωή μου'], 'δεν αξίζει (πια|πλέον)': ['B', 'δεν αξίζει πια'], 'τι νόημα έχει πια': ['B', 'τι νόημα έχει πια'],
  'κουράστηκα να (προσπαθώ|υπάρχω|αγωνίζομαι|συνεχίζω|ζω)': ['MIXED', 'κουράστηκα να ζω'],
  'δώσω τέλος': ['A', 'θέλω να δώσω τέλος'], 'να δώσω ένα τέλος': ['A', 'θέλω να δώσω ένα τέλος'], 'βάλω (ένα )?τέλος': ['A', 'θέλω να βάλω τέλος'],
  'να μην ξυπνήσω': ['A', 'θέλω να μην ξυπνήσω'], 'να μην είμαι εδώ': ['A', 'θέλω να μην είμαι εδώ'], 'δεν θέλω να είμαι (πια |πλέον )?εδώ': ['A', 'δεν θέλω να είμαι πια εδώ'],
  'δεν έχει νόημα να (συνεχίζω|συνεχίσω|ζω)': ['A', 'δεν έχει νόημα να συνεχίζω'], 'να εξαφανιστώ': ['A', 'θέλω να εξαφανιστώ'], 'καλύτερα νεκρ': ['A', 'θα ήμουν καλύτερα νεκρός'],
  'θα ήταν καλύτερα χωρίς εμένα': ['A', 'θα ήταν καλύτερα χωρίς εμένα'], 'κακό στον εαυτό μου': ['A', 'θέλω να κάνω κακό στον εαυτό μου'],
  'βλάψω τον εαυτό μου': ['A', 'σκέφτομαι να βλάψω τον εαυτό μου'], 'να φύγω από τη ζωή': ['A', 'θέλω να φύγω από τη ζωή'], 'δεν έχω λόγο να ζω': ['A', 'δεν έχω λόγο να ζω'],
  'τελειώνω με όλα': ['A', 'τελειώνω με όλα'],
};
assert('NON-VACUITY: the Greek CRISIS list has 33 alternatives (' + alts.length + ')', alts.length === 33);
assert('EVERY alternative of the CRISIS list has an entry in the tier plan — a new phrase must be classified here',
  alts.every(a => a in PLAN) && Object.keys(PLAN).every(k => alts.includes(k)));
if (T) {
  for (const alt of alts) {
    const [tier, sample] = PLAN[alt] || [];
    if (!tier || tier === 'MIXED') continue;
    assert('(α) «' + sample + '» → tier ' + tier, T(sample) === tier);
  }
  // alternative 18 (κουράστηκα να …) is split: two verbs are plain tiredness (B), three are existential (A)
  for (const [p, tier] of [['κουράστηκα να προσπαθώ', 'B'], ['κουράστηκα να αγωνίζομαι', 'B'], ['κουράστηκα να υπάρχω', 'A'], ['κουράστηκα να συνεχίζω', 'A'], ['κουράστηκα να ζω', 'A']])
    assert('(α) «' + p + '» → tier ' + tier, T(p) === tier);

  // ── 2. THE FOUNDER'S AMBIGUOUS CASES GO TO A ──────────────────────────────────────────────────
  for (const p of ['δεν έχει νόημα να συνεχίζω αυτή τη συζήτηση', 'θέλω να χαθώ από εδώ για λίγες μέρες διακοπές', 'δεν θέλω να χαθώ στις λεπτομέρειες', 'να τα τελειώσω όλα μέχρι αύριο', 'κουράστηκα να ζω σε αυτό το σπίτι'])
    assert('(α) ambiguous → A: «' + p + '»', T(p) === 'A');

  // ── 3. B DOES NOT SWALLOW A ───────────────────────────────────────────────────────────────────
  for (const p of ['δεν αντέχω άλλο να ζω', 'δεν αντέχω άλλο να συνεχίσω', 'δεν βλέπω νόημα να ζήσω', 'δεν αξίζει πια να υπάρχω', 'δεν βλέπω νόημα να είμαι εδώ',
                    'δεν αντέχω άλλο, θέλω να πεθάνω', 'δεν αντέχω άλλο και σκέφτομαι την αυτοκτονία', 'τι νόημα έχει πια να ζω'])
    assert('(α) a B phrase with an A phrase or continuation stays A: «' + p + '»', T(p) === 'A');

  // ── 4. WITHOUT ACCENTS / IN CAPITALS the tier is the same ─────────────────────────────────────
  for (const [p, tier] of [['δεν αντεχω αλλο', 'B'], ['ΔΕΝ ΑΝΤΕΧΩ ΑΛΛΟ', 'B'], ['Δεν Βλεπω Νοημα', 'B'], ['θελω να πεθανω', 'A'], ['ΘΕΛΩ ΝΑ ΠΕΘΑΝΩ', 'A'],
                            ['κουραστηκα να ζω', 'A'], ['δεν αντεχω αλλο να ζω', 'A']])
    assert('(α) no accents / capitals: «' + p + '» → ' + tier, T(p) === tier);
  assert('(α) English suicide words → A', T('i want to die') === 'A' && T('I am thinking about suicide') === 'A');

  // ── 5. (β) HARMLESS EXAMPLES ARE NOT CAUGHT AT ALL ────────────────────────────────────────────
  for (const [p, why] of [['να τελειώσω τη δουλειά μου', 'the founder\'s example'], ['να τελειώσω το έργο', 'the founder\'s example'], ['είμαι σε οικονομική κρίση', 'DISTRESS, not CRISIS'],
      ['έχω κρίση πανικού', 'DISTRESS'], ['περνάω πένθος', 'DISTRESS'], ['Τι σε φέρνει εδώ;', 'neutral'], ['δεν αντέχω τον θόρυβο', '«δεν αντέχω» without «άλλο»'], ['φοβάμαι να χαθώ στις λεπτομέρειες', 'no «θέλω»'],
      ['', 'empty']])
    assert('(β) no tier: «' + p + '» — ' + why, T(p) === null);
  assert('(β) non-string input is null, never a throw', T(null) === null && T(undefined) === null && T(42) === null);
  assert('(β) an ARRAY that merely stringifies to a crisis phrase is not text → null, not a throw', T(['θέλω να πεθάνω']) === null);
  assert('(α) «πλέον» form of the tier-B phrase', T('δεν αξίζει πλέον') === 'B');
  assert('(α) TWO tier-B phrases in one message are both removed → still B', T('δεν αντέχω άλλο και δεν βλέπω νόημα') === 'B' && T('δεν αντέχω άλλο, δεν αξίζει πια, κουράστηκα να προσπαθώ') === 'B');
  assert('(α) removing a tier-B phrase never glues the neighbouring words into a tier-A phrase', T('δεν θέλω να ζδεν αντέχω άλλοω') === 'B');

  // ── 6. THE TIER AGREES WITH THE DETECTOR: a tier exists exactly when detectSafetySignal says CRISIS ──
  const corpus = alts.map(a => PLAN[a][1]).concat(['δεν αντέχω άλλο', 'να τελειώσω τη δουλειά μου', 'οικονομική κρίση', 'ΘΕΛΩ ΝΑ ΠΕΘΑΝΩ', 'hello', 'i want to die', 'δεν αντεχω αλλο', 'δεν αντέχω άλλο να ζω']);
  assert('A ∪ B = CRISIS on the whole corpus (a tier exists iff detectSafetySignal returns CRISIS)',
    corpus.every(t => (T(t) !== null) === (detectSafetySignal(t) === 'CRISIS')));
}

// ── 7. (γ) THE LINE: what is appended, when, and never twice ────────────────────────────────────
if (L) {
  const r = (tier, text, shown) => L(tier, text, shown);
  assert('TIER A appends exactly the founder-approved text (1018 + 112)', r('A', 'Είμαι εδώ.', false).line === LINE_A);
  assert('TIER B appends exactly the founder-approved text (10306)', r('B', 'Είμαι εδώ.', false).line === LINE_B);
  assert('the texts contain the numbers and nothing the founder did not confirm', /1018/.test(LINE_A) && /112/.test(LINE_A) && !/10306/.test(LINE_A) && /10306/.test(LINE_B) && !/1018/.test(LINE_B));
  // (γ) 1018 never twice
  assert('(γ) tier A: the model\'s text already contains «1018» → NOTHING is appended', r('A', 'Η γραμμή 1018 είναι εδώ.', false).line === '');
  assert('(γ) …even with the line shown flag set', r('A', 'Η γραμμή 1018 είναι εδώ.', true).line === '');
  assert('(γ) …«1018» inside a longer number is still the model having said it', r('A', 'Κάλεσε 1018.', false).line === '');
  assert('(γ) tier A: the model said «10306» but not «1018» → the 1018 line IS appended (different number)', r('A', 'Υπάρχει η γραμμή 10306.', false).line === LINE_A);
  assert('(γ) tier A appends on EVERY tier-A message: a second call with the same flags appends again', r('A', 'Είμαι εδώ.', false).line === LINE_A && r('A', 'Είμαι εδώ.', true).line === LINE_A);
  assert('tier A never TURNS ON the 10306 flag (it only carries it through)', r('A', 'Είμαι εδώ.', false).supportShown === false && r('A', 'Είμαι εδώ.', true).supportShown === true);
  // 10306 once
  assert('tier B, first time: the line is appended and the flag turns on', (x => x.line === LINE_B && x.supportShown === true)(r('B', 'Είμαι εδώ.', false)));
  assert('tier B, already shown: NOTHING is appended', r('B', 'Είμαι εδώ.', true).line === '');
  assert('tier B, the model already said «10306»: nothing is appended, and it counts as shown', (x => x.line === '' && x.supportShown === true)(r('B', 'Υπάρχει η 10306.', false)));
  assert('tier B, already shown and the model says it too: nothing, flag stays on', (x => x.line === '' && x.supportShown === true)(r('B', 'Υπάρχει η 10306.', true)));
  assert('tier B, already shown: the returned flag stays true', r('B', 'Είμαι εδώ.', true).supportShown === true);
  assert('tier B: «1018» in the model\'s text does not suppress the 10306 line', r('B', 'Η 1018 υπάρχει.', false).line === LINE_B);
  // defaults
  assert('an unknown tier (null/undefined) is treated as A — a missed suicidal message costs more than a surplus line',
    r(null, 'Είμαι εδώ.', false).line === LINE_A && r(undefined, 'Είμαι εδώ.', false).line === LINE_A && r('Z', 'Είμαι εδώ.', false).line === LINE_A);
  assert('a non-string that merely stringifies to text containing 1018 is not the model\'s text → the line is appended', r('A', ['Κάλεσε 1018'], false).line === LINE_A);
  assert('non-string model text does not throw', r('A', null, false).line === LINE_A && r('B', undefined, false).line === LINE_B && r('A', 42, false).line === LINE_A);
  assert('the flag argument is read as a boolean (undefined = not shown)', r('B', 'Είμαι εδώ.', undefined).line === LINE_B);
}

// ── 8. WIRING ───────────────────────────────────────────────────────────────────────────────────
const branchAt = CODE.indexOf('if (safetySignal === "CRISIS") {');
assert('NON-VACUITY: the CRISIS branch is findable', branchAt > 0);
const branch = CODE.slice(branchAt, branchAt + 900);
assert('the CRISIS branch classifies the tier of the user\'s message', /const _crisisTier = classifyCrisisTier\(userText\);/.test(branch));
assert('safetyMode opens for every tier EXCEPT B (null also locks: the safe default)', /if \(_crisisTier !== "B"\) setSafetyMode\(true\);/.test(branch) && !/\n\s*setSafetyMode\(true\);/.test(branch));
assert('the model turn is unchanged for both tiers: still the SUPPORTIVE call', /await generateResponse\(safeMsgs, "SUPPORTIVE"\);/.test(branch));
const dispAt = CODE.indexOf('let displayText = text;');
assert('NON-VACUITY: the displayText site is findable', dispAt > 0);
const disp = CODE.slice(dispAt - 200, dispAt + 700);
assert('the old unconditional 10306 append is gone', !/!\/10306\/\.test\(text\)\)\s*\n\s*\? text \+/.test(CODE) && !/υπάρχει η γραμμή 10306 — είναι εκεί\./.test(CODE));
assert('the appended line comes from buildCrisisLine, only in SUPPORTIVE mode, for the tier of the last user message',
  /if \(currentMode === "SUPPORTIVE"\) \{/.test(disp) && /buildCrisisLine\(classifyCrisisTier\(lastUserMsg\), text, supportLineShown\.current\)/.test(disp));
assert('the line is appended after a blank line', /displayText = text \+ "\\n\\n" \+ _crisisLine\.line;/.test(disp));
assert('the 10306 flag is written back from the result', /if \(_crisisLine\.supportShown\) supportLineShown\.current = true;/.test(disp));
// (δ) the ref
assert('(δ) the ref is declared once, starting false', (CODE.match(/const supportLineShown\s*=\s*useRef\(false\)/g) || []).length === 1);
const rs = CODE.indexOf('const resetSession = () => {');
assert('NON-VACUITY: resetSession is findable', rs > 0);
const resetBody = CODE.slice(rs, rs + 6000);
assert('(δ) resetSession sets the 10306 ref back to false', /supportLineShown\.current = false;/.test(resetBody));
assert('(δ) …and resetSession is the only place that sets it to false', (CODE.match(/supportLineShown\.current = false;/g) || []).length === 1);
assert('(δ) the ref is only ever set TRUE from the crisis result', (CODE.match(/supportLineShown\.current = true;/g) || []).length === 1);
// everything that must NOT have changed
assert('DISTRESS is untouched: same patterns, no tier, no number', CODE.includes('/(πένθος|τραύμα|κατάρρευση|κρίση|κακοποίηση|απώλεια αγαπημένου)/i,') &&
  !/if \(safetySignal === "DISTRESS"\) \{[\s\S]{0,900}classifyCrisisTier/.test(CODE));
assert('the DISTRESS branch still calls the normal generateResponse path', /if \(safetySignal === "DISTRESS"\) \{[\s\S]{0,900}await generateResponse\(distressMsgs, mode\);/.test(CODE));
assert('the prompt is untouched: rule 755 still says 10306 once', PROMPT.includes('"Αν ποτέ φτάσεις σε εκείνη τη στιγμή, υπάρχει η γραμμή 10306 — είναι εκεί."') && PROMPT.includes('Do not repeat. Do not elaborate. Continue normally.'));
assert('SYSTEM_SUPPORTIVE is untouched', CODE.includes('3. Do not compress. Do not analyze. Do not terminate. Do not push.') && !/SYSTEM_SUPPORTIVE[^`]*1018/.test(CODE));
assert('detectSafetySignal is still what decides CRISIS vs DISTRESS in the send path', /const safetySignal = detectSafetySignal\(userText\);/.test(CODE));
assert('the closing lock itself is untouched (safetyMode still returns "none" and still blocks triggerTermination)',
  /if \(safetyMode\) return "none";/.test(CODE) && /const triggerTermination = useCallback\(async \(msgs\) => \{\s*if \(safetyMode\) return;/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
