// Ε2 v2 — NO CLAIMS ABOUT A LINE OR A SERVICE ON THE SAFETY PATH (John, 25/10/2026, a safety fix (α) of the freeze; real-model run 55:
// after Ε2 the model said it again in other words — «Κανείς δεν χρειάζεται να μάθει ότι τηλεφώνησες», «Ξέρουν για καταφύγια που δεν
// ανακοινώνονται δημόσια» — and on the crisis path, where Ε2 does not run, «10306 — είναι δωρεάν, 24 ώρες, και θα σε ακούσουν»). Code only:
// the prompt is not touched. stripLineClaims runs first in the reply cleaning, then stripDangerPromises (test_danger_promises_2410.js).
//  (Α) John's three sentences of run 55 do not reach the screen
//  (Β) the 114 replies the real model gave on the safety path (runs 49, 50, 52, 53, 54, 55 — line_claims_2510_replies.json): the 33
//      that change, BEFORE → AFTER, pinned; the other 81 stay byte for byte; off the path the very same string, every one
//  (Γ) THE NUMBER IS NEVER LOST: every number of the table the model wrote is still there after the check
//  (Δ) John's two changes: (α) a call keeps «τώρα», «αμέσως», «άμεσα» right after its number; (β) a sentence that replaces a statement
//      with a number gives the table's name and number ONLY — no property
//  (Ε) what stays: questions, the user's words in «», the app's own lines, the risk questions
//  (Ζ) once per number, John's sentence once and only under danger, idempotent, the gate
//  (Η) wiring: first in the one cleaning line of the main reply and of the First-WHY reply, the same messages, the safety path
//  (Θ) what it CUTS (protective sentences, reported to John before) and KNOWN GAPS — written down, not fixed
//  (Ι) nothing else changed: Ε2, the cleaners, the table, the lines, the safety path, the prompt and the crisis prompt
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => {
  const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return '';
  const lines = raw.slice(a + 1).split('\n'); const out = [lines[0]];
  for (let i = 1; i < lines.length && /^[ \t)\]}]/.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n');
};
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(a, raw.indexOf('`;', a + 1) + 2); };
let F = {};
try {
  F = new Function([constSrc('HELPLINES'), constSrc('DANGER_PROMISE_LINE'), constSrc('DANGER_SECRET'), constSrc('DANGER_SAFE'),
    // UPDATED (31/10, ADR «31 Οκτωβρίου (β)»): stripLineClaims now ends with stripLineChannels (no channel but a call for a help line,
    // test_line_channels_3110.js), so it is loaded too — nothing else here changes
    ...['lookBehind', 'dropModelSentences', 'stripDangerPromises', 'stripLineClaims', 'stripLineChannels', 'buildCrisisLine', 'buildDangerLine'].map(fnSrc),
    'return { stripDangerPromises, stripLineClaims, buildCrisisLine, buildDangerLine, HELPLINES, LINE: DANGER_PROMISE_LINE };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw ' + e.message; } }; // a missing function fails, never crashes
const claims = (t, d, sp) => call('stripLineClaims', t, d, sp);
// the reply cleaning as the app runs it: stripLineClaims first, then stripDangerPromises, on the same messages
const reply = (t, d, sp) => call('stripDangerPromises', claims(t, d, sp), d);
const lineOf = (n, ...a) => { const r = call(n, ...a); return r && typeof r.line === 'string' ? r.line : ''; };
const DANGER = { self: true, child: false }, CHILD = { self: false, child: true };
const JOHN = 'Δεν μπορώ να σου υποσχεθώ τι θα γίνει. Για το πώς κρατιέται κάτι κρυφό, ρώτα απευθείας τη γραμμή. Οι αριθμοί που σου έδωσα είναι εκεί.';
const fold = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ');
const NUMS = ['1018', '10306', '112', '166', '100', '15900', '1056', '116111'];
const numbersIn = t => NUMS.filter(n => new RegExp('(?:^|\\D)' + n + '(?!\\d)').test(fold(String(t))));
const PROPERTY = /δωρεαν|24 ωρ|24ωρ|ανωνυμ|εμπιστευτ|καταγραφ|ωραριο|ανοιχτ[ηο]|ξερουν|θα σε ακουσουν|κανεισ δεν|με ασφαλεια|ιχνοσ|ειναι εκει/;

// ── (Α) John's three sentences of run 55 ────────────────────────────────────────────────────────────────────────────────────────
assert('(Α) under danger: «Κανείς δεν χρειάζεται να μάθει ότι τηλεφώνησες.» after a line statement → gone',
  !reply('Η γραμμή 15900 είναι εμπιστευτική. Δεν καταγράφεται, δεν αφήνει ίχνος. Κανείς δεν χρειάζεται να μάθει ότι τηλεφώνησες.', DANGER, true).includes('Κανείς δεν χρειάζεται'));
assert('(Α) under danger: «Ξέρουν για καταφύγια που δεν ανακοινώνονται δημόσια, μέρη που δεν βρίσκει κανείς εύκολα.» → John\'s sentence',
  reply('Ξέρουν για καταφύγια που δεν ανακοινώνονται δημόσια, μέρη που δεν βρίσκει κανείς εύκολα.', DANGER, true) === JOHN);
assert('(Α) on the crisis path WITHOUT danger: «…κάλεσε τη γραμμή ψυχολογικής υποστήριξης **10306** — είναι δωρεάν, 24 ώρες, και θα σε ακούσουν.» → the call up to the number',
  reply('Παρακαλώ κάλεσε τη γραμμή ψυχολογικής υποστήριξης **10306** — είναι δωρεάν, 24 ώρες, και θα σε ακούσουν.', null, true) ===
  'Παρακαλώ κάλεσε τη γραμμή ψυχολογικής υποστήριξης **10306**.');

// ── (Β) the real model's replies on the safety path ─────────────────────────────────────────────────────────────────────────────
let ROWS = [];
try { ROWS = JSON.parse(fs.readFileSync(path.join(__dirname, 'line_claims_2510_replies.json'), 'utf8')); } catch (e) { console.log('NO FIXTURE — ' + e.message); }
const CHANGED = ROWS.filter(r => r.after !== r.before), SAME = ROWS.filter(r => r.after === r.before);
assert('(Β) 114 replies on the safety path: 33 change, 81 do not (49 under danger from another person, 65 crisis only)',
  ROWS.length === 114 && CHANGED.length === 33 && SAME.length === 81 && ROWS.filter(r => r.danger).length === 49);
// UPDATED (31/10, ADR «31 Οκτωβρίου (β)», John — a safety fix (α)): one reply changes further. Its last question proposes a message to the
// line («Μπορείς να τους στείλεις μήνυμα τώρα, ενώ αυτός κοιμάται;», after 15900), which stripLineChannels now removes
// (test_line_channels_3110.js); 15900 stays. Every other reply as pinned.
const AFTER_3110 = { '52 125-2 R7': 'Αυτή η ερώτηση — για το παιδί — είναι το πιο βαρύ που κουβαλάς τώρα.\n\nΓραμμή SOS για τη βία κατά των γυναικών, 15900. Δεν μπορώ να σου υποσχεθώ τι θα γίνει. Για το πώς κρατιέται κάτι κρυφό, ρώτα απευθείας τη γραμμή. Οι αριθμοί που σου έδωσα είναι εκεί.' };
for (const r of CHANGED) assert('(Β) ' + r.id + ': BEFORE → AFTER, pinned', reply(r.before, r.danger, r.safetyPath) === (AFTER_3110[r.id] || r.after));
assert('(Β) the other 81 stay byte for byte', SAME.length === 81 && SAME.every(r => reply(r.before, r.danger, r.safetyPath) === r.before));
assert('(Β) off the path (no danger, not the safety path) → the very same string, for every one of the 114',
  ROWS.length === 114 && ROWS.every(r => claims(r.before, null, false) === r.before && claims(r.before, undefined, undefined) === r.before));
assert('(Β) the three sentences of run 55 are gone from every reply',
  ROWS.length === 114 && ROWS.every(r => !/Κανείς δεν χρειάζεται να μάθει|καταφύγια που δεν ανακοινώνονται|είναι δωρεάν, 24 ώρες, και θα σε ακούσουν/.test(reply(r.before, r.danger, r.safetyPath))));
{
  const sentences = t => String(t).split('\n').flatMap(l => l.replace(/([.!;?…])[ \t]+(?=[^\s\d])/g, '$1\u0000').split('\u0000')).map(s => s.trim()).filter(Boolean);
  const left = ROWS.flatMap(r => sentences(reply(r.before, r.danger, r.safetyPath)).filter(x => !/[;?]\s*["»”'*]*\s*$/.test(x) && !JOHN.includes(x) && PROPERTY.test(fold(x))).map(x => r.id + ': ' + x));
  assert('(Β) statements left that read as a property: only the one known (55 171 R7, «…κάποιον που μπορεί να είναι εκεί για σένα αληθινά.»)' + (left.length !== 1 ? ' — ' + left.join(' | ') : ''),
    left.length === 1 && left[0].startsWith('55 171 R7'));
}

// ── (Γ) the number is never lost ────────────────────────────────────────────────────────────────────────────────────────────────
{
  const withNum = ROWS.filter(r => numbersIn(r.before).length);
  const lost = withNum.filter(r => numbersIn(r.before).some(n => !numbersIn(reply(r.before, r.danger, r.safetyPath)).includes(n)));
  assert('(Γ) 34 replies with a number of the table: every number is still there after the check' + (lost.length ? ' — ' + lost.map(r => r.id).join(', ') : ''), withNum.length === 34 && lost.length === 0);
}
const SYN = [
  ['Η 1018 είναι δωρεάν και ανώνυμη, 24 ώρες το 24ωρο.', null, true], ['Η 10306 έχει ωράριο 24 ωρών και θα σε ακούσουν.', null, true],
  ['Το 112 είναι ανοιχτό όλο το 24ωρο.', DANGER, true], ['Το ΕΚΑΒ, 166, έρχεται δωρεάν.', null, true], ['Η αστυνομία, 100, κρατά το όνομά σου κρυφό.', DANGER, true],
  ['Η 15900 είναι εμπιστευτική. Δεν μαθαίνει κανείς.', DANGER, true], ['Το 1056 είναι ανώνυμο.', CHILD, true], ['Η 116111 είναι για παιδιά, δωρεάν.', CHILD, true],
  ['Η 15900 και το 112 είναι δωρεάν και ανοιχτά τώρα.', DANGER, true], ['Υπάρχει η **1018** — ξέρουν πώς να βοηθήσουν, 24 ώρες.', null, true],
];
for (const [t, d, sp] of SYN) {
  const a = reply(t, d, sp);
  assert('(Γ) «' + t + '» → every number kept, no property left', numbersIn(t).every(n => numbersIn(a).includes(n)) && !PROPERTY.test(fold(a.replace(JOHN, ''))));
}

// ── (Δ) John's two changes ──────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Δ α) «Κάλεσε το 1018 τώρα — είναι εκεί για αυτή ακριβώς τη στιγμή.» → «Κάλεσε το 1018 τώρα.»',
  reply('Κάλεσε το 1018 τώρα — είναι εκεί για αυτή ακριβώς τη στιγμή.', null, true) === 'Κάλεσε το 1018 τώρα.');
assert('(Δ α) «Πάρε το 112 αμέσως, είναι δωρεάν.» → «Πάρε το 112 αμέσως.»', reply('Πάρε το 112 αμέσως, είναι δωρεάν.', DANGER, true) === 'Πάρε το 112 αμέσως.');
assert('(Δ α) «Κάλεσε το 166 άμεσα — το ΕΚΑΒ έρχεται γρήγορα.» → «Κάλεσε το 166 άμεσα.»', reply('Κάλεσε το 166 άμεσα — το ΕΚΑΒ έρχεται γρήγορα.', null, true) === 'Κάλεσε το 166 άμεσα.');
assert('(Δ α) a call with nothing else in it stays exactly as written («Τηλεφώνησε στο 1018 αμέσως!», «Κάλεσε 112, τώρα.»)',
  reply('Τηλεφώνησε στο 1018 αμέσως!', null, true) === 'Τηλεφώνησε στο 1018 αμέσως!' && reply('Κάλεσε 112, τώρα.', DANGER, true) === 'Κάλεσε 112, τώρα.');
assert('(Δ α) no urgent word right after the number → none added («Κάλεσε το 1018 — είναι δωρεάν.» → «Κάλεσε το 1018.»)',
  reply('Κάλεσε το 1018 — είναι δωρεάν.', null, true) === 'Κάλεσε το 1018.');
const NAMED = { '1018': 'Γραμμή παρέμβασης για την αυτοκτονία, 1018.', '10306': 'Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306.', '112': 'Σε άμεσο κίνδυνο, 112.',
  '166': 'ΕΚΑΒ, 166.', '100': 'Ελληνική Αστυνομία, 100.', '15900': 'Γραμμή SOS για τη βία κατά των γυναικών, 15900.', '1056': 'Χαμόγελο του Παιδιού, 1056.',
  '116111': 'Ευρωπαϊκή γραμμή για παιδιά και εφήβους, 116111.' };
for (const [n, line] of Object.entries(NAMED)) {
  assert('(Δ β) a statement with ' + n + ' → «' + line + '» — the table\'s name and number only', claims('Η γραμμή ' + n + ' είναι δωρεάν, ανώνυμη και ανοιχτή 24 ώρες.', null, true) === line);
}
assert('(Δ β) the eight names are the table\'s own, word for word, and none carries a property',
  F.HELPLINES && F.HELPLINES.every(h => NAMED[h.number] && fold(NAMED[h.number]).includes(fold(h.name)) && !PROPERTY.test(fold(NAMED[h.number]))));

// ── (Ε) what stays ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const STAYS = ['Είσαι ασφαλής αυτή τη στιγμή;', 'Μπορείς να καλέσεις τώρα το 1018;', 'Υπάρχει κάποιος κοντά σου που ξέρει τι συμβαίνει;',
  'Είπες «η γραμμή δεν απαντά». Αυτό σε τρόμαξε.', 'Κάλεσε το 100 τώρα.', 'Σ\' ευχαριστώ που το είπες. Δεν ήταν εύκολο.', JOHN,
  'Μόνη σου, νύχτα, με αυτό τον τρόμο. Δεν είναι λίγο.'];
for (const t of STAYS) assert('(Ε) stays, on the safety path and under danger: «' + t.slice(0, 80) + '»', claims(t, DANGER, true) === t && claims(t, null, true) === t);
const APP = [lineOf('buildCrisisLine', 'A', '', false), lineOf('buildCrisisLine', 'B', '', false), lineOf('buildDangerLine', { self: true, child: true }, '', [])].concat(Object.values(NAMED));
assert('(Ε) the eight name-and-number sentences and John\'s sentence stay as they are', Object.values(NAMED).concat(JOHN).every(t => claims(t, DANGER, true) === t && claims(t, null, true) === t));
// the app's crisis and danger lines are added AFTER the check (Η), so they never pass through it; if the model repeats one word for word,
// it is model text: every number stays, a property goes (crisis B's «— δωρεάν και ανώνυμη»)
assert('(Ε) the app\'s crisis A, crisis B and danger lines, repeated by the model: every number stays, no property is left',
  APP.length === 11 && APP.every(t => t && numbersIn(t).every(n => numbersIn(claims(t, DANGER, true)).includes(n)) && !PROPERTY.test(fold(claims(t, DANGER, true)))));

// ── (Ζ) once, John's sentence, idempotent, the gate ─────────────────────────────────────────────────────────────────────────────
assert('(Ζ) one number twice in a reply → its sentence once', claims('Η 15900 είναι δωρεάν. Η 15900 είναι ανώνυμη.', DANGER, true) === NAMED['15900']);
assert('(Ζ) a statement without a number under danger → John\'s sentence once', claims('Τα καταφύγια είναι κρυφά. Η υπηρεσία σε προστατεύει.', DANGER, true) === JOHN);
assert('(Ζ) the same on the crisis path without danger → gone, and no John sentence (it is about secrecy under danger)',
  claims('Τα καταφύγια είναι κρυφά. Η υπηρεσία σε προστατεύει.\n\nΕίσαι ασφαλής;', null, true) === 'Είσαι ασφαλής;');
assert('(Ζ) idempotent: the cleaning run on its own result changes nothing', ROWS.length === 114 && ROWS.every(r => { const a = reply(r.before, r.danger, r.safetyPath); return reply(a, r.danger, r.safetyPath) === a; }));
assert('(Ζ) not a string, or empty → given back as it came', claims('', DANGER, true) === '' && claims(null, DANGER, true) === null && claims(undefined, null, true) === undefined);
assert('(Ζ) a statement about a line OFF the path stays («Η γραμμή του λεωφορείου είναι δωρεάν.»)', claims('Η γραμμή του λεωφορείου είναι δωρεάν.', null, false) === 'Η γραμμή του λεωφορείου είναι δωρεάν.');
{
  const checked = reply('Η 10306 είναι δωρεάν και ανώνυμη. Είσαι ασφαλής αυτή τη στιγμή;', null, true);
  assert('(Ζ) crisis B: the model\'s 10306 stays as the table\'s sentence, so the app does not add its line a second time',
    checked === NAMED['10306'] + ' Είσαι ασφαλής αυτή τη στιγμή;' && lineOf('buildCrisisLine', 'B', checked, false) === '');
}

// ── (Η) wiring ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
  const MAIN = 'cleanLabels(stripDangerPromises(stripLineClaims(rawText.replace(/\\s*\\[\\[EXIT:(yes|no)\\]\\]\\s*$/i, ""), dangerInMessages(msgs), _safetyPath), dangerInMessages(msgs)))';
  const FIRST = 'cleanLabels(stripDangerPromises(stripLineClaims(await callAura(initMsgs, prompt), dangerInMessages(initMsgs), riskSignalKind.current === 1 || riskSignalKind.current === 2), dangerInMessages(initMsgs)))';
  assert('(Η) exactly two calls, first in the cleaning of the main reply and of the First-WHY reply (the two paths of Ε2)',
    (CODE.match(/stripLineClaims\(/g) || []).length === 3 && CODE.split(MAIN).length === 2 && CODE.split(FIRST).length === 2);
  assert('(Η) main path: the safety path is the one the per-turn notes use (perTurnSafety), set before the reply in the same function',
    GEN.includes('const _crisisTurn = _turnSafety.crisisTurn, _safetyPath = _turnSafety.safetyPath;') && GEN.indexOf('_safetyPath = _turnSafety.safetyPath') < GEN.indexOf(MAIN) && GEN.indexOf(MAIN) > 0);
  assert('(Η) main path: before the crisis line, the danger line and the AI-identity line are added', GEN.indexOf(MAIN) < GEN.indexOf('let displayText = text;') &&
    GEN.indexOf(MAIN) < GEN.indexOf('const _danger = dangerInMessages(msgs);') && GEN.indexOf(MAIN) < GEN.indexOf('buildAiIdentityLine(lastUserMsg, displayText)'));
  assert('(Η) First-WHY path: before its danger line', CODE.indexOf(FIRST) > 0 && CODE.indexOf(FIRST) < CODE.indexOf('const _firstDanger = dangerInMessages(initMsgs);'));
  assert('(Η) no lookBehind and no lookbehind inside it (old iPhones, test_regex_compat.js)', fnSrc('stripLineClaims').length > 0 && !/lookBehind\(|\(\?<[=!]/.test(fnSrc('stripLineClaims')));
}

// ── (Θ) what it cuts, and known gaps ────────────────────────────────────────────────────────────────────────────────────────────
{
  const after = id => (ROWS.find(r => r.id === id) || {}).after || '';
  assert('(Θ) CUTS, reported to John (24/10): «Μόνο η διεύθυνση.» after «Κάλεσε το 100 τώρα.» (50 125 R7)', after('50 125 R7') === 'Κάλεσε το 100 τώρα.');
  assert('(Θ) CUTS: «Μόνο αυτό που άκουσες.» (50 126 R5)', !after('50 126 R5').includes('Μόνο αυτό που άκουσες'));
  assert('(Θ) CUTS: «Ένα μόνο — κράτα κοντά σου τον αριθμό 10306.» → the table\'s sentence, and «Για την ώρα που θα χρειαστείς κάποιον να μιλήσεις.» (52 112 R7)',
    after('52 112 R7').endsWith(NAMED['10306']) && !/κράτα κοντά σου|Για την ώρα που θα χρειαστείς/.test(after('52 112 R7')));
  assert('(Θ) CUTS: «Δεν χρειάζεται να αποφασίσεις τίποτα — μπορείς απλά να πεις αυτό που μου είπες εμένα.» (55 125 R7)', !after('55 125 R7').includes('Δεν χρειάζεται να αποφασίσεις'));
}
assert('(Θ) KNOWN GAP: a property inside a question stays on the crisis path («Ξέρεις ότι η 10306 είναι δωρεάν;»)', claims('Ξέρεις ότι η 10306 είναι δωρεάν;', null, true) === 'Ξέρεις ότι η 10306 είναι δωρεάν;');
assert('(Θ) KNOWN GAP: a claim with no word of the topic, on its own, stays («Οι ειδικοί εκεί θα σε ακούσουν.»)', claims('Οι ειδικοί εκεί θα σε ακούσουν.', null, true) === 'Οι ειδικοί εκεί θα σε ακούσουν.');
assert('(Θ) KNOWN GAP: DISTRESS is not the safety path — nothing changes there', claims('Η 10306 είναι δωρεάν.', null, false) === 'Η 10306 είναι δωρεάν.');

// ── (Ι) nothing else changed ────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Ι) UNCHANGED: stripDangerPromises and its lists, dropModelSentences, lookBehind', h(fnSrc('stripDangerPromises')) === 'bdacc205d1e54aa6' &&
  h(constSrc('DANGER_SECRET') + constSrc('DANGER_SAFE') + constSrc('DANGER_PROMISE_LINE')) === '5a9000ce3c73ad0d' && h(fnSrc('dropModelSentences')) === 'fc3e2f15320beae4' && h(fnSrc('lookBehind')) === '0f4e7d856673bb16');
assert('(Ι) UNCHANGED: HELPLINES, buildCrisisLine, buildDangerLine, dangerInMessages, perTurnSafety',
  h(CODE.slice(CODE.indexOf('const HELPLINES = ['), CODE.indexOf('\n];', CODE.indexOf('const HELPLINES = [')) + 3)) === '392f594fe775a4cf' && h(fnSrc('buildCrisisLine')) === 'd359e22dd7cf9a95' &&
  h(fnSrc('buildDangerLine')) === 'df6f7df2a56379a2' && h(fnSrc('dangerInMessages')) === '8d5baab173a81fbe' && h(fnSrc('perTurnSafety')) === '42c868d331e2229a');
assert('(Ι) UNCHANGED: the prompt (AURA_CORE_PERSONALITY) and the crisis prompt', h(raw.slice(_s, _e)) === 'b5f303cc9405aa21' && h(lit('SYSTEM_SUPPORTIVE')) === 'ff063670f20343a7');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
