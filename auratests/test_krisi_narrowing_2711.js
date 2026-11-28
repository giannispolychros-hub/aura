// ── «ΚΡΙΣΗ»: ΑΝΑΒΕΙ ΣΗΜΑΙΑ ΜΟΝΟ ΩΣ ΚΡΙΣΗ ΠΟΥ ΖΕΙ Ο ΧΡΗΣΤΗΣ Ή ΣΥΓΓΕΝΗΣ ΤΗΣ ΚΛΕΙΣΤΗΣ ΛΙΣΤΑΣ — ΡΗΤΗ ΕΝΤΟΛΗ ΤΟΥ JOHN, 27/11/2026 (Σύνταγμα §0.1) ──────────
//
// WHY. The real session of 24/11/2026 (the third): «κρίση» meant JUDGEMENT — the user's own, twice, in the 2nd and 3rd message. The detector read it
// as DISTRESS, the session's heaviness latch went to 3 and stayed there, and from then on the step, the closing from code, the list of the user's own sentences (Λ1), the «δικαίωμα
// ομιλίας» and the Thought Map were cut — for a user who had said nothing heavy. The measurement of 27/11/2026 over the whole stored body of data (2.665 texts, 378 sessions: 61 stress-test
// runs and 3 real sessions): 6 messages in 2 sessions contain the word; none of them is an emergency (4 «κρίση της οικογένειας» of a simulated persona, 2 judgement of the real session).
// ADR «18 Οκτωβρίου» had kept the word as it was («ένας ψεύτικος συναγερμός κοστίζει λιγότερο από έναν χαμένο»); John's EXPLICIT order of 27/11/2026 supersedes that line (ADR «27 Νοεμβρίου»;
// Constitution §0.1: a safety detector changes only on his word).
//
// WHAT JOHN DECIDED (27/11/2026, after the measurement showed that the first shape — only «έχω / είμαι σε / περνάω κρίση» — lost natural first-person phrases): the word lights where the person
// says they ARE IN a crisis or HAVE one — «έχω / είχα / έπαθα / περνάω κρίση», «είμαι / βρίσκομαι σε [μεγάλη] κρίση», «μου ήρθε / με έπιασε κρίση», «μπήκα σε κρίση», «σε κρίση είμαι», «έπαθα
// καρδιακή / επιληπτική κρίση» — and the named kinds («κρίση πανικού / άγχους / ταυτότητας / ζωής», «ψυχολογική / ψυχική / νευρική / υπαρξιακή / ψυχωτική / μανιακή / υστερική κρίση»); and, in the
// THIRD person, ONLY for the closed list of relatives (κόρη, γιος, παιδί, άντρας, γυναίκα, μάνα, πατέρας, αδελφός / αδελφή μου): «η κόρη μου είναι σε κρίση», «ο πατέρας μου έπαθε καρδιακή κρίση».
// NOT «οικογένεια», εταιρεία, δικαστήριο, οικονομική. «Οικονομική κρίση» therefore STOPS lighting (it was pinned as «known false DISTRESS, not touched here»).
// THE LIMIT THAT DOES NOT MOVE: the 6 known messages stay quiet, and none of the 196 emergency-type messages changes. WHAT DOES NOT CHANGE: the CRISIS list (tiers A and B, the lines 1018 / 112 /
// 10306), the other Greek DISTRESS words, the English ones («crisis» included), classifyCrisisTier, the order of the checks (a CRISIS phrase still wins over any DISTRESS word in the same message).
//
// WHAT THIS TEST IS, AND IS NOT. It is: (1) a table of phrases — each with what the detector gave at 9e9828e and what it must give now (the table is printed with AURA_TABLE=1); (2) the closed lists
// pinned word for word; (3) a proof that the new patterns are a NARROWING (nothing quiet before can light now: every alternative needs the stem «κρίση»); (4) an equivalence over the stored simulated
// corpus (data_sim_corpus_2711.json: 2.612 messages, with what the detector gave BEFORE): exactly the 4 simulated messages change, none of the 196 emergency-type messages. It is NOT a proof that the
// detector is safe as a whole: it is a list of phrases and a stored body of data. What it does not cover is written in ADR «27 Νοεμβρίου» (group 12 below: the known false negatives).
// The 2 real-session messages of the measurement are NOT stored here (no real user text in the repository): their sense is covered by the look-alikes of group 7, written for this test.
//
// UPDATED (John, 28/11/2026, order «ενοποιημένη», step Α1) — the detector grows by TWO things, both approved by John in his own words, and by nothing else:
//   (1) PLURAL relatives of the closed list: «οι γονείς μου», «τα παιδιά μου», «τα αδέλφια / αδέρφια μου» with «είναι σε κρίση / περνάνε κρίση / έχουν κρίση» (and the plural of the other third-person
//       verbs), in either order — a FIFTH pattern, built like the fourth, with its own closed lists kRP and kTP. «Οι φίλοι μου», «οι συνάδελφοί μου» and every other plural stay quiet.
//   (2) an ARTICLE before «κρίση» ONLY when a KNOWN KIND follows («την κρίση της μέσης ηλικίας», «την κρίση πανικού»): the optional article kA, a look-ahead on the kinds kK, in the two verb patterns
//       (first person, relative) — never a bare article: «Περνάω την κρίση.», «Δεν αντέχω αυτή την κρίση.», «Η κρίση με πνίγει.» STAY QUIET and are recorded as a KNOWN LIMIT (group 12).
// THE LIMITS THAT DO NOT MOVE (John): the 6 known messages stay quiet, none of the 196 emergency-type messages changes, and nothing lights over the 2.665 stored texts that did not light before.
// The rows that were group 6 (the three plurals) and group 12 (the article row) moved to the new groups 13 and 14; group 15 holds the plurals and article forms that stay quiet ON PURPOSE.
// The test now also compares with what the detector gave at 25e94ca (the four patterns of commit 1, rebuilt below from the same lists): the new detector lights EVERYTHING that one lit (a widening),
// and over the stored corpus it lights NOTHING more than that one did.
//
// Fixtures are synthetic or generic phrases; no user text from a real session is stored.
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extract(name) {
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return CODE.slice(s, CODE.indexOf('\n}', s) + 2);
}
const SRC = extract('detectSafetySignal');
const SRC_START = () => CODE.indexOf('function detectSafetySignal(');
const SRC_TIER = extract('classifyCrisisTier');
assert('detectSafetySignal and classifyCrisisTier are defined in App.jsx', !!SRC && !!SRC_TIER);
let D = null, TIER = null;
try { D = eval('(' + SRC + ')'); TIER = new Function('detectSafetySignal', SRC_TIER + '\nreturn classifyCrisisTier;')(D); } catch (e) { console.log('FAIL — evaluates standalone: ' + e.message); failed++; }
assert('both evaluate standalone, so the suites can lift them without siblings', typeof D === 'function' && typeof TIER === 'function');

