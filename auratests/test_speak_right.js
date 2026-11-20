// AURA — «δικαίωμα ομιλίας από υλικό» (John, 15/11/2026): commit 5 of the branch conversation-v1, on d7bea8f. Code only: the fixed prompt (b5f303cc9405aa21),
// api/aura.js, the screen filter and the safety path (the requests of NQS, byte for byte) are not touched.
//  A permission, never an order: when the user has given enough material, ONE note tells the model it MAY say back a short connection of different things they
//  gave — what it does not know yet, open for them to correct. If another question is worth more, or they ask for something else, it does that instead.
//  (1) the words and the material (mass, a word that comes back, the Thought Map's own phrases, a self-marked tension) — message NUMBERS only, never their text
//  (2) the trigger А ∧ (В ∨ Г), the holds (safety path, readiness question pending, Stage A before the root only), the pace (a retry is the same turn)
//  (3) the text of the note (permission, shape, limits, what it overrides for this one reply and what it never does); the api guard accepts it
//  (4) ONE note with the ROUND TYPE note when both are lit (no two notes that disagree); the follow-up on the next message
//  (5) the wiring, the labels of the stress tool, the explicit sentence about the thresholds and where the sample comes from
//  (6) the filters: the example of John's passes untouched, a sentence that STARTS with «Άρα» does not (so the note forbids it)
//  (7) what this commit must not touch
// All text here is synthetic (made-up words, neutral sentences); John's example of an acceptable synthesis is used only as a fixture for the filters.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond === true) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '', 'utf8').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1);
  const line = raw.slice(a + 1, eol); if (/;\s*(?:\/\/.*)?$/.test(line)) return line; return raw.slice(a + 1, raw.indexOf('\n];', a) + 3); };
const safely = (label, fn) => { try { fn(); } catch (e) { assert(label + ' — the check itself threw: ' + e.message, false); } };
const OPENINGS = (() => { const i = api.indexOf('openings: ['); return JSON.parse('[' + api.slice(i + 11, api.indexOf('],', i)).trim().replace(/,\s*$/, '') + ']'); })();
const guardAccepts = block => OPENINGS.some(o => block.replace(/^\n/, '').startsWith(o));
const guardBlocks = text => text.split(/\n(?=\[)/).map(p => p.replace(/^\s+/, '')).filter(Boolean);

// ── load: the Thought Map's functions (the phrases), the tension detector, the ROUND TYPE note and the new functions ───────────────────────────────
const CONSTS = ['HELPLINES', 'KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_DISMISSALS', 'BRANCH_MAX', 'BRANCH_MAX_CHARS', 'BRANCH_JACCARD', 'BRANCH_ABBREVIATIONS',
  'BRANCH_DISMISS_START', 'BRANCH_HEAVY_WORDS', 'BRANCH_CONTENT_WORDS', 'SPEAK_RIGHT_PARAMS', 'SPEAK_RIGHT_STOP', 'SPEAK_RIGHT_FOLLOWUP_BODY',
  'SPEAK_RIGHT_MAX_CHARS', 'SPEAK_RIGHT_JACCARD', 'SPEAK_RIGHT_ABBR', 'SPEAK_RIGHT_DISMISS_START', 'SPEAK_RIGHT_CONTENT_WORDS', 'SPEAK_RIGHT_HEAVY_WORDS'];
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'splitSentences', 'pickKnewSnippet', 'branchSentenceSpans', 'branchAuraEndsWithQuestion', 'branchWords',
  'branchJaccard', 'branchSessionSafe', 'pickBranches', 'detectSelfMarkedTension', 'trailingQuestionReplies', 'userSaysDontKnowTwice', 'describeRoundTypeCtx',
  'speakRightWords', 'speakRightSpans', 'speakRightEndsWithQuestion', 'speakRightJaccard', 'speakRightPhrases', 'speakRightCounts', 'speakRightPhraseCounts', 'speakRightMaterial', 'speakRightDecision', 'describeSpeakRightCtx'];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ', SPEAK_RIGHT_PARAMS, SPEAK_RIGHT_STOP, SPEAK_RIGHT_MAX_CHARS, SPEAK_RIGHT_JACCARD, SPEAK_RIGHT_ABBR, SPEAK_RIGHT_DISMISS_START, SPEAK_RIGHT_CONTENT_WORDS, SPEAK_RIGHT_HEAVY_WORDS, BRANCH_MAX_CHARS, BRANCH_JACCARD, BRANCH_ABBREVIATIONS, BRANCH_DISMISS_START, BRANCH_CONTENT_WORDS, BRANCH_HEAVY_WORDS };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return { threw: e.message }; } };
const threw = x => x && typeof x === 'object' && typeof x.threw === 'string';
assert('(load) the new functions and constants are in src/App.jsx, and the functions they build on load',
  ['speakRightWords', 'speakRightSpans', 'speakRightEndsWithQuestion', 'speakRightJaccard', 'speakRightPhrases', 'speakRightCounts', 'speakRightPhraseCounts', 'speakRightMaterial', 'speakRightDecision', 'describeSpeakRightCtx'].every(n => fnSrc(n) !== '') && constSrc('SPEAK_RIGHT_PARAMS') !== '' && constSrc('SPEAK_RIGHT_STOP') !== '' &&
  FNS.every(n => typeof F[n] === 'function'));

// ── the definition the thresholds were measured with (sy1, the 76 stored sessions) — written here independently, as the specification ────────────────
const SPEC_STOP = new Set(['ειναι','εχω','θελω','αυτο','αυτη','αυτος','αυτα','κατι','πολυ','οταν','γιατι','επειδη','ομως','αλλα','μονο','ακομα','παντα','ποτε','τωρα','εδω','εκει','μου','σου','τους','μας','σας','εγω','εσυ','ειχα','ειχε','μπορω','πρεπει','νομιζω','ξερω','κανω','κανει','λεω','λεει','ηταν','ειμαι','εχει','εχουν','ισως','λιγο','πιο','τιποτα','κατι','ολα','ολο','ολη','ολοι','μετα','πριν','πανω','κατω','χωρις','μαζι','περισσοτερο','πραγματικα','δηλαδη','οπως','ετσι','αρκετα','σχεδον','μερικες','μερικα','καθε','καποιος','καποια','καποιο','υπαρχει','υπαρχουν','γινει','γινεται','εγινε','μιλαω']);
const specFold = w => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const specWords = t => (String(t || '').toLowerCase().match(/[a-zα-ωάέήίόύώϊϋΐΰ]{5,}/g) || []).map(specFold).filter(w => !SPEC_STOP.has(w));
const specMass = users => { const all = new Set(); users.forEach(u => specWords(u).forEach(w => all.add(w))); return all.size; };
const specRecur = users => { const c = new Map(); users.forEach(u => new Set(specWords(u)).forEach(w => c.set(w, (c.get(w) || 0) + 1))); return [...c.values()].filter(v => v >= 3).length; };

// ── builders: made-up words (5 letters, never a stop word), user messages, AURA's replies that end in a question ─────────────────────────────────────
const GL = 'αβγδεζηθικλμνξοπρστυφχψω';
const tok = i => 'μμ' + GL[Math.floor(i / 576) % 24] + GL[Math.floor(i / 24) % 24] + GL[i % 24];
const toks = (from, n) => Array.from({ length: n }, (_, j) => tok(from + j));
const U = t => ({ role: 'user', content: t });
const A = (i, q = true) => ({ role: 'assistant', msgMode: 'ANSWER', content: q ? 'Τι σημαίνει το μέρος ' + i + ' για σένα;' : 'Άκουσα το μέρος ' + i + '.' });
const SHARED = tok(5000), SHARED2 = tok(5001);
const TENSION = ' θέλω να φύγω αλλά φοβάμαι τη σιγουριά';
// n user messages; message k has 5 own made-up words (+ the shared word if k is in sharedIn) (+ a self-marked tension if k is in tensionIn); `extra` more words in the last one;
// a message after a reply that is not a question is not a phrase for the Thought Map (qFalse lists the replies that are statements)
function mk({ n = 5, sharedIn = [], shared2In = [], tensionIn = [], extra = 0, qFalse = [], tail = null } = {}) {
  const m = []; let next = 100;
  for (let k = 1; k <= n; k++) {
    const own = toks(next, 5); next += 5;
    let words = own.slice();
    if (sharedIn.includes(k)) words.push(SHARED);
    if (shared2In.includes(k)) words.push(SHARED2);
    if (k === n && extra > 0) { words = words.concat(toks(next, extra)); next += extra; }
    let t = words.join(' ');
    if (tensionIn.includes(k)) t += TENSION;
    m.push(U(t + '.'));
    if (k < n) m.push(A(k, !qFalse.includes(k)));
  }
  if (tail) m.push(...tail);
  return m;
}
const usersOf = msgs => msgs.filter(x => x.role === 'user').map(x => x.content);
// the same conversation with the last user message padded (or cut) to a mass exactly equal to `target`
function atMass(opts, target) {
  const base = mk(Object.assign({}, opts, { extra: 0 }));
  const massOf = ex => specMass(usersOf(mk(Object.assign({}, opts, { extra: ex }))));
  let ex = 0; while (massOf(ex) < target && ex < 200) ex++;
  return massOf(ex) === target ? mk(Object.assign({}, opts, { extra: ex })) : null;
}
const RISK0 = {};
let seed = 20261115; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }; // a fixed seed: the same 'random' conversations every run

