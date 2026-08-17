const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
const s = raw.indexOf('function detectUserStagnation(');
eval(raw.slice(s, raw.indexOf('\n}', s) + 2));

let passed = 0, failed = 0;
function assert(l, c) { if (c) { passed++; console.log("PASS —", l); } else { failed++; console.log("FAIL —", l); } }

assert("Χρήστης που ΚΙΝΕΙΤΑΙ (νέο συγκεκριμένο υλικό) δεν σημαίνεται", !detectUserStagnation([
  {role:"user",content:"Δεν ξέρω αν να φύγω από τη δουλειά"},
  {role:"user",content:"Ο μισθός είναι καλός αλλά ο διευθυντής με υπονομεύει"},
  {role:"user",content:"Χθες μπροστά σε όλους είπε ότι η πρόταση μου ήταν ανώριμη"},
  {role:"user",content:"Νιώθω ότι χάνω την αξιοπρέπεια μου κάθε μέρα"},
]).stagnant);

assert("Χρήστης ΚΟΛΛΗΜΕΝΟΣ (ίδιες λέξεις, πιο σύντομα) σημαίνεται", detectUserStagnation([
  {role:"user",content:"Δεν ξέρω τι να κάνω με αυτή την κατάσταση πραγματικά"},
  {role:"user",content:"Είναι δύσκολο δεν ξέρω τι να κάνω"},
  {role:"user",content:"Δεν ξέρω"},
  {role:"user",content:"Δεν ξέρω πραγματικά"},
]).stagnant);

assert("ΚΡΙΣΙΜΟ: σύντομη ΑΛΛΑ ουσιαστική απάντηση ΔΕΝ σημαίνεται λάθος", !detectUserStagnation([
  {role:"user",content:"Σκέφτομαι πολύ αυτό το θέμα με τη δουλειά και τι θα γίνει"},
  {role:"user",content:"Ο διευθυντής μου δημιουργεί συνεχώς προβλήματα στην ομάδα"},
  {role:"user",content:"Ναι, φοβάμαι την ανασφάλεια"},
  {role:"user",content:"Η αλήθεια είναι ότι θέλω να παραιτηθώ αμέσως"},
]).stagnant);

assert("Πολύ νωρίς (<3 μηνύματα) δεν σημαίνεται ποτέ", !detectUserStagnation([
  {role:"user",content:"Ναι"},{role:"user",content:"Ok"},
]).stagnant);

assert("Κενός πίνακας δεν κρασάρει", !detectUserStagnation([]).stagnant);
assert("null δεν κρασάρει", !detectUserStagnation(null).stagnant);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
