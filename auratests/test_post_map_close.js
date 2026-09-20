// AURA — AFTER THE MAP, THE SESSION STILL CLOSES THE WAY SESSIONS CLOSE
//
// THE GAP THIS FILE EXISTS FOR. An audit of three real transcripts found that the Road Map and
// the three-beat close are connected by NOTHING — not one line of code, not one line of prompt.
// The only place both parsers appear together in App.jsx is a comment saying exactly that.
//
//   A   map delivered (3 roads + ΑΓΝΩΣΤΟ), 8 exchanges → advice (ΥΠΑΙΘ, ΑΣΠΕ) → "Καλή συνέχεια"
//   C   map delivered (2 roads)                        → advice (Preply, Superprof) → "Καλή συνέχεια"
//   B   NO map, 32 exchanges                           → full ritual → three beats → "Κλείνουμε"
//
// The one session that reached the closing ritual is the one where no map appeared. Both sessions
// that produced a map ended abruptly, with advice — sources the user never named, which No Advice
// already forbids. Three data points, not a law, but the shape is consistent with there being no
// rule: after the map, nothing carries the session into its close.
//
// WHY THIS IS A ctx AND NOT PROMPT TEXT. The condition is code-verified — parseRoadMap has already
// run over AURA's real output, so the code KNOWS a map was delivered. A prompt rule would require
// the model to remember, fifteen turns later, that it produced one. Same reasoning, and the same
// construction, as roadQuestionCtx: every rule invoked here already exists in the prompt and is
// referenced BY SECTION NAME, so the mechanism needs no prompt text and the cached prefix stays
// byte-identical.
//
// THE DECISION IS A PURE FUNCTION, deliberately — decidePostMapClose, extracted for testability
// exactly as decideTermination was, so the six conditions below are behavioural assertions against
// real logic rather than regexes over a closure nobody can run.
//
// FIXTURES: the real transcripts, trimmed. The maps are reproduced as AURA actually emitted them,
// because the parser recognising them IS the mechanism under test; the user's own long messages
// are cut to the first clause, which is all any assertion here needs.

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
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  const e = CODE.indexOf('\n}', s);
  return e < 0 ? null : CODE.slice(s, e + 2);
}

// ── Load the real functions ─────────────────────────────────────────────────
const SRC_DECIDE = extract('decidePostMapClose');
assert('decidePostMapClose is defined', !!SRC_DECIDE);
let decidePostMapClose = null, parseRoadMap = null, isExplicitClosure = null;
try { if (SRC_DECIDE) decidePostMapClose = eval('(' + SRC_DECIDE + ')'); }
catch (e) { console.log('FAIL — decidePostMapClose eval: ' + e.message); failed++; }
try { parseRoadMap = eval('(' + extract('parseRoadMap') + ')'); } catch (e) { /* reported below */ }
try { isExplicitClosure = eval('(' + extract('isExplicitClosure') + ')'); } catch (e) { /* reported below */ }
assert('decidePostMapClose evaluates standalone (self-contained)', typeof decidePostMapClose === 'function');
assert('The real parsers loaded for the fixtures',
  typeof parseRoadMap === 'function' && typeof isExplicitClosure === 'function');

const S = o => Object.assign({
  roadMapDelivered: true, roadQuestionPending: false, shiftConfirmed: false, userClosing: false,
}, o);

