// AURA — PACKAGE 1 (John, 19/11/2026; an exception to the freeze for THIS package only; branch conversation-v1).
//
//   (1) «2η φορά»      — when the APP asks the root a second time in a session, it first shows up to 3 of the user's own earlier sentences, verbatim (an
//                        A8-like filter); a tap COPIES one into the box, the user corrects it and sends it himself; «Καμία από αυτές» closes the list;
//                        it does not read the text of any answer; never on the safety path; once per session.
//   (1b) the list's three counters (John's addition, 20/11/2026) — list_shown / list_picked / list_none: NUMBERS ONLY in the device log, no text anywhere (section 9).
//   (2) «ρίζα χωρίς νέα λόγια» — a passive counter: two integers in the device log (root_new_words), no text anywhere.
//   (3) ONE note per round — when the ROUND TYPE note («this reply must not end with a question») is in the request, the NEW MATERIAL note
//                        («… Ask for what they have NOT said yet.») is not.
//   (4) the prompt — three lines of AURA_CORE_PERSONALITY — is the second commit of the package, with its own test: auratests/test_package1_prompt_1911.js.
//   (5) what must NOT move: the reducer, the fixed texts, the detectors, the readiness reader, the safety path.
//
// Test-first (John): every assertion labelled NEW fails on 4ec72b0 (conversation-v1 before the package) and passes after; GUARD assertions are green
// before and after on purpose (they pin what must not move). All text here is synthetic: no word of any real session.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1);
  const line = raw.slice(a + 1, eol); if (/;\s*(?:\/\/.*)?$/.test(line)) return line; return raw.slice(a + 1, raw.indexOf('\n];', a) + 3); };
const objSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = {'); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n};', a) + 3); };

const CONSTS = ['HELPLINES', 'KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS', 'ROOT_DISMISSALS', 'SPEAK_RIGHT_JACCARD', 'SPEAK_RIGHT_ABBR',
  'SPEAK_RIGHT_DISMISS_START', 'SPEAK_RIGHT_HEAVY_WORDS', 'SPEAK_RIGHT_CONTENT_WORDS',
  'ROOT_PICK_MAX', 'ROOT_PICK_MAX_CHARS', 'ROOT_PICK_TRIM_YES', 'ROOT_PICK_TRIM_DK', 'ROOT_PICK_NO_START', 'ROOT_PICK_DEICTIC', 'ROOT_PICK_SELF_LABEL',
  'ROOT_PICK_SELF_BLAME', 'ROOT_PICK_ADDRESSED', 'ROOT_PICK_FILLER', 'ROOT_PICK_CONNECTOR', 'ROOT_PICK_TEXTS'];
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'splitSentences', 'rootTextHasSubstance', 'speakRightSpans', 'speakRightEndsWithQuestion', 'speakRightJaccard',
  'branchSessionSafe', 'detectsCoreReadinessAsked', 'rootAskNumber', 'rootPickSentences', 'rootPickView', 'rootNewWordCount',
  'repeatedElementsForRound', 'roundTypeNoteSent', 'describeRepeatedElementsCtx', 'describeRoundTypeCtx', 'trailingQuestionReplies',
  'userSaysDontKnowTwice', 'repeatedUserElements', 'recordTelemetry', 'buildTesterExport', 'rootPickRecord'];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ', HELPLINES, ROOT_PICK_MAX, ROOT_PICK_MAX_CHARS, ROOT_PICK_TEXTS };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw: ' + e.message; } };
const isArr = Array.isArray;

