// ── SELF-REPETITION: the guard that watched three identical questions go out ──
//
// THIS FILE USED TO INLINE A COPY of detectAssistantSelfRepetition instead of lifting it from
// App.jsx. Every other suite here lifts, for a reason this file demonstrates: a copy passes while
// the real function drifts, and nothing reports the divergence. It now lifts.
//
// WHAT THE REAL SESSION SHOWED (2026-09-26, session 3, replies 32-34). AURA sent the same question,
// byte for byte, three times:
//
//     "Ποιο από τα δύο σε νοιάζει περισσότερο — να κάνει το σωστό ή να πουλήσει;"
//
// The detector was called before every one of those turns and returned repeated:false each time —
// including when the question had already gone out twice. So this was never "detected and ignored",
// which is the failure mode this repo keeps finding. It was a self-repetition guard that misses the
// most literal repetition possible.
//
// WHY, exactly. The trigger is conjunctive:
//
//     if ((lexicalSim > 0.55 || sameOpening) && !hasSubstantialNewContent)
//
// and hasSubstantialNewContent is true when EACH reply has ≥2 unique content words. The three
// replies had different first paragraphs and an identical final question, so each had its own
// unique words and the exemption switched the guard off. That exemption was added for a real
// reason — a legitimate reuse of the same approved template on two newly-named costs was being
// false-flagged, and the fixture for it is the first assertion below. It must stay.
//
// THE FIX IS NOT TO WEAKEN THE EXEMPTION. A verbatim repeated QUESTION is a different and sharper
// signal than whole-reply similarity: it cannot occur in the legitimate case, because reusing a
// template on new material produces a DIFFERENT question. So it is a third, independent trigger
// that the exemption does not reach. Measured before being written: 2 firings across session 3
// (replies 33 and 34, correctly), 0 across session 2's 24 replies, and it does not fire on the
// same template with a different question ("σε βαραίνει" vs "σε κρατάει ακίνητο").
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}

let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log("PASS —", label); } else { failed++; console.log("FAIL —", label); } }

const SRC = extract('detectAssistantSelfRepetition');
assert("NO LONGER A COPY: the function is lifted from App.jsx, so drift cannot hide", !!SRC);
let detectAssistantSelfRepetition = null;
if (SRC) {
  try { detectAssistantSelfRepetition = eval('(' + SRC + ')'); }
  catch (e) { console.log("FAIL — could not evaluate it standalone: " + e.message); failed++; }
}
assert("it evaluates standalone, with no module-level dependencies",
  typeof detectAssistantSelfRepetition === 'function');

