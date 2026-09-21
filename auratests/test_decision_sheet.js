// AURA — THE BLUEPRINT BECOMES A DECISION SHEET
//
// WHAT THIS COMMIT DOES, AND WHAT IT DELIBERATELY DOES NOT. Zero new detectors, zero prompt
// change. Everything rendered here was ALREADY computed and then thrown away:
//
//   parseRoadMap returns roads[] with name / gain / cost AND unknown. The sheet used ONLY the
//   unknown. The roads and their costs — the decision space itself — were parsed and discarded.
//
//   buildRoadArtifact assembles, IN CODE, the user's verbatim answer per road. It was injected
//   into the chat and never reached the sheet. It is the most structured, provenance-guaranteed
//   material the product owns.
//
//   classifyRoadProvenance already labels every ΚΕΡΔΙΖΕΙΣ / ΚΟΣΤΙΖΕΙ line SUPPORTED / MILD /
//   SEVERE against the user's own corpus. It lived in the debug panel, visible to nobody.
//
// MODEL 2 ORDER, vertical column: what you came with → what blocks you → your roads with their
// costs → your own thinking per road → what recurs → what you decided. The unknown moves ABOVE
// the roads on purpose: the prompt's own rule says a missing fact is a prerequisite, not an
// option — "δεν μπορείς να διαλέξεις ακόμα, γιατί λείπει αυτό".
//
// THE FOOTER HAD TO CHANGE, and missing that would have been the third repeat of a mistake this
// repo has already made twice. The old footer said every line on the sheet is the person's own
// words. That was true while the sheet carried only verbatim zones. Road gain/cost lines are
// AURA's formulation — which is exactly why classifyRoadProvenance exists — so the blanket claim
// becomes false the moment they appear. Each line now carries its own origin instead.
//
// OUT OF SCOPE, recorded in ARCHITECTURE_DECISIONS.md rather than slipped in: TENSIONS and a
// general DEPENDENCY graph. Both depend on detectors measured unreliable today.

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
function ex(name) {
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  const e = CODE.indexOf('\n}', s);
  return e < 0 ? null : CODE.slice(s, e + 2);
}
let buildBlueprintZones = null, parseRoadMap = null, classifyRoadProvenance = null;
for (const n of ['buildBlueprintZones','parseRoadMap','classifyRoadProvenance']) {
  const src = ex(n);
  assert(n + ' located', !!src);
  if (src) { try { eval(n + ' = ' + src.slice(src.indexOf('function'))); } catch (e) { console.log('FAIL — ' + n + ' eval: ' + e.message); failed++; } }
}
const renderSheet = (() => {
  const a = CODE.indexOf('function exportBlueprint');
  const b = CODE.indexOf('const blob = new Blob', a);
  if (a < 0 || b < 0) return null;
  const body = CODE.slice(CODE.indexOf('{', CODE.indexOf('(', a)) + 1, b);
  // THREE parameters: the real exportBlueprint takes `meta`. Lifting it with two left `meta`
  // undeclared inside the wrapper, so the renderer threw ReferenceError and this whole suite went
  // SILENT — which the runner reports separately, and which is strictly worse than a failure.
  try { return eval('(function (ankerText, zones, meta) {' + body + ' return html; })'); }
  catch (err) { console.log('FAIL — renderer lift: ' + err.message); failed++; return null; }
})();
assert('The real sheet renderer was lifted from the source', typeof renderSheet === 'function');

// ── A real map, in the shape AURA actually emits ───────────────────────────
const MAP_TEXT = [
  '**ΔΡΟΜΟΣ 1: Παράλληλη εργασία στη νοσηλευτική**',
  'ΚΕΡΔΙΖΕΙΣ: Χρησιμοποιείς γνώσεις που ήδη έχεις',
  'ΚΟΣΤΙΖΕΙ: Χρειάζεται να ξέρεις τι επιτρέπεται νομικά',
  '',
  '**ΔΡΟΜΟΣ 2: Νέες σπουδές**',
  'ΚΕΡΔΙΖΕΙΣ: Πιθανά υψηλότερο εισόδημα',
  'ΚΟΣΤΙΖΕΙ: Χρειάζεσαι 14000 ευρώ που δεν ανέφερες ποτέ',
  '',
  '**ΑΓΝΩΣΤΟ:** Τι επιτρέπεται νομικά παράλληλα με τη δημόσια θέση.',
].join('\n');
const USER_TEXTS = [
  'Θέλω να αυξήσω το εισόδημά μου.',
  'Έχω γνώσεις νοσηλευτικής και δεν ξέρω τι επιτρέπεται νομικά.',
  'Σκέφτομαι και σπουδές για εισόδημα.',
];
const MAP = typeof parseRoadMap === 'function' ? parseRoadMap(MAP_TEXT) : null;
assert('FIXTURE: the real parser reads the map', !!MAP && MAP.roads.length === 2 && !!MAP.unknown);
const PROV = (MAP && typeof classifyRoadProvenance === 'function')
  ? classifyRoadProvenance(MAP, USER_TEXTS) : null;
