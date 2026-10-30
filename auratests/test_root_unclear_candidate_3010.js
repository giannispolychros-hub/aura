// AURA — A PASSIVE COUNTER: a confirmed root that SAYS nothing was clarified (John, 30/10/2026; audit #4, part Γ, rule V2).
// What was seen: a «root» confirmed with «Ναι, αυτό είναι» can be a sentence that says the opposite of a root («Δεν ξεκαθάρισε
// τίποτα.»), and every count of confirmed roots counts it as one. The change, telemetry only: on «Ναι», one more record,
// root_unclear_candidate { candidate: 0|1 } — 1 when the confirmed root, folded (no accents, lower case, ς → σ), BEGINS with a
// plain «not clarified / not found» statement and ends there or at punctuation. A number only, no text. It is a CANDIDATE: nothing
// else reads it — the root is still confirmed, rootConfirmed / stageReached / session_completed and the screen are untouched.
// The check before the code (John's condition: «more than 2 false positives of 15 true roots → do not put it in»): 30 Greek roots
// written BEFORE the rule was run on them (sealed 30/10/2026 21:16:29 UTC, sha256 60b6f48a0121e229…; the author of the list also
// wrote the rule, so the list is not blind). Measured: false positives 0 of 15 true roots (with a negation or doubt); found 8 of
// the 15 that say «not clarified», missed 7 — the rule undercounts on purpose and the misses are listed, not hidden.
//  (Α) the rule on the 30   (Β) the wiring on «Ναι»   (Γ) what is recorded and what leaves the device   (Δ) nothing else changes

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const load = n => { try { return new Function(fnSrc(n) + '\nreturn ' + n + ';')(); } catch (e) { console.log('LOAD ERROR ' + n + ' — ' + e.message); return null; } };

