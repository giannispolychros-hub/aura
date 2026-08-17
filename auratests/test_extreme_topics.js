// EXTREME-TOPIC STRESS TEST — 10 personas on paranormal/religion/aliens
// Purpose: verify the deterministic detectors (closing, concrete-step, bare-emoji, domain,
// three-beat-shift) remain topic-agnostic and don't misfire on unusual subject matter far from
// the career/relationship examples tested so far. Scope: code-level trigger recognition only.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('isBareEmojiOrAcknowledgment'));
eval(extract('matchesClosingWord'));
eval(extract('detectsConcreteStep'));
eval(extract('detectDomain'));
eval(extract('parseThreeBeatShift'));

const personas = [
  { name: "1. Confident paranormal belief", msg: "Ξέρω σίγουρα ότι το σπίτι της γιαγιάς μου στοιχειώνει, το έχω νιώσει πολλές φορές." },
  { name: "2. Torn on leaving religion", msg: "Από τη μία θέλω να μείνω πιστός όπως μεγάλωσα, από την άλλη δεν πιστεύω πια σε τίποτα από αυτά." },
  { name: "3. UFO sighting, seeking validation", msg: "Νομίζω ότι είδα UFO χθες βράδυ, δεν ξέρω αν το φαντάστηκα." },
  { name: "4. Vague religious doubt", msg: "Κάτι δεν μου κάθεται καλά τελευταία με την πίστη μου, δεν ξέρω τι ακριβώς." },
  { name: "5. Concrete step, religious", msg: "Θα μιλήσω στον παπά μου αυτή την Κυριακή." },
  { name: "6. Concrete step (θα το κάνω), paranormal", msg: "Θα το κάνω, θα καλέσω μέντιουμ να δει το σπίτι." },
  { name: "7. Farewell after alien discussion", msg: "Καληνύχτα, ευχαριστώ που τ' ακούσες αυτά για τους εξωγήινους." },
  { name: "8. Deflection on family religious pressure", msg: "Άστο αυτό, δεν έχει σημασία τι πιστεύει η οικογένειά μου." },
  { name: "9. Conspiracy-adjacent, seeking info", msg: "Τι λένε συνήθως οι ειδικοί για κρυμμένα στοιχεία εξωγήινης ζωής;" },
  { name: "10. Bare emoji after religious topic", msg: "🙏" },
];

console.log("PERSONA".padEnd(42), "close", "step", "emoji", "domain".padEnd(14), "shift");
let issues = [];
for (const p of personas) {
  const close = matchesClosingWord(p.msg);
  const step  = detectsConcreteStep(p.msg);
  const emoji = isBareEmojiOrAcknowledgment(p.msg);
  const domain = detectDomain(p.msg);
  const shift = parseThreeBeatShift(p.msg) !== null;
  console.log(p.name.padEnd(42), String(close).padEnd(5), String(step).padEnd(4), String(emoji).padEnd(5), domain.padEnd(14), String(shift));
  if (close && step) issues.push(p.name + ": closing AND step");
  if (emoji && (step || shift)) issues.push(p.name + ": emoji AND (step or shift)");
}
console.log("\nISSUES:", issues.length === 0 ? "none found" : issues.join(" | "));

// Sanity checks — the detectors should behave identically regardless of topic content
let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { passed++; console.log('PASS —', desc); } else { failed++; console.log('FAIL —', desc); } }

assert("#5 religious concrete step detected (θα μιλήσω)", detectsConcreteStep(personas[4].msg) === true);
assert("#6 paranormal concrete step detected (θα το κάνω)", detectsConcreteStep(personas[5].msg) === true);
// VERIFIED SCOPE (not a bug — my original assertion was wrong): matchesClosingWord requires the
// ENTIRE message to be closing-word-only after stripping. "Καληνύχτα, ευχαριστώ που τ' άκουσες
// αυτά για τους εξωγήινους" correctly does NOT match — it has substantial additional content (a
// specific, genuine thank-you) beyond the farewell word, which deserves acknowledgment, not an
// automatic close. Same class of finding as detectsConcreteStep's narrow θα+verb scope.
assert("#7 farewell + substantial content correctly NOT pure-closing (intentional)", matchesClosingWord(personas[6].msg) === false);
assert("#7 plain farewell alone still correctly closing (regression guard)", matchesClosingWord("Καληνύχτα") === true);
assert("#10 bare emoji (prayer hands) still correctly bare", isBareEmojiOrAcknowledgment(personas[9].msg) === true);
assert("all 10 personas classify to SOME domain string (none crash/undefined)",
  personas.every(p => typeof detectDomain(p.msg) === "string" && detectDomain(p.msg).length > 0));
assert("no dangerous cross-check overlaps across all 10 extreme-topic personas", issues.length === 0);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
