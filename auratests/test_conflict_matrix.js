// LOOP TEST — Detector Conflict Matrix
// Unit tests verify each detector in isolation. Every live bug today came from INTERACTION:
// two mechanisms firing on the same input at the same point. This test runs all four
// deterministic closing-sequence detectors against one battery and flags dangerous overlaps.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();

function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  const e = raw.indexOf('\n}', s) + 2;
  return raw.slice(s, e);
}
eval(extract('isBareEmojiOrAcknowledgment'));
eval(extract('parseThreeBeatShift'));
eval(extract('matchesClosingWord'));
eval(extract('detectsConcreteStep'));

// Battery of realistic Greek user messages spanning the closing surface
const battery = [
  // plain closings
  "Ναι", "Οκ", "Τέλος", "Καληνύχτα", "Επίσης", "Τα λέμε", "Εντάξει",
  // real content (must NOT be closing)
  "Δεν ξέρω τι να κάνω με τη δουλειά μου",
  "Σκέφτομαι να φύγω αλλά φοβάμαι",
  "Τι να διαλέξω;",
  // concrete steps
  "Θα μιλήσω στον διευθυντή μου αύριο",
  "Αποφάσισα να στείλω το email το Σαββατοκύριακο",
  "Θα ξεκινήσω το μεταπτυχιακό τον Σεπτέμβρη",
  // DANGER ZONE: could be read as BOTH closing AND concrete step
  "Θα φύγω",              // φευγω = closing word, but also an action
  "Παω να το κανω",       // παω = closing-ish, but stating an action
  "Φεύγω αύριο για τη νέα δουλειά",  // clearly a concrete step containing 'φευγω'
  // bare emoji / symbols (belong to a different detector)
  "👍", "🙂", "...",
  // three-beat shift text
  "ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη",
];

let passed = 0, failed = 0, warnings = 0;
function assert(desc, cond) {
  if (cond) { passed++; } else { console.log('  FAIL —', desc); failed++; }
}

console.log("=== FULL MATRIX ===");
console.log("message".padEnd(48), "close", "step", "emoji", "shift");
const conflicts = [];
for (const msg of battery) {
  const close = matchesClosingWord(msg);
  const step  = detectsConcreteStep(msg);
  const emoji = isBareEmojiOrAcknowledgment(msg);
  const shift = parseThreeBeatShift(msg) !== null;
  const short = msg.replace(/\n/g, "\\n").slice(0, 46);
  console.log(short.padEnd(48), String(close).padEnd(5), String(step).padEnd(4), String(emoji).padEnd(5), String(shift));
  // DANGEROUS OVERLAP 1: closing AND concrete step on same message
  if (close && step) conflicts.push(msg);
  // DANGEROUS OVERLAP 2: emoji AND anything else (emoji reply should be pure)
  if (emoji && (step || shift)) {
    console.log("  ⚠ emoji + other on:", msg); warnings++;
  }
}

console.log("\n=== CONFLICT ANALYSIS: closing AND concrete-step ===");
if (conflicts.length === 0) {
  console.log("  none — no message triggers both close and solution-development simultaneously");
} else {
  console.log("  ⚠ overlap on:", conflicts.join(" | "));
  warnings += conflicts.length;
}

// The invariants that MUST hold:
console.log("\n=== INVARIANTS ===");
assert("plain 'Ναι' is closing, not a concrete step", matchesClosingWord("Ναι") && !detectsConcreteStep("Ναι"));
assert("real dilemma is neither closing nor step", !matchesClosingWord("Δεν ξέρω τι να κάνω με τη δουλειά μου"));
assert("concrete step is not a bare emoji", !isBareEmojiOrAcknowledgment("Θα μιλήσω στον διευθυντή μου αύριο"));
assert("bare emoji is not a closing word", !matchesClosingWord("👍"));
assert("bare emoji is not a concrete step", !detectsConcreteStep("👍"));
assert("shift text is not flagged as closing", !matchesClosingWord("ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη"));
assert("real concrete step 'θα + verb' detected", detectsConcreteStep("Θα φύγω") && detectsConcreteStep("Θα μιλήσω στον διευθυντή μου αύριο"));
// VERIFIED SCOPE (not a bug — intentional design): detectsConcreteStep targets future-tense
// intentions being FORMED now ("θα + verb"), deliberately NOT present-tense fact statements
// ("φεύγω αύριο") or already-made past decisions ("αποφάσισα να"). Documented so the narrow scope
// is a known, guarded property. Broadening has high blast radius — no change without real evidence.
assert("present-tense fact statement is intentionally NOT a step", !detectsConcreteStep("Φεύγω αύριο για τη νέα δουλειά"));
assert("past-tense decision is intentionally NOT a step", !detectsConcreteStep("Αποφάσισα να στείλω το email το Σαββατοκύριακο"));

