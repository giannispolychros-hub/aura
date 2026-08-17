const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
const startIdx = raw.indexOf('function parseThreeBeatShift');
const endIdx = raw.indexOf('\n}', startIdx) + 2;
eval(raw.slice(startIdx, endIdx));

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

let r = parseThreeBeatShift("ΗΡΘΕΣ ΜΕ: ένα ερώτημα μάρκετινγκ\nΒΡΗΚΕΣ: ότι το πραγματικό εμπόδιο ήταν το τιμολόγιο\nΦΕΥΓΕΙΣ ΜΕ: μια δομή τιμολόγησης που βγήκε από τις αντιφάσεις σου");
assert("Parses well-formed 3-beat text", r !== null);
assert("Extracts 'brought' correctly", r && r.brought === "ένα ερώτημα μάρκετινγκ");
assert("Extracts 'found' correctly", r && r.found === "ότι το πραγματικό εμπόδιο ήταν το τιμολόγιο");
assert("Extracts 'changed' correctly", r && r.changed === "μια δομή τιμολόγησης που βγήκε από τις αντιφάσεις σου");

r = parseThreeBeatShift("Η σκέψη σου παρέμεινε ξεκάθαρη σε όλη τη συζήτηση, χωρίς να χρειαστεί να αλλάξει.");
assert("Returns null for plain-prose (no shift) case", r === null);

r = parseThreeBeatShift("");
assert("Returns null for empty string", r === null);

r = parseThreeBeatShift(null);
assert("Returns null for null input, no crash", r === null);

r = parseThreeBeatShift("ΗΡΘΕΣ ΜΕ: κάτι\nΒΡΗΚΕΣ: \nΦΕΥΓΕΙΣ ΜΕ: κάτι άλλο");
assert("Returns null if a beat is empty (malformed)", r === null);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
