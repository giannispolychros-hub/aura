// ── UNSOURCED OPTION OFFER: the guard that was missing on 2026-09-22 ────────
//
// THE HARM THIS EXISTS FOR. A teacher on 1300€ with four children was handed three careers he
// had never raised. Running every output-side guard we owned against that exact reply:
//
//     detectOutputViolation            → null
//     detectOutputViolation (roadDue)  → null
//     looksLikeAdviceCascade           → false
//
// The clearest No-Advice violation in the product's history, and nothing saw it. The reason is
// structural, not a tuning miss: every one of those guards keys on GRAMMATICAL FORM — an
// imperative verb (πάρε, κάνε, μίλησε) or a bulleted list. The violation was a DECLARATIVE
// sentence with comma-separated options: "Υπάρχουν μερικές κατευθύνσεις … — Χ, Υ, ή Ζ." That is
// the most natural way for a fluent Greek model to offer options, and it walked through
// every brake we had.
//
// WHY PROVENANCE IS THE ONLY DISCRIMINATOR, AND WHY IT IS NOT A DESIGN PREFERENCE. Two replies
// from the SAME session, three turns apart, have identical grammar — a category noun plus an
// enumeration:
//
//   A01  "αυτό που περιγράφεις — νοσηλευτική, ειδική αγωγή, σπουδές, κομμωτική, e-food —
//         είναι πολλές διαφορετικές κατευθύνσεις"        ← LEGITIMATE. His own list, mirrored.
//   A00  "Υπάρχουν μερικές κατευθύνσεις που αξίζει να ξέρεις ότι υπάρχουν: …"
//                                                        ← VIOLATION. Every item is AURA's.
//
// Nothing lexical separates them. Only WHOSE WORDS THE ITEMS ARE. That is Zero Inference and the
// Mirror Rule stated operationally, and it is the same test classifyRoadProvenance already
// applies to road maps — this extends it to prose, which had no audit at all.
//
// TWO MEASUREMENTS DECIDED THIS SHAPE, and both killed a design that looked obviously right:
//
//   1. A whole-reply word-overlap ratio does NOT separate. Measured: violations at 0.0% and
//      3.8%, but a legitimate road map at 4.8% and a legitimate "Πριν δώσω ιδέες — …" refusal
//      at 7.1%, against legitimate mirrors at 33%. Any threshold in 4-7% would have flagged two
//      correct replies. So provenance must be the LAST filter, never the first: the frame and the
//      enumeration have to qualify a reply before whose-words-are-these is even asked.
//   2. Prefix matching for Greek inflection — which looks mandatory, since "ειδικής" and
//      "ειδική" are the same word — destroys the detector outright. Measured per item:
//
//           exact token   A00 0/6   B41 0/3   A01 2/5     ← separates cleanly
//           prefix-5      A00 5/6   B41 2/3   A01 3/5     ← no separation at all
//
//      "Εκπαίδευση φροντιστών" becomes "sourced" because he had said "εκπαιδευτικός". So the
//      match is EXACT, and the bar is not a tuned threshold but ZERO: flag only when NOT ONE of
//      the presented options came from the user's own words.
//
// OBSERVATION ONLY, DELIBERATELY. Stage one counts; it never rewrites or blocks a reply. A brake
// that fires wrongly on a real user in distress is itself harm, and we have 8 labelled examples,
// not 800. Telemetry decides whether it ever gates.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('parseRoadMap'));
eval(extract('detectsUnsourcedOptionOffer'));

let passed = 0, failed = 0;
function assert(name, cond) { if (cond) { passed++; console.log("PASS — " + name); } else { failed++; console.log("FAIL — " + name); } }

