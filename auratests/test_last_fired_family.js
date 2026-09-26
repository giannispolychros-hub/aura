// AURA — "Strategy Change 1-scalar-ref", deferred earlier the same day: reuse fired[fired.length-1]
// (the collision logger's own "highest = last in the array, since attention-order places the
// strongest last" rule) so the model can see when the SAME family has kept winning across turns —
// EXPLORATION COVERAGE PRINCIPLE's own "prefer whichever you have not yet used" made observable.
//
// ARCHAEOLOGY DONE FIRST: window.__auraLastCollision.highest already computes this per-turn value,
// but only to console/window (ephemeral, never reaches the prompt) and only when fired.length >= 2
// (a real collision). coverageReportCtx already reports "Signal families already used this
// session" — but that is a cumulative SET in first-use order, never recency, and never flags
// repetition. Neither already does what this does. Confirmed by reading buildCoverageReport's own
// source in full, not assumed.
//
// THE EDGE CASE THIS WAS DEFERRED FOR: fired.length === 0 (a quiet turn, nothing coded fired) MUST
// be skipped — the ref freezes rather than either resetting the streak (which would falsely read a
// quiet turn as "the pattern broke") or crediting it as a repeat (which would falsely inflate a
// streak on a turn where nothing actually fired).
//
// TIMING, same discipline as coverageReportCtx/familiesUsed: the ref updates inside the EXISTING
// collision-logger try/catch, at the END of the turn whose `fired` array it reads. The ctx text is
// built at the START of the NEXT turn, before dynamicSuffix — off by one turn, deliberately, exactly
// like familiesUsed already is. No reordering of the existing fired/dynamicSuffix code, so the
// timing-sensitive machinery already covered by other suites stays untouched.

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
eval(extract('computeLastFiredFamily'));
eval(extract('describeLastFiredFamilyCtx'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── NON-VACUITY: the two existing mechanisms this is checked against are still there, unchanged ─
assert('NON-VACUITY: coverageReportCtx still reports the cumulative set, never recency',
  /Signal families already used this session/.test(raw));
assert('NON-VACUITY: the collision logger still defines "highest" as fired[fired.length - 1]',
  /highest:\s*fired\[fired\.length - 1\]/.test(raw));

// ── computeLastFiredFamily: the fired.length === 0 edge case this was deferred for ──────────────
assert('THE DEFERRED EDGE CASE: highestThisTurn null (fired.length === 0) freezes the ref — family unchanged',
  computeLastFiredFamily('userStagnationCtx', 3, null).family === 'userStagnationCtx');
assert('THE DEFERRED EDGE CASE: highestThisTurn null freezes the streak too — neither reset nor incremented',
  computeLastFiredFamily('userStagnationCtx', 3, null).streak === 3);
assert('a quiet turn on a fresh session (null family, 0 streak) stays exactly null/0',
  computeLastFiredFamily(null, 0, null).family === null && computeLastFiredFamily(null, 0, null).streak === 0);

// ── Same family wins again → streak increments ───────────────────────────────────────────────────
assert('same family repeats → streak increments from 1 to 2',
  computeLastFiredFamily('userStagnationCtx', 1, 'userStagnationCtx').streak === 2);
assert('same family repeats a third time → streak increments from 2 to 3',
  computeLastFiredFamily('userStagnationCtx', 2, 'userStagnationCtx').streak === 3);
assert('family unchanged while streak increments', computeLastFiredFamily('userStagnationCtx', 2, 'userStagnationCtx').family === 'userStagnationCtx');

// ── Different family wins → streak resets to 1, family updates ─────────────────────────────────
assert('a different family winning resets the streak to 1, not 0',
  computeLastFiredFamily('userStagnationCtx', 5, 'clarityPivotCtx').streak === 1);
assert('a different family winning updates the tracked family',
  computeLastFiredFamily('userStagnationCtx', 5, 'clarityPivotCtx').family === 'clarityPivotCtx');

// ── First-ever fire (no prior family) → streak 1 ────────────────────────────────────────────────
assert('the very first fire of the session sets streak to 1, not 2',
  computeLastFiredFamily(null, 0, 'selfRepetitionCtx').streak === 1);

// ── describeLastFiredFamilyCtx: only flags REPETITION, silent on a single occurrence ────────────
assert('streak 1 (no repetition yet) produces no ctx text — nothing worth flagging on a first occurrence',
  describeLastFiredFamilyCtx('userStagnationCtx', 1) === '');
assert('no family at all (null) produces no ctx text', describeLastFiredFamilyCtx(null, 0) === '');
assert('streak 2 (a genuine repeat) produces ctx text naming the family and the count',
  describeLastFiredFamilyCtx('userStagnationCtx', 2).includes('userStagnationCtx') && describeLastFiredFamilyCtx('userStagnationCtx', 2).includes('2'));
assert('the ctx text points at the already-existing EXPLORATION COVERAGE PRINCIPLE / WHICH FAMILY TO SWITCH TO, invents no new rule',
  /EXPLORATION COVERAGE PRINCIPLE/.test(describeLastFiredFamilyCtx('x', 3)) && /WHICH FAMILY TO SWITCH TO/.test(describeLastFiredFamilyCtx('x', 3)));

// ── PURITY: both functions read no ref ───────────────────────────────────────────────────────────
assert('PURITY: computeLastFiredFamily contains no \'.current\'', !/\.current/.test(extract('computeLastFiredFamily')));
assert('PURITY: describeLastFiredFamilyCtx contains no \'.current\'', !/\.current/.test(extract('describeLastFiredFamilyCtx')));

// ── WIRING: the ref, its reset (both places), and its two hook-in points ────────────────────────
assert('STATE: lastFiredFamily ref is declared with the correct initial shape',
  /const lastFiredFamily\s*=\s*useRef\(\{\s*family:\s*null,\s*streak:\s*0\s*\}\)/.test(raw));
// COUNTED, not just matched once: both reset sites (full session reset AND domain change, checked
// separately below) use this exact line, so a bare .test() would still pass if only ONE of the two
// survived a mutation removing the other. >= 2 is what actually proves both are present.
assert('STATE: reset line appears at least twice — full session reset AND domain change, not just one of them',
  (raw.match(/lastFiredFamily\.current = \{ family: null, streak: 0 \};/g) || []).length >= 2);
assert('STATE: also reset on domain change (a repeat streak about the old topic must not count against the new one)',
  (() => {
    // Bounded by setCurrentDomain(domain), the stable line immediately after this block in
    // production — NOT by the next '}', which the new reset line's own object-literal brace
    // would find first and truncate the slice before its own trailing '};'.
    const domainBlockStart = raw.indexOf('if (domain !== currentDomain');
    const domainBlockEnd = raw.indexOf('setCurrentDomain(domain);', domainBlockStart);
    return /lastFiredFamily\.current = \{ family: null, streak: 0 \};/.test(raw.slice(domainBlockStart, domainBlockEnd));
  })());
assert('WIRING: the ref is updated inside the EXISTING collision-logger try/catch, using the EXISTING fired array — no new detector, no reordering',
  /fired\.forEach\(f => \{ if \(familiesUsed\.current\.indexOf\(f\) === -1\) familiesUsed\.current\.push\(f\); \}\);[^]*?const highestThisTurn = fired\.length > 0 \? fired\[fired\.length - 1\] : null;[^]*?lastFiredFamily\.current = computeLastFiredFamily\(lastFiredFamily\.current\.family, lastFiredFamily\.current\.streak, highestThisTurn\);/.test(raw));
assert('WIRING: lastFiredFamilyCtx is part of dynamicSuffix', /dynamicSuffix = \[[^\]]*lastFiredFamilyCtx/s.test(raw));
assert('WIRING: lastFiredFamilyCtx is deliberately excluded from the fired/familiesUsed collision logger (it reports on history, it is not itself a family that fired this turn)',
  !/const fired = Object\.entries\(\{[^}]*lastFiredFamilyCtx/s.test(raw));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
