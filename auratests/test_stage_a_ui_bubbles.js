// AURA — STAGE A, decision 5 of 8/10/2026 (ADR «8 Οκτωβρίου (δ)»): where the user's message does not go to the model,
// it is still SHOWN. Phone test 8/10: «Ευχαριστώ» → the text vanished and a question appeared («Δε θα με ρωτήσεις γιατί
// είπα ευχαριστώ;»). The paths: the first closing (door before the model), door 1/2/3 without substance, the «Ναι» of
// door 2, and the correction without substance.
//   The bubble is a UI-only line (state `uiBubbles`), NOT a message: it is never in `messages`, so no request, no detector,
//   no counter, no telemetry ever sees it. It is placed after the message that was last when it was typed.
//   Switch closed: none of these paths exists, nothing changes.

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
const SUB = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
const count = (s, t) => s.split(t).length - 1;

// ── The mechanism ────────────────────────────────────────────────────────────
assert('STATE: a separate list of UI-only lines, never part of `messages`', /const \[uiBubbles, setUiBubbles\] = useState\(\[\]\);/.test(CODE));
const helper = (CODE.match(/const addUiBubble = useCallback\(\(text, at\) => \{[\s\S]*?\n  \}, \[\]\);/) || [''])[0];
assert('HELPER: addUiBubble(text, at) keeps the text and the number of messages before it — and touches nothing else',
  helper.length > 0 && /setUiBubbles\(prev => \[\.\.\.prev, \{ id: nextMsgId\(\), role: "user", content: String\(text \|\| ""\), at: Number\.isInteger\(at\) \? at : 0 \}\]\);/.test(helper) &&
  !/setMessages|callAura|generateResponse|recordTelemetry|turnCount|stageARef|stageADispatch/.test(helper));
assert('NOT IN THE REQUEST PATH: uiBubbles appears nowhere in generateResponse, callAura or capMessageHistory',
  !GEN.includes('uiBubbles') && !(extractBlock('async function callAura(') || '').includes('uiBubbles') && !(extractBlock('function capMessageHistory(') || 'uiBubbles').includes('uiBubbles'));
{
  // the identifier may appear only in its declaration, the scroll effect and the render — nowhere a detector, counter or telemetry could read it
  const rest = CODE.replace('const [uiBubbles, setUiBubbles] = useState([]);', '')
    .replace(/useEffect\(\(\) => \{\s*if \(!uiBubbles\.length\) return;[\s\S]*?\}, \[uiBubbles\.length\]\);/, '')
    .replace(/\{uiBubbles\.filter\(g => Math\.min\(g\.at, messages\.length\) === i \+ 1\)/, '{');
  assert('NOT IN THE DETECTORS / TELEMETRY: the identifier appears only in the declaration, the scroll effect and the render', !/(^|[^\w])uiBubbles([^\w]|$)/.test(rest));
}

// ── The six sites, each shows the bubble BEFORE its own step, and ends the turn as before ─────────────
const at = (pat) => { const m = pat.exec(SUB); return m ? m[0] : ''; };
assert('SITE 1 — the first closing (door before the model): the bubble, then «leaving», then the turn ends',
  /addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "leaving" \}\);\s*return;\s*\}/.test(SUB));
assert('SITE 2 — door 3 without substance: the bubble, the latch, the question',
  /addUiBubble\(userText, messages\.length\);[^\n]*\n\s*coreReadinessConfirmed\.current = true;[^\n]*\n\s*stageADispatch\(\{ type: "reask", door: 3 \}\);\s*return;\s*\}/.test(SUB));
assert('SITE 3 — door 2, the «Ναι» to the readiness question: the bubble is shown, nothing is sent',
  /addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "ready" \}\);\s*return;\s*\}/.test(SUB));
assert('SITE 4 — door 1 and the correction, an answer without substance: the bubble, then «tooShort»',
  /addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "tooShort" \}\);\s*return;/.test(SUB));
assert('SITE 5 — door 2, the capture without substance: the bubble, then «reask» door 2',
  /stageARootArmed\.current = false;\s*addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "reask", door: 2 \}\);\s*return;/.test(SUB));