// ── (1) the words and the parameters ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(1)', () => {
  const W = t => call('speakRightWords', t);
  const same = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
  const hand = ['Η Εξεταστική και το ΕΝΟΙΚΙΟ είναι μεγάλα', 'Δεν ξέρω αν θα αντέξω, ίσως μπορέσω να πάω εκεί αύριο.', 'ΣΧΟΛΉ σχολή Σχολής σχολη', 'abcde abcd ABCDEF 12345 αβγδ', '', '   ', 'το και ένα'];
  assert('(1.1) the content words are those of the measurement: lower case, 5 letters or more, accents and final sigma folded, the 75 stop words out — same as the specification written independently here, on 7 hand-made texts',
    hand.every(t => same(W(t), specWords(t))) && same(W('Η Εξεταστική και το ΕΝΟΙΚΙΟ είναι μεγάλα'), ['εξεταστικη', 'ενοικιο', 'μεγαλα']));
  const VOC = ['εξεταστική', 'ΕΝΟΙΚΙΟ', 'είναι', 'Σχολή', 'ΑΥΤΟ', 'μπορώ', 'πραγματικά', 'υπάρχουν', 'κατι', 'ώρες', 'τιμολόγια', 'abcde', 'Hello', 'ΜΈΡΕΣ', 'δεν', 'ξέρω', 'άΐϋ', 'ς', 'μαζί', '12', 'αύριο-μεθαύριο', 'θέλω', 'ΤΩΡΑ', 'ϊσως', 'ΊΣΩΣ'];
  let diff = 0; for (let c = 0; c < 400; c++) { const n = Math.floor(rnd() * 12); const t = Array.from({ length: n }, () => VOC[Math.floor(rnd() * VOC.length)] + ['', ',', '.', ' ', '!', ';'][Math.floor(rnd() * 6)]).join(' '); if (!same(W(t), specWords(t))) diff++; }
  assert('(1.2) … and on 400 generated texts (accents, capitals, Latin letters, digits, punctuation, stop words): ' + diff + ' differences', diff === 0);
  assert('(1.3) it never throws and never returns text it was not given: nothing, null, a number, an object', [undefined, null, 12, {}, []].every(v => same(W(v), specWords(v))));
  const stopSame = F.SPEAK_RIGHT_STOP instanceof Set && [...F.SPEAK_RIGHT_STOP].sort().join('|') === [...SPEC_STOP].sort().join('|');
  assert('(1.4) the stop words are the 75 of the measurement, letter for letter', stopSame && SPEC_STOP.size === 75);
  const P = F.SPEAK_RIGHT_PARAMS || {};
  assert('(1.5) the thresholds are John\'s, unchanged: 30 different words (А); a word in 3 messages and 3 phrases (В); a self-marked tension and 2 phrases (Г); and the pace of a second offer: 3 messages and 15 new words',
    P.minWords === 30 && P.recurIn === 3 && P.phrasesB === 3 && P.phrasesC === 2 && P.rearmMessages === 3 && P.rearmWords === 15 && Object.keys(P).length === 6);
});

// ── (2) the material: numbers only ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(2)', () => {
  const M = (msgs, risk) => call('speakRightMaterial', msgs, risk === undefined ? RISK0 : risk);
  const c1 = mk({ n: 5, sharedIn: [2, 3, 4] }), m1 = M(c1);
  assert('(2.1) the mass is the number of different content words of all the user\'s messages so far; the words that come back are those in 3 messages or more; the message numbers are the user\'s own count',
    !threw(m1) && m1.userCount === 5 && m1.mass === specMass(usersOf(c1)) && m1.recurWords === specRecur(usersOf(c1)) && m1.recurWords === 1 && JSON.stringify(m1.recurAt) === '[2,3,4]' && JSON.stringify(m1.tensionAt) === '[]');
  const ph = m1.phraseAt || [];
  { const two = M(mk({ n: 6, sharedIn: [2, 3, 4], shared2In: [1, 2, 3, 4, 5] })), tie = M(mk({ n: 6, sharedIn: [2, 3, 4], shared2In: [1, 3, 5] }));
    assert('(2.1b) when two words come back, the numbers are those of the one that comes back in the MOST messages (5, not 3); when they tie, of the one that appeared first (message 1, not 2) — and both are counted',
      !threw(two) && two.recurWords === 2 && JSON.stringify(two.recurAt) === '[1,2,3,4,5]' && !threw(tie) && tie.recurWords === 2 && JSON.stringify(tie.recurAt) === '[1,3,5]'); }
  assert('(2.2) the phrases are the Thought Map\'s own (a user message that follows a question of AURA, a first sentence of 4 words or more): 4 qualify, 3 are given — the first, the middle and the last — as message numbers in order',
    m1.phraseN === 3 && ph.length === 3 && ph.every((x, i) => Number.isInteger(x) && x >= 2 && x <= 5 && (i === 0 || x > ph[i - 1])));
  assert('(2.3) the user\'s LAST message counts: 3 messages give 2 phrases, 4 messages give 3', M(mk({ n: 3 })).phraseN === 2 && M(mk({ n: 4 })).phraseN === 3 && M(mk({ n: 2 })).phraseN === 0);
  assert('(2.4) a reply of AURA that is a statement does not make the next message a phrase: 2 statements among 4 replies → 2 phrases; 3 of 4 → 1 phrase, which the Thought Map does not give (0)',
    M(mk({ n: 5, qFalse: [1, 2] })).phraseN === 2 && M(mk({ n: 5, qFalse: [1, 2, 3] })).phraseN === 0);
  assert('(2.5) a self-marked tension is found in any message, first one included, and reported by its number', JSON.stringify(M(mk({ n: 4, tensionIn: [3] })).tensionAt) === '[3]' && JSON.stringify(M(mk({ n: 4, tensionIn: [1, 4] })).tensionAt) === '[1,4]');
  let bad = 0, total = 0;
  for (let c = 0; c < 200; c++) {
    const n = 2 + Math.floor(rnd() * 8), qF = []; for (let k = 1; k < n; k++) if (rnd() < 0.4) qF.push(k);
    const msgs = mk({ n, qFalse: qF }), kept = Array.from({ length: n - 1 }, (_, i) => i + 2).filter(k => !qF.includes(k - 1)).length, want = kept < 2 ? 0 : Math.min(3, kept);
    total++; if (M(msgs).phraseN !== want) bad++;
  }
  assert('(2.6) on 200 generated conversations the number of phrases is what a plain count gives (messages 2 to the last that follow a question; fewer than 2 → 0; more than 3 → 3): ' + bad + ' differences of ' + total, bad === 0);
  const keep = JSON.stringify(c1), mm = M(c1);
  assert('(2.7) it changes nothing it was given, and what it returns is numbers and lists of numbers only — no text of the user',
    JSON.stringify(c1) === keep && !threw(mm) && Object.values(mm).every(v => typeof v === 'number' || (Array.isArray(v) && v.every(x => Number.isInteger(x)))));
  assert('(2.8) it never throws on bad input: nothing, null, a list with holes, messages without text, a risk that is not an object', [undefined, null, [], [null, 3, {}], [{ role: 'user' }], [U(12)]].every(v => !threw(call('speakRightMaterial', v, 'x'))) && M(null).userCount === 0 && M(undefined).mass === 0);
  assert('(2.9) a session that carries a risk gives no phrases (the Thought Map\'s own safety rule): heaviness (DISTRESS), crisis A or B, danger from another person, safety mode',
    [{ riskKind: 3 }, { riskKind: 1 }, { riskKind: 2 }, { dangerFromOther: true }, { safetyMode: true }].every(r => M(c1, r).phraseN === 0) && M(c1, {}).phraseN === 3);
});


