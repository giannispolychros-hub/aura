// Ο5 — DANGER FROM ANOTHER PERSON (John, 23/10/2026, a safety fix, code only; real-model run 52, sessions 125 and 125-2: «Με χτυπάει
// ο άντρας μου. Φοβάμαι να φύγω.» … «Ευχαριστώ, κλείνουμε εδώ.» got the root question, because detectSafetySignal reads harm to oneself
// only). A check of its own (detectsDangerFromOther) and a latch of its own (dangerFromOther), never cleared before «Νέα συνεδρία».
//  (Α) 26 real descriptions — the predictions were written before the first measurement (see `predicted`); what is missed is MEASURED
//      and pinned here, honestly, not narrowed or widened for a number. (Β) phrases that read both ways: caught on purpose.
//  (Γ) false alarms: the 80 everyday sentences of test_crisis_a9.js and 160 new ones — 0 in BOTH detectors.
//  (Δ) capitals, no accents, greeklish, spelling by ear. (Ε) John's lines, word for word, the names of HELPLINES, each sentence once.
//  (ΣΤ) Stage A while the latch holds: no root question, no root button, no step or time question, no normal closing, the fixed goodbye.
//  (Ζ) «Όχι τώρα» / «Δεν ξέρω αν είμαι ασφαλής» clear nothing. (Η) with crisis A and B. (Θ) a legal request, «Θέλω λύση»: no latch.
//  (Ι) the wiring, and the old flow (?stageA=0): the line only. (Κ) unchanged: the crisis check, its lines, HELPLINES, the prompt.
//  (Λ) none of the 12.000+ strings of the other tests and browser scripts is caught (so no existing flow moves).
// Run: node auratests/test_danger_from_other_2310.js
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
const block = start => {
  const a = CODE.indexOf(start); if (a < 0) return '';
  let d = 0, s = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { d++; s = true; } else if (CODE[k] === '}') { d--; if (s && d === 0) return CODE.slice(a, k + 1); }
  }
  return '';
};
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(a, raw.indexOf('`;', a + 1) + 2); };
const arr = n => { const a = CODE.indexOf('const ' + n + ' = ['); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n];', a) + 3); };
const constLine = n => (CODE.match(new RegExp('^const ' + n + ' = .*$', 'm')) || [''])[0];
const NAMES = ['detectsDangerFromOther', 'buildDangerLine', 'stageASafetyHold', 'detectSafetySignal', 'classifyCrisisTier', 'buildCrisisLine',
  'perTurnSafety', 'describeSafetyPathCtx', 'stopMomentGentleOnly', 'detectsRiskClarification', 'stageARootButtonVisible', 'stageALeavingDoorOpens',
  'stageAAfterCrisisText', 'stageAModelClosesBeforeRoot', 'stageAMethodLineDue', 'stageACaptureAllowed', 'isExplicitClosure', 'declaresClosing',
  'matchesClosingWord', 'isOpeningGreeting', 'replaceBareGoodbye', 'parseThreeBeatShift', 'lookBehind', 'mergeRiskKind', 'dangerInMessages'];
let F = {};
try {
  F = new Function(block('const STAGE_A_TEXTS = ') + ';\n' + arr('HELPLINES') + ';\n' + constLine('BARE_GOODBYE_TEXT') + '\n' +
    NAMES.map(n => fnSrc(n) || `function ${n}(){ return 'missing'; }`).join('\n') + '\nreturn { STAGE_A_TEXTS, HELPLINES, ' + NAMES.join(', ') + ' };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw ' + e.message; } };
const D = t => { const r = call('detectsDangerFromOther', t); return r && typeof r === 'object' ? r : null; }; // a missing or broken check is «not caught», never a pass
const sig = t => call('detectSafetySignal', t);
const T = F.STAGE_A_TEXTS || {};
const LINE_SELF = 'Σε άμεσο κίνδυνο, 112. Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.';
const LINE_CHILD = 'Σε άμεσο κίνδυνο, 112. Για παιδί, 1056, Χαμόγελο του Παιδιού.';
const LINE_A = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';