// ══ THE SIX APPROVED SCENARIOS ═════════════════════════════════════════════
if (typeof decidePostMapClose === 'function') {
  assert('#1/2 FIRES: a map was delivered, road questions are done, nothing else applies',
    decidePostMapClose(S({})) === true);
  assert('#3 SILENT: no map was ever delivered — the mechanism must not touch that session',
    decidePostMapClose(S({ roadMapDelivered: false })) === false);
  assert('#4 SILENT: a road question is pending — never two "ask this" in one prompt',
    decidePostMapClose(S({ roadQuestionPending: true })) === false);
  assert('#5 SILENT: the user already confirmed a shift — shiftCheckCtx owns it from here',
    decidePostMapClose(S({ shiftConfirmed: true })) === false);
  assert('#6 SILENT: the user declared closure — a declared exit is never overridden',
    decidePostMapClose(S({ userClosing: true })) === false);

  // Hygiene: junk must produce silence, never a throw and never a spurious fire.
  let threw = false;
  try {
    assert('Junk state produces silence, not a fire',
      [null, undefined, {}, { roadMapDelivered: 'yes' }, { roadMapDelivered: 1 }]
        .every(x => decidePostMapClose(x) === false));
  } catch (e) { threw = true; }
  assert('decidePostMapClose never throws', !threw);
  assert('roadMapDelivered must be a real boolean true, not merely truthy',
    decidePostMapClose(S({ roadMapDelivered: 'true' })) === false);
}

// ══ THE FIXTURES — the real transcripts, driven through the real parsers ═══
const U = c => ({ role: 'user', content: c });
const AI = c => ({ role: 'assistant', content: c });

const MAP_A = [
  'Άρα έχεις τρεις δρόμους:',
  '',
  '**ΔΡΟΜΟΣ 1: Παράλληλη εργασία στη νοσηλευτική**',
  'ΚΕΡΔΙΖΕΙΣ: Χρησιμοποιείς γνώσεις που ήδη έχεις, χωρίς σπουδές',
  'ΚΟΣΤΙΖΕΙ: Χρειάζεται να ξέρεις τι επιτρέπεται νομικά — αυτό παραμένει άγνωστο',
  '',
  '**ΔΡΟΜΟΣ 2: Gig economy (e-food, delivery κ.λπ.)**',
  'ΚΕΡΔΙΖΕΙΣ: Ξεκινάς αμέσως, ευέλικτο ωράριο',
  'ΚΟΣΤΙΖΕΙ: Σκληρή δουλειά για σχετικά χαμηλό ρυθμό εισοδήματος',
  '',
  '**ΔΡΟΜΟΣ 3: Νέες σπουδές / επανακατάρτιση**',
  'ΚΕΡΔΙΖΕΙΣ: Πιθανά υψηλότερο εισόδημα μακροπρόθεσμα',
  'ΚΟΣΤΙΖΕΙ: Χρόνος, και ο στόχος είναι 2-3 χρόνια',
  '',
  '**ΑΓΝΩΣΤΟ:** Τι επιτρέπεται νομικά παράλληλα με τη δημόσια θέση.',
  '',
  'Ποιον δρόμο βλέπεις πιο ρεαλιστικό;',
].join('\n');

const MAP_C = [
  'Άρα έχεις δύο δρόμους που τραβάνε αντίθετα:',
  '',
  '**ΔΡΟΜΟΣ Α — ΙΕΚ/διδασκαλία τώρα**',
  'ΚΕΡΔΙΖΕΙΣ: έσοδα γρήγορα, κάνεις αυτό που ξέρεις',
  'ΚΟΣΤΙΖΕΙ: χρόνος, ενέργεια, άγνωστο αν επιτρέπεται',
  '',
  '**ΔΡΟΜΟΣ Β — σπουδές για διευθυντής**',
  'ΚΕΡΔΙΖΕΙΣ: σταθερή ανέλιξη, ασφάλεια',
  'ΚΟΣΤΙΖΕΙ: 10 χρόνια, η οικονομική πίεση παραμένει τώρα',
].join('\n');

// A — the exact turn where advice was given instead of the verification question.
const FIX_A = [
  U('Θέλω να αυξήσω το εισόδημά μου.'),
  AI(MAP_A),
  U('ιδανικά θα ήθελα μία μεσοβδόμαδη βάρδια'),
  AI('Αυτό είναι συγκεκριμένο και ρεαλιστικό. Αυτό το έχεις ελέγξει κάπου;'),
  U('όχι ακόμα δεν το έχω ελέγξει'),
];
// C — same shape, the turn before "Preply, Superprof".
const FIX_C = [
  U('θέλω να δω τι μπορώ να κάνω.'),
  AI(MAP_C),
  U('θέλω ιδέες θέλω βοήθεια δεν με βοηθάς'),
];
// B — the control. Thirty-two exchanges, no map, and the ritual worked.
const FIX_B = [
  U('Δεν το ξέρω αφού τώρα το βρήκαμε!'),
  AI('Ναι. Τότε αυτό είναι το επόμενο βήμα — να βρεις πού μαζεύονται αυτοί οι άνθρωποι.'),
  U('Νομίζω φτάνει'),
];

