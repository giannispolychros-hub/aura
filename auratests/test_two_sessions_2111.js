// AURA — THE STRESS TOOL, 21/11/2026 (John, the paid test on branch test-two-sessions — option Γ, then his ⚑1 «Α» and ⚑3 «γ»): three versions whose user lines
// are written word for word by us (no simulated user, no judge — only the real AURA answers), and the report he asked for. TOOL ONLY: nothing here reads or changes
// src/App.jsx or api/aura.js, and no existing test changes (the lines that other tests pin stay byte for byte as they were).
//  (Α) the three versions: the exact lines of John (the three short answers are the ones proposed to him), their numbers, no judge
//  (Β) the plan: asked by number, they run in order, fixed messages only; the estimate counts no cheap-model call for them
//  (Γ) «ends with a question mark» (qMarkEnd): the last visible character, Greek and Latin marks, closing quotes ignored
//  (Δ) the report (twoSessionsReport): numbered lines, the model's replies apart from the app's own bubbles, the five check points of EACH version, the totals
//  (Ε) the runner's wiring: the sessions are in the tool's people, no judge call, the screen after each line is written down, the script ends by itself, and the
//      lines that the other tests pin are still as they were
// On the screen (the runner itself, fake model, $0): node scripts/e2e_stage_a.cjs --stress --sessions 9201,9202,9203 --out <folder inside the temp folder>.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'));
const BL = require(path.join(ROOT, 'scripts', 'e2e_bench_lib.cjs'));
const RUN = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
const LIBSRC = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'), 'utf8');
const V = id => (SL.TWO_SESSIONS_PERSONAS || []).find(p => p.id === id);
const V1 = V(9201), V2 = V(9202), V3 = V(9203);

assert('(load) the three versions, the report and the question-mark check are there',
  !!V1 && !!V2 && !!V3 && SL.TWO_SESSIONS_PERSONAS.length === 3 && typeof SL.twoSessionsReport === 'function' && typeof SL.qMarkEnd === 'function');