// ── (2.10–2.13) the copy of the Thought Map's chain gives what the Thought Map gives ─────────────────────────────────────────────────────────────────
safely('(2.10)', () => {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  assert('(2.10) the settings of the copy are those of the Thought Map, one by one: 200 characters, 0.6, the 22 abbreviations, the three lists of words',
    F.SPEAK_RIGHT_MAX_CHARS === F.BRANCH_MAX_CHARS && F.SPEAK_RIGHT_JACCARD === F.BRANCH_JACCARD && F.SPEAK_RIGHT_ABBR.length === 22 && same(F.SPEAK_RIGHT_ABBR, F.BRANCH_ABBREVIATIONS) &&
    F.SPEAK_RIGHT_DISMISS_START.source === F.BRANCH_DISMISS_START.source && F.SPEAK_RIGHT_CONTENT_WORDS.source === F.BRANCH_CONTENT_WORDS.source && F.SPEAK_RIGHT_HEAVY_WORDS.source === F.BRANCH_HEAVY_WORDS.source);
  const PIECES = ['δουλειά', 'ενοίκιο', 'σχολή', 'και', 'όμως', 'τι', 'γιατί', '. ', '! ', '? ', '; ', ';', '… ', '... ', '\n', 'π.χ. ', 'κ.λπ. ', 'δηλ. ', 'Α. ', '3.5 ', '1. ', ' ', ', ', '«', '»', '"', '?!', '.', 'μια φορά', 'δεν ξέρω', 'αύριο'];
  const ENDS = ['?', ';', '\u037e', ' ;', '?  \n', '.', '!', '…', '?»', '?!', ''];
  const gen = () => { const n = 2 + Math.floor(rnd() * 22); let t = ''; for (let k = 0; k < n; k++) t += PIECES[Math.floor(rnd() * PIECES.length)] + (rnd() < 0.5 ? ' ' : ''); return rnd() < 0.6 ? t.replace(/\s+$/, '') + ENDS[Math.floor(rnd() * ENDS.length)] : t; };
  let dSpans = 0, dQ = 0, dJ = 0, withQ = 0;
  for (let c = 0; c < 800; c++) {
    const t = gen(), u = gen();
    if (!same(call('speakRightSpans', t), call('branchSentenceSpans', t))) dSpans++;
    const a = call('speakRightEndsWithQuestion', t), b = call('branchAuraEndsWithQuestion', t); if (a !== b) dQ++; if (b === true) withQ++;
    if (call('speakRightJaccard', t, u) !== call('branchJaccard', t, u)) dJ++;
  }
  assert('(2.11) the sentence cuts, the «ends with a question» test and the Jaccard of the copy are those of the Thought Map on 800 generated texts (abbreviations, ellipses, numbers, line breaks, quotes): ' + dSpans + ' + ' + dQ + ' + ' + dJ + ' differences; ' + withQ + ' texts end in a question',
    dSpans === 0 && dQ === 0 && dJ === 0 && withQ > 30);
});
safely('(2.12)', () => {
  const heavy = (/\(\?:([^()]*)\)\(\?!\[α-ω\]\)$/.exec(F.BRANCH_HEAVY_WORDS.source) || [, ''])[1].split('|').filter(Boolean);
  const POOL = ['Το ενοίκιο εκεί είναι ακριβό και τα έξοδα της σχολής ανεβαίνουν κάθε χρόνο.', 'Οι φίλοι μου μένουν εδώ και με βοηθούν στις σπουδές όποτε χρειάζεται.', 'Δεν ξέρω, άστο.', 'Δεν ξέρω αν θέλω να μείνω στη δουλειά του ενοικίου.',
    'Ευχαριστώ, τα λέμε.', 'Τα λέμε αύριο στις δέκα για το ενοίκιο της σχολής.', 'Τίποτα δεν έχω να πω εδώ.', 'Ναι.', 'Η αδελφή μου πιστεύει ότι οι σπουδές αξίζουν κάθε θυσία για το μέλλον.', 'Το πρόγραμμα της σχολής είναι καλό, όμως η απόσταση από το σπίτι μεγαλώνει.',
    'Πήγα στο γραφείο π.χ. την Τρίτη και μίλησα με τον υπεύθυνο της σχολής.', 'Είναι 3.5 χιλιόμετρα από το σπίτι μέχρι τη σχολή και το ενοίκιο ανεβαίνει.', 'Μου αρέσει η ιδέα... αλλά το κόστος των σπουδών με απασχολεί πολύ.',
    'Θέλω να καταλάβω γιατί το ενοίκιο ανεβαίνει κάθε χρόνο. Και τι σημαίνει αυτό για τα έξοδα της σχολής.', 'Σκέφτομαι τις σπουδές και τα έξοδα του σπιτιού κάθε βράδυ πριν κοιμηθώ.',
    'Τα έξοδα της σχολής είναι μεγάλα και το ενοίκιο είναι ακριβό κάθε χρόνο.', heavy.length ? 'Λέω ότι ' + heavy[0] + ' με αυτή την κατάσταση της σχολής και των εξόδων.' : 'Ναι.'];
  const AURA_POOL = ['Τι σε κάνει να το σκέφτεσαι τώρα;', 'Τι σημαίνει αυτό για σένα;', 'Άκουσα το μέρος αυτό.', 'Πώς είναι οι μέρες σου;', 'Και εσύ τι λες γι\' αυτό?', 'Τι περιμένεις να αλλάξει;»', 'Είναι έτσι! Τι άλλο;', 'Κατάλαβα. Τι θα έχανες;', 'Τι;', '…'];
  let diff = 0, withPhrases = 0, total = 0, risky = 0;
  for (let c = 0; c < 700; c++) {
    const n = 2 + Math.floor(rnd() * 8), m = [];
    for (let k = 0; k < n; k++) {
      m.push(U(POOL[Math.floor(rnd() * POOL.length)]));
      if (k < n - 1) { const mode = rnd() < 0.85 ? 'ANSWER' : (rnd() < 0.5 ? 'STAGE_A' : undefined); m.push({ role: 'assistant', msgMode: mode, content: AURA_POOL[Math.floor(rnd() * AURA_POOL.length)] }); }
    }
    if (rnd() < 0.2) m.unshift({ role: 'assistant', msgMode: 'ANSWER', content: 'Τι σε φέρνει εδώ;' }); // a question of AURA before the first user message: the entrance is still not a phrase
    const knew = m.find(x => x.role === 'user').content, safe = call('branchSessionSafe', m, {}) === true;
    if (!safe) { risky++; continue; }
    total++;
    const want = call('pickBranches', [...m, U('.')], '', knew, {}), got = call('speakRightPhrases', m, knew);
    if (JSON.stringify(want) !== JSON.stringify(got)) diff++; if (Array.isArray(got) && got.length >= 2) withPhrases++;
  }
  assert('(2.12) the copy gives, on 700 generated conversations, exactly the phrases the Thought Map gives when its «last message» is not the user\'s latest (text, message, start, end): ' + diff + ' differences of ' + total + '; ' + withPhrases + ' conversations with 2–3 phrases; ' + risky + ' with a risk, left out',
    diff === 0 && total > 400 && withPhrases > 100);
  assert('(2.13) it never throws and never changes what it was given: nothing, bad messages, no first message', [undefined, null, 5, 'x', [null], [{}], [{ role: 'user' }], [{ role: 'user', content: 7 }, { role: 'assistant' }, { role: 'user', content: 'x' }]].every(v => Array.isArray(call('speakRightPhrases', v, null)) && call('speakRightPhrases', v, null).length === 0));
  // (2.14) two filters of the copy that nothing else replaces: a message made ONLY of farewell words is not a phrase, even when it carries four «content» words. Each text below is caught
  // by exactly ONE of the two checks (found by comparing the copy with and without each check on generated farewells), so removing either check changes what the copy gives.
  const FA = 'Αντε γεια, αυτό ήταν, επίσης.', FB = 'Φτάνει, γεια, έληξε, σωστό.';
  const sub4 = s => call('substanceOfSentence', s.replace(/[.!]+$/, ''), 4);
  assert('(2.14) the two farewells are what the checks exist for: A is only «matchesClosingWord» (isExplicitClosure leaves «αντε»), B is only «isExplicitClosure» (matchesClosingWord does not know «έληξε»); neither is a declared closing, both have 4 content words',
    call('matchesClosingWord', FA) === true && call('isExplicitClosure', FA) === false && call('declaresClosing', FA) === false && sub4(FA) !== null &&
    call('isExplicitClosure', FB) === true && call('matchesClosingWord', FB) === false && call('declaresClosing', FB) === false && sub4(FB) !== null);
  { const P = (...tail) => [U(toks(100, 5).join(' ') + '.'), A(1), U(toks(200, 5).join(' ') + '.'), A(2), ...tail];
    const plain = P(U(toks(300, 5).join(' ') + '.')), withA = P(U(FA)), withB = P(U(FB));
    const idx = msgs => { const r = call('speakRightPhrases', msgs, msgs[0].content); return Array.isArray(r) ? r.map(x => x.msg) : 'THREW'; };
    const four = last => P(U(toks(300, 5).join(' ') + '.'), A(3), U(last));
    assert('(2.14b) a message made only of farewell words that only «matchesClosingWord» knows is not a phrase: the control (an ordinary third message) gives 2 phrases (messages 3 and 5 of the list); with the farewell the second message stands alone (none); after two ordinary ones the farewell is left out',
      JSON.stringify(idx(plain)) === '[2,4]' && JSON.stringify(idx(withA)) === '[]' && JSON.stringify(idx(four(FA))) === '[2,4]');
    assert('(2.14c) the same for a farewell that only «isExplicitClosure» knows',
      JSON.stringify(idx(withB)) === '[]' && JSON.stringify(idx(four(FB))) === '[2,4]'); }
});