// ── REAL TRANSCRIPT FIXTURES ───────────────────────────────────────────────
// User turns only, verbatim (voice-transcription noise included — that is what production sees).
// Session A: nurse/teacher, four children. Session B: the teacher the lens broke.
const A_USER = [
 "θέλω κάτι να με βοηθήσεις",
 "δεν ξέρω και ποιες είναι νόμοι μέσα από αυτές γιατί είμαι δημόσιος υπάλληλος δεν ξέρω κατά ποιες από αυτές είναι νόμιμες",
 "σκέφτομαι όμως και τον ενδεχόμενο όπως είπα να ξανασπου βάσω δεν ξέρω όμως πάνω σε τι είτε δηλαδή να επεκτείνω τις γνώσεις μου γιατί είμαι εκπαιδευτικός νοσηλευτικής αυτή τη στιγμή στην ειδική αγωγή ταυτόχρονα όλα αυτό δηλαδή κάποια extra χρήματα κάποιος κλάδος ταυτόχρονα άνοιγα οτιδήποτε δεν ξέρω άλλη σχόλιο εντελώς στίχοι δεν ξέρω κομμωτική δεν ξέρω τι να κάνω θέλω κάτι το οποίο να με βγάλει αυτό το αυτή τη λούπα",
];
const B_USER = [
 "Είμαι εκπαιδευτικός στη νοσηλευτική στο τμήμα ειδικής αγωγής, νεοδιοριστος. Βλέπω πλέον ότι τα 1300 ευρώ δε φτάνουν για ποιοτητικη ζωηυ .. στα 41 έτη μου δεν έχω κ πολλές επιλογές για να αυξήσω το εισόδημα μου έχοντας 4 παιδιά",
 "Το σκέφτομαι εδώ και μήνες... ψάχνω λύση για έξτρα χρήματα αλλά υποχρεωσεις και ηλικία δε μου δίνουν πολλές επιλογές",
 "Σκέφτομαι ακόμα....",
 "Υποχρεώσεις και ηλικία όπως σου είπα πριν... έχω ελάχιστο χρόνο. Και δεν ξέρω αν πρέπει να ξανά σπουδάσω...αν πρέπει να πάω έστω σερβιτόρος πχ ή κάτι μέσω ίντερνετ",
];

const A00_VIOLATION = "Υπάρχουν μερικές κατευθύνσεις που αξίζει να ξέρεις ότι υπάρχουν:\n\n**Μέσα στο νοσηλευτικό σου αντικείμενο:**\n- Συμβάσεις με ΕΟΠΥΥ για κατ' οίκον νοσηλεία (πληρώνει ο ασφαλιστικός φορέας, όχι ο ασθενής)\n- Εταιρείες κατ' οίκον φροντίδας που αναθέτουν περιστατικά\n- Εκπαίδευση φροντιστών/οικογενειών ασθενών\n\n**Μέσα στην εκπαίδευση:**\n- Ιδιαίτερα σε παιδιά με ειδικές ανάγκες — σπάνιο, ακριβό\n- Φροντιστήριο ειδικής αγωγής";
const A01_MIRROR = "Σταματάω εδώ γιατί αυτό που περιγράφεις — νοσηλευτική, ειδική αγωγή, σπουδές, κομμωτική, e-food — είναι πολλές διαφορετικές κατευθύνσεις ταυτόχρονα.\n\nΈνα πράγμα μόνο:\n\nΑν έπρεπε να διαλέξεις **μία** από αυτές που ήδη ανέφερες — όχι την καλύτερη, αυτή που σε τραβάει περισσότερο — ποια θα ήταν;";
const B41_VIOLATION = "Υπάρχουν μερικές κατευθύνσεις που δεν απαιτούν νέες σπουδές και είναι συμβατές με το προφίλ σου ως εκπαιδευτικός νοσηλευτικής — φροντιστήριο/ιδιαίτερα σε μαθητές νοσηλευτικών σχολών, online διδασκαλία, ή σύνταξη εκπαιδευτικού υλικού.\n\nΚάτι από αυτά σου προκαλεί περιέργεια, ή σου φαίνεται εκτός πραγματικότητας για την κατάστασή σου;";
const B_QUESTION = "Το «μίζερη ζωή» — το εννοείς ότι δεν φτάνουν τα χρήματα για βασικά, ή ότι δεν μπορείς να δώσεις στα παιδιά σου αυτό που θέλεις;";
const B_WITHHELD = "Χάσμα περίπου 1.700€ τον μήνα.\n\nΠριν δώσω ιδέες — το νομικό εμπόδιο που είπες πριν παραμένει: δεν ξέρουμε ακόμα τι επιτρέπεται. Ιδέες χωρίς αυτό δεν σε βγάζουν από τη λούπα.";
// A road map whose ΔΡΟΜΟΣ line ENUMERATES and whose words are all AURA's. Mutation testing caught
// the first version of this fixture passing for the wrong reason: it had one item per line, so
// gate 3 excluded it and the road-map exemption was never exercised at all. This one reaches
// gate 4 and would flag — only gate 1 stops it.
const A_ROADMAP = "Εντάξει. Έχω αρκετό υλικό.\n\nΔΡΟΜΟΣ: Παράλληλη εργασία, ιδιωτικά ή σε εταιρεία\nΚΕΡΔΙΖΕΙΣ: Εισόδημα γρήγορα, χωρίς μετακόμιση\nΚΟΣΤΙΖΕΙ: Απογεύματα, ενέργεια";
// A real Reflection Summary. It enumerates, nothing in it is traceable to THIS user's words, and
// it names no category of things-to-do. Only the frame gate saves it — mutation testing showed
// nothing else in the suite covered that gate.
const A_REFLECTION = "Ξεκίνησες από μία «παράξενη διάθεση» — αυτό το δυσερμήνευτο αίσθημα ότι αυτό που έχεις δεν σε γεμίζει, ενώ ταυτόχρονα νιώθεις «αχάριστος» που το λες.";
const A_ASKS = "Ξέρεις τις επιλογές σου αλλά δεν μπορείς να αποφασίσεις — οπότε υπάρχουν ήδη κάποιοι τρόποι στο μυαλό σου για τα 3.000€.\n\nΠοιοι είναι;";
const B_MULTIPLE_CHOICE = "Ποιο από αυτά πιέζει τώρα — το εισόδημα, ο χρόνος, ή η ηλικία;";

