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
try { fn = new Function(extract('lookBehind') + '\n' + extract('singularTellMe') + '\nreturn singularTellMe;')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); } // UPDATED (22/10, old iPhones, Γ3): + lookBehind — the functions here look back through it (no lookbehind regex)
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
  // UPDATED (22/10, ADR «22 Οκτωβρίου»): John's voice edit (the example without a number, the prediction rule) — e1e56e0c… → b5f303cc…;
  // «Πες μου» itself is still display-only and never in the prompt
// UPDATED (23/10, Π3, branch p3-prompt — John): the precedence clauses in lines 35, 37, 39, 40, 41, 42, the organisation names out of
// those lines, the examples 35β / 37β, and (β) the ΦΩΝΗ (4) example in a form with no gender. Undone first — each piece must be there exactly as many times as it was put in — so what is
// left must be the prompt before Π3 byte for byte.
const P3_LONG = 'PRECEDENCE (this rule yields; nothing is added to it): SAFETY (MASTER PRIORITY RULE, step 1) comes first; then the content limit — no facts about law, money or health, and no technique for health, mental health, sleep or food (what a law, a court, a tax, a loan, a treatment or a dose does is not said; saying plainly that this is a question for a lawyer, an accountant or a doctor IS allowed; an organisation is named only if the user wrote its name; a help line only from the app\'s own table, never another number or name); then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. Where any of these conflicts with this rule, it wins and this rule does not apply. ';
const P3_SHORT = 'PRECEDENCE (as in PROACTIVE RESOURCE POINTER above — this rule yields): SAFETY, then the content limit (no facts about law, money or health; the kind of professional may be named; an organisation only if the user wrote its name; a help line only from the app\'s own table), then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. ';
const P3_TEXT = [
  ['before AURA mentioned that free smoking-cessation clinics exist;', 'before AURA mentioned that free ΕΣΥ smoking-cessation clinics exist;'],
  ["a founder didn't know one-time-payment platforms existed as a category", "a founder didn't know one-time-payment platforms like Gumroad existed as a category"],
  ['(e.g. "δωρεάν ιατρεία διακοπής καπνίσματος")', '(e.g. "σταδιακή μείωση, απότομη διακοπή, υποκατάστατα, ιατρεία διακοπής, φαρμακευτική υποστήριξη" or "δωρεάν ιατρεία διακοπής καπνίσματος στο ΕΣΥ")'],
  ['Example: "Πόσο κρατάει συνήθως ένα μεταπτυχιακό;" → answer it.', 'Example: "Πόσο κοστίζει περίπου ένα ταξίδι στην Ιαπωνία;" → answer it.'],
  ['naming the kind of professional who knows this, categorically, is not deciding anything', 'naming that ΕΣΠΑ and ΔΥΠΑ exist, categorically, is not deciding anything'],
  ['after being told two organisations exist): Name the kind of professional who knows it (e.g. "δικηγόρος", "λογιστής", "γιατρός"); an organisation only if the user wrote its name.',
    'after being told ΕΣΠΑ/ΔΥΠΑ exist): naming the specific OFFICIAL ORGANIZATION (e.g. "ΔΥΠΑ", "δες dypa.gov.gr") is safe and sufficient — organization names don\'t go stale.'],
  ['When a source is asked for or genuinely essential, name the kind of professional plainly,', 'When a source is asked for or genuinely essential, name the organization plainly,'],
  ['(e.g. όταν ο χρήστης γράφει "τα κουβαλάω όλα εγώ εδώ και καιρό": «Όλα σε σένα, εδώ και καιρό. Δεν είναι λίγο.»)', '(e.g. όταν ο χρήστης γράφει "τα κουβαλάω μόνη μου εδώ και καιρό": «Μόνη σου, εδώ και καιρό. Δεν είναι λίγο.»)']];
// UPDATED (24/10, Π3, tests only): the six clauses of (α) are taken out by their place, each exactly once, not by a count over the whole
// prompt — so a later Π3 edit can add a clause of its own. A clause left anywhere else still fails the comparison below.
const P3_CLAUSES = [['it should not take user frustration to say this): ', P3_LONG], ['a real mistake caught and corrected here): ', P3_SHORT],
  ['territory below, not this one): ', P3_SHORT], ['a shift in conversation priority): ', P3_SHORT], ['however revealing): ', P3_SHORT],
  ['two organisations exist): ', P3_SHORT]];
// Each later Π3 commit puts its own undo pairs in its own slot below (unshift: the newest edit is undone first), so that each commit
// can be reverted on its own.
// Π3 (γ):
// Π3 (δ):
// Π3 (ε):
// Π3 (στ):
const undoP3 = p => P3_TEXT.reduce((x, [now, before]) => (x.split(now).length === 2 ? x.replace(now, before) : 'MISSING ' + now),
  P3_CLAUSES.reduce((x, [at, cl]) => (x.split(at + cl).length === 2 ? x.replace(at + cl, at) : 'MISSING the clause after ' + at), String(p || '')));
  assert('UNCHANGED by «Πες μου»: the prompt (b5f303cc…, John\'s voice edit of 22/10; Π3 undone first)', h(undoP3(PROMPT)) === 'b5f303cc9405aa21' && !PROMPT.includes('singularTellMe'));
  // UPDATED (22/10, ADR «22 Οκτωβρίου (β)», SAFETY): detectSafetySignal and classifyCrisisTier changed on purpose — Greeklish and spelling by
  // ear, additive; the phrase list, the crisis lines and the numbers are unchanged (pinned in test_crisis_greeklish_2210.js).
  assert('UNCHANGED: buildCrisisLine, detectSafetySignal, classifyCrisisTier, replaceBareGoodbye',
    h(extract('buildCrisisLine')) === 'd359e22dd7cf9a95' && h(extract('detectSafetySignal')) === 'b8513b1d0d52a148' /* UPDATED (22/10, final stress test A9): the message is also tried made plain, new phrases and a third person; tier B blanked inside — auratests/test_crisis_a9.js */ &&
    h(extract('classifyCrisisTier')) === 'afa5cf7a370bb0d5' && h(extract('replaceBareGoodbye')) === 'e6351d2cb8e28ab5');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