// ── (Α) the rule on the 30 roots of the check ───────────────────────────────────────────────────────────────────────────────────
const cand = load('rootUnclearCandidate');
assert('(Α) the rule exists as one pure function', typeof cand === 'function');
const run = t => { try { return cand(t); } catch (e) { return 'threw'; } };
// 15 that say nothing was clarified — the 8 the rule finds, then the 7 it misses (measured, not asserted either way)
const FOUND = [
  'Δεν ξεκαθάρισε τίποτα, ακόμα είμαι μπερδεμένος.', 'Τίποτα δεν ξεκαθάρισε.', 'Δεν το βρήκα.', 'Δεν βρήκα κάτι.',
  'Δεν ξεκαθάρισε... μάλλον πρέπει να το σκεφτώ κι άλλο.', 'Δεν βρέθηκε τίποτα.', 'Δεν μου ξεκαθάρισε κάτι.',
  'Δεν το βρήκα ακόμα, συνεχίζω να είμαι στο ίδιο σημείο.',
];
const MISSED = [
  'Ειλικρινά, δεν ξεκαθάρισε.', 'Όχι, δεν ξεκαθάρισε τίποτα για μένα.', 'Ακόμα δεν ξέρω τι με απασχολεί, δεν ξεκαθάρισε.',
  'Μάλλον δεν βρήκα τίποτα καινούργιο.', 'Δεν βγήκε κάτι καθαρό από όλο αυτό.', 'Δεν έχω καταλήξει σε κάτι.',
  'Νομίζω ότι δεν ξεκαθάρισε, απλά κουράστηκα.',
];
// 15 true roots with a negation or doubt in them — none may be counted (John's limit: at most 2)
const TRUE_ROOTS = [
  'Δεν είμαι σίγουρος, αλλά τώρα καταλαβαίνω ότι φοβάμαι την αποτυχία.',
  'Δεν ξέρω αν θέλω να μείνω στη δουλειά ή αν απλώς φοβάμαι την αλλαγή.',
  'Δεν ξεκαθάρισε ποτέ στη δουλειά τι περιμένουν από μένα, και αυτό με τρώει.',
  'Δεν βρήκα ποτέ το θάρρος να πω στον πατέρα μου ότι δεν θέλω την επιχείρησή του.',
  'Ίσως αυτό που με κρατάει είναι ότι δεν θέλω να απογοητεύσω τη μητέρα μου.',
  'Δεν θέλω να χωρίσω, θέλω να με ακούει.',
  'Δεν μπορώ να αποφασίσω γιατί φοβάμαι ότι θα μετανιώσω όποιο κι αν διαλέξω.',
  'Δεν μου έγινε ποτέ σαφές αν σπούδασα αυτό που ήθελα εγώ ή αυτό που ήθελαν οι γονείς μου.',
  'Μάλλον δεν είναι τα λεφτά, είναι ότι δεν νιώθω χρήσιμος.',
  'Δεν ξέρω ακόμα πώς, αλλά καταλαβαίνω ότι θέλω να φύγω από την πόλη.',
  'Δεν το είχα δει έτσι, αλλά με πειράζει ότι κανείς δεν με ρωτάει τη γνώμη μου.',
  'Δεν βρήκα δουλειά που να μου αρέσει και φοβάμαι ότι δεν θα βρω ποτέ.',
  'Δεν ξεκαθαρίζω ποτέ τι θέλω γιατί φοβάμαι μη χάσω τους άλλους.',
  'Ούτε εγώ ξέρω σίγουρα, αλλά νομίζω ότι ζηλεύω τον αδερφό μου.',
  'Δεν είναι η κούραση, είναι ότι δεν βλέπω πού πάει όλο αυτό.',
];
const fp = TRUE_ROOTS.filter(t => run(t) !== 0);
assert('(Α) false positives: 0 of the 15 true roots are counted (John\'s limit: at most 2)', fp.length === 0);
fp.forEach(t => console.log('   counted: ' + t));
for (const t of FOUND) assert('(Α) found (1): «' + t + '»', run(t) === 1);
const missedNow = MISSED.filter(t => run(t) !== 1).length;
console.log(`NOTE — (Α) known misses: ${missedNow} of the 7 measured on 30/10 are still not counted (the rule undercounts; not asserted)`);
assert('(Α) the same «not clarified» in capitals, without accents, with a final ς or a closing word: still found',
  run('ΔΕΝ ΞΕΚΑΘΑΡΙΣΕ ΤΙΠΟΤΑ') === 1 && run('δεν ξεκαθαρισε ακομα.') === 1 && run('  Δεν βρήκα τίποτα!  ') === 1 && run('Ε δεν ξεκαθάρισε καλά…') === 1);
assert('(Α) more words after the statement (no punctuation) is a root, not the statement: not counted',
  run('Δεν ξεκαθάρισε ο ρόλος μου στην ομάδα') === 0 && run('Δεν το βρήκα αστείο που με πρόσβαλε') === 0);
assert('(Α) the statement not at the start is not counted (it is a root that mentions it)',
  run('Αυτό που δεν ξεκαθάρισε είναι τα όριά μου.') === 0 && run('Το κουράγιο να του μιλήσω δεν το βρήκα.') === 0);
assert('(Α) only 0 or 1, never text: anything that is not a sentence → 0',
  [undefined, null, '', '   ', 42, {}, ['Δεν το βρήκα.']].every(v => run(v) === 0) && [...FOUND, ...TRUE_ROOTS].every(t => run(t) === 0 || run(t) === 1));
