// AURA — STAGE A, step 3.0: «no roads, steps or ways in the free part» (SPEC_FREE_END.md §3.1)
//
// FOUNDER DECISIONS (ADR «6 Οκτωβρίου (γ)», «(ε)», «(στ)»):
//   - In the free part AURA proposes no roads, steps or ways, and builds no plan out of what the user
//     mentioned; it may mirror their own options in their own words. Asked «τι κάνω», it says honestly
//     that this comes after the root.
//   - THE PRINCIPLE: «Η AURA δεν αυξάνει τη βεβαιότητα ή τη δομή μιας σκέψης πέρα από όση έδωσε ο
//     χρήστης.» «Ανέφερες δύο πράγματα: …» is allowed; «Ανέφερες δύο δρόμους» is not (adds structure).
//   - ONLY with the Stage A switch open. With it closed today's flow stays the same, so the 20 "before"
//     sessions are clean.
//   - CACHE (approved): the rule is written ONCE into AURA_CORE_PERSONALITY, identical for everyone, and
//     it is conditional on a marker that only the uncached per-turn part carries. The switch changes the
//     marker, never the cached prompt. Any OTHER prompt change needs a new approval.
//
// What this pins: the rule's content and its condition; the marker reaches every reply that can come
// before the root (main path, First-WHY, misfire recovery) and only when the switch is open; the code-side
// notes that push toward a map or a step are not sent while it is open; the two violation counters and
// the «asked for action before the root» counter.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);
const CODE_NC = CODE.split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n');

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extractFn(name) {
  const a = CODE.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1); }
  }
  return null;
}
function load(names) {
  const src = names.map(n => extractFn(n) || `function ${n}(){return undefined}`).join('\n');
  return new Function(src + '\nreturn {' + names.join(',') + '};')();
}

const MARKER = '[FREE PART: ENDS AT ROOT]';

// ── 1. The rule in the cached prompt ─────────────────────────────────────────
const RULE = (PROMPT.match(/STAGE A — FREE PART ENDS AT THE ROOT[^\n]*/) || [''])[0];
assert('RULE: present in AURA_CORE_PERSONALITY, as one paragraph', RULE.length > 1500);
assert('RULE: exactly one such paragraph', PROMPT.split('STAGE A — FREE PART ENDS AT THE ROOT').length === 2);
assert('RULE: conditional on the exact marker', RULE.includes(MARKER));
assert('RULE: says that WITHOUT the marker nothing changes', /Without that marker[^.]*does not apply/.test(RULE));
['PATH GENERATION', 'ROAD DISCOVERY', 'LANDING QUESTION', 'LAST HALF-STEP', 'PROBLEM BRIEF'].forEach(r =>
  assert(`RULE: names ${r} as suspended`, RULE.includes(r)));
assert('RULE: the road-map labels are named as suspended', /ΔΡΟΜΟΣ \/ ΚΕΡΔΙΖΕΙΣ \/ ΚΟΣΤΙΖΕΙ/.test(RULE));
assert('RULE: no question about a step, an obstacle to acting, or a date', /step[\s\S]{0,80}obstacle[\s\S]{0,40}date/.test(RULE));
assert('RULE: the marker overrides any per-turn note pointing to roads / a map / a step',
  /takes precedence over any other note in this message/.test(RULE));
assert('RULE: never propose roads, steps, ways or techniques, never a plan from what the user mentioned',
  /Never propose roads, steps, ways, methods or techniques/.test(RULE) && /never build a plan out of what the user mentioned/.test(RULE));
assert('RULE: THE PRINCIPLE, in the founder\'s meaning', /never raise the certainty or the structure of a thought beyond what the user gave/.test(RULE));
assert('RULE: the founder\'s allowed example', RULE.includes('✓ "Ανέφερες δύο πράγματα:'));
assert('RULE: the founder\'s forbidden example (adds structure)', RULE.includes('❌ "Ανέφερες δύο δρόμους'));
assert('RULE: violation examples are listed (costs/gains, ordering, new option, added details, certainty words)',
  /costs or gains/.test(RULE) && /ordering or comparing/.test(RULE) && /new option/.test(RULE) && /details added/.test(RULE) && /ξεκάθαρα/.test(RULE));
