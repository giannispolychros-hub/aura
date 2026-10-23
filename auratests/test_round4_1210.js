// AURA — John, 12/10/2026 (ADR «12 Οκτωβρίου (δ)»): two fixes to the MEASUREMENT of the root, then the freeze with a clear rule.
//   1  Stage A, before the root: the FIRST explicit exit («Ευχαριστώ, κλείνουμε εδώ») ALWAYS opens «Πριν φύγεις:» (door 4). Nothing
//      pending blocks it — not the hold for the clarity scale after the app read a «step». Found by the real-model run 27,
//      session 1.1: «Ότι θα κοιτάξω πίσω και θα πω πως…» was read as a step (decideTermination → await_outcome_scale), the door
//      stayed shut and AURA wrote «Εντάξει. Καλή συνέχεια.» before the root. Also: a reply made only of a farewell («Εντάξει.
//      Καλή συνέχεια.») is shown as the approved sentence, like a bare «Καλή συνέχεια».
//   2  «Δεν ξέρω» (or the like) to the root question counts as «Δεν το βρήκα ακόμα»: back to the conversation, through the model.
//      «Γράψ' το λίγο πιο ολοκληρωμένα» stays only for answers that try to say a root but are too short.
// Synthetic texts, or the real MODEL's / simulated user's lines from the stress runs — never John's words.

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
function fullFnSrc(name, src) {
  const C = src || CODE;
  const a = C.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = C.indexOf('(', a), depth = 0;
  for (; k < C.length; k++) { if (C[k] === '(') depth++; else if (C[k] === ')') { depth--; if (depth === 0) break; } }
  const b = C.indexOf('{', k); depth = 0;
  for (let j = b; j < C.length; j++) { if (C[j] === '{') depth++; else if (C[j] === '}') { depth--; if (depth === 0) return C.slice(a, j + 1); } }
  return null;
}
const constSrc = n => { const a = CODE.indexOf('const ' + n + ' = '); return a >= 0 ? CODE.slice(a, CODE.indexOf(';\n', a) + 1) : ''; };
const NAMES = ['stageALeavingDoorOpens', 'decideTermination', 'detectsConcreteStep', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'isModelPreClosing', 'isBareEmojiOrAcknowledgment', 'wasThirdTriggerAsked', 'detectSafetySignal', 'replaceBareGoodbye', 'buildCrisisLine',
  'rootAnswerIsUnsure', 'rootTextHasSubstance', 'substanceOfSentence', 'splitSentences', 'stageAFlowTelemetry',
  'isOpeningGreeting', 'lookBehind', 'stageASafetyHold']; // UPDATED (22/10, ADR «22 Οκτωβρίου (ε)»): a bare «γεια» before any conversation is an opening, not an exit — and UPDATED (22/10, old iPhones, Γ3): + lookBehind — the functions here look back through it (no lookbehind regex); UPDATED (23/10, Ο5): + stageASafetyHold — the leaving door reads it (danger from another person, test_danger_from_other_2310.js)