// A bulleted offer with no colon and no dash inside any item. Mutation testing showed A00 above
// was being caught through its "— σπάνιο, ακριβό" fragment rather than through its option list:
// deleting the list-line extraction entirely left the suite green. This fixture can only be
// reached by the list path, so it pins that path.
const A_BULLETS_ONLY = "Ξεκίνα από αυτές τις κατευθύνσεις:\n- Reddit, στις κοινότητες του παιχνιδιού\n- TikTok, με σύντομα clips\n- Discord, σε servers που ήδη υπάρχουν";

const D = (t, u) => detectsUnsourcedOptionOffer(t, u, parseRoadMap);

// ── 1. THE TWO REAL VIOLATIONS ─────────────────────────────────────────────
assert("the teacher's three careers are caught — the reply that broke a real session",
  D(B41_VIOLATION, B_USER) === true);
assert("the nurse's bulleted directions are caught — a separate session, same failure",
  D(A00_VIOLATION, A_USER) === true);
assert("a purely bulleted offer is caught through the list path, not through a stray dash fragment",
  D(A_BULLETS_ONLY, B_USER) === true);

// ── 2. THE MIRROR THAT MUST SURVIVE ───────────────────────────────────────
// Same grammar as A00, opposite provenance. If this flags, the detector forbids the Mirror Rule.
assert("mirroring the user's OWN list is not a violation, though its grammar is identical",
  D(A01_MIRROR, A_USER) === false);

// ── 3. THE GATES, EACH CARRYING A REAL REPLY THE MEASUREMENT SHOWED AT RISK ─
assert("a road map is never this detector's business — classifyRoadProvenance audits that path",
  D(A_ROADMAP, A_USER) === false);
assert("that road-map fixture genuinely reaches the provenance gate — the exemption is what stops it",
  detectsUnsourcedOptionOffer(A_ROADMAP, A_USER, null) === true);
assert("a reflection summary that enumerates is not an option offer — no category of things to do",
  D(A_REFLECTION, B_USER) === false);
assert("a clarifying question offering two readings of the user's own phrase does not flag",
  D(B_QUESTION, B_USER) === false);
assert("refusing to give ideas until the legal gate clears does not flag (measured at 7.1% overlap)",
  D(B_WITHHELD, B_USER) === false);
assert("asking the user which ways are already in their head does not flag",
  D(A_ASKS, A_USER) === false);
assert("the three-way multiple-choice format does not flag when the options are the user's",
  D(B_MULTIPLE_CHOICE, B_USER) === false);

// ── 4. THE BAR IS ZERO, NOT A THRESHOLD ───────────────────────────────────
// One traceable item is enough to withhold the flag. That is deliberate and conservative: a
// reply that engages with even one thing the user named is not a cascade of invented options.
assert("a single traceable item is enough to withhold the flag",
  D("Υπάρχουν δύο κατευθύνσεις — σερβιτόρος, ή σύνταξη εκπαιδευτικού υλικού.", B_USER) === false);
assert("the same sentence with BOTH items invented does flag",
  D("Υπάρχουν δύο κατευθύνσεις — φροντιστήριο, ή σύνταξη εκπαιδευτικού υλικού.", B_USER) === true);

// ── 4b. A DOCUMENTED GAP, PINNED AS A GAP ─────────────────────────────────
// Two items minimum is a deliberate conservative limit, and a surviving mutation showed nothing in
// the suite recorded that choice. A SINGLE introduced option is not caught. This is stated as a
// known gap rather than as correct behaviour — the reply below IS a No-Advice violation and the
// detector misses it on purpose, because one named thing is far more often a question's subject
// than an offer. If the counts justify lowering the floor, this assertion is the thing to change,
// consciously, and the two negatives above are what will have to be re-checked.
assert("KNOWN GAP: a single introduced option is not caught, by design and not by accident",
  D("Υπάρχει μία κατεύθυνση που δεν έχεις αναφέρει: η κατ' οίκον νοσηλεία.", A_USER) === false);
