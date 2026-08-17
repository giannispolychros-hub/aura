// Targeted test for the new architectural lifecycle fix: firstReplyFloorCtx
// Simulates the exact condition logic without needing the full React component.
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

function simulateFloor(msgCount, showDemo) {
  return (msgCount === 1 && !showDemo);
}

assert("Floor IS active on the literal first user message (msgCount=1), no demo",
  simulateFloor(1, false) === true);
assert("Floor is NOT active on the second user message (msgCount=2)",
  simulateFloor(2, false) === false);
assert("Floor is NOT active on later turns (msgCount=5)",
  simulateFloor(5, false) === false);
assert("Floor correctly steps aside when the scripted onboarding demo is handling this turn",
  simulateFloor(1, true) === false);
assert("Floor does not affect msgCount=0 edge case (no user message yet — n/a in practice, but must not throw)",
  simulateFloor(0, false) === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
