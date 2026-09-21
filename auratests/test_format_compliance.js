// AURA — MEASURING WHETHER THE MODEL USES THE FORMAT AT ALL
//
// WHY. The G1 decision rule is already written down: at ≥20 completed sessions, a Road Map rate
// under 5% means "the rule never reaches output" and the first option is to DELETE the rule from
// the prompt. That rule reads its number from session_completed.roadMap, which is
// parseRoadMap succeeding. A live session on 2026-09-21 produced two road maps in free prose —
// «Τρεις δρόμοι, διαφορετικός ορίζοντας ο καθένας: Εφαρμογή AI — 3-6 μήνες, υψηλό ρίσκο…» — with
// no ΔΡΟΜΟΣ/ΚΕΡΔΙΖΕΙΣ/ΚΟΣΤΙΖΕΙ anywhere, so it will be counted as roadMap:false, exactly like a
// session that never discussed roads. Acting on that number could delete a rule that works.
//
// THE SAME SESSION SHOWED IT IS NOT ONLY THE ROAD MAP. The three-beat came out as «Ήρθες με μια
// παράξενη διάθεση… Βρήκες τρεις κατευθύνσεις… Φεύγεις με δύο βήματα» — the structure, in prose,
// without ΗΡΘΕΣ ΜΕ: / ΒΡΗΚΕΣ: / ΦΕΥΓΕΙΣ ΜΕ:. parseThreeBeatShift returned null on it too.
//
// WHAT THIS ADDS: four booleans per session, nothing else. Measurement only, no new behaviour.
//
// WHAT IT HONESTLY CANNOT DO, pinned below so nobody reads more into the numbers than they hold:
// it distinguishes "the labels were written and the parser missed them" from "the labels were
// never written". It does NOT detect structure expressed in prose — that needs a real detector
// and is exactly the thing being deferred until these rates are known.
//
// ASYMMETRY, deliberate and tested. The road pattern is case-insensitive because it already is,
// in the shadow trace, and changing it mid-measurement would move the G1 number for reasons
// unrelated to the model. The beat pattern is case-SENSITIVE and colon-anchored, because
// «Βρήκες» is an ordinary Greek word: a case-insensitive version would report the prose
// three-beat above as correctly labelled, which is the opposite of the truth.

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
function ex(n) {
  const s = CODE.indexOf('function ' + n + '(');
  if (s < 0) return null;
  const e = CODE.indexOf('\n}', s);
  return e < 0 ? null : CODE.slice(s, e + 2);
}
let structuralLabelsIn = null, parseRoadMap = null, parseThreeBeatShift = null;
for (const n of ['structuralLabelsIn', 'parseRoadMap', 'parseThreeBeatShift']) {
  const src = ex(n);
  assert(n + ' is defined', !!src);
  if (src) { try { eval(n + ' = ' + src.slice(src.indexOf('function'))); }
             catch (e) { console.log('FAIL — ' + n + ' eval: ' + e.message); failed++; } }
}

// ── The real session, verbatim ─────────────────────────────────────────────
const PROSE_ROADS = [
  'Τρεις δρόμοι, διαφορετικός ορίζοντας ο καθένας:',
  '',
  '**Εφαρμογή AI** — 3-6 μήνες, υψηλό ρίσκο, αβέβαιο εισόδημα.',
  '',
  '**Σπουδές 2 ετών** — σίγουρο εισόδημα μετά, χάνεις χρόνο τώρα.',
  '',
  '**Σπουδές 4 ετών** — πιο σίγουρο, πιο μακριά.',
].join('\n');
const PROSE_BEAT = [
  'Ήρθες με μια παράξενη διάθεση και αίσθηση στασιμότητας.',
  '',
  'Βρήκες τρεις συγκεκριμένες κατευθύνσεις που ταιριάζουν στο προφίλ σου.',
  '',
  'Φεύγεις με δύο άμεσα βήματα που μπορείς να κάνεις αυτή την εβδομάδα.',
].join('\n');
const LABELLED_BEAT = [
  'ΗΡΘΕΣ ΜΕ: ένα δίλημμα',
  'ΒΡΗΚΕΣ: την αιτία',
  'ΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη',
].join('\n');
const LABELLED_ROADS = [
  '**ΔΡΟΜΟΣ 1: Κάτι**',
  'ΚΕΡΔΙΖΕΙΣ: α',
  'ΚΟΣΤΙΖΕΙ: β',
].join('\n');

