// AURA — EVIDENCE ARCHITECTURE, END TO END
//
// Every other suite checks one piece. This one runs the whole chain on simulated sessions:
//
//   user messages → signals → zones → the actual HTML of the downloaded Blueprint
//
// WHAT THIS CAN AND CANNOT PROVE, stated first so the result is not over-read. It proves the
// MECHANISM is correct under controlled conditions — deterministic, repeatable. It cannot prove
// the live model behaves as the design expects, because that depends on how an LLM reads the ctx
// blocks in a real conversation. That has to be confirmed in a real browser session, and this
// suite is not a substitute for one. Today already showed why: Road Questions had 800+ passing
// tests and still could not be shown to fire in natural use until a live session was run.
//
// THE CENTRAL CONTRACT, same as the Road Map's: the rendered sheet may contain ONLY the person's
// verbatim words plus fixed labels. No synthesis, no paraphrase, no sentence written about them.
// Scenario 0 below enforces that by tokenising the real rendered HTML and checking every word in
// it against the fixture text and a closed list of chrome.

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
const grab = n => { const a = CODE.indexOf('function ' + n + '('); return a < 0 ? null : CODE.slice(a, CODE.indexOf('\n}', a) + 2); };
const load = n => { const src = grab(n); if (!src) { assert(n + ' located', false); return null; }
  try { return eval('(' + src.slice(src.indexOf('function')) + ')'); }
  catch (err) { assert(n + ' evaluates: ' + err.message, false); return null; } };

const classifyStepIntent = load('classifyStepIntent');
const buildCommitmentSignal = load('buildCommitmentSignal');
const buildRecurringSignal = load('buildRecurringSignal');
const buildBlueprintZones = load('buildBlueprintZones');
const patternKey = load('patternKey');
const isPatternRejected = load('isPatternRejected');
const recordPatternRejection = load('recordPatternRejection');
const extractBeforeMessage = load('extractBeforeMessage');
const parseThreeBeatShift = load('parseThreeBeatShift');
const parseRoadMap = load('parseRoadMap');
assert('All chain functions loaded',
  [classifyStepIntent, buildCommitmentSignal, buildRecurringSignal, buildBlueprintZones,
   patternKey, isPatternRejected, recordPatternRejection, extractBeforeMessage,
   parseThreeBeatShift, parseRoadMap].every(f => typeof f === 'function'));

// The REAL renderer, lifted out of exportBlueprint up to the Blob — everything after that is
// browser plumbing. Testing a copy of the template would prove nothing about the shipped sheet.
const renderBlueprint = (() => {
  const a = CODE.indexOf('function exportBlueprint');
  const b = CODE.indexOf('const blob = new Blob', a);
  if (a < 0 || b < 0) { assert('exportBlueprint body located', false); return null; }
  const body = CODE.slice(CODE.indexOf('{', CODE.indexOf('(', a)) + 1, b);
  try { return eval('(function (ankerText, zones) {' + body + ' return html; })'); }
  catch (err) { assert('exportBlueprint renders: ' + err.message, false); return null; }
})();
assert('The real Blueprint renderer was lifted from the source', typeof renderBlueprint === 'function');

// ── A simulated session: user messages in, signals out ─────────────────────
const U = c => ({ role: 'user', content: c });
const A = c => ({ role: 'assistant', content: c });
function runSession(messages, memBefore, keptWord) {
  // COMMITMENT capture, exactly as generateResponse does it: pre-API, first of each stage wins.
  let pair = null;
  messages.forEach((m, idx) => {
    if (m.role !== 'user') return;
    const intent = classifyStepIntent(m.content);
    if (!intent) return;
    pair = pair || { considered: null, committed: null };
    const turn = messages.slice(0, idx + 1).filter(x => x.role === 'user').length;
    const entry = { verb: intent.verb, text: intent.text, turn };
    if (intent.stage === 'considered' && !pair.considered) pair.considered = entry;
    if (intent.stage === 'committed' && !pair.committed) pair.committed = entry;
  });
  const commitment = buildCommitmentSignal(pair);
  const before = extractBeforeMessage(messages);
  // The anchor this session would write, if a word was kept.
  const mem = keptWord
    ? { ...memBefore, anchors: [...(memBefore.anchors || []),
        { category: 'trajectory_word', text: keptWord, createdAt: Date.now() + (memBefore.anchors || []).length, before, status: 'resolved' }] }
    : memBefore;
  const recurring = keptWord ? buildRecurringSignal(mem, keptWord) : null;
  let unknown = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'assistant') continue;
    const m = parseRoadMap(messages[i].content);
    if (m && m.unknown) { unknown = m.unknown; break; }
  }
  return { mem, commitment, recurring, unknown,
           zones: buildBlueprintZones(mem, recurring, unknown, commitment, before) };
}
const keysOf = z => z.map(x => x.key).join(',');

