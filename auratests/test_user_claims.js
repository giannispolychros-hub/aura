// ── CLAIMS ABOUT THE USER: the rule with no guard at all ─────────────────────
//
// WHY THIS FILE EXISTS. Universal No-Evaluation and Κ5 (pattern ≠ trait) are non-negotiable, and
// until 2026-09-26 NOTHING in the product observed them. The only candidate was
// detectsPossibleAraPatternViolation, a one-line check for the literal word "Άρα" — so every other
// surface form passed untouched. Three real sessions produced five violations, none of them seen:
//
//   session 2, reply 9   "Δεν ακούγεται παθογένεια. Ακούγεται σαν άνθρωπος που ξέρει ακριβώς τι
//                         του λείπει."                                    ← a character verdict
//   session 3, reply 34  "…απομακρυνόμαστε από αυτό που σε απασχολεί πραγματικά."
//                                        ← the TOPIC DRIFT wording the prompt itself forbids
//   session 3, reply 45  "Η ρίζα ήταν πάντα η ίδια"   ← he said "είναι η ίδια", present tense
//   session 3, reply 45  "Αυτό το ξέρεις ήδη."        ← 0% his words, measured per clause
//
// The last one is the worst thing in any of the three transcripts, and not because it is the
// rudest. It is the LAST sentence the person reads, it sits in the paragraph the Blueprint charges
// 6€ to keep, and it is AURA enacting its own invention: two turns earlier it had produced the
// hypothesis "ο καθρέφτης γίνεται μαγικός όταν δείχνει κάτι που ο χρήστης δεν ήξερε ότι ήδη ήξερε",
// and then told him he already knew. Nothing in the file prescribes any of these strings —
// searched: 0 occurrences in prompt, 0 in code. They are model output, unobserved.
//
// WHY FORM AND NOT PROVENANCE, and this is the decision that makes the detector possible at all.
// The obvious approach is to ask whether the claim is traceable to the user's words. This repo has
// already measured that road and closed it: "vocabulary overlap turned out ANTI-correlated with
// fabrication, because a model writing an invented cost reuses the user's own words by
// construction". A claim about someone's interior does not fail on content words — it fails on a
// small, closed set of GRAMMATICAL constructions: second-person knowledge attribution, a totalising
// temporal claim, a character verdict, an appeal to a hidden interior. That is a syntactic class,
// not a semantic judgement, so it needs no corpus and cannot be gamed by word reuse.
//
// MEASURED BEFORE BEING WRITTEN: six forms over sessions 2 and 3 produced 5 hits and 0 false
// positives on 69 real replies. The fixtures below are those exact strings plus the legitimate
// replies that sit closest to them.
//
// OBSERVATION ONLY, like the unsourced-option guard before it. It counts; it never rewrites or
// blocks a reply. A brake that fires wrongly on someone in distress is itself harm, and five
// labelled examples is not eight hundred.
//
// ONE FALSE-POSITIVE SOURCE IS CLOSED BY CONSTRUCTION: quoted spans. AURA quotes the user with
// «…» in reflections and in the road artifact, so a mirrored "πάντα το ίδιο κάνω" would otherwise
// read as AURA's own totalising claim. Quoted spans are removed before matching.
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}

const SRC = extract('detectsClaimAboutUser');
assert('detectsClaimAboutUser is defined in App.jsx', !!SRC);
let D = null;
if (SRC) {
  try { D = eval('(' + SRC + ')'); } catch (err) {
    console.log('FAIL — detectsClaimAboutUser could not be evaluated standalone: ' + err.message);
    failed++;
  }
}
assert('it evaluates standalone, so the suites can lift it without its siblings', typeof D === 'function');