// ── (3) the trigger and the holds ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const D = (stage, ready, msgs, last, risk) => { const d = call('speakRightDecision', stage, ready, msgs, last === undefined ? null : last, risk === undefined ? RISK0 : risk); return threw(d) ? 'THREW ' + d.threw : (d && d.kind !== undefined ? d.kind : 'NO-KIND'); };
safely('(3)', () => {
  const OB = { n: 5, sharedIn: [2, 3, 4] };
  const b30 = atMass(OB, 30), b29 = atMass(OB, 29);
  assert('(3.1) А ∧ В: 30 different words, a word in 3 messages and 3 phrases → the note; 29 words → nothing (the boundary is exactly 30)', b30 !== null && b29 !== null && D(true, false, b30) === 'speak' && D(true, false, b29) === '');
  assert('(3.2) В needs the word in 3 messages (2 are not enough) and 3 phrases (2 are not enough), and the words', D(true, false, atMass({ n: 5, sharedIn: [2, 3] }, 40)) === '' && D(true, false, atMass({ n: 5, sharedIn: [2, 3, 4], qFalse: [1, 2] }, 40)) === '' && D(true, false, atMass({ n: 5, sharedIn: [2, 3, 4] }, 40)) === 'speak');
  const cC = atMass({ n: 3, tensionIn: [3] }, 30);
  assert('(3.3) А ∧ Г: a self-marked tension and 2 phrases → the note, with no word coming back; 29 words → nothing; the same without the tension → nothing; with only 1 phrase → nothing',
    cC !== null && D(true, false, cC) === 'speak' && D(true, false, atMass({ n: 3, tensionIn: [3] }, 29)) === '' && D(true, false, atMass({ n: 3 }, 40)) === '' && D(true, false, atMass({ n: 3, tensionIn: [3], qFalse: [1] }, 40)) === '');
  assert('(3.4) the tension may be in an early message: in the first or the second one the note still comes at the 3rd message',
    D(true, false, atMass({ n: 3, tensionIn: [1] }, 30)) === 'speak' && D(true, false, atMass({ n: 3, tensionIn: [2] }, 30)) === 'speak');
  const dB = call('speakRightDecision', true, false, b30, null, RISK0), dC = call('speakRightDecision', true, false, cC, null, RISK0);
  assert('(3.5) the decision says why: В, Г, or both; with the numbers of the material', !threw(dB) && dB.viaB === true && dB.viaC === false && dB.userCount === 5 && dB.mass === 30 && !threw(dC) && dC.viaC === true && dC.viaB === false && dC.mass === 30);
  const both = atMass({ n: 5, sharedIn: [2, 3, 4], tensionIn: [4] }, 40), dBoth = call('speakRightDecision', true, false, both, null, RISK0);
  assert('(3.6) a word that comes back AND a tension → both reasons', !threw(dBoth) && dBoth.kind === 'speak' && dBoth.viaB === true && dBoth.viaC === true);
  assert('(3.7) only in Stage A before the root: the old flow, after the root and the safety path (the rule of 30/10) → nothing, whatever the material',
    [false, undefined, null, 'true', 1, 0].every(v => D(v, false, b30) === ''));
  assert('(3.8) not while the readiness question is the most recent question AURA asked → nothing', D(true, true, b30) === '' && D(true, false, b30) === 'speak');
  assert('(3.9) a risk of the session → nothing: heaviness (DISTRESS), crisis A or B, danger from another person, safety mode',
    [{ riskKind: 3 }, { riskKind: 1 }, { riskKind: 2 }, { dangerFromOther: true }, { safetyMode: true }].every(r => D(true, false, b30, null, r) === ''));
  assert('(3.10) it never throws and gives nothing on bad input', [undefined, null, [], 'x', [U(5)]].every(v => D(true, false, v) === '') && D(true, false, b30, 'garbage') === 'speak' && D(true, false, b30, { at: 'x', mass: 'y' }) === 'speak');
});

// ── (4) the pace: a retry is the same turn; the turn after is the follow-up; a second offer needs 3 new messages and 15 new words ──────────────────────
safely('(4)', () => {
  const OB = { n: 8, sharedIn: [2, 3, 4] };
  const c5 = atMass({ n: 5, sharedIn: [2, 3, 4] }, 30), c6 = mk({ n: 6, sharedIn: [2, 3, 4] }), c7 = mk({ n: 7, sharedIn: [2, 3, 4] });
  const m5 = call('speakRightMaterial', c5, RISK0);
  const last = { at: 5, mass: m5.mass };
  assert('(4.1) the same turn again (a failed call, sent again): the same answer — the note is still due', D(true, false, c5, last) === 'speak');
  assert('(4.2) the next message is the follow-up, whatever the material is', D(true, false, c6, last) === 'followup' && D(true, false, mk({ n: 6 }), last) === 'followup');
  assert('(4.3) the follow-up is held like the note itself: readiness question pending, not Stage A before the root, a risk → nothing', D(true, true, c6, last) === '' && D(false, false, c6, last) === '' && D(true, false, c6, last, { riskKind: 3 }) === '');
  assert('(4.4) the second message after: too early (3 messages are needed since the last offer) → nothing, even with the material', D(true, false, c7, last) === '');
  const need = m5.mass + 15, atWords = (n, target) => atMass({ n, sharedIn: [2, 3, 4] }, target);
  const c8 = atWords(8, need), c8b = atWords(8, need - 1);
  assert('(4.5) the third message after, and 15 new words → the note again; 14 new words → nothing', c8 !== null && c8b !== null && D(true, false, c8, last) === 'speak' && D(true, false, c8b, last) === '');
  assert('(4.6) 3 messages are needed even with many new words: at the 7th message (2 after) → nothing; at the 8th (3 after) → yes', D(true, false, atWords(7, need + 20), last) === '' && D(true, false, atWords(8, need + 20), last) === 'speak');
  assert('(4.7) a missing or broken record is no record: the note is due as for a first time', [null, undefined, {}, { at: 0, mass: 0 }, { at: -1, mass: 5 }, { at: 'a' }].every(l => D(true, false, c5, l) === 'speak'));
  const d8 = call('speakRightDecision', true, false, c8, last, RISK0);
  assert('(4.8) what the record needs is in the decision: the message number of this turn and its mass', !threw(d8) && d8.userCount === 8 && d8.mass === need);
});

// ── natural-looking made-up conversations for the text of the note (neutral subject; no word of any real session) ──────────────────────────────────
const NU = ['Σκέφτομαι να μετακομίσω σε άλλη πόλη για τις σπουδές μου.',
  'Το ενοίκιο εκεί είναι ακριβό και τα έξοδα της σχολής ανεβαίνουν κάθε χρόνο, ειδικά στα φοιτητικά διαμερίσματα.',
  'Οι φίλοι μου μένουν εδώ και με βοηθούν στις σπουδές όποτε χρειάζεται.',
  'Το πρόγραμμα της σχολής είναι καλό, όμως η απόσταση από το σπίτι μεγαλώνει.',
  'Η αδελφή μου πιστεύει ότι οι σπουδές αξίζουν κάθε θυσία για το μέλλον.',
  'Εγώ ακούω τους συμβούλους της σχολής και ζυγίζω τα έξοδα με τα οφέλη, χωρίς βιασύνη.'];
const NQ = ['Τι σε κάνει να το σκέφτεσαι τώρα;', 'Τι σημαίνει αυτό για τα σχέδιά σου;', 'Πώς είναι οι μέρες σου τώρα;', 'Τι περιμένεις να αλλάξει;', 'Και εσύ τι λες γι\' αυτό;'];
const natConv = (statementAt = []) => { const m = []; NU.forEach((t, k) => { m.push(U(t)); if (k < NQ.length) m.push({ role: 'assistant', msgMode: 'ANSWER', content: statementAt.includes(k) ? 'Άκουσα το μέρος ' + k + '.' : NQ[k] }); }); return m; };
const NAT_UNIFIED = natConv(), NAT_PLAIN = natConv([1]);
const dec = (msgs, last) => call('speakRightDecision', true, false, msgs, last === undefined ? null : last, RISK0);
const wordsOf = msgs => new Set(msgs.filter(x => x.role === 'user').flatMap(x => specWords(x.content)));
const noUserText = (note, msgs) => { if (typeof note !== 'string' || note.length < 200) return false; const f = specFold(note).replace(/ς/g, 'σ'); return [...wordsOf(msgs)].every(w => !f.includes(w.replace(/ς/g, 'σ'))); };

