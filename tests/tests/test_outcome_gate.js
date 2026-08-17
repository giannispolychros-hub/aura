const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('parseThreeBeatShift'));
eval(extract('detectsConcreteStep'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

// Simulates the exact gate logic added at the enforcement point
function simulateGate(concreteStepStated, outcomeScaleAsked, displayText) {
  if (concreteStepStated && !outcomeScaleAsked && parseThreeBeatShift(displayText) !== null) {
    return { intercepted: true, text: "Πριν προχωρήσουμε — πόσο πιστεύεις ότι θα σε ανακουφίσει αυτό, σε κλίμακα 1 έως 10;" };
  }
  return { intercepted: false, text: displayText };
}

const shiftText = "ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη";

// THE REAL-TRANSCRIPT SCENARIO: concrete step stated ("Θα το κάνω"), scale never asked,
// model proceeds straight to three-beat shift — must be intercepted.
assert("real scenario: concrete step + no scale + shift → intercepted",
  simulateGate(true, false, shiftText).intercepted === true);
assert("real scenario: intercepted text asks the scale question",
  simulateGate(true, false, shiftText).text.includes("ανακουφίσει"));
assert("detectsConcreteStep correctly flags 'Θα το κάνω' (the actual user message)",
  detectsConcreteStep("Θα το κάνω") === true);

// Must NOT intercept when scale was already asked
assert("scale already asked → no interception", simulateGate(true, true, shiftText).intercepted === false);
// Must NOT intercept when no concrete step was stated
assert("no concrete step → no interception", simulateGate(false, false, shiftText).intercepted === false);
// Must NOT intercept when there's no shift (plain closure, e.g. FACT/ANALYSIS)
assert("no shift present → no interception", simulateGate(true, false, "Απλή απάντηση χωρίς μετατόπιση.").intercepted === false);
// Normal case: shift with scale properly asked earlier → passes through unmodified
assert("normal pass-through preserves original text", simulateGate(true, true, shiftText).text === shiftText);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