// ── CTX-LEVEL CONFLICT: first-reply floor vs method-failure families ──
// Every other assertion in this file compares DETECTORS. This block compares the two CONTEXT
// BLOCKS two detectors produce, because the conflict is not in what they detect — both are
// correct — but in the text they put into the same prompt on the same turn.
//
// THE BUG, reproduced executably before this test was written: a returning user opens with
// "Πάλι τα ίδια, δεν προχωράμε". needsFirstWhy is false, so First-WHY does not intercept and
// generateResponse runs with msgCount === 1. That makes firstReplyFloorCtx active, which forbids
// "Assumption Surfacing, Premise Inversion, Contradiction Detection ... regardless of how the
// material seems". detectsMethodFailureSignal is true on the same message, so methodFailureCtx is
// also active — and it names those same three families as the ones to switch to, "named here so
// no recall is needed". Two directly contradictory instructions, one prompt, one turn.
//
// WHY THE FIX IS NOT ORDERING: the dynamicSuffix tiers already place the floor last, so it wins on
// attention position. That resolution lives in a code comment the model never sees, and the model
// still reads both sentences. The contradictory text must not be PRODUCED, which is what the
// assertions below pin.
//
// SCOPE, verified rather than assumed: methodFailureCtx is the only ctx that can name those three
// families on the same turn as the floor. premiseInversionCtx also names PREMISE INVERSION, but it
// requires binaryOppositionCount >= 2 and that counter increments at most once per turn, so at
// msgCount === 1 it can only be 1. That invariant is asserted below so the exclusion is proved,
// not relied upon.
console.log("\n=== CTX CONFLICT: first-reply floor × method-failure ===");

eval(extract('detectsMethodFailureSignal'));
eval(extract('classifyQuestion'));
eval(extract('isFactQuestion'));
// needsFirstWhy now consults the binary fast-path the prompt prescribes at γρ. 377, so its
// dependency has to be lifted alongside it — a sibling call cannot be evaluated on its own.
eval(extract('detectsBinaryOppositionPhrasing'));
eval(extract('needsFirstWhy'));

const CODE_SPLIT = (() => {
  const i = raw.indexOf('const AURA_CORE_PERSONALITY');
  const s = raw.indexOf('`', i) + 1;
  return raw.slice(0, i) + raw.slice(raw.indexOf('`;', s));
})();

const FORBIDDEN_ON_FIRST_REPLY = ['Assumption Surfacing', 'Premise Inversion', 'Contradiction Detection'];

// Openers that are BOTH a method-failure signal AND not intercepted by First-WHY, so they land in
// generateResponse with msgCount === 1. Verified by running the real detectors, not assumed.
const COLLIDING_OPENERS = [
  'Πάλι τα ίδια, δεν προχωράμε',
  'Δεν προχωράμε καθόλου.',
];
// Same family of complaint, but these do NOT trigger the signal today — kept so the test documents
// the real detector surface instead of implying it is broader than it is.
const NON_COLLIDING_OPENERS = [
  'Πάλι τα ίδια.',
  'Κάνουμε κύκλους.',
  'Δεν με βοηθάει αυτό, ξαναγυρίζουμε στα ίδια.',
  'Έχουμε κολλήσει από την πρώτη ερώτηση.',
];

