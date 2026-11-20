// AURA — ROUND TRACE for the ?debug=1 panel (John, 16/11/2026). Branch conversation-v1, on 144bd21. PASSIVE: numbers and yes/no, never a word of the conversation;
// no reply, no request, no limit and no text that the model reads is changed. The fixed prompt (7e52268becda7360), api/aura.js, the ROUND TYPE note and its limit of 5,
// the screen filter and the safety path are not touched.
//  For every request of the main flow (generateResponse) the panel shows three things: (α) how many of AURA's replies in a row had ended in a question when the request was
//  made, (β) whether the ROUND TYPE note was in that request (yes/no), (γ) whether the reply that came ended in a question (yes/no).
//  (1) the pieces exist and are pure (no storage, no console, no telemetry, no clock, no randomness, no state setter)
//  (2) (α) the streak — the same replies and the same ending that the ROUND TYPE note counts, but the true number from the first reply
//  (3) (β) the note was in the request — read from the note itself (alone, or inside the one note with the offer or its follow-up), never from a second decision
//  (4) (γ) the reply ended in a question — the very test the streak uses, so the next round's (α) is this one's +1 exactly when (γ) is yes
//  (5) the rows: only numbers and booleans, bounded, a retry replaces its row, nothing is changed in place, the line of the panel
//  (6) the wiring in src/App.jsx: the ref, the reset in resetSession, the two passive calls (gate, try/catch, place), the panel (only inside the ?debug=1 block)
//  (7) what must not change: the fixed prompt, api/aura.js, the ROUND TYPE note and its limit, the way the request is made
// All text here is synthetic (made-up words, neutral sentences).

// UPDATED (19/11/2026, «συνομιλία v1», Package 1, John): the prompt changed on purpose in exactly three lines (912, 918, 927; auratests/package1_undo.json) — every prompt fingerprint below moved from b5f303cc9405aa21 to 7e52268becda7360 (313386 characters, was 311822), and api/aura.js carries the new core fingerprint (sha256 675564a7985438c8…, was e791b194…). Nothing else of the prompt moved: auratests/test_package1_prompt_1911.js (7.2)–(7.3).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond === true) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const T = f => { try { return f() === true; } catch (e) { return false; } }; // a check that throws is a check that fails — never a test that stops
const sha = s => crypto.createHash('sha256').update(s || '', 'utf8').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1);
  const line = raw.slice(a + 1, eol); if (/;\s*(?:\/\/.*)?$/.test(line)) return line; return raw.slice(a + 1, raw.indexOf('\n];', a) + 3); };