assert('FIXTURE: the real provenance classifier runs over it', !!PROV && PROV.lines === 4);

const ANSWERS = [
  { road: 1, name: 'Παράλληλη εργασία στη νοσηλευτική', q: 'Τι σε σταματά;', a: 'Δεν έχω ρωτήσει ακόμα τον σύλλογο.' },
  { road: 2, name: 'Νέες σπουδές', q: 'Τι θα άλλαζε;', a: 'Θα καθυστερούσε πολύ.' },
];
const MEM = { anchors: [], rejectedPatterns: [] };
const keys = z => (Array.isArray(z) ? z : []).map(x => x.key).join(',');
const Z = (road, extra) => buildBlueprintZones(
  (extra && extra.mem) || MEM,
  (extra && extra.recurring) || null,
  (extra && 'unknown' in extra) ? extra.unknown : (MAP ? MAP.unknown : null),
  (extra && extra.commitment) || null,
  'Θέλω να αυξήσω το εισόδημά μου.',
  road);

// ══ BACK-COMPAT ════════════════════════════════════════════════════════════
if (typeof buildBlueprintZones === 'function') {
  assert('BACK-COMPAT: called without the road argument, nothing new appears',
    keys(buildBlueprintZones(MEM, null, null, null, 'Μπήκα έτσι.')) === 'entered');
}

// ══ ORDER — Model 2, and the unknown sits ABOVE the roads ═════════════════
if (typeof buildBlueprintZones === 'function' && MAP) {
  const full = Z({ map: MAP, provenance: PROV, answers: ANSWERS }, {
    recurring: { word: 'χρόνος', count: 2, occurrences: [{ before: 'α', at: 1 }, { before: 'β', at: 2 }] },
    commitment: { verb: 'μιλήσω', before: 'ίσως θα μιλήσω', after: 'θα μιλήσω' },
  });
  assert('ORDER: entered → open → roads → roadthoughts → recurring → decided',
    keys(full) === 'entered,open,roads,roadthoughts,recurring,decided');
  const io = keys(full).split(',');
  assert('ORDER: what blocks you comes BEFORE the roads — a missing fact is a prerequisite',
    io.indexOf('open') < io.indexOf('roads'));
}

// ══ B — THE ROADS ══════════════════════════════════════════════════════════
if (typeof buildBlueprintZones === 'function' && MAP) {
  const z = Z({ map: MAP, provenance: PROV, answers: null }).find(x => x.key === 'roads');
  assert('ROADS: the zone exists when a map was parsed', !!z);
  assert('ROADS: every road the parser found is carried', !!z && z.roads.length === 2);
  assert('ROADS: the road name is the parser\'s, verbatim',
    !!z && z.roads[0].name === 'Παράλληλη εργασία στη νοσηλευτική');
  // MEASURED: checking only that each cost CONTAINS its own marker passed a mutation that pooled
  // every cost into every road — the marker was still in there, next to all the others. Compared
  // against the parser's own output instead, exactly, so a road can only ever carry its own line.
  assert('ROADS: gain and cost travel with their road, never pooled',
    !!z && z.roads.every((r, i) => r.cost === String(MAP.roads[i].cost).trim()
                                && r.gain === String(MAP.roads[i].gain).trim()));
  assert('ROADS: and the two roads really do differ, so the check above is not vacuous',
    !!z && z.roads[0].cost !== z.roads[1].cost);
  assert('ROADS: absent when no map was ever produced',
    !Z({ map: null, provenance: null, answers: null }).some(x => x.key === 'roads'));
  assert('ROADS: absent when the map has no roads',
    !Z({ map: { roads: [], unknown: null }, provenance: null, answers: null }).some(x => x.key === 'roads'));
}

