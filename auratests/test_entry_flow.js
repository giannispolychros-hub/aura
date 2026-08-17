// AURA — ENTRY FLOW GUARD
//
// Γιατί υπάρχει: το ίδιο bug εμφανίστηκε ΤΡΕΙΣ φορές — ο χρήστης πατούσε πύλη, απαντούσε για
// τον χρόνο, και μετά η AURA ξαναρωτούσε «τι σε φέρνει εδώ» με λίστα επιλογών. Κάθε φορά
// διορθωνόταν και κάθε φορά επέστρεφε από άλλο σημείο: πρώτα από το UI, μετά από ξεχωριστή
// οθόνη με άλλη διατύπωση («τι σε έφερε»), μετά από το prompt που είχε τις πύλες γραμμένες
// αυτούσια δίπλα στην απαγόρευση χρήσης τους.
//
// Κανένα από αυτά δεν έπιανε test. Αυτό το αρχείο είναι ο φρουρός.
// Αν πέσει, κάποια αλλαγή ξανάφερε διπλή είσοδο.

const _p = require('path'), _f = require('fs');
let raw = null;
for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
  const x = _p.join(__dirname, c);
  if (_f.existsSync(x)) { raw = _f.readFileSync(x, 'utf8'); break; }
}
if (!raw) throw new Error('App.jsx not found. Put these files next to App.jsx, or in a tests/ folder beside src/');

const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const PROMPT = raw.slice(_s, raw.indexOf('`;', _s));
const CODE = raw.slice(0, _i) + raw.slice(raw.indexOf('`;', _s));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// Αγνοεί τα σημεία που ΑΠΑΓΟΡΕΥΟΥΝ — μας νοιάζει μόνο αν ΖΗΤΑΕΙ
function asksIt(text, pattern) {
  const re = new RegExp(pattern, 'gi');
  let m;
  while ((m = re.exec(text)) !== null) {
    const around = text.slice(Math.max(0, m.index - 200), m.index + 160);
    if (/do not ask|never ask|NEVER ASK|do not offer|already answered|removed|ΑΦΑΙΡΕΘΗΚΕ/i.test(around)) continue;
    return true;
  }
  return false;
}

// 1 — Μία μόνο οθόνη πριν το chat
const screens = (CODE.match(/className="intro-screen"/g) || []).length;
assert('Ακριβώς μία οθόνη εισόδου (βρέθηκαν ' + screens + ')', screens === 1);

// 2 — Το prompt δεν ζητά την ερώτηση εισόδου, σε καμία διατύπωση
assert('Prompt: δεν ζητά «τι σε φέρνει»', !asksIt(PROMPT, 'τι σε φέρνει'));
assert('Prompt: δεν ζητά «τι σε έφερε»', !asksIt(PROMPT, 'τι σε έφερε'));
assert('Prompt: δεν ζητά «what brings you»', !asksIt(PROMPT, 'what brings you'));

// 3 — Καμία έτοιμη λίστα πυλών στο prompt (αυτό ήταν η αιτία της 3ης εμφάνισης:
//     το μοντέλο πιάνει ό,τι είναι γραμμένο, όχι την αφηρημένη απαγόρευση δίπλα)
assert('Prompt: καμία έτοιμη διατύπωση πύλης', !asksIt(PROMPT, 'μια απόφαση που δεν έχει ξεκαθαρίσει'));
assert('Prompt: καμία «κάτι που σε αγχώνει»', !asksIt(PROMPT, 'κάτι που σε αγχώνει'));
assert('Prompt: καμία «επέστρεψε στο μυαλό σου»', !asksIt(PROMPT, 'επέστρεψε στο μυαλό σου'));