for (const opener of COLLIDING_OPENERS) {
  assert(`collision precondition holds for "${opener.slice(0, 28)}…" (methodFailure=true, firstWhy=false)`,
    detectsMethodFailureSignal(opener) === true && needsFirstWhy(opener) === false);
}
for (const opener of NON_COLLIDING_OPENERS) {
  assert(`documented non-trigger: "${opener.slice(0, 28)}…" does not raise the method-failure signal today`,
    detectsMethodFailureSignal(opener) === false);
}

// The floor's only live condition is msgCount === 1: showDemo is a hardcoded false constant.
// Pins the SHARED condition rather than an inline expression: the fix's whole point is that one
// named value feeds both blocks, so a future inline copy in either place would defeat it silently.
assert('The floor condition is computed once, named, and is msgCount === 1 (showDemo is a constant false)',
  /const firstReplyFloorActive = \(msgCount === 1 && !showDemo\)/.test(CODE_SPLIT) &&
  /const showDemo = false/.test(CODE_SPLIT) &&
  /const firstReplyFloorCtx = firstReplyFloorActive/.test(CODE_SPLIT));

// The floor must keep naming the three families — it needs them to state the prohibition.
assert('firstReplyFloorCtx still names all three families (it must, to forbid them)',
  (() => {
    const s = CODE_SPLIT.indexOf('const firstReplyFloorCtx');
    const block = CODE_SPLIT.slice(s, CODE_SPLIT.indexOf('const gatesCtx', s));
    return FORBIDDEN_ON_FIRST_REPLY.every(f => block.includes(f));
  })());

// THE FIX ITSELF: methodFailureCtx must be built from the floor condition, and must not name the
// forbidden three when the floor is active.
const mfBlock = (() => {
  const s = CODE_SPLIT.indexOf('const methodFailureCtx');
  const e = CODE_SPLIT.indexOf('if (methodFailureHint.current)', s);
  return e < 0 ? '' : CODE_SPLIT.slice(s, e);
})();
assert('methodFailureCtx block located', mfBlock.length > 200);
assert('CRITICAL: methodFailureCtx is aware of the first-reply floor condition',
  /firstReplyFloor/.test(mfBlock) || /msgCount === 1/.test(mfBlock));
// Discriminating on purpose: the block must contain at least one family list that names NONE of
// the forbidden three. Before the fix there is exactly one list and it names all three, so this
// fails; a loose "does the block mention them at all" check would have passed either way.
assert('CRITICAL: a family list exists that names NONE of the three forbidden families',
  (() => {
    const lists = [...mfBlock.matchAll(/Families[^:]*:([^.]*)\./g)].map(m => m[1]);
    return lists.length > 0 &&
           lists.some(l => FORBIDDEN_ON_FIRST_REPLY.every(f => !l.includes(f)) &&
                           l.includes('VERBATIM COST COLLISION'));
  })());

// The families that survive on a first reply are still named — the switch instruction must not
// become empty, or the ctx stops being useful exactly when the user is already frustrated.
assert('The surviving families are still named on a first reply',
  ['VERBATIM COST COLLISION', 'THIRD TRIGGER', 'EXPRESSIVE VARIATION', 'CHALLENGE lens', 'PERSPECTIVE lens']
    .every(f => mfBlock.includes(f)));

// BEHAVIOURAL, not structural: evaluate the real template and read the text it produces. This is
// the assertion that matters, and it caught a flaw the structural ones missed — the first version
// of the fix removed the three families from the list but re-named them in the sentence explaining
// their absence, so the forbidden names were still in the prompt. Checking the source shape would
// never have shown that; checking the output did.
const mfTemplate = (() => {
  const s = CODE_SPLIT.indexOf('const methodFailureCtx = methodFailureHint.current');
  const e = CODE_SPLIT.indexOf('if (methodFailureHint.current)', s);
  return e < 0 ? null : CODE_SPLIT.slice(CODE_SPLIT.indexOf('?', s), e).trim().replace(/;\s*$/, '');
})();
assert('methodFailureCtx template extracted for evaluation', mfTemplate !== null && mfTemplate.length > 200);

