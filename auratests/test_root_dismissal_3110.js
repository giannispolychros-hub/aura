// AURA — A DISMISSAL IS NOT A ROOT (John, 31/10/2026; a root-measurement fix (β) during the freeze of the 20; ADR «31 Οκτωβρίου (δ)»).
// What a real session showed (31/10, description only — the conversation itself is not kept anywhere): Stage A; the user leaves with a
// dismissal and a thank-you; the leaving door asks its root question once («Αν κάτι ξεκαθάρισε, γράψ' το σε μία φράση…»); the user
// answers with a dismissal again («τίποτα, άστο» kind). That answer became «Τι βρήκες» on the card, with «Ναι, αυτό είναι» under it —
// one tap and a dismissal counts as a confirmed root, the main number of the 20.
// The change, code only (no prompt, no api): an answer to the root question that is, as a WHOLE message, one of a CLOSED list —
// τίποτα · τίποτα ιδιαίτερο · άστο · άσ' το · άστο τίποτα · τίποτα άστο — with or without «ευχαριστώ», is never a card.
//   · at the leaving door (the user is leaving): the app answers with a fixed goodbye and nothing else, no model call —
//     «Ευχαριστώ που το μοιράστηκες. Να είσαι καλά.» (John, 31/10); in a session with a crisis, the crisis goodbye of 19/10 instead;
//   · at any other root question (the button, door 2, «Διόρθωσε»): as «Δεν ξέρω» today — «Δεν το βρήκα ακόμα», the model goes on.
// Safety first: the rule runs only after the crisis and danger checks of the message, and never on a message with a safety signal.
//  (Α) the phrases, written before the code   (Β) safety first   (Γ) which goodbye   (Δ) where it is read   (Ε) the session's shape
//  (Ζ) what did not change

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
const constLine = n => { const a = CODE.indexOf('\nconst ' + n + ' = '); return a < 0 ? '' : CODE.slice(a + 1, CODE.indexOf(';\n', a + 1) + 1); };
const arr = n => { const a = CODE.indexOf('const ' + n + ' = ['); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n];', a) + 3); };
const textsSrc = (() => { const a = CODE.indexOf('const STAGE_A_TEXTS = {'); return a >= 0 ? CODE.slice(a, CODE.indexOf('\n};', a) + 3) : ''; })();
const NAMES = ['rootAnswerIsDismissal', 'stageADismissalGoodbye', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'lookBehind',
  'stageACaptureAllowed', 'rootAnswerIsUnsure', 'stageAStep', 'initialStageAState'];
