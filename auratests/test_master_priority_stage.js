// AURA — MASTER PRIORITY RULE gets an exposed, code-verified stage, unifying signals that already
// existed scattered across the file. The rule itself (γρ. 256+) already names the sequence:
//   "1. SAFETY -> ... 2. GRACEFUL EXIT -> ... 3. OPENING -> ... 4. STATE DETECTION -> ...
//    5. MEANING LOCK -> ... 6. PERSPECTIVE SWAP -> adaptive questioning (normal protocol)"
// Until now nothing told the model WHICH of these it was in — 100% model judgement, despite most
// of the underlying facts already being code-verified elsewhere in the file (safetyMode,
// isExplicitClosure/declaresClosing/matchesClosingWord, msgCount).
//
// FOUNDER'S OWN FRAMING (this exact step): depending on the stage — αρχή, μέση, τέλος (beginning,
// middle, end) — the model should know so it can bring the right strategies forward. That maps
// directly onto SAFETY/OPENING (start), the PERSPECTIVE SWAP loop (middle), and GRACEFUL EXIT (end).
//
// ARCHAEOLOGY DONE FIRST (per direct instruction — "Δες πρώτα αν έχει ήδη κάτι χτιστεί"): pickaxe
// search across all history for sessionStage/masterPriorityStage/priorityStage/sequenceStage/
// mprStage/stageCtx/sessionPhase/currentStage/masterPriorityCtx/priorityRuleCtx/sequenceCtx/mprCtx
// — zero commits for any of them. No function or ref with a related name exists in the current
// file either. This is a first build, not a recovery.
//
// SCOPE, stated plainly rather than silently narrowed: STATE DETECTION (step 4) and MEANING LOCK
// (step 5) are NOT exposed as their own stages. STATE DETECTION's underlying DISTRESS-level signal
// is computed in a different closure (handleSend) and is not available inside generateResponse
// without adding new state — a larger change than reusing what exists. MEANING LOCK's own
// FACT/ANALYSIS/PERSONAL classification only has code backing for the FACT half (isFactQuestion).
// Both fold into PERSPECTIVE_SWAP, the catch-all "normal loop" stage — a deliberate scope limit.