// 4 — Οι πύλες υπάρχουν ΜΟΝΟ στο UI, και είναι πέντε
const doorBlock = CODE.match(/\["Κάτι που επιστρέφει[^\]]+\]/);
assert('UI: το μπλοκ πυλών υπάρχει', !!doorBlock);
if (doorBlock) {
  const count = (doorBlock[0].match(/","/g) || []).length + 1;
  assert('UI: πέντε πύλες (βρέθηκαν ' + count + ')', count === 5);
}
assert('UI: πύλες μέσα σε conditional (δεν μένουν στην οθόνη χρόνου)', CODE.includes('entryDoor === null ? (<>'));

// 5 — Η ερώτηση χρόνου υπάρχει και είναι ξεχωριστό βήμα
assert('UI: ερώτηση χρόνου υπάρχει', CODE.includes('Πόσο χρόνο έχεις'));
assert('UI: τρεις επιλογές χρόνου', CODE.includes('"Αρκετό","Λίγο"'));

// 6 — Η επιλογή φτάνει στο μοντέλο σε ΚΑΘΕ διαδρομή prompt
assert('buildEntryContext ορίζεται μία φορά', (CODE.match(/function buildEntryContext/g) || []).length === 1);
const calls = (CODE.match(/buildEntryContext\(/g) || []).length - 1;
assert('Καλείται σε 2+ διαδρομές (βρέθηκαν ' + calls + ')', calls >= 2);
assert('entryDoorCtx στο dynamicSuffix', /dynamicSuffix\s*=\s*\[[^\]]*entryDoorCtx/s.test(CODE));

// 7 — Το demo δεν μπορεί να ξανανοίξει
assert('showDemo μόνιμα false', /const showDemo = false/.test(CODE));
assert('Κανένα κουμπί δεν θέτει demo', !/setIntroChoice\("demo"\)/.test(CODE));

// 8 — Η οθόνη «Γνώθι σαυτόν» δεν επέστρεψε
assert('Καμία οθόνη «Γνώθι σαυτόν»', !/>\s*Γνώθι/.test(CODE));

// 9 — CONTRACT ως single source of truth (red-team Κενό 1): οι έξι εφαρμογές πρέπει να
//     παραμένουν ονομασμένες ΜΕΣΑ στο CONTRACT. Αν κάποια αποσπαστεί και ξαναδιατυπωθεί
//     αυτόνομα, ξαναγίνονται έξι άσχετοι κανόνες — που ήταν ακριβώς το αρχικό πρόβλημα.
const ci = PROMPT.indexOf('CONTRACT (governing principle');
const contractBlock = ci >= 0 ? PROMPT.slice(ci, ci + 6000) : '';
assert('CONTRACT υπάρχει ως governing principle', ci >= 0);
assert('Η αρχή ονομάζεται ΜΕΣΑ στο CONTRACT', contractBlock.includes('DETECT THE CHANGE, NEVER MANUFACTURE IT'));
for (const [name, key] of [
  ['τρίμπητο', 'fabricate one'],
  ['FAILURE H', 'FAILURE H GUARD'],
  ['ΦΕΥΓΕΙΣ ΜΕ', 'their formulation'],
  ['δρόμοι', 'manufactured for symmetry'],
  ['nothing missing', 'nothing significant is missing'],
  ['movement', 'COGNITIVE MOVEMENT PRINCIPLE'],
]) {
  assert('CONTRACT ονομάζει την εφαρμογή: ' + name, contractBlock.toLowerCase().includes(key.toLowerCase()));
}

// 10 — Collision logger: παθητικός, δεν γράφει πουθενά, δεν αλλάζει συμπεριφορά
assert('Collision logger υπάρχει', CODE.includes('[AURA collision]'));
assert('Logger είναι παθητικός (μόνο console)', !/\[AURA collision\][\s\S]{0,400}(setItem|setState|\.current\s*=)/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.log('\n⚠ Η ΕΙΣΟΔΟΣ ΕΣΠΑΣΕ. Το ίδιο bug είχε εμφανιστεί τρεις φορές — κάθε φορά από');
  console.log('  διαφορετικό σημείο. Μην προσθέσεις απαγόρευση: βρες τι ΖΗΤΑΕΙ την ερώτηση');
  console.log('  και αφαίρεσέ το. Η αφηρημένη απαγόρευση δίπλα σε έτοιμο κείμενο δεν δουλεύει.');
}
process.exit(failed > 0 ? 1 : 0);
