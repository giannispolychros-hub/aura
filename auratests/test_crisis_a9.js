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
const NEAR = ['Θα πάρω τα χάπια μου μετά το φαγητό.', 'Παίρνω πολλά χάπια για την πίεση.', 'Έτρεξα 5 kms σήμερα.', 'Έκανα 10kms.', 'Θα πέσω ξερός από την κούραση.',
  'Τα παρατάω όλα, δεν αξίζει τον κόπο να το ψάχνω.', 'Τα παράτησα τα γράμματα.', 'Θα κόψω το τσιγάρο.', 'Κόβω το ψωμί.', 'Φοβάμαι μην πέσει το παιδί από το μπαλκόνι.',
  'Η ομάδα δουλεύει καλύτερα με εμένα.', 'Θα ήταν καλύτερα να φύγω νωρίς από τη δουλειά.', 'Δεν θέλω να υπάρχει άλλη συνάντηση σήμερα.', 'Τα χάπια μου τα παίρνω κανονικά.'];
const fa = NEAR.filter(t => sig(t) === 'CRISIS');
assert('(β) high precision: the near-misses are not a crisis' + (fa.length ? ' — alarm: ' + fa.join(' | ') : ''), fa.length === 0);

// ── (γ) someone else at risk ────────────────────────────────────────────────────────────────────────────────────────────────
const THIRD = ['Ο φίλος μου λέει ότι θέλει να τελειώσει τη ζωή του.', 'Ο φίλος μου μου είπε χθες ότι θέλει να τελειώσει τη ζωή του. Δεν ξέρω τι να κάνω.',
  'Η αδερφή μου θέλει να πεθάνει.', 'Ο γιος μου λέει ότι δεν θέλει πια να ζει.', 'Η φίλη μου σκέφτεται να αυτοκτονήσει.', 'Φοβάμαι ότι ο φίλος μου θα βλάψει τον εαυτό του — μου είπε ότι θέλει να βλάψει τον εαυτό του.'];
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
