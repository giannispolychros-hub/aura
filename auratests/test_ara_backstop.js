const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('stripAraDeclarative'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

// Real transcript examples collected today
assert("Real #1 (μπρος-γκρεμός session) strips cleanly, question remains",
  stripAraDeclarative('Άρα ούτε το να πας ούτε το να μείνεις σου δίνει ησυχία. Τι είναι αυτό που πραγματικά σε βαραίνει;')
  === 'Τι είναι αυτό που πραγματικά σε βαραίνει;');

assert("Real #2 (annual event session) strips cleanly, question remains",
  stripAraDeclarative('Άρα η απόφαση έχει ήδη παρθεί — απλά ψάχνεις πώς να την πεις. Τι θα ήταν αρκετά αληθινό ώστε να το πεις;')
  === 'Τι θα ήταν αρκετά αληθινό ώστε να το πεις;');

assert("Real #3 (lie-choice session) strips cleanly, question remains",
  stripAraDeclarative('Άρα το ζήτημα δεν είναι αν θα πεις ψέμα — είναι ποιο ψέμα σε βολεύει περισσότερο να ζεις μετά. Ποιο από τα δύο σου κάθεται καλύτερα;')
  === 'Ποιο από τα δύο σου κάθεται καλύτερα;');

// Legitimate uses that must NOT be touched
assert("Legitimate: 'Άρα, [question]?' with no period is untouched",
  stripAraDeclarative('Νιώθεις ότι κάτι άλλαξε; Άρα, τι θα ήθελες να κάνεις τώρα;')
  === 'Νιώθεις ότι κάτι άλλαξε; Άρα, τι θα ήθελες να κάνεις τώρα;');

assert("No 'Άρα' present at all — untouched",
  stripAraDeclarative('Τι σε κάνει να το σκέφτεσαι ακόμα;')
  === 'Τι σε κάνει να το σκέφτεσαι ακόμα;');

// Known, honest limitation - documented, not silently passing
assert("KNOWN LIMITATION (documented): embedded-quote variant with no period is NOT stripped",
  stripAraDeclarative('Άρα το ερώτημα δεν είναι "θα διασκεδάσω;" — είναι "τι σε βαραίνει;" Πόσο πιστεύεις ότι αυτό ισχύει;')
  .startsWith('Άρα')); // confirms the gap exists and is known, not silently "fixed" by accident

// Empty/null safety
assert("Empty string doesn't crash", stripAraDeclarative("") === "");
assert("Null doesn't crash", stripAraDeclarative(null) === "");

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
