// AURA — John, 23/11/2026 (order Α): THE CLOSING FROM CODE in Stage A. After the user's «one word» the model is NOT called any more. What follows is only what the CODE builds from
// the user's own data: the app's line «Η λέξη «X» έχει εμφανιστεί συνολικά N φορές στις καταγραφές σου.» (when the word was kept before), the recognition cards (the Κ4 gate: RECURRING /
// DIVERGENCE — MOVED into one shared function, not removed), then the card of the map and its fixed line «Ωραία, το πρώτο επόμενο βήμα είναι αυτό.».
// Why: in the second real session the model's closing wrote «από μια βραδιά που είδες καθαρά τι ψάχνεις» (an evening nobody had mentioned) and «Η απογοήτευση δεν είναι τυχαία. Είναι το
// κόστος μιας αναζήτησης που είναι πολύ αληθινή.» (a verdict, praise) — a model text after the word can say what the user never said; a text built by code from the user's data cannot.
//
// WRITTEN FIRST — every assertion labelled NEW fails on the code of root-list 3e2a0e4 and passes after the change; GUARD assertions are green before and after on purpose (they pin what must
// not move: the old flow, the safety path, the core prompt, api/aura.js, line 912). All text here is synthetic. Code only: the core prompt (7e52268becda7360) and api/aura.js do not change.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
// the brace-balanced block that starts at the first «{» after `a` (an index into raw)
const blockAt = (src, a) => { let d = 0, s = false; for (let k = src.indexOf('{', a); k >= 0 && k < src.length; k++) { if (src[k] === '{') { d++; s = true; } else if (src[k] === '}') { d--; if (s && !d) return src.slice(a, k + 1); } } return ''; };
const blockFrom = start => { const a = raw.indexOf(start); return a < 0 ? '' : blockAt(raw, a); };
const count = (s, re) => (s.match(re) || []).length;

