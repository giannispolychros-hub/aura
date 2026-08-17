// ⚠️  SCOPE NOTE (adversarial self-audit finding — same honest-labeling pattern already used by
// test_carry_forward.js): checkAnchorCoverage is DORMANT — defined in App.jsx but called ZERO
// times by the application. These tests validate the function's logic in isolation; they do
// NOT demonstrate that anchor coverage runs in production, because it does not. A green result
// here must never be read as "the anchor coverage feature works live." If the function is ever
// wired in, delete this note and the matching comment above its definition in App.jsx.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
const startIdx = raw.indexOf('function normalizeGreekText');
const endIdx = raw.indexOf('// Product Visibility fix', startIdx);
eval(raw.slice(startIdx, endIdx));

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

// 1. Basic exact match coverage
let r = checkAnchorCoverage(
  [{role:"user", content:"σκέφτομαι πολύ τη σταθερότητα αυτή την περίοδο"}],
  ["σταθερότητα", "ρίσκο"]
);
assert("Exact reappearance detected as covered", r.covered.includes("σταθερότητα"));
assert("Never-mentioned word correctly uncovered", r.uncovered.includes("ρίσκο"));

// 2. Accent-insensitive matching (real requirement, same technique as matchesClosingWord)
r = checkAnchorCoverage(
  [{role:"user", content:"νιώθω οτι δεν εχω ασφαλεια"}], // no accents, user typed casually
  ["ασφάλεια"] // accented anchor word
);
assert("Accent-insensitive matching works (unaccented message, accented anchor)", r.covered.includes("ασφάλεια"));

// 3. No fixed cap — works with 5 anchors, not just 4
r = checkAnchorCoverage(
  [{role:"user", content:"μιλάμε για χρόνος και κόστος συνέχεια"}],
  ["χρόνος", "κόστος", "οικογένεια", "υγεία", "καριέρα"]
);
assert("Works correctly with 5 anchors (no hard cap)", r.covered.length + r.uncovered.length === 5);
assert("Correctly identifies 2 of 5 as covered", r.covered.length === 2);

// 3b. FIXED: Greek grammatical inflection now caught via conservative stemming (genitive/nominative)
r = checkAnchorCoverage(
  [{role:"user", content:"το κόστος αυτού του χρόνου με ανησυχεί"}], // genitive "χρόνου"
  ["χρόνος"] // base/nominative form
);
assert("Genitive form ('χρόνου') correctly matches base anchor ('χρόνος') via stemming", r.covered.includes("χρόνος"));

// 3b-note: bare accusative singular ("χρόνο", ending in unmarked -ο) is intentionally NOT
// stripped — that ending is far too common across unrelated Greek words to strip safely
// without real false-positive risk. This is an accepted, narrower scope than full declension
// coverage, consistent with the conservative approach documented in stemGreekWord above.
r = checkAnchorCoverage(
  [{role:"user", content:"σκέφτομαι συνέχεια τον χρόνο που έχω"}], // bare accusative "χρόνο"
  ["χρόνος"]
);
assert("Documented narrower scope: bare accusative ('χρόνο') is not stripped, stays uncovered — intentional, avoids false-positive risk", r.uncovered.includes("χρόνος"));

r = checkAnchorCoverage(
  [{role:"user", content:"η δουλειάς μου δεν με αφήνει ήσυχο"}],
  ["δουλειά"]
);
assert("Case variant ('δουλειάς') correctly matches base anchor ('δουλειά') via stemming", r.covered.includes("δουλειά"));

// 3c. HONEST, DOCUMENTED LIMITATION: derivational forms across word classes still not bridged
r = checkAnchorCoverage(
  [{role:"user", content:"αυτό με τρομάζει πολύ, φοβάμαι συνέχεια"}], // verb form "φοβάμαι"
  ["φόβος"] // noun form — different lexeme, same root
);
assert("Known, accepted limitation: 'φοβάμαι' (verb) does not match 'φόβος' (noun) — different lexeme, not a bug", r.uncovered.includes("φόβος"));

// 3d. False-positive check: stemming must not over-match unrelated words
r = checkAnchorCoverage(
  [{role:"user", content:"αυτό είναι πολύ φοβερό αποτέλεσμα"}], // "φοβερό" (amazing), unrelated meaning
  ["φόβος"]
);
assert("Stemming does not falsely match unrelated word sharing a prefix ('φοβερό' vs 'φόβος')", r.uncovered.includes("φόβος"));

// 4. Only counts messages AFTER anchors were given (not before)
r = checkAnchorCoverage(
  [{role:"assistant", content:"..."}], // no user messages after anchor point
  ["φόβος"]
);
assert("Empty message list after anchors -> everything uncovered", r.uncovered.includes("φόβος") && r.covered.length === 0);

// 5. Case-insensitivity
r = checkAnchorCoverage(
  [{role:"user", content:"ΕΞΑΡΤΗΣΗ είναι το πρόβλημα"}],
  ["εξάρτηση"]
);
assert("Case-insensitive matching works", r.covered.includes("εξάρτηση"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