assert('RULE: honest deferral when asked what to do — «τι κάνω» comes after the root',
  /comes after the root/.test(RULE) && RULE.includes('το «τι κάνω» έρχεται μετά τη ρίζα'));
assert('RULE: then ONE question toward the root (ONE REPLY, NOT A PROCEDURE)', /ONE question toward the root/.test(RULE) && /ONE REPLY, NOT A PROCEDURE/.test(RULE));
assert('RULE: a step the user brings is not evaluated, developed or added to', /do not evaluate, develop or add to it/.test(RULE));
assert('RULE: ROOT RE-FOCUS and its readiness question stay active', /ROOT RE-FOCUS and its readiness question stay fully active/.test(RULE));
assert('RULE: sits before the closing critical invariants (they stay last)',
  PROMPT.indexOf('STAGE A — FREE PART ENDS AT THE ROOT') < PROMPT.lastIndexOf('<critical_invariants>') &&
  PROMPT.indexOf('STAGE A — FREE PART ENDS AT THE ROOT') > PROMPT.lastIndexOf('</critical_invariants>', PROMPT.lastIndexOf('<critical_invariants>')));
assert('RULE: the switch itself never appears in the cached prompt', !/stageA|STAGE_A_ENABLED|\?stageA/.test(PROMPT));

// ── 2. The marker: built in one place, empty when the switch is closed ───────
const M = load(['buildStageAMarker']);
assert('MARKER: open switch → the exact marker on its own line', M.buildStageAMarker(true) === '\n' + MARKER + '\n');
assert('MARKER: closed switch → empty string (the per-turn text stays byte-identical)', M.buildStageAMarker(false) === '');
assert('MARKER: anything but true → empty', [undefined, null, 1, 'true', {}].every(v => M.buildStageAMarker(v) === ''));
assert('MARKER: the marker text is written in exactly one place in the code',
  (CODE_NC.split(MARKER).length - 1) === 1 && /function buildStageAMarker/.test(CODE_NC));

// ── 3. The marker reaches every reply before the root ────────────────────────
assert('MAIN PATH: built from the switch read once per visit',
  /const stageAMarkerCtx = buildStageAMarker\(stageAActive\.current\);/.test(CODE));
const SUFFIX = (CODE.match(/const dynamicSuffix = \[([\s\S]*?)\]\.filter\(Boolean\)/) || ['', ''])[1];
assert('MAIN PATH: the marker is in the per-turn suffix (uncached block)', /stageAMarkerCtx/.test(SUFFIX));
assert('MAIN PATH: and it is LAST — the hard-constraint tier, highest attention',
  /firstReplyFloorCtx,\s*stageAMarkerCtx,?\s*$/.test(SUFFIX.trim()));
assert('FIRST-WHY: the entry reply carries the marker too',
  /buildFirstWhyFloor\(\), buildStageAMarker\(stageAActive\.current\)\]\.filter\(Boolean\)/.test(CODE));
assert('MISFIRE RECOVERY: the recovery reply carries the marker too',
  /const recoveryPrompt = getLensPrompt\(activeLensRef\.current\) \+ buildStageAMarker\(stageAActive\.current\) \+/.test(CODE));
assert('CACHE: callAura still splits at the end of AURA_CORE_PERSONALITY, so the marker lands in the uncached block',
  /systemPrompt\.startsWith\(AURA_CORE_PERSONALITY\)/.test(CODE) && /text: systemPrompt\.slice\(AURA_CORE_PERSONALITY\.length\)/.test(CODE));

