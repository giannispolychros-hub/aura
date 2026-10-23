// AURA — John, 17/10/2026 (ADR «17 Οκτωβρίου (δ)»), for the test of the 20 only. Four changes, then the freeze:
//   1  First-WHY: with the switch open (?stageA=1) it does NOT fire — the model writes the first reply, under the method line.
//      The old flow (switch closed) stays as it is; the safety paths come first, as today, with no method line.
//   2  The card line: «Με το "Ναι" κλείνει αυτό το κομμάτι και σου δείχνω τι ακολουθεί.»
//   3  The step, after «Ναι» on the root card — switch open only, outside the risk paths, NO model call:
//      (α) John's text, verbatim · (β) the step, typed like the root phrase, with «Δεν ξέρω ακόμα» · (γ) «Είναι τόσο μικρό που
//      χωράει σε μία μέρα;» «Ναι» / «Όχι, είναι μεγάλο» → «Τότε ποιο είναι το πρώτο μικρό κομμάτι του;» exactly once · (δ) «Πότε;»
//      with «Δεν ξέρω ακόμα» · (ε) the card in the user's words (no «Πότε» line if they did not write one), the SAME text as the copy and the
//      download · (στ) «Δεν ξέρω ακόμα» at the step → «Κι αν όχι τώρα, αυτό που βρήκες είναι ήδη δικό σου.» · (ζ) clarity, the word,
//      the end, as today · (η) the safety detectors on every typed text of the step: a signal stops the step flow at once and the
//      message takes the existing safety path · (θ) the €6 screen and the 4-option question stay in the code, behind ONE closed
//      constant · (ι) numbers only, no fake 0 · (ια) the step and «Πότε» are written nowhere.
//   4  TESTER_INVITATION.md — text only (checked at the end of this file).
// The browser half (the real page, both phone sizes, crisis in each step, double tap, back/reload, privacy) is section ST of
// scripts/e2e_stage_a.cjs.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name) {
  const C = CODE;
  const a = C.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = C.indexOf('(', a), depth = 0;
  for (; k < C.length; k++) { if (C[k] === '(') depth++; else if (C[k] === ')') { depth--; if (depth === 0) break; } }
  const b = C.indexOf('{', k); depth = 0;
  for (let j = b; j < C.length; j++) { if (C[j] === '{') depth++; else if (C[j] === '}') { depth--; if (depth === 0) return C.slice(a, j + 1); } }
  return null;
}
const textsSrc = (() => { const a = CODE.indexOf('const STAGE_A_TEXTS = {'); return a >= 0 ? CODE.slice(a, CODE.indexOf('\n};', a) + 3) : ''; })();
const NAMES = ['initialStageAState', 'stageAStep', 'stageAInputHidden', 'stageATelemetry', 'stageAFlowTelemetry', 'stageAStepTelemetry',
  'buildRootEndLines', 'buildRootStepLines', 'buildStepCardText', 'buildRootCopyText', 'recordTelemetry', 'detectSafetySignal', 'stageAStepOpen', 'buildStageAShareText'];
