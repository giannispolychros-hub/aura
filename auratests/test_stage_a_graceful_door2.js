// AURA — STAGE A, decisions of 8/10/2026 (ADR «8 Οκτωβρίου (δ)»), after the red-team of the last 15 pushes:
//   1  GRACEFUL EXIT (the MASTER PRIORITY RULE stage «this governs now»), switch open, before the root: not sent — a bare
//      «Ναι» used to get it in the same request as the Stage A rule «don't say goodbye before the root». Exception: the
//      old closing really opens on this same turn (a second exit) → sent as today. Switch closed: no change.
//      AND door 2: «Ναι» to the readiness question calls no model — the app shows door 1's question at once (as at the
//      first closing and at door 3). Crisis / DISTRESS in place of the «Ναι» → the safety path, as today.
//   2  a reply with no words («🙂») after a closing: when the closing card opens on the same reply, the empty-reply rule adds
//      no farewell (a goodbye, then the card, then the real closing = two goodbyes). Otherwise as before.

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
function fullFnSrc(name) { // the WHOLE function — its parameters may themselves contain braces
  const a = CODE.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = CODE.indexOf('(', a), depth = 0;
  for (; k < CODE.length; k++) { if (CODE[k] === '(') depth++; else if (CODE[k] === ')') { depth--; if (depth === 0) break; } }
  const b = CODE.indexOf('{', k); depth = 0;
  for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') depth++; else if (CODE[j] === '}') { depth--; if (depth === 0) return CODE.slice(a, j + 1); } }
  return null;
}
const sha = x => crypto.createHash('sha256').update(x || '', 'utf8').digest('hex').slice(0, 16);
const NAMES = ['matchesClosingWord', 'isBareEmojiOrAcknowledgment', 'isExplicitClosure', 'declaresClosing', 'isModelPreClosing', 'wasThirdTriggerAsked',
  'decideTermination', 'stageAKeepsGracefulExit', 'closingCardOpensNow', 'initialStageAState', 'stageAStep', 'detectsAffirmativeShort',
  'detectsCoreReadinessAsked', 'detectsSpontaneousCoreRecognition', 'rootTextHasSubstance', 'stageALeavingDoorOpens'];
