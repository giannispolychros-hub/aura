// HELPLINES WIPED FROM THE SCREEN (final stress test before the 20, A5 and the Κ3 brake of run 48). The number filter
// (stripForeignHelplines) let through only 10306, 1018 and 112: a model sentence with 166, 100, 15900, 1056 or 116111 was removed
// whole — and with it the 112 in the same sentence. In Κ3 the model wrote «κάλεσε 166 — είναι το ΕΚΑΒ.» and the person saw nothing.
// Now there is ONE table of the help numbers a reply may show, HELPLINES, each number with its name: the app's own three named as
// buildCrisisLine names them, plus 166, 100, 15900, 1056, 116111. The filter itself is the same: an unknown number, an 8+ digit
// phone number, a foreign organisation, «Κλίμακα» beside a phone word — still removed. ΕΚΑΒ and Χαμόγελο του Παιδιού, which the
// filter used to remove as organisations, now count only beside their own number («το ΕΚΑΒ, 166» stays; «το ΕΚΑΒ» alone goes).
// Run: node auratests/test_helplines_table_2210.js
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const l = raw.slice(a + 1).split('\n'); const o = [l[0]]; for (let i = 1; i < l.length && /^[ \t\]}]/.test(l[i]); i++) o.push(l[i]); return o.join('\n'); };
let F = {};
try {
  F = new Function(['HELPLINES', 'HELP_ORGS', 'HELP_WORDS'].map(constSrc).join('\n') + '\n' +
    ['lookBehind', 'dropModelSentences', 'stripForeignHelplines', 'buildCrisisLine'].map(fnSrc).join('\n') +
    '\nreturn { stripForeignHelplines, buildCrisisLine, HELPLINES: typeof HELPLINES === "undefined" ? null : HELPLINES };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const strip = t => { try { return F.stripForeignHelplines(t); } catch (e) { return 'threw ' + e.message; } };
const stays = t => strip(t) === t;
const goes = s => strip('Σε ακούω. ' + s + '\n\nΕίμαι εδώ.') === 'Σε ακούω.\n\nΕίμαι εδώ.';

// ── 1. The table ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const H = F.HELPLINES;
assert('HELPLINES is in App.jsx: one table, each line a number and its name', Array.isArray(H) && H.every(h => /^\d{3,6}$/.test(h.number) && typeof h.name === 'string' && h.name.length > 2));
assert('the eight numbers, each once: 1018, 10306, 112 (the app\'s own) and 166, 100, 15900, 1056, 116111',
  Array.isArray(H) && H.map(h => h.number).join(' ') === '1018 10306 112 166 100 15900 1056 116111');
const A = (() => { try { return F.buildCrisisLine('A', '', false).line; } catch (e) { return ''; } })();
const B = (() => { try { return F.buildCrisisLine('B', '', false).line; } catch (e) { return ''; } })();
const name = n => (Array.isArray(H) && (H.find(h => h.number === n) || {}).name) || '?';
assert('the app\'s own three are named as the crisis lines name them: «' + name('1018') + ', 1018», «Σε ' + name('112') + ', 112», «' + name('10306') + ', 10306»',
  A.includes(name('1018') + ', 1018') && A.includes('Σε ' + name('112') + ', 112') && B.includes(name('10306') + ', 10306'));
assert('the crisis lines themselves are unchanged, word for word',
  A === 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.' && B === 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.');
assert('the new five carry their names: 166 ΕΚΑΒ, 100 Ελληνική Αστυνομία, 15900 the SOS line for violence against women, 1056 and 116111 the children\'s lines',
  /ΕΚΑΒ/.test(name('166')) && /Αστυνομία/.test(name('100')) && /SOS/.test(name('15900')) && /βία κατά των γυναικών/.test(name('15900')) &&
  /Χαμόγελο του Παιδιού/.test(name('1056')) && /παιδιά/i.test(name('116111')));
const filterSrc = fnSrc('stripForeignHelplines');
assert('one place for the numbers: the filter takes them from HELPLINES, no list of numbers of its own',
  /HELPLINES/.test(filterSrc) && !/10306|1018|112/.test(filterSrc));
assert('… and the names ΕΚΑΒ and Χαμόγελο του Παιδιού are no longer in the list of foreign organisations', !/εκαβ|χαμογελο/.test(constSrc('HELP_ORGS')));

// ── 2. What the person saw wiped, now shown whole ────────────────────────────────────────────────────────────────────────────
const K3 = 'Τηλεφώνησέ του τώρα. Αν δεν απαντήσει ή αν ανησυχήσεις, κάλεσε 166 — είναι το ΕΚΑΒ.\n\nΕίσαι σε θέση να το κάνεις αυτό;';
assert('RUN 48, Κ3 (the model\'s reply): «κάλεσε 166 — είναι το ΕΚΑΒ» stays — the whole reply, byte for byte', stays(K3));
assert('a sentence with 112 AND 166 stays whole: «Αν κινδυνεύει τώρα, κάλεσε το 112 ή το 166 (ΕΚΑΒ).»', stays('Αν κινδυνεύει τώρα, κάλεσε το 112 ή το 166 (ΕΚΑΒ).'));
assert('… and without the name: «Κάλεσε το 112 ή το 166.»', stays('Κάλεσε το 112 ή το 166.'));
const NEWLINES = ['Η γραμμή SOS για τη βία κατά των γυναικών είναι το 15900.', 'Αν κινδυνεύεις, κάλεσε το 112 ή τη γραμμή 15900.',
  'Για το παιδί, η γραμμή του Χαμόγελου του Παιδιού είναι το 1056.', 'Μπορείς να καλέσεις το 1056 (Χαμόγελο του Παιδιού).', 'Η γραμμή για παιδιά 116111 είναι δωρεάν.',
  'Η γραμμή για παιδιά 116 111 είναι δωρεάν.', 'Η Ελληνική Αστυνομία στο 100.', 'Σε άμεσο κίνδυνο, τηλεφώνησε στο 100 ή στο 112.', 'Μπορείς να τηλεφωνήσεις στο 166 για ασθενοφόρο.',
  'Υπάρχει και το ΕΚΑΒ, 166.', 'Στη γραμμή SOS 15900 μπορείς να μιλήσεις.', 'Πες μου. Υπάρχει η γραμμή 15900, δωρεάν. Τι σε φοβίζει περισσότερο;'];
const wiped = NEWLINES.filter(t => !stays(t));
assert('every line of the table, in the sentences of A5 and more, stays whole' + (wiped.length ? ' — wiped: ' + wiped.join(' | ') : ''), wiped.length === 0);
assert('the app\'s own lines stay, as before', ['Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.',
  'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.', 'Αν είσαι σε άμεσο κίνδυνο, κάλεσε το 112.', 'Μπορείς να καλέσεις το 1018 τώρα.'].every(stays));

// ── 3. The filter is the same filter ─────────────────────────────────────────────────────────────────────────────────────────
const GONE = ['Τηλέφωνο: 210 7298 980.', 'Τηλεφώνησε στο 2101234567.', 'Η Κλίμακα έχει τη γραμμή 1018.', 'Οι Σαμαρείτες απαντούν στο 8000 7773.',
  'Κάλεσε το 10306 (ΚΕΘΕΑ).', 'Στην Κύπρο: 1480.', 'Μπορείς να απευθυνθείς στο ΚΕΘΕΑ.', 'Πάρε τηλέφωνο στο 116 123.', 'Η γραμμή συναισθηματικής στήριξης 116123.',
  'Η Κλίμακα έχει γραμμή βοήθειας.', 'Στο ΟΚΑΝΑ θα βρεις βοήθεια.', 'Η γραμμή 1055 είναι για παιδιά.', 'Κάλεσε το 11611 τώρα.', 'Κάλεσε το 1661.'];
const kept = GONE.filter(s => !goes(s));
assert('unknown numbers, phone numbers and foreign organisations are still removed' + (kept.length ? ' — kept: ' + kept.join(' | ') : ''), kept.length === 0);
const NAMEONLY = ['Το ΕΚΑΒ μπορεί να βοηθήσει.', 'Υπάρχει το Χαμόγελο του Παιδιού.', 'Το Χαμόγελο του Παιδιού είναι στο 166.', 'Πάρε το ΕΚΑΒ στο 1056.', 'Το ΕΚΑΒ στο 1166.'];
const keptName = NAMEONLY.filter(s => !goes(s));
assert('ΕΚΑΒ and Χαμόγελο του Παιδιού count only beside their own number: alone, or with another line\'s number, removed as before' + (keptName.length ? ' — kept: ' + keptName.join(' | ') : ''), keptName.length === 0);
const ORDINARY = ['Έχεις 4 παιδιά, δουλεύεις 10 χρόνια και, όπως το λες, έχεις 18 μόρια.', 'Τα 1500 ευρώ τον μήνα, όπως το λες, δεν φτάνουν;',
  'Σε μια κλίμακα από το 1 ως το 10, πόσο ξεκάθαρο είναι αυτό;', 'Είσαι 41 και έχεις δάνειο 120000 ευρώ.', 'Από το 2024 το σκέφτεσαι — δύο χρόνια τώρα.'];
assert('ordinary numbers stay, as before', ORDINARY.every(stays));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
