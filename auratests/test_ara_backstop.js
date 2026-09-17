const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('stripAraDeclarative'));
eval(extract('parseRoadMap'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

// Real transcript examples collected today
assert("Real #1 (μπρος-γκρεμός session) strips cleanly, question remains",
  stripAraDeclarative('Άρα ούτε το να πας ούτε το να μείνεις σου δίνει ησυχία. Τι είναι αυτό που πραγματικά σε βαραίνει;')
  === 'Τι είναι αυτό που πραγματικά σε βαραίνει;');

assert("Real #2 (annual event session) strips cleanly, question remains",
  stripAraDeclarative('Άρα η απόφαση έχει ήδη παρθεί — απλά ψάχνεις πώς να την πεις. Τι θα ήταν αρκετά αληθινό ώστε να το πεις;')
  === 'Τι θα ήταν αρκετά αληθινό ώστε να το πεις;');

assert("Real #3 (lie-choice session) strips cleanly, question remains",
  stripAraDeclarative('Άρα το ζήτημα δεν είναι αν θα πεις ψέμα — είναι ποιο ψέμα σε βολεύει περισσότερο να ζεις μετά. Ποιο από τα δύο σου κάθεται καλύτερα;')
  === 'Ποιο από τα δύο σου κάθεται καλύτερα;');

// Legitimate uses that must NOT be touched
assert("Legitimate: 'Άρα, [question]?' with no period is untouched",
  stripAraDeclarative('Νιώθεις ότι κάτι άλλαξε; Άρα, τι θα ήθελες να κάνεις τώρα;')
  === 'Νιώθεις ότι κάτι άλλαξε; Άρα, τι θα ήθελες να κάνεις τώρα;');

assert("No 'Άρα' present at all — untouched",
  stripAraDeclarative('Τι σε κάνει να το σκέφτεσαι ακόμα;')
  === 'Τι σε κάνει να το σκέφτεσαι ακόμα;');

// Known, honest limitation - documented, not silently passing
assert("KNOWN LIMITATION (documented): embedded-quote variant with no period is NOT stripped",
  stripAraDeclarative('Άρα το ερώτημα δεν είναι "θα διασκεδάσω;" — είναι "τι σε βαραίνει;" Πόσο πιστεύεις ότι αυτό ισχύει;')
  .startsWith('Άρα')); // confirms the gap exists and is known, not silently "fixed" by accident

// Empty/null safety
assert("Empty string doesn't crash", stripAraDeclarative("") === "");
assert("Null doesn't crash", stripAraDeclarative(null) === "");

// ── MULTI-LINE CONTAINMENT (live-analysis bug, reproduced executably) ──
// The removal pattern used [^.]* , which in JS matches newlines as well. So a single "Άρα"
// anywhere in a reply deleted everything up to the NEXT period, however many lines below that
// period happened to be. The worst observed case: a complete, valid ΔΡΟΜΟΣ/ΚΕΡΔΙΖΕΙΣ/ΚΟΣΤΙΖΕΙ
// road map opening with "Άρα," and ending with a period was reduced to the empty string — and
// since isBareEmojiOrAcknowledgment("") is true, the user then saw "Τι σκέφτεσαι τώρα;" where
// their map should have been. Exactly the reported "AURA asks instead of showing the map".
// These tests pin the containment rule: the removal never leaves the line it started on.

const MAP_ARA_INSIDE =
  'Αυτοί είναι οι δρόμοι που βλέπω από όσα είπες:\n' +
  'ΔΡΟΜΟΣ: Μένω στη δουλειά\nΚΕΡΔΙΖΕΙΣ: σταθερό εισόδημα\nΚΟΣΤΙΖΕΙ: Άρα χάνεις τον χρόνο σου κάθε μέρα.\n' +
  'ΔΡΟΜΟΣ: Φεύγω τώρα\nΚΕΡΔΙΖΕΙΣ: χρόνο\nΚΟΣΤΙΖΕΙ: την ασφάλεια';

const MAP_ARA_LEADING =
  'Άρα, αυτοί είναι οι δρόμοι:\n' +
  'ΔΡΟΜΟΣ: Μένω\nΚΕΡΔΙΖΕΙΣ: σταθερότητα\nΚΟΣΤΙΖΕΙ: χρόνο\n' +
  'ΔΡΟΜΟΣ: Φεύγω\nΚΕΡΔΙΖΕΙΣ: χρόνο\nΚΟΣΤΙΖΕΙ: ασφάλεια.';

assert("Sanity: both fixtures really do contain a 2-road map before stripping",
  parseRoadMap(MAP_ARA_INSIDE) !== null && parseRoadMap(MAP_ARA_INSIDE).roads.length === 2 &&
  parseRoadMap(MAP_ARA_LEADING) !== null && parseRoadMap(MAP_ARA_LEADING).roads.length === 2);

// HONEST SCOPE (corrected after running the fix): when a road's ΚΟΣΤΙΖΕΙ text is ITSELF an
// "Άρα …" declarative, removing that sentence empties the field, and parseRoadMap requires a
// non-empty value — so that one road drops out. That is the strip doing its job on content that
// happened to be a map field, not the newline bug. Making the strip skip map regions is a
// different, larger change (it would have to know about parseRoadMap) and is deliberately not
// made here. What this test pins is the containment rule, which is what actually broke:
assert("'Άρα' inside a ΚΟΣΤΙΖΕΙ line removes only that sentence — surrounding map lines untouched",
  (() => {
    const out = stripAraDeclarative(MAP_ARA_INSIDE);
    return out.includes('ΔΡΟΜΟΣ: Μένω στη δουλειά') &&
           out.includes('ΚΕΡΔΙΖΕΙΣ: σταθερό εισόδημα') &&
           out.includes('ΔΡΟΜΟΣ: Φεύγω τώρα') &&
           out.includes('ΚΟΣΤΙΖΕΙ: την ασφάλεια');
  })());

assert("A 2-road map opening with 'Άρα,' still parses as 2 roads after stripping",
  (() => { const p = parseRoadMap(stripAraDeclarative(MAP_ARA_LEADING)); return p !== null && p.roads.length === 2; })());

assert("CRITICAL: stripping never returns empty from input that contained a valid map",
  stripAraDeclarative(MAP_ARA_INSIDE).trim() !== "" && stripAraDeclarative(MAP_ARA_LEADING).trim() !== "");

assert("Line structure survives — the ΚΟΣΤΙΖΕΙ line is not glued onto the next ΔΡΟΜΟΣ line",
  !/ΚΟΣΤΙΖΕΙ:[ \t]*ΔΡΟΜΟΣ:/.test(stripAraDeclarative(MAP_ARA_INSIDE)));

// The original purpose must survive the containment fix — a declarative "Άρα X." on one line
// is still removed. Without this, the fix above could be "passed" by disabling the strip.
assert("PURPOSE PRESERVED: a single-line declarative 'Άρα …' is still removed",
  stripAraDeclarative('Άρα το πραγματικό πρόβλημα είναι ο φόβος. Τι σε κρατάει περισσότερο;')
  === 'Τι σε κρατάει περισσότερο;');

assert("PURPOSE PRESERVED: the declarative inside the map fixture is gone from the output",
  !stripAraDeclarative(MAP_ARA_INSIDE).includes('Άρα χάνεις τον χρόνο σου'));

assert("Removal stops at the end of its own line even when a period exists further down",
  stripAraDeclarative('Άρα κάτι αλλάζει εδώ\nΤι σε κρατάει;\nΠες μου κάτι ακόμα.')
  === 'Άρα κάτι αλλάζει εδώ\nΤι σε κρατάει;\nΠες μου κάτι ακόμα.');

// Same containment rule for the English pattern, which carried the identical [^.]* flaw.
assert("English pattern is contained to its own line too",
  (() => {
    const t = 'So, the real question is whether you stay\nΔΡΟΜΟΣ: Μένω\nΚΕΡΔΙΖΕΙΣ: χρόνο\nΚΟΣΤΙΖΕΙ: ασφάλεια.';
    const p = parseRoadMap(stripAraDeclarative(t));
    return p !== null && p.roads.length === 1;
  })());

// ── REAL-TRANSCRIPT LABEL TOLERANCE (numbered / bold road headings) ──────────────────────────
// The map format is prompt text ("Use these exact labels"), so what actually arrives is whatever
// the model wrote. In a real session the model numbered and bolded the headings —
// "**ΔΡΟΜΟΣ 1: ...**" instead of "ΔΡΟΜΟΣ:" — and parseRoadMap returned null on a map that had
// genuinely been produced. Measured consequences of that null: the dedicated road rendering in
// MessageBubble returns early, ΑΓΝΩΣΤΟ is never extracted, and [AURA ROAD TRACE] logs parseRaw: 0,
// which reads as "the model never produced one" — the exact opposite of what happened.
//
// THE STRIP REGEX IS TESTED TOGETHER WITH THE PARSER, ON PURPOSE. They are two halves of one
// contract: the parser decides that a map exists, and the strip removes the raw block so it is not
// shown twice. Making the parser more tolerant on its own would render every road TWICE — once as
// a styled block, once as leftover text. That coupling is invisible in the source and is exactly
// what a test has to hold.
const REAL_TRANSCRIPT_MAP = [
  'Εντάξει. Έχω αρκετό υλικό.',
  '',
  'Τρεις διαφορετικές κατευθύνσεις υπάρχουν με βάση αυτά που είπες:',
  '',
  '**ΔΡΟΜΟΣ 1: Παράλληλη εργασία στη νοσηλευτική**',
  'ΚΕΡΔΙΖΕΙΣ: Χρησιμοποιείς γνώσεις που ήδη έχεις, χωρίς σπουδές',
  'ΚΟΣΤΙΖΕΙ: Χρειάζεται να ξέρεις τι επιτρέπεται νομικά — αυτό παραμένει άγνωστο',
  '',
  '**ΔΡΟΜΟΣ 2: Gig economy (e-food, delivery κ.λπ.)**',
  'ΚΕΡΔΙΖΕΙΣ: Ξεκινάς αμέσως, ευέλικτο ωράριο με 4 παιδιά',
  'ΚΟΣΤΙΖΕΙ: Σκληρή δουλειά για σχετικά χαμηλό ρυθμό εισοδήματος',
  '',
  '**ΔΡΟΜΟΣ 3: Νέες σπουδές / επανακατάρτιση**',
  'ΚΕΡΔΙΖΕΙΣ: Πιθανά υψηλότερο εισόδημα μακροπρόθεσμα',
  'ΚΟΣΤΙΖΕΙ: Χρόνος με 4 παιδιά, και ο στόχος είναι 2-3 χρόνια',
  '',
  '**ΑΓΝΩΣΤΟ:** Τι επιτρέπεται νομικά παράλληλα με τη δημόσια θέση',
  '',
  'Ποιον δρόμο βλέπεις πιο ρεαλιστικό με τον ελεύθερο χρόνο που έχεις;',
].join('\n');

const _rtParsed = parseRoadMap(REAL_TRANSCRIPT_MAP);
assert('REAL TRANSCRIPT: the numbered/bold map parses at all', _rtParsed !== null);
assert('REAL TRANSCRIPT: all three roads are recovered',
  _rtParsed !== null && _rtParsed.roads.length === 3);
assert('REAL TRANSCRIPT: the road name carries no leftover markdown asterisks',
  _rtParsed !== null && _rtParsed.roads[0].name === 'Παράλληλη εργασία στη νοσηλευτική');
assert('REAL TRANSCRIPT: gain and cost are the model\'s own lines, unchanged',
  _rtParsed !== null &&
  _rtParsed.roads[1].cost === 'Σκληρή δουλειά για σχετικά χαμηλό ρυθμό εισοδήματος' &&
  _rtParsed.roads[2].gain === 'Πιθανά υψηλότερο εισόδημα μακροπρόθεσμα');
assert('REAL TRANSCRIPT: ΑΓΝΩΣΤΟ is extracted, without the bold label bleeding into the value',
  _rtParsed !== null && _rtParsed.unknown === 'Τι επιτρέπεται νομικά παράλληλα με τη δημόσια θέση');

// REGRESSION CONTROL, stated first so the assertions above cannot be satisfied by a parser that
// simply got looser about everything: the canonical unnumbered form must keep working exactly.
const CANONICAL_MAP = 'ΔΡΟΜΟΣ: Να μείνω\nΚΕΡΔΙΖΕΙΣ: σταθερότητα\nΚΟΣΤΙΖΕΙ: χρόνο\n\nΔΡΟΜΟΣ: Να φύγω\nΚΕΡΔΙΖΕΙΣ: χώρο\nΚΟΣΤΙΖΕΙ: ασφάλεια';
const _canon = parseRoadMap(CANONICAL_MAP);
assert('REGRESSION: the canonical unnumbered map still parses to 2 roads',
  _canon !== null && _canon.roads.length === 2 && _canon.roads[0].name === 'Να μείνω');
assert('REGRESSION: a reply with no map at all still returns null',
  parseRoadMap('Τι σε κρατάει περισσότερο σε αυτό;') === null);

// BEHAVIOURAL, against the REAL source of the display path rather than a copy of it: whatever the
// parser accepts, the strip must remove, or the user sees every road twice.
const _CODE_FOR_DISPLAY = (() => {
  const i = raw.indexOf('const AURA_CORE_PERSONALITY');
  const s = raw.indexOf('`', i) + 1;
  return raw.slice(0, i) + raw.slice(raw.indexOf('`;', s));
})();
const _dcStart = _CODE_FOR_DISPLAY.indexOf('const displayContent = roadMap');
const _dcEnd = _CODE_FOR_DISPLAY.indexOf(': msg.content;', _dcStart);
assert('Display path located for evaluation', _dcStart >= 0 && _dcEnd > _dcStart);
if (_dcStart >= 0 && _dcEnd > _dcStart) {
  const _dcSrc = _CODE_FOR_DISPLAY.slice(_dcStart, _dcEnd + ': msg.content;'.length);
  eval('function _stripRoadBlocks(msg, roadMap) { ' + _dcSrc + ' return displayContent; }');
  const _shown = _stripRoadBlocks({ content: REAL_TRANSCRIPT_MAP }, _rtParsed);
  for (const label of ['ΔΡΟΜΟΣ', 'ΚΕΡΔΙΖΕΙΣ', 'ΚΟΣΤΙΖΕΙ', 'ΑΓΝΩΣΤΟ']) {
    assert(`NO DOUBLE RENDER: «${label}» is fully stripped from the prose shown alongside the blocks`,
      !_shown.includes(label));
  }
  assert('NO DOUBLE RENDER: no orphaned markdown asterisks survive the strip',
    !_shown.includes('*'));
  assert('The surrounding prose itself is preserved — only the map blocks are removed',
    _shown.includes('Έχω αρκετό υλικό') && _shown.includes('Ποιον δρόμο βλέπεις'));
}

// ── ROAD-MAP PROVENANCE INSTRUMENTATION (passive) ───────────────────────────────────────────
// Measurement only. These assertions test two things with equal weight: that the counter counts
// what it claims, and that it STAYS PASSIVE. If a later change wires it to a decision, the
// passivity assertions fail first — that is their job.
const _PROMPT_SPLIT = (() => {
  const i = raw.indexOf('const AURA_CORE_PERSONALITY');
  const s = raw.indexOf('`', i) + 1;
  const e = raw.indexOf('`;', s);
  return { PROMPT: raw.slice(s, e), CODE: raw.slice(0, i) + raw.slice(e) };
})();

// CACHE SAFETY, asserted structurally: the whole mechanism must live outside the cached prefix.
assert('CACHE: classifyRoadProvenance is defined in CODE, not inside the prompt literal',
  _PROMPT_SPLIT.CODE.includes('function classifyRoadProvenance(') &&
  !_PROMPT_SPLIT.PROMPT.includes('classifyRoadProvenance'));
assert('CACHE: no provenance wiring leaked into the prompt literal',
  !_PROMPT_SPLIT.PROMPT.includes('AURA PROVENANCE') && !_PROMPT_SPLIT.PROMPT.includes('novelFactLines'));

assert('classifyRoadProvenance is CALLED (defined-but-unused is the same failure)',
  (_PROMPT_SPLIT.CODE.match(/classifyRoadProvenance\(/g) || []).length - 1 >= 1);

eval(extract('classifyRoadProvenance'));

const _PROV_USER = [
  'νοσηλευτής αλλά είμαι στη δευτεροβάθμια εκπαίδευση και ταυτόχρονα στην ειδική αγωγή, τα 1.200€ που δίνει το κράτος στους εκπαιδευτικούς είναι πλέον πολύ χαμηλό εισόδημα και στόχος μου είναι οι τρεις χιλιάδες ευρώ το μήνα αλλά δεν ξέρω ποιον τρόπο θα το αποκτήσω',
  'δεν ξέρω τις επιλογές μου σκέφτομαι να ξανασπουδάσω, δεν ξέρω και τι επιτρέπεται νομικά θέλω βοήθεια',
  'αν ήξερα ότι μέσα σε δύο χρόνια αλλάζοντας καριέρα θα μου έφερνε εισόδημα θα έκανα τα πάντα αλλά όχι 15 χρόνια να γίνω υποδιευθυντής',
  'ναι ανοιχτός σε οτιδήποτε, έχω βέβαια 4 παιδιά περιορισμένο χρόνο αλλά είμαι διατεθειμένος είτε να ξανασπουδάσω είτε να κάνω e-food και να φτάσω σε 2-3 χρόνια αυτό το εισόδημα',
];
const _prov = classifyRoadProvenance(parseRoadMap(REAL_TRANSCRIPT_MAP), _PROV_USER);
assert('PROVENANCE: all six gain/cost lines of the real map are counted', _prov.lines === 6);

// CALIBRATION PINNED ON PURPOSE, and it is the most important assertion here. On the very
// transcript that motivated this instrument, the loose indicator reports FIVE OF SIX lines
// supported — including both lines we independently know were fabricated, which pass on the single
// words "χαμηλό" and "εισόδημα". This number is recorded so nobody later reads a low `unsupported`
// count in production as evidence that provenance is fine. It measures vocabulary reuse, and a
// fabricated line reuses vocabulary by construction.
assert('CALIBRATION: the loose indicator scores 5/6 supported on the real transcript',
  _prov.supported === 5 && _prov.unsupported === 1);
assert('CALIBRATION: both known-fabricated lines score SUPPORTED — the documented blind spot',
  (() => {
    const cost2 = _prov.detail.find(d => d.label === 'ΚΟΣΤΙΖΕΙ#2');
    const gain3 = _prov.detail.find(d => d.label === 'ΚΕΡΔΙΖΕΙΣ#3');
    return cost2.verdict === 'SUPPORTED' && cost2.on === 'χαμηλο'
        && gain3.verdict === 'SUPPORTED' && gain3.on === 'εισοδημα';
  })());
assert('CALIBRATION: the real transcript carries no novel fact, so it is MILD not SEVERE',
  _prov.severe === 0 && _prov.mild === 1 && _prov.novelFactLines === 0);

// SEVERE MUST BE REACHABLE. It was not, in the first version: novelty was nested inside the loose
// gate, so an invented "Ο ΕΟΠΥΥ αποζημιώνει 45 ευρώ" scored SUPPORTED on the word "ευρώ" and the
// severity check never ran. Since Step 4's decision rule keys on SEVERE, an unreachable SEVERE
// would have made the whole measurement useless for the decision it exists to inform.
const _fabricated = classifyRoadProvenance(
  parseRoadMap('ΔΡΟΜΟΣ: Συμβάσεις\nΚΕΡΔΙΖΕΙΣ: Ο ΕΟΠΥΥ αποζημιώνει 45 ευρώ ανά επίσκεψη\nΚΟΣΤΙΖΕΙ: απαιτεί πιστοποίηση'),
  _PROV_USER);
assert('SEVERE IS REACHABLE: an invented organisation plus an invented number is flagged SEVERE',
  _fabricated.severe === 1 && _fabricated.novelFactLines === 1);
assert('SEVERE names the novel tokens it found, so the log can be audited',
  (() => { const d = _fabricated.detail.find(x => x.verdict === 'SEVERE');
           return d && d.novel.includes('ΕΟΠΥΥ') && d.novel.includes('45'); })());
assert('A figure the user DID state is not novel (4 παιδιά appears in their own words)',
  (() => { const r = classifyRoadProvenance(
             parseRoadMap('ΔΡΟΜΟΣ: Χ\nΚΕΡΔΙΖΕΙΣ: ωράριο με 4 παιδιά\nΚΟΣΤΙΖΕΙ: χρόνος'), _PROV_USER);
           return r.novelFactLines === 0; })());
assert('No map at all yields no counting and does not throw',
  (() => { const r = classifyRoadProvenance(null, _PROV_USER); return r.lines === 0 && r.unsupported === 0; })());

// ── PASSIVE: the result may reach a console line and the existing trace ref, nothing else ──
const _pIdx = _PROMPT_SPLIT.CODE.indexOf('const _traceProv =');
assert('Provenance call site located', _pIdx >= 0);
const _pWindow = _pIdx >= 0 ? _PROMPT_SPLIT.CODE.slice(_pIdx, _pIdx + 1400) : '';
assert('PASSIVE: the result reaches console.log and roadTraceLast, and nothing else',
  /console\.log\('\[AURA PROVENANCE\]'/.test(_pWindow) && /roadTraceLast\.current = _traceOut/.test(_pWindow));
for (const forbidden of ['displayText', 'setMessages', 'setLoading', 'setMemory', 'saveMemory']) {
  assert(`PASSIVE: «${forbidden}» never appears in the provenance window`,
    !_pWindow.split('roadTraceLast.current = _traceOut')[0].includes(forbidden));
}
// Targeted at the one return that would matter: a BARE `return;` aborts the turn handler. A
// `return { ... }` inside the local arrow is how the summary object is built and is not an exit —
// an earlier, looser version of this assertion flagged exactly that and was wrong, not the code.
assert('PASSIVE: no bare `return;` — the instrumentation can never abort the turn',
  !_pWindow.split('roadTraceLast.current = _traceOut')[0].includes('return;'));
assert('PASSIVE: the whole block is inside the diagnostics try/catch that can never break a turn',
  _PROMPT_SPLIT.CODE.slice(_pIdx, _pIdx + 2200).includes('/* diagnostics must never affect the session */'));
assert('NO NEW SESSION STATE: provenance rides roadTraceLast, which resetSession already clears',
  /roadTraceLast\.current = null/.test(_PROMPT_SPLIT.CODE) &&
  !/const\s+\w*[Pp]rovenance\w*\s*=\s*useRef/.test(_PROMPT_SPLIT.CODE));
assert('NO CONTENT LOGGED: only counts reach the trace object, never a map line or a user word',
  (() => { const o = _pWindow.slice(0, _pWindow.indexOf('console.log'));
           return o.includes('lines, supported, unsupported, mild, severe, novelFactLines') && !o.includes('detail'); })());

// ── PROVENANCE ON SCREEN (?debug=1 panel) ───────────────────────────────────────────────────
// WHY THIS EXISTS AT ALL: [AURA PROVENANCE] is a console line, and this file's own debug-panel
// comment records why that is not enough — "the browser console is unreachable on mobile, which is
// where these sessions actually happen". Without a panel line the measurement is written but
// uncollectable on the device the real Road Map sessions run on.
const _PANEL = (() => {
  const start = _PROMPT_SPLIT.CODE.indexOf('{debugMode.current && (');
  const end = _PROMPT_SPLIT.CODE.indexOf('Open anchors', start);
  return start >= 0 && end > start ? _PROMPT_SPLIT.CODE.slice(start, end) : '';
})();
assert('Debug panel block located', _PANEL.length > 200);

assert('PANEL: a prov: line exists', _PANEL.includes('prov:'));
assert('PANEL: it reads the provenance summary off roadTraceLast',
  /roadTraceLast\.current[?.]*\.provenance/.test(_PANEL));
assert('PANEL: it is GATED — it lives inside the debugMode.current block, never in the normal UI',
  _PANEL.startsWith('{debugMode.current && (') && _PANEL.includes('prov:'));
assert('PANEL: it is guarded against a turn with no map, so a null provenance renders nothing',
  /roadTraceLast\.current\?\.provenance\s*&&/.test(_PANEL));

// COUNTS ONLY. The panel is pixels on a real user's screen, so this is the assertion that keeps a
// map line or a user's own words from ever being painted there.
for (const field of ['supported', 'lines', 'unsupported', 'mild', 'severe', 'novelFactLines']) {
  assert(`PANEL: the count «${field}» is displayed`, _PANEL.includes('provenance.' + field));
}
assert('PANEL: the per-line detail array is NEVER rendered — counts only, no content',
  !_PANEL.includes('provenance.detail') && !_PANEL.includes('.on') && !_PANEL.includes('.novel}'));

// REGRESSION: the existing road: line must survive untouched.
assert('REGRESSION: the road: trace line is still rendered unchanged',
  /road: labels=\{roadTraceLast\.current\.rawHasLabels/.test(_PANEL) &&
  _PANEL.includes('roadTraceLast.current.parseAfterStrip'));

// ── FORMAT TOLERANCE DERIVED FROM THE SPECIFICATION, NOT FROM SAMPLES ────────────────────────
// WHY THIS SECTION EXISTS, stated before the assertions so a later reader does not repeat the
// mistake: the previous tolerance fix was derived from ONE transcript ("**ΔΡΟΜΟΣ 1: ...**") and
// added `\d*` to the pattern. The very next live session wrote "**ΔΡΟΜΟΣ Α — ΙΕΚ/διδασκαλία
// τώρα**" and the parser returned null again on a map that had genuinely been produced. Fitting
// the parser to observed samples is an endless game, because the map format is PROMPT TEXT and
// the model writes whatever it writes.
//
// THE RULE IS THEREFORE READ OFF THE SPECIFICATION (prompt, EXACT FORMAT WHEN THE MAP IS
// DELIVERED): three consecutive lines — one that STARTS with ΔΡΟΜΟΣ, then ΚΕΡΔΙΖΕΙΣ:, then
// ΚΟΣΤΙΖΕΙ:. Everything the specification never asked for — a colon after ΔΡΟΜΟΣ, arabic
// numbering, a dash, asterisks — stops being REQUIRED. The parser does not guess formats; it
// stops demanding what was never specified.
//
// THE TWO GUARANTEES, and they are deliberately different in strength:
//   • STRUCTURAL TOLERANCE IS TOTAL — any unseen heading decoration still parses. Never null again.
//   • NAME CLEANUP IS BEST-EFFORT — an unseen separator may leave punctuation in the name. A name
//     with a stray character is a cosmetic flaw; a null is a map the user never sees.
// The assertions below hold exactly that asymmetry, so a future change cannot quietly trade the
// first guarantee for a prettier name.
//
// WHAT ACTUALLY MAKES THE LOOSE ΔΡΟΜΟΣ RULE SAFE, measured rather than assumed. The first
// draft of this section claimed it was the three lines being strictly consecutive, and tightened
// the separator to forbid a blank line between labels. That claim was wrong, and the measurement
// is kept here because the wrong version was persuasive: every counterexample below is rejected
// IDENTICALLY with and without blank-line tolerance, including ΔΡΟΜΟΣ → prose → labels. The
// safety comes from the ^ anchor and from the labels having to arrive in order — whitespace
// cannot cross prose, so tolerating it buys a format at no cost. The old parser already
// tolerated blank lines (\s* spans newlines); removing that would have been a silent regression
// of exactly the kind this whole change exists to prevent, so the tolerance is kept and pinned.

// (1) REAL SAMPLE — the session that motivated this change. Present as VERIFICATION, never as the
// source of the rule: the rule comes from the prompt, and this is here to prove it covers reality.
const LIVE_ALPHA_MAP = [
  'Άρα έχεις δύο δρόμους που τραβάνε αντίθετα:',
  '',
  '**ΔΡΟΜΟΣ Α — ΙΕΚ/διδασκαλία τώρα**',
  'ΚΕΡΔΙΖΕΙΣ: έσοδα γρήγορα, κάνεις αυτό που ξέρεις',
  'ΚΟΣΤΙΖΕΙ: χρόνος, ενέργεια, άγνωστο αν επιτρέπεται',
  '',
  '**ΔΡΟΜΟΣ Β — σπουδές για διευθυντής**',
  'ΚΕΡΔΙΖΕΙΣ: σταθερή ανέλιξη, ασφάλεια',
  'ΚΟΣΤΙΖΕΙ: 10 χρόνια, η οικονομική πίεση παραμένει τώρα',
  '',
  'Ποιο από τα δύο κόστη είσαι πιο διατεθειμένος να σηκώσεις;',
].join('\n');
const _live = parseRoadMap(LIVE_ALPHA_MAP);
assert('LIVE Α/Β: the letter-lettered, em-dashed, bolded map parses at all (it returned null before)',
  _live !== null);
assert('LIVE Α/Β: both roads are recovered', _live !== null && _live.roads.length === 2);
assert('LIVE Α/Β: the road name is clean — no letter, no dash, no asterisks left in it',
  _live !== null && _live.roads[0].name === 'ΙΕΚ/διδασκαλία τώρα' &&
  _live.roads[1].name === 'σπουδές για διευθυντής');
assert('LIVE Α/Β: gain and cost are the model\'s own lines, unchanged',
  _live !== null && _live.roads[0].gain === 'έσοδα γρήγορα, κάνεις αυτό που ξέρεις' &&
  _live.roads[1].cost === '10 χρόνια, η οικονομική πίεση παραμένει τώρα');
assert('LIVE Α/Β: no ΑΓΝΩΣΤΟ was written, so unknown is null rather than invented',
  _live !== null && _live.unknown === null);

// (2) THE SPECIFICATION'S OWN FORM, copied from the prompt: bare labels, no decoration at all.
// If the loosened rule ever stopped accepting the form the prompt actually asks for, that is the
// worst possible regression and this is the assertion that catches it.
const _spec = parseRoadMap('ΔΡΟΜΟΣ: Να μιλήσω στον διευθυντή\nΚΕΡΔΙΖΕΙΣ: σταματάει η αβεβαιότητα\nΚΟΣΤΙΖΕΙ: μπορεί να χαλάσει η σχέση');
assert('SPEC FORM: the exact shape the prompt asks for parses, with a clean name',
  _spec !== null && _spec.roads.length === 1 && _spec.roads[0].name === 'Να μιλήσω στον διευθυντή');

// (3–8) COUNTEREXAMPLES. Loosening a pattern is only safe if what it REFUSES is stated as
// explicitly as what it accepts. Each of these must stay null.
const _NEGATIVES = [
  ['prose that merely uses the words',
   'Υπάρχει ένας δρόμος που κερδίζεις χρόνο και ένας που σου κοστίζει την ησυχία σου.'],
  ['a ΔΡΟΜΟΣ heading with no ΚΕΡΔΙΖΕΙΣ/ΚΟΣΤΙΖΕΙ under it',
   'ΔΡΟΜΟΣ: Να φύγω\n\nΚαι τι θα σήμαινε αυτό για σένα;'],
  ['a block missing its ΚΟΣΤΙΖΕΙ line',
   'ΔΡΟΜΟΣ: Να φύγω\nΚΕΡΔΙΖΕΙΣ: χώρο'],
  ['prose between the labels — whitespace may separate them, content may not',
   'ΔΡΟΜΟΣ: Να φύγω\nΚάτι άσχετο εδώ.\nΚΕΡΔΙΖΕΙΣ: χώρο\nΚΟΣΤΙΖΕΙ: ασφάλεια'],
  ['the labels in the wrong order',
   'ΔΡΟΜΟΣ: Να φύγω\nΚΟΣΤΙΖΕΙ: ασφάλεια\nΚΕΡΔΙΖΕΙΣ: χώρο'],
  ['the labels appearing mid-sentence rather than starting their lines',
   'Σκέψου ότι ΔΡΟΜΟΣ: Να φύγω και ΚΕΡΔΙΖΕΙΣ: χώρο αλλά ΚΟΣΤΙΖΕΙ: ασφάλεια.'],
];
_NEGATIVES.forEach(([label, text]) => {
  assert(`NOT A MAP: ${label} → null`, parseRoadMap(text) === null);
});

// BLANK LINES BETWEEN LABELS ARE TOLERATED, and this is a REGRESSION guard, not a new feature:
// the previous parser already accepted this form, and the tolerance is free — the counterexample
// directly above proves whitespace cannot be used to reach across prose. Pinned so no later
// tightening drops it by accident.
const _blank = parseRoadMap('ΔΡΟΜΟΣ: Να φύγω\n\nΚΕΡΔΙΖΕΙΣ: χώρο\nΚΟΣΤΙΖΕΙ: ασφάλεια');
assert('BLANK LINE: a blank line between labels still parses — tolerance the old parser had, kept',
  _blank !== null && _blank.roads.length === 1 && _blank.roads[0].name === 'Να φύγω');

// (9) THE GREEK-CAPITAL TRAP. The name cleaner removes an optional short enumerator (1, Α, ΙΙ)
// before the separator. A road whose NAME legitimately begins with a Greek capital word must not
// have that word eaten. "ΔΡΟΜΟΣ: Ανοιχτή συζήτηση" is the case that would break silently.
const _trap = parseRoadMap('ΔΡΟΜΟΣ: Ανοιχτή συζήτηση με τη μητέρα σου\nΚΕΡΔΙΖΕΙΣ: σταματάει το μάντεμα\nΚΟΣΤΙΖΕΙ: μπορεί να ακούσεις κάτι που δεν θες');
assert('GREEK-CAPITAL TRAP: a name starting with a Greek capital word survives intact',
  _trap !== null && _trap.roads[0].name === 'Ανοιχτή συζήτηση με τη μητέρα σου');
const _trap2 = parseRoadMap('ΔΡΟΜΟΣ Α: Ανοιχτή συζήτηση\nΚΕΡΔΙΖΕΙΣ: σαφήνεια\nΚΟΣΤΙΖΕΙ: ένταση');
assert('GREEK-CAPITAL TRAP: the enumerator «Α» goes, the name\'s own capital word stays',
  _trap2 !== null && _trap2.roads[0].name === 'Ανοιχτή συζήτηση');

// (10) THE ASYMMETRY ITSELF — an entirely unseen heading decoration. This is the assertion that
// states the design: structure always parses; the name may keep punctuation. It would FAIL on a
// parser that went back to requiring a known separator, which is the whole point.
const _unseen = parseRoadMap('ΔΡΟΜΟΣ >> Να αλλάξω τμήμα\nΚΕΡΔΙΖΕΙΣ: μένεις στην εταιρεία\nΚΟΣΤΙΖΕΙ: ξαναρχίζεις από την αρχή');
assert('UNSEEN FORMAT: a separator nobody has ever seen still parses — never null again',
  _unseen !== null && _unseen.roads.length === 1);
assert('UNSEEN FORMAT: the gain and cost are still exact; only the name may carry leftover punctuation',
  _unseen !== null && _unseen.roads[0].gain === 'μένεις στην εταιρεία' &&
  _unseen.roads[0].cost === 'ξαναρχίζεις από την αρχή' &&
  _unseen.roads[0].name.includes('Να αλλάξω τμήμα'));

// (11) LOCKSTEP, evaluated against the REAL displayContent expression in App.jsx rather than a
// copy of it. A more tolerant parser with an untouched strip renders every road TWICE — once as a
// styled block, once as leftover prose. That coupling is invisible in the source.
const _dc2Start = _CODE_FOR_DISPLAY.indexOf('const displayContent = roadMap');
const _dc2End = _CODE_FOR_DISPLAY.indexOf(': msg.content;', _dc2Start);
assert('LOCKSTEP: display path located for evaluation', _dc2Start >= 0 && _dc2End > _dc2Start);
if (_dc2Start >= 0 && _dc2End > _dc2Start) {
  const _src2 = _CODE_FOR_DISPLAY.slice(_dc2Start, _dc2End + ': msg.content;'.length);
  eval('function _stripLive(msg, roadMap) { ' + _src2 + ' return displayContent; }');
  const _withUnknown = LIVE_ALPHA_MAP.replace(
    '\nΠοιο από τα δύο', '\n**ΑΓΝΩΣΤΟ:** αν επιτρέπεται δεύτερη απασχόληση\n\nΠοιο από τα δύο');
  const _shownLive = _stripLive({ content: _withUnknown }, parseRoadMap(_withUnknown));
  for (const label of ['ΔΡΟΜΟΣ', 'ΚΕΡΔΙΖΕΙΣ', 'ΚΟΣΤΙΖΕΙ', 'ΑΓΝΩΣΤΟ']) {
    assert(`LOCKSTEP: «${label}» is fully stripped from the Α/Β map — no double render`,
      !_shownLive.includes(label));
  }
  assert('LOCKSTEP: no orphaned asterisks survive the strip of the Α/Β map',
    !_shownLive.includes('*'));
  assert('LOCKSTEP: the prose around the Α/Β map is preserved untouched',
    _shownLive.includes('Άρα έχεις δύο δρόμους') && _shownLive.includes('Ποιο από τα δύο κόστη'));
  assert('LOCKSTEP: the strip leaves a map-less reply completely alone',
    _stripLive({ content: 'Τι σε κρατάει περισσότερο σε αυτό;' }, null) === 'Τι σε κρατάει περισσότερο σε αυτό;');
}

// (12) THE stripAra → parseRoadMap CHAIN. stripAraDeclarative runs on the reply BEFORE the map is
// parsed. A ΚΟΣΤΙΖΕΙ line that itself begins with an "Άρα …" declarative loses that sentence, and
// if the stripped line empties the block the map disappears. Held here because the two functions
// are only coupled at the call site.
const _chain = parseRoadMap(stripAraDeclarative(
  '**ΔΡΟΜΟΣ Α — Μένω στη δουλειά**\nΚΕΡΔΙΖΕΙΣ: σταθερό εισόδημα\nΚΟΣΤΙΖΕΙ: Άρα χάνεις τον χρόνο σου κάθε μέρα. Τι μένει;\n**ΔΡΟΜΟΣ Β — Φεύγω τώρα**\nΚΕΡΔΙΖΕΙΣ: χρόνο\nΚΟΣΤΙΖΕΙ: την ασφάλεια'));
assert('CHAIN: both roads survive stripAraDeclarative running before the parser',
  _chain !== null && _chain.roads.length === 2);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
