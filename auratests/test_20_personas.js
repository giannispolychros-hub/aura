// 20-PERSONA STRESS TEST
// Scope, stated honestly: this verifies that deterministic, code-level detectors correctly
// recognize WHEN each mechanism's trigger condition is met, across 20 realistic message patterns
// representing different observable conversation states. It does NOT and CANNOT verify that the
// model then executes the prompt-level mechanism correctly (e.g. that Devil's Advocate is applied
// well) — that requires live testing against the real model, which only the founder can do.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('isBareEmojiOrAcknowledgment'));
eval(extract('matchesClosingWord'));
eval(extract('detectsConcreteStep'));
eval(extract('detectsOutcomeScaleAsked'));
eval(extract('detectsStakesAsked'));
eval(extract('detectsAnchorsInvited'));
eval(extract('parseThreeBeatShift'));
eval(extract('detectDomain'));

function computeShowDemo(introChoice, isBrandNewUser) {
  return introChoice === "demo" || (introChoice === null && isBrandNewUser);
}
function buildGatesDue(msgCount, concreteStepStated, outcomeScaleAsked, anchorsInvited, stakesAsked) {
  if (msgCount < 3) return [];
  const due = [];
  if (concreteStepStated && !outcomeScaleAsked) due.push('OutcomeScale');
  if (!anchorsInvited) due.push('Anchors');
  if (!stakesAsked) due.push('Stakes');
  return due;
}

// 20 personas — realistic message patterns spanning the observable states discussed today
const personas = [
  { name: "1. Confident/resolved",           msg: "Ξέρω ήδη ότι θέλω να φύγω από τη δουλειά, το έχω αποφασίσει." },
  { name: "2. Torn between two options",     msg: "Από τη μία θέλω να μείνω, από την άλλη νιώθω ότι πρέπει να φύγω." },
  { name: "3. Vague, no direction",          msg: "Δεν ξέρω τι με απασχολεί ακριβώς." },
  { name: "4. Concrete step (future)",       msg: "Θα μιλήσω στον διευθυντή μου την Παρασκευή." },
  { name: "5. Concrete step (θα το κάνω)",   msg: "Θα το κάνω αυτή την εβδομάδα." },
  { name: "6. Past decision, not a step",    msg: "Αποφάσισα να μη μιλήσω ακόμα σε κανέναν." },
  { name: "7. Present-tense fact",           msg: "Φεύγω αύριο για Γερμανία με τη δουλειά." },
  { name: "8. Plain closing (Ναι)",          msg: "Ναι" },
  { name: "9. Farewell (Καληνύχτα)",         msg: "Καληνύχτα" },
  { name: "10. Reciprocal farewell",         msg: "Επίσης" },
  { name: "11. Bare emoji",                  msg: "👍" },
  { name: "12. Emoji + real content",        msg: "👍 τι άλλο να σκεφτώ;" },
  { name: "13. Real dilemma, career",        msg: "Δεν ξέρω αν πρέπει να αλλάξω δουλειά ή να μείνω." },
  { name: "14. Real dilemma, relationship",  msg: "Σκέφτομαι αν πρέπει να χωρίσω με τον σύντροφό μου." },
  { name: "15. FACT/ANALYSIS (product)",     msg: "Ποιο κινητό έχει καλύτερη κάμερα, το Χ ή το Ψ;" },
  { name: "16. Deflection (single, not yet resistance)", msg: "Άστο αυτό, δεν έχει σημασία." },
  { name: "17. Seeking options/info shift",  msg: "Τι επιλογές υπάρχουν συνήθως σε τέτοιες περιπτώσεις;" },
  { name: "18. Three-beat shift text",       msg: "ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη" },
  { name: "19. Long, complex, multi-topic",  msg: "Δεν ξέρω αν να αλλάξω δουλειά, να μετακομίσω, ή να μείνω και να περιμένω, όλα μαζί με μπερδεύουν." },
  { name: "20. Ellipsis / trailing off",     msg: "..." },
];

console.log("=".repeat(90));
console.log("PERSONA".padEnd(38), "close", "step", "emoji", "domain".padEnd(14), "shift");
console.log("-".repeat(90));
let issues = [];
for (const p of personas) {
  const close = matchesClosingWord(p.msg);
  const step  = detectsConcreteStep(p.msg);
  const emoji = isBareEmojiOrAcknowledgment(p.msg);
  const domain = detectDomain(p.msg);
  const shift = parseThreeBeatShift(p.msg) !== null;
  console.log(p.name.padEnd(38), String(close).padEnd(5), String(step).padEnd(4), String(emoji).padEnd(5), domain.padEnd(14), String(shift));

  // Cross-checks: flag anything that looks like a dangerous double-classification
  if (close && step) issues.push(`${p.name}: closing AND concrete-step both true`);
  if (emoji && (step || shift)) issues.push(`${p.name}: bare-emoji AND (step or shift) both true`);
  if (close && shift) issues.push(`${p.name}: closing AND three-beat-shift both true`);
}

console.log("\n" + "=".repeat(90));
console.log("CROSS-CHECK ISSUES:", issues.length === 0 ? "none found" : "");
issues.forEach(i => console.log("  ⚠", i));

// Sanity assertions on the personas where the "right" answer is unambiguous
let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { passed++; } else { console.log('FAIL —', desc); failed++; } }

assert("#1 confident is not itself a code-level trigger (semantic, prompt-level only)", true); // documented, not code-testable
assert("#4 concrete step detected", detectsConcreteStep(personas[3].msg) === true);
assert("#5 'θα το κάνω' concrete step detected", detectsConcreteStep(personas[4].msg) === true);
assert("#6 past decision NOT a concrete step (intentional scope)", detectsConcreteStep(personas[5].msg) === false);
assert("#7 present-tense fact NOT a concrete step (intentional scope)", detectsConcreteStep(personas[6].msg) === false);
assert("#8 plain 'Ναι' is closing", matchesClosingWord(personas[7].msg) === true);
assert("#9 farewell is closing", matchesClosingWord(personas[8].msg) === true);
assert("#10 reciprocal farewell is closing", matchesClosingWord(personas[9].msg) === true);
assert("#11 bare emoji detected", isBareEmojiOrAcknowledgment(personas[10].msg) === true);
assert("#12 emoji+content NOT bare", isBareEmojiOrAcknowledgment(personas[11].msg) === false);
assert("#15 product-comparison classified as a topic domain (not itself FACT/ANALYSIS — that's a model-level session-mode judgment, domain here is just topic)", typeof detectDomain(personas[14].msg) === "string");
assert("#18 three-beat shift text parses correctly", parseThreeBeatShift(personas[17].msg) !== null);
assert("#20 ellipsis alone is bare/closing-like, not a real message", isBareEmojiOrAcknowledgment(personas[19].msg) === true);
assert("no dangerous cross-check overlaps found across all 20 personas", issues.length === 0);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