// ══ C — THE COSTS, EACH WITH ITS ORIGIN ════════════════════════════════════
// This is the premium claim and the one thing a generic summary will not do: say which lines
// are the person's own words and which are the machine's.
if (typeof buildBlueprintZones === 'function' && MAP && PROV) {
  const z = Z({ map: MAP, provenance: PROV, answers: null }).find(x => x.key === 'roads');
  assert('COSTS: every line carries an origin mark', !!z &&
    z.roads.every(r => typeof r.gainSource === 'string' && typeof r.costSource === 'string'));
  assert('COSTS: the marks are the classifier\'s own verdicts, not invented here', !!z &&
    z.roads.every(r => ['SUPPORTED','MILD','SEVERE','UNVERIFIED'].indexOf(r.costSource) !== -1));
  // Road 2's cost names 14000, a figure absent from everything the user said. The classifier
  // calls that SEVERE, and the sheet must not quietly present it as the person's own words.
  assert('COSTS: a line inventing a figure the person never said is marked SEVERE',
    !!z && z.roads[1].costSource === 'SEVERE');
  assert('COSTS: a line grounded in their words is marked SUPPORTED',
    !!z && z.roads[0].costSource === 'SUPPORTED');
  assert('COSTS: marks are per line — gain and cost of the same road can differ',
    !!z && z.roads.some(r => r.gainSource !== r.costSource));
  const zNoProv = Z({ map: MAP, provenance: null, answers: null }).find(x => x.key === 'roads');
  assert('COSTS: with no classification available the mark says so — never a silent SUPPORTED',
    !!zNoProv && zNoProv.roads.every(r => r.costSource === 'UNVERIFIED'));
}

// ══ G — THE PERSON'S OWN THINKING, PER ROAD ════════════════════════════════
if (typeof buildBlueprintZones === 'function' && MAP) {
  const z = Z({ map: MAP, provenance: PROV, answers: ANSWERS }).find(x => x.key === 'roadthoughts');
  assert('ANSWERS: the zone exists when road answers were captured', !!z);
  assert('ANSWERS: reproduced byte-for-byte, never reworded',
    !!z && z.items[0].a === 'Δεν έχω ρωτήσει ακόμα τον σύλλογο.');
  assert('ANSWERS: each answer keeps the road it belongs to',
    !!z && z.items[1].name === 'Νέες σπουδές');
  assert('ANSWERS: absent when nothing was answered',
    !Z({ map: MAP, provenance: PROV, answers: [] }).some(x => x.key === 'roadthoughts'));
  assert('ANSWERS: a blank answer is dropped rather than rendered as an empty quote',
    (() => { const y = Z({ map: MAP, provenance: PROV, answers: [{ road: 1, name: 'α', q: 'ερ', a: '   ' }] });
             return !y.some(x => x.key === 'roadthoughts'); })());
}

// ══ NOTHING IS INVENTED ════════════════════════════════════════════════════
if (typeof buildBlueprintZones === 'function') {
  const thin = parseRoadMap('ΔΡΟΜΟΣ 1: Κάτι\nΚΕΡΔΙΖΕΙΣ: -\nΚΟΣΤΙΖΕΙ: -');
  if (thin) {
    const z = Z({ map: thin, provenance: null, answers: null }).find(x => x.key === 'roads');
    assert('NO INVENTION: a thin line stays thin — nothing is filled in',
      !!z && z.roads[0].gain === '-' && z.roads[0].cost === '-');
  }
  let threw = false;
  try {
    for (const junk of [{}, { map: 'x' }, { map: { roads: 'x' } }, { answers: 'x' }, null, undefined])
      buildBlueprintZones(MEM, null, null, null, 'α', junk);
  } catch (e) { threw = true; }
  assert('Junk in the road argument never throws', !threw);
}

