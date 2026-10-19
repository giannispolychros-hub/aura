// ADR «19 Οκτωβρίου (θ)» (John, before the 20): at the start of a sentence of an AURA reply, «Πέστε μου» and «Πείτε μου» are SHOWN as
// «Πες μου». Only these two phrases, nothing else: real-model runs 37/40, session 41 — the plural in the first reply («Πέστε μου τι
// συμβαίνει…») twice in three runs, always with the singular right after it. Deterministic, on the screen only, no prompt change.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const PROMPT = raw.slice(cs, ce), CODE = raw.slice(0, ci) + raw.slice(ce);
function extract(name) { const s = CODE.indexOf('function ' + name + '('); const e = CODE.indexOf('\n}', s) + 2; return s < 0 ? '' : CODE.slice(s, e); }
let fn = null;
try { fn = new Function(extract('singularTellMe') + '\nreturn singularTellMe;')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const S = t => { try { return fn(t); } catch (e) { return 'threw'; } };

// ── 1. The two phrases, at the start of a sentence, become «Πες μου» ────────────────────────────────────────────────────
const CHANGE = [
  ['Πέστε μου τι συμβαίνει στη δουλειά που έχεις τώρα.', 'Πες μου τι συμβαίνει στη δουλειά που έχεις τώρα.'],   // run 40, session 41, word for word
  ['Πέστε μου λίγο παραπάνω — τι σε κάνει να το σκέφτεσαι τώρα;', 'Πες μου λίγο παραπάνω — τι σε κάνει να το σκέφτεσαι τώρα;'], // run 36, 17
  ['Πείτε μου τι γίνεται.', 'Πες μου τι γίνεται.'],
  ['Δύο χρόνια. Πέστε μου τι άλλαξε.', 'Δύο χρόνια. Πες μου τι άλλαξε.'],
  ['Το ακούω.\nΠείτε μου πότε ξεκίνησε;', 'Το ακούω.\nΠες μου πότε ξεκίνησε;'],
  ['Τι έγινε; Πέστε μου.', 'Τι έγινε; Πες μου.'],
  ['Πέστε μου, τι σε κρατάει;', 'Πες μου, τι σε κρατάει;'],
];
for (const [a, b] of CHANGE) assert('CHANGED: «' + a.slice(0, 50) + '» → «' + b.slice(0, 50) + '»', S(a) === b);

// ── 2. Nothing else changes ──────────────────────────────────────────────────────────────────────────────────────────────
const SAME = [
  'Αν θέλεις, πέστε μου τι γίνεται.',                         // inside a sentence, lower case
  'Αν θέλεις, Πέστε μου τι γίνεται.',                         // inside a sentence, capital
  '«Πέστε μου τι να κάνω» — αυτό ζήτησες;',                    // the user's own words, in quotation marks
  '"Πείτε μου" έγραψες. Τι εννοείς;',
  'Πέστε το μου πιο απλά.', 'Πείτε μας τι έγινε.', 'Πέστε μουσική.', 'Πέστε.', 'Πείτε κάτι.',
  'Πες μου τι συμβαίνει.', 'Πώς είστε; Τι νιώθετε;', 'Τι λεφτά εννοείς — κάτι που της κρύβεις ή κάτι που δεν έχετε μιλήσει ακόμα;',
  'Πέντε μήνες έτσι.\n\nΤι άλλαξε τον Σεπτέμβριο — ξέρεις αν έγινε κάτι;',
  'Το κοστούμι που δεν έκλεινε. Τι ένιωσες εκείνη τη στιγμή;', '', 'Ευχαριστώ που το μοιράστηκες. Να είσαι καλά.',
];
for (const t of SAME) assert('UNCHANGED: «' + t.slice(0, 50) + '»', S(t) === t);
assert('UNCHANGED: a non-string passes through', S(null) === null && S(undefined) === undefined);

// ── 3. A crisis reply: only these two phrases, nothing else — the line, the numbers, the risk question stay byte for byte ──────
const L_A = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const L_B = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';
const CR = [ // run 41, sessions 17 and 20, word for word
  'Αυτό που είπες είναι σημαντικό και θέλω να το ακούσω σωστά.\n\nΌταν λες ότι θέλεις να κοιμηθείς και να μην ξυπνήσεις — σκέφτεσαι να βλάψεις τον εαυτό σου;\n\nΔεν ρωτάω για να κρίνω. Ρωτάω γιατί νοιάζομαι για το τι περνάς αυτή τη στιγμή.\n\n' + L_A,
  'Αυτό που είπες — να κοιμηθείς και να μην ξυπνήσεις — το ακούω σοβαρά.\n\nΘέλω να σε ρωτήσω απευθείας: σκέφτεσαι να βλάψεις τον εαυτό σου;\n\nΕίμαι εδώ. Δεν πάω πουθενά.\n\n' + L_A,
  'Είμαι εδώ.\n\nΌταν λες «δεν αντέχω άλλο», εννοείς ότι είσαι εξαντλημένος/η, ή υπάρχει κάτι πιο βαρύ από αυτό;\n\n' + L_B,
];
for (const t of CR) assert('CRISIS, UNCHANGED: «' + t.slice(0, 50).replace(/\n/g, ' ') + '…»', S(t) === t);
const CRP = 'Πέστε μου τι γίνεται τώρα. Σκέφτεσαι να βλάψεις τον εαυτό σου;\n\n' + L_A;
assert('CRISIS: «Πέστε μου» at the start becomes «Πες μου» — and every other character stays (the risk question, 1018, 112)',
  S(CRP) === 'Πες μου τι γίνεται τώρα. Σκέφτεσαι να βλάψεις τον εαυτό σου;\n\n' + L_A && S(CRP).endsWith(L_A) &&
  S(CRP).slice('Πες μου'.length) === CRP.slice('Πέστε μου'.length));
assert('CRISIS: the app\'s crisis lines themselves are untouched', S(L_A) === L_A && S(L_B) === L_B);

// ── 4. Where: only on the screen, in the AURA bubble — never the history sent to the model, never the user's bubble ───────────
{
  const mb = CODE.slice(CODE.indexOf('const MessageBubble = memo(function MessageBubble('), CODE.indexOf('const MessageBubble = memo(function MessageBubble(') + 9000);
  assert('WIRING: the bubble shows AURA\'s text through it, the user\'s text untouched',
    /const shownContent = isUser \? displayContent : singularTellMe\(displayContent\);/.test(mb) && /\{shownContent\.split\("\\n"\)\.map\(\(line, j, arr\) => \(/.test(mb) &&
    !/\{displayContent\.split\("\\n"\)/.test(mb));
  assert('WIRING: called in ONE place only — not in the reply pipeline, so the history sent to the model keeps what the model wrote',
    (CODE.match(/singularTellMe\(/g) || []).length === 2);
  assert('WIRING: the display expression the old tests evaluate is unchanged',
    CODE.includes(': (isUser ? msg.content : replaceBareGoodbye(msg.content)));') && CODE.includes('const displayContent = dropQuoteOnlyLines(roadMap'));
}

// ── 5. Unchanged: the prompt, the detectors, the crisis lines ─────────────────────────────────────────────────────────────
{
  const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
  assert('UNCHANGED: the prompt (e1e56e0c…, as in 339d14a)', h(PROMPT) === 'e1e56e0c962656b0' && !PROMPT.includes('singularTellMe'));
  assert('UNCHANGED: buildCrisisLine, detectSafetySignal, classifyCrisisTier, replaceBareGoodbye',
    h(extract('buildCrisisLine')) === 'd359e22dd7cf9a95' && h(extract('detectSafetySignal')) === 'dfaf34c6e1e44e6b' &&
    h(extract('classifyCrisisTier')) === 'f724a0db0c1a5bf9' && h(extract('replaceBareGoodbye')) === 'e6351d2cb8e28ab5');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