function stateFrom(msgs) {
  // Derived the way the app derives it: the real parser over AURA's own output, the real
  // closure detector over the user's last message. Nothing here is hand-asserted.
  let mapSeen = false;
  for (const m of msgs) if (m.role === 'assistant' && parseRoadMap(m.content)) { mapSeen = true; break; }
  const lastUser = [...msgs].reverse().find(m => m.role === 'user');
  return {
    roadMapDelivered: mapSeen,
    roadQuestionPending: false,
    shiftConfirmed: false,
    userClosing: isExplicitClosure((lastUser && lastUser.content) || ''),
  };
}

if (typeof decidePostMapClose === 'function' && typeof parseRoadMap === 'function') {
  const sA = stateFrom(FIX_A), sB = stateFrom(FIX_B), sC = stateFrom(FIX_C);
  assert('FIXTURE A: the real parser recognises the map AURA actually emitted', sA.roadMapDelivered === true);
  assert('FIXTURE C: the real parser recognises that map too', sC.roadMapDelivered === true);
  assert('FIXTURE B: no map in the session that worked', sB.roadMapDelivered === false);
  assert('FIXTURE A: at the turn advice was given, the close reminder SHOULD fire',
    decidePostMapClose(sA) === true);
  assert('FIXTURE C: at the turn advice was given, the close reminder SHOULD fire',
    decidePostMapClose(sC) === true);
  assert('FIXTURE B: the control session is never touched, on any turn',
    [1, 2, 3].every(n => decidePostMapClose(stateFrom(FIX_B.slice(0, n))) === false));
}

// ══ WIRING ════════════════════════════════════════════════════════════════
assert('A durable session flag exists — roadQuestionState is nulled and cannot carry this',
  /roadMapDelivered\s*=\s*useRef\(false\)/.test(CODE));
assert('The flag is set where a map is actually parsed, not guessed',
  /parseRoadMap\(text\)[\s\S]{0,400}roadMapDelivered\.current\s*=\s*true/.test(CODE));
assert('The flag is cleared by resetSession',
  /const resetSession[\s\S]{0,4000}?roadMapDelivered\.current\s*=\s*false/.test(CODE));
// REAL DEFECT, caught by test_ref_reset_integrity on the first full run of this work: the
// deliverOnce budget was not reset, so its two emissions were spent in session one and the
// reminder could never fire again for the life of the tab. Asserted here too, next to the
// mechanism it silences, rather than only in the generic ref sweep.
assert('The deliverOnce budget is reset — otherwise the reminder is silent from session two on',
  /const resetSession[\s\S]{0,4000}?postMapCloseCtxDelivered\.current\s*=\s*0/.test(CODE));

// ANCHORED ON THE ASSIGNMENT, not the bare name. `const postMapCloseCtx` matches
// `const postMapCloseCtxDelivered` — the budget ref, declared ~200 lines earlier — so the bare
// prefix extracted the wrong block entirely and reported nine failures that were the test's
// imprecision. Fourth time this exact substring-prefix collision has been caught in this repo
// (choice-btn/choice-btns, the dynamicSuffix list, buildRoadArtifact's definition-vs-call).
const CTX_AT = CODE.indexOf('const postMapCloseCtx = deliverOnce');
const CTX = CTX_AT < 0 ? '' : CODE.slice(CTX_AT, CODE.indexOf('\n      const ', CTX_AT + 10));
assert('postMapCloseCtx exists', CTX.length > 200);
// MEASURED: `/deliverOnce\(/` alone passed a mutation that replaced the ref with null —
// deliverOnce returns the string unchanged when handed a non-object, so the directive went out
// every single turn, which is the exact bug deliverOnce was introduced to fix.
assert('The ctx is budgeted through deliverOnce, with its own ref and a real budget',
  /deliverOnce\(/.test(CTX) && /postMapCloseCtxDelivered\s*,\s*[12]\s*\)/.test(CTX));