assert('SITE 6 — exactly these five calls exist (door 3 and door 2 «Ναι» share none): a new one is a decision, not a drift',
  count(SUB, 'addUiBubble(userText, messages.length);') === 5);
assert('NOT A BUBBLE: a correction or an answer that becomes the card is NOT shown as a bubble (it is shown on the card / added to the conversation)',
  !/addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "correctDone"/.test(SUB) && !/addUiBubble\(userText, messages\.length\);[^\n]*\n\s*const _saDoor/.test(SUB));
{
  // the three bubbles made before the model is called (the first closing, door 3, door 2 «Ναι») all sit AFTER the crisis and DISTRESS
  // branches, which return first; the two inside the capture block have their own crisis check before them (next assertion)
  const pre = SUB.indexOf('// STAGE A — «Πριν φύγεις:» BEFORE the model');
  assert('NOT A BUBBLE: the crisis path is first — the three bubbles before the model come after the crisis and DISTRESS branches',
    pre > SUB.indexOf('if (safetySignal === "DISTRESS") {') && SUB.indexOf('if (safetySignal === "DISTRESS") {') > SUB.indexOf('if (safetySignal === "CRISIS") {') &&
    (SUB.slice(pre, SUB.indexOf('const nextMsgs  = [...messages')).match(/addUiBubble\(userText, messages\.length\);/g) || []).length === 3);
}
{
  const pre = SUB.indexOf('if (stageAActive.current && (_saPhase === "ask" || _saPhase === "correct" || _saArmed)) {');
  const blk = SUB.slice(pre, pre + 1500);
  assert('SITE 4/5: inside the capture block a crisis still cancels the flow FIRST and the message takes the normal path (no bubble, no skipping)',
    blk.indexOf('if (!stageACaptureAllowed(userText)) {') > 0 && blk.indexOf('if (!stageACaptureAllowed(userText)) {') < blk.indexOf('addUiBubble(') &&
    /if \(!stageACaptureAllowed\(userText\)\) \{\s*stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "cancel" \}\);\s*\} else if/.test(blk));
}

// ── The screen: placed after the message that was last, in order, with the same look ──────────
const feedAt = CODE.indexOf('{messages.map((msg, i) => (');
const feed = feedAt >= 0 ? CODE.slice(feedAt, feedAt + 1800) : '';
assert('RENDER: every UI-only line is drawn after the message that was last when it was typed, with the same bubble (a user turn)',
  /<Fragment key=\{msg\.id \|\| i\}>/.test(feed) && /uiBubbles\.filter\(g => Math\.min\(g\.at, messages\.length\) === i \+ 1\)\.map\(g => \(/.test(feed) &&
  /<MessageBubble key=\{g\.id\} msg=\{g\} onMisfire=\{\(\) => \{\}\} onContinueToReflection=\{\(\) => \{\}\} \/>/.test(feed));
assert('RENDER: the existing message bubble is unchanged (same key, same props)',
  /<MessageBubble\s+msg=\{msg\}\s+onMisfire=\{\(\) => \{ if \(sessionEnded \|\| layerGatePending/.test(feed) || /key=\{msg\.id \|\| i\}\s+msg=\{msg\}/.test(feed) || /<MessageBubble\s+msg=\{msg\}/.test(feed));
assert('IMPORT: Fragment comes from react', /^import \{[^}]*\bFragment\b[^}]*\} from "react";/m.test(CODE));
assert('SCROLL: a new bubble scrolls to the bottom (its own effect; the existing scroll effects are untouched)',
  /useEffect\(\(\) => \{\s*if \(!uiBubbles\.length\) return;\s*bottomRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "end" \}\);\s*\}, \[uiBubbles\.length\]\);/.test(CODE) &&
  CODE.includes('  }, [messages, loading, pivotPending, layerGatePending, memoryPromptPending, warningPending, closureConfirmPending, misfirePending, firstWhyPending]);') &&
  /\}, \[stageAPhase\]\);/.test(CODE));
assert('RESET: a new session clears them', /setUiBubbles\(\[\]\);/.test(extractBlock('const resetSession = () =>') || ''));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
