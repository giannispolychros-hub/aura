// AURA — STAGE A: doors 2 and 3 pass the same root-substance rule as the button and «Διόρθωσε»
// (ADR «7 Οκτωβρίου (γ)», SPEC_FREE_END.md §1.5). Founder's decision, 7/10/2026:
//   - passes (≥ 2 substance words; «περίπου», «δηλαδή», «ναι», «όχι», «αυτό», «ίσως», «οκ» do not count) →
//     the root card as today, with the phrase WHOLE (not cut, not cleaned)
//   - does not pass → no card: door 1's existing question with the existing «Δεν το βρήκα ακόμα». No model call,
//     no new text.
//   - the safety path stays first: a phrase with a crisis signal takes the crisis path, no card — door 2 already
//     did; door 3 now uses the same check (stageACaptureAllowed).
// Not touched: prompt, coreReadinessCtx, what «Δεν το βρήκα ακόμα» does, safety, closings, the «Τι ήξερες» limit.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
function extractBlock(startToken, from) {
  const a = CODE.indexOf(startToken, from || 0);
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1); }
  }
  return null;
}
const sha = s => crypto.createHash('sha256').update(s || '', 'utf8').digest('hex').slice(0, 16);
const NAMES = ['detectSafetySignal', 'classifyCrisisTier', 'stageACaptureAllowed', 'substanceOfSentence', 'splitSentences', 'rootTextHasSubstance',
  'pickKnewSnippet', 'detectsSpontaneousCoreRecognition', 'initialStageAState', 'stageAStep', 'stageATelemetry'];
const consts = ['KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS'].map(n => {
  const a = CODE.indexOf('const ' + n + ' = ');
  return a < 0 ? `const ${n} = undefined;` : CODE.slice(a, CODE.indexOf(';\n', a) + 1);
});
let F = {};
try {
  F = new Function(consts.join('\n') + '\n' + NAMES.map(n => extractBlock('function ' + n + '(') || `function ${n}(){return undefined}`).join('\n') +
    '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const STEP = (s, e) => { try { return F.stageAStep(s, e) || {}; } catch (x) { return { stats: {} }; } };
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
const SUB = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const LONG = 'Τώρα κατάλαβα: φοβάμαι ότι αν φύγω από την τράπεζα θα απογοητεύσω τον πατέρα μου, που πάντα ήθελε να έχω σιγουριά.';
const SHORT = ['Δεν ξέρω', 'Ναι', 'Ναι, αυτό ακριβώς είναι!', 'Περίπου δηλαδή'];

// ── The rule (the same function as the button and «Διόρθωσε») ───────────────
SHORT.forEach(p => assert(`RULE: «${p}» does not pass`, F.rootTextHasSubstance(p) === false));
assert('RULE: «Φοβάμαι την απόρριψη» passes', F.rootTextHasSubstance('Φοβάμαι την απόρριψη') === true);
assert('RULE: the long door-3 message passes (and it IS a spontaneous recognition, ≤ 25 words)',
  F.rootTextHasSubstance(LONG) === true && F.detectsSpontaneousCoreRecognition(LONG) === true);
assert('RULE: «Ναι, αυτό ακριβώς είναι!» is what reaches door 3 today (spontaneous recognition)',
  F.detectsSpontaneousCoreRecognition('Ναι, αυτό ακριβώς είναι!') === true);
assert('RULE: «Τι ήξερες» keeps its own limit of 4 (untouched)',
  /const KNEW_MIN_SUBSTANCE_WORDS = 4;/.test(CODE) && F.pickKnewSnippet(['Φοβάμαι την απόρριψη']) === null);

// ── The step: «reask» opens door 1's question, keeps the door it came from ───
{
  const S0 = F.initialStageAState();
  const s2 = STEP(S0, { type: 'reask', door: 2 });
  assert('STEP: door 2 without substance → door 1\'s question (phase ask), the door of origin kept (2)', s2.phase === 'ask' && s2.door === 2);
  assert('STEP: no closing variant, no retry line — the existing question only', s2.leaving === false && s2.retry === false);
  assert('STEP: counted as a root text without substance, NOT as a button press or a closing door',
    s2.stats.rootTooShort === 1 && s2.stats.rootButtonPressed === 0 && s2.stats.rootDoorFromClosing === 0);
  const s3 = STEP(S0, { type: 'reask', door: 3 });
  assert('STEP: door 3 the same (door of origin 3)', s3.phase === 'ask' && s3.door === 3 && s3.stats.rootTooShort === 1);
  assert('STEP: only doors 2 and 3', STEP(S0, { type: 'reask', door: 1 }).phase === null && STEP(S0, { type: 'reask' }).phase === null);
  assert('STEP: nothing while another phase is open', STEP(STEP(S0, { type: 'press' }), { type: 'reask', door: 2 }).stats.rootTooShort === 0);
  const back = STEP(s2, { type: 'back' });
  assert('STEP: «Δεν το βρήκα ακόμα» from there does what it always does (phase closed, counted)', back.phase === null && back.door === 0 && back.stats.rootBack === 1);
  const open = STEP(s2, { type: 'open', door: 2, found: 'Φοβάμαι την απόρριψη', assistantReplies: 3 });
  assert('STEP: a real answer then opens the card, credited to the door of origin', open.phase === 'card' && open.stats.rootDoor === 2 && open.found === 'Φοβάμαι την απόρριψη');
}

// ── Door 2 wiring (handleSubmit) ─────────────────────────────────────────────
{
  const at = SUB.indexOf('if (stageAActive.current && (_saPhase === "ask" || _saPhase === "correct" || _saArmed)) {');
  const blk = at >= 0 ? SUB.slice(at, at + 2200) : '';
  assert('DOOR 2: the crisis check still comes FIRST (any crisis → cancel, the message takes the crisis path)',
    blk.indexOf('if (!stageACaptureAllowed(userText)) {') > 0 && blk.indexOf('if (!stageACaptureAllowed(userText)) {') < blk.indexOf('type: "reask", door: 2'));
  assert('DOOR 2: a capture without substance → door 1\'s question, nothing sent, nothing added to the transcript',
    /else if \(_saArmed && !rootTextHasSubstance\(userText\)\) \{\s*stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "reask", door: 2 \}\);\s*return;\s*\}/.test(blk));
  assert('DOOR 2: the answer to that question is recorded under the question shown, credited to the door of origin',
    /const _saDoor = _saPhase === "ask" \? \(stageARef\.current\.door \|\| 1\) : 2;/.test(blk) &&
    /const _saAdded = _saPhase === "ask"\s*\? \[\{ id: nextMsgId\(\), role: "assistant", content: stageARef\.current\.leaving \? STAGE_A_TEXTS\.askLeaving : STAGE_A_TEXTS\.ask, msgMode: "STAGE_A" \}, \{ id: nextMsgId\(\), role: "user", content: userText \}\]/.test(blk));
  assert('DOOR 2: a capture WITH substance opens the card with the text WHOLE, as today', /stageAOpen\(_saDoor, userText, \[\.\.\.messages, \.\.\._saAdded\]\);/.test(blk));
}

