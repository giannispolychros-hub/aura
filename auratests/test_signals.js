// AURA — SIGNAL LAYER
//
// WHAT A SIGNAL IS, and why this file exists separately from the detectors' own tests. A full
// classification of every point where AURA produces a claim about the user established one rule
// that everything here obeys: a SIGNAL requires at least TWO pieces of evidence, both verbatim,
// both code-computed. Never one sentence, never a model judgement, never word frequency.
//
// A measured stress test over the session's real transcripts then split the six candidate signal
// types in two. Types defined by a DIFFERENCE BETWEEN TWO DECLARATIONS (COMMITMENT, SHIFT,
// CONTRADICTION) cannot be true-but-empty: if the two differ, something changed by definition.
// Types defined by FREQUENCY OR ABSENCE (RECURRING within a session, DROPOUT, EMERGENCE) can be
// perfectly true and tell the person nothing — "εισόδημα appeared 3 times" to someone whose stated
// problem is income. That distinction is the relevance gate, and it is a property of the type
// rather than a filter bolted on afterwards.
//
// COMMITMENT is the first signal built because it was the only one with a clean, measured source:
// detectsConcreteStep already separates "θα μιλήσω" from "σκέφτομαι να μιλήσω" with no false
// positives in testing. But it only ever reported the AFTER. The BEFORE — the hedged version it
// deliberately rejects as conditional — was computed and discarded on the same line, which is the
// fourth time that exact pattern has been found in this codebase. A transition needs both halves.
//
// STRICTLY PASSIVE, like the material-evidence and provenance instrumentation before it: nothing
// here reaches the prompt, changes a gate, or is written to storage. Measurement before
// modification. The assertions below hold that, and will fail first if it changes.

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
  const a = CODE.indexOf('function ' + name + '(');
  return a < 0 ? null : CODE.slice(a, CODE.indexOf('\n}', a) + 2);
}

// Self-contained, per the suite-wide convention: each is eval'd on its own, so a function that
// reached for a module-level const would break here first.
const SRC_CLASSIFY = extract('classifyStepIntent');
const SRC_BUILD = extract('buildCommitmentSignal');
const SRC_STEP = extract('detectsConcreteStep');
assert('classifyStepIntent exists', SRC_CLASSIFY !== null);
assert('buildCommitmentSignal exists', SRC_BUILD !== null);
assert('detectsConcreteStep still exists', SRC_STEP !== null);
// Assignment form, not bare eval: `let X = null` followed by eval of `function X(){}` is a
// redeclaration SyntaxError, which surfaces as a failing assertion about the source rather than
// about the harness. Same class of self-inflicted extraction bug hit twice already today.
let classifyStepIntent = null, buildCommitmentSignal = null, detectsConcreteStep = null;
const load = (src, name, set) => {
  if (!src) return;
  try { set(eval('(' + src.slice(src.indexOf('function')) + ')')); }
  catch (e) { assert(name + ' evaluates alone: ' + e.message, false); }
};
load(SRC_CLASSIFY, 'classifyStepIntent', f => { classifyStepIntent = f; });
load(SRC_BUILD, 'buildCommitmentSignal', f => { buildCommitmentSignal = f; });
load(SRC_STEP, 'detectsConcreteStep', f => { detectsConcreteStep = f; });

// ── LOCKSTEP ───────────────────────────────────────────────────────────────
// The two functions must recognise the SAME set of action phrases, or the pair goes out of step:
// a "before" whose verb the committed side cannot produce is a transition that can never complete.
// Same coupling discipline as parseRoadMap and its display strip.
if (SRC_CLASSIFY && SRC_STEP) {
  const baseOf = src => { const m = src.match(/const base = (\/[\s\S]*?\/i);/); return m ? m[1] : null; };
  assert('LOCKSTEP: both declare a `base` pattern', baseOf(SRC_CLASSIFY) !== null && baseOf(SRC_STEP) !== null);
  assert('LOCKSTEP: the two base patterns are character-identical',
    baseOf(SRC_CLASSIFY) === baseOf(SRC_STEP));
}

