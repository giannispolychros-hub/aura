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

// ── 4. REACHABILITY — LOCKED, NOT ENDORSED ────────────────────────────────
assert("the returning-user gate is still in the trigger condition",
  /messages\.length === 0 && !firstWhyPending && !isBrandNewUserMsg && needsFirstWhy\(userText\)/.test(raw));
assert("'brand new' still means no stored anchor and no stored trajectory",
  /isBrandNewUserMsg = messages\.length === 0 && \(memory\.anchors\|\|\[\]\)\.length === 0 && \(memory\.trajectories\|\|\[\]\)\.length === 0/.test(raw));
// Anchored inside EMPTY_MEMORY, the default object. A bare /storageEnabled:\s*false/ is satisfied
// by a COMMENT elsewhere that quotes "{storageEnabled:false}" — a surviving mutation showed the
// assertion passing with the real default flipped to true. Fourth assertion in this repo decided by
// a comment rather than by code.
const EMPTY_MEM = raw.slice(raw.indexOf('const EMPTY_MEMORY = () => ({'), raw.indexOf('const EMPTY_MEMORY = () => ({') + 900);
assert("the default memory object was located, so the assertion below is not vacuous",
  EMPTY_MEM.length > 200 && /schemaVersion/.test(EMPTY_MEM));
assert("memory storage still defaults to OFF, which is what makes the gate unpassable by default",
  /storageEnabled:\s*false/.test(EMPTY_MEM));
assert("the alternative the code promises brand-new users is still a dead empty string",
  /const demoCtx = '';/.test(raw));

// ── 5. THE TURN IS UNGUARDED, AND THAT IS THE FACT BEING LOCKED ───────────
const GR_AT = raw.indexOf('const generateResponse = useCallback');
assert("generateResponse can be located, so the slice below is not vacuous", GR_AT > 0);
const GR = raw.slice(GR_AT, raw.indexOf('\n  }, [', GR_AT));
const FW_A = raw.lastIndexOf('const prompt = [getLensPrompt(inferred)');
const FW = raw.slice(raw.lastIndexOf('if (firstWhyPending)', FW_A), raw.indexOf('const nextMsgs  = [...messages,', FW_A));
assert("both bodies were found and are non-trivial", GR.length > 10000 && FW.length > 500);
assert("the First-WHY branch still calls the model directly, bypassing generateResponse",
  /callAura\(initMsgs, prompt\)/.test(FW) && !/generateResponse\(/.test(FW));
const STEPS = ["detectsOutcomeScaleAsked","detectsCoreReadinessAsked","detectsShiftCheckAsked","detectsFriendPerspectiveAsked","detectsEarlyReliefAsked","detectsStakesAsked","detectsStakesCallbackDelivered","detectsAnchorsInvited","detectsConcreteStep","detectsBinaryOppositionPhrasing","detectOutputViolation","detectsUnsourcedOptionOffer","parseRoadMap","extractRoadMapFromProse","classifyRoadProvenance","detectSelfMarkedTension","detectUserStagnation","detectAssistantSelfRepetition","buildCoverageReport","tallyRoadTrace","createAnchor","recordQualitySignal"];
const bypassed = STEPS.filter(s => GR.includes(s + "(") && !FW.includes(s + "("));
assert("MEASURED AND LOCKED: " + bypassed.length + " post-processing steps run on every other turn "
  + "and not on this one", bypassed.length >= 20);
assert("the No-Advice guard shipped today is among them — it does not see this turn",
  bypassed.indexOf("detectsUnsourcedOptionOffer") !== -1);

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