// ── Door 3 wiring (generateResponse) ─────────────────────────────────────────
{
  const at = GEN.indexOf('const _saSpont = ');
  const blk = at >= 0 ? GEN.slice(at, at + 700) : '';
  assert('DOOR 3: a crisis signal → no card (the same check door 2 uses), the crisis path stays as it is',
    /if \(_saSpont && !stageACaptureAllowed\(_saLastUser\.content\)\) \{\s*\/\/[^\n]*\n\s*\}/.test(blk));
  assert('DOOR 3: with substance → the card with the WHOLE message, as today',
    /else if \(_saSpont && rootTextHasSubstance\(_saLastUser\.content\)\) stageAOpen\(3, _saLastUser\.content, msgs\);/.test(blk));
  assert('DOOR 3: without substance → door 1\'s question, no model call', /else if \(_saSpont\) stageADispatch\(\{ type: "reask", door: 3 \}\);/.test(blk));
  assert('DOOR 3: otherwise door 2 is armed exactly as before', /else stageARootArmed\.current = true;/.test(blk));
}

// ── Not touched ──────────────────────────────────────────────────────────────
assert('UNCHANGED: «Δεν το βρήκα ακόμα» — the model is called only from door 2\'s CARD, never from the question',
  /if \(_ph === "card" && _door === 2\) \{\s*turnCount\.current \+= 1;\s*generateResponse\(messages, mode\);\s*\}/.test(extractBlock('const handleStageABack = useCallback(') || ''));
assert('UNCHANGED: the question text and the «Δεν το βρήκα ακόμα» text',
  CODE.includes('ask: "Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;",') && CODE.includes('back: "Δεν το βρήκα ακόμα, συνέχισε",'));
assert('UNCHANGED: the crisis capture rule and the root rule (byte for byte)',
  sha(extractBlock('function stageACaptureAllowed(')) === 'e45f98e42434f208' && sha(extractBlock('function rootTextHasSubstance(')) === '11d0cb226862ec80');
assert('UNCHANGED: the closings (decideTermination byte for byte)', sha(fullFnSrc('decideTermination')) === 'a8a8f403a2d5adb6');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
