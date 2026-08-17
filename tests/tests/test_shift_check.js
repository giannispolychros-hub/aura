const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsShiftCheckAsked'));
eval(extract('detectsAffirmativeShort'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

assert("Detects the exact canonical shift-check wording",
  detectsShiftCheckAsked("Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;") === true);
assert("Does NOT false-positive on the follow-up 'με τι μπήκες/φεύγεις' question itself",
  detectsShiftCheckAsked("Με τι μπήκες εδώ... και με τι φεύγεις τώρα;") === false);
assert("Does NOT false-positive on an unrelated mid-conversation question",
  detectsShiftCheckAsked("Τι σε κρατάει περισσότερο σε αυτό;") === false);
assert("Does NOT false-positive on the core-readiness question (different mechanism, similar topic)",
  detectsShiftCheckAsked("Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;") === false);

function simulateShiftSequence(steps) {
  let asked = false, confirmed = false;
  const log = [];
  for (const { auraText, userReplyBefore } of steps) {
    if (!confirmed) {
      if (asked && userReplyBefore && detectsAffirmativeShort(userReplyBefore)) {
        confirmed = true;
      } else if (detectsShiftCheckAsked(auraText)) {
        asked = true;
      }
    }
    log.push({ asked, confirmed });
  }
  return log;
}

// CORRECTED UNDERSTANDING (second-pass self-correction): "Ναι" answers "Νιώθεις ότι κάτι
// άλλαξε" — a genuine yes/no question. This is CORRECT behavior, not a bug. The real
// false-clarity safeguard lives in the SEPARATE, later "με τι μπήκες/φεύγεις" question, which
// already requires substantive user words before the three-beat structure builds.
const s1 = simulateShiftSequence([
  { auraText: "Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;", userReplyBefore: null },
  { auraText: "Με τι μπήκες εδώ... και με τι φεύγεις τώρα;", userReplyBefore: "Ναι" },
]);
assert("Full sequence: shift-check asked -> user confirms (genuinely yes/no) -> three-beat follow-up now permitted",
  s1[0].asked === true && s1[0].confirmed === false && s1[1].confirmed === true);

const s2 = simulateShiftSequence([
  { auraText: "Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;", userReplyBefore: null },
  { auraText: "Εντάξει, ας συνεχίσουμε τότε.", userReplyBefore: "Όχι, όχι ακόμα" },
]);
assert("User says no -> three-beat structure correctly NOT unlocked, session continues normally",
  s2[1].confirmed === false);

const s3 = simulateShiftSequence([
  { auraText: "Τι σε εμποδίζει περισσότερο;", userReplyBefore: null },
  { auraText: "Κατάλαβα.", userReplyBefore: "Ναι" },
]);
assert("CRITICAL: bare 'Ναι' to an unrelated question never confirms a shift without the real check having been asked first",
  s3[1].confirmed === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