const REAL = [
  ['Με χτυπάει ο άντρας μου. Φοβάμαι να φύγω.', 'self', 'caught'],
  ['Χθες με έσπρωξε στον τοίχο μπροστά στο παιδί.', 'self', 'caught'],
  ['Ο γείτονας χτυπάει το παιδί του, ακούω φωνές κάθε βράδυ.', 'child', 'caught'],
  ['Ο σύντροφός μου με απειλεί ότι θα με σκοτώσει αν φύγω.', 'self', 'caught'],
  ['Όταν πίνει με δέρνει.', 'self', 'caught'],
  ['Ο πατέρας μου με χτυπάει με τη ζώνη.', 'self', 'caught'],
  ['Ο πρώην μου με παρακολουθεί και λέει ότι θα με σκοτώσει.', 'self', 'caught'],
  ['Ο άντρας μου χτυπάει τα παιδιά όταν θυμώνει.', 'child', 'caught'],
  ['Με βίασε ο θείος μου όταν ήμουν μικρή.', 'self', 'caught'],
  ['Μου έριξε χαστούκι μπροστά σε όλους.', 'self', 'caught'],
  ['Φοβάμαι να γυρίσω σπίτι, θα με χτυπήσει πάλι.', 'self', 'missed'],
  ['Φοβάμαι να γυρίσω σπίτι.', 'self', 'missed'],
  ['Δεν μπορώ να του πω όχι, θυμώνει και σπάει πράγματα.', 'self', 'missed'],
  ['Φοβάμαι να φύγω, ξέρω τι θα κάνει.', 'self', 'missed'],
  ['me xtypaei o antras mou', 'self', 'caught'],
  ['Ο ΑΝΤΡΑΣ ΜΟΥ ΜΕ ΧΤΥΠΑΕΙ', 'self', 'caught'],
  ['ο συζυγος μου με κακοποιει', 'self', 'caught'],
  ['Η μητριά μου χτυπάει τον μικρό μου αδερφό.', 'child', 'caught'],
  ['Με κλείδωσε στο σπίτι και μου πήρε το κινητό.', 'self', 'missed'],
  ['Με έπιασε από τον λαιμό και με έσφιγγε.', 'self', 'caught'],
  ['Ο φίλος μου με χτύπησε χθες και έχω μελανιές.', 'self', 'caught'],
  ['Τρώω ξύλο από τον άντρα μου εδώ και χρόνια.', 'self', 'caught'],
  ['Ο γιος μου με χτυπάει για να του δίνω τη σύνταξή μου.', 'self', 'caught'],
  ['Φοβάμαι ότι θα με σκοτώσει αν μάθει πού είμαι.', 'self', 'missed'],
  ['Η αδερφή μου μού είπε ότι ο άντρας της τη χτυπάει.', 'other adult', 'missed'],
  ['Η κόρη μου μου είπε ότι ο πατριός της την αγγίζει.', 'child', 'missed'],
];
// Phrases that read BOTH ways — caught on purpose (a false alarm costs less than a missed signal). Shown, not counted as false alarms.
const BOTH_WAYS = [
  'Ο άντρας μου θα με σκοτώσει αν μάθει πόσα ξόδεψα.',
  'Η γυναίκα μου θα με σκοτώσει που ξέχασα την επέτειο.',
  'Αν με χτυπήσει ποτέ ο άντρας μου, θα φύγω.',
];
// FA_NEW: 160 everyday sentences — a person who presses, threatens at law or with money, «kills» in a figure of speech, the same verbs in
// their everyday senses, and fear / leaving / home / «όχι» with no violence. None is danger.
const FA_NEW = [
  // a person who presses, or threatens at law or with money
  'Ο προϊστάμενός μου με πιέζει.', 'Ο προϊστάμενός μου με πιέζει να μένω μέχρι αργά.', 'Η τράπεζα με απειλεί με κατάσχεση.',
  'Ο σπιτονοικοκύρης απειλεί να με διώξει.', 'Ο άντρας μου με πιέζει να πουλήσουμε το σπίτι.',
  'Ο πρώην μου απειλεί ότι θα πάει στο δικαστήριο για την επιμέλεια.', 'Η πεθερά μου με πιέζει να κάνουμε κι άλλο παιδί.',
  'Ο συνέταιρός μου απειλεί ότι θα με μηνύσει.', 'Το αφεντικό μου απειλεί ότι θα με απολύσει αν ξαναργήσω.',
  'Ο δικηγόρος του άντρα μου μου έστειλε εξώδικο.', 'Ο αδερφός μου απειλεί να μου κάνει αγωγή για το σπίτι του πατέρα μας.',
  'Η εταιρεία με απειλεί με απόλυση.', 'Ο πελάτης απειλεί να μας κάνει κακή κριτική.', 'Η μάνα μου με πιέζει να γυρίσω στο χωριό.',
  'Ο πατέρας μου με πιέζει να σπουδάσω ιατρική.', 'Ο άντρας μου λέει ότι θα πάρει την επιμέλεια της μικρής.',
  'Χωρίζουμε και ο άντρας μου λέει ότι θα πάρει την επιμέλεια της μικρής. Τι λες να κάνω;', 'Θέλω λύση, όχι ερωτήσεις. Τι να κάνω;',
  'Ο ενοικιαστής απειλεί ότι θα σταματήσει να πληρώνει.', 'Ο γείτονας απειλεί να καλέσει την αστυνομία για τον θόρυβο.',
  'Η διαχείριση της πολυκατοικίας απειλεί να μας κόψει το νερό.', 'Ο εργοδότης μου δεν με πληρώνει εδώ και τρεις μήνες.',
  'Η πρώην μου απειλεί να μη μου αφήνει να βλέπω τα παιδιά.', 'Ο αδερφός μου με πιέζει να του δανείσω χρήματα.',
  'Η τράπεζα μου είπε ότι θα βγάλει το σπίτι σε πλειστηριασμό.', 'Ο συνάδελφός μου με υπονομεύει στον διευθυντή.',
  'Η μάνα μου απειλεί ότι θα με αποκληρώσει.', 'Ο προϊστάμενος με απειλεί με πειθαρχικό.', 'Ο ιδιοκτήτης θέλει να μου διπλασιάσει το νοίκι.',
  'Ο συνέταιρός μου με εκβιάζει ότι θα φύγει από την εταιρεία.', 'Μου είπαν ότι αν δεν πληρώσω θα με πάνε στα δικαστήρια.',
  'Ο λογιστής μου λέει ότι θα πληρώσω πρόστιμο αν δεν κάνω δήλωση.', 'Ο σύζυγός μου απειλεί να ζητήσει διαζύγιο αν δεν αλλάξω δουλειά.',
  'Ο μάνατζέρ μου απείλησε ότι θα μου κόψει το μπόνους.', 'Ο γιος μου απειλεί ότι θα φύγει από το σπίτι αν δεν του πάρω κινητό.',
  'Η κόρη μου απειλεί ότι δεν θα μου ξαναμιλήσει.', 'Ο συνάδελφος απειλεί να παραιτηθεί.', 'Ο σύντροφός μου απειλεί ότι θα με αφήσει αν δεν αλλάξω.',
  'Η μάνα μου απείλησε ότι θα μου κόψει το χαρτζιλίκι.', 'Ο προϊστάμενός μου φωνάζει σε όλους στις συσκέψεις.',
  'Ο σύντροφός μου φωνάζει όταν τσακωνόμαστε, μετά ζητάει συγγνώμη.', 'Ο πατέρας μου με κατηγορεί για όλα.',
  'Η πεθερά μου ανακατεύεται στο πώς μεγαλώνουμε το παιδί.', 'Ο άντρας μου θέλει να πάρει δάνειο χωρίς να με ρωτήσει.',
  'Η αδερφή μου με πιέζει να φροντίζω εγώ τη μητέρα μας.',
  // «kills» in a figure of speech
  'Θα με σκοτώσει η μάνα μου αν το μάθει.', 'Η δουλειά με σκοτώνει.', 'Ο προϊστάμενός μου θα με σκοτώσει αν δεν παραδώσω σήμερα.',
  'Θα με σκοτώσει ο πατέρας μου όταν δει τους βαθμούς.', 'Η πεθερά μου θα με σκοτώσει αν δεν πάμε για Πάσχα.',
  'Ο αδερφός μου θα με σκοτώσει που του χάλασα το ποδήλατο.', 'Με σκοτώνει αυτή η κίνηση κάθε πρωί.', 'Αυτή η ζέστη με σκοτώνει.',
  'Με σκότωσε αυτό το ανέκδοτο.', 'Θα σκοτώσω την ώρα μου με μια σειρά.', 'Ο προπονητής θα μας σκοτώσει στην προπόνηση σήμερα.',
  'Τα πόδια μου με σκοτώνουν μετά το τρέξιμο.', 'Ο λογαριασμός του ρεύματος με σκότωσε.', 'Θα με σκοτώσει το αφεντικό αν αργήσω πάλι.',
  'Ο πατέρας μου είπε ότι θα με σκοτώσει αν τρακάρω το αυτοκίνητό του.', 'Η μαμά μου θα με σφάξει όταν δει το δωμάτιο.',
  'Με πεθαίνει αυτό το τραγούδι.', 'Η γιαγιά μου θα με σκοτώσει με το φαγητό της, μαγειρεύει για δέκα.',
  'Οι προθεσμίες με σκοτώνουν αυτόν τον μήνα.', 'Ο δάσκαλος θα με σκοτώσει που δεν έφερα την εργασία.', 'Σκοτώθηκα στη δουλειά σήμερα.',
  'Η διατροφή με σκοτώνει, πεινάω όλη μέρα.', 'Ο φίλος μου με σκότωσε στο τάβλι χθες.', 'Θα σκοτωθούμε στη δουλειά μέχρι τα Χριστούγεννα.',
  'Η θεία μου θα με σκοτώσει που δεν πήγα στη γιορτή της.',
  // the same verbs, in their everyday senses
  'Με χτύπησε η πόρτα.', 'Μου χτύπησε το τηλέφωνο.', 'Με χτυπάει ο ήλιος στο μάτι όταν οδηγώ.', 'Με χτυπάει το καινούργιο παπούτσι.',
  'Ο φίλος μου με χτύπησε τηλέφωνο χθες βράδυ.', 'Ο προϊστάμενός μου με χτυπάει στα νεύρα.', 'Με χτύπησε ρεύμα όταν άλλαζα τη λάμπα.',
  'Με χτύπησε μια μέλισσα στον κήπο.', 'Η μπάλα με χτύπησε στο κεφάλι στο ματς.', 'Χτύπησε το κουδούνι και ήταν ο ταχυδρόμος.',
  'Ο γείτονας χτύπησε την πόρτα να ζητήσει ζάχαρη.', 'Το παιδί χτύπησε στο γόνατο στην παιδική χαρά.', 'Χτύπησα το πόδι μου στο τραπέζι.',
  'Ο άντρας μου χτύπησε το αυτοκίνητο στο πάρκινγκ.', 'Με χτύπησε η κρίση και έκλεισα το μαγαζί.', 'Η μάνα μου μου χτύπησε την πόρτα να ξυπνήσω.',
  'Ο σύντροφός μου χτυπάει τα δάχτυλα στο τραπέζι όταν αγχώνεται.', 'Ο γιος μου χτύπησε στο σχολείο και πήγαμε για ράμματα.',
  'Ο ντράμερ χτυπάει τα τύμπανα δυνατά.', 'Χτυπάω αυγά για την ομελέτα.', 'Με χτύπησε ένα αμάξι στη διάβαση αλλά είμαι καλά.',
  'Ο συνάδελφος με χτύπησε φιλικά στην πλάτη.', 'Ο γιος μου γύρισε με χτυπημένο γόνατο από το ποδόσφαιρο.', 'Με έδειρε στο τάβλι ο παππούς μου.',
  'Ο αδερφός μου με δέρνει πάντα στο σκάκι.', 'Μας έδειρε η άλλη ομάδα τρία μηδέν.', 'Ο φίλος μου με έδειρε στο PlayStation.',
  'Τα κύματα έδερναν τα βράχια όλη νύχτα.', 'Με δέρνει ο αέρας στο πρόσωπο όταν κάνω ποδήλατο.', 'Με έσπρωξε να κάνω μεταπτυχιακό.',
  'Η μάνα μου με σπρώχνει να παντρευτώ.', 'Ο προπονητής με σπρώχνει να προπονούμαι περισσότερο.', 'Κάποιος με έσπρωξε στο μετρό, είχε πολύ κόσμο.',
  'Ο άντρας μου με σπρώχνει να ζητήσω αύξηση.', 'Ο σύντροφός μου με έσπρωξε να πάω στον γιατρό, καλά έκανε.', 'Με πνίγει η δουλειά.',
  'Με πνίγουν τα χρέη.', 'Ο προϊστάμενός μου με πνίγει με τις προθεσμίες.', 'Η μάνα μου με πνίγει με τη φροντίδα της.',
  'Ο σύντροφός μου με πνίγει, θέλω λίγο χώρο.', 'Πνίγηκα με ένα κόκαλο ψαριού.', 'Με έπνιξε το άγχος πριν την παρουσίαση.',
  'Μη με βιάζεις, θα το τελειώσω.', 'Ο προϊστάμενος με βιάζει να παραδώσω την αναφορά.', 'Με βίασε να υπογράψω το συμβόλαιο χωρίς να το διαβάσω.',
  'Βιάζομαι να φύγω, έχω ραντεβού.', 'Το μωρό με κλωτσάει όλη νύχτα.', 'Ο άντρας μου με κλωτσάει στον ύπνο του, θα πάρουμε μεγαλύτερο κρεβάτι.',
  'Η μηχανή κλωτσάει όταν πατάω γκάζι.', 'Η απόρριψη ήταν χαστούκι για μένα.', 'Φάγαμε ξύλο στο ματς χθες.',
  'Η ζωή μου έριξε πολλά χαστούκια φέτος.', 'Η κριτική του ήταν σαν χαστούκι.', 'Ο παππούς μου λέει ότι παλιά οι δάσκαλοι έριχναν ξύλο.',
  'Ο καιρός απειλεί με καταιγίδες το Σαββατοκύριακο.', 'Ο γιατρός μου μου έπιασε τον λαιμό για να δει τους αδένες.',
  'Ο φυσιοθεραπευτής με τράβηξε από τα πόδια για να ισιώσει τη μέση.', 'Η κομμώτρια μου τράβηξε τα μαλλιά καθώς χτένιζε.',
  'Ο σκύλος του γείτονα με δάγκωσε.', 'Με έπιασε ο λαιμός μου από το κρύο.',
  // fear, leaving, home, «όχι» — no violence
  'Φοβάμαι να φύγω από τη δουλειά χωρίς να έχω βρει άλλη.', 'Φοβάμαι να γυρίσω σπίτι μόνη μου το βράδυ από τον σταθμό.',
  'Δεν μπορώ να του πω όχι όταν μου ζητάει να μείνω υπερωρία.', 'Δεν μπορώ να της πω όχι, είναι η καλύτερή μου φίλη.',
  'Φοβάμαι να φύγω στο εξωτερικό για δουλειά.', 'Φοβάμαι μήπως με απολύσουν.', 'Φοβάμαι να του πω ότι θέλω να χωρίσουμε, θα στενοχωρηθεί.',
  'Φοβάμαι την αντίδραση του πατέρα μου αν του πω ότι άφησα τη σχολή.', 'Ο άντρας μου θυμώνει όταν αργώ, αλλά τα λέμε μετά.',
  'Ο προϊστάμενός μου με φοβίζει με τον τόνο του.', 'Φοβάμαι να γυρίσω στο σπίτι των γονιών μου για τις γιορτές, θα με ρωτάνε πότε θα παντρευτώ.',
  'Δεν θέλω να γυρίσω σπίτι, έχει πολλή φασαρία με τα παιδιά.', 'Ο άντρας μου δεν με χτυπάει ποτέ, απλώς φωνάζει πολύ.',
  'Δεν μπορώ να πω όχι σε κανέναν, όλοι με εκμεταλλεύονται.', 'Φοβάμαι ότι θα με βρει ο προϊστάμενος στο κινητό στις διακοπές.',
  'Φοβάμαι να φύγω από τη σχέση γιατί θα μείνω μόνη.', 'Ο πατέρας μου με κλείδωσε έξω από το σπίτι κατά λάθος.',
  'Η κόρη μου φοβάται να γυρίσει σπίτι με κακούς βαθμούς.', 'Φοβάμαι μήπως με πάρει τηλέφωνο ο πρώην μου.',
  'Ο σύντροφός μου ζηλεύει όταν βγαίνω με φίλες.', 'Ο πατέρας μου ήταν αυστηρός όταν ήμουν μικρή.', 'Η μάνα μου με έβαζε τιμωρία όταν ήμουν παιδί.',
  'Ο άντρας μου κάνει νυχτερινές βάρδιες και δεν τον βλέπω.', 'Ο προϊστάμενός μου με έβαλε στο μάτι.', 'Ο πεθερός μου μου κάνει τη ζωή δύσκολη.',
  'Ξέρω τι θα κάνει αν φύγω: θα πάρει όλα τα λεφτά.', 'Η δασκάλα λέει ότι ο γιος μου χτυπάει τα άλλα παιδιά στο διάλειμμα.',
  'Ο σκύλος μου με έσπρωξε κάτω από τη χαρά του.', 'Η φίλη μου με έσπρωξε στην πισίνα για πλάκα.', 'Τα παιδιά μου με κουράζουν πολύ τα απογεύματα.',
];

