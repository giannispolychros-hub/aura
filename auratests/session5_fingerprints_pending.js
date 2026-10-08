// PENDING REGRESSION ARTIFACT — NOT PART OF CI
//
// 2 assertions are intentionally RED:
//   - CLOSING_WORD_AMBIGUITY
//   - ADVICE_LEAKAGE
//
// Do not rename to test_*.js until both are GREEN.
//
// This file's name deliberately does not match test_*.js / stress_test_*.js — the exact glob
// .github/workflows/test.yml and RUN_ALL.bat both use to discover every suite that must pass with
// 0 failures, 0 silent. That boundary is not new: auratests/real_parse_check.js already sits
// outside it today, as a precedent. No new runner, no skip/xfail mechanism, no CLAUDE.md change —
// this file is simply not named to be discovered, the same way that one already isn't.
//
// WHEN THE UNDERLYING DETECTOR GAPS ARE FIXED (small diffs to existing detectors — declaresClosing
// for CLOSING_WORD_AMBIGUITY, detectsUnsourcedOptionOffer's GATE 2 for ADVICE_LEAKAGE — never new
// detectors): rename this file to test_session5_fingerprints.js, run the full suite, and require
// 75 suites / 0 failed / 0 silent before that commit. Until then, this file is visible, versioned
// forensic evidence of two specific, reproducible gaps — not hidden debt.
//
// THIS COUNT IS NOT A FIXED TARGET — RE-COUNT AT PROMOTION TIME. 75 is what `ls test_*.js
// stress_test_*.js | wc -l` in auratests/ returned on 2026-09-27, the day this file was written.
// Other, unrelated work may add or remove suites before this is promoted — re-run that same count
// at promotion time and require whatever it says then, not this number from memory. The method
// (count the glob, require 0 failed / 0 silent) is the actual contract, not today's figure.
//
// THE PROMOTION COMMIT MUST BE VERIFIED, NOT JUST THE SUITE COUNT. When these 2 assertions go
// GREEN, confirm the diff of that commit touches ONLY this file (the rename, plus whatever line(s)
// fixed the two detectors) — never bundle it with unrelated changes. A suite count matching before
// and after proves nothing on its own: unrelated work landing in the same window could add and
// remove suites in numbers that happen to cancel out. Read the actual diff.
//
// AURA — 7 BEHAVIORAL FINGERPRINTS FROM A REAL SESSION, SYNTHETIC FORM
//
// A real session (2026-09-27) surfaced 7 signals. Per explicit founder instruction, the real
// transcript is NOT stored here — this repo already has a written policy against that
// (test_first_why_session.js: "THE REAL TRANSCRIPTS ARE DELIBERATELY NOT COMMITTED. They carry a
// real person's income, family and legal situation... a test fixture is not an exception to it.").
// Below are 7 synthetic behavioral fingerprints instead — no names, profession, school, region, or
// personal history, and no full conversation. Each fixture is the smallest synthetic input that
// reproduces the SAME code path, not a paraphrase of the real content.
//
// ARCHAEOLOGY DONE FIRST (per direct instruction, before writing anything): grepped every existing
// test file for the 7 SIGNAL names and for the specific mechanisms below. Findings:
//   - No existing file names any of these 7 signals.
//   - Fingerprint 4 (ADVICE_LEAKAGE) is CLOSE to existing coverage, not identical: test_unsourced_
//     options.js already tests "Υπάρχουν [κατευθύνσεις...]" framed declaratives extensively (A00,
//     B41, and the D1/D2 fixtures), and GATE 2 checks the WHOLE message text for a frame word, not
//     just near the list — so D1's second list ("Υπάρχουν και δύο που δεν ανέφερες: ...") is
//     rescued by "κατευθύνσεις" appearing earlier in the SAME message. The real session's gap is
//     narrower and genuinely new: a message where NO gate-2 word appears ANYWHERE at all. Confirmed
//     by reading detectsUnsourcedOptionOffer's own source directly, not assumed.
//   - Fingerprints 1, 2, 3, 5, 6, 7 have no existing coverage under any name searched.
//
// THREE CATEGORIES, three different treatments (founder's own red-team finding — collapsing these
// into one kind of regression test would confuse an architecture bug with a detector-coverage bug
// with LLM output variance):
//   A — CONTROL-FLOW FAILURE (premature closure, no road map, exit swallows loop): characterization
//       only. These document CURRENT behavior and pass. No target behavior is asserted because none
//       has been decided yet — per explicit instruction, no production code this round, and the
//       EXIT/LOOP question specifically needs its own separate investigation before any fix design.
//   B — EXISTING DETECTOR MISMATCH (closing-word ambiguity, advice leakage): genuine RED tests.
//       These assert the CORRECT/desired result and currently FAIL — small, targeted gaps in
//       detectors that already exist, fixable with a small diff to the EXISTING detector, never a
//       new one.
//   C — MODEL-OUTPUT QUALITY (temporal hallucination, grammar): characterization / telemetry only.
//       Not architectural work — grammar in free-generated text cannot be asserted against by a
//       code-level test, and "no wall-clock ever reaches the model" is a structural fact to pin, not
//       a bug to fix here.

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
for (const n of ['isExplicitClosure', 'declaresClosing', 'matchesClosingWord', 'isBareEmojiOrAcknowledgment',
                 'detectsUnsourcedOptionOffer', 'parseRoadMap', 'structuralLabelsIn']) {
  eval(extract(n));
}