let F = {};
try {
  const consts = ['BARE_GOODBYE_TEXT', 'ROOT_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS', 'KNEW_MIN_SUBSTANCE_WORDS'].map(constSrc).join('\n');
  F = new Function(consts + '\n' + NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const HS = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleSubmit = useCallback(') + 60000);

// ── 1. The first explicit exit before the root ALWAYS opens «Πριν φύγεις:» ───────────────────────────────────────────────────
const GATE = o => T('stageALeavingDoorOpens', o);
const base = patch => Object.assign({ active: true, decision: 'confirm', lastUserText: 'Ευχαριστώ, κλείνουμε εδώ.', used: false, rootPhase: null,
  armed: false, rootConfirmed: false, closingStarted: false, riskKind: 0, safetyMode: false }, patch || {});
assert('DOOR 4: the explicit exit has priority — the door opens whatever the old closing would do (confirm, the clarity-scale hold, none, warn)',
  ['confirm', 'terminate', 'await_outcome_scale', 'none', 'warn'].every(d => GATE(base({ decision: d })) === true));
assert('DOOR 4: still only an EXPLICIT exit — «Ναι», «Οκ», «Εντάξει» open nothing',
  ['Ναι', 'Οκ', 'Εντάξει.'].every(u => GATE(base({ lastUserText: u, decision: 'await_outcome_scale' })) === false));
assert('DOOR 4: still once, never with the flow open, never in tier A, safety mode, a crisis message or after the root',
  GATE(base({ used: true })) === false && GATE(base({ armed: true })) === false && GATE(base({ rootPhase: 'ask' })) === false &&
  GATE(base({ riskKind: 1 })) === false && GATE(base({ safetyMode: true })) === false && GATE(base({ rootConfirmed: true })) === false &&
  GATE(base({ closingStarted: true })) === false && GATE(base({ lastUserText: 'Δεν θέλω να ζω άλλο, κλείνουμε.' })) === false &&
  GATE(base({ active: false })) === false && GATE({}) === false && GATE(null) === false);
{
  // Session 1.1 of run 27, as the simulated user wrote it, then the readiness question, then the exit.
  const U = c => ({ role: 'user', content: c }), A = c => ({ role: 'assistant', content: c });
  const READY = 'Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;';
  const EXIT = 'Ευχαριστώ, κλείνουμε εδώ.';
  const STEPS = ['Ότι θα κοιτάξω πίσω και θα πω πως τα χρόνια πήγαν χαμένα.', 'θα κάνω κάτι γι\' αυτό', 'Δεν ξέρω... ίσως να είχα κάνει κάτι που να μου άφηνε την αίσθηση ότι διάλεξα εγώ.',
    'να κάνω κάτι, δεν ξέρω τι', 'θα μπορούσα να του μιλήσω'];
  const opts = step => ({ safetyMode: false, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0, modelJudgesEnd: false,
    concreteStepStated: T('detectsConcreteStep', step) === true, outcomeScaleAsked: false, outcomeScaleBlockUsed: false, duringOnboarding: false, duringDeclineCooldown: false });
  const decisionFor = step => T('decideTermination', [U('Γεια. Δουλεύω οκτώ χρόνια σε τράπεζα και σκέφτομαι να φύγω.'), A('Τι σε κρατάει;'), U(step), A(READY), U(EXIT)], '', opts(step));
  assert('1.1 (run 27): «… θα πω πως τα χρόνια πήγαν χαμένα» is read as a step → the old closing holds for the clarity scale (the cause)',
    T('detectsConcreteStep', STEPS[0]) === true && decisionFor(STEPS[0]) === 'await_outcome_scale');
  const shut = STEPS.filter(st => GATE(base({ decision: decisionFor(st), lastUserText: EXIT })) !== true);
  assert('1.1 + similar phrases («θα κάνω κάτι», «ίσως να είχα κάνει κάτι…», «να κάνω κάτι», «θα μπορούσα να…»): the first exit opens «Πριν φύγεις:»' +
    (shut.length ? ' — shut after: ' + shut.join(' | ') : ''), shut.length === 0);
}
assert('WIRING: the gate no longer reads the old closing\'s decision (the callers are unchanged)',
  !/o\.decision/.test(fullFnSrc('stageALeavingDoorOpens') || 'o.decision') && /stageALeavingDoorOpens\(\{\s*active: true,\s*decision: decideTermination\(/.test(HS));

// ── 1b. A reply made only of a farewell is shown as the approved sentence ────────────────────────────────────────────────────
{
  const R = s => T('replaceBareGoodbye', s);
  const NEW = 'Ευχαριστώ που το μοιράστηκες. Να είσαι καλά.';
  const B = T('buildCrisisLine', 'B', '', false).line;
  assert('FAREWELL ONLY: «Εντάξει. Καλή συνέχεια.» (run 27, 1.1), «Ωραία, τα λέμε!», «Να είσαι καλά.», «Εντάξει, καληνύχτα 🙂», «Καλό βράδυ.» → the approved sentence',
    ['Εντάξει. Καλή συνέχεια.', 'Ωραία, τα λέμε!', 'Να είσαι καλά.', 'Εντάξει, καληνύχτα 🙂', 'Καλό βράδυ.', 'Οκ, να προσέχεις.', 'Καλή συνέχεια.'].every(s => R(s) === NEW));
  assert('FAREWELL ONLY, crisis path: above the app\'s line, the line unchanged', R('Εντάξει. Να προσέχεις.\n\n' + B) === NEW + '\n\n' + B);
  const KEEP = ['Εντάξει.', 'Καλά.', 'Καλή συνέχεια με τη σχολή.', 'Τα λέμε αύριο;', 'Εντάξει. Τι σε κρατάει;', NEW, 'Σου εύχομαι καλή συνέχεια.',
    'ΗΡΘΕΣ ΜΕ: x\n\nΒΡΗΚΕΣ: y\n\nΚαλή συνέχεια.', 'Εντάξει. Καλή συνέχεια.\n\nΤι άλλο κρατάς;', ''];
  const changed = KEEP.filter(s => R(s) !== s);
  assert('FAREWELL ONLY: an acknowledgement alone, a farewell with content, a question, the approved sentence itself stay' + (changed.length ? ' — changed: ' + changed.join(' | ') : ''), changed.length === 0);
}

// ── 2. «Δεν ξέρω» to the root question counts as «Δεν το βρήκα ακόμα», and the model answers ─────────────────────────────────
{
  const u = t => T('rootAnswerIsUnsure', t);
  assert('UNSURE: «Δεν ξέρω», «δεν είμαι σίγουρος», «Ιδέα δεν έχω», «δεν ξέρω ακόμα» and the like',
    ['Δεν ξέρω', 'δεν είμαι σίγουρος', 'Ιδέα δεν έχω', 'δεν ξέρω ακόμα', 'Δεν έχω ιδέα', 'Καμία ιδέα.', 'Ακόμα δεν ξέρω', 'Δεν το ξέρω', 'ε δεν ξέρω ακριβώς',
     'Δεν ξέρω τι με απασχολεί', 'Δεν είμαι σίγουρη ακόμα'].every(t => u(t) === true));
  assert('UNSURE: not an answer that says something, nor a short attempt at a root',
    ['Δεν ξέρω αν θέλω να μείνω στη δουλειά', 'Τα λεφτά', 'Περίπου δηλαδή', 'Φοβάμαι την απόρριψη', 'Ότι δεν ξέρω τι θέλω από τη ζωή μου'].every(t => u(t) === false));
  assert('SHORT ATTEMPT: «Τα λεφτά», «Περίπου δηλαδή» still get «Γράψ\' το λίγο πιο ολοκληρωμένα» (too short, not unsure)',
    ['Τα λεφτά', 'Περίπου δηλαδή'].every(t => T('rootTextHasSubstance', t) === false && u(t) === false));
  assert('WIRING: right after the crisis check, BEFORE the «too short» check — «Δεν το βρήκα ακόμα» (back), then the message goes to the model',
    /if \(!stageACaptureAllowed\(userText\)\) \{\s*stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "cancel" \}\);\s*\} else if \(rootAnswerIsUnsure\(userText\)\) \{(?:\s*\/\/[^\n]*)+\s*stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "back" \}\);\s*\} else if \(\(_saPhase === "ask"/.test(HS));
  const ask = { phase: 'ask', door: 1, stats: {} }, none = { phase: null, door: 0, stats: {} };
  const ev = T('stageAFlowTelemetry', ask, none, { type: 'back' }) || [];
  assert('COUNTED like «Δεν το βρήκα ακόμα»: root_answer «not yet» from the question',
    ev.length === 1 && ev[0].event === 'root_answer' && ev[0].fields.answer === 3 && ev[0].fields.from === 1);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
