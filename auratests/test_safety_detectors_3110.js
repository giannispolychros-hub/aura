// AURA — SAFETY DETECTORS (John, 31/10/2026: a safety fix (α), to be done before the 20; ADR «31 Οκτωβρίου (ζ)»). Branch
// `safety-detectors` from main 24aab8e. Only the two detectors in src/App.jsx change — detectSafetySignal (one's own harm) and
// detectsDangerFromOther (danger from another person). The prompt (b5f303cc9405aa21), api/aura.js, the order of the safety checks in
// handleSubmit, the crisis and danger lines and their numbers do not change: no new sentence and no new number on the screen.
// What was found (31/10, free, from the code): 20 of 30 synthetic danger phrases with no named person (item 117), the five passive-
// ideation phrases S5–S9 and «θα ήταν πιο απλό να μην υπάρχω καθόλου» matched nothing — no latch, no line, Stage A's root card stays
// open, and the per-turn note even told the model «none of SAFETY … apply this turn». Only the model's own reply stood between them
// and the user.
// The fix: NARROW, CLOSED patterns, each tied to the phrases below. The detectors do not become general.
//  (Α) the phrases, written BEFORE the code (synthetic; no words of any real session)
//  (Β) every phrase that must be caught is caught, by the right detector and kind
//  (Γ) the line the app already writes for each: crisis tier A → 1018 + 112; danger to the person writing → 112 + 15900; to a child → 112 + 1056
//  (Δ) ≥60 phrases with no danger: no new alarm; the two known false alarms of main are left exactly as they are (item 124 untouched)
//  (Ε) nothing else in src/App.jsx changed; api/aura.js and the prompt fingerprint unchanged
//  (Ζ) what main already caught is still caught; no lookbehind (old iPhones)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
function extract(name) { const s = CODE.indexOf('function ' + name + '('); const e = CODE.indexOf('\n}', s) + 2; return s < 0 ? '' : CODE.slice(s, e); }
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);