// ── REGRESSION: detectsConcreteStep is untouched ───────────────────────────
// It gates the Clarity + Ownership Scale and decideTermination. This commit must not move it.
if (typeof detectsConcreteStep === 'function') {
  assert('REGRESSION: a committed step is still detected',
    detectsConcreteStep('Θα μιλήσω στον διευθυντή τη Δευτέρα') === true);
  assert('REGRESSION: a weighed thought is still rejected',
    detectsConcreteStep('Σκέφτομαι να μιλήσω στον διευθυντή') === false);
  assert('REGRESSION: a negation is still rejected',
    detectsConcreteStep('Δεν θα μιλήσω στον διευθυντή') === false);
  assert('REGRESSION: ordinary text is still rejected',
    detectsConcreteStep('Τι ώρα είναι;') === false);
}

// ── classifyStepIntent — the BEFORE half, recovered ────────────────────────
if (typeof classifyStepIntent === 'function') {
  const stage = t => { const r = classifyStepIntent(t); return r ? r.stage : null; };
  assert('CLASSIFY: "Θα μιλήσω στον διευθυντή" is committed', stage('Θα μιλήσω στον διευθυντή') === 'committed');
  assert('CLASSIFY: "Ίσως θα μιλήσω" is considered — the half that was discarded',
    stage('Ίσως θα μιλήσω') === 'considered');
  assert('CLASSIFY: "Μήπως θα του πω" is considered', stage('Μήπως θα του πω') === 'considered');
  assert('CLASSIFY: "Σκέφτομαι μήπως θα του πω" is considered',
    stage('Σκέφτομαι μήπως θα του πω') === 'considered');
  assert('CLASSIFY: "Αν θα μιλήσω…" is considered', stage('Αν θα μιλήσω, θα αλλάξει κάτι;') === 'considered');

  // KNOWN LIMIT, PINNED RATHER THAN HIDDEN. The shared `base` pattern requires "θα". The most
  // natural Greek hesitation — "σκέφτομαι να μιλήσω", with να and no θα — never reaches the
  // conditional branch at all, so the BEFORE half is only recoverable when the hedge still carries
  // θα. An earlier draft of this file asserted the opposite and was wrong about its own mechanism.
  // Widening `base` would break lockstep with detectsConcreteStep and change which steps gate the
  // Clarity + Ownership Scale — a separate decision, made from a specification rather than by
  // chasing examples, which is the rule that came out of the parseRoadMap fix. Until then this
  // signal is NARROW BY CONSTRUCTION, and that is stated here so nobody reads its silence as
  // evidence that no transition happened.
  assert('KNOWN LIMIT: "Σκέφτομαι να μιλήσω" is invisible — no θα, so `base` never matches',
    classifyStepIntent('Σκέφτομαι να μιλήσω στον διευθυντή') === null);
  assert('KNOWN LIMIT: and detectsConcreteStep agrees — the limit is shared, not introduced here',
    detectsConcreteStep('Σκέφτομαι να μιλήσω στον διευθυντή') === false);
  assert('CLASSIFY: a negation is NEITHER — it is not a stage of commitment',
    classifyStepIntent('Δεν θα μιλήσω στον διευθυντή') === null);
  assert('CLASSIFY: text with no action phrase returns null', classifyStepIntent('Τι ώρα είναι;') === null);
  assert('CLASSIFY: empty and non-string inputs return null',
    classifyStepIntent('') === null && classifyStepIntent(null) === null && classifyStepIntent(undefined) === null);
  assert('CLASSIFY: it reports the verb, so a pair can be matched on the same action',
    (classifyStepIntent('Θα μιλήσω στον διευθυντή') || {}).verb === 'μιλήσω');
  assert('CLASSIFY: the verb is the same on both sides of the transition',
    (classifyStepIntent('Ίσως θα μιλήσω στον διευθυντή') || {}).verb ===
    (classifyStepIntent('Θα μιλήσω στον διευθυντή') || {}).verb);
  assert('CLASSIFY: it returns the sentence verbatim, since a signal must cite evidence',
    (classifyStepIntent('Θα μιλήσω στον διευθυντή') || {}).text === 'Θα μιλήσω στον διευθυντή');
  // EXACT AGREEMENT with the untouched detector — one boolean, one classification, same verdict.
  for (const t of ['Θα μιλήσω στον διευθυντή', 'Σκέφτομαι να μιλήσω', 'Δεν θα μιλήσω', 'Τι ώρα είναι;',
                   'Θα το κάνω', 'Ίσως θα φύγω', 'Μήπως θα του πω']) {
    assert(`AGREEMENT on «${t.slice(0, 30)}»`,
      (stage(t) === 'committed') === detectsConcreteStep(t));
  }
}

