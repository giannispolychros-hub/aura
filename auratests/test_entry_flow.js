// AURA — ENTRY FLOW GUARD
//
// WHAT THIS FILE USED TO GUARD, and why it now guards the opposite. The same bug appeared THREE
// times: the user tapped an entry door, answered the time question, and AURA then asked "τι σε
// φέρνει εδώ" again with a list to choose from. Each fix came from a different place — the UI, a
// second screen with different wording, and finally the prompt, which had the doors written out
// verbatim next to an abstract instruction not to use them. This file was the guard that kept
// each fix from being undone, and its assertions asserted the doors' PRESENCE and correct wiring.
//
// THE DOORS ARE NOW GONE — mechanism removed, not suppressed. Measured, not assumed:
//   • the routing table the door produced was STATIC — all five routes and all three time
//     descriptions were sent on every single session regardless of which door was tapped;
//   • door-to-door the injected context shared 83.9% of its characters, time-to-time 99.8%;
//   • "EXACT ROUTING" and "TIME THEY HAVE" appeared ZERO times in the prompt — they existed only
//     in this code, as instructions the prompt itself never acknowledged;
//   • a four-condition experiment run by the founder found no difference in the first reply that
//     could be attributed to which door was tapped.
// So the doors bought a five-way classification of the user that changed nothing downstream, at
// the cost of two extra screens before a word is typed. The entry is now ONE open invitation.
//
// THIS FILE THEREFORE ASSERTS ABSENCE. That inversion is deliberate: a guard that only asserted
// the doors were wired correctly would have passed happily while they were reintroduced somewhere
// new, and "removed" is a claim that decays unless something holds it. The identifier sweep below
// runs over the WHOLE source file, prompt included, so a reintroduction anywhere fails here first.
// If these assertions fail, the doors came back — do not re-wire them, remove them again.

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

// 1b — ΚΑΜΙΑ οθόνη πυλών μετά την έναρξη συνεδρίας (πέμπτη εμφάνιση του ίδιου bug: ένα μπλοκ
//      με «Τι σε έφερε εδώ;» και τρεις πύλες έτρεχε στο messages.length === 0 && sessionStarted,
//      και επέζησε πέντε διορθώσεις επειδή είναι σκέτο div — ο έλεγχος που μετρούσε intro-screen
//      περνούσε ενώ το bug ήταν ζωντανό. Ο έλεγχος τώρα είναι δομικός, όχι βασισμένος σε class.)
assert('Καμία οθόνη μετά το sessionStarted', !/messages\.length === 0 && sessionStarted/.test(CODE));
// ΑΝΤΙΣΤΡΟΦΗ: η ερώτηση εισόδου δεν αποδίδεται ΠΟΥΘΕΝΑ στο UI πλέον — ούτε μία φορά.
const rendered = (CODE.match(/>\s*\n?\s*(Τι σε φέρνει εδώ;|Τι σε έφερε εδώ;)/g) || []);
assert('ΚΑΜΙΑ ερώτηση εισόδου στο UI (βρέθηκαν ' + rendered.length + ')', rendered.length === 0);
// Οποιοδήποτε .map πάνω σε λίστα ελληνικών φράσεων που παράγει κουμπιά = υποψήφια λίστα πυλών.
// Το μοτίβο μένει ως έχει και μόνο ο αναμενόμενος αριθμός γίνεται μηδέν, ώστε μια λίστα πυλών
// που θα επέστρεφε με άλλη διατύπωση να πιάνεται από τον ίδιο ανιχνευτή.
const doorLists = (CODE.match(/\[\s*"[^"]*(?:σκέφτομαι|απόφαση|επιστρέφει|αναβάλλ|αγχώνει|ξεκαθαρ)[^"]*"[\s\S]{0,400}?\]\.map/g) || []);
assert('ΚΑΜΙΑ λίστα πυλών σε όλο το UI (βρέθηκαν ' + doorLists.length + ')', doorLists.length === 0);

// 1b — ΕΝΑ ΜΟΝΟ εισαγωγικό κείμενο (5η εμφάνιση του «τρεις οθόνες»: ο έλεγχος παραπάνω
//      μετρούσε μόνο className="intro-screen", ενώ η δεύτερη οθόνη χρησιμοποιεί inline
//      position:fixed — έτσι δύο εισαγωγικά κείμενα συνυπήρχαν και το test περνούσε).
const liveText = (phrase) => {
  const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  let m;
  while ((m = re.exec(CODE)) !== null) {
    const before = CODE.slice(Math.max(0, m.index - 300), m.index);
    if (before.lastIndexOf('{/*') > before.lastIndexOf('*/}')) continue; // σε σχόλιο
    return true;
  }
  return false;
};
assert('Καμία παλιά εισαγωγή «Όλοι δίνουν απαντήσεις»', !liveText('Όλοι δίνουν απαντήσεις'));
assert('Καμία παλιά «Δες που κολλάς»', !liveText('Δες που κολλάς'));
assert('Καμία παλιά «Μερικές φορές η καλύτερη»', !liveText('Μερικές φορές η καλύτερη'));
assert('Το νέο κείμενο υπάρχει ζωντανό', liveText('δική σου ερώτηση'));

