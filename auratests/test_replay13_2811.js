// AURA — THE STRESS TOOL, 28/11/2026 (John, order «ενοποιημένη», step Γ): the ONE paid replay of the session of 13 rounds, with the REAL model and with FIXED words of the user —
// words written for this test (a person who buys in a hurry), none of them from a real user. TOOL ONLY: nothing here reads or changes src/App.jsx or api/aura.js, and no existing test changes.
//  (Α) the session: 13 typed lines, the button of the root, the root, the card's «Ναι», the step, the size question's «Ναι», «Πότε», the clarity number, the word — 21 steps, no judge, no simulated user
//  (Β) the lines have the SHAPE of the real session of 24/11 (and not its words): the 2nd and the 12th say «κρίση» as judgement — which lit the heaviness latch at 9e9828e and light nothing now —, the 10th and the 12th ask for a way
//      (the counter sees exactly those two), and no line is a phrase that opens the root card by itself (door 3), so that the root question and its list of the user's own sentences come from the button
//  (Γ) the plan: asked by number only (9205), one run, fixed messages; no other list of the tool has the number
//  (Δ) the cost: with 14 calls (the 13 lines and the one that reads the first request — the closing from code makes none) the high estimate is under the budget of $1.50 that John set
//  (Ε) the wiring: the session is in the tool's people on a line of its own, after the whole session of 21/11, and the browser section RP of the mock e2e plays the SAME words (it reads them from here)
// Run, $0 (fake model): node scripts/e2e_stage_a.cjs --stress --sessions 9205 --out <folder inside the temp folder>. The paid run: workflow «AURA stress test (real model)», mode «επιλογή», sessions 9205, budget 1.5, parallel 1.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'));
const LIB = require(path.join(ROOT, 'scripts', 'e2e_stage_a_lib.cjs'));
const RUN = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
const LIBSRC = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'), 'utf8');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY'), _s = raw.indexOf('`', _i) + 1, _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
const ex = n => { const s = CODE.indexOf('function ' + n + '('); return CODE.slice(s, CODE.indexOf('\n}', s) + 2); };
const R = (SL.REPLAY_PERSONAS || []).find(p => p.id === 9205);

assert('(load) the replay is there: ONE session, 9205, in its own list — the whole session of 21/11 (9204) and the three versions stay as they were',
  !!R && SL.REPLAY_PERSONAS.length === 1 && R.key === 'replay13' && SL.FULL_SESSION_PERSONAS.length === 1 && SL.FULL_SESSION_PERSONAS[0].id === 9204 && SL.TWO_SESSIONS_PERSONAS.length === 3);

// (Α)
const F = (R && R.fixed) || [];
const SAYS = F.filter(s => s && s.say !== undefined).map(s => s.say);
assert('(Α) 21 steps in this order: 13 typed lines (say), the button of the root (press), the root, the card «Ναι» (card yes), the step, the size question «Ναι» (fits yes), «Πότε» (when), the clarity number 8, the word',
  F.length === 21 && F.slice(0, 13).every(s => typeof s.say === 'string') && F[13] && F[13].press === true && typeof F[14].root === 'string' && F[15].card === 'yes' && typeof F[16].step === 'string' && F[17].fits === 'yes'
  && typeof F[18].when === 'string' && F[19].clarity === 8 && typeof F[20].word === 'string');
assert('(Α) no judge and no simulated user: noJudge, fixed steps only, no «forced» lines, not one of the other kinds of session (not a whole session of 21/11, not a version, not a benchmark scenario)',
  !!R && R.noJudge === true && !R.forced && !R.fullSession && !R.twoSessions && !R.bench && R.id >= 9205 && R.id < 9300 && R.runs === 1);
assert('(Α) the room for the whole script: the session may type up to 20 lines (the default is 12; this one types 13 + the root, the step, «Πότε» and the word = 17)', !!R && R.maxTyped >= 17 && R.maxTyped <= 24);
assert('(Α) every typed line is short and natural: 1–3 sentences, at most 140 characters, no line break',
  SAYS.length === 13 && SAYS.every(t => t.length >= 6 && t.length <= 140 && !/\n/.test(t) && (t.match(/[.;?!…]+(\s|$)/g) || []).length <= 3));

// (Β) the shape of the real session
if (F.length === 21) {
  const OLD_GREEK = /(πένθος|τραύμα|κατάρρευση|κρίση|κακοποίηση|απώλεια αγαπημένου)/i; // the Greek DISTRESS pattern of 9e9828e, bare «κρίση» included
  const D = eval('(' + ex('detectSafetySignal') + ')'), REQ = eval('(' + ex('detectsExplicitProductionRequest') + ')');
  const typed = SAYS.concat([F[14].root, F[16].step, F[18].when, F[20].word]);
  assert('(Β) «κρίση» as JUDGEMENT in the 2nd and the 12th line («την κρίση μου», «πιο ήρεμη κρίση»): the bare word of 9e9828e lit the heaviness latch on both (and from the 2nd line on), and the detector of today lights NOTHING on any of the 17 typed lines',
    /την κρίση μου/.test(SAYS[1]) && /ήρεμη κρίση/.test(SAYS[11]) && OLD_GREEK.test(SAYS[1]) && OLD_GREEK.test(SAYS[11]) && typed.every(t => D(t) === null));
  assert('(Β) exactly two lines ask for a way — the 10th («Τι να κάνω;») and the 12th («Πώς θα το κάνω;») — and the counter of requests sees those two and no other',
    /Τι να κάνω;/.test(SAYS[9]) && /Πώς θα το κάνω;/.test(SAYS[11]) && SAYS.map((t, i) => REQ(t) ? i + 1 : 0).filter(Boolean).join() === '10,12');
  assert('(Β) the shape of the rest: a short pick («Το πρώτο, νομίζω.»), a question back («Δηλαδή τι εννοείς;»), a hedge («Δεν είμαι σίγουρος… ίσως.»), a first line that names the trouble',
    SAYS[5] === 'Το πρώτο, νομίζω.' && SAYS[6] === 'Δηλαδή τι εννοείς;' && /Δεν είμαι σίγουρος\.\.\. ίσως\./.test(SAYS[7]) && /Παίρνω βιαστικές αποφάσεις/.test(SAYS[0]));
  assert('(Β) no line is a phrase of recognition that would open the root card BY ITSELF (door 3) — «αυτό ακριβώς θέλω», «το κατάλαβα», «αυτό είναι» — so that the root question and the list of the user\'s own sentences come from the button',
    SAYS.every(t => !/αυτό ακριβώς|το κατάλαβα|καταλάβω|αυτό είναι|βρήκα τι|ξέρω τι με απασχολεί/i.test(t)));
  assert('(Β) the root, the step, «Πότε» and the word are the user\'s own, short, and the root is not one of the 13 lines (it is typed under the root question)',
    F[14].root.length <= 80 && F[16].step.length <= 80 && F[18].when.length <= 30 && F[20].word.length <= 20 && !SAYS.includes(F[14].root));
}