// ── (5) the text of the note ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(5)', () => {
  const d = dec(NAT_PLAIN), N = threw(d) ? '' : call('describeSpeakRightCtx', d, NAT_PLAIN);
  assert('(5.0) the natural conversation is one the trigger accepts: the note is due, through В (a word comes back), not through Г', !threw(d) && d.kind === 'speak' && d.viaB === true && d.viaC === false && d.userCount === 6 && call('describeRoundTypeCtx', true, false, NAT_PLAIN) === '');
  assert('(5.1) it is one block that begins and ends as the model expects, and the api guard accepts it (the opening is one the guard already lists: no change to api/aura.js)',
    typeof N === 'string' && N.startsWith('\n[CODE-VERIFIED: this reply may say back a connection between things the user gave.') && N.endsWith(']\n') && guardBlocks(N).length === 1 && guardAccepts(N) && N.length > 800 && N.length < 3200);
  assert('(5.2) it counts, from the conversation: the messages, the different words, the message numbers where a word comes back and the message numbers of the separate things they said',
    N.includes('they have written ' + d.userCount + ' messages with ' + d.mass + ' different content words of 5+ letters') && N.includes('comes back in ' + d.recurAt.length + ' of their messages (their messages ' + d.recurAt.slice(0, -1).join(', ') + ' and ' + d.recurAt[d.recurAt.length - 1] + ')') &&
    N.includes(d.phraseN + ' separate things they said stand on their own (their messages ' + d.phraseAt.slice(0, -1).join(', ') + ' and ' + d.phraseAt[d.phraseAt.length - 1] + ')'));
  assert('(5.3) it carries no text of the user: not one content word of their messages is in the note, and no Greek is in it outside the quotes of «Άρα», «αλλά»/«όμως»', noUserText(N, NAT_PLAIN) && !/[α-ωά-ώ]/i.test(N.replace(/«[^»]*»/g, '')));
  assert('(5.4) it is a permission, not an order: «a permission, not an instruction», and if another question is worth more now, or they asked for something else, do that and leave the note aside',
    /This is a permission, not an instruction: if another question is worth more now, or they asked for something else, do that and leave this note aside\./.test(N) && !/\byou (?:must|have to|should)\b|this reply must/i.test(N));
  assert('(5.5) the shape, if the model speaks: 1–3 short lines; two or three DIFFERENT things they said side by side, and that both are there; the wording rule (their own words; a changed word only to a plain one of the SAME meaning, no judgement, size or weight, no new label); then plainly what is not known yet; then open for them to correct',
    /If you do speak: 1–3 short lines\./.test(N) && /two or three DIFFERENT things they said/.test(N) && /Wording: use their own words; if you change a word, only to a plain one of the SAME meaning that adds no judgement, size or weight/.test(N) && /say that both are there/.test(N) &&
    /say plainly what you do not know yet/.test(N) && /Leave it open for them to correct/.test(N));
  assert('(5.6) what is never said, not even as a question: a feeling, a cause, a motive or a link they did not state; advice; a step or a road; naming the root; options as A/B, an order, costs or gains; a verdict; a number they did not say; one diagnosis that merges two open things; a sentence that starts with «Άρα»',
    /Never, not even as a question: a feeling, a cause, a motive or a link between the things that they did not state; advice; a step or a road; naming the root or what it might be; options as A\/B, an order, costs or gains; a verdict; a number they did not say; one diagnosis that merges two open things; a sentence that starts with «Άρα»\./.test(N));
  assert('(5.7) for this one reply only it takes precedence over five things, and only as far as it says: «nothing they said is said back a second time» (a connection is not an echo), the compression check «never said aloud», «their own words only» (with the wording rule), «one question», and the Stage A line against raising the structure of a thought (you may say that both things are there, nothing more)',
    /For this one reply only, this takes precedence over five things, and only as far as it says here: «nothing they said is said back a second time» \(a connection of different things is not an echo of one\); the compression check «never said aloud»; «their own words only» \(use their own words; if you change a word, only to a plain one of the SAME meaning that adds no judgement, size or weight \(never a word that makes it heavier, bigger or more negative than they said\), and never a new label, category or abstract name\); «one question»; and the Stage A line against raising the structure of a thought beyond what they gave \(you may say that both things are there, nothing more\)\./.test(N));
  assert('(5.8) … and it overrides nothing else: the other Stage A rules (no roads, steps, ways or plan; no certainty raised beyond what they gave), the ban on advice and on evaluation, and every safety rule',
    /It overrides nothing else: the other Stage A rules \(no roads, steps, ways or plan; no certainty raised beyond what they gave\), the ban on advice and on evaluation, and every safety rule stay in force\./.test(N));
  assert('(5.9) it asks nothing itself: no question mark in the note, and no «first step», «next step» or ROAD DISCOVERY', N.length > 0 && !/\?/.test(N) && !/first step|next step|ROAD DISCOVERY|PATH TWO/.test(N));
  const dC = dec(natC()), NC = threw(dC) ? '' : call('describeSpeakRightCtx', dC, natC());
  assert('(5.10) through Г the note says in which message they put a stance on each side of «αλλά»/«όμως» (a number; not «an opposition») and still no text of theirs', !threw(dC) && dC.kind === 'speak' && dC.viaC === true && NC.includes('in message ' + dC.tensionAt.join(', ') + ' they put a stance on each side of «αλλά»/«όμως»') && noUserText(NC, natC()));
  assert('(5.11) the pure part is stable: the same input gives the same note, and nothing in the decision is changed by writing it', (() => { const k = JSON.stringify(d); const a = call('describeSpeakRightCtx', d, NAT_PLAIN), b = call('describeSpeakRightCtx', d, NAT_PLAIN); return a === b && JSON.stringify(d) === k; })());
  assert('(5.12) nothing for a decision that is neither an offer nor a follow-up when the Stage A rule does not hold: no kind, an empty kind, nothing, text, "held" missing or false — even where the ROUND TYPE note would be lit',
    ['', 'x', undefined].every(k => call('describeSpeakRightCtx', { kind: k }, NAT_UNIFIED) === '' && call('describeSpeakRightCtx', { kind: k, held: false }, NAT_UNIFIED, false) === '') && call('describeSpeakRightCtx', null, NAT_UNIFIED) === '' && call('describeSpeakRightCtx', 'speak', NAT_UNIFIED) === '' && call('describeSpeakRightCtx', undefined, NAT_UNIFIED) === '');
});
function natC() {
  const u = ['Σκέφτομαι να αλλάξω ειδικότητα στη σχολή μου φέτος.', 'Το εργαστήριο της σχολής έχει νέο εξοπλισμό και καινούργιους καθηγητές.', 'Θέλω να μείνω κοντά στους φίλους μου αλλά φοβάμαι την ευκαιρία που χάνεται.'];
  const q = ['Τι σε κάνει να το σκέφτεσαι;', 'Τι σημαίνει αυτό για σένα;'];
  const m = []; u.forEach((t, k) => { m.push(U(t)); if (k < q.length) m.push({ role: 'assistant', msgMode: 'ANSWER', content: q[k] }); });
  // 30 different words: pad the last message with made-up ones
  let ex = 0; while (specMass(usersOf(m)) < 30 && ex < 60) { m[m.length - 1] = U(m[m.length - 1].content.replace(/\.$/, '') + ' ' + tok(900 + ex) + '.'); ex++; }
  return m;
}

// ── (6) one note with the ROUND TYPE note ───────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(6)', () => {
  const rt = call('describeRoundTypeCtx', true, false, NAT_UNIFIED), d = dec(NAT_UNIFIED), N = threw(d) ? '' : call('describeSpeakRightCtx', d, NAT_UNIFIED);
  assert('(6.1) 5 replies in a row that end in a question, and enough material: both are due', typeof rt === 'string' && rt.startsWith('\n[CODE-VERIFIED: this reply must not end with a question.') && /your last 5 replies each ended with a question/.test(rt) && !threw(d) && d.kind === 'speak');
  const head = typeof rt === 'string' && rt.length > 2 ? rt.slice(0, rt.lastIndexOf(']')) : '#';
  assert('(6.2) the note is ONE block: the ROUND TYPE note as it is, with one sentence more for the connection — not two notes that could disagree', typeof N === 'string' && N.startsWith(head) && N.endsWith(']\n') && guardBlocks(N).length === 1 && guardAccepts(N) && N.length < 4800);
  assert('(6.3) the rule «this reply must not end with a question» stays first and whole; the addition says a connection of different things is one more thing that may be written, ends as a statement, leaves it open for them to correct, and is a permission: the other kinds of statement stay available',
    /AND because the material is also enough \(counted from this conversation:/.test(N) && /one more: a short connection of different things they gave/.test(N) && /It ends as a statement that leaves it open for them to correct/.test(N) && /It is a permission: the other kinds of statement above stay available\./.test(N));
  assert('(6.4) … with the same limits (no feeling, cause, motive or link they did not state; no diagnosis that merges two open things; no sentence that starts with «Άρα») and the same counts as the single note, no text of the user',
    /never states a feeling, a cause, a motive or a link they did not state, never a diagnosis that merges two open things, never a sentence that starts with «Άρα»/.test(N) && N.includes(d.userCount + ' messages with ' + d.mass + ' different content words of 5+ letters') && noUserText(N.replace(head, ''), NAT_UNIFIED) && !/\?/.test(N));
  const twoDontKnow = [...mk({ n: 5, sharedIn: [2, 3, 4], extra: 30 }), A(5, false), U('δεν ξέρω'), A(6, false), U('Δεν ξέρω.')];
  const rt2 = call('describeRoundTypeCtx', true, false, twoDontKnow), d2 = dec(twoDontKnow), N2 = threw(d2) ? '' : call('describeSpeakRightCtx', d2, twoDontKnow);
  assert('(6.5) the other reason of the ROUND TYPE note (two «δεν ξέρω» in a row) is unified the same way', /last two messages were each «δεν ξέρω»/.test(rt2) && !threw(d2) && d2.kind === 'speak' && N2.startsWith(rt2.slice(0, rt2.lastIndexOf(']'))) && guardBlocks(N2).length === 1);
  const noRt = call('describeSpeakRightCtx', dec(NAT_PLAIN), NAT_PLAIN);
  const rtAll = call('describeRoundTypeCtx', true, false, NAT_UNIFIED);
  assert('(6.7) when neither the offer nor the follow-up is due the slot holds the ROUND TYPE note exactly as it was: byte for byte, lit and not lit; not while the readiness question is the most recent question',
    rtAll !== '' && call('describeSpeakRightCtx', { kind: '', held: true }, NAT_UNIFIED, false) === rtAll && call('describeSpeakRightCtx', { kind: '', held: true }, NAT_UNIFIED, true) === '' && call('describeSpeakRightCtx', { kind: '', held: true }, NAT_PLAIN, false) === '');
  { let bad = 0, lit = 0; for (let c = 0; c < 300; c++) { const n = 3 + Math.floor(rnd() * 8), m = []; for (let k = 0; k < n; k++) { m.push(U(rnd() < 0.15 ? 'δεν ξέρω' : 'Κάτι που έγινε ' + k)); if (k < n - 1) m.push(rnd() < 0.15 ? A(k, false) : A(k, true)); } const held = rnd() < 0.8, ready = rnd() < 0.3;
      const want = call('describeRoundTypeCtx', held, ready, m), got = call('describeSpeakRightCtx', { kind: '', held }, m, ready); if (want !== got) bad++; if (want !== '') lit++; }
    assert('(6.7) … on 300 generated conversations and flags the fallback is the ROUND TYPE note itself: ' + bad + ' differences, ' + lit + ' of them with the note lit', bad === 0 && lit > 20); }
  assert('(6.6) when the ROUND TYPE note is not lit the single note is the one of (5): it begins with the permission and does not say «must not end with a question»', noRt.startsWith('\n[CODE-VERIFIED: this reply may say back') && !/must not end with a question/.test(noRt));
});

