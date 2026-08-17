function stripAraDeclarative(text) {
  return (text || "")
    .replace(/\s*Άρα[^.]*\.\s*/gi, " ")
    .replace(/\s*\bSo,?\s+(the\s+)?(real\s+)?(question|issue|problem)[^.]*\.\s*/gi, " ")
    .trim();
}

let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log("PASS —", label); } else { failed++; console.log("FAIL —", label); } }

assert("Greek ΑΡΑ still works",
  stripAraDeclarative('Άρα η απόφαση έχει ήδη παρθεί. Τι θα ήταν αρκετά αληθινό;') === 'Τι θα ήταν αρκετά αληθινό;');

assert("English equivalent now caught",
  stripAraDeclarative("So, the real issue isn't whether to go. What would make this easier to say?")
  === "What would make this easier to say?");

assert("Legitimate English 'So' question untouched",
  stripAraDeclarative("Do you feel something changed? So, what would you keep?")
  === "Do you feel something changed? So, what would you keep?");

console.log("\n" + passed + " passed, " + failed + " failed");