if (typeof structuralLabelsIn === 'function') {
  // ── THE POINT: prose is reported as unlabelled ──────────────────────────
  const p1 = structuralLabelsIn(PROSE_ROADS);
  const p2 = structuralLabelsIn(PROSE_BEAT);
  assert('LIVE: the prose road map is reported as UNLABELLED — the parser is not at fault',
    p1.road === false);
  assert('LIVE: the prose three-beat is reported as UNLABELLED too', p2.beat === false);
  assert('LIVE: and the real parsers agree — both return null',
    parseRoadMap(PROSE_ROADS) === null && parseThreeBeatShift(PROSE_BEAT) === null);

  // CORRECTED AFTER MEASUREMENT. The first version of this claimed case-sensitivity was what
  // kept «Βρήκες» out, and a mutation making the pattern /i proved otherwise: JavaScript's
  // case-insensitive matching does not equate ή with Η, nor ς with Σ, so accented Greek prose
  // never matched either way. What actually does the work is the COLON AND LINE ANCHOR — a label
  // is a line that starts with the word and is followed by a colon. Case-sensitivity stays as a
  // second, cheaper guard. The fixture below is the one that discriminates.
  assert('LIVE: «Βρήκες» in ordinary prose does NOT count as a label', p2.beat === false);
  assert('ANCHOR: the label word inside a sentence, with no colon, is not a label',
    structuralLabelsIn('Στο ΒΡΗΚΕΣ αναφέρθηκες σε κάτι άλλο').beat === false);
  assert('ANCHOR: and mid-line, even followed by a colon, is not a label',
    structuralLabelsIn('μίλησες για ΒΡΗΚΕΣ: κάτι').beat === false);
  assert('ANCHOR: at the start of its own line with a colon, it IS a label',
    structuralLabelsIn('ΒΡΗΚΕΣ: κάτι').beat === true);

  // ── Correctly formatted output is recognised ────────────────────────────
  assert('FORMAT: a properly labelled three-beat is recognised',
    structuralLabelsIn(LABELLED_BEAT).beat === true);
  assert('FORMAT: a properly labelled road map is recognised',
    structuralLabelsIn(LABELLED_ROADS).road === true);
  assert('FORMAT: and both really parse, so the labels mean what they claim',
    parseThreeBeatShift(LABELLED_BEAT) !== null && parseRoadMap(LABELLED_ROADS) !== null);
  assert('FORMAT: asterisks around the labels do not hide them',
    structuralLabelsIn('**ΗΡΘΕΣ ΜΕ:** α\n**ΒΡΗΚΕΣ:** β\n**ΦΕΥΓΕΙΣ ΜΕ:** γ').beat === true);

  // ── The two axes are independent ────────────────────────────────────────
  assert('The road and beat readings are independent',
    structuralLabelsIn(LABELLED_ROADS).beat === false &&
    structuralLabelsIn(LABELLED_BEAT).road === false);
  let threw = false;
  try { for (const j of [null, undefined, 0, {}, []]) structuralLabelsIn(j); } catch (e) { threw = true; }
  assert('Junk never throws', !threw);
  assert('Junk reads as no labels',
    [null, undefined, '', 0, {}].every(j => {
      const r = structuralLabelsIn(j); return r.road === false && r.beat === false; }));

  // ── KNOWN LIMIT, pinned ─────────────────────────────────────────────────
  // These four booleans rule the parser in or out. They do not, and are not meant to, detect
  // structure written as prose. A reader of the numbers must know that "no labels" covers BOTH
  // "nothing was produced" and "it was produced in prose".
  assert('KNOWN LIMIT: prose roads and an empty reply are indistinguishable to this measurement',
    structuralLabelsIn(PROSE_ROADS).road === structuralLabelsIn('Τι σε σταματά;').road);
}

// ── Telemetry carries all four, as counts ──────────────────────────────────
const EFFECT = (() => {
  const a = CODE.indexOf('// TELEMETRY — one measurement per ending');
  if (a < 0) return '';
  const b = CODE.indexOf('}, [sessionEnded]);', a);
  return b < 0 ? '' : CODE.slice(a, b);
})();
assert('TELEMETRY: the ending effect was located', EFFECT.length > 200);
for (const f of ['roadMap', 'roadLabels', 'beatParsed', 'beatLabels']) {
  assert('TELEMETRY: session_completed carries ' + f, new RegExp('\\b' + f + '\\s*:').test(EFFECT));
}
assert('TELEMETRY: the label readings come from the shared function, not a second copy of the regex',
  /structuralLabelsIn\(/.test(EFFECT));
assert('TELEMETRY: the parse readings come from the real parsers',
  /parseRoadMap\(/.test(EFFECT) && /parseThreeBeatShift\(/.test(EFFECT));
assert('TELEMETRY: still counts only — no message text is handed to the recorder',
  (() => {
    const i = EFFECT.indexOf('recordTelemetry(');
    if (i < 0) return false;
    const args = EFFECT.slice(i, EFFECT.indexOf('});', i));
    return !/\.content|\btext\b|messages\[/.test(args);
  })());

// ── LOCKSTEP: one source of truth for the road pattern ────────────────────
// The shadow trace had its own copy. Two patterns for one question drift, and this repo has
// paid for that before (parseRoadMap and its display strip are kept character-identical for
// exactly this reason).
assert('LOCKSTEP: the shadow trace uses the shared function instead of its own regex',
  /_traceHasLabels\s*=\s*structuralLabelsIn\(/.test(CODE));
assert('LOCKSTEP: only one place still spells out the road label pattern',
  (CODE.match(/ΔΡ\[ΟΌ\]ΜΟΣ/g) || []).length === 1);

assert('PASSIVE: none of this is wired into the prompt',
  !/structuralLabelsIn|beatLabels|roadLabels/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
