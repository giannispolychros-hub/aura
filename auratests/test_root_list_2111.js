// AURA — «ΛΙΣΤΑ ΣΤΗΝ ΕΡΩΤΗΣΗ ΤΗΣ ΡΙΖΑΣ» (Λ1) — John, 21/11/2026; branch root-list (from test-two-sessions). It CHANGES the decision of 19/11/2026 (Package 1,
// «2η φορά»: the list only at the root question's 2nd ask).
//
//   John's rule: at the root question, if there are 3 or more sentences of the user's own that pass the A8-like filter (the filter of Package 1, rootPickSentences),
//   the app shows the list of the user's own words — the same mechanism as «2η φορά», at most 8, in the order they were written, no weights — under the heading
//   «Ποιο από αυτά νομίζεις ότι τραβάει τα άλλα; Ή κάτι που δεν έχεις πει ακόμα;», with «Καμία από αυτές» and the writing box. With fewer than 3, the root question stays as it
//   is today. The user chooses or writes; AURA proposes no root of its own. Code only: the core prompt does not change (fingerprint 7e52268b…). Never on the safety path.
//   Once per session. Numbers only in the device log (list_shown / list_picked / list_none).
//
// Test-first (John): every assertion labelled NEW fails on 6202c34 (the code before this change) and passes after; GUARD assertions are green before and after on purpose
// (they pin what must not move). All text here is synthetic: no word of any real session.

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
  'ROOT_PICK_SELF_BLAME', 'ROOT_PICK_ADDRESSED', 'ROOT_PICK_FILLER', 'ROOT_PICK_CONNECTOR', 'ROOT_PICK_TEXTS',
  'ROOT_LIST_MIN', 'ROOT_LIST_MAX', 'ROOT_LIST_TEXTS', 'ROOT_LIST_HINT'];
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'splitSentences', 'rootTextHasSubstance', 'speakRightSpans', 'speakRightEndsWithQuestion', 'speakRightJaccard',
  'branchSessionSafe', 'detectsCoreReadinessAsked', 'rootAskNumber', 'rootPickSentences', 'rootPickView', 'recordTelemetry', 'buildTesterExport', 'rootPickRecord', 'rootListScrollPlan'];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ', ' + CONSTS.join(', ') + ' };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw: ' + e.message; } };
const isArr = Array.isArray;
const j = JSON.stringify;

