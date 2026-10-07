// AURA — STAGE A, steps 3.3–3.10: the flow behind the closed switch
// (SPEC_FREE_END.md §1.5, §2.1, §2.1α, §2.2, §4, §5, §6.1, §6.1α; ADR «6 Οκτωβρίου (β)»…«(στ)»)
//
// PART 1 — the pure step function stageAStep: every transition, every counter, and the order of §2.1α
//          (card → «Ναι» → offer (or nothing, with a risk signal) → [not ready + one-tap question] → clarity
//          → word → done). Invalid events change nothing.
// PART 2 — the wiring in the component: two doors (button + readiness question), the crisis check on text
//          that never reaches the model, the card, «Ναι», the offer, the clarity buttons, the word, copy /
//          download, no 6€ paywall, telemetry, reset — and, above all, NOTHING of it with the switch closed.

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
const NAMES = ['detectSafetySignal', 'initialStageAState', 'stageAStep', 'stageAInputHidden', 'stageACaptureAllowed', 'stageATelemetry', 'stripPrematureFarewell', 'buildRootEndLines'];
const textsSrc = (extractBlock('const STAGE_A_TEXTS = ') || 'const STAGE_A_TEXTS = {}') + ';';
const F = new Function(textsSrc + '\n' + NAMES.map(n => extractBlock('function ' + n + '(') || `function ${n}(){return undefined}`).join('\n') +
  '\nreturn {' + NAMES.join(',') + '};')();

// ═══ PART 1 — stageAStep ═════════════════════════════════════════════════════
const S0 = F.initialStageAState() || { stats: {} };
const step = (s, e) => F.stageAStep(s, e) || { stats: {} };
const run = (evs, s = S0) => evs.reduce((acc, e) => step(acc, e), s);
assert('INIT: no phase, every counter 0', S0.phase === null && Object.values(S0.stats || {}).every(v => v === 0) && Object.keys(S0.stats || {}).length === 20 && S0.retry === false && S0.leaving === false);

// door 1
const sAsk = step(S0, { type: 'press' }) || {};
assert('PRESS: → ask, door 1, button counted, stage 1', sAsk.phase === 'ask' && sAsk.door === 1 && sAsk.stats.rootButtonPressed === 1 && sAsk.stats.stageReached === 1);
assert('PRESS: ignored while a phase is open', step(sAsk, { type: 'press' }) === sAsk);
const OPEN = { type: 'open', door: 1, found: '  Φοβάμαι τον πατέρα μου  ', knew: 'δεν ξέρω αν να φύγω', assistantReplies: 4, riskKind: 0 };
const sCard = step(sAsk, OPEN) || {};
assert('OPEN: → card, found trimmed (never cut), knew kept', sCard.phase === 'card' && sCard.found === 'Φοβάμαι τον πατέρα μου' && sCard.knew === 'δεν ξέρω αν να φύγω');
assert('OPEN: rootShown, rootDoor, rootAtReply (which AURA reply), stage 3', sCard.stats.rootShown === 1 && sCard.stats.rootDoor === 1 && sCard.stats.rootAtReply === 4 && sCard.stats.stageReached === 3);
assert('OPEN: knew present → knewHidden 0; absent → 1', sCard.stats.knewHidden === 0 && step(sAsk, { ...OPEN, knew: null }).stats.knewHidden === 1);
assert('OPEN: crisis tier A → no card, counted rootSuppressedA', (() => { const x = step(sAsk, { ...OPEN, riskKind: 1 }); return x.phase === null && x.stats.rootSuppressedA === 1 && x.stats.rootShown === 0; })());
assert('OPEN: empty found → nothing changes', step(sAsk, { ...OPEN, found: '   ' }) === sAsk);
{
  const LONG = 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά, και ότι το αναβάλλω χρόνια επειδή δεν θέλω να το παραδεχτώ ούτε στον εαυτό μου, πόσο μάλλον σε εκείνον.';
  assert('OPEN: a long root is kept WHOLE (decision «(στ)» 1: no cut anywhere)', step(sAsk, { ...OPEN, found: LONG }).found === LONG);
}
assert('OPEN: door 2 opens from the conversation (no ask phase)', (() => { const x = step(S0, { ...OPEN, door: 2 }); return x.phase === 'card' && x.stats.rootDoor === 2; })());
assert('OPEN: not while the offer is showing', (() => { const o = run([{ type: 'press' }, OPEN, { type: 'yes', riskKind: 0 }]); return step(o, OPEN) === o; })());
assert('OPEN: rootDoor and rootAtReply keep the FIRST opening', (() => {
  const x = run([{ type: 'press' }, OPEN, { type: 'back' }, { ...OPEN, door: 2, assistantReplies: 9 }]);
  return x.phase === 'card' && x.stats.rootDoor === 1 && x.stats.rootAtReply === 4; })());

