// AURA — OUTPUT TRIPWIRE GUARD
//
// WHY THIS FILE EXISTS: looksLikeAdviceCascade was added to src/App.jsx in commit 9e84e6f — the
// same commit that wrote ADR-003 and named it the third code-enforced pillar — and was removed in
// b4867b8, a file-restore that reapplied an App.jsx predating it. That restore was verified with
// 315 passing tests. None of them touched this function IN src/App.jsx: a copy survived in
// tests/aura_pure.js (a frozen mirror that RUN_ALL.bat never runs), and tests/test_baseline.js
// went on testing THAT copy and passing. So for months ADR-003 described a live observational
// detector while zero observations were produced, and a green test with the right name pointed at
// the wrong file.
//
// That is the failure this guard exists to prevent, and it is a different failure from "the
// function is wrong". The assertions below are deliberately about PRESENCE AND WIRING in
// src/App.jsx — defined here, called here, reachable from the tripwire, counted — because the
// behaviour was never what broke.
//
// STRUCTURAL PARSING, NOT LEXICAL: same convention as test_entry_flow.js / test_detector_timing.js
// — plain string/indexOf over the raw source, no AST parser available in this environment. The
// PROMPT/CODE split is copied from those files exactly, so nothing here can accidentally match
// text living inside the prompt template literal.

const fs = require('fs');
const path = require('path');

