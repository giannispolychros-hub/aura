// AURA — WHITESPACE AT THE SAFETY DETECTORS' INPUT (John, 14/11/2026: one safety package, release-candidate c85259c). Only src/App.jsx
// and tests change; the prompt (7e52268becda7360) and api/ do not. A line break, a tab, a non-breaking space or a run of spaces in the
// user's message is read by the two safety detectors — detectSafetySignal (one's own harm, and so classifyCrisisTier, the crisis line,
// lockedSendSafetyLine) and detectsDangerFromOther (danger from another person) — as one plain space, ONLY at their input. What is shown,
// kept or sent to the model is not touched. No phrase and no rule of the detectors changes; what they caught before is still caught.
// NO CRISIS PHRASE IS WRITTEN IN THIS FILE: the phrases are the benchmark's own safety scenarios S1–S9 (benchmark/scenarios.json), read
// by code at run time and named here only by their code; the labels below never print a phrase. Everything else here is everyday text.
//  (Α) the scenarios load: S1, S3–S9 → a crisis as written (their tier is taken as written); S2 → danger from another person
//  (Β) S1, S3–S9: a line break (and \r\n, two line breaks, a tab, a non-breaking space, three spaces, U+2028) in place of EACH space,
//      one at a time, and in place of every space at once → still a crisis, of the same tier
//  (Γ) S2: the same variants → the same reading (self / child)
//  (Δ) the line the app writes at once (lockedSendSafetyLine) is the same for every line-break variant of S1–S9
//  (Ε) the deliberate gap stays as it was: S5–S9 followed by more words and no stop are not read, with or without line breaks
//  (Ζ) no false alarm: the benchmark's everyday messages (B scenarios) and everyday lines, with line breaks anywhere, two messages
//      joined by a line break → the same result as without (no crisis, no danger)
//  (Η) the detectors still return only a label (never text); no lookbehind; api/aura.js and the prompt fingerprint unchanged
// UPDATED (19/11/2026, «συνομιλία v1», Package 1, John): the prompt changed on purpose in exactly three lines (912, 918, 927; auratests/package1_undo.json) — every prompt fingerprint below moved from b5f303cc9405aa21 to 7e52268becda7360 (313386 characters, was 311822), and api/aura.js carries the new core fingerprint (sha256 675564a7985438c8…, was e791b194…). Nothing else of the prompt moved: auratests/test_package1_prompt_1911.js (7.2)–(7.3).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
function extract(name) { const s = CODE.indexOf('function ' + name + '('); const e = CODE.indexOf('\n}', s) + 2; return s < 0 ? '' : CODE.slice(s, e); }
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);

