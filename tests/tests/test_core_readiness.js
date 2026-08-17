const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsCoreReadinessAsked'));
eval(extract('detectsAffirmativeShort'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

// === detectsCoreReadinessAsked ===
assert("Detects the exact canonical readiness-check wording",
  detectsCoreReadinessAsked("Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;") === true);
assert("Does NOT false-positive on an unrelated AURA reply",
  detectsCoreReadinessAsked("Τι σε κρατάει στη δουλειά αυτή τη στιγμή;") === false);
assert("Does NOT false-positive on Problem Brief content (real risk checked)",
  detectsCoreReadinessAsked("ΤΟ ΠΡΟΒΛΗΜΑ: δεν ξέρεις αν το σχέδιο στέκει οικονομικά.") === false);
assert("Does NOT false-positive on the ROOT RE-FOCUS step-two text itself",
  detectsCoreReadinessAsked("Θες να το πεις όπως πραγματικά σου βγαίνει, σε ένα χαρτί που δεν χρειάζεται να το δει κανείς;") === false);

// === detectsAffirmativeShort ===
assert("Detects bare 'Ναι'", detectsAffirmativeShort("Ναι") === true);
assert("Detects 'Ναι.' with punctuation", detectsAffirmativeShort("Ναι.") === true);
assert("Detects 'Ακριβώς'", detectsAffirmativeShort("Ακριβώς") === true);
assert("Detects 'Νιώθω κάπως έτσι'", detectsAffirmativeShort("Νιώθω κάπως έτσι") === true);
assert("Rejects 'Όχι'", detectsAffirmativeShort("Όχι") === false);
assert("Rejects 'Δεν είμαι σίγουρος'", detectsAffirmativeShort("Δεν είμαι σίγουρος") === false);
assert("Rejects long, unrelated message even if it starts with a similar word pattern",
  detectsAffirmativeShort("Ναι αλλά νομίζω ότι υπάρχουν κι άλλα πράγματα που πρέπει να σκεφτώ πριν προχωρήσω σε αυτό") === false);
assert("Rejects empty string", detectsAffirmativeShort("") === false);
assert("Rejects a real dilemma statement that happens to start similarly",
  detectsAffirmativeShort("Νομίζω πρέπει να αλλάξω δουλειά αλλά φοβάμαι") === false);

// === Sequencing logic simulation (mirrors the actual wiring in the component) ===
function simulateSequence(steps) {
  let asked = false, confirmed = false;
  const log = [];
  for (const { auraText, userReplyBefore } of steps) {
    if (!confirmed) {
      if (asked && userReplyBefore && detectsAffirmativeShort(userReplyBefore)) {
        confirmed = true;
      } else if (detectsCoreReadinessAsked(auraText)) {
        asked = true;
      }
    }
    log.push({ asked, confirmed });
  }
  return log;
}

const seq1 = simulateSequence([
  { auraText: "Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;", userReplyBefore: null },
  { auraText: "Θες να το πεις όπως πραγματικά σου βγαίνει;", userReplyBefore: "Ναι" },
]);
assert("Full sequence: asked -> user says yes -> confirmed becomes true on the very next turn",
  seq1[0].asked === true && seq1[0].confirmed === false && seq1[1].confirmed === true);

const seq2 = simulateSequence([
  { auraText: "Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;", userReplyBefore: null },
  { auraText: "Εντάξει, συνεχίζουμε τότε.", userReplyBefore: "Όχι ακόμα" },
]);
assert("User says no -> confirmed stays false, sequence does not force forward",
  seq2[1].confirmed === false);

const seq3 = simulateSequence([
  { auraText: "Τι σε κρατάει περισσότερο σε αυτό;", userReplyBefore: null },
  { auraText: "Κατάλαβα.", userReplyBefore: "Ναι" },
]);
assert("CRITICAL: a bare 'Ναι' to an UNRELATED question never confirms readiness (no false trigger without the real question having been asked)",
  seq3[1].confirmed === false);

const seq4 = simulateSequence([
  { auraText: "Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;", userReplyBefore: null },
  { auraText: "Θες να το πεις όπως πραγματικά σου βγαίνει;", userReplyBefore: "Ναι" },
  { auraText: "Ό,τι κι άλλο πεις τώρα.", userReplyBefore: "Ναι πάλι" },
]);
assert("One-way latch: once confirmed, stays confirmed even if a later unrelated 'Ναι' appears",
  seq4[1].confirmed === true && seq4[2].confirmed === true);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