// ── (Α) 26 real descriptions ─────────────────────────────────────────────────────────────────────────────────────────────────
const missed = REAL.filter(([t]) => !D(t)).map(([t]) => t);
const MISSED_MEASURED = [ // measured on 23/10 (18 of 26 caught, 8 missed — 31%), exactly as predicted before the first measurement
  'Φοβάμαι να γυρίσω σπίτι, θα με χτυπήσει πάλι.', 'Φοβάμαι να γυρίσω σπίτι.', 'Δεν μπορώ να του πω όχι, θυμώνει και σπάει πράγματα.',
  'Φοβάμαι να φύγω, ξέρω τι θα κάνει.', 'Με κλείδωσε στο σπίτι και μου πήρε το κινητό.', 'Φοβάμαι ότι θα με σκοτώσει αν μάθει πού είμαι.',
  'Η αδερφή μου μού είπε ότι ο άντρας της τη χτυπάει.', 'Η κόρη μου μου είπε ότι ο πατριός της την αγγίζει.'];
console.log(`(Α) real descriptions: ${REAL.length - missed.length} of ${REAL.length} caught, ${missed.length} missed (${Math.round(100 * missed.length / REAL.length)}%)`);
assert('(Α) 26 real descriptions, written before the detector was measured', REAL.length === 26);
assert('(Α) what is caught and what is missed is what was measured — ' + (REAL.length - missed.length) + '/26 (a change here is a decision, not a drift)',
  missed.length === MISSED_MEASURED.length && MISSED_MEASURED.every(t => missed.includes(t)));
