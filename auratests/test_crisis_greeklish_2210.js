// ADR «22 Οκτωβρίου (β)» (SAFETY §0.1, John's pre-approved fix, 22/10): a crisis phrase typed in GREEKLISH, or in Greek spelled BY EAR,
// matched nothing. Checked in code before any real run: «thelo na pethano», «den antexo allo na zw», «den thelo na zo pia», «thelw na
// pethanw», «δεν θελω να ζο» — no crisis, no line, no safety mode. The fix is ADDITIVE: no phrase of the list is changed, the crisis lines
// and numbers are not changed, and everything that matched before still matches. Before the existing phrases are tried once more, Latin
// letters are read as Greek and every word is compared BY SOUND with the words of the phrases (ο = ω, ι = η = υ = ει, ε = αι, αυ = αφ,
// a double letter = a single one); any other word is a blank no phrase can match through. The tier is the tier of the Greek phrase.
// Fixtures are synthetic or generic phrases; no user text from a real session is stored.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
function extract(name) { const s = CODE.indexOf('function ' + name + '('); const e = CODE.indexOf('\n}', s) + 2; return s < 0 ? '' : CODE.slice(s, e); }
let detect = null, tier = null, line = null, capture = null;
try {
  detect = new Function(extract('detectSafetySignal') + '\nreturn detectSafetySignal;')();
  tier = new Function('detectSafetySignal', extract('classifyCrisisTier') + '\nreturn classifyCrisisTier;')(detect);
  line = new Function(extract('buildCrisisLine') + '\nreturn buildCrisisLine;')();
  capture = new Function('detectSafetySignal', extract('stageACaptureAllowed') + '\nreturn stageACaptureAllowed;')(detect);
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const D = t => { try { return detect(t); } catch (e) { return 'threw'; } };
const T = t => { try { return tier(t); } catch (e) { return 'threw'; } };
const L_A = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const L_B = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';

// ── 1. Greeklish crisis phrases: CRISIS, with the tier of the same phrase in Greek ─────────────────────────────────────────
const GREEKLISH = [ // [Greeklish, the same in Greek]
  ['thelo na pethano', 'θέλω να πεθάνω'],                                  // John's example, check 13
  ['den antexo allo na zw', 'δεν αντέχω άλλο να ζω'],                       // John's example, check 13
  ['den thelo na zo pia', 'δεν θέλω να ζω πια'], ['thelw na pethanw', 'θέλω να πεθάνω'], ['8elw na pe8anw', 'θέλω να πεθάνω'],
  ['THELO NA PETHANO', 'ΘΕΛΩ ΝΑ ΠΕΘΑΝΩ'], ['Thelo na pethano.', 'Θέλω να πεθάνω.'], ['den thelw na zw allo', 'δεν θέλω να ζω άλλο'],
  ['kapoies fores skeftomai na valo ena telos sti zoi mou', 'κάποιες φορές σκέφτομαι να βάλω ένα τέλος στη ζωή μου'],
  ['skeftomai aftoktonia', 'σκέφτομαι αυτοκτονία'], ['skeftomai autoktonia', 'σκέφτομαι αυτοκτονία'],
  ['na kanw kako ston eauto mou', 'να κάνω κακό στον εαυτό μου'], ['na min ksipniso pote', 'να μην ξυπνήσω ποτέ'], ['na mhn xypnhsw', 'να μην ξυπνήσω'],
  ['na xatho apo prosopou gis', 'να χαθώ από προσώπου γης'], ['kalytera nekros', 'καλύτερα νεκρός'], ['na teleioso me ola', 'να τελειώσω με όλα'],
  ['na teleiwsw ti zoi mou', 'να τελειώσω τη ζωή μου'], ['na exafanisto', 'να εξαφανιστώ'], ['den exo logo na zo', 'δεν έχω λόγο να ζω'],
  ['den antexo allo', 'δεν αντέχω άλλο'], ['den vlepo noima', 'δεν βλέπω νόημα'], ['den axizei pia', 'δεν αξίζει πια'],
  ['kourastika na prospatho', 'κουράστηκα να προσπαθώ'], ['kourastika na agonizome', 'κουράστηκα να αγωνίζομαι'], ['ti noima exei pia', 'τι νόημα έχει πια'],
  ['den antexo allo na zisw', 'δεν αντέχω άλλο να ζήσω'], ['den axizei pia na yparxo', 'δεν αξίζει πια να υπάρχω'],
  ['Eimai kourasmeni apo tis vardies kai den antexo allo na zw', 'Είμαι κουρασμένη από τις βάρδιες και δεν αντέχω άλλο να ζω'], // mid-session, check 13
  ['thelo na hatho', 'θέλω να χαθώ'], ['na kano kako ston eafto mu', 'να κάνω κακό στον εαυτό μου'], // h as χ, u as ου
  ['na vlapso ton eafto mou', 'να βλάψω τον εαυτό μου'], ['thelo na chatho', 'θέλω να χαθώ'],             // ps as ψ, ch as χ
];
for (const [g, e] of GREEKLISH) {
  assert('GREEKLISH «' + g + '» → CRISIS, tier ' + T(e) + ' (as «' + e + '»)', D(e) === 'CRISIS' && D(g) === 'CRISIS' && T(g) === T(e) && (T(e) === 'A' || T(e) === 'B'));
}
assert('GREEKLISH: John\'s two examples are tier A, the 1018 line', T('thelo na pethano') === 'A' && T('den antexo allo na zw') === 'A');
assert('GREEKLISH: «den antexo allo» alone is tier B — the 10306 line, as «δεν αντέχω άλλο» (not the heavier one)', T('den antexo allo') === 'B');
assert('MIXED: Greek tier B and Greeklish tier A in one message → A', T('δεν αντέχω άλλο και thelo na pethano') === 'A');

// ── 2. Greek spelled by ear (check 15): CRISIS, with the tier of the right spelling ─────────────────────────────────────────
const BY_EAR = [
  ['θελω να πεθανο', 'θέλω να πεθάνω'], ['δεν θελω να ζω πια', 'δεν θέλω να ζω πια'],   // John's examples, check 15 (already caught before)
  ['δεν θελω να ζο', 'δεν θέλω να ζω'], ['δεν θέλο να ζο', 'δεν θέλω να ζω'], ['αφτοκτονία', 'αυτοκτονία'], ['σκέφτομαι την αυτοκτωνία', 'σκέφτομαι την αυτοκτονία'],
  ['να βλάψο τον εαυτό μου', 'να βλάψω τον εαυτό μου'], ['θα ήταν καλήτερα νεκρός', 'θα ήταν καλύτερα νεκρός'], ['να τελιώσω με όλα', 'να τελειώσω με όλα'],
  ['δεν αντεχο αλο', 'δεν αντέχω άλλο'], ['δεν αντεχο αλλο να ζο', 'δεν αντέχω άλλο να ζω'], ['κουράστικα να ζω', 'κουράστηκα να ζω'],
  ['θέλω να βάλο ένα τέλος', 'θέλω να βάλω ένα τέλος'], ['ΘΕΛΟ ΝΑ ΠΕΘΆΝΟ', 'ΘΈΛΩ ΝΑ ΠΕΘΆΝΩ'],
];
for (const [m, e] of BY_EAR) assert('BY EAR «' + m + '» → CRISIS, tier ' + T(e) + ' (as «' + e + '»)', D(m) === 'CRISIS' && T(m) === T(e));

// ── 3. No false alarm: every everyday phrase reads in Greeklish exactly as in Greek ─────────────────────────────────────────
const EVERYDAY = [
  ['kalimera', 'καλημέρα'], ['ti kaneis?', 'τι κάνεις;'], ['den kserw ti na kanw', 'δεν ξέρω τι να κάνω'], ['thelo na allaxo douleia', 'θέλω να αλλάξω δουλειά'],
  ['o gios mou einai 11 kai variete ta panta', 'ο γιος μου είναι 11 και βαριέται τα πάντα'], ['den thelo na zoriso to paidi', 'δεν θέλω να ζορίσω το παιδί'],
  ['thelo na xaso kila', 'θέλω να χάσω κιλά'], ['den antexo ton proistameno mou', 'δεν αντέχω τον προϊστάμενό μου'], ['xorisa kai den antexo', 'χώρισα και δεν αντέχω'],
  ['eimai poli kourasmeni apo tis vardies', 'είμαι πολύ κουρασμένη από τις βάρδιες'], ['na teleiwsw ti douleia mou', 'να τελειώσω τη δουλειά μου'],
  ['na teleiwsw ola ta mathimata', 'να τελειώσω όλα τα μαθήματα'], ['teleiono me ti douleia stis 5', 'τελειώνω με τη δουλειά στις 5'],
  ['o pappous mou pethane perysi', 'ο παππούς μου πέθανε πέρσι'], ['thelo na kanw kati gia ton eauto mou', 'θέλω να κάνω κάτι για τον εαυτό μου'],
  ['den exw xrono gia ton eauto mou', 'δεν έχω χρόνο για τον εαυτό μου'], ['na valo taksi sta oikonomika mou', 'να βάλω τάξη στα οικονομικά μου'],
  ['thelo na valw oria', 'θέλω να βάλω όρια'], ['den vlepw to noima na epimeno', 'δεν βλέπω το νόημα να επιμένω'], ['ola kala', 'όλα καλά'], ['nai', 'ναι'],
  ['oxi', 'όχι'], ['isws', 'ίσως'], ['efxaristo poli', 'ευχαριστώ πολύ'], ['tha to skeftw', 'θα το σκεφτώ'], ['kala na eisai', 'καλά να είσαι'],
  ['me ponaei to kefali', 'με πονάει το κεφάλι'], ['den koimamai kala', 'δεν κοιμάμαι καλά'], ['zw me ton syntrofo mou', 'ζω με τον σύντροφό μου'],
  ['thelo na zo pio irema', 'θέλω να ζω πιο ήρεμα'], ['thelo na teleiwsei auto', 'θέλω να τελειώσει αυτό'], ['thelo na fygw apo ti douleia', 'θέλω να φύγω από τη δουλειά'],
  ['den axizei', 'δεν αξίζει'], ['ti noima exei', 'τι νόημα έχει'], ['kourastika na trexo', 'κουράστηκα να τρέχω'], ['na doso xrono ston eauto mou', 'να δώσω χρόνο στον εαυτό μου'],
  ['fovamai mipws xathei stis othones', 'φοβάμαι μήπως χαθεί στις οθόνες'], ['me kourazei o proistamenos', 'με κουράζει ο προϊστάμενος'],
  ['den mporo na ksekiniso', 'δεν μπορώ να ξεκινήσω'], ['xreiazomai ena dialeimma', 'χρειάζομαι ένα διάλειμμα'], ['to paidi mou den diavazei', 'το παιδί μου δεν διαβάζει'],
  ['exw xreh pou den ta exw pei', 'έχω χρέη που δεν τα έχω πει'], ['h mitera mou xreiazetai frontida', 'η μητέρα μου χρειάζεται φροντίδα'],
  ['me ena telos', 'με ένα τέλος'], ['to telos tis xronias', 'το τέλος της χρονιάς'], ['ta panta ola', 'τα πάντα όλα'], ['thelo na fygo makria', 'θέλω να φύγω μακριά'],
  ['nekrosi tis kinisis', 'νέκρωση της κίνησης'],
];
for (const [g, e] of EVERYDAY) assert('EVERYDAY «' + g + '» reads as «' + e + '»: nothing', D(e) === null && D(g) === null && T(g) === null);
// a phrase that reads BOTH ways stays caught in Greek (the founder's rule) — and reads the same in Greeklish, no more, no less
const BOTH_WAYS = [['den thelo na zo etsi', 'δεν θέλω να ζω έτσι'], ['na doso ena telos sti sxesi', 'να δώσω ένα τέλος στη σχέση'],
  ['na fygw apo ti zoi tou', 'να φύγω από τη ζωή του'], ['ena savvato na min ksipniso noris', 'ένα Σάββατο να μην ξυπνήσω νωρίς'], ['kalytera nekros para doulos', 'καλύτερα νεκρός παρά δούλος']];
for (const [g, e] of BOTH_WAYS) assert('BOTH WAYS «' + g + '» reads as «' + e + '» (caught, same tier)', D(e) === 'CRISIS' && D(g) === 'CRISIS' && T(g) === T(e));
// a word is compared WHOLE: a word that only starts like a word of a phrase is never read as it
const WHOLE = ['δεν θέλω να ζορίσω το παιδί', 'δεν θελο να ζορισο', 'θελο να πετυχο', 'να τελιοσο τη δουλεια', 'να τελιοσο ολα τα μαθιματα', 'λόγω της δουλειάς δεν έχω χρόνο',
  'έχω λόγο να είμαι θυμωμένη', 'η ζωή μου είναι γεμάτη υποχρεώσεις', 'τέλος πάντων, πάμε παρακάτω', 'δεν έχει νόημα να συνεχίσουμε τη συζήτηση', 'Δουλεύω στη Vodafone και δεν αντέχω',
  'Πέθανε η γάτα μας', 'αυτοκόλλητο', 'ζω στην Αθήνα', 'Το κινητό του είναι όλη του η ζωή', 'Έχω burnout', 'I want to change jobs', 'my son is bored with everything'];
for (const t of WHOLE) assert('NOTHING: «' + t + '»', D(t) === null);

// ── 4. ADDITIVE: the phrases, the order and the exact check are as they were; DISTRESS is untouched ─────────────────────────
{
  const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
  const f = extract('detectSafetySignal'), b = f.indexOf('  const crisis = ['), e = f.indexOf('\n  ];\n', b) + 5, d = f.indexOf('  const distress = ['), de = f.indexOf('\n  ];\n', d) + 5;
  // UPDATED (22/10, final stress test A9, auratests/test_crisis_a9.js): the new phrases are a list of their own at the end of `crisis`;
  // without them the list is the one of before, byte for byte
  const added = f.indexOf('    // FINAL STRESS TEST BEFORE THE 20 (A9');
  assert('UNCHANGED: the crisis phrase list, byte for byte (ea16fa93…), apart from the phrases of A9 at its end',
    b > 0 && added > b && added < e && h(f.slice(b, added) + f.slice(f.indexOf('\n  ];\n', b) + 1, e)) === 'ea16fa93aae344f6');
  assert('UNCHANGED: the distress list, byte for byte (64fbf2a9…)', d > 0 && h(f.slice(d, de)) === '64fbf2a953170f24');
  // UPDATED (22/10, A9 (α)): the same exact check, on the message as written and made plain («views»)
  const exact = '  if (views.some(v => crisis.some(p => new RegExp(fold(p.source), "i").test(fold(v))))) return "CRISIS";\n';
  assert('ORDER: the exact check comes first; the by-sound check comes after it and before DISTRESS',
    f.includes(exact) && f.indexOf(exact) < f.indexOf('const byEar') && f.indexOf('const byEar') < f.indexOf('if (distress.some(p => p.test(text))) return "DISTRESS";'));
  assert('SELF-CONTAINED: the by-sound check lives inside detectSafetySignal (the tests and the e2e load each function on its own)',
    !/\nfunction (sound|asGreek)\(/.test(CODE) && /const sound = w =>/.test(f));
  assert('UNCHANGED: the crisis lines and their numbers (buildCrisisLine d359e22d…)', h(extract('buildCrisisLine')) === 'd359e22dd7cf9a95');
  assert('DISTRESS is not part of this fix: «exw krisi panikou» stays nothing (DISTRESS is matched exactly, by design)', D('exw krisi panikou') === null && D('έχω κρίση πανικού') === 'DISTRESS');
  assert('ENGLISH as before', D('I want to die') === 'CRISIS' && D('I feel lost at work') === null);
  assert('NOT A STRING: as before', D('') === null && T(null) === null && T(undefined) === null);
  // the tier: the same phrases, the same lookahead — classifyCrisisTier only names its regex and hands it on
  const ct = extract('classifyCrisisTier');
  // UPDATED (22/10, A9 (α)): the tier-B phrases (plus «τα παρατάω όλα, δεν αξίζει», (β)) are blanked inside detectSafetySignal, in the
  // message as written and made plain, and the same regex goes on to the by-sound check
  assert('TIER: classifyCrisisTier names the same tier-B phrases (and A9\'s one) and asks detectSafetySignal with them; it blanks them in each form',
    ct.includes('  const tierB = /(?:δεν αντεχω αλλο|δεν βλεπω νοημα|δεν αξιζει (?:πια|πλεον)|τι νοημα εχει πια|κουραστηκα να (?:προσπαθω|αγωνιζομαι)|τα παραταω ολα') &&
    ct.includes('  return detectSafetySignal(text, tierB) === "CRISIS" ? "A" : "B";') && f.includes('(tierB ? fold(v).toLowerCase().replace(tierB, " ") : v)'));
  assert('TIER: every other caller calls detectSafetySignal with the text only (a second argument: the definition and the tier, nothing else)',
    (CODE.match(/detectSafetySignal\([^()]*,/g) || []).join(' | ') === 'detectSafetySignal(text, | detectSafetySignal(text,'); // UPDATED (22/10, A9)
}

// ── 5. The whole path: the line on the screen, and the step box (check 14) ──────────────────────────────────────────────────
assert('LINE: «thelo na pethano» → tier A → the 1018 + 112 line', line && line(T('thelo na pethano'), 'Σε ακούω. Σκέφτεσαι να βλάψεις τον εαυτό σου;', false).line === L_A);
assert('LINE: «den antexo allo» → tier B → the 10306 line, once', line && line(T('den antexo allo'), 'Σε ακούω.', false).line === L_B && line(T('den antexo allo'), 'Σε ακούω.', true).line === '');
assert('STEP BOX (check 14): a Greeklish crisis phrase typed as the step is not taken as the step — it goes to the crisis path',
  !!capture && capture('thelo na pethano') === false && capture('den antexo allo na zw') === false && capture('na mhn xypnhsw') === false);
assert('STEP BOX: a misspelled crisis phrase too', !!capture && capture('δεν θελο να ζο') === false && capture('αφτοκτονία') === false);
assert('STEP BOX: an ordinary Greeklish step is taken as the step', !!capture && capture('na milisw me ti diefthintria tin Deftera') === true && capture('na kleiso rantevou') === true);

// ── 6. Cost: a long message is read in a few milliseconds ──────────────────────────────────────────────────────────────────
{
  const long = ('eimai poli kourasmeni kai den kserw ti na kanw me ti douleia kai to paidi ' + 'Είμαι κουρασμένη, δεν ξέρω τι να κάνω. ').repeat(60);
  const t0 = Date.now(); for (let i = 0; i < 5; i++) { D(long); T(long + ' thelo na pethano'); } const ms = (Date.now() - t0) / 5;
  assert('COST: a ~5.000-character message, detector and tier, in under 50 ms (measured ' + ms.toFixed(1) + ' ms)', ms < 50 && D(long) === null && T(long + ' thelo na pethano') === 'A');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
