// AURA — code-level tracking for the ESCALATION ladder that already exists as prompt text (γρ.
// 533): "Level 1 (Pivot) → Level 2 (targeted follow-up) → Level 3 (Perspective Swap) → AUTO-KILL →
// Graceful Exit. Never skip levels. Never announce." Until now this ladder was 100% model
// judgement — no ref anywhere counted which level a session was on, or how many attempts had
// passed with no movement. The three signals needed to drive it already existed and were already
// computed every turn (clarityPivotCtx, selfRepetitionCtx, userStagnationCtx) — this file adds no
// new detector, only the counter that reads them.
//
// FOUNDER'S INSTRUCTION FOR THIS STEP: "Καλύτερα να χτίσουμε σε ό,τι υπάρχει" — build ON what
// exists, in its own vocabulary, not a parallel structure with new names. Both functions below are
// checked against the prompt's own literal ladder text so a rename of either one is caught.
//
// SCOPE, same discipline as item 4: this ONLY produces prompt-injected text (escalationCtx). It
// changes no lens, no basePrompt, no routing — never repeats Phase 1's mistake of writing session
// state that stands until something else clears it. computeEscalationLevel returns 0 (silent
// return to Baseline) the instant the stuck signal stops firing — matching the founder's own
// description: "Auto-Kill & Graceful Exit ... σιωπηλή επιστροφή στο Baseline."

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
eval(extract('computeEscalationLevel'));
eval(extract('describeEscalationCtx'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── NON-VACUITY: the ladder this counter tracks is still in the prompt, in these exact words ────
assert('NON-VACUITY: the prompt still names the exact ladder this file builds on',
  /Level 1 \(Pivot\) → Level 2 \(targeted follow-up\) → Level 3 \(Perspective Swap\) → AUTO-KILL → Graceful Exit/.test(raw));
assert('NON-VACUITY: "Never skip levels. Never announce." is still the governing rule',
  /Never skip levels\. Never announce\./.test(raw));

// ── computeEscalationLevel: escalates one level at a time, never skips ──────────────────────────
assert('Baseline, stuck signal fires → Level 1 (Pivot)', computeEscalationLevel(0, true) === 1);
assert('Level 1, still stuck → Level 2 (targeted follow-up)', computeEscalationLevel(1, true) === 2);
assert('Level 2, still stuck → Level 3 (Perspective Swap)', computeEscalationLevel(2, true) === 3);
assert('Level 3, still stuck → 4 (AUTO-KILL)', computeEscalationLevel(3, true) === 4);
assert('AUTO-KILL (4), still stuck → stays 4, never counts past AUTO-KILL', computeEscalationLevel(4, true) === 4);

// ── THE FOUNDER'S OWN WORDING: "silent return to Baseline" the instant movement resumes ─────────
assert('Level 3, signal stops firing → silent return to Baseline (0)', computeEscalationLevel(3, false) === 0);
assert('AUTO-KILL, signal stops firing → silent return to Baseline (0)', computeEscalationLevel(4, false) === 0);
assert('Baseline, no signal → stays at Baseline (0)', computeEscalationLevel(0, false) === 0);

// ── describeEscalationCtx: text uses the ladder's OWN vocabulary, not invented terms ────────────
assert('Baseline (0) produces no ctx text — AURA does not intervene when the flow works',
  describeEscalationCtx(0) === '');
assert('Level 1 names "Pivot", matching the ladder\'s own Level 1 label',
  /LEVEL 1/.test(describeEscalationCtx(1)) && /Pivot/.test(describeEscalationCtx(1)));
assert('Level 2 names "targeted follow-up", matching the ladder\'s own Level 2 label — not "Fact-Grounding" or any invented name',
  /LEVEL 2/.test(describeEscalationCtx(2)) && /targeted follow-up/.test(describeEscalationCtx(2)));
assert('Level 2\'s body sentence (not just its label) says "targeted follow-up" — a rename deep in the text is caught, not only in the label',
  (describeEscalationCtx(2).match(/targeted follow-up/g) || []).length >= 2 && !/Fact-Grounding/.test(describeEscalationCtx(2)));
assert('Level 3 names "Perspective Swap", matching the ladder\'s own Level 3 label',
  /LEVEL 3/.test(describeEscalationCtx(3)) && /Perspective Swap/.test(describeEscalationCtx(3)));
assert('Level 4 names AUTO-KILL and points to Graceful Exit, both already in the prompt',
  /AUTO-KILL/.test(describeEscalationCtx(4)) && /Graceful Exit/.test(describeEscalationCtx(4)));
assert('Level 5 (defensive — should not occur given the cap above) still reads as AUTO-KILL, never crashes or falls through to \'\'',
  describeEscalationCtx(5) !== '' && /AUTO-KILL/.test(describeEscalationCtx(5)));

// ── PURITY: both functions read no ref ───────────────────────────────────────────────────────────
const LEVEL_SRC = extract('computeEscalationLevel');
const CTX_SRC = extract('describeEscalationCtx');
assert('PURITY: computeEscalationLevel contains no \'.current\'', !/\.current/.test(LEVEL_SRC));
assert('PURITY: describeEscalationCtx contains no \'.current\'', !/\.current/.test(CTX_SRC));

// ── WIRING: exactly one real call site each, besides the definitions ─────────────────────────────
function callSiteCount(name) {
  const defCount = (raw.match(new RegExp('function ' + name + '\\(', 'g')) || []).length;
  const allCount = (raw.match(new RegExp(name + '\\(', 'g')) || []).length;
  return allCount - defCount;
}
assert('WIRING: computeEscalationLevel has exactly 1 real call site', callSiteCount('computeEscalationLevel') === 1);
assert('WIRING: describeEscalationCtx has exactly 1 real call site', callSiteCount('describeEscalationCtx') === 1);

// ── STATE: the ref exists, is reset at session start AND on domain change (same convention as
// compressionCount/clarificationRound, which sit right beside it in both reset blocks) ──────────
assert('STATE: escalationLevel ref is declared', /const escalationLevel\s*=\s*useRef\(0\)/.test(raw));
assert('STATE: reset at full session reset', (raw.match(/escalationLevel\.current = 0;/g) || []).length >= 2);
assert('STATE: the domain-change reset block also clears it (a stuck loop about topic A must not count against topic B)',
  /clarificationRound\.current = 0; \/\/ RT-fix #6[^]*?escalationLevel\.current = 0;|escalationLevel\.current = 0;[^]*?clarificationRound\.current = 0; \/\/ RT-fix #6/.test(raw) ||
  (() => {
    const domainBlockStart = raw.indexOf('if (domain !== currentDomain');
    const domainBlockEnd = raw.indexOf('}', domainBlockStart);
    const block = raw.slice(domainBlockStart, domainBlockEnd);
    return /escalationLevel\.current = 0;/.test(block);
  })());

// ── WIRED INTO THE PROMPT: escalationCtx reaches dynamicSuffix and the collision-logger \"fired\"
// list, same as every other code-verified ctx (selfRepetitionCtx, userStagnationCtx, clarityPivotCtx) ──
assert('escalationCtx is part of dynamicSuffix', /dynamicSuffix = \[[^\]]*escalationCtx/s.test(raw));
assert('escalationCtx is part of the fired/familiesUsed tracker', /const fired = Object\.entries\(\{[^}]*escalationCtx/s.test(raw));
// The "stuck" composition itself, statically — mutation-tested: dropping any of the three signals
// (e.g. userStagnationCtx) from this OR must be caught, since none of the pure-function tests
// above exercise this inline wiring line directly.
assert('stuckSignalFired combines all three existing signals — clarityPivotCtx, selfRepetitionCtx, and userStagnationCtx, none dropped',
  /const stuckSignalFired = !!\(clarityPivotCtx \|\| selfRepetitionCtx \|\| userStagnationCtx\);/.test(raw));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