let F = {};
try {
  const need = new Set(NAMES);
  for (let pass = 0; pass < 4; pass++) {
    const src = [...need].map(n => fullFnSrc(n) || '').join('\n');
    (src.match(/\b([a-zA-Z_]\w*)\(/g) || []).map(x => x.slice(0, -1)).forEach(n => { if (!need.has(n) && CODE.includes('\nfunction ' + n + '(')) need.add(n); });
  }
  const consts = ['KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS'].map(n => { const a = CODE.indexOf('const ' + n + ' = '); return a < 0 ? `const ${n} = undefined;` : CODE.slice(a, CODE.indexOf(';\n', a) + 1); });
  F = new Function(consts.join('\n') + '\n' + [...need].map(n => fullFnSrc(n) || `function ${n}(){return undefined}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }

const SUB = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };

// Real decisions from decideTermination, so the gate is tested on the app's own closing logic.
const JOHN = [
  { role: 'user', content: 'Δεν ξέρω αν πρέπει να αλλάξω δουλειά' },
  { role: 'assistant', content: 'Γιατί έχει σημασία αυτό για σένα τώρα;' },
  { role: 'user', content: 'Νιώθω ότι δεν πέτυχα όσα μπορούσα. Είμαι εκπαιδευτικός' },
  { role: 'assistant', content: 'Τι σημαίνει για σένα "όσα μπορούσα";' },
  { role: 'user', content: 'Περισσότερα χρήματα' },
  { role: 'assistant', content: 'Και σήμερα — το πρόβλημα είναι ότι τα χρήματα δεν φτάνουν, ή ότι νιώθεις ότι άξιζες περισσότερα;' },
];
const opts = { safetyMode: false, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0, modelJudgesEnd: false,
  concreteStepStated: false, outcomeScaleAsked: false, outcomeScaleBlockUsed: false, duringOnboarding: false, duringDeclineCooldown: false };
const D = (hist, u, text) => T('decideTermination', [...hist, { role: 'user', content: u }], text || '', opts);
const SHORT = JOHN.slice(0, 4); // two user messages so far

// ── 1: the GRACEFUL EXIT gate ────────────────────────────────────────────────
{
  const K = o => T('stageAKeepsGracefulExit', o);
  const open = o => Object.assign({ active: true, rootConfirmed: false, safetyMode: false, supportive: false, decision: 'none', armed: false, rootPhase: null, latchFlips: false }, o || {});
  assert('1: switch closed → as today (true), whatever else is passed', K({ active: false, decision: 'none' }) === true && K({ active: false, decision: 'confirm', armed: true }) === true && K({}) === true && K(undefined) === true);
  assert('1: switch open, before the root, no closing opens on this turn → NOT sent', K(open()) === false);
  assert('1: the bare «Ναι» of the red-team (fewer than 4 user messages: T1 does not fire) → the real decision is none → NOT sent',
    D(SHORT, 'Ναι') === 'none' && K(open({ decision: D(SHORT, 'Ναι') })) === false);
  assert('1: a second exit («Ευχαριστώ, κλείνουμε εδώ.») → the old closing opens (confirm) → sent, as today',
    D(JOHN, 'Ευχαριστώ, κλείνουμε εδώ.') === 'confirm' && K(open({ decision: D(JOHN, 'Ευχαριστώ, κλείνουμε εδώ.') })) === true);
  assert('1: T1 («Ναι» with 4+ user messages) opens the old closing too → sent, as today (the open item of the free part is not touched)',
    D(JOHN, 'Ναι') === 'confirm' && K(open({ decision: D(JOHN, 'Ναι') })) === true);
  assert('1: terminate counts as the closing opening', K(open({ decision: 'terminate' })) === true);
  assert('1: await_outcome_scale / warn are not a closing this turn → NOT sent', K(open({ decision: 'await_outcome_scale' })) === false && K(open({ decision: 'warn' })) === false);
  assert('1: a closing that the door-2/3 flow suppresses (armed, a flow open, or the readiness latch flips on this very message) → NOT sent',
    K(open({ decision: 'confirm', armed: true })) === false && K(open({ decision: 'confirm', rootPhase: 'ask' })) === false && K(open({ decision: 'confirm', latchFlips: true })) === false);
  assert('1: after a confirmed root → as today', K(open({ rootConfirmed: true })) === true);
  assert('1: safety mode and supportive (crisis) turns → as today — safety is not touched', K(open({ safetyMode: true })) === true && K(open({ supportive: true })) === true);
}
{
  const at = GEN.indexOf('const masterPriorityStageCtx = (() => {');
  const blk = at >= 0 ? GEN.slice(at, GEN.indexOf('const lastFiredFamilyCtx', at)) : '';
  assert('1: wiring — the three closing detectors line is byte for byte as before',
    blk.includes('const userSignalsClosing = isExplicitClosure(lastUserText) || declaresClosing(lastUserText) || matchesClosingWord(lastUserText);'));
  assert('1: wiring — switch closed → the old expression only (short-circuit), the gate runs only with the switch open',
    /const stage = computeMasterPriorityStage\(safetyMode, msgCount, userSignalsClosing && \(!stageAActive\.current \|\| stageAKeepsGracefulExit\(\{/.test(blk));
  assert('1: wiring — the decision is decideTermination on THIS message, no reply text, no model signal, same options as the real call',
    /decision: stageAPreRootDecision\(decideTermination\(msgs, "", \{/.test(blk) && /modelJudgesEnd: false/.test(blk) && /duringDeclineCooldown: closureDeclineCooldown\.current > 0/.test(blk) &&
    /safetyMode, currentMode, warningIssued: warningIssued\.current, compressionCount: compressionCount\.current/.test(blk));
  assert('1: wiring — after the root, safety mode and supportive turns are passed to the gate',
    /rootConfirmed: stageARef\.current\.stats\.rootConfirmed === 1/.test(blk) && /safetyMode,/.test(blk) && /supportive: currentMode === "SUPPORTIVE"/.test(blk));
  assert('1: wiring — armed, the open flow and the latch flip are passed (the closing is suppressed in those cases after the reply)',
    /armed: stageARootArmed\.current, rootPhase: stageARef\.current\.phase/.test(blk) && /latchFlips: /.test(blk) &&
    /detectsSpontaneousCoreRecognition\(lastUserText\)/.test(blk) && /coreReadinessAsked\.current && detectsAffirmativeShort\(lastUserText\)/.test(blk) &&
    /!coreReadinessConfirmed\.current/.test(blk) && /riskSignalKind\.current !== 1/.test(blk));
  assert('1: the stage text itself is unchanged (computeMasterPriorityStage, describeMasterPriorityStageCtx)',
    /if \(userSignalsClosing\) return 'GRACEFUL_EXIT';/.test(CODE) && CODE.includes("case 'GRACEFUL_EXIT': return `\\n[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT (code-verified: the user's own last message signals closure)."));
}

// ── 1b: door 2 — «Ναι» to the readiness question, before the model ───────────
{
  const S0 = T('initialStageAState');
  const r = T('stageAStep', S0, { type: 'ready' });
  assert('STEP: ready → door 1\'s question (phase ask), door of origin 2, no closing variant, no retry line', r && r.phase === 'ask' && r.door === 2 && r.leaving === false && r.retry === false);
  assert('STEP: ready is NOT a root text too short (rootTooShort 0), not a button press, not a closing door; the flow was reached (stageReached 1)',
    r.stats && r.stats.rootTooShort === 0 && r.stats.rootButtonPressed === 0 && r.stats.rootDoorFromClosing === 0 && r.stats.stageReached === 1);
  assert('STEP: nothing while another phase is open', T('stageAStep', T('stageAStep', S0, { type: 'press' }), { type: 'ready' }).door === 1);
  const o = T('stageAStep', r, { type: 'open', door: 2, found: 'Φοβάμαι την απόρριψη', assistantReplies: 3 });
  assert('STEP: a real answer then opens the card, credited to door 2', o.phase === 'card' && o.stats.rootDoor === 2 && o.found === 'Φοβάμαι την απόρριψη');
  const t = T('stageAStep', r, { type: 'tooShort' });
  assert('STEP: a short answer keeps the question and counts rootTooShort (as door 1)', t.phase === 'ask' && t.retry === true && t.stats.rootTooShort === 1 && t.door === 2);
  const b = T('stageAStep', r, { type: 'back' });
  assert('STEP: «Δεν το βρήκα ακόμα» closes it, counted, no door left', b.phase === null && b.door === 0 && b.stats.rootBack === 1);
}
{
  const fw = SUB.indexOf('if (firstWhyPending) {');
  const dis = SUB.indexOf('if (safetySignal === "DISTRESS") {');
  const d3 = SUB.indexOf('// STAGE A — door 3 without substance BEFORE the model');
  const pre = SUB.indexOf('// STAGE A — door 2 «Ναι» BEFORE the model');
  const next = SUB.indexOf('const nextMsgs  = [...messages, { id: nextMsgId(), role: "user", content: userText }];');
  const blk = pre >= 0 ? SUB.slice(pre, next) : '';
  assert('DOOR 2: placed after the crisis and DISTRESS branches (safety path first), after First-WHY and after door 3, before anything is sent',
    pre > 0 && pre > dis && dis > 0 && pre > fw && pre > d3 && d3 > 0 && next > pre);
  assert('DOOR 2: switch open and a reply already — the same opening as the other two doors', /if \(stageAActive\.current && messages\.some\(m => m\.role === "assistant" && m\.msgMode !== "STAGE_A"\) &&/.test(blk));
  assert('DOOR 2: the LAST message is the readiness question (a «Ναι» to anything else goes on as before)',
    /messages\[messages\.length - 1\]\.role === "assistant" && detectsCoreReadinessAsked\(messages\[messages\.length - 1\]\.content\)/.test(blk) && /coreReadinessAsked\.current/.test(blk));
  assert('DOOR 2: the answer is the existing «Ναι» detector, and not a spontaneous recognition (that is door 3, in the order the latch always had)',
    /detectsAffirmativeShort\(userText\)/.test(blk) && /!detectsSpontaneousCoreRecognition\(userText\)/.test(blk));
  assert('DOOR 2: latch not flipped, no flow open, no closing started, not tier A — the same conditions as the latch itself',
    /!coreReadinessConfirmed\.current/.test(blk) && /!stageARef\.current\.phase/.test(blk) && /!reflectionDelivered\.current/.test(blk) && /riskSignalKind\.current !== 1/.test(blk));
  assert('DOOR 2: the latch flips exactly as it would have after the reply, the «Ναι» is shown (not sent), door 1\'s question opens, the turn ENDS — nothing sent',
    /coreReadinessConfirmed\.current = true;[^\n]*\n\s*addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "ready" \}\);\s*return;\s*\}/.test(blk) && !/generateResponse|callAura|setMessages/.test(blk));
  assert('DOOR 2: the old arming path after a reply stays for the «Ναι» that this block does not catch (unchanged)', /else stageARootArmed\.current = true;/.test(GEN) &&
    /else if \(coreReadinessAsked\.current && lastUserMsgForReadiness &&\s*detectsAffirmativeShort\(lastUserMsgForReadiness\.content\)\) \{/.test(GEN));
  assert('DOOR 2: coreReadinessCtx and the readiness detectors are untouched',
    /function detectsCoreReadinessAsked\(text\) \{\s*return \/νιώθεις ότι\.\{0,40\}ξεκαθαρίζει\.\{0,60\}πραγματικά σε απασχολεί\/i\.test\(text \|\| ""\);\s*\}/.test(CODE) &&
    /function detectsAffirmativeShort\(text\) \{[\s\S]*?return \/\^\(ναι\|ακριβώς\|σωστά\|όντως\|νιώθω\|νομίζω ναι\|έτσι νομίζω\|κάπως έτσι\)\/i\.test\(t\);\s*\}/.test(CODE));
}

// ── 2: no farewell when the closing card opens on the same reply ─────────────
{
  const C = o => T('closingCardOpensNow', o);
  assert('2: confirm / terminate → the card opens', C({ decision: 'confirm' }) === true && C({ decision: 'terminate' }) === true);
  assert('2: none / warn / await_outcome_scale / nothing → no closing card', C({ decision: 'none' }) === false && C({ decision: 'warn' }) === false && C({ decision: 'await_outcome_scale' }) === false && C({}) === false);
  assert('2: Stage A with door 2 armed or a flow open suppresses the card (the app returns before it) → no card', C({ decision: 'confirm', active: true, armed: true }) === false && C({ decision: 'confirm', active: true, rootPhase: 'ask' }) === false);
  assert('2: switch closed → armed/phase are not looked at', C({ decision: 'confirm', active: false, armed: true, rootPhase: 'ask' }) === true);
  // the real scenario of the red-team: the reply is only 🙂, the user said «Ευχαριστώ» → the card opens
  assert('2: the real scenario — 🙂 after «Ευχαριστώ, κλείνουμε εδώ.» → decideTermination says confirm → the card opens',
    isBare('🙂') && C({ decision: D(JOHN, 'Ευχαριστώ, κλείνουμε εδώ.', '🙂') }) === true);
  assert('2: the user was NOT closing → the decision is none → the question is added as before',
    C({ decision: D(JOHN, 'Περισσότερα χρήματα.', '🙂') }) === false);
  function isBare(t) { return T('isBareEmojiOrAcknowledgment', t) === true; }
  const at = GEN.indexOf('if (isBareEmojiOrAcknowledgment(displayText)) {');
  const blk = at >= 0 ? GEN.slice(at, GEN.indexOf('// EXPLICIT STYLE PREFERENCE', at)) : '';
  assert('2: wiring — the rule itself is as before: the closing check, the two sentences',
    blk.includes('const userWasClosing = matchesClosingWord(lastUserMsg) || declaresClosing(lastUserMsg);') &&
    blk.includes('const addition = userWasClosing ? "Καλή συνέχεια." : "Τι σκέφτεσαι τώρα;";'));
  assert('2: wiring — only when the user was closing, the same decision as the real call (this reply, the model signal), supportive → none',
    // UPDATED (10/10, ADR «10 Οκτωβρίου», 1): the same decision now passes through the pre-root gate.
    /const _closingCardOpens = userWasClosing && closingCardOpensNow\(\{/.test(blk) && /decision: stageAPreRootDecision\(currentMode === "SUPPORTIVE" \? "none" : decideTermination\(msgs, text, \{/.test(blk) &&
    /modelJudgesEnd,/.test(blk) && /duringOnboarding: showDemo, duringDeclineCooldown: closureDeclineCooldown\.current > 0/.test(blk) &&
    /active: stageAActive\.current, armed: stageARootArmed\.current, rootPhase: stageARef\.current\.phase/.test(blk));
  assert('2: wiring — no farewell is added when the card opens; otherwise the text is added exactly as before',
    // UPDATED (10/10, ADR «10 Οκτωβρίου», 1): before the root (switch open) a closing word that opens no closing gets the existing question
    /if \(!_closingCardOpens\) displayText = \(displayText\.trim\(\) \? displayText\.trim\(\) \+ " " : ""\) \+ \(_saNoGoodbye \? "Τι σκέφτεσαι τώρα;" : addition\);/.test(blk));
  assert('2: the real decision after the reply is untouched (same call, same options)',
    /const decision = stageAPreRootDecision\(currentMode === "SUPPORTIVE" \? "none" : decideTermination\(msgs, text, \{\s*safetyMode,\s*currentMode,/.test(GEN)); // UPDATED 10/10: the pre-root gate wraps it
}

// ── Not touched ──────────────────────────────────────────────────────────────
assert('UNCHANGED: the closings and the leaving door (byte for byte)',
  sha(fullFnSrc('decideTermination')) === 'a8a8f403a2d5adb6' && sha(fullFnSrc('stageALeavingDoorOpens')) === 'c14e923cd0166b66');
assert('UNCHANGED: the first-closing door and door 3 before the model are still there',
  SUB.includes('// STAGE A — «Πριν φύγεις:» BEFORE the model') && SUB.includes('// STAGE A — door 3 without substance BEFORE the model'));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