function methodFailureTextWhen(firstReplyFloorActive) {
  return eval('(true ' + mfTemplate + ')');
}

assert('CRITICAL (behavioural): on a first reply the produced text names NONE of the three forbidden families',
  FORBIDDEN_ON_FIRST_REPLY.every(f => !methodFailureTextWhen(true).includes(f)));
assert('CRITICAL (behavioural): from the second reply on it still names all three — normal operation intact',
  FORBIDDEN_ON_FIRST_REPLY.every(f => methodFailureTextWhen(false).includes(f)));
assert('Behavioural: the surviving families are named in BOTH branches, so the switch instruction is never empty',
  ['VERBATIM COST COLLISION', 'THIRD TRIGGER', 'EXPRESSIVE VARIATION', 'CHALLENGE lens', 'PERSPECTIVE lens']
    .every(f => methodFailureTextWhen(true).includes(f) && methodFailureTextWhen(false).includes(f)));
assert('Behavioural: the first-reply branch explains the shorter list rather than leaving it unexplained',
  /FIRST REPLY FLOOR/.test(methodFailureTextWhen(true)));

// premiseInversionCtx cannot co-fire — proved, not assumed.
// RESTATED, STRICTLY STRONGER. This used to count the literal `binaryOppositionCount.current += 1`
// and require exactly one. Wiring the First-WHY branch needed the counter incremented from a second
// place, which that form would have forbidden outright. Rather than relax it to "at most two", both
// paths now route through bumpBinaryOpposition, and the invariant is expressed as what it actually
// means: NOTHING outside that one helper may touch the counter, so "at most once per turn" is a
// property of the code's shape and not of anyone's reading of it.
assert('nothing increments binaryOppositionCount outside bumpBinaryOpposition',
  (CODE_SPLIT.match(/binaryOppositionCount\.current\s*(?:\+=|=(?!\s*0\b))/g) || []).length === 0);
const BUMP_SRC = (() => { const a = CODE_SPLIT.indexOf('function bumpBinaryOpposition('); return a < 0 ? '' : CODE_SPLIT.slice(a, CODE_SPLIT.indexOf('\n}', a) + 2); })();
assert('the helper exists and increments by exactly one, once',
  /counterRef\.current = \(typeof counterRef\.current === "number" \? counterRef\.current : 0\) \+ 1;/.test(BUMP_SRC)
  && (BUMP_SRC.match(/counterRef\.current\s*=(?!=)/g) || []).length === 1);
