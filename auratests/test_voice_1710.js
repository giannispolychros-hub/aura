// AURA — John, 17/10/2026 (ADR «17 Οκτωβρίου»). Three changes, nothing else:
//   1  Door 4 without «Πριν φύγεις:» (his own correction): «Αν κάτι ξεκαθάρισε, γράψ' το σε μία φράση. Τι είναι αυτό που
//      πραγματικά σε απασχολεί;» — the same text wherever the same question appears (door 5 too). «Δεν το βρήκα ακόμα» stays.
//   2  Two FIXED lines written by the app, never by the model:
//      (α) on the first reply of a session, once, as its first line: «Δεν θα σου δώσω λίστα με αιτίες και λύσεις. Θα σε ρωτάω ένα
//          πράγμα τη φορά, ώστε να το βρεις εσύ.» — not when that reply is on the safety path (crisis, distress), and it never
//          reaches any prompt (the e5af4bc lesson). Stage A only: in the old flow the app does give a road map.
//      (β) on the root card, above the buttons: «Αυτά είναι δικά σου λόγια, όχι δικά μου. Είναι αυτό που πραγματικά σε
//          απασχολεί;» — only because, on every path, the card shows the user's own typed words (checked here in the code).
//   3  «ΦΩΝΗ ΤΗΣ AURA» in the prompt, near the end next to CONTRACT / MIRROR RULE / NO ADVICE; never in the crisis prompt.

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
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);
const constText = name => { const a = raw.indexOf('const ' + name + ' = `'); if (a < 0) return ''; const s = raw.indexOf('`', a) + 1; return raw.slice(s, raw.indexOf('`;', s)); };
const sha = t => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);

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
const NAMES = ['stageAMethodLineDue', 'detectSafetySignal'];
let F = {};
try {
  F = new Function(textsSrc + '\n' + NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {STAGE_A_TEXTS,' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const TX = F.STAGE_A_TEXTS || {};
const UI = CODE.slice(CODE.indexOf('{/* STAGE A UI — BEGIN */}'), CODE.indexOf('{/* STAGE A UI — END */}'));
const METHOD = 'Δεν θα σου δώσω λίστα με αιτίες και λύσεις. Θα σε ρωτάω ένα πράγμα τη φορά, ώστε να το βρεις εσύ.';
const OWN = 'Αυτά είναι δικά σου λόγια, όχι δικά μου. Είναι αυτό που πραγματικά σε απασχολεί;';

// ── 1. Door 4 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('DOOR 4: John\'s text, without «Πριν φύγεις:»', TX.askLeaving === "Αν κάτι ξεκαθάρισε, γράψ' το σε μία φράση. Τι είναι αυτό που πραγματικά σε απασχολεί;");
assert('DOOR 4: «Πριν φύγεις:» is nowhere in the app\'s fixed texts any more (the closing\'s word question «Πριν φύγεις — μία λέξη…» is another text and stays)',
  !/Πριν φύγεις:/.test(textsSrc) && TX.word === 'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.');
assert('DOOR 4: the same constant serves door 5 (the model\'s own closing) — one text, no second copy',
  (CODE.match(/STAGE_A_TEXTS\.askLeaving/g) || []).length >= 2 && (CODE.match(/Αν κάτι ξεκαθάρισε, γράψ' το σε μία φράση/g) || []).length === 1);
assert('DOOR 4: «Δεν το βρήκα ακόμα, συνέχισε» stays', TX.back === 'Δεν το βρήκα ακόμα, συνέχισε');

// ── 2α. The method line on the first reply ────────────────────────────────────────────────────────────────────────────────────
assert('METHOD: John\'s line, word for word', TX.methodLine === METHOD);
const due = o => T('stageAMethodLineDue', Object.assign({ active: true, auraBefore: false, supportive: false, riskKind: 0, safetyMode: false, lastUserText: 'Θέλω να αδυνατίσω.' }, o || {}));
assert('METHOD: due on the first reply of a Stage A session', due() === true);
assert('METHOD: once — never when AURA has already replied', due({ auraBefore: true }) === false);
assert('METHOD: never with the switch closed (the old flow gives a road map: the line would not be true there)', due({ active: false }) === false);
assert('METHOD: never on the safety path — Supportive Mode, any risk latch (crisis A, B, DISTRESS), safety mode',
  due({ supportive: true }) === false && [1, 2, 3].every(k => due({ riskKind: k }) === false) && due({ safetyMode: true }) === false);
assert('METHOD: never when the first message itself carries a crisis or distress signal',
  due({ lastUserText: 'Δεν θέλω να ζω άλλο.' }) === false && due({ lastUserText: 'Θέλω να πεθάνω.' }) === false);
{
  const GR = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
  assert('METHOD (model\'s first reply): the reply carries a display flag, decided by stageAMethodLineDue with the turn\'s own mode and the risk latch',
    /stageAMethodLineDue\(\{ active: stageAActive\.current, auraBefore: msgs\.some\(m => m && m\.role === "assistant"\), supportive: currentMode === "SUPPORTIVE", riskKind: riskSignalKind\.current, safetyMode, lastUserText: lastUserMsg \}\)/.test(GR) &&
    GR.includes('{ id: nextMsgId(), role: "assistant", content: displayText, msgMode: currentMode, ...(_methodLine ? { methodLine: true } : {}) }'));
  const HS = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
  assert('METHOD (the app\'s first question «Γιατί έχει σημασία…»): decided once when that question opens, by the same rule',
    /firstWhyMethodLine\.current = stageAMethodLineDue\(\{ active: stageAActive\.current, auraBefore: false, supportive: false, riskKind: riskSignalKind\.current, safetyMode, lastUserText: userText \}\);/.test(HS) &&
    HS.includes('{ id: nextMsgId(), role: "assistant", content: "Γιατί έχει σημασία αυτό για σένα τώρα;", ...(firstWhyMethodLine.current ? { methodLine: true } : {}) }'));
  assert('METHOD: the question card shows the line above the question',
    /\{firstWhyPending && \(\s*<div className="first-why-card">\s*\{firstWhyMethodLine\.current && <div className="method-line"[^>]*>\{STAGE_A_TEXTS\.methodLine\}<\/div>\}\s*<div className="first-why-q">/.test(CODE));
  assert('METHOD: the reply bubble draws it as its FIRST line, from the flag (display only)',
    /\{msg\.methodLine && !isUser && <span className="method-line"[^>]*>\{STAGE_A_TEXTS\.methodLine\}<\/span>\}\s*\{displayContent\.split\("\\n"\)/.test(CODE));
  assert('METHOD: never sent anywhere — the API gets only role and content, and the line is used in no other place (no prompt, no history)',
    CODE.includes('messages: capMessageHistory(messages, systemPrompt).map(m => ({ role: m.role, content: m.content }))') &&
    (CODE.match(/STAGE_A_TEXTS\.methodLine/g) || []).length === 2 && !constText('SYSTEM_SUPPORTIVE').includes('Δεν θα σου δώσω λίστα'));
  assert('METHOD: a new session starts with the flag cleared', /setTesterCopy\(null\);\s*firstWhyMethodLine\.current = false;/.test(CODE.slice(CODE.indexOf('const resetSession = () =>'), CODE.indexOf('const resetSession = () =>') + 9000)));
}

// ── 2β. The line on the root card — and the precondition, in the code of every path ─────────────────────────────────────────
assert('CARD: John\'s line, word for word', TX.cardOwn === OWN);
assert('CARD: on the card (phase «card»), right after the root and before the note and the buttons; not while correcting',
  /«\{stageAView\.found\}»\s*<\/div>\s*\{stageAPhase === "card" \? \(\s*<>\s*<div className="warning-text" style=\{\{marginBottom:"8px"\}\}>\{STAGE_A_TEXTS\.cardOwn\}<\/div>\s*<div className="warning-text" style=\{\{fontSize:"12px",opacity:0\.8\}\}>\{buildRootCardLine/.test(UI) &&
  (CODE.match(/STAGE_A_TEXTS\.cardOwn/g) || []).length === 1);
{
  // The precondition (John): the card shows only text the user typed, verbatim. Every way the card opens or changes:
  const HS = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
  const GR = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
  assert('PRECONDITION: the card opens in ONE place (stageAOpen), and only for a text found verbatim in a user message',
    (CODE.match(/type: "open"/g) || []).length === 1 &&
    /const stageAOpen = useCallback\(\(door, found, msgsNow\) => \{\s*const _users = \(msgsNow \|\| \[\]\)\.filter\(m => m && m\.role === "user"\)\.map\(m => String\(m\.content \|\| ""\)\);\s*if \(!isVerbatimUserText\(found, _users\)\) return;/.test(CODE));
  assert('PRECONDITION: doors 1, 2, 4, 5 — the text is the user\'s own typed answer (userText)', /stageAOpen\(_saDoor, userText, \[\.\.\.messages, \.\.\._saAdded\]\)/.test(HS));
  assert('PRECONDITION: door 3 — the user\'s own last message', /stageAOpen\(3, _saLastUser\.content, msgs\)/.test(GR) && GR.includes('const _saLastUser = [...msgs].reverse().find(m => m.role === "user");'));
  assert('PRECONDITION: «Διόρθωσε» — what the user typed', /stageADispatch\(\{ type: "correctDone", found: userText \}\)/.test(HS));
  assert('PRECONDITION: «Τι ήξερες» — a sentence of the user\'s first messages', /const _knew = pickKnewSnippet\(\(msgsNow \|\| \[\]\)\.filter\(m => m && m\.role === "user"\)/.test(CODE));
  assert('PRECONDITION: the app\'s own synthetic «user» turns (misfire, pivot) are never kept in the history the card reads',
    /const correctionMsgs = \[\s*\.\.\.messages,/.test(CODE) && /const pivotMsgs  = \[\s*\.\.\.messages,/.test(CODE) &&
    !/setMessages\(correctionMsgs\)|setMessages\(pivotMsgs\)/.test(CODE));
}

// ── 3. ΦΩΝΗ ΤΗΣ AURA ──────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const a = PROMPT.indexOf('ΦΩΝΗ ΤΗΣ AURA');
  const sec = a >= 0 ? PROMPT.slice(a, PROMPT.indexOf('\n', a)) : '';
  assert('VOICE: the section is in the prompt, once', a >= 0 && PROMPT.split('ΦΩΝΗ ΤΗΣ AURA').length === 2);
  assert('VOICE: near the end — right before the closing block that holds CONTRACT / MIRROR RULE / NO ADVICE',
    a > PROMPT.indexOf('CLOSING WORDS (normal flow)') && a < PROMPT.lastIndexOf('<critical_invariants>') && PROMPT.lastIndexOf('<critical_invariants>') - a < 6000);
  assert('VOICE: not on the safety path, and safety always wins', /NOT on the safety path/.test(sec) && /Supportive Mode/.test(sec) && /DISTRESS GRADIENT/.test(sec) &&
    /\[CODE-VERIFIED: the safety path was activated/.test(sec) && /safety always wins/.test(sec));
  assert('VOICE: an existing rule with its own form keeps it (no silent conflict)', /keeps its own form/.test(sec) &&
    ['ΗΡΘΕΣ ΜΕ', 'STOP MOMENT', 'CHOICE QUESTION', 'road map'].every(w => sec.includes(w)));
  assert('VOICE (1): short, 1–3 lines; no lists, bullets, emoji, exclamation marks', /1–3 lines/.test(sec) && /no lists/.test(sec) && /no bullet points/.test(sec) && /no emoji/.test(sec) && /no exclamation marks/.test(sec));
  assert('VOICE (2): one question; options «…ή…;» allowed; never an option with a psychological interpretation', /One question/.test(sec) && sec.includes('«…ή…;»') && /psychological interpretation/.test(sec));
  assert('VOICE (3): precision — grounded in something specific, used to move forward; a quote in «» only when it is the reason; never ritual or echo',
    /something specific the user said/.test(sec) && /move forward/.test(sec) && /ritual or echo/.test(sec));
  assert('VOICE (4): empathy by precision — one short acknowledgement in their words only when they show weight; John\'s example; the clichés listed verbatim',
    sec.includes('«Πέντε χρόνια έτσι. Δεν είναι λίγο.»') && ['«Σίγουρα!»', '«Πολύ καλή ερώτηση»', '«Είναι απολύτως κατανοητό/φυσιολογικό»', '«Λυπάμαι πολύ»',
      '«Καταλαβαίνω απόλυτα»', '«Σε ακούω»', '«Αυτό που μοιράζεσαι είναι πολύτιμο»', '«Ακολουθούν μερικά…»', '«Ελπίζω να βοήθησα»', '«Θέλεις να σου…;»'].every(w => sec.includes(w)) &&
    /UNIVERSAL NO-EVALUATION/.test(sec));
  assert('VOICE (5): no assumption the user did not state; on weight, food or the body never a push toward more restriction',
    sec.includes('«τι σε κρατάει πίσω τόσο καιρό»') && /weight, food or the body/.test(sec) && /more restriction/.test(sec));
  assert('VOICE: the app\'s method line is not repeated by the model', sec.includes('«Δεν θα σου δώσω λίστα με αιτίες και λύσεις…»') && /never repeat or paraphrase it/.test(sec));
  assert('VOICE: John\'s example, as style and not a template',
    sec.includes('«Θέλω να αδυνατίσω» → «Γιατί τώρα; Έγινε κάτι πρόσφατα ή το σκέφτεσαι καιρό;»') && sec.includes('«Μια φωτογραφία. Τι είδες σε αυτήν;»') && /not a template/.test(sec));
  const SUP = constText('SYSTEM_SUPPORTIVE');
  assert('VOICE: never in the crisis prompt — SYSTEM_SUPPORTIVE is unchanged and is sent without the core prompt',
    sha(SUP) === 'c7815b96d83ebae8' && SUP.length === 851 && !/ΦΩΝΗ ΤΗΣ AURA/.test(SUP) && /currentMode === "SUPPORTIVE"  \? SYSTEM_SUPPORTIVE :/.test(CODE));
  assert('VOICE: not in the closing prompt either (SYSTEM_TERMINATION unchanged in size)', !/ΦΩΝΗ ΤΗΣ AURA/.test(constText('SYSTEM_TERMINATION')) && constText('SYSTEM_TERMINATION').length === 20032);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