assert('That budget ref is a real useRef(0), not something deliverOnce would ignore',
  /const postMapCloseCtxDelivered\s*=\s*useRef\(0\)/.test(CODE));
assert('The ctx asks the real decision function, not its own inline condition',
  /decidePostMapClose\(/.test(CTX));
assert('The ctx is registered in dynamicSuffix',
  /dynamicSuffix\s*=\s*\[[\s\S]{0,700}postMapCloseCtx/.test(CODE));
assert('The ctx is registered in the collision logger, like every other ctx',
  /fired[\s\S]{0,60}Object\.entries\(\{[\s\S]{0,800}postMapCloseCtx/.test(CODE));

// ══ IT INTRODUCES NO NEW RULE — it routes to rules that already exist ═════
for (const section of ['Clarity + Ownership Scale', 'USER-VERIFIED SHIFT CHECK',
                       'STATE SHIFT RECOGNITION', 'THREE VALID ENDINGS']) {
  assert('The ctx names an existing prompt section: ' + section, CTX.includes(section));
  assert('…and that section really is in the prompt: ' + section, PROMPT.includes(section));
}
assert('The ctx re-states No Advice at the exact moment both transcripts broke it',
  /No Advice|NO ADVICE/.test(CTX));
assert('ΒΡΗΚΕΣ may draw on their reaction to the map, never on the map\'s own synthesised lines',
  /ΒΡΗΚΕΣ/.test(CTX) && /ΚΕΡΔΙΖΕΙΣ/.test(CTX));

// ══ COHERENCE WITH gatesCtx — they can fire on the same turn ═════════════
// Checked because they could have contradicted each other: gatesCtx says its due items "take
// priority over composing a closing move", and this ctx routes toward the close. They agree —
// gatesCtx's FIRST due item and this ctx's FIRST step are the same thing, the Clarity + Ownership
// Scale, which is also what the prompt's own Sequencing rule puts first. Pinned so a later edit
// to either one cannot silently turn agreement into a contradiction.
const GATES = (() => {
  const i = CODE.indexOf('const gatesCtx = (() =>');
  return i < 0 ? '' : CODE.slice(i, CODE.indexOf('\n      })();', i));
})();
assert('gatesCtx was located', GATES.length > 500);
assert('gatesCtx and this ctx both name Clarity + Ownership Scale as the first step',
  GATES.includes('Clarity + Ownership Scale') && CTX.includes('Clarity + Ownership Scale'));
assert('Both stand down on an explicit closure, so neither can override a declared exit',
  /isExplicitClosure\(/.test(GATES) && /isExplicitClosure\(/.test(CTX));

// ══ CACHE — the prompt is untouched ═══════════════════════════════════════
assert('PASSIVE: the mechanism is not wired into the prompt — cached prefix unchanged',
  !/postMapClose|roadMapDelivered|decidePostMapClose/.test(PROMPT));

// ══ KNOWN LIMIT, pinned so it stays visible ═══════════════════════════════
// roadQuestionState is nulled only when the run COMPLETES or the user exits. If the run is armed
// and then never engages — which is exactly what transcript C reported — the state stalls
// non-null forever. "Road questions are done" therefore also counts an EXHAUSTED run, but a
// STALLED one keeps this ctx silent. That is a separate, already-reported bug, not this one's to
// fix, and this assertion exists so nobody rediscovers it as a mystery.
assert('The pending check counts an exhausted run as done, not only a cleared one',
  CTX.length > 200 && /_st\.asked\s*<\s*Math\.min\(/.test(CTX));
assert('…and it also stands down while a road question is actually being emitted this turn',
  CTX.includes('roadQuestionCtx'));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