// ── synthetic conversation builders (the same shapes as test_package1_1911.js) ──────────────────────────────────────────────────────────────────────
const U = t => ({ role: 'user', content: t });
const A = t => ({ role: 'assistant', msgMode: 'ANSWER', content: t });
const S = t => ({ role: 'assistant', msgMode: 'STAGE_A', content: t });
const ENTRANCE = 'Δεν ξέρω αν πρέπει να αλλάξω γραφείο, με πιέζει το πρόγραμμα.';
// twelve different, ordinary sentences, each with its own words (so the near-copy filter keeps all of them)
const P = [
  'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο.',
  'Θέλω περισσότερο χρόνο για την οικογένειά μου.',
  'Η μετακίνηση παίρνει δύο ώρες κάθε μέρα.',
  'Ο μισθός είναι καλός και με κρατά εκεί.',
  'Οι συνάδελφοι με στηρίζουν στις δύσκολες μέρες.',
  'Το σπίτι μου είναι κοντά στο σχολείο των παιδιών.',
  'Η προϊσταμένη μου εμπιστεύεται τις αποφάσεις μου.',
  'Τα Σαββατοκύριακα δουλεύω σχεδόν πάντα στον υπολογιστή.',
  'Η καινούργια θέση είναι σε άλλη πόλη.',
  'Το δάνειο του διαμερίσματος τελειώνει σε τέσσερα χρόνια.',
  'Ο φίλος μου άλλαξε δουλειά πέρσι και είναι ευχαριστημένος.',
  'Η μητέρα μου μένει μόνη της στην επαρχία.',
];
const Q = ['Τι άλλο υπάρχει εκεί;', 'Και τι θα άλλαζε με αυτό;', 'Πες μου περισσότερα για αυτό;', 'Τι έχει σημασία εδώ;', 'Τι κρατά το πράγμα στη θέση του;', 'Τι λείπει ακόμα;'];
const conv = (...answers) => { const out = [U(ENTRANCE)]; answers.forEach((a, i) => { out.push(A(Q[i % Q.length])); out.push(typeof a === 'string' ? U(a) : a); }); return out; };
const convN = n => conv(...P.slice(0, n));
const texts = r => isArr(r) ? r.map(x => x.text) : ['<not a list: ' + String(r) + '>'];
const SAFE = { phase: 'ask', askNo: 1, done: false, riskKind: 0, dangerFromOther: false, safetyMode: false, crisisFallback: null };
const view = (m, over) => call('rootPickView', Object.assign({}, SAFE, { messages: m }, over || {}));
const viewTexts = (m, over) => { const v = view(m, over); return v && isArr(v.sentences) ? texts(v.sentences) : v; };

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1. John's words — the constants
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  assert('NEW — (1.1) the heading is John\'s sentence, word for word, in its own constant (kept apart from the 19/11 title and from STAGE_A_TEXTS)',
    !!F.ROOT_LIST_TEXTS && F.ROOT_LIST_TEXTS.title === 'Ποιο από αυτά νομίζεις ότι τραβάει τα άλλα; Ή κάτι που δεν έχεις πει ακόμα;' && Object.keys(F.ROOT_LIST_TEXTS).join() === 'title');
  assert('NEW — (1.2) the rule\'s two numbers are named in one place each: at least 3 sentences (ROOT_LIST_MIN), at most 8 (ROOT_LIST_MAX)', F.ROOT_LIST_MIN === 3 && F.ROOT_LIST_MAX === 8);
  assert('GUARD — (1.3) the 19/11 texts did not move: the title of the 2-sentence list and «Καμία από αυτές» (the one «none» button is shared), and the old limit of 3',
    !!F.ROOT_PICK_TEXTS && F.ROOT_PICK_TEXTS.none === 'Καμία από αυτές' && F.ROOT_PICK_TEXTS.title === 'Δικά σου λόγια από πριν. Πάτα μία για να τη βάλεις στο πεδίο και να τη διορθώσεις όπως θες:'
    && Object.keys(F.ROOT_PICK_TEXTS).sort().join() === 'none,title' && F.ROOT_PICK_MAX === 3);
  assert('NEW — (1.4) the heading says nothing the user did not say: no word about a root, a cause, a feeling, a judgement («ρίζα», «φόβος», «σωστό», «πρέπει»…) — and it is a question for the user, not a statement of AURA',
    !!F.ROOT_LIST_TEXTS && typeof F.ROOT_LIST_TEXTS.title === 'string' && !/ρίζα|φοβ|σωστ|λάθος|πρέπει|πρόβλημα|αιτία|ξέρω|βρήκα/i.test(F.ROOT_LIST_TEXTS.title) && (F.ROOT_LIST_TEXTS.title.match(/;/g) || []).length === 2);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 2. the rule at the FIRST ask — 3 or more sentences → the list (this is what changes)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const m3 = convN(3);
  assert('NEW — (2.1) the FIRST ask, three of the user\'s own sentences → the list, the three sentences in the order they were written',
    j(viewTexts(m3)) === j([P[0], P[1], P[2]]));
  assert('NEW — (2.2) five sentences → all five (no longer «the first, the middle and the last»)', j(viewTexts(convN(5))) === j(P.slice(0, 5)));
  assert('NEW — (2.3) eight sentences → all eight; nine or more → exactly eight', j(viewTexts(convN(8))) === j(P.slice(0, 8)) && (viewTexts(convN(9)) || []).length === 8 && (viewTexts(convN(12)) || []).length === 8);
  // more than eight: the first and the last are always in; the rest are spread evenly by position (the 19/11 rule, with eight) — never by a weight of what they say
  const ok8 = n => { const t = viewTexts(convN(n)); const all = P.slice(0, n);
    return isArr(t) && t.length === 8 && t[0] === all[0] && t[7] === all[n - 1] && new Set(t).size === 8 && t.every(x => all.includes(x)) && t.every((x, i, a) => i === 0 || all.indexOf(a[i - 1]) < all.indexOf(x)); };
  assert('NEW — (2.4) nine to twelve sentences → eight different ones, the first and the last among them, in the order they were written, each one of the user\'s', [9, 10, 11, 12].every(ok8));
  const w = call('rootPickView', Object.assign({}, SAFE, { messages: convN(6) }));
  assert('NEW — (2.5) each sentence is an exact, continuous piece of what the user typed (text === content.slice(start, end)), one per message, in time order',
    !!w && isArr(w.sentences) && w.sentences.length === 6 && w.sentences.every(x => convN(6)[x.msg].content.slice(x.start, x.end) === x.text) && new Set(w.sentences.map(x => x.msg)).size === 6
    && w.sentences.every((x, i, a) => i === 0 || a[i - 1].msg < x.msg));
  assert('NEW — (2.6) the first message of the user (the entrance) is never in the list: three answers after it → three sentences, not four',
    !(viewTexts(m3) || []).includes(ENTRANCE) && (viewTexts(m3) || []).length === 3);
  assert('NEW — (2.7) the filter is the one of the 19/11 package, not a new one: a question, a sentence addressed to AURA, «Όχι…», a dismissal and a sentence over 200 characters are not offered — with them in the session, three GOOD ones are still three',
    j(viewTexts(conv(P[0], 'Μήπως ο χρόνος είναι το θέμα;', P[1], 'Σου είπα ότι το ωράριο με πιέζει.', 'Όχι, το ωράριο δεν είναι το πρόβλημα.', 'Άστο.', P[2]))) === j([P[0], P[1], P[2]]));
  assert('NEW — (2.8) the same session at the 2nd, 3rd, 7th ask (not shown before) → the same list: the rule has no ask number above the first',
    [2, 3, 7].every(a => j(viewTexts(convN(4), { askNo: a })) === j(P.slice(0, 4))));
  assert('GUARD — (2.9) a call without a limit still means the 19/11 limit of 3 (the function is shared): five sentences → the first, the middle, the last; junk limits mean the same',
    j(texts(call('rootPickSentences', convN(5)))) === j([P[0], P[2], P[4]]) && ['x', 0, 1, -4, 2.5, NaN, null, {}, []].every(l => j(texts(call('rootPickSentences', convN(5), l))) === j([P[0], P[2], P[4]])));
  assert('NEW — (2.10) with the new limit the function gives the whole list: 5 → 5 and 12 → 8', texts(call('rootPickSentences', convN(5), F.ROOT_LIST_MAX)).length === 5 && texts(call('rootPickSentences', convN(12), F.ROOT_LIST_MAX)).length === 8);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 3. fewer than 3 — the root question stays as it is today
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  assert('GUARD — (3.1) the FIRST ask with two sentences, one, or none → no list: the question as it is today', [convN(2), convN(1), convN(0), [U(ENTRANCE)], []].every(m => view(m) === null));
  assert('GUARD — (3.2) the 2nd ask with exactly two sentences → the 19/11 list of those two, unchanged (nothing in John\'s rule takes it away)',
    j(viewTexts(convN(2), { askNo: 2 })) === j([P[0], P[1]]) && j(viewTexts(convN(2), { askNo: 5 })) === j([P[0], P[1]]));
  assert('GUARD — (3.3) the 2nd ask with one sentence or none → no list', view(convN(1), { askNo: 2 }) === null && view(convN(0), { askNo: 2 }) === null);
  assert('NEW — (3.4) the two sizes never mix: a list of two is only ever the 19/11 list (asks 2 and later), a list of 3 or more is only ever the new one, so the screen can tell them apart by the number of sentences',
    [0, 1, 2, 3, 4, 5, 8, 9, 12].every(n => [1, 2, 3].every(a => { const v = view(convN(n), { askNo: a }); const k = v ? v.sentences.length : 0;
      return k === 0 || (k === 2 && a >= 2) || (k >= F.ROOT_LIST_MIN && k <= F.ROOT_LIST_MAX); })));
  assert('GUARD — (3.5) not at the root question → nothing: every other phase, no phase', ['card', 'correct', 'offer', 'step', 'clarity', 'done', null, undefined].every(p => view(convN(5), { phase: p }) === null));
  assert('NEW — (3.6) askNo must be a whole number from 1: the very same session gives the list at 1, and nothing at 0, a negative, a fraction, a string, nothing (the app counts from 1)',
    (viewTexts(convN(5), { askNo: 1 }) || []).length === 5 && [0, -1, 0.5, '1', null, undefined, NaN].every(a => view(convN(5), { askNo: a }) === null));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 4. once per session
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  assert('GUARD — (4.1) once per session: after the list was shown (done), never again — at any ask, for any number of sentences', [1, 2, 3].every(a => [2, 3, 5, 9].every(n => view(convN(n), { askNo: a, done: true }) === null)));
  const eff = (() => { const a = raw.indexOf('// ROOT PICK EFFECT — BEGIN'), b = raw.indexOf('// ROOT PICK EFFECT — END'); return a >= 0 && b > a ? raw.slice(a, b) : ''; })();
  assert('GUARD — (4.2) the screen\'s effect still sets the latch where the list is set, and it still asks the gate at EVERY ask (the gate, not the effect, decides which)',
    eff.length > 0 && /rootPickDone\.current = true/.test(eff) && /rootPickView\(\{ phase: "ask", askNo, done: rootPickDone\.current, messages,/.test(eff) && !/askNo\s*[<>]=?\s*\d/.test(eff));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 5. NEVER on the safety path — the same gate, the same checks, now also at the first ask
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const good = convN(5);
  assert('NEW — (5.1) control: the same session with nothing wrong → the list (so the tests below mean something)', (viewTexts(good) || []).length === 5);
  assert('GUARD — (5.2) the app\'s latch: crisis A, crisis B, DISTRESS, danger from another person, safety mode, the failed-call crisis line → no list, at the first ask and at the later ones',
    [{ riskKind: 1 }, { riskKind: 2 }, { riskKind: 3 }, { dangerFromOther: true }, { safetyMode: true }, { crisisFallback: 'γραμμή' }].every(o => [1, 2, 3].every(a => view(good, Object.assign({ askNo: a }, o)) === null)));
  // (the danger sentence is written in two pieces on purpose: test_danger_from_other_2310.js (Λ) reads every string of every other test file and must find none that the detector catches)
  const crisis = 'Θέλω να πεθάνω.', danger = 'Με χτυπ' + 'άει ο άντρας μου.';
  assert('GUARD — (5.3) preconditions: the real detectors know the two phrases used below', !!call('detectSafetySignal', crisis) && !!call('detectsDangerFromOther', danger));
  assert('GUARD — (5.4) the whole session is checked again: a crisis phrase typed anywhere in it → no list, though five other sentences are good',
    view(conv(P[0], P[1], crisis, P[2], P[3], P[4])) === null && view(conv(crisis, P[0], P[1], P[2], P[3])) === null);
  assert('GUARD — (5.5) … and the same for danger from another person', view(conv(P[0], P[1], danger, P[2], P[3], P[4])) === null);
  assert('GUARD — (5.6) a supportive reply of AURA in the session, a referral to a professional, or a number of the help-line table → no list',
    view(good.concat([{ role: 'assistant', msgMode: 'SUPPORTIVE', content: 'Είμαι εδώ.' }])) === null
    && view(good.concat([A('Κάλεσε το ' + (F.HELPLINES && F.HELPLINES[0] ? F.HELPLINES[0].number : '112') + '.')])) === null
    && view(good.concat([A('Αν το βαρύ συνεχίζεται, μίλησε με έναν ψυχολόγο.')])) === null);
  assert('GUARD — (5.7) a sentence with a safety phrase is never one of the sentences, whatever the session: the filter itself drops it',
    !texts(call('rootPickSentences', conv(P[0], crisis, P[1], P[2]), F.ROOT_LIST_MAX)).includes(crisis) && !texts(call('rootPickSentences', conv(P[0], danger, P[1], P[2]), F.ROOT_LIST_MAX)).includes(danger));
  assert('GUARD — (5.8) junk in, null out, never throws', [null, undefined, {}, 5, 'x', { phase: 'ask', askNo: 1 }, { phase: 'ask', askNo: 1, messages: 'x' }, { phase: 'ask', askNo: 1, messages: [null, 5, {}] }].every(o => call('rootPickView', o) === null));
  assert('GUARD — (5.9) the gate has no argument for what the user typed: only the phase, the ask number, the flags and the conversation',
    !/\b(?:userText|input|answer)\b/.test(fnSrc('rootPickView')) && !/\b(?:window|localStorage|sessionStorage|fetch|XMLHttpRequest|navigator|document)\b|console\.|recordTelemetry/.test(fnSrc('rootPickView') + fnSrc('rootPickSentences')));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 6. the device log — NUMBERS ONLY (list_shown / list_picked / list_none), now with up to 8 sentences
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const sh = call('rootPickRecord', 'shown', 8), pk = call('rootPickRecord', 'picked', 8), nn = call('rootPickRecord', 'none');
  assert('GUARD — (6.1) the three records, with the biggest list: list_shown {n: 8}, list_picked {pos: 8}, list_none {} — numbers and nothing else',
    !!sh && sh.event === 'list_shown' && j(sh.fields) === '{"n":8}' && !!pk && pk.event === 'list_picked' && j(pk.fields) === '{"pos":8}' && !!nn && nn.event === 'list_none' && j(nn.fields) === '{}');
  const recs = [sh, pk, nn].map(r => (r && r.event ? call('recordTelemetry', r.event, r.fields) : null));
  assert('GUARD — (6.2) recordTelemetry keeps both numbers (8 and 8), and the tester export carries them; no record holds a string but its event name',
    recs.every(r => r && typeof r === 'object') && recs[0].n === 8 && recs[1].pos === 8 && recs.every(r => Object.entries(r).every(([k, v]) => (k === 'ev' ? typeof v === 'string' : typeof v === 'number')))
    && (() => { const ex = call('buildTesterExport', recs, 'x'); return !!ex && !!ex.events && ex.events.length === 3 && ex.events[0].n === 8 && ex.events[1].pos === 8; })());
  const v5 = view(convN(5));
  const r5 = v5 ? call('rootPickRecord', 'shown', v5.sentences.length) : null;
  assert('NEW — (6.3) for a real list of five the one record of the effect is list_shown {n: 5} — a number, no word of the user', !!r5 && r5.event === 'list_shown' && j(r5.fields) === '{"n":5}' && !j(r5).includes('ωράριο'));
  const eff = (() => { const a = raw.indexOf('// ROOT PICK EFFECT — BEGIN'), b = raw.indexOf('// ROOT PICK EFFECT — END'); return a >= 0 && b > a ? raw.slice(a, b) : ''; })();
  assert('GUARD — (6.4) nothing new is recorded: the effect records once (list_shown, the number of sentences), the three event names exist once each in the whole file, rootPickRecord has the same four places',
    (eff.match(/recordTelemetry\(/g) || []).length === 1 && /rootPickRecord\("shown", v\.sentences\.length\)/.test(eff) && (raw.match(/"list_(?:shown|picked|none)"/g) || []).length === 3 && (raw.match(/\brootPickRecord\(/g) || []).length === 4
    && (raw.match(/["'`]list_[a-z_]+["'`]/g) || []).length === 3);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 7. the screen (source checks; the browser run is section RL of scripts/e2e_stage_a.cjs)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const ask = (() => { const a = raw.indexOf('{stageAPhase === "ask" && ('); return a < 0 ? '' : raw.slice(a, raw.indexOf('{(stageAPhase === "card"', a)); })();
  assert('NEW — (7.1) inside the root question\'s card the heading is chosen by the size of the list: 3 or more → ROOT_LIST_TEXTS.title (John\'s), two → ROOT_PICK_TEXTS.title (19/11); never both',
    ask.length > 0 && /rootPick\.length\s*>=\s*ROOT_LIST_MIN\s*\?\s*ROOT_LIST_TEXTS\.title\s*:\s*ROOT_PICK_TEXTS\.title/.test(ask) && (ask.match(/ROOT_LIST_TEXTS\.title/g) || []).length === 1 && (ask.match(/ROOT_PICK_TEXTS\.title/g) || []).length === 1);
  assert('GUARD — (7.2) the order on the card: the heading, one button per sentence, «Καμία από αυτές», then «Δεν το βρήκα ακόμα»; a tap hands its PLACE, not its text, to the handler',
    ask.length > 0 && ask.indexOf('handleRootPickTap') > ask.indexOf('rootPick.length') && ask.indexOf('ROOT_PICK_TEXTS.none') > ask.indexOf('handleRootPickTap') && ask.indexOf('handleStageABack') > ask.indexOf('ROOT_PICK_TEXTS.none')
    && /onClick=\{\(\) => handleRootPickTap\(t, i\)\}/.test(ask));
  assert('GUARD — (7.3) the user\'s words are shown as typed (the capital letters of the button style are switched off) and every sentence is its own button (map over rootPick)', /textTransform:\s*"none"/.test(ask) && /rootPick\.map\(\(t, i\) =>/.test(ask));
  assert('NEW — (7.4) John\'s heading is written once in the whole file (its constant): no second copy in a text, a prompt or a test double', raw.split('Ποιο από αυτά νομίζεις ότι τραβάει τα άλλα;').length === 2);
  assert('GUARD — (7.5) the writing box is the app\'s own box, untouched: a tap copies into it (setInput), nothing is sent, no bubble, no card; «Καμία από αυτές» only closes the list',
    (() => { const a = raw.indexOf('const handleRootPickTap = '), tap = raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1), b = raw.indexOf('const handleRootPickNone = '), none = raw.slice(b, raw.indexOf('\n  ', raw.indexOf(';', b)) + 1);
      return /setInput\(/.test(tap) && !/handleSubmit|generateResponse|stageADispatch|stageAOpen|addUiBubble|setMessages|setRootPick/.test(tap) && /setRootPick\(null\)/.test(none) && !/handleSubmit|generateResponse|stageADispatch|stageAOpen|addUiBubble|setMessages|setInput/.test(none); })());
  assert('GUARD — (7.6) the effect and the reset still do what they did (the list goes when the question goes; a new session starts clean)',
    (() => { const a = raw.indexOf('// ROOT PICK EFFECT — BEGIN'), b = raw.indexOf('// ROOT PICK EFFECT — END'), eff = raw.slice(a, b), r = raw.indexOf('const resetSession = () => {'), reset = raw.slice(r, raw.indexOf('\n  };', r));
      return /setRootPick\(null\)/.test(eff) && /rootPickDone\.current = false/.test(reset) && /rootAsksBefore\.current = 0/.test(reset) && /rootDoor2Asks\.current = 0/.test(reset) && /setRootPick\(null\)/.test(reset); })());
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 8. what must NOT move — green before and after (byte for byte, from 6202c34)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  // the core prompt: the same computation as scripts/gen_prompt_fingerprints.cjs (the template literal as JavaScript reads it), its sha256's first 16 characters
  const corePrompt = (() => { const head = 'const AURA_CORE_PERSONALITY = `'; const a = raw.indexOf(head); if (a < 0) return null; const s = a + head.length, e = raw.indexOf('`;', s); return Function('return `' + raw.slice(s, e) + '`;')(); })();
  assert('GUARD — (8.1) the core prompt did not change: 313386 characters, fingerprint 7e52268becda7360', corePrompt !== null && corePrompt.length === 313386 && sha(corePrompt).startsWith('7e52268becda7360'));
  const apiRaw = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
  assert('GUARD — (8.2) api/aura.js did not change (sha256 675564a7985438c8…), and it carries the same core fingerprint', sha(apiRaw).startsWith('675564a7985438c8') && /core: \{ length: 313386, sha256: "7e52268becda7360/.test(apiRaw));
  const PINS = {
    branchSessionSafe: 'd31fee2247097e13', detectSafetySignal: '838fe96cf161fcae', classifyCrisisTier: 'afa5cf7a370bb0d5', detectsDangerFromOther: '59e2f828fda103fa', stageASafetyHold: 'f1fbe27ef7643815',
    detectsMentalHealthReferral: 'd03b71d681025b79', rootTextHasSubstance: '272756a0bd1f3345', rootAnswerIsDismissal: 'a57d7cd4781f1876', rootAnswerIsUnsure: '2c6461315a960668',
    detectsCoreReadinessAsked: 'c84bd93559579f9e', stageAStep: '67bb9bcb504396e8', initialStageAState: '514233db37b55461', pickBranches: '0514402718894bd8',
  };
  for (const [n, h] of Object.entries(PINS)) assert('GUARD — (8) ' + n + ' is byte for byte the function of the release candidate (' + h + '…)', sha(fnSrc(n)).startsWith(h));
  assert('GUARD — (8) STAGE_A_TEXTS (the reducer\'s fixed texts) are byte for byte as before (9f64812e…)', sha(objSrc('STAGE_A_TEXTS')).startsWith('9f64812e26b48d3d'));
  assert('GUARD — (8) the app\'s own count of asks (rootAskNumber), the list\'s three records (rootPickRecord) and the passive counter (rootNewWordCount) are the 19/11 functions, not touched by this change',
    sha(fnSrc('rootAskNumber')).startsWith('96d2f1ee3eaa97e3') && sha(fnSrc('rootPickRecord')).startsWith('1c0bde473197124e') && sha(fnSrc('rootNewWordCount')).startsWith('edd503f0c9a44412'));
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 9. ONE list per session in TOTAL — the 3-or-more list (Λ1) and the 19/11 list of two never both (John, 22/11/2026, decision 14: «Η λίστα της 2ης φοράς μένει, αλλά ΣΥΝΟΛΙΚΑ ΜΙΑ λίστα ανά συνεδρία»)
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  // the screen's effect, as this test can run it: at every ask the gate is asked with the latch, and where it shows a list the latch is set — the same two lines that (4.2) pins in the screen's effect
  const runSession = sizes => { let latch = false; const shown = []; sizes.forEach((n, i) => { const v = view(convN(n), { askNo: i + 1, done: latch }); if (v) { latch = true; shown.push({ ask: i + 1, n: v.sentences.length }); } }); return shown; };
  const VALUES = [0, 2, 3, 4, 8, 9];
  let seqs = 0; const bad = [];
  const walk = (seq, len) => { if (seq.length === len) { seqs++; const r = runSession(seq); if (r.length > 1) bad.push(seq.join(',') + ' → ' + JSON.stringify(r)); return; } for (const v of VALUES) if (!seq.length || v >= seq[seq.length - 1]) walk(seq.concat(v), len); };
  walk([], 5);
  assert('GUARD — (9.1) at most ONE list in a whole session: in each of the ' + seqs + ' sessions of 5 asks whose earlier sentences only grow (0, 2, 3, 4, 8 or 9 of them at each ask) the list is shown at most once — never the 3-or-more list and the list of two in the same session' + (bad.length ? ' [' + bad.slice(0, 3).join(' | ') + ']' : ''),
    seqs > 100 && bad.length === 0);
  const ex = sizes => JSON.stringify(runSession(sizes));
  assert('GUARD — (9.2) which list, when: 3 or more at the 1st ask → John\'s list at once, nothing at the 2nd or 3rd · two at the 1st ask → nothing; two at the 2nd → the 19/11 list, and the 3-or-more list that comes later (4 sentences at the 3rd ask) is NOT shown · none, then 3 at the 2nd ask → John\'s list, once',
    ex([3, 3, 3]) === '[{"ask":1,"n":3}]' && ex([8, 9, 9]) === '[{"ask":1,"n":8}]' && ex([2, 2, 2]) === '[{"ask":2,"n":2}]' && ex([2, 2, 4]) === '[{"ask":2,"n":2}]' && ex([2, 3, 3]) === '[{"ask":2,"n":3}]' && ex([0, 3, 4]) === '[{"ask":2,"n":3}]');
  const effA = raw.indexOf('// ROOT PICK EFFECT — BEGIN'), effB = raw.indexOf('// ROOT PICK EFFECT — END');
  const sets = raw.match(/setRootPick\((?!null\))/g) || [], at = raw.search(/setRootPick\((?!null\))/);
  assert('GUARD — (9.3) the structure behind it: a list can be put on the screen from ONE place only — the only setRootPick(…) with a value is in the screen\'s effect, in the same statement that sets the latch (so no second route to a second list)',
    sets.length === 1 && effA > 0 && at > effA && at < effB && raw.slice(raw.lastIndexOf('if (v) {', at), at).includes('rootPickDone.current = true'));
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 10. THE PHONE (John, 22/11/2026, decision 15): the heading is ALWAYS in view when the list appears, and a line under it says what a tap does
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const HINT = 'Πάτα ό,τι ταιριάζει, θα μπει στο πεδίο και μπορείς να το αλλάξεις.';
  assert('NEW — (10.1) the line under the heading is John\'s sentence, word for word, in its own constant (ROOT_LIST_HINT); a statement, not a question; written once in the whole file; the heading\'s own constant keeps only the heading',
    F.ROOT_LIST_HINT === HINT && !/[;?]/.test(F.ROOT_LIST_HINT || ';') && raw.split(HINT).length === 2 && Object.keys(F.ROOT_LIST_TEXTS).join() === 'title');
  assert('NEW — (10.2) it says nothing the user did not say and offers nothing of its own: no root, cause, feeling, judgement, no advice («πρέπει», «καλύτερα»…)', typeof F.ROOT_LIST_HINT === 'string' && !/ρίζα|φοβ|σωστ|λάθος|πρέπει|καλύτερα|πρόβλημα|αιτία|βρήκα/i.test(F.ROOT_LIST_HINT));
  const ask = (() => { const a = raw.indexOf('{stageAPhase === "ask" && ('); return a < 0 ? '' : raw.slice(a, raw.indexOf('{(stageAPhase === "card"', a)); })();
  assert('NEW — (10.3) on the card the line comes right under the heading and above the first button, and only for the 3-or-more list (the list of two has its instruction in its own title)',
    ask.length > 0 && /rootPick\.length\s*>=\s*ROOT_LIST_MIN\s*&&[^]*?ROOT_LIST_HINT/.test(ask) && ask.indexOf('ROOT_LIST_TEXTS.title') > 0 && ask.indexOf('ROOT_LIST_HINT') > ask.indexOf('ROOT_LIST_TEXTS.title') && ask.indexOf('ROOT_LIST_HINT') < ask.indexOf('rootPick.map') && (ask.match(/ROOT_LIST_HINT/g) || []).length === 1);
  const plan = (c, e) => call('rootListScrollPlan', c, e);
  assert('NEW — (10.4) rootListScrollPlan: the end, as always, while the card\'s top stays on the screen when the chat is scrolled to its end ((300, 200), (200, 200), (0, 0), (5, 0)) — and the card from its top when it would not ((150, 400), (0, 1), (-3, 0))',
    [[300, 200], [200, 200], [0, 0], [5, 0], [1000, 999.5]].every(([c, e]) => plan(c, e) === 'end') && [[150, 400], [0, 1], [-3, 0], [199.5, 200]].every(([c, e]) => plan(c, e) === 'card'));
  assert('NEW — (10.5) anything that is not a finite number gives the end — what the screen always did — and nothing throws (undefined, null, NaN, Infinity, strings, objects)',
    [[undefined, 5], [5, undefined], [null, 5], [5, null], [NaN, 5], [5, NaN], [Infinity, 5], [5, -Infinity], ['10', 20], [10, '20'], [{}, []], [undefined, undefined]].every(([c, e]) => plan(c, e) === 'end'));
  assert('NEW — (10.6) rootListScrollPlan is pure: two calls with the same two numbers give the same answer, and it returns one of two words only', ['end', 'card'].includes(plan(1, 2)) && ['end', 'card'].includes(plan(2, 1)) && plan(7, 9) === plan(7, 9) && plan(9, 7) === plan(9, 7));
  const eff = (() => { const a = raw.indexOf('// the list makes the root question\'s card taller'); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n', raw.indexOf('}, [rootPick]);', a)) + 1); })();
  assert('NEW — (10.7) the screen\'s effect on rootPick asks the plan: it reads the card\'s top and how far the chat scrolls (the two numbers), shows the card from its top (block "start") when the plan says «card», and otherwise still scrolls to the end (block "end"); it does nothing for an empty list',
    eff.length > 0 && /rootListScrollPlan\(/.test(eff) && /rootCardRef\.current/.test(eff) && /scrollHeight\s*-\s*\w+\.clientHeight/.test(eff) && /plan === "card"/.test(eff) && /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/.test(eff) && /scrollIntoView\(\{ behavior: "smooth", block: "end" \}\)/.test(eff) && /rootPick && rootPick\.length/.test(eff) && /\}, \[rootPick\]\);/.test(eff));
  assert('NEW — (10.8) the root question\'s card carries the reference (ref={rootCardRef}) and the reference is declared with useRef — and only that card', ask.length > 0 && /<div className="warning-card"[^>]*ref=\{rootCardRef\}/.test(ask) && /const rootCardRef\s*=\s*useRef\(null\)/.test(raw) && (raw.match(/ref=\{rootCardRef\}/g) || []).length === 1);
  assert('GUARD — (10.9) the effect and handlers of the tap are as they were: a tap still only copies the sentence into the box; «Καμία από αυτές» still only closes the list (the new scroll touches neither)',
    (() => { const a = raw.indexOf('const handleRootPickTap = '), tap = raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1); return /setInput\(t\)/.test(tap) && !/scrollIntoView|rootListScrollPlan/.test(tap); })());
}

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