// back / correct
assert('BACK from ask: → conversation, counted', (() => { const x = step(sAsk, { type: 'back' }); return x.phase === null && x.stats.rootBack === 1 && x.door === 0; })());
assert('BACK from card: → conversation, counted', (() => { const x = step(sCard, { type: 'back' }); return x.phase === null && x.stats.rootBack === 1; })());
assert('BACK: ignored in the conversation or after «Ναι»', step(S0, { type: 'back' }) === S0 && (() => { const o = step(sCard, { type: 'yes', riskKind: 0 }); return step(o, { type: 'back' }) === o; })());
assert('CANCEL (crisis in typed text): closes the flow, NOT counted as «back»', (() => { const x = step(sAsk, { type: 'cancel' }); return x.phase === null && x.stats.rootBack === 0; })());
const sCor = step(sCard, { type: 'correctStart' }) || {};
assert('CORRECT: card → correct', sCor.phase === 'correct');
const sCor2 = step(sCor, { type: 'correctDone', found: ' Ότι φοβάμαι να του το πω ' }) || {};
assert('CORRECT: the user\'s own text replaces «Τι βρήκες», back to the card, counted', sCor2.phase === 'card' && sCor2.found === 'Ότι φοβάμαι να του το πω' && sCor2.stats.rootCorrections === 1);
assert('CORRECT: no limit on corrections', run([{ type: 'correctStart' }, { type: 'correctDone', found: 'α β' }, { type: 'correctStart' }, { type: 'correctDone', found: 'γ δ' }], sCard).stats.rootCorrections === 2);
assert('CORRECT: empty text changes nothing', step(sCor, { type: 'correctDone', found: '  ' }) === sCor);

// too-short root text (6/10 phone test): the flow stays where it is, the previous root is kept, counted
const sAskR = step(sAsk, { type: 'tooShort' }) || {};
assert('TOO SHORT (door 1): stays on the question, retry shown, counted', sAskR.phase === 'ask' && sAskR.retry === true && sAskR.stats.rootTooShort === 1 && sAskR.found === '');
const sCorR = step(sCor, { type: 'tooShort' }) || {};
assert('TOO SHORT (correction): stays in the correction, the PREVIOUS root is kept, counted', sCorR.phase === 'correct' && sCorR.found === sCor.found && sCorR.retry === true && sCorR.stats.rootTooShort === 1);
assert('TOO SHORT: only in the two typed phases', step(sCard, { type: 'tooShort' }) === sCard && step(S0, { type: 'tooShort' }) === S0);
assert('RETRY: cleared once a root is accepted (open / correctDone) or the user goes back', step(sAskR, OPEN).retry === false &&
  step(sCorR, { type: 'correctDone', found: 'Ότι φοβάμαι να του το πω ευθέως' }).retry === false && step(sAskR, { type: 'back' }).retry === false);

