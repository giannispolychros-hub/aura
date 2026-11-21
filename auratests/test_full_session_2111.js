// AURA — THE STRESS TOOL, 21/11/2026 (John, a second paid run on branch test-two-sessions — «Α. ΠΛΗΡΗΣ ΣΥΝΕΔΡΙΑ»): ONE whole session whose user lines are written word for word
// (no simulated user, no judge — only the real AURA answers), from his first line to the step card, and the report he asked for. TOOL ONLY: nothing here reads or changes
// src/App.jsx or api/aura.js, and no existing test changes (the lines that other tests pin stay byte for byte as they were).
//  (Α) the session: John's exact lines 1–6 and the card's «Ναι, αυτό είναι»; then three short answers of the step (ours, shown to him); his numbers; at most 14 lines; no judge
//  (Β) the plan: asked by number only, one run, fixed messages; the estimate counts no cheap-model call; the three versions of the first run stay exactly three
//  (Γ) the report (fullSessionReport): ONE numbered sequence — the user's lines, the model's replies, every text of the app (bubbles, cards, buttons) — the model's replies that
//      were a question, whether a step was written and with which words, the cost and the calls, the screen at the end
//  (Δ) the runner's wiring: the session is in the tool's people (on a line of its own), the cards and the buttons are written down each time they change, the page's capital
//      letters are switched off, the script ends at the step card or on anything it has no line for — pressing nothing — and the lines that the other tests pin are as they were
// On the screen (the runner itself, fake model, $0): node scripts/e2e_stage_a.cjs --stress --sessions 9204 --out <folder inside the temp folder>.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'));
const BL = require(path.join(ROOT, 'scripts', 'e2e_bench_lib.cjs'));
const RUN = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
const LIBSRC = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'), 'utf8');
const F = (SL.FULL_SESSION_PERSONAS || []).find(p => p.id === 9204);

assert('(load) the whole session and its report are there, and the tool\'s list of three versions is still three',
  !!F && SL.FULL_SESSION_PERSONAS.length === 1 && typeof SL.fullSessionReport === 'function' && SL.TWO_SESSIONS_PERSONAS.length === 3 && SL.TWO_SESSIONS_PERSONAS.every(p => !p.fullSession));