// ── (7) the follow-up ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(7)', () => {
  const m6 = NAT_PLAIN.concat([A(6), U('Όχι, δεν το βλέπω έτσι. Το ενοίκιο δεν είναι το θέμα.')]);
  const last = { at: 6, mass: 30 }, d = call('speakRightDecision', true, false, m6, last, RISK0), N = threw(d) ? '' : call('describeSpeakRightCtx', d, m6);
  assert('(7.1) the message after the one that carried the note → the follow-up', !threw(d) && d.kind === 'followup' && d.userCount === 7);
  assert('(7.2) the follow-up is one block, begins with an opening the guard lists, and has no question mark',
    typeof N === 'string' && N.startsWith('\n[CODE-VERIFIED: the previous reply of yours was sent with a permission to say back a connection between things the user gave;') && N.endsWith(']\n') && guardBlocks(N).length === 1 && guardAccepts(N) && !/\?/.test(N) && N.length < 2200);
  assert('(7.3) only if that reply did say a connection: if they correct it, say no or say it does not fit → their answer; back to exploring in their own words; not defend, not repeat it, not explain why it was said',
    /Only if that reply did say such a connection: if they now correct it, say no, or say it does not fit, take that as their answer, go back to exploring in their own words, and do not defend the connection, repeat it or explain why you said it/.test(N));
  assert('(7.4) a yes belongs to that connection only: not the answer to the readiness question, not a root, and nothing is named', /if they say it fits, that yes belongs to that connection only: it is not an answer to the readiness question and not a root, and you name nothing/.test(N));
  assert('(7.5) if the reply said no connection, the note is left aside; the Stage A rules and every safety rule stay', /If that reply did not say a connection, leave this note aside\./.test(N) && /The Stage A rules and every safety rule stay in force\./.test(N));
  const mk5 = natConv(); const m7 = mk5.concat([A(6), U('Όχι, δεν είναι αυτό.')]);
  const d7 = call('speakRightDecision', true, false, m7, { at: 6, mass: 30 }, RISK0), N7 = threw(d7) ? '' : call('describeSpeakRightCtx', d7, m7), rt7 = call('describeRoundTypeCtx', true, false, m7);
  assert('(7.6) when the ROUND TYPE note is also lit on that message → ONE block again: the ROUND TYPE note, then the follow-up in the same block', typeof rt7 === 'string' && rt7.startsWith('\n[CODE-VERIFIED: this reply must not end') && N7.startsWith(rt7.slice(0, rt7.lastIndexOf(']'))) && guardBlocks(N7).length === 1 && /previous reply of yours was sent with a permission/.test(N7) && !/\?/.test(N7));
  assert('(7.7) the follow-up carries no text of the user either', noUserText(N, m6) && noUserText(N7.replace(rt7.slice(0, rt7.lastIndexOf(']')), ''), m7));
});

// ── (7b) «δικαίωμα ομιλίας», commit 6 (John, 15/11/2026): TWO WORDING CORRECTIONS of the note — the text only (prompt, api/aura.js, the safety path, the thresholds and the pace are as they were) ─────────────
//  (1) «a plain near-equivalent of a word of theirs is fine» is gone wherever it stood (the shape; the list of what the note takes precedence over — «their own words only»; the unified form), replaced by the wording rule WR:
//      their own words; a changed word only to a plain one of the SAME meaning that adds no judgement, size or weight (never heavier, bigger or more negative than they said); never a new label, category or abstract name
//  (2) the example of what is not known yet no longer says which of the two «weighs more» (nor «connected at all»): «how the two relate for them, or whether they relate at all» — and no form suggests that the two things
//      compete (the measured tension is told as «a stance on each side of «αλλά»/«όμως»», not as «an opposition»).
// The FOLLOW-UP never held either phrase: it is pinned unchanged. The commit-5 texts (0c13fa0) are pinned by their sha256 on fixed conversations: the only difference between old and new is what is named here.
safely('(7b)', () => {
  const WR = 'use their own words; if you change a word, only to a plain one of the SAME meaning that adds no judgement, size or weight (never a word that makes it heavier, bigger or more negative than they said), and never a new label, category or abstract name';
  const EX = '(for example how the two relate for them, or whether they relate at all; you do not know unless they said so)';
  const OLD_SHAPE = 'Put side by side two or three DIFFERENT things they said, staying as close to their own words as you can (a plain near-equivalent of a word of theirs is fine; no new label, category or abstract name), and say that both are there. Then say plainly what you do not know yet (for example which of them weighs more for them, or whether they are connected at all; you do not know unless they said so).';
  const NEW_SHAPE = 'Put side by side two or three DIFFERENT things they said, and say that both are there. Wording: ' + WR + '. Then say plainly what you do not know yet ' + EX + '.';
  const OLD_LIST = '«their own words only» (a plain near-equivalent is fine);', NEW_LIST = '«their own words only» (' + WR + ');';
  const OLD_UNI = 'two or three different things they said side by side, staying as close to their own words as you can (a plain near-equivalent is fine; no new label or category), and what you do not know yet; it ends as a statement';
  const NEW_UNI = 'two or three different things they said side by side, and what you do not know yet. Wording: ' + WR + '. It ends as a statement';
  const OLD_TENSION = 'they set an opposition («αλλά»/«όμως») with a stance on both sides', NEW_TENSION = 'they put a stance on each side of «αλλά»/«όμως»';
  const twoDK = [...mk({ n: 5, sharedIn: [2, 3, 4], extra: 30 }), A(5, false), U('δεν ξέρω'), A(6, false), U('Δεν ξέρω.')];
  const m6 = NAT_PLAIN.concat([A(6), U('Όχι, δεν το βλέπω έτσι. Το ενοίκιο δεν είναι το θέμα.')]), m7 = natConv().concat([A(6), U('Όχι, δεν είναι αυτό.')]);
  const dPC = dec(natC());
  const F6 = {
    plainB: call('describeSpeakRightCtx', dec(NAT_PLAIN), NAT_PLAIN), plainC: call('describeSpeakRightCtx', dPC, natC()),
    unified: call('describeSpeakRightCtx', dec(NAT_UNIFIED), NAT_UNIFIED), unified2: call('describeSpeakRightCtx', dec(twoDK), twoDK),
    follow: call('describeSpeakRightCtx', call('speakRightDecision', true, false, m6, { at: 6, mass: 30 }, RISK0), m6),
    followUnified: call('describeSpeakRightCtx', call('speakRightDecision', true, false, m7, { at: 6, mass: 30 }, RISK0), m7),
  };
  const S16 = s => sha(s).slice(0, 16);
  const PIN = { plainB: '94bdbd7879545292', plainC: '8164264219ab1e7a', unified: '7f6a8e26c43207c7', unified2: '4e99b4b01848b8a3', follow: '698a27a144aa486e', followUnified: '363821f0f7c165d6' }; // sha256 (first 16) of the commit-5 texts (0c13fa0) for these conversations
  const all = Object.values(F6), isStr = x => typeof x === 'string' && x.length > 300;
  const cnt = (s, sub) => s.split(sub).length - 1;
  const COMPETE = /\bweighs? (?:more|most)\b|\bweighing\b|\boutweigh|compet|opposition|against each other|which of them|connected at all|\brival|\bversus\b/i;
  assert('(7b.1) the six forms exist: the offer (a word comes back; a tension), the offer with the ROUND TYPE note (5 questions; two «δεν ξέρω»), the follow-up alone and with the ROUND TYPE note',
    all.every(isStr) && F6.plainB.startsWith('\n[CODE-VERIFIED: this reply may say back a connection between things the user gave.') && F6.plainC.startsWith('\n[CODE-VERIFIED: this reply may say back a connection between things the user gave.') &&
    [F6.unified, F6.unified2].every(x => x.startsWith('\n[CODE-VERIFIED: this reply must not end with a question.') && x.includes('AND because the material is also enough')) &&
    F6.follow.startsWith('\n[CODE-VERIFIED: the previous reply of yours was sent with a permission') && F6.followUnified.startsWith('\n[CODE-VERIFIED: this reply must not end with a question.') && F6.followUnified.includes('ALSO, the previous reply of yours was sent with a permission'));
  assert('(7b.2) the offer: the wording rule stands in the SHAPE (right after «say that both are there», before what is not known yet) and again in the list of the five things it takes precedence over — twice, word for word, in both ways of lighting (a word that comes back; a tension)',
    [F6.plainB, F6.plainC].every(x => isStr(x) && cnt(x, WR) === 2 && cnt(x, NEW_SHAPE) === 1 && cnt(x, NEW_LIST) === 1));
  assert('(7b.3) the offer with the ROUND TYPE note: the wording rule stands once, as its own sentence before «It ends as a statement» — in both reasons of the ROUND TYPE note',
    [F6.unified, F6.unified2].every(x => isStr(x) && cnt(x, WR) === 1 && cnt(x, NEW_UNI) === 1));
  assert('(7b.4) the follow-up is not a synthesis: neither form carries the wording rule, and its text is unchanged (sha256 pinned)', [F6.follow, F6.followUnified].every(x => isStr(x) && cnt(x, WR) === 0) && S16(F6.follow) === PIN.follow && S16(F6.followUnified) === PIN.followUnified);
  assert('(7b.5) what is not known yet is told with the new example in the offer — «how the two relate for them, or whether they relate at all; you do not know unless they said so» — once',
    [F6.plainB, F6.plainC].every(x => isStr(x) && cnt(x, 'say plainly what you do not know yet ' + EX) === 1));
  assert('(7b.6) in NO form is there «a plain near-equivalent», «staying as close to their own words as you can», «which of them», «weighs more», «connected at all», «opposition» or anything that makes the two things compete',
    all.every(x => isStr(x) && !/near-equivalent|staying as close to their own words/.test(x) && !COMPETE.test(x)));
  assert('(7b.7) the measured tension is told neutrally: in message(s) N they put a stance on each side of «αλλά»/«όμως» — not «an opposition»',
    !threw(dPC) && dPC.viaC === true && isStr(F6.plainC) && cnt(F6.plainC, 'in message ' + dPC.tensionAt.join(', ') + ' ' + NEW_TENSION) === 1 && !/opposition/i.test(F6.plainC));
  assert('(7b.8) nothing else changed: with the new pieces put back to the commit-5 words, each form is the commit-5 text byte for byte (sha256 of the old texts pinned on these conversations)',
    (() => {
      const back = (x, pairs) => pairs.reduce((s, [n, o]) => (cnt(s, n) === 1 ? s.split(n).join(o) : '#NOT-APPLIED#' + s), x);
      return S16(back(F6.plainB, [[NEW_SHAPE, OLD_SHAPE], [NEW_LIST, OLD_LIST]])) === PIN.plainB &&
        S16(back(F6.plainC, [[NEW_SHAPE, OLD_SHAPE], [NEW_LIST, OLD_LIST], ['in message ' + dPC.tensionAt.join(', ') + ' ' + NEW_TENSION, 'in message ' + dPC.tensionAt.join(', ') + ' ' + OLD_TENSION]])) === PIN.plainC &&
        S16(back(F6.unified, [[NEW_UNI, OLD_UNI]])) === PIN.unified && S16(back(F6.unified2, [[NEW_UNI, OLD_UNI]])) === PIN.unified2;
    })());
  assert('(7b.9) the thresholds and the pace are as they were (30 words; a word in 3 messages; 3 / 2 phrases; 3 messages and 15 new words between two offers), and every form is still one block the api guard accepts, with no question mark',
    JSON.stringify(F.SPEAK_RIGHT_PARAMS) === JSON.stringify({ minWords: 30, recurIn: 3, phrasesB: 3, phrasesC: 2, rearmMessages: 3, rearmWords: 15 }) &&
    all.every(x => isStr(x) && guardBlocks(x).length === 1 && guardAccepts(x) && !/\?/.test(x) && x.endsWith(']\n')));
});