// ══ SCENARIO 1 — full positive path, COMMITMENT reaches the sheet ══════════
const S1 = [
  U('Σκέφτομαι μήπως θα μιλήσω στον διευθυντή για το ωράριο.'),
  A('Τι σε κρατάει;'),
  U('Φοβάμαι την αντίδραση.'),
  A('Και αν δεν το κάνεις;'),
  U('Θα μιλήσω στον διευθυντή τη Δευτέρα.'),
];
const r1 = runSession(S1, { anchors: [], rejectedPatterns: [] }, 'ωράριο');
assert('S1: the commitment pair is complete', r1.commitment !== null);
assert('S1: ΤΙ ΑΠΟΦΑΣΙΣΕΣ reaches the zones', keysOf(r1.zones).includes('decided'));
assert('S1: both halves are the person\'s own sentences, unedited',
  (() => { const z = r1.zones.find(x => x.key === 'decided');
    return z.before === S1[0].content && z.after === S1[4].content; })());
assert('S1: ΜΠΗΚΕΣ ΜΕ is their first message', (r1.zones[0] || {}).text === S1[0].content);
assert('S1: no recurrence on a first session', !keysOf(r1.zones).includes('recurring'));

// ══ SCENARIO 2 — RECURRING across two sessions ════════════════════════════
const S2a = [U('Δεν ξέρω αν να αλλάξω δουλειά.'), A('Τι σε κρατάει;'), U('Ο μισθός.')];
const S2b = [U('Πάλι το ίδιο θέμα με τη δουλειά.'), A('Τι άλλαξε;'), U('Τίποτα.')];
const r2a = runSession(S2a, { anchors: [], rejectedPatterns: [] }, 'χρόνος');
assert('S2: session one shows no recurrence', !keysOf(r2a.zones).includes('recurring'));
const r2b = runSession(S2b, r2a.mem, 'χρόνος');
assert('S2: session two DOES show the recurrence', keysOf(r2b.zones).includes('recurring'));
const z2 = r2b.zones.find(x => x.key === 'recurring');
assert('S2: the count is two', z2.count === 2);
assert('S2: it carries BOTH openings, oldest first, verbatim',
  z2.occurrences.length === 2 &&
  z2.occurrences[0].before === S2a[0].content &&
  z2.occurrences[1].before === S2b[0].content);
assert('S2: ΜΠΗΚΕΣ ΜΕ is THIS session\'s opening, not the older one',
  (r2b.zones[0] || {}).text === S2b[0].content);

// ══ SCENARIO 3 — Κ4 "Ναι" ═════════════════════════════════════════════════
const memYes = r2b.mem; // nothing recorded — Ναι and Μερικώς leave no rejection
assert('S3: after Ναι the pattern is not rejected',
  isPatternRejected(memYes, patternKey({ kind: 'recurring', word: 'χρόνος' })) === false);
assert('S3: and the zone still renders',
  keysOf(buildBlueprintZones(memYes, r2b.recurring, null, null)).includes('recurring'));

// ══ SCENARIO 4 — Κ4 "Όχι", and it must not be asked again ═════════════════
const k4key = patternKey({ kind: 'recurring', word: 'χρόνος' });
const memNo = recordPatternRejection({ ...r2b.mem }, k4key);
assert('S4: the refusal is recorded', isPatternRejected(memNo, k4key) === true);
assert('S4: the zone disappears from the sheet',
  !keysOf(buildBlueprintZones(memNo, r2b.recurring, null, null)).includes('recurring'));