// ── buildCommitmentSignal — two evidence or nothing ────────────────────────
if (typeof buildCommitmentSignal === 'function') {
  const considered = { stage: 'considered', verb: 'μιλήσω', text: 'Σκέφτομαι να μιλήσω στον διευθυντή', turn: 2 };
  const committed = { stage: 'committed', verb: 'μιλήσω', text: 'Θα μιλήσω στον διευθυντή τη Δευτέρα', turn: 5 };
  const sig = buildCommitmentSignal({ considered, committed });
  assert('SIGNAL: a complete pair produces a signal', sig !== null);
  assert('SIGNAL: it carries BOTH pieces of evidence, verbatim',
    sig && sig.before === considered.text && sig.after === committed.text);
  assert('SIGNAL: it names the action the transition is about', sig && sig.verb === 'μιλήσω');

  // NO-PATTERN is a valid, explicit outcome. Each of these is a real half-signal that must not
  // become a finding — the third is exactly the gap this commit exists to close.
  assert('NO-PATTERN: considered alone is not a signal',
    buildCommitmentSignal({ considered, committed: null }) === null);
  assert('NO-PATTERN: committed alone is not a signal — what the old code had, and not enough',
    buildCommitmentSignal({ considered: null, committed }) === null);
  assert('NO-PATTERN: an empty or missing pair is not a signal',
    buildCommitmentSignal(null) === null && buildCommitmentSignal({}) === null);
  assert('NO-PATTERN: two different actions are not one transition',
    buildCommitmentSignal({ considered, committed: { ...committed, verb: 'φύγω' } }) === null);
  assert('NO-PATTERN: commitment must come AFTER the hesitation, never before',
    buildCommitmentSignal({ considered: { ...considered, turn: 7 }, committed }) === null);
  assert('NO-PATTERN: same turn is not a transition either',
    buildCommitmentSignal({ considered: { ...considered, turn: 5 }, committed }) === null);
}

