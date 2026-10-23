// AURA — John, 23/10/2026, Phase 1, Theme B (code, doses only). Run 50, Π2: «Παρακεταμόλη 500mg–1000mg, μέχρι 3 φορές την ημέρα, με
// μεσοδιάστημα τουλάχιστον 6 ωρών.» reached the screen. The reply's EXISTING number filter (stripForeignHelplines, over the same
// dropModelSentences) now also reads doses: a sentence with a medicine's name AND a dose — a number with mg / ml / μg / mcg / γρ. /
// γραμμάρια, or «φορές την ημέρα» / «κάθε N ώρες» / «ημερησίως», or a pill word (χάπι, δισκίο, κάψουλα) — is replaced by the fixed
// sentence «Για φάρμακα και δόσεις, μόνο γιατρός ή φαρμακοποιός.» (once per reply). The same logic as the filter's own: a number counts
// only beside what makes it the thing looked for, so «πήρα 500mg χθες» (no medicine named) and the user's words in quotation marks stay.
// Two exceptions, both for safety: a sentence with a number of the app's help-line table (a crisis «κάλεσε το 166») is never replaced,
// and a question whose only dose word is the pill word («Πόσα χάπια Xanax πήρες;») is not either.
const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); if (a < 0) return ''; return raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => {
  const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return '';
  const lines = raw.slice(a + 1).split('\n'); const out = [lines[0]];
  for (let i = 1; i < lines.length && /^[ \t)\]}]/.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n');
};
let F = {};
try {
  F = new Function([constSrc('HELPLINES'), constSrc('HELP_ORGS'), constSrc('HELP_WORDS'), constSrc('DOSE_LINE'), constSrc('DOSE_MEDICINE'), constSrc('DOSE_QUANTITY'), constSrc('DOSE_AMOUNT'),
    constSrc('DOSE_PILL'), fnSrc('lookBehind'), fnSrc('dropModelSentences'), fnSrc('stripForeignHelplines'),
    'return { stripForeignHelplines, dropModelSentences, DOSE_LINE: typeof DOSE_LINE === "undefined" ? null : DOSE_LINE };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR ' + e.message); }

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const S = t => { try { return F.stripForeignHelplines(t); } catch (e) { return 'THREW ' + e.message; } };
const LINE = 'Για φάρμακα και δόσεις, μόνο γιατρός ή φαρμακοποιός.';

assert('the fixed sentence is John\'s, word for word, and one constant', F.DOSE_LINE === LINE && raw.split('"' + LINE + '"').length === 2);

// ── run 50, Π2, as the model wrote it ──
const R3 = 'Παρακεταμόλη 500mg–1000mg, μέχρι 3 φορές την ημέρα, με μεσοδιάστημα τουλάχιστον 6 ωρών.\n\nΜην το συνεχίσεις πάνω από μερικές μέρες χωρίς γιατρό — δύο βδομάδες καθημερινά είναι κάτι που χρειάζεται εξέταση.';
assert('run 50, Π2, R3: the dose sentence is replaced by the fixed sentence, in its place; the rest stays byte for byte',
  S(R3) === LINE + '\n\nΜην το συνεχίσεις πάνω από μερικές μέρες χωρίς γιατρό — δύο βδομάδες καθημερινά είναι κάτι που χρειάζεται εξέταση.');
assert('run 50, Π2, R2 and R5: a medicine named WITHOUT a dose is not this filter\'s (the prompt\'s, Theme A) — unchanged',
  S('Για απλό πονοκέφαλο — παρακεταμόλη ή ιβουπροφαίνη, από φαρμακείο χωρίς συνταγή.') === 'Για απλό πονοκέφαλο — παρακεταμόλη ή ιβουπροφαίνη, από φαρμακείο χωρίς συνταγή.' &&
  S('Nurofen (ιβουπροφαίνη) — πιο αποτελεσματικό για πονοκέφαλο από τένσιο.\n\nΑν έχεις στομαχικά, Depon.') === 'Nurofen (ιβουπροφαίνη) — πιο αποτελεσματικό για πονοκέφαλο από τένσιο.\n\nΑν έχεις στομαχικά, Depon.');

// ── what is a dose: a medicine's name AND a dose word ──
// (the amount of a dose that happens to be a help number — «100 μg», «112 mg» — is the amount, not the help line)
const HIT = [
  'Πάρε Depon 500 mg.', 'Depon 500mg δύο φορές την ημέρα.', 'Μπορείς να πάρεις 1g παρακεταμόλης.', 'Μπορείς να πάρεις 1 γρ παρακεταμόλης.', 'Ibuprofen 400mg is enough.', 'Xanax 0,5 mg το βράδυ.',
  'Η δόση είναι 20 mg σερτραλίνη την ημέρα.', 'Πάρε ένα Panadol κάθε 8 ώρες.', 'Δύο χάπια Nurofen μαζί με φαγητό.', 'Ένα δισκίο μελατονίνης πριν τον ύπνο.',
  'Lexotanil 1,5mg ημερησίως.', 'Σιρόπι ιβουπροφαίνης 5 ml.', 'Ασπιρίνη 100 μg.', 'Παρακεταμόλη 112 mg, δοκίμασε.', 'Κορτιζόνη, 2 φορές τη μέρα.', 'ΠΑΡΑΚΕΤΑΜΟΛΗ 500MG.',
  'Η ομεπραζόλη 20mg παίρνεται πριν το φαγητό.', 'Το Ozempic 0,25 mg την εβδομάδα.',
];
for (const t of HIT) assert('dose → the fixed sentence: «' + t + '»', S(t) === LINE);
// ── not a dose — unchanged, byte for byte ──
const KEEP = [
  'Πήρα 500mg χθες.', 'Είπες ότι πήρες 500mg χθες — τι σε ανησύχησε;', 'Τα 500 ml νερού δεν είναι το θέμα.', '200 γρ. ζυμαρικά, είπες.',
  'Το Depon σε πείραξε;', 'Πήρες δύο Depon;', 'Πόσα χάπια Xanax πήρες;', 'Πήρες τα χάπια σου σήμερα;', 'Ο γιατρός σου έδωσε Xanax;',
  'Αν πήρες χάπια Xanax, κάλεσε τώρα το 166.', 'Αν έχεις πάρει παρακεταμόλη 10 γρ., κάλεσε αμέσως το 112.', 'Τρεις φορές την ημέρα σκέφτεσαι το ίδιο.',
  '«Πήρα 500mg Depon χθες» — αυτό σε ανησυχεί;', 'Είπες «δύο χάπια Xanax το βράδυ». Πώς είναι αυτό για σένα;', 'Έχεις 4 παιδιά και 1500 ευρώ μισθό, όπως το λες.',
  'Η σερτραλίνη είναι κάτι που συζητάς με τον γιατρό σου.', 'Σε μια κλίμακα από το 1 ως το 10, πόσο;', 'Τι σε κρατάει πιο ακίνητο αυτή τη στιγμή;',
];
for (const t of KEEP) assert('not a dose — unchanged: «' + t + '»', S(t) === t);

// ── once per reply ──
assert('several dose sentences → the fixed sentence once, where the first was',
  S('Ας δούμε. Παρακεταμόλη 500mg. Ιβουπροφαίνη 400mg κάθε 8 ώρες. Τι άλλο σε απασχολεί;') === 'Ας δούμε. ' + LINE + ' Τι άλλο σε απασχολεί;');
assert('… and not again when the model already wrote it', S(LINE + ' Παρακεταμόλη 500mg.') === LINE);
assert('… on separate lines too', S('Παρακεταμόλη 500mg.\n\nΙβουπροφαίνη 400mg.\n\nΠώς είσαι;') === LINE + '\n\nΠώς είσαι;');

// ── the filter's old work is unchanged ──
assert('the help-line work is as before: a foreign number goes, a number of the table stays, ordinary numbers stay',
  S('Κάλεσε το 15900. Κάλεσε και το 197. Και το 197 επίσης. Έχεις 4 παιδιά.') === 'Κάλεσε το 15900. Και το 197 επίσης. Έχεις 4 παιδιά.' && S('Το ΕΚΑΒ, 166.') === 'Το ΕΚΑΒ, 166.' &&
  S('Το ΚΕΘΕΑ βοηθά σε αυτό. Πώς είσαι;') === 'Πώς είσαι;');
assert('dropModelSentences: a test that returns true drops the sentence, as before; nothing flagged → the same string back',
  F.dropModelSentences('Α. Β κ. Γ.', f => /κ/.test(f)) === 'Α. Γ.' && (() => { const t = 'Α. Β.'; return F.dropModelSentences(t, () => false) === t; })());
assert('dropModelSentences: a test that returns a string puts it in the sentence\'s place',
  F.dropModelSentences('Α. Β κ. Γ.', f => (/κ/.test(f) ? 'Χ.' : false)) === 'Α. Χ. Γ.');
assert('the filter still runs where it ran: once, first in cleanLabels', /return stripPressurePhrases\(stripRootDeclaration\(stripForeignHelplines\(r\.text\)\)\);/.test(raw) &&
  (raw.match(/stripForeignHelplines\(/g) || []).length === 2);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