// A THIRD session: the pattern is stronger than ever, and must still stay silent.
const r2c = runSession([U('Τρίτη φορά.'), A('?'), U('Ναι.')], memNo, 'χρόνος');
assert('S4: a third session makes the signal stronger', r2c.recurring.count === 3);
assert('S4: …and the zone is STILL suppressed — the refusal persisted',
  !keysOf(r2c.zones).includes('recurring'));
assert('S4: the gate would not re-arm for it either',
  isPatternRejected(r2c.mem, patternKey({ kind: 'recurring', word: r2c.recurring.word })) === true);
assert('S4: a different kept word is unaffected by that refusal',
  isPatternRejected(r2c.mem, patternKey({ kind: 'recurring', word: 'εισόδημα' })) === false);

// ══ SCENARIO 5 — nothing at all ═══════════════════════════════════════════
const S5 = [U('Γεια.'), A('Τι σε φέρνει;'), U('Απλώς κοιτάω.')];
const r5 = runSession(S5, { anchors: [], rejectedPatterns: [] }, null);
assert('S5: no signal of any kind', r5.commitment === null && r5.recurring === null && !r5.unknown);
// NO SIGNALS IS NOT NO ZONES. ΜΠΗΚΕΣ ΜΕ is pure evidence — their own first message — and does
// not depend on any signal firing. The three SIGNAL-backed zones are the ones that must be absent.
assert('S5: only the opening zone, which needs no signal', keysOf(r5.zones) === 'entered');
assert('S5: not one of the three signal-backed zones appears',
  !['recurring', 'decided', 'open'].some(k => keysOf(r5.zones).includes(k)));
if (renderBlueprint) {
  const html5 = renderBlueprint(null, r5.zones);
  for (const label of ['ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ', 'ΤΙ ΑΠΟΦΑΣΙΣΕΣ', 'ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ']) {
    assert(`S5: the sheet contains no «${label}» frame`, !html5.includes(label));
  }
  const htmlNone = renderBlueprint(null, []);
  assert('S5: with truly nothing, no zone card is emitted at all', !/<div class="zone-card"/.test(htmlNone));
  // The stylesheet always declares .zone-card, so a bare substring check was testing the CSS,
  // not the output. Checked as a rendered element.

}

// ══ SCENARIO 6 — partial ══════════════════════════════════════════════════
const S6 = [
  U('Έχω δύο δρόμους και δεν ξέρω.'),
  A('ΔΡΟΜΟΣ: Μένω\nΚΕΡΔΙΖΕΙΣ: σταθερότητα\nΚΟΣΤΙΖΕΙ: χρόνο\n\nΑΓΝΩΣΤΟ: αν εγκριθεί η άδεια'),
  U('Δεν ξέρω ακόμα.'),
];
const r6 = runSession(S6, { anchors: [], rejectedPatterns: [] }, null);
assert('S6: exactly the two zones that have evidence', keysOf(r6.zones) === 'entered,open');
assert('S6: the unknown is the one the person\'s map named',
  (r6.zones.find(z => z.key === 'open') || {}).text === 'αν εγκριθεί η άδεια');
assert('S6: no commitment, no recurrence', r6.commitment === null && r6.recurring === null);