// «Ναι» → offer → …
const sOffer = step(sCard, { type: 'yes', riskKind: 0 }) || {};
assert('YES (no risk): → offer, confirmed, offer shown, stage 5', sOffer.phase === 'offer' && sOffer.stats.rootConfirmed === 1 && sOffer.stats.coachOfferShown === 1 && sOffer.stats.stageReached === 5 && sOffer.riskOffer === false);
[2, 3].forEach(k => {
  const x = step(sCard, { type: 'yes', riskKind: k }) || { stats: {} };
  assert(`YES (risk ${k === 2 ? 'B' : 'DISTRESS'}): NO offer → straight to clarity, suppressed and by which signal`,
    x.phase === 'clarity' && x.riskOffer === true && x.stats.coachOfferShown === 0 && x.stats.coachOfferSuppressed === 1 && x.stats.suppressedBy === k && x.stats.stageReached === 4);
});
assert('YES: only from the card', step(sAsk, { type: 'yes', riskKind: 0 }) === sAsk && step(sCor, { type: 'yes', riskKind: 0 }) === sCor);
const sNR = step(sOffer, { type: 'want' }) || {};
assert('WANT («Θέλω να συνεχίσω»): → not ready, clicked', sNR.phase === 'notReady' && sNR.stats.coachOfferClicked === 1);
assert('NOT NOW: → clarity, declined', (() => { const x = step(sOffer, { type: 'notNow' }); return x.phase === 'clarity' && x.stats.coachOfferDeclined === 1 && x.stats.coachOfferClicked === 0; })());
[1, 2, 3].forEach(c => assert(`HELP ${c}: recorded as a number, → clarity`, (() => { const x = step(sNR, { type: 'help', choice: c }); return x.phase === 'clarity' && x.stats.coachHelpChoice === c; })()));
assert('HELP: an unknown choice is recorded as 0, never as itself', (() => { const x = step(sNR, { type: 'help', choice: 7 }); return x.phase === 'clarity' && x.stats.coachHelpChoice === 0; })());
assert('HELP skipped («Συνέχεια»): 0, → clarity', (() => { const x = step(sNR, { type: 'help', choice: 0 }); return x.phase === 'clarity' && x.stats.coachHelpChoice === 0; })());
assert('HELP: only after «Θέλω να συνεχίσω»', step(sOffer, { type: 'help', choice: 1 }) === sOffer);
const sCl = step(sOffer, { type: 'notNow' });
assert('CLARITY: 1–10 accepted, → word', (() => { const x = step(sCl, { type: 'clarity', value: 7 }); return x.phase === 'word' && x.stats.lateClarity === 7; })());
assert('CLARITY: 0, 11, 7.5, "7" rejected', [0, 11, 7.5, '7'].every(v => step(sCl, { type: 'clarity', value: v }) === sCl));
assert('CLARITY: never before the offer was answered (§2.1α: never between root and offer)', step(sOffer, { type: 'clarity', value: 5 }) === sOffer);
const sW = step(sCl, { type: 'clarity', value: 8 });
assert('WORD: same as root → 1, → done', (() => { const x = step(sW, { type: 'word', same: true }); return x.phase === 'done' && x.stats.wordSameAsRoot === 1; })());
assert('WORD: different → 0', step(sW, { type: 'word', same: false }).stats.wordSameAsRoot === 0);
assert('UNKNOWN event / no state: safe', step(sCard, { type: 'zzz' }) === sCard && (step(undefined, { type: 'press' }) || {}).phase === 'ask');

// helpers
assert('INPUT: hidden on the button-only phases', ['card', 'offer', 'notReady', 'clarity'].every(p => F.stageAInputHidden(p) === true));
assert('INPUT: shown for the question, the correction, the word, and the conversation', [null, 'ask', 'correct', 'word', 'done'].every(p => F.stageAInputHidden(p) === false));
assert('CAPTURE: ordinary text is captured', F.stageACaptureAllowed('Φοβάμαι να απογοητεύσω τον πατέρα μου') === true);
assert('CAPTURE: DISTRESS text is captured (card allowed, offer suppressed by the latch)', F.stageACaptureAllowed('Το πένθος για τη μητέρα μου') === true);
assert('CAPTURE: crisis tier A is NOT captured (crisis protocol)', F.stageACaptureAllowed('Δεν θέλω να ζω άλλο') === false);
assert('CAPTURE: crisis tier B is NOT captured either (the 10306 line must never be skipped)', F.stageACaptureAllowed('Δεν αντέχω άλλο') === false);
const tel = F.stageATelemetry(sNR.stats, { freeActionOffered: 2, freeDeferral: 1, askedActionBeforeRoot: true }) || {};
assert('TELEMETRY: every stat, integers only, plus the three counters and stageA = 1',
  Object.keys(S0.stats).every(k => Number.isInteger(tel[k])) && tel.freeActionOffered === 2 && tel.freeDeferral === 1 && tel.askedActionBeforeRoot === 1 && tel.stageA === 1 && tel.coachOfferClicked === 1);
assert('TELEMETRY: every key fits recordTelemetry\'s schema (letters only, ≤ 24)', Object.keys(tel).every(k => /^[a-zA-Z]{1,24}$/.test(k)));
assert('TELEMETRY: never a string, never text', Object.values(tel).every(v => typeof v === 'number'));
const END = (F.buildRootEndLines('Καλή τύχη', false) || []).join('\n');
assert('CLOSING: the farewell stripper never touches the app\'s end text (even when the root itself reads like a farewell)',
  F.stripPrematureFarewell(END) === END && F.stripPrematureFarewell((F.buildRootEndLines('Αντίο', true) || []).join('\n')) === (F.buildRootEndLines('Αντίο', true) || []).join('\n'));