assert('(Α) no lookbehind in the rule (old iPhones, iOS < 16.4)', !/\(\?<[=!]/.test(fnSrc('rootUnclearCandidate')));

// ── (Β) the wiring on «Ναι» ─────────────────────────────────────────────────────────────────────────────────────────────────────
const yesStart = CODE.indexOf('const handleStageAYes = useCallback(() => {');
const yes = yesStart < 0 ? '' : CODE.slice(yesStart, CODE.indexOf('}, [stageADispatch, messages, addUiBubble]);', yesStart));
const LINE = 'if (stageARef.current.stats.rootConfirmed === 1) recordTelemetry("root_unclear_candidate", { candidate: rootUnclearCandidate(_found) });';
assert('(Β) on «Ναι», after the dispatch and after root_provenance: one record, only when the root really was confirmed',
  yes.includes(LINE) && yes.indexOf(LINE) > yes.indexOf('recordTelemetry("root_provenance"') && yes.indexOf('recordTelemetry("root_provenance"') > 0);
assert('(Β) the event and the rule appear nowhere else (recorded once, read by nothing)',
  (CODE.split('"root_unclear_candidate"').length - 1) === 1 && (CODE.split('rootUnclearCandidate(').length - 1) === 2);
assert('(Β) never sent, never shown: not in generateResponse, callAura or the screen',
  !/rootUnclearCandidate|root_unclear_candidate/.test(CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('))) &&
  !/rootUnclearCandidate|root_unclear_candidate/.test(CODE.slice(CODE.indexOf('async function callAura('), CODE.indexOf('async function callAura(') + 4000)) &&
  !/rootUnclearCandidate|root_unclear_candidate/.test(CODE.slice(CODE.indexOf('  return (\n', CODE.indexOf('const stageAView = stageARef.current;')))));

// ── (Γ) what is recorded and what leaves the device ─────────────────────────────────────────────────────────────────────────────
const store = {};
global.window = { location: { search: '?stageA=1&rec=1' }, localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } } };
const _log = console.log; const rec = load('recordTelemetry');
console.log = () => {};
const r1 = rec ? rec('root_unclear_candidate', { candidate: run('Δεν ξεκαθάρισε τίποτα.') }) : null;
const r0 = rec ? rec('root_unclear_candidate', { candidate: run(TRUE_ROOTS[0]) }) : null;
console.log = _log;
let stored = []; try { stored = JSON.parse(store.aura_telemetry_log || '[]'); } catch (e) { stored = []; }
assert('(Γ) the device log (?rec=1) keeps both records: the event name and the number, nothing else',
  stored.length === 2 && stored.every(x => x.ev === 'root_unclear_candidate' && Object.keys(x).sort().join(',') === 'candidate,ev,t') &&
  stored[0].candidate === 1 && stored[1].candidate === 0 && !!r1 && !!r0);
const exp = load('buildTesterExport');
const out = exp ? exp(stored, '2026-10-30') : {};
assert('(Γ) THE TESTER FILE carries it: ev and the 0/1, no text',
  out.records === 2 && out.events[0].ev === 'root_unclear_candidate' && out.events[0].candidate === 1 && out.events[1].candidate === 0 &&
  !/[α-ωΑ-Ω]{4,}/.test(JSON.stringify(out.events)));
delete global.window;

// ── (Δ) nothing else changes ────────────────────────────────────────────────────────────────────────────────────────────────────
// The fingerprints below are the functions as they are on main 17334b2: the stats, the step of the flow and its records.
for (const [n, want] of [['stageAStep', '67bb9bcb504396e8'], ['stageATelemetry', 'e8b096b04d9d8109'], ['stageAFlowTelemetry', '92646b9fff31a68f'], ['rootAuraShare', '24cb967ba5b0626b']]) {
  assert('(Δ) unchanged: ' + n + ' (rootConfirmed, stageReached, session_completed, root_answer, root_provenance)', h(fnSrc(n)) === want);
}
const sc = CODE.slice(CODE.indexOf('recordTelemetry("session_completed", {'), CODE.indexOf('recordTelemetry("session_completed", {') + 900);
assert('(Δ) session_completed does not read it', sc.length > 100 && !/unclear|Unclear/.test(sc));
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
assert('(Δ) the prompt (AURA_CORE_PERSONALITY) is unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21');
let gen = ''; try { gen = cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { encoding: 'utf8' }); } catch (e) { gen = String(e.stdout || ''); }
assert('(Δ) the prompt fingerprints in api/aura.js are up to date', /up to date/.test(gen));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