// (Γ) the plan
const plan = R ? SL.planRuns(SL.REPLAY_PERSONAS, ['9205']) : [];
assert('(Γ) asked by number, the plan is exactly one session, 9205, fixed messages; a plan that does not ask for it does not have it',
  plan.length === 1 && plan[0].label === '9205' && !!plan[0].persona.fixed && SL.planRuns(SL.REPLAY_PERSONAS, ['14']).length === 0 && SL.planRuns(SL.PERSONAS, ['9205']).length === 0);
const OTHER = [].concat(SL.PERSONAS, SL.HARD_PERSONAS || [], SL.FOUNDER_PERSONAS || [], SL.VOICE_PERSONAS || [], SL.LOOP_PERSONAS || [], SL.REHEARSAL_PERSONAS || [], SL.TARGETED_PERSONAS || [], SL.FINAL_PERSONAS || [],
  SL.MECHANISM_PERSONAS || [], SL.P3_PERSONAS || [], SL.COMPOSITE_PERSONAS || [], SL.DANGER_FIXED_PERSONAS || [], SL.TWO_SESSIONS_PERSONAS || [], SL.FULL_SESSION_PERSONAS || []);
assert('(Γ) no other session of the tool has the number 9205 or the key «replay13»', !OTHER.some(p => p.id === 9205 || p.key === 'replay13'));

// (Δ) the cost
{
  const APP = LIB.loadApp(raw);
  const e = SL.estimateCost(plan, APP.consts.core.length, { fixedCalls: 14 });
  assert('(Δ) the estimate: 1 session, no simulated user, no cheap-model call (no judge); with 14 calls the high estimate ($' + e.high.toFixed(2) + ') is under the budget of $1.50 that John set',
    e.sessions === 1 && e.sims === 0 && e.fixed === 1 && e.userCalls === 0 && e.calls === 14 && e.high > 0 && e.high < 1.5);
}

// (Ε) the wiring
assert('(Ε) the runner: 9205 comes in on a line of its own right after the whole session of 21/11 — only when sessions are named, never in the hard set — and the lines that the other tests pin stay as they were',
  /(?:^|\n)  if \(only\.length && !has\('--hard'\)\) PEOPLE\.push\(\.\.\.\(SL\.FULL_SESSION_PERSONAS \|\| \[\]\)\);[^\n]*\n  if \(only\.length && !has\('--hard'\)\) PEOPLE\.push\(\.\.\.\(SL\.REPLAY_PERSONAS \|\| \[\]\)\);/.test(RUN));
assert('(Ε) the library: the new list is added with its own export line, BEFORE the two lines of the whole session that end the file (which stay as they were)',
  /\nmodule\.exports\.REPLAY_PERSONAS = REPLAY_PERSONAS;\nmodule\.exports\.FULL_SESSION_PERSONAS = FULL_SESSION_PERSONAS;\nmodule\.exports\.fullSessionReport = fullSessionReport;\n$/.test(LIBSRC));
{
  const RP = RUN.slice(RUN.indexOf('async function runMockRP()'), RUN.indexOf('async function runMockCC()'));
  assert('(Ε) the browser section RP (mock model, $0) plays the SAME words: it reads them from SL.REPLAY_PERSONAS, and the 13 lines are written once — not one of the long lines is in the section\'s source (the short ones could be anywhere)',
    RP.length > 1000 && /SL\.REPLAY_PERSONAS/.test(RP) && SAYS.length === 13 && SAYS.filter(t => t.length >= 15).every(t => !RP.includes(t)) && !RP.includes(F[14].root) && !RP.includes(F[16].step));
}
assert('(Ε) the workflow is NOT changed by this: the form takes «επιλογή» with the numbers of the sessions and a budget (so the run is: mode επιλογή, sessions 9205, budget 1.5, parallel 1)',
  (() => { const W = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'stress.yml'), 'utf8');
    return /\^\[0-9\]\[0-9\.,\]\*\$/.test(W) && /--sessions "\$SESSIONS" --budget "\$BUDGET" --parallel "\$\{PARALLEL:-1\}"/.test(W) && /secrets\.ANTHROPIC_API_KEY2 \|\| secrets\.ANTHROPIC_API_KEY/.test(W); })());

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
