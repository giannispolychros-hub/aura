const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('stripAraDeclarative'));
eval(extract('parseRoadMap'));

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

// ── MULTI-LINE CONTAINMENT (live-analysis bug, reproduced executably) ──
// The removal pattern used [^.]* , which in JS matches newlines as well. So a single "Άρα"
// anywhere in a reply deleted everything up to the NEXT period, however many lines below that
// period happened to be. The worst observed case: a complete, valid ΔΡΟΜΟΣ/ΚΕΡΔΙΖΕΙΣ/ΚΟΣΤΙΖΕΙ
// road map opening with "Άρα," and ending with a period was reduced to the empty string — and
// since isBareEmojiOrAcknowledgment("") is true, the user then saw "Τι σκέφτεσαι τώρα;" where
// their map should have been. Exactly the reported "AURA asks instead of showing the map".
// These tests pin the containment rule: the removal never leaves the line it started on.

const MAP_ARA_INSIDE =
  'Αυτοί είναι οι δρόμοι που βλέπω από όσα είπες:\n' +
  'ΔΡΟΜΟΣ: Μένω στη δουλειά\nΚΕΡΔΙΖΕΙΣ: σταθερό εισόδημα\nΚΟΣΤΙΖΕΙ: Άρα χάνεις τον χρόνο σου κάθε μέρα.\n' +
  'ΔΡΟΜΟΣ: Φεύγω τώρα\nΚΕΡΔΙΖΕΙΣ: χρόνο\nΚΟΣΤΙΖΕΙ: την ασφάλεια';

const MAP_ARA_LEADING =
  'Άρα, αυτοί είναι οι δρόμοι:\n' +
  'ΔΡΟΜΟΣ: Μένω\nΚΕΡΔΙΖΕΙΣ: σταθερότητα\nΚΟΣΤΙΖΕΙ: χρόνο\n' +
  'ΔΡΟΜΟΣ: Φεύγω\nΚΕΡΔΙΖΕΙΣ: χρόνο\nΚΟΣΤΙΖΕΙ: ασφάλεια.';

assert("Sanity: both fixtures really do contain a 2-road map before stripping",
  parseRoadMap(MAP_ARA_INSIDE) !== null && parseRoadMap(MAP_ARA_INSIDE).roads.length === 2 &&
  parseRoadMap(MAP_ARA_LEADING) !== null && parseRoadMap(MAP_ARA_LEADING).roads.length === 2);

// HONEST SCOPE (corrected after running the fix): when a road's ΚΟΣΤΙΖΕΙ text is ITSELF an
// "Άρα …" declarative, removing that sentence empties the field, and parseRoadMap requires a
// non-empty value — so that one road drops out. That is the strip doing its job on content that
// happened to be a map field, not the newline bug. Making the strip skip map regions is a
// different, larger change (it would have to know about parseRoadMap) and is deliberately not
// made here. What this test pins is the containment rule, which is what actually broke:
assert("'Άρα' inside a ΚΟΣΤΙΖΕΙ line removes only that sentence — surrounding map lines untouched",
  (() => {
    const out = stripAraDeclarative(MAP_ARA_INSIDE);
    return out.includes('ΔΡΟΜΟΣ: Μένω στη δουλειά') &&
           out.includes('ΚΕΡΔΙΖΕΙΣ: σταθερό εισόδημα') &&
           out.includes('ΔΡΟΜΟΣ: Φεύγω τώρα') &&
           out.includes('ΚΟΣΤΙΖΕΙ: την ασφάλεια');
  })());

assert("A 2-road map opening with 'Άρα,' still parses as 2 roads after stripping",
  (() => { const p = parseRoadMap(stripAraDeclarative(MAP_ARA_LEADING)); return p !== null && p.roads.length === 2; })());

assert("CRITICAL: stripping never returns empty from input that contained a valid map",
  stripAraDeclarative(MAP_ARA_INSIDE).trim() !== "" && stripAraDeclarative(MAP_ARA_LEADING).trim() !== "");

assert("Line structure survives — the ΚΟΣΤΙΖΕΙ line is not glued onto the next ΔΡΟΜΟΣ line",
  !/ΚΟΣΤΙΖΕΙ:[ \t]*ΔΡΟΜΟΣ:/.test(stripAraDeclarative(MAP_ARA_INSIDE)));

// The original purpose must survive the containment fix — a declarative "Άρα X." on one line
// is still removed. Without this, the fix above could be "passed" by disabling the strip.
assert("PURPOSE PRESERVED: a single-line declarative 'Άρα …' is still removed",
  stripAraDeclarative('Άρα το πραγματικό πρόβλημα είναι ο φόβος. Τι σε κρατάει περισσότερο;')
  === 'Τι σε κρατάει περισσότερο;');

assert("PURPOSE PRESERVED: the declarative inside the map fixture is gone from the output",
  !stripAraDeclarative(MAP_ARA_INSIDE).includes('Άρα χάνεις τον χρόνο σου'));

assert("Removal stops at the end of its own line even when a period exists further down",
  stripAraDeclarative('Άρα κάτι αλλάζει εδώ\nΤι σε κρατάει;\nΠες μου κάτι ακόμα.')
  === 'Άρα κάτι αλλάζει εδώ\nΤι σε κρατάει;\nΠες μου κάτι ακόμα.');

// Same containment rule for the English pattern, which carried the identical [^.]* flaw.
assert("English pattern is contained to its own line too",
  (() => {
    const t = 'So, the real question is whether you stay\nΔΡΟΜΟΣ: Μένω\nΚΕΡΔΙΖΕΙΣ: χρόνο\nΚΟΣΤΙΖΕΙ: ασφάλεια.';
    const p = parseRoadMap(stripAraDeclarative(t));
    return p !== null && p.roads.length === 1;
  })());

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
