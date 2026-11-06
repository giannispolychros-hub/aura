// AURA — THE FINAL CHECK RUNS LAST, AND WHAT IT CHECKS IS WHAT IS SHOWN (John, 6/11/2026, round 3, ADR «6 Νοεμβρίου»).
//
// Static and run-time proof, read from src/App.jsx, that:
//  (Α) every reply of the model passes the one exit (finishReply; for the closing, closingSafe at the call and closingFinish at the end)
//      before its message is written — all seven calls of callAura
//  (Β) in the main path the exit comes AFTER every change of the reply (the scale question, the emptying of a closing before the root,
//      the goodbye after a crisis, the danger line, the AI-identity line), and nothing changes the text between the exit and the write
//  (Γ) every message of AURA the app writes is one of the places listed here, each with its record (the exit, fkPassApp, or a fixed text
//      of the file) — a new place fails until it is checked
//  (Δ) the check reads the text AS SHOWN: shownTextOf has the very expressions of the message bubble (kept in lockstep), and the bubble
//      draws a message of AURA only when what it is about to show is in the record (fkShownOk)
//  (Ε) the record at run time: a text not checked is not shown; a checked one is; a later edit must keep the safety lines it carried
//  (Ζ) the code says what the check is: a net for the app's normal flow, not a protection against a third party
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const blockFrom = (start, max) => { const a = raw.indexOf(start); if (a < 0) return ''; let d = 0, s = false;
  for (let k = raw.indexOf('{', a); k < raw.length && k < a + (max || 200000); k++) { if (raw[k] === '{') { d++; s = true; } else if (raw[k] === '}') { d--; if (s && !d) return raw.slice(a, k + 1); } } return ''; };

