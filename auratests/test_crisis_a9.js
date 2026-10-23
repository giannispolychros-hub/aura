// THE CRISIS CHECK, AFTER THE FINAL STRESS TEST (A9, and Κ2, Κ3, Κ4 of run 48). Four things, all in the existing check and its tiers:
//  (α) ONE place, at the entry of detectSafetySignal, where the message is made plain before the phrases are tried — double spaces,
//      spaced or dotted letters, emoji and punctuation between words, compatibility letter forms. It adds no phrase: the message is
//      tried as written AND made plain, so nothing that matched before stops matching, and the tier is the tier of the plain phrase.
//  (β) phrases with a means or a plan, and the ones people type, added with high precision — tier A, except «τα παρατάω όλα, δεν
//      αξίζει» (tier B, the 10306 line).
//  (γ) someone else at risk («ο φίλος μου … θέλει να τελειώσει τη ζωή του»): tier A — the line from code and the safety path.
//  (δ) the second line of defence: when the check on the person's words found nothing but AURA's own reply asks about suicide or
//      self-harm, the app adds the tier-A line from code (1018, 112). Only the line; the flow does not change.
//  (ε) no new false alarm: of the 40 everyday idioms, exactly the 8 that alarmed before still alarm — no ninth.
// Run: node auratests/test_crisis_a9.js
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
let F = {};
try {
  F = new Function(['detectSafetySignal', 'classifyCrisisTier', 'buildCrisisLine', 'detectsRiskClarification'].map(fnSrc).join('\n') +
    '\nreturn { detectSafetySignal, classifyCrisisTier, buildCrisisLine, detectsRiskClarification };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const sig = t => { try { return F.detectSafetySignal(t); } catch (e) { return 'threw ' + e.message; } };
const tier = t => { try { return F.classifyCrisisTier(t); } catch (e) { return 'threw ' + e.message; } };
const both = t => (sig(t) || '-') + '/' + (tier(t) || '-');
const LINE_A = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';

// ── (α) the message made plain, in one place ────────────────────────────────────────────────────────────────────────────────
const PLAIN = [
  ['θ έ λ ω  ν α  π ε θ ά ν ω', 'A'], ['θ.έ.λ.ω. ν.α. π.ε.θ.ά.ν.ω', 'A'], ['θέλω  να   πεθάνω', 'A'], ['θέλω 😞 να πεθάνω', 'A'],
  ['θέλω😞να😞πεθάνω', 'A'], ['θέλω-να-πεθάνω', 'A'], ['θέλω...να...πεθάνω', 'A'], ['θέλω​να πεθάνω', 'A'], ['θέλω να πεθάνω', 'A'],
  ['ｉ ｗａｎｔ ｔｏ ｄｉｅ', 'A'], ['δεν  αντέχω  άλλο', 'B'], ['Δ Ε Ν  Α Ν Τ Έ Χ Ω  Ά Λ Λ Ο', 'B'], ['δεν αντέχω 😭 άλλο', 'B'],
  ['ΔΕΝ  ΑΝΤΕΧΩ  ΑΛΛΟ  ΘΕΛΩ  ΝΑ  ΤΕΛΕΙΩΣΩ  ΟΛΑ', 'A'], ['I  want  to  die', 'A'], ['thelo  na  pethano', 'A'], ['den  antexo  allo', 'B'], ['thelo 😞 na pethano', 'A'],
];
for (const [t, want] of PLAIN) assert('(α) «' + t + '» → CRISIS, tier ' + want + ' — got ' + both(t), sig(t) === 'CRISIS' && tier(t) === want);
const dss = fnSrc('detectSafetySignal'), cct = fnSrc('classifyCrisisTier');
assert('(α) one place: the plain form is made inside detectSafetySignal, and classifyCrisisTier only names its tier-B phrases and asks it twice',
  /const plain = /.test(dss) && !/normalize\(|replace\(tierB/.test(cct) && /detectSafetySignal\(text, tierB\)/.test(cct));
assert('(α) no lookbehind in the check (old iPhones, Γ3)', !/\(\?<[=!]/.test(dss + cct));
// everything the check caught before, it still catches, with the same tier (as written AND made plain)
const BEFORE = [['Θέλω να πεθάνω.', 'A'], ['ΘΕΛΩ ΝΑ ΠΕΘΑΝΩ', 'A'], ['θελω να πεθανω', 'A'], ['θέλωωω να πεθάνωωω', 'A'], ['θέλω να πεθάνω 😞', 'A'],
  ['θέλω νa πeθάνω', 'A'], ['ΘEΛΩ NA ΠEΘANΩ', 'A'], ['thelo na pethano', 'A'], ['8elw na pe8anw', 'A'], ['I want to die', 'A'], ["I don't want to live anymore", 'A'],
  ['I want to die, δεν αντέχω άλλο', 'A'], ['σκεφτομαι να αυτοκτονησω', 'A'], ['ΔΕΝ ΑΝΤΕΧΩ ΑΛΛΟ ΘΕΛΩ ΝΑ ΤΕΛΕΙΩΣΩ ΟΛΑ', 'A'], ['Δεν αντέχω άλλο.', 'B'],
  ['Δεν βλέπω λόγο να συνεχίσω.', 'A'], ['Θέλω να κοιμηθώ και να μην ξυπνήσω.', 'A'], ['Θέλω να τελειώσω όλα,τα πάντα.', 'A'], ['Δεν αντέχω άλλο να ζω.', 'A'], ['den antexo allo', 'B'], ['Κουράστηκα να προσπαθώ.', 'B']];
const lost = BEFORE.filter(([t, w]) => sig(t) !== 'CRISIS' || tier(t) !== w);
assert('(α) what was caught before is caught, with the same tier' + (lost.length ? ' — changed: ' + lost.map(([t]) => t + ' ' + both(t)).join(' | ') : ''), lost.length === 0);

// ── (β) the phrases that were missing ───────────────────────────────────────────────────────────────────────────────────────
const NEW = [
  ['Θα ήταν καλύτερα για όλους χωρίς εμένα.', 'A'], ['Θα ήταν καλύτερα χωρίς εμένα.', 'A'], ['Όλοι θα ήταν πιο καλύτερα χωρίς εμένα.', 'A'],
  ['Θα είναι καλύτερα για την οικογένειά μου χωρίς εμένα.', 'A'], ['Καλύτερα να μην υπήρχα.', 'A'], ['Δεν θέλω να υπάρχω.', 'A'], ['Δε θέλω πια να υπάρχω.', 'A'],
  ['Δεν αξίζει να ζω.', 'A'], ['Θα πάρω όλα τα χάπια.', 'A'], ['Πήρα όλα τα χάπια.', 'A'], ['Σκέφτομαι να πιω ένα κουτί χάπια.', 'A'],
  ['Θα πέσω από το μπαλκόνι.', 'A'], ['Θέλω να πηδήξω από την ταράτσα.', 'A'], ['Σκέφτομαι να πέσω από τη γέφυρα.', 'A'], ['Θα κρεμαστώ.', 'A'],
  ['Κόβω τον εαυτό μου.', 'A'], ['Χθες έκοψα τον εαυτό μου.', 'A'],
  ['i wanna die', 'A'], ['I wanna kill myself', 'A'], ['kms', 'A'], ['i just want to kms', 'A'], ['I want to end it all', 'A'], ['im gonna end it all', 'A'],
  ['Τα παρατάω όλα, δεν αξίζει.', 'B'], ['Τα παρατάω όλα. Δεν αξίζει πια.', 'B'], ['τα παρατάω όλα δεν αξίζει', 'B'],
];
for (const [t, want] of NEW) assert('(β) «' + t + '» → CRISIS, tier ' + want + ' — got ' + both(t), sig(t) === 'CRISIS' && tier(t) === want);
const NEAR = ['Θα πάρω τα χάπια μου μετά το φαγητό.', 'Πρέπει να πάρω τα χάπια μου.', 'Θα πάρω τα χάπια.', 'Παίρνω πολλά χάπια για την πίεση.', 'Έτρεξα 5 kms σήμερα.', 'Έκανα 10kms.', 'Θα πέσω ξερός από την κούραση.',
  'Τα παρατάω όλα, δεν αξίζει τον κόπο να το ψάχνω.', 'Τα παράτησα τα γράμματα.', 'Θα κόψω το τσιγάρο.', 'Κόβω το ψωμί.', 'Φοβάμαι μην πέσει το παιδί από το μπαλκόνι.',
  'Η ομάδα δουλεύει καλύτερα με εμένα.', 'Θα ήταν καλύτερα να φύγω νωρίς από τη δουλειά.', 'Δεν θέλω να υπάρχει άλλη συνάντηση σήμερα.', 'Τα χάπια μου τα παίρνω κανονικά.'];
const fa = NEAR.filter(t => sig(t) === 'CRISIS');
assert('(β) high precision: the near-misses are not a crisis' + (fa.length ? ' — alarm: ' + fa.join(' | ') : ''), fa.length === 0);

// ── (γ) someone else at risk ────────────────────────────────────────────────────────────────────────────────────────────────
const THIRD = ['Ο φίλος μου λέει ότι θέλει να τελειώσει τη ζωή του.', 'Ο φίλος μου μου είπε χθες ότι θέλει να τελειώσει τη ζωή του. Δεν ξέρω τι να κάνω.',
  'Η αδερφή μου θέλει να πεθάνει.', 'Ο φίλος μου λέει ότι «θέλει να τελειώσει τη ζωή του».', 'Ο γιος μου λέει ότι δεν θέλει πια να ζει.', 'Η φίλη μου σκέφτεται να αυτοκτονήσει.', 'Φοβάμαι ότι ο φίλος μου θα βλάψει τον εαυτό του — μου είπε ότι θέλει να βλάψει τον εαυτό του.'];
for (const t of THIRD) assert('(γ) «' + t.slice(0, 60) + '…» → CRISIS, tier A (the line from code) — got ' + both(t), sig(t) === 'CRISIS' && tier(t) === 'A');
assert('(γ) the line the app adds for it is the tier-A line, word for word', (() => { try { return F.buildCrisisLine(tier(THIRD[0]), '', false).line === LINE_A; } catch (e) { return false; } })());

// ── (δ) the second line of defence ──────────────────────────────────────────────────────────────────────────────────────────
const asks = t => { try { return F.detectsRiskClarification(t, true); } catch (e) { return 'threw'; } };
const SELF = ['Σκέφτεσαι να βλάψεις τον εαυτό σου;', 'Έχεις σκεφτεί να τελειώσεις τη ζωή σου;', 'Έχεις σκέψεις αυτοκτονίας;', 'Σκέφτεσαι να κάνεις κακό στον εαυτό σου;',
  'Όταν λες «να σβήσω», σκέφτεσαι να βάλεις τέλος;', 'Have you had thoughts of suicide?'.replace('suicide', 'αυτοκτονίας')];
assert('(δ) AURA\'s question about suicide or self-harm is recognised: ' + SELF.filter(t => asks(t) !== true).join(' | '), SELF.every(t => asks(t) === true));
const OTHER = ['Είσαι ασφαλής τώρα;', 'Κινδυνεύεις αυτή τη στιγμή;', 'Είναι σκοτεινές αυτές οι σκέψεις;', 'Κουρασμένος, ή κάτι βαρύτερο;',
  'Σκέφτηκες να βλάψεις τον εαυτό σου.', 'Τι σε κάνει να θες να τα τελειώσεις όλα με τη δουλειά;'];
assert('(δ) only those: «ασφαλής», «κινδυνεύεις», «σκοτεινό», «ή κάτι βαρύτερο», a statement — not a question about self-harm', OTHER.every(t => asks(t) === false));
const broad = t => { try { return F.detectsRiskClarification(t); } catch (e) { return 'threw'; } };
assert('(δ) the risk check as before (one argument) still counts all of them', ['Είσαι ασφαλής τώρα;', 'Κινδυνεύεις αυτή τη στιγμή;', 'Κουρασμένος, ή κάτι βαρύτερο;', 'Σκέφτεσαι να βλάψεις τον εαυτό σου;'].every(t => broad(t) === true) && broad('Σκέφτηκες να βλάψεις τον εαυτό σου.') === false);
const GEN = raw.slice(raw.indexOf('const generateResponse = useCallback('), raw.indexOf('const handleSubmit = useCallback('));
const wire = GEN.slice(GEN.indexOf('if (currentMode === "SUPPORTIVE") {\n        const _crisisLine'), GEN.indexOf('if (detectsMentalHealthReferral(text))'));
assert('(δ) wiring: outside the crisis mode, a reply that asks about self-harm gets the tier-A line from code appended — nothing else',
  /\} else if \(detectsRiskClarification\(text, true\)\) \{\n[\s\S]*?const _selfHarmLine = buildCrisisLine\("A", text, supportLineShown\.current\);\n\s*if \(_selfHarmLine\.line\) displayText = text \+ "\\n\\n" \+ _selfHarmLine\.line;\n\s*\}\n/.test(wire) &&
  (wire.match(/displayText = /g) || []).length === 2 && !/supportLineShown\.current = /.test(wire.slice(wire.indexOf('} else if'))));
assert('(δ) … the line is the one buildCrisisLine writes, and none when the reply already gives 1018', (() => { try {
  return F.buildCrisisLine('A', 'Σκέφτεσαι να βλάψεις τον εαυτό σου;', false).line === LINE_A && F.buildCrisisLine('A', 'Υπάρχει το 1018. Σκέφτεσαι να βλάψεις τον εαυτό σου;', false).line === ''; } catch (e) { return false; } })());

// ── (ε) no new false alarm ──────────────────────────────────────────────────────────────────────────────────────────────────
const IDIOMS = ['Πεθαίνω από τη δουλειά.', 'Θα με σκοτώσει ο προϊστάμενος.', 'Τελείωσα με τη δουλειά.', 'Πέθανα στην κούραση.', 'Με σκότωσε αυτή η βάρδια.',
  'Ψόφησα σήμερα.', 'Θα τρελαθώ με αυτά.', 'Δεν αντέχω τον προϊστάμενο.', 'Δεν αντέχω άλλο αυτή τη ζέστη.', 'Θέλω να εξαφανιστώ για ένα Σαββατοκύριακο.',
  'Θα αυτοκτονήσω αν ξαναδώ αυτό το excel.', 'Πεθαίνω της πείνας.', 'Πέθανα στα γέλια.', 'Θα τον σκοτώσω τον αδερφό μου, πάλι πήρε το αμάξι.', 'Με πεθαίνει αυτό το τραγούδι.',
  'Σκοτώνομαι στη δουλειά.', 'Έχω πεθάνει από το τρέξιμο.', 'Τελειώσαμε για σήμερα.', 'Θέλω να τελειώσω τη δουλειά μου νωρίς.', 'Να τελειώσω τη σχολή και μετά βλέπουμε.',
  'Θέλω να χαθώ σε ένα νησί.', 'Βαρέθηκα τη ζωή μου στην πόλη.', 'Δεν έχει νόημα να συνεχίσω αυτή τη συζήτηση με τον προϊστάμενο.', 'Κουράστηκα να προσπαθώ με αυτό το αμάξι.', 'Δεν βλέπω λόγο να συνεχίσω τη σχέση.',
  'Θα πεθάνω αν δεν φάω κάτι.', 'Πεθαίνω να τον δω.', 'Θέλω να κοιμηθώ δώδεκα ώρες.', 'Θέλω να φύγω μακριά απ\' όλα για λίγο.', 'Θα σκάσω από το κακό μου.',
  'Θα πέσω ξερός από την κούραση.', 'Μου έφυγε η ψυχή στην προπόνηση.', 'Είμαι πτώμα σήμερα.', 'Με πέθανε η εφορία.', 'Θα κόψω το τσιγάρο.',
  'Θα κόψω τις φλέβες μου αν ξαναγίνει αυτό, χαχα.', 'Δεν αντέχω άλλο αυτή την κίνηση.', 'Τα παράτησα τα γράμματα.', 'Τελειωμένη υπόθεση η προαγωγή.', 'Θέλω να τα παρατήσω όλα και να ανοίξω καφέ.'];
const KNOWN8 = ['Δεν αντέχω άλλο αυτή τη ζέστη.', 'Θέλω να εξαφανιστώ για ένα Σαββατοκύριακο.', 'Θα αυτοκτονήσω αν ξαναδώ αυτό το excel.', 'Θέλω να χαθώ σε ένα νησί.',
  'Δεν έχει νόημα να συνεχίσω αυτή τη συζήτηση με τον προϊστάμενο.', 'Κουράστηκα να προσπαθώ με αυτό το αμάξι.', 'Δεν βλέπω λόγο να συνεχίσω τη σχέση.', 'Δεν αντέχω άλλο αυτή την κίνηση.'];
const alarms = IDIOMS.filter(t => sig(t) === 'CRISIS');
assert('(ε) the 40 everyday idioms: exactly the 8 known false alarms, no new one (left for after the 20) — ' + alarms.length + (alarms.filter(t => !KNOWN8.includes(t)).length ? ', NEW: ' + alarms.filter(t => !KNOWN8.includes(t)).join(' | ') : ''),
  IDIOMS.length === 40 && alarms.length === 8 && KNOWN8.every(t => alarms.includes(t)));

// ── (ε) 80 everyday sentences with the very words of the new phrases (John, 23/10, before Part B) ──────────────────────────────
// μπαλκόνι, χάπια, κόβω, «δεν θέλω να υπάρχω», «χωρίς εμένα» at work, «τα παρατάω όλα» for small things, «kms», «end it all», and
// people in health or teaching speaking of patients or pupils. Before the phrases were narrowed, 33 of them alarmed; now none may.
const FA80 = [
  'Πότισα τα λουλούδια στο μπαλκόνι.', 'Μου έπεσε ένα ποτήρι από το μπαλκόνι και έσπασε.', 'Από το μπαλκόνι έχει υπέροχη θέα στη θάλασσα.',
  'Θα πάω να κάτσω στο μπαλκόνι να πιω τον καφέ μου.', 'Φοβάμαι μην πέσω από το μπαλκόνι όταν απλώνω τα ρούχα, το κάγκελο είναι χαμηλό.',
  'Ο γάτος μου πήδηξε από το μπαλκόνι στο διπλανό.', 'Θα ανέβω στην ταράτσα να δω τα πυροτεχνήματα.',
  'Το κινητό μου έπεσε από το μπαλκόνι και έσπασε η οθόνη.', 'Περίμενε να πεταχτώ από το παράθυρο να δω αν ήρθε το ταξί.',
  'Θα περάσω από τη γέφυρα στον δρόμο για το σπίτι.', 'Φοβάμαι τα ύψη, νιώθω ότι θα πέσω στο κενό όταν ανεβαίνω σε σκάλα.',
  'Στο bungee jumping θα πηδήξω από τη γέφυρα του Ισθμού!', 'Τα παιδιά πηδάνε από τον γκρεμό στη θάλασσα το καλοκαίρι.',
  'Κόντεψα να πέσω από τη σκάλα.', 'Θα πέσω από τα σύννεφα αν μου το πει.', 'Είμαι πολύ κουρασμένος, θα πέσω για ύπνο.',
  'Να πέσω από το μπαλκόνι να πάρω την μπάλα των παιδιών; Όχι, θα κατέβω από τις σκάλες.', 'Ο ασθενής μου πήρε όλα τα χάπια την ώρα του.',
  'Πήρα όλα τα χάπια μου σήμερα, όπως είπε ο γιατρός.', 'Η μητέρα μου ξεχνάει να πάρει τα χάπια της.',
  'Πέρασα από το φαρμακείο να πάρω τα χάπια για την πίεση.', 'Παίρνω βιταμίνες κάθε πρωί.',
  'Πήρα ένα κουτί χάπια για τον πονοκέφαλο από το φαρμακείο.', 'Θα πάρω όλα τα χάπια μαζί μου στο ταξίδι.',
  'Ο γιατρός μού είπε να τελειώσω όλο το κουτί με την αντιβίωση.', 'Τελείωσε το κουτί με τα χάπια, πρέπει να πάρω καινούργιο.',
  'Ως νοσηλεύτρια μοιράζω όλα τα χάπια στους ασθενείς το πρωί.', 'Μην ξεχάσεις να πάρεις τα χάπια σου.',
  'Κατάπια ένα χάπι για τον λαιμό και ήταν πολύ μεγάλο.', 'Θα πάρω όλα τα χάπια από το φαρμακείο με μία συνταγή.',
  'Ο πατέρας μου παίρνει όλα τα χάπια του με το πρωινό.', 'Πήρα όλο το κουτί χάπια μαζί μου στη δουλειά, για να μην το ξεχάσω.',
  'Κόβω τα μαλλιά μου κοντά αύριο.', 'Πάω να κόψω τα μαλλιά μου στο κομμωτήριο.', 'Κόβω φρούτα για τη φρουτοσαλάτα.',
  'Κόπηκα με το χαρτί, τίποτα σοβαρό.', 'Κόβομαι κάθε φορά που ξυρίζομαι.', 'Έκοψα τον εαυτό μου από τα social media για έναν μήνα.',
  'Κόβω τον εαυτό μου από τα γλυκά, κάνω δίαιτα.', 'Θα κόψω το κάπνισμα από Δευτέρα.', 'Έκοψα το χαρτί στη μέση με το ψαλίδι.',
  'Δεν θέλω να υπάρχω στα social media, γι\' αυτό έκλεισα τα προφίλ μου.', 'Σε αυτή την ομάδα του WhatsApp δεν θέλω να υπάρχω πια.',
  'Δεν θέλω να υπάρχει θόρυβος όταν δουλεύω.', 'Δεν θέλω να υπάρχω μόνο ως η μαμά κάποιου, θέλω και τη δική μου ζωή.',
  'Δεν θέλω να υπάρχω στη λίστα με τα email τους.', 'Δεν θέλω να υπάρχουν παρεξηγήσεις.',
  'Καλύτερα να μην υπήρχα σε εκείνη τη φωτογραφία, βγήκα χάλια.', 'Θα τα καταφέρουν χωρίς εμένα στη δουλειά για μια εβδομάδα.',
  'Θα είναι καλύτερα για την ομάδα χωρίς εμένα στο project, έχουν πιο έμπειρους.', 'Η σύσκεψη θα είναι καλύτερα χωρίς εμένα, δεν ξέρω το θέμα.',
  'Θα ήταν καλύτερα για τον πελάτη χωρίς εμένα στη μέση, να μιλήσουν απευθείας.', 'Πήγαν διακοπές χωρίς εμένα.', 'Ξεκίνησαν τη σύσκεψη χωρίς εμένα.',
  'Η εταιρεία θα συνεχίσει κανονικά χωρίς εμένα όταν βγω στη σύνταξη.', 'Τα παρατάω όλα και πάω για καφέ.',
  'Τα παρατάω όλα για σήμερα, πάω για ύπνο.', 'Τα παρατάω όλα, δεν αξίζει να χαλάω τη μέρα μου για ένα excel.',
  'Τα παρατάω όλα με αυτό το παζλ, δεν αξίζει.', 'Με αυτό το level στο παιχνίδι τα παρατάω όλα, δεν αξίζει.',
  'Τα παρατάω όλα με τη δίαιτα, δεν αξίζει τον κόπο.', 'Δεν αξίζει να συνεχίσω αυτή τη σειρά στο Netflix, είναι βαρετή.',
  'I ran 10 kms this morning.', 'kms walked today: 12', 'How many kms is it to Patras?', 'Distance: 5 kms.',
  'We\'re going to end it all with fireworks at midnight!', 'The series finale is going to end it all.', 'I wanna die my hair blue this summer.',
  'This movie made me wanna die of laughter.', 'Ο μαθητής έπεσε από το μπαλκόνι του σχολείου και είναι καλά.',
  'Ως νοσηλευτής εξηγώ στους ασθενείς να μην πάρουν όλα τα χάπια μαζί.',
  'Μια ασθενής μου λέει συχνά ότι θέλει να πεθάνει στο σπίτι της και όχι στο νοσοκομείο.',
  'Ο παππούς λέει ότι δεν θέλει πια να ζει σε πολυκατοικία, θέλει χωριό.', 'Ο πατέρας μου θέλει να τελειώσει τη ζωή του στο χωριό του.',
  'Ο συνάδελφος θέλει να βάλει τέλος στη ζωή του ως εργένης, παντρεύεται!', 'Έχω μαθητή που δεν θέλει πλέον να ζει στο οικοτροφείο.',
  'Μη με βάζεις να κρεμαστώ από τη χειρολαβή όλη τη διαδρομή.', 'Ο φίλος μου θέλει να πεθάνει από τα γέλια κάθε φορά που βλέπει αυτή τη σειρά.',
  'Θα πηδήξω από τη χαρά μου αν περάσω στη σχολή!',
];
const fa80 = FA80.filter(t => sig(t) === 'CRISIS');
assert('(ε) the 80 everyday sentences with the same words: none is a crisis — ' + FA80.length + (fa80.length ? ', ALARM: ' + fa80.join(' | ') : ''), FA80.length === 80 && fa80.length === 0);

// ── unchanged ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('unchanged: the two phrase lists of before, word for word (the new phrases are a list of their own)',
  dss.includes(String.raw`/\b(suicide|suicidal|self.harm|self.hurt|kill myself|end my life|don't want to (live|be here)|want to die|want to disappear|can't go on)\b/i,`) &&
  dss.includes('/(αυτοκτον|αυτοτραυματ|δεν θέλω να ζω|θέλω να πεθάν|θέλω να χαθώ|ήθελα να χαθώ|να χαθώ (από προσώπου|για πάντα|από τον κόσμο)|να τελειώσω (τα πάντα|με όλα|με τα πάντα|τη ζωή μου|με τη ζωή μου)|να τελειώσω όλα(?! (μου )?(τα|τις|τους|αυτά))|να τα τελειώσω όλα|δεν αντέχω άλλο|δεν βλέπω νόημα|δεν υπάρχει λόγος να συνεχίσω|δεν βλέπω λόγο να συνεχίσω|ίσως (ούτε )?η ζωή μου|δεν αξίζει (πια|πλέον)|τι νόημα έχει πια|κουράστηκα να (προσπαθώ|υπάρχω|αγωνίζομαι|συνεχίζω|ζω)|δώσω τέλος|να δώσω ένα τέλος|βάλω (ένα )?τέλος|να μην ξυπνήσω|να μην είμαι εδώ|δεν θέλω να είμαι (πια |πλέον )?εδώ|δεν έχει νόημα να (συνεχίζω|συνεχίσω|ζω)|να εξαφανιστώ|καλύτερα νεκρ|θα ήταν καλύτερα χωρίς εμένα|κακό στον εαυτό μου|βλάψω τον εαυτό μου|να φύγω από τη ζωή|δεν έχω λόγο να ζω|τελειώνω με όλα)/i,'));
assert('unchanged: the crisis lines, word for word', (() => { try { return F.buildCrisisLine('A', '', false).line === LINE_A &&
  F.buildCrisisLine('B', '', false).line === 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.'; } catch (e) { return false; } })());
assert('unchanged: grief, trauma, panic and «κρίση» are DISTRESS, not a crisis', ['Έχω πένθος.', 'Είχα κρίση πανικού.', 'I had a panic attack.'].every(t => sig(t) === 'DISTRESS'));
assert('unchanged: ordinary words are nothing', ['Δεν ξέρω αν πρέπει να αλλάξω δουλειά.', 'Γεια.', '', 'Ναι.'].every(t => sig(t) === null));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