let env = {};
try {
  env = new Function([arr('HELPLINES'), constLine('BARE_GOODBYE_TEXT'), constLine('ROOT_DISMISSALS'), textsSrc,
    ...NAMES.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + NAMES.join(', ') + ', T: typeof STAGE_A_TEXTS !== "undefined" ? STAGE_A_TEXTS : {} };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return env[n](...a); } catch (e) { return 'threw: ' + e.message; } };
const BYE = 'Ευχαριστώ που το μοιράστηκες. Να είσαι καλά.';
const PHRASE = 'Είμαι εδώ όταν χρειαστεί να συνεχίσουμε. Κι αν βαρύνει, οι αριθμοί που σου έδωσα είναι εκεί.';
const FIRST = 'Είμαι εδώ όταν χρειαστεί να συνεχίσουμε.';

// ── (Α) the phrases — written BEFORE the code (John, 31/10: ~15 that must be caught, ~15 that must not) ─────────────────────────
const CAUGHT = [
  'Τίποτα', 'τίποτα.', 'Τίποτα!', 'Τίποτα ιδιαίτερο', 'τίποτα ιδιαίτερο, ευχαριστώ', 'Άστο', 'άστο.', 'Άσ\' το', 'άσ’ το',
  'Άστο τίποτα', 'Τίποτα άστο', 'Τίποτα, άστο. Ευχαριστώ', 'Τίποτα. Ευχαριστώ!', 'ΑΣ\' ΤΟ', 'Ευχαριστώ, τίποτα.', 'τιποτα αστο ευχαριστω',
];
const NOT_CAUGHT = [
  'Τίποτα δεν έχει νόημα', 'Δεν ξέρω τίποτα', 'Άστο, δεν αντέχω', 'Θα ήταν καλύτερα να μην ζω.', 'Τίποτα δεν αξίζει πια',
  'Άστο, θέλω να πεθάνω', 'Τίποτα, απλώς είμαι κουρασμένος', 'Τίποτα δεν πάει καλά στη δουλειά', 'Άστο να πάει', 'Δεν έχω τίποτα να πω',
  'Τίποτα δεν με ευχαριστεί', 'Ευχαριστώ', 'Τίποτα άλλο', 'Τίποτα ιδιαίτερο με τη δουλειά, απλώς το αφεντικό', 'Με χτυπάει, άστο',
  'τίποτα τίποτα τίποτα', 'Δεν ξέρω',
];
assert('(Α) the check is one pure function, rootAnswerIsDismissal', typeof env.rootAnswerIsDismissal === 'function');
for (const t of CAUGHT) assert('(Α) caught as a dismissal (whole message, closed list): «' + t + '»', call('rootAnswerIsDismissal', t) === true);
for (const t of NOT_CAUGHT) assert('(Α) NOT a dismissal: «' + t + '»', call('rootAnswerIsDismissal', t) === false);
assert('(Α) not a string, empty, spaces → false, never throws', [undefined, null, 42, {}, '', '   ', '...'].every(v => call('rootAnswerIsDismissal', v) === false));
assert('(Α) the list is CLOSED and written out: exactly the six phrases of John\'s list, no pattern that «contains»',
  /const ROOT_DISMISSALS = \["τιποτα", "τιποτα ιδιαιτερο", "αστο", "ασ το", "αστο τιποτα", "τιποτα αστο"\];/.test(CODE) &&
  /ROOT_DISMISSALS\.includes\(/.test(fnSrc('rootAnswerIsDismissal')) && !/\.test\(f\)|search\(|indexOf\(/.test(fnSrc('rootAnswerIsDismissal')));
assert('(Α) «ευχαριστώ» alone is not on the list, nor twice the same word', call('rootAnswerIsDismissal', 'Ευχαριστώ.') === false && call('rootAnswerIsDismissal', 'άστο άστο') === false);

// ── (Β) safety first ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Β) no phrase of the list carries a safety or danger signal (so it can never stand in for one)',
  CAUGHT.every(t => !env.detectSafetySignal(t) && !env.detectsDangerFromOther(t)));
const CRISIS_READ = ['Θα ήταν καλύτερα να μην ζω.', 'Άστο, θέλω να πεθάνω', 'Τίποτα δεν αξίζει πια'];
assert('(Β) the crisis phrases of the list above that the app reads as crisis stay crisis — and none is a dismissal',
  CRISIS_READ.every(t => env.detectSafetySignal(t) === 'CRISIS' && call('rootAnswerIsDismissal', t) === false));
// Found while writing this test (unchanged, not part of this fix): «Άστο, δεν αντέχω» is not read as crisis and «Με χτυπάει, άστο» (no
// person named) not as danger — the detectors as they are (frozen). The new rule does not catch them either: they go on as today.
assert('(Β) phrases the detectors do not read (as today) are not dismissals either — the rule never decides for them',
  ['Άστο, δεν αντέχω', 'Με χτυπάει, άστο'].every(t => !env.detectSafetySignal(t) && !env.detectsDangerFromOther(t) && call('rootAnswerIsDismissal', t) === false));
const hsA = CODE.indexOf('const handleSubmit = useCallback(async () => {');
const HS = hsA < 0 ? '' : CODE.slice(hsA, CODE.indexOf('\n  }, [input, loading, sessionEnded,', hsA));
const iCapture = HS.indexOf('if (!stageACaptureAllowed(userText)) {');
const iUnsure = HS.indexOf('} else if (rootAnswerIsUnsure(userText)) {');
const iDismiss = HS.indexOf('} else if (rootAnswerIsDismissal(userText) && !detectSafetySignal(userText) && !detectsDangerFromOther(userText)) {');
const iShort = HS.indexOf('} else if ((_saPhase === "ask" || _saPhase === "correct") && !rootTextHasSubstance(userText)) {');
assert('(Β) in handleSubmit the rule comes AFTER the crisis/danger check of the message (stageACaptureAllowed) and after «Δεν ξέρω»',
  iCapture > 0 && iUnsure > iCapture && iDismiss > iUnsure);
assert('(Β) … with its own explicit check: no safety signal, no danger, in the same condition', iDismiss > 0);
assert('(Β) … and BEFORE anything that could make a card of it (too short, «Διόρθωσε», the capture)', iShort > iDismiss);
assert('(Β) the session\'s risk latches are updated before any Stage A branch (unchanged order)',
  HS.indexOf('riskSignalKind.current = mergeRiskKind(') > 0 && HS.indexOf('riskSignalKind.current = mergeRiskKind(') < iCapture &&
  HS.indexOf('if (detectsDangerFromOther(userText)) dangerFromOther.current = true;') < iCapture);

// ── (Γ) which goodbye ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const G = o => call('stageADismissalGoodbye', o);
assert('(Γ) the general goodbye is John\'s text, word for word (the app\'s existing BARE_GOODBYE_TEXT)',
  G({ messages: [{ role: 'assistant', content: 'Τι σε κρατάει εκεί;' }], fallbackLine: null, dangerLine: false, riskKind: 0 }) === BYE);
assert('(Γ) no messages at all → the general goodbye', G({}) === BYE && G(null) === BYE);
assert('(Γ) a crisis reply in the session (SUPPORTIVE, with its number) → the crisis goodbye of 19/10, not the general one',
  G({ messages: [{ role: 'assistant', msgMode: 'SUPPORTIVE', content: 'Σε ακούω.\n\nΥπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.' }], riskKind: 2 }) === PHRASE);
assert('(Γ) the crisis line only in the separate box (a failed call) → the crisis goodbye',
  G({ messages: [{ role: 'assistant', content: 'Τι σε κρατάει εκεί;' }], fallbackLine: 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.', riskKind: 1 }) === PHRASE);
assert('(Γ) the danger line shown → the crisis goodbye', G({ messages: [], dangerLine: true }) === PHRASE);
assert('(Γ) a crisis in the session but no number ever shown → the first sentence only (as the crisis goodbye of 19/10)',
  G({ messages: [{ role: 'assistant', msgMode: 'SUPPORTIVE', content: 'Σε ακούω.' }], riskKind: 2 }) === FIRST);
assert('(Γ) the session\'s crisis latch alone (tier A or B) is enough for the crisis goodbye — never the general one after a crisis',
  G({ messages: [], riskKind: 1 }) === FIRST && G({ messages: [], riskKind: 2 }) === FIRST &&
  G({ messages: [{ role: 'assistant', content: 'Σε άμεσο κίνδυνο, 112.' }], riskKind: 2 }) === PHRASE);
assert('(Γ) DISTRESS alone (riskKind 3) is not a crisis: the general goodbye', G({ messages: [], riskKind: 3 }) === BYE);
assert('(Γ) the texts are the app\'s own constants, no new sentence in the code',
  /BARE_GOODBYE_TEXT/.test(fnSrc('stageADismissalGoodbye')) && /STAGE_A_TEXTS\.afterCrisis\b/.test(fnSrc('stageADismissalGoodbye')) &&
  /STAGE_A_TEXTS\.afterCrisisNoNumbers/.test(fnSrc('stageADismissalGoodbye')) && !/Ευχαριστώ|Είμαι εδώ/.test(fnSrc('stageADismissalGoodbye')));

// ── (Δ) where it is read ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const branch = iDismiss > 0 ? HS.slice(iDismiss, iShort > iDismiss ? iShort : iDismiss) : '';
assert('(Δ) the branch in handleSubmit is short: the armed flag off, then the helper; a true answer (the leaving door) ends the turn',
  /stageARootArmed\.current = false;[^\n]*\n\s*if \(stageADismiss\(userText, _saPhase\)\) return;\s*$/.test(branch));
const dA = CODE.indexOf('const stageADismiss = useCallback((userText, phase) => {');
const DS = dA < 0 ? '' : CODE.slice(dA, CODE.indexOf('\n  }, [messages, crisisFallback, stageADispatch]);', dA));
const lv = DS.slice(DS.indexOf('if (phase === "ask" && stageARef.current.leaving) {'), DS.indexOf('return true;') + 12);
assert('(Δ) the helper exists, next to stageAOpen, with the state it reads in its dependencies', dA > 0 && dA > CODE.indexOf('const stageAOpen = useCallback(') && DS.length > 0);
assert('(Δ) at the leaving door (phase «ask», leaving) → the goodbye from the app: the question, the user\'s words and the goodbye in the history',
  lv.length > 20 &&
  /stageADismissalGoodbye\(\{ messages, fallbackLine: crisisFallback, dangerLine: dangerLineShown\.current\.length > 0, riskKind: riskSignalKind\.current \}\)/.test(lv) &&
  /content: STAGE_A_TEXTS\.askLeaving, msgMode: "STAGE_A"/.test(lv) && /role: "user", content: userText/.test(lv) && /content: _bye, msgMode: "STAGE_A"/.test(lv));
assert('(Δ) … then «Δεν το βρήκα ακόμα» (event «back»: no card, the door closes) and the turn ends — no model call, no card, no telemetry of its own',
  /stageADispatch\(\{ type: "back" \}\);\s*return true;/.test(lv) && !/generateResponse|callAura|stageAOpen\(|recordTelemetry|setSessionEnded/.test(DS));
assert('(Δ) at any other root question → «back» and false: the message goes on as «Δεν ξέρω» does today',
  /\}\s*stageADispatch\(\{ type: "back" \}\);\s*return false;\s*$/.test(DS));
assert('(Δ) the check is read at one place only, the goodbye chooser and the helper too',
  (CODE.split('rootAnswerIsDismissal(').length - 1) === 2 && (CODE.split('stageADismissalGoodbye(').length - 1) === 2 && (CODE.split('stageADismiss(').length - 1) === 1);
assert('(Δ) the door-3 path and the step answers are not touched', !/rootAnswerIsDismissal|stageADismiss/.test(CODE.slice(CODE.indexOf('// STAGE A — door 2 (§1.4, §1.5).'), CODE.indexOf('// STAGE A — door 2 (§1.4, §1.5).') + 1500)) &&
  !/rootAnswerIsDismissal|stageADismiss/.test(HS.slice(HS.indexOf('if (stageAActive.current && (_saPhase === "step"'), HS.indexOf('if (stageAActive.current && (_saPhase === "ask"'))));

// ── (Ε) the session's shape (description only) — on the app's own state machine ────────────────────────────────────────────────
{
  const S = env.stageAStep;
  let st = S(undefined, { type: 'leaving' });
  const askLeavingOpen = st.phase === 'ask' && st.leaving === true && st.stats.rootDoorFromClosing === 1;
  // the dismissal answer: the app sends «back» (what the branch above does) — never «open»
  st = S(st, { type: 'back' });
  assert('(Ε) leaving → the leaving door\'s question; a dismissal → «back»: no card, nothing shown as a root, nothing confirmed',
    askLeavingOpen && st.phase === null && st.stats.rootShown === 0 && st.stats.rootConfirmed === 0 && st.stats.rootBack === 1);
  assert('(Ε) the leaving door is used once: a later explicit exit does not reopen it by itself (unchanged rule, read in handleSubmit)',
    (CODE.split('used: stageARef.current.stats.rootDoorFromClosing > 0,').length - 1) === 2);
  assert('(Ε) and in this session both dismissals (the exit and the answer) are real dismissals for the rule, the second one alone opens nothing',
    call('rootAnswerIsDismissal', 'Τίποτα άστο') === true && call('rootAnswerIsDismissal', 'Τίποτα, άστο. Ευχαριστώ') === true);
}

// ── (Ζ) what did not change ──────────────────────────────────────────────────────────────────────────────────────────────────────
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
assert('(Ζ) the prompt (AURA_CORE_PERSONALITY) is unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21');
let gen = ''; try { gen = cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { encoding: 'utf8' }); } catch (e) { gen = String(e.stdout || ''); }
assert('(Ζ) the prompt fingerprints in api/aura.js are up to date', /up to date/.test(gen));
const PINS = { rootAnswerIsUnsure: '2c6461315a960668', rootTextHasSubstance: '11d0cb226862ec80', stageAAfterCrisisText: 'e19c2a413a9ad99c',
  stageACaptureAllowed: 'f8a46ebc62fe4ecd', stageAStep: '67bb9bcb504396e8', detectSafetySignal: '1f7c3cb8fe568f31' /* UPDATED (31/10, ADR «31 Οκτωβρίου (ζ)», a safety fix (α), John): + one narrow, closed line for the passive-ideation gaps (S5–S9 and «θα ήταν πιο απλό να μην υπάρχω καθόλου») — auratests/test_safety_detectors_3110.js */, detectsDangerFromOther: 'dfd68c2a876b1a7b' /* UPDATED (31/10, ADR «31 Οκτωβρίου (ζ)», a safety fix (α), John): + narrow, closed rules for danger from another person with no person named (item 117) — auratests/test_safety_detectors_3110.js */,
  stageALeavingDoorOpens: 'a319ffa8afded157', replaceBareGoodbye: 'e6351d2cb8e28ab5' };
for (const [n, v] of Object.entries(PINS)) assert('(Ζ) unchanged: ' + n, h(fnSrc(n)) === v);
assert('(Ζ) unchanged: the Stage A texts and the goodbye text', h(textsSrc) === '9f64812e26b48d3d' && constLine('BARE_GOODBYE_TEXT') === 'const BARE_GOODBYE_TEXT = "Ευχαριστώ που το μοιράστηκες. Να είσαι καλά.";');
assert('(Ζ) no lookbehind in the new code (old iPhones)', !/\(\?<[=!]/.test(fnSrc('rootAnswerIsDismissal') + fnSrc('stageADismissalGoodbye') + constLine('ROOT_DISMISSALS')));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