// ══ THE SHEET ITSELF ═══════════════════════════════════════════════════════
if (renderSheet && typeof buildBlueprintZones === 'function' && MAP) {
  const zones = Z({ map: MAP, provenance: PROV, answers: ANSWERS });
  const html = renderSheet('χρόνος', zones);
  assert('SHEET: the roads are on it', html.indexOf('Παράλληλη εργασία στη νοσηλευτική') !== -1);
  assert('SHEET: the costs are on it', html.indexOf('14000') !== -1);
  assert('SHEET: the answers are on it', html.indexOf('Δεν έχω ρωτήσει ακόμα τον σύλλογο.') !== -1);
  assert('SHEET: the unknown is on it', html.indexOf('επιτρέπεται νομικά παράλληλα') !== -1);
  assert('SHEET: an origin mark is visible to the reader, not only in the data',
    /λόγια σου/.test(html) && /AURA/.test(html));
  // THE FOOTER. The old blanket claim is now false — road lines are AURA's formulation.
  assert('SHEET: the footer no longer claims EVERY line is the person\'s own words',
    html.indexOf('Κάθε γραμμή εδώ είναι δικά σου λόγια') === -1);
  assert('SHEET: it still says which parts ARE their words',
    /δικά σου λόγια/.test(html));
  // Escaping — this file is downloaded and shared.
  const evil = parseRoadMap('ΔΡΟΜΟΣ 1: <img src=x onerror=alert(1)>\nΚΕΡΔΙΖΕΙΣ: <b>ν</b>\nΚΟΣΤΙΖΕΙ: &');
  if (evil) {
    const h2 = renderSheet(null, Z({ map: evil, provenance: null, answers:
      [{ road: 1, name: '<script>', q: '<i>', a: '<svg onload=alert(1)>' }] }));
    assert('SHEET: road and answer content is escaped',
      h2.indexOf('<img src=x') === -1 && h2.indexOf('<svg onload') === -1 && h2.indexOf('<script>') === -1);
  }
}