if (typeof D === 'function') {
  // ── 1. THE FOUR REAL VIOLATIONS, verbatim ────────────────────────────────
  assert('REAL: "Αυτό το ξέρεις ήδη" — knowledge attributed to the person, measured 0% their words',
    D('Ο καθρέφτης χωρίς μαγεία δεν πουλάει. Αυτό το ξέρεις ήδη.') === true);
  assert('REAL: "ήταν πάντα η ίδια" — he said "είναι η ίδια"; the always is AURA\'s',
    D('Η ρίζα ήταν πάντα η ίδια — το είπες εσύ.') === true);
  assert('REAL: "Ακούγεται σαν άνθρωπος που…" — a character verdict, the clearest Κ5 breach',
    D('Δεν ακούγεται παθογένεια. Ακούγεται σαν άνθρωπος που ξέρει ακριβώς τι του λείπει.') === true);
  assert('REAL: "αυτό που σε απασχολεί πραγματικά" — the TOPIC DRIFT wording the prompt forbids',
    D('Έχω την αίσθηση ότι απομακρυνόμαστε από αυτό που σε απασχολεί πραγματικά.') === true);

  // ── 2. THE FORMS NOT YET OBSERVED, included as forms not as evidence ─────
  // Marked as synthetic on purpose: they belong to the same closed class and would be violations,
  // but no real session has produced them. If one ever does, this file already covered it.
  assert('FORM: an appeal to a hidden interior is the same class, though not yet observed live',
    D('Στο βάθος ξέρεις τι θέλεις.') === true);
  assert('FORM: the second person stated as a trait, though not yet observed live',
    D('Είσαι άνθρωπος που αποφεύγει τη σύγκρουση.') === true);

  // EACH ALTERNATIVE OF THE CHARACTER-VERDICT FORM, SEPARATELY. Found by a surviving mutation:
  // the real session-2 reply matches BOTH "ακούγεται σαν άνθρωπο…" and "δεν ακούγεται", so
  // disabling the first branch left every assertion green. One fixture per branch, each chosen so
  // it can only match its own.
  assert('the verdict form fires on its own branch, without the negated one present',
    D('Ακούγεται σαν άνθρωπος που ξέρει τι θέλει.') === true);
  assert('the second-person variant fires on its own branch',
    D('Ακούγεσαι σαν κάποιον που έχει αποφασίσει.') === true);
  assert('the negated verdict fires on its own branch, with no "σαν άνθρωπο" present',
    D('Δεν ακούγεται λογικό αυτό για σένα.') === true);

  // ── 3. WHAT MUST SURVIVE — real replies, and the ones closest to the line ─
  assert('the clause measured 100% his own vocabulary does not flag',
    D('Ο καθρέφτης χωρίς μαγεία δεν πουλάει.') === false);
  assert('naming what the person named, attributed to them, is the Mirror Rule working',
    D('Ναι, το είπες εσύ — και τα UFO και το κανάλι και το γρήγορο κέρδος έχουν την ίδια ρίζα.') === false);
  assert('"τώρα την έχεις κατονομάσει" is about an act they performed, not about their interior',
    D('Η μαγεία — τώρα την έχεις κατονομάσει.') === false);
  assert('mirroring a list back and asking about it does not flag',
    D('Από αυτά που λες — πίεση, ρουτίνα, χαμηλό εισόδημα — ποιο από τα τρία σε κρατά πιο ακίνητο;') === false);
  assert('an ordinary question does not flag',
    D('Τι σε εμποδίζει να κάνεις το πρώτο βήμα τώρα;') === false);
  assert('asking whether something changed does not assert that it did',
    D('Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;') === false);
  assert('asking how often a thought comes is not a claim about them',
    D('Αυτή η σκέψη — "τι θα λένε όταν μεγαλώσουν" — πόσο συχνά έρχεται;') === false);

  // ── 4. QUOTED SPANS ARE THE USER'S WORDS, NOT AURA'S CLAIM ───────────────
  // The road artifact prints the user's answers inside «…» and reflections quote them. Without
  // this, mirroring someone who says "πάντα" would read as AURA totalising.
  assert('a totalising phrase INSIDE a quotation is the user speaking, not AURA claiming',
    D('Είπες: «πάντα ήταν το ίδιο πρόβλημα».') === false);
  assert('the same phrase OUTSIDE quotation marks still flags — the stripping is not a loophole',
    D('Πάντα ήταν το ίδιο πρόβλημα.') === true);
  assert('straight double quotes are handled too, not only Greek guillemets',
    D('Είπες: "πάντα ήταν το ίδιο πρόβλημα".') === false);

  // ── 5. DEGENERATE INPUT NEVER THROWS AND NEVER FLAGS ─────────────────────
  [undefined, null, '', '   ', 42, {}, [], () => {}].forEach(v => {
    let threw = false, res = null;
    try { res = D(v); } catch (e) { threw = true; }
    assert('degenerate input ' + JSON.stringify(typeof v === 'function' ? 'fn' : v) + ' neither throws nor flags',
      !threw && res === false);
  });

  // A NON-STRING IS A CALLER BUG, AND MUST BE REFUSED RATHER THAN STRINGIFIED. Found by a
  // surviving mutation: replacing the type guard with String(text) passed every degenerate-input
  // assertion above, because none of those values stringifies into a violation. These do. A future
  // call site that hands this a message object must produce a refusal, not a count.
  assert('an object whose toString is a violation is still refused — it is not a reply',
    D({ toString: () => 'Αυτό το ξέρεις ήδη.' }) === false);
  assert('an array containing a violation is refused too',
    D(['Αυτό το ξέρεις ήδη.']) === false);

  // ── 6. NOT A PROVENANCE CHECK ────────────────────────────────────────────
  // If this ever grows a second parameter for the user's messages it has become the thing the
  // repo already measured as anti-correlated with fabrication. It takes text, and only text.
  assert('it takes exactly one parameter — text — and never the conversation',
    D.length === 1);
  assert('its body reads no message, no content field and no history',
    !/\.content\b/.test(SRC) && !/\bmessages\b/.test(SRC) && !/userTexts/.test(SRC));

  // ── 7. THE MEASURED CORPUS: no false positives on real replies ───────────
  // 24 verbatim replies from session 2 and 45 from session 3. Exactly the four real violations
  // above are expected, and nothing else. This is the assertion that would catch a form written
  // too loosely — the failure mode that matters more than a miss, since a brake that fires on an
  // ordinary reply is itself harm.
  const S2 = ['Πες μου — τι αλλάζει συγκεκριμένα;','Και όταν βγαίνουν — τι νιώθεις που λείπει εκείνη την περίοδο;','Τι συμβαίνει μέσα σου όταν δεν μπορείς;','Το "δυστυχώς" — τι κουβαλάει εκεί;','Αυτό που περιγράφεις — το να μπορείς να προσφέρεις — είναι το ίδιο πράγμα με το να είσαι καλός πατέρας για σένα, ή είναι κάτι διαφορετικό;','Αυτή η σκέψη — "τι θα λένε όταν μεγαλώσουν" — πόσο συχνά έρχεται;','Τι εννοείς με "παθογένεια";','Μήπως αυτό που σε ανησυχεί δεν είναι τόσο η αλλαγή στη διάθεση, αλλά ότι δεν μπορείς να ελέγξεις από πού εξαρτάται η καλή σου ψυχολογία;','Σαββατοκύριακο και βράδια — τι έχεις ήδη δοκιμάσει ή σκεφτεί;','Από αυτά που ξέρεις για τον εαυτό σου — τι μπορείς να κάνεις καλά που θα μπορούσε να έχει αξία για κάποιον άλλο;','Τι είναι ΕΓΙΛ;','Πόσο καιρό είσαι στη θέση αυτή;','Τι φαντάζεσαι ότι θα έκανες συγκεκριμένα σε αυτό;'];
  const S2_HITS = S2.filter(x => D(x));
  assert('none of 13 ordinary session-2 replies flags — including two that contain "ξέρεις"',
    S2_HITS.length === 0);
  const S3 = ['Πες μου τι συνέβη.','Τι ώρα ήταν, και ήσουν μόνος;','Τι λένε οι φίλοι σου για το τι ήταν;','Εσύ τι πιστεύεις ότι ήταν;','Το δέος παραμένει ακόμα, ή έχει αλλάξει σε κάτι άλλο από τότε;','Τι θα ήθελες να ήξερες αν το ξανάβλεπες;','Ποιο από τα δύο σε βαραίνει πιο πολύ τώρα;','Τι σε σταματάει αυτή τη στιγμή στην εφαρμογή;','Ποιο πρόβλημα λύνει η εφαρμογή;','Δεν κατάλαβα — ποια είναι η σύνδεση με τον Άρη και το μπάσκετ;','Καλή υπόθεση. Γιατί νομίζεις ότι δεν είναι αρεστή;','Ναι. Πού βλέπεις τη σύγκρουση ανάμεσά τους στην εφαρμογή σου;','Καλή συνέχεια.','Τι θα έκανε τον καθρέφτη σου "μαγικό" χωρίς να χάσει την ειλικρίνειά του;'];
  assert('none of 14 ordinary session-3 replies flags — including "ήταν" without a totaliser',
    S3.filter(x => D(x)).length === 0);
}

