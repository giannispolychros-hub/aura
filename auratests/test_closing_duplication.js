// ── PART 2 MUST NOT RE-DELIVER PART 1 ───────────────────────────────────────
// Real session, 2026-09-22. The word-to-remember question appeared twice, in two
// separate turns, with the user's own word in between:
//
//   turn A (Part 1) : "Πριν φύγεις — μία λέξη…"            ← correct
//   user            : "Υπάρχουν λύσεις"
//   turn B (Part 2) : reflection summary + "Πριν φύγεις — μία λέξη…" + closure
//
// Measured cause: 419ea67 removed the narrative from Part 1's per-turn TRIGGER
// but deliberately left the cached SYSTEM_TERMINATION definition alone to protect
// the prompt cache — it still reads "PART 1 (first reply — REFLECTION SUMMARY +
// word request)". On the Part 2 call the model therefore sees a system prompt
// saying Part 1 contains a summary, a history where it does not, and a trigger
// saying "do not REPEAT" — a word presupposing it already happened. It filled the
// gap: it delivered a complete Part 1, then Part 2. The Part 2 turn matched the
// cached Part 1 spec on every measurable count (8 sentences against "4-8", a
// 7-word opening against "≤15", ending on the exact prescribed last line).
//
// No code could have caught it. There was no such state: reflectionDelivered is
// set at the START of triggerTermination and never reaches Part 2, and
// detectOutputViolation has no category for this and only increments a debug
// counter. The single defence was one sentence in a trigger message.
//
// WHAT CAN AND CANNOT BE CUT — the constraint that shapes this whole suite.
// Part 2's own STEP 2 spec prescribes, verbatim: "Ξεκίνησες προσπαθώντας να Χ.
// Στην πορεία η ερώτηση έγινε Υ." So narrative prose is LEGITIMATE Part 2 output
// and cannot be pattern-matched away — a reflection-summary detector would cut
// exactly the text Part 2 is told to write. The word-question, by contrast, has
// fixed prescribed wording and is forbidden in Part 2 without exception. So the
// word-question is the anchor: when it appears, everything up to and including it
// is misplaced Part 1, and whatever follows is the real Part 2.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('stripRepeatedClosing'));
eval(extract('stripPrematureFarewell'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

const WORDQ = "Πριν φύγεις — μία λέξη, ή μια φράση που θέλεις να κρατήσεις. Όχι για εδώ. Για σένα, όταν ξαναβρεθείς σε αυτή τη σκέψη.";

// The real Part 2 output from the live session, verbatim.
const LIVE_PART2 = `«Υπάρχουν λύσεις» — το είπες πριν φύγεις.

Ξεκίνησες με «δεν ξέρω τι επιλογές έχω». Στην πορεία βγήκαν τρεις δρόμοι — εξωτερικό, δεύτερη δουλειά, σπουδές — και ένας από αυτούς ήταν «ξεκάθαρα ο δικός μου». Αυτό που «τα πάντα είναι εδώ» παραμένει αληθινό, και δεν το αρνήθηκες. Απλώς βρίσκεσαι σε ένα σημείο που «ακόμα έχεις χρόνο» — και αυτό δεν είναι αδράνεια, είναι πραγματικότητα.

${WORDQ}

---

Η σκέψη δεν τελείωσε — απλώς έγινε πιο καθαρή. Ένα ερώτημα έμεινε ανοιχτό: η άδεια. Ένα μονοπάτι έγινε «ξεκάθαρα δικό σου». Και οι δύο επιλογές — μένεις ή φεύγεις — έχουν το κόστος που περιέγραψες.`;

// ── 1. THE REPORTED DEFECT ──────────────────────────────────────────────────
const cleaned = stripRepeatedClosing(LIVE_PART2);
assert("live Part 2: the repeated word-question is gone", !cleaned.includes("Πριν φύγεις"));
assert("live Part 2: the duplicated reflection summary is gone", !cleaned.includes("Ξεκίνησες με «δεν ξέρω τι επιλογές έχω»"));
assert("live Part 2: the real closure text survives intact", cleaned.includes("Η σκέψη δεν τελείωσε") && cleaned.includes("το κόστος που περιέγραψες"));
assert("live Part 2: the leftover separator rule is not rendered", !/^\s*-{2,}\s*$/m.test(cleaned));
assert("live Part 2: result is not empty", cleaned.trim().length > 0);

// ── 2. THE SAFETY FIXTURE — legitimate Part 2 must be untouched ─────────────
// This is STEP 2's own prescribed rhythm, quoted from SYSTEM_TERMINATION. If the
// filter cuts this, it has cut the thing Part 2 exists to say.
const LEGIT_PART2 = `Ξεκίνησες προσπαθώντας να βρεις αν φτάνουν τα χρήματα. Στην πορεία η ερώτηση έγινε ποιο βάρος αντέχεις. Και εκεί έδωσες τη δική σου απάντηση.

Και οι δύο επιλογές έχουν το κόστος που περιέγραψες. Ό,τι διαλέξεις, θα το διαλέγεις έχοντας ήδη δει καθαρά και τα δύο.`;
assert("SAFETY: legitimate Part 2 with the prescribed narrative rhythm is returned unchanged",
  stripRepeatedClosing(LEGIT_PART2) === LEGIT_PART2);
assert("SAFETY: a closure mentioning a 'λέξη' in passing is not treated as the word-question",
  stripRepeatedClosing("Η λέξη που κράτησες κάθεται πλέον δίπλα σε όσα είπες.") === "Η λέξη που κράτησες κάθεται πλέον δίπλα σε όσα είπες.");
assert("SAFETY: the literal-echo line Part 2 is allowed to add survives",
  stripRepeatedClosing("Η λέξη «Υπάρχουν λύσεις» έχει εμφανιστεί συνολικά 3 φορές στις καταγραφές σου.").includes("3 φορές"));
assert("SAFETY: empty / non-string input returns harmlessly, never throws",
  stripRepeatedClosing("") === "" && typeof stripRepeatedClosing(null) === "string");

// ── 3. THE OTHER WORD-QUESTION FORMS ────────────────────────────────────────
// The prompt offers three shapes for the same question. All three are Part 1's.
assert("returning-user variant is caught",
  !stripRepeatedClosing(`Την προηγούμενη φορά, αυτό που επέλεξες να κρατήσεις ήταν: «φόβος». Σήμερα, αφού είδες ξανά την πορεία της σκέψης σου, ποια λέξη ή ποια σύντομη φράση θα ήθελες να κρατήσεις;\n\nΗ σκέψη κάθισε.`).includes("θα ήθελες να κρατήσεις"));
assert("carry-forward fill-in-the-blank variant is caught",
  !stripRepeatedClosing(`Όταν ξαναβρεθώ σε αυτή την κατάσταση, θα θυμηθώ ότι ______ και θα κάνω ______\n\nΣυμπλήρωσέ το με τα δικά σου λόγια.\n\nΗ σκέψη κάθισε.`).includes("Συμπλήρωσέ το"));
assert("offline-fallback wording ('μία σύντομη φράση') is caught",
  !stripRepeatedClosing(`Πριν φύγεις — μία σύντομη φράση που θέλεις να κρατήσεις.\n\nΗ σκέψη κάθισε.`).includes("Πριν φύγεις"));

// ── 4. THE WHOLE REPLY WAS MISPLACED PART 1 ─────────────────────────────────
// Nothing legitimate follows. The function reports empty rather than inventing
// content; choosing the replacement is the caller's job, not the filter's.
assert("a Part 2 that is ONLY the repeated word-question strips to empty",
  stripRepeatedClosing(`Μια τελευταία σκέψη πριν κλείσουμε.\n\n${WORDQ}`).trim() === "");

// ── 5. PREMATURE FAREWELL (same transcript, same family) ────────────────────
// "Καλή συνέχεια." was said in an ORDINARY turn, before the closing sequence had
// run at all — so the session said goodbye, then asked for a word, then closed
// again. It cannot be blocked where it is written: the reply is committed to
// state at App.jsx:4826 and decideTermination does not run until :4964.
assert("trailing farewell is removed from the reply that precedes the closing sequence",
  stripPrematureFarewell("Τότε το βήμα είναι ένα: ο έλεγχος για την άδεια.\n\nΚαλή συνέχεια.")
    === "Τότε το βήμα είναι ένα: ο έλεγχος για την άδεια.");
assert("other farewell wordings are removed too",
  stripPrematureFarewell("Το βήμα είναι ένα.\n\nΚαλή τύχη.") === "Το βήμα είναι ένα.");
assert("SAFETY: a reply that is ONLY a farewell is left alone — never emptied",
  stripPrematureFarewell("Καλή συνέχεια.") === "Καλή συνέχεια.");
assert("SAFETY: a reply ending in ordinary content is untouched",
  stripPrematureFarewell("Τι σε κρατά ακόμα εδώ;") === "Τι σε κρατά ακόμα εδώ;");
assert("SAFETY: a farewell word inside a sentence is not a farewell line",
  stripPrematureFarewell("Είπες ότι θέλεις καλή συνέχεια στη δουλειά σου.") === "Είπες ότι θέλεις καλή συνέχεια στη δουλειά σου.");
// Same sentence, but with a line above it so the "never empty a reply" fallback cannot
// mask an unanchored match. Found by mutation: dropping the ^…$ anchors passed the
// single-line version of this fixture while silently deleting a real sentence here.
const FAREWELL_IN_SENTENCE = "Δύο δρόμοι φαίνονται στο τραπέζι.\n\nΕίπες ότι θέλεις καλή συνέχεια στη δουλειά σου.";
assert("SAFETY: a farewell word inside the last sentence of a multi-line reply is not a farewell line",
  stripPrematureFarewell(FAREWELL_IN_SENTENCE) === FAREWELL_IN_SENTENCE);
assert("SAFETY: empty / non-string input returns harmlessly, never throws",
  stripPrematureFarewell("") === "" && typeof stripPrematureFarewell(null) === "string");

// ── 6. WIRING — the filter must be REAL CODE in the real path ───────────────
// A pure function nothing calls is a comment. These assertions read App.jsx.
const dfc = raw.slice(raw.indexOf("const deliverFinalClosure"), raw.indexOf("const triggerTermination"));
const ttn = raw.slice(raw.indexOf("const triggerTermination"), raw.indexOf("const handleMisfireResponse"));
assert("WIRING: a dedicated wordQuestionDelivered ref exists, separate from reflectionDelivered",
  /const wordQuestionDelivered\s*=\s*useRef\(false\)/.test(raw));
assert("WIRING: every path that puts the word-question on screen arms the flag (Part 1, offline fallback, early-word)",
  (ttn.match(/wordQuestionDelivered\.current\s*=\s*true/g) || []).length >= 3);
assert("WIRING: deliverFinalClosure reads it and strips, before the message is shown",
  /wordQuestionDelivered\.current/.test(dfc) && /stripRepeatedClosing\(/.test(dfc));
assert("WIRING: the strip happens before setMessages, not after",
  dfc.indexOf("stripRepeatedClosing(") < dfc.indexOf("setMessages(") && dfc.indexOf("stripRepeatedClosing(") !== -1);
const helper = raw.slice(raw.indexOf("const appendClosingMessage"), raw.indexOf("const deliverFinalClosure"));
assert("WIRING: the closing-append helper strips a premature farewell from the preceding turn",
  /stripPrematureFarewell\(/.test(helper));
assert("WIRING: every Part 1 delivery goes through that helper, not a bare setMessages",
  (ttn.match(/appendClosingMessage\(/g) || []).length >= 3 &&
  !/setMessages\(prev => \[\.\.\.prev, \{ id: nextMsgId\(\), role: "assistant", content: (text|fallback)/.test(ttn));
assert("WIRING: the ref is reset per session",
  /wordQuestionDelivered\.current\s*=\s*false/.test(raw));
assert("WIRING: reflectionDelivered was NOT reused for this",
  /const reflectionDelivered\s*=\s*useRef\(false\)/.test(raw) && !/reflectionDelivered\.current/.test(dfc));

// ── 7. CACHE — the cached blocks must be untouched by this fix ──────────────
const shownVar = (dfc.match(/content:\s*(\w+),\s*msgMode:\s*"TERMINATION"/) || [])[1];
const splitVar = (dfc.match(/const sentences = (\w+)\.split\(/) || [])[1];
assert("WIRING: finalDistillation is derived from the text actually shown, not the unfiltered reply",
  !!shownVar && shownVar === splitVar);
// The pure filter returns empty when the whole reply was misplaced Part 1 — deliberately,
// since inventing closing text is not a filter's job. The caller must then substitute a
// real line. Found by mutation: without this, deleting the fallback showed a blank turn.
const shownDecl = shownVar ? ((dfc.match(new RegExp("const " + shownVar + " = ([^;]+);")) || [])[1] || "") : "";
assert("WIRING: a fully-stripped Part 2 falls back to a real closing line, never a blank message",
  /trim\(\)/.test(shownDecl) && shownDecl.includes("?") && /"[^"]{5,}"/.test(shownDecl));

assert("cached SYSTEM_TERMINATION still defines Part 1 as it did (this fix changes no prompt)",
  raw.includes("── PART 1 (first reply — REFLECTION SUMMARY + word request) ──"));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
