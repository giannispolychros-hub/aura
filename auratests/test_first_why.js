// ── FIRST-WHY: THE ENTRY PILLAR, AND THE FACTS THAT MUST NOT DRIFT ──────────
//
// WHAT IT IS. The prompt names four pillars and calls them "the essence of the application"
// (γρ. 197). First-WHY is the ENTRY pillar (γρ. 198). It is a CLIENT-SIDE INTERCEPT: on the first
// message of a session it renders a fixed card and returns WITHOUT calling the model, so the model
// never gets a chance to guess why the user came. That is Zero Inference enforced structurally
// rather than by instruction — the opposite of the fifteen prompt-only rules mapped in item 3.
//
// WHY THIS SUITE EXISTS. Three facts about it were established by measurement on 2026-09-25 and
// none of them were locked anywhere, so any of them could change silently:
//
//   1. THE CARD'S WORDING DRIFTED FROM THE SPEC. The prompt prescribes
//      "Γιατί έχει σημασία αυτό για σένα τώρα;" and BOTH copies in the code dropped the "τώρα" —
//      the visible card, and, more importantly, the assistant message injected into the history
//      the model then reads. "Τώρα" is what makes the question about this moment rather than about
//      general significance, which is the whole point of asking it at entry.
//   2. THE TURN IS UNGUARDED. The branch calls callAura directly instead of generateResponse, so
//      22 post-processing steps that run on every other turn do not run on this one — including
//      every detector that sets a latch, the road-map parse, and the No-Advice guards. If the
//      reachability gate below is ever opened, this turn becomes a COMMON path, and it currently
//      has no output guards at all. That ordering matters more than the gate decision itself.
//   3. IT IS UNREACHABLE BY DEFAULT. First-WHY requires !isBrandNewUserMsg — a returning user,
//      defined as one with a stored anchor or trajectory. Those are written only when
//      memory.storageEnabled is true, and that defaults to FALSE. So on default settings the entry
//      pillar cannot fire for anyone, and the prompt's own evidence (γρ. 109) is "0 of 20 real
//      users returned after first use, and the entry point is the leading suspect".
//
// The gate assertions below LOCK THE CURRENT BEHAVIOUR ON PURPOSE. Opening the gate is a live
// product decision; if it is taken, these tests must fail loudly and be updated deliberately,
// together with the ARCHITECTURE_DECISIONS entry — not drift.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('classifyQuestion'));
eval(extract('isFactQuestion'));
eval(extract('needsFirstWhy'));
eval(extract('detectsBinaryOppositionPhrasing'));
eval(extract('bumpBinaryOpposition'));

let passed = 0, failed = 0;
function assert(name, cond) { if (cond) { passed++; console.log("PASS — " + name); } else { failed++; console.log("FAIL — " + name); } }

// ── 1. THE QUESTION IS SPELLED THE SAME IN ALL THREE PLACES ───────────────
// The prompt is the specification. The two code copies must match it, and the injected one is the
// one the model reads back as its own previous turn.
const SPEC = "Γιατί έχει σημασία αυτό για σένα τώρα;";
assert("the prompt still prescribes the question this suite treats as the specification",
  raw.includes('First-WHY (1st message + low emotion + minimal context): "' + SPEC + '"'));
const CODE_ONLY = raw.slice(raw.indexOf('function needsFirstWhy'));
const injected = CODE_ONLY.match(/role:\s*"assistant",\s*content:\s*"(Γιατί[^"]*)"/);
assert("the assistant message injected into the model's own history matches the spec exactly",
  !!injected && injected[1] === SPEC);
// Anchored on className, not on the bare class name: the first "first-why-q" in the file is the
// CSS rule, and a slice that starts there runs off into the stylesheet and measures nothing.
const card = CODE_ONLY.match(/className="first-why-q">\s*([^<]*?)\s*</);
assert("the card markup was located, so the assertion below is not vacuous", !!card);
assert("the visible card matches the spec exactly", !!card && card[1].trim() === SPEC);
assert("no copy of the question survives without 'τώρα'",
  !/Γιατί έχει σημασία αυτό για σένα;/.test(CODE_ONLY));