// (Α)
const FIRST4 = [{ say: 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά' }, { say: 'Είμαι κουρασμένος από τη δουλειά τον τελευταίο καιρό.' },
  { say: 'Τα λεφτά μετράνε, ο μισθός εδώ είναι σταθερός.' }, { say: 'Φοβάμαι το άγνωστο, δεν ξέρω τι θα βρω αλλού.' }];
assert('(Α) version 1: John\'s first line, the three short answers proposed to him, the app\'s button, then «Στο είπα ήδη» — word for word, in this order',
  !!V1 && JSON.stringify(V1.fixed) === JSON.stringify(FIRST4.concat([{ press: true }, { root: 'Στο είπα ήδη' }])));
assert('(Α) version 2: the same four lines, then his line 3 «Νομίζω βρήκα τι με απασχολεί» as an ordinary message of the chat (no button), then «Στο είπα ήδη»',
  !!V2 && JSON.stringify(V2.fixed) === JSON.stringify(FIRST4.concat([{ say: 'Νομίζω βρήκα τι με απασχολεί' }, { say: 'Στο είπα ήδη' }])) && !V2.fixed.some(st => st.press));
assert('(Α) version 3 (a new session, no history): «τι να κάνω;» and «δεν κατάλαβα» — word for word, nothing else',
  !!V3 && JSON.stringify(V3.fixed) === JSON.stringify([{ say: 'τι να κάνω;' }, { say: 'δεν κατάλαβα' }]));
assert('(Α) John\'s own line numbers, one for each step: 1, 2α, 2β, 2γ, 3, 4 (versions 1 and 2) and 1, 2 (version 3); the names say which version it is',
  !!V1 && !!V2 && !!V3 && JSON.stringify(V1.lines) === JSON.stringify(['1', '2α', '2β', '2γ', '3', '4']) && JSON.stringify(V2.lines) === JSON.stringify(V1.lines) && JSON.stringify(V3.lines) === JSON.stringify(['1', '2']) &&
  [V1, V2, V3].every(p => p.lines.length === p.fixed.length && p.twoSessions === true) && /^Εκδοχή 1 /.test(V1.name) && /^Εκδοχή 2 /.test(V2.name) && /^Εκδοχή 3 /.test(V3.name));
assert('(Α) no judge and no simulated user: noJudge, fixed steps only, no «forced» lines and no policy that waits for a simulated user',
  SL.TWO_SESSIONS_PERSONAS.every(p => p.noJudge === true && Array.isArray(p.fixed) && !p.forced && !p.policy && !p.final && !p.bench));
assert('(Α) the numbers 9201–9203 are not a benchmark scenario (9001–9199) and no other session of the tool has them',
  ['9201', '9202', '9203'].every(n => !BL.isBenchAlias(n)) && [].concat(SL.PERSONAS, SL.HARD_PERSONAS, SL.FOUNDER_PERSONAS || [], SL.VOICE_PERSONAS || [], SL.LOOP_PERSONAS || [], SL.REHEARSAL_PERSONAS || [],
    SL.TARGETED_PERSONAS || [], SL.FINAL_PERSONAS || [], SL.MECHANISM_PERSONAS || [], SL.P3_PERSONAS || [], SL.COMPOSITE_PERSONAS || [], SL.DANGER_FIXED_PERSONAS || []).every(p => ![9201, 9202, 9203].includes(p.id)));

// (Β)
{ const plan = SL.planRuns(SL.TWO_SESSIONS_PERSONAS, ['9201', '9202', '9203']);
  assert('(Β) asked by number, the plan is exactly 9201, 9202, 9203 — one run each, in this order, all with fixed messages', plan.length === 3 && plan.map(r => r.label).join(',') === '9201,9202,9203' && plan.every(r => r.persona.fixed));
  assert('(Β) a plan that does not ask for them does not have them', SL.planRuns(SL.TWO_SESSIONS_PERSONAS, ['14']).length === 0);
  const e = SL.estimateCost(plan, 313386);
  assert('(Β) the estimate: 3 sessions, none with a simulated user, no cheap-model call (no judge)', e.sessions === 3 && e.sims === 0 && e.fixed === 3 && e.userCalls === 0);
  const withJudge = SL.estimateCost(SL.planRuns(SL.PERSONAS, ['14', '15', '16']), 313386);
  assert('(Β) other fixed sessions (14, 15, 16) still count their judge — the change is only for noJudge', withJudge.sims === 0 && withJudge.fixed === 3 && withJudge.userCalls === 3); }

// (Γ)
assert('(Γ) ends with a question mark: Latin «?», Greek «;» (U+003B), Greek question mark (U+037E), spaces and closing quotes after it do not matter',
  SL.qMarkEnd('Τι σε κρατάει;') === true && SL.qMarkEnd('Τι σε κρατάει?') === true && SL.qMarkEnd('Τι σε κρατάει;') === true && SL.qMarkEnd('Τι σε κρατάει;  \n') === true &&
  SL.qMarkEnd('«Τι σε κρατάει;»') === true && SL.qMarkEnd('Είπες "τι σε κρατάει;"') === true);
assert('(Γ) does not end with one: a full stop after it, a question in the middle, an empty or missing text',
  SL.qMarkEnd('Τι σε κρατάει; Πες μου.') === false && SL.qMarkEnd('Τι σε κρατάει;.') === false && SL.qMarkEnd('Σε ακούω.') === false && SL.qMarkEnd('') === false && SL.qMarkEnd(null) === false && SL.qMarkEnd(undefined) === false);

// (Δ)
const ML = 'Δεν θα σου δώσω λίστα με αιτίες και λύσεις. Θα σε ρωτάω ένα πράγμα τη φορά, ώστε να το βρεις εσύ.';
const ROOT_Q = 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;';
const BTN = '[πάτησε «Νομίζω βρήκα τι με απασχολεί»]';
const U = ['Δεν ξέρω αν πρέπει να αλλάξω δουλειά', 'Είμαι κουρασμένος από τη δουλειά τον τελευταίο καιρό.', 'Τα λεφτά μετράνε, ο μισθός εδώ είναι σταθερός.', 'Φοβάμαι το άγνωστο, δεν ξέρω τι θα βρω αλλού.'];
const call = (n, o) => Object.assign({ kind: 'chat', status: 200, typed: n, cacheWrite: 0, cacheRead: 85000, cost: 0.045, ms: 2000 }, o || {});
const base = o => Object.assign({ tsMethodLine: ML, modelTexts: [], notes: [], quotes: [], events: [], tsCards: [], checks: {}, applies: {} }, o);
const mk1 = o => base(Object.assign({ label: '9201', persona: { id: 9201, key: 'two_s1', name: V1.name, twoSessions: true, noJudge: true, lines: V1.lines, lineKinds: ['type', 'type', 'type', 'type', 'press', 'type'] },
  typed: U.concat(['Στο είπα ήδη']),
  turns: [
    { who: 'user', text: U[0] }, { who: 'aura', text: ML + '\nΤι σε κρατάει εκεί;' }, { who: 'user', text: U[1] }, { who: 'aura', text: 'Κουρασμένος από τη δουλειά.' },
    { who: 'user', text: U[2] }, { who: 'aura', text: 'Ο μισθός είναι σταθερός. Τι άλλο μετράει;' }, { who: 'user', text: U[3] }, { who: 'aura', text: 'Φοβάσαι το άγνωστο.' },
    { who: 'app', text: BTN }, { who: 'aura', text: ROOT_Q }, { who: 'user', text: 'Στο είπα ήδη' }],
  calls: [1, 2, 3, 4].map(n => call(n, n === 1 ? { cacheWrite: 85000, cacheRead: 0, cost: 0.35 } : {})), cost: 0.485 }, o || {}));
const mk2 = o => base(Object.assign({ label: '9202', persona: { id: 9202, key: 'two_s1b', name: V2.name, twoSessions: true, noJudge: true, lines: V2.lines, lineKinds: ['type', 'type', 'type', 'type', 'type', 'type'] },
  typed: U.concat(['Νομίζω βρήκα τι με απασχολεί', 'Στο είπα ήδη']),
  turns: [
    { who: 'user', text: U[0] }, { who: 'aura', text: ML + '\nΤι σε κρατάει εκεί;' }, { who: 'user', text: U[1] }, { who: 'aura', text: 'Κουρασμένος από τη δουλειά.' },
    { who: 'user', text: U[2] }, { who: 'aura', text: 'Ο μισθός είναι σταθερός.' }, { who: 'user', text: U[3] }, { who: 'aura', text: 'Φοβάσαι το άγνωστο.' },
    { who: 'user', text: 'Νομίζω βρήκα τι με απασχολεί' }, { who: 'aura', text: 'Νιώθεις ότι ξεκαθαρίζει;' }, { who: 'user', text: 'Στο είπα ήδη' }, { who: 'aura', text: 'Τι είπες ήδη;' }],
  calls: [1, 2, 3, 4, 5, 6].map(n => call(n)), cost: 0.27 }, o || {}));
const mk3 = o => base(Object.assign({ label: '9203', persona: { id: 9203, key: 'two_s2', name: V3.name, twoSessions: true, noJudge: true, lines: V3.lines, lineKinds: ['type', 'type'] },
  typed: ['τι να κάνω;', 'δεν κατάλαβα'],
  turns: [{ who: 'user', text: 'τι να κάνω;' }, { who: 'aura', text: ML + '\nΔεν ξέρω ακόμα. Τι σε απασχολεί;' }, { who: 'user', text: 'δεν κατάλαβα' }, { who: 'aura', text: 'Θα το πω πιο απλά. Τι σε βαραίνει;' }],
  calls: [1, 2].map(n => call(n)), cost: 0.09 }, o || {}));
const card3 = { typed: 4, afterLine: '3', retry: false, ask: true, rootCard: false, list: false, none: false, sentences: [], text: ROOT_Q };
const card4root = { typed: 5, afterLine: '4', retry: false, ask: false, rootCard: true, list: false, none: false, sentences: [], text: 'ΤΙ ΒΡΗΚΕΣ «Στο είπα ήδη»' };
const card4list = { typed: 5, afterLine: '4', retry: true, ask: true, rootCard: false, list: true, none: true, sentences: [U[1], U[3]], text: '…' };
const META = { spent: 0.6, budget: 1.5, by: { aura: 0.6, user: 0, sim: 0, eval: 0 }, userCalls: [], stopped: null, version: { commit: 'abc' } };
const rep = (ss, meta) => SL.twoSessionsReport(ss, meta || META).join('\n');
const block = (r, n) => { const i = r.indexOf('#### Τα 5 σημεία ελέγχου — Εκδοχή ' + n); const j = r.indexOf('\n### ', i + 5); return i < 0 ? '' : r.slice(i, j < 0 ? r.length : j); };
const part = (r, n) => { const i = r.indexOf('### Εκδοχή ' + n + ' '); const j = r.indexOf('#### Τα 5', i); return i < 0 ? '' : r.slice(i, j < 0 ? r.length : j); };
const ALL = () => rep([mk1({ tsCards: [card3, card4root] }), mk2(), mk3()]);

assert('(Δ) other runs get nothing: no sessions, or sessions that are not of this test, give an empty report — and the full report has no such heading',
  SL.twoSessionsReport([], META).length === 0 && SL.twoSessionsReport([{ persona: { id: 14 }, turns: [] }], META).length === 0 && SL.twoSessionsReport(null, null).length === 0 &&
  !/Οι τρεις εκδοχές — η αναφορά του John/.test(SL.buildStressReport([{ label: '14', persona: { id: 14, name: 'x' }, turns: [], checks: {}, applies: {}, calls: [], notes: [], cost: 0 }], META)));
{ const r = ALL();
  assert('(Δ) every line of the user is written with John\'s own number: 1, 2α, 2β, 2γ, then 4 (the button is his 3) in version 1; 1…4 in version 2; 1, 2 in version 3',
    /### Εκδοχή 1 [^\n]*— συνεδρία 9201/.test(r) && /\*\*Χρήστης, γραμμή 1:\*\* Δεν ξέρω αν πρέπει να αλλάξω δουλειά/.test(r) && /γραμμή 2α:\*\* Είμαι κουρασμένος/.test(r) && /γραμμή 2β:\*\* Τα λεφτά μετράνε/.test(r) &&
    /γραμμή 2γ:\*\* Φοβάμαι το άγνωστο/.test(r) && /γραμμή 4:\*\* Στο είπα ήδη/.test(r) && !/γραμμή 3:\*\* Νομίζω[^\n]*\n\n\*Εφαρμογή[^\n]*Πες το με μία/.test(part(r, 1)) && /γραμμή 3:\*\* Νομίζω βρήκα τι με απασχολεί/.test(part(r, 2)) &&
    !/γραμμή 3:\*\*/.test(part(r, 1)) && /\*\*Χρήστης, γραμμή 1:\*\* τι να κάνω;/.test(r) && /γραμμή 2:\*\* δεν κατάλαβα/.test(r));
  assert('(Δ) the button press is marked as his line 3 in version 1 (and only there)', /\(γραμμή 3\) \[πάτησε «Νομίζω βρήκα τι με απασχολεί»\]/.test(part(r, 1)) && (r.match(/\(γραμμή 3\) \[πάτησε/g) || []).length === 1);
  const b1 = block(r, 1), b2 = block(r, 2), b3 = block(r, 3);
  assert('(Δ) the model\'s replies are numbered; the app\'s own line at the start of the first reply and the app\'s own root question are NOT the model\'s',
    /AURA \(μοντέλο\), απάντηση 4\*\*/.test(part(r, 1)) && !/απάντηση 5\*\*/.test(part(r, 1)) && /απάντηση 6\*\*/.test(part(r, 2)) && /\*Εφαρμογή \(προσθέτει μόνη της στην αρχή της πρώτης απάντησης\):\* Δεν θα σου δώσω λίστα/.test(part(r, 1)) &&
    /\*Εφαρμογή \(φυσαλίδα της AURA που γράφει η ίδια η εφαρμογή, όχι το μοντέλο\):\* Πες το με μία φράση/.test(part(r, 1)) && !/AURA \(μοντέλο\)[^\n]*\n\n[^\n]*Πες το με μία φράση: τι είναι αυτό/.test(r));
  assert('(Δ) every version has its own block of the five check points, 1 to 5 in order, each one its own paragraph',
    [b1, b2, b3].every(b => !!b && [1, 2, 3, 4, 5].every(n => b.includes('\n\n**' + n + '. ')) && b.indexOf('**1. ') < b.indexOf('**2. ') && b.indexOf('**2. ') < b.indexOf('**3. ') && b.indexOf('**4. ') < b.indexOf('**5. ')));
  assert('(Δ) the points that belong to another version say so: 2 and 3 are «δεν ισχύει» in versions 1 and 2, and 1 in version 3',
    /\*\*2\. Συνεδρία 2, γραμμή 1\*\*[^\n]*δεν ισχύει/.test(b1) && /\*\*3\. Συνεδρία 2, γραμμή 2\*\*[^\n]*δεν ισχύει/.test(b1) && /\*\*2\. Συνεδρία 2, γραμμή 1\*\*[^\n]*δεν ισχύει/.test(b2) && /\*\*1\. Συνεδρία 1, γραμμή 4\*\*[^\n]*δεν ισχύει/.test(b3));
  assert('(Δ) point 4 counts the model\'s replies of that version only: version 1 has 2 of 4 ending in «;» (replies 1 and 3) and 1 app bubble apart; version 2 has 3 of 6; version 3 has 2 of 2; and the totals line adds them up (7 of 12)',
    /\*\*4\. [^\n]*:\*\* 2 από 4 \(απαντήσεις 1, 3\)\. Φυσαλίδες που έγραψε η ίδια η εφαρμογή και δεν μετρούν: 1\./.test(b1) && /\*\*4\. [^\n]*:\*\* 3 από 6 \(απαντήσεις 1, 5, 6\)\. Φυσαλίδες[^\n]*: 0\./.test(b2) &&
    /\*\*4\. [^\n]*:\*\* 2 από 2 \(απαντήσεις 1, 2\)\./.test(b3) && /όλες μαζί:\*\* 7 από 12\./.test(r));
  assert('(Δ) point 1 is ΟΧΙ when no card had the list, and says what the app showed after line 4 (a root card that took the line as the root)',
    /\*\*1\. Συνεδρία 1, γραμμή 4[^\n]*\*\* \*\*ΟΧΙ\*\* \(καμία κάρτα της εφαρμογής δεν είχε τη λίστα· μετά τη γραμμή 4 η εφαρμογή έδειξε: κάρτα ρίζας[^\n]*δέχτηκε τη γραμμή 4 ως ρίζα\)/.test(b1));
  assert('(Δ) point 1 of version 2, where line 4 went to the model as an ordinary message and no card showed: ΟΧΙ, and it says so',
    /\*\*1\. Συνεδρία 1, γραμμή 4[^\n]*\*\* \*\*ΟΧΙ\*\* \([^\n]*καμία κάρτα· η γραμμή 4 πήγε στο μοντέλο ως απλό μήνυμα\)/.test(b2));
  assert('(Δ) points 2 and 3 are laid out «για ανάγνωση» — the code gives counts, never a verdict; «μετά τη ρίζα» is looked for in the model\'s reply only',
    /\*\*2\. Συνεδρία 2, γραμμή 1[^\n]*για ανάγνωση: «μετά τη ρίζα» στην απάντηση: όχι · προτάσεις: 2 · λέξεις: \d+ · τελειώνει με ερωτηματικό: ΝΑΙ/.test(b3) &&
    /\*\*3\. Συνεδρία 2, γραμμή 2[^\n]*για ανάγνωση: λέξεις ανά πρόταση: [\d.]+ → [\d.]+ · αποσπάσματα που ΔΕΝ είναι αυτούσια λόγια του χρήστη: κανένα που να βλέπει ο κώδικας/.test(b3));
  assert('(Δ) point 5 of each version: its own cost, its calls and their HTTP codes; the totals block: the real cost, the AURA and cheap-model parts, the calls, the cache numbers, one line for each call',
    /\*\*5\. [^\n]*:\*\* \$0\.4850 · κλήσεις AURA: 4 · κωδικοί HTTP: 200, 200, 200, 200 · κλήσεις Haiku: 0/.test(b1) && /\*\*5\. [^\n]*:\*\* \$0\.2700 · κλήσεις AURA: 6 /.test(b2) && /\*\*5\. [^\n]*:\*\* \$0\.0900 · κλήσεις AURA: 2 /.test(b3) &&
    /\*\*Πραγματικό κόστος:\*\* \$0\.6000 \(AURA \$0\.6000, Haiku \$0\.0000\) από όριο \$1\.50 · \*\*κλήσεις AURA:\*\* 12 · κωδικοί HTTP: 200 ×12 · \*\*κλήσεις Haiku:\*\* 0 · εγγραφές cache: 1 \(85000 tokens\) · αναγνώσεις cache: 11/.test(r) &&
    (r.match(/- συνεδρία 920[123] κλήση \d: HTTP 200/g) || []).length === 12 && /Έκδοση που έτρεξε: \{"commit":"abc"\}/.test(r)); }
{ const r = rep([mk1({ tsCards: [card3, card4list] }), mk2(), mk3()]), b1 = block(r, 1);
  assert('(Δ) point 1 is ΝΑΙ when a card had the list: after which line, «Καμία από αυτές», the sentences — and whether each is word for word in an earlier line of the user',
    /\*\*1\. Συνεδρία 1, γραμμή 4[^\n]*\*\* \*\*ΝΑΙ\*\* \(εμφανίστηκε στην οθόνη μετά τη γραμμή 4 · «Καμία από αυτές» στην κάρτα: ναι · προτάσεις: 2\)/.test(b1) &&
    /• «Είμαι κουρασμένος από τη δουλειά τον τελευταίο καιρό\.» — αυτούσια σε προηγούμενη γραμμή του χρήστη: ναι/.test(b1) && /Τηλεμετρία της συσκευής \(μόνο αριθμοί\): list_shown ×0/.test(b1)); }
{ const r = rep([mk1({ tsCards: [Object.assign({}, card3, { afterLine: '3', list: true, none: true, sentences: ['x'] })] }), mk2(), mk3()]);
  assert('(Δ) a list that showed already after line 3 (before line 4) is said so — the report never moves it to line 4', /\*\*ΝΑΙ\*\* \(εμφανίστηκε στην οθόνη μετά τη γραμμή 3/.test(block(r, 1))); }
{ const r = rep([mk1({ tsCards: [card3, Object.assign({}, card4root, { rootCard: false, retry: true, ask: true })] }), mk2(), mk3()]);
  assert('(Δ) point 1 names the «ζητά ξανά» line when that is what the app showed after line 4 (and still ΟΧΙ without the list)', /\*\*ΟΧΙ\*\* \(καμία κάρτα[^\n]*μετά τη γραμμή 4 η εφαρμογή έδειξε: τη γραμμή «ζητά ξανά»/.test(block(r, 1))); }
{ const s = mk2({ typed: U.concat(['Νομίζω βρήκα τι με απασχολεί']), turns: mk2().turns.slice(0, 10), calls: [1, 2, 3, 4, 5].map(n => call(n)), notes: ['η εφαρμογή έδειξε κάρτα ή ερώτηση δική της μετά τη γραμμή 3, πριν από το τέλος των γραμμών — το σενάριο σταμάτησε εδώ, δεν πατήθηκε τίποτα'] });
  const r = rep([mk1({ tsCards: [card3, card4root] }), s, mk3()]);
  assert('(Δ) when the script stopped before line 4 (the app put up a card of its own), point 1 says line 4 was not written — it does not say what the app did after it',
    /\*\*1\. Συνεδρία 1, γραμμή 4[^\n]*\*\* \*\*ΟΧΙ\*\* \(η γραμμή 4 δεν γράφτηκε — το σενάριο σταμάτησε νωρίτερα, βλ\. τις σημειώσεις\)/.test(block(r, 2))); }
{ const s3 = mk3(); s3.turns[1] = { who: 'aura', text: ML + '\nΘα το δούμε μετά τη ρίζα.' };
  assert('(Δ) «μετά τη ρίζα» in the model\'s reply is found (with or without accents, «τη» or «την»)', /«μετά τη ρίζα» στην απάντηση: \*\*ΝΑΙ\*\*/.test(rep([mk1(), mk2(), s3])));
  const s4 = mk3(); s4.turns[1] = { who: 'aura', text: ML + '\nΘα το δούμε αφού βρούμε την Ριζα.' };
  assert('(Δ) …and a reply without those words is not flagged', /«μετά τη ρίζα» στην απάντηση: όχι/.test(rep([mk1(), mk2(), s4])));
  const ML2 = ML.replace('λίστα', 'μετά τη ρίζα λίστα'), s5 = mk3({ tsMethodLine: ML2 }); s5.turns[1] = { who: 'aura', text: ML2 + '\nΤι σε απασχολεί;' };
  assert('(Δ) …and the words of the app\'s own first line are not read as the model\'s: only the model\'s reply is searched', /«μετά τη ρίζα» στην απάντηση: όχι/.test(rep([mk1(), mk2(), s5]))); }
{ const s1 = mk1(); s1.calls = s1.calls.slice(0, 3); // the 4th line had no successful model call: its next bubble is not the model's
  const p1 = part(rep([s1, mk2(), mk3()]), 1);
  assert('(Δ) a bubble is the model\'s only when its line made a call that came back 200 — a line with no call (or an error) leaves the next bubble to the app',
    /AURA \(μοντέλο\), απάντηση 3\*\*/.test(p1) && !/AURA \(μοντέλο\), απάντηση 4\*\*/.test(p1) && /\*Εφαρμογή \(φυσαλίδα της AURA[^\n]*Φοβάσαι το άγνωστο/.test(p1)); }
{ const s1 = mk1({ modelTexts: [{ kind: 'chat', typed: 2, text: 'Κουρασμένος από τη δουλειά [[x]] ΚΕΙΜΕΝΟ ΠΟΥ ΑΛΛΑΞΕ', filtered: 'Κουρασμένος από τη δουλειά.' }] });
  assert('(Δ) when the app changed the model\'s reply, the raw reply is printed too (provenance); when it did not, nothing extra',
    /\*Η εφαρμογή άλλαξε την απάντηση του μοντέλου μετά το μήνυμα 2 — ακατέργαστο:\* Κουρασμένος από τη δουλειά \[\[x\]\] ΚΕΙΜΕΝΟ ΠΟΥ ΑΛΛΑΞΕ/.test(rep([s1, mk2(), mk3()])) && !/ακατέργαστο/.test(ALL())); }
{ const full = SL.buildStressReport([mk1({ tsCards: [card3, card4root] }), mk2(), mk3()], META);
  assert('(Δ) the report is part of the stress report that the workflow publishes (the page of the run and the report file), once, before the worst conversations, with the totals in it',
    (full.match(/## Οι τρεις εκδοχές — η αναφορά του John/g) || []).length === 1 && (full.match(/#### Τα 5 σημεία ελέγχου — Εκδοχή \d/g) || []).length === 3 && /### Σύνολο των εκδοχών που έτρεξαν/.test(full) &&
    full.indexOf('## Οι τρεις εκδοχές') < full.indexOf('## Οι 5 χειρότερες συνομιλίες')); }

// (Ε)
assert('(Ε) the runner: 9201–9203 come in on a line of their own after the danger sessions, only when sessions are named and never in the hard set — the line the other tests pin stays as it was',
  /PEOPLE\.splice\(PEOPLE\.length - \(SL\.COMPOSITE_PERSONAS \|\| \[\]\)\.length, 0, \.\.\.\(SL\.DANGER_FIXED_PERSONAS \|\| \[\]\)\);[^\n]*\n  if \(only\.length && !has\('--hard'\)\) PEOPLE\.push\(\.\.\.\(SL\.TWO_SESSIONS_PERSONAS \|\| \[\]\)\);/.test(RUN) &&
  /SL\.MECHANISM_PERSONAS \|\| \[\], SL\.P3_PERSONAS \|\| \[\]\) : SL\.PERSONAS;/.test(RUN));
assert('(Ε) the runner: no cheap-model call for a session with noJudge — the judges leave it out themselves, and the line that lists the judged sessions is as it was (the benchmark test pins it)',
  /async function judgeSession\(s, user\) \{\n  if \(s\.persona && s\.persona\.noJudge\) return undefined;/.test(RUN) && /async function judgeVoice\(s, user\) \{\n  if \(s\.persona && s\.persona\.noJudge\) return;/.test(RUN) &&
  /const older = sessions\.filter\(s => !s\.persona\.bench\);/.test(RUN));
assert('(Ε) the runner: the session records twoSessions, noJudge, the numbers of the lines and what each step is (typed or pressed)',
  /twoSessions: !!p\.twoSessions, noJudge: !!p\.noJudge, lines: p\.twoSessions \? \(p\.lines \|\| null\) : null/.test(RUN) && /lineKinds: p\.twoSessions && Array\.isArray\(p\.fixed\) \? p\.fixed\.map\(st => \(st && st\.press \? 'press' : 'type'\)\) : null/.test(RUN));
assert('(Ε) the runner writes down, only for these sessions, the cards on the screen each time they change — and the app\'s own first line',
  /if \(p\.twoSessions\) \{ sess\.tsCards = \[\]; sess\.tsMethodLine = T\.methodLine \|\| null; \}/.test(RUN) && /if \(p\.twoSessions\) \{\s*\n\s*const all = \(s\.cards \|\| \[\]\)\.join/.test(RUN) && /sess\.tsCards\.push\(\{ typed: sess\.typed\.length, afterLine,/.test(RUN));
assert('(Ε) the runner ends these sessions by itself — after the last line, or earlier if the app puts up a card or a question of its own — right after the screen is written down, pressing nothing',
  /await check\(s\);\s*\n(?:\s*\/\/[^\n]*\n)+\s*if \(p\.twoSessions && Array\.isArray\(p\.fixed\)\) \{\s*\n\s*const done = fixedIdx >= p\.fixed\.length, own = !!\(s\.rootCard \|\| s\.warningCard \|\| s\.closureCard \|\| s\.memCard \|\| s\.offer \|\| s\.help \|\| s\.stepPhase \|\| s\.clarity \|\| s\.ended\);\s*\n\s*if \(done \|\| own\) \{ sess\.notes\.push\(done \?/.test(RUN) &&
  /τέλος των γραμμών του σεναρίου — δεν πατήθηκε τίποτα άλλο/.test(RUN));
assert('(Ε) the list\'s own texts (title, «Καμία από αυτές») are read from the app\'s source — in the block of this test the runner names them only as ROOT_PICK_TEXTS.title / .none, no copy of the words',
  /const ROOT_PICK_TEXTS = \(\(\) => \{ try \{ const m = fs\.readFileSync\(path\.join\(REPO, 'src', 'App\.jsx'\), 'utf8'\)\.match\(\/\^const ROOT_PICK_TEXTS = \(\\\{\.\*\\\}\);\$\/m\);/.test(RUN) &&
  (() => { const a = RUN.indexOf("if (p.twoSessions) {\n      const all = (s.cards || [])"), b = RUN.indexOf("app('[οθόνη της εφαρμογής μετά τη γραμμή", a);
    const blk = a >= 0 && b > a ? RUN.slice(a, b) : ''; return !!blk && /ROOT_PICK_TEXTS\.title/.test(blk) && /ROOT_PICK_TEXTS\.none/.test(blk) && !/Δικά σου λόγια|Καμία από αυτές/.test(blk); })() && !/Δικά σου λόγια από πριν/.test(LIBSRC));
assert('(Ε) the telemetry check of the whole session is not changed: its lines stand as they were, and for these sessions the findings are emptied on the next line (the script ends early on purpose; the events stay)',
  /telemetry: !p\.short \} \};/.test(RUN) && /\n  if \(!p\.closed && !p\.short\) for \(const x of SL\.telemetryIssues\(sess\.events, acts\)\) sess\.checks\.telemetry\.push\(x\);\n  if \(p\.twoSessions\) sess\.checks\.telemetry = \[\];/.test(RUN));
assert('(Ε) the workflow is NOT changed by this tool change: the form already takes «επιλογή» with the numbers of the sessions and a budget (so the run is: mode επιλογή, sessions 9201,9202,9203, budget 1.5, parallel 1)',
  (() => { const W = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'stress.yml'), 'utf8');
    return /\^\[0-9\]\[0-9\.,\]\*\$/.test(W) && /--sessions "\$SESSIONS" --budget "\$BUDGET" --parallel "\$\{PARALLEL:-1\}"/.test(W) && /secrets\.ANTHROPIC_API_KEY2 \|\| secrets\.ANTHROPIC_API_KEY/.test(W); })());

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