let passed = 0, failed = 0, characterized = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function characterize(label, cond) { characterized++; console.log((cond ? 'CHARACTERIZED (matches current code)' : 'CHARACTERIZED (does NOT match — recheck the description)') + ' — ' + label); if (!cond) failed++; else passed++; }

// ════════════════════════════════════════════════════════════════════════════════════════════
// CATEGORY B — EXISTING DETECTOR MISMATCH. Genuine RED tests: small gaps in detectors that
// already exist. Fixable with a small diff to the EXISTING mechanism, never a new one.
// ════════════════════════════════════════════════════════════════════════════════════════════

// ── FINGERPRINT: CLOSING_WORD_AMBIGUITY ──────────────────────────────────────────────────────
// SIGNAL:               CLOSING_WORD_AMBIGUITY
// INPUT SHAPE:           a short, unambiguous, wholly generic Greek farewell — "OK, we'll talk
//                        again" — carrying no personal content of any kind.
// EXPECTED CODE STATE:   at least one of the three closing detectors should recognize an
//                        unambiguous farewell phrase.
// EXPECTED USER EFFECT:  a plain, ordinary way of ending a conversation should not be invisible to
//                        every closing-recognition mechanism the app has.
// CURRENT RESULT:        FALSE on all three. Measured precisely: the near-synonym "τα λέμε" (a
//                        different, extremely common Greek farewell) IS caught by all three
//                        detectors — so this is not a missing CONCEPT, it is a missing WORD FORM
//                        ("ξανά μιλάμε" / "ξαναμιλήσουμε") in an existing wordlist. This is the RED
//                        test referenced for a later one-line fix to the EXISTING detector.
const GENERIC_FAREWELL_MISSED = 'Οκ.. ξανά μιλάμε';
const GENERIC_FAREWELL_CAUGHT = 'τα λέμε'; // proves the GAP is a word-form, not a missing concept
assert('NON-VACUITY: the near-synonym farewell IS already caught by all three detectors — ruling out "the whole concept is missing"',
  isExplicitClosure(GENERIC_FAREWELL_CAUGHT) === true && declaresClosing(GENERIC_FAREWELL_CAUGHT) === true && matchesClosingWord(GENERIC_FAREWELL_CAUGHT) === true);
assert('CLOSING_WORD_AMBIGUITY (RED — the gap): an equally unambiguous "we\'ll talk again" farewell SHOULD be recognized by at least one detector, but currently is not',
  isExplicitClosure(GENERIC_FAREWELL_MISSED) || declaresClosing(GENERIC_FAREWELL_MISSED) || matchesClosingWord(GENERIC_FAREWELL_MISSED));

// SEPARATE, SUPPORTING FINDING: once a bare acknowledgment follows an unrecognized farewell like
// the one above, matchesClosingWord alone (true on a bare "Θενξ") drives a COMPLETELY SEPARATE
// code path — never decideTermination's own decision. Recorded here because it explains WHY the
// missed farewell above has a real, visible consequence rather than being a purely theoretical gap.
const BARE_ACK = 'Θενξ';
assert('SUPPORTING: matchesClosingWord is true on a bare acknowledgment alone', matchesClosingWord(BARE_ACK) === true);
assert('SUPPORTING: declaresClosing/isExplicitClosure are both false on the same bare acknowledgment',
  declaresClosing(BARE_ACK) === false && isExplicitClosure(BARE_ACK) === false);