// THE GUARD TABLE. [group, what the detector must give NOW: 'D' = lights DISTRESS, '-' = lights nothing, text]. Every row of the groups 1–10 and 12 lit at 9e9828e (the word was there);
// the rows of group 11 did not light then and do not now (gaps that were there before and are not touched here).
const GUARD = [
  // 1 πρώτο πρόσωπο, είδος κρίσης
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω κρίση πανικού.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Είχα κρίση πανικού.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έπαθα κρίση πανικού.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Κρίση πανικού κάθε βράδυ.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω κρίση άγχους.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω κρίση ταυτότητας.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω ψυχολογική κρίση.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω ψυχική κρίση.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω νευρική κρίση.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω υπαρξιακή κρίση.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω ψυχωτική κρίση.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω μανιακή κρίση.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Έχω υστερική κρίση.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Είμαι στα πρόθυρα νευρικής κρίσης.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Είμαι στα πρόθυρα κρίσης πανικού.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Η κρίση ζωής με πνίγει.'],
  ['1 πρώτο πρόσωπο, είδος κρίσης', 'D', 'Περνάω κρίση μέσης ηλικίας.'],
  // 2 πρώτο πρόσωπο, κατάσταση
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Είμαι σε κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Βρίσκομαι σε κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Ήμουν σε κρίση όλο το καλοκαίρι.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Είμαστε σε κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Περνάω κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Περνώ μια κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Έχω μια κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Περνάω μεγάλη κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Είμαι σε μεγάλη κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Βρίσκομαι σε μια κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Είμαι σε μια κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Έχω μια μεγάλη κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Περνάω σοβαρή κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Είμαι σε βαθιά κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Έχω μεγάλη κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Είμαι σε κατάσταση κρίσης.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Βρίσκομαι σε κατάσταση κρίσης.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'ΕΊΜΑΙ ΣΕ ΚΡΊΣΗ.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'είμαι σε κρίση και δεν ξέρω τι να κάνω'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Είμαι ξανά σε κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Έχω περάσει μια μεγάλη κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Περνάω πολύ δύσκολη κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Φοβάμαι ότι θα πέσω σε κρίση.'],
  ['2 πρώτο πρόσωπο, κατάσταση', 'D', 'Περνάμε κρίση ως ζευγάρι.'],
  // 3 πρώτο πρόσωπο, οι φράσεις του John
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Μου ήρθε κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Μου ήρθε μια κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Με έπιασε κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Με έπιασε μια κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Με έπιασε η κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Με έπιασε κρίση νεύρων.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Μπήκα σε κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Σε κρίση είμαι.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Σε μεγάλη κρίση βρίσκομαι.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Έπεσα σε κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Έπαθα κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Πέρασα κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Βρέθηκα σε κρίση.'],
  ['3 πρώτο πρόσωπο, οι φράσεις του John', 'D', 'Μπαίνω σε κρίση.'],
  // 4 πρώτο πρόσωπο, ιατρικές
  ['4 πρώτο πρόσωπο, ιατρικές', 'D', 'Έπαθα επιληπτική κρίση.'],
  ['4 πρώτο πρόσωπο, ιατρικές', 'D', 'Έπαθα καρδιακή κρίση.'],
  ['4 πρώτο πρόσωπο, ιατρικές', 'D', 'Είχα καρδιακή κρίση πέρυσι.'],
  ['4 πρώτο πρόσωπο, ιατρικές', 'D', 'Με έπιασε καρδιακή κρίση.'],
  ['4 πρώτο πρόσωπο, ιατρικές', 'D', 'Έχω κρίση άσθματος.'],
  ['4 πρώτο πρόσωπο, ιατρικές', 'D', 'Έχω κρίση υπέρτασης.'],
  // 5 συγγενής (κλειστή λίστα)
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Η κόρη μου είναι σε κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Ο γιος μου είναι σε κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Το παιδί μου περνάει κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Έχει κρίση ο άντρας μου.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Η γυναίκα μου έχει κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Η μάνα μου έπαθε κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Ο πατέρας μου έπαθε καρδιακή κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Ο αδελφός μου είναι σε κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Η αδελφή μου πέρασε κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Είναι σε κρίση ο γιος μου.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Έχει κρίση πανικού η μάνα μου.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Έπαθε επιληπτική κρίση ο αδερφός μου.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Η κόρη μου τώρα είναι σε κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Ο άντρας μου πέρασε μια μεγάλη κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Η μαμά μου είναι σε κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Ο μπαμπάς μου έπαθε καρδιακή κρίση.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Έπαθε καρδιακή κρίση ο πατέρας μου χθες.'],
  ['5 συγγενής (κλειστή λίστα)', 'D', 'Τη μάνα μου την έπιασε κρίση.'],
  // 6 άλλος, εκτός λίστας
  ['6 άλλος, εκτός λίστας', '-', 'Η φίλη μου περνάει κρίση.'],
  ['6 άλλος, εκτός λίστας', '-', 'Ο φίλος μου έπαθε καρδιακή κρίση.'],
  ['6 άλλος, εκτός λίστας', '-', 'Η γιαγιά μου έπαθε καρδιακή κρίση.'],
  ['6 άλλος, εκτός λίστας', '-', 'Ο συνάδελφός μου είναι σε κρίση.'],
  ['6 άλλος, εκτός λίστας', '-', 'Η οικογένειά μου είναι σε κρίση.'],
  ['6 άλλος, εκτός λίστας', '-', 'Έπαθε κρίση γέλιου η Μαρία.'],
  ['6 άλλος, εκτός λίστας', '-', 'Ο γάμος μας περνάει κρίση.'],
  ['6 άλλος, εκτός λίστας', '-', 'Η εταιρεία μου περνάει κρίση.'],
  ['6 άλλος, εκτός λίστας', '-', 'Ο πρώην μου είναι σε κρίση.'],
  // 7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Έχω καλή κρίση για τους ανθρώπους.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Δεν εμπιστεύομαι πια την κρίση μου.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Θέλω να έχω καλύτερη κρίση όταν γνωρίζω κόσμο.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Θα είχα γενικά πιο καθαρή κρίση στις αποφάσεις μου.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Θέλω να μειώσω την παρορμητική κρίση στις αποφάσεις μου.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Να εμπιστευτώ την κρίση μου.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Η κρίση του δικαστηρίου ήταν δίκαιη.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Η κρίση στη Μέση Ανατολή με αγχώνει.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Στη δουλειά είμαστε σε κατάσταση κρίσης.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Η κρίση της οικογένειας είναι το βάρος, όχι η γιαγιά.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Να μιλήσω στον Νίκο για την κρίση στη δουλειά.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Μου έπιασε κρίση νεύρων με το αφεντικό.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Έπαθε κρίση γέλιου με το αστείο.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'κρίση'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Κρίση.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Η μάνα μου έχει καλή κρίση.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Ο πατέρας μου έχει πολύ καλή κρίση για τους ανθρώπους.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Η κρίση της μάνας μου με πείραξε.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Δεν έχω καλή κρίση.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Η μάνα μου έχει άλλη κρίση για το θέμα.'],
  ['7 κρίση = γνώμη / κόσμος / δικαστήριο / ξέσπασμα', '-', 'Έχω την κρίση μου και δεν αλλάζω γνώμη.'],
  // 8 οικονομική κρίση
  ['8 οικονομική κρίση', '-', 'Είμαι σε οικονομική κρίση.'],
  ['8 οικονομική κρίση', '-', 'Περνάμε οικονομική κρίση και δεν βγαίνει ο μήνας.'],
  ['8 οικονομική κρίση', '-', 'Έχω οικονομική κρίση στην επιχείρηση.'],
  ['8 οικονομική κρίση', '-', 'Ο πατέρας μου είναι σε οικονομική κρίση.'],
  ['8 οικονομική κρίση', '-', 'Η οικονομική κρίση με πνίγει.'],
  ['8 οικονομική κρίση', '-', 'Δεν είναι οικονομική κρίση.'],
  // 9 άρνηση (ανάβει όπως σήμερα)
  ['9 άρνηση (ανάβει όπως σήμερα)', 'D', 'Δεν έχω κρίση πανικού.'],
  ['9 άρνηση (ανάβει όπως σήμερα)', 'D', 'Δεν είμαι σε κρίση.'],
  ['9 άρνηση (ανάβει όπως σήμερα)', 'D', 'Ευτυχώς δεν έπαθα κρίση.'],
  ['9 άρνηση (ανάβει όπως σήμερα)', 'D', 'Η κόρη μου δεν είναι σε κρίση.'],
  ['9 άρνηση (ανάβει όπως σήμερα)', 'D', 'Δεν περνάω κρίση, απλώς βαρέθηκα.'],
  ['9 άρνηση (ανάβει όπως σήμερα)', 'D', 'Τα παιδιά μου δεν είναι σε κρίση.'],
  // 10 αμφίσημες
  ['10 αμφίσημες', 'D', 'Έχω κρίση.'],
  ['10 αμφίσημες', 'D', 'Έχω καλή κρίση, αλλά είμαι σε κρίση.'],
  ['10 αμφίσημες', 'D', 'Είμαι σε κρίση με τη δουλειά μου.'],
  ['10 αμφίσημες', 'D', 'Η κόρη μου έχει κρίση για τη ζωή.'],
  ['10 αμφίσημες', 'D', 'Η μάνα μου λέει ότι περνάει κρίση ο γάμος μας.'],
  // 11 δεν άναβε ούτε σήμερα
  ['11 δεν άναβε ούτε σήμερα', '-', 'Έχω κρίσεις πανικού.'],
  ['11 δεν άναβε ούτε σήμερα', '-', 'ΕΙΜΑΙ ΣΕ ΚΡΙΣΗ'],
  ['11 δεν άναβε ούτε σήμερα', '-', 'ειμαι σε κριση'],
  ['11 δεν άναβε ούτε σήμερα', '-', 'Είναι κρίσιμο να αποφασίσω.'],
  ['11 δεν άναβε ούτε σήμερα', '-', 'Η απόφαση είναι κρίσιμη.'],
  ['11 δεν άναβε ούτε σήμερα', '-', 'Κρίνω τον εαυτό μου αυστηρά.'],
  // 12 γνωστό κενό: σβήνει, ίσως ήταν κρίση
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Η κρίση με πνίγει.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Δεν αντέχω αυτή την κρίση.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Είμαι στα πρόθυρα κρίσης.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Μου έπιασε κρίση νεύρων.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Είμαι 😞 σε κρίση.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Η κόρη μου, που μένει πια μακριά, είναι σε κρίση.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Περνάω την κρίση.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Έπαθα την καρδιακή κρίση.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Οι γονείς μου, μετά το διαζύγιο, είναι σε κρίση.'],
  ['12 γνωστό κενό: σβήνει, ίσως ήταν κρίση', '-', 'Περνάει την κρίση της μέσης ηλικίας ο άντρας μου.'],
  // 13 πληθυντικός συγγενής της κλειστής λίστας (28/11/2026)
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα παιδιά μου περνάνε κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Οι γονείς μου είναι σε κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα αδέλφια μου είναι σε κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα αδέρφια μου έχουν κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Οι γονείς μου πέρασαν μεγάλη κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα παιδιά μου έπαθαν κρίση πανικού.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Έχουν κρίση τα παιδιά μου.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Είναι σε κρίση οι γονείς μου.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα παιδιά μου τώρα είναι σε κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Οι γονείς μου περνούν δύσκολη κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα αδέλφια μου είναι σε βαθιά κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Οι γονείς μου έπεσαν σε κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα παιδιά μου είχαν καρδιακή κρίση.'],
  ['13 πληθυντικός συγγενής (κλειστή λίστα)', 'D', 'Τα παιδιά μου βρίσκονται σε κρίση.'],
  // 14 άρθρο + γνωστό είδος κρίσης (28/11/2026)
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Περνάω την κρίση της μέσης ηλικίας.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Περνάω την κρίση πανικού.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Έχω περάσει την κρίση της ταυτότητας.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Πέρασα την κρίση του άγχους.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Είμαι στην κρίση της μέσης ηλικίας.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Βρίσκομαι ξανά στην κρίση της μέσης ηλικίας.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Ο πατέρας μου περνάει την κρίση της μέσης ηλικίας.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Ο άντρας μου περνάει την κρίση της μέσης ηλικίας.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Τα παιδιά μου περνάνε την κρίση της ταυτότητας.'],
  ['14 άρθρο + γνωστό είδος κρίσης', 'D', 'Αυτή την κρίση πανικού την περνάω μόνος μου.'],
  // 15 πληθυντικά και άρθρα που μένουν σβηστά ΣΚΟΠΙΜΑ (28/11/2026)
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Οι φίλοι μου είναι σε κρίση.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Οι συνάδελφοί μου περνάνε κρίση.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Οι γονείς του φίλου μου είναι σε κρίση.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Τα παιδιά μου έχουν καλή κρίση.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Τα παιδιά μου έχουν τη δική τους κρίση.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Οι γονείς μου έχουν οικονομική κρίση.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Οι γονείς μου λένε ότι έχω καλή κρίση.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Τα αδέλφια μου βρίσκουν την κρίση μου υπερβολική.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Η κρίση των γονιών μου με πείραξε.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Έχω διαβάσει για την κρίση της μέσης ηλικίας.'],
  ['15 σβηστά σκόπιμα (πληθυντικός / άρθρο)', '-', 'Θέλω να καταλάβω την κρίση της μέσης ηλικίας.'],
];