assert('each caller bumps it at most once per turn — two call sites, the main path and First-WHY',
  (CODE_SPLIT.match(/bumpBinaryOpposition\(binaryOppositionCount/g) || []).length === 2);
assert('premiseInversionCtx therefore still cannot reach its threshold on a first reply',
  /const premiseInversionCtx = deliverOnce\(\(binaryOppositionCount\.current >= 2\)/.test(CODE_SPLIT));
assert('premiseInversionCtx requires binaryOppositionCount >= 2, so it is excluded on a first reply',
  /const premiseInversionCtx = deliverOnce\(\(binaryOppositionCount\.current >= 2\)/.test(CODE_SPLIT));

console.log("\n=== CTX CONFLICT: closing signal × procedural gates ===");

eval(extract('isExplicitClosure'));
// The gates block now suppresses on isExplicitClosure OR declaresClosing, so the simulation below
// needs both in scope. Without this the suite does not fail — it CRASHES, producing no result line
// at all, which the runner treats as fatal precisely because a silent suite is worse than a red one.
eval(extract('declaresClosing'));

// gatesCtx is an inline IIFE, not a named function, so it is located by its own opening text and
// then EVALUATED — the same behavioural approach the first-reply-floor section above uses, and for
// the same reason that section records: a structural "does the source mention isExplicitClosure"
// check would happily pass a fix that calls the detector and then ignores its result. What decides
// this is the text the real template actually produces.
const gatesTemplate = (() => {
  const s = CODE_SPLIT.indexOf('const gatesCtx = (() => {');
  if (s < 0) return null;
  const b = CODE_SPLIT.indexOf('(() => {', s);
  const e = CODE_SPLIT.indexOf('})();', b);
  return e < 0 ? null : CODE_SPLIT.slice(b, e + 5);
})();
assert('gatesCtx IIFE extracted for evaluation', gatesTemplate !== null && gatesTemplate.length > 2000);
assert('The extracted block is the real one — it still contains all three gates',
  gatesTemplate !== null &&
  ['Clarity + Ownership Scale', 'Decision Space Anchors', 'Stakes Question'].every(g => gatesTemplate.includes(g)));

// Evaluates the real template against controlled state: the four refs the block reads, plus `msgs`
// and `msgCount`, so every guard inside it runs exactly as it does in production.
// `roadPending` was added when the road-question stand-down landed inside this block. The harness
// has to supply every ref the real code reads, exactly as it already supplies the four gate flags —
// without it the evaluated template throws ReferenceError and this whole suite silently produces no
// output at all, which is how it first showed up: not as a failure, as an absent count.
function gatesTextWhen({ msgCount, lastUserText, concrete = false, scaleAsked = false, anchors = false, stakes = false, roadPending = false }) {
  const msgs = [
    { role: 'user',      content: 'Έχω ένα δίλημμα με τη δουλειά μου και δεν ξεκαθαρίζει.' },
    { role: 'assistant', content: 'Τι σε κρατάει εκεί;' },
    { role: 'user',      content: 'Η σταθερότητα, κυρίως.' },
    { role: 'assistant', content: 'Και τι σε τραβάει αλλού;' },
    { role: 'user',      content: lastUserText },
  ];
  const concreteStepStated = { current: concrete };
  const outcomeScaleAsked  = { current: scaleAsked };
  const anchorsInvited     = { current: anchors };
  const stakesAsked        = { current: stakes };
  const roadQuestionState  = { current: roadPending ? { roads: ['Χ'], asked: 1, qa: [], mapAcknowledged: true } : null };
  return eval(gatesTemplate);
}

// Exactly two gates due: the Scale is marked asked; Anchors and Stakes are not.
const TWO_DUE = { msgCount: 5, concrete: false, scaleAsked: true, anchors: false, stakes: false };
const SUBSTANTIVE = 'Με φοβίζει ότι θα χάσω τη σταθερότητά μου.';

// CONTROL FIRST, deliberately: without it the two suppression assertions below could be satisfied
// by a block that returns '' for everything, i.e. by breaking the gates entirely.
assert('CONTROL: two gates due + a substantive last message → gatesCtx still fires (normal operation intact)',
  gatesTextWhen({ ...TWO_DUE, lastUserText: SUBSTANTIVE }) !== '');
assert('CONTROL: that output really carries BOTH due gates, not merely some text',
  (() => { const t = gatesTextWhen({ ...TWO_DUE, lastUserText: SUBSTANTIVE });
           return t.includes('Decision Space Anchors') && t.includes('Stakes Question'); })());

// THE FIX ITSELF.
assert('CRITICAL: on the turn the user says «κλείνουμε», gatesCtx is silent',
  gatesTextWhen({ ...TWO_DUE, lastUserText: 'κλείνουμε' }) === '');
assert('CRITICAL: the agreement-prefixed form «Εντάξει, κλείνουμε» is suppressed too',
  gatesTextWhen({ ...TWO_DUE, lastUserText: 'Εντάξει, κλείνουμε' }) === '');

// DETECTOR CHOICE, PINNED BEHAVIOURALLY — the assertions that actually rule out the wrong fix.
// Swapping isExplicitClosure for the broader matchesClosingWord leaves every CRITICAL assertion
// above green while silently suppressing the gates on ordinary mid-session agreement. Measured over
// a 38-message corpus before choosing: on 15 realistic mid-session acknowledgments the broad
// detector matches 13 and the narrow one 0, while on 16 genuine closings the two score identically.
// «Κατάλαβα» / «Ακριβώς» are the sharpest case — the user has just converged on something nameable,
// which is the best moment to invite Decision Space Anchors, not to withhold it.
for (const ack of ['Ναι', 'Οκ', 'Εντάξει', 'Κατάλαβα', 'Ακριβώς', 'Νομίζω ναι', 'Φτάσαμε']) {
  assert(`Mid-session acknowledgment «${ack}» must NOT suppress the gates (this is what rules out the broad detector)`,
    gatesTextWhen({ ...TWO_DUE, lastUserText: ack }) !== '');
}
assert('The guard names isExplicitClosure (narrow); matchesClosingWord must not appear in this block',
  gatesTemplate !== null && /isExplicitClosure\(/.test(gatesTemplate) && !/matchesClosingWord\(/.test(gatesTemplate));

// The block's pre-existing guards are untouched.
assert('UNCHANGED: the msgCount < 3 guard still wins — before turn 3 the block is silent anyway',
  gatesTextWhen({ ...TWO_DUE, msgCount: 2, lastUserText: SUBSTANTIVE }) === '');
assert('UNCHANGED: with all three gates satisfied the block still returns "" whatever the message',
  gatesTextWhen({ msgCount: 5, scaleAsked: true, anchors: true, stakes: true, lastUserText: SUBSTANTIVE }) === '');

// ONE OF THE TWO KNOWN GAPS IS NOW CLOSED, and the assertion is inverted deliberately rather than
// deleted. It used to read "«Θα το σκεφτώ. Κλείνουμε.» is NOT suppressed" and was pure
// documentation of isExplicitClosure's whole-message requirement. Then three real sessions produced
// that exact shape — "…ευχαριστώ κλείνουμε", "Ναι θα το κάνω. Ευχαριστώ", "Θα το σκεφτώ...
// ευχαριστώ" — and in session 1 the cost was measured: the gates suffix was not withheld, AURA
// asked another question after the close, and the road artifact recorded that departure as the
// user's thinking about ΔΡΟΜΟΣ 1. declaresClosing now sits beside isExplicitClosure here, so this
// case is suppressed. What the assertion tests is unchanged; what it expects is the opposite.
assert('GAP CLOSED: «Θα το σκεφτώ. Κλείνουμε.» IS suppressed now — declaresClosing covers a closing that carries content',
  gatesTextWhen({ ...TWO_DUE, lastUserText: 'Θα το σκεφτώ. Κλείνουμε.' }) === '');
// NON-VACUITY: the narrow detector alone still does not catch it, so the line above is testing the
// new detector rather than a change in the old one.
assert('NON-VACUITY: isExplicitClosure alone still returns false on that message',
  isExplicitClosure('Θα το σκεφτώ. Κλείνουμε.') === false);
// AND THE SECOND GAP IS STILL A GAP, unchanged by this commit — «Τέλος ε;» needs the trailing «ε»
// stripped, which only matchesClosingWord does, and "τέλος" is deliberately absent from tier A
// because "τέλος πάντων" means "anyway".
// isExplicitClosure requires the WHOLE message to reduce to closing words, and unlike
// matchesClosingWord it does not strip the colloquial trailing «ε». Both are also true of
// decideTermination, which uses the same detector — so this change does not widen an existing gap.
assert('KNOWN GAP (documented): «Τέλος ε;» is NOT suppressed — isExplicitClosure does not strip the trailing «ε»',
  gatesTextWhen({ ...TWO_DUE, lastUserText: 'Τέλος ε;' }) !== '');

// ROAD-QUESTION STAND-DOWN, now checkable because the harness carries the ref. Two "ask this"
// instructions in one prompt is the collision this repo already paid for once, in the same block.
assert('STAND-DOWN: with a road question pending, gatesCtx is silent even with two gates due',
  gatesTextWhen({ ...TWO_DUE, lastUserText: SUBSTANTIVE, roadPending: true }) === '');
assert('STAND-DOWN: with no road question pending, gatesCtx is unaffected',
  gatesTextWhen({ ...TWO_DUE, lastUserText: SUBSTANTIVE, roadPending: false }) !== '');

console.log("\n" + passed + " invariants passed, " + failed + " failed, " + warnings + " overlap warnings");
process.exit(failed > 0 ? 1 : 0);