// ── 2. THE TRIGGER, EXACTLY AS MEASURED ───────────────────────────────────
const S3 = "«Ξέρω ότι θέλω να αλλάξω τη ζωή μου, αλλά δεν μπορώ να καταλάβω αν αυτό που ψάχνω είναι πραγματικά περισσότερα χρήματα ή αν απλώς θέλω να φύγω από τη ζωή που έχω τώρα. Δεν ξέρω καν ποια από τις δύο εκδοχές είναι η αληθινή.»";
const S5 = "Θέλω να κάνω μια αλλαγή στη ζωή μου. Ο στόχος μου είναι να βγάζω 4000 ευρώ το μήνα. Είμαι δημόσιος υπάλληλος και θέλω να βρω λύση για το έξτρα εισόδημα";
const TEACHER = "Είμαι εκπαιδευτικός στη νοσηλευτική στο τμήμα ειδικής αγωγής, νεοδιοριστος. Βλέπω πλέον ότι τα 1300 ευρώ δε φτάνουν για ποιοτητικη ζωηυ .. στα 41 έτη μου δεν έχω κ πολλές επιλογές για να αυξήσω το εισόδημα μου έχοντας 4 παιδιά";
assert("a stated goal with no stated stake triggers it — the case the card is for",
  needsFirstWhy(S5) === true);
assert("an opening over 60 words does not trigger it (RT-08)",
  needsFirstWhy(new Array(70).fill("δεν ξέρω αν").join(" ")) === false);
assert("grief wording does not trigger it (RT-21)",
  needsFirstWhy("έχασα τον πατέρα μου και δεν ξέρω τι να κάνω") === false);
assert("the teacher's opening does not trigger it — no signal pattern matches, which is why the "
  + "session that broke never saw it", needsFirstWhy(TEACHER) === false);

// ── 3. THE FAST-PATH SKIP THE PROMPT PRESCRIBES IS NOW IMPLEMENTED ────────
// γρ. 377 names it explicitly: skip when the first message already carries a structurally
// detectable signal, "e.g. binary phrasing already caught by binaryOppositionCount". Session 3's
// real opening IS binary phrasing and needsFirstWhy used to fire on it anyway — measured as 1 of 9
// real openings firing where the specification says skip. The skip is a SAFE fast-path in the
// founder's own words: it is recognised purely from what the user structurally said, never from
// AURA guessing why they came, so it adds no inference.
assert("the prompt still prescribes the binary-phrasing fast-path skip",
  /Skip First-WHY if[^\n]*binaryOppositionCount/.test(raw));
assert("the detector the prompt names does fire on that real opening",
  detectsBinaryOppositionPhrasing(S3) === true);