if (typeof detectAssistantSelfRepetition === 'function') {
  const D = detectAssistantSelfRepetition;

  // ── 1. THE EXEMPTION THAT MUST SURVIVE ────────────────────────────────────
  // Real bug this fixture was written for: the same approved VERBATIM COST COLLISION template
  // applied to two different, newly-named costs. Legitimate structure, not lazy repetition.
  const msgsFalsePositive = [
    { role: "assistant", content: "Είπες ότι το ένα φέρνει τύψεις και το άλλο βαρεμάρα. Ανάμεσα στα δύο, ποιο θα επέλεγες να αντέξεις;" },
    { role: "assistant", content: "Είπες ότι το ένα φέρνει άγχος και το άλλο μοναξιά. Ανάμεσα στα δύο, ποιο θα επέλεγες να αντέξεις;" },
  ];
  assert("legitimate reuse of the same template on new material does not flag",
    D(msgsFalsePositive).repeated === false);

  const msgsGenuine = [
    { role: "assistant", content: "Τι σε κάνει να νιώθεις έτσι σήμερα;" },
    { role: "assistant", content: "Τι σε κάνει να νιώθεις έτσι τώρα;" },
  ];
  assert("genuine same-shape repetition is still caught by the original triggers",
    D(msgsGenuine).repeated === true);

  const msgsDifferent = [
    { role: "assistant", content: "Τι σε κάνει να το σκέφτεσαι ακόμα;" },
    { role: "assistant", content: "Αν τίποτα δεν άλλαζε για πέντε χρόνια, τι θα πονούσε περισσότερο;" },
  ];
  assert("a genuinely different angle is not flagged", D(msgsDifferent).repeated === false);

  // ── 2. THE REAL FAILURE, VERBATIM ─────────────────────────────────────────
  // Session 3, replies 32-34. Three replies, each with its own opening paragraph and the same
  // closing question word for word. The detector returned false before every one of them.
  const Q = "Ποιο από τα δύο σε νοιάζει περισσότερο — να κάνει το σωστό ή να πουλήσει;";
  const real3 = [
    { role: "assistant", content: Q },
    { role: "assistant", content: "Πιθανώς ακριβώς όπως εσύ τώρα — ρωτώντας χωρίς να ξέρουν ακόμα τι ψάχνουν.\n\n" + Q },
    { role: "assistant", content: "Έχω την αίσθηση ότι απομακρυνόμαστε από αυτό που σε απασχολεί πραγματικά.\n\n" + Q },
  ];
  assert("REAL: the same closing question in three consecutive replies is caught",
    D(real3).repeated === true);
  assert("REAL: it is reported as a repeated question, not mislabelled as opening or overlap",
    D(real3).sameQuestion === true && D(real3).sameOpening === false);

  // WHY THE THRESHOLD IS THREE, PINNED AS THE DECISION IT IS. Two in a row must NOT fire, because
  // the legitimate template below reuses the same closing question on newly-named material — and a
  // two-in-a-row rule would therefore re-open exactly the false positive hasSubstantialNewContent
  // was added to fix. This is not a tuned number; it is the line between applying a template and
  // being stuck, and the real session produced three.
  assert("two consecutive replies with the same question do NOT fire — deliberately",
    D(real3.slice(1)).sameQuestion !== true);
  assert("…and the last two of the real trio are not flagged by any other trigger either",
    D(real3.slice(1)).repeated === false);

  // NON-VACUITY: prove the exemption and the overlap threshold were both silent on this pair, so
  // the assertions above test the new trigger rather than something the old ones would have caught.
  const words = s => new Set(s.toLowerCase().match(/[a-zα-ωάέήίόύώϊϋΐΰ]{5,}/g) || []);
  const a = words(real3[2].content), b = words(real3[1].content);
  const uniqA = [...a].filter(w => !b.has(w)).length, uniqB = [...b].filter(w => !a.has(w)).length;
  assert("NON-VACUITY: each real reply has ≥2 unique words, so hasSubstantialNewContent was true",
    uniqA >= 2 && uniqB >= 2);
  const shared = [...a].filter(w => b.has(w)).length;
  assert("NON-VACUITY: whole-reply overlap was under 0.55, so that trigger was silent too",
    shared / Math.max(a.size, b.size, 1) <= 0.55);

  // A THREE-TIME REPEAT OF THE LEGITIMATE TEMPLATE IS ALSO STUCK, and firing there is correct.
  // Stated so the threshold is not mistaken for an exemption for templates.
  const legit3 = [
    { role: "assistant", content: "Είπες ότι το ένα φέρνει τύψεις και το άλλο βαρεμάρα. Ανάμεσα στα δύο, ποιο θα επέλεγες να αντέξεις;" },
    { role: "assistant", content: "Είπες ότι το ένα φέρνει άγχος και το άλλο μοναξιά. Ανάμεσα στα δύο, ποιο θα επέλεγες να αντέξεις;" },
    { role: "assistant", content: "Είπες ότι το ένα φέρνει ντροπή και το άλλο θυμό. Ανάμεσα στα δύο, ποιο θα επέλεγες να αντέξεις;" },
  ];
  assert("the same template a THIRD time does fire — that is being stuck, not applying a template",
    D(legit3).sameQuestion === true);

  // ── 3. THE NEW TRIGGER MUST NOT REACH THE LEGITIMATE CASE ─────────────────
  // Reusing a template on new material yields a DIFFERENT question, which is exactly why a
  // verbatim-question check cannot re-open the false positive the exemption exists for.
  assert("the template pair's questions differ, so the new trigger cannot fire on them",
    D(msgsFalsePositive).sameQuestion !== true);
  const sameShapeDifferentQ = [
    { role: "assistant", content: "Ένα πράγμα μόνο.\n\nΠοιο από τα δύο σε βαραίνει πιο πολύ τώρα;" },
    { role: "assistant", content: "Κάτι άλλο τώρα.\n\nΠοιο από τα δύο σε κρατάει πιο ακίνητο;" },
  ];
  assert("the same question SHAPE with different wording is not a repeat",
    D(sameShapeDifferentQ).sameQuestion !== true);
  assert("…and that pair does not flag at all",
    D(sameShapeDifferentQ).repeated === false);

  // A reply that ends in a statement rather than a question must never match on emptiness.
  const noQuestions = [
    { role: "assistant", content: "Καλή συνέχεια." },
    { role: "assistant", content: "Καλή αρχή." },
  ];
  assert("two replies with no question do not match on an empty question",
    noQuestions && D(noQuestions).sameQuestion !== true);

  // ── 3b. THE THREE DETAILS THAT SURVIVED MUTATION ──────────────────────────
  // Each of these was found by a mutation that left every other assertion green, so each fixture
  // is written so that only its own mutation can break it.

  // THE 12-CHARACTER FLOOR. A three-character question carries no content; three terse probes in a
  // row are terseness, not being stuck on a question, and matching on near-empty strings would make
  // the trigger fire on punctuation-level coincidence.
  const terse = [
    { role: "assistant", content: "Τι;" },
    { role: "assistant", content: "Τι;" },
    { role: "assistant", content: "Τι;" },
  ];
  assert("a question too short to carry content does not trigger the repeat check",
    D(terse).sameQuestion !== true);
  assert("NON-VACUITY: that trio really is identical, so only the floor can be withholding it",
    terse[0].content === terse[2].content);

  // THE FOLD. Model output varies in capitalisation and spacing between turns; the same question is
  // the same question. Without folding, either difference reads as a new question.
  const QF = "Τι σε κρατάει πίσω αυτή τη στιγμή;";
  const folded = [
    { role: "assistant", content: QF },
    { role: "assistant", content: "Κάτι άλλο.\n\n" + QF.toUpperCase() },
    { role: "assistant", content: "Και κάτι τρίτο.\n\nΤι  σε   κρατάει  πίσω  αυτή  τη  στιγμή;" },
  ];
  assert("the same question with different capitalisation and spacing still counts as the same",
    D(folded).sameQuestion === true);
  assert("NON-VACUITY: the three raw strings are genuinely different, so folding is what matched them",
    folded[0].content !== folded[1].content && folded[1].content !== folded[2].content);

  // THE LAST QUESTION, NOT THE FIRST. A reply may open with a clarifier and close with the real
  // move; it is the closing move that repeats when AURA is stuck.
  const lastNotFirst = [
    { role: "assistant", content: "Τι εννοείς με αυτό;\n\nΠοιο από τα δύο σε βαραίνει περισσότερο τώρα;" },
    { role: "assistant", content: "Και πώς το βλέπεις σήμερα;\n\nΠοιο από τα δύο σε βαραίνει περισσότερο τώρα;" },
    { role: "assistant", content: "Πού ακριβώς κόλλησες;\n\nΠοιο από τα δύο σε βαραίνει περισσότερο τώρα;" },
  ];
  assert("differing opening questions do not hide an identical closing question",
    D(lastNotFirst).sameQuestion === true);
  const firstNotLast = [
    { role: "assistant", content: "Ποιο από τα δύο σε βαραίνει περισσότερο τώρα;\n\nΤι εννοείς με αυτό;" },
    { role: "assistant", content: "Ποιο από τα δύο σε βαραίνει περισσότερο τώρα;\n\nΚαι πώς το βλέπεις σήμερα;" },
    { role: "assistant", content: "Ποιο από τα δύο σε βαραίνει περισσότερο τώρα;\n\nΠού ακριβώς κόλλησες;" },
  ];
  assert("an identical OPENING question with differing closers is not this trigger's business",
    D(firstNotLast).sameQuestion !== true);

  // ── 4. DEGENERATE INPUT ───────────────────────────────────────────────────
  assert("a single assistant reply cannot repeat anything", D([{ role: "assistant", content: "Τι;" }]).repeated === false);
  assert("no assistant replies at all is not a repetition", D([{ role: "user", content: "γεια" }]).repeated === false);
  let threw = false;
  try { D([]); D([{ role: "assistant" }, { role: "assistant" }]); } catch (e) { threw = true; }
  assert("missing content does not throw", !threw);

  // ── 5. IT STAYS AN ADVISORY SIGNAL ────────────────────────────────────────
  // The consumer injects prompt text; it does not block or rewrite. That is unchanged by this
  // commit, and pinned so a later change has to be deliberate.
  const CONSUMER_AT = raw.indexOf('const selfRepCheck = detectAssistantSelfRepetition');
  assert("NON-VACUITY: the consumer is findable", CONSUMER_AT > 0);
  const CONSUMER = raw.slice(CONSUMER_AT, CONSUMER_AT + 1200);
  assert("the consumer names the verbatim-question case, so the signal reaches the model as itself",
    /sameQuestion/.test(CONSUMER));
  assert("it remains advisory — nothing rewrites displayText on this verdict",
    !/displayText\s*=/.test(CONSUMER));
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