// ══ THE CONTRACT: nothing on the sheet that is neither theirs nor pinned ═══════
// Same discipline as the e2e chrome pin, scoped to the vocabulary the road zones introduce.
// TWO DIRECTIONS on purpose: a new word means AURA started writing something nobody approved,
// a missing word means a block was removed and the pin must be updated deliberately. Deriving
// the chrome instead of pinning it is self-defeating — a hard-coded sentence would be derived
// as chrome by construction, which is how a synthesised line slipped past once before.
if (renderSheet && typeof buildBlueprintZones === 'function' && MAP) {
  const ROAD_CHROME = ('ανήκει ανοιχτο ανα αποσπάσματα από αυτή aura blueprint decision γραμμή ' +
    'δείχνει δεν διατύπωση δικά δρομο δρομοι δρόμους είναι είπες ' +
    'κάθε κερδιζεις κοστιζει κρατάς λόγια μπηκες οι παραμενει περιέχει ' +
    'πλέον που πού σε σκεψη σκέψη σου στοιχείο στους τα της τίτλοι φράση ήρθε ίδια όπως ' +
    // Added deliberately: the provenance legend. Unexplained origin marks are decoration; the
    // legend is what turns them into the differentiator, so its words are chrome now.
    'αυτά δίπλα δρόμου εντοπίσαμε σημαίνει την ότι').split(' ');
  const zones = Z({ map: MAP, provenance: PROV, answers: ANSWERS });
  const visible = renderSheet('χρόνος', zones)
    .replace(/<style>[\s\S]*?<\/style>/g, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/g, ' ');
  const mine = new Set((MAP_TEXT + ' ' + USER_TEXTS.join(' ') + ' ' +
    ANSWERS.map(a => a.name + ' ' + a.q + ' ' + a.a).join(' ') + ' χρόνος')
    .toLowerCase().match(/[a-z\u03b1-\u03c9\u03ac-\u03ce0-9]+/g) || []);
  const MONTHS = ['ιανουαρίου','φεβρουαρίου','μαρτίου','απριλίου','μαΐου','ιουνίου',
    'ιουλίου','αυγούστου','σεπτεμβρίου','οκτωβρίου','νοεμβρίου','δεκεμβρίου'];
  const words = (visible.toLowerCase().match(/[a-z\u03b1-\u03c9\u03ac-\u03ce]{2,}/g) || []);
  const unexplained = [...new Set(words)].filter(w =>
    !mine.has(w) && ROAD_CHROME.indexOf(w) === -1 && MONTHS.indexOf(w) === -1).sort();
  assert(`CONTRACT: nothing on the sheet is neither theirs nor pinned (found: ${unexplained.join(', ') || 'none'})`,
    unexplained.length === 0);
  // The UNVERIFIED wording cannot appear in this fixture — provenance is present, so every line
  // is classified. It is pinned against its own render instead, so it is still guarded.
  const unver = renderSheet(null, Z({ map: MAP, provenance: null, answers: null }));
  assert('CONTRACT: with no classification the sheet SAYS so, in words the reader can see',
    /\u03bc\u03b7 \u03b5\u03bb\u03b5\u03b3\u03bc\u03ad\u03bd\u03bf/.test(unver));
  // SCOPED TO THE MARKS, NOT THE PAGE. The legend defines the vocabulary and necessarily
  // contains the phrase «από τα λόγια σου» in order to explain it. What must never happen is a
  // LINE being marked that way without classification — which is what this now checks.
  assert('CONTRACT: and no individual line is marked as theirs without classification',
    (unver.match(/class="road-src[^"]*">[^<]*</g) || [])
      .every(m => m.indexOf('\u03b1\u03c0\u03cc \u03c4\u03b1 \u03bb\u03cc\u03b3\u03b9\u03b1 \u03c3\u03bf\u03c5') === -1));
  assert('CONTRACT: …and there really are marks to inspect, so that check is not vacuous',
    (unver.match(/class="road-src/g) || []).length >= 2);
  const gone = ROAD_CHROME.filter(w => words.indexOf(w) === -1 && !mine.has(w));
  assert(`CONTRACT: no pinned word vanished unnoticed (missing: ${gone.join(', ') || 'none'})`,
    gone.length === 0);
}

// ══ WIRING AT THE DOWNLOAD BUTTON ══════════════════════════════════════
const SITE = (() => {
  const i = CODE.indexOf('const _kept = getMostRecentWordAnchor(memory)?.text;');
  return i < 0 ? '' : CODE.slice(i, CODE.indexOf('Κατέβασε το Blueprint', i));
})();
assert('WIRING: the export site was located', SITE.length > 300);
assert('WIRING: it keeps the whole parsed map, not just the unknown',
  /parseRoadMap\(/.test(SITE) && /\.unknown/.test(SITE) && /provenance|classifyRoadProvenance/.test(SITE));
assert('WIRING: provenance is computed from the user\'s own messages',
  /classifyRoadProvenance\(/.test(SITE));
// SCOPED TO THE EMIT BLOCK. Measured: searching the whole file for `roadAnswersFinal` passed a
// mutation that deleted the one line that actually keeps the answers — the ref declaration, the
// resetSession clear and the export-site read all still matched. The same whole-file-search trap
// already caught twice in this repo.
const EMIT = (() => {
  const i = CODE.indexOf('if (roadQuestionState.current) {', CODE.indexOf('buildRoadArtifact(', CODE.indexOf('function buildRoadArtifact')));
  if (i < 0) return '';
  const j = CODE.indexOf('roadQuestionState.current = null', i);
  return j < 0 ? '' : CODE.slice(i, j + 40);
})();
assert('WIRING: the road-question emit block was located', EMIT.length > 200);
assert('WIRING: the answers are kept there, before the state is discarded',
  /roadAnswersFinal\.current\s*=/.test(EMIT) &&
  EMIT.indexOf('roadAnswersFinal.current') < EMIT.indexOf('roadQuestionState.current = null'));
assert('WIRING: the kept answers are cleared by resetSession',
  /const resetSession[\s\S]{0,4000}?roadAnswersFinal\.current\s*=\s*\[\]/.test(CODE));
assert('WIRING: buildBlueprintZones receives the road object',
  /buildBlueprintZones\([\s\S]{0,300}_road/.test(CODE));

// ══ SCOPE ══════════════════════════════════════════════════════════════════
assert('SCOPE: no new detector was added for tensions',
  !/function buildTensionSignal|function detectTension\b/.test(CODE));
assert('SCOPE: no dependency graph was built',
  !/function buildDependencyGraph|dependencyGraph/.test(CODE));
assert('SCOPE: the prompt is untouched by this mechanism',
  !/roadAnswersFinal|roadthoughts|costSource/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
