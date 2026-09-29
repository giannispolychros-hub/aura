// AURA — ΒΡΗΚΕΣ PROVENANCE, real-session finding (2026-09-29).
//
// A real session showed AURA introduce an idea itself ("Υπάρχει μια κατηγορία που ίσως δεν έχεις
// εξετάσει: εκπαιδευτικό περιεχόμενο online...", later "no-code" platforms with named tools and
// prices), then close with "ΒΡΗΚΕΣ: μια ιδέα που βγήκε από δική σου ανάγκη..." — crediting the
// person with a discovery in the SAME reply that first offered it. Not reproduced here — same
// privacy discipline as test_first_why_session.js, only the structural pattern is kept.
//
// THE REJECTED FIX, FOUND BEFORE WRITING ANY CODE: the obvious check — compare ΒΡΗΚΕΣ's words
// against the user's own prior messages — is the exact word-overlap provenance technique
// buildRoadArtifact's own comment (a few functions above classifyRoadProvenance in App.jsx)
// documents as MEASURED AND REJECTED for this product: "vocabulary overlap turned out ANTI-
// correlated with fabrication, because a model writing an invented line reuses the user's own
// words by construction... every string-matching provenance check produced errors in both
// directions." buildRoadArtifact's own answer — assemble the artifact from verified pieces instead
// of auditing free text — does not transfer here: ΒΡΗΚΕΣ is narrative synthesis, not a list of
// structured fields, so there is nothing to assemble it FROM.
//
// THE SCOPE THIS FILE ACTUALLY TESTS, chosen with the founder for exactly that reason: a PASSIVE
// TELEMETRY COUNTER only — same word-overlap technique classifyRoadProvenance already uses (and
// the product already tolerates, for an UNVERIFIED label on Road Map lines, never for auto-writing
// content) — but here it only counts for review. It never touches the reply, never blocks, never
// changes what ships in the Blueprint sheet (which already excludes ΒΡΗΚΕΣ/SHIFT entirely — see
// buildBlueprintZones's own "SHIFT is deliberately absent" comment — so this counter is genuinely
// new visibility, not a second guard on something already guarded).

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
eval(extract('parseThreeBeatShift'));
eval(extract('detectsUnverifiedFoundClaim'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── THE REAL SHAPE, RECONSTRUCTED GENERICALLY (no real user words) ──────────
const USER_HISTORY_NEVER_MENTIONED_THE_IDEA = [
  'νιώθω εγκλωβισμένος οικονομικά, δεν ξέρω τι άλλο να κάνω',
  'δεν έχω χρόνο ούτε κεφάλαιο για να ξεκινήσω κάτι καινούργιο',
];
const AURA_INTRODUCED_IT_FIRST =
  'μια ιδέα που βγήκε από δική σου ανάγκη — εφαρμογή που προσαρμόζει την παιδαγωγική προσέγγιση στο προφίλ κάθε παιδιού';

assert('a ΒΡΗΚΕΣ claim with none of its content words anywhere in the user\'s own messages is flagged',
  detectsUnverifiedFoundClaim(AURA_INTRODUCED_IT_FIRST, USER_HISTORY_NEVER_MENTIONED_THE_IDEA) === true);

// ── THE MIRROR THAT MUST SURVIVE — genuinely traceable to the user's own words ──
const USER_HISTORY_NAMED_IT = [
  'θα ήθελα μία εφαρμογή που να βάζει προφίλ για κάθε παιδί και να ξέρει τις ιδιαιτερότητές του',
];
const GENUINELY_THEIRS =
  'μια εφαρμογή που βάζει προφίλ για κάθε παιδί, ακριβώς όπως το περιέγραψες';
assert('a ΒΡΗΚΕΣ claim that shares real content words with the user\'s own prior message is NOT flagged',
  detectsUnverifiedFoundClaim(GENUINELY_THEIRS, USER_HISTORY_NAMED_IT) === false);

// ── THE 4-CHARACTER FLOOR IS LOAD-BEARING, NOT AN ARBITRARY CHOICE ───────────
// A 3-letter word ("app") is the ONLY thing shared between the found text and the user's own
// history below — everything else is disjoint. At the 4+ floor "app" never enters the content
// list, so the claim is (correctly) flagged as unverified. If the floor were relaxed to 3, "app"
// alone would count as a shared content word and the claim would wrongly read as sourced.
const USER_HISTORY_ONLY_SHARES_A_SHORT_WORD = ['θέλω μια app για το κινητό'];
const FOUND_SHARES_NOTHING_SUBSTANTIVE_EXCEPT_THE_SHORT_WORD =
  'μια εντελώς νέα ιδέα, μια app που θα λειτουργήσει τέλεια';
assert('THE FLOOR MATTERS: a shared 3-letter word alone must not exonerate a claim',
  detectsUnverifiedFoundClaim(FOUND_SHARES_NOTHING_SUBSTANTIVE_EXCEPT_THE_SHORT_WORD, USER_HISTORY_ONLY_SHARES_A_SHORT_WORD) === true);

// ── DEGENERATE INPUT ─────────────────────────────────────────────────────────
assert('empty/null found text never flags — nothing to judge',
  detectsUnverifiedFoundClaim('', USER_HISTORY_NEVER_MENTIONED_THE_IDEA) === false &&
  detectsUnverifiedFoundClaim(null, USER_HISTORY_NEVER_MENTIONED_THE_IDEA) === false);
assert('missing or empty user history never flags — nothing to compare against',
  detectsUnverifiedFoundClaim(AURA_INTRODUCED_IT_FIRST, null) === false &&
  detectsUnverifiedFoundClaim(AURA_INTRODUCED_IT_FIRST, []) === false);
assert('only short function words / stopwords in the found text never flags — nothing substantive to check',
  detectsUnverifiedFoundClaim('αυτό είναι κάτι που το είπες', []) === false);

// ── IT STAYS AN OBSERVER ──────────────────────────────────────────────────────
const SRC = extract('detectsUnverifiedFoundClaim');
assert('the detector is pure — it returns a verdict and touches nothing',
  !/setState|set[A-Z]|\.current\s*=|callAura|localStorage/.test(SRC));

// ── WIRING ─────────────────────────────────────────────────────────────────
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

assert('WIRING: a session-scoped counter ref exists, same shape as unsourcedOptionOffers',
  /unverifiedFoundClaims\s*=\s*useRef\(0\)/.test(CODE));
assert('WIRING: the per-turn scan calls parseThreeBeatShift on the same tag-stripped text as every other observer',
  /parseThreeBeatShift\(_clean\)/.test(CODE));
assert('WIRING: the detector is given the PARSED found beat, not the raw reply — gated behind _threeBeat existing at all',
  /_threeBeat\s*&&\s*detectsUnverifiedFoundClaim\(_threeBeat\.found,/.test(CODE));
assert('WIRING: the counter actually increments where the detector fires',
  /unverifiedFoundClaims\.current\s*\+=\s*1/.test(CODE));
assert('WIRING: it is given USER messages only — AURA\'s own earlier inventions must not count as sourced',
  /detectsUnverifiedFoundClaim\([^;]*role\s*===\s*"user"/.test(CODE));
assert('WIRING: the counter is reset on session reset, so counts never leak between sessions',
  /unverifiedFoundClaims\.current\s*=\s*0/.test(CODE));
const tele = CODE.slice(CODE.indexOf('session_completed'));
assert('WIRING: the count reaches session_completed telemetry, reading its OWN counter',
  /unverifiedFoundClaims:[^\n]*unverifiedFoundClaims\.current/.test(tele));
assert('WIRING: counts only — the value is the numeric counter itself, never the reply text',
  /unverifiedFoundClaims:\s*Math\.min\(9999,\s*unverifiedFoundClaims\.current\)/.test(tele));
assert('PASSIVE: none of the new machinery leaked into the system prompt',
  !/unverifiedFoundClaims|detectsUnverifiedFoundClaim/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