if (typeof D === 'function' && typeof TIER === 'function') {
  // what the detector gave BEFORE this change, for the Greek and the English DISTRESS words (the pattern of 9e9828e, byte for byte)
  const OLD_GREEK = /(πένθος|τραύμα|κατάρρευση|κρίση|κακοποίηση|απώλεια αγαπημένου)/i;
  const ENGLISH = /\b(grief|bereaved|bereavement|trauma|traumatic|abuse|abused|assault|crisis|breakdown|panic attack)\b/i;
  const oldDistress = t => ENGLISH.test(t) || OLD_GREEK.test(t);
  const code = t => { const s = D(t); return s === 'CRISIS' ? TIER(t) : s === 'DISTRESS' ? 'D' : null; };

  // ── 0. THE WORD LISTS AND THE PATTERNS, LIFTED FROM THE SOURCE ───────────────────────────────────────────────────────────────────────────────
  const dStart = CODE.indexOf('const distress = ['), dEnd = CODE.indexOf('\n  ];', dStart);
  const kStart = CODE.indexOf('const kQ = '), kEnd = CODE.indexOf('\n', CODE.indexOf('const kw = ', kStart > 0 ? kStart : 0)) + 1;
  assert('the word lists (kQ, kV, kT, kR, kW, kw — and, since 28/11/2026, kK, kA, kRP, kTP) are in App.jsx, inside detectSafetySignal, before the DISTRESS block', kStart > SRC_START() && kStart < dStart && kEnd > kStart && dEnd > dStart);
  let L = null;
  if (kStart > 0 && kStart < dStart && kEnd > kStart && dEnd > dStart) {
    try { L = new Function(CODE.slice(kStart, kEnd) + CODE.slice(dStart, dEnd + 5) + '\nreturn { kQ, kV, kT, kR, kW, kw, distress, kK: typeof kK === "undefined" ? null : kK, kA: typeof kA === "undefined" ? null : kA, kRP: typeof kRP === "undefined" ? null : kRP, kTP: typeof kTP === "undefined" ? null : kTP };')(); } catch (e) { console.log('FAIL — the lists evaluate standalone: ' + e.message); failed++; }
  }
  assert('the lists and the DISTRESS block evaluate standalone', !!L && Array.isArray(L.distress));
  const inner = (s, re) => { const m = re.exec(s); return m ? m[1].split('|') : null; };
  const same = (a, b) => !!a && a.length === b.length && b.every(x => a.includes(x));
  if (L) {
    assert('the DISTRESS array is: the English pattern, the unchanged Greek words, and FIVE patterns of «κρίση» (7 entries) — the fifth is the plural relatives (28/11/2026)', L.distress.length === 7 && L.distress.every(p => p instanceof RegExp));
    const REL = ['κόρη', 'γιος', 'γιο', 'παιδί', 'άντρας', 'άντρα', 'γυναίκα', 'μάνα', 'μητέρα', 'πατέρας', 'πατέρα', 'μπαμπάς', 'μπαμπά', 'μαμά', 'αδελφός', 'αδελφό', 'αδελφή', 'αδερφός', 'αδερφό', 'αδερφή'];
    assert('THE CLOSED LIST OF RELATIVES, word for word: the 8 relations of John\'s order in their cases, plus the words μητέρα / μαμά / μπαμπάς and the spelling αδερφ- (no plural, no other relation)', same(inner(L.kR, /^\(\?:(.*)\) μου$/), REL));
    const TV = ['είναι', 'βρίσκεται', 'ήταν', 'έχει', 'είχε', 'περνάει', 'περνά', 'πέρασε', 'έπαθε', 'μπήκε', 'μπαίνει', 'έπεσε', 'πέφτει', 'έπιασε'];
    assert('the third-person verbs (only used next to a relative), word for word', same(inner(L.kT, /^\(\?:(.*)\)$/), TV));
    const FV = ['είμαι', 'βρίσκομαι', 'είμαστε', 'βρισκόμαστε', 'ήμουν', 'ήμασταν', 'βρέθηκα', 'έχω', 'είχα', 'περνάω', 'περνώ', 'περνάμε', 'πέρασα', 'περάσω', 'έπαθα', 'πάθω', 'μπήκα', 'μπαίνω', 'μπω', 'έπεσα', 'πέφτω', 'πέσω'];
    assert('the first-person verbs, word for word', same(inner(L.kV, /^\(\?:(.*)\)$/), FV));
    const QW = ['η', 'σε', 'μια', 'μία', 'τέτοια', 'πολύ', 'πάρα', 'ακόμα', 'ξανά', 'μεγάλη', 'σοβαρή', 'βαριά', 'βαθιά', 'τεράστια', 'τρομερή', 'φοβερή', 'έντονη', 'οξεία', 'δύσκολη', 'ξαφνική', 'καρδιακή', 'επιληπτική', 'περάσει', 'πάθει', 'μπει', 'πέσει'];
    assert('the only words allowed between a verb and «κρίση», word for word (the kinds of crisis and its size; the medical «καρδιακή», «επιληπτική»)', same(inner(L.kQ, /^\(\?:\(\?:(.*)\) \)\*$/), QW));
    const pinned = (name, got, want, what) => assert(what, same(got, want));
    assert('the new lists exist in App.jsx: kK (the known kinds), kA (the article), kRP (plural relatives), kTP (their verbs)', typeof L.kK === 'string' && typeof L.kA === 'string' && typeof L.kRP === 'string' && typeof L.kTP === 'string');
    if (typeof L.kRP === 'string' && typeof L.kTP === 'string' && typeof L.kK === 'string' && typeof L.kA === 'string') {
      pinned('kRP', inner(L.kRP, /^\(\?:(.*)\) μου$/), ['γονείς', 'παιδιά', 'αδέλφια', 'αδέρφια'], 'THE CLOSED LIST OF PLURAL RELATIVES, word for word: γονείς, παιδιά, αδέλφια, αδέρφια (+ μου) — nothing else (no friends, no colleagues, no «οικογένεια»)');
      pinned('kTP', inner(L.kTP, /^\(\?:(.*)\)$/), ['είναι', 'βρίσκονται', 'ήταν', 'έχουν', 'είχαν', 'περνάνε', 'περνούν', 'πέρασαν', 'έπαθαν', 'μπήκαν', 'μπαίνουν', 'έπεσαν', 'πέφτουν'], 'the plural verbs (only used next to a plural relative), word for word');
      assert('THE KNOWN KINDS after an article, word for word: πανικού, άγχους, ταυτότητας, ζωής, μέσης ηλικίας (with an optional «του / της» before them)', L.kK === '(?:(?:του|της) )?(?:πανικού|άγχους|ταυτότητας|ζωής|μέσης ηλικίας)');
      assert('THE ARTICLE is allowed only when a known kind follows: (αυτή) την / τη / στην / στη, then «κρίση», then the kinds — as a look-ahead, so the kinds are not consumed', L.kA === '(?:(?:αυτή )?(?:την|τη|στην|στη) (?=κρίση ' + L.kK + '))?');
    }
    const NEVER = ['οικογένεια', 'οικογένειά', 'οικογένειας', 'εταιρεία', 'δικαστήριο', 'δικαστηρίου', 'οικονομική', 'πολιτική', 'καλή', 'κακή', 'σωστή', 'γρήγορη', 'καλύτερη', 'συνολικά', 'δική', 'την', 'τη', 'του', 'της', 'τους', 'άλλη', 'κάποια', 'φίλη', 'φίλος', 'γιαγιά', 'συνάδελφος', 'φίλοι', 'φίλες', 'συνάδελφοι', 'γονιοί', 'εγγόνια', 'ξαδέλφια'];
    const ALL = [].concat(inner(L.kR, /^\(\?:(.*)\) μου$/), inner(L.kT, /^\(\?:(.*)\)$/), inner(L.kV, /^\(\?:(.*)\)$/), inner(L.kQ, /^\(\?:\(\?:(.*)\) \)\*$/), (typeof L.kRP === 'string' ? inner(L.kRP, /^\(\?:(.*)\) μου$/) : []), (typeof L.kTP === 'string' ? inner(L.kTP, /^\(\?:(.*)\)$/) : []));
    assert('none of the words John excluded or that mean judgement / the world / a court is in any list (οικογένεια, εταιρεία, δικαστήριο, οικονομική, καλή, γρήγορη, την/τη…, άλλη, κάποια, φίλη/φίλος…)', NEVER.every(w => !ALL.includes(w)));
  }

  // ── 1. THE GUARD TABLE, row by row ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  for (const [group, exp, t] of GUARD) assert('[' + group.split(' ')[0] + '] «' + t + '» ' + (exp === 'D' ? 'lights DISTRESS' : 'lights nothing'), code(t) === (exp === 'D' ? 'D' : null));
  const grp = n => GUARD.filter(r => r[0].split(' ')[0] === String(n));
  for (let n = 1; n <= 15; n++) {
    const rows = grp(n);
    assert('group ' + n + ' (' + rows[0][0].replace(/^\d+ /, '') + ', ' + rows.length + ' rows): ' + (n === 11 ? 'none of them lit at 9e9828e' : 'every one of them lit at 9e9828e'), rows.length > 0 && rows.every(r => oldDistress(r[2]) === (n !== 11)));
  }
  const lit = GUARD.filter(r => oldDistress(r[2]));
  const kept = lit.filter(r => code(r[2]) === 'D'), quieted = lit.filter(r => code(r[2]) === null);
  assert('THE BALANCE, over the table (UPDATED 28/11/2026: 177 rows, was 141): ' + 114 + ' phrases lit at 9e9828e and still light (+25: the plurals, the article forms, one plural negation); ' + 57 + ' lit and are quiet now (the senses of the order + the known limits of group 12 + the plurals and articles that stay quiet on purpose, group 15); ' + 6 + ' never lit',
    kept.length === 114 && quieted.length === 57 && GUARD.length - lit.length === 6 && GUARD.length === 177);
  assert('EVERY first-person phrase and every medical phrase of the table that lit at 9e9828e still lights (groups 1, 2, 3, 4)', [1, 2, 3, 4].every(n => grp(n).every(r => oldDistress(r[2]) && code(r[2]) === 'D')));
  assert('EVERY phrase about a relative of the closed list still lights (group 5), and the phrases about anybody else do not (group 6: friend, grandmother, colleague, the family, the company, the marriage)', grp(5).every(r => code(r[2]) === 'D') && grp(6).every(r => code(r[2]) === null));
  assert('EVERY plural relative of the closed list lights (group 13, 14 rows), and so does every article form with a known kind (group 14, 10 rows)', grp(13).length === 14 && grp(14).length === 10 && grp(13).concat(grp(14)).every(r => oldDistress(r[2]) && code(r[2]) === 'D'));
  assert('the plurals of anybody else and the articles without a known kind stay quiet ON PURPOSE (group 15, 11 rows), and the known limits stay quiet (group 12, 10 rows)', grp(15).length === 11 && grp(12).length === 10 && grp(15).concat(grp(12)).every(r => oldDistress(r[2]) && code(r[2]) === null));
  assert('the senses of the order are quiet: judgement, the world, a court, a fit (group 7) and the economic crisis (group 8)', grp(7).concat(grp(8)).every(r => oldDistress(r[2]) && code(r[2]) === null));
  assert('the word «οικονομική κρίση» stops lighting: it was DISTRESS at 9e9828e (pinned as «known false DISTRESS»), it is nothing now', OLD_GREEK.test('Είμαι σε οικονομική κρίση.') && D('Είμαι σε οικονομική κρίση.') === null);
  assert('NEGATIONS are not read (that would be new semantic logic): «δεν είμαι σε κρίση» lights as it did, and «δεν έχω καλή κρίση» stays quiet (group 9, group 7)', code('Δεν είμαι σε κρίση.') === 'D' && code('Δεν έχω καλή κρίση.') === null);

  // white space: a double space, a line break, a non-breaking space between the words do not change the result (the old word had no space in it)
  for (const t of ['Είμαι  σε  κρίση.', 'Είμαι σε\nκρίση.', 'Είμαι σε κρίση.', 'Μου\nήρθε κρίση.', 'Η κόρη μου\nείναι σε κρίση.', 'Η κόρη  μου είναι   σε κρίση.', 'Σε κρίση είμαι.', 'Έπαθα  καρδιακή  κρίση.'])
    assert('white space — «' + t.replace(/\n/g, '⏎').replace(/ /g, '⍽') + '» lights DISTRESS', code(t) === 'D');

  // ── 2. A NARROWING, BY CONSTRUCTION AND BY MUTATION ─────────────────────────────────────────────────────────────────────────────────────────
  if (L) {
    const topLevel = src => { const out = []; let depth = 0, cur = ''; for (const ch of src) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === '|' && depth === 0) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
    const kPatterns = L.distress.slice(2);
    const alts = kPatterns.flatMap(p => topLevel(p.source.replace(/^\(/, '').replace(/\)$/, '')));
    const stray = alts.filter(a => !a.includes('κρίση'));
    assert('every top-level alternative of the five «κρίση» patterns contains the stem «κρίση» (' + alts.length + ' alternatives; stray: ' + JSON.stringify(stray) + ')', kPatterns.length === 5 && alts.length > 0 && stray.length === 0);
    assert('the unchanged Greek words are one pattern of their own, byte for byte, without «κρίση»', L.distress[1].source === '(πένθος|τραύμα|κατάρρευση|κακοποίηση|απώλεια αγαπημένου)');
    // mutation: take the stem out of every phrase that lights — nothing lights any more. (A lighting that did not need the stem would show here.)
    const litNow = GUARD.filter(r => code(r[2]) === 'D');
    const mutated = t => t.replace(/κρίση/gi, 'ΧΧΧΧΧ');
    assert('MUTATION: with the stem «κρίση» replaced by another word, none of the ' + litNow.length + ' phrases that light still lights', litNow.length > 0 && litNow.every(r => code(mutated(r[2])) === null));
    // each pattern is needed: there is a phrase that lights through it and through no other of the four
    const only = i => GUARD.filter(r => code(r[2]) === 'D' && kPatterns.every((p, j) => (j === i) === p.test(r[2])));
    for (let i = 0; i < 5; i++) assert('pattern ' + (i + 1) + ' of 5 is needed — ' + only(i).length + ' phrase(s) light through it alone (e.g. «' + (only(i)[0] ? only(i)[0][2] : '') + '»)', only(i).length > 0);
  }

  // ── 3. THE SAFETY PATH IS UNTOUCHED: a CRISIS phrase wins over «κρίση» of any sense, with the tier it always had ────────────────────────────────
  assert('CRISIS wins over the word — «Έχω κρίση και θέλω να πεθάνω.» is CRISIS tier A', D('Έχω κρίση και θέλω να πεθάνω.') === 'CRISIS' && TIER('Έχω κρίση και θέλω να πεθάνω.') === 'A');
  assert('CRISIS wins over the word — «Είμαι σε οικονομική κρίση και δεν αντέχω άλλο.» is CRISIS tier B (10306)', D('Είμαι σε οικονομική κρίση και δεν αντέχω άλλο.') === 'CRISIS' && TIER('Είμαι σε οικονομική κρίση και δεν αντέχω άλλο.') === 'B');
  assert('CRISIS wins over the word — «Η κρίση της οικογένειας με κάνει να θέλω να πεθάνω.» is CRISIS tier A', D('Η κρίση της οικογένειας με κάνει να θέλω να πεθάνω.') === 'CRISIS' && TIER('Η κρίση της οικογένειας με κάνει να θέλω να πεθάνω.') === 'A');
  assert('CRISIS wins over the word — «Η κόρη μου είναι σε κρίση και δεν θέλω να ζω.» is CRISIS tier A', D('Η κόρη μου είναι σε κρίση και δεν θέλω να ζω.') === 'CRISIS' && TIER('Η κόρη μου είναι σε κρίση και δεν θέλω να ζω.') === 'A');
  assert('«κρίση πανικού» together with a CRISIS phrase is still CRISIS A', D('Έχω κρίση πανικού και δεν θέλω να ζω.') === 'CRISIS' && TIER('Έχω κρίση πανικού και δεν θέλω να ζω.') === 'A');
  for (const t of ['Περνάω πένθος.', 'Έχω τραύμα από την παιδική ηλικία.', 'Η κατάρρευση της αγοράς με φοβίζει.', 'Έχω ζήσει κακοποίηση στο σπίτι.', 'Έχασα έναν αγαπημένο — μια απώλεια αγαπημένου.',
    'I am in grief.', 'I had a panic attack.', 'I am in crisis.', 'My car breakdown made me late.'])
    assert('the other DISTRESS words are untouched — «' + t + '» still lights DISTRESS', D(t) === 'DISTRESS');
  assert('ordinary words stay nothing', ['Δεν ξέρω αν πρέπει να αλλάξω δουλειά.', 'Γεια.', '', 'Ναι.', 'Η κόρη μου είναι καλά.', 'Ο πατέρας μου έχει δουλειά.'].every(t => D(t) === null));

  // ── 4. THE STORED BODY OF DATA: the simulated stress-test corpus, with what the detector gave BEFORE (third column) ───────────────────────────────
  const FIX = path.join(__dirname, 'data_sim_corpus_2711.json');
  assert('the fixture data_sim_corpus_2711.json is there', fs.existsSync(FIX));
  if (fs.existsSync(FIX)) {
    const items = JSON.parse(fs.readFileSync(FIX, 'utf8')).items;
    const messages = items.reduce((a, i) => a + i[1], 0);
    assert('the fixture is the whole simulated corpus: 1605 distinct texts, 2612 messages', items.length === 1605 && messages === 2612);
    const rows = items.map(([t, n, old]) => ({ t, n, old, now: code(t) }));
    const changed = rows.filter(r => r.now !== r.old);
    const sum = a => a.reduce((x, r) => x + r.n, 0);
    assert('EXACTLY the 4 simulated «κρίση της οικογένειας» messages change (4 distinct texts, 4 messages)', changed.length === 4 && sum(changed) === 4);
    assert('… each was DISTRESS and is nothing now, and each says «κρίση»', changed.length === 4 && changed.every(r => r.old === 'D' && r.now === null && /κρίση/.test(r.t)));
    assert('… and none of them has a CRISIS phrase or another DISTRESS word in it', changed.length === 4 && changed.every(r => !/πένθος|τραύμα|κατάρρευση|κακοποίηση/i.test(r.t)));
    const emergency = rows.filter(r => r.old === 'A' || r.old === 'B' || (r.old === 'D' && /πένθος/i.test(r.t)));
    assert('the emergency-type messages are 196 (CRISIS 160 + grief 36)', sum(emergency) === 196 && sum(rows.filter(r => r.old === 'A')) === 135 && sum(rows.filter(r => r.old === 'B')) === 25);
    assert('NONE of the 196 changes — every CRISIS tier (A 135, B 25) and every grief message is as before', emergency.every(r => r.now === r.old));
    assert('nothing lights that did not before (0 messages quiet at 9e9828e and lit now)', rows.filter(r => r.old === null && r.now !== null).length === 0);
    assert('nothing lights DISTRESS now that the old DISTRESS patterns did not light (the narrowing property over the whole corpus)', rows.every(r => r.now !== 'D' || oldDistress(r.t)));
    assert('the simulated corpus had 40 DISTRESS messages: 36 grief stay, 4 family-crisis go', sum(rows.filter(r => r.old === 'D')) === 40 && sum(rows.filter(r => r.now === 'D')) === 36);
    assert('the corpus contains the 13 distinct texts with a «κρίσ-/κρίν-» word, and 9 of them were quiet before', (() => { const k = rows.filter(r => /κρίσ|κρίν|κριθ/i.test(r.t)); return k.length === 13 && k.filter(r => r.old === null).length === 9; })());
    assert('the 4 messages of the family\'s crisis are not on the relatives\' list: «κρίση της οικογένειας» never lights, even with the verbs and qualifiers of the lists around it', rows.filter(r => /κρίση της οικογένειας/.test(r.t)).every(r => r.now === null));
  }

  // ── 5. THE CODE: the old pattern is gone; no lookbehind ───────────────────────────────────────────────────────────────────────────────────────
  assert('the old pattern with the bare «κρίση» is gone from App.jsx', !CODE.includes('/(πένθος|τραύμα|κατάρρευση|κρίση|κακοποίηση|απώλεια αγαπημένου)/i,'));
  assert('the unchanged words are one pattern, without «κρίση», in App.jsx exactly once', CODE.split('/(πένθος|τραύμα|κατάρρευση|κακοποίηση|απώλεια αγαπημένου)/i,').length === 2);
  assert('the DISTRESS block builds the five «κρίση» patterns with kw(…), exactly five times', (CODE.slice(dStart, dEnd).match(/\bkw\(/g) || []).length === 5);
  assert('the DISTRESS patterns are still matched on the text as written (the call is unchanged)', CODE.includes('if (distress.some(p => p.test(text))) return "DISTRESS";'));
  assert('no lookbehind was introduced (iPhones before iOS 16.4 would throw)', !/\(\?<[=!]/.test(CODE.slice(kStart > 0 ? kStart : dStart, dEnd)));

  // ── 6. THE EXTENSION OF 28/11/2026 (John's order «ενοποιημένη», step Α1), compared with commit 1 (25e94ca) and with 9e9828e ───────────────────────────────────────────────────────────────────────
  // «25e94ca» below = the four patterns of commit 1, rebuilt from the SAME lists (they are pinned word for word above): patterns 1 and 3 are untouched; patterns 2 and 4 are the same without the article kA.
  const OLD4 = L ? [L.distress[2], L.kw('(' + L.kV + ' ' + L.kQ + 'κρίση|(?:είμαι|βρίσκομαι|ήμουν|βρέθηκα) σε κατάσταση κρίσης)'), L.distress[4], L.kw('(' + L.kR + ',? ' + L.kW + L.kT + ' ' + L.kQ + 'κρίση|' + L.kT + ' ' + L.kQ + 'κρίση,? ' + L.kW + L.kR + ')')] : null;
  const krisi25 = t => !!OLD4 && OLD4.some(p => p.test(t));
  if (L && OLD4) {
    // (a) over the table
    const widenBad = GUARD.filter(r => krisi25(r[2]) && code(r[2]) !== 'D');
    assert('WIDENING ONLY, over the table (' + GUARD.length + ' rows): every phrase that lit at 25e94ca still lights (violations: ' + JSON.stringify(widenBad.map(r => r[2])) + ')', GUARD.length === 177 && widenBad.length === 0);
    const added = GUARD.filter(r => !krisi25(r[2]) && code(r[2]) === 'D');
    assert('WHAT THE EXTENSION ADDS over the table: exactly 22 phrases — the 13 plurals of group 13 that no other pattern lit (the 14th, «κρίση πανικού», lit at 25e94ca through the named kind), the 8 article forms of group 14 that no other pattern lit, and the plural negation of group 9 (no other row changes)',
      added.length === 22 && added.filter(r => r[0].startsWith('13 ')).length === 13 && added.filter(r => r[0].startsWith('14 ')).length === 8 && added.filter(r => r[0].startsWith('9 ')).length === 1);
    assert('nothing of groups 1–8, 10, 11, 12 and 15 changed since 25e94ca: the rows quiet then are quiet now, the rows lit then are lit now', GUARD.filter(r => !/^(9|13|14) /.test(r[0])).every(r => krisi25(r[2]) === (code(r[2]) === 'D')));
    // (b) over the stored simulated corpus (1.605 distinct texts): nothing lights that did not at 25e94ca, and nothing lights that did not at 9e9828e
    const FIX2 = path.join(__dirname, 'data_sim_corpus_2711.json');
    if (fs.existsSync(FIX2)) {
      const texts = JSON.parse(fs.readFileSync(FIX2, 'utf8')).items.map(i => i[0]);
      assert('over the stored corpus (' + texts.length + ' texts): nothing lights now that did not light at 25e94ca (0 new alarms), and everything that lit then still lights', texts.length === 1605 && texts.every(t => krisi25(t) === L.distress.slice(2).some(p => p.test(t))));
      assert('over the stored corpus: nothing that is quiet at 9e9828e lights now (the narrowing property, kept)', texts.every(t => code(t) !== 'D' || oldDistress(t)));
    }
    // (c) a random walk over a vocabulary of the new lists and of ordinary words — widening vs 25e94ca, narrowing vs 9e9828e, and the extension DOES light something there
    const voc = ['κρίση', 'κρίσης', 'είμαι', 'έχω', 'σε', 'μια', 'μεγάλη', 'καλή', 'την', 'τη', 'στην', 'μου', 'η', 'οι', 'τα', 'γονείς', 'παιδιά', 'αδέλφια', 'αδέρφια', 'κόρη', 'γιος', 'φίλοι', 'συνάδελφοι', 'είναι', 'έχουν', 'περνάνε', 'έπαθαν', 'έπαθε', 'πανικού', 'μέσης', 'ηλικίας', 'ταυτότητας', 'οικονομική', 'δεν', 'και', 'της', 'του', 'ζωής', 'οικογένειας', 'αυτή', 'τώρα', 'περνάω', ',', '.'];
    let seed = 28112026; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let wid = 0, nar = 0, extra = 0, N = 20000;
    for (let k = 0; k < N; k++) {
      const len = 2 + Math.floor(rnd() * 7), t = Array.from({ length: len }, () => voc[Math.floor(rnd() * voc.length)]).join(' ').replace(/ ([,.])/g, '$1');
      const now = code(t) === 'D', was25 = krisi25(t);
      if (was25 && !now) wid++;
      if (now && !oldDistress(t)) nar++;
      if (now && !was25) extra++;
    }
    assert('RANDOM WALK, ' + N + ' sentences: 0 phrases lit at 25e94ca and quiet now (widening only), 0 lit now and quiet at 9e9828e (narrowing kept) — and the extension lights something (' + extra + ' sentences)', wid === 0 && nar === 0 && extra > 0);
  }

  // the table, for the report: AURA_TABLE=1 node auratests/test_krisi_narrowing_2711.js
  if (process.env.AURA_TABLE) {
    console.log('\nTABLE — group | phrase | 9e9828e | 25e94ca | now');
    for (const [group, exp, t] of GUARD) console.log([group, t, oldDistress(t) ? 'ανάβει' : '—', krisi25(t) ? 'ανάβει' : '—', code(t) === 'D' ? 'ανάβει' : code(t) === null ? '—' : code(t)].join(' | '));
  }
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
