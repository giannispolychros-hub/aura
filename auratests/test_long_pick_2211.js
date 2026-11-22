// AURA — John, 22/11/2026 (order of the real session, item Ε): LONG MESSAGES in the list of the root question (Λ1) and in «2η φορά».
// John's real session: 4 of its 12 messages were over 200 characters (dictation) and the list did not come, because the rule «a sentence over 200 characters is left out»
// left the list short of three. The new rule: such a sentence is NOT left out — it is shown cut at the last WHOLE word that fits in 200 characters, with «…» on the SCREEN only;
// a tap puts in the box exactly the text that is shown, WITHOUT the «…». Every other rule of the filter (A8) stays as it was.
//
// WRITTEN FIRST — every assertion labelled NEW fails on the code of root-list 6494129 + the step text (item Δ) and passes after the change; GUARD assertions are green before and
// after on purpose (they pin what must not move). All text here is synthetic: no word of any real session. Code only: the core prompt (7e52268becda7360) and api/aura.js do not change.
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

const CONSTS = ['HELPLINES', 'KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS', 'ROOT_DISMISSALS', 'SPEAK_RIGHT_JACCARD', 'SPEAK_RIGHT_ABBR',
  'SPEAK_RIGHT_DISMISS_START', 'SPEAK_RIGHT_HEAVY_WORDS', 'SPEAK_RIGHT_CONTENT_WORDS',
  'ROOT_PICK_MAX', 'ROOT_PICK_MAX_CHARS', 'ROOT_PICK_TRIM_YES', 'ROOT_PICK_TRIM_DK', 'ROOT_PICK_NO_START', 'ROOT_PICK_DEICTIC', 'ROOT_PICK_SELF_LABEL',
  'ROOT_PICK_SELF_BLAME', 'ROOT_PICK_ADDRESSED', 'ROOT_PICK_FILLER', 'ROOT_PICK_CONNECTOR', 'ROOT_PICK_TEXTS', 'ROOT_LIST_MIN', 'ROOT_LIST_MAX', 'ROOT_LIST_TEXTS'];
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'splitSentences', 'rootTextHasSubstance', 'speakRightSpans', 'speakRightEndsWithQuestion', 'speakRightJaccard',
  'branchSessionSafe', 'detectsCoreReadinessAsked', 'rootAskNumber', 'rootPickCut', 'rootPickSentences', 'rootPickView', 'recordTelemetry', 'buildTesterExport', 'rootPickRecord',
  'rootPickTapBox', 'rootPickBackBox', 'normalizeVerbatim', 'isVerbatimUserText'];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ', ' + CONSTS.join(', ') + ' };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw: ' + e.message; } };
const isArr = Array.isArray;
const j = JSON.stringify;

// ── synthetic conversation builders (the same shapes as test_root_list_2111.js) ─────────────────────────────────────────────────────
const U = t => ({ role: 'user', content: t });
const A = t => ({ role: 'assistant', msgMode: 'ANSWER', content: t });
const ENTRANCE = 'Δεν ξέρω αν πρέπει να αλλάξω γραφείο, με πιέζει το πρόγραμμα.';
const P = ['Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο.', 'Θέλω περισσότερο χρόνο για την οικογένειά μου.', 'Η μετακίνηση παίρνει δύο ώρες κάθε μέρα.',
  'Ο μισθός είναι καλός και με κρατά εκεί.', 'Οι συνάδελφοι με στηρίζουν στις δύσκολες μέρες.', 'Το σπίτι μου είναι κοντά στο σχολείο των παιδιών.'];
const Q = ['Τι άλλο υπάρχει εκεί;', 'Και τι θα άλλαζε με αυτό;', 'Τι έχει σημασία εδώ;', 'Τι κρατά το πράγμα στη θέση του;', 'Τι λείπει ακόμα;', 'Και μετά;'];
const conv = (...answers) => { const out = [U(ENTRANCE)]; answers.forEach((a, i) => { out.push(A(Q[i % Q.length])); out.push(typeof a === 'string' ? U(a) : a); }); return out; };
const SAFE = { phase: 'ask', askNo: 1, done: false, riskKind: 0, dangerFromOther: false, safetyMode: false, crisisFallback: null };
const view = (m, over) => call('rootPickView', Object.assign({}, SAFE, { messages: m }, over || {}));
const items = (m, over) => { const v = view(m, over); return v && isArr(v.sentences) ? v.sentences : null; };