// ── synthetic conversation builders ─────────────────────────────────────────────────────────────────────────────
const U = t => ({ role: 'user', content: t });
const A = t => ({ role: 'assistant', msgMode: 'ANSWER', content: t });
const S = t => ({ role: 'assistant', msgMode: 'STAGE_A', content: t });
const READY_Q = 'Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι πραγματικά σε απασχολεί;';
const ENTRANCE = 'Δεν ξέρω αν πρέπει να αλλάξω γραφείο, με πιέζει το πρόγραμμα.';
const G1 = 'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο.';
const G2 = 'Θέλω περισσότερο χρόνο για την οικογένειά μου.';
const G3 = 'Η μετακίνηση παίρνει δύο ώρες κάθε μέρα.';
const G4 = 'Ο μισθός είναι καλός και με κρατά εκεί.';
const G5 = 'Οι συνάδελφοι με στηρίζουν στις δύσκολες μέρες.';
const Q = ['Τι άλλο υπάρχει εκεί;', 'Και τι θα άλλαζε με αυτό;', 'Πες μου περισσότερα για αυτό;', 'Τι έχει σημασία εδώ;', 'Τι κρατά το πράγμα στη θέση του;', 'Τι λείπει ακόμα;'];
// a session: the entrance, then (question, answer) pairs
const conv = (...answers) => { const out = [U(ENTRANCE)]; answers.forEach((a, i) => { out.push(A(Q[i % Q.length])); out.push(typeof a === 'string' ? U(a) : a); }); return out; };
const texts = r => isArr(r) ? r.map(x => x.text) : ['<not a list: ' + String(r) + '>'];
const pick = m => call('rootPickSentences', m);
const SAFE = { phase: 'ask', askNo: 2, done: false, riskKind: 0, dangerFromOther: false, safetyMode: false, crisisFallback: null };
const view = (m, over) => call('rootPickView', Object.assign({}, SAFE, { messages: m }, over || {}));

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1. «2η φορά» — which ask is this?   rootAskNumber(messages, appAsksBefore, door2Asks)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const an = (m, a, d) => call('rootAskNumber', m, a, d);
  const base = conv(G1, G2);
  assert('NEW — (1.1) the first ask of a session, with nothing asked before, is number 1', an(base, 0, 0) === 1);
  assert('NEW — (1.2) one earlier ask of the APP (a button press, a leaving door, a re-ask) makes the next one number 2', an(base, 1, 0) === 2 && an(base, 2, 0) === 3);
  const withReady = [U(ENTRANCE), A(READY_Q), U('Ναι στο είπα ήδη'), A(Q[0]), U(G1)];
  assert('NEW — (1.3) John\'s session: the model asked the readiness question and it was not answered by a «Ναι» that opened the root question → the first ask of the APP is number 2',
    an(withReady, 0, 0) === 2);
  assert('NEW — (1.4) … but a readiness question that DID open the root question (door 2 — the user\'s «Ναι») is the same ask, not an earlier one: number 1', an(withReady, 0, 1) === 1);
  const twoReady = [U(ENTRANCE), A(READY_Q), U('Όχι ακόμα'), A(Q[0]), U(G1), A(READY_Q), U('Ναι')];
  assert('NEW — (1.5) two readiness questions, the second opened the root question (door 2) → the first one still counts: number 2', an(twoReady, 0, 1) === 2);
  assert('NEW — (1.6) the app\'s own fixed text (STAGE_A) that happens to hold the readiness words is not a readiness question of the model',
    an([U(ENTRANCE), S(READY_Q), U(G1)], 0, 0) === 1);
  assert('NEW — (1.7) it only reads AURA\'s questions and counters — never a user message: the same number (2) whatever the user wrote',
    an([U(ENTRANCE), A(READY_Q), U('Στο είπα ήδη')], 0, 0) === 2 && an([U(ENTRANCE), A(READY_Q), U('κάτι εντελώς άλλο')], 0, 0) === 2);
  assert('NEW — (1.8) junk in, a sane number out: never below 1, never throws',
    [[null, 0, 0], [undefined, undefined, undefined], ['x', 'y', 'z'], [[], -3, -1], [[null, 5, {}], NaN, Infinity]].every(a => Number.isInteger(an(...a)) && an(...a) >= 1));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 2. the sentences   rootPickSentences(messages) → [{ text, msg, start, end }]   (0, or 2–3)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const m3 = conv(G1, G2, G3);
  const r3 = pick(m3);
  assert('NEW — (2.1) three good answers → three sentences, in time order, each an exact piece of what the user typed (text === content.slice(start, end))',
    isArr(r3) && r3.length === 3 && r3.every(x => m3[x.msg].content.slice(x.start, x.end) === x.text) && r3.every((x, i, a) => i === 0 || a[i - 1].msg < x.msg)
    && JSON.stringify(texts(r3)) === JSON.stringify([G1, G2, G3]));
  assert('NEW — (2.2) one sentence per message: they come from different messages', isArr(r3) && new Set(r3.map(x => x.msg)).size === r3.length);
  assert('NEW — (2.3) fewer than two sentences are no list at all (the user is never offered "the" sentence): 0 and 1 → []',
    JSON.stringify(pick(conv(G1))) === '[]' && JSON.stringify(pick(conv())) === '[]');
  const m5 = conv(G1, G2, G3, G4, G5);
  assert('NEW — (2.4) more than three → the first, the middle and the last (limit 3)', JSON.stringify(texts(pick(m5))) === JSON.stringify([G1, G3, G5]) && F.ROOT_PICK_MAX === 3);
  assert('NEW — (2.5) the entrance (the first message of the user) is never a source',
    isArr(pick(m3)) && pick(m3).length === 3 && !texts(pick(m3)).some(t => ENTRANCE.includes(t)) && JSON.stringify(pick([U(G1), A(Q[0]), U(G2)])) === '[]');
  assert('NEW — (2.6) the reply to the readiness question is about the process, not the topic: excluded by its POSITION (no word list)',
    JSON.stringify(texts(pick([U(ENTRANCE), A(Q[0]), U(G1), A(READY_Q), U('Ναι, ο μισθός με κρατά εδώ πολύ καιρό.'), A(Q[1]), U(G2)]))) === JSON.stringify([G1, G2]));
  assert('NEW — (2.7) only an answer to a real question of AURA counts: after the app\'s own text, or after a statement, the message is not a source',
    JSON.stringify(texts(pick([U(ENTRANCE), A(Q[0]), U(G1), S('Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;'), U(G3), A('Το καταλαβαίνω.'), U(G4), A(Q[1]), U(G2)]))) === JSON.stringify([G1, G2]));

  // the exclusion rules — each: a good answer, the answer under test, a good answer; the sentence under test must be absent and the two good ones present
  const BAD = [
    ['a question', 'Μήπως ο χρόνος είναι το θέμα;'],
    ['addressed to AURA («σου»)', 'Σου είπα ότι το ωράριο με πιέζει.'],
    ['an answer to a question we do not show («Όχι…»)', 'Όχι, το ωράριο δεν είναι το πρόβλημα.'],
    ['points at something the list does not show («ισχύει»)', 'Ισχύει αυτό που είπες για το ωράριο.'],
    ['points at something the list does not show («όπως είπες»)', 'Όπως είπες, το ωράριο με πιέζει πολύ.'],
    ['a filler start («Ωραία,»)', 'Ωραία, το ωράριο με πιέζει πολύ.'],
    ['a connector start («Και…»)', 'Και το ωράριο με πιέζει πολύ.'],
    ['a connector start («Αλλά…»)', 'Αλλά το ωράριο με πιέζει πολύ.'],
    ['a connector start («Δεν ξέρω, …»)', 'Δεν ξέρω, το ωράριο με πιέζει πολύ.'],
    ['a self-label (χαζ-)', 'Είμαι χαζός που μένω εδώ.'],
    ['self-blame (φταίω)', 'Φταίω εγώ για το ωράριο μου.'],
    ['fewer than two words with substance', 'Το ωράριο.'],
    ['a dismissal («Άστο»)', 'Άστο.'],
    ['«I don\'t know» alone', 'Δεν ξέρω.'],
    ['a goodbye', 'Ευχαριστώ, τα λέμε.'],
    ['longer than 200 characters', 'Το ωράριο είναι βαρύ ' + 'και δεν αφήνει καθόλου χρόνο ελεύθερο για τη ζωή μου '.repeat(5) + 'τελικά.'],
  ];
  for (const [why, bad] of BAD) {
    const r = texts(pick(conv(G1, bad, G2)));
    assert('NEW — (2.8) excluded: ' + why, isArr(r) && JSON.stringify(r) === JSON.stringify([G1, G2]));
  }
  // a rejected sentence is replaced by the next sentence of the same message (A8: tryNext)
  assert('NEW — (2.9) a rejected first sentence is replaced by the next one of the same message',
    JSON.stringify(texts(pick(conv(G1, 'Και το ωράριο με πιέζει πολύ. ' + G3, G2)))) === JSON.stringify([G1, G3, G2]));
  // the lead-in is cut, the rest is still an exact piece
  const mt = conv(G1, 'Ναι, ακριβώς το ωράριο με πιέζει πολύ.', G2);
  const rt = pick(mt);
  assert('NEW — (2.10) a leading «Ναι, ακριβώς,» is cut off; what is left is still an exact piece of the message', isArr(rt) && rt.length === 3 && rt[1].text === 'το ωράριο με πιέζει πολύ.'
    && mt[rt[1].msg].content.slice(rt[1].start, rt[1].end) === rt[1].text);
  const md = pick(conv(G1, 'Δεν ξέρω... ο μισθός με κρατά εδώ πολύ καιρό.', G2));
  assert('NEW — (2.11) a leading «Δεν ξέρω…» (with the dots) is cut off the same way', isArr(md) && md.length === 3 && md[1].text === 'ο μισθός με κρατά εδώ πολύ καιρό.');
  assert('NEW — (2.12) a near copy of a sentence already chosen is left out (Jaccard ≥ 0.6)',
    JSON.stringify(texts(pick(conv(G1, 'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για άλλα πράγματα.', G2)))) === JSON.stringify([G1, G2]));
  assert('NEW — (2.13) a sentence identical to the question it answers is left out (the previous question is not offered back as the user\'s)',
    JSON.stringify(texts(pick([U(ENTRANCE), A('Τι κρατά το πράγμα στη θέση του;'), U('Τι κρατά το πράγμα στη θέση του'), A(Q[1]), U(G1), A(Q[2]), U(G2)]))) === JSON.stringify([G1, G2]));
  assert('NEW — (2.14) every sentence offered passes the root rule as it is: sent unchanged it becomes a root card, not the «say it more fully» line',
    isArr(r3) && r3.every(x => call('rootTextHasSubstance', x.text) === true) && isArr(rt) && rt.every(x => call('rootTextHasSubstance', x.text) === true));
  assert('NEW — (2.15) none of them is a safety phrase, a dismissal, a closing',
    isArr(r3) && r3.every(x => !call('detectSafetySignal', x.text) && !call('detectsDangerFromOther', x.text) && !call('rootAnswerIsDismissal', x.text) && !call('isExplicitClosure', x.text)));
  // purity
  const frozen = JSON.stringify(m3);
  pick(m3);
  assert('NEW — (2.16) it does not change what it is given, and never throws on junk',
    JSON.stringify(m3) === frozen && [null, undefined, 'x', 5, {}, [null], [{}], [{ role: 'user' }], [{ role: 'user', content: 5 }]].every(j => JSON.stringify(pick(j)) === '[]'));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 3. the gate   rootPickView(o) → null | { sentences }   — second ask, once, never on the safety path
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const good = conv(G1, G2, G3);
  const v = view(good);
  assert('NEW — (3.1) second ask, nothing wrong → the list (3 sentences)', v && isArr(v.sentences) && v.sentences.length === 3);
  assert('NEW — (3.2) the first ask shows nothing', view(good, { askNo: 1 }) === null && view(good, { askNo: 0 }) === null);
  assert('NEW — (3.3) once per session: when it was shown before (done), never again', view(good, { done: true }) === null);
  assert('NEW — (3.4) only at the root question (phase "ask")', ['card', 'correct', 'offer', 'step', 'clarity', 'done', null, undefined].every(p => view(good, { phase: p }) === null));
  assert('NEW — (3.5) NEVER on the safety path — the app\'s latch: crisis A, crisis B, DISTRESS, danger from another person, safety mode, the failed-call crisis line',
    [{ riskKind: 1 }, { riskKind: 2 }, { riskKind: 3 }, { dangerFromOther: true }, { safetyMode: true }, { crisisFallback: 'γραμμή' }].every(o => view(good, o) === null));
  assert('NEW — (3.6) NEVER when a reply of AURA in the session was supportive, referred to a professional, or carried a number of the help-line table',
    view(conv(G1, G2, G3).concat([{ role: 'assistant', msgMode: 'SUPPORTIVE', content: 'Είμαι εδώ.' }])) === null
    && view([U(ENTRANCE), A('Αυτό ακούγεται βαρύ. Κάλεσε το ' + (F.HELPLINES && F.HELPLINES[0] ? F.HELPLINES[0].number : '112') + '.'), U(G1), A(Q[0]), U(G2), A(Q[1]), U(G3)]) === null);
  assert('NEW — (3.7) fewer than two sentences → nothing', view(conv(G1)) === null && view([]) === null);
  assert('NEW — (3.8) junk in, null out, never throws', [null, undefined, {}, 5, 'x', { phase: 'ask', askNo: 2 }, { phase: 'ask', askNo: 2, messages: 'x' }].every(o => call('rootPickView', o) === null));
  assert('NEW — (3.9) the gate has no argument for what the user typed: only the phase, the ask number, the flags and the conversation',
    /function rootPickView\(o\)/.test(fnSrc('rootPickView')) && !/\b(?:userText|input|answer)\b/.test(fnSrc('rootPickView')) && !/\b(?:userText|input)\b/.test(fnSrc('rootAskNumber')));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 4. the passive counter   rootNewWordCount(found, msgs) → { newWords, rootWords }   (two integers)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const nw = (found, m) => call('rootNewWordCount', found, m);
  const same = JSON.stringify;
  const early = [U(ENTRANCE), A(Q[0]), U(G2), A(Q[1]), U(G1)];
  const rootOld = 'Θέλω περισσότερο χρόνο για την οικογένειά μου.';
  const r0 = nw(rootOld, early.concat([S('Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;'), U(rootOld)]));
  assert('NEW — (4.1) a root made only of words the user had already written → newWords 0 (and the root has words)', r0 && r0.newWords === 0 && r0.rootWords >= 3);
  const rootMixed = 'Θέλω περισσότερο χρόνο και ησυχία για την οικογένειά μου.';
  const r1 = nw(rootMixed, early.concat([U(rootMixed)]));
  assert('NEW — (4.2) one word that is new → newWords 1', r1 && r1.newWords === 1 && r1.rootWords >= 4);
  assert('NEW — (4.3) the root\'s own message is not "earlier": a word that appears only there is new',
    nw('ησυχία ανάγκη', [U(ENTRANCE), A(Q[0]), U('ησυχία ανάγκη')]).newWords === 2);
  assert('NEW — (4.4) accents, capitals and the final sigma do not matter', same(nw('ΩΡΑΡΙΟ ΒΑΡΥ', [U(ENTRANCE), A(Q[0]), U(G1), A(Q[1]), U('ΩΡΑΡΙΟ ΒΑΡΥ')])) === same({ newWords: 0, rootWords: 2 }));
  const corrected = nw('ωράριο και ησυχία', early);
  assert('NEW — (4.5) a corrected root (typed in the correction box, so in no message) is judged against ALL the earlier messages', corrected && corrected.newWords === 1 && corrected.rootWords === 2);
  assert('NEW — (4.6) only the USER\'s earlier words count: a word first said by AURA is still new for the root',
    nw('ησυχία', [U(ENTRANCE), A('Η ησυχία λείπει;'), U('Ναι ησυχία')]).newWords === 1);
  assert('NEW — (4.7) small words (under 4 letters, the stop list) are not counted at all', same(nw('και για την', [U(ENTRANCE), U('και για την')])) === same({ newWords: 0, rootWords: 0 }));
  assert('NEW — (4.8) the result is two integers in 0–9999 and nothing else (no text), and newWords ≤ rootWords',
    [r0, r1, corrected].every(r => r && Object.keys(r).sort().join() === 'newWords,rootWords' && Number.isInteger(r.newWords) && Number.isInteger(r.rootWords) && r.newWords <= r.rootWords && r.rootWords <= 9999));
  assert('NEW — (4.9) junk in, zeros out, never throws', [[null, null], [undefined, 'x'], [5, [null]], ['', []], ['λέξη', 'x']].every(([f, m]) => { const r = nw(f, m); return r && r.newWords >= 0 && r.rootWords >= 0; }));
  const rec = call('recordTelemetry', 'root_new_words', r1);
  assert('NEW — (4.10) recordTelemetry keeps both numbers under one event name, and the tester export carries them',
    rec && rec.ev === 'root_new_words' && rec.newWords === 1 && rec.rootWords === r1.rootWords && Object.keys(rec).sort().join() === 'ev,newWords,rootWords,t'
    && (() => { const ex = call('buildTesterExport', [rec], 'x'); return ex && ex.events && ex.events[0] && ex.events[0].newWords === 1 && ex.events[0].ev === 'root_new_words'; })());
  const ce = (() => { const a = raw.indexOf('const rootNewWordsLogged = useRef(false);'), b = raw.indexOf('}, [stageAPhase]); // eslint-disable-line react-hooks/exhaustive-deps', raw.indexOf('// PACKAGE 1, item 2 (John, 19/11/2026) — «ρίζα χωρίς νέα λόγια»: PASSIVE.')); return a < 0 || b < 0 ? '' : raw.slice(raw.indexOf('// PACKAGE 1, item 2 (John, 19/11/2026) — «ρίζα χωρίς νέα λόγια»: PASSIVE.'), b); })();
  assert('NEW — (4.11) it is recorded once per session, in an effect of its own, when the root is confirmed (stats.rootConfirmed === 1), with the two numbers and nothing else; not inside handleStageAYes',
    /const rootNewWordsLogged = useRef\(false\);/.test(raw) && ce.length > 100 && /if \(!stageAActive\.current \|\| rootNewWordsLogged\.current \|\| stageARef\.current\.stats\.rootConfirmed !== 1\) return;/.test(ce) && /rootNewWordsLogged\.current = true;/.test(ce)
    && /recordTelemetry\("root_new_words", rootNewWordCount\(stageARef\.current\.found, messages\)\);/.test(ce) && !/root_new_words/.test(raw.slice(raw.indexOf('const handleStageAYes = useCallback('), raw.indexOf('const handleStageAStepButton = useCallback('))));
  assert('NEW — (4.12) it is passive: nothing reads it (no variable receives it), no text, no storage, no network in the function',
    fnSrc('rootNewWordCount').length > 200 && !/=\s*rootNewWordCount\(/.test(raw) && !/\b(?:window|localStorage|sessionStorage|fetch|XMLHttpRequest|console|navigator)\b/.test(fnSrc('rootNewWordCount')));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 5. ONE note per round   repeatedElementsForRound(newMaterialNote, roundTypeNote)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  // a request like the 6th round of John's session, with synthetic words: five replies in a row end with a question, and a pair of the
  // user's words has been said back already → BOTH notes are due
  const echoUser = 'Νιώθω ότι υπάρχει έλλειψη φαντασίας στη δουλειά μου.';
  const six = [U(echoUser), A('Η έλλειψη φαντασίας φαίνεται συχνά; Πότε το πρόσεξες;'), U('Από πέρυσι.'), A('Τι έγινε πέρυσι;'), U('Άλλαξε η ομάδα.'),
    A('Τι άλλαξε με την ομάδα;'), U('Έφυγαν δύο άνθρωποι.'), A('Πώς σε επηρέασε αυτό;'), U('Έμεινα μόνος.'), A('Τι σημαίνει μόνος εδώ;'), U('Δεν έχω με ποιον να μιλήσω.')];
  const elems = call('repeatedUserElements', six);
  const newMaterial = call('describeRepeatedElementsCtx', elems, true);
  const roundType = call('describeRoundTypeCtx', true, false, six);
  assert('GUARD — (5.1) the opposing pair exists as the code stands: NEW MATERIAL says «Ask for what they have NOT said yet.», ROUND TYPE says «must not end with a question»; a request like John\'s 6th round carries both',
    typeof newMaterial === 'string' && /Ask for what they have NOT said yet\./.test(newMaterial) && typeof roundType === 'string' && /this reply must not end with a question/.test(roundType));
  assert('NEW — (5.2) with the ROUND TYPE note in the request, the NEW MATERIAL note is not sent: exactly one of the two', call('repeatedElementsForRound', newMaterial, roundType) === '');
  assert('NEW — (5.3) … also when the ROUND TYPE note is the head of the one note with the offer to say back a connection, or with its follow-up',
    call('repeatedElementsForRound', newMaterial, roundType.slice(0, roundType.lastIndexOf(']')) + ' AND because the material is also enough …]\n') === ''
    && call('repeatedElementsForRound', newMaterial, roundType.slice(0, roundType.lastIndexOf(']')) + ' ALSO, the previous reply …]\n') === '');
  assert('NEW — (5.4) without the ROUND TYPE note the NEW MATERIAL note is sent exactly as it was (also next to the offer alone, which does not forbid a question)',
    call('repeatedElementsForRound', newMaterial, '') === newMaterial && call('repeatedElementsForRound', newMaterial, undefined) === newMaterial
    && call('repeatedElementsForRound', newMaterial, '\n[CODE-VERIFIED: this reply may say back a connection between things the user gave. …]\n') === newMaterial);
  assert('NEW — (5.5) nothing to withdraw, nothing returned; junk in, empty out', call('repeatedElementsForRound', '', roundType) === '' && call('repeatedElementsForRound', null, roundType) === ''
    && call('repeatedElementsForRound', undefined, undefined) === '' && call('repeatedElementsForRound', 5, '') === '');
  // wiring, in the one place where the request is built
  const gi = raw.indexOf('const repeatedElementsCtx = ') >= 0 ? raw.indexOf('const repeatedElementsCtx = ') : raw.indexOf('let repeatedElementsCtx = ');
  const iType = raw.indexOf('const roundTypeCtx = describeSpeakRightCtx(');
  const iUse = raw.indexOf('repeatedElementsCtx = repeatedElementsForRound(repeatedElementsCtx, roundTypeCtx);');
  const iSuffix = raw.indexOf('const dynamicSuffix = [');
  assert('NEW — (5.6) in the request: the note is computed as before (let, so it can be withdrawn), withdrawn right after the ROUND TYPE note is known, and before the notes are joined',
    raw.includes('let repeatedElementsCtx = _notSupportive ? describeRepeatedElementsCtx(repeatedUserElements(msgs), !_safetyPath) : \'\';') && gi > 0 && iType > gi && iUse > iType && iSuffix > iUse);
  const arr = (raw.match(/const dynamicSuffix = \[([\s\S]*?)\]\.filter\(Boolean\)/) || ['', ''])[1];
  const fired = (raw.match(/const fired = Object\.entries\(\{([\s\S]*?)\}\)\.filter/) || ['', ''])[1];
  assert('GUARD — (5.7) the note keeps its name in the joined list and in the collision log (the families-used count and the api tests read the names)',
    /\brepeatedElementsCtx\b/.test(arr) && /\brepeatedElementsCtx\b/.test(fired));
  assert('GUARD — (5.8) the two notes themselves, and the test that tells ROUND TYPE from the rest, are the ones of 4ec72b0 (byte for byte)',
    sha(fnSrc('describeRepeatedElementsCtx')).startsWith('16b8fa9e581ac0d6') && sha(fnSrc('describeRoundTypeCtx')).startsWith('5a1d0d418d34300b') && sha(fnSrc('roundTypeNoteSent')).startsWith('6bff8981c2bdd215'));
  assert('NEW — (5.9) it does not touch the safety path: the helper is only about two notes, calls no detector and reads nothing but the two notes',
    fnSrc('repeatedElementsForRound').length > 80 && !/\b(?:detect|classify|riskSignalKind|dangerFromOther|safetyMode)\w*/.test(fnSrc('repeatedElementsForRound').replace(/function repeatedElementsForRound/, '')));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 6. the component — what the screen does (source checks; the browser run is section P1 of scripts/e2e_stage_a.cjs)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const eff = (() => { const a = raw.indexOf('// ROOT PICK EFFECT — BEGIN'), b = raw.indexOf('// ROOT PICK EFFECT — END'); return a >= 0 && b > a ? raw.slice(a, b) : ''; })();
  const reset = (() => { const a = raw.indexOf('const resetSession = () => {'); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n  };', a)); })();
  const tap = (() => { const a = raw.indexOf('const handleRootPickTap = '); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1); })();
  const none = (() => { const a = raw.indexOf('const handleRootPickNone = '); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1); })();
  const ask = (() => { const a = raw.indexOf('{stageAPhase === "ask" && ('); return a < 0 ? '' : raw.slice(a, raw.indexOf('{(stageAPhase === "card"', a)); })();
  assert('NEW — (6.1) page state: the list on screen (rootPick) and the four counters, all of them in the component',
    /const \[rootPick, setRootPick\] = useState\(null\);/.test(raw) && ['rootAskSeen', 'rootAsksBefore', 'rootDoor2Asks', 'rootPickDone'].every(n => new RegExp('const ' + n + '\\s*= useRef\\(').test(raw)));
  assert('NEW — (6.2) the effect that decides: it checks the Stage A switch first, then calls the gate (rootPickView) with the phase, the ask number and the session\'s flags — the same four the Thought Map reads',
    eff.length > 0 && /rootPickView\(/.test(eff) && /riskSignalKind\.current/.test(eff) && /dangerFromOther\.current/.test(eff) && /\bsafetyMode\b/.test(eff) && /\bcrisisFallback\b/.test(eff)
    && /rootAskNumber\(/.test(eff) && /rootPickDone\.current = true/.test(eff) && /if \(!stageAActive\.current\) return;/.test(eff));
  assert('NEW — (6.3) the effect never reads what the user typed or how an answer was understood (no input, no userText, no root/«Ναι» reader)',
    eff.length > 0 && !/\b(?:input|userText)\b|rootTextHasSubstance|rootAnswerIs|detectsAffirmativeShort|answersReadinessQuestion|handleSubmit/.test(eff));
  // UPDATED 20/11/2026 (John's addition: telemetry for the list, NUMBERS ONLY): the effect used to record nothing; now its one record is list_shown, written through rootPickRecord —
  // a number (how many sentences) and nothing else — right where the list is set. Still no storage, no network, no console of its own.
  assert('NEW — (6.4) the effect stores nothing and sends nothing (no storage, no network, no console of its own); the ONE thing it records is list_shown, through rootPickRecord, with a number',
    eff.length > 0 && !/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|console\./.test(eff) && (eff.match(/recordTelemetry\(/g) || []).length === 1
    && /rootPickRecord\("shown", v\.sentences\.length\)/.test(eff) && /recordTelemetry\(_r\.event, _r\.fields\)/.test(eff));
  assert('NEW — (6.5) the list goes away when the root question goes away (the phase leaves "ask")', eff.length > 0 && /setRootPick\(null\)/.test(eff));
  assert('NEW — (6.6) a new session starts clean: the list, the ask counters and the once-per-session latch are all reset in resetSession',
    reset.length > 0 && /setRootPick\(null\)/.test(reset) && /rootAsksBefore\.current = 0/.test(reset) && /rootDoor2Asks\.current = 0/.test(reset) && /rootPickDone\.current = false/.test(reset) && /rootAskSeen\.current = /.test(reset) && /rootNewWordsLogged\.current = false/.test(reset));
  // UPDATED 20/11/2026 (John's addition): the tap and «Καμία από αυτές» each write ONE number-only record (list_picked with the place of the sentence, list_none), through rootPickRecord.
  assert('NEW — (6.7) a tap COPIES the sentence into the box (setInput) and gives the box the focus: it sends nothing, opens no card, adds no bubble, changes no state of the flow; its one record is list_picked with the PLACE of the sentence (a number), never the sentence',
    tap.length > 0 && /setInput\(/.test(tap) && !/handleSubmit|generateResponse|stageADispatch|stageAOpen|addUiBubble|setMessages|setRootPick/.test(tap)
    && /const handleRootPickTap = \(t, i\) =>/.test(tap) && /rootPickRecord\("picked", i \+ 1\)/.test(tap) && (tap.match(/recordTelemetry\(/g) || []).length === 1 && /recordTelemetry\(_r\.event, _r\.fields\)/.test(tap)
    && !/recordTelemetry\([^)]*\bt\b/.test(tap) && !/rootPickRecord\([^)]*\bt\b/.test(tap));
  assert('NEW — (6.8) «Καμία από αυτές» closes the list (and gives the box the focus): no event of the flow, no message, no text; its one record is list_none',
    none.length > 0 && /setRootPick\(null\)/.test(none) && !/handleSubmit|generateResponse|stageADispatch|stageAOpen|addUiBubble|setMessages|setInput/.test(none)
    && /rootPickRecord\("none"\)/.test(none) && (none.match(/recordTelemetry\(/g) || []).length === 1 && /recordTelemetry\(_r\.event, _r\.fields\)/.test(none));
  assert('NEW — (6.9) on the screen: inside the root question\'s card, the title, one button per sentence, then «Καμία από αυτές», before the «Δεν το βρήκα ακόμα» button',
    ask.length > 0 && ask.indexOf('rootPick') > 0 && ask.indexOf('ROOT_PICK_TEXTS.title') > 0 && ask.indexOf('handleRootPickTap') > 0 && ask.indexOf('ROOT_PICK_TEXTS.none') > ask.indexOf('handleRootPickTap')
    && ask.indexOf('handleStageABack') > ask.indexOf('ROOT_PICK_TEXTS.none'));
  assert('NEW — (6.10) the user\'s words are shown as typed: the buttons switch the capital letters of the app\'s button style off (text-transform none)', /textTransform:\s*"none"/.test(ask));
  assert('NEW — (6.11) the only new fixed texts are the title and «Καμία από αυτές» (John\'s words), kept apart from the reducer\'s STAGE_A_TEXTS; no sentence of AURA\'s about what the sentences mean',
    F.ROOT_PICK_TEXTS && F.ROOT_PICK_TEXTS.none === 'Καμία από αυτές' && typeof F.ROOT_PICK_TEXTS.title === 'string' && Object.keys(F.ROOT_PICK_TEXTS).sort().join() === 'none,title'
    && !/ρίζα|βρήκες|αυτό είναι|σωστ|λάθος|πρέπει/i.test(F.ROOT_PICK_TEXTS.title));
  // found with a screenshot at 390×844: the list makes the card taller AFTER the scroll of the phase effect ran, so its buttons sat below the fold, behind the sticky box
  const scrollEff = (() => { const a = raw.indexOf('// the list makes the root question\'s card taller'); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n', raw.indexOf('}, [rootPick]);', a)) + 1); })();
  assert('NEW — (6.13) when the list appears the chat scrolls to the bottom again (an effect on rootPick): the buttons must not stay hidden behind the sticky box on a phone',
    scrollEff.length > 0 && /useEffect\(\(\) => \{ if \(rootPick && rootPick\.length\) bottomRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "end" \}\); \}, \[rootPick\]\);/.test(scrollEff));
  const pure = ['rootAskNumber', 'rootPickSentences', 'rootPickView', 'rootNewWordCount', 'repeatedElementsForRound'].map(fnSrc).join('\n');
  assert('NEW — (6.12) the new pure functions store nothing, send nothing, log nothing', pure.length > 100 && !/\b(?:window|localStorage|sessionStorage|fetch|XMLHttpRequest|navigator|document)\b|console\.|recordTelemetry/.test(pure));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 8. what must NOT move — green before and after
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const SH = {
    stageAStep: '67bb9bcb504396e8', initialStageAState: '514233db37b55461', stageAFlowTelemetry: '92646b9fff31a68f',
    detectSafetySignal: '838fe96cf161fcae', classifyCrisisTier: 'afa5cf7a370bb0d5', detectsDangerFromOther: '59e2f828fda103fa', stageASafetyHold: 'f1fbe27ef7643815',
    detectsMentalHealthReferral: 'd03b71d681025b79', answersReadinessQuestion: '70fd1f273d6f0e07', detectsCoreReadinessAsked: 'c84bd93559579f9e',
    rootTextHasSubstance: '272756a0bd1f3345', rootAnswerIsDismissal: 'a57d7cd4781f1876', rootAnswerIsUnsure: '2c6461315a960668', pickBranches: '0514402718894bd8',
    branchSessionSafe: 'd31fee2247097e13', rootAuraShare: '24cb967ba5b0626b', trailingQuestionReplies: 'efc1f14f6a437d7c', userSaysDontKnowTwice: '79a0fc114472fef5',
    describeSpeakRightCtx: '14e279143014f328', repeatedUserElements: '56e06a1fe3e505cb',
  };
  for (const [n, h] of Object.entries(SH)) assert('GUARD — (8) ' + n + ' is byte for byte the function of 4ec72b0 (' + h + '…)', sha(fnSrc(n)).startsWith(h));
  assert('GUARD — (8) STAGE_A_TEXTS (the reducer\'s fixed texts) are byte for byte as in 4ec72b0 (9f64812e…): the list\'s title and button live apart, in ROOT_PICK_TEXTS',
    sha(objSrc('STAGE_A_TEXTS')).startsWith('9f64812e26b48d3d'));
  assert('GUARD — (8) the reducer is not asked for a new event: no "pick" / "list" case in stageAStep', !/case "(?:pick|list|rootPick|second)[^"]*"/.test(fnSrc('stageAStep')));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 9. the list's three counters — John's addition (20/11/2026, with the approval of the package): NUMBERS ONLY
//    list_shown { n }, list_picked { pos }, list_none {}  — through recordTelemetry (device log with ?rec=1 / ?debug=1, read by nothing); no text anywhere
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const G = 'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο.';
  const j = x => JSON.stringify(x);
  const sh = call('rootPickRecord', 'shown', 3), pk = call('rootPickRecord', 'picked', 2), nn = call('rootPickRecord', 'none');
  assert('NEW — (9.1) one record for each thing that happens to the list: list_shown (how many sentences), list_picked (the PLACE of the sentence tapped, 1-based), list_none (nothing else)',
    !!sh && sh.event === 'list_shown' && j(sh.fields) === '{"n":3}' && !!pk && pk.event === 'list_picked' && j(pk.fields) === '{"pos":2}' && !!nn && nn.event === 'list_none' && j(nn.fields) === '{}');
  assert('NEW — (9.2) any other kind gives nothing (null)', ['', 'x', 'shownn', 'Shown', null, undefined, 5, {}, []].every(k => call('rootPickRecord', k, 3) === null));
  const junk = ['ωράριο', G, -1, 2.5, NaN, Infinity, null, undefined, {}, [], [3], true, 99999, '3'];
  assert('NEW — (9.3) NUMBERS ONLY: whatever is passed in — a sentence of the user, a float, a negative, a huge number, an object — the fields hold ONE integer from 0 to 9999 and nothing else; no word of the input comes out',
    junk.every(v => ['shown', 'picked'].every(k => { const r = call('rootPickRecord', k, v); return !!r && typeof r === 'object' && Object.keys(r.fields).length === 1 && Object.values(r.fields).every(x => Number.isInteger(x) && x >= 0 && x <= 9999); }))
    && !junk.some(v => ['shown', 'picked', 'none'].some(k => j(call('rootPickRecord', k, v)).includes('ωράριο'))));
  const recs = [sh, pk, nn].map(r => (r && r.event ? call('recordTelemetry', r.event, r.fields) : null));
  assert('NEW — (9.4) recordTelemetry keeps the event name and the number and nothing else (keys ev,n,t · ev,pos,t · ev,t), and the tester export carries them; no record holds a string but its event name',
    recs.every(r => r && typeof r === 'object') && Object.keys(recs[0]).sort().join() === 'ev,n,t' && recs[0].n === 3 && Object.keys(recs[1]).sort().join() === 'ev,pos,t' && recs[1].pos === 2
    && Object.keys(recs[2]).sort().join() === 'ev,t' && recs.every(r => Object.entries(r).every(([k, v]) => (k === 'ev' ? typeof v === 'string' : typeof v === 'number')))
    && (() => { const ex = call('buildTesterExport', recs, 'x'); return !!ex && !!ex.events && ex.events.length === 3 && ex.events[0].ev === 'list_shown' && ex.events[0].n === 3 && ex.events[1].ev === 'list_picked' && ex.events[1].pos === 2 && ex.events[2].ev === 'list_none'; })());
  const fn = fnSrc('rootPickRecord');
  assert('NEW — (9.5) the function is pure: it stores nothing, sends nothing, logs nothing, and reads no message and no box', fn.length > 150 && !/\b(?:window|localStorage|sessionStorage|fetch|XMLHttpRequest|navigator|document|messages|input)\b|console\.|recordTelemetry/.test(fn));
  const eff = (() => { const a = raw.indexOf('// ROOT PICK EFFECT — BEGIN'), b = raw.indexOf('// ROOT PICK EFFECT — END'); return a >= 0 && b > a ? raw.slice(a, b) : ''; })();
  const blk = (eff.match(/if \(v\) \{[^\n]*\}/) || [''])[0];
  assert('NEW — (9.6) list_shown is written ONCE, in the effect, only where the gate decided to show the list — inside «if (v)», after the once-per-session latch and the list are set; nowhere else in the effect (so never on the safety path, where the gate says no)',
    blk.length > 0 && blk.indexOf('rootPickDone.current = true') > 0 && blk.indexOf('setRootPick(') > blk.indexOf('rootPickDone.current = true') && blk.indexOf('rootPickRecord("shown", v.sentences.length)') > blk.indexOf('setRootPick(')
    && blk.indexOf('recordTelemetry(_r.event, _r.fields)') > blk.indexOf('rootPickRecord("shown"') && !/recordTelemetry|rootPickRecord/.test(eff.replace(blk, '')));
  const ask = (() => { const a = raw.indexOf('{stageAPhase === "ask" && ('); return a < 0 ? '' : raw.slice(a, raw.indexOf('{(stageAPhase === "card"', a)); })();
  assert('NEW — (9.7) on the screen each sentence button hands its PLACE (the index of the map), not its text, to the tap handler — the text goes to the box (setInput) and nowhere else', /onClick=\{\(\) => handleRootPickTap\(t, i\)\}/.test(ask));
  const sites = [eff, (() => { const a = raw.indexOf('const handleRootPickTap = '); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1); })(), (() => { const a = raw.indexOf('const handleRootPickNone = '); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1); })()];
  assert('NEW — (9.8) passive: at the three places nothing receives what recordTelemetry returns, and what rootPickRecord returns is used only to make that one call', sites.every(s => s.length > 0)
    && sites.every(s => !/=\s*recordTelemetry\(/.test(s)) && sites.every(s => /const _r = rootPickRecord\(/.test(s) && /if \(_r\) recordTelemetry\(_r\.event, _r\.fields\);/.test(s)));
  assert('NEW — (9.9) the three event names are written in ONE place (the function) and the function is called from exactly three places: the effect, the tap, «Καμία από αυτές»',
    (raw.match(/"list_(?:shown|picked|none)"/g) || []).length === 3 && (raw.match(/\brootPickRecord\(/g) || []).length === 4);
}

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