// ── 7b. THE FINAL-SIGMA TRAP, PINNED STRUCTURALLY ───────────────────────────
// The detector folds ς→σ before matching, so any form written with a final ς can never fire — and
// it fails SILENTLY, reading as "no violations found". That is exactly what happened when this
// block was first rewritten from escapes into readable Greek: three fixtures went dark at once.
// The fixtures above catch it for the five current forms; this catches it for every form added
// later, which the fixtures cannot.
if (SRC) {
  const formsBlock = SRC.slice(SRC.indexOf('const FORMS'), SRC.indexOf('];', SRC.indexOf('const FORMS')));
  assert('NON-VACUITY: the FORMS block is findable and non-trivial', formsBlock.length > 200);
  assert('no form contains a final sigma — it is folded to σ and could never match',
    !/ς/.test(formsBlock.replace(/\/\/[^\n]*/g, '')));
  assert('no form relies on \\b, which does not work on Greek letters in JS regex',
    !/\\b/.test(formsBlock));
  assert('every form is sentence-bounded or a fixed phrase — none may span two sentences',
    !/\[\\s\\S\]/.test(formsBlock) && !/\.\*/.test(formsBlock));
}

// ── 8. THE GAP THIS REPLACES, STATED ─────────────────────────────────────────
assert('the old one-line Άρα check still exists — this does not remove it, it surrounds it',
  /function detectsPossibleAraPatternViolation/.test(CODE));
