// ── THE ROAD OF ACCEPTANCE: the one direction that was never on the map ───────
//
// FOUNDER'S FINDING, from a real session (2026-09-26). Asked what AURA should have produced, he
// named three roads, and the first was: "ο πρώτος της αποδοχής ότι η ζωή έτσι θα συνεχιστεί αν δεν
// αλλάξει κάτι." Searched the whole file before writing anything: "status quo", "do nothing",
// "καμία αλλαγή", "τίποτα δεν αλλάζει", "αδράνεια", "inaction" — 0 occurrences, in the prompt and
// in the code. The road that requires no decision, and that takes effect by default when nothing
// else is chosen, had no rule anywhere.
//
// WHAT WAS ALREADY THERE, AND WHY IT IS NOT THIS. The map spec already has "YOU ARE NOT MISSING A
// ROAD" (someone may already see their real options) and ending (C) "NEITHER COST IS ACCEPTABLE"
// (both prices feel too high). DECISION-SPACE COMPLETENESS check (2) even lists "να μην πας" among
// examples of a category that never appeared. All three are adjacent and none of them says that
// CONTINUING AS THINGS ARE is itself a road, carrying its own ΚΕΡΔΙΖΕΙΣ and ΚΟΣΤΙΖΕΙ.
//
// THE TWO WAYS THIS COULD BECOME ADVICE, which is what most of the assertions below guard:
// calling it inertia, avoidance, fear or giving up is a character verdict — Universal No-Evaluation
// and Κ5 forbid it. And calling it prudence or patience is the SAME evaluation with the sign
// reversed. A road is a direction with a price, stated as flatly as the others.
//
// CACHE: this is a prompt change. It invalidates the cached prefix once, deliberately, and the
// assertions below include that the block lives inside AURA_CORE_PERSONALITY rather than in the
// uncached suffix — because a rule about how the map is composed has to be in the cached core, not
// injected per turn.
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
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

assert('NON-VACUITY: the prompt was sliced and is the real thing', PROMPT.length > 250000);

// ── 1. THE RULE EXISTS, AND IN THE CACHED CORE ───────────────────────────────
const MARKER = 'THE ROAD THAT IS ALWAYS AVAILABLE';
assert('the status-quo road has a rule of its own', PROMPT.includes(MARKER));
assert('it lives in the CACHED core, not the per-turn suffix — it governs how the map is composed',
  PROMPT.includes(MARKER) && !CODE.includes(MARKER));
// BOUNDED ON THE REAL SECTION BOUNDARY, never on a character count. A 2400-char window ran past
// the end of this block into EXACT FORMAT below, which contains ΚΕΡΔΙΖΕΙΣ and ΚΟΣΤΙΖΕΙ itself — so
// a mutation removing those labels FROM THIS BLOCK survived every assertion. Seventh time a
// fixed-width window has expired in this repo.
const AT = PROMPT.indexOf(MARKER);
const END = PROMPT.indexOf('EXACT FORMAT WHEN THE MAP IS DELIVERED', AT < 0 ? 0 : AT);
const BLOCK = (AT < 0 || END < 0) ? '' : PROMPT.slice(AT, END);
assert('NON-VACUITY: the block is bounded by its real neighbour and is a plausible size',
  BLOCK.length > 900 && BLOCK.length < 2600);

// ── 2. IT SITS WITH THE ROAD COMPOSITION RULES, NOT SOMEWHERE ELSE ───────────
if (AT > 0) {
  const fmt = PROMPT.indexOf('EXACT FORMAT WHEN THE MAP IS DELIVERED');
  const anti = PROMPT.indexOf('ANTI-GOODHART');
  assert('NON-VACUITY: both neighbouring anchors are findable', fmt > 0 && anti > 0);
  assert('it is placed among the road-composition rules, before the output format',
    AT > anti && AT < fmt);
}

// ── 3. PROVENANCE — the same rule as every other road ────────────────────────
// The exact binding phrase, not a loose alternative. "their own words" appears three times in this
// block for other reasons, so an OR let a mutation drop the binding itself and survive.
assert('its gain and cost are bound by the SAME rule as every other road, in those words',
  /same rule as every other road: only what they named/.test(BLOCK));
assert('it names the two map lines explicitly, so it is composed as a road and not as a remark',
  BLOCK.includes('ΚΕΡΔΙΖΕΙΣ') && BLOCK.includes('ΚΟΣΤΙΖΕΙ'));

// ── 4. THE TWO FRAMINGS THAT WOULD MAKE IT ADVICE, BOTH FORBIDDEN ────────────
assert('framing it as inertia / avoidance / fear / giving up is forbidden by name',
  /inertia/i.test(BLOCK) && /avoidance|fear|giving up/i.test(BLOCK));
assert('the reverse framing — prudence, patience, the safe option — is forbidden too',
  /prudence|patience/i.test(BLOCK) && /safe option/i.test(BLOCK));
assert('it cites the rule those framings would break',
  /NO-EVALUATION/.test(BLOCK));

// ── 5. IT IS OMITTED WHEN IT IS NOT THEIRS ───────────────────────────────────
// Without this the rule becomes "always add a road", which is AURA adding an option — exactly what
// the unsourced-option guard counts and what PATH GENERATION's provenance rule forbids.
assert('it is omitted when their own words do not describe a continuing situation',
  /OMIT IT/.test(BLOCK));
assert('and omitted when they have already said they will not stay',
  /not willing to stay|already stated/i.test(BLOCK));

// ── 6. NO NEW PRESCRIBED SENTENCE ────────────────────────────────────────────
// Measured earlier in this project: 181 exact prescribed sentences exist in the prompt and 3 have
// ever been used. A new fixed phrase would almost certainly join the 178.
assert('it prescribes no fixed Greek sentence for AURA to utter',
  !/«[^»]{25,}»/.test(BLOCK));

// ── 7. IT DOES NOT TURN THE COUNT INTO A TARGET ──────────────────────────────
// ANTI-GOODHART governs how many roads appear. A rule that effectively adds one road to every map
// would contradict it, which is why the omission clause above is load-bearing.
assert('ANTI-GOODHART is still the governing instruction on how many roads appear',
  /ANTI-GOODHART[^]{0,400}?never the goal/.test(PROMPT.replace(/\n/g, ' ')));

// ── 8. THE THREE ADJACENT RULES ARE UNTOUCHED ────────────────────────────────
assert('"YOU ARE NOT MISSING A ROAD" still exists — this does not replace it',
  PROMPT.includes('YOU ARE NOT MISSING A ROAD'));
assert('ending (C), neither cost acceptable, still exists',
  PROMPT.includes('NEITHER COST IS ACCEPTABLE'));
assert('DECISION-SPACE COMPLETENESS still exists with its three ordered checks',
  PROMPT.includes('DECISION-SPACE COMPLETENESS') && /THREE CHECKS, RUN IN THIS ORDER/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
