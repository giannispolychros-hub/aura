// AURA — STAGE A: «Πριν φύγεις:» — door 1 instead of the old closing, ONCE, only for an explicit closing (T2)
// (ADR «6 Οκτωβρίου (λ)», SPEC_FREE_END.md §1.5α). Founder's decisions 1–8, 6/10/2026:
//   A  switch open + T2 the first time → door 1 with «Πριν φύγεις:»
//   B  switch open + T1 («Ναι», «Οκ», «Κατάλαβα») → no door (T1's meaning untouched)
//   C  a second T2 after «Δεν το βρήκα ακόμα» → the normal closing (no loop)
//   D  T2 carrying a tier-A crisis signal → the safety path, no door (tier B / DISTRESS: door allowed)
//   E  switch closed → nothing changes
//   F  the prompt addition lives ONLY inside the Stage A rule
//   G  the measurement field «door opened from closing» is separate from the button press
//   H  the root limit (2 substance words, filler words do not count) apart from «Τι ήξερες» (4)

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
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const sha = x => require('crypto').createHash('sha256').update(x || '', 'utf8').digest('hex').slice(0, 16);
// UPDATED (8/10): decideTermination's parameters contain braces, so extractBlock caught only its signature; the pin now
// covers the whole function (verified identical to 8c4cb9c, before any Stage A closing work).
function fullFnSrc(name) { // the WHOLE function — its parameters may themselves contain braces
  const a = CODE.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = CODE.indexOf('(', a), depth = 0;
  for (; k < CODE.length; k++) { if (CODE[k] === '(') depth++; else if (CODE[k] === ')') { depth--; if (depth === 0) break; } }
  const b = CODE.indexOf('{', k); depth = 0;
  for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') depth++; else if (CODE[j] === '}') { depth--; if (depth === 0) return CODE.slice(a, j + 1); } }
  return null;
}
function extractBlock(startToken) {
  const a = CODE.indexOf(startToken);
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1); }
  }
  return null;
}
const NAMES = ['isExplicitClosure', 'declaresClosing', 'matchesClosingWord', 'detectSafetySignal', 'classifyCrisisTier', 'mergeRiskKind',
  'stageALeavingDoorOpens', 'initialStageAState', 'stageAStep', 'stageATelemetry', 'substanceOfSentence', 'splitSentences',
  'rootTextHasSubstance', 'pickKnewSnippet'];
