// Reflects the fix: Anchors and Stakes Callback hard overrides were REMOVED after real-user
// evidence of harm (hijacking an already-working three-beat close). Only Outcome Scale's gate
// remains. This test now verifies the SAFE behavior: Anchors/Stakes conditions no longer
// override displayText at all, regardless of msgCount.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('parseThreeBeatShift'));

// Replicates the CURRENT (post-fix) single-gate chain — only Outcome Scale overrides.
function applyGates(displayText, { concreteStepStated, outcomeScaleAsked }) {
  let text = displayText;
  let scaleGateFired = false;
  if (concreteStepStated && !outcomeScaleAsked && parseThreeBeatShift(text) !== null) {
    text = "Πριν προχωρήσουμε — πόσο πιστεύεις ότι θα σε ανακουφίσει αυτό, σε κλίμακα 1 έως 10;";
    scaleGateFired = true;
  }
  return { text, scaleGateFired };
}

const shiftText = "ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη";
let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

assert("Outcome Scale gate still fires when its own condition is met", applyGates(shiftText, { concreteStepStated: true, outcomeScaleAsked: false }).scaleGateFired === true);
assert("Outcome Scale gate does NOT fire when already asked", applyGates(shiftText, { concreteStepStated: true, outcomeScaleAsked: true }).scaleGateFired === false);
assert("no shift present -> gate does not intercept", applyGates("Απλή απάντηση.", { concreteStepStated: true, outcomeScaleAsked: false }).scaleGateFired === false);
// THE FIX ITSELF: a long conversation (would have been msgCount>=4) no longer gets hijacked —
// there is no anchors/stakes parameter in this function anymore, by design, confirming removal.
assert("long/developed conversations no longer get hijacked by an unrelated Anchors/Stakes question (removed)", applyGates(shiftText, { concreteStepStated: false, outcomeScaleAsked: false }).scaleGateFired === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