const UDE_DEF_START = raw.indexOf('const userDeclaredExit = ');
assert('NON-VACUITY: userDeclaredExit\'s own definition is findable', UDE_DEF_START > 0);
const UDE_DEF = raw.slice(UDE_DEF_START, raw.indexOf(';', raw.indexOf('declaresClosing(', UDE_DEF_START)) + 1);
assert('WIRING: userDeclaredExit\'s definition calls both isExplicitClosure and declaresClosing, and never matchesClosingWord',
  /isExplicitClosure\(/.test(UDE_DEF) && /declaresClosing\(/.test(UDE_DEF) && !/matchesClosingWord\(/.test(UDE_DEF));
assert('WIRING: the bare-emoji override reads matchesClosingWord independently of decideTermination, at a separate call site',
  /const userWasClosing = matchesClosingWord\(lastUserMsg\) \|\| declaresClosing\(lastUserMsg\);/.test(raw));

// ── FINGERPRINT: ADVICE_LEAKAGE ──────────────────────────────────────────────────────────────
// SIGNAL:               ADVICE_LEAKAGE
// INPUT SHAPE:           the user states they have not yet looked into something ("Δεν το έχω
//                        ψάξει ακόμα" — already generic, identifies nothing). AURA's reply then
//                        states, as plain fact (never framed as "options"/"directions"/"paths"),
//                        an em-dash-introduced list of 2+ alternatives the user never named, using
//                        wholly generic placeholder alternatives here (not the real ones).
// EXPECTED CODE STATE:   detectsUnsourcedOptionOffer should recognize this as an unsourced option
//                        offer — the substance (unprompted alternatives, none traceable to the
//                        user's own words) is identical to what it already catches elsewhere.
// EXPECTED USER EFFECT:  the model should not be able to slip unsourced advice past the No-Advice
//                        guard merely by presenting it as a statement of fact rather than a list of
//                        options.
// CURRENT RESULT:        false. Root cause read directly from detectsUnsourcedOptionOffer's own
//                        source: GATE 2 requires one frame word anywhere in the WHOLE message
//                        (κατευθυνσ|επιλογ|λυσ|δρομο|τροπο|δυνατοτητ|εναλλακτικ|κατηγορι|σεναρι|
//                        ιδεε). A message that presents alternatives as bare fact ("Υπάρχουν — Χ,
//                        Ψ, Ω.") with NONE of those words anywhere fails GATE 2 and the whole
//                        detector stays silent, regardless of GATE 3's enumeration being real.
//
// NOT A DUPLICATE OF EXISTING COVERAGE, confirmed by reading test_unsourced_options.js in full:
// its own D1 fixture ("Υπάρχουν και δύο που δεν ανέφερες: ...") LOOKS similar but is rescued by
// "κατευθύνσεις" appearing earlier in that SAME message (GATE 2 checks the whole text, not
// proximity to the list) — so D1 does not exercise the true zero-frame-word case. This fixture
// does, by construction: the synthetic alternatives below (Χ, Ψ, Ω — deliberately meaningless
// placeholders) are chosen specifically to contain NONE of GATE 2's trigger words anywhere.
const PRIOR_USER_TEXT = 'Δεν το έχω ψάξει ακόμα';
const ADVICE_LEAKAGE_SYNTHETIC =
  'Υπάρχουν — η κατάσταση Χ, η κατάσταση Ψ, αλλαγή σε Ω, ακόμα και επιστροφή στην προηγούμενη θέση αν προκύψει ευκαιρία.\n\n' +
  'Δεν είσαι κλειδωμένος για πάντα σε αυτό.\n\n' +
  'Αυτό αλλάζει κάτι στο πώς το βλέπεις;';
assert('NON-VACUITY: the synthetic fixture genuinely contains none of GATE 2\'s trigger words',
  !/(κατευθυνσ|επιλογ|λυσ|δρομο|τροπο|δυνατοτητ|εναλλακτικ|κατηγορι|σεναρι|ιδεε)/i.test(
    ADVICE_LEAKAGE_SYNTHETIC.normalize('NFD').replace(/[̀-ͯ]/g, '')));
assert('NON-VACUITY: it genuinely contains a real, 3-item enumeration (GATE 3 would pass on its own)',
  (ADVICE_LEAKAGE_SYNTHETIC.split('\n')[0].match(/,/g) || []).length >= 2);
assert('ADVICE_LEAKAGE (RED — the gap): detectsUnsourcedOptionOffer SHOULD flag a fact-framed, zero-frame-word list of unsourced alternatives, but currently does not',
  detectsUnsourcedOptionOffer(ADVICE_LEAKAGE_SYNTHETIC, [PRIOR_USER_TEXT], parseRoadMap) === true);

// ════════════════════════════════════════════════════════════════════════════════════════════
// CATEGORY A — CONTROL-FLOW FAILURE. Characterization only: documents CURRENT behavior, no target
// asserted yet. No production code this round, per explicit instruction.
// ════════════════════════════════════════════════════════════════════════════════════════════

// ── FINGERPRINT: PREMATURE_CLOSURE ───────────────────────────────────────────────────────────
// SIGNAL:               PREMATURE_CLOSURE
// INPUT SHAPE:           after a substantive multi-turn exploratory loop, the user sends a plain
//                        closing-flavored phrase that trips none of the closing detectors (generic
//                        "we'll talk again" shape) — AURA replies plainly, not with the full
//                        ritual. The user then sends a bare acknowledgment, AND AURA's own
//                        generated reply that turn happens to be bare-emoji-only.
// EXPECTED CODE STATE:   before appending a farewell to a bare-emoji reply, some check-in step
//                        should exist confirming the user is actually done, not just that their
//                        last two words matched a detector.
// EXPECTED USER EFFECT:  a session should not be able to fall out of substantive material via one
//                        ambiguous acknowledgment with zero confirmation step.
// CURRENT RESULT:        the bare-emoji override (γρ. ~5822-5832) appends "Καληνύχτα." or "Τι
//                        σκέφτεσαι τώρα;" based purely on matchesClosingWord||declaresClosing on
//                        the user's LAST message — no check-in question exists in this code path.
//                        CHECK BEFORE ADDING (prompt text) exists but is scoped to a DIFFERENT
//                        moment (right after the three-beat shift specifically), not this one.
// UPDATED (8/10/2026, ADR «8 Οκτωβρίου (γ)»): the closing choice now reads "Καλή συνέχεια." instead of "Καληνύχτα.".
characterize('PREMATURE_CLOSURE: the bare-emoji override contains no check-in step, only the two hardcoded sentence choices',
  /const addition = userWasClosing \? "Καλή συνέχεια\." : "Τι σκέφτεσαι τώρα;";/.test(raw) &&
  !/(θέλεις να συνεχίσουμε|θέλεις να προσθέσεις)/i.test(raw.slice(raw.indexOf('isBareEmojiOrAcknowledgment(displayText)'), raw.indexOf('isBareEmojiOrAcknowledgment(displayText)') + 1200)));
characterize('PREMATURE_CLOSURE: CHECK BEFORE ADDING exists but is scoped to the three-beat moment specifically, not the bare-emoji path',
  /CHECK BEFORE ADDING, right after the three-beat shift/.test(raw));

// ── FINGERPRINT: NO_ROAD_MAP ──────────────────────────────────────────────────────────────────
// SIGNAL:               NO_ROAD_MAP
// INPUT SHAPE:           a session that touches several distinct dimensions (fear, safety,
//                        role-fit, an irreversible choice already made, what would make it
//                        tolerable, named alternatives, an immediate next step) without ever
//                        converging into a parseable road-map format.
// EXPECTED CODE STATE:   n/a yet — deliberately not decided this round.
// EXPECTED USER EFFECT:  n/a yet.
// CURRENT RESULT:        no code-level gate exists that requires an attempt at PATH GENERATION
//                        once N dimensions are covered — the decision to attempt one is 100%
//                        model judgement (ROAD DISCOVERY's own distinctness/consequence/level/
//                        completeness criteria). The only code-level road-map mechanism
//                        (classifyRoadProvenance) audits a map AFTER it exists; it never forces
//                        one to exist.
characterize('NO_ROAD_MAP: no function name in this file computes whether PATH GENERATION is "due" from dimension coverage',
  !/function\s+\w*(pathGenerationDue|roadMapDue|shouldGenerateRoadMap)/i.test(raw));

// ── FINGERPRINT: EXIT_SWALLOWS_LOOP ──────────────────────────────────────────────────────────
// SIGNAL:               EXIT_SWALLOWS_LOOP
// INPUT SHAPE:           n/a — this is a static, structural fingerprint about decideTermination's
//                        own parameter list, not a specific conversational input.
// EXPECTED CODE STATE:   deliberately NOT "coverageReportCtx/familiesUsed passed into
//                        decideTermination" — founder's own explicit red-team finding: coupling
//                        the termination engine to product/coverage logic directly is the wrong
//                        fix and is not being done. The eventual, smaller contract under
//                        consideration (not built here): LOOP exposes a terminal-eligibility
//                        signal, EXIT consumes only that signal — never full LOOP state.
// EXPECTED USER EFFECT:  n/a yet — this fingerprint's job today is to PIN the current absence, so
//                        a future accidental coupling (someone passes coverageReportCtx into
//                        decideTermination's options directly) is caught as a deliberate change,
//                        not a silent one.
// CURRENT RESULT:        confirmed — the options object decideTermination is actually called with
//                        contains none of these fields.
const DT_CALL_START = raw.indexOf('const decision = decideTermination(msgs, text, {');
assert('NON-VACUITY: the real production call site is findable', DT_CALL_START > 0);
const DT_CALL = raw.slice(DT_CALL_START, raw.indexOf('});', DT_CALL_START));
assert('EXIT_SWALLOWS_LOOP (PINNED, watch for future coupling): decideTermination\'s actual options object contains none of coverageReportCtx/familiesUsed/goalObstacleStakesCtx — termination stays decoupled from LOOP-completion state',
  !/coverageReportCtx|familiesUsed|goalObstacleStakesCtx/.test(DT_CALL));

// ════════════════════════════════════════════════════════════════════════════════════════════
// CATEGORY C — MODEL-OUTPUT QUALITY. Characterization / telemetry only. Not architectural work.
// ════════════════════════════════════════════════════════════════════════════════════════════

// ── FINGERPRINT: TEMPORAL_HALLUCINATION ──────────────────────────────────────────────────────
// SIGNAL:               TEMPORAL_HALLUCINATION
// INPUT SHAPE:           any closing-flavored exchange where the bare-emoji override or the
//                        model's own free text produces a time-of-day-specific word ("Καληνύχτα").
// CURRENT RESULT:        no wall-clock or timestamp of any kind is ever included in what the model
//                        reads — every Date.now()/new Date() in this file is internal bookkeeping
//                        (memory timestamps, session ids, export filenames). The model sees message
//                        content only, so "Καληνύχτα" (or any time-of-day claim) is never grounded.
// UPDATED (8/10/2026, ADR «8 Οκτωβρίου (γ)»): the bare-emoji override's half of this fingerprint is closed — its closing
// literal is now "Καλή συνέχεια.", which names no time of day (it still reads no clock, and needs none). The model's own
// free text can still say "Καληνύχτα"; that half is unchanged (prompt-level, not touched).
characterize('TEMPORAL_HALLUCINATION: the bare-emoji override no longer names a time of day ("Καλή συνέχεια.", no "Καληνύχτα." literal)',
  /const addition = userWasClosing \? "Καλή συνέχεια\." : "Τι σκέφτεσαι τώρα;";/.test(raw) && !/const addition = userWasClosing \? "Καληνύχτα\."/.test(raw));

// ── FINGERPRINT: LANGUAGE_QUALITY ────────────────────────────────────────────────────────────
// SIGNAL:               LANGUAGE_QUALITY
// INPUT SHAPE:           free-generated closing reflection text (SYSTEM_TERMINATION output).
// CURRENT RESULT:        not testable by a code-level assertion — this is free text generated by
//                        the model, produced by no template in this file. Recorded here as a
//                        finding for quality telemetry, not as a regression test with a pass/fail
//                        oracle: there is no deterministic code path to assert against.
console.log('CHARACTERIZED (no code assertion possible) — LANGUAGE_QUALITY: grammar in free-generated text is quality telemetry, not a code-level regression target this round.');

console.log('\n' + passed + ' passed, ' + failed + ' failed (' + characterized + ' of the passed were characterizations of current behavior, not correctness claims)');
process.exit(failed > 0 ? 1 : 0);
