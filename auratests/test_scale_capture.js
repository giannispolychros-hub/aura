// ── CLARITY + OWNERSHIP SCALE — CAPTURE CHAIN ───────────────────────────────
// Real session, 2026-09-22. AURA asked the late clarity question as:
//
//     "Πόσο ξεκάθαρο νιώθεις τι θέλεις να κάνεις τώρα, από το 1 έως το 10;"
//
// Same words as the canonical "decide" variant, reordered, with «νιώθεις» for
// «είναι». detectsOutcomeScaleAsked pinned the literal prefix «τώρα, πόσο
// ξεκάθαρο είναι», so it returned false — and that one false is the whole
// chain: outcomeScaleAsked never flips, lateReliefJustAsked never arms,
// extractTwoNumbers is never reached, lateReliefValue/ownershipValue stay null,
// and the paywall card falls back to the copy that shows no numbers at all.
// The failure is silent end to end: nothing logs, nothing throws, the user
// simply never sees their own two numbers.
//
// The prompt (CLARITY + OWNERSHIP SCALE, and EXPRESSIVE VARIATION above it)
// asks the model to vary its wording everywhere. A detector that only accepts
// one exact word order is asking the model not to do the thing the prompt
// tells it to do. This suite pins paraphrase tolerance WITHOUT letting the
// late detector swallow the EARLY question, which shares almost every word.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsEarlyReliefAsked'));
eval(extract('detectsOutcomeScaleAsked'));
eval(extract('extractTwoNumbers'));
eval(extract('extractReliefNumber'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

// The exact string from the live session.
const LIVE = "Πόσο ξεκάθαρο νιώθεις τι θέλεις να κάνεις τώρα, από το 1 έως το 10;";

// ── 1. The reported defect ──────────────────────────────────────────────────
assert("LIVE 2026-09-22 wording is recognised as the late scale question",
  detectsOutcomeScaleAsked(LIVE) === true);

// ── 2. The chain, not just the boolean ──────────────────────────────────────
// Mirrors src/App.jsx: detectsOutcomeScaleAsked arms lateReliefJustAsked, and
// that ref is the ONLY path to extractTwoNumbers. Asserting the boolean alone
// would not prove the numbers actually arrive.
function simulateCapture(auraText, userReply) {
  let outcomeScaleAsked = false, lateReliefJustAsked = false;
  let clarity = null, ownership = null;
  if (!outcomeScaleAsked && detectsOutcomeScaleAsked(auraText)) {
    outcomeScaleAsked = true; lateReliefJustAsked = true;
  }
  if (lateReliefJustAsked) {
    const { first, second } = extractTwoNumbers(userReply);
    if (first !== null) clarity = first;
    if (second !== null) ownership = second;
    lateReliefJustAsked = false;
  }
  return { outcomeScaleAsked, clarity, ownership };
}
const lived = simulateCapture(LIVE, "7 και 8");
assert("chain: paraphrased question still captures the clarity number", lived.clarity === 7);
assert("chain: paraphrased question still captures the ownership number", lived.ownership === 8);
assert("chain: a question that was never asked captures nothing",
  simulateCapture("Τι σπουδές σκέφτεσαι;", "7 και 8").clarity === null);

// ── 3. Canonical forms must not regress ─────────────────────────────────────
assert("canonical decide variant still detected",
  detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10;") === true);
assert("canonical solve variant still detected",
  detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα, από το 1 έως το 10;") === true);
assert("canonical understand variant still detected",
  detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι αυτό που προσπαθούσες να καταλάβεις, από το 1 έως το 10;") === true);
assert("hardcoded override wording (App.jsx) still detected",
  detectsOutcomeScaleAsked("Πριν προχωρήσουμε — τώρα, πόσο ξεκάθαρο είναι αυτό, από το 1 έως το 10; Και πόσο αισθάνεσαι ότι αυτό που βρήκες είναι δική σου σκέψη ή επιλογή, από το 1 έως το 10;") === true);

// ── 4. THE COLLISION THAT MATTERS ───────────────────────────────────────────
// EARLY and LATE share nearly every word; only the time-marker separates them.
// A late detector loose enough to catch the live paraphrase must still refuse
// all three EARLY variants, or the baseline question would be recorded as the
// closing one and the before/after pair would collapse into a single number.
assert("EARLY decide variant NOT matched by late detector",
  detectsOutcomeScaleAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10;") === false);
assert("EARLY solve variant NOT matched by late detector",
  detectsOutcomeScaleAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα που πρέπει να λύσεις, από το 1 έως το 10;") === false);
assert("EARLY understand variant NOT matched by late detector",
  detectsOutcomeScaleAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι τι πραγματικά προσπαθείς να καταλάβεις, από το 1 έως το 10;") === false);
assert("EARLY detector itself is untouched and still fires",
  detectsEarlyReliefAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10;") === true);
assert("EARLY detector does not claim the live LATE paraphrase",
  detectsEarlyReliefAsked(LIVE) === false);

// ── 5. Must NOT become a catch-all ──────────────────────────────────────────
// Loosening a detector is how a guard goes vacuous. These are the realistic
// neighbours from real transcripts — ordinary AURA turns that mention clarity,
// or a number, or "τώρα", but are not the scale question.
assert("ordinary question mentioning clarity is not the scale",
  detectsOutcomeScaleAsked("Ποιο από τα δύο σε πιέζει περισσότερο αυτή τη στιγμή;") === false);
assert("a reply containing a 1-10 range but no clarity question is not the scale",
  detectsOutcomeScaleAsked("Διδακτορικό για διεύθυνση — 10+ χρόνια, χωρίς άμεσο εισόδημα.") === false);
assert("'τώρα' alone is not the scale",
  detectsOutcomeScaleAsked("Τι μπορεί ρεαλιστικά να γίνει τώρα;") === false);
assert("clarity wording without any scale is not the scale",
  detectsOutcomeScaleAsked("Πόσο ξεκάθαρο σου φαίνεται τώρα αυτό;") === false);
assert("the ownership half alone does not count as the scale question",
  detectsOutcomeScaleAsked("Και πόσο αισθάνεσαι ότι αυτό που βρήκες είναι δική σου σκέψη ή επιλογή, από το 1 έως το 10;") === false);
// No time-marker at all — genuinely ambiguous between the baseline and the closing question.
// The conservative answer is "not the late one": a wrong TRUE here would record the baseline as
// the closing number, which is worse than a missed capture because it silently fabricates a delta.
assert("clarity + scale with NO time marker is conservatively NOT the late scale",
  detectsOutcomeScaleAsked("Πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10;") === false);
// A PARAPHRASED EARLY question can carry both markers — the model rewording EARLY CLARITY
// BASELINE may well reach for «τώρα» while keeping its own «αυτή τη στιγμή» opening. When both
// appear outside the canonical late prefix, the early opener governs: this is the baseline, and
// recording it as the closing number would fabricate a delta out of a single measurement.
// (Found by mutation: without this fixture the early-marker veto was vacuous, since the plain
// EARLY variants are already excluded by the time-marker requirement alone.)
assert("paraphrased EARLY carrying both markers is still NOT the late scale",
  detectsOutcomeScaleAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο νιώθεις τι θέλεις να κάνεις τώρα, από το 1 έως το 10;") === false);
// The canonical prefix is authoritative and must outrank the early-marker veto, not merely be
// checked before it — a closing turn is free to mention the opening moment in the same message.
assert("canonical prefix wins even when the message also contains the early marker",
  detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10; Αυτή τη στιγμή μετράει, όχι πώς ξεκίνησες.") === true);
assert("empty / non-string input is false, never a throw",
  detectsOutcomeScaleAsked("") === false && detectsOutcomeScaleAsked(null) === false && detectsOutcomeScaleAsked(undefined) === false);

// ── 6. Live session as a whole ──────────────────────────────────────────────
// Every other AURA turn from the 2026-09-22 transcript must stay false, so the
// suite proves the detector fires ONCE on the real session, not that it fires.
const LIVE_OTHER_AURA_TURNS = [
  "Νοσηλευτική στο εξωτερικό είναι από τα πιο εύκολα να μεταφερθούν — υπάρχει ζήτηση παντού.\n\nΠριν πάμε παρακάτω: το εξωτερικό το σκέφτεσαι ως οικογένεια ή μόνος/η;",
  "Με 4 παιδιά και σχεδόν διπλάσιο μισθό εκεί — το οικονομικό κίνητρο είναι πραγματικό.\n\nΤι είναι αυτό που σε κρατά ακόμα εδώ;",
  "Από τη μία «δεν φτάνουν τα χρήματα», από την άλλη «τα πάντα είναι εδώ».\n\nΠοιο από τα δύο σε πιέζει περισσότερο *αυτή τη στιγμή*;",
  "Δύο δρόμοι φαίνονται στο τραπέζι: δεύτερη δουλειά στη Θεσσαλονίκη, ή μετανάστευση οικογενειακά.",
  "Τι σπουδές σκέφτεσαι;",
  "Δύο διαφορετικοί στόχοι: γρήγορο εισόδημα ή μακροπρόθεσμη εξέλιξη.",
  "Τι μπορεί ρεαλιστικά να γίνει βράδυ — σπουδές ή κάτι που φέρνει εισόδημα τώρα;",
  "Τι σπουδές — το έχεις στενέψει κάπου;",
  "Διδακτορικό για διεύθυνση — 10+ χρόνια, χωρίς άμεσο εισόδημα.\nΨυχολογία — 4-5 χρόνια, μετά δυνατότητα ιδιωτικών συνεδριών.",
  "Αυτό είναι το πραγματικό μπλόκο πριν οποιαδήποτε απόφαση.",
  "Οικονομικά λυμένα, ψυχολογικά βάρη — αυτά τα ψυχολογικά βάρη, πώς τα φαντάζεσαι συγκεκριμένα;",
  "Και αν έμενες στην Ελλάδα με λιγότερα χρήματα από όσα χρειάζεσαι — τι θα σε βάραινε εκεί;",
  "Ανάμεσα στα δύο αυτά βάρη, ποιο είσαι πιο διατεθειμένος να σηκώσεις;",
  "Εύλογο — δεν έχεις φτάσει ακόμα στο σημείο που πιέζει αρκετά.\n\nΤι θα έπρεπε να αλλάξει στα οικονομικά για να νιώσεις ότι η απόφαση δεν μπορεί να περιμένει;",
  "Το επόμενο βήμα που ανέφερες — να ελέγξεις αν επιτρέπεται η ιδιωτική άσκηση ως δημόσιος — αυτό μπορεί να γίνει σύντομα;",
  "Δίκιο έχεις.\n\nΈνα πράγμα μένει να γίνει πριν οποιαδήποτε άλλη απόφαση: ο έλεγχος για την άδεια ιδιωτικής άσκησης.",
  "Και στον εαυτό σου — το ίδιο το επιτρέπεις;",
  "Τότε το βήμα είναι ένα: ο έλεγχος για την άδεια.\n\nΚαλή συνέχεια.",
];
assert("live session: exactly one AURA turn is the scale question, and it is the reported one",
  LIVE_OTHER_AURA_TURNS.filter(t => detectsOutcomeScaleAsked(t)).length === 0 && detectsOutcomeScaleAsked(LIVE) === true);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
