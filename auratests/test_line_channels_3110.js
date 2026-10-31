// AURA — NO CHANNEL OTHER THAN A CALL FOR A HELP LINE, ON THE SAFETY PATH (John, 31/10/2026, a safety fix (α), Constitution §0.1).
// What was seen (real model, run 57, session 125, after Ε2 v2): on the screen, «Ένα μόνο: μπορείς να στείλεις SMS στο 15900 αν δεν
// μπορείς να μιλήσεις φωναχτά;», «Μπορείς να τους στείλεις SMS τώρα, χωρίς να μιλήσεις;», «Ένα SMS, τώρα.» — Ε2 v2 keeps questions, and
// the last one is not a statement about a line. The help-line table holds a name and a number only, no channel but a call.
// The change, code only: on the safety path or under danger from another person (the very gate of stripLineClaims), a sentence of the
// MODEL's text — a question or a prompt too — that proposes or implies a channel other than a call (SMS, chat, e-mail, «ηλεκτρονικό
// ταχυδρομείο», a message sent / written / accepted, writing to the number) for a number of the table — the number in the sentence, or
// in an earlier sentence of the same reply — is not shown. The number is never lost: if it was only there, the app's sentence with the
// table's name and number takes its place, no property. The user's words in «» are not read. Off the path: the very same string.
//  (Α) run 57's three sentences and variants   (Β) what stays   (Γ) the number is never lost   (Δ) the wiring   (Ε) the rest
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => {
  const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return '';
  const lines = raw.slice(a + 1).split('\n'); const out = [lines[0]];
  for (let i = 1; i < lines.length && /^[ \t)\]}]/.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n');
};
const NAMES = ['lookBehind', 'dropModelSentences', 'stripDangerPromises', 'stripLineClaims', 'stripLineChannels'];
let F = {};
try {
  F = new Function([constSrc('HELPLINES'), constSrc('DANGER_PROMISE_LINE'), constSrc('DANGER_SECRET'), constSrc('DANGER_SAFE'),
    ...NAMES.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + NAMES.join(', ') + ', HELPLINES };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw ' + e.message; } };
// the reply cleaning as the app runs it: stripLineClaims (which now ends with stripLineChannels), then stripDangerPromises
const reply = (t, d, sp) => call('stripDangerPromises', call('stripLineClaims', t, d, sp), d);
const ch = (t, d, sp) => call('stripLineChannels', t, d, sp);
const DANGER = { self: true, child: false };
const L15900 = 'Γραμμή SOS για τη βία κατά των γυναικών, 15900.';
const nums = t => (String(t).match(/(?:^|\D)(112|100|166|1018|10306|15900|1056|116111)(?!\d)/g) || []).map(x => x.replace(/\D/g, ''));

// ── (Α) run 57, session 125: the three sentences, through the whole reply cleaning ────────────────────────────────────────────────
assert('(Α) R4: «Ένα μόνο: μπορείς να στείλεις SMS στο 15900 …;» goes — and 15900 stays, as the app\'s sentence (name and number)',
  reply('Εντάξει. Μην κάνεις τίποτα που σε φέρνει σε κίνδυνο.\n\nΈνα μόνο: μπορείς να στείλεις SMS στο 15900 αν δεν μπορείς να μιλήσεις φωναχτά;', DANGER, true)
  === 'Εντάξει. Μην κάνεις τίποτα που σε φέρνει σε κίνδυνο.\n\n' + L15900);
assert('(Α) R6: «Μπορείς να τους στείλεις SMS τώρα, χωρίς να μιλήσεις;» after a sentence with 15900 goes',
  reply('Αυτός ο φόβος έχει νόημα.\n\nΗ γραμμή 15900 ξέρει ακριβώς αυτή την κατάσταση — γυναίκες που φοβούνται να βρεθούν. Έχουν τρόπους που εσύ και εγώ δεν ξέρουμε.\n\nΜπορείς να τους στείλεις SMS τώρα, χωρίς να μιλήσεις;', DANGER, true)
  === 'Αυτός ο φόβος έχει νόημα.\n\n' + L15900);
assert('(Α) R7: «Ένα SMS, τώρα.» after 15900 goes',
  reply('Ο γιος σου είναι αυτό που σε κρατάει όρθια.\n\nΑυτή ακριβώς η ερώτηση — τι γίνεται με αυτόν — είναι κάτι που η γραμμή 15900 έχει απαντήσει πολλές φορές. Ξέρουν τι γίνεται με τα παιδιά. Ξέρουν πώς κρύβεσαι.\n\nΈνα SMS, τώρα.', DANGER, true)
  === 'Ο γιος σου είναι αυτό που σε κρατάει όρθια.\n\n' + L15900);
// variants, the channel function alone (each with the number in the reply)
const pre = 'Σε ακούω. ' + L15900 + '\n\n';
for (const v of ['Ένα sms, τώρα.', 'Στείλε ένα SMS εκεί, τώρα.', 'Στείλε τους μήνυμα τώρα.', 'Μπορείς να τους γράψεις εκεί, αν δεν μπορείς να μιλήσεις;',
  'Δέχονται και μηνύματα.', 'Υπάρχει και chat, αν σε βοηθά.', 'Μπορείς να τους στείλεις email;', 'Γράψε τους ένα e-mail απόψε.',
  'Υπάρχει και ηλεκτρονικό ταχυδρομείο.', 'Μπορείς να στείλεις ένα μέιλ;', 'ΕΝΑ SMS ΤΩΡΑ.', 'Ένα μήνυμα μόνο, χωρίς φωνή, εκεί.']) {
  assert('(Α) after the number, a channel sentence goes: «' + v + '»', ch(pre + v, DANGER, true) === pre.trim());
}
for (const [v, n] of [['Στείλε μήνυμα στο 15900.', '15900'], ['Το 15900 δέχεται και μηνύματα.', '15900'], ['Μπορείς να γράψεις στο 15900 αντί να μιλήσεις;', '15900'],
  ['Υπάρχει και chat στο 15900;', '15900'], ['Στείλε email στο 15900.', '15900'], ['Στείλε SMS στο 112 αν δεν μπορείς να μιλήσεις.', '112']]) {
  const out = ch('Σε ακούω.\n\n' + v, DANGER, true);
  assert('(Α) a channel sentence with the number goes, and the number comes back as the app\'s sentence: «' + v + '»', !/sms|μήνυμ|email|chat|γράψ/i.test(out) && nums(out).includes(n));
}
assert('(Α) the crisis path too (no danger): «Στείλε SMS στο 1018.» → the 1018 sentence of the table',
  (() => { const o = ch('Είμαι εδώ.\n\nΣτείλε SMS στο 1018.', null, true); return !/SMS/.test(o) && nums(o).includes('1018'); })());

assert('(Α) the number later in the same reply counts too (run 56, 125 R6): «Μπορείς να γράψεις αντί να μιλήσεις.» before «Το 15900 δέχεται και μήνυμα.»',
  (() => { const o = reply('Μπορείς να γράψεις αντί να μιλήσεις.\n\nΤο 15900 δέχεται και μήνυμα. Σιωπηλά, από εδώ που είσαι.', DANGER, true); return !/γράψεις|μήνυμα/.test(o) && nums(o).includes('15900'); })());
assert('(Α) under danger, a channel sentence that promises secrecy («σιωπηλά») is left to John\'s rule: his sentence comes, the SMS does not (run 57, 125 R5)',
  (() => { const o = reply('Το ξέρω. Αυτός ο φόβος είναι αληθινός.\n\nΗ γραμμή 15900 έχει ανθρώπους που ξέρουν ακριβώς αυτή την κατάσταση — και ξέρουν τρόπους να φύγεις με ασφάλεια, ώστε να μην σε βρει. Αυτή είναι η δουλειά τους.\n\nΜπορείς να τους στείλεις SMS τώρα, σιωπηλά;', DANGER, true);
    return !/SMS/.test(o) && o.includes('Δεν μπορώ να σου υποσχεθώ τι θα γίνει.') && nums(o).includes('15900'); })());

// ── (Β) what stays ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const sameAs = (t, d, sp) => ch(t, d, sp) === t;
assert('(Β) off the path, no danger: the very same string (even with SMS and a number)', sameAs('Στείλε SMS στο 15900 τώρα. Ένα SMS, τώρα.', null, false));
for (const v of ['Μπορείς να στείλεις μήνυμα σε κάποιον που εμπιστεύεσαι;', 'Σου έστειλε μήνυμα ότι θα σε βρει;', 'Γράψε μου πώς νιώθεις.',
  'Τι σου έγραψε στο μήνυμα;', 'Κάλεσε το 15900 τώρα.', 'Το μήνυμα που μου γράφεις είναι σημαντικό.', 'Σου στέλνει μηνύματα κάθε βράδυ;',
  'Πάρε τον τηλέφωνο τώρα — όχι μήνυμα, φωνή.'])
  assert('(Β) on the path, with 15900 before it, stays — no channel for the line: «' + v + '»', sameAs(pre + v, DANGER, true));
for (const v of ['Ένα SMS σε κάποιον δικό σου, τώρα.', 'Στείλε μήνυμα στην αδερφή σου.'])
  assert('(Β) on the path, a reply with no number of the table: stays (no line to point at): «' + v + '»', sameAs('Σε ακούω.\n\n' + v, DANGER, true));
assert('(Β) the user\'s words in «» are not read', sameAs(pre + 'Γράφεις «θα του στείλω SMS απόψε».', DANGER, true));
assert('(Β) nothing to cut → the very same string, on the path too', sameAs('Σε ακούω.\n\nΕίσαι ασφαλής τώρα;', DANGER, true));
assert('(Β) not a string → as given', call('stripLineChannels', undefined, DANGER, true) === undefined && call('stripLineChannels', '', DANGER, true) === '');

// ── (Γ) the number is never lost ───────────────────────────────────────────────────────────────────────────────────────────────────
const cases = ['Μπορείς να στείλεις SMS στο 15900;', 'Στείλε μήνυμα στο 15900 ή κάλεσε το 112.', 'Υπάρχει και chat στο 10306, ή κάλεσε το 1018.',
  pre + 'Ένα SMS, τώρα.', 'Σε ακούω. Στείλε SMS στο 15900. Στείλε SMS στο 15900 ξανά.'];
for (const c of cases) {
  const o = ch(c, DANGER, true);
  assert('(Γ) every number of the table that was there is still there: «' + c.replace(/\n/g, ' ') + '»', nums(c).every(n => nums(o).includes(n)));
}
assert('(Γ) a number given back once, not twice', (ch('Σε ακούω. Στείλε SMS στο 15900. Στείλε SMS στο 15900 ξανά.', DANGER, true).match(/15900/g) || []).length === 1);

// ── (Δ) the wiring ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const slc = fnSrc('stripLineClaims');
assert('(Δ) stripLineClaims ends with the channel rule on both of its outcomes (nothing changed, or its own changes)',
  /if \(!hit\) return stripLineChannels\(text, danger, safetyPath\);/.test(slc) && /return stripLineChannels\(lines\.filter\(l => l !== null\)/.test(slc));
assert('(Δ) the channel rule has the gate of stripLineClaims (the safety path or danger from another person)',
  /if \(\(!danger && safetyPath !== true\) \|\| typeof text !== "string" \|\| !text\) return text;/.test(fnSrc('stripLineChannels')));
assert('(Δ) read only there (no other call)', (CODE.split('stripLineChannels(').length - 1) === 3);
assert('(Δ) the call chain in generateResponse and the first reply is unchanged (stripLineClaims is still called the same way)',
  (CODE.match(/stripLineClaims\(/g) || []).length === 3);
assert('(Δ) no lookbehind in it (old iPhones)', fnSrc('stripLineChannels').length > 0 && !/\(\?<[=!]/.test(fnSrc('stripLineChannels')));

// ── (Ε) the rest ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
assert('(Ε) the prompt (AURA_CORE_PERSONALITY) is unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21');
let gen = ''; try { gen = cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { encoding: 'utf8' }); } catch (e) { gen = String(e.stdout || ''); }
assert('(Ε) the prompt fingerprints in api/aura.js are up to date', /up to date/.test(gen));
assert('(Ε) the help-line table is unchanged (a name and a number, nothing else)', h(constSrc('HELPLINES')) === '392f594fe775a4cf');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
