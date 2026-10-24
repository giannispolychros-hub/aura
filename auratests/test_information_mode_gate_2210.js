// AURA — INFORMATION MODE IS NOT SENT ON THE SAFETY PATH, NOR IN STAGE A BEFORE THE ROOT (John, 22/10/2026, ADR «22 Οκτωβρίου (στ)»)
//
// What was seen: the per-turn note [INFORMATION MODE ACTIVE …] («give concise, categorical information … do not ask Socratic
// questions») went out (1) in Stage A before the root, in the requests that carry [FREE PART: ENDS AT ROOT] — «Πες μου τι να κάνω»
// sets it — and with the real model session 83 (run 46) got legal instructions and a decision for the user; (2) on the crisis turn,
// beside STAGE: SAFETY — «no questions» while the crisis reply must ask the risk question.
// John's change, logic only: the note is not sent (α) on the safety path (perTurnSafety: the crisis turn and every turn after the
// crisis line, like the other notes held there) and (β) in Stage A before a confirmed root. The held state is untouched —
// informationModeActive is set and cleared where it was; the detector, the note's text, the prompts, the fingerprints and the api
// guard are unchanged. Everywhere else (the old flow with no crisis, Stage A after the root) the note goes out exactly as before.
// The EXACT text each request carries is checked in the browser (scripts/e2e_stage_a.cjs, section IM); here, the pure part and the wiring.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');

let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const fnSrc = n => {
  const a = raw.indexOf('function ' + n + '(');
  if (a < 0) return '';
  let d = 0, st = false;
  for (let k = raw.indexOf('{', a); k < raw.length; k++) {
    if (raw[k] === '{') { d++; st = true; } else if (raw[k] === '}') { d--; if (st && d === 0) return raw.slice(a, k + 1); }
  }
  return '';
};
const lit = n => { const i = raw.indexOf('const ' + n + ' = `'); const a = raw.indexOf('`', i) + 1; return raw.slice(a, raw.indexOf('`;', a)); };
const _i = raw.indexOf('const AURA_CORE_PERSONALITY = `'), _s = raw.indexOf('`', _i) + 1, _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);

// the change, as written — pinned so that undoing it gives a409a47 back byte for byte (3, below)
const HELPER = [
  '// ADR «22 Οκτωβρίου (στ)» (John, a safety exception (α)): the INFORMATION MODE note («concise information … no Socratic questions»)',
  '// is not sent on the safety path — the crisis turn and every turn after the crisis line, where the crisis reply asks the risk question',
  '// — nor in Stage A before a confirmed root, where it pulled toward advice and a decision for the user (run 46, session 83). The held',
  '// state is untouched: informationModeActive keeps its value; only the note is held. Anywhere else the note goes out as before.',
  'function informationModeNoteDue(active, safetyPath, stageAPreRoot) {',
  '  return active === true && !safetyPath && !stageAPreRoot;',
  '}',
  '',
].join('\n');
const WIRING_NEW = 'const informationModeCtx = informationModeNoteDue(informationModeActive.current, _safetyPath, stageAActive.current && stageARef.current.stats.rootConfirmed !== 1)\n';
const WIRING_OLD = 'const informationModeCtx = informationModeActive.current\n';