// ── 4. Code-side notes that push to a map or a step are silent while open ────
assert('SILENCE: roadQuestionCtx and postMapCloseCtx are not sent with Stage A open',
  /stageAActive\.current \? '' : roadQuestionCtx/.test(SUFFIX) && /stageAActive\.current \? '' : postMapCloseCtx/.test(SUFFIX));
assert('SILENCE: with the switch closed they are sent exactly as before (same names, same order)',
  /tensionCtx, stageAActive\.current \? '' : roadQuestionCtx,\s*stageAActive\.current \? '' : postMapCloseCtx,\s*gatesCtx/.test(SUFFIX));
assert('SILENCE: the Clarity + Ownership Scale gate (a step-stage measurement) is not pushed with Stage A open',
  /if \(!stageAActive\.current && concreteStepStated\.current && !outcomeScaleAsked\.current\) due\.push\('Clarity \+ Ownership Scale/.test(CODE) &&
  /scale: \(!stageAActive\.current && concreteStepStated\.current && !outcomeScaleAsked\.current\)/.test(CODE));

// ── 5. Counters (violation checks only, never success measures) ──────────────
const D = load(['detectsRootDeferral']);
const yes = [
  'Εδώ βρίσκουμε πρώτα τι πραγματικά σε απασχολεί· το «τι κάνω» έρχεται μετά τη ρίζα.',
  'Το τι θα κάνεις έρχεται μετά τη ρίζα. Τι είναι αυτό που σε βαραίνει περισσότερο;',
  'Αυτό έρχεται αφού βρούμε τη ρίζα — πρώτα ας δούμε τι σε απασχολεί.',
  'ΤΟ «ΤΙ ΚΑΝΩ» ΕΡΧΕΤΑΙ ΜΕΤΑ ΤΗ ΡΙΖΑ',
];
const no = [
  'Τι είναι αυτό που σε κρατάει;',
  'Η ρίζα του δέντρου είναι βαθιά.',
  'Μετά τη δουλειά πας σπίτι;',
  'Μετά τη ρίζα του δέντρου υπάρχει μόνο χώμα.',
  '',
];
yes.forEach(t => assert(`DEFERRAL: recognised «${t.slice(0, 45)}…»`, D.detectsRootDeferral(t) === true));
no.forEach(t => assert(`DEFERRAL: not recognised «${t.slice(0, 45) || '(empty)'}»`, D.detectsRootDeferral(t) === false));
assert('DEFERRAL: a non-string never throws', D.detectsRootDeferral(undefined) === false && D.detectsRootDeferral(null) === false);

assert('COUNTERS: three refs exist (freeActionOffered, freeDeferral, askedActionBeforeRoot)',
  /const freeActionOffered\s*= useRef\(0\)/.test(CODE) && /const freeDeferral\s*= useRef\(0\)/.test(CODE) && /const askedActionBeforeRoot\s*= useRef\(false\)/.test(CODE));
assert('COUNTERS: counted only with Stage A open, after the reply (map or advice cascade → violation)',
  /if \(stageAActive\.current\) \{[\s\S]{0,600}freeActionOffered\.current \+= 1/.test(CODE) &&
  /\(parseRoadMap\(_saText\) \|\| \[\]\)\.length > 0 \|\| detectOutputViolation\(_saText, \{ roadDiscoveryDue: false \}\) === "ADVICE_CASCADE"/.test(CODE));
assert('COUNTERS: a deferral counts only when the user asked for action this turn',
  /requestStreak\.current > 0 && detectsRootDeferral\(_saText\)\) freeDeferral\.current \+= 1/.test(CODE));
assert('COUNTERS: «asked for action before the root» is latched from the request counter, before the card exists',
  /if \(stageAActive\.current && !rootCardOpenedOnce\.current\) askedActionBeforeRoot\.current = true;/.test(CODE));
assert('COUNTERS: all three reset with the session',
  /freeActionOffered\.current = 0;/.test(CODE) && /freeDeferral\.current = 0;/.test(CODE) && /askedActionBeforeRoot\.current = false;/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
