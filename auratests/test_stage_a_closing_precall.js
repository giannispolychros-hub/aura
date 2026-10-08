// AURA — STAGE A: the FIRST explicit closing before the root opens «Πριν φύγεις:» BEFORE the model is called
// (ADR «8 Οκτωβρίου», phone test of 7/10 on f1ed6ed), and the root question is scrolled into view on a phone.
//   A  first explicit closing (T2), switch open, before the root: no model call that turn — the app shows
//      «Πριν φύγεις: …» with «Δεν το βρήκα ακόμα, συνέχισε». The reply it replaces carried the old closing
//      (GRACEFUL EXIT stage + THIRD TRIGGER's friend question) stacked above the door. A crisis / DISTRESS message
//      takes the safety path as today (its branches return before this point). The second closing is unchanged.
//   C  the root question (door 1's question, «Πριν φύγεις:», «Διόρθωσε») opens without a new message, so the bottom
//      scroll never ran and it sat behind the sticky input. It is now scrolled into view when it opens.

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
// decideTermination and its helpers, loaded as the app has them.
const NAMES = ['matchesClosingWord', 'isBareEmojiOrAcknowledgment', 'isExplicitClosure', 'declaresClosing', 'isModelPreClosing', 'wasThirdTriggerAsked',
  'decideTermination', 'stageALeavingDoorOpens'];
