// WHY THIS TEST EXISTS: [[EXIT:yes|no]] and [[EARLY_WORD:yes]] are silent contracts between the
// prompt (which instructs the model to emit an exact literal tag string, e.g. "[[EXIT:yes]]")
// and the code (which parses that exact literal string via regex, e.g. /\[\[EXIT:(yes|no)\]\]/).
// If the two sides drift — someone renames the tag in the prompt without updating every regex
// site, or edits a regex without updating the prompt — the failure is SILENT: no exception is
// thrown, the match simply returns null, the derived boolean (modelJudgesEnd for EXIT,
// earlyWordTagMatch for EARLY_WORD) becomes permanently false, and the application quietly loses
// one of its independent detection paths (for EXIT specifically: one of four separate paths that
// feed decideTermination's "confirm" decision — naturalExitReady, isModelPreClosing, modelJudgesEnd,
// modelSignalsEnd — so the loss is easy to miss since the other three keep working). Nothing in
// the existing 33 suites catches this today: every test that touches termination passes
// modelJudgesEnd in as an already-computed boolean, never parses the literal tag string itself.
//
// This test makes the contract structural: it confirms the literal tag text is present on BOTH
// the prompt side (the instruction to the model) and the code side (every regex that parses it),
// for both tags that currently follow this pattern. ANY FUTURE HIDDEN TAG of this same shape
// (prompt instructs the model to emit "[[SOMETHING:value]]", code parses it via regex) should be
// added to the checkTagContract() calls at the bottom of this file.
//
// STRUCTURAL PARSING, NOT LEXICAL: no AST parser is available in this environment, so this uses
// plain string/substring counting — the same convention every other test in this folder uses
// (raw.indexOf('function X')) — rather than a full JS/regex parser. Needles are chosen to be
// distinctive enough that they only occur where intended (documented per-needle below), not
// silently assumed to be unambiguous.

const fs = require('fs');
const path = require('path');

const raw = (() => {
  const candidates = ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx'];
  for (const c of candidates) {
    const p = path.join(__dirname, c);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');
})();

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

// ── Locate the prompt-text region (AURA_CORE_PERSONALITY template literal) ──
// Structural assumption checked explicitly, not silently assumed: both tag instructions
// (EXIT SIGNAL TAG, EARLY PERSONAL WORD CAPTURE) live inside this specific template literal. If
// that boundary ever moves, this test fails loudly (throws) rather than silently scanning the
// wrong region and reporting a false pass.
const promptStart = raw.indexOf('const AURA_CORE_PERSONALITY = `');
if (promptStart < 0) {
  throw new Error('Could not find "const AURA_CORE_PERSONALITY = `" — file shape changed, this test needs updating.');
}
const promptEndMarker = raw.indexOf('\n`;', promptStart);
if (promptEndMarker < 0) {
  throw new Error('Could not find AURA_CORE_PERSONALITY\'s closing "`;" — file shape changed, this test needs updating.');
}
const promptRegion = raw.slice(promptStart, promptEndMarker);
const codeRegion = raw.slice(promptEndMarker);

assert('Structural sanity: prompt region is substantial (not an empty/truncated match)', promptRegion.length > 5000);
assert('Structural sanity: code region is substantial (not an empty/truncated match)', codeRegion.length > 5000);

// ── Generic contract checker — reusable for any future hidden tag of this shape ──
// promptNeedles: literal tag text the prompt instructs the model to emit, e.g. "[[EXIT:yes]]"
//   (plain brackets — this is how the tag reads in prose, inside the prompt template literal).
// codeStandaloneNeedle: the literal regex-source substring (WITH the escaped brackets \[\[ ... \]\]
//   a real regex literal uses to match those characters) for sites that parse this tag alone.
// codeCombinedNeedle: the literal regex-source substring for sites that parse this tag as part of
//   a shared/combined regex (e.g. the tag-echo guard that strips either tag from user-typed input).
//   Optional — pass null if no combined site exists for this tag.
function checkTagContract(tagName, promptNeedles, codeStandaloneNeedle, codeCombinedNeedle) {
  const promptCount = promptNeedles.reduce((sum, n) => sum + countOccurrences(promptRegion, n), 0);
  assert(`${tagName}: literal tag text present in the PROMPT (model is instructed to emit it) — found ${promptCount}`, promptCount > 0);

  const standaloneCount = countOccurrences(codeRegion, codeStandaloneNeedle);
  const combinedCount = codeCombinedNeedle ? countOccurrences(codeRegion, codeCombinedNeedle) : 0;
  const codeRegexCount = standaloneCount + combinedCount;
  assert(`${tagName}: at least one CODE regex parses the literal tag — found ${codeRegexCount} (standalone: ${standaloneCount}, combined: ${combinedCount})`, codeRegexCount > 0);

  assert(`${tagName}: contract holds on BOTH sides (prompt > 0 AND code > 0)`, promptCount > 0 && codeRegexCount > 0);

  return { promptCount, codeRegexCount };
}

// ── [[EXIT:yes|no]] contract ──
// Prompt side: EXIT SIGNAL TAG section instructs the model to emit exactly "[[EXIT:yes]]" or
// "[[EXIT:no]]" on its own line. Code side: 5 standalone parse sites (exitTagMatch itself, plus
// 4 identical strip-before-display sites) all share the literal regex source \[\[EXIT:(yes|no)\]\],
// and 1 combined site (the tag-echo guard, escaping a user typing the tag literally) matches it
// as part of an alternation with EARLY_WORD.
const exitResult = checkTagContract(
  '[[EXIT:yes|no]]',
  ['[[EXIT:yes]]', '[[EXIT:no]]'],
  '\\[\\[EXIT:(yes|no)\\]\\]',
  'EXIT:(yes|no)|EARLY_WORD:yes'
);
assert('[[EXIT:yes|no]]: exactly the expected number of known code-side regex sites (6) — a change here means a site was added/removed, worth a second look, not necessarily a failure', exitResult.codeRegexCount === 6);

// ── [[EARLY_WORD:yes]] contract ──
// Prompt side: EARLY PERSONAL WORD CAPTURE section instructs the model to emit exactly
// "[[EARLY_WORD:yes]]" on its own line. Code side: 2 standalone parse sites (earlyWordTagMatch
// itself, plus the strip-before-display replace) share the literal regex source
// \[\[EARLY_WORD:yes\]\], and 1 combined site (the same tag-echo guard as above) matches it as
// part of the EXIT alternation.
const earlyWordResult = checkTagContract(
  '[[EARLY_WORD:yes]]',
  ['[[EARLY_WORD:yes]]'],
  '\\[\\[EARLY_WORD:yes\\]\\]',
  'EARLY_WORD:yes)\\]\\]'
);
assert('[[EARLY_WORD:yes]]: exactly the expected number of known code-side regex sites (3) — a change here means a site was added/removed, worth a second look, not necessarily a failure', earlyWordResult.codeRegexCount === 3);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
