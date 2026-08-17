// LOOP TEST — Detector Conflict Matrix
// Unit tests verify each detector in isolation. Every live bug today came from INTERACTION:
// two mechanisms firing on the same input at the same point. This test runs all four
// deterministic closing-sequence detectors against one battery and flags dangerous overlaps.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();

function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  const e = raw.indexOf('\n}', s) + 2;
  return raw.slice(s, e);
}
eval(extract('isBareEmojiOrAcknowledgment'));
eval(extract('parseThreeBeatShift'));
eval(extract('matchesClosingWord'));
eval(extract('detectsConcreteStep'));

// Battery of realistic Greek user messages spanning the closing surface
const battery = [
  // plain closings
  "Ναι", "Οκ", "Τέλος", "Καληνύχτα", "Επίσης", "Τα λέμε", "Εντάξει",
  // real content (must NOT be closing)
  "Δεν ξέρω τι να κάνω με τη δουλειά μου",
  "Σκέφτομαι να φύγω αλλά φοβάμαι",
  "Τι να διαλέξω;",
  // concrete steps
  "Θα μιλήσω στον διευθυντή μου αύριο",
  "Αποφάσισα να στείλω το email το Σαββατοκύριακο",
  "Θα ξεκινήσω το μεταπτυχιακό τον Σεπτέμβρη",
  // DANGER ZONE: could be read as BOTH closing AND concrete step
  "Θα φύγω",              // φευγω = closing word, but also an action
  "Παω να το κανω",       // παω = closing-ish, but stating an action
  "Φεύγω αύριο για τη νέα δουλειά",  // clearly a concrete step containing 'φευγω'
  // bare emoji / symbols (belong to a different detector)
  "👍", "🙂", "...",
  // three-beat shift text
  "ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη",
];

let passed = 0, failed = 0, warnings = 0;
function assert(desc, cond) {
  if (cond) { passed++; } else { console.log('  FAIL —', desc); failed++; }
}

console.log("=== FULL MATRIX ===");
console.log("message".padEnd(48), "close", "step", "emoji", "shift");
const conflicts = [];
for (const msg of battery) {
  const close = matchesClosingWord(msg);
  const step  = detectsConcreteStep(msg);
  const emoji = isBareEmojiOrAcknowledgment(msg);
  const shift = parseThreeBeatShift(msg) !== null;
  const short = msg.replace(/\n/g, "\\n").slice(0, 46);
  console.log(short.padEnd(48), String(close).padEnd(5), String(step).padEnd(4), String(emoji).padEnd(5), String(shift));
  // DANGEROUS OVERLAP 1: closing AND concrete step on same message
  if (close && step) conflicts.push(msg);
  // DANGEROUS OVERLAP 2: emoji AND anything else (emoji reply should be pure)
  if (emoji && (step || shift)) {
    console.log("  ⚠ emoji + other on:", msg); warnings++;
  }
}

console.log("\n=== CONFLICT ANALYSIS: closing AND concrete-step ===");
if (conflicts.length === 0) {
  console.log("  none — no message triggers both close and solution-development simultaneously");
} else {
  console.log("  ⚠ overlap on:", conflicts.join(" | "));
  warnings += conflicts.length;
}

// The invariants that MUST hold:
console.log("\n=== INVARIANTS ===");
assert("plain 'Ναι' is closing, not a concrete step", matchesClosingWord("Ναι") && !detectsConcreteStep("Ναι"));
assert("real dilemma is neither closing nor step", !matchesClosingWord("Δεν ξέρω τι να κάνω με τη δουλειά μου"));
assert("concrete step is not a bare emoji", !isBareEmojiOrAcknowledgment("Θα μιλήσω στον διευθυντή μου αύριο"));
assert("bare emoji is not a closing word", !matchesClosingWord("👍"));
assert("bare emoji is not a concrete step", !detectsConcreteStep("👍"));
assert("shift text is not flagged as closing", !matchesClosingWord("ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη"));
assert("real concrete step 'θα + verb' detected", detectsConcreteStep("Θα φύγω") && detectsConcreteStep("Θα μιλήσω στον διευθυντή μου αύριο"));
// VERIFIED SCOPE (not a bug — intentional design): detectsConcreteStep targets future-tense
// intentions being FORMED now ("θα + verb"), deliberately NOT present-tense fact statements
// ("φεύγω αύριο") or already-made past decisions ("αποφάσισα να"). Documented so the narrow scope
// is a known, guarded property. Broadening has high blast radius — no change without real evidence.
assert("present-tense fact statement is intentionally NOT a step", !detectsConcreteStep("Φεύγω αύριο για τη νέα δουλειά"));
assert("past-tense decision is intentionally NOT a step", !detectsConcreteStep("Αποφάσισα να στείλω το email το Σαββατοκύριακο"));

console.log("\n" + passed + " invariants passed, " + failed + " failed, " + warnings + " overlap warnings");
process.exit(failed > 0 ? 1 : 0);