// ── 1. The pure part: sent only when the state is held, off the safety path, and not Stage A before the root ─────────────
const src = fnSrc('informationModeNoteDue');
let due = null;
try { due = new Function(src + '\nreturn informationModeNoteDue;')(); } catch (e) { due = null; }
assert('1: informationModeNoteDue exists and is pure (no hook, no ref, no state)', !!due && !/useRef|useState|\.current|setState/.test(src));
const T = [true, false];
let table = true;
const rows = [];
if (due) for (const a of T) for (const sp of T) for (const pr of T) {
  const want = a && !sp && !pr, got = due(a, sp, pr);
  if (got !== want) table = false;
  rows.push(`${a ? 'A' : '-'}${sp ? 'S' : '-'}${pr ? 'P' : '-'}=${got ? 1 : 0}`);
}
assert('1: truth table — only (held, not safety path, not Stage A before the root) sends the note [' + rows.join(' ') + ']', !!due && table);
assert('1 (α): the safety path holds it, in Stage A and in the old flow alike', !!due && due(true, true, false) === false && due(true, true, true) === false);
assert('1 (β): Stage A before the root holds it', !!due && due(true, false, true) === false);
assert('1: the old flow with no crisis, and Stage A after the root, send it as before', !!due && due(true, false, false) === true);
assert('1: never sent when the state is not held (false, undefined, a truthy non-boolean)',
  !!due && [false, undefined, null, 1, 'true'].every(v => due(v, false, false) === false));

