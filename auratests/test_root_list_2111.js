// AURA — «ΛΙΣΤΑ ΣΤΗΝ ΕΡΩΤΗΣΗ ΤΗΣ ΡΙΖΑΣ» (Λ1) — John, 21/11/2026; branch root-list (from test-two-sessions). It CHANGES the decision of 19/11/2026 (Package 1,
// «2η φορά»: the list only at the root question's 2nd ask).
//
//   John's rule: at the root question, if there are 3 or more sentences of the user's own that pass the A8-like filter (the filter of Package 1, rootPickSentences),
//   the app shows the list of the user's own words — the same mechanism as «2η φορά», at most 8, in the order they were written, no weights — under the heading
//   «Ποιο από αυτά νομίζεις ότι τραβάει τα άλλα; Ή κάτι που δεν έχεις πει ακόμα;», with «Καμία από αυτές» and the writing box. With fewer than 3, the root question stays as it
//   is today. The user chooses or writes; AURA proposes no root of its own. Code only: the core prompt does not change (fingerprint 7e52268b…). Never on the safety path.
//   Once per session. Numbers only in the device log (list_shown / list_picked / list_none).
//
// UPDATED (22/11/2026, John's correction ⚑1–⚑2): the heading became ONE block of instruction with no question mark («Δικά σου λόγια από πριν. Αν κάποιο λέει αυτό που σε απασχολεί
// πραγματικά, πάτα το — θα μπει στο πεδίο και μπορείς να το αλλάξεις. Αν όχι, γράψε κάτι που δεν έχεις πει ακόμα.») — the card has ONE question, the root's — and the separate line of decision 15 is part of
// it; and the tap NEVER deletes the user's words (a box with text keeps it, the sentence comes on a new line; «Δεν το βρήκα ακόμα» clears the box only when it holds exactly the unchanged sentence the app put in).
// Every assertion whose text or condition changed for that carries its own «UPDATED (22/11/2026 …)» note with the reason.
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
  'ROOT_LIST_MIN', 'ROOT_LIST_MAX', 'ROOT_LIST_TEXTS'];  // UPDATED (22/11/2026, ⚑1): 'ROOT_LIST_HINT' is no longer lifted — the separate line of decision 15 is part of the heading block now
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'splitSentences', 'rootTextHasSubstance', 'speakRightSpans', 'speakRightEndsWithQuestion', 'speakRightJaccard',
  'branchSessionSafe', 'detectsCoreReadinessAsked', 'rootAskNumber', 'rootPickSentences', 'rootPickView', 'recordTelemetry', 'buildTesterExport', 'rootPickRecord', 'rootListScrollPlan', 'rootPickTapBox', 'rootPickBackBox'];  // UPDATED (22/11/2026, ⚑2): + the two pure functions of the writing box
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
  // UPDATED (22/11/2026, John's correction ⚑1): the heading text is John's NEW block, word for word (it replaced the question «Ποιο από αυτά νομίζεις ότι τραβάει τα άλλα; Ή κάτι που δεν έχεις πει ακόμα;»)
  assert('NEW — (1.1) UPDATED (22/11/2026, ⚑1): the heading is John\'s block of instruction, word for word, in its own constant (kept apart from the 19/11 title and from STAGE_A_TEXTS)',
    !!F.ROOT_LIST_TEXTS && F.ROOT_LIST_TEXTS.title === 'Δικά σου λόγια από πριν. Αν κάποιο λέει αυτό που σε απασχολεί πραγματικά, πάτα το — θα μπει στο πεδίο και μπορείς να το αλλάξεις. Αν όχι, γράψε κάτι που δεν έχεις πει ακόμα.' && Object.keys(F.ROOT_LIST_TEXTS).join() === 'title');
  assert('NEW — (1.2) the rule\'s two numbers are named in one place each: at least 3 sentences (ROOT_LIST_MIN), at most 8 (ROOT_LIST_MAX)', F.ROOT_LIST_MIN === 3 && F.ROOT_LIST_MAX === 8);
  assert('GUARD — (1.3) the 19/11 texts did not move: the title of the 2-sentence list and «Καμία από αυτές» (the one «none» button is shared), and the old limit of 3',
    !!F.ROOT_PICK_TEXTS && F.ROOT_PICK_TEXTS.none === 'Καμία από αυτές' && F.ROOT_PICK_TEXTS.title === 'Δικά σου λόγια από πριν. Πάτα μία για να τη βάλεις στο πεδίο και να τη διορθώσεις όπως θες:'
    && Object.keys(F.ROOT_PICK_TEXTS).sort().join() === 'none,title' && F.ROOT_PICK_MAX === 3);
  // UPDATED (22/11/2026, ⚑1): the old condition «a question for the user: exactly two question marks» is turned round — the new heading is NOT a question (no question mark of either kind) and presupposes no hierarchy among the user's words
  assert('NEW — (1.4) UPDATED (22/11/2026, ⚑1): the heading says nothing the user did not say: no word about a root, a cause, a feeling, a judgement («ρίζα», «φόβος», «σωστό», «πρέπει»…), no ranking or hierarchy («τραβάει», «κέντρο», «πιο σημαντικό») — and it is NOT a question: no question mark of either kind (the Greek one included)',
    !!F.ROOT_LIST_TEXTS && typeof F.ROOT_LIST_TEXTS.title === 'string' && !/ρίζα|φοβ|σωστ|λάθος|πρέπει|πρόβλημα|αιτία|ξέρω|βρήκα|τραβάει|κέντρο|σημαντικ/i.test(F.ROOT_LIST_TEXTS.title) && !/[;\u037e?]/.test(F.ROOT_LIST_TEXTS.title));
  assert('NEW — (1.5) the heading is ONE block that does three things in the user\'s own frame — «Δικά σου λόγια από πριν.» (what they are) · «πάτα το — θα μπει στο πεδίο και μπορείς να το αλλάξεις» (what a tap does; the box, and it can be changed) · «Αν όχι, γράψε κάτι που δεν έχεις πει ακόμα.» (the way out) — and the whole app never shows the old question again',
    !!F.ROOT_LIST_TEXTS && typeof F.ROOT_LIST_TEXTS.title === 'string' && /^Δικά σου λόγια από πριν\. Αν κάποιο λέει αυτό που σε απασχολεί πραγματικά, πάτα το — θα μπει στο πεδίο και μπορείς να το αλλάξεις\. Αν όχι, γράψε κάτι που δεν έχεις πει ακόμα\.$/.test(F.ROOT_LIST_TEXTS.title) && raw.indexOf('Ποιο από αυτά νομίζεις') === -1);
  assert('NEW — (1.6) ONE question on the card: the app\'s texts of the root question\'s card — its question, the heading, the retry line, «Καμία από αυτές», «Δεν το βρήκα ακόμα» — hold exactly ONE question mark, the root question\'s own (John, ⚑1: «Μόνο ΜΙΑ ερώτηση (της ρίζας) και το μπλοκ χωρίς «;»»)',
    (() => { try { const ST = Function(objSrc('STAGE_A_TEXTS') + '\nreturn STAGE_A_TEXTS;')(); const all = [ST.ask, F.ROOT_LIST_TEXTS.title, ST.retry, F.ROOT_PICK_TEXTS.none, ST.back].join(' '); return (all.match(/[;\u037e?]/g) || []).length === 1 && /[;\u037e?]/.test(ST.ask); } catch (e) { return false; } })());
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
  // UPDATED (22/11/2026, ⚑1): the same rule for the NEW heading — written once in the whole file; and the old question, replaced by John, is nowhere any more
  assert('NEW — (7.4) UPDATED (22/11/2026, ⚑1): John\'s heading is written once in the whole file (its constant): no second copy in a text, a prompt or a test double — and the question it replaced is gone',
    raw.split('Αν κάποιο λέει αυτό που σε απασχολεί πραγματικά, πάτα το').length === 2 && raw.indexOf('Ποιο από αυτά νομίζεις') === -1);
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
  // UPDATED (22/11/2026, Δ, John's order ⚑4): only this value moved — the one change of the item is STAGE_A_TEXTS.stepWhy, the app's text after «Ναι, αυτό είναι» (John's two new sentences replace the old three; one comment line above it). Proved first: auratests/test_conversation_v1.js (Ω1) — with all 28 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); so no other text of the object moved. The prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged.
  assert('GUARD — (8) STAGE_A_TEXTS (the reducer\'s fixed texts) are byte for byte as before (9f64812e…) except the one text John changed on 22/11/2026, stepWhy (now 2fb1d130…)', sha(objSrc('STAGE_A_TEXTS')).startsWith('2fb1d130b4b8284c'));
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
// 10. THE PHONE (John, 22/11/2026, decision 15): the heading is ALWAYS in view when the list appears (and, UPDATED 22/11/2026 ⚑1, it is the ONE block that says what a tap does — the separate line of decision 15 is gone)
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  // UPDATED (22/11/2026, John's correction ⚑1): decision 15's separate line «Πάτα ό,τι ταιριάζει, θα μπει στο πεδίο και μπορείς να το αλλάξεις.» is gone — the new heading block says the same thing («πάτα το — θα μπει στο
  // πεδίο και μπορείς να το αλλάξεις»), and John asked for ONE block. (10.1)–(10.3) below were written for the separate line and are turned to the block: the same three questions, asked of the heading.
  const ask = (() => { const a = raw.indexOf('{stageAPhase === "ask" && ('); return a < 0 ? '' : raw.slice(a, raw.indexOf('{(stageAPhase === "card"', a)); })();
  assert('NEW — (10.1) UPDATED (22/11/2026, ⚑1): the separate line of decision 15 is gone — no ROOT_LIST_HINT constant, no second text under the heading, and the sentence «Πάτα ό,τι ταιριάζει…» is written nowhere in the app (its instruction lives in the heading block)',
    raw.indexOf('ROOT_LIST_HINT') === -1 && raw.indexOf('Πάτα ό,τι ταιριάζει') === -1 && Object.keys(F.ROOT_LIST_TEXTS).join() === 'title');
  assert('NEW — (10.2) UPDATED (22/11/2026, ⚑1): the heading block offers nothing of its own: no advice («πρέπει», «καλύτερα»), no ranking («τραβάει», «κέντρο»), and it names what a tap does (the box, and that it can be changed) and the way out (to write something not said yet)',
    typeof F.ROOT_LIST_TEXTS.title === 'string' && !/πρέπει|καλύτερα|τραβάει|κέντρο|σημαντικ/i.test(F.ROOT_LIST_TEXTS.title) && /πάτα το — θα μπει στο πεδίο και μπορείς να το αλλάξεις/.test(F.ROOT_LIST_TEXTS.title) && /Αν όχι, γράψε κάτι που δεν έχεις πει ακόμα\./.test(F.ROOT_LIST_TEXTS.title));
  assert('NEW — (10.3) UPDATED (22/11/2026, ⚑1): on the card the heading block is the ONLY text between the root question and the first button (nothing is added under it), and only for the 3-or-more list (the list of two has its instruction in its own title)',
    ask.length > 0 && /rootPick\.length\s*>=\s*ROOT_LIST_MIN\s*\?\s*ROOT_LIST_TEXTS\.title\s*:\s*ROOT_PICK_TEXTS\.title/.test(ask) && ask.indexOf('ROOT_LIST_TEXTS.title') > 0 && ask.indexOf('rootPick.map') > ask.indexOf('ROOT_LIST_TEXTS.title') && !/warning-text/.test(ask.slice(ask.indexOf('ROOT_LIST_TEXTS.title'), ask.indexOf('rootPick.map'))));
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
  // UPDATED (22/11/2026, ⚑2): the tap no longer calls setInput(t) with the bare sentence — the box is decided by rootPickTapBox (a box with text keeps it); the rest of the condition is as it was: the tap only writes to the box, the new scroll touches it not
  assert('GUARD — (10.9) UPDATED (22/11/2026, ⚑2): a tap still only writes into the box (setInput, now with the value rootPickTapBox decides); «Καμία από αυτές» still only closes the list (the new scroll touches neither)',
    (() => { const a = raw.indexOf('const handleRootPickTap = '), tap = raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1); return /setInput\(/.test(tap) && /rootPickTapBox\(/.test(tap) && !/scrollIntoView|rootListScrollPlan/.test(tap); })());
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 11. NEVER A SILENT DELETION OF THE USER'S WORDS (John, 22/11/2026, correction ⚑2): «Ποτέ σιωπηλή διαγραφή λόγων του χρήστη. Αν το πεδίο έχει κείμενο, η πρόταση προστίθεται σε νέα γραμμή. Μετά το «Δεν το
// βρήκα ακόμα», το πεδίο καθαρίζει ΜΟΝΟ αν περιέχει ακριβώς την αμετάβλητη πρόταση που μπήκε από την εφαρμογή.» The two decisions are two pure functions of the writing box, and the screen only asks them.
// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  // UPDATED (22/11/2026, written together with the code): rootPickTapBox takes TWO arguments — the box and the sentence. The middle argument these tests first gave it («what the app remembers») was never used by the tap: John's rule makes no
  // exception for the app's own earlier sentence (a second tap on a box that holds only the first sentence ADDS, as on any box with text — (11.5)), so the decision depends on the box and the sentence only. Nothing that is checked here changed.
  const tap = (c, s) => call('rootPickTapBox', c, s);
  const back = (c, a) => call('rootPickBackBox', c, a);
  const A = 'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο.', B = 'Θέλω περισσότερο χρόνο για την οικογένειά μου.';
  const MINE = 'Σκέφτομαι κάτι που δεν το έχω πει ακόμα';
  assert('NEW — (11.1) a tap on an EMPTY box puts exactly the sentence in it, and the app remembers that it put it there (appBox is the sentence)', j(tap('', A)) === j({ value: A, appBox: A }));
  assert('NEW — (11.2) a box with only spaces or line breaks counts as empty — there is no word of the user\'s in it — so the sentence is put in as it is', ['   ', '\n', ' \n \t', ' '].every(c => j(tap(c, A)) === j({ value: A, appBox: A })));
  assert('NEW — (11.3) a box WITH text keeps every character of it: the sentence comes on a NEW line, and the box is no longer «the app\'s» (appBox is null)', j(tap(MINE, A)) === j({ value: MINE + '\n' + A, appBox: null }));
  assert('NEW — (11.4) a text that already ends with a line break gets the sentence right after it — no blank line is made — and nothing is trimmed away', j(tap(MINE + '\n', A)) === j({ value: MINE + '\n' + A, appBox: null }) && j(tap(MINE + '  \n', A)) === j({ value: MINE + '  \n' + A, appBox: null }));
  assert('NEW — (11.5) a second tap on a box that holds only the app\'s sentence adds the second on a new line, and the box is no longer «exactly the sentence» (appBox is null)', j(tap(A, B)) === j({ value: A + '\n' + B, appBox: null }));
  assert('NEW — (11.6) a tap on a box where the user changed what the app put in keeps the user\'s change; the sentence comes after it; appBox is null', j(tap(A + ' και κάτι ακόμα', B)) === j({ value: A + ' και κάτι ακόμα\n' + B, appBox: null }));
  // a small seeded generator — the same boxes on every run
  let seed = 22112026; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  const ALPHA = ['α', 'β', 'ά', 'έ', 'ώ', 'ς', 'Ω', ' ', ' ', '\n', '\t', '.', ',', ';', '—', '«', '»', '1', 'x', '😀', ' '];
  const randStr = max => { let s = ''; const n = rnd(max + 1); for (let i = 0; i < n; i++) s += ALPHA[rnd(ALPHA.length)]; return s; };
  assert('NEW — (11.7) NEVER a silent deletion: for 2000 boxes with some text (letters, accents, spaces, line breaks, symbols) and any app sentence, the value after a tap STARTS WITH the box exactly as it was and ENDS WITH the sentence — and appBox is null; for a box with no text it is exactly the sentence',
    (() => { try { for (let k = 0; k < 2000; k++) { const c = randStr(40), s = 'Πρόταση ' + randStr(12) + 'τέλος'; const r = tap(c, s); if (!r || typeof r.value !== 'string') return false;
      if (c.trim() === '') { if (r.value !== s || r.appBox !== s) return false; } else if (!(r.value.startsWith(c) && r.value.endsWith(s) && r.value.length > c.length && r.appBox === null)) return false; } return true; } catch (e) { return false; } })());
  assert('NEW — (11.8) bad input never throws and never loses the box: a sentence that is not text, is empty or is only spaces leaves the box as it is; a box that is not text counts as empty; the result always has a text value',
    [[MINE, ''], [MINE, '   '], [MINE, undefined], [MINE, null], [MINE, 5], [MINE, {}]].every(([c, s]) => { const r = tap(c, s); return r && r.value === MINE && r.appBox === null; })
    && [undefined, null, 5, {}, []].every(c => { const r = tap(c, A); return r && r.value === A && r.appBox === A; }));
  assert('NEW — (11.9) «Δεν το βρήκα ακόμα» clears the box ONLY when it holds exactly the unchanged sentence the app put in: the box is the sentence and the app remembers the same sentence → empty', back(A, A) === '' && back(B, B) === '');
  assert('NEW — (11.10) …and never anything else: a space typed after it, a word before it, a letter changed, a second sentence, text of the user\'s with the sentence on a new line, a box the app did not fill (nothing remembered) — all stay exactly as they were',
    [[A + ' ', A], [' ' + A, A], [A.slice(0, -1), A], [A + '\n' + B, A], [MINE + '\n' + A, A], [A, null], [A, undefined], [A, ''], [A, B], [MINE, null], ['', null], ['', A]].every(([c, a]) => back(c, a) === c));
  assert('NEW — (11.11) NEVER a silent deletion, as a property (2000 boxes): what comes back is the box as it was, or an empty box — and an empty box only when the box was exactly what the app remembered (and that is not empty)',
    (() => { try { for (let k = 0; k < 2000; k++) { const c = randStr(30), a = rnd(2) === 0 ? null : (rnd(3) === 0 ? c : randStr(30)); const r = back(c, a); if (r !== c && !(r === '' && typeof a === 'string' && a !== '' && c === a)) return false; if (c === a && a !== '' && r !== '') return false; } return true; } catch (e) { return false; } })());
  assert('NEW — (11.12) bad input never throws: a box that is not text comes back as an empty text, and nothing is cleared', [undefined, null, 5, {}, []].every(c => back(c, A) === '' && back(c, null) === ''));
  // the screen only asks the two functions
  const tapSrc = (() => { const a = raw.indexOf('const handleRootPickTap = '); return a < 0 ? '' : raw.slice(a, raw.indexOf('\n  ', raw.indexOf(';', a)) + 1); })();
  const backSrc = (() => { const a = raw.indexOf('const handleStageABack = useCallback('); const e = raw.indexOf('}, [messages, mode, generateResponse, stageADispatch]);', a); return a < 0 || e < 0 ? '' : raw.slice(a, e); })();
  assert('NEW — (11.13) the tap asks rootPickTapBox with the box as it is NOW (input) and the sentence, writes the box (setInput) with the value it gets back, keeps the returned appBox (what the app put in) in the ref — and sends, opens, records nothing more than before (its one record is still list_picked with the place)',
    tapSrc.length > 0 && /const _b = rootPickTapBox\(input, t\);/.test(tapSrc) && /setInput\(_b\.value\);/.test(tapSrc) && /rootPickAppBox\.current = _b\.appBox;/.test(tapSrc) && !/handleSubmit|generateResponse|stageADispatch|stageAOpen|addUiBubble|setMessages|setRootPick/.test(tapSrc) && (tapSrc.match(/recordTelemetry\(/g) || []).length === 1);
  assert('NEW — (11.14) «Δεν το βρήκα ακόμα» (handleStageABack) clears the box through rootPickBackBox — at the root question only (phase "ask"), reading what the app remembers FIRST and forgetting it, with an update that sees the box as it is at that moment — and the rest of the handler is as it was (the dispatch of «back», the model\'s reply after the card of door 2)',
    backSrc.length > 0 && /if \(_ph === "ask"\) \{ const _app = rootPickAppBox\.current; rootPickAppBox\.current = null; setInput\(prev => rootPickBackBox\(prev, _app\)\); \}/.test(backSrc) && /stageADispatch\(\{ type: "back" \}\);/.test(backSrc) && /if \(_ph === "card" && _door === 2\) \{/.test(backSrc) && /generateResponse\(messages, mode\);/.test(backSrc));
  const resetSrc = (() => { const r = raw.indexOf('const resetSession = () => {'); return r < 0 ? '' : raw.slice(r, raw.indexOf('\n  };', r)); })();
  assert('NEW — (11.15) what the app remembers is forgotten at the FIRST change of the box (an effect on the box: a word typed, the box sent or emptied) — so a text the user types later that happens to equal the sentence is never cleared — the ref starts as null and a new session starts clean',
    /const rootPickAppBox = useRef\(null\);/.test(raw) && /useEffect\(\(\) => \{ if \(rootPickAppBox\.current !== null && rootPickAppBox\.current !== input\) rootPickAppBox\.current = null; \}, \[input\]\);/.test(raw) && /rootPickAppBox\.current = null;/.test(resetSrc));
  assert('GUARD — (11.16) «Καμία από αυτές» is untouched: it closes the list and does not read or change the box (the rule of ⚑2 names only «Δεν το βρήκα ακόμα»)',
    (() => { const b = raw.indexOf('const handleRootPickNone = '), none = raw.slice(b, raw.indexOf('\n  ', raw.indexOf(';', b)) + 1); return /setRootPick\(null\)/.test(none) && !/setInput|rootPickAppBox|rootPickBackBox|rootPickTapBox/.test(none); })());
}

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