let crisis = null, tier = null, danger = null, crisisLine = null, dangerLine = null;
try {
  const helplines = CODE.slice(CODE.indexOf('const HELPLINES = ['), CODE.indexOf('\n];', CODE.indexOf('const HELPLINES = [')) + 3);
  crisis = new Function(extract('detectSafetySignal') + '\nreturn detectSafetySignal;')();
  tier = new Function('detectSafetySignal', extract('classifyCrisisTier') + '\nreturn classifyCrisisTier;')(crisis);
  danger = new Function(extract('detectsDangerFromOther') + '\nreturn detectsDangerFromOther;')();
  crisisLine = new Function(extract('buildCrisisLine') + '\nreturn buildCrisisLine;')();
  dangerLine = new Function(helplines + '\n' + extract('buildDangerLine') + '\nreturn buildDangerLine;')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
assert('(Α) the detectors and the two line builders load from src/App.jsx', [crisis, tier, danger, crisisLine, dangerLine].every(f => typeof f === 'function'));

// ── (Α) THE PHRASES, written before the code ─────────────────────────────────────────────────────────────────────────────────────
// danger from another person, to the person writing: the 20 that main missed (item 117), then variants (past tense, no accents,
// capitals, greeklish, «του / της», «τον / την»)
const DANGER_SELF = [
  "Με χτυπάει.", "Με απειλεί.", "Με φοβίζει στο σπίτι.", "Με βρίζει και με σπρώχνει.",
  "Με κλειδώνει μέσα.", "Μου παίρνει το κινητό και με χτυπάει.", "Μου έσπασε το χέρι.", "Λέει ότι θα με σκοτώσει αν φύγω.",
  "Με βιάζει.", "Δεν με αφήνει να βγω από το σπίτι.", "Με χτύπησε μπροστά στο μωρό.", "Με τραβάει από τα μαλλιά.",
  "Κάθε βράδυ με χτυπάει.", "Έχω μελανιές από τις μπουνιές του.", "me xtypaei", "Ζω με φόβο, με χτυπάει.",
  "Σήμερα πάλι σήκωσε χέρι.", "Με πετάει πράγματα.", "με χτυπαει", "ΜΕ ΧΤΥΠΑΕΙ",
  "Με χτύπησε.", "Με χτυπούσε κάθε βράδυ.", "με απειλει", "Με απείλησε.",
  "Με φοβίζει μέσα στο σπίτι.", "Με έσπρωξε.", "Με κλείδωσε μέσα.", "Μου έσπασε τη μύτη.",
  "Λέει ότι θα με σκοτώσει αν τον αφήσω.", "Λέει ότι θα με σκοτώσει αν την αφήσω.", "Θα με σκοτώσει αν πάω στην αστυνομία.", "με βιαζει",
  "Δεν με αφηνει να βγω απο το σπιτι.", "Με χτύπησε μπροστά στα παιδιά.", "Με τράβηξε από τα μαλλιά.", "Έχω μελανιές από τις μπουνιές της.",
  "Σήκωσε χέρι πάνω μου.", "Μου πετάει πιάτα.", "me xtypise", "Kathe vrady me xtypaei.",
];
// danger to a child
const DANGER_CHILD = [
  "Χτυπάει το παιδί.", "Χτυπάει τα παιδιά όταν θυμώνει.", "Χτύπησε τα παιδιά.", "χτυπαει το παιδι",
  "Χτυπάει το μωρό όταν πίνει.",
];
// passive ideation: S5–S9, «θα ήταν πιο απλό να μην υπάρχω καθόλου», then variants (accents, capitals, μη/μην, ποτέ/πια, του/της, greeklish)
const PASSIVE = [
  "θα προτιμούσα να μην ζω", "μακάρι να μην ξύπναγα", "μακάρι να μην είχα ξυπνήσει", "καλύτερα να μη ζω άλλο έτσι",
  "θα ήταν καλύτερα να είχα πεθάνει στη θέση του", "θα ήταν πιο απλό να μην υπάρχω καθόλου", "Θα προτιμούσα να μην ζω.", "θα προτιμουσα να μη ζω",
  "Θα προτιμούσα να μη ζω πια.", "Μακάρι να μην ξύπναγα.", "μακαρι να μην ξυπναγα ποτε", "Μακάρι να μην είχα ξυπνήσει.",
  "Καλύτερα να μη ζω άλλο έτσι.", "Καλύτερα να μην ζω έτσι.", "Θα ήταν καλύτερα να είχα πεθάνει στη θέση της.", "θα ηταν καλυτερα να ειχα πεθανει στη θεση του",
  "Θα ήταν πιο απλό να μην υπάρχω.", "Θα ήταν πιο εύκολο να μην υπάρχω καθόλου.", "θα ηταν πιο απλο να μην υπαρχω καθολου", "Μακάρι να μην υπάρχω.",
  "Θα προτιμούσα να μην είχα γεννηθεί.", "ΘΑ ΠΡΟΤΙΜΟΥΣΑ ΝΑ ΜΗΝ ΖΩ", "tha protimousa na min zw", "makari na min ksypnaga",
];
// NO danger: the 30 of item 117, the ones John named («με χτυπάει το κρύο», «δεν αντέχω άλλο τη βάρδια», «θα ήταν πιο απλό να μην είχα τόση
// δουλειά»), and the same words in everyday sentences — a subject that is a thing, «να» after the verb, a game, a class, a hairdresser
const NO_DANGER = [
  "Με χτυπάει το κρύο.", "Με χτυπάει ο ήλιος στο μπαλκόνι.", "Με χτυπάει το παπούτσι.", "Με απειλεί η προθεσμία.",
  "Με φοβίζει το σκοτάδι στο σπίτι.", "Με φοβίζει η ιδέα να αλλάξω δουλειά.", "Με σπρώχνει να γραφτώ στο γυμναστήριο.", "Με κλειδώνει έξω το σύστημα της τράπεζας.",
  "Μου χτύπησε το τηλέφωνο.", "Χτυπάει το ξυπνητήρι στις έξι.", "Με έδειρε στο τάβλι.", "Με πνίγει η δουλειά.",
  "Μου έσπασε το κινητό.", "Το παιδί χτυπάει την μπάλα στον τοίχο.", "Τα παιδιά χτυπάνε τα κουδούνια.", "Η πόρτα χτυπάει με τον αέρα.",
  "Λέει ότι θα με σκοτώσει αν αργήσω ξανά, αστειευόμενη.", "Με κακοποιεί το πρόγραμμα της σχολής, γελάω.", "Με κουράζει ο ήχος.", "Δεν με αφήνει να ησυχάσω η σκέψη.",
  "Με χτύπησε η αλλεργία.", "Με τραβάει η θάλασσα.", "Κάθε βράδυ με χτυπάει η αϋπνία.", "Έχω μελανιές από το ποδόσφαιρο.",
  "me xtypaei to krio", "Με απείλησε το αφεντικό ότι θα κόψει το μπόνους.", "Ζω με άγχος για τις εξετάσεις.", "Σήμερα σήκωσα χέρι στη συνέλευση.",
  "Μου πετάει τα ρούχα στο πάτωμα ο σκύλος.", "Θα με σκοτώσει η μάνα μου αν μάθει ότι έφαγα το γλυκό.", "Ο ήλιος με χτυπάει στο μάτι.", "Το παπούτσι με χτυπάει.",
  "Δεν με χτυπάει.", "Με χτυπάει στα νεύρα.", "Με χτύπησε η πόρτα.", "Με απειλεί με απόλυση.",
  "Με φοβίζει η ιδέα να μείνω μόνη στο σπίτι.", "Με σπρώχνει μπροστά η μάνα μου.", "Κλείδωσα μέσα τα κλειδιά.", "Έσπασα το χέρι μου στο σκι.",
  "Χτυπάει το τηλέφωνο.", "Με βιάζει να τελειώσω την αναφορά.", "Με βιάζει ο χρόνος.", "Δεν με αφήνει η μάνα μου να βγω έξω απόψε.",
  "Έχω μελανιές από τις μπουνιές του στην προπόνηση μποξ.", "Ο μαθητής σήκωσε χέρι.", "Σήκωσε χέρι στην τάξη για να ρωτήσει.", "Μου πετάει τη μπάλα να παίξουμε.",
  "Μου έσπασε τα νεύρα.", "Μου έσπασε την καρδιά.", "Θα ήταν πιο απλό να μην είχα τόση δουλειά.", "Θα προτιμούσα να μην ζω με τους γονείς μου.",
  "Θα προτιμούσα να μη ζω στην Αθήνα.", "Μακάρι να μην ξύπναγα τόσο νωρίς.", "Μακάρι να μην είχα ξυπνήσει τόσο αργά.", "Καλύτερα να μη ζω άλλο σε αυτό το σπίτι.",
  "Θα ήταν καλύτερα να είχα πεθάνει στο γέλιο.", "Θα ήταν πιο εύκολο να μην υπάρχω στο γκρουπ του γραφείου.", "Μακάρι να μην υπάρχει κίνηση αύριο.", "Θα προτιμούσα να μην ξυπνάω τόσο νωρίς.",
  "Δεν αντέχω άλλο τη βάρδια.", "Το σκυλί με κλειδώνει έξω από την κουζίνα.", "Με σπρώχνει ο κόσμος στο μετρό.", "Μου έσπασε το χέρι ο φυσιοθεραπευτής με την άσκηση.",
  "Η γάτα μου πετάει πράγματα από το τραπέζι.",
];
// the two phrases of NO_DANGER that main already alarms on — kept exactly as they are (item 124 and the «γελάω» case of item 117)
const KNOWN_ON_MAIN = { 'Δεν αντέχω άλλο τη βάρδια.': 'CRISIS/B', 'Με κακοποιεί το πρόγραμμα της σχολής, γελάω.': 'danger/self' };

assert('(Α) 45 danger phrases (40 to the person writing, 5 to a child)', DANGER_SELF.length === 40 && DANGER_CHILD.length === 5);
assert('(Α) 24 passive-ideation phrases, the six named first', PASSIVE.length === 24 && PASSIVE[0] === 'θα προτιμούσα να μην ζω' && PASSIVE[5] === 'θα ήταν πιο απλό να μην υπάρχω καθόλου');
assert('(Α) at least 60 phrases with no danger', NO_DANGER.length >= 60);
const all = DANGER_SELF.concat(DANGER_CHILD, PASSIVE, NO_DANGER);
assert('(Α) no phrase appears twice', new Set(all).size === all.length);

if ([crisis, tier, danger, crisisLine, dangerLine].every(f => typeof f === 'function')) {
  // ── (Β) caught, by the right detector ──────────────────────────────────────────────────────────────────────────────────────────
  for (const t of DANGER_SELF) { const d = danger(t); assert('(Β) danger to the person writing: «' + t + '»', !!d && d.self === true); }
  for (const t of DANGER_CHILD) { const d = danger(t); assert('(Β) danger to a child: «' + t + '»', !!d && d.child === true); }
  for (const t of PASSIVE) assert('(Β) passive ideation is a crisis, tier A: «' + t + '»', crisis(t) === 'CRISIS' && tier(t) === 'A');
  // ── (Γ) the line the app already writes — the existing texts, no new sentence, no new number ─────────────────────────────────
  const A = crisisLine('A', '', false).line;
  assert('(Γ) tier A line is the existing one (1018, 112)', A === 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.');
  const self = dangerLine({ self: true, child: false }, '', []).line, child = dangerLine({ self: false, child: true }, '', []).line;
  assert('(Γ) danger line to the person writing is the existing one (112, 15900)', /(?:^|\D)112(?!\d)/.test(self) && /15900/.test(self) && !/1056/.test(self));
  assert('(Γ) danger line to a child is the existing one (112, 1056)', /(?:^|\D)112(?!\d)/.test(child) && /1056/.test(child) && !/15900/.test(child));
  // ── (Δ) no new alarm ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  for (const t of NO_DANGER) {
    const c = crisis(t), d = danger(t), got = c === 'CRISIS' ? 'CRISIS/' + tier(t) : d ? 'danger/' + (d.self ? 'self' : 'child') : 'none';
    assert('(Δ) ' + (KNOWN_ON_MAIN[t] ? 'unchanged from main (' + KNOWN_ON_MAIN[t] + ')' : 'no alarm') + ': «' + t + '»', got === (KNOWN_ON_MAIN[t] || 'none'));
  }
  assert('(Δ) item 124 untouched: «δεν αντέχω άλλο τη βάρδια της νύχτας» is still a crisis, tier B, as on main', crisis('Το πρόβλημα το ξέρω ήδη: δεν αντέχω άλλο τη βάρδια της νύχτας.') === 'CRISIS' && tier('Δεν αντέχω άλλο τη βάρδια της νύχτας.') === 'B');
  // ── (Ζ) what main caught is still caught ──────────────────────────────────────────────────────────────────────────────────────
  const BEFORE = ['Με χτυπάει όταν πίνει.', 'Με απειλεί ότι θα με σκοτώσει.', 'Με σπρώχνει στον τοίχο.', 'Φοβάμαι να γυρίσω σπίτι, θα με δείρει πάλι.',
    'Με έδειρε χθες.', 'Με έπνιξε με τα χέρια του.', 'Με απειλεί με μαχαίρι.', 'Με κακοποιεί.', 'Με απείλησε ότι θα πάρει τα παιδιά και θα με σκοτώσει.',
    'Θα με δείρει αν το μάθει.', 'Με χτυπάει ο άντρας μου.', 'Με τράβηξε από τα μαλλιά.'];
  for (const t of BEFORE) assert('(Ζ) still danger: «' + t + '»', !!danger(t));
  const CRISIS_BEFORE = ['Θέλω να πεθάνω.', 'Δεν θέλω να ζω.', 'Θα ήταν καλύτερα να μην ζω.', 'Μακάρι να μην ξυπνούσα.', 'Καλύτερα να πέθαινα.',
    'thelo na pethano', 'Δεν αντέχω άλλο.', 'Σκέφτομαι να βάλω τέλος στη ζωή μου απόψε.'];
  for (const t of CRISIS_BEFORE) assert('(Ζ) still a crisis: «' + t + '»', crisis(t) === 'CRISIS');
  assert('(Ζ) tiers unchanged: «Δεν αντέχω άλλο.» B, «Θέλω να πεθάνω.» A', tier('Δεν αντέχω άλλο.') === 'B' && tier('Θέλω να πεθάνω.') === 'A');
}
// ── (Ε) nothing else changed ───────────────────────────────────────────────────────────────────────────────────────────────────────
const cut = (s, n) => { const a = s.indexOf('\nfunction ' + n + '('); const e = s.indexOf('\n}', a + 1) + 2; return s.slice(0, a + 1) + 'function ' + n + '(){}' + s.slice(e); };
assert('(Ε) src/App.jsx outside the two detectors is byte-identical to main 24aab8e', h(cut(cut(raw, 'detectSafetySignal'), 'detectsDangerFromOther')) === '81472788a4552b9d');
assert('(Ε) api/aura.js is byte-identical to main 24aab8e', h(fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8')) === 'c2ce3892c094224d');
const fp = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8').match(/core: \{ length: \d+, sha256: "([0-9a-f]{16})/);
assert('(Ε) the prompt fingerprint is still b5f303cc9405aa21', !!fp && fp[1] === 'b5f303cc9405aa21');
assert('(Ζ) no lookbehind in the two detectors (old iPhones)', !/\(\?<[=!]/.test(extract('detectSafetySignal') + extract('detectsDangerFromOther')));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