let L = null;
try {
  const helplines = CODE.slice(CODE.indexOf('const HELPLINES = ['), CODE.indexOf('\n];', CODE.indexOf('const HELPLINES = [')) + 3);
  L = new Function(helplines + '\n' + ['detectSafetySignal', 'classifyCrisisTier', 'buildCrisisLine', 'detectsDangerFromOther', 'buildDangerLine',
    'lockedSendSafetyLine'].map(extract).join('\n') +
    '\nreturn { crisis: detectSafetySignal, tier: classifyCrisisTier, danger: detectsDangerFromOther, locked: lockedSendSafetyLine };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
let BL = null, D = null;
try { BL = require(path.join(ROOT, 'scripts', 'e2e_bench_lib.cjs')); D = BL.loadBench(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
assert('(Α) the detectors, the line builders and the benchmark load', !!L && Object.values(L).every(f => typeof f === 'function') && !!D);
if (!L || !D) { console.log(passed + ' passed, ' + failed + ' failed'); process.exit(1); }

const crisis = t => L.crisis(t) === 'CRISIS';
const dangerOf = t => JSON.stringify(L.danger(t));
// the scenario's own crisis message (the benchmark's mark), and S2's danger message (its first)
const SAFE = {};
for (const s of D.safety.scenarios) {
  const p = BL.benchPersona(s, 'safety');
  const at = s.id === 'S2' ? '1' : Object.keys(p.forcedMarks || {})[0];
  SAFE[s.id] = at ? p.forced[at] : '';
}
const CRISIS_IDS = ['S1', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];
const SEPS = [['line break', '\n'], ['\\r\\n', '\r\n'], ['two line breaks', '\n\n'], ['space, line break, space', ' \n '], ['tab', '\t'],
  ['non-breaking space', ' '], ['three spaces', '   '], ['U+2028', ' ']];
const spaces = t => [...t.matchAll(/ /g)].map(m => m.index);
const at = (t, i, sep) => t.slice(0, i) + sep + t.slice(i + 1);

// ── (Α) the scenarios, as written ───────────────────────────────────────────────────────────────────────────
const TIER = {};
for (const id of CRISIS_IDS) {
  TIER[id] = L.tier(SAFE[id]);
  assert('(Α) ' + id + ' as written: a crisis, tier ' + TIER[id] + ', with ' + spaces(SAFE[id]).length + ' spaces', !!SAFE[id] && crisis(SAFE[id]) && /^[AB]$/.test(TIER[id]) && spaces(SAFE[id]).length > 0);
}
const S2 = SAFE.S2, S2_READ = dangerOf(S2);
assert('(Α) S2 as written: danger from another person (' + S2_READ + ')', !!S2 && L.danger(S2) !== null && spaces(S2).length > 0);

// ── (Β) S1, S3–S9: every space, one at a time, and all at once ─────────────────────────────────────────────
for (const id of CRISIS_IDS) {
  const t = SAFE[id], pos = spaces(t);
  for (const [name, sep] of SEPS) {
    const miss = pos.filter(i => { const v = at(t, i, sep); return !crisis(v) || L.tier(v) !== TIER[id]; }).length;
    assert('(Β) ' + id + ', a ' + name + ' in place of each of its ' + pos.length + ' spaces: a crisis of tier ' + TIER[id] + ' every time (' + miss + ' missed)', miss === 0);
  }
  const each = t.replace(/ /g, '\n');
  assert('(Β) ' + id + ', every word on its own line: a crisis of tier ' + TIER[id], crisis(each) && L.tier(each) === TIER[id]);
}

// ── (Γ) S2: the same reading ────────────────────────────────────────────────────────────────────────────────
for (const [name, sep] of SEPS) {
  const pos = spaces(S2), miss = pos.filter(i => dangerOf(at(S2, i, sep)) !== S2_READ).length;
  assert('(Γ) S2, a ' + name + ' in place of each of its ' + pos.length + ' spaces: the same reading every time (' + miss + ' different)', miss === 0);
}
assert('(Γ) S2, every word on its own line: the same reading', dangerOf(S2.replace(/ /g, '\n')) === S2_READ);

// ── (Δ) the line the app writes at once ─────────────────────────────────────────────────────────────────────
for (const id of CRISIS_IDS.concat('S2')) {
  const t = SAFE[id], line = L.locked(t, false, []);
  const diff = spaces(t).filter(i => L.locked(at(t, i, '\n'), false, []) !== line).length + (L.locked(t.replace(/ /g, '\n'), false, []) !== line ? 1 : 0);
  assert('(Δ) ' + id + ': the app\'s line (with its number) is the same with a line break at each space and with every word on its own line (' + diff + ' different)',
    /\d{3,5}/.test(line) && diff === 0);
}

// ── (Ε) the deliberate gap stays as it was ──────────────────────────────────────────────────────────────────
for (const id of ['S5', 'S6', 'S7', 'S8', 'S9']) {
  const t = SAFE[id].replace(/[.!;?…]+\s*$/, '') + ' καμιά φορά';
  const read = spaces(t).filter(i => crisis(at(t, i, '\n'))).length;
  assert('(Ε) ' + id + ' followed by more words with no stop: not read, as before (the clause-end rule, test_passive_ideation_2410.js) — also with a line break at any space (' + read + ' read)',
    !crisis(t) && read === 0 && !crisis(t.replace(/ /g, '\n')));
}

// ── (Ζ) no false alarm ───────────────────────────────────────────────────────────────────────────────────────
const everyday = [];
for (const s of D.scenarios) { const f = BL.benchPersona(s, 'main').forced; everyday.push(Object.keys(f).sort((a, b) => a - b).map(k => f[k]).filter(x => typeof x === 'string' && x.trim())); }
const flat = everyday.flat();
const alarm = t => crisis(t) || L.danger(t) !== null;
assert('(Ζ) the benchmark\'s ' + flat.length + ' everyday messages, as written: no alarm (as before)', flat.length >= 30 && flat.filter(alarm).length === 0);
{
  let n = 0, changed = 0;
  for (const t of flat) for (const i of spaces(t)) for (const sep of ['\n', ' \n ', '\r\n']) { n++; const v = at(t, i, sep); if (L.crisis(v) !== L.crisis(t) || alarm(v)) changed++; }
  assert('(Ζ) the same messages with a line break at each space (' + n + ' variants): the same result as without, no alarm (' + changed + ')', n > 300 && changed === 0);
  const each = flat.filter(t => { const v = t.replace(/ /g, '\n'); return L.crisis(v) !== L.crisis(t) || alarm(v); }).length;
  assert('(Ζ) the same messages, every word on its own line: no alarm (' + each + ')', each === 0);
}
{
  let n = 0, bad = 0;
  for (const msgs of everyday) for (let k = 0; k + 1 < msgs.length; k++) for (const v of [msgs[k] + '\n' + msgs[k + 1], msgs[k].replace(/[.!;?…]+\s*$/, '') + '\n' + msgs[k + 1]]) { n++; if (alarm(v)) bad++; }
  assert('(Ζ) two messages of the same scenario on two lines, with and without the stop of the first (' + n + '): no alarm (' + bad + ')', n > 20 && bad === 0);
}
const LINES = ['Με πιέζει η δουλειά\nκαι δεν ξέρω από πού να ξεκινήσω.', 'Θέλω να αλλάξω δουλειά\nαλλά φοβάμαι το ρίσκο.',
  'Ο προϊστάμενος φωνάζει\nσε όλους στη σύσκεψη.', 'Δεν ξέρω\nίσως αύριο.', 'Ναι\nαλλά όχι τώρα.', 'Το παιδί παίζει μπάλα\nστο γήπεδο κάθε Σάββατο.',
  'Ο αδερφός μου\nμε βοηθάει με τη μετακόμιση.', 'Η μάνα μου\nμε πήρε τηλέφωνο\nκαι μιλήσαμε για τις διακοπές.', 'Δεν έχω χρόνο\r\nγια τίποτα αυτή την εβδομάδα.',
  'Τελειώνω τη δουλειά\tκαι φεύγω.', 'Ο φίλος μου με πήρε τηλέφωνο\nκαι γελάσαμε.'];
assert('(Ζ) ' + LINES.length + ' everyday lines with line breaks, tabs, a non-breaking space: no alarm', LINES.filter(alarm).length === 0);

// ── (Η) only a label comes out; the rest unchanged ─────────────────────────────────────────────────────────────
{
  const outs = new Set(), dangers = new Set();
  for (const id of CRISIS_IDS.concat('S2')) for (const i of spaces(SAFE[id])) { const v = at(SAFE[id], i, '\n'); outs.add(String(L.crisis(v))); dangers.add(L.danger(v) === null ? 'null' : Object.keys(L.danger(v)).sort().join(',')); }
  for (const t of flat) outs.add(String(L.crisis(t.replace(/ /g, '\n'))));
  assert('(Η) detectSafetySignal returns only CRISIS / DISTRESS / null, detectsDangerFromOther only null or { self, child } — a label, never text',
    [...outs].every(x => ['CRISIS', 'DISTRESS', 'null'].includes(x)) && [...dangers].every(x => ['null', 'child,self'].includes(x)));
}
assert('(Η) no lookbehind in the two detectors (old iPhones)', !/\(\?<[=!]/.test(extract('detectSafetySignal') + extract('detectsDangerFromOther')));
assert('(Η) api/aura.js unchanged (675564a7985438c8)', h(fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8')) === '675564a7985438c8');
assert('(Η) the prompt fingerprint is still 7e52268becda7360', crypto.createHash('sha256').update(raw.slice(cs, ce)).digest('hex').slice(0, 16) === '7e52268becda7360');

// ── (Θ) nothing else moved: the package's two changes, new → old, exactly as written; once taken out, the whole file must be
// release-candidate c85259c's, byte for byte. The «unchanged» pins of the other suites that name these two detectors, or the file
// outside a cut, move to the new values on this proof (as each earlier approved change of the detectors did).
{
  const UNDO = [
    ['  // WHITE SPACE AT THE INPUT (John, 14/11/2026, a safety package): the message is ALSO tried with every run of white space (a line break,\n' +
     '  // a tab, a non-breaking space, several spaces) as one plain space, as written and made plain. Only here, at the detector\'s input: what\n' +
     '  // is shown, kept or sent to the model is not touched. It ADDS NO PHRASE: the forms tried before are still tried. See\n' +
     '  // auratests/test_detector_spaces_1411.js.\n  const spaced = String(text).replace(/\\s+/g, " ");\n', ''],
    ['const views = [...new Set([String(text), plain(String(text)), spaced, plain(spaced)])]', 'const views = [...new Set([String(text), plain(String(text))])]'],
    ['  // WHITE SPACE AT THE INPUT (John, 14/11/2026, a safety package): the sentences are ALSO read with every run of white space (a line\n' +
     '  // break, a tab, a non-breaking space, several spaces) as one plain space. Only here, at the detector\'s input: what is shown, kept or\n' +
     '  // sent to the model is not touched. The sentences read before are still read. See auratests/test_detector_spaces_1411.js.\n' +
     '  const parts = new Set(plain.split(/[.!;?\\n…]+/));\n  for (const part of plain.replace(/\\s+/g, " ").split(/[.!;?\\n…]+/)) parts.add(part);\n' +
     '  let self = false, child = false;\n  for (const part of parts) {', '  let self = false, child = false;\n  for (const part of plain.split(/[.!;?\\n…]+/)) {'],
  ];
  const present = UNDO.filter(([nw]) => raw.split(nw).length === 2).length;
  let back = raw; for (const [nw, old] of UNDO) back = back.split(nw).join(old);
  assert('(Θ) each of the ' + UNDO.length + ' pieces of this package is in src/App.jsx exactly once, all inside detectSafetySignal or detectsDangerFromOther',
    present === UNDO.length && UNDO.every(([nw]) => (extract('detectSafetySignal') + extract('detectsDangerFromOther')).includes(nw.split('\n').filter(Boolean).slice(-1)[0])));
  assert('(Θ) … and with them taken out, src/App.jsx is byte for byte the file of release-candidate c85259c (sha256 f6092fe6…) — nothing else changed',
    // UPDATED (27/11/2026, John's explicit order, ADR «27 Νοεμβρίου»): the DISTRESS word «κρίση» of detectSafetySignal became four patterns (a crisis the person is in or has, or one relative of a closed list has) — proved first by auratests/test_krisi_narrowing_2711.js; no other function or line moved. Only the value below moved (58fc2382→1348b559×1); the check itself is the same.
    // UPDATED (27/11/2026, John's explicit order, ADR «27 Νοεμβρίου»): the heaviness latch now leaves a record («gravity_latched», numbers only): a helper after mergeRiskKind, a ref, and two call sites in the component — none of the functions or lines this check covers moved (ADR «27 Νοεμβρίου» (2)). Only the value below moved (1348b559→6922aacf×1); the check itself is the same.
    // UPDATED (27/11/2026, John's explicit order, ADR «27 Νοεμβρίου»): the counter of requests for advice (detectsExplicitProductionRequest) got a block that sees «τι να κάνω», «πώς να το κάνω», «τι μπορώ να κάνω» — inside that one function; no other function or line this check covers moved (ADR «27 Νοεμβρίου» (3)). Only the value below moved (6922aacf→cb278cf4×1); the check itself is the same.
    present === UNDO.length && crypto.createHash('sha256').update(back).digest('hex') === 'cb278cf46aaef4e1ba8c04f5c5421c93a1430b3489dbd241bb8dfc86e793b2bc' /* UPDATED (24/11/2026, Β, John's order: only this value moved — the one change of the item (four fixed texts of the first screens: the 4th line of the old first screen, the second sentence of the AI line of the entry screen, and two new lines under the start button — the privacy line and the microphone line; texts only, no logic, no state) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 36 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as before) */ /* UPDATED (23/11/2026, Α, John's order: only this value moved — the one change of the item (the closing after the word of Stage A comes from CODE: the pure functions stageAEchoLine and stageAClosureFromCode, the Κ4 recognition cards written ONCE as armRecognitionCards inside deliverFinalClosure — moved, not removed — and the branch from code, the two new arguments of the caller; code only) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 33 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as before) */ /* UPDATED (22/11/2026, Ε, John's order: only this value moved — the one change of the item (a long sentence of the user is shown cut at the last whole word instead of being left out of the root question's list: rootPickCut, the loop of rootPickSentences, the state that says which items were cut, the effect, the button of the list; code only) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 28 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as before) */ /* UPDATED (22/11/2026, Δ, John's order ⚑4: only this value moved — the one change of the item (STAGE_A_TEXTS.stepWhy: the app's text after «Ναι, αυτό είναι», code only; the old two sentences are replaced by John's new two) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 28 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged) */ /* UPDATED (22/11/2026, Λ1, John's corrections ⚑1–⚑2: only this value moved — the root list's changes lie outside the pieces this test cuts away or takes out: the list at the root question (a60045d), decisions 13–15 and now the new heading block and the writing-box rule (two pure functions, one reference, one effect, the handler of the tap, «Δεν το βρήκα ακόμα», the reset line, the screen without the separate line); this note also covers the two earlier moves of this value in e655c25 and 43ec58e, which carried no note of their own. Proved first: auratests/test_conversation_v1.js (Ω1) — with all 27 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as in 6e4307d) */ /* UPDATED (19/11/2026, «συνομιλία v1», Package 1, John: only this value moved — the package's changes lie outside the pieces this test cuts away or takes out; the prompt's three lines and the api fingerprint are proved in auratests/test_package1_prompt_1911.js (7.2)–(7.3)) */ /* UPDATED (17/11/2026 (β), «συνομιλία v1», commit 9, John: only this value moved — the one change of the commit (rootTextHasSubstance: the closed form also takes «καθόλου», «καλά», «σου»; code only) lies outside the pieces this test takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all the branch's changes taken out src/App.jsx is release-candidate e4b2ae6 byte for byte, and auratests/test_notes_card_1511.js (Ω) — with all changes since 50beff6 taken out it is 50beff6 byte for byte) */ /* UPDATED (17/11/2026, «συνομιλία v1», commit 8, John: only this value moved — the one change of the commit (rootTextHasSubstance: a small closed form, so that «Δεν κατάλαβα την ερώτηση» is not a root; code only) lies outside the pieces this test takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all the branch's changes, this one included, taken out src/App.jsx is release-candidate e4b2ae6 byte for byte, and auratests/test_notes_card_1511.js (Ω) — with all changes since 50beff6 taken out it is 50beff6 byte for byte) */ /* UPDATED (16/11/2026, «ROUND TRACE», John: only this value moved — the changes of the branch conversation-v1 (per-turn notes, code only; the round trace of the ?debug=1 panel: numbers and yes/no for the panel, nothing sent) lie outside this test's cut; proved first: auratests/test_conversation_v1.js (Ω1) — with them taken out src/App.jsx is release-candidate e4b2ae6 byte for byte, and auratests/test_notes_card_1511.js (Ω) — with all changes since 50beff6 taken out it is 50beff6 byte for byte) */);
}

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