assert("needsFirstWhy now consults that detector",
  /detectsBinaryOppositionPhrasing\s*\(/.test(extract('needsFirstWhy')));
assert("FIXED: the real binary opening no longer triggers First-WHY",
  needsFirstWhy(S3) === false);
assert("the skip is narrow — session 5, which is not binary, still triggers",
  detectsBinaryOppositionPhrasing(S5) === false && needsFirstWhy(S5) === true);
// The skip must come from the detector, not from the signal patterns failing to match. Strip the
// binary check and this opening must start firing again, or the assertion above proves nothing.
assert("the skip is what stops it — the signal patterns DO otherwise match this opening",
  /δεν ξέρω (αν|τι|πώς)/i.test(S3) || /θέλω να (αλλάξω|ξεκινήσω|φύγω|μείνω|κάνω)/i.test(S3));
assert("a plain double-ή dilemma is skipped too, not just this one transcript",
  needsFirstWhy("δεν ξέρω αν να μείνω ή να φύγω") === false);
assert("the same sentence without the opposition still triggers",
  needsFirstWhy("δεν ξέρω αν πρέπει να μείνω άλλο") === true);

// EVERY BRANCH OF THE DETECTOR, because this change made it gate the entry pillar. A mutation that
// disabled the "μπρος γκρεμός" branch survived all 62 suites — that branch, and others, had no
// coverage anywhere. A silent regression in any of them now silently re-opens the wrong-firing this
// fix closed, so each alternative gets its own case and names itself on failure.
const BINARY_FORMS = [
  ["double ή",            "δεν ξέρω αν θέλω αυτό ή εκείνο"],
  ["μπρος γκρεμός",       "νιώθω μπρος γκρεμός και δεν ξέρω τι να κάνω"],
  ["πίσω ρέμα",           "είμαι πίσω ρέμα σε αυτό, δεν ξέρω"],
  ["είτε … είτε",         "δεν ξέρω, είτε μένω εδώ είτε φεύγω τελείως"],
  ["single ή dilemma",    "δεν ξέρω αν να μείνω ή να φύγω"],
  ["whether … or",        "I don't know whether to stay or leave"],
  ["or should I",         "I want to change, or should I stay"],
  ["δύο επιλογές",        "δεν ξέρω, έχω δύο επιλογές μπροστά μου"],
  ["δύο δρόμους",         "δεν ξέρω, βλέπω δύο δρόμους μόνο"],
  ["από τη μία / άλλη",   "από τη μία θέλω να προχωρήσω, από την άλλη φοβάμαι"],
];
for (const [label, text] of BINARY_FORMS) {
  assert("the detector still recognises " + label, detectsBinaryOppositionPhrasing(text) === true);
  assert("First-WHY skips " + label + " — the γρ. 377 fast-path holds for it",
    needsFirstWhy(text) === false);
}
assert("and it does not fire on a sentence with no opposition at all",
  detectsBinaryOppositionPhrasing("δεν ξέρω τι θέλω να κάνω με τη ζωή μου") === false);

// ── 4. REACHABILITY — THE GATE IS OPEN (step 1γ) ──────────────────────────
// These four assertions used to LOCK the gate shut, so that opening it would fail loudly and have
// to be updated deliberately rather than drift. This is that deliberate update.
//
// WHY IT OPENED. First-WHY required a RETURNING user. "Returning" meant a stored anchor or
// trajectory; those are written only when memory.storageEnabled is true; and that defaults to
// FALSE. So the ENTRY pillar — which the prompt calls the essence of the application — could not
// fire for anyone on default settings, while the prompt's own evidence read "0 of 20 real users
// returned after first use, and the entry point is the leading suspect". The branch also writes a
// trajectory when the user answers, which is exactly what would satisfy the gate, so First-WHY
// bootstrapped its own reachability and could never take the first step. One default held both
// ends of that loop shut.
//
// NOTHING ELSE CHANGED. Not the question, not the prompt, not the pillars, no new question, no
// state machine. One conjunct removed from one condition, and the variable it read deleted because
// nothing else read it.
assert("the returning-user gate is gone from the trigger condition",
  /messages\.length === 0 && !firstWhyPending && needsFirstWhy\(userText\)/.test(raw));
assert("isBrandNewUserMsg is deleted, not left computed and unused",
  !/isBrandNewUserMsg/.test(raw));
// Judged on EXECUTABLE lines only. The comment above the trigger explains why the memory condition
// was removed and therefore names memory.storageEnabled on purpose; a scan that cannot tell prose
// from code would flag the documentation for describing the very thing it removed.
const TRIGGER_CODE = (() => {
  const a = raw.indexOf('// First-Why trigger');
  const b = raw.indexOf('setFirstWhyPending(true);', a);
  if (a < 0 || b <= a) return '';
  return raw.slice(a, b).split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
})();
assert("the trigger's executable region was located and is non-empty, so the next check is real",
  TRIGGER_CODE.length > 40 && /needsFirstWhy\(userText\)/.test(TRIGGER_CODE));
assert("First-WHY's reachability no longer depends on memory at all",
  !/memory\./.test(TRIGGER_CODE) && !/storageEnabled/.test(TRIGGER_CODE));
// Unchanged facts, still asserted: the default is still off, and the path the old comment pointed
// brand-new users to is still dead. Opening the gate did not touch either.
const EMPTY_MEM = raw.slice(raw.indexOf('const EMPTY_MEMORY = () => ({'), raw.indexOf('const EMPTY_MEMORY = () => ({') + 900);
assert("the default memory object was located, so the assertion below is not vacuous",
  EMPTY_MEM.length > 200 && /schemaVersion/.test(EMPTY_MEM));
assert("memory storage still defaults to OFF — unchanged, and now irrelevant to First-WHY",
  /storageEnabled:\s*false/.test(EMPTY_MEM));
// Same distinction: the comment may describe the dead path it stopped pointing at; no executable
// line may route a brand-new user anywhere on the strength of it.
const CODE_LINES = raw.split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
assert("demoCtx is still a dead empty string", /const demoCtx = '';/.test(CODE_LINES));
// Narrowed to the deleted variable and to this trigger. A blanket ban on the word was wrong: an
// unrelated isBrandNewUser exists in the demo path at γρ. 4741 — itself declared and never read,
// a separate leftover of the demo removal, out of this step's scope and deliberately untouched.
assert("the deleted variable is gone from executable code",
  !/isBrandNewUserMsg/.test(CODE_LINES));
assert("and the First-WHY trigger itself branches on nothing about who the user is",
  !/brandNew/i.test(TRIGGER_CODE) && !/anchors|trajectories/.test(TRIGGER_CODE));
// The four conditions that remain are the whole gate. Pinned so a fifth cannot appear unnoticed.
assert("exactly three conditions remain: first message, not already pending, and needsFirstWhy",
  (() => {
    const m = raw.match(/if \(([^)]*needsFirstWhy\(userText\))\) \{/);
    return !!m && m[1].split("&&").length === 3;
  })());

// ── 5. THE TURN IS UNGUARDED, AND THAT IS THE FACT BEING LOCKED ───────────
const GR_AT = raw.indexOf('const generateResponse = useCallback');
assert("generateResponse can be located, so the slice below is not vacuous", GR_AT > 0);
const GR = raw.slice(GR_AT, raw.indexOf('\n  }, [', GR_AT));
const FW_A = raw.lastIndexOf('const prompt = [getLensPrompt(inferred)');
const FW = raw.slice(raw.lastIndexOf('if (firstWhyPending)', FW_A), raw.indexOf('const nextMsgs  = [...messages,', FW_A));
assert("both bodies were found and are non-trivial", GR.length > 10000 && FW.length > 500);
assert("the First-WHY branch still calls the model directly, bypassing generateResponse",
  /callAura\(initMsgs, prompt\)/.test(FW) && !/generateResponse\(/.test(FW));
const STEPS = ["detectsOutcomeScaleAsked","detectsCoreReadinessAsked","detectsShiftCheckAsked","detectsFriendPerspectiveAsked","detectsEarlyReliefAsked","detectsStakesAsked","detectsStakesCallbackDelivered","detectsAnchorsInvited","detectsConcreteStep","detectsBinaryOppositionPhrasing","detectsMethodFailureSignal","detectsNoQuestionsRequest","detectOutputViolation","detectsUnsourcedOptionOffer","parseRoadMap","extractRoadMapFromProse","classifyRoadProvenance","detectSelfMarkedTension","detectUserStagnation","detectAssistantSelfRepetition","buildCoverageReport","tallyRoadTrace","createAnchor","recordQualitySignal"];
const bypassed = STEPS.filter(s => GR.includes(s + "(") && !FW.includes(s + "("));
// ── 5b. THE SIX STEPS THE DEPENDENCY MAP SAID ARE THE MINIMUM ─────────────
// Item 0 narrowed the scope: of the 22 bypassed steps, two are the safety floor (the No-Advice
// observers) and four are the user-text detectors whose refs feed the REST of the session. Those
// six are wired. The remaining ones are correctness, not safety, and stay bypassed for now — that
// number is locked so the next change to it is deliberate.
const SAFETY = ["detectOutputViolation", "detectsUnsourcedOptionOffer"];
// Three are called directly here; the binary detector is PASSED BY REFERENCE to the shared
// increment helper, so it has no parentheses in this slice and is asserted on its own below.
const USER_TEXT = ["detectsMethodFailureSignal", "detectsConcreteStep", "detectsNoQuestionsRequest"];
for (const w of SAFETY) assert("SAFETY FLOOR wired into the First-WHY turn: " + w, FW.includes(w + "("));
for (const w of USER_TEXT) assert("USER-TEXT detector wired into the First-WHY turn: " + w, FW.includes(w + "("));
assert("USER-TEXT detector wired into the First-WHY turn: detectsBinaryOppositionPhrasing, "
  + "handed to the shared increment helper rather than called inline",
  /bumpBinaryOpposition\([^)]*detectsBinaryOppositionPhrasing/.test(FW));
assert("MEASURED AND LOCKED: " + bypassed.length + " steps are still bypassed — the ten reply "
  + "latches and the road-map chain, which item 0 classified as correctness rather than safety",
  bypassed.length === 18);

// They must write the SAME refs the main path writes, or the session would keep two sets of books.
assert("the binary counter feeding PREMISE INVERSION is bumped through the shared single site",
  /bumpBinaryOpposition\(binaryOppositionCount/.test(FW));
// One increment for this turn, never two. Scanning both messages here would let the counter reach 2
// from a single turn, and test_conflict_matrix proves PREMISE INVERSION is excluded from a first
// reply precisely because that cannot happen.
assert("it is bumped exactly once on this turn, from the last user message only",
  (FW.match(/bumpBinaryOpposition\(/g) || []).length === 1
  && /bumpBinaryOpposition\(binaryOppositionCount, _userTexts\[_userTexts\.length - 1\]/.test(FW));
// THE HELPER'S OWN CONTRACT, TESTED BEHAVIOURALLY. Every other assertion here reads source text,
// and a mutation that deleted the detector guard — making it increment unconditionally — survived
// all 62 suites. Source checks prove wiring; only a call proves behaviour.
assert("the helper increments only when the detector matches",
  (() => { const r = { current: 0 };
    return bumpBinaryOpposition(r, "δεν ξέρω αν να μείνω ή να φύγω", detectsBinaryOppositionPhrasing) === true && r.current === 1; })());
assert("the helper does NOT increment when the detector does not match",
  (() => { const r = { current: 0 };
    return bumpBinaryOpposition(r, "δεν ξέρω τι θέλω να κάνω με τη ζωή μου", detectsBinaryOppositionPhrasing) === false && r.current === 0; })());
assert("it increments by exactly one, from whatever the counter already held",
  (() => { const r = { current: 5 };
    bumpBinaryOpposition(r, "νιώθω μπρος γκρεμός", detectsBinaryOppositionPhrasing); return r.current === 6; })());
assert("a counter that has never been set starts at one, not NaN",
  (() => { const r = {};
    return bumpBinaryOpposition(r, "νιώθω μπρος γκρεμός", detectsBinaryOppositionPhrasing) === true && r.current === 1; })());
assert("degenerate input is refused quietly rather than thrown",
  bumpBinaryOpposition(null, "μπρος γκρεμός", detectsBinaryOppositionPhrasing) === false
  && bumpBinaryOpposition({ current: 0 }, "μπρος γκρεμός", null) === false);

assert("and the bump is NOT inside the loop that scans both messages",
  FW.indexOf("bumpBinaryOpposition(") > FW.indexOf("for (const _u of _userTexts)")
  && FW.indexOf("bumpBinaryOpposition(") > FW.lastIndexOf("detectsNoQuestionsRequest(_u)"));
assert("the method-failure and concrete-step hints are the main path's own refs",
  /methodFailureHint\.current\s*=/.test(FW) && /concreteStepStated\.current\s*=/.test(FW));
assert("a 'χωρίς ερωτήσεις' in the opening or the why-answer now reaches informationModeActive",
  /informationModeActive\.current\s*=\s*true/.test(FW));
assert("the No-Advice counter is the main path's own ref, not a second tally",
  /unsourcedOptionOffers\.current\s*\+=/.test(FW));

// Observation must never break a turn — the rule the main path states in its own catch blocks.
// EACH block is checked separately: a single count of ">= 1" was satisfied by the other one, so a
// mutation that unwrapped the observer block entirely survived.
const wrapped = (anchor) => {
  const a = FW.indexOf(anchor);
  if (a < 0) return false;
  const c = FW.indexOf("catch (e) { /* observation must never affect the session */ }", a);
  if (c < 0) return false;
  // The catch must close THIS block. If another `try {` opens between the anchor and the catch, the
  // catch belongs to that later block and this one is unwrapped — a mutation that removed exactly
  // this block's catch survived an earlier version that only looked for a stray `catch`.
  return !FW.slice(a, c).includes("try {");
};
assert("the user-text detector block is wrapped so it can never break the entry turn",
  wrapped("const _userTexts ="));
assert("the No-Advice observer block is wrapped too — checked on its own, not by a shared count",
  wrapped("const _clean ="));
// And neither block may be present-but-disabled. A presence check cannot tell a live call from one
// sitting inside `if (false)`; a mutation proved exactly that.
const notDisabled = (anchor) => {
  const a = FW.indexOf(anchor);
  if (a < 0) return false;
  // Anywhere in the preceding window, not anchored to its end: `if (false) try {` puts the guard
  // BEFORE the `try`, so an end-anchored pattern never matched it and the mutation survived.
  const before = FW.slice(Math.max(0, a - 140), a);
  return !/if\s*\(\s*(false|0)\s*\)|\b(false|0)\s*&&/.test(before);
};
assert("the user-text detector block is live, not short-circuited", notDisabled("const _userTexts ="));
assert("the No-Advice observer block is live, not short-circuited", notDisabled("const _clean ="));
// Both indices are asserted present first. indexOf returns -1 when absent, and -1 is less than any
// real position, so the ordering check below passes vacuously while nothing is wired at all.
const I_BINARY = FW.indexOf("bumpBinaryOpposition(");
const I_CALL = FW.indexOf("callAura(initMsgs");
const I_UNSOURCED = FW.indexOf("detectsUnsourcedOptionOffer(");
assert("all three positions exist, so the two ordering checks cannot pass vacuously",
  I_BINARY >= 0 && I_CALL >= 0 && I_UNSOURCED >= 0);
assert("the user-text detectors run BEFORE the model call, as the main path deliberately reorders them to",
  I_BINARY >= 0 && I_BINARY < I_CALL);
assert("the No-Advice observers run AFTER it, on the reply that came back",
  I_UNSOURCED >= 0 && I_UNSOURCED > I_CALL);

// ── 6. NOTHING STALE SURVIVES A SAFETY OVERRIDE OR A RESET ────────────────
// The question left open in an earlier instruction and never answered until now.
const CRISIS = raw.slice(raw.indexOf('if (safetySignal === "CRISIS")'), raw.indexOf('if (safetySignal === "DISTRESS")'));
const DISTRESS = raw.slice(raw.indexOf('if (safetySignal === "DISTRESS")'), raw.indexOf('// First-Why trigger'));
const RESET = raw.slice(raw.indexOf('const resetSession = ()'), raw.indexOf('const resetSession = ()') + 1600);
for (const [label, body] of [["CRISIS", CRISIS], ["DISTRESS", DISTRESS], ["resetSession", RESET]]) {
  assert(label + " clears the pending flag", /setFirstWhyPending\(false\)/.test(body));
  assert(label + " also clears the stored message, not just the flag",
    /setFirstWhyMessage\(""\)/.test(body));
}
assert("resetSession is the ONLY path that empties the message list, so a stale First-WHY message "
  + "can never be re-armed mid-session", (raw.match(/setMessages\(\[\]\)/g) || []).length === 1
  && /setMessages\(\[\]\)/.test(RESET));

// ── 7. IT FEEDS THE LENS, WHICH IS WHY THE LENS RE-LAND DEPENDS ON IT ─────
assert("the why-answer is the SECOND argument to the lens inference — not an empty string",
  /inferLensFallback\(firstWhyMessage,\s*firstWhyRefusal \? firstWhyMessage : userText\)/.test(raw));
assert("this branch is one of the paths that move the lens off the default",
  /activeLensRef\.current = inferred/.test(FW));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
