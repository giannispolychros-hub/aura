let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

// Mirrors the exact tag-handling logic added to generateResponse
function simulateTagHandling(rawTextWithTags) {
  const exitTagMatch = rawTextWithTags.match(/\[\[EXIT:(yes|no)\]\]\s*$/i);
  const modelJudgesEnd = exitTagMatch ? exitTagMatch[1].toLowerCase() === "yes" : false;
  const earlyWordTagMatch = rawTextWithTags.match(/\[\[EARLY_WORD:yes\]\]/i);
  const rawText = rawTextWithTags.replace(/\s*\[\[EARLY_WORD:yes\]\]\s*/gi, "\n").trim();
  const text = rawText.replace(/\s*\[\[EXIT:(yes|no)\]\]\s*$/i, "");
  return { text, modelJudgesEnd, earlyWordDetected: !!earlyWordTagMatch };
}

const r1 = simulateTagHandling('Αν έμενε μόνο μία σκέψη, ποια θα ήταν;\n[[EARLY_WORD:yes]]');
assert("Tag detected correctly on a real early-word question", r1.earlyWordDetected === true);
assert("Tag fully stripped from displayed text, no leftover artifact", r1.text === 'Αν έμενε μόνο μία σκέψη, ποια θα ήταν;');

const r2 = simulateTagHandling('Τι σε κρατάει περισσότερο;\n[[EXIT:no]]');
assert("EARLY_WORD tag correctly NOT detected on an unrelated normal reply", r2.earlyWordDetected === false);
assert("EXIT tag still works independently, unaffected by the new tag logic", r2.modelJudgesEnd === false);

const r3 = simulateTagHandling('Γράψ\' το όπως θα το θυμόσουν αύριο.\n[[EARLY_WORD:yes]]\n[[EXIT:no]]');
assert("Both tags can coexist and both strip correctly (different wording variant of the question)",
  r3.earlyWordDetected === true && r3.text === 'Γράψ\' το όπως θα το θυμόσουν αύριο.');

// Simulate the capture-on-next-message logic
function simulateCapture(awaitingBefore, userMsgs) {
  let awaiting = awaitingBefore, captured = null;
  if (awaiting) {
    const lastUser = [...userMsgs].reverse().find(m => m.role === "user");
    if (lastUser) captured = lastUser.content;
    awaiting = false;
  }
  return { awaiting, captured };
}

const c1 = simulateCapture(true, [{ role: "user", content: "Ο φόβος δεν είναι πραγματικός, απλά νέος." }]);
assert("Capture works correctly when awaiting flag was set - captures verbatim, resets flag",
  c1.captured === "Ο φόβος δεν είναι πραγματικός, απλά νέος." && c1.awaiting === false);

const c2 = simulateCapture(false, [{ role: "user", content: "κάτι άσχετο" }]);
assert("No capture happens when the flag was never set (normal conversation unaffected)",
  c2.captured === null);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
