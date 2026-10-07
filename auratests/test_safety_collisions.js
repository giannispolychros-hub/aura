// AURA — SAFETY FIRST (§0.1): four places where another mechanism collided with the safety path
// (ADR «7 Οκτωβρίου (β)»). Each is checked in the browser too (scripts/e2e_stage_a.cjs, section S); here the
// wiring that makes it hold.
//   1  a crisis / DISTRESS message while the app waits for «μία λέξη» cancels the wait — the next message is
//      no longer taken as the word, so the session cannot close in the middle of a crisis
//   2  on a supportive (crisis) turn no closing decision opens: card, warning, «Πριν φύγεις:», T3, T6. The
//      condition reads THIS turn's mode, not safetyMode (which only updates after the call — the cause)
//   3  the risk latch is updated always (passively) and the 6€ paywall shows only when it is 0
//   4  the early word is not kept when the message carries a safety signal (the word path's own check)

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
const SUB = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
const CRISIS = extractBlock('if (safetySignal === "CRISIS") {', CODE.indexOf('const handleSubmit = useCallback(')) || '';
const DISTRESS = extractBlock('if (safetySignal === "DISTRESS") {', CODE.indexOf('const handleSubmit = useCallback(')) || '';

// ── 1. the word wait is cancelled by a crisis / DISTRESS message ─────────────
assert('1: the crisis branch cancels the wait for the word BEFORE the supportive reply',
  /setAwaitingRememberedWord\(false\);[\s\S]*await generateResponse\(safeMsgs, "SUPPORTIVE"\);/.test(CRISIS));
assert('1: the DISTRESS branch cancels it too, before its reply',
  /setAwaitingRememberedWord\(false\);[\s\S]*await generateResponse\(distressMsgs, mode\);/.test(DISTRESS));
assert('1: the word path itself is unchanged (a message with a signal never becomes the word)',
  SUB.includes('if (awaitingRememberedWord && !detectSafetySignal(userText)) {'));
assert('1: the word path still runs BEFORE the safety branches (order unchanged)',
  SUB.indexOf('if (awaitingRememberedWord && !detectSafetySignal(userText)) {') < SUB.indexOf('const safetySignal = detectSafetySignal(userText);'));
assert('1: the crisis tier and safetyMode rule are untouched (tier A locks, tier B does not)',
  /const _crisisTier = classifyCrisisTier\(userText\);\s*if \(_crisisTier !== "B"\) setSafetyMode\(true\);/.test(CRISIS));

// ── 2. no closing decision on a supportive turn ──────────────────────────────
assert('2: generateResponse receives this turn\'s mode as its own argument',
  /const generateResponse = useCallback\(async \(msgs, currentMode/.test(GEN));
assert('2: a supportive turn takes NO closing decision — read from this turn\'s mode, not from safetyMode',
  /const decision = currentMode === "SUPPORTIVE" \? "none" : decideTermination\(msgs, text, \{/.test(GEN));
assert('2: the only supportive call is the crisis branch (so «supportive turn» = «crisis turn»)',
  (CODE.match(/generateResponse\([^)]*"SUPPORTIVE"\)/g) || []).length === 1 && CRISIS.includes('generateResponse(safeMsgs, "SUPPORTIVE")'));
{
  // T1–T8 themselves are not touched: the same pins as test_stage_a_leaving_door.js (B).
  const fnSha = n => sha(extractBlock('function ' + n + '(') || '');
  assert('2: decideTermination, matchesClosingWord, isExplicitClosure, declaresClosing unchanged (byte for byte)',
    fnSha('decideTermination') === '31270d891e4910e4' && fnSha('matchesClosingWord') === 'c3d044cc974bb7ac' &&
    fnSha('isExplicitClosure') === '09da70474755ef40' && fnSha('declaresClosing') === '45062068044c40b1');
}
{
  const d = GEN.indexOf('const decision = currentMode === "SUPPORTIVE"');
  const users = ['if (decision === "await_outcome_scale")', 'stageALeavingDoorOpens({', 'if (decision === "confirm" || decision === "terminate") {', 'if (decision === "warn") {'];
  assert('2: card, warning, «Πριν φύγεις:» and the outcome-scale block all read that one decision, after it',
    d > 0 && users.every(u => GEN.indexOf(u) > d));
}
{
  const btn = extractBlock('function stageARootButtonVisible(') || '';
  assert('2: the root button the user presses is NOT blocked on a supportive turn (its rule does not read the mode)',
    btn.length > 0 && !/SUPPORTIVE|currentMode|safetyMode/.test(btn) && /o\.riskKind !== 1/.test(btn));
}

// ── 3. the latch is always updated; the 6€ paywall only when it is 0 ─────────
assert('3: the risk latch is updated for EVERY submitted message, switch open or closed (passive)',
  SUB.includes('    riskSignalKind.current = mergeRiskKind(riskSignalKind.current, detectSafetySignal(userText), classifyCrisisTier(userText));') &&
  !SUB.includes('if (stageAActive.current) riskSignalKind.current = mergeRiskKind('));
assert('3: the 6€ paywall shows only when the latch is 0',
  CODE.includes('{!stageAActive.current && riskSignalKind.current === 0 && sessionEnded && !loading && finalDistillation && !valueUnlocked && ('));
assert('3: with the paywall hidden by the latch, «Νέα συνεδρία» is still there (the session never ends without a way on)',
  CODE.includes('(!finalDistillation || valueUnlocked || stageAActive.current || riskSignalKind.current !== 0)'));
assert('3: the latch is still reset with a new session', /riskSignalKind\.current = 0;/.test(extractBlock('const resetSession = () =>') || ''));

// ── 4. the early word is not kept when the message carries a safety signal ───
{
  const at = GEN.indexOf('if (awaitingEarlyWord.current) {');
  const blk = at >= 0 ? (extractBlock('if (awaitingEarlyWord.current) {', CODE.indexOf('const generateResponse = useCallback(')) || '') : '';
  assert('4: the early word is captured only when the message has no safety signal — the word path\'s own check',
    /if \(lastUserMsgForEarlyWord && !detectSafetySignal\(lastUserMsgForEarlyWord\.content\)\) \{\s*earlyCapturedWord\.current = lastUserMsgForEarlyWord\.content;/.test(blk));
  assert('4: the question is still consumed either way (no second capture later)', /awaitingEarlyWord\.current = false;/.test(blk));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