// ── (8) the wiring ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(8)', () => {
  assert('(8.1) one record of the last offer, like the other refs, and cleared with a new session — after the road answers, so the distance test_decision_sheet.js measures from resetSession does not grow',
    /const speakRightRef = useRef\(\{ at: 0, mass: 0 \}\);/.test(CODE) && (() => { const r = CODE.indexOf('const resetSession'), q = CODE.indexOf('speakRightRef.current = { at: 0, mass: 0 };'), w = CODE.indexOf('roadAnswersFinal.current = [];', r); return r > 0 && w > r && q > w && q - r < 9000; })());
  assert('(8.2) the decision is built from the Stage A rule, the readiness rule, the messages, the record and the latch of heaviness; the latch of danger is not read again; the record is written only when the offer is sent',
    /const _sr = speakRightDecision\(_saNotesHeld, _srAsked, msgs, speakRightRef\.current, \{ riskKind: riskSignalKind\.current \}\);/.test(CODE) &&
    /if \(_sr\.kind === "speak"\) speakRightRef\.current = \{ at: _sr\.userCount, mass: _sr\.mass \};/.test(CODE) && CODE.split('speakRightRef.current = {').length === 3 && CODE.split('dangerFromOther.current').length - 1 === 20); /* UPDATED (19/11/2026, «συνομιλία v1», Package 1, John, SAFETY-READ COUNT: ONE more read of each latch — the root question's list (rootPickEffect → rootPickView) reads the latch of danger and the latch of heaviness only to HIDE itself on the safety path; the effect checks the switch first, the gate needs the phase "ask" (Stage A only); nothing of the safety path changed) */
  assert('(8.3) it takes the place of the ROUND TYPE note, in the same slot and under the same name: the slot of the hard-constraint tier is not moved; the Stage A rule has ONE reader here (6 in all, as test_stage_a_notes_3010.js pins)',
    /const roundTypeCtx = describeSpeakRightCtx\(_sr, msgs, _srAsked\);/.test(CODE) && /const _srAsked = answersReadinessQuestion\(msgs\);/.test(CODE) && CODE.split('_saNotesHeld').length - 1 === 6 &&
    /gatesCtx, roundTypeCtx, closingDriftCtx, stageAFirstReplyCtx, firstReplyFloorCtx, safetyPathCtx, stageAMarkerCtx,\n      \]\.filter\(Boolean\)\.join\('\\n'\);/.test(CODE));
  assert('(8.4) before the decision and the note: after the Stage A rule `_saNotesHeld`, which is false on the safety path', CODE.indexOf('const _saNotesHeld = stageAPreRootNotesHeld(') > 0 && CODE.indexOf('const _saNotesHeld = stageAPreRootNotesHeld(') < CODE.indexOf('const _sr = speakRightDecision('));
  assert('(8.5) it adds no family to the collision logger (the keys are those of e4b2ae6)', !/const fired = Object\.entries\(\{[^}]*(?:roundTypeCtx|speakRight)/.test(CODE));
  assert('(8.6) the pure part lives next to the tension detector and the ROUND TYPE note, and makes no call, no storage and no log', (() => { const body = ['speakRightWords', 'speakRightMaterial', 'speakRightDecision', 'describeSpeakRightCtx'].map(fnSrc).join('\n');
    return body.length > 600 && !/fetch\(|localStorage|sessionStorage|console\.|recordTelemetry|setTimeout|\.current\b|useRef|Date\.now|Math\.random/.test(body); })());
});

// ── (9) the filters: John's example passes untouched; a sentence that STARTS with «Άρα» does not ──────────────────────────────────────────────────────
safely('(9)', () => {
  const OF = require(path.join(ROOT, 'scripts', 'org_flags.cjs'));
  const lib = OF.lift(raw, ['stripAraDeclarative', 'stripLineClaims', 'stripDangerPromises', 'stripInternalLabels', 'stripForeignHelplines', 'stripRootDeclaration', 'stripPressurePhrases',
    'stripRepeatedThreeBeat', 'guardStopMoment', 'countStopMoments', 'dangerInMessages', 'detectsMentalHealthReferral', 'isBareEmojiOrAcknowledgment', 'dropQuoteOnlyLines']);
  const msgs0 = [{ role: 'user', content: 'x' }];
  const chain = text => {
    const cleanLabels = t => lib.stripPressurePhrases(lib.stripRootDeclaration(lib.stripForeignHelplines(lib.stripInternalLabels(t).text)));
    let t = lib.stripLineClaims(text, lib.dangerInMessages(msgs0), false);
    t = lib.stripDangerPromises(t, lib.dangerInMessages(msgs0));
    t = lib.stripRepeatedThreeBeat(lib.stripAraDeclarative(cleanLabels(t)), msgs0);
    t = lib.guardStopMoment(t, lib.countStopMoments(msgs0), false || lib.detectsMentalHealthReferral(text));
    return lib.dropQuoteOnlyLines(t);
  };
  const JOHN = 'Από αυτά που μου είπες, υπάρχει ταυτόχρονα η επιθυμία να φύγεις από την τωρινή κατάσταση και η αμφιβολία αν η εναλλακτική θα σου προσθέσει βάρος. Δεν ξέρω ακόμη ποιο από τα δύο καθορίζει περισσότερο την απόφασή σου.';
  assert('(9.1) the example of an acceptable synthesis passes every filter of the exit unchanged — alone, and with a short question to correct it, and over three lines', chain(JOHN) === JOHN && chain(JOHN + ' Σου ταιριάζει έτσι ή το διορθώνεις;') === JOHN + ' Σου ταιριάζει έτσι ή το διορθώνεις;' &&
    chain('Από αυτά που μου είπες:\n\nυπάρχει η επιθυμία να φύγεις από την τωρινή κατάσταση,\n\nκαι η αμφιβολία αν η εναλλακτική θα σου προσθέσει βάρος.\n\nΔεν ξέρω ποιο από τα δύο καθορίζει περισσότερο την απόφασή σου.') !== '');
  assert('(9.2) a sentence that STARTS with the whole word «Άρα» is taken out (the first sentence of the synthesis would be lost) — which is why the note forbids it; an «άρα» inside a sentence stays',
    chain('Άρα, από αυτά που μου είπες υπάρχει ταυτόχρονα η επιθυμία να φύγεις και η αμφιβολία αν η εναλλακτική θα σου προσθέσει βάρος. Δεν ξέρω ακόμη ποιο καθορίζει την απόφασή σου.') === 'Δεν ξέρω ακόμη ποιο καθορίζει την απόφασή σου.' &&
    chain('Από αυτά που μου είπες, και άρα η αμφιβολία μένει ανοιχτή, δεν ξέρω ακόμη ποιο καθορίζει την απόφαση.') === 'Από αυτά που μου είπες, και άρα η αμφιβολία μένει ανοιχτή, δεν ξέρω ακόμη ποιο καθορίζει την απόφαση.');
  assert('(9.3) the reply is not taken for a bare emoji or a bare acknowledgment either', lib.isBareEmojiOrAcknowledgment(JOHN) === false);
});