assert('(Α) the measurement is the prediction written before it, sentence by sentence', REAL.every(([t, , p]) => (D(t) ? 'caught' : 'missed') === p));
for (const [t, kind] of REAL) if (D(t) && kind !== 'other adult') assert(`(Α) «${t}» → the line for ${kind === 'self' ? 'the person writing' : 'a child'}`, D(t)[kind] === true);
assert('(Α) run 52\'s first message of Ο5 and the third: caught', !!D('Με χτυπάει ο άντρας μου. Φοβάμαι να φύγω.') && !!D('Χθες με έσπρωξε στον τοίχο μπροστά στο παιδί.'));
assert('(Α) run 52\'s Ο6 («ο γείτονας χτυπάει το παιδί του»): caught, for a child', (D('Ο γείτονας χτυπάει το παιδί του.') || {}).child === true);

// KNOWN GAPS beyond the 26, found while writing these tests (23/10) — not fixed, pinned so a change is visible: a word between the verb
// and the child («χτυπάει ΚΑΙ τα παιδιά») and a sister's or a friend's danger told by the user (no «με» / «το παιδί»).
for (const t of ['Ο άντρας μου χτυπάει και τα παιδιά.', 'Η αδερφή μου μού είπε ότι ο άντρας της τη χτυπάει.'])
  assert(`(Α) KNOWN GAP, not fixed: «${t}» is not caught`, D(t) === null);

// ── (Β) both ways — caught on purpose ───────────────────────────────────────────────────────────────────────────────────────────
for (const t of BOTH_WAYS) assert(`(Β) reads both ways, caught on purpose: «${t}»`, !!D(t));

// ── (Γ) false alarms: 0 in both detectors ───────────────────────────────────────────────────────────────────────────────────────
const a9 = fs.readFileSync(path.join(__dirname, 'test_crisis_a9.js'), 'utf8');
const FA80 = (() => { try { return eval(a9.slice(a9.indexOf('const FA80 = [') + 'const FA80 = '.length, a9.indexOf('];', a9.indexOf('const FA80 = [')) + 1)); } catch (e) { return []; } })();
const fa = FA_NEW.filter(t => D(t)), fa80 = FA80.filter(t => D(t));
assert('(Γ) 160 new everyday sentences (a person who presses, threatens at law or with money, «kills» in a figure of speech; the same verbs in their everyday senses; fear, leaving, home, «όχι»)', FA_NEW.length === 160 && new Set(FA_NEW).size === 160);
assert('(Γ) the new check: none of the 160 is danger' + (fa.length ? ' — ALARM: ' + fa.join(' | ') : ''), fa.length === 0);
assert('(Γ) the new check: none of the 80 sentences of test_crisis_a9.js' + (fa80.length ? ' — ALARM: ' + fa80.join(' | ') : ''), FA80.length === 80 && fa80.length === 0);
const c160 = FA_NEW.filter(t => sig(t) === 'CRISIS'), c80 = FA80.filter(t => sig(t) === 'CRISIS');
assert('(Γ) the crisis check (unchanged): none of the 160 is a crisis' + (c160.length ? ' — ' + c160.join(' | ') : ''), c160.length === 0);
assert('(Γ) the crisis check (unchanged): none of the 80 is a crisis', c80.length === 0);
assert('(Γ) the named ones of the plan: no latch', ['Ο προϊστάμενός μου με πιέζει.', 'Η τράπεζα με απειλεί με κατάσχεση.', 'Ο σπιτονοικοκύρης απειλεί να με διώξει.',
  'Η δουλειά με σκοτώνει.', 'Θα με σκοτώσει η μάνα μου αν το μάθει.', 'Με χτύπησε η πόρτα.', 'Μου χτύπησε το τηλέφωνο.', 'Με έσπρωξε να κάνω μεταπτυχιακό.'].every(t => !D(t)));

// ── (Δ) the forms people type ───────────────────────────────────────────────────────────────────────────────────────────────────
const FORMS = ['Ο ΑΝΤΡΑΣ ΜΟΥ ΜΕ ΧΤΥΠΑΕΙ', 'ο αντρας μου με χτυπαει', 'Ο άντρας μου με χτιπάει', 'me xtypaei o antras mou', 'me xtipaei o antras mou',
  'o antras mou me derni otan pinei', 'ΜΕ ΔΕΡΝΕΙ', 'με δερνει καθε μερα', 'Ο άντρας  μου   με χτυπάει.', 'Ο άντρας μου 😞 με χτυπάει.',
  'Ο σύντροφός μου με απειλεί ότι θα με σκοτώσει', 'o syntrofos mou me apeilei oti tha me skotosei'];
