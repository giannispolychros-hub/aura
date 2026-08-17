// SECURITY REGRESSION TEST — resource exhaustion (confirmed bypass, now fixed)
function capMessageHistory(messages, maxChars = 20000, minKeep = 10) {
  if (!Array.isArray(messages)) return messages;
  const PER_MESSAGE_CAP = 4000;
  messages = messages.map(m =>
    (m.content || "").length > PER_MESSAGE_CAP ? { ...m, content: m.content.slice(0, PER_MESSAGE_CAP) } : m);
  if (messages.length <= minKeep) return messages;
  let totalChars = 0, cutIndex = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const len = (messages[i].content || "").length;
    if (totalChars + len > maxChars && (messages.length - i) > minKeep) { cutIndex = i + 1; break; }
    totalChars += len;
  }
  return messages.slice(cutIndex);
}
let passed = 0, failed = 0;
function assert(l, c) { if (c) { passed++; console.log("PASS —", l); } else { failed++; console.log("FAIL —", l); } }

// Η ΑΚΡΙΒΗΣ επίθεση: 10 τεράστια μηνύματα που παρέκαμπταν το cap μέσω minKeep
const flood = Array.from({length: 10}, () => ({ role: "user", content: "α".repeat(500000) }));
const capped = capMessageHistory(flood);
const totalSize = capped.reduce((s, m) => s + m.content.length, 0);
console.log("  Πριν:", 10 * 500000, "χαρακτήρες | Μετά:", totalSize);
assert("minKeep bypass ΕΚΛΕΙΣΕ (κάτω από το backend όριο 300KB)", totalSize < 300000);
assert("Όλα τα μηνύματα παραμένουν παρόντα (δεν χάνεται συνομιλία)", capped.length === 10);

// Κανονική συνομιλία δεν αλλοιώνεται
const normal = Array.from({length: 5}, (_, i) => ({ role: "user", content: "Κανονικό μήνυμα " + i }));
assert("Κανονική συνομιλία ΔΕΝ αλλοιώνεται",
  JSON.stringify(capMessageHistory(normal)) === JSON.stringify(normal));

// Ένα μεγάλο μήνυμα κόβεται αλλά δεν χάνεται
const oneBig = [{ role: "user", content: "β".repeat(50000) }];
assert("Μεμονωμένο τεράστιο μήνυμα κόβεται, δεν εξαφανίζεται",
  capMessageHistory(oneBig)[0].content.length === 4000);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