// ── (10) the labels of the stress tool ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(10)', () => {
  const SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'));
  const lab = t => SL.noteLabels([{ type: 'text', text: t }]);
  const plain = call('describeSpeakRightCtx', dec(NAT_PLAIN), NAT_PLAIN), uni = call('describeSpeakRightCtx', dec(NAT_UNIFIED), NAT_UNIFIED);
  const m6 = NAT_PLAIN.concat([A(6), U('Όχι.')]), fu = call('describeSpeakRightCtx', call('speakRightDecision', true, false, m6, { at: 6, mass: 30 }, RISK0), m6);
  const m7 = natConv().concat([A(6), U('Όχι.')]), fu2 = call('describeSpeakRightCtx', call('speakRightDecision', true, false, m7, { at: 6, mass: 30 }, RISK0), m7);
  assert('(10.1) each form has its own label, so the report can say which one was sent: the offer, the offer with the ROUND TYPE note, the follow-up, the follow-up with it; the ROUND TYPE note alone keeps its label',
    JSON.stringify(lab(plain)) === '["SPEAK_RIGHT"]' && JSON.stringify(lab(uni)) === '["SPEAK_RIGHT+ROUND_TYPE"]' && JSON.stringify(lab(fu)) === '["SPEAK_RIGHT_FOLLOWUP"]' && JSON.stringify(lab(fu2)) === '["SPEAK_RIGHT_FOLLOWUP+ROUND_TYPE"]' &&
    JSON.stringify(lab(call('describeRoundTypeCtx', true, false, NAT_UNIFIED))) === '["ROUND_TYPE"]');
  assert('(10.2) they are not strategy notes (a permission and a constraint, not a strategy) and are not suppressed', !SL.STRATEGY_NOTES.some(x => /SPEAK_RIGHT/.test(x)) && !SL.SUPPRESSED_NOTES.some(x => /SPEAK_RIGHT/.test(x)));
});

// ── (11) the explicit sentence about the thresholds, and where the sample comes from ────────────────────────────────────────────────────────────────
safely('(11)', () => {
  const at = CODE.indexOf('«δικαίωμα ομιλίας από υλικό»'); const block = at < 0 ? '' : CODE.slice(at, CODE.indexOf('function speakRightWords(', at));
  assert('(11.1) the comment says in so many words that the thresholds are TEMPORARY, within the sample (76 sessions), not a permanent rule, and that the first paid run is the first independent sample',
    block.includes('κατώφλια ΠΡΟΣΩΡΙΝΑ, ΕΝΤΟΣ ΔΕΙΓΜΑΤΟΣ (76 συνεδρίες), όχι μόνιμος κανόνας· το πρώτο πληρωμένο τρέξιμο είναι το πρώτο ανεξάρτητο δείγμα'));
  assert('(11.2) … and where the sample comes from: the 9 stored real-model runs (#43, #44, #45, #46, #47, #50, #52, #53, #60), the sessions of each (9, 12, 6, 9, 1, 14, 19, 2, 4), 54 different scenarios (15 of them repeat, in 37 sessions), 66 with a user made by a model and 10 with fixed messages',
    block.includes('#43, #44, #45, #46, #47, #50, #52, #53, #60') && block.includes('9, 12, 6, 9, 1, 14, 19, 2, 4') && block.includes('54 διακριτά σενάρια') && block.includes('15 επαναλαμβάνονται σε 37 συνεδρίες') && block.includes('66 με χρήστη από μοντέλο') && block.includes('10 με σταθερά μηνύματα'));
  assert('(11.3) … and that the pace of a second offer (3 messages, 15 new words) is new and just as temporary, and that the note is a permission', /pace of a second offer/.test(block) && /permission/.test(block));
});

// ── (12) what this commit must not touch ────────────────────────────────────────────────────────────────────────────────────────────────────────────
safely('(12)', () => {
  const lit = n => { const h = 'const ' + n + ' = `'; const a = raw.indexOf(h); const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
  assert('(12.1) the fixed prompt is b5f303cc9405aa21 and the crisis and closing prompts are as before', sha(lit('AURA_CORE_PERSONALITY')).startsWith('b5f303cc9405aa21') && sha(lit('SYSTEM_SUPPORTIVE')).startsWith('c7815b96d83ebae8') && sha(lit('SYSTEM_TERMINATION')).startsWith('d5a77ca926f9490b'));
  assert('(12.2) api/aura.js is the file of e4b2ae6, byte for byte (sha256 e791b194…) and the guard still lists 33 openings', sha(api) === 'e791b19471f0813246550e9d5a47bf7d95e46b4385814e4758d4abf8dea66053' && OPENINGS.length === 33);
  let same = false; try { const G = require(path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs')); same = JSON.stringify(G.openingsFor(raw)) === JSON.stringify(OPENINGS); } catch (e) { console.log('LOAD ERROR openings — ' + e.message); }
  assert('(12.3) the build would write the same openings: the new notes begin the way the guard expects', same);
  assert('(12.4) the screen filter is as in e4b2ae6, byte for byte', sha(raw.slice(raw.indexOf('const INTERNAL_LABEL_HEADS'), raw.indexOf('function stripAraDeclarative'))).startsWith('f3f9a30b63578889'));
  assert('(12.5) the Thought Map is called, never changed: pickBranches and branchSessionSafe are those of d7bea8f', sha(fnSrc('pickBranches')) === '0514402718894bd8b6702726fcc826a63004cb3627a7776bf95f59d4cb841da9' && sha(fnSrc('branchSessionSafe')) === 'd31fee2247097e13ab500a5aaa2e6e685cdb896d396a23e9cf3500a80cbd7110' && sha(fnSrc('detectSelfMarkedTension')) === 'e784d2e1518451e5ba0ed841633be346fa520e9af713b53e343da092c95960ea');
  const mine = (() => { const a = CODE.indexOf('«δικαίωμα ομιλίας από υλικό»'), b = CODE.indexOf('function detectUserStagnation(', a); return a < 0 || b < a ? '' : CODE.slice(a, b); })();
  assert('(12.7) the Thought Map stays display only: nothing of the new block names a function or a constant of it (the pin of test_pick_branches.js (Ζ) holds without a change)', mine.length > 8000 && !/pickBranches|branchSentenceSpans|branchAuraEndsWithQuestion|branchJaccard|branchWords|BRANCH_/.test(mine));
  assert('(12.8) the safety path is read, not changed: the same number of reads of the danger latch as in d7bea8f (19), one more read of the latch of heaviness (40 → 41), the 19 safety functions as in e4b2ae6 ((Ω1))', CODE.split('dangerFromOther.current').length - 1 === 20 && CODE.split('riskSignalKind.current').length - 1 === 42); /* UPDATED (19/11/2026, «συνομιλία v1», Package 1, John, SAFETY-READ COUNT: ONE more read of each latch — the root question's list (rootPickEffect → rootPickView) reads the latch of danger and the latch of heaviness only to HIDE itself on the safety path; the effect checks the switch first, the gate needs the phase "ask" (Stage A only); nothing of the safety path changed) */
  assert('(12.6) the ROUND TYPE note and its two helpers are called, never changed', sha(fnSrc('describeRoundTypeCtx')) === '5a1d0d418d34300b7e202169b770363ea1e952f4d5f688165217affd71034db0' && sha(fnSrc('trailingQuestionReplies')) === 'efc1f14f6a437d7cbee5eb950f8f8fbfea64d2bc2d218ebd4074235ffde0df89' && sha(fnSrc('userSaysDontKnowTwice')) === '79a0fc114472fef561eb233cdfa3d33bfd25df35526e751e8dbef5c049f5acd4');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