// ── (Α) every call of the model passes the exit ──────────────────────────────────────────────────────────────────────────────────
const GEN = blockFrom('const generateResponse = useCallback(');
const P2 = blockFrom('const deliverFinalClosure = useCallback(');
const TT = blockFrom('const triggerTermination = useCallback(');
const MIS = blockFrom('const handleMisfireResponse = useCallback(');
const PIV = blockFrom('const handlePivotChoice = useCallback(');
const HS = blockFrom('const handleSubmit = useCallback(');
assert('(Α) seven calls of callAura in the app (the main path, the closing ×3, the misfire, the compression, First-WHY), besides its own retry',
  (raw.match(/await callAura\(/g) || []).length - (raw.match(/return await callAura\(messages, systemPrompt, retries - 1, onChunk\)/g) || []).length === 7);
const after = (blk, a, b) => blk.indexOf(a) >= 0 && blk.indexOf(b, blk.indexOf(a)) > blk.indexOf(a);
assert('(Α) the main path: its reply → finishReply → the write', after(GEN, 'await callAura([...contextRefresh, ...msgs], system)', 'const _fk = finishReply(displayText, _finCtx);') &&
  after(GEN, 'const _fk = finishReply(displayText, _finCtx);', 'if (displayText.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText, msgMode: currentMode,'));
assert('(Α) the closing: the three calls get the safety filters at once (closingSafe), and each ends with closingFinish before its message',
  (raw.match(/closingSafe\(await callAura\(\w+, SYSTEM_TERMINATION\), msgs\)/g) || []).length === 3 &&
  after(P2, 'const _fkClose = closingFinish(shownText, msgs);', 'setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: shownText, msgMode: "TERMINATION", isTermination: true }]);') &&
  after(TT, 'const _fkEarly = closingFinish(text, msgs);', 'appendClosingMessage(text);') && after(TT, 'const _fkPart1 = closingFinish(text, msgs);', 'appendClosingMessage(text);') &&
  (TT.match(/appendClosingMessage\(/g) || []).length === 5);
assert('(Α) a closing that does not pass → the path\'s catch: the app\'s own closing text, recorded (fkPassApp)',
  /if \(_fkClose\.failed\) throw new Error\("final check"\);/.test(P2) && /const fallback = fkPassApp\("Η σκέψη σου παραμένει δική σου\.", \{ isTermination: true \}\);/.test(P2) &&
  /if \(_fkEarly\.failed\) throw/.test(TT) && /if \(_fkPart1\.failed\) throw/.test(TT) && /const fallback = fkPassApp\("Πριν φύγεις — μία λέξη/.test(TT));
assert('(Α) the misfire reply: → finishReply → the write of the text that passed', after(MIS, 'await callAura(correctionMsgs, recoveryPrompt)', 'const _fkMis = finishReply(text,') &&
  after(MIS, 'const _fkMis = finishReply(text,', '{ const text = _fkMis.content;') && after(MIS, '{ const text = _fkMis.content;', 'if (text.trim()) setMessages('));
assert('(Α) the compression reply: → finishReply → the write of the text that passed', after(PIV, 'await callAura(pivotMsgs, SYSTEM_COMPRESSION)', 'const _fkPivot = finishReply(text,') &&
  after(PIV, 'const _fkPivot = finishReply(text,', '{ const text = _fkPivot.content;') && after(PIV, '{ const text = _fkPivot.content;', 'if (text.trim()) setMessages('));
assert('(Α) the First-WHY reply: → finishReply → the write of the text that passed', after(HS, 'await callAura(initMsgs, prompt)', 'const _firstFk = finishReply(_firstWhyShown, _firstFkCtx);') &&
  after(HS, 'const _firstFk = finishReply(_firstWhyShown, _firstFkCtx);', '{ const _firstWhyShown = _firstFk.content;') &&
  after(HS, '{ const _firstWhyShown = _firstFk.content;', 'setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: _firstWhyShown, msgMode: "ANSWER" }]);'));
assert('(Α) a reply that does not pass is thrown as a failed call, with the fixed text (finalCheckError)',
  /if \(_fk\.failed\) throw finalCheckError\(msgs\);/.test(GEN) && /if \(_fkMis\.failed\) throw finalCheckError\(correctionMsgs, false\);/.test(MIS) &&
  /if \(_fkPivot\.failed\) throw finalCheckError\(messages, false\);/.test(PIV) && /if \(_firstFk\.failed\) throw finalCheckError\(initMsgs, false\);/.test(HS));

// ── (Β) the main path: the exit after every change ───────────────────────────────────────────────────────────────────────────────
{ const at = GEN.indexOf('const _fk = finishReply(displayText, _finCtx);'), write = GEN.indexOf('if (displayText.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText, msgMode: currentMode,');
  const changes = ['displayText = "Πριν προχωρήσουμε', 'if (_saModelClose) displayText = "";', 'if (_afterCrisis) displayText = _afterCrisis;',
    'if (_dangerLine.line) displayText = displayText.trim() ?', 'if (_aiLine) displayText = displayText + "\\n\\n" + _aiLine;', 'displayText = (displayText.trim() ? displayText.trim() + " " : "")'];
  const idx = changes.map(c => GEN.indexOf(c));
  assert('(Β) the scale question, the emptying, the goodbye after a crisis, the danger line, the AI-identity line and the bare-reply addition all come BEFORE the exit',
    at > 0 && idx.every(i => i > 0 && i < at));
  const between = at > 0 && write > at ? GEN.slice(at, write) : '';
  assert('(Β) between the exit and the write nothing changes the text — the one assignment is the exit\'s own result',
    between.length > 0 && (between.match(/displayText = /g) || []).length === 1 && /displayText = _fk\.content;/.test(between));
  assert('(Β) the exit reads the danger line\'s state when it runs (after the danger line is added), and the line state of 10306 from before this turn',
    /get dangerShown\(\) \{ return dangerLineShown\.current; \}/.test(GEN) && /const _supportBefore = supportLineShown\.current;/.test(GEN) &&
    GEN.indexOf('const _supportBefore = supportLineShown.current;') < GEN.indexOf('if (_crisisLine.supportShown) supportLineShown.current = true;')); }
assert('(Β) A5: the goodbye after a crisis on the model\'s path knows the line in the box', /stageAAfterCrisisText\(\{ active: stageAActive\.current, messages: msgs, fallbackLine: crisisFallbackNow\.current,/.test(GEN));

// ── (Γ) every message of AURA, with its record ──────────────────────────────────────────────────────────────────────────────────
const SITES = [
  ['the check itself (3: the exit, the hash, the record of app texts)', /^function (finishReply|fkStampOf|fkPassApp)\(/, null],
  ['Stage A, the questions of the step (fixed texts)', 'addUiBubble(STAGE_A_TEXTS.fitsQ, at, { role: "assistant" })', 'fixed'],
  ['', 'addUiBubble(STAGE_A_TEXTS.smallerQ, at, { role: "assistant" })', 'fixed'],
  ['', 'addUiBubble(STAGE_A_TEXTS.whenQ, at, { role: "assistant" })', 'fixed'],
  ['Stage A, the step card (a card, not a bubble — drawn by itself)', 'addUiBubble(buildStepCardText(', 'card'],
  ['', 'addUiBubble(STAGE_A_TEXTS.endKeep, at, { role: "assistant" })', 'fixed'],
  ['Stage A, the leaving door\'s dismissal: the question and the goodbye (fixed texts)', 'content: STAGE_A_TEXTS.askLeaving, msgMode: "STAGE_A" }, { id: nextMsgId(), role: "user", content: userText }, { id: nextMsgId(), role: "assistant", content: _bye', 'fixed'],
  ['the main reply', 'content: displayText, msgMode: currentMode, ...(_methodLine', 'const _fk = finishReply(displayText, _finCtx);'],
  ['the road map read back from the history (never shown)', 'extractRoadMapFromProse([...msgs, { role: "assistant", content: text }])', 'history'],
  ['the road artifact (the user\'s own answers, assembled by code)', 'content: _rqArtifact, msgMode: currentMode }', 'fkPassApp(_rqArtifact);'],
  ['the closing\'s messages (appendClosingMessage)', 'next.push({ id: nextMsgId(), role: "assistant", content, msgMode: "TERMINATION", isTermination: true });', 'callers'],
  ['the closing\'s Part 2', 'content: shownText, msgMode: "TERMINATION", isTermination: true }', 'const _fkClose = closingFinish(shownText, msgs);'],
  ['the closing\'s lines, in a message of their own', 'content: _fkClose.linesText, msgMode: "TERMINATION"', 'const _fkClose = closingFinish(shownText, msgs);'],
  ['the closing\'s fallback', 'content: fallback, msgMode: "TERMINATION", isTermination: true }', 'const fallback = fkPassApp("Η σκέψη σου παραμένει δική σου."'],
  ['the misfire reply', 'content: text, msgMode: "AUDIT" }', '{ const text = _fkMis.content;'],
  ['the compression reply', 'content: text, msgMode: "COMPRESSION", isInsight: true }', '{ const text = _fkPivot.content;'],
  ['Stage A, the root question in the history (fixed texts)', 'content: stageARef.current.leaving ? STAGE_A_TEXTS.askLeaving : STAGE_A_TEXTS.ask, msgMode:', 'fixed'],
  ['First-WHY\'s question', '{ id: nextMsgId(), role: "assistant", content: "Γιατί έχει σημασία αυτό για σένα τώρα;" },', 'fkPassApp("Γιατί έχει σημασία αυτό για σένα τώρα;");'],
  ['the First-WHY reply', 'content: _firstWhyShown, msgMode: "ANSWER" }', '{ const _firstWhyShown = _firstFk.content;'],
  ['the goodbye after a crisis (fixed texts)', 'content: _afterCrisis, msgMode: "STAGE_A" }', 'fixed'],
  ['Stage A, the step after «Ναι»', 'addUiBubble(buildRootStepLines(_found).join("\\n"), messages.length, { role: "assistant", stageAEnd: true })', 'fkPassApp(buildRootStepLines(_found).join("\\n"));'],
  ['Stage A, the end lines', 'content: buildRootEndLines(stageARef.current.found, _riskOffer).join("\\n"), msgMode: "STAGE_A", stageAEnd: true }', 'fkPassApp(buildRootEndLines(stageARef.current.found, _riskOffer).join("\\n"));'],
];
{ const all = [...raw.matchAll(/role: "assistant"/g)].map(m => m.index);
  const lineOf = i => raw.slice(raw.lastIndexOf('\n', i) + 1, raw.indexOf('\n', i));
  const known = all.filter(i => { const l = lineOf(i); return SITES.some(([, a]) => typeof a === 'string' ? l.includes(a) : false) ||
    /shownTextOf\(\{ role: "assistant", content: t,|fkStamp\(shownTextOf\(Object\.assign\(\{ role: "assistant" \}|finalReplyCheck\(shownTextOf\(Object\.assign\(\{ role: "assistant" \}/.test(l); });
  assert(`(Γ) every «role: "assistant"» of the file is one of the places listed here (${all.length} found, ${known.length} known) — a new one fails until it is checked`, all.length === known.length && all.length === 25); } // 24 lines: the leaving door's line writes two
for (const [label, anchor, guard] of SITES) {
  if (!label || typeof anchor !== 'string') continue;
  const i = raw.indexOf(anchor);
  if (guard === 'fixed' || guard === 'card' || guard === 'history' || guard === 'callers') continue;
  const before = i > 0 ? raw.slice(Math.max(0, i - 2600), i) : '';
  assert(`(Γ) ${label}: its record comes first («${guard.slice(0, 48)}…»)`, i > 0 && before.includes(guard));
}
assert('(Γ) the fixed texts of Stage A and the app\'s goodbye are recorded once, for every session (fkFixedTexts)',
  /for \(const v of Object\.values\(STAGE_A_TEXTS\)\) if \(typeof v === "string" && v\) fkPassApp\(v\);/.test(raw) && /fkPassApp\(BARE_GOODBYE_TEXT\);/.test(raw));
assert('(Γ) the goodbyes the leaving door and the crisis give are fixed texts only (STAGE_A_TEXTS / BARE_GOODBYE_TEXT)',
  (() => { const f = blockFrom('function stageADismissalGoodbye('), g = blockFrom('function stageAAfterCrisisText(');
    return /STAGE_A_TEXTS\.afterCrisis/.test(f + g) && !/return\s+[`"]/.test(f + g); })());
assert('(Γ) the closing\'s edit of an earlier message (a premature farewell) keeps every safety line it carried, or nothing changes (fkPassEdit)',
  /if \(cleaned !== next\[i\]\.content && fkPassEdit\(next\[i\]\.content, cleaned, next\[i\]\)\) next\[i\] = \{ \.\.\.next\[i\], content: cleaned \};/.test(raw));

// ── (Δ) the check reads the text as shown ───────────────────────────────────────────────────────────────────────────────────────
{ const bub = (() => { const a = raw.indexOf('const MessageBubble = memo(function MessageBubble('); const b = raw.indexOf('\n});', a); return a >= 0 && b > a ? raw.slice(a, b) : ''; })();
  const sto = blockFrom('function shownTextOf(msg) {');
  const exprOf = (src, a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); return i >= 0 && j > i ? src.slice(i + a.length, j) : null; };
  const norm = t => t == null ? null : t.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n').replace(/msg\.content/g, 'content').replace(/\s+/g, ' ').trim(); // code, not comments
  const eBub = norm(exprOf(bub, 'const displayContent = dropQuoteOnlyLines(', ': (isUser ? msg.content : replaceBareGoodbye(msg.content)));'));
  const eSto = norm(exprOf(sto, 'const displayed = dropQuoteOnlyLines(', ': (isUser ? content : replaceBareGoodbye(content)));'));
  assert('(Δ) LOCKSTEP: shownTextOf has the very expression of the message bubble (the road map out of the prose, quotation-mark lines, the bare goodbye)',
    !!eBub && eBub === eSto);
  assert('(Δ) LOCKSTEP: … and the same «Πες μου» step', bub.includes('const shownContent = isUser ? displayContent : singularTellMe(displayContent);') && sto.includes('const shown = isUser ? displayed : singularTellMe(displayed);'));
  const g = bub.indexOf('if (!isUser && !fkShownOk(visibleText(msg, roadMap, displayContent, shownContent))) {');
  assert('(Δ) the bubble draws a message of AURA only when what it is about to show is in the record — asked after it has computed it, before it draws',
    g > bub.indexOf('const shownContent = isUser ? displayContent : singularTellMe(displayContent);') && g < bub.indexOf('return (\n    <div className={`turn ${isUser') && g > 0);
  assert('(Δ) … and draws the app\'s fixed text otherwise', /data-final-check="failed"[\s\S]{0,200}\{SAFE_FAIL_TEXTS\.noBox\}/.test(bub));
  assert('(Δ) the exit checks the text through shownTextOf (and the record is of that shown text)', /const shown = shownTextOf\(\{ role: "assistant", content: t, isTermination: o\.isTermination === true \}\);/.test(raw) &&
    /return fkStamp\(shownTextOf\(Object\.assign\(\{ role: "assistant" \}, meta \|\| \{\}, \{ content: typeof content === "string" \? content : "" \}\)\)\.visible\);/.test(raw)); }

// ── (Ε) the record, at run time ─────────────────────────────────────────────────────────────────────────────────────────────────
function load(names) {
  const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), ce = raw.indexOf('`;', raw.indexOf('`', ci) + 1);
  const code = raw.slice(0, ci) + 'const AURA_CORE_PERSONALITY = "";' + raw.slice(ce + 2);
  const top = code.slice(0, code.indexOf('\nexport default function AURAv2'));
  const re = /^(?:async )?function ([A-Za-z_$][\w$]*)\(|^(?:const|let) ([A-Za-z_$][\w$]*) =/gm;
  const starts = []; let m; while ((m = re.exec(top))) starts.push({ name: m[1] || m[2], at: m.index });
  const blocks = Object.create(null);
  for (let i = 0; i < starts.length; i++) { const b = top.slice(starts[i].at, i + 1 < starts.length ? starts[i + 1].at : top.length).replace(/(\n\/\/[^\n]*)+\s*$/, '\n');
    if (/return \(\s*</.test(b) || /^const [A-Za-z_$][\w$]* = memo\(/.test(b)) continue; blocks[starts[i].name] = b; }
  const seen = new Set(), order = [];
  const visit = n => { if (seen.has(n) || !blocks[n]) return; seen.add(n); for (const id of new Set(blocks[n].match(/\b[A-Za-z_$][\w$]*\b/g) || [])) if (id !== n && blocks[id]) visit(id); order.push(n); };
  names.forEach(visit);
  try { return new Function(order.map(n => blocks[n]).join('\n') + '\nreturn {' + names.filter(n => blocks[n]).join(',') + '};')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); return {}; }
}
const F = load(['finishReply', 'shownTextOf', 'fkShownOk', 'fkPass', 'fkPassApp', 'fkPassEdit', 'STAGE_A_TEXTS', 'BARE_GOODBYE_TEXT']);
const vis = (content, meta) => F.shownTextOf ? F.shownTextOf(Object.assign({ role: 'assistant', content }, meta || {})).visible : null;
if (F.finishReply && F.fkShownOk) {
  const L1018 = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
  assert('(Ε) a text no check has seen is not shown', F.fkShownOk(vis('Ένα κείμενο που δεν πέρασε από τον έλεγχο.')) === false);
  const r = F.finishReply('Τι σε κρατάει εκεί;', { kind: 'model', mode: 'SUPPORTIVE', lastUserText: 'Θέλω να πεθάνω.', safetyPath: true });
  assert('(Ε) a reply that passed the exit is shown — with its line', r.failed === false && F.fkShownOk(vis(r.content)) && r.content.endsWith(L1018));
  assert('(Ε) the same reply with its line taken away is NOT shown (a later change after the check)', F.fkShownOk(vis('Τι σε κρατάει εκεί;')) === false);
  assert('(Ε) an edit of it that keeps the line is allowed and then shown; one that drops the line is refused',
    F.fkPassEdit(r.content, 'Τι σε κρατάει;\n\n' + L1018, {}) === true && F.fkShownOk(vis('Τι σε κρατάει;\n\n' + L1018)) && F.fkPassEdit(r.content, 'Τι σε κρατάει;', {}) === false && F.fkShownOk(vis('Τι σε κρατάει;')) === false);
  assert('(Ε) the fixed texts of Stage A and the app\'s goodbye are shown with no further step', F.fkShownOk(vis(F.STAGE_A_TEXTS.ask)) && F.fkShownOk(vis(F.BARE_GOODBYE_TEXT)));
  const map = 'Δύο δρόμοι:\nΔΡΟΜΟΣ 1: Μένω\nΚΕΡΔΙΖΕΙΣ: σιγουριά\nΚΟΣΤΙΖΕΙ: χρόνο\nΑΓΝΩΣΤΟ: τι θα πει';
  const rm = F.finishReply(map, { kind: 'model', mode: 'ANSWER', lastUserText: 'x' });
  assert('(Ε) the record is of the text as SHOWN: a road map is recorded as the bubble draws it (the map, then the prose)',
    rm.failed === false && /Μένω\nκερδίζεις · σιγουριά\nκοστίζει · χρόνο\nάγνωστο · τι θα πει\nΔύο δρόμοι:/.test(vis(map)) && F.fkShownOk(vis(map)));
  const pm = F.finishReply('Πέστε μου τι νιώθετε.', { kind: 'model', mode: 'ANSWER', lastUserText: 'x' });
  assert('(Ε) … and «Πέστε μου» as «Πες μου», as on the screen', pm.failed === false && vis('Πέστε μου τι νιώθετε.') === 'Πες μου τι νιώθετε.' && F.fkShownOk('Πες μου τι νιώθετε.'));
} else assert('(Ε) the record\'s functions load', false);

// ── (Ζ) what the check is ───────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Ζ) the code says it: a net for the app\'s normal flow, NOT a protection against a third party',
  /This is a net for the app's normal\s*\n?\/\/ flow/.test(raw) || (/a net for the app's normal/.test(raw) && /NOT a protection against a third party/.test(raw)));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