// ══ SCENARIO 7 — THE REAL LIVE SESSION (22 exchanges, AI-app founder) ═════
// Not a constructed fixture: the founder's own browser session. It is the most important case in
// this file, because it is the only one that reflects what actually happens in use.
const S7 = [
  U('Θέλω να κάνω μια αλλαγή στη ζωή μου. Ο στόχος μου είναι να βγάζω 4000 ευρώ το μήνα. Είμαι δημόσιος υπάλληλος και θέλω να βρω λύση για το έξτρα εισόδημα'),
  A('Από πού στέκεσαι τώρα — τι έχεις ήδη σκεφτεί ή δοκιμάσει για αυτό το έξτρα εισόδημα;'),
  U('Όλα υπό σκέψη ...'),
  A('Τι είδους δουλειά κάνεις στο δημόσιο;'),
  U('Εκπαιδευτικός ειδικής αγωγής σε ενεγυλ με βασικό πτυχίο νοσηλευτικής'),
  A('Ποια από τις δύο σε τραβάει περισσότερο;'),
  U('Καμία.ειπα θέλω αλλαγή'),
  A('Τι εννοείς αλλαγή;'),
  U('Ιδανικά το δεύτερο'),
  A('Τι φαντάζεσαι;'),
  U('χτίζω μία εφαρμογή ai δεν έχω προς το παρόν μεγάλες προσδοκίες'),
  A('Τι πουλάει η εφαρμογή σου;'),
  U('αυτό που κάνει είναι να βάζει ο χρήστης ένα πρόβλημα'),
  A('Πώς βγάζει χρήματα;'),
  U('εκεί έχω μείνει εκεί αυτό το σημείο είναι το πιο δύσκολο'),
  A('Ποιο από τα δύο σε μπλοκάρει περισσότερο;'),
  U('Το δεύτερο'),
  A('Ποιο πρόβλημα θα έβαζε κάποιος που πληρώνει ήδη;'),
  U('Πρέπει να χωρίσω? Ίσως αυτό'),
  A('Βάλ\' το τώρα στην εφαρμογή σου και πες μου τι βγάζει.'),
  U('Θα το κάνω αύριο σε ευχαριστώ'),
  A('Καλή συνέχεια.'),
];
const r7 = runSession(S7, { anchors: [], rejectedPatterns: [] }, null);
assert('S7 REAL: "Θα το κάνω αύριο" IS recognised as a commitment',
  (classifyStepIntent('Θα το κάνω αύριο σε ευχαριστώ') || {}).stage === 'committed');
assert('S7 REAL: but no hesitation half exists anywhere in 22 exchanges',
  S7.filter(m => m.role === 'user')
    .every(m => (classifyStepIntent(m.content) || {}).stage !== 'considered'));
assert('S7 REAL: so NO commitment signal — two evidence or nothing, working as designed',
  r7.commitment === null);
assert('S7 REAL: the session ended with no kept word, so no recurrence is even possible',
  r7.recurring === null);
assert('S7 REAL: no road map was produced, so nothing is marked as still open',
  r7.unknown === null);
// BEFORE THE FIX THIS SESSION PRODUCED ZERO ZONES. ΜΠΗΚΕΣ ΜΕ read anchor.before, and this
// session ended with "Καλή συνέχεια" — no word kept, no anchor, so the person's own opening
// was lost although it sat in `messages` the whole time. It now renders. The other three zones
// stay empty, and that remains the honest result: on a real session, the architecture has one
// thing to show, not four.
assert('S7 REAL: the sheet carries exactly ONE zone — their own opening',
  keysOf(r7.zones) === 'entered');
assert('S7 REAL: and it is their first sentence, verbatim',
  (r7.zones[0] || {}).text === S7[0].content);
assert('S7 REAL: no signal-backed zone — nothing was manufactured to fill the sheet',
  r7.commitment === null && r7.recurring === null && r7.unknown === null);
// The counterfactual, to show the chain is sound and the gap is upstream: the SAME session with a
// kept word at the end would have produced its first zone.
const r7b = runSession(S7, { anchors: [], rejectedPatterns: [] }, 'αξία');
assert('S7 COUNTERFACTUAL: a kept word changes nothing on a FIRST session — recurrence needs a second',
  keysOf(r7b.zones) === 'entered' && r7b.recurring === null);