// One bulleted option is ONE option, not two. This separates the two enumeration paths: if the
// inline path is allowed to cross the newline after the colon it swallows the "- " line and reads
// its internal comma as a second item, flagging a reply the documented gap above says it must not.
assert("KNOWN GAP holds for a single BULLETED option too — a comma inside it is not a second item",
  D("Υπάρχει μια κατεύθυνση που δεν έχεις αναφέρει:\n- Reddit, στις κοινότητες του παιχνιδιού", B_USER) === false);
assert("the same reply DOES enumerate two items once a second is added — the floor is the only reason",
  D("Υπάρχουν δύο κατευθύνσεις που δεν έχεις αναφέρει: η κατ' οίκον νοσηλεία, τα ιδιαίτερα.", A_USER) === true);

// ── 5. DEGENERATE INPUT NEVER THROWS AND NEVER FLAGS ──────────────────────
assert("empty, null and non-string input are refused quietly",
  D("", B_USER) === false && D(null, B_USER) === false && D(undefined, B_USER) === false && D(42, B_USER) === false);
assert("a missing or empty user history never produces a flag — nothing to compare against",
  D(B41_VIOLATION, null) === false && D(B41_VIOLATION, []) === false);
assert("a broken parser is survived, not propagated",
  (() => { try { return detectsUnsourcedOptionOffer(B41_VIOLATION, B_USER, () => { throw new Error("x"); }) === true; } catch (e) { return false; } })());
assert("with no parser supplied the road-map gate is skipped, not fatal",
  typeof detectsUnsourcedOptionOffer(A_ROADMAP, A_USER, null) === "boolean");

// ── 6. IT STAYS AN OBSERVER ───────────────────────────────────────────────
const SRC = extract('detectsUnsourcedOptionOffer');
assert("the detector is pure — it returns a verdict and touches nothing",
  !/setState|set[A-Z]|\.current\s*=|callAura|localStorage/.test(SRC));
assert("no model call is introduced — pure code over text we already have",
  !/callAura|fetch\(/.test(SRC));
assert("it judges provenance, never meaning — no semantic word lists",
  !/σημαίν|ισοδύναμ|synonym/i.test(SRC));

// ── 7. WIRING ─────────────────────────────────────────────────────────────
// The anchor is asserted before it is used. generateResponse is declared as
// `const generateResponse = useCallback(...)`, so anchoring on `function generateResponse` gives
// indexOf -1, and slice(-1) is one character — an assertion that passes or fails for no reason.
// Fourth time in this repo a slice has been decided by its anchor rather than by the code.
const GR_AT = raw.indexOf('const generateResponse');
assert("the wiring anchor exists, so the slice below cannot be vacuous", GR_AT > 0);
const LIVE = raw.slice(GR_AT);
assert("WIRING: the detector runs on AURA's own output inside generateResponse",
  /detectsUnsourcedOptionOffer\s*\(/.test(LIVE));
const CALL_AT = LIVE.indexOf('detectsUnsourcedOptionOffer(');
const CALL_WINDOW = LIVE.slice(Math.max(0, CALL_AT - 40), CALL_AT + 400);
assert("WIRING: the call is live — not short-circuited behind a disabled condition",
  !/(false|0)\s*&&\s*$/.test(LIVE.slice(Math.max(0, CALL_AT - 40), CALL_AT)));
assert("WIRING: the counter actually increments where the detector fires",
  /unsourcedOptionOffers\.current\s*\+=\s*1/.test(CALL_WINDOW));
assert("WIRING: it sits beside the existing violation tally, seeing the same tag-stripped text",
  /detectOutputViolation\s*\(/.test(LIVE) &&
  Math.abs(LIVE.indexOf('detectsUnsourcedOptionOffer(') - LIVE.indexOf('detectOutputViolation(')) < 900);
assert("WIRING: it is given USER messages only — AURA's own earlier inventions must not count as sourced",
  /detectsUnsourcedOptionOffer\([^;]*role\s*===\s*"user"/.test(LIVE));
assert("WIRING: the per-session counter is reset, so counts never leak between sessions",
  /unsourcedOptionOffers\.current\s*=\s*0/.test(raw));
const tele = raw.slice(raw.indexOf('session_completed'));
assert("WIRING: the count reaches session_completed telemetry, reading its OWN counter",
  /unsourcedOptions:[^\n]*unsourcedOptionOffers\.current/.test(tele));
assert("WIRING: counts only — the reply text never travels with it",
  !/unsourcedOptions:[^\n]*(content|text|reply|message)/i.test(tele));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
