const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsOutcomeScaleAsked'));
eval(extract('detectsStakesAsked'));
eval(extract('detectsAnchorsInvited'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

// Replicates the exact gatesCtx construction logic for isolated testing
function buildGatesCtx(msgCount, concreteStepStated, outcomeScaleAsked, anchorsInvited, stakesAsked) {
  if (msgCount < 3) return '';
  const due = [];
  if (concreteStepStated && !outcomeScaleAsked) due.push('Outcome Expectation Scale');
  if (!anchorsInvited) due.push('Decision Space Anchors');
  if (!stakesAsked) due.push('Stakes Question');
  if (due.length === 0) return '';
  return `[GATES DUE CHECK: ${due.join(' | ')}]`;
}

// Real-transcript scenario: 'Θα το κάνω' stated, scale never asked, enough exchanges passed
assert("real scenario: concrete step stated, scale unasked, 5 exchanges → gate reminder fires",
  buildGatesCtx(5, true, false, true, true).includes("Outcome Expectation Scale"));

// Too early — matches existing 2-4 exchange timing used elsewhere
assert("msgCount < 3 → no reminder even if gates are due",
  buildGatesCtx(2, true, false, false, false) === '');

// All gates already satisfied → no reminder (the common, healthy case)
assert("all gates already asked → empty (no noise added every turn)",
  buildGatesCtx(10, true, true, true, true) === '');

// No concrete step stated → Outcome Scale not due (correctly scoped, only due when applicable)
assert("no concrete step → Outcome Scale not listed as due",
  !buildGatesCtx(5, false, false, true, true).includes("Outcome Expectation Scale"));

// Multiple gates due simultaneously — all listed
const multi = buildGatesCtx(5, true, false, false, false);
assert("multiple due gates all listed together", multi.includes("Outcome Expectation Scale") && multi.includes("Decision Space Anchors") && multi.includes("Stakes Question"));

// Detector sanity — each recognizes its own exact/paraphrased mandated wording
assert("detectsOutcomeScaleAsked recognizes exact wording (updated to clarity-based phrasing)", detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10;"));
assert("detectsStakesAsked recognizes exact wording", detectsStakesAsked("Αν αυτή η απόφαση μείνει θολή για άλλον έναν χρόνο, τι πιστεύεις ότι θα σου κοστίσει περισσότερο;"));
assert("detectsAnchorsInvited recognizes exact wording", detectsAnchorsInvited("Ποιες λέξεις ή σύντομες φράσεις νιώθεις ότι είναι στο κέντρο αυτού του προβλήματος;"));
assert("detectors don't false-positive on unrelated text", !detectsOutcomeScaleAsked("Τι σκέφτεσαι τώρα;") && !detectsStakesAsked("Τι σε φέρνει εδώ;") && !detectsAnchorsInvited("Πες μου περισσότερα."));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