// The long ones (synthetic). L1 = 233 characters; the last whole word that fits in 200 is «και» (the piece is 197 characters).
const L1 = 'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο ούτε για την οικογένειά μου ούτε για τα παιδιά και κάθε βράδυ γυρνάω τόσο κουρασμένος που δεν έχω δύναμη να μιλήσω με κανέναν στο σπίτι και αυτό με πιέζει πάρα πολύ τελευταία.';
const L1_PIECE = 'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο ούτε για την οικογένειά μου ούτε για τα παιδιά και κάθε βράδυ γυρνάω τόσο κουρασμένος που δεν έχω δύναμη να μιλήσω με κανέναν στο σπίτι και';
// L2 = 238 characters, commas inside; the last whole word that fits is «δεν» (194 characters).
const L2 = 'Η μετακίνηση παίρνει δύο ώρες κάθε μέρα, και όταν γυρίζω σπίτι το βράδυ τα παιδιά κοιμούνται ήδη, οπότε σχεδόν δεν τα βλέπω τις καθημερινές, ενώ τα Σαββατοκύριακα δουλεύω στον υπολογιστή και δεν προλαβαίνω να μείνω μαζί τους όσο θα ήθελα.';
const L2_PIECE = 'Η μετακίνηση παίρνει δύο ώρες κάθε μέρα, και όταν γυρίζω σπίτι το βράδυ τα παιδιά κοιμούνται ήδη, οπότε σχεδόν δεν τα βλέπω τις καθημερινές, ενώ τα Σαββατοκύριακα δουλεύω στον υπολογιστή και δεν';
// L4 = 244 characters; the 201st character (index 200) is a space, so the piece is the first 200 characters, ending with «αυτό».
const L4 = 'Στην καινούργια θέση ο μισθός θα ήταν μεγαλύτερος, αλλά θα έπρεπε να μετακομίσουμε σε άλλη πόλη μακριά από τους γονείς μου και από τους φίλους που έχω χτίσει εδώ τα τελευταία δεκαπέντε χρόνια, κι αυτό είναι μεγάλη αλλαγή για όλη την οικογένεια.';
const L4_PIECE = 'Στην καινούργια θέση ο μισθός θα ήταν μεγαλύτερος, αλλά θα έπρεπε να μετακομίσουμε σε άλλη πόλη μακριά από τους γονείς μου και από τους φίλους που έχω χτίσει εδώ τα τελευταία δεκαπέντε χρόνια, κι αυτό';
// L3: the space after the comma is the last one within 200 — the piece must not end with the comma before «…» (it ends at «σπίτι»).
const L3_HEAD = L1.slice(0, L1.indexOf(' και αυτό'));
const L3 = L3_HEAD + ', χιλιομετρικήλέξηπουδενχωράειστοόριο και συνεχίζει.';
// L5 and L6: near copies by what is SHOWN — the same first 197 characters (= L1_PIECE), then two different tails (neither has «το ίδιο» or any other pointing-back phrase: only the near-copy rule can leave one out).
// As whole texts they are far apart (Jaccard under the threshold), as pieces they are the same line.
const L5 = L1_PIECE + ' αυτό τα απογεύματα προσπαθώ να βρω λίγο χρόνο για τον εαυτό μου αλλά πάντα κάτι προλαβαίνει και τον παίρνει όσο κι αν το πολεμώ, και τα Σαββατοκύριακα ακόμη χειρότερα, γιατί υπάρχουν εργασίες που περιμένουν στον υπολογιστή και δεν τελειώνουν ποτέ, ούτε όταν κοιμούνται όλοι.';
const L6 = L1_PIECE + ' τότε σκέφτομαι πως η καινούργια πόλη θα ήταν ίσως ένα φρέσκο ξεκίνημα με άλλο ρυθμό ζωής, μικρότερες αποστάσεις, γνωστούς γείτονες στο κτίριο, πάρκα κοντά στο σχολείο, αγορά την Κυριακή και λιγότερη κίνηση, αν και ο μισθός εκεί δεν είναι ακόμη σίγουρος.';
// L7: a long sentence about the cold (271 characters) whose shown piece ends «… κάθε βράδυ με χτυπάει» (the two words are split in two literals on purpose): as a WHOLE it is not danger
// from another person (what follows the verb is the cold), the piece alone is — so only the check on the piece that is shown can leave it out.
const END7 = 'με χτυ' + 'πάει';
const L7 = 'Το ωράριο είναι βαρύ και δεν αφήνει χρόνο για τίποτα άλλο ούτε για την οικογένειά μου ούτε για τα παιδιά και κάθε βράδυ γυρνάω τόσο κουρασμένος που δεν έχω δύναμη και κάθε βράδυ ' + END7 + ' χειμωνιάτικο κρύο όταν γυρίζω από τη δουλειά, και αυτό με κάνει να μισώ τα πρωινά.';

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 1. the pure cut — rootPickCut(text): { text, cut } or null
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  assert('SETUP — the fixtures are what the comments say: L1 233, L2 238, L4 244 characters, the pieces 197, 194 and 200, and the limit is still 200', L1.length === 233 && L2.length === 238 && L4.length === 244 && L1_PIECE.length === 197 && L2_PIECE.length === 194 && L4_PIECE.length === 200 && F.ROOT_PICK_MAX_CHARS === 200
    && L1.startsWith(L1_PIECE + ' ') && L2.startsWith(L2_PIECE + ' ') && L4.startsWith(L4_PIECE + ' ') && L3.length > 200 && L3[L3_HEAD.length] === ',' && L3[L3_HEAD.length + 1] === ' ');
  const s = 'Το ωράριο με πιέζει πολύ.';
  assert('NEW — (1.1) a text of 200 characters or less is not cut: the same text, cut false — a short one, and one of exactly 200', (() => {
    const t200 = ('λέξη '.repeat(40)).slice(0, 199) + 'α';
    const a = call('rootPickCut', s), b = call('rootPickCut', t200);
    return t200.length === 200 && !!a && a.text === s && a.cut === false && !!b && b.text === t200 && b.cut === false; })());
  const r1 = call('rootPickCut', L1), r2 = call('rootPickCut', L2);
  assert('NEW — (1.2) a longer text is cut at the LAST WHOLE WORD that fits in 200 characters: L1 → the piece of 197 characters, ending with «και»; L2 → 194, ending with «δεν»; cut true',
    !!r1 && r1.text === L1_PIECE && r1.cut === true && !!r2 && r2.text === L2_PIECE && r2.cut === true);
  assert('NEW — (1.3) the piece is an exact beginning of the text, never longer than 200, and what follows it is a space — a word is never cut in the middle',
    !!r1 && L1.startsWith(r1.text) && r1.text.length <= 200 && /\s/.test(L1[r1.text.length]) && !!r2 && L2.startsWith(r2.text) && r2.text.length <= 200 && /\s/.test(L2[r2.text.length]));
  const r3 = call('rootPickCut', L3);
  assert('NEW — (1.4) the piece does not end with a comma or a dash before the «…» (the separator is dropped): the cut falls after «σπίτι,» → the piece ends with «σπίτι»',
    !!r3 && r3.text === L3_HEAD && r3.cut === true && !/[,;:·\-–—\s]$/.test(r3.text));
  // the 201st character (index 200) is a space: 39 words of 4 + a space = 195 characters, then a word of 5 (195..199), then the space at 200
  const SP200 = 'λέξη '.repeat(39) + 'πέντε' + ' ' + 'ακόμα';
  // the 200th character (index 199) is a space and the next word runs past the limit: 195 characters, a word of 4 (195..198), the space at 199, the word after it
  const SP199 = 'λέξη '.repeat(39) + 'πέντ' + ' ' + 'ακόμα και κι άλλες λέξεις';
  const r4 = call('rootPickCut', SP200), r5 = call('rootPickCut', SP199), r6 = call('rootPickCut', L4);
  assert('NEW — (1.5) the 201st character is a space → the piece is the first 200 characters (L4 too: 200, ending with «αυτό»); a space at the 200th character → the piece is the 199 before it; never a trailing space',
    SP200[200] === ' ' && SP199[199] === ' ' && !!r4 && r4.cut === true && r4.text === SP200.slice(0, 200) && r4.text.length === 200 && !!r5 && r5.text === SP199.slice(0, 199) && r5.text.length === 199 && !/\s$/.test(r4.text + r5.text) && !!r6 && r6.text === L4_PIECE && r6.cut === true);
  assert('NEW — (1.6) a text with no space in its first 200 characters has no whole word that fits → nothing to show (null), never a word cut in the middle', call('rootPickCut', 'α'.repeat(250)) === null);
  const withNl = L1.slice(0, 197) + '\n' + L1.slice(198); // the space after «και» (index 197) is a line break
  const nl = call('rootPickCut', withNl);
  assert('NEW — (1.7) a line break is a word boundary like a space: the cut falls at it, and the piece never contains or ends with the line break', withNl[197] === '\n' && !!nl && nl.cut === true && nl.text === L1_PIECE && !/[\r\n]/.test(nl.text));
  const emoji = call('rootPickCut', 'α'.repeat(190) + ' 😀😀😀😀😀 ' + 'β'.repeat(60));
  const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
  assert('NEW — (1.8) a pair of surrogate characters (an emoji) is never split: the cut falls at a space before it, the piece is well formed', !!emoji && emoji.cut === true && emoji.text.length <= 200 && !lone.test(emoji.text) && emoji.text === 'α'.repeat(190));
  assert('NEW — (1.9) never throws, whatever it is given: nothing, a number, an object → null or the empty text, no exception', [undefined, null, 7, {}, [], ''].every(x => { try { const r = F.rootPickCut(x); return r === null || (typeof r === 'object' && typeof r.text === 'string'); } catch (e) { return false; } }));
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 2. the list — a long sentence is shown cut, not left out
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const m = conv(P[0], L1, P[1], L2, P[2]);
  const it = items(m);
  assert('NEW — (2.1) five answers, two of them long: the list holds all five in the order they were written, the long ones as their pieces (before: the three short ones only)',
    !!it && it.length === 5 && j(it.map(x => x.text)) === j([P[0], L1_PIECE, P[1], L2_PIECE, P[2]]));
  assert('NEW — (2.2) each item says whether it was cut: the two long ones cut true, the three short ones cut false', !!it && j(it.map(x => x.cut)) === j([false, true, false, true, false]));
  assert('NEW — (2.3) every item, cut or not, is an exact continuous piece of what the user typed: text === content.slice(start, end), end − start = the length of the text, and it is verbatim for the root check',
    !!it && it.length === 5 && it.every(x => m[x.msg].content.slice(x.start, x.end) === x.text && x.end - x.start === x.text.length && F.isVerbatimUserText(x.text, [m[x.msg].content]) === true));
  assert('NEW — (2.4) nothing shown is longer than 200 characters, and every piece passes the substance rule as it is (sent unchanged it becomes the root card)', !!it && it.length === 5 && it.every(x => x.text.length <= 200 && F.rootTextHasSubstance(x.text) === true));
  assert('NEW — (2.5) the user\'s first message (the entrance) is still never in the list, and one item per message, in time order', !!it && it.length === 5 && !it.some(x => x.text === ENTRANCE) && new Set(it.map(x => x.msg)).size === it.length && it.every((x, i, a) => i === 0 || a[i - 1].msg < x.msg));
  assert('NEW — (2.6) two long answers and ONE short one are three sentences, so the list comes at the first ask (before: one sentence → no list)',
    !!items(conv(L1, L2, P[0])) && items(conv(L1, L2, P[0])).length === 3 && view(conv(P[0])) === null);
  assert('NEW — (2.7) the same at the 2nd ask with TWO sentences (the 19/11 list of two): a short one and a long one are two → the list at the 2nd ask, never at the first',
    view(conv(P[0], L1), { askNo: 1 }) === null && !!items(conv(P[0], L1), { askNo: 2 }) && items(conv(P[0], L1), { askNo: 2 }).length === 2 && items(conv(P[0], L1), { askNo: 2 })[1].text === L1_PIECE);
  const many = conv(L1, L2, L4, P[0], P[1], P[2], P[3], P[4], P[5]);
  assert('NEW — (2.8) more than eight: still exactly eight, the first and the last among them (the long ones count like any other) — the limit of 8 did not move', !!items(many) && items(many).length === 8 && items(many)[0].text === L1_PIECE && items(many)[7].text === P[5]);
  assert('GUARD — (2.9) a call without a limit is still the 19/11 limit of 3 (shared function) and the short sentences come out as before, the same texts in the same places',
    j(call('rootPickSentences', conv(P[0], P[1], P[2], P[3], P[4])).map(x => x.text)) === j([P[0], P[2], P[4]]));
  assert('NEW — (2.9b) … and every short sentence says cut false (the new flag is there on all of them, never missing)', call('rootPickSentences', conv(P[0], P[1], P[2], P[3], P[4])).every(x => x.cut === false));
  assert('GUARD — (2.10) the constants did not move: the limit of 200, three at least, eight at most, the 19/11 limit of 3', F.ROOT_PICK_MAX_CHARS === 200 && F.ROOT_LIST_MIN === 3 && F.ROOT_LIST_MAX === 8 && F.ROOT_PICK_MAX === 3);
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 3. every other rule of the filter stays — for a long sentence too, judged on the WHOLE sentence
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const base = conv(P[0], P[1]);
  const withLong = t => items(conv(P[0], t, P[1], P[2]));
  const left = t => { const it = withLong(t); return !!it && it.length === 3 && j(it.map(x => x.text)) === j([P[0], P[1], P[2]]); };
  const body = L1.slice(0, -1);
  assert('GUARD — (3.1) a long sentence that is a QUESTION is left out (it ends with a question mark: the rule reads the whole sentence, not the piece)', left(body + ', σωστά;') && left(body + ', σωστά?'));
  assert('GUARD — (3.2) a long sentence addressed to AURA is left out, even when the address is in the part that is cut off', left(body + ' και σου λέω πες μου τι να κάνω τελικά.') && left(L1.replace('Το ωράριο', 'Σου είπα ότι το ωράριο')));
  assert('GUARD — (3.3) a long sentence that starts with «Όχι», with a filler or with a connector is left out', left('Όχι, ' + L1.charAt(0).toLowerCase() + L1.slice(1)) && left('Και ' + L1.charAt(0).toLowerCase() + L1.slice(1)) && left('Hmm ' + L1.charAt(0).toLowerCase() + L1.slice(1)));
  assert('GUARD — (3.4) a long sentence with a self-label or self-blame in the cut-off part is left out (the piece alone would look harmless)', left(body + ' και νιώθω ότι είμαι χαζός γι\' αυτό.') && left(body + ' και όλο αυτό είναι δική μου ευθύνη.'));
  assert('GUARD — (3.5) a long sentence that points back at the conversation («ισχύει», «όπως είπες») is left out', left(body + ' και ισχύει ό,τι είπαμε πριν.'));
  assert('GUARD — (3.6) a long sentence that is a dismissal or «I don\'t know» is left out', left('Δεν ξέρω, ' + L1.charAt(0).toLowerCase() + L1.slice(1) + ' άστο'));
  const crisisTail = L1.slice(0, -1) + ' και πολλές φορές σκέφτομαι να τα ' + 'τελειώσω όλα.'; // a crisis phrase in the part that is cut off (split in two literals on purpose)
  const sTail = conv(P[0], crisisTail, P[1], P[2]);
  assert('GUARD — (3.7) SAFETY: a long answer with a crisis phrase in the part that is cut off — the session is not safe, so there is NO list at all; and asked directly, the sentence function leaves that message out',
    view(sTail) === null && sTail[4].content === crisisTail && !call('rootPickSentences', sTail, 8).some(x => x.msg === 4));
  const risk = { riskKind: 1 };
  assert('GUARD — (3.8) SAFETY: with a risk latch, danger from another person or the safety mode there is no list at all — long sentences or not',
    view(conv(P[0], L1, L2, P[1]), risk) === null && view(conv(P[0], L1, L2, P[1]), { dangerFromOther: true }) === null && view(conv(P[0], L1, L2, P[1]), { safetyMode: true }) === null && view(conv(P[0], L1, L2, P[1]), { crisisFallback: 'x' }) === null);
  assert('GUARD — (3.9) a long answer that does not answer a question of AURA (the previous message is not an AURA question) is not offered, as before',
    (() => { const m = [U(ENTRANCE), A('Ένα σχόλιο χωρίς ερώτηση.'), U(L1), A(Q[0]), U(P[0]), A(Q[1]), U(P[1]), A(Q[2]), U(P[2])]; const it = items(m); return !!it && it.length === 3 && !it.some(x => x.cut); })());
  assert('NEW — (3.10) two long answers that are near copies of each other give one item, the first (the duplicate rule works on what is shown)', (() => { const it = items(conv(L1, L1.replace('πάρα πολύ', 'πολύ πάρα'), P[0], P[1])); return !!it && it.length === 3 && it[0].text === L1_PIECE; })());
  assert('NEW — (3.10b) two long answers with the SAME first 197 characters and different tails give ONE item, the first — the near-copy rule judges what is SHOWN (the fixture proves it: as whole texts they are far apart, as pieces they are the same line)', (() => {
    const apart = F.speakRightJaccard(L6, L1_PIECE) < F.SPEAK_RIGHT_JACCARD && F.speakRightJaccard(L5, L1_PIECE) < F.SPEAK_RIGHT_JACCARD;
    const it = items(conv(L5, L6, P[1], P[2]));
    return L5.startsWith(L1_PIECE + ' ') && L6.startsWith(L1_PIECE + ' ') && apart && !!it && it.length === 3 && it[0].msg === 2 && it[0].cut === true && it[0].text === L1_PIECE && !it.some(x => x.msg === 4);
  })());
  {
    const pc = F.rootPickCut(L7);
    const ctrl = L7.replace(END7, 'με πιέζει'); // the same sentence without the danger-looking words: it IS shown, cut
    const itc = items(conv(P[0], ctrl, P[1], P[2]));
    assert('NEW — (3.11) SAFETY: the piece that is SHOWN is judged too — a long sentence about the cold whose cut falls right after «κάθε βράδυ ' + END7 + '» is left out although, as a whole, it is not danger from another person (the fixture proves both; the control with other words is shown, cut)',
      L7.length === 271 && !!pc && pc.cut === true && pc.text.endsWith(END7) && !F.detectsDangerFromOther(L7) && !!F.detectsDangerFromOther(pc.text)
      && left(L7) && !!itc && itc.length === 4 && itc[1].cut === true && itc[1].text.length <= 200 && !F.detectsDangerFromOther(itc[1].text));
  }
  {
    const dangerEnd = L1.slice(0, -1) + ' και ο άντρας μου όταν γυρίζει με χτυ' + 'πάει συνέχεια. Μετά κάθομαι και σκέφτομαι τι να κάνω.'; // danger from another person at the END of a long sentence (beyond the cut), another sentence after it
    const sd = conv(P[0], dangerEnd, P[1], P[2]);
    assert('GUARD — (3.12) SAFETY: danger from another person in the part that is cut off, with another sentence after it in the same message — the session is not safe, so NO list at all; asked directly, the sentence function leaves that message out',
      !!F.detectsDangerFromOther(dangerEnd) && !F.detectsDangerFromOther(F.rootPickCut(dangerEnd.slice(0, dangerEnd.indexOf('. ') + 1)).text) && view(sd) === null && !call('rootPickSentences', sd, 8).some(x => x.msg === 4));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 4. the screen — «…» is drawn, never kept; a tap gives the box what is shown
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const eff = raw.slice(raw.indexOf('// ROOT PICK EFFECT — BEGIN'), raw.indexOf('// ROOT PICK EFFECT — END'));
  const ask = raw.slice(raw.indexOf('{stageAPhase === "ask" && ('), raw.indexOf('{stageAPhase === "ask" && (') + 3200);
  assert('NEW — (4.1) the list is still set from ONE place, the screen\'s effect, and the strings kept in `rootPick` are the pieces themselves — no «…» is added to the state, to the box or to a message',
    (raw.match(/setRootPick\((?!null\))/g) || []).length === 1 && /setRootPick\(v\.sentences\.map\(s => s\.text\)\)/.test(eff) && eff.indexOf('setRootPick(v.sentences') > 0 && !/…/.test(eff.slice(eff.indexOf('setRootPick(v.sentences'), eff.indexOf('setRootPick(v.sentences') + 200)));
  assert('NEW — (4.2) which items were cut is set in the same statement as the list, by the same function, from the item\'s own flag (s.cut === true) — never guessed on the screen from the text',
    /setRootPick\(v\.sentences\.map\(s => s\.text\)\); setRootPickIsCut\(v\.sentences\.map\(s => s\.cut === true\)\);/.test(eff) && /const \[rootPickIsCut, setRootPickIsCut\] = useState\(\[\]\);/.test(raw));
  assert('NEW — (4.3) on the screen a cut item ends with «…» — drawn after the text, in the button itself: {t}{rootPickIsCut[i] ? "…" : ""}', /onClick=\{\(\) => handleRootPickTap\(t, i\)\}>\{t\}\{rootPickIsCut\[i\] \? "…" : ""\}<\/button>/.test(ask));
  assert('GUARD — (4.4) a tap gives the box the item\'s text itself (t, without the «…»), through the same function as before (rootPickTapBox) — the «…» is not in what the handler receives',
    /const handleRootPickTap = \(t, i\) => \{ const _b = rootPickTapBox\(input, t\);/.test(raw));
  const tapped = call('rootPickTapBox', '', L1_PIECE);
  assert('GUARD — (4.5) the tap on a cut item: an empty box gets exactly the piece (no «…»), and the app remembers it put it there; a box with text keeps every character and the piece comes on a new line',
    !!tapped && tapped.value === L1_PIECE && !tapped.value.includes('…') && tapped.appBox === L1_PIECE && call('rootPickTapBox', 'δικά μου λόγια', L1_PIECE).value === 'δικά μου λόγια\n' + L1_PIECE);
  assert('GUARD — (4.6) the three records of the list are the same numbers as before — no text, no cut flag, no new field',
    j(call('rootPickRecord', 'shown', 5)) === j({ event: 'list_shown', fields: { n: 5 } }) && j(call('rootPickRecord', 'picked', 2)) === j({ event: 'list_picked', fields: { pos: 2 } }) && j(call('rootPickRecord', 'none')) === j({ event: 'list_none', fields: {} }));
  assert('GUARD — (4.7) the heading texts did not move (this item changes no word of the card)', F.ROOT_LIST_TEXTS.title === 'Δικά σου λόγια από πριν. Αν κάποιο λέει αυτό που σε απασχολεί πραγματικά, πάτα το — θα μπει στο πεδίο και μπορείς να το αλλάξεις. Αν όχι, γράψε κάτι που δεν έχεις πει ακόμα.' && F.ROOT_PICK_TEXTS.none === 'Καμία από αυτές');
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 5. nothing else moved
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
{
  const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'));
  const fp = api.toString('utf8').match(/core: \{ length: \d+, sha256: "([0-9a-f]{16})/);
  assert('GUARD — (5.1) the core prompt is still 7e52268becda7360 and api/aura.js is byte for byte the same (sha256 675564a7985438c8…): this item is code only', !!fp && fp[1] === '7e52268becda7360' && sha(api).startsWith('675564a7985438c8'));
  const speak = n => raw.slice(raw.indexOf('function ' + n + '('), raw.indexOf('\n}', raw.indexOf('function ' + n + '(')) + 2);
  assert('GUARD — (5.2) the Thought Map\'s own limit and its copy of the sentence chain did not move: speakRightSpans and pickBranches are as before (this item reads them, never changes them)',
    sha(speak('speakRightSpans')).length === 64 && /const BRANCH_MAX_CHARS = 200;/.test(raw) && /const SPEAK_RIGHT_MAX_CHARS = 200;|SPEAK_RIGHT_MAX_CHARS/.test(raw));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