// ═══ PART 2 — wiring ═════════════════════════════════════════════════════════
const R = (CODE.match(/\{\/\* STAGE A UI — BEGIN \*\/\}([\s\S]*?)\{\/\* STAGE A UI — END \*\/\}/) || ['', ''])[1];
assert('UI: the cards live in ONE marked region', R.length > 500 && CODE.split('STAGE A UI — BEGIN').length === 2);
assert('UI: the whole region is gated on the switch — closed switch renders nothing of it', /^\s*\{stageAActive\.current && \(/.test(R));
const B = (CODE.match(/\{\/\* STAGE A BUTTON — BEGIN \*\/\}([\s\S]*?)\{\/\* STAGE A BUTTON — END \*\/\}/) || ['', ''])[1];
assert('BUTTON: one marked region, gated by stageARootButtonVisible with active = the switch',
  /stageARootButtonVisible\(\{\s*active: stageAActive\.current,/.test(B) && B.includes('STAGE_A_TEXTS.button'));
assert('BUTTON: sits inside the input area (so every other pending card already hides it)',
  CODE.indexOf('STAGE A BUTTON — BEGIN') > CODE.indexOf('{/* ── Input ── */}'));
assert('BUTTON: counts AURA replies without the app\'s own Stage A messages', /assistantReplies: messages\.filter\(m => m\.role === "assistant" && m\.msgMode !== "STAGE_A"\)\.length/.test(B));
assert('BUTTON: closing started = reflection delivered / word awaited / closure or warning card / ended',
  /closingStarted: reflectionDelivered\.current \|\| awaitingRememberedWord \|\| closureConfirmPending \|\| warningPending,/.test(B));
const outsideTexts = CODE.replace(R, '').replace(B, '');
const jsxStart = CODE.indexOf('  return (\n    <>');
assert('UI: no Stage A text is rendered outside the two gated regions',
  !/STAGE_A_TEXTS\./.test(outsideTexts.slice(outsideTexts.indexOf('  return (\n    <>'))));
['ask', 'back', 'knewLabel', 'foundLabel', 'yes', 'correct', 'correctAsk', 'retry', 'wantMore', 'notNow', 'notReady', 'helpQ', 'help1', 'help2', 'help3', 'helpSkip', 'clarityQ', 'copy', 'download']
  .forEach(k => assert(`UI: «${k}» is on screen`, R.includes('STAGE_A_TEXTS.' + k)));
assert('UI: the card line comes from buildRootCardLine with the risk latch (B/DISTRESS variant)',
  /buildRootCardLine\(riskSignalKind\.current === 2 \|\| riskSignalKind\.current === 3\)/.test(R));
assert('UI: clarity buttons are 1 to 10', /\[1, 2, 3, 4, 5, 6, 7, 8, 9, 10\]\.map\(n =>/.test(R));
assert('UI: copy/download appear only after «Ναι»', /stageAView\.stats\.rootConfirmed === 1 &&/.test(R));
assert('INPUT: hidden on the button-only phases', /!stageAInputHidden\(stageAPhase\) && sessionStarted && \(/.test(CODE));
// UPDATED (ADR «7 Οκτωβρίου (β)», 3): the paywall also needs the risk latch at 0, and «Νέα συνεδρία» also shows when
// the latch hid it. The Stage A part of both conditions is unchanged.
assert('PAYWALL: the 6€ block never shows in Stage A', /\{!stageAActive\.current && riskSignalKind\.current === 0 && sessionEnded && !loading && finalDistillation && !valueUnlocked && \(/.test(CODE));
assert('END: «Νέα συνεδρία» is always available in Stage A (no paywall to pass)', /\(!finalDistillation \|\| valueUnlocked \|\| stageAActive\.current \|\| riskSignalKind\.current !== 0\) && <button className="new-btn" onClick=\{resetSession\}>/.test(CODE));

// state + dispatch
assert('STATE: one ref holds the flow, one state re-renders it', /const stageARef\s*= useRef\(initialStageAState\(\)\);/.test(CODE) && /const \[stageAPhase, setStageAPhase\] = useState\(null\);/.test(CODE));
assert('STATE: every change goes through stageAStep', /const stageADispatch = useCallback\(\(ev\) => \{\s*stageARef\.current = stageAStep\(stageARef\.current, ev\);/.test(CODE));
assert('RESET: the flow, the armed door and the phase reset with the session',
  /stageARef\.current = initialStageAState\(\); stageARootArmed\.current = false; setStageAPhase\(null\);/.test(CODE));

// doors
const HS = extractBlock('const handleSubmit = useCallback(async () => ') || '';
assert('SUBMIT: the Stage A intercept runs after the risk latch and before the word path',
  HS.indexOf('mergeRiskKind(') < HS.indexOf('STAGE A — typed answers') && HS.indexOf('STAGE A — typed answers') < HS.indexOf('if (awaitingRememberedWord'));
assert('SUBMIT: an armed door 2 never captures in tier A, nor once the old closing has started (the word must never become the root)',
  /const _saArmed = stageARootArmed\.current && !_saPhase && riskSignalKind\.current !== 1 && !reflectionDelivered\.current && !awaitingRememberedWord;/.test(HS));
assert('CLOSING: while door 2 is armed or the card is open, the old «πριν κλείσουμε» card does not open (Stage A only)',
  /if \(stageAActive\.current && \(stageARootArmed\.current \|\| stageARef\.current\.phase\) && \(decision === "confirm" \|\| decision === "terminate"\)\) return;\s*if \(decision === "confirm" \|\| decision === "terminate"\) \{/.test(CODE));
assert('SUBMIT: only with the switch open', /if \(stageAActive\.current && \(_saPhase === "ask" \|\| _saPhase === "correct" \|\| _saArmed\)\) \{/.test(HS));
assert('SUBMIT: crisis in the typed text → the flow cancels and the message continues on the normal path',
  /if \(!stageACaptureAllowed\(userText\)\) \{\s*stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "cancel" \}\);\s*\}/.test(HS));
assert('SUBMIT: door 1 and correction text must pass the «Τι ήξερες» substance rule; otherwise retry, no capture, no model call',
  /if \(\(_saPhase === "ask" \|\| _saPhase === "correct"\) && !rootTextHasSubstance\(userText\)\) \{\s*stageADispatch\(\{ type: "tooShort" \}\);\s*return;\s*\}/.test(HS) &&
  HS.indexOf('!stageACaptureAllowed(userText)') < HS.indexOf('rootTextHasSubstance(userText)'));
assert('UI: the retry line shows in the question card and in the correction card', (R.match(/stageAView\.retry && /g) || []).length === 2);
assert('SCROLL (6/10 phone test): after «Ναι» the end message is scrolled to its START (the root line), not the bottom',
  /stageAActive\.current && messages\.length && messages\[messages\.length - 1\]\.stageAEnd/.test(CODE) &&
  /_saEnd\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\);\s*return;/.test(CODE) &&
  /msgMode: "STAGE_A", stageAEnd: true \}/.test(CODE) && /data-stage-a-end=\{msg\.stageAEnd \? "1" : undefined\}/.test(CODE));
assert('SCROLL: with the switch closed nothing changes — the same bottom scroll, same dependencies',
  /bottomRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "end" \}\);\s*\}, \[messages, loading, pivotPending, layerGatePending, memoryPromptPending, warningPending, closureConfirmPending, misfirePending, firstWhyPending\]\);/.test(CODE));
assert('SUBMIT: «Διόρθωσε» text replaces «Τι βρήκες», no model call', /stageADispatch\(\{ type: "correctDone", found: userText \}\);\s*return;/.test(HS));
// UPDATED (ADR «7 Οκτωβρίου (γ)»): the question is recorded whenever it was the question that was answered (phase ask) —
// it can now come from door 2 or 3 too, whose door is kept for the card.
assert('SUBMIT: door 1 adds the fixed question and the answer to the transcript; door 2 only the answer; no model call',
  /const _saDoor = _saPhase === "ask" \? \(stageARef\.current\.door \|\| 1\) : 2;/.test(HS) &&
  /const _saAdded = _saPhase === "ask"\s*\? \[\{ id: nextMsgId\(\), role: "assistant", content: stageARef\.current\.leaving \? STAGE_A_TEXTS\.askLeaving : STAGE_A_TEXTS\.ask, msgMode: "STAGE_A" \}, \{ id: nextMsgId\(\), role: "user", content: userText \}\]\s*: \[\{ id: nextMsgId\(\), role: "user", content: userText \}\];/.test(HS) &&
  /stageAOpen\(_saDoor, userText, \[\.\.\.messages, \.\.\._saAdded\]\);\s*return;/.test(HS));
assert('SUBMIT: the word path records «same as root» and skips the echo when it is', /if \(stageAActive\.current && stageARef\.current\.phase === "word"\) \{[\s\S]{0,300}sameAsRootText\(userText, stageARef\.current\.found\)/.test(HS));
const OPENFN = extractBlock('const stageAOpen = useCallback((door, found, msgsNow) => ') || '';
assert('OPEN: «Τι ήξερες» from pickKnewSnippet over the user messages', /pickKnewSnippet\(\(msgsNow \|\| \[\]\)\.filter\(m => m && m\.role === "user"\)\.map\(m => String\(m\.content \|\| ""\)\)\)/.test(OPENFN));
assert('OPEN: the found text must be the user\'s own (verbatim check) before a card opens', /if \(!isVerbatimUserText\(found, _users\)\) return;/.test(OPENFN));
assert('OPEN: riskKind from the latch; rootCardOpenedOnce set only when a card really opened',
  /riskKind: riskSignalKind\.current/.test(OPENFN) && /if \(stageARef\.current\.phase === "card"\) rootCardOpenedOnce\.current = true;/.test(OPENFN));
assert('DOOR 2: armed in the readiness latch only when it flips this turn, only with the switch open, no flow/closing, never in tier A',
  /if \(stageAActive\.current && !_saReadyBefore && coreReadinessConfirmed\.current && !stageARef\.current\.phase && !reflectionDelivered\.current && riskSignalKind\.current !== 1\) \{/.test(CODE));
// UPDATED (ADR «7 Οκτωβρίου (γ)»): door 3 opens the card only for a recognising message that passes the crisis check and
// the root-substance rule; otherwise door 1's question (test_stage_a_door23_substance.js).
assert('DOOR 2 (spontaneous): the user\'s own recognising message opens the card at once (door 3)',
  /else if \(_saSpont && rootTextHasSubstance\(_saLastUser\.content\)\) stageAOpen\(3, _saLastUser\.content, msgs\);\s*else if \(_saSpont\) stageADispatch\(\{ type: "reask", door: 3 \}\);\s*else stageARootArmed\.current = true;/.test(CODE));
const BACK = extractBlock('const handleStageABack = useCallback(() => ') || '';
assert('BACK: from door 2\'s card the captured answer gets its normal reply (the conversation continues, nothing lost)',
  /if \(_ph === "card" && _door === 2\) \{\s*turnCount\.current \+= 1;\s*generateResponse\(messages, mode\);\s*\}/.test(BACK));
const YES = extractBlock('const handleStageAYes = useCallback(() => ') || '';
assert('YES: the app\'s end text, whole root, risk variant from the latch',
  /buildRootEndLines\(stageARef\.current\.found, _riskOffer\)\.join\("\\n"\)/.test(YES) && /const _riskOffer = riskSignalKind\.current === 2 \|\| riskSignalKind\.current === 3;/.test(YES));
assert('YES: dispatch with the latch', /stageADispatch\(\{ type: "yes", riskKind: riskSignalKind\.current \}\);/.test(YES));
const CLAR = extractBlock('const handleStageAClarity = useCallback((n) => ') || '';
assert('CLARITY → WORD: the fixed word question, the old closing cannot start again, word awaited',
  /appendClosingMessage\(STAGE_A_TEXTS\.word\);/.test(CLAR) && /wordQuestionDelivered\.current = true;/.test(CLAR) && /reflectionDelivered\.current = true;/.test(CLAR) && /setAwaitingRememberedWord\(true\);/.test(CLAR));
assert('TELEMETRY: Stage A fields join session_completed only with the switch open',
  /\.\.\.\(stageAActive\.current \? stageATelemetry\(stageARef\.current\.stats, \{ freeActionOffered: freeActionOffered\.current, freeDeferral: freeDeferral\.current, askedActionBeforeRoot: askedActionBeforeRoot\.current \}\) : \{\}\),/.test(CODE));
assert('COPY: clipboard with a visible fallback; DOWNLOAD: a local .txt, nothing stored',
  /navigator\.clipboard\.writeText\(_txt\)/.test(R) && /new Blob\(\[_txt\], \{ type: "text\/plain;charset=utf-8" \}\)/.test(R) && !/localStorage|sessionStorage/.test(R));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