const raw = (() => {
  const candidates = ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx'];
  for (const c of candidates) {
    const p = path.join(__dirname, c);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');
})();

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

// ── PROMPT / CODE split ──
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
if (_i < 0) throw new Error('Could not find "const AURA_CORE_PERSONALITY" — file shape changed, this test needs updating.');
const _s = raw.indexOf('`', _i) + 1;
const _promptEnd = raw.indexOf('`;', _s);
if (_promptEnd < 0) throw new Error('Could not find AURA_CORE_PERSONALITY\'s closing "`;" — file shape changed, this test needs updating.');
const CODE = raw.slice(0, _i) + raw.slice(_promptEnd);

assert('Structural sanity: CODE region is substantial (not an empty/truncated slice)', CODE.length > 100000);

// ── 1. THE PILLAR EXISTS IN THE RIGHT FILE ──
// This is the assertion whose absence let the detector disappear silently. It deliberately checks
// src/App.jsx and nothing else — a copy in tests/aura_pure.js must never be able to satisfy it.
assert('looksLikeAdviceCascade is DEFINED in src/App.jsx',
  (CODE.match(/function looksLikeAdviceCascade\(/g) || []).length === 1);

const callCount = (CODE.match(/looksLikeAdviceCascade\(/g) || []).length - 1; // minus the definition
assert('looksLikeAdviceCascade is CALLED in src/App.jsx, exactly once (defined-but-unused is the same failure)',
  callCount === 1);

// ── 2. IT IS WIRED INTO THE TRIPWIRE, NOT LEFT FLOATING ──
const tripStart = CODE.indexOf('function detectOutputViolation(');
assert('detectOutputViolation exists', tripStart >= 0);
const tripEnd = CODE.indexOf('\n}', tripStart);
const tripBody = tripStart >= 0 ? CODE.slice(tripStart, tripEnd) : '';

assert('The call sits INSIDE detectOutputViolation',
  tripBody.includes('looksLikeAdviceCascade(text)'));
assert('It yields the ADVICE_CASCADE signature',
  tripBody.includes('return "ADVICE_CASCADE"'));

// Called on the raw `text`, never on the accent-stripped `n`: the patterns carry Greek accents and
// would silently never match the normalised string — a false negative with no symptom.
assert('Called on raw `text`, not on the accent-stripped `n` (would silently never match)',
  tripBody.includes('looksLikeAdviceCascade(text)') && !tripBody.includes('looksLikeAdviceCascade(n)'));

// ── 3. ORDER — measured, not stylistic ──
// ADVICE fires on the same imperative verbs; ROAD_MAP_MISSING fires on the same numbered/bulleted
// lines. detectOutputViolation returns ONE string, so placing the cascade earlier would swallow
// both: ADVICE would quietly stop being reported for imperative replies, and ROAD_MAP_MISSING —
// whose whole detection is "3+ numbered option lines where a map was due" — would never be
// returned again, blinding the road-map diagnostic.
const iAdvice   = tripBody.indexOf('return "ADVICE"');
const iRoadMap  = tripBody.indexOf('return "ROAD_MAP_MISSING"');
const iCascade  = tripBody.indexOf('return "ADVICE_CASCADE"');
assert('ADVICE_CASCADE is checked AFTER ADVICE (otherwise it swallows the imperative counter)',
  iAdvice >= 0 && iCascade > iAdvice);
assert('ADVICE_CASCADE is checked AFTER ROAD_MAP_MISSING (otherwise the road-map diagnostic goes blind)',
  iRoadMap >= 0 && iCascade > iRoadMap);

// ── 4. PASSIVE — ADR-003's review condition is not met, so this must not gate anything ──
// The tripwire's result is assigned to `viol`, and `viol` may only reach a console warning and the
// per-session counter. If it ever reached displayText, a return, or a state setter, this stopped
// being an observer.
const violIdx = CODE.indexOf('const viol = detectOutputViolation(');
assert('The tripwire result is captured in `viol`', violIdx >= 0);
const violWindow = violIdx >= 0 ? CODE.slice(violIdx, violIdx + 700) : '';
assert('PASSIVE: `viol` only reaches a console warning and the counter',
  /violationCounts\.current\[viol\]/.test(violWindow) && /console\.warn\('\[AURA VIOLATION\]'/.test(violWindow));
assert('PASSIVE: `viol` never touches displayText, never returns, never sets state',
  !/viol[\s\S]{0,400}?(displayText\s*=|return;|setMessages|setLoading)/.test(violWindow.replace(/console\.warn[\s\S]*?\);/g, '')));
assert('PASSIVE: the whole observation block is wrapped in try/catch so it can never break a turn',
  violWindow.includes('catch (e) { /* observation must never affect the session */ }'));

// ── 5. BEHAVIOUR — only what it uniquely adds, and the limit that remains ──
function extract(name) { const s = raw.indexOf('function ' + name + '('); return raw.slice(s, raw.indexOf('\n}', s) + 2); }
eval(extract('looksLikeAdviceCascade'));
eval(extract('parseRoadMap'));
eval(extract('detectOutputViolation'));

assert('A numbered list of options with no imperative → ADVICE_CASCADE (this is the gap it fills)',
  detectOutputViolation('Υπάρχουν τρεις κατηγορίες: 1. Online πλατφόρμες. 2. Bootcamps. 3. ΔΥΠΑ.', {}) === 'ADVICE_CASCADE');
assert('An imperative reply still reports ADVICE, unchanged by this addition',
  detectOutputViolation('Πήγαινε στην τράπεζά σου και ρώτα απλά.', {}) === 'ADVICE');
assert('An evaluation still reports EVALUATION, unchanged',
  detectOutputViolation('Καλή επιλογή αυτό που σκέφτεσαι.', {}) === 'EVALUATION');
assert('3+ numbered options while a map was due still reports ROAD_MAP_MISSING, not the cascade',
  detectOutputViolation('Μερικές κατευθύνσεις:\n1. Να μείνεις\n2. Να ζητήσεις μείωση\n3. Να φύγεις', { roadDiscoveryDue: true }) === 'ROAD_MAP_MISSING');
assert('A normal AURA question is not flagged',
  detectOutputViolation('Τι σε κρατάει περισσότερο σε αυτό;', {}) === null);

// HONEST LIMITATION, measured and recorded rather than assumed away: the advice-cascade form that
// actually appeared in a real transcript is a comma-separated list in running prose, carrying no
// number, no bullet and no imperative. Neither this detector nor ADVICE catches it. Restoring the
// pillar does not close that gap, and this assertion exists so nobody later believes it did.
assert('KNOWN GAP (documented): a comma-separated prose list of options is caught by NEITHER signature',
  detectOutputViolation('Διδασκαλία σε ΕΠΑΛ/ΙΕΚ ως ωρομίσθιος, φροντιστήρια νοσηλευτικής, παροχή υπηρεσιών φροντίδας ιδιωτικά, online εκπαίδευση.', {}) === null);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n⚠ Αν έπεσε ο έλεγχος ΥΠΑΡΞΗΣ ή ΚΛΗΣΗΣ: ο τρίτος πυλώνας του ADR-003 χάθηκε ξανά.');
  console.log('  Συνέβη ήδη μία φορά, σιωπηλά, σε file-restore (b4867b8). Μην «διορθώσεις» το test —');
  console.log('  επανάφερε τη συνάρτηση και την κλήση της στο src/App.jsx.');
}
process.exit(failed > 0 ? 1 : 0);