const lit = n => { const h = 'const ' + n + ' = `'; const a = raw.indexOf(h); const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
const OPENINGS = (() => { const i = api.indexOf('openings: ['); return JSON.parse('[' + api.slice(i + 11, api.indexOf('],', i)).trim().replace(/,\s*$/, '') + ']'); })();

// ── load: the functions of the ROUND TYPE note (they stay as they are) and the new ones ─────────────────────────────────────────────────────────
const NEW_FNS = ['replyEndsInQuestion', 'questionStreakNow', 'roundTypeNoteSent', 'roundTraceNumber', 'roundTraceBegin', 'roundTraceFinish', 'roundTraceLine'];
const OLD_FNS = ['trailingQuestionReplies', 'userSaysDontKnowTwice', 'describeRoundTypeCtx', 'describeSpeakRightCtx'];
const NEW_CONSTS = ['ROUND_TRACE_KEEP', 'ROUND_TRACE_SHOW', 'ROUND_TRACE_LEGEND'];
const CONSTS = ['SPEAK_RIGHT_FOLLOWUP_BODY', ...NEW_CONSTS];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...[...OLD_FNS, ...NEW_FNS].map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + [...OLD_FNS, ...NEW_FNS, ...CONSTS].join(', ') + ' };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return { threw: e.message }; } };
const threw = x => x && typeof x === 'object' && typeof x.threw === 'string';

// ── (1) the pieces ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(1.1) the pieces are in src/App.jsx: ' + NEW_FNS.length + ' functions and the 3 constants', NEW_FNS.every(n => fnSrc(n) !== '') && NEW_CONSTS.every(n => constSrc(n) !== ''));
assert('(1.2) … and they load beside the functions of the ROUND TYPE note', [...OLD_FNS, ...NEW_FNS].every(n => typeof F[n] === 'function') && NEW_CONSTS.every(n => F[n] !== undefined));
assert('(1.3) they are pure: no storage, no console, no telemetry, no clock, no randomness, no state setter, no network, no window',
  NEW_FNS.every(n => fnSrc(n) !== '' && !/(console|localStorage|sessionStorage|recordTelemetry|window|document|\bDate\b|Math\.random|fetch|\bset[A-Z]\w*\()/.test(fnSrc(n))));
assert('(1.4) the functions that make a row never read a message: no «content» in roundTraceNumber, roundTraceBegin, roundTraceFinish, roundTraceLine',
  ['roundTraceNumber', 'roundTraceBegin', 'roundTraceFinish', 'roundTraceLine'].every(n => fnSrc(n) !== '' && !/content/.test(fnSrc(n))));

// ── (2) (α) the streak ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const U = t => ({ role: 'user', content: t }), A = t => ({ role: 'assistant', content: t });
const QR = i => A('Ερώτηση νούμερο ' + i + ';'), SR = i => A('Δήλωση νούμερο ' + i + '.');
// a conversation of rounds: for each letter a user message and the reply (Q a question, S a statement)
const conv = letters => letters.split('').flatMap((e, i) => [U('μήνυμα ' + (i + 1)), e === 'Q' ? QR(i + 1) : SR(i + 1)]);
const streakOf = m => call('questionStreakNow', m);
assert('(2.1) nothing yet: no messages, only user messages, nothing usable → 0', streakOf([]) === 0 && streakOf([U('α'), U('β')]) === 0 && streakOf(null) === 0 && streakOf(undefined) === 0 && streakOf('x') === 0);
assert('(2.2) the true number from the first reply: 1 reply that ended in a question → 1, two → 2 (the code of the note says 0 below three replies, on purpose — its limit is 5)',
  streakOf(conv('Q')) === 1 && streakOf(conv('QQ')) === 2 && call('trailingQuestionReplies', conv('QQ')) === 0 && streakOf(conv('QQQ')) === 3 && call('trailingQuestionReplies', conv('QQQ')) === 3);
assert('(2.3) five in a row → 5, seven → 7: the number the note puts in its text («your last N replies») is this number',
  [5, 7].every(n => { const m = [...conv('Q'.repeat(n)), U('ένα ακόμα')]; const note = call('describeRoundTypeCtx', true, false, m); return streakOf(m) === n && typeof note === 'string' && note.includes('your last ' + n + ' replies each ended with a question'); }));
assert('(2.4) a reply that is not a question ends the run: QQSQQ → 2, S → 0, QS → 0, SQ → 1', streakOf(conv('QQSQQ')) === 2 && streakOf(conv('S')) === 0 && streakOf(conv('QS')) === 0 && streakOf(conv('SQ')) === 1);
assert('(2.5) the ending: «;» and «?» count, also with spaces or a line break after them; «;»», «?)», «?» + emoji, «…» and the Greek question mark U+037E do not (as in the code of the note)', T(() => {
  const mk = (end, k) => Array.from({ length: k }, (_, i) => [U('μ' + i), A('Λέξεις χωρίς νόημα' + end)]).flat();
  const yes = [';', '?', ' ;', '?  ', '?\n', ';\n\n', ' ? '], no = [';»', '?)', '? 🙂', '…', ';', '.', '!', ''];
  return yes.every(e => streakOf(mk(e, 4)) === 4 && call('trailingQuestionReplies', mk(e, 4)) === 4) && no.every(e => streakOf(mk(e, 4)) === 0 && call('trailingQuestionReplies', mk(e, 4)) === 0); }));
assert('(2.6) closing replies (msgMode TERMINATION, isTermination) are not counted and do not break the run — as in the code of the note',
  streakOf([...conv('QQ'), { role: 'assistant', content: 'Καλή συνέχεια.', msgMode: 'TERMINATION' }, ...conv('QQ')]) === 4 &&
  streakOf([...conv('QQ'), { role: 'assistant', content: 'Αντίο.', isTermination: true }, ...conv('QQ')]) === 4);
assert('(2.7) other roles, empty places and content that is not text are passed over', streakOf([{ role: 'system', content: '?' }, { role: 'assistant', content: 5 }, null, undefined, { role: 'assistant' }, { role: 'assistant', content: ['?'] }]) === 0 &&
  streakOf([QR(1), { role: 'system', content: 'Δήλωση.' }, null, QR(2)]) === 2);
// an independent specification and 4,000 generated conversations
let seed = 20261116; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = a => a[Math.floor(rnd() * a.length)];
const ENDS = ['?', ';', ' ?', '?  ', '.', '!', '…', ';»', '?)', ' 🙂', ';', '', ' λέξη', '?\n'];
const QENDS = ['?', ';', ' ?', '?  ', '?\n'];
// half of the conversations are «question-heavy» (9 replies in 10 end in a question), so that runs of five and more are common, not rare
const randomConv = () => { const n = Math.floor(rnd() * 24); const bias = rnd() < 0.5 ? 0.92 : 0.3; const out = [];
  for (let i = 0; i < n; i++) { const r = rnd(); if (r < 0.4) out.push(U('μήνυμα ' + i + pick(ENDS))); else if (r < 0.9) out.push(A('απάντηση ' + i + (rnd() < bias ? pick(QENDS) : pick(ENDS)))); else out.push({ role: 'assistant', content: 'κλείσιμο ' + pick(ENDS), ...(rnd() < 0.5 ? { msgMode: 'TERMINATION' } : { isTermination: true }) }); }
  return out; };
const specReplies = m => m.filter(x => x && x.role === 'assistant' && typeof x.content === 'string' && x.msgMode !== 'TERMINATION' && x.isTermination !== true).map(x => x.content);
const specStreak = m => { const r = specReplies(m); let s = 0; for (let i = r.length - 1; i >= 0; i--) { if (/[;?]\s*$/.test(r[i].trim())) s++; else break; } return s; };
{ let bad = 0, badOld = 0, lit5 = 0, short = 0, checked = 0;
  for (let k = 0; k < 4000; k++) { const m = randomConv(); const s = streakOf(m), want = specStreak(m); const old = call('trailingQuestionReplies', m); const nReplies = specReplies(m).length; checked++;
    if (s !== want || !Number.isInteger(s) || s < 0) bad++;
    if (nReplies >= 3 ? (old !== want || s !== old) : (old !== 0 || s !== want)) badOld++;
    if (want >= 5) lit5++; if (nReplies < 3 && want > 0) short++; }
  assert('(2.8) 4,000 generated conversations: the streak is the specification\'s (the replies that count, from the end, until the first that is not a question), always a whole number ≥ 0 (' + checked + ' checked, ' + lit5 + ' with a run of 5+)', checked === 4000 && bad === 0 && lit5 > 100);
  assert('(2.9) … and it is the number the code of the note counts whenever that code counts (three replies or more); below three the note\'s function says 0 and this says the true number (' + short + ' such cases)', badOld === 0 && short > 20); }
assert('(2.10) it reads only AURA\'s replies: the same value when every message of the user is replaced', T(() => { const m = conv('QQQSQQ'); const m2 = m.map(x => x.role === 'user' ? U('ΖΩΖΟΧ') : x); return streakOf(m) === 2 && streakOf(m2) === 2; }));

// ── (3) (β) the ROUND TYPE note was in the request ─────────────────────────────────────────────────────────────────────────────────────────────
const noteSent = x => call('roundTypeNoteSent', x);
const SPEAK_D = { kind: 'speak', held: true, viaB: true, viaC: false, userCount: 6, mass: 40, recurAt: [1, 3, 5], tensionAt: [], phraseN: 3, phraseAt: [2, 4, 6] };
const FOLLOW_D = { kind: 'followup', held: true };
const m5 = [...conv('QQQQQ'), U('μήνυμα έξι')], m4 = [...conv('QQQQ'), U('μήνυμα πέντε')], mS = [...conv('QSQQQ'), U('μήνυμα έξι')];
assert('(3.1) not a note → false: nothing, empty, not text, ordinary text', ['', undefined, null, 5, {}, [], true, 'Κάποιο κείμενο που δεν είναι σημείωση.'].every(x => noteSent(x) === false));
assert('(3.2) the real ROUND TYPE note, lit by five questions in a row (and by seven), is → true', T(() => { const n5 = call('describeRoundTypeCtx', true, false, m5); const m7 = [...conv('QQQQQQQ'), U('μήνυμα οκτώ')]; const n7 = call('describeRoundTypeCtx', true, false, m7);
  return typeof n5 === 'string' && n5.length > 500 && noteSent(n5) === true && typeof n7 === 'string' && noteSent(n7) === true; }));
assert('(3.3) … lit by two «δεν ξέρω» in a row (no run of questions) is → true as well', T(() => { const m = [U('δεν ξέρω'), SR(1), U('δεν ξέρω'), SR(2), U('δεν ξέρω')]; const n = call('describeRoundTypeCtx', true, false, [U('δεν ξέρω'), A('Δήλωση.'), U('δεν ξέρω')]); return typeof n === 'string' && n.length > 500 && noteSent(n) === true && m.length === 5; }));
assert('(3.4) the note is not lit → \'\' → false: four questions, held (not Stage A before the root), the readiness question pending',
  call('describeRoundTypeCtx', true, false, m4) === '' && noteSent(call('describeRoundTypeCtx', true, false, m4)) === false &&
  noteSent(call('describeRoundTypeCtx', false, false, m5)) === false && noteSent(call('describeRoundTypeCtx', true, true, m5)) === false);
assert('(3.5) the ONE note with the offer (the ROUND TYPE note with the connection added) is → true; so is the ONE note with the follow-up added', T(() => {
  const a = call('describeSpeakRightCtx', SPEAK_D, m5, false), b = call('describeSpeakRightCtx', FOLLOW_D, m5, false);
  return typeof a === 'string' && a.includes('AND because the material is also enough') && noteSent(a) === true && typeof b === 'string' && b.includes('ALSO, ') && noteSent(b) === true; }));
assert('(3.6) the plain offer and the plain follow-up (no run of questions, so no ROUND TYPE note inside) are → false', T(() => {
  const a = call('describeSpeakRightCtx', SPEAK_D, mS, false), b = call('describeSpeakRightCtx', FOLLOW_D, mS, false);
  return typeof a === 'string' && a.includes('this reply may say back a connection') && noteSent(a) === false && typeof b === 'string' && b.includes('the previous reply of yours was sent with a permission') && noteSent(b) === false; }));
assert('(3.7) no other opening the guard of api/aura.js lists is it (' + OPENINGS.length + ' openings, with and without the line break the notes start with), and a note that only MENTIONS the phrase is not it',
  OPENINGS.length >= 30 && OPENINGS.every(o => noteSent(o) === false && noteSent('\n' + o) === false && noteSent('\n' + o + ' x]') === false) &&
  noteSent('\n[CODE-VERIFIED: other. this reply must not end with a question]') === false && noteSent('x\n[CODE-VERIFIED: this reply must not end with a question') === false);
assert('(3.8) 3,000 generated cases (a decision of the offer, a conversation, the two holds): it says yes exactly when the note the code wrote holds the ROUND TYPE note — the note as the code builds it, not a guess', T(() => {
  let bad = 0, yes = 0, no = 0;
  for (let k = 0; k < 3000; k++) { const m = randomConv(); if (rnd() < 0.5) m.push(U(pick(['δεν ξέρω', 'άκυρο', 'κάτι άλλο'])), U(pick(['δεν ξέρω', 'όπως θες', 'λέξεις']))); const kind = pick(['', 'speak', 'followup']); const held = rnd() < 0.7, ready = rnd() < 0.3;
    const d = kind === 'speak' ? { ...SPEAK_D, held } : kind === 'followup' ? { ...FOLLOW_D, held } : { kind: '', held };
    const text = call('describeSpeakRightCtx', d, m, ready); const want = (kind === '' ? call('describeRoundTypeCtx', held, ready, m) : call('describeRoundTypeCtx', true, false, m)) !== '';
    const got = noteSent(text); if (got !== want) bad++; if (want) yes++; else no++; }
  return bad === 0 && yes > 100 && no > 100; }));

// ── (4) (γ) the reply ended in a question ──────────────────────────────────────────────────────────────────────────────────────────────────────
const endsQ = x => call('replyEndsInQuestion', x);
assert('(4.1) a reply that ends in «;» or «?» (with spaces or a line break after) is yes; any other ending, empty, or not text is no',
  [';', '?', 'Και μετά;', 'Πώς το βλέπεις ;  ', 'Τι άλλο?\n', 'x ? '].every(x => endsQ(x) === true) && ['', 'Τέλος.', 'Ναι!', 'Ίσως…', 'Ερώτηση;»', 'Ερώτηση?)', 'Ερώτηση; 🙂', 'Ερώτηση;', null, undefined, 5, {}, ['?']].every(x => endsQ(x) === false));
assert('(4.2) it is the test the streak uses: 4,000 generated replies — yes exactly when three such replies in a row make a run of three for the code of the note', T(() => {
  let bad = 0, yes = 0; for (let k = 0; k < 4000; k++) { const t = 'λέξη ' + k + pick(ENDS) + (rnd() < 0.2 ? ' ' : ''); const v = endsQ(t); const run = call('trailingQuestionReplies', [A(t), A(t), A(t)]);
    if (v !== (run === 3) || (v && run !== 3)) bad++; if (v) yes++; } return bad === 0 && yes > 500; }));
assert('(4.3) so the next round\'s (α) is this round\'s +1 exactly when (γ) is yes: a run of replies, one more reply, 2,000 cases', T(() => {
  let bad = 0; for (let k = 0; k < 2000; k++) { const m = randomConv(); const t = 'νέα απάντηση ' + k + pick(ENDS); const before = streakOf(m), after = streakOf([...m, A(t)]); if (after !== (endsQ(t) ? before + 1 : 0)) bad++; } return bad === 0; }));

// ── (5) the rows ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const begin = (...a) => call('roundTraceBegin', ...a), finish = (...a) => call('roundTraceFinish', ...a), line = r => call('roundTraceLine', r);
const rowOk = r => r && typeof r === 'object' && JSON.stringify(Object.keys(r)) === JSON.stringify(['n', 's', 'note', 'q']) && Number.isInteger(r.n) && r.n >= 0 && r.n <= 9999 && Number.isInteger(r.s) && r.s >= 0 && r.s <= 9999 && typeof r.note === 'boolean' && (r.q === null || typeof r.q === 'boolean');
assert('(5.1) a request makes one row: the round, the streak, the note yes/no, the reply not known yet (null)', JSON.stringify(begin([], 7, 6, true)) === JSON.stringify([{ n: 7, s: 6, note: true, q: null }]) && JSON.stringify(begin(undefined, 1, 0, false)) === JSON.stringify([{ n: 1, s: 0, note: false, q: null }]));
assert('(5.2) only numbers and yes/no come in: a number out of range or not a number is cut to 0…9999, anything but true means «no» for the note', T(() => {
  const r = begin([], 'ΑΒΓ', -3, 'ναι')[0], r2 = begin([], 123456, 7.9, 1)[0], r3 = begin([], NaN, Infinity, undefined)[0];
  return rowOk(r) && r.n === 0 && r.s === 0 && r.note === false && rowOk(r2) && r2.n === 9999 && r2.s === 7 && r2.note === false && rowOk(r3) && r3.n === 0 && r3.s === 0; }));
assert('(5.3) the reply\'s end is added to the row of that round only; an unknown round or no rows changes nothing; true/false are the only values', T(() => {
  const rows = begin(begin(begin([], 1, 0, false), 2, 1, false), 3, 2, false); const a = finish(rows, 2, true), b = finish(rows, 2, false), c = finish(rows, 9, true), d = finish([], 1, true), e = finish(rows, 2, 'ναι');
  return a.map(r => r.q).join() === ',true,' && b.map(r => r.q).join() === ',false,' && JSON.stringify(c) === JSON.stringify(rows) && JSON.stringify(d) === '[]' && e[1].q === false && [a, b, c, e].every(x => x.every(rowOk)); }));
assert('(5.4) nothing is changed in place: the rows given in are the rows they were', T(() => { const rows = begin([], 1, 0, false); const copy = JSON.stringify(rows); begin(rows, 2, 1, true); finish(rows, 1, true); line(rows[0]); return Array.isArray(rows) && rows.length === 1 && JSON.stringify(rows) === copy; }));
assert('(5.5) a retry of the same round replaces its row (the old one with its answer, if any, is gone); the order of the others stays', T(() => {
  let rows = begin(begin([], 1, 0, false), 2, 1, false); rows = finish(rows, 2, true); const again = begin(rows, 2, 1, true);
  return again.length === 2 && JSON.stringify(again[0]) === JSON.stringify(rows[0]) && JSON.stringify(again[1]) === JSON.stringify({ n: 2, s: 1, note: true, q: null }); }));
assert('(5.6) bounded: the last ' + (F.ROUND_TRACE_KEEP) + ' rows are kept (250 requests), the panel shows the last ' + (F.ROUND_TRACE_SHOW), T(() => {
  let rows = []; for (let i = 1; i <= 250; i++) rows = begin(rows, i, i % 9, i % 2 === 0); return Number.isInteger(F.ROUND_TRACE_KEEP) && F.ROUND_TRACE_KEEP >= 100 && F.ROUND_TRACE_KEEP <= 500 && rows.length === F.ROUND_TRACE_KEEP && rows[rows.length - 1].n === 250 && rows[0].n === 251 - F.ROUND_TRACE_KEEP &&
    Number.isInteger(F.ROUND_TRACE_SHOW) && F.ROUND_TRACE_SHOW >= 26 && F.ROUND_TRACE_SHOW <= F.ROUND_TRACE_KEEP; }));
assert('(5.7) the line of the panel is numbers and yes/no only: «round: streak · note · reply», the reply «—» while it is not known', line({ n: 7, s: 6, note: true, q: true }) === '7: 6 · ναι · ναι' && line({ n: 12, s: 0, note: false, q: false }) === '12: 0 · όχι · όχι' &&
  line({ n: 3, s: 2, note: true, q: null }) === '3: 2 · ναι · —' && line(undefined) === '0: 0 · όχι · —' && line(null) === '0: 0 · όχι · —');
assert('(5.8) … and a row that is not what Begin makes (strings, objects) puts none of its content in the line', T(() => { const l = line({ n: 'ΖΩΖΟΧ', s: { x: 'ΖΩΖΟΧ' }, note: 'ΖΩΖΟΧ', q: 'ΖΩΖΟΧ' }); return l === '0: 0 · όχι · —' && !/ΖΩΖΟΧ/.test(l); }));
assert('(5.9) every line the panel can show has one shape: 3,000 generated rows', T(() => { let bad = 0; for (let k = 0; k < 3000; k++) { const r = { n: Math.floor(rnd() * 12000), s: Math.floor(rnd() * 12000), note: rnd() < 0.5, q: pick([true, false, null]) };
  const l = line(r); if (!/^\d{1,4}: \d{1,4} · (ναι|όχι) · (ναι|όχι|—)$/.test(l)) bad++; } return bad === 0; }));
assert('(5.10) no word of a conversation can reach a row or a line: sentinel words typed by the user and said by AURA appear nowhere in the rows', T(() => {
  const SENT = 'ΣΕΝΤΙΝΕΛ';
  const m = [U(SENT + ' α'), A(SENT + ' β;'), U(SENT + ' γ'), A(SENT + ' δ;'), U(SENT + ' ε')];
  let rows = begin([], m.filter(x => x.role === 'user').length, streakOf(m), noteSent(call('describeRoundTypeCtx', true, false, m))); rows = finish(rows, 3, endsQ(SENT + ' ζ;'));
  const dump = JSON.stringify(rows) + rows.map(line).join('|'); return rows.length === 1 && rows.every(rowOk) && !dump.includes(SENT) && /^[0-9\[\]{},:"nsotefalrqu·ναιόχ—| ]*$/.test(dump.replace(/true|false|null/g, '')); }));

// ── (6) the wiring in src/App.jsx ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const genA = raw.indexOf('const generateResponse = useCallback(async (msgs, currentMode) => {'), genB = raw.indexOf('const deliverFinalClosure = useCallback(');
const GEN = genA >= 0 && genB > genA ? raw.slice(genA, genB) : '';
const resetA = raw.indexOf('const resetSession = () => {'), RESET = resetA >= 0 ? raw.slice(resetA, raw.indexOf('\n  };', resetA)) : '';
const panelA = raw.indexOf('{debugMode.current && ('), PANEL = panelA >= 0 ? raw.slice(panelA, raw.indexOf('{/* ── Open anchors ── */}', panelA)) : '';
const refLines = raw.split('\n').filter(l => l.includes('roundTraceRef'));
const SHAPES = {
  decl: /^  const roundTraceRef = useRef\(\[\]\);/,
  reset: /^    roundTraceRef\.current = \[\];/,
  begin: /^      if \(debugMode\.current\) \{ try \{ roundTraceRef\.current = roundTraceBegin\(roundTraceRef\.current, msgs\.filter\(m => m && m\.role === "user"\)\.length, questionStreakNow\(msgs\), roundTypeNoteSent\(roundTypeCtx\)\); \} catch \(e\) \{ \/\* [^*]*\*\/ \} \}$/,
  finish: /^      if \(debugMode\.current && displayText\.trim\(\)\) \{ try \{ roundTraceRef\.current = roundTraceFinish\(roundTraceRef\.current, msgs\.filter\(m => m && m\.role === "user"\)\.length, replyEndsInQuestion\(displayText\)\); \} catch \(e\) \{ \/\* [^*]*\*\/ \} \}$/,
  panelLen: /^\s*\{roundTraceRef\.current\.length > 0 && \($/,
  panelRows: /^\s*\{roundTraceRef\.current\.slice\(-ROUND_TRACE_SHOW\)\.map\(r => \(<div key=\{r\.n\}>\{roundTraceLine\(r\)\}<\/div>\)\)\}$/,
};
const kinds = refLines.map(l => Object.keys(SHAPES).find(k => SHAPES[k].test(l)) || 'OTHER');
assert('(6.1) the ref: one declaration, inside the component (a list of numbers and yes/no — nothing else is kept)', kinds.filter(k => k === 'decl').length === 1 && raw.indexOf('const roundTraceRef') > raw.indexOf('export default function AURAv2()'));
assert('(6.2) resetSession clears it (a new session starts from nothing)', RESET.length > 500 && /\n    roundTraceRef\.current = \[\];/.test(RESET) && kinds.filter(k => k === 'reset').length === 1);
assert('(6.3) the request side: one call, in generateResponse, after the note is built, BEFORE the lines that build the system text and call the model (auratests/test_api_cost.js evaluates those on their own); only with ?debug=1; wrapped so it can never touch the session; reads the note and the messages and changes neither',
  GEN.length > 10000 && kinds.filter(k => k === 'begin').length === 1 && GEN.split('roundTraceBegin(').length === 2 &&
  GEN.indexOf('const roundTypeCtx = describeSpeakRightCtx(') > 0 && GEN.indexOf('const roundTypeCtx = describeSpeakRightCtx(') < GEN.indexOf('roundTraceBegin(') &&
  GEN.indexOf('roundTraceBegin(') < GEN.indexOf('const system = basePrompt + dynamicSuffix;') && GEN.indexOf('const system = basePrompt + dynamicSuffix;') < GEN.indexOf('const rawTextWithTags = await callAura([') &&
  (() => { const a = GEN.indexOf('const system = basePrompt + dynamicSuffix;'), b = GEN.indexOf('const rawTextWithTags', a); return a > 0 && b > a && !/roundTrace|debugMode/.test(GEN.slice(a, b)); })());
assert('(6.4) the reply side: one call, in generateResponse, right AFTER the reply is written (so the final check and the write stay side by side, as before); only with ?debug=1 and a reply that is shown; wrapped; reads the text that is shown (displayText) and changes nothing',
  kinds.filter(k => k === 'finish').length === 1 && GEN.split('roundTraceFinish(').length === 2 && GEN.indexOf('const _fk = finishReply(displayText, _finCtx);') > 0 &&
  GEN.indexOf('const _fk = finishReply(displayText, _finCtx);') < GEN.indexOf('if (displayText.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText') &&
  GEN.indexOf('if (displayText.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText') < GEN.indexOf('roundTraceFinish(') &&
  GEN.indexOf('roundTraceFinish(') < GEN.indexOf('// PASSIVE MEASUREMENT ONLY — fires after display'));
assert('(6.5) the panel: the rows are drawn inside the ?debug=1 block only (two lines of JSX), from the ref, through roundTraceLine, under the legend; the block is marked data-round-trace',
  PANEL.length > 1000 && kinds.filter(k => k === 'panelLen').length === 1 && kinds.filter(k => k === 'panelRows').length === 1 && PANEL.includes('data-round-trace="1"') && PANEL.includes('{ROUND_TRACE_LEGEND}') && PANEL.includes('roundTraceLine(r)'));
assert('(6.6) … and no other line of the file uses the ref: every line that names it is one of the six above (' + refLines.length + ' lines)', refLines.length === 6 && kinds.every(k => k !== 'OTHER'));
assert('(6.7) the panel still paints counters only: the old lines are there, the new part holds no «.content» and no «displayText» and nothing the checks of the other tests forbid in the panel',
  PANEL.includes('turn: {turnCount.current}') && PANEL.includes('καμία παραβίαση') && PANEL.includes('τηλεμετρία (.json)') && PANEL.includes('prov:') && PANEL.includes('road: labels=') &&
  !/\.content\b/.test(PANEL) && !/displayText/.test(PANEL) && !PANEL.includes('.on') && PANEL.length < 6000);
assert('(6.8) it logs nothing and stores nothing: the lines of the two calls and the legend have no console, no telemetry, no storage; the file has no new telemetry event for it',
  refLines.length === 6 && refLines.every(l => !/(console|recordTelemetry|localStorage|sessionStorage|fetch)/.test(l)) && !/recordTelemetry\("round/.test(raw) && !/recordTelemetry\([^)]*roundTrace/.test(raw) &&
  PANEL.includes('ROUND_TRACE_LEGEND') && !/(console|recordTelemetry|localStorage|sessionStorage|fetch)/.test(constSrc('ROUND_TRACE_LEGEND')));
assert('(6.9) the ref is not read by anything that is sent: it is nowhere in the notes, the system text, the request, the screen filter or the safety code',
  GEN.includes('roundTraceBegin(') && !/dynamicSuffix[^;]*roundTrace/.test(raw) && !/const system = [^;]*roundTrace/.test(raw) && !/callAura\([^;]*roundTrace/.test(raw));

// ── (7) what must not change ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const PINS = { trailingQuestionReplies: 'efc1f14f6a437d7c', userSaysDontKnowTwice: '79a0fc114472fef5', describeRoundTypeCtx: '5a1d0d418d34300b', describeSpeakRightCtx: '14e279143014f328',
  speakRightDecision: '1fcb007aaf77636a', answersReadinessQuestion: '70fd1f273d6f0e07' };
assert('(7.1) the ROUND TYPE note, its limit of 5, the two-«δεν ξέρω» trigger, the readiness hold and the one-note rule are as in 144bd21, byte for byte (' + Object.keys(PINS).length + ' functions)',
  Object.keys(PINS).every(n => fnSrc(n) !== '' && sha(fnSrc(n)).slice(0, 16) === PINS[n]));
assert('(7.2) … and the constants of the offer: its pace and its follow-up text are as in 144bd21', sha(constSrc('SPEAK_RIGHT_PARAMS')).slice(0, 16) === 'fee14e3b6afcc1ba' && sha(constSrc('SPEAK_RIGHT_FOLLOWUP_BODY')).slice(0, 16) === '1048e9b288b69b9a');
assert('(7.3) the way the request is made is as in 144bd21: the array of notes (dynamicSuffix) byte for byte, and the two lines that join it to the prompt and call the model stay side by side, untouched', T(() => {
  const a = raw.indexOf('const dynamicSuffix = ['), endMark = ".filter(Boolean).join('\\n');", b = raw.indexOf(endMark, a) + endMark.length;
  return a > 0 && b - a === 703 && sha(raw.slice(a, b)).slice(0, 16) === '43e0c9bdcd4e2ff8' && raw.split('\n').filter(l => l.trim() === 'const system = basePrompt + dynamicSuffix;').length === 1 &&
    raw.includes('      const system = basePrompt + dynamicSuffix;\n      const rawTextWithTags = await callAura([...contextRefresh, ...msgs], system);\n'); }));
assert('(7.3b) … and the final check and the write of the reply stay side by side, untouched (nothing between «displayText = _fk.content;» and the line that writes it)',
  raw.includes('displayText = _fk.content;\n      if (displayText.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText, msgMode: currentMode, ...(_methodLine ? { methodLine: true } : {}) }]);\n'));
assert('(7.4) the fixed prompt is the one of 144bd21, byte for byte (sha256 7e52268becda7360 6e92e481…), the crisis and closing prompts as before',
  sha(lit('AURA_CORE_PERSONALITY')) === '7e52268becda7360d060ac9448480616ada5a879f6c992e618d4c527977052c3' && sha(lit('SYSTEM_SUPPORTIVE')).startsWith('c7815b96d83ebae8') && sha(lit('SYSTEM_TERMINATION')).startsWith('d5a77ca926f9490b'));
assert('(7.5) api/aura.js is the file of 144bd21, byte for byte (sha256 e791b194…)', sha(api) === '675564a7985438c86f068d9e475adffcce24b43488cf1e962b1de2b7b827c077');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