// 1c — Συνολικός αριθμός full-screen overlays πριν το chat (και οι δύο τύποι)
const overlays = (CODE.match(/position:"fixed",inset:0/g) || []).length
               + (CODE.match(/className="intro-screen"/g) || []).length;
assert('Το πολύ δύο overlays εισόδου (βρέθηκαν ' + overlays + ')', overlays <= 2);

// 2 — Το prompt δεν ζητά την ερώτηση εισόδου, σε καμία διατύπωση
assert('Prompt: δεν ζητά «τι σε φέρνει»', !asksIt(PROMPT, 'τι σε φέρνει'));
assert('Prompt: δεν ζητά «τι σε έφερε»', !asksIt(PROMPT, 'τι σε έφερε'));
assert('Prompt: δεν ζητά «what brings you»', !asksIt(PROMPT, 'what brings you'));

// 3 — Καμία έτοιμη λίστα πυλών στο prompt (αυτό ήταν η αιτία της 3ης εμφάνισης:
//     το μοντέλο πιάνει ό,τι είναι γραμμένο, όχι την αφηρημένη απαγόρευση δίπλα)
assert('Prompt: καμία έτοιμη διατύπωση πύλης', !asksIt(PROMPT, 'μια απόφαση που δεν έχει ξεκαθαρίσει'));
assert('Prompt: καμία «κάτι που σε αγχώνει»', !asksIt(PROMPT, 'κάτι που σε αγχώνει'));
assert('Prompt: καμία «επέστρεψε στο μυαλό σου»', !asksIt(PROMPT, 'επέστρεψε στο μυαλό σου'));

// 4 — ΟΙ ΠΥΛΕΣ ΕΧΟΥΝ ΑΦΑΙΡΕΘΕΙ. Σάρωση ΟΛΟΚΛΗΡΟΥ του αρχείου (prompt + κώδικας + σχόλια):
//     ένα αναγνωριστικό που δεν υπάρχει πουθενά δεν μπορεί να επανασυνδεθεί σιωπηλά. Αυτός είναι
//     ο ισχυρότερος φρουρός του αρχείου, και είναι ο λόγος που τα σχόλια της αφαίρεσης μέσα στο
//     App.jsx δεν αναφέρουν κανένα από αυτά τα ονόματα αυτούσιο.
for (const ident of ['entryDoor', 'entryTime', 'setEntryDoor', 'setEntryTime',
                     'entryDoorRef', 'entryTimeRef', 'entryDoorCtx', 'buildEntryContext']) {
  const n = (raw.match(new RegExp(ident, 'g')) || []).length;
  assert('ΑΦΑΙΡΕΘΗΚΕ πλήρως το «' + ident + '» (βρέθηκαν ' + n + ')', n === 0);
}

// 4b — Οι πέντε φράσεις-πύλες δεν υπάρχουν ως ζωντανό κείμενο πουθενά (ούτε στο prompt, που
//      είναι από όπου επέστρεψε η 3η εμφάνιση του bug).
for (const phrase of ['επιστρέφει στο μυαλό μου', 'δεν μπορώ να αποφασίσω',
                      'Έχω πολλά μαζί', 'συνεχίζω να αναβάλλω', 'το αποφάσισα ήδη']) {
  assert('Καμία ζωντανή φράση-πύλη: «' + phrase + '»', !liveText(phrase));
}

// 4c — Η στατική routing table που έστελνε το μπλοκ. Μετρήθηκε ότι ήταν ίδια σε κάθε συνεδρία
//      ανεξάρτητα από την πύλη, και ότι το prompt δεν την αναγνώριζε ποτέ (0 εμφανίσεις εκεί).
for (const marker of ['EXACT ROUTING', "USER'S OWN STATED ENTRY POINT", 'TIME THEY HAVE',
                      'THE ENTRY QUESTION IS ALREADY ANSWERED']) {
  assert('Καμία υπολειμματική οδηγία «' + marker + '»', !raw.includes(marker));
}

