function detectAssistantSelfRepetition(messages) {
  const assistantMsgs = messages.filter(m => m.role === "assistant");
  if (assistantMsgs.length < 2) return { repeated: false };
  const last = assistantMsgs[assistantMsgs.length - 1]?.content || "";
  const prev = assistantMsgs[assistantMsgs.length - 2]?.content || "";
  const words = s => new Set(s.toLowerCase().match(/[a-zα-ωάέήίόύώϊϋΐΰ]{5,}/g) || []);
  const a = words(last), b = words(prev);
  const shared = [...a].filter(w => b.has(w));
  const lexicalSim = shared.length / Math.max(a.size, b.size, 1);
  const uniqueToLast = [...a].filter(w => !b.has(w)).length;
  const uniqueToPrev = [...b].filter(w => !a.has(w)).length;
  const hasSubstantialNewContent = uniqueToLast >= 2 && uniqueToPrev >= 2;
  const openingWords = s => (s.trim().toLowerCase().match(/^([a-zα-ωάέήίόύώϊϋΐΰ]+\s+){2}[a-zα-ωάέήίόύώϊϋΐΰ]+/) || [""])[0];
  const sameOpening = openingWords(last) && openingWords(last) === openingWords(prev);
  if ((lexicalSim > 0.55 || sameOpening) && !hasSubstantialNewContent) {
    return { repeated: true, lexicalSim, sameOpening };
  }
  return { repeated: false };
}

let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log("PASS —", label); } else { failed++; console.log("FAIL —", label); } }

const msgsFalsePositive = [
  { role: "assistant", content: "Είπες ότι το ένα φέρνει τύψεις και το άλλο βαρεμάρα. Ανάμεσα στα δύο, ποιο θα επέλεγες να αντέξεις;" },
  { role: "assistant", content: "Είπες ότι το ένα φέρνει άγχος και το άλλο μοναξιά. Ανάμεσα στα δύο, ποιο θα επέλεγες να αντέξεις;" },
];
assert("Bug fix: legitimate different VERBATIM COST COLLISION no longer false-positives",
  detectAssistantSelfRepetition(msgsFalsePositive).repeated === false);

const msgsGenuine = [
  { role: "assistant", content: "Τι σε κάνει να νιώθεις έτσι σήμερα;" },
  { role: "assistant", content: "Τι σε κάνει να νιώθεις έτσι τώρα;" },
];
assert("Genuine same-shape repetition still caught",
  detectAssistantSelfRepetition(msgsGenuine).repeated === true);

const msgsDifferent = [
  { role: "assistant", content: "Τι σε κάνει να το σκέφτεσαι ακόμα;" },
  { role: "assistant", content: "Αν τίποτα δεν άλλαζε για πέντε χρόνια, τι θα πονούσε περισσότερο;" },
];
assert("Genuinely different angle not flagged",
  detectAssistantSelfRepetition(msgsDifferent).repeated === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