let F = {};
try {
  F = new Function(textsSrc + '\n' + NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {STAGE_A_TEXTS,' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const TX = F.STAGE_A_TEXTS || {};
const UI = CODE.slice(CODE.indexOf('{/* STAGE A UI — BEGIN */}'), CODE.indexOf('{/* STAGE A UI — END */}'));
const HS = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const HANDLERS = CODE.slice(CODE.indexOf('const handleStageAPress = useCallback('), CODE.indexOf('const stageAView = stageARef.current;'));

// ── 1. First-WHY does not fire with the switch open ─────────────────────────────────────────────────────────────────────────────
{
  const trig = HS.indexOf('if (messages.length === 0 && !firstWhyPending && !stageAActive.current && needsFirstWhy(userText)) {');
  assert('FIRST-WHY: the trigger has ONE new condition — the switch closed (!stageAActive.current); the rest is as before', trig > 0);
  assert('FIRST-WHY: the old trigger (without the switch) is gone — no second copy can fire in Stage A',
    !HS.includes('if (messages.length === 0 && !firstWhyPending && needsFirstWhy(userText)) {'));
  const crisis = HS.indexOf('if (safetySignal === "CRISIS") {'), distress = HS.indexOf('if (safetySignal === "DISTRESS") {');
  assert('FIRST-WHY: the safety paths come first, as today (crisis, then distress, then the First-WHY trigger)', crisis > 0 && distress > crisis && trig > distress);
  // With the switch open the first message goes on to the main path: generateResponse writes the reply and decides the method line.
  const GR = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
  assert('FIRST-WHY: the model\'s first reply carries the method line by stageAMethodLineDue (never on Supportive / risk / safety mode)',
    GR.includes('stageAMethodLineDue({ active: stageAActive.current, auraBefore: msgs.some(m => m && m.role === "assistant"), supportive: currentMode === "SUPPORTIVE", riskKind: riskSignalKind.current, dangerFromOther: dangerFromOther.current, safetyMode, lastUserText: lastUserMsg })')); // UPDATED (23/10, Ο5): + danger from another person (test_danger_from_other_2310.js)
}

// ── 2. The card line ────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('CARD LINE: John\'s text, word for word', TX.cardLine === 'Με το "Ναι" κλείνει αυτό το κομμάτι και σου δείχνω τι ακολουθεί.');
assert('CARD LINE: the risk line is unchanged', TX.cardLineRisk === 'Με το "Ναι" ολοκληρώνεται αυτό το κομμάτι.');
assert('CARD LINE: the old text is gone', !CODE.includes('ολοκληρώνεται το δωρεάν κομμάτι και σου δείχνω το επόμενο'));

// ── 3. The step ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// (α) — John's message after «Ναι», verbatim.
const ROOT = 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.';
const ALPHA = '«' + ROOT + '»\n' +
  'Αυτό το βρήκες εσύ — χωρίς καμία συμβουλή. Τώρα ξέρεις τι γίνεται.\n' +
  '\n' +
  'Το πρώτο βήμα είναι το πιο δύσκολο. Γι\' αυτό δεν θέλω το τέλειο ούτε το πιο γενναίο. Θέλω το πιο εύκολό σου.\n' +
  'Ποιο είναι το πιο μικρό πράγμα που μπορείς να κάνεις γι\' αυτό;';
{
  const lines = T('buildRootStepLines', '  ' + ROOT + ' ');
  assert('(α): the message after «Ναι», word for word, the root whole and in «»', Array.isArray(lines) && lines.join('\n') === ALPHA);
}
assert('(β)/(δ): the button «Δεν ξέρω ακόμα»', TX.stepUnknown === 'Δεν ξέρω ακόμα');
assert('(γ): the size question and its two buttons', TX.fitsQ === 'Είναι τόσο μικρό που χωράει σε μία μέρα;' && TX.fitsYes === 'Ναι' && TX.fitsNo === 'Όχι, είναι μεγάλο');
assert('(γ): the smaller-piece question', TX.smallerQ === 'Τότε ποιο είναι το πρώτο μικρό κομμάτι του;');
assert('(δ): «Πότε;»', TX.whenQ === 'Πότε;');
assert('(ε): the four labels', TX.knewLabel === 'Τι ήξερες' && TX.foundLabel === 'Τι βρήκες' && TX.doLabel === 'Τι θα κάνεις' && TX.whenLabel === 'Πότε');
assert('(στ): «Κι αν όχι τώρα, αυτό που βρήκες είναι ήδη δικό σου.» (the same text as before)', TX.endKeep === 'Κι αν όχι τώρα, αυτό που βρήκες είναι ήδη δικό σου.');

// (θ) — the €6 screen and the one-tap question: their code and texts stay, behind ONE closed constant.
assert('(θ): ONE constant, closed', (CODE.match(/const STAGE_A_COACH_OFFER = false;/g) || []).length === 1 && !/STAGE_A_COACH_OFFER = true/.test(CODE));
assert('(θ): the texts of the €6 screen and of the 4-option question are still there, as they were',
  TX.price === '€6, μία φορά. Όχι συνδρομή.' && TX.endCoach && TX.endItem3 && TX.wantMore === 'Θέλω να συνεχίσω' && TX.notNow === 'Όχι τώρα' &&
  TX.notReady && TX.help1 && TX.help4 && TX.helpSkip === 'Συνέχεια');
assert('(θ): their screens are still drawn for their phases (one line brings them back)',
  UI.includes('{stageAPhase === "offer" && (') && UI.includes('{stageAPhase === "notReady" && ('));
assert('(θ): «Ναι» asks for the step whenever the constant is closed — the offer is reached only through it',
  /stageADispatch\(\{ type: "yes", riskKind: riskSignalKind\.current, step: !STAGE_A_COACH_OFFER \}\)/.test(HANDLERS) &&
  (CODE.match(/type: "yes"/g) || []).length === 1);
{
  const old = T('buildRootEndLines', ROOT, false);
  assert('(θ): the €6 text itself is unchanged (it comes back as it was)', Array.isArray(old) && old.join('\n').includes('€6, μία φορά. Όχι συνδρομή.') && old[0] === '«' + ROOT + '»');
}

// The reducer.
const S0 = T('initialStageAState');
const run = (evs, from) => evs.reduce((s, e) => T('stageAStep', s, e), from || S0);
const CARD = run([{ type: 'press' }, { type: 'open', door: 1, found: ROOT, knew: 'Δεν ξέρω αν πρέπει να φύγω' }]);
const STEP = 'Να του στείλω ένα μήνυμα';
assert('REDUCER: the card is open before «Ναι» (sanity)', CARD.phase === 'card');
{
  const y = T('stageAStep', CARD, { type: 'yes', riskKind: 0, step: true });
  assert('«Ναι» (switch open, no risk): the step question — not the €6 offer', y.phase === 'step' && y.stats.rootConfirmed === 1 && y.stats.coachOfferShown === 0 && y.stats.stageReached === 4);
  const yo = T('stageAStep', CARD, { type: 'yes', riskKind: 0 });
  assert('«Ναι» with the constant open (step not asked for): the old offer, exactly as before', yo.phase === 'offer' && yo.stats.coachOfferShown === 1 && yo.stats.stageReached === 5);
  for (const k of [2, 3]) {
    const r = T('stageAStep', CARD, { type: 'yes', riskKind: k, step: true });
    assert('«Ναι» on a risk path (' + (k === 2 ? 'crisis B' : 'DISTRESS') + '): no step — clarity, as today', r.phase === 'clarity' && r.riskOffer === true && r.stats.coachOfferSuppressed === 1 && r.stats.suppressedBy === k);
  }
}
const Y = T('stageAStep', CARD, { type: 'yes', riskKind: 0, step: true });
{
  assert('(β): an empty answer is not accepted', T('stageAStep', Y, { type: 'stepText', text: '   ' }) === Y && T('stageAStep', Y, { type: 'stepText' }) === Y);
  const a = T('stageAStep', Y, { type: 'stepText', text: '  ' + STEP + ' ' });
  assert('(β): the step, as typed (edges trimmed) → the size question', a.phase === 'fits' && a.step === STEP);
  assert('(β): the step is NOT in the numbers (stats hold no text)', !JSON.stringify(a.stats).includes('μήνυμα'));
  const b = T('stageAStep', a, { type: 'fitsYes' });
  assert('(γ) «Ναι» → «Πότε;»', b.phase === 'when' && b.fitsDay === 1 && b.step === STEP);
  const c = T('stageAStep', b, { type: 'whenText', text: 'Αύριο το πρωί' });
  assert('(δ) «Πότε» written → the card, then clarity as today', c.phase === 'clarity' && c.when === 'Αύριο το πρωί' && c.stepEnd === 'card');
  const d = run([{ type: 'clarity', value: 8 }, { type: 'word', same: false }], c);
  assert('(ζ): clarity → the word → the end, as today', d.phase === 'done' && d.stats.lateClarity === 8 && d.step === STEP && d.when === 'Αύριο το πρωί');
  const big = run([{ type: 'stepText', text: 'Να αλλάξω δουλειά' }, { type: 'fitsNo' }], Y);
  assert('(γ) «Όχι, είναι μεγάλο» → the smaller-piece question', big.phase === 'smaller' && big.fitsDay === 0);
  assert('(γ): the smaller piece cannot be empty either', T('stageAStep', big, { type: 'smallerText', text: '' }) === big);
  const sm = T('stageAStep', big, { type: 'smallerText', text: 'Να γράψω το βιογραφικό μου' });
  assert('(γ): the smaller piece BECOMES the step, and the flow moves on to «Πότε;» — no second size question', sm.phase === 'when' && sm.step === 'Να γράψω το βιογραφικό μου' && sm.smallerWritten === 1);
  assert('(γ): exactly once — from «Πότε;» no size question and no smaller question can come back',
    T('stageAStep', sm, { type: 'fitsNo' }) === sm && T('stageAStep', sm, { type: 'fitsYes' }) === sm && T('stageAStep', sm, { type: 'smallerText', text: 'κάτι' }) === sm);
  const wu = T('stageAStep', sm, { type: 'whenUnknown' });
  assert('(δ) «Δεν ξέρω ακόμα» at «Πότε» → the card without «Πότε», then clarity', wu.phase === 'clarity' && wu.when === '' && wu.whenWritten === 0 && wu.stepEnd === 'card');
  const su = T('stageAStep', Y, { type: 'stepUnknown' });
  assert('(στ) «Δεν ξέρω ακόμα» at the step → no size question, no «Πότε;», no card — clarity', su.phase === 'clarity' && su.stepEnd === 'none' && su.step === '' && su.stepWritten === 0);
  assert('(β)–(δ): a second tap / a stale event changes nothing',
    T('stageAStep', a, { type: 'stepText', text: 'άλλο' }) === a && T('stageAStep', b, { type: 'fitsNo' }) === b && T('stageAStep', c, { type: 'whenText', text: 'Τώρα' }) === c &&
    T('stageAStep', c, { type: 'whenUnknown' }) === c && T('stageAStep', su, { type: 'stepUnknown' }) === su);
  assert('(β)–(δ): the step events do nothing outside the step (card, offer, clarity)',
    ['stepText', 'stepUnknown', 'fitsYes', 'fitsNo', 'smallerText', 'whenText', 'whenUnknown', 'stepStop'].every(t => T('stageAStep', CARD, { type: t, text: 'x' }) === CARD));
  // (η) a safety signal stops the step flow at once, wherever it is.
  for (const [name, st] of [['the step', Y], ['the size question', a], ['the smaller piece', big], ['«Πότε;»', b], ['«Πότε;» after a smaller piece', sm]]) {
    const z = T('stageAStep', st, { type: 'stepStop' });
    assert('(η) stop at ' + name + ': the flow stops, nothing of the step is kept', z.phase === 'stopped' && z.step === '' && z.when === '' && z.stepEnd === '');
    assert('(η) after the stop at ' + name + ': no next question, no card, no clarity / word / end',
      ['stepText', 'stepUnknown', 'fitsYes', 'fitsNo', 'smallerText', 'whenText', 'whenUnknown'].every(t => T('stageAStep', z, { type: t, text: 'x' }) === z) &&
      T('stageAStep', z, { type: 'clarity', value: 5 }) === z && T('stageAStep', z, { type: 'word', same: false }) === z);
  }
  assert('(η): a stop outside the step changes nothing', T('stageAStep', CARD, { type: 'stepStop' }) === CARD && T('stageAStep', c, { type: 'stepStop' }) === c);
  // The input box: shown for the typed answers, hidden for the two buttons.
  assert('INPUT: shown for the step, the smaller piece and «Πότε»; hidden for the size question; shown after a stop (the conversation goes on)',
    ['step', 'smaller', 'when', 'stopped'].every(p => T('stageAInputHidden', p) === false) && T('stageAInputHidden', 'fits') === true);
  assert('INPUT: the old phases as before', ['card', 'offer', 'notReady', 'clarity'].every(p => T('stageAInputHidden', p) === true) && ['ask', 'correct', 'word', 'done', null].every(p => T('stageAInputHidden', p) === false));
}

// (ι) — the numbers.
{
  const KEYS = ['rootDoor', 'rootShown', 'rootConfirmed', 'rootCorrections', 'rootBack', 'rootButtonPressed', 'rootAtReply', 'coachOfferShown', 'coachOfferClicked',
    'coachOfferDeclined', 'coachOfferSuppressed', 'suppressedBy', 'rootSuppressedA', 'coachHelpChoice', 'lateClarity', 'wordSameAsRoot', 'knewHidden', 'stageReached',
    'rootTooShort', 'rootDoorFromClosing'];
  assert('(ι): no other telemetry field changes — the session_completed numbers are the same 20 keys as before', JSON.stringify(Object.keys(S0.stats)) === JSON.stringify(KEYS));
  const tl = T('stageATelemetry', run([{ type: 'stepText', text: STEP }, { type: 'fitsYes' }, { type: 'whenText', text: 'Αύριο' }], Y).stats, {});
  assert('(ι): session_completed carries no step field (no double counting, no forced 0)', !Object.keys(tl).some(k => /step|fits|smaller|when/i.test(k)));
  const tel = (prev, ev) => { const nx = T('stageAStep', prev, ev); return { nx, out: T('stageAStepTelemetry', prev, nx, ev) }; };
  const shown = tel(CARD, { type: 'yes', riskKind: 0, step: true });
  assert('(ι) step_shown 1 when «Ναι» shows the step', JSON.stringify(shown.out) === JSON.stringify([{ event: 'step_shown', fields: { value: 1 } }]));
  assert('(ι) step_shown 0 when a risk path keeps it away', JSON.stringify(tel(CARD, { type: 'yes', riskKind: 3, step: true }).out) === JSON.stringify([{ event: 'step_shown', fields: { value: 0 } }]));
  assert('(ι): with the constant open (old offer) no step record at all', JSON.stringify(tel(CARD, { type: 'yes', riskKind: 0 }).out) === '[]');
  const seq = (evs) => { let s = Y; const all = []; for (const e of evs) { const r = tel(s, e); if (Array.isArray(r.out)) all.push(...r.out); s = r.nx; } return all; };
  const norm = seq([{ type: 'stepText', text: STEP }, { type: 'fitsYes' }, { type: 'whenText', text: 'Αύριο το πρωί' }]);
  assert('(ι) normal end: step_written 1, step_fits_day 1, when_written 1 — no smaller_piece_written (that question did not appear)',
    JSON.stringify(norm) === JSON.stringify([{ event: 'step_written', fields: { value: 1 } }, { event: 'step_fits_day', fields: { value: 1 } }, { event: 'when_written', fields: { value: 1 } }]));
  const bigS = seq([{ type: 'stepText', text: 'Να αλλάξω δουλειά' }, { type: 'fitsNo' }, { type: 'smallerText', text: 'Να γράψω το βιογραφικό' }, { type: 'whenUnknown' }]);
  assert('(ι) «Όχι, είναι μεγάλο» + smaller piece + «Δεν ξέρω ακόμα» at «Πότε»: step_written 1, step_fits_day 0, smaller_piece_written 1, when_written 0',
    JSON.stringify(bigS) === JSON.stringify([{ event: 'step_written', fields: { value: 1 } }, { event: 'step_fits_day', fields: { value: 0 } }, { event: 'smaller_piece_written', fields: { value: 1 } }, { event: 'when_written', fields: { value: 0 } }]));
  const unk = seq([{ type: 'stepUnknown' }]);
  assert('(ι) «Δεν ξέρω ακόμα» at the step: step_written 0 and NOTHING else — no step_fits_day, no when_written (never a fake 0)',
    JSON.stringify(unk) === JSON.stringify([{ event: 'step_written', fields: { value: 0 } }]));
  assert('(ι) the numbers are written once, when the step\'s questions end — nothing while they are under way',
    JSON.stringify(tel(Y, { type: 'stepText', text: STEP }).out) === '[]' && JSON.stringify(tel(T('stageAStep', Y, { type: 'stepText', text: STEP }), { type: 'fitsNo' }).out) === '[]');
  const stops = [Y, T('stageAStep', Y, { type: 'stepText', text: STEP }), run([{ type: 'stepText', text: STEP }, { type: 'fitsNo' }], Y), run([{ type: 'stepText', text: STEP }, { type: 'fitsYes' }], Y)]
    .map(s => { const o = tel(s, { type: 'stepStop' }).out; return Array.isArray(o) ? o.length : -1; });
  assert('(η)+(ι) a safety stop counts no step and no «Πότε» (at the step, the size question, the smaller piece, «Πότε»)', stops.every(n => n === 0));
  const dbl = (() => { let s = Y; const all = []; for (const e of [{ type: 'stepText', text: STEP }, { type: 'stepText', text: STEP }, { type: 'fitsYes' }, { type: 'fitsYes' }, { type: 'whenText', text: 'Τώρα' }, { type: 'whenText', text: 'Τώρα' }, { type: 'whenUnknown' }]) { const r = tel(s, e); if (Array.isArray(r.out)) all.push(...r.out); s = r.nx; } return all; })();
  assert('(ι) double taps: each number once', dbl.filter(r => r.event === 'step_written').length === 1 && dbl.filter(r => r.event === 'when_written').length === 1 && dbl.length === 3);
  const allRecs = [norm, bigS, unk, shown.out].flatMap(x => Array.isArray(x) ? x : []).filter(r => r && typeof r === 'object');
  assert('(ι) numbers only: every value is 0 or 1, no text anywhere', allRecs.length > 0 && allRecs.every(r => r.fields && Object.keys(r.fields).length === 1 && (r.fields.value === 0 || r.fields.value === 1)) &&
    !/μήνυμα|δουλειά|βιογραφικό|Αύριο|Τώρα/.test(JSON.stringify(allRecs)));
  assert('(ι) the names are John\'s, and pass the telemetry schema', allRecs.every(r => /^[a-z_]{1,32}$/.test(r.event)) &&
    ['step_shown', 'step_written', 'step_fits_day', 'smaller_piece_written', 'when_written'].every(n => allRecs.some(r => r.event === n)));
  const rec = T('recordTelemetry', 'step_fits_day', { value: 0 });
  assert('(ι) recordTelemetry keeps a 0 that is a real answer, and adds nothing', rec && rec.ev === 'step_fits_day' && rec.value === 0 && Object.keys(rec).sort().join(',') === 'ev,t,value');
  assert('(ι) the dispatcher records them at once, like the root flow\'s events', /for \(const _r of stageAStepTelemetry\(_prev, stageARef\.current, ev\)\) recordTelemetry\(_r\.event, _r\.fields\);/.test(CODE));
}

// (ε) — the card, the copy and the download: one text.
{
  const K = 'Δεν ξέρω αν πρέπει να φύγω';
  const full = T('buildStepCardText', K, false, ROOT, STEP, 'Αύριο το πρωί');
  assert('(ε): the card in the user\'s words, in this order', full === 'Τι ήξερες: «' + K + '»\nΤι βρήκες: «' + ROOT + '»\nΤι θα κάνεις: «' + STEP + '»\nΠότε: «Αύριο το πρωί»');
  const noWhen = T('buildStepCardText', K, false, ROOT, STEP, '');
  assert('(ε): no «Πότε» written → the line is missing entirely', noWhen === 'Τι ήξερες: «' + K + '»\nΤι βρήκες: «' + ROOT + '»\nΤι θα κάνεις: «' + STEP + '»' && !/Πότε/.test(noWhen));
  assert('(ε): no «Τι ήξερες» on the root card → none here either (never invented); a cut snippet keeps its «…»',
    T('buildStepCardText', null, false, ROOT, STEP, 'x').split('\n')[0] === 'Τι βρήκες: «' + ROOT + '»' && T('buildStepCardText', K, true, ROOT, STEP, '').startsWith('Τι ήξερες: «' + K + '…»'));
  const words = full.replace(K, '').replace(ROOT, '').replace(STEP, '').replace('Αύριο το πρωί', '').replace(/Τι ήξερες|Τι βρήκες|Τι θα κάνεις|Πότε/g, '');
  assert('(ε): no sentence of praise or good wishes — nothing but the labels and the user\'s words', /^[:«»\s]*$/.test(words));
  assert('(ε): the card shows that SAME text (pre-wrap, no label styling that would change it)',
    CODE.includes('data-step-card="1"') && /stepCard: true/.test(CODE) && CODE.includes('buildStepCardText(stageARef.current.knew, stageARef.current.knewTruncated, stageARef.current.found, stageARef.current.step, stageARef.current.when)'));
  const v = { stepEnd: 'card', knew: K, knewTruncated: false, found: ROOT, step: STEP, when: 'Αύριο το πρωί' };
  assert('(ε): the copy and the download take ONE function: the card\'s own text when there is a card, else the root and the date as before',
    T('buildStageAShareText', v, '2026-10-17') === full && T('buildStageAShareText', Object.assign({}, v, { stepEnd: 'none' }), '2026-10-17') === T('buildRootCopyText', K, ROOT, '2026-10-17') &&
    (UI.match(/buildStageAShareText\(stageAView, /g) || []).length === 2 && !/stageAView\.stepEnd === "card"/.test(UI));
}

// The page: the step lives in UI-only bubbles (never `messages`), the safety branch falls through, the buttons.
{
  const st = HS.indexOf('if (stageAActive.current && (_saPhase === "step" || _saPhase === "smaller" || _saPhase === "when")) {');
  const cap = HS.indexOf('if (stageAActive.current && (_saPhase === "ask" || _saPhase === "correct" || _saArmed)) {');
  const latch = HS.indexOf('riskSignalKind.current = mergeRiskKind(');
  assert('(η): the step\'s typed answers are taken right after the risk latch has seen them, before anything else', st > latch && latch > 0 && cap > st);
  const branch = st > 0 ? HS.slice(st, cap) : '';
  assert('(η): the SAME detector as for a conversation message, on every typed answer of the step', branch.includes('if (detectSafetySignal(userText) || detectsDangerFromOther(userText)) {') && branch.includes('stageADispatch({ type: "stepStop" });')); // UPDATED (23/10, Ο5): + danger from another person (test_danger_from_other_2310.js)
  const stopPart = branch.slice(branch.indexOf('if (detectSafetySignal(userText) || detectsDangerFromOther(userText)) {'), branch.indexOf('} else {')); // UPDATED (23/10, Ο5): + danger from another person (test_danger_from_other_2310.js)
  assert('(η): on a signal the branch does NOT return — the message goes on down the normal path, where the safety path takes it', stopPart && !/return/.test(stopPart));
  assert('(β)/(ια): the typed step is a UI-only bubble — never `messages`, never sent, the branch returns before any model call',
    branch.includes('addUiBubble(userText, messages.length);') && !/setMessages|callAura|generateResponse|saveMemory|localStorage|console\./.test(branch) && /return;\s*\n\s*\}\s*\n\s*\}\s*$/.test(branch.trimEnd() + '\n'));
  const yes = HANDLERS.slice(HANDLERS.indexOf('const handleStageAYes = useCallback('), HANDLERS.indexOf('const handleStageAClarity = useCallback('));
  assert('(α)/(ια): the step\'s question after «Ναι» is a UI-only bubble too (the old end text still goes to `messages` when the step is not asked)',
    yes.includes('addUiBubble(buildRootStepLines(_found).join("\\n"), messages.length, { role: "assistant", stageAEnd: true });') && yes.includes('buildRootEndLines(stageARef.current.found, _riskOffer)'));
  // UPDATED (18/10, ADR «18 Οκτωβρίου», 2 — John): «Δεν ξέρω ακόμα» is now under the smaller-piece question too (test_decisions_1810.js).
  assert('(β)/(δ): «Δεν ξέρω ακόμα» under the step question and under «Πότε;» (and, since 18/10, under the smaller piece)',
    /stageAPhase === "step" \|\| stageAPhase === "smaller" \|\| stageAPhase === "when"/.test(UI) && UI.includes('{STAGE_A_TEXTS.stepUnknown}'));
  assert('(γ): the two buttons of the size question', UI.includes('{stageAPhase === "fits" && (') && UI.includes('{STAGE_A_TEXTS.fitsYes}') && UI.includes('{STAGE_A_TEXTS.fitsNo}'));
  assert('(ια): nothing of the step is ever handed to storage, the console or a request', !/(localStorage|sessionStorage|indexedDB|document\.cookie|console\.|saveMemory|recordTelemetry|callAura)[^\n]*(\.step\b|\.when\b|uiBubbles|stepCard|buildStepCardText)/.test(CODE));
  assert('(ια): the UI-only bubbles are cleared by «Νέα συνεδρία», with the Stage A state', /stageARef\.current = initialStageAState\(\);[^\n]*\n\s*setUiBubbles\(\[\]\);/.test(CODE));
  assert('(ζ): the copy / download buttons wait until the step\'s questions are over (and never show after a safety stop)',
    /stageAView\.stats\.rootConfirmed === 1 && !stageAStepOpen\(stageAPhase\) && stageAPhase !== "stopped" && \(/.test(UI));
}

// (ια) + double tap: two submits in the same moment (the box still holds the text, the page has not redrawn) — the second is the same
// tap, never the next answer and never a message to the model (found in the browser, ST6: it reached the model).
{
  const st = HS.indexOf('if (stageAActive.current && (_saPhase === "step" || _saPhase === "smaller" || _saPhase === "when")) {');
  const branch = st > 0 ? HS.slice(st, HS.indexOf('if (stageAActive.current && (_saPhase === "ask" || _saPhase === "correct" || _saArmed)) {')) : '';
  assert('DOUBLE SUBMIT: a typed answer of the step is held for one moment', branch.includes('stepJustTaken.current = userText; setTimeout(() => { stepJustTaken.current = null; }, 0);') && /const stepJustTaken = useRef\(null\);/.test(CODE));
  const g = HS.indexOf('if (stepJustTaken.current !== null && stepJustTaken.current === userText) return;');
  assert('DOUBLE SUBMIT: the same text again in that moment is dropped before anything else reads it (latch, step, model)',
    g > HS.indexOf('const userText = input.trim()') && g < HS.indexOf('setInput("");') && g < HS.indexOf('riskSignalKind.current = mergeRiskKind('));
}

// ── Clean code (John, after the first round: «Θέλω καθαρό κώδικα») ─────────────────────────────────────────────────────────────────
{
  assert('CLEAN: the method line above First-WHY\'s question is gone — First-WHY no longer fires with the switch open, where the line lives',
    !/firstWhyMethodLine/.test(CODE) && HS.includes('{ id: nextMsgId(), role: "assistant", content: "Γιατί έχει σημασία αυτό για σένα τώρα;" },') &&
    (CODE.match(/STAGE_A_TEXTS\.methodLine/g) || []).length === 1);
  assert('CLEAN: one helper says whether a question of the step is open (step, size, smaller piece, «Πότε»)',
    ['step', 'fits', 'smaller', 'when'].every(p => T('stageAStepOpen', p) === true) && [null, 'ask', 'card', 'correct', 'clarity', 'word', 'done', 'stopped', 'offer'].every(p => T('stageAStepOpen', p) === false));
  assert('GUARD: while a question of the step is open, the buttons of earlier bubbles start nothing — «Δες την πορεία» is hidden and refused, «αυτό δεν ισχύει» refused',
    /onMisfire=\{\(\) => \{ if \(sessionEnded \|\|[^\n]*\|\| stageAStepOpen\(stageARef\.current\.phase\)\) return;/.test(CODE) &&
    /onContinueToReflection=\{\(\) => \{ [^\n]*\(stageAActive\.current && \(stageARef\.current\.stats\.rootConfirmed !== 1 \|\| stageAStepOpen\(stageARef\.current\.phase\)\)\)\) return; handleClosureConfirm\(true\); \}\}/.test(CODE) &&
    CODE.includes('hideReflection={stageAActive.current && (stageAView.stats.rootConfirmed !== 1 || stageAStepOpen(stageAPhase))}'));
}

// ── 4. TESTER_INVITATION.md — John's texts, verbatim ───────────────────────────────────────────────────────────────────────────────
{
  const INVF = findFile(['/../TESTER_INVITATION.md', '/TESTER_INVITATION.md']);
  const inv = INVF ? fs.readFileSync(INVF, 'utf8') : '';
  const a = inv.indexOf('```\n'), b = inv.lastIndexOf('\n```');
  const block = a >= 0 && b > a ? inv.slice(a + 4, b) : '';
  // UPDATED (18/10, ADR «18 Οκτωβρίου», 4 — John): the "memory" sentence now says what the code does.
  assert('INVITATION (α): the new sentence about the conversation and the «μνήμη», word for word; the old one gone',
    block.includes('Η εφαρμογή δεν αποθηκεύει τη συζήτηση· χάνεται όταν κλείσεις την καρτέλα. Στο κινητό σου μένουν μόνο οι αριθμοί της δοκιμής. Τη "μνήμη" μην την ανοίξεις: αν την ανοίξεις, κρατά στο κινητό σου κομμάτια από όσα έγραψες, και μπορεί να τα ξαναστείλει στο μοντέλο σε επόμενη συνεδρία.') &&
    !block.includes('Η ίδια η εφαρμογή δεν κρατά τη συζήτηση.'));
  assert('INVITATION (β): «Η ερώτηση στο τέλος είναι ξεχωριστή και προαιρετική.»; the old line gone',
    block.includes('Κανένα κείμενο της συζήτησης. Η ερώτηση στο τέλος είναι ξεχωριστή και προαιρετική.') && !block.includes('Οι ερωτήσεις στο τέλος είναι ξεχωριστές και προαιρετικές'));
  const ONE = 'Μία ερώτηση\nΑπάντησέ μου σε ένα μήνυμα, όσο σύντομα θες. Η ειλικρινής απάντηση με βοηθά περισσότερο από τα καλά λόγια.\n' +
    'Μετά την AURA, θα κάνεις κάτι γι\' αυτό που βρήκες, ή ήταν απλώς μια καλή κουβέντα; Αν θα κάνεις, τι; Αν όχι, γιατί;\n' +
    'Αν μου πεις ότι θα κάνεις κάτι, σε 3 μέρες θα σε ρωτήσω μόνο: "Το έκανες;" Αν δεν θες, απλώς μην απαντήσεις.\n\nΕυχαριστώ! 🙏';
  assert('INVITATION (γ): the five questions are replaced by «Μία ερώτηση», word for word, and «Ευχαριστώ! 🙏» stays at the end',
    block.endsWith(ONE) && !/Πέντε προαιρετικές ερωτήσεις|Ξεκαθάρισε κάτι για σένα|πιο ελαφρύς|Όταν είδες την τιμή/.test(block));
  assert('INVITATION: no €6 left in what is pasted (the test of the 20 has no payment); plain text — no ** and no >', !/€6|6€/.test(block) && !/\*\*/.test(block) && !/^>/m.test(block));
  assert('INVITATION: the history line at the top names this decision', /ADR «17 Οκτωβρίου \(δ\)»/.test(inv.slice(0, a)));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
