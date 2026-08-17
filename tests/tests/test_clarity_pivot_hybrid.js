let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

// Simulates the exact logic now in App.jsx for offerGate/offerPivot + the hint injection
function simulateHybrid(mode, turn, lastChallengeAt, patternType, confidence) {
  let clarityPivotHint = null, layerGateShown = false, pivotCardShown = false;

  const offerGate = mode === "ANSWER" && turn >= 4 &&
    (patternType === "REPETITION" || patternType === "AVOIDANCE") &&
    confidence > 0.6 && (turn - lastChallengeAt) >= 4;
  if (offerGate) {
    clarityPivotHint = patternType === "REPETITION" ? "LOOP" : "AVOIDANCE";
  }

  const offerPivot = mode === "AUDIT" && turn >= 4 &&
    (turn - lastChallengeAt) >= 3 &&
    (patternType === "REPETITION" || patternType === "AVOIDANCE" || patternType === "DECISION_PRESENT") &&
    confidence > 0.75;

  if (offerPivot && patternType === "DECISION_PRESENT") {
    pivotCardShown = true;
  } else if (offerPivot) {
    clarityPivotHint = patternType === "REPETITION" ? "LOOP" : "AVOIDANCE";
  }

  // Context injection (one-shot)
  const clarityPivotCtx = clarityPivotHint ? `[CODE-VERIFIED: ${clarityPivotHint}]` : "";

  return { layerGateShown, pivotCardShown, clarityPivotHint, clarityPivotCtx, modelWasCalled: !pivotCardShown };
}

// === Layer Gate scenarios (mode=ANSWER) ===
console.log("\n=== Layer Gate (mode=ANSWER) ===");
const r1 = simulateHybrid("ANSWER", 5, 0, "REPETITION", 0.7);
assert("REPETITION -> hint is LOOP, no hardcoded card, model IS called", r1.clarityPivotHint === "LOOP" && !r1.layerGateShown && r1.modelWasCalled);

const r2 = simulateHybrid("ANSWER", 5, 0, "AVOIDANCE", 0.7);
assert("AVOIDANCE -> hint is AVOIDANCE, no hardcoded card, model IS called", r2.clarityPivotHint === "AVOIDANCE" && !r2.layerGateShown && r2.modelWasCalled);

const r3 = simulateHybrid("ANSWER", 5, 0, "REPETITION", 0.5);
assert("Below confidence threshold -> no hint, no card (correctly inactive)", r3.clarityPivotHint === null && !r3.layerGateShown);

// === Pivot scenarios (mode=AUDIT) ===
console.log("\n=== Pivot (mode=AUDIT) ===");
const r4 = simulateHybrid("AUDIT", 5, 0, "REPETITION", 0.8);
assert("Pivot REPETITION -> hybrid hint, model IS called (not the old generic card)", r4.clarityPivotHint === "LOOP" && !r4.pivotCardShown && r4.modelWasCalled);

const r5 = simulateHybrid("AUDIT", 5, 0, "AVOIDANCE", 0.8);
assert("Pivot AVOIDANCE -> hybrid hint, model IS called", r5.clarityPivotHint === "AVOIDANCE" && !r5.pivotCardShown && r5.modelWasCalled);

const r6 = simulateHybrid("AUDIT", 5, 0, "DECISION_PRESENT", 0.8);
assert("Pivot DECISION_PRESENT -> KEEPS the original generic card (safest fallback, no CLARITY PIVOT mapping exists)", r6.pivotCardShown === true && r6.clarityPivotHint === null && !r6.modelWasCalled);

// === Context string check ===
console.log("\n=== Context injection content ===");
assert("Hint context string correctly names the case", r1.clarityPivotCtx.includes("LOOP"));
assert("No hint -> empty context string, nothing extra injected", r3.clarityPivotCtx === "");

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