// 5 — Η ΕΡΩΤΗΣΗ ΧΡΟΝΟΥ ΕΧΕΙ ΑΦΑΙΡΕΘΕΙ. Ήταν το δεύτερο βήμα πριν γραφτεί λέξη, και το
//     εισαγόμενο κείμενό της ήταν 99.8% ίδιο ανάμεσα στις τρεις απαντήσεις.
assert('Καμία ερώτηση χρόνου', !raw.includes('Πόσο χρόνο έχεις'));
assert('Καμία λίστα επιλογών χρόνου', !raw.includes('"Αρκετό","Λίγο"'));
for (const phrase of ['Καθόλου — πρέπει να αποφασίσω τώρα']) {
  assert('Καμία ζωντανή επιλογή χρόνου: «' + phrase + '»', !liveText(phrase));
}

// 6 — ΕΝΙΑΙΑ ΑΝΟΙΧΤΗ ΕΙΣΟΔΟΣ στη θέση τους: μία πρόσκληση, κανένας κατάλογος να διαλέξει.
assert('Η ανοιχτή είσοδος υπάρχει ζωντανή', liveText('Ξεκίνα με το πρόβλημά σου'));
const openEntry = (CODE.match(/Ξεκίνα με το πρόβλημά σου/g) || []).length;
assert('Εμφανίζεται ακριβώς μία φορά (βρέθηκαν ' + openEntry + ')', openEntry === 1);
assert('Η είσοδος ξεκινά τη συνεδρία κατευθείαν, χωρίς ενδιάμεσο βήμα',
  /Ξεκίνα με το πρόβλημά σου[\s\S]{0,600}?setSessionStarted\(true\)/.test(CODE) ||
  /setSessionStarted\(true\)[\s\S]{0,600}?Ξεκίνα με το πρόβλημά σου/.test(CODE));

// 6b — Η ΓΡΑΜΜΗ 109 ΤΟΥ PROMPT δεν περιγράφει πια μηχανισμό που δεν υπάρχει. Ήταν ο ΜΟΝΟΣ
//      λόγος που αυτή η αλλαγή ακυρώνει το prompt cache, οπότε ελέγχεται ρητά.
assert('Prompt: δεν αναφέρεται πια σε πάτημα πύλης', !/tapping a door|tapped a door|a chosen door/i.test(PROMPT));
assert('Prompt: εξακολουθεί να απαγορεύει ρητά την ερώτηση εισόδου',
  PROMPT.includes('NEVER ASK WHAT BRINGS THEM HERE'));
assert('Prompt: η απαγόρευση δεν έγινε αφηρημένη — λέει τι ΙΣΧΥΕΙ τώρα (γράφουν οι ίδιοι)',
  /ENTRY IS HANDLED BEFORE THIS CONVERSATION BEGINS[\s\S]{0,2600}?(their own words|they typed|wrote it themselves)/i.test(PROMPT));

// 6c — Η ΔΕΥΤΕΡΗ ΔΙΑΔΡΟΜΗ. buildEntryContext υπήρχε επειδή τρεις διαδρομές έχτιζαν prompt και
//      μόνο η μία κουβαλούσε τα ticks. Τα ticks έφυγαν, αλλά το FIRST REPLY FLOOR που κουβαλούσε
//      το ίδιο μπλοκ για τη διαδρομή First-WHY ΔΕΝ είναι μέρος της αφαίρεσης και πρέπει να ζει.
assert('Η διαδρομή First-WHY εξακολουθεί να κουβαλά το FIRST REPLY FLOOR',
  /getLensPrompt\(inferred\)[\s\S]{0,300}?buildFirstWhyFloor\(\)/.test(CODE));
assert('Το FIRST REPLY FLOOR ορίζεται μία φορά',
  (CODE.match(/function buildFirstWhyFloor/g) || []).length === 1);
assert('Και εξακολουθεί να συγκρατεί και τις τέσσερις τεχνικές',
  (() => {
    const i = CODE.indexOf('function buildFirstWhyFloor');
    const b = i >= 0 ? CODE.slice(i, CODE.indexOf('\n}', i)) : '';
    return b.includes('Assumption Surfacing') && b.includes('Premise Inversion') &&
           b.includes('Contradiction Detection') && b.includes('binary-choice');
  })());

// 6d — Το dynamicSuffix δεν στέλνει πια το μπλοκ πυλών, και δεν έμεινε κενή θέση πίσω του.
assert('Το dynamicSuffix δεν περιέχει μπλοκ εισόδου',
  !/dynamicSuffix\s*=\s*\[[^\]]*entry/is.test(CODE));

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