const srcs = NAMES.map(n => extractBlock('function ' + n + '(') || `function ${n}(){return undefined}`);
const consts = ['ROOT_MIN_SUBSTANCE_WORDS', 'KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS'].map(n => {
  const a = CODE.indexOf('const ' + n + ' = ');
  return a < 0 ? `const ${n} = undefined;` : CODE.slice(a, CODE.indexOf(';\n', a) + 1);
});
const textsSrc = (extractBlock('const STAGE_A_TEXTS = ') || 'const STAGE_A_TEXTS = {}') + ';';
let F = {};
try {
  F = new Function(textsSrc + '\n' + consts.join('\n') + '\n' + srcs.join('\n') +
    '\nreturn {STAGE_A_TEXTS,ROOT_MIN_SUBSTANCE_WORDS,KNEW_MIN_SUBSTANCE_WORDS,ROOT_FILLER_WORDS,' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const GATE = o => { try { return F.stageALeavingDoorOpens(o); } catch (e) { return 'threw'; } };
const STEP = (s, e) => { try { return F.stageAStep(s, e) || {}; } catch (x) { return { stats: {} }; } };
const T2 = u => !!(F.isExplicitClosure(u) || F.declaresClosing(u));
// The state of an ordinary turn of a Stage A session where the old closing would open now.
const base = (patch) => Object.assign({ active: true, decision: 'confirm', lastUserText: 'Ευχαριστώ.', used: false, rootPhase: null,
  armed: false, rootConfirmed: false, closingStarted: false, riskKind: 0, safetyMode: false }, patch || {});

const LEAVING = 'Πριν φύγεις: πες το με μία φράση — τι είναι αυτό που σε απασχολεί;';
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
const SUB = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const gateAt = GEN.indexOf('stageALeavingDoorOpens(');
const oldGuardAt = GEN.indexOf('(stageARootArmed.current || stageARef.current.phase) && (decision === "confirm" || decision === "terminate")) return;');
const oldCardAt = GEN.indexOf('setClosureConfirmPending(true);');

// ── A: switch open + T2, the first time → door 1 with «Πριν φύγεις:» ──────────
assert('A: the fixed text, exactly as decided', F.STAGE_A_TEXTS && F.STAGE_A_TEXTS.askLeaving === LEAVING);
assert('A: «Ευχαριστώ.» before the root, the old closing about to open → the door opens', GATE(base()) === true);
assert('A: «Κλείνουμε» and «Ευχαριστώ, κλείνουμε εδώ.» → the door opens', GATE(base({ lastUserText: 'Κλείνουμε' })) === true && GATE(base({ lastUserText: 'Ευχαριστώ, κλείνουμε εδώ.' })) === true);
assert('A: «terminate» as well as «confirm»', GATE(base({ decision: 'terminate' })) === true);
assert('A: only where the old closing would open — decision none / warn / await → no door',
  ['none', 'warn', 'await_outcome_scale'].every(d => GATE(base({ decision: d })) === false));
{
  const s1 = STEP(F.initialStageAState(), { type: 'leaving' });
  assert('A: the «leaving» event opens door 1\'s question (phase ask, door 1), marked as the closing variant', s1.phase === 'ask' && s1.door === 1 && s1.leaving === true);
  const sR = STEP(s1, { type: 'tooShort' });
  assert('A: a too-short answer keeps the «Πριν φύγεις:» question (retry, still the closing variant)', sR.phase === 'ask' && sR.retry === true && sR.leaving === true);
  const sOpen = STEP(s1, { type: 'open', door: 1, found: 'Ότι φοβάμαι την απόρριψη από τους δικούς μου.', assistantReplies: 3 });
  assert('A: the answer opens the same root card as door 1 (rootDoor 1)', sOpen.phase === 'card' && sOpen.stats.rootDoor === 1 && sOpen.leaving === false);
  assert('A: «leaving» does nothing while another phase is open', STEP(STEP(F.initialStageAState(), { type: 'press' }), { type: 'leaving' }).stats.rootDoorFromClosing === 0);
  assert('A: the button press does NOT show the closing text (plain door 1)', STEP(F.initialStageAState(), { type: 'press' }).leaving === false);
}
assert('A: wiring — generateResponse asks the gate AFTER the termination decision and BEFORE the old closing card',
  gateAt > GEN.indexOf('const decision = decideTermination(') && gateAt > 0 && gateAt < oldGuardAt && gateAt < oldCardAt);
{
  const blk = GEN.slice(gateAt, gateAt + 900);
  assert('A: wiring — on a yes the door opens and the turn ends there (no old closing card this turn)', /stageADispatch\(\{ type: "leaving" \}\);\s*return;/.test(blk));
  assert('A: wiring — the gate reads the LAST USER message of this turn', /lastUserText: _saLast && _saLast\.role === "user"/.test(blk) && /const _saLast = msgs\.length \? msgs\[msgs\.length - 1\] : null;/.test(GEN));
  assert('A: wiring — once per session: «used» comes from the measurement field itself', /used: stageARef\.current\.stats\.rootDoorFromClosing > 0/.test(blk));
  assert('A: wiring — not with the root flow open / door 2 armed / root confirmed / closing started',
    /rootPhase: stageARef\.current\.phase/.test(blk) && /armed: stageARootArmed\.current/.test(blk) && /rootConfirmed: stageARef\.current\.stats\.rootConfirmed === 1/.test(blk) && /closingStarted: reflectionDelivered\.current/.test(blk));
}
assert('A: the question card shows «Πριν φύγεις:» for the closing variant, the usual text otherwise',
  /\{stageAView\.leaving \? STAGE_A_TEXTS\.askLeaving : STAGE_A_TEXTS\.ask\}/.test(CODE));
assert('A: the answer is recorded under the question that was actually shown',
  /content: stageARef\.current\.leaving \? STAGE_A_TEXTS\.askLeaving : STAGE_A_TEXTS\.ask, msgMode: "STAGE_A"/.test(SUB));

// ── B: T1 — short agreements — no door, T1 untouched ─────────────────────────
['Ναι', 'Οκ', 'Κατάλαβα', 'Ναι.', 'οκ'].forEach(u =>
  assert(`B: T1 «${u}» → no door`, GATE(base({ lastUserText: u })) === false));
assert('B: the gate is EXACTLY the existing T2 recognition (isExplicitClosure || declaresClosing) — nothing more, nothing less',
  ['Ευχαριστώ.', 'Ευχαριστώ', 'Κλείνουμε', 'Τα λέμε', 'Ευχαριστώ, κλείνουμε εδώ.', 'Ναι', 'Οκ', 'Κατάλαβα', 'Σωστό', 'Μάλλον ναι', 'Ότι φοβάμαι την απόρριψη.', '']
    .every(u => GATE(base({ lastUserText: u })) === T2(u)));
assert('B: the gate does not use the T1 detector (matchesClosingWord) or a new detector',
  !/matchesClosingWord|naturalExitReady/.test(extractBlock('function stageALeavingDoorOpens(') || 'matchesClosingWord'));
// T1 and T2 themselves are untouched: the four functions that decide them are pinned to their text before this change.
{
  const hash = x => require('crypto').createHash('sha256').update(x || '', 'utf8').digest('hex').slice(0, 16);
  const sha = n => hash(extractBlock('function ' + n + '('));
  assert('B: T1/T2 unchanged — decideTermination, matchesClosingWord, isExplicitClosure, declaresClosing are byte-identical to before',
    hash(fullFnSrc('decideTermination')) === 'a8a8f403a2d5adb6' && sha('matchesClosingWord') === 'c3d044cc974bb7ac' &&
    sha('isExplicitClosure') === '09da70474755ef40' && sha('declaresClosing') === '45062068044c40b1');
}

// ── C: second time → the normal closing ──────────────────────────────────────
{
  const s1 = STEP(F.initialStageAState(), { type: 'leaving' });
  const s2 = STEP(s1, { type: 'back' });
  assert('C: «Δεν το βρήκα ακόμα» closes the question, the conversation continues, the field stays counted', s2.phase === null && s2.leaving === false && s2.stats.rootDoorFromClosing === 1 && s2.stats.rootBack === 1);
  assert('C: a second T2 after that → NO door (used), so the old closing runs as it always did',
    GATE(base({ used: s2.stats.rootDoorFromClosing > 0 })) === false);
  assert('C: the old closing code right after the gate is unchanged (the guard, then the «πριν κλείσουμε» card)',
    oldGuardAt > gateAt && oldCardAt > oldGuardAt);
}
assert('C: no door once the closing has started, the root is confirmed, the flow is open or door 2 is armed',
  GATE(base({ closingStarted: true })) === false && GATE(base({ rootConfirmed: true })) === false &&
  GATE(base({ rootPhase: 'card' })) === false && GATE(base({ rootPhase: 'ask' })) === false && GATE(base({ armed: true })) === false);
assert('C: «Δεν το βρήκα ακόμα» is the existing button (no new text, no new handler)',
  /Δεν το βρήκα ακόμα/.test(F.STAGE_A_TEXTS.back || '') && (CODE.match(/onClick=\{handleStageABack\}/g) || []).length >= 1);

// ── D: safety first ──────────────────────────────────────────────────────────
{
  const msgA = 'Κλείνουμε εδώ, δεν θέλω να ζω άλλο.';
  const msgB = 'Ευχαριστώ, κλείνουμε. Δεν βλέπω νόημα σε τίποτα πια.';
  assert('D: the fixture is a real T2 carrying a tier-A crisis signal', T2(msgA) && F.detectSafetySignal(msgA) === 'CRISIS' && F.classifyCrisisTier(msgA) === 'A');
  const kA = F.mergeRiskKind(0, F.detectSafetySignal(msgA), F.classifyCrisisTier(msgA));
  assert('D: tier A → the risk latch is 1 and the door does NOT open', kA === 1 && GATE(base({ lastUserText: msgA, riskKind: kA })) === false);
  assert('D: tier A earlier in the session → still no door later', GATE(base({ riskKind: 1 })) === false);
  assert('D: safety mode on → no door', GATE(base({ safetyMode: true })) === false);
  const kB = F.mergeRiskKind(0, F.detectSafetySignal(msgB), F.classifyCrisisTier(msgB));
  assert('D: tier B / DISTRESS → the door is allowed (card yes, offer no — as already decided)',
    kB === 2 && GATE(base({ lastUserText: msgB, riskKind: kB })) === true && GATE(base({ riskKind: 3 })) === true);
  assert('D: the risk latch is updated at the very start of handleSubmit, before the reply and the gate',
    SUB.indexOf('riskSignalKind.current = mergeRiskKind(') > 0 && SUB.indexOf('riskSignalKind.current = mergeRiskKind(') < SUB.indexOf('const safetySignal = detectSafetySignal(userText);'));
  assert('D: wiring passes the latch and safetyMode to the gate', /riskKind: riskSignalKind\.current/.test(GEN.slice(gateAt, gateAt + 900)) && /safetyMode,?\s/.test(GEN.slice(gateAt, gateAt + 900)));
}

// ── E: switch closed → nothing changes ───────────────────────────────────────
assert('E: switch closed → the gate is false for every closing, every state',
  ['Ευχαριστώ.', 'Κλείνουμε', 'Τα λέμε', 'Ναι'].every(u => ['confirm', 'terminate'].every(d => GATE(base({ active: false, lastUserText: u, decision: d })) === false)));
assert('E: the gate is told the switch from the per-visit ref', /active: stageAActive\.current/.test(GEN.slice(gateAt, gateAt + 900)));
assert('E: non-object / empty input never opens the door, never throws', GATE(null) === false && GATE(undefined) === false && GATE({}) === false);

// ── F: the prompt addition — only inside the Stage A rule ────────────────────
const ADD = 'Όσο η ρίζα δεν έχει επιβεβαιωθεί από τον χρήστη, μην αποχαιρετάς και μην παρουσιάζεις τη συνεδρία ως ολοκληρωμένη. Αν ο χρήστης θέλει να σταματήσει, απάντησε σύντομα, χωρίς κλείσιμο.';
{
  const ruleA = PROMPT.indexOf('STAGE A — FREE PART ENDS AT THE ROOT');
  const ruleEnd = PROMPT.indexOf('<critical_invariants>', ruleA);
  const at = PROMPT.indexOf(ADD);
  assert('F: the addition is in the prompt, word for word', at > 0);
  assert('F: exactly once', PROMPT.split(ADD).length === 2);
  assert('F: inside the Stage A paragraph (after its heading, before the closing invariants)', at > ruleA && ruleA > 0 && at < ruleEnd);
  assert('F: the Stage A paragraph still says it applies ONLY with the marker', /ACTIVE ONLY WHEN the per-turn context of this message contains the exact marker \[FREE PART: ENDS AT ROOT\]/.test(PROMPT.slice(ruleA, ruleA + 400)));
  assert('F: not in any per-turn context or any other code (no second copy, no new detector)', !CODE.includes('μην αποχαιρετάς') && !CODE.includes('χωρίς κλείσιμο'));
  assert('F: the fixed «Πριν φύγεις:» text is the app\'s, not the model\'s (it is not in the prompt)', !PROMPT.includes(LEAVING));
}

// ── G: the measurement field ─────────────────────────────────────────────────
{
  const S0 = F.initialStageAState();
  assert('G: a separate counter «rootDoorFromClosing», 0 at the start', S0.stats && S0.stats.rootDoorFromClosing === 0);
  const sL = STEP(S0, { type: 'leaving' });
  assert('G: the closing door counts there and NOT as a button press', sL.stats.rootDoorFromClosing === 1 && sL.stats.rootButtonPressed === 0);
  const sP = STEP(S0, { type: 'press' });
  assert('G: the button press counts there and NOT as the closing door', sP.stats.rootButtonPressed === 1 && sP.stats.rootDoorFromClosing === 0);
  const tel = F.stageATelemetry(sL.stats, {});
  assert('G: session_completed carries it as its own integer field', tel.rootDoorFromClosing === 1 && tel.rootButtonPressed === 0 && /^[a-zA-Z]{1,24}$/.test('rootDoorFromClosing'));
}

// ── H: the two limits ────────────────────────────────────────────────────────
{
  const H = x => F.rootTextHasSubstance(x);
  assert('H: two simple constants — root 2, «Τι ήξερες» 4', F.ROOT_MIN_SUBSTANCE_WORDS === 2 && F.KNEW_MIN_SUBSTANCE_WORDS === 4);
  assert('H: the filler words of the decision do not count for a root',
    Array.isArray(F.ROOT_FILLER_WORDS) && ['περιπου', 'δηλαδη', 'ναι', 'οχι', 'αυτο', 'ισως', 'οκ'].every(w => F.ROOT_FILLER_WORDS.includes(w)));
  ['Περίπου δηλαδή', 'Η αμφιβολία', 'Ναι, οκ', 'Ίσως αυτό', 'Όχι, δηλαδή περίπου', 'Ίσως η αμφιβολία'].forEach(x =>
    assert(`H: root «${x}» rejected`, H(x) === false));
  ['Φοβάμαι την απόρριψη', 'Ότι δεν ζητάω αυτό που χρειάζομαι', 'Η αμφιβολία μου για το άγνωστο'].forEach(x =>
    assert(`H: root «${x}» accepted`, H(x) === true));
  assert('H: «Τι ήξερες» stays at 4 — two or three substance words are not enough there',
    F.pickKnewSnippet(['Φοβάμαι την απόρριψη']) === null && F.pickKnewSnippet(['Φοβάμαι την απόρριψη στη δουλειά']) === null);
  assert('H: «Τι ήξερες» with 4 substance words is accepted as before',
    !!F.pickKnewSnippet(['Φοβάμαι την απόρριψη στη δουλειά πάντα']) && F.pickKnewSnippet(['Φοβάμαι την απόρριψη στη δουλειά πάντα']).text === 'Φοβάμαι την απόρριψη στη δουλειά πάντα');
  assert('H: the filler words do not touch «Τι ήξερες» (only the root uses them)',
    !!F.pickKnewSnippet(['Ίσως περίπου δηλαδή φοβάμαι αλλαγές δουλειάς']));
  assert('H: still ONE rule — both go through substanceOfSentence, with the limit as an argument',
    /substanceOfSentence\(raw, ROOT_MIN_SUBSTANCE_WORDS, ROOT_FILLER_WORDS\)/.test(extractBlock('function rootTextHasSubstance(') || '') &&
    /substanceOfSentence\(raw, KNEW_MIN_SUBSTANCE_WORDS\)/.test(extractBlock('function pickKnewSnippet(') || ''));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