// ══ SCENARIO 0 — THE CONTRACT: verbatim only, no synthesis ════════════════
// Every word in the rendered sheet must come from the person's own text or from a closed list of
// fixed chrome. Same contract the Road Map artifact is held to.
if (renderBlueprint) {
  const fixtures = [S1[0].content, S1[4].content, S2a[0].content, S2b[0].content, 'χρόνος', 'ωράριο'];
  const zonesAll = buildBlueprintZones(
    { anchors: [{ category: 'trajectory_word', text: 'χρόνος', createdAt: 9, before: S1[0].content }], rejectedPatterns: [] },
    { kind: 'recurring', word: 'χρόνος', count: 2, occurrences: [
      { text: 'χρόνος', at: 1, before: S2a[0].content }, { text: 'χρόνος', at: 2, before: S2b[0].content }] },
    'αν εγκριθεί η άδεια',
    { verb: 'μιλήσω', before: S1[0].content, after: S1[4].content });
  assert('S0: all four zones present for the contract check', zonesAll.length === 4);
  const html = renderBlueprint('χρόνος', zonesAll);
  // Strip tags, styles and scripts; keep only what a reader sees.
  const visible = html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/g, ' ');
  // CHROME IS DERIVED, NOT LISTED, and from a FULLY POPULATED sheet. An empty render omits the
  // keystone card and falls back to the plain beats variant, so its vocabulary is missing exactly
  // the fixed sentences that then read as unexplained synthesis. Rendering every block with
  // sentinel content and subtracting the sentinels yields the complete template vocabulary, and
  // it cannot rot when the template changes.
  const SENTINELS = ['zzqqa', 'zzqqb', 'zzqqc', 'zzqqd', 'zzqqe', 'zzqqf', 'zzqqg'];
  const strip = h => h
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/g, ' ');
  const chromeSheet = renderBlueprint('zzqqa',
    [{ key: 'entered', label: 'ΜΠΗΚΕΣ ΜΕ', kind: 'evidence', text: 'zzqqe' },
     { key: 'recurring', label: 'ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ', kind: 'pattern', word: 'zzqqf', count: 2,
       occurrences: [{ text: 'zzqqf', at: 1, before: 'zzqqg' }] },
     { key: 'decided', label: 'ΤΙ ΑΠΟΦΑΣΙΣΕΣ', kind: 'pattern', verb: 'v', before: 'zzqqb', after: 'zzqqc' },
     { key: 'open', label: 'ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ', kind: 'evidence', text: 'zzqqd' }]);
  const chromeLower = new Set(
    (strip(chromeSheet).match(/[A-Za-z\u0391-\u03a9\u03b1-\u03c9\u0386-\u03ce]{2,}/g) || [])
      .map(w => w.toLowerCase())
      .filter(w => !SENTINELS.includes(w)));
  assert('S0: the fixed template vocabulary was derived from a fully populated sheet',
    chromeLower.size > 25 && !SENTINELS.some(x => chromeLower.has(x)));

  // AND PINNED. The derivation above is self-defeating on its own: a sentence hard-coded into the
  // template is rendered by the sentinel sheet too, so it becomes "chrome" by construction and the
  // contract check absorbs it. A mutation that added "Δείχνει επίμονη ανησυχία." to every
  // evidence zone passed cleanly. Deriving catches DYNAMIC synthesis; only a pin catches STATIC
  // synthesis. So the fixed vocabulary is frozen here: any new word in the template breaks this
  // and a human has to look at what was added and why. Month names vary with the render date and
  // are excluded. Updating this list is a deliberate act, never a convenience.
  // PIN UPDATED DELIBERATELY, for the footer only. The old footer claimed every line on the
  // sheet is the person's own words — true while the sheet carried only verbatim zones, false
  // the moment road ΚΕΡΔΙΖΕΙΣ / ΚΟΣΤΙΖΕΙ lines appear, since those are AURA's formulation.
  // Leaving it would have repeated, a third time, the exact mistake already corrected in the
  // consent copy and in this same footer. Removed: άλλο, εδώ, τίποτα. Added: the wording
  // that says which parts ARE theirs and that each road line carries its own origin.
  // The new zones' own vocabulary is pinned in test_decision_sheet.js, where fixtures produce it.
  const PINNED_CHROME = ('aura blueprint decision ανήκει ανοιχτο αποφασισες αποσπάσματα από αυτή γραμμή ' +
    'δείχνει δικά δρόμους είναι είπες επανεμφανιζεται κάθε κρατάς λόγια με μπηκες οι παραμενει ' +
    'πλέον που πού σε σκέψη σου στους τίτλοι τα της τι φορές φράση ήρθε ίδια όπως').split(' ');
  const MONTHS = ['ιανουαρίου','φεβρουαρίου','μαρτίου','απριλίου','μαΐου','ιουνίου',
    'ιουλίου','αυγούστου','σεπτεμβρίου','οκτωβρίου','νοεμβρίου','δεκεμβρίου'];
  // EXACT IN BOTH DIRECTIONS now that the contract covers the whole sheet. A new word means text
  // was added and a human must look at it; a missing word means a block was removed and the pin
  // must be updated deliberately. Checking only one direction let the old beats block sit outside
  // the contract indefinitely.
  const actual = [...chromeLower].filter(w => !MONTHS.includes(w)).sort();
  const newChrome = actual.filter(w => !PINNED_CHROME.includes(w));
  const goneChrome = PINNED_CHROME.filter(w => !actual.includes(w));
  assert(`S0 PIN: no new template words (found: ${newChrome.join(', ') || 'none'})`, newChrome.length === 0);
  assert(`S0 PIN: no template words disappeared unnoticed (missing: ${goneChrome.join(', ') || 'none'})`,
    goneChrome.length === 0);
  const fixtureWords = new Set(
    (fixtures.join(' ') + ' αν εγκριθεί η άδεια α β γ ΗΡΘΕΣ ΒΡΗΚΕΣ ΦΕΥΓΕΙΣ')
      .toLowerCase().match(/[a-z\u03b1-\u03c9\u03ac-\u03ce0-9]+/g) || []);
  const monthWords = new Set(['ιανουαρίου','φεβρουαρίου','μαρτίου','απριλίου','μαΐου','ιουνίου',
    'ιουλίου','αυγούστου','σεπτεμβρίου','οκτωβρίου','νοεμβρίου','δεκεμβρίου']);
  const unexplained = (visible.match(/[A-Za-zΑ-Ωα-ωΆ-Ώά-ώ]{2,}/g) || [])
    .map(w => w.toLowerCase())
    .filter(w => !fixtureWords.has(w) && !chromeLower.has(w) && !monthWords.has(w));
  assert(`S0 CONTRACT: every word in the sheet is verbatim or fixed chrome (unexplained: ${[...new Set(unexplained)].slice(0, 8).join(', ') || 'none'})`,
    unexplained.length === 0);
  assert('S0: the person\'s own sentences appear in the sheet, unaltered',
    html.includes(S1[0].content) && html.includes(S1[4].content) && html.includes(S2a[0].content));
  assert('S0: the four labels are present when the four zones are',
    ['ΜΠΗΚΕΣ ΜΕ','ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ','ΤΙ ΑΠΟΦΑΣΙΣΕΣ','ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ'].every(l => html.includes(l)));

  // THE SHEET IS NOW KEYSTONE + ZONES, NOTHING ELSE. The old block rendered whatever
  // finalDistillation held, and finalDistillation is the LAST SENTENCE of AURA's closing reply —
  // so parseThreeBeatShift on it always returned null and the plain fallback printed one
  // arbitrarily-cut sentence of AURA's prose onto a sheet the person keeps and shares. That block
  // never passed the verbatim contract; it was simply outside the part being checked. It is gone,
  // and so is the stamp, which repeated the keystone phrase a second time.
  assert('S0: no beats card survives on the sheet', !/class="path-card"/.test(html));
  assert('S0: no duplicate stamp of the kept phrase', !/class="stamp"/.test(html));
  // Direct, not arithmetic: the keystone card renders once and the stamp that repeated it is gone.
  // The earlier version counted occurrences across the sheet and was fragile for no benefit.
  assert('S0: the keystone card renders exactly once',
    (html.match(/class="keystone-card"/g) || []).length === 1);
  assert('S0: the footer no longer describes blocks that are not on the sheet',
    !/τρία βήματα|διατύπωσε η AURA/.test(html));
  assert('S0: and it states what is true of the whole page now',
    /δικά σου λόγια/.test(html) && /τίτλοι/.test(html));
  assert('S0: the renderer no longer takes a distillation argument at all',
    !/distillationText/.test(CODE.slice(CODE.indexOf('function exportBlueprint'),
                                        CODE.indexOf('const blob = new Blob'))));
  // XSS: the sheet is downloaded and shared. A person's own words must never execute.
  const evil = buildBlueprintZones(
    { anchors: [{ category: 'trajectory_word', text: 'x', createdAt: 1, before: '<img src=x onerror=alert(1)>' }], rejectedPatterns: [] },
    null, '<script>alert(2)</script>', null);
  const evilHtml = renderBlueprint('<b>β</b>', evil);
  assert('S0 XSS: a script tag in the unknown is escaped, not executed',
    !/<script>alert\(2\)<\/script>/.test(evilHtml) && evilHtml.includes('&lt;script&gt;'));
  assert('S0 XSS: an onerror payload in their first message is escaped',
    !/<img src=x onerror=/.test(evilHtml) && evilHtml.includes('&lt;img'));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