const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) throw new Error('MISSING DEPENDENCY: ' + name);
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}
eval(extract('computeMasterPriorityStage'));
eval(extract('describeMasterPriorityStageCtx'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── NON-VACUITY: the rule this exposes still names its own sequence, unaltered ─────────────────
assert('NON-VACUITY: MASTER PRIORITY RULE still names SAFETY as step 1',
  /1\.\s*SAFETY/.test(raw));
assert('NON-VACUITY: MASTER PRIORITY RULE still names GRACEFUL EXIT as step 2',
  /2\.\s*GRACEFUL EXIT/.test(raw));
assert('NON-VACUITY: MASTER PRIORITY RULE still names OPENING as step 3',
  /3\.\s*OPENING/.test(raw));
assert('NON-VACUITY: MASTER PRIORITY RULE still names PERSPECTIVE SWAP as step 6, "adaptive questioning (normal protocol)"',
  /6\.\s*PERSPECTIVE SWAP.*adaptive questioning \(normal protocol\)/.test(raw));

// ── computeMasterPriorityStage: precedence exactly matches the rule's own numbered order ────────
assert('SAFETY outranks everything, even an opening that also signals closing',
  computeMasterPriorityStage(true, 1, true) === 'SAFETY');
assert('SAFETY outranks OPENING alone', computeMasterPriorityStage(true, 1, false) === 'SAFETY');
assert('GRACEFUL_EXIT outranks OPENING when both are true on the same (unusual) turn',
  computeMasterPriorityStage(false, 1, true) === 'GRACEFUL_EXIT');
assert('GRACEFUL_EXIT fires on a later turn too, not just the opening',
  computeMasterPriorityStage(false, 12, true) === 'GRACEFUL_EXIT');
assert('OPENING fires on msgCount 1 when nothing else overrides it',
  computeMasterPriorityStage(false, 1, false) === 'OPENING');
assert('PERSPECTIVE_SWAP is the catch-all for every ordinary later turn',
  computeMasterPriorityStage(false, 5, false) === 'PERSPECTIVE_SWAP');
assert('PERSPECTIVE_SWAP, not OPENING, for msgCount 0 (defensive — should not occur in practice)',
  computeMasterPriorityStage(false, 0, false) === 'PERSPECTIVE_SWAP');

// ── describeMasterPriorityStageCtx: text uses the rule's OWN vocabulary ─────────────────────────
assert('SAFETY ctx names SAFETY and "step 1"', /SAFETY/.test(describeMasterPriorityStageCtx('SAFETY')) && /step 1/.test(describeMasterPriorityStageCtx('SAFETY')));
assert('GRACEFUL_EXIT ctx names "GRACEFUL EXIT" and "step 2"', /GRACEFUL EXIT/.test(describeMasterPriorityStageCtx('GRACEFUL_EXIT')) && /step 2/.test(describeMasterPriorityStageCtx('GRACEFUL_EXIT')));
assert('OPENING ctx names OPENING and "step 3"', /OPENING/.test(describeMasterPriorityStageCtx('OPENING')) && /step 3/.test(describeMasterPriorityStageCtx('OPENING')));
assert('PERSPECTIVE_SWAP ctx names "PERSPECTIVE SWAP" and "step 6", and explicitly states the STATE DETECTION/MEANING LOCK scope limit',
  /PERSPECTIVE SWAP/.test(describeMasterPriorityStageCtx('PERSPECTIVE_SWAP')) &&
  /step 6/.test(describeMasterPriorityStageCtx('PERSPECTIVE_SWAP')) &&
  /STATE DETECTION/.test(describeMasterPriorityStageCtx('PERSPECTIVE_SWAP')) &&
  /MEANING LOCK/.test(describeMasterPriorityStageCtx('PERSPECTIVE_SWAP')));
assert('an unrecognised stage value returns \'\' rather than crashing or emitting garbage',
  describeMasterPriorityStageCtx('NOT_A_REAL_STAGE') === '');

// ── PURITY: both functions read no ref ───────────────────────────────────────────────────────────
assert('PURITY: computeMasterPriorityStage contains no \'.current\'', !/\.current/.test(extract('computeMasterPriorityStage')));
assert('PURITY: describeMasterPriorityStageCtx contains no \'.current\'', !/\.current/.test(extract('describeMasterPriorityStageCtx')));

// ── WIRING: derived fresh every turn, same architecture as goalObstacleStakesCtx/materialEvidenceCtx
// — no new ref, no reset-block edit ────────────────────────────────────────────────────────────
assert('WIRING: masterPriorityStageCtx composes userSignalsClosing from the three EXISTING closing detectors, none dropped',
  /const userSignalsClosing = isExplicitClosure\(lastUserText\) \|\| declaresClosing\(lastUserText\) \|\| matchesClosingWord\(lastUserText\);/.test(raw));
assert('WIRING: masterPriorityStageCtx is part of dynamicSuffix', /dynamicSuffix = \[[^\]]*masterPriorityStageCtx/s.test(raw));
// DELIBERATELY NOT in the fired/familiesUsed collision logger: unlike every other ctx there, this
// one is non-empty on EVERY turn (there is no "quiet" stage), so counting it would make fired.length
// >= 2 the default rather than the rare, meaningful event the collision logger exists to catch.
assert('WIRING: masterPriorityStageCtx is deliberately excluded from the fired/familiesUsed collision logger (it is always-on, would drown the rare-collision signal)',
  !/const fired = Object\.entries\(\{[^}]*masterPriorityStageCtx/s.test(raw));
assert('NO NEW REF: this feature adds no useRef for stage tracking',
  !/const (sessionStage|masterPriorityStage|currentStage)\s*=\s*useRef/.test(raw));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
