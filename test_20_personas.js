// 20-PERSONA STRESS TEST
const fs = require('fs');
const raw = fs.readFileSync(__dirname + '/src/App.jsx', 'utf8');
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('isBareEmojiOrAcknowledgment'));
eval(extract('matchesClosingWord'));
eval(extract('detectsConcreteStep'));
eval(extract('parseThreeBeatShift'));
eval(extract('detectDomain'));

const personas = [
  { name: "1. Confident/resolved", msg: "Ξέρω ήδη ότι θέλω να φύγω από τη δουλειά, το έχω αποφασίσει." },
  { name: "2. Torn between two options", msg: "Από τη μία θέλω να μείνω, από την άλλη νιώθω ότι πρέπει να φύγω." },
  { name: "3. Vague, no direction", msg: "Δεν ξέρω τι με απασχολεί ακριβώς." },
  { name: "4. Concrete step (future)", msg: "Θα μιλήσω στον διευθυντή μου την Παρασκευή." },
  { name: "5. Concrete step (θα το κάνω)", msg: "Θα το κάνω αυτή την εβδομάδα." },
  { name: "6. Past decision, not a step", msg: "Αποφάσισα να μη μιλήσω ακόμα σε κανέναν." },
  { name: "7. Present-tense fact", msg: "Φεύγω αύριο για Γερμανία με τη δουλειά." },
  { name: "8. Plain closing (Ναι)", msg: "Ναι" },
  { name: "9. Farewell (Καληνύχτα)", msg: "Καληνύχτα" },
  { name: "10. Reciprocal farewell", msg: "Επίσης" },
  { name: "11. Bare emoji", msg: "👍" },
  { name: "12. Emoji + real content", msg: "👍 τι άλλο να σκεφτώ;" },
  { name: "13. Real dilemma, career", msg: "Δεν ξέρω αν πρέπει να αλλάξω δουλειά ή να μείνω." },
  { name: "14. Real dilemma, relationship", msg: "Σκέφτομαι αν πρέπει να χωρίσω με τον σύντροφό μου." },
  { name: "15. FACT/ANALYSIS (product)", msg: "Ποιο κινητό έχει καλύτερη κάμερα, το Χ ή το Ψ;" },
  { name: "16. Deflection (single, not yet resistance)", msg: "Άστο αυτό, δεν έχει σημασία." },
  { name: "17. Seeking options/info shift", msg: "Τι επιλογές υπάρχουν συνήθως σε τέτοιες περιπτώσεις;" },
  { name: "18. Three-beat shift text", msg: "ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη" },
  { name: "19. Long, complex, multi-topic", msg: "Δεν ξέρω αν να αλλάξω δουλειά, να μετακομίσω, ή να μείνω και να περιμένω, όλα μαζί με μπερδεύουν." },
  { name: "20. Ellipsis / trailing off", msg: "..." },
];

console.log("PERSONA".padEnd(38), "close", "step", "emoji", "domain".padEnd(14), "shift");
let issues = [];
for (const p of personas) {
  const close = matchesClosingWord(p.msg);
  const step  = detectsConcreteStep(p.msg);
  const emoji = isBareEmojiOrAcknowledgment(p.msg);
  const domain = detectDomain(p.msg);
  const shift = parseThreeBeatShift(p.msg) !== null;
  console.log(p.name.padEnd(38), String(close).padEnd(5), String(step).padEnd(4), String(emoji).padEnd(5), domain.padEnd(14), String(shift));
  if (close && step) issues.push(p.name + ": closing AND step");
  if (emoji && (step || shift)) issues.push(p.name + ": emoji AND (step or shift)");
}
console.log("\nISSUES:", issues.length === 0 ? "none found" : issues.join(" | "));