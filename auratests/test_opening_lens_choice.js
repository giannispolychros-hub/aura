// AURA — item 4 of "the approved order after the lens incident" (ARCHITECTURE_DECISIONS.md):
// re-land inferLensFallback on the main path without re-creating Phase 1's defect.
//
// PHASE 1 (b5db808, shipped 2026-09-22, reverted 2026-09-25): wired inferLensFallback to the main
// path by WRITING activeLensRef — a session-level ref every lens prompt's own text contradicts
// ("USE THIS LENS ONCE. Ask one question. Then stop and wait."). A nursing teacher on 1300€ with
// four children scored EXPLORE; the session never left it; AURA surfaced options he never asked
// for, one of them possibly illegal. He named the violation himself. See ARCHITECTURE_DECISIONS.md,
// "Phase 1 reverted: a lens is a single-use instrument, and session state cannot hold one".
//
// THIS TIME: computeOpeningLensChoice picks which of the four ALREADY-EXISTING lens prompts
// basePrompt uses for exactly ONE call — through deliverOnce, budget 1 — and never writes
// activeLensRef, never calls setActiveLens, never increments lensSwitches. The session's standing
// lens is untouched before and after this one turn. No new prompt text, no cache write (all four
// lens prompts already exist and are already CORE-prefixed; this only changes which one basePrompt
// points at for one call).
//
// SCOPE, stated so it cannot be quietly widened: this closes item 4 alone. It does NOT connect
// selfRepetitionCtx, userStagnationCtx or clarityPivotHint to the lens system — that is a separate,
// not-yet-approved decision (see the conversation's own SAFEST SOLUTION note: wiring a stagnation
// signal to a GENERATIVE lens carries the same risk class as the incident above, arguably sharper).

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
eval(extract('inferLensFallback'));
eval(extract('computeOpeningLensChoice'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// Same three real-transcript fixtures test_lens_selection.js already pins — not reinvented here.
const NURSE   = "έχω 4 παιδιά ζώα με 1.300€ και άλλα 1.000 συζύγου 20300€ χωρίς νίκαιο βέβαια θα τα λεφτά πλέον για την ελλάδα είναι πάρα πάρα πολύ λίγα και δεν ξέρω τι επιλογές έχω τι να κάνω δεύτερη δουλειά αλλά είμαι δημόσιος υπάλληλος και δεν ξέρω κατά πόσο περιορίζεται αυτό μην να ξανασπιβάσω αλλά σκέφτομαι και το εξωτερικό έντονα το βασικό μου πτυχίο είναι νοσηλευτική";
const GAMING  = "Το πρόβλημα μου είναι πως χτίζω από το μηδέν ένα όνειρο που έχω εδώ και χρόνια απλά αποφάσισα να το υλοποιήσω τώρα. Μπήκα με τα όσα και νιώθω ότι είμαι φορτωμένος μέχρι πάνω. Χτίζω ένα κανάλι στο YouTube twitch tik tok discord τα έχω όλα σχεδόν έτοιμα αλλά τίποτα δεν εξελίσσεται σωστά. Οι viewers είναι σχεδόν 0 και κανένα βίντεο δεν βλέπει άσπρο φως. Έχω ξοδέψει χρόνο και χρήμα αλλά δεν αποδίδει όπως φανταζομουν.";
const TEACHER = "Είμαι εκπαιδευτικός στη νοσηλευτική στο τμήμα ειδικής αγωγής, νεοδιοριστος. Βλέπω πλέον ότι τα 1300 ευρώ δε φτάνουν για ποιοτητικη ζωηυ .. στα 41 έτη μου δεν έχω κ πολλές επιλογές για να αυξήσω το εισόδημα μου έχοντας 4 παιδιά";
const NEUTRAL = "Καλημέρα, θα ήθελα να συζητήσουμε κάτι.";

// ── NON-VACUITY: the fixtures still score what they always scored ──────────────────────────────
assert('NON-VACUITY: TEACHER (the session that broke Phase 1) still scores EXPLORE on its own',
  inferLensFallback(TEACHER, '') === 'EXPLORE');
assert('NON-VACUITY: NURSE still scores EXPLORE', inferLensFallback(NURSE, '') === 'EXPLORE');
assert('NON-VACUITY: GAMING still scores PERSPECTIVE', inferLensFallback(GAMING, '') === 'PERSPECTIVE');
assert('NON-VACUITY: a neutral opening still scores SIMPLIFY (the no-signal default)',
  inferLensFallback(NEUTRAL, '') === 'SIMPLIFY');

// ── THE REGRESSION TARGET — the exact opening that broke Phase 1, now safe to re-land ──────────
assert('FIX: the teacher opening, on the guarded main-path turn, chooses EXPLORE',
  computeOpeningLensChoice('ANSWER', 1, 0, TEACHER) === 'EXPLORE');
assert('FIX: the gaming opening chooses PERSPECTIVE the same way',
  computeOpeningLensChoice('ANSWER', 1, 0, GAMING) === 'PERSPECTIVE');

// ── SIMPLIFY IS NEVER RETURNED — it is already the standing default, nothing to override ───────
assert('a SIMPLIFY-scoring opening returns \'\' — SIMPLIFY needs no override',
  computeOpeningLensChoice('ANSWER', 1, 0, NEUTRAL) === '');

// ── THE GUARD: every condition that must hold, tested one at a time ────────────────────────────
assert('GUARD currentMode: COMPRESSION mode returns \'\' even on the exact same text',
  computeOpeningLensChoice('COMPRESSION', 1, 0, TEACHER) === '');
assert('GUARD currentMode: SUPPORTIVE mode returns \'\'',
  computeOpeningLensChoice('SUPPORTIVE', 1, 0, TEACHER) === '');
assert('GUARD msgCount: the second user message (msgCount 2) returns \'\', not just the opening',
  computeOpeningLensChoice('ANSWER', 2, 0, TEACHER) === '');
assert('GUARD msgCount: msgCount 0 returns \'\' (defensive — should not occur in practice)',
  computeOpeningLensChoice('ANSWER', 0, 0, TEACHER) === '');
// THE DISTRESS-EXCLUSION GUARD — the one that matters most. DISTRESS sets activeLensRef to
// PERSPECTIVE and increments lensSwitches BEFORE calling generateResponse. If this guard were
// missing, a distressed opening that also scores EXPLORE would receive BOTH PERSPECTIVE (from
// basePrompt, via activeLensRef) and a same-turn EXPLORE override — contradictory lens instructions
// stacked on the single turn where safety already made its own, deliberate choice.
assert('GUARD lensSwitchesSoFar: a session where DISTRESS (or anything) already moved the lens this turn returns \'\', never overriding it',
  computeOpeningLensChoice('ANSWER', 1, 1, TEACHER) === '');
assert('GUARD lensSwitchesSoFar: 2 also returns \'\' (any nonzero value, not just 1)',
  computeOpeningLensChoice('ANSWER', 1, 2, TEACHER) === '');

// ── PURITY: the function reads no ref, so the caller's snapshot is the only input that matters ──
const SRC = extract('computeOpeningLensChoice');
assert('PURITY: the function body contains no \'.current\' — it cannot read or mutate any ref itself',
  !/\.current/.test(SRC));
assert('PURITY: the function never calls setActiveLens or writes activeLensRef — those stay the caller\'s job',
  !/setActiveLens/.test(SRC) && !/activeLensRef/.test(SRC));

// ── WIRING: exactly one consumer besides the definition ─────────────────────────────────────────
const CALL_COUNT = (raw.match(/\bcomputeOpeningLensChoice\(/g) || []).length;
assert('WIRING: computeOpeningLensChoice is called from exactly one call site in the main file',
  CALL_COUNT === 2); // the definition's own "function computeOpeningLensChoice(" is not a call; this counts call-syntax occurrences only where name is followed by '(' — definition itself doesn't match this exact call pattern search separately, so 2 = def usage inside itself (0) is impossible; verified below instead.
// The line above is intentionally re-checked with a stricter, unambiguous count:
const DEF_PATTERN = /function computeOpeningLensChoice\(/g;
const CALLSITE_PATTERN = /computeOpeningLensChoice\(/g;
const defCount = (raw.match(DEF_PATTERN) || []).length;
const allOccurrences = (raw.match(CALLSITE_PATTERN) || []).length;
assert('WIRING (unambiguous): exactly 1 function definition and exactly 1 real call site',
  defCount === 1 && (allOccurrences - defCount) === 1);

// ── OLD PATH UNCHANGED: basePrompt's fallback must still be activeLensRef.current whenever this
// function returns '' (every turn except the one guarded opening) — verified structurally: the
// only production call site must fall back with `|| activeLensRef.current`.
assert('OLD PATH UNCHANGED: the call site falls back to activeLensRef.current when the choice is \'\'',
  /getLensPrompt\(openingLensChoice \|\| activeLensRef\.current\)/.test(raw));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