const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1); return raw.slice(a + 1, eol); };
let F = {};
try {
  F = new Function([constSrc('FINAL_MAX_CHARS') || 'const FINAL_MAX_CHARS = undefined;', fnSrc('stageAEchoLine') || `function stageAEchoLine(){ throw new Error('missing stageAEchoLine'); }`,
    fnSrc('stageAClosureFromCode') || `function stageAClosureFromCode(){ throw new Error('missing stageAClosureFromCode'); }`,
    'return { stageAEchoLine, stageAClosureFromCode };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw: ' + e.message; } };

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 1. the line the CODE writes from the user's data — the same sentence the model used to be told to write
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const W = 'Μαρία';
  assert('NEW — (1.1) stageAEchoLine: a word kept before once (count 1) → «Η λέξη «Μαρία» έχει εμφανιστεί συνολικά 2 φορές στις καταγραφές σου.» (count + 1: today counts)',
    call('stageAEchoLine', W, 1) === 'Η λέξη «Μαρία» έχει εμφανιστεί συνολικά 2 φορές στις καταγραφές σου.');
  assert('NEW — (1.2) … four times before → 5 φορές', call('stageAEchoLine', W, 4) === 'Η λέξη «Μαρία» έχει εμφανιστεί συνολικά 5 φορές στις καταγραφές σου.');
  assert('NEW — (1.3) a word never kept before (count 0) → no line at all (an empty string, not a sentence about «1 φορά»)', call('stageAEchoLine', W, 0) === '');
  assert('NEW — (1.4) the word is trimmed; a blank or non-text word → no line', call('stageAEchoLine', '  Μαρία \n', 1) === 'Η λέξη «Μαρία» έχει εμφανιστεί συνολικά 2 φορές στις καταγραφές σου.' &&
    call('stageAEchoLine', '   ', 3) === '' && call('stageAEchoLine', null, 3) === '' && call('stageAEchoLine', undefined, 3) === '' && call('stageAEchoLine', 42, 3) === '');
  assert('NEW — (1.5) a count that is not a whole number ≥ 1 → no line (-1, 1.5, "2", NaN, undefined)', [-1, 1.5, '2', NaN, undefined, null].every(c => call('stageAEchoLine', W, c) === ''));
  // the old closing told the MODEL to write exactly this sentence (deliverFinalClosure's echoNote): the code's line has the same words, so what the user sees is unchanged where it was right
  const oldNote = (() => { const a = raw.indexOf('const echoNote = '); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n', raw.indexOf('LITERAL ECHO', a)) + 1); })();
  const m = oldNote.match(/"(Η λέξη «\$\{echoInfo\.word\}» έχει εμφανιστεί συνολικά \$\{echoInfo\.count \+ 1\} φορές στις καταγραφές σου\.)"/);
  assert('GUARD — (1.6) the sentence is word for word the one the old closing told the model to write («Η λέξη «…» έχει εμφανιστεί συνολικά N φορές στις καταγραφές σου.»)',
    !!m && m[1].replace('${echoInfo.word}', W).replace('${echoInfo.count + 1}', '3') === call('stageAEchoLine', W, 2));
  assert('NEW — (1.7) the line is literal: only the word and one number — no interpretation, no second sentence, no label of the app',
    (() => { const l = call('stageAEchoLine', W, 2); return typeof l === 'string' && l.split('.').filter(Boolean).length === 1 && !/\n/.test(l) && l.replace(W, '').replace(/\d+/, '#') === 'Η λέξη «» έχει εμφανιστεί συνολικά # φορές στις καταγραφές σου.'; })());
  // the shape the final check asks of an app text (finalReplyCheck kind «app»): not over FINAL_MAX_CHARS, no hidden tag — a word that would break it gives NO line (the bubble must never have to replace the app's own line)
  const MAX = Number((raw.match(/\nconst FINAL_MAX_CHARS = (\d+);/) || [])[1]);
  assert('NEW — (1.8) a word so long that the line goes over FINAL_MAX_CHARS (' + MAX + ') → no line; just under it → the line', MAX > 1000 && call('stageAEchoLine', 'α'.repeat(MAX), 1) === '' &&
    call('stageAEchoLine', 'α'.repeat(MAX - 70), 1).length > 0 && call('stageAEchoLine', 'α'.repeat(MAX - 70), 1).length <= MAX);
  assert('NEW — (1.9) a word that carries a hidden tag of the app ([[EXIT:yes]], [[ABC]]) → no line', call('stageAEchoLine', 'ναι [[EXIT:yes]]', 1) === '' && call('stageAEchoLine', 'α [[ABC]] β', 2) === '' && call('stageAEchoLine', 'α [[abc]] β', 2) !== '');
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 2. when the closing comes from code — never on a path of safety
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const g = r => call('stageAClosureFromCode', r);
  assert('NEW — (2.1) no risk signal in the whole session (the latch of heaviness is exactly 0) → the closing from code', g(0) === true);
  assert('NEW — (2.2) ANY risk latch (1 crisis A, 2 crisis B, 3 distress) → NOT from code: the old closing stays (the model\'s text under the safety filters and the final check)', g(1) === false && g(2) === false && g(3) === false);
  assert('NEW — (2.3) an unknown latch (undefined, null, "0", NaN, an object) is NOT taken as «no risk»: the old closing (the safe side)', [undefined, null, '0', NaN, {}, false].every(r => g(r) === false));
  assert('NEW — (2.4) danger from another person is NOT read again here: the ONE caller sits inside the word branch whose own condition says «not (Stage A and the danger latch)» — so the danger latch has no new read in the file (20, as pinned by test_speak_right (8.2)) and the latch of heaviness exactly one more (43; pinned by (12.8), UPDATED)',
    count(raw, /dangerFromOther\.current/g) === 20 && count(raw, /riskSignalKind\.current/g) === 43);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 3. the shape of deliverFinalClosure: ONE shared arming of the cards, a branch with no model call, the old closing untouched
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
const P2 = blockFrom('const deliverFinalClosure = useCallback(');
const BR = (() => { const a = P2.indexOf('if (echoInfo && echoInfo.codeClosing === true'); return a < 0 ? '' : blockAt(P2, a); })();
{
  assert('TEST SETUP — deliverFinalClosure was located (not an empty-string trap)', P2.length > 3000);
  assert('NEW — (3.1) the closing from code is a branch of deliverFinalClosure, asked by the caller (codeClosing) AND allowed by stageAClosureFromCode on the session\'s latch of heaviness (a ref, never stale)',
    /if \(echoInfo && echoInfo\.codeClosing === true && stageAClosureFromCode\(riskSignalKind\.current\)\) \{/.test(P2) && BR.length > 200);
  assert('NEW — (3.2) the branch comes BEFORE setLoading(true) and before the first call of the model — so no «typing» and no request', (() => {
    const b = P2.indexOf('if (echoInfo && echoInfo.codeClosing === true'); return b > 0 && b < P2.indexOf('setLoading(true)') && b < P2.indexOf('callAura(');
  })());
  assert('NEW — (3.3) inside the branch: no model (no callAura, no SYSTEM_TERMINATION, no trigger text), no loading, no closingSafe / closingFinish, no echoNote; and nothing that other tests pin to the old closing — no setMessages, no «role: "assistant»» literal, no fkShownOk (the bubble only), no read of the danger latch',
    BR.length > 200 && !/callAura\(|SYSTEM_TERMINATION|Deliver Part|setLoading\(|closingSafe\(|closingFinish\(|echoNote|finalMsgs|setMessages\(|role: "assistant"|fkShownOk|dangerFromOther/.test(BR));
  assert('NEW — (3.4) inside the branch: the line is built by the pure function from the caller\'s word and count, recorded as the app\'s own text (fkPassApp) and then appended with the SAME helper as the word question (appendClosingMessage) — in this order',
    /stageAEchoLine\(echoInfo\.word, echoInfo\.count\)/.test(BR) && /fkPassApp\(_echo, \{ isTermination: true \}\)/.test(BR) && /appendClosingMessage\(_echo\);/.test(BR) && BR.indexOf('fkPassApp(_echo') < BR.indexOf('appendClosingMessage(_echo)'));
  assert('NEW — (3.5) inside the branch, in this order: the session ends, the cards are armed with the memory the CALLER gives (today\'s word included), the end light — then return',
    (() => { const i1 = BR.indexOf('setSessionEnded(true)'), i2 = BR.indexOf('armRecognitionCards(echoInfo.mem)'), i3 = BR.indexOf('applyTerminationIllumination()'), i4 = BR.lastIndexOf('return;');
      return i1 > 0 && i2 > i1 && i3 > i2 && i4 > i3; })());
  assert('NEW — (3.6) the recognition cards are MOVED, not removed and not copied: ONE function armRecognitionCards inside deliverFinalClosure, called three times (the model\'s closing, its failure path, the closing from code)',
    count(P2, /const armRecognitionCards = \(memory\) => \{/g) === 1 && count(P2, /armRecognitionCards\(memory\);/g) === 2 && count(P2, /armRecognitionCards\(echoInfo\.mem\);/g) === 1);
  assert('NEW — (3.7) … and the two kinds of card are written ONCE each in the whole file (RECURRING and DIVERGENCE) — the old code had each twice',
    count(raw, /setRecognitionPending\(\{ kind: "recurring"/g) === 1 && count(raw, /setRecognitionPending\(\{ kind: "divergence"/g) === 1);
  assert('GUARD — (3.8) the arming code is the old code word for word where it counts: the gates (rejected, recently shown), the «never two cards in one closing» flag, the consent before any write',
    /if \(_sig && !isPatternRejected\(memory, _key\) && !wasPatternRecentlyShown\(memory, _key, _sig\.count\)\) \{/.test(P2) && /if \(!_gateArmed && _kw\) \{/.test(P2) &&
    /if \(!isPatternRejected\(memory, _dKey\) && !wasPatternRecentlyShown\(memory, _dKey, _dCount\)\) \{/.test(P2) && count(P2, /if \(memory\.storageEnabled\)/g) >= 3 && /\/\* the gate must never block a closing \*\//.test(P2));
  assert('GUARD — (3.9) the model\'s closing is still there for every other case: «Deliver Part 2 now», the LITERAL ECHO instruction, the call with SYSTEM_TERMINATION, the final check',
    /Deliver Part 2 now/.test(P2) && /LITERAL ECHO/.test(P2) && /await callAura\(finalMsgs, SYSTEM_TERMINATION\)/.test(P2) && /closingFinish\(shownText, msgs\)/.test(P2) && /Η σκέψη σου παραμένει δική σου\./.test(P2));
  assert('GUARD — (3.10) the deps line of deliverFinalClosure is as before (a pin of other tests): }, [applyTerminationIllumination]);', raw.includes('\n  }, [applyTerminationIllumination]);\n'));
  assert('GUARD — (3.11) the early-word closing of the OLD flow (triggerTermination) calls deliverFinalClosure as before — no codeClosing there',
    raw.includes('await deliverFinalClosure(msgs, { word: capturedWord, count: priorEchoCount });'));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 4. the caller: the word of Stage A (handleSubmit)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const HS = blockFrom('const handleSubmit = useCallback(');
  const w = HS.indexOf('// Word-to-remember: save as a real anchor'), seg = w < 0 ? '' : HS.slice(w, HS.indexOf('return;', HS.indexOf('await deliverFinalClosure(', w)) + 7);
  assert('TEST SETUP — the word branch of handleSubmit was located', seg.length > 800 && seg.includes('const priorEchoCount') && seg.includes('await deliverFinalClosure('));
  assert('NEW — (4.1) the Stage A phase is read into a const BEFORE the dispatch moves it to «done»: const _saWord = stageAActive.current && stageARef.current.phase === "word";',
    /const _saWord = stageAActive\.current && stageARef\.current\.phase === "word";/.test(seg) && seg.indexOf('const _saWord') < seg.indexOf('stageADispatch({ type: "word"'));
  assert('NEW — (4.2) the call hands over what the code needs: codeClosing (the Stage A word phase, and no crisis line on the screen) and mem: withAnchor — the memory WITH today\'s word, so a count includes today',
    seg.includes('await deliverFinalClosure([...messages, { role: "user", content: userText }], { word: userText, count: _saSame ? 0 : priorEchoCount, codeClosing: _saWord && !crisisFallback, mem: withAnchor });'));
  assert('GUARD — (4.3) the anchor of the word is still saved first, in memory and (with consent) on the device, exactly as before',
    /const withAnchor = createAnchor\(\{ \.\.\.memory \}, userText, TRAJECTORY_WORD_CATEGORY, "resolved", \{ before: beforeText, shift: shiftText, peak: peakText \}\);/.test(seg) && /setMemory\(withAnchor\);/.test(seg) && /if \(willPersist\) saveMemory\(withAnchor, true\);/.test(seg));
  assert('GUARD — (4.4) a word equal to «Τι βρήκες» still counts 0 (no echo of it): count: _saSame ? 0 : priorEchoCount', seg.includes('count: _saSame ? 0 : priorEchoCount'));
  assert('GUARD — (4.5) the safety conditions of the word branch are as before (a crisis phrase, danger from another person, Ο5 in Stage A)',
    /if \(awaitingRememberedWord && !detectSafetySignal\(userText\) && !detectsDangerFromOther\(userText\) && !\(stageAActive\.current && dangerFromOther\.current\)\) \{/.test(HS));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 5. nothing else moved
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'));
  const fp = api.toString('utf8').match(/core: \{ length: \d+, sha256: "([0-9a-f]{16})/);
  assert('GUARD — (5.1) the core prompt is still 7e52268becda7360 and api/aura.js is byte for byte the same (sha256 675564a7985438c8…): this item is code only', !!fp && fp[1] === '7e52268becda7360' && sha(api).startsWith('675564a7985438c8'));
  assert('GUARD — (5.2) line 912 of src/App.jsx is the same (sha256 of the line)', sha(raw.split('\n')[911]).startsWith('287fb3ce5ee3c1fb'));
  assert('GUARD — (5.3) the fixed line of the map, John\'s words: «Ωραία, το πρώτο επόμενο βήμα είναι αυτό.»', /closing: "Ωραία, το πρώτο επόμενο βήμα είναι αυτό\.",/.test(raw));
  assert('GUARD — (5.4) the model\'s closing of the OLD flow is the one the safety tests know: SYSTEM_TERMINATION is still called in exactly three places (the closing ×3), no new call of the model anywhere',
    count(raw, /closingSafe\(await callAura\(\w+, SYSTEM_TERMINATION\), msgs\)/g) === 3);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