// ── 2. The wiring: the same note, now built through the helper, with the safety path of perTurnSafety and the Stage A condition ──
const G = (() => { const a = raw.indexOf('const generateResponse = useCallback(async'), b = raw.indexOf('\n  }, [', a); return a >= 0 && b > a ? raw.slice(a, b) : ''; })();
assert('2: generateResponse found', G.length > 1000);
assert('2: informationModeCtx is built through informationModeNoteDue, with _safetyPath and «Stage A before a confirmed root»',
  /const informationModeCtx = informationModeNoteDue\(informationModeActive\.current, _safetyPath, stageAActive\.current && stageARef\.current\.stats\.rootConfirmed !== 1\)\n\s*\? `\\n\[INFORMATION MODE ACTIVE/.test(G));
assert('2: … and its «before the root» is the same one the escalation cap uses (one definition, not a new one)',
  G.includes('stageAActive.current && stageARef.current.stats.rootConfirmed !== 1 ? 3 : 4'));
assert('2: _safetyPath is perTurnSafety\'s, set before the note is built (the crisis turn and every turn after the crisis line)', (() => {
  const d = G.indexOf('const _turnSafety = perTurnSafety(currentMode, riskSignalKind.current, stageAActive.current && dangerFromOther.current);') /* UPDATED (23/10, Ο5): + the danger latch (danger from another person, test_danger_from_other_2310.js) */;
  const s = G.indexOf('const _crisisTurn = _turnSafety.crisisTurn, _safetyPath = _turnSafety.safetyPath;');
  const n = G.indexOf('const informationModeCtx = ');
  return d > 0 && s > d && n > s;
})());
assert('2: perTurnSafety is unchanged', h(fnSrc('perTurnSafety')) === '42c868d331e2229a'); // UPDATED (23/10, Ο5): perTurnSafety changed on purpose — danger from another person (test_danger_from_other_2310.js).
assert('2: the note is still in the per-turn list and in the collision log — held, not deleted', (() => {
  const arr = (G.match(/const dynamicSuffix = \[([\s\S]*?)\]\.filter\(Boolean\)/) || ['', ''])[1];
  return /demoCtx, informationModeCtx, explicitPauseCtx,/.test(arr) && /goalObstacleStakesCtx, demoCtx, informationModeCtx, explicitPauseCtx,\n/.test(G);
})());

// ── 3. Nothing else moved ─────────────────────────────────────────────────────────────────────────────────────────────────────
const NOTE = (() => { const a = raw.indexOf('const informationModeCtx = '); const s = raw.indexOf('`', a) + 1; return a > 0 ? raw.slice(s, raw.indexOf('`\n        : \'\';', s)) : ''; })();
assert('3: the text of the note is unchanged, word for word', NOTE.length === 1303 && h(NOTE) === '8d0aaac199c50b01');
assert('3: the detector «χωρίς ερωτήσεις» / «πες μου τι να κάνω» (detectsNoQuestionsRequest) is unchanged', h(fnSrc('detectsNoQuestionsRequest')) === '0dcfcc7bf50b5d99');
assert('3: the held state is set and cleared where it was — after the reply, in First-WHY, and at a new session only',
  (G.match(/if \(!informationModeActive\.current && detectsNoQuestionsRequest\(lastUserMsg\)\) \{\n\s*informationModeActive\.current = true;/g) || []).length === 1 &&
  (raw.match(/if \(!informationModeActive\.current && detectsNoQuestionsRequest\(_u\)\) informationModeActive\.current = true;/g) || []).length === 1 &&
  (raw.match(/informationModeActive\.current = false;/g) || []).length === 1 &&
  (raw.match(/informationModeActive\.current = true/g) || []).length === 2);
assert('3: … and it still holds the method-failure note back, as before', /if \(!informationModeActive\.current && lastUserMsgForMethodFailure && detectsMethodFailureSignal\(lastUserMsgForMethodFailure\.content\)\) \{/.test(G));
// UPDATED (23/10, Π3, branch p3-prompt — John): the precedence clauses in lines 35, 37, 39, 40, 41, 42, the organisation names out of
// those lines, the examples 35β / 37β, and (β) the ΦΩΝΗ (4) example in a form with no gender. Undone first — each piece must be there exactly as many times as it was put in — so what is
// left must be the prompt before Π3 byte for byte.
const P3_LONG = 'PRECEDENCE (this rule yields; nothing is added to it): SAFETY (MASTER PRIORITY RULE, step 1) comes first; then the content limit — no facts about law, money or health, and no technique for health, mental health, sleep or food (what a law, a court, a tax, a loan, a treatment or a dose does is not said; saying plainly that this is a question for a lawyer, an accountant or a doctor IS allowed; an organisation is named only if the user wrote its name; a help line only from the app\'s own table, never another number or name); then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. Where any of these conflicts with this rule, it wins and this rule does not apply. ';
const P3_SHORT = 'PRECEDENCE (as in PROACTIVE RESOURCE POINTER above — this rule yields): SAFETY, then the content limit (no facts about law, money or health; the kind of professional may be named; an organisation only if the user wrote its name; a help line only from the app\'s own table), then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. ';
const P3_TEXT = [
  ['before AURA mentioned that free smoking-cessation clinics exist;', 'before AURA mentioned that free ΕΣΥ smoking-cessation clinics exist;'],
  ["a founder didn't know one-time-payment platforms existed as a category", "a founder didn't know one-time-payment platforms like Gumroad existed as a category"],
  ['(e.g. "δωρεάν ιατρεία διακοπής καπνίσματος")', '(e.g. "σταδιακή μείωση, απότομη διακοπή, υποκατάστατα, ιατρεία διακοπής, φαρμακευτική υποστήριξη" or "δωρεάν ιατρεία διακοπής καπνίσματος στο ΕΣΥ")'],
  ['Example: "Πόσο κρατάει συνήθως ένα μεταπτυχιακό;" → answer it.', 'Example: "Πόσο κοστίζει περίπου ένα ταξίδι στην Ιαπωνία;" → answer it.'],
  ['naming the kind of professional who knows this, categorically, is not deciding anything', 'naming that ΕΣΠΑ and ΔΥΠΑ exist, categorically, is not deciding anything'],
  ['after being told two organisations exist): Name the kind of professional who knows it (e.g. "δικηγόρος", "λογιστής", "γιατρός"); an organisation only if the user wrote its name.',
    'after being told ΕΣΠΑ/ΔΥΠΑ exist): naming the specific OFFICIAL ORGANIZATION (e.g. "ΔΥΠΑ", "δες dypa.gov.gr") is safe and sufficient — organization names don\'t go stale.'],
  ['When a source is asked for or genuinely essential, name the kind of professional plainly,', 'When a source is asked for or genuinely essential, name the organization plainly,'],
  ['(e.g. όταν ο χρήστης γράφει "τα κουβαλάω όλα εγώ εδώ και καιρό": «Όλα σε σένα, εδώ και καιρό. Δεν είναι λίγο.»)', '(e.g. όταν ο χρήστης γράφει "τα κουβαλάω μόνη μου εδώ και καιρό": «Μόνη σου, εδώ και καιρό. Δεν είναι λίγο.»)']];
// UPDATED (24/10, Π3, tests only): the six clauses of (α) are taken out by their place, each exactly once, not by a count over the whole
// prompt — so a later Π3 edit can add a clause of its own. A clause left anywhere else still fails the comparison below.
const P3_CLAUSES = [['it should not take user frustration to say this): ', P3_LONG], ['a real mistake caught and corrected here): ', P3_SHORT],
  ['territory below, not this one): ', P3_SHORT], ['a shift in conversation priority): ', P3_SHORT], ['however revealing): ', P3_SHORT],
  ['two organisations exist): ', P3_SHORT]];
// Each later Π3 commit puts its own undo pairs in its own slot below (unshift: the newest edit is undone first), so that each commit
// can be reverted on its own.
// Π3 (γ):
P3_TEXT.unshift(['FACT: direct knowledge → answer immediately. ' + P3_SHORT.trimEnd(), 'FACT: direct knowledge → answer immediately.']); // (γ) line 315
// Π3 (δ):
// Π3 (ε):
// Π3 (στ):
const undoP3 = p => P3_TEXT.reduce((x, [now, before]) => (x.split(now).length === 2 ? x.replace(now, before) : 'MISSING ' + now),
  P3_CLAUSES.reduce((x, [at, cl]) => (x.split(at + cl).length === 2 ? x.replace(at + cl, at) : 'MISSING the clause after ' + at), String(p || '')));
assert('3: the fixed prompt is a409a47\'s, byte for byte, apart from Π3', h(undoP3(PROMPT)) === 'b5f303cc9405aa21');
assert('3: the crisis prompt, the closing prompt and the honest-uncertainty rule are unchanged',
  h(lit('SYSTEM_SUPPORTIVE')) === 'c7815b96d83ebae8' && h(lit('SYSTEM_TERMINATION')) === 'd5a77ca926f9490b' && h(lit('HONEST_UNCERTAINTY_RULE')) === '80b2ffd69933aee9');
// UPDATED (23/10, Π3, branch p3-prompt): the generated fingerprints follow the prompt (kept in step by test_api_prompt_guard.js); outside
// that block the file is a409a47's, byte for byte — the guard
assert('3: api/aura.js outside its generated fingerprint block is a409a47\'s, byte for byte — the guard', (() => {
  const b = api.indexOf('// BEGIN PROMPT FINGERPRINTS'), e = api.indexOf('// END PROMPT FINGERPRINTS');
  return b > 0 && e > b && h(api.slice(0, b) + api.slice(api.indexOf('\n', e))) === '70ebe4ff38cc98f3';
})());
assert('3: the helper is in the file once, outside the prompt, right after perTurnSafety',
  raw.split(HELPER).length === 2 && raw.indexOf(HELPER) > raw.indexOf(fnSrc('perTurnSafety')) && raw.indexOf(HELPER) - (raw.indexOf(fnSrc('perTurnSafety')) + fnSrc('perTurnSafety').length) === 1 &&
  !PROMPT.includes('informationModeNoteDue'));
// UPDATED (22/10, old iPhones Γ3 and after): at 6b3ddae this pinned the whole file — undo the two edits and App.jsx was a409a47's
// (b676bb01a68c2bac): the change moved nothing else. Since then the file moves on purpose elsewhere (lookBehind, each change with its
// own tests), so the two edits are checked here as the only trace of the change: in the file once each, and nothing of it left when undone.
assert('3: the two edits are the whole change — each once in the file, and undone nothing of informationModeNoteDue is left',
  raw.split(WIRING_NEW).length === 2 && raw.split(HELPER).length === 2 && !raw.replace(HELPER, '').replace(WIRING_NEW, WIRING_OLD).includes('informationModeNoteDue'));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