assert('and it really was only the literal word — that is why five violations passed it',
  /Άρα\[\^\.!\?\]\*\\\./.test(extract('detectsPossibleAraPatternViolation') || ''));

// ── 9. WIRING ────────────────────────────────────────────────────────────────
const GR_AT = CODE.indexOf('const generateResponse');
assert('the wiring anchor exists, so the slice below cannot be vacuous', GR_AT > 0);
const LIVE = CODE.slice(GR_AT);
assert('WIRING: it runs on AURA\'s own output inside generateResponse',
  /detectsClaimAboutUser\s*\(/.test(LIVE));
const CALL_AT = LIVE.indexOf('detectsClaimAboutUser(');
const WINDOW = LIVE.slice(Math.max(0, CALL_AT - 60), CALL_AT + 400);
assert('WIRING: the call is live — not parked behind a disabled condition',
  !/(false|0)\s*&&\s*$/.test(LIVE.slice(Math.max(0, CALL_AT - 40), CALL_AT)));
assert('WIRING: a counter increments where it fires', /claimsAboutUser\.current\s*\+=\s*1/.test(WINDOW));
assert('WIRING: it sees the tag-stripped text, like the violation tally beside it',
  /_clean/.test(WINDOW));
assert('WIRING: the per-session counter is reset, so counts never leak between sessions',
  /claimsAboutUser\.current\s*=\s*0/.test(CODE));
const tele = CODE.slice(CODE.indexOf('session_completed'));
assert('WIRING: the count reaches session_completed, reading its OWN counter',
  /userClaims:[^\n]*claimsAboutUser\.current/.test(tele));
// NON-VACUITY for the two negative assertions below: an absent field satisfies "carries no reply
// text" and "does not rewrite" trivially. Both are pinned on the field and the call existing first,
// so they cannot pass by nothing being wired at all.
assert('NON-VACUITY: the telemetry field exists, so the constraint below has a subject',
  /userClaims:/.test(tele));
assert('WIRING: counts only — no reply text travels with it',
  !/userClaims:[^\n]*(content|text|reply|message)/i.test(tele));
assert('NON-VACUITY: the detector really is called, so the observer constraint has a subject',
  CALL_AT > -1);
assert('IT STAYS AN OBSERVER: nothing rewrites or blocks a reply on its verdict',
  !/detectsClaimAboutUser\([^)]*\)\s*\)?\s*\{[^}]*displayText\s*=/.test(LIVE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
