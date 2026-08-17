// Replicates the exact showDemo construction for isolated testing
function computeShowDemo(introChoice, isBrandNewUser) {
  return introChoice === "demo" || (introChoice === null && isBrandNewUser);
}

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

// The 4 real combinations that matter, given introChoice is now always "direct" or "demo"
// before sessionStarted becomes true (both buttons on the choice screen set it explicitly).
assert("new user + direct choice → no demo (original BUG 1 fix, still correct)",
  computeShowDemo("direct", true) === false);
assert("new user + demo choice → demo shows (unchanged, already worked)",
  computeShowDemo("demo", true) === true);
assert("returning user + direct choice → no demo (correct, they chose to skip)",
  computeShowDemo("direct", false) === false);
assert("returning user + demo choice → demo NOW shows (harder-stress-test fix — this was the broken asymmetric case)",
  computeShowDemo("demo", false) === true);

// Defensive fallback edge case — introChoice somehow never set (shouldn't happen given current
// flow, but the fallback should still behave sanely)
assert("introChoice unset + brand new → falls back to isBrandNewUser (true)",
  computeShowDemo(null, true) === true);
assert("introChoice unset + not new → falls back to isBrandNewUser (false)",
  computeShowDemo(null, false) === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