let F = {};
try {
  const helpers = [];
  const need = new Set(NAMES);
  // pull in any other top-level function decideTermination's helpers call
  for (let pass = 0; pass < 4; pass++) {
    const src = [...need].map(n => fullFnSrc(n) || '').join('\n');
    (src.match(/\b([a-zA-Z_]\w*)\(/g) || []).map(x => x.slice(0, -1)).forEach(n => { if (!need.has(n) && CODE.includes('\nfunction ' + n + '(')) need.add(n); });
  }
  F = new Function([...need].map(n => fullFnSrc(n)).join('\n') + '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }

const SUB = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));

// ── A: the decision, made before the model, with the SAME mechanism ─────────
const JOHN = [
  { role: 'user', content: 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά' },
  { role: 'assistant', content: 'Γιατί έχει σημασία αυτό για σένα τώρα;' },
  { role: 'user', content: 'Νιώθω ότι δεν πέτυχα όσα μπορούσα. Είμαι εκπαιδευτικός' },
  { role: 'assistant', content: 'Τι σημαίνει για σένα "όσα μπορούσα" — τι συγκεκριμένα φαντάστηκες κάποτε ότι θα πετύχεις;' },
  { role: 'user', content: 'Περισσότερα χρήματα' },
  { role: 'assistant', content: 'Και σήμερα — το πρόβλημα είναι ότι τα χρήματα δεν φτάνουν, ή ότι νιώθεις ότι άξιζες περισσότερα;' },
];
const opts = { safetyMode: false, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0, modelJudgesEnd: false,
  concreteStepStated: false, outcomeScaleAsked: false, outcomeScaleBlockUsed: false, duringOnboarding: false, duringDeclineCooldown: false };
const D = (u, o) => { try { return F.decideTermination([...JOHN, { role: 'user', content: u }], '', Object.assign({}, opts, o || {})); } catch (e) { return 'threw'; } };
const G = (u, patch) => F.stageALeavingDoorOpens(Object.assign({ active: true, decision: D(u), lastUserText: u, used: false, rootPhase: null, armed: false,
  rootConfirmed: false, closingStarted: false, riskKind: 0, safetyMode: false }, patch || {}));
assert('A: John\'s «Ευχαριστώ» — the old closing would open now (decideTermination, no reply text needed for T2)', D('Ευχαριστώ') === 'confirm');
assert('A: … so the door opens before the model', G('Ευχαριστώ') === true);
assert('A: T1 «Ναι» / an ordinary answer → no door before the model', G('Ναι') === false && G('Ίσως η κενοδοξια των χρημάτων') === false);
assert('A: second closing (used) → no door before the model, the turn goes on as before', G('Ευχαριστώ', { used: true }) === false);
assert('A: decline cooldown still holds the closing back (same rule as after the reply)', F.stageALeavingDoorOpens({ active: true,
  decision: D('Ευχαριστώ', { duringDeclineCooldown: true }), lastUserText: 'Ευχαριστώ', used: false, rootPhase: null, armed: false,
  rootConfirmed: false, closingStarted: false, riskKind: 0, safetyMode: false }) === false);
assert('A: tier A earlier in the session / safety mode → no door', G('Ευχαριστώ', { riskKind: 1 }) === false && G('Ευχαριστώ', { safetyMode: true }) === false);
{
  const fw = SUB.indexOf('if (firstWhyPending) {');
  const dis = SUB.indexOf('if (safetySignal === "DISTRESS") {');
  const pre = SUB.indexOf('// STAGE A — «Πριν φύγεις:» BEFORE the model');
  const next = SUB.indexOf('const nextMsgs  = [...messages, { id: nextMsgId(), role: "user", content: userText }];');
  const blk = pre >= 0 ? SUB.slice(pre, next) : '';
  assert('A: wiring — after the crisis and DISTRESS branches (safety first) and First-WHY, before the message is sent',
    pre > dis && dis > 0 && pre > fw && fw > 0 && next > pre);
  assert('A: wiring — switch open, at least one AURA reply already, the same gate as after the reply',
    /if \(stageAActive\.current && messages\.some\(m => m\.role === "assistant" && m\.msgMode !== "STAGE_A"\) && stageALeavingDoorOpens\(\{/.test(blk));
  assert('A: wiring — the decision is decideTermination on this message, no reply text, no model signal',
    /decision: decideTermination\(\[\.\.\.messages, \{ role: "user", content: userText \}\], "", \{/.test(blk) && /modelJudgesEnd: false/.test(blk) &&
    /duringDeclineCooldown: closureDeclineCooldown\.current > 0/.test(blk) && /safetyMode, currentMode: mode/.test(blk));
  assert('A: wiring — once per session, never with the flow open, door 2 armed, a confirmed root or a closing started',
    /used: stageARef\.current\.stats\.rootDoorFromClosing > 0/.test(blk) && /rootPhase: stageARef\.current\.phase, armed: stageARootArmed\.current/.test(blk) &&
    /rootConfirmed: stageARef\.current\.stats\.rootConfirmed === 1/.test(blk) && /closingStarted: reflectionDelivered\.current, riskKind: riskSignalKind\.current, safetyMode/.test(blk));
  assert('A: wiring — the door opens and the turn ENDS: no model call, nothing sent',
    /stageADispatch\(\{ type: "leaving" \}\);\s*return;\s*\}/.test(blk) && !/generateResponse|callAura|setMessages/.test(blk));
}
assert('A: the gate after the reply is still there (second closing → old closing; any case not caught before)',
  /if \(stageALeavingDoorOpens\(\{\s*active: stageAActive\.current, decision,/.test(GEN));
assert('A: the old closing itself is unchanged (decideTermination, the T1/T2 detectors byte for byte)',
  sha(fullFnSrc('decideTermination')) === 'a8a8f403a2d5adb6' && sha(extractBlock('function isExplicitClosure(')) === '09da70474755ef40' &&
  sha(extractBlock('function declaresClosing(')) === '45062068044c40b1' && sha(extractBlock('function matchesClosingWord(')) === 'c3d044cc974bb7ac');
assert('A: the gate function itself is unchanged', sha(extractBlock('function stageALeavingDoorOpens(')) === '02f8691f1077a5b2' &&
  /\(isExplicitClosure\(u\) \|\| declaresClosing\(u\)\);/.test(extractBlock('function stageALeavingDoorOpens(') || ''));

// ── C: the root question is scrolled into view when it opens ─────────────────
{
  const at = CODE.indexOf('// STAGE A (phone test 7/10): the root question opens');
  const eff = at >= 0 ? CODE.slice(at, at + 700) : '';
  assert('C: an effect on the phase scrolls to the bottom when the root question opens (door 1, «Πριν φύγεις:», «Διόρθωσε»)',
    /useEffect\(\(\) => \{\s*if \(!stageAActive\.current \|\| \(stageAPhase !== "ask" && stageAPhase !== "correct"\)\) return;\s*bottomRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "end" \}\);\s*\}, \[stageAPhase\]\);/.test(eff));
  assert('C: switch closed → the effect returns at once (nothing on screen changes)', /if \(!stageAActive\.current \|\|/.test(eff));
  assert('C: the existing scroll (messages, the end text after «Ναι») is unchanged',
    CODE.includes('  }, [messages, loading, pivotPending, layerGatePending, memoryPromptPending, warningPending, closureConfirmPending, misfirePending, firstWhyPending]);') &&
    CODE.includes('_saEnd.scrollIntoView({ behavior: "smooth", block: "start" });'));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