for (const t of FORMS) assert(`(Δ) «${t}» → caught`, !!D(t));
assert('(Δ) «Δεν με χτυπάει, απλώς φωνάζει» → not', !D('Ο άντρας μου δεν με χτυπάει, απλώς φωνάζει.'));
assert('(Δ) a thing as the subject right after the verb is not a person, even with a person in the sentence («με χτύπησε η μπάλα»)',
  !D('Ο γιος μου γέλασε όταν με χτύπησε η μπάλα.') && !D('Η μάνα μου είδε που με χτύπησε η πόρτα.') && !!D('Ο γιος μου γέλασε όταν με χτύπησε ο πατέρας του.'));
assert('(Δ) empty, a number, a greeting → null', [undefined, null, '', ' ', '5', 'Γεια.', 'Ναι.'].every(t => D(t) === null));
assert('(Δ) old iPhones: no lookbehind in the new check or its line', !/\(\?<[=!]/.test(fnSrc('detectsDangerFromOther') + fnSrc('buildDangerLine') + fnSrc('stageASafetyHold')));

// ── (Ε) the lines ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const L = (d, reply, shown) => call('buildDangerLine', d, reply, shown);
assert('(Ε) the person writing — John\'s text, word for word', L({ self: true, child: false }, 'Σε ακούω.', []).line === LINE_SELF);
assert('(Ε) a child — John\'s text, word for word', L({ self: false, child: true }, 'Σε ακούω.', []).line === LINE_CHILD);
assert('(Ε) both: «Σε άμεσο κίνδυνο, 112.» once', L({ self: true, child: true }, '', []).line ===
  'Σε άμεσο κίνδυνο, 112. Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών. Για παιδί, 1056, Χαμόγελο του Παιδιού.');
assert('(Ε) the names are HELPLINES\' own', (F.HELPLINES || []).length === 8 && ['112', '15900', '1056'].every(n => {
  const nm = (F.HELPLINES.find(x => x.number === n) || {}).name; return nm && (LINE_SELF + LINE_CHILD).includes(nm); }));
assert('(Ε) no other number than 112, 15900, 1056 (no 197, no 100, no 1018) and no promise (ανώνυμ, δωρεάν, 24, ασφαλ, μυστικ, δεν θα μάθει)',
  [LINE_SELF, LINE_CHILD].every(l => (l.match(/\d+/g) || []).every(n => ['112', '15900', '1056'].includes(n)) && !/ανώνυμ|δωρεάν|24|ασφαλ|μυστικ|δεν θα μάθει/i.test(l)));
const once = L({ self: true }, '', []), onceShown = once && Array.isArray(once.shown) ? once.shown : [];
assert('(Ε) each sentence once per session: the same danger again → no line', onceShown.includes('self') && L({ self: true }, '', onceShown).line === '');
assert('(Ε) a child later in the same session → only its own sentence (112 was given)', L({ self: false, child: true }, '', onceShown).line === 'Για παιδί, 1056, Χαμόγελο του Παιδιού.');
assert('(Ε) a reply that already shows 112 (crisis line A) → «Σε άμεσο κίνδυνο, 112.» is not written twice',
  L({ self: true }, 'Σε ακούω.\n\n' + LINE_A, []).line === 'Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.');
assert('(Ε) nothing seen → no line', L(null, '', []).line === '' && L({ self: false, child: false }, '', []).line === '');
// the line reads EVERY user message: in the old flow the first one gets the app's First-WHY, and the model answers the next one
const FIRST_WHY = [{ role: 'user', content: 'Με χτυπάει ο άντρας μου.' }, { role: 'assistant', content: 'Γιατί έχει σημασία αυτό για σένα τώρα;' }, { role: 'user', content: 'Γιατί φοβάμαι.' }];
const dim = m => { const r = call('dangerInMessages', m); return r && typeof r === 'object' ? r : null; };
assert('(Ε) old flow, danger in the first message, then First-WHY and its answer → the reply that follows still knows (self)', (dim(FIRST_WHY) || {}).self === true);
assert('(Ε) … the kinds of all the messages together; the AURA side is not read; nothing → null',
  JSON.stringify(dim([...FIRST_WHY, { role: 'user', content: 'Ο άντρας μου χτυπάει τα παιδιά όταν πίνει.' }])) === '{"self":true,"child":true}' &&
  dim([{ role: 'assistant', content: 'Με χτυπάει ο άντρας μου.' }, { role: 'user', content: 'Δεν ξέρω.' }]) === null && dim([]) === null && dim(undefined) === null);

// ── (ΣΤ) Stage A while the latch holds ────────────────────────────────────────────────────────────────────────────────────────
const btn = o => call('stageARootButtonVisible', Object.assign({ active: true, assistantReplies: 2, loading: false, riskKind: 0, closingStarted: false, rootPhase: null, sessionEnded: false }, o));
assert('(ΣΤ) the root button: shown without the latch (as today), hidden with it', btn({}) === true && btn({ dangerFromOther: true }) === false && btn({ riskKind: 1 }) === false);
const door = o => call('stageALeavingDoorOpens', Object.assign({ active: true, used: false, rootPhase: null, armed: false, rootConfirmed: false, closingStarted: false, riskKind: 0, safetyMode: false, lastUserText: 'Ευχαριστώ, κλείνουμε εδώ.', earlierUserTexts: ['κάτι'] }, o));
assert('(ΣΤ) the leaving door (the root question on exit): opens without the latch (as today), never with it', door({}) === true && door({ dangerFromOther: true }) === false);
const mc = o => call('stageAModelClosesBeforeRoot', Object.assign({ active: true, rootConfirmed: false, rootPhase: null, armed: false, closingStarted: false, safetyMode: false, supportive: false, riskKind: 0,
  lastUserText: 'Ναι.', earlierUserTexts: [], reply: 'ΗΡΘΕΣ ΜΕ: α\nΒΡΗΚΕΣ: β\nΦΕΥΓΕΙΣ ΜΕ: γ' }, o));
assert('(ΣΤ) the model\'s own closing before the root → door 1\'s root question: as today without the latch, never with it', mc({}) === true && mc({ dangerFromOther: true }) === false);
const ml = o => call('stageAMethodLineDue', Object.assign({ active: true, auraBefore: false, supportive: false, riskKind: 0, safetyMode: false, lastUserText: 'κάτι' }, o));
assert('(ΣΤ) the method line on the first reply: as today without the latch, not with it', ml({}) === true && ml({ dangerFromOther: true }) === false);
const ps = (a, b, c) => call('perTurnSafety', a, b, c);
assert('(ΣΤ) the safety path (the per-turn notes put safety first): with the latch, from the turn it is seen; without it, as today',
  ps('NORMAL', 0, true).safetyPath === true && ps('NORMAL', 0, false).safetyPath === false && ps('NORMAL', 0).safetyPath === false && ps('SUPPORTIVE', 0).safetyPath === true && ps('NORMAL', 2).safetyPath === true);
assert('(ΣΤ) the safety-path note: the SAME sentence as after a crisis line, word for word — no new text',
  call('describeSafetyPathCtx', 0, true) === call('describeSafetyPathCtx', 1) && call('describeSafetyPathCtx', 1).length > 50 && call('describeSafetyPathCtx', 0) === '' && call('describeSafetyPathCtx', 3, false) === '');
assert('(ΣΤ) the stop moment: the gentle form only', call('stopMomentGentleOnly', [], 0, true) === true && call('stopMomentGentleOnly', [], 0, false) === false);
assert('(ΣΤ) a message that tells of danger is never «Τι βρήκες» (the card): refused, like a crisis', call('stageACaptureAllowed', 'Με χτυπάει ο άντρας μου.') === false &&
  call('stageACaptureAllowed', 'Φοβάμαι ότι δεν θα τα καταφέρω στη δουλειά.') === true);
assert('(ΣΤ) the hold: tier A or the latch', call('stageASafetyHold', 1, false) === true && call('stageASafetyHold', 0, true) === true && call('stageASafetyHold', 2, false) === false && call('stageASafetyHold', 3) === false);
const DANGER_MSGS = [{ role: 'user', content: 'Με χτυπάει ο άντρας μου.' }, { role: 'assistant', content: 'Σε ακούω.\n\n' + LINE_SELF, msgMode: 'NORMAL' }];
const after = (u, o) => call('stageAAfterCrisisText', Object.assign({ active: true, messages: DANGER_MSGS, lastUserText: u, dangerLine: true }, o));
assert('(ΣΤ) the exit after the danger line → John\'s phrase, word for word (no root question, no normal closing)',
  after('Ευχαριστώ, κλείνουμε εδώ.') === T.afterCrisis && T.afterCrisis === 'Είμαι εδώ όταν χρειαστεί να συνεχίσουμε. Κι αν βαρύνει, οι αριθμοί που σου έδωσα είναι εκεί.');
assert('(ΣΤ) … «ευχαριστώ», «Κλείνουμε», «αντίο» too; «Νιώθω χάλια. Ευχαριστώ.» is still talking (the model answers)',
  ['ευχαριστώ', 'Κλείνουμε.', 'Αντίο.'].every(u => after(u) === T.afterCrisis) && after('Νιώθω χάλια. Ευχαριστώ.') === null);
assert('(ΣΤ) a goodbye that itself tells of danger goes on to the model (which gets the line)', after('Με χτυπάει πάλι, γεια.') === null);
assert('(ΣΤ) … and when the model answers a danger message with a bare goodbye, the phrase does not replace it on that turn (the line goes under it)',
  after('Με χτυπάει ο άντρας μου.', { reply: 'Να είσαι καλά.' }) === null && after('Εντάξει.', { reply: 'Να είσαι καλά.' }) === T.afterCrisis);
assert('(ΣΤ) the phrase promises nothing — no safety, no secrecy, no anonymity', !/ασφαλ|μυστικ|ανώνυμ|κανείς δεν θα|δεν θα μάθει/i.test(T.afterCrisis));
assert('(ΣΤ) no line shown and no crisis → as today (null)', call('stageAAfterCrisisText', { active: true, messages: [{ role: 'assistant', content: 'Τι σε κρατάει;' }], lastUserText: 'ευχαριστώ' }) === null);
assert('(ΣΤ) switch closed → null (the old flow keeps its own goodbye)', after('ευχαριστώ', { active: false }) === null);

// ── (Ζ) «Όχι τώρα» and «Δεν ξέρω αν είμαι ασφαλής» clear nothing ─────────────────────────────────────────────────────────────────
const SAFETY_ANSWERS = ['Όχι τώρα.', 'Όχι τώρα. Ο άντρας μου κοιμάται, αλλά ξέρω ότι θα ξυπνήσει.', 'Δεν ξέρω αν είμαι ασφαλής.', 'Τώρα είμαι στο σπίτι, αυτός κοιμάται. Δεν ξέρω αν είμαι ασφαλής.'];
assert('(Ζ) the answers to the safety question are not an exit (they go to the model) and are not a goodbye for the phrase',
  SAFETY_ANSWERS.every(u => !call('isExplicitClosure', u) && !call('declaresClosing', u) && after(u) === null));
const HS = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const sets = [...CODE.matchAll(/dangerFromOther\.current = (true|false)/g)].map(m => m[1]);
assert('(Ζ) the latch: set in one place (true), cleared only by «Νέα συνεδρία» — nothing an answer says turns it off',
  sets.length === 2 && sets.filter(v => v === 'true').length === 1 && /if \(detectsDangerFromOther\(userText\)\) dangerFromOther\.current = true;/.test(HS) &&
  /riskSignalKind\.current = 0; labelLeaks\.current = 0; dangerFromOther\.current = false; dangerLineShown\.current = \[\];/.test(block('const resetSession = () =>')));

// ── (Η) with crisis A and B ─────────────────────────────────────────────────────────────────────────────────────────────────────
const CA = 'Με χτυπάει ο άντρας μου και θέλω να πεθάνω.', CB = 'Με χτυπάει ο άντρας μου και δεν αντέχω άλλο.';
assert('(Η) crisis A + danger: the crisis check (unchanged) says CRISIS tier A, the new one danger', sig(CA) === 'CRISIS' && call('classifyCrisisTier', CA) === 'A' && !!D(CA));
assert('(Η) … the reply carries the line A as today, then only the second sentence of the danger line (112 once)', (() => {
  const reply = 'Σε ακούω.\n\n' + call('buildCrisisLine', 'A', 'Σε ακούω.', false).line;
  const l = L(D(CA), reply, []).line; const all = reply + '\n\n' + l;
  return reply.includes(LINE_A) && l === 'Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.' && (all.match(/112/g) || []).length === 1;
})());
assert('(Η) crisis B + danger: tier B as today (10306), and the whole danger line', sig(CB) === 'CRISIS' && call('classifyCrisisTier', CB) === 'B' && (() => {
  const reply = 'Σε ακούω.\n\n' + call('buildCrisisLine', 'B', 'Σε ακούω.', false).line;
  return reply.includes('10306') && L(D(CB), reply, []).line === LINE_SELF;
})());
assert('(Η) the risk latch is the crisis one, untouched: danger alone leaves it at 0, crisis A at 1, crisis B at 2',
  call('mergeRiskKind', 0, sig('Με χτυπάει ο άντρας μου.'), null) === 0 && call('mergeRiskKind', 0, sig(CA), 'A') === 1 && call('mergeRiskKind', 0, sig(CB), 'B') === 2);

// ── (Θ) a legal request and «Θέλω λύση» ─────────────────────────────────────────────────────────────────────────────────────────
for (const t of ['Χωρίζουμε και ο άντρας μου λέει ότι θα πάρει την επιμέλεια της μικρής. Τι λες να κάνω; Θέλω λύση.',
  'Ποια είναι τα δικαιώματά μου για την κόρη μου και τι πρέπει να κάνω αύριο;', 'Θέλω λύση, όχι ερωτήσεις. Τι να κάνω;', 'Δεν θέλω ερωτήσεις, πες μου τι να κάνω.'])
  assert(`(Θ) «${t}» → no latch`, D(t) === null && sig(t) === null);

// ── (Ι) the wiring ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
assert('(Ι) the latch is set right after the crisis latch, before any branch (switch open or closed)',
  HS.indexOf('if (detectsDangerFromOther(userText)) dangerFromOther.current = true;') > HS.indexOf('riskSignalKind.current = mergeRiskKind(') &&
  HS.indexOf('if (detectsDangerFromOther(userText)) dangerFromOther.current = true;') < HS.indexOf('const _saPhase = stageARef.current.phase;'));
const li = GEN.indexOf('const _danger = dangerInMessages(msgs);');
assert('(Ι) the line: in BOTH flows (no switch test), after every rewrite of the reply and before the AI-identity line',
  li > GEN.indexOf('if (_afterCrisis) displayText = _afterCrisis;') && li < GEN.indexOf('const _aiLine = buildAiIdentityLine(') && li > 0 &&
  /const _dangerLine = buildDangerLine\(_danger, displayText, dangerLineShown\.current\);/.test(GEN) && !/stageAActive/.test(GEN.slice(li, GEN.indexOf('const _aiLine'))));
assert('(Ι) the line is really put under the reply (not only computed) — and on the old flow\'s First-WHY reply',
  GEN.includes('if (_dangerLine.line) displayText = displayText.trim() ? displayText + "\\n\\n" + _dangerLine.line : _dangerLine.line;') &&
  HS.includes('const _firstText = _firstDangerLine.line ? (String(text || "").trim() ? text + "\\n\\n" + _firstDangerLine.line : _firstDangerLine.line) : text;') &&
  HS.includes('const _firstWhyShown = _firstAiLine ? _firstText + "\\n\\n" + _firstAiLine : _firstText;'));
assert('(Ι) a failed call: the danger line is really computed from every user message and shown (main path and First-WHY)',
  GEN.includes('const _failDangerLine = _failDanger ? buildDangerLine(_failDanger, _failLine.line, dangerLineShown.current).line : "";') &&
  HS.includes('const _fdl = _fd ? buildDangerLine(_fd, "", dangerLineShown.current).line : ""; if (_fdl) setCrisisFallback(_fdl);'));
assert('(Ι) a failed call: the danger line from code too, not marked as shown (the retry\'s reply carries it)',
  /const _failDanger = dangerInMessages\(msgs\);/.test(GEN) && /setCrisisFallback\(\[_failLine\.line, _failDangerLine\]\.filter\(Boolean\)\.join\("\\n\\n"\)\)/.test(GEN));
{
  // the old flow's First-WHY answer: this branch calls the model and writes its own reply — the danger line goes there too, and on a failure
  const fw = HS.slice(HS.indexOf('if (firstWhyPending) {'), HS.indexOf('// ADR «19 Οκτωβρίου (β)» (John, a safety exception (α)): after the crisis line, a goodbye'));
  assert('(Ι) old flow: the reply to the First-WHY answer (its own branch) carries the danger line — every user message of the turn, each sentence once',
    fw.includes('const _firstDanger = dangerInMessages(initMsgs);') && /buildDangerLine\(_firstDanger, text, dangerLineShown\.current\)/.test(fw) &&
    /dangerLineShown\.current = _firstDangerLine\.shown;/.test(fw) && /const _firstAiLine = buildAiIdentityLine\([^;]*, _firstText\);/.test(fw) &&
    fw.indexOf('const _firstDanger') < fw.indexOf('const _firstAiLine'));
  assert('(Ι) old flow: a failed call on that branch still shows the danger line from code', /catch\(e\) \{ setError\(e\.message\); const _fd = dangerInMessages\(initMsgs\);/.test(fw) && /setCrisisFallback\(/.test(fw));
}
assert('(Ι) Stage A only: the notes, the stop moment and the closing decision read the latch with the switch open',
  (GEN.match(/stageAActive\.current && dangerFromOther\.current/g) || []).length === 6);
assert('(Ι) every Stage A door gets the latch: the button, the leaving door ×2, the model\'s close, the method line, door 2/3 ×3, armed',
  (CODE.match(/dangerFromOther: dangerFromOther\.current/g) || []).length === 5 && (CODE.match(/!stageASafetyHold\(riskSignalKind\.current, dangerFromOther\.current\)/g) || []).length === 4);
// UPDATED (31/10/2026, ADR «31 Οκτωβρίου (δ)»): a third reader — the goodbye after a dismissal at the leaving door (stageADismiss).
assert('(Ι) the pre-model goodbye after the line, the post-reply one, and the goodbye after a dismissal, all know the line was shown',
  (CODE.match(/dangerLine: dangerLineShown\.current\.length > 0/g) || []).length === 3);
assert('(Ι) the step stops on danger too, and the word is never taken from such a message (nor in Stage A after it)',
  HS.includes('if (detectSafetySignal(userText) || detectsDangerFromOther(userText)) {') &&
  HS.includes('if (awaitingRememberedWord && !detectSafetySignal(userText) && !detectsDangerFromOther(userText) && !(stageAActive.current && dangerFromOther.current)) {'));
{
  // every read of the latch is one of these — gated by the switch at the read, passed to a Stage A function that checks `active`, or a hold
  // inside an `if (stageAActive.current …)`; plus the one place that sets it and the one that clears it. A new read must be classified here.
  const all = [...CODE.matchAll(/dangerFromOther\.current/g)].length;
  const gated = (CODE.match(/stageAActive\.current && dangerFromOther\.current/g) || []).length;           // 7: the notes, the stop moment ×2, the decision ×2, the word
  const passed_ = (CODE.match(/dangerFromOther: dangerFromOther\.current/g) || []).length;                  // 5: pure Stage A functions (`active` checked inside)
  const holds = (CODE.match(/!stageASafetyHold\(riskSignalKind\.current, dangerFromOther\.current\)/g) || []).length; // 4: inside `if (stageAActive.current …)`
  const setClear = (CODE.match(/dangerFromOther\.current = (?:true|false)/g) || []).length;                  // 2
  const holdLines = CODE.split('\n').filter(l => l.includes('!stageASafetyHold(riskSignalKind.current, dangerFromOther.current)'));
  assert(`(Ι) old flow (?stageA=0): every read of the latch is gated by the switch — ${all} = ${gated} gated + ${passed_} passed + ${holds} holds + ${setClear} set/clear`,
    all === gated + passed_ + holds + setClear && gated === 7 && passed_ === 5 && holds === 4 && setClear === 2 &&
    holdLines.filter(l => /stageAActive\.current/.test(l) || /const _saArmed = stageARootArmed\.current/.test(l) || /^\s*!coreReadinessConfirmed\.current/.test(l)).length === 4);
  assert('(Ι) … the pure functions it is passed to all check the switch first',
    ['stageARootButtonVisible', 'stageALeavingDoorOpens', 'stageAModelClosesBeforeRoot', 'stageAMethodLineDue'].every(n => /\.active === true/.test(fnSrc(n))));
}

// ── (Κ) unchanged ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const PIN = { detectSafetySignal: '1f7c3cb8fe568f31' /* UPDATED (31/10, ADR «31 Οκτωβρίου (ζ)», a safety fix (α), John): + one narrow, closed line for the passive-ideation gaps (S5–S9 and «θα ήταν πιο απλό να μην υπάρχω καθόλου») — auratests/test_safety_detectors_3110.js */ /* UPDATED (25/10, Ε1, the broader version, John): «καλύτερα / μακάρι / εύχομαι» with every ending — auratests/test_passive_ideation_2410.js */ /* UPDATED (24/10, Ε1, a safety fix (α)): + the passive-ideation phrases — auratests/test_passive_ideation_2410.js */, classifyCrisisTier: 'afa5cf7a370bb0d5', buildCrisisLine: 'd359e22dd7cf9a95',
  crisisLineAfterFailedCall: 'c87733effcebde7e', mergeRiskKind: 'd3b56f5bad3ae14f' }; // as on merge-candidate a701c07
for (const [n, v] of Object.entries(PIN)) assert(`(Κ) UNCHANGED, byte for byte: ${n}`, h(fnSrc(n)) === v);
assert('(Κ) UNCHANGED, byte for byte: HELPLINES', h(arr('HELPLINES')) === '392f594fe775a4cf');
assert('(Κ) UNCHANGED: the prompt (AURA_CORE_PERSONALITY) and the crisis prompt', h(raw.slice(_s, _e)) === 'b5f303cc9405aa21' && h(lit('SYSTEM_SUPPORTIVE')) === 'ff063670f20343a7');
assert('(Κ) UNCHANGED: the Stage A texts (no new text: the goodbye is the existing afterCrisis)', h(block('const STAGE_A_TEXTS = ')) === '6eb98181ff245492');

// ── (Λ) no existing flow moves ──────────────────────────────────────────────────────────────────────────────────────────────────
{
  // UPDATED (31/10, FC4 option Γ, ADR «31 Οκτωβρίου»): test_fc4_locked_line_3110.js holds danger messages on purpose (the line shown at
  // once while the send lock holds) and is left out, like this file itself
  // UPDATED (31/10, ADR «31 Οκτωβρίου (ζ)», a safety fix (α)): test_safety_detectors_3110.js holds danger messages on purpose (the gaps of
  // item 117 and their variants, which must now be caught) and is left out the same way. Measured when it was added: of the 27.017
  // strings of every other test and browser script, the changed detectors read differently only the four passive-ideation «KNOWN GAP»
  // phrases of test_passive_ideation_2410.js — no other string moved, none was lost
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== path.basename(__filename) && f !== 'test_fc4_locked_line_3110.js' && f !== 'test_safety_detectors_3110.js').map(f => path.join(__dirname, f))
    .concat(['e2e_stress_lib.cjs', 'e2e_stage_a.cjs', 'e2e_stage_a_lib.cjs'].map(f => path.join(ROOT, 'scripts', f)).filter(f => fs.existsSync(f)));
  const STR = /'((?:[^'\\\n]|\\.){3,600})'|"((?:[^"\\\n]|\\.){3,600})"|`((?:[^`\\]|\\.){3,600})`/g;
  const seen = new Set();
  // the browser script's own O5 section (runMockO5) is the one place meant to hold danger messages — left out; everything else is read
  // UPDATED (25/10, the pause switch): the pause section (runMockPZ) holds one danger message on purpose too — the danger line from code
  // while AURA is paused — and is left out the same way
  // UPDATED (26/10, audit finding Α1): the failed-call section (runMockFC) holds one danger message on purpose too — the danger line
  // from code must stay after a failed call and another message — and is left out the same way
  // UPDATED (26/10, audit finding Α2): the correction-box section (runMockMF) holds one danger message on purpose too — it must take the
  // normal path — and is left out the same way
  const without = name => t => { const a = t.indexOf('async function ' + name + '('); return a < 0 ? t : t.slice(0, a) + t.slice(t.indexOf('\n}\n', a) + 3); };
  // UPDATED (30/10, ADR «30 Οκτωβρίου»): the notes section (runMockNT) holds one danger message on purpose — it checks that Stage A
  // with danger from another person keeps its notes byte for byte — and is left out the same way
  // UPDATED (31/10, FC4 option Γ): the section of the line shown at once while the send lock holds (runMockFL) holds one danger
  // message on purpose too, and is left out the same way
  // UPDATED (31/10, ADR «31 Οκτωβρίου (β)»): the channel section (runMockCH — no channel but a call for a help line) holds one danger
  // message on purpose too, and is left out the same way
  // UPDATED (31/10, ADR «31 Οκτωβρίου (ζ)», a safety fix (α)): the section of the detectors' gaps (runMockSD) holds danger messages on
  // purpose — the gaps of item 117, which must now bring the line — and is left out the same way
  const withoutO5 = t => without('runMockSD')(without('runMockCH')(without('runMockFL')(without('runMockNT')(without('runMockMF')(without('runMockFC')(without('runMockPZ')(without('runMockO5')(t))))))));
  // UPDATED (24/10, Π3 step 2, the stress tool brought onto this branch): the stress tool's two danger-from-another sessions — 125
  // (risk: 'violence') and 126 (risk: 'child') — are meant to hold danger messages too, like runMockO5: left out, and checked below to
  // be CAUGHT; no other persona is left out
  const DANGER_PERSONA = /^  finalP\(\{ id: (\d+), [^\n]*risk: '(?:violence|child)'[\s\S]*?(?=^  finalP\(\{|^\];)/gm;
  const dangerOut = [];
  const withoutDanger = t => t.replace(DANGER_PERSONA, (b, id) => { dangerOut.push({ id: +id, block: b }); return ''; });
  for (const f of files) for (const m of withoutDanger(withoutO5(fs.readFileSync(f, 'utf8'))).matchAll(STR)) {
    const s = (m[1] || m[2] || m[3]).replace(/\\n/g, '\n').replace(/\\(.)/g, '$1');
    if ((s.match(/\p{L}/gu) || []).length >= 2) seen.add(s);
  }
  const hits = [...seen].filter(s => D(s));
  assert(`(Λ) none of the ${seen.size} strings of the other tests and the browser scripts is caught — no existing flow moves` + (hits.length ? ' — ' + hits.slice(0, 3).join(' | ') : ''),
    seen.size > 10000 && hits.length === 0);
  const ids = dangerOut.map(x => x.id).sort((a, b) => a - b).join(',');
  assert('(Λ) …the only personas left out are the two danger-from-another sessions of the stress tool (125, 126), or none where the tool is absent',
    ids === '125,126' || (ids === '' && !fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'), 'utf8').includes("risk: 'violence'")));
  const firsts = dangerOut.map(x => (x.block.match(/forced: \{ 1: '([^']+)'/) || [])[1]).filter(Boolean);
  assert('(Λ) …and their first messages ARE caught (they test this path): ' + firsts.map(x => '«' + x + '»').join(', '),
    firsts.length === dangerOut.length && firsts.every(x => D(x)));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