// (Α)
const JOHN = [{ say: 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά' }, { say: 'Είμαι κουρασμένος από τη δουλειά τον τελευταίο καιρό.' },
  { say: 'Τα λεφτά μετράνε, ο μισθός εδώ είναι σταθερός.' }, { say: 'Φοβάμαι το άγνωστο, δεν ξέρω τι θα βρω αλλού.' }, { press: true },
  { root: 'Φοβάμαι ότι θα φύγω και θα το μετανιώσω.' }, { card: 'yes' }];
assert('(Α) John\'s lines 1–4 (typed), 5 (the app\'s button), 6 (the root under the root question), 7 (the card\'s «Ναι, αυτό είναι») — word for word, in this order',
  !!F && JSON.stringify(F.fixed.slice(0, 7)) === JSON.stringify(JOHN));
{ const rest = F ? F.fixed.slice(7) : [];
  const words = t => String(t || '').trim().split(/\s+/).length;
  assert('(Α) then exactly three short answers of the step, in the order the app asks: the small thing (typed), «χωράει σε μία μέρα;» (the button «Ναι»), «Πότε;» (typed)',
    rest.length === 3 && typeof rest[0].step === 'string' && Object.keys(rest[0]).length === 1 && rest[1].fits === 'yes' && Object.keys(rest[1]).length === 1 && typeof rest[2].when === 'string' && Object.keys(rest[2]).length === 1);
  assert('(Α) the three answers are short and natural: 1–10 words each, a statement (no question mark), no advice, no number or date that is not in the words («Αύριο» is a day, no figure)',
    rest.length === 3 && [rest[0].step, rest[2].when].every(t => words(t) >= 1 && words(t) <= 10 && !/[;?;]/.test(t) && !/\d/.test(t)) && /\.$/.test(rest[0].step) && /\.$/.test(rest[2].when));
  assert('(Α) the step answer is about what the user said (a person who changed job: the user\'s own fear of the unknown and of regret) and does not give the model or the app anything to answer: no «Δεν ξέρω»',
    rest.length === 3 && !/δεν ξέρω/i.test(rest[0].step) && !/δεν ξέρω/i.test(rest[2].when)); }
assert('(Α) John\'s own line numbers, one for each step: 1, 2, 3, 4, 5, 6, 7α (the card), 7β (the small thing), 7γ (the size question), 7δ («Πότε»); ten lines, never more than 14',
  !!F && JSON.stringify(F.lines) === JSON.stringify(['1', '2', '3', '4', '5', '6', '7α', '7β', '7γ', '7δ']) && F.lines.length === F.fixed.length && F.fixed.length === 10 && F.fixed.length <= 14);
assert('(Α) no judge and no simulated user: noJudge, fixed steps only, no «forced» lines, no policy, not one of the other kinds of session',
  !!F && F.noJudge === true && F.fullSession === true && !F.twoSessions && Array.isArray(F.fixed) && !F.forced && !F.policy && !F.final && !F.bench && F.runs === 1 && /^Πλήρης συνεδρία /.test(F.name));
assert('(Α) the Coach screen is never reached: no step of the script is an offer («offer») or a clarity answer — the session ends at the step card',
  !!F && !F.fixed.some(st => 'offer' in st || 'clarity' in st || 'word' in st || 'smaller' in st));
assert('(Α) the number 9204 is not a benchmark scenario (9001–9199) and no other session of the tool has it',
  !BL.isBenchAlias('9204') && [].concat(SL.PERSONAS, SL.HARD_PERSONAS, SL.FOUNDER_PERSONAS || [], SL.VOICE_PERSONAS || [], SL.LOOP_PERSONAS || [], SL.REHEARSAL_PERSONAS || [],
    SL.TARGETED_PERSONAS || [], SL.FINAL_PERSONAS || [], SL.MECHANISM_PERSONAS || [], SL.P3_PERSONAS || [], SL.COMPOSITE_PERSONAS || [], SL.DANGER_FIXED_PERSONAS || [], SL.TWO_SESSIONS_PERSONAS || []).every(p => p.id !== 9204));

// (Β)
{ const plan = SL.planRuns(SL.FULL_SESSION_PERSONAS, ['9204']);
  assert('(Β) asked by number, the plan is exactly one session, 9204, fixed messages', plan.length === 1 && plan[0].label === '9204' && !!plan[0].persona.fixed);
  assert('(Β) a plan that does not ask for it does not have it', SL.planRuns(SL.FULL_SESSION_PERSONAS, ['14']).length === 0 && SL.planRuns(SL.FULL_SESSION_PERSONAS, ['9201']).length === 0);
  const e = SL.estimateCost(plan, 313386);
  assert('(Β) the estimate: 1 session, no simulated user, no cheap-model call (no judge), and even the high estimate (6 calls, a cold start) is under the budget of $1.50',
    e.sessions === 1 && e.sims === 0 && e.fixed === 1 && e.userCalls === 0 && e.high < 1.5 && e.low > 0); }

// (Γ)
const ML = 'Δεν θα σου δώσω λίστα με αιτίες και λύσεις. Θα σε ρωτάω ένα πράγμα τη φορά, ώστε να το βρεις εσύ.';
const ROOT_Q = 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;';
const [L1, L2, L3, L4] = F.fixed.slice(0, 4).map(x => x.say), ROOTL = F.fixed[5].root, STEP = F.fixed[7].step, WHEN = F.fixed[9].when;
const STEPBUB = '«' + ROOTL + '»\nΑυτό το βρήκες εσύ — χωρίς καμία συμβουλή. Τώρα ξέρεις τι γίνεται.\n\nΤο πρώτο βήμα είναι το πιο δύσκολο. Γι\' αυτό δεν θέλω το τέλειο ούτε το πιο γενναίο. Θέλω το πιο εύκολό σου.\nΠοιο είναι το πιο μικρό πράγμα που μπορείς να κάνεις γι\' αυτό;';
const STEPCARD = 'Τι ήξερες: «' + L1 + '»\nΤι βρήκες: «' + ROOTL + '»\nΤι θα κάνεις: «' + STEP + '»\nΠότε: «' + WHEN + '»';
const call = (n, o) => Object.assign({ kind: 'chat', status: 200, typed: n, cacheWrite: 0, cacheRead: 85000, cost: 0.03, ms: 2000 }, o || {});
const KINDS = ['type', 'type', 'type', 'type', 'press', 'type', 'press', 'type', 'press', 'type'];
const TURNS = () => [
  { who: 'app', text: '[κουμπιά στην οθόνη μετά τη γραμμή —]: «μνήμη» · «αρχείο» · «🎙» · «Go (ανενεργό)» · πεδίο γραφής, υπόδειξη: «Γράψ\' το όπως έρχεται…»' },
  { who: 'user', text: L1 }, { who: 'aura', text: ML + '\nΤι σε κρατάει εκεί;' },
  { who: 'app', text: '[κουμπιά στην οθόνη μετά τη γραμμή 1]: «μνήμη» · «Νομίζω βρήκα τι με απασχολεί» · «Go (ανενεργό)» · πεδίο γραφής, υπόδειξη: «Γράψε...»' },
  { who: 'user', text: L2 }, { who: 'aura', text: 'Κουρασμένος από τη δουλειά. Τι σε κουράζει περισσότερο;' },
  { who: 'user', text: L3 }, { who: 'aura', text: 'Ο μισθός είναι σταθερός.' },
  { who: 'user', text: L4 }, { who: 'aura', text: 'Φοβάσαι το άγνωστο; Θα το έλεγες φόβο. Πες μου περισσότερα.' },
  { who: 'app', text: '[πάτησε «Νομίζω βρήκα τι με απασχολεί»]' },
  { who: 'app', text: '[ερώτηση της ρίζας] ' + ROOT_Q },
  { who: 'aura', text: ROOT_Q },
  { who: 'app', text: '[κάρτες στην οθόνη μετά τη γραμμή 5]\n' + ROOT_Q + '\nΔεν το βρήκα ακόμα, συνέχισε' },
  { who: 'user', text: ROOTL },
  { who: 'app', text: '[κάρτες στην οθόνη μετά τη γραμμή 6]\nΤι ήξερες\n«' + L1 + '»\nΤι βρήκες\n«' + ROOTL + '»\nΑυτά είναι δικά σου λόγια, όχι δικά μου. Είναι αυτό που πραγματικά σε απασχολεί;\nΔιόρθωσε\nΝαι, αυτό είναι\nΔεν το βρήκα ακόμα, συνέχισε' },
  { who: 'app', text: '[κουμπιά στην οθόνη μετά τη γραμμή 6]: «μνήμη» · «Διόρθωσε» · «Ναι, αυτό είναι» · «Δεν το βρήκα ακόμα, συνέχισε» · πεδίο γραφής: δεν φαίνεται' },
  { who: 'app', text: '[κάρτα ρίζας: «' + ROOTL + '»]' },
  { who: 'app', text: '[πάτησε «Ναι, αυτό είναι»]' },
  { who: 'aura', text: STEPBUB },
  { who: 'app', text: '[βήμα — φαίνεται μόνο στην οθόνη, δεν στέλνεται]' },
  { who: 'user', text: STEP },
  { who: 'aura', text: 'Είναι τόσο μικρό που χωράει σε μία μέρα;' },
  { who: 'app', text: '[πάτησε «Ναι»]' },
  { who: 'aura', text: 'Πότε;' },
  { who: 'app', text: '[πότε — φαίνεται μόνο στην οθόνη, δεν στέλνεται]' },
  { who: 'user', text: WHEN },
  { who: 'app', text: '[κάρτες στην οθόνη μετά τη γραμμή 7δ]\n' + STEPCARD + '\n— — —\nΤώρα, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα, από το 1 έως το 10;\n1\n2' },
  { who: 'app', text: '[κάρτα βήματος]\n' + STEPCARD }];
const mk = o => Object.assign({ label: '9204', persona: { id: 9204, key: 'full_s1', name: F.name, fullSession: true, noJudge: true, lines: F.lines, lineKinds: KINDS },
  fsMethodLine: ML, typed: [L1, L2, L3, L4, ROOTL, STEP, WHEN], notes: ['εμφανίστηκε η κάρτα βήματος — τέλος του σεναρίου, δεν πατήθηκε τίποτα άλλο'], modelTexts: [], events: [{ ev: 'session_started' }, { ev: 'root_card_shown' }, { ev: 'step_shown' }],
  stepCard: STEPCARD, fsFinal: 'Βρίσκουμε την ερώτηση που μετράει.\nΤίποτα άλλο.\n' + L1, turns: TURNS(),
  calls: [1, 2, 3, 4].map(n => call(n, n === 1 ? { cacheWrite: 85000, cacheRead: 0, cost: 0.32 } : {})), cost: 0.41, checks: {}, applies: {} }, o || {});
const META = { spent: 0.41, budget: 1.5, by: { aura: 0.41, user: 0 }, userCalls: [], stopped: null, version: { commit: 'abc' } };
const rep = (ss, meta) => SL.fullSessionReport(ss, meta || META).join('\n');
const R = rep([mk()]);
const row = n => { const i = R.indexOf('**' + n + '. '); const j = R.indexOf('\n**' + (n + 1) + '. ', i + 1); const k = R.indexOf('\n#### ', i + 1); const ends = [j, k].filter(x => x > 0); return i < 0 ? '' : R.slice(i, ends.length ? Math.min(...ends) : R.length); };

assert('(Γ) other runs get nothing: no sessions, sessions that are not this one, give an empty report — and a stress report without this session has no such heading',
  SL.fullSessionReport([], META).length === 0 && SL.fullSessionReport([{ persona: { id: 14 }, turns: [] }], META).length === 0 && SL.fullSessionReport(null, null).length === 0 &&
  !/Η πλήρης συνεδρία — η αναφορά του John/.test(SL.buildStressReport([{ label: '14', persona: { id: 14, name: 'x' }, turns: [], checks: {}, applies: {}, calls: [], notes: [], cost: 0 }], META)));
assert('(Γ) ONE numbered sequence: every item is «**N. …**» with N = 1, 2, 3… with no gap, and the user\'s lines, the model\'s replies and the app\'s texts are in it',
  (() => { const ns = [...R.matchAll(/^\*\*(\d+)\. /gm)].map(m => Number(m[1])); return ns.length >= 25 && ns.every((n, i) => n === i + 1); })());
assert('(Γ) every line of the user is written with John\'s own number — 1, 2, 3, 4 typed; 5 the button; 6 the root; 7α the card button; 7β the small thing; 7γ the size button «Ναι»; 7δ «Πότε» — word for word',
  /\*\*2\. ΧΡΗΣΤΗΣ · γραμμή 1 \(γράφει\)\*\*\n\nΔεν ξέρω αν πρέπει να αλλάξω δουλειά/.test(R) && /ΧΡΗΣΤΗΣ · γραμμή 2 \(γράφει\)\*\*\n\nΕίμαι κουρασμένος από τη δουλειά τον τελευταίο καιρό\./.test(R) &&
  /ΧΡΗΣΤΗΣ · γραμμή 3 \(γράφει\)\*\*\n\nΤα λεφτά μετράνε, ο μισθός εδώ είναι σταθερός\./.test(R) && /ΧΡΗΣΤΗΣ · γραμμή 4 \(γράφει\)\*\*\n\nΦοβάμαι το άγνωστο, δεν ξέρω τι θα βρω αλλού\./.test(R) &&
  /ΧΡΗΣΤΗΣ · γραμμή 5 \(πατά κουμπί\)\*\*\n\n«Νομίζω βρήκα τι με απασχολεί»/.test(R) && /ΧΡΗΣΤΗΣ · γραμμή 6 \(γράφει\)\*\*\n\nΦοβάμαι ότι θα φύγω και θα το μετανιώσω\./.test(R) &&
  /ΧΡΗΣΤΗΣ · γραμμή 7α \(πατά κουμπί\)\*\*\n\n«Ναι, αυτό είναι»/.test(R) && new RegExp('ΧΡΗΣΤΗΣ · γραμμή 7β \\(γράφει\\)\\*\\* — απάντηση στην ερώτηση «βήμα» του βήματος\\n\\n' + STEP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(R) &&
  /ΧΡΗΣΤΗΣ · γραμμή 7γ \(πατά κουμπί\)\*\*\n\n«Ναι»/.test(R) && new RegExp('ΧΡΗΣΤΗΣ · γραμμή 7δ \\(γράφει\\)\\*\\* — απάντηση στην ερώτηση «πότε» του βήματος\\n\\n' + WHEN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(R));
assert('(Γ) the model\'s replies are numbered Α1…Α4; the app\'s own first line is written apart, before the first reply, and is NOT part of it',
  /\*\*3\. ΕΦΑΡΜΟΓΗ · η πρώτη γραμμή της \(την προσθέτει μόνη της στην αρχή της 1ης απάντησης\)\*\*\n\nΔεν θα σου δώσω λίστα/.test(R) && /\*\*4\. AURA \(μοντέλο\) · απάντηση Α1\*\*[^\n]*\n\nΤι σε κρατάει εκεί;/.test(R) &&
  !/Α1\*\*[^\n]*\n\nΔεν θα σου δώσω/.test(R) && /απάντηση Α4\*\*/.test(R) && !/απάντηση Α5\*\*/.test(R));
assert('(Γ) the app\'s own bubbles — the root question, the text after «Ναι», «Είναι τόσο μικρό…;», «Πότε;» — are marked as the app\'s, never as the model\'s, and the ones that end in a question mark say so',
  /ΕΦΑΡΜΟΓΗ · φυσαλίδα της AURA — τη γράφει η εφαρμογή, όχι το μοντέλο\*\* — τελειώνει με ερωτηματικό\n\nΠες το με μία φράση/.test(R) && /ΕΦΑΡΜΟΓΗ · φυσαλίδα της AURA[^\n]*\n\n«Φοβάμαι ότι θα φύγω/.test(R) &&
  /ΕΦΑΡΜΟΓΗ · φυσαλίδα της AURA[^\n]*— τελειώνει με ερωτηματικό\n\nΕίναι τόσο μικρό που χωράει σε μία μέρα;/.test(R) && /ΕΦΑΡΜΟΓΗ · φυσαλίδα της AURA[^\n]*— τελειώνει με ερωτηματικό\n\nΠότε;/.test(R) &&
  !/AURA \(μοντέλο\)[^\n]*\n\n(?:Πες το με μία φράση|Πότε;|Είναι τόσο μικρό)/.test(R));
assert('(Γ) a reply of the model is marked ΕΡΩΤΗΣΗ when its last visible character is a question mark; «περιέχει ερώτηση» when it has one inside but ends otherwise; «όχι ερώτηση» when it has none',
  /απάντηση Α1\*\* — \*\*ΕΡΩΤΗΣΗ\*\* \(τελειώνει με ερωτηματικό\)/.test(R) && /απάντηση Α2\*\* — \*\*ΕΡΩΤΗΣΗ\*\*/.test(R) && /απάντηση Α3\*\* — όχι ερώτηση/.test(R) &&
  /απάντηση Α4\*\* — \*\*περιέχει ερώτηση\*\* \(δεν τελειώνει με ερωτηματικό\)/.test(R));
{ const q = R.slice(R.indexOf('#### Ποιες απαντήσεις'), R.indexOf('#### Βήμα'));
  assert('(Γ) the list of the questions: each reply, its number in the sequence above, the question sentences word for word; the totals line adds them up (2 end with a mark, 3 have one)',
    /- Α1 \(αριθμός 4 παραπάνω\): \*\*ΕΡΩΤΗΣΗ\*\* — «Τι σε κρατάει εκεί;»/.test(q) && /- Α2 \(αριθμός 7 παραπάνω\): \*\*ΕΡΩΤΗΣΗ\*\* — «Τι σε κουράζει περισσότερο;»/.test(q) && /- Α3 \(αριθμός 9 παραπάνω\): όχι ερώτηση\n/.test(q) &&
    /- Α4 \(αριθμός 11 παραπάνω\): \*\*περιέχει ερώτηση\*\*, δεν τελειώνει με ερωτηματικό — «Φοβάμαι το άγνωστο;»|- Α4 \(αριθμός 11 παραπάνω\): \*\*περιέχει ερώτηση\*\*, δεν τελειώνει με ερωτηματικό — «Φοβάσαι το άγνωστο;»/.test(q) &&
    /Σύνολο: 2 από 4 τελειώνουν με ερωτηματικό · 3 από 4 έχουν ερωτηματικό \(μέσα ή στο τέλος\)\./.test(q)); }
assert('(Γ) the cards of the app are written word for word, with the line they came after: the root question card, the root card («Τι ήξερες», «Τι βρήκες», the line «Αυτά είναι δικά σου λόγια…», the three buttons), the step card',
  /ΕΦΑΡΜΟΓΗ · κάρτες στην οθόνη \(μετά τη γραμμή 5\)\*\*\n\nΠες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;  \nΔεν το βρήκα ακόμα, συνέχισε/.test(R) &&
  /κάρτες στην οθόνη \(μετά τη γραμμή 6\)\*\*\n\nΤι ήξερες  \n«Δεν ξέρω αν πρέπει να αλλάξω δουλειά»  \nΤι βρήκες  \n«Φοβάμαι ότι θα φύγω και θα το μετανιώσω\.»  \nΑυτά είναι δικά σου λόγια, όχι δικά μου\./.test(R) &&
  /Διόρθωσε  \nΝαι, αυτό είναι  \nΔεν το βρήκα ακόμα, συνέχισε/.test(R) && /κάρτες στην οθόνη \(μετά τη γραμμή 7δ\)\*\*\n\nΤι ήξερες: «Δεν ξέρω αν πρέπει να αλλάξω δουλειά»/.test(R));
assert('(Γ) the buttons of the screen are written word for word each time they change — the start of the session is «στην αρχή, πριν από κάθε γραμμή», a button that cannot be pressed says «(ανενεργό)», the box\'s own hint is there',
  /ΕΦΑΡΜΟΓΗ · κουμπιά στην οθόνη \(στην αρχή, πριν από κάθε γραμμή\)\*\*\n\n«μνήμη» · «αρχείο» · «🎙» · «Go \(ανενεργό\)» · πεδίο γραφής, υπόδειξη: «Γράψ' το όπως έρχεται…»/.test(R) &&
  /κουμπιά στην οθόνη \(μετά τη γραμμή 6\)\*\*\n\n«μνήμη» · «Διόρθωσε» · «Ναι, αυτό είναι» · «Δεν το βρήκα ακόμα, συνέχισε» · πεδίο γραφής: δεν φαίνεται/.test(R));
assert('(Γ) the tool\'s own marks that only repeat what the screen shows ([κάρτα ρίζας: …], [ερώτηση της ρίζας] …, the «φαίνεται μόνο στην οθόνη» marks) are not printed as texts of the app; the step card is printed once, not twice',
  !/σημείωση του εργαλείου/.test(R) && !/\[κάρτα ρίζας/.test(R) && !/\[ερώτηση της ρίζας\]/.test(R) && !/φαίνεται μόνο στην οθόνη/.test(R) &&
  (R.match(/^\*\*\d+\. ΕΦΑΡΜΟΓΗ · κάρτα βήματος/gm) || []).length === 0 && (R.match(/\*\*\d+\. ΕΦΑΡΜΟΓΗ · κάρτες στην οθόνη \(μετά τη γραμμή 7δ\)/g) || []).length === 1);
{ const s = mk({ turns: TURNS().filter(t => !/γραμμή 7δ\]\n/.test(t.text)) }), r = rep([s]);
  assert('(Γ) the step card is printed as the app\'s text when no cards block of the screen has it (the tool\'s own mark of it is the only place) — once, as «κάρτα βήματος»',
    (r.match(/^\*\*\d+\. ΕΦΑΡΜΟΓΗ · κάρτα βήματος\*\*\n\nΤι ήξερες: «Δεν ξέρω αν πρέπει να αλλάξω δουλειά»  \nΤι βρήκες:/gm) || []).length === 1); }
{ const b = R.slice(R.indexOf('#### Βήμα'), R.indexOf('#### Πραγματικό κόστος'));
  assert('(Γ) the step block: the step card shown (ΝΑΙ, with its words), a step written (ΝΑΙ, line 7β, the words), the small piece not asked, «Πότε» (line 7δ, the words), the buttons pressed, the count of lines against the limit of 14',
    /- Εμφανίστηκε η κάρτα βήματος: \*\*ΝΑΙ\*\* — «Τι ήξερες: «Δεν ξέρω αν πρέπει να αλλάξω δουλειά» ⏎ Τι βρήκες:/.test(b) && /- Γράφτηκε βήμα \(απάντηση στην ερώτηση «Ποιο είναι το πιο μικρό πράγμα…»\): \*\*ΝΑΙ\*\* — γραμμή 7β: «Να μιλήσω με έναν φίλο/.test(b) &&
    /- Μικρότερο κομμάτι [^\n]*: δεν ζητήθηκε/.test(b) && /- «Πότε»: γραμμή 7δ: «Αύριο το απόγευμα\.»/.test(b) &&
    /- Κουμπιά που πάτησε ο χρήστης: γραμμή 5 «Νομίζω βρήκα τι με απασχολεί» · γραμμή 7α «Ναι, αυτό είναι» · γραμμή 7γ «Ναι»/.test(b) && /- Γραμμές χρήστη που γράφτηκαν: 7 · κουμπιά: 3 · σύνολο 10 \(όριο 14\)\./.test(b)); }
{ const all = TURNS(), s = mk({ stepCard: null, turns: all.slice(0, all.findIndex(t => t.text === STEPBUB) + 1), typed: [L1, L2, L3, L4, ROOTL] });
  const b = rep([s]); const bs = b.slice(b.indexOf('#### Βήμα'), b.indexOf('#### Πραγματικό κόστος'));
  assert('(Γ) when the script stopped before a step was written, the step block says ΟΧΙ — it never invents a step or a card', /- Εμφανίστηκε η κάρτα βήματος: \*\*ΟΧΙ\*\*/.test(bs) && /- Γράφτηκε βήμα [^\n]*: \*\*ΟΧΙ\*\*/.test(bs) && /- «Πότε»: δεν γράφτηκε/.test(bs)); }
assert('(Γ) the cost block of the session: its cost, its calls and HTTP codes, no cheap-model call, the names of the device\'s events (names only); and the totals: the real cost, the calls, the cache numbers, one line for each call',
  /- Κόστος: \$0\.4100 · κλήσεις AURA: 4 · κωδικοί HTTP: 200, 200, 200, 200 · κλήσεις Haiku: 0/.test(R) && /- Γεγονότα τηλεμετρίας της συσκευής \(μόνο ονόματα\): session_started, root_card_shown, step_shown/.test(R) &&
  /\*\*Πραγματικό κόστος:\*\* \$0\.4100 \(AURA \$0\.4100, Haiku \$0\.0000\) από όριο \$1\.50 · \*\*κλήσεις AURA:\*\* 4 · κωδικοί HTTP: 200 ×4 · \*\*κλήσεις Haiku:\*\* 0 · εγγραφές cache: 1 \(85000 tokens\) · αναγνώσεις cache: 3/.test(R) &&
  (R.match(/- κλήση \d: HTTP 200/g) || []).length === 4 && /Έκδοση που έτρεξε: \{"commit":"abc"\}/.test(R));
assert('(Γ) the screen at the end — all the text the page shows — is in a code block, and a block mark inside the text cannot close it early',
  /#### Η οθόνη στο τέλος — όλο το ορατό κείμενο της σελίδας\n\n```\nΒρίσκουμε την ερώτηση που μετράει\./.test(R) && /\n```\n/.test(R) && /```\n\n### Σύνολο του τρεξίματος/.test(R) &&
  !/'''/.test(rep([mk({ fsFinal: 'α' })])) && /'''/.test(rep([mk({ fsFinal: 'α ``` β' })])) && (rep([mk({ fsFinal: 'α ``` β' })]).match(/```/g) || []).length === 2);
{ const s = mk({ calls: [1, 2, 3].map(n => call(n)).concat([call(4, { status: 500 })]) });
  const r = rep([s]);
  assert('(Γ) a bubble is the model\'s only when its line made a call that came back 200: with the 4th call failing (500), the next bubble belongs to the app — it is not counted as reply Α4',
    /απάντηση Α3\*\*/.test(r) && !/απάντηση Α4\*\*/.test(r) && /ΕΦΑΡΜΟΓΗ · φυσαλίδα της AURA[^\n]*\n\nΦοβάσαι το άγνωστο/.test(r) && /κωδικοί HTTP: 200, 200, 200, 500/.test(r)); }
{ const s = mk({ modelTexts: [{ kind: 'chat', typed: 2, text: 'Κουρασμένος από τη δουλειά [[x]] ΚΕΙΜΕΝΟ ΠΟΥ ΑΛΛΑΞΕ', filtered: 'Κουρασμένος από τη δουλειά.' }] });
  assert('(Γ) when the app changed the model\'s reply, the raw reply is printed too (provenance); when it did not, nothing extra',
    /\*Η εφαρμογή άλλαξε την απάντηση του μοντέλου μετά το μήνυμα 2 — ακατέργαστο:\* Κουρασμένος από τη δουλειά \[\[x\]\] ΚΕΙΜΕΝΟ ΠΟΥ ΑΛΛΑΞΕ/.test(rep([s])) && !/ακατέργαστο/.test(R)); }
{ const s = mk({ typed: [L1, L2, L3, L4, ROOTL, STEP, WHEN, 'γραμμή που δεν φάνηκε'] });
  assert('(Γ) a line that was typed but never showed as the user\'s bubble on the screen is said so (the report does not hide it)', /Γραμμές που γράφτηκαν αλλά δεν φάνηκαν ως φυσαλίδα του χρήστη στην οθόνη:\* «γραμμή που δεν φάνηκε»/.test(rep([s])) && !/Γραμμές που γράφτηκαν αλλά δεν φάνηκαν/.test(R)); }
{ const full = SL.buildStressReport([mk()], META);
  assert('(Γ) the report is part of the stress report that the workflow publishes, once, before the worst conversations, and the three versions\' report is not there',
    (full.match(/## Η πλήρης συνεδρία — η αναφορά του John/g) || []).length === 1 && /### Σύνολο του τρεξίματος/.test(full) && full.indexOf('## Η πλήρης συνεδρία') < full.indexOf('## Οι 5 χειρότερες συνομιλίες') &&
    !/## Οι τρεις εκδοχές — η αναφορά του John/.test(full)); }

// (Δ)
const IDX = s => RUN.indexOf(s);
assert('(Δ) the runner: 9204 comes in on a line of its own right after the three versions, only when sessions are named and never in the hard set — the two lines the other tests pin stay as they were',
  /(?:^|\n)  if \(only\.length && !has\('--hard'\)\) PEOPLE\.push\(\.\.\.\(SL\.TWO_SESSIONS_PERSONAS \|\| \[\]\)\);[^\n]*\n  if \(only\.length && !has\('--hard'\)\) PEOPLE\.push\(\.\.\.\(SL\.FULL_SESSION_PERSONAS \|\| \[\]\)\);/.test(RUN) &&
  /(?:^|\n)  if \(only\.length && !has\('--hard'\)\) PEOPLE\.splice\(PEOPLE\.length - \(SL\.COMPOSITE_PERSONAS \|\| \[\]\)\.length, 0, \.\.\.\(SL\.DANGER_FIXED_PERSONAS \|\| \[\]\)\);[^\n]*\n  if \(only\.length && !has\('--hard'\)\) PEOPLE\.push\(\.\.\.\(SL\.TWO_SESSIONS_PERSONAS/.test(RUN) &&
  /SL\.MECHANISM_PERSONAS \|\| \[\], SL\.P3_PERSONAS \|\| \[\]\) : SL\.PERSONAS;/.test(RUN));
assert('(Δ) the runner: the session records fullSession, noJudge, the numbers of the lines and what each step is (typed, or a button: the root button, the card\'s «Ναι», the size question\'s «Ναι») — on lines of its own; the lines of the three versions stay as they were',
  /(?:^|\n)  if \(p\.fullSession\) Object\.assign\(sess\.persona, \{ fullSession: true, noJudge: true, lines: p\.lines \|\| null,\n    lineKinds: Array\.isArray\(p\.fixed\) \? p\.fixed\.map\(st => \(st && \(st\.press \|\| st\.card \|\| st\.fits\)\) \? 'press' : 'type'\) : null \}\);/.test(RUN) &&
  /twoSessions: !!p\.twoSessions, noJudge: !!p\.noJudge, lines: p\.twoSessions \? \(p\.lines \|\| null\) : null/.test(RUN) && /lineKinds: p\.twoSessions && Array\.isArray\(p\.fixed\) \? p\.fixed\.map\(st => \(st && st\.press \? 'press' : 'type'\)\) : null/.test(RUN));
assert('(Δ) the runner: for this session only, the page\'s capital-letter style is switched off (the text itself is not touched) and the app\'s own first line is kept',
  /(?:^|\n)  if \(p\.fullSession\) \{ sess\.fsMethodLine = T\.methodLine \|\| null; await page\.addStyleTag\(\{ content: '\*\{text-transform:none !important\}' \}\)\.catch\(\(\) => \{\}\); \}/.test(RUN) &&
  !/addStyleTag/.test(RUN.replace(/(?:^|\n)  if \(p\.fullSession\) \{ sess\.fsMethodLine[^\n]*/, '')));
assert('(Δ) the runner writes down, only for this session, the cards and the buttons (with the box\'s hint) each time they change — inside `check`, before the code that reads the labels; only buttons that are on the screen, the text as written (textContent)',
  (() => { const a = IDX("    if (p.fullSession) {\n      const cardsAll = (s.cards || []).join("), b = IDX('    for (const l of SL.auraLabelFindings(s.feed))'); const blk = a >= 0 && b > a ? RUN.slice(a, b) : '';
    return !!blk && /app\('\[κάρτες στην οθόνη μετά τη γραμμή '/.test(blk) && /app\('\[κουμπιά στην οθόνη μετά τη γραμμή '/.test(blk) && /sig !== fsLastSig/.test(blk) && /await fsUi\(\)/.test(blk) && !/press\(|click\(/.test(blk); })() &&
  /const shown = el => el\.getClientRects\(\)\.length > 0 && getComputedStyle\(el\)\.visibility !== 'hidden';/.test(RUN) && /\(b\.textContent \|\| ''\)\.replace\(\/\\s\+\/g, ' '\)\.trim\(\)/.test(RUN) && /\(b\.disabled \? ' \(ανενεργό\)' : ''\)/.test(RUN));
assert('(Δ) the runner ends this session by itself — after the step card (written down first), after the last line, or the moment the app puts up something the script has no line for — and presses nothing: the block comes BEFORE any press of the loop and right after the three versions\' block',
  (() => { const a = IDX("    if (p.fullSession && Array.isArray(p.fixed)) {"), t = IDX("    if (p.twoSessions && Array.isArray(p.fixed)) {"), c = IDX("    if (crisisAt >= 0) {"), w = IDX("    if (s.warningCard) { await press(");
    const blk = a >= 0 && c > a ? RUN.slice(a, c) : '';
    return t >= 0 && a > t && a < c && c < w && /if \(s\.stepCard && !sess\.stepCard\) \{ sess\.stepCard = s\.stepCard; app\('\[κάρτα βήματος\]\\n' \+ s\.stepCard\); \}/.test(blk) &&
      /const unscripted = sp \? !\(st0 && \(sp === 'fits' \? 'fits' in st0 : sp in st0\)\) : s\.rootCard \? !\(st0 && st0\.card\) : s\.ask \? !\(st0 && st0\.root !== undefined\) : false;/.test(blk) &&
      /const own = !!\(s\.warningCard \|\| s\.closureCard \|\| s\.memCard \|\| s\.offer \|\| s\.help \|\| s\.clarity \|\| s\.ended \|\| s\.firstWhy \|\| unscripted\), done = fixedIdx >= p\.fixed\.length;/.test(blk) &&
      /if \(s\.stepCard \|\| done \|\| own\) \{ sess\.notes\.push\(/.test(blk) && /εμφανίστηκε η κάρτα βήματος — τέλος του σεναρίου, δεν πατήθηκε τίποτα άλλο/.test(blk) &&
      /τέλος των γραμμών του σεναρίου — η κάρτα βήματος δεν εμφανίστηκε/.test(blk) &&
      /η εφαρμογή έδειξε κάτι που το σενάριο δεν έχει γραμμή για αυτό/.test(blk) && /break; \}\n    \}$/.test(blk.trimEnd() + '') && !/press\(|click\(/.test(blk); })());
assert('(Δ) the runner writes the whole text of the page at the end (for the report), after the loop and before the line that says why the test stopped; and the telemetry findings of this session are emptied on a line after the three versions\' line',
  (() => { const a = IDX("  if (p.fullSession) sess.fsFinal = await page.locator('body').innerText()"), b = IDX("  if (stopped) sess.notes.push('ΣΤΑΜΑΤΗΣΕ: ' + stopped);"), s0 = IDX('  await sync();\n  if (stopped)'); return a > 0 && b > a && (s0 < 0 || s0 < a); })() &&
  /(?:^|\n)  if \(!p\.closed && !p\.short\) for \(const x of SL\.telemetryIssues\(sess\.events, acts\)\) sess\.checks\.telemetry\.push\(x\);\n  if \(p\.twoSessions\) sess\.checks\.telemetry = \[\];[^\n]*\n  if \(p\.fullSession\) sess\.checks\.telemetry = \[\];/.test(RUN));
assert('(Δ) the other lines that the other tests pin are as they were: the judges leave a noJudge session out themselves, the line that lists the judged sessions, and the telemetry flag of the session',
  /async function judgeSession\(s, user\) \{\n  if \(s\.persona && s\.persona\.noJudge\) return undefined;/.test(RUN) && /async function judgeVoice\(s, user\) \{\n  if \(s\.persona && s\.persona\.noJudge\) return;/.test(RUN) &&
  /const older = sessions\.filter\(s => !s\.persona\.bench\);/.test(RUN) && /telemetry: !p\.short \} \};/.test(RUN));
assert('(Δ) the library: the new list and the report are added AFTER the export list (which stays as it was), and the report is called from the stress report right after the three versions\' report',
  /\nmodule\.exports\.FULL_SESSION_PERSONAS = FULL_SESSION_PERSONAS;\nmodule\.exports\.fullSessionReport = fullSessionReport;\n$/.test(LIBSRC) && /\n  L\.push\(\.\.\.twoSessionsReport\(S, m\)\);[^\n]*\n  L\.push\(\.\.\.fullSessionReport\(S, m\)\);/.test(LIBSRC) &&
  /\n  USER_MODEL, PRICES, BUDGET_CAP,/.test(LIBSRC));
assert('(Δ) the workflow is NOT changed by this: the form takes «επιλογή» with the numbers of the sessions and a budget (so the run is: mode επιλογή, sessions 9204, budget 1.5, parallel 1)',
  (() => { const W = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'stress.yml'), 'utf8');
    return /\^\[0-9\]\[0-9\.,\]\*\$/.test(W) && /--sessions "\$SESSIONS" --budget "\$BUDGET" --parallel "\$\{PARALLEL:-1\}"/.test(W) && /secrets\.ANTHROPIC_API_KEY2 \|\| secrets\.ANTHROPIC_API_KEY/.test(W); })());

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