// ── CAPTURE WIRING ─────────────────────────────────────────────────────────
assert('CAPTURE: a session ref holds the pair', /const commitmentPair\s*=\s*useRef\(/.test(CODE));
assert('CAPTURE: it is cleared by resetSession — a pair must never cross sessions',
  /commitmentPair\.current = null/.test(CODE));
const _capIdx = CODE.indexOf('classifyStepIntent(');
const _capCall = CODE.indexOf('classifyStepIntent(', _capIdx + 1);
const _dynIdx = CODE.indexOf('const dynamicSuffix = [');
assert('CAPTURE: the capture runs BEFORE dynamicSuffix is built — same pre-API rule as every other user-side detector',
  _capCall > 0 && _dynIdx > 0 && _capCall < _dynIdx);
assert('CAPTURE: it reads the user\'s own message, not AURA\'s reply',
  /classifyStepIntent\(\s*lastUserMsgForConcreteStep/.test(CODE));

// ── PASSIVITY ──────────────────────────────────────────────────────────────
// Nothing here may reach the model or the disk yet. The Blueprint consumes it later, by its own
// commit; until then this is measurement only.
assert('PASSIVE: no commitment signal is registered in dynamicSuffix',
  !/dynamicSuffix\s*=\s*\[[^\]]*commitment/is.test(CODE));
assert('PASSIVE: nothing about it is written to storage',
  !/commitmentPair[\s\S]{0,300}(saveMemory|setItem|setMemory)/.test(CODE));
assert('PASSIVE: the prompt knows nothing about it',
  !/commitmentPair|classifyStepIntent|buildCommitmentSignal/.test(PROMPT));
assert('PASSIVE: concreteStepStated — the existing gate — is untouched by the new capture',
  /if \(!concreteStepStated\.current && lastUserMsgForConcreteStep && detectsConcreteStep\(/.test(CODE));

// ── SIGNAL 2 — RECURRING (cross-session) ───────────────────────────────────
// The only signal type that survived the stress test on real transcripts without qualification,
// and the reason is worth stating because it is the whole defence against vacuity:
//
//   A FREQUENT word is chosen by nobody. A KEPT word is chosen by the person, twice, in two
//   different sessions, as the answer to "what do you keep from this".
//
// "εισόδημα appeared 3 times" in a session about income is true and empty — the measured failure
// that stopped the word-frequency approach. "You chose εισόδημα as what you keep, in two separate
// sessions" is a different kind of fact: the repetition is a decision, not a word count. The
// adversarial fixtures below hold that line, including the uncomfortable case where the kept word
// is also the unavoidable topic word.
//
// countPriorWordEchoes already returned the COUNT. It threw away which anchors produced it, so
// the number could be stated but never shown. This returns the occurrences themselves, so the
// Blueprint's ΤΙ ΕΠΑΝΗΛΘΕ zone can display evidence instead of an assertion.
//
// Exact matching, by decision: a rare but always-correct signal beats a more frequent one built on
// a stemmer that is measurably inconsistent (χρόνος→χρον but χρόνο→χρονο).

const SRC_RECUR = extract('buildRecurringSignal');
assert('buildRecurringSignal exists', SRC_RECUR !== null);
let buildRecurringSignal = null;
load(SRC_RECUR, 'buildRecurringSignal', f => { buildRecurringSignal = f; });

if (typeof buildRecurringSignal === 'function') {
  const W = 'trajectory_word';
  const anchor = (text, at, before) => ({ category: W, text, createdAt: at, before: before || null, status: 'resolved' });
  const mem = list => ({ anchors: list });

  // ── The signal itself ────────────────────────────────────────────────────
  const twice = mem([
    anchor('χρόνος', 1000, 'Δεν ξέρω αν να αλλάξω δουλειά.'),
    anchor('χρόνος', 2000, 'Πάλι το ίδιο θέμα με τη δουλειά.'),
  ]);
  const sig = buildRecurringSignal(twice, 'χρόνος');
  assert('RECURRING: the same kept word in two sessions is a signal', sig !== null);
  assert('RECURRING: it reports the count', sig && sig.count === 2);
  assert('RECURRING: it returns the OCCURRENCES, not just a number — this is the whole point',
    sig && Array.isArray(sig.occurrences) && sig.occurrences.length === 2);
  assert('RECURRING: each occurrence carries what the person came in with that time',
    sig && sig.occurrences[0].before === 'Δεν ξέρω αν να αλλάξω δουλειά.' &&
    sig.occurrences[1].before === 'Πάλι το ίδιο θέμα με τη δουλειά.');
  assert('RECURRING: occurrences are in chronological order, oldest first',
    sig && sig.occurrences[0].at === 1000 && sig.occurrences[1].at === 2000);
  assert('RECURRING: unsorted input is still returned in order',
    (() => { const r = buildRecurringSignal(mem([anchor('χρόνος', 2000), anchor('χρόνος', 1000)]), 'χρόνος');
             return r && r.occurrences[0].at === 1000; })());

  // ── NO-PATTERN ───────────────────────────────────────────────────────────
  assert('NO-PATTERN: one occurrence is not a recurrence',
    buildRecurringSignal(mem([anchor('χρόνος', 1000)]), 'χρόνος') === null);
  assert('NO-PATTERN: no anchors at all', buildRecurringSignal(mem([]), 'χρόνος') === null);
  assert('NO-PATTERN: missing or malformed memory does not throw',
    buildRecurringSignal(null, 'χρόνος') === null && buildRecurringSignal({}, 'χρόνος') === null);
  assert('NO-PATTERN: an empty or whitespace word',
    buildRecurringSignal(twice, '') === null && buildRecurringSignal(twice, '   ') === null &&
    buildRecurringSignal(twice, null) === null);
  assert('NO-PATTERN: anchors of another category are not counted',
    buildRecurringSignal(mem([{ category: 'άλλο', text: 'χρόνος', createdAt: 1 },
                              { category: 'άλλο', text: 'χρόνος', createdAt: 2 }]), 'χρόνος') === null);

  // ── ADVERSARIAL 1: the unavoidable topic word ────────────────────────────
  // The hard case. Someone whose problem is money keeps "χρήματα" in two sessions. By frequency
  // this is the emptiest possible finding. By CHOICE it is not: they were asked what they keep and
  // answered the same thing twice, months apart. The signal fires, and that is correct — what
  // keeps it honest is the schema, which lets this reach PATTERN and stops it becoming a
  // REFLECTION about who they are (Κ5). The distinction is choice, not rarity.
  const money = mem([anchor('χρήματα', 1000, 'Δεν βγαίνω οικονομικά.'), anchor('χρήματα', 9000, 'Πάλι τα οικονομικά.')]);
  assert('ADVERSARIAL: an unavoidable topic word, CHOSEN twice, is still a real recurrence',
    buildRecurringSignal(money, 'χρήματα') !== null);

  // ── ADVERSARIAL 2: trivial keepers are not evidence ──────────────────────
  // What a person types to move past a question, not what they chose to keep. A recurrence of
  // "ναι" says something about the prompt, never about them.
  for (const junk of ['ναι', 'όχι', 'οκ', 'ok', 'εντάξει', 'τίποτα', 'δεν ξέρω', 'καλά']) {
    assert(`ADVERSARIAL: the trivial keeper «${junk}» never becomes a signal`,
      buildRecurringSignal(mem([anchor(junk, 1000), anchor(junk, 2000)]), junk) === null);
  }
  assert('ADVERSARIAL: a one- or two-character keeper is not a word',
    buildRecurringSignal(mem([anchor('α', 1), anchor('α', 2)]), 'α') === null &&
    buildRecurringSignal(mem([anchor('δε', 1), anchor('δε', 2)]), 'δε') === null);

  // ── ADVERSARIAL 3: matching ──────────────────────────────────────────────
  assert('MATCHING: case and surrounding whitespace do not split one word into two',
    (() => { const r = buildRecurringSignal(mem([anchor('Χρόνος', 1), anchor('  χρόνος ', 2)]), 'χρόνος');
             return r !== null && r.count === 2; })());
  assert('MATCHING: the word is reported as the person actually wrote it, not lowercased',
    (() => { const r = buildRecurringSignal(mem([anchor('Χρόνος', 1), anchor('Χρόνος', 2)]), 'χρόνος');
             return r && r.word === 'Χρόνος'; })());
  // KNOWN LIMIT, PINNED. Decision (α): exact matching. Greek inflection therefore splits one
  // concept into separate words, and the existing stemmer cannot be used because it is measurably
  // inconsistent — χρόνος and χρόνου both stem to χρον, but χρόνο stems to χρονο. A rare but
  // always-correct signal was chosen over a more frequent one built on that. Silence here is not
  // evidence that nothing recurred.
  assert('KNOWN LIMIT: «χρόνος» and «χρόνο» are two different words under exact matching',
    buildRecurringSignal(mem([anchor('χρόνος', 1), anchor('χρόνο', 2)]), 'χρόνος') === null);

  // ── ADVERSARIAL 4: a phrase, not a word ──────────────────────────────────
  // The question asks for "λέξεις ή σύντομες φράσεις", so a kept phrase is a legitimate answer.
  assert('ADVERSARIAL: a kept PHRASE recurs the same way a word does',
    buildRecurringSignal(mem([anchor('ο χρόνος με τα παιδιά', 1), anchor('ο χρόνος με τα παιδιά', 2)]),
                         'ο χρόνος με τα παιδιά') !== null);

  // ── PASSIVITY ────────────────────────────────────────────────────────────
  assert('PASSIVE: buildRecurringSignal reads memory and returns — it writes nothing',
    !/saveMemory|setMemory|setItem/.test(SRC_RECUR));
  assert('PASSIVE: the prompt knows nothing about it', !/buildRecurringSignal/.test(PROMPT));
  assert('PASSIVE: it is not registered in dynamicSuffix',
    !/dynamicSuffix\s*=\s*\[[^\]]*[Rr]ecurring/is.test(CODE));
  assert('REGRESSION: countPriorWordEchoes and the LITERAL ECHO note are untouched',
    /function countPriorWordEchoes/.test(CODE) && /LITERAL ECHO/.test(CODE));
}

// ── BLUEPRINT ZONES — the first place the Evidence Architecture reaches the user ───────────────
// Three zones, every one of them OPTIONAL. A zone with no evidence behind it is ABSENT, never an
// empty frame with a dash in it: the sheet must never imply that nothing recurred when the truth
// is that the signal cannot see it. Both signals shipped so far are narrow by construction and
// their silence is not evidence of absence — that is pinned in this file twice already.
//
// ΜΠΗΚΕΣ ΜΕ        EVIDENCE  — the person's first message, verbatim (anchor.before)
// ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ  PATTERN   — the RECURRING signal, with its occurrences attached
// ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ EVIDENCE — the ΑΓΝΩΣΤΟ the person named themselves, from the road map
//
// SHIFT is deliberately absent: its Declaration A has no provenance chain, which is recorded in
// ARCHITECTURE_DECISIONS.md rather than worked around here.
//
// buildBlueprintZones is a PURE ASSEMBLER. It takes the recurring signal as an argument instead
// of computing it, so it stays self-contained for the suite's per-function extraction, and so the
// zones can be tested without a memory fixture pretending to be a whole session.

const SRC_ZONES = extract('buildBlueprintZones');
assert('buildBlueprintZones exists', SRC_ZONES !== null);
let buildBlueprintZones = null;
load(SRC_ZONES, 'buildBlueprintZones', f => { buildBlueprintZones = f; });

if (typeof buildBlueprintZones === 'function') {
  const W = 'trajectory_word';
  const mem = list => ({ anchors: list });
  const anch = (text, at, before) => ({ category: W, text, createdAt: at, before: before || null, status: 'resolved' });
  const recurring = { word: 'χρόνος', count: 2, occurrences: [
    { text: 'χρόνος', at: 1000, before: 'Δεν ξέρω αν να αλλάξω δουλειά.' },
    { text: 'χρόνος', at: 2000, before: 'Πάλι το ίδιο με τη δουλειά.' },
  ] };
  const keyOf = z => z.map(x => x.key).join(',');

  // ── All three present ────────────────────────────────────────────────────
  const full = buildBlueprintZones(mem([anch('χρόνος', 2000, 'Δεν ξέρω αν να αλλάξω δουλειά.')]),
                                   recurring, 'Αν επιτρέπεται δεύτερη απασχόληση');
  assert('ZONES: all three render, in order', keyOf(full) === 'entered,recurring,open');
  assert('ZONES: ΜΠΗΚΕΣ ΜΕ carries the first message verbatim',
    full[0].text === 'Δεν ξέρω αν να αλλάξω δουλειά.' && full[0].kind === 'evidence');
  assert('ZONES: ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ is a PATTERN and carries its occurrences, not just a count',
    full[1].kind === 'pattern' && full[1].count === 2 && full[1].occurrences.length === 2);
  assert('ZONES: ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ carries the unknown the person named',
    full[2].text === 'Αν επιτρέπεται δεύτερη απασχόληση' && full[2].kind === 'evidence');
  assert('ZONES: every zone carries a Greek label for the sheet',
    full.every(z => typeof z.label === 'string' && z.label.length > 3));

  // ── ABSENCE IS ABSENCE — the rule the whole redesign turns on ────────────
  assert('ABSENT: no recurring signal → the zone does not exist at all',
    keyOf(buildBlueprintZones(mem([anch('χρόνος', 1, 'πρώτο')]), null, 'κάτι')) === 'entered,open');
  assert('ABSENT: no unknown from the road map → the zone does not exist',
    keyOf(buildBlueprintZones(mem([anch('χρόνος', 1, 'πρώτο')]), recurring, null)) === 'entered,recurring');
  assert('ABSENT: no stored first message → the zone does not exist',
    keyOf(buildBlueprintZones(mem([anch('χρόνος', 1, null)]), recurring, 'κάτι')) === 'recurring,open');
  assert('ABSENT: an empty-string unknown is absence, not an empty zone',
    keyOf(buildBlueprintZones(mem([anch('χρόνος', 1, 'πρώτο')]), recurring, '   ')) === 'entered,recurring');
  // The floor is a guard against a CALLER handing over a weak signal: buildRecurringSignal can
  // never produce count 1, but buildBlueprintZones takes the signal as an argument and must not
  // trust it. Without this the >= 2 could be lowered with nothing failing.
  assert('FLOOR: a single occurrence handed in from outside is NOT a pattern zone',
    keyOf(buildBlueprintZones(mem([anch('χρόνος', 1, 'πρώτο')]),
      { word: 'χρόνος', count: 1, occurrences: [{ text: 'χρόνος', at: 1, before: 'πρώτο' }] },
      null)) === 'entered');
  assert('FLOOR: a signal with a count but no occurrences array is not a pattern zone',
    keyOf(buildBlueprintZones(mem([anch('χρόνος', 1, 'πρώτο')]),
      { word: 'χρόνος', count: 5 }, null)) === 'entered');
  assert('ABSENT: the typical first session renders ONE zone, and that is a valid sheet',
    keyOf(buildBlueprintZones(mem([anch('χρόνος', 1, 'πρώτο')]), null, null)) === 'entered');
  assert('ABSENT: nothing at all returns an empty list, never a placeholder',
    JSON.stringify(buildBlueprintZones(mem([]), null, null)) === '[]');
  assert('ABSENT: malformed memory does not throw',
    Array.isArray(buildBlueprintZones(null, null, null)) &&
    Array.isArray(buildBlueprintZones({}, null, null)));
  assert('NO PLACEHOLDER: no zone is ever emitted with empty content',
    full.every(z => z.kind !== 'evidence' || (typeof z.text === 'string' && z.text.trim().length > 0)));

  // ── ΜΠΗΚΕΣ ΜΕ takes the LATEST session's opening, not the oldest ─────────
  assert('ZONES: with several stored sessions, ΜΠΗΚΕΣ ΜΕ is this session\'s opening',
    buildBlueprintZones(mem([anch('χρόνος', 1000, 'παλιό'), anch('χρόνος', 5000, 'πρόσφατο')]),
                        null, null)[0].text === 'πρόσφατο');
}

// ── RENDERING — the zones must actually reach the sheet ────────────────────
const SRC_BP = extract('exportBlueprint');
assert('exportBlueprint located', SRC_BP !== null);
if (SRC_BP) {
  assert('SHEET: the zones are rendered', /zonesHtml/.test(SRC_BP));
  // Scoped to the HTML TEMPLATE, which ends where the Blob is built. Beyond that point the only
  // interpolation is the download filename, which is not markup and not attacker-reachable;
  // including it made this assertion fail on pre-existing, harmless code rather than on anything
  // this commit introduced. test_consent_integrity bounds the same check the same way.
  const _BP_HTML = SRC_BP.slice(SRC_BP.indexOf('<body>'), SRC_BP.indexOf('const blob = new Blob'));
  assert('SHEET: the HTML template was located for the escaping check', _BP_HTML.length > 200);
  assert('SHEET: every interpolation in the sheet still goes through esc() — it is downloaded and shared',
    !/\$\{(?!esc\(|dateStr|keystoneHtml|beatsHtml|zonesHtml|ankerText \?|zones)/.test(_BP_HTML));

  // THE ZONE BUILDER IS WHERE THE USER'S TEXT ACTUALLY ENTERS HTML, and the check above does not
  // reach it: the builder is declared BEFORE the template, so slicing from <body> excluded the
  // only new code that interpolates a person's own sentence into markup. A mutation that dropped
  // esc() from the evidence zone left the suite green. This block covers the builder itself.
  const _ZB = SRC_BP.slice(SRC_BP.indexOf('const zonesHtml'), SRC_BP.indexOf('// TIMELINE REDESIGN'));
  assert('SHEET: the zone builder was located', _ZB.length > 200 && _ZB.includes('zone-card'));
  assert('SHEET: EVERY interpolation inside the zone builder goes through esc()',
    [..._ZB.matchAll(/\$\{([^}]*)/g)].every(m => /^\s*(esc\(|\(z\.occurrences|o\.at \?|o\.before \?|items\b)/.test(m[1])));
  assert('SHEET: the evidence zone escapes the person\'s own sentence',
    /zone-text">\$\{esc\(z\.text\)\}/.test(_ZB));
  assert('SHEET: the recurring zone escapes the word, the count and every quoted opening',
    /esc\(z\.word\)/.test(_ZB) && /esc\(String\(z\.count\)\)/.test(_ZB) && /esc\(o\.before\)/.test(_ZB));
  assert('SHEET: the keystone is still there and still claimed as verbatim',
    /Η φράση που κρατάς/.test(SRC_BP) && /ALWAYS the user's verbatim words/.test(SRC_BP));
  assert('SHEET: the footer still separates what is theirs from what AURA formulated',
    /αυτούσια δική σου/.test(SRC_BP) && /διατύπωσε η AURA/.test(SRC_BP));
  for (const label of ['ΜΠΗΚΕΣ ΜΕ', 'ΕΠΑΝΕΜΦΑΝΙΖΕΤΑΙ', 'ΠΑΡΑΜΕΝΕΙ ΑΝΟΙΧΤΟ']) {
    assert(`SHEET: the label «${label}» exists in the source`, CODE.includes(label));
  }
  assert('SHEET: the recurring zone shows the occurrences, not only the number',
    /occurrences/.test(SRC_BP));
  assert('CALL SITE: the export is given the zones', /exportBlueprint\([^)]*zones/i.test(CODE));
  assert('CALL SITE: the recurring signal is computed from the kept word',
    /buildRecurringSignal\(\s*memory/.test(CODE));
  assert('CALL SITE: the unknown comes from a parsed road map, never from prose',
    /parseRoadMap\([\s\S]{0,200}unknown/.test(CODE) || /unknown[\s\S]{0,200}parseRoadMap\(/.test(CODE));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
