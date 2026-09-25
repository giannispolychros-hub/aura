// ── NO SUITE MAY BE SILENT, AND NO RUNNER MAY CARRY A HAND-WRITTEN LIST ─────
//
// WHAT WAS FOUND. On 2026-09-25 the repository held 61 .js files in this folder. The CI workflow
// ran 33 of them from a hand-written list. RUN_ALL.bat ran 58 from a different hand-written list,
// under a header that said "43 suites". The two lists disagreed with each other and both disagreed
// with the folder. The consequences were not theoretical:
//
//   · test_first_reply_floor        — a passing suite, run by NOTHING, in either list.
//   · test_backend_security         — run by NOTHING, and broken: it reads 'aura.js' from the
//                                     current directory while the file is at api/aura.js. A
//                                     SECURITY suite that had never once executed.
//   · test_scope_integrity          — in CI only, absent from RUN_ALL.bat.
//   · every suite written this week — absent from CI.
//
// AND CI SKIPPED SILENTLY. Its loop was `if [ -f "$f.js" ]`, so a name that does not exist is
// passed over without a word. A typo removed a suite from the run and reported success.
//
// WHY THIS SUITE EXISTS RATHER THAN A ONE-TIME CORRECTION. Re-syncing three lists by hand is the
// thing that already failed twice. The only durable fix is that a list cannot be written down: the
// runners must discover the folder, and something must fail when they stop doing so. That is this
// file. It does not check that the lists are correct — it checks that there are no lists.
//
// A SILENT SUITE IS WORSE THAN A FAILING ONE. A failure is information; silence is a suite you
// believe is protecting you while it protects nothing. Both runners must therefore treat "no
// result line" as an error in its own right, not as a pass.
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const ROOT = path.join(HERE, '..');

let passed = 0, failed = 0;
function assert(name, cond) { if (cond) { passed++; console.log("PASS — " + name); } else { failed++; console.log("FAIL — " + name); } }

const CI_PATH = path.join(ROOT, '.github', 'workflows', 'test.yml');
assert("the CI workflow exists where it is expected", fs.existsSync(CI_PATH));
const CI = fs.existsSync(CI_PATH) ? fs.readFileSync(CI_PATH, 'utf8') : '';
const BAT_PATH = path.join(HERE, 'RUN_ALL.bat');
assert("RUN_ALL.bat exists — it is the founder's own gate", fs.existsSync(BAT_PATH));
const BAT = fs.existsSync(BAT_PATH) ? fs.readFileSync(BAT_PATH, 'utf8') : '';

// ── 1. NEITHER RUNNER MAY NAME SUITES ─────────────────────────────────────
// The test is deliberately crude and hard to argue with: count how many suite names appear
// literally. A glob names none. Two or three is already a list.
const suiteFiles = fs.readdirSync(HERE)
  .filter(f => /^(test_|stress_test_).*\.js$/.test(f) && f !== 'test_runner_coverage.js')
  .map(f => f.replace(/\.js$/, ''));
assert("the folder holds the suites this repo is known to have", suiteFiles.length >= 58);
const namedIn = src => suiteFiles.filter(n => src.includes(n)).length;
assert("CI names no suites — it discovers them (" + namedIn(CI) + " named)", namedIn(CI) <= 1);
assert("RUN_ALL.bat names no suites — it discovers them (" + namedIn(BAT) + " named)", namedIn(BAT) <= 1);

// ── 2. BOTH RUNNERS ACTUALLY DISCOVER ─────────────────────────────────────
assert("CI iterates a glob over this folder",
  /test_\*\.js|test_\*|\*\.js/.test(CI));
assert("RUN_ALL.bat iterates a glob over this folder",
  /\(\s*test_\*\.js[^)]*\)/.test(BAT));
assert("both globs reach stress_test_ as well, which does not start with test_",
  /stress_test_\*/.test(CI) && /stress_test_\*/.test(BAT));

// ── 3. SILENCE IS AN ERROR, NOT A PASS ────────────────────────────────────
assert("CI no longer skips a missing suite without saying so",
  !/if\s+\[\s+-f\s+"\$f\.js"\s+\]/.test(CI));
assert("CI treats a suite that reports no result line as a failure",
  /passed/.test(CI) && /(SILENT|silent|no result|NO RESULT)/.test(CI));
assert("CI refuses to pass when the discovery finds implausibly few suites",
  /-lt\s+\d\d/.test(CI));
assert("RUN_ALL.bat says so when a suite reports nothing",
  /(NO RESULT|SILENT|δεν ανέφερε)/i.test(BAT));

// ── 4. NO STALE COUNT IN ANY HEADER ───────────────────────────────────────
// The .bat header read "43 suites" while running 58. A number written by hand is a number that
// will be wrong; the header must not claim one.
const staleCount = (BAT.match(/^echo\s+===.*?(\d+)\s*suites/mi) || [])[1];
assert("RUN_ALL.bat's header does not hard-code a suite count" + (staleCount ? " (found " + staleCount + ")" : ""),
  staleCount === undefined);

// ── 5. THE TWO SUITES THAT RAN NOWHERE MUST NOW RUN ───────────────────────
// Discovery makes this automatic, so what is asserted here is that they are runnable at all:
// test_backend_security could not be, because of a path it never satisfied.
const SEC = path.join(HERE, 'test_backend_security.js');
assert("test_backend_security exists", fs.existsSync(SEC));
const SEC_SRC = fs.existsSync(SEC) ? fs.readFileSync(SEC, 'utf8') : '';
assert("test_backend_security no longer reads 'aura.js' from whatever directory it is run in",
  !/readFileSync\(\s*['"]aura\.js['"]/.test(SEC_SRC));
assert("it resolves the backend relative to its own location instead",
  /__dirname/.test(SEC_SRC));
assert("test_first_reply_floor exists and is discoverable by the glob",
  fs.existsSync(path.join(HERE, 'test_first_reply_floor.js')));

// ── 6. NO PHANTOM SUITES ──────────────────────────────────────────────────
// test_scope_integrity was named in the CI list from the workflow's first commit and NEVER
// existed in this repository. `if [ -f "$f.js" ]` skipped it without a word, and an @babel
// install step ran on every CI run to satisfy a suite that was not there. Discovery makes a
// phantom impossible; this asserts none was left behind in prose either.
// Scanned over the EXECUTABLE workflow only: a `#` comment cannot run a suite, and the comment
// there names the phantom on purpose, so the next reader knows what the -f guard was hiding.
// Fifth slice in this repo whose scope decides its verdict, so the slice is asserted non-empty
// first - a scan over nothing would pass here for no reason at all.
const CI_RUNS = CI.split("\n").filter(l => !/^\s*#/.test(l)).join("\n");
assert("the executable part of the workflow is non-empty, so the scan below cannot be vacuous",
  CI_RUNS.length > 300 && /node /.test(CI_RUNS));
const phantom = (CI_RUNS.match(/\b(?:stress_)?test_[a-z0-9_]+/g) || [])
  .filter(n => !fs.existsSync(path.join(HERE, n + '.js')));
assert("CI runs no suite that does not exist" + (phantom.length ? " (found " + phantom.join(", ") + ")" : ""),
  phantom.length === 0);
assert("the @babel install step is gone with the phantom that needed it",
  !/npm install[^\n]*@babel/.test(CI_RUNS));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
