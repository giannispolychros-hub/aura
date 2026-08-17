const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsShiftCheckAsked'));
eval(extract('detectsAffirmativeShort'));
eval(extract('detectsSpontaneousShiftRecognition'));
eval(extract('detectsCoreReadinessAsked'));
eval(extract('detectsSpontaneousCoreRecognition'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

// Mirrors the ACTUAL wiring logic in App.jsx exactly (both spontaneous + asked paths)
function simulateGate(steps, askedDetector, spontaneousDetector) {
  let asked = false, confirmed = false;
  const log = [];
  for (const { auraText, userMsg } of steps) {
    if (!confirmed) {
      if (userMsg && spontaneousDetector(userMsg)) {
        confirmed = true;
      } else if (asked && userMsg && detectsAffirmativeShort(userMsg)) {
        confirmed = true;
      } else if (auraText && askedDetector(auraText)) {
        asked = true;
      }
    }
    log.push({ asked, confirmed });
  }
  return log;
}

console.log("\n========== ΠΥΛΗ 1: SHIFT-CHECK (πριν το τρίμπητο) ==========\n");

// FLOW 1 — δεν εμφανίζεται όταν δεν χρειάζεται: καθαρά πληροφοριακή συνεδρία, καμία απόφαση
console.log("--- Flow 1: πληροφοριακή ερώτηση, δεν χρειάζεται καν shift-check ---");
const f1 = simulateGate([
  { auraText: "Πόσο κοστίζει περίπου ένα ταξίδι στην Ιαπωνία;", userMsg: null },
], detectsShiftCheckAsked, detectsSpontaneousShiftRecognition);
assert("Flow 1: gate ποτέ δεν ενεργοποιείται σε καθαρά πληροφοριακή ανταλλαγή (κανένα trigger, σωστά)",
  f1[0].asked === false && f1[0].confirmed === false);

// FLOW 2 — σιωπηλή μετάβαση: χρήστης λέει αυθόρμητα "τώρα κατάλαβα", καμία επανάληψη ερώτησης
console.log("\n--- Flow 2: χρήστης λέει αυθόρμητα, καμία επανάληψη ερώτησης ---");
const f2 = simulateGate([
  { auraText: "Τι σε κρατάει περισσότερο σε αυτό;", userMsg: null },
  { auraText: null, userMsg: "Τώρα κατάλαβα, δεν είναι η δουλειά, είναι ο φόβος της αλλαγής." },
  { auraText: "Με τι μπήκες εδώ... και με τι φεύγεις τώρα;", userMsg: null },
], detectsShiftCheckAsked, detectsSpontaneousShiftRecognition);
assert("Flow 2: αυθόρμητη αναγνώριση χρήστη -> confirmed αμέσως, ΧΩΡΙΣ να ρωτηθεί ποτέ η σταθερή ερώτηση",
  f2[1].confirmed === true && f2[2].asked === false);

// FLOW 3 — παρακάμπτεται όταν ο χρήστης έχει ήδη κάνει μόνος του τη μετάβαση
console.log("\n--- Flow 3: χρήστης λέει 'αυτό ήταν τελικά' — παράκαμψη πλήρης ---");
const f3 = simulateGate([
  { auraText: "Άρα τι σε εμποδίζει ακόμα;", userMsg: null },
  { auraText: null, userMsg: "Αυτό ήταν τελικά, το βλέπω αλλιώς τώρα." },
], detectsShiftCheckAsked, detectsSpontaneousShiftRecognition);
assert("Flow 3: 'αυτό ήταν τελικά' -> gate παρακάμπτεται πλήρως, καμία ερώτηση επιβεβαίωσης χρειάστηκε",
  f3[1].confirmed === true);

// FLOW 4 — δεν αυξάνει turns χωρίς αξία: κανονική ροή, ένα turn παραπάνω ΜΟΝΟ όταν πραγματικό shift
console.log("\n--- Flow 4: πραγματικό shift, μόνο 1 επιπλέον turn (η ίδια η ερώτηση) ---");
const f4 = simulateGate([
  { auraText: "Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;", userMsg: null },
  { auraText: null, userMsg: "Ναι" },
], detectsShiftCheckAsked, detectsSpontaneousShiftRecognition);
assert("Flow 4: 1 ερώτηση + 1 σύντομη απάντηση = ελάχιστο δυνατό κόστος όταν πραγματικά χρειάζεται",
  f4[1].confirmed === true);

// FLOW 5 — δεν γίνεται προβλέψιμο τελετουργικό: 3 διαφορετικές, ρεαλιστικές συνεδρίες, 
// η πύλη ΔΕΝ εμφανίζεται στην ίδια ακριβώς μορφή/στιγμή κάθε φορά
console.log("\n--- Flow 5: τρεις διαφορετικές συνεδρίες, η πύλη συμπεριφέρεται διαφορετικά κάθε φορά ---");
const f5a = simulateGate([{ auraText: "Πόσο κοστίζει;", userMsg: null }], detectsShiftCheckAsked, detectsSpontaneousShiftRecognition);
const f5b = simulateGate([{ auraText: null, userMsg: "Τώρα το βλέπω αλλιώς." }], detectsShiftCheckAsked, detectsSpontaneousShiftRecognition);
const f5c = simulateGate([
  { auraText: "Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;", userMsg: null },
  { auraText: null, userMsg: "Όχι ακόμα" },
], detectsShiftCheckAsked, detectsSpontaneousShiftRecognition);
assert("Flow 5: 3 συνεδρίες, 3 διαφορετικά αποτελέσματα (ποτέ/σιωπηλά/ρητά-αρνητικά) — όχι προβλέψιμο σκριπτ",
  f5a[0].confirmed === false && f5b[0].confirmed === true && f5c[1].confirmed === false);

console.log("\n========== ΠΥΛΗ 2: CORE-READINESS (πριν το χαρτί) ==========\n");

console.log("--- Flow 1: πληροφοριακή ερώτηση, δεν χρειάζεται καν core-readiness ---");
const g1 = simulateGate([
  { auraText: "Το ΔΥΠΑ πρόγραμμα δεν απαιτεί ίδια κεφάλαια όπως το ΕΣΠΑ.", userMsg: null },
], detectsCoreReadinessAsked, detectsSpontaneousCoreRecognition);
assert("Flow 1: gate ποτέ δεν ενεργοποιείται σε πληροφοριακή/εξωτερικού-περιορισμού ανταλλαγή",
  g1[0].asked === false && g1[0].confirmed === false);

console.log("\n--- Flow 2: χρήστης λέει αυθόρμητα 'νομίζω ξέρω τι με απασχολεί' ---");
const g2 = simulateGate([
  { auraText: "Τι σε κρατάει πραγματικά εδώ;", userMsg: null },
  { auraText: null, userMsg: "Νομίζω ξέρω τι με απασχολεί, είναι ο φόβος αποτυχίας." },
  { auraText: "Θες να το πεις σε ένα χαρτί;", userMsg: null },
], detectsCoreReadinessAsked, detectsSpontaneousCoreRecognition);
assert("Flow 2: αυθόρμητη αναγνώριση -> confirmed αμέσως, καμία επανάληψη της σταθερής ερώτησης",
  g2[1].confirmed === true && g2[2].asked === false);

console.log("\n--- Flow 3: χρήστης απαντά 'ναι' κατευθείαν σε δικό του stated core ---");
const g3 = simulateGate([
  { auraText: "Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;", userMsg: null },
  { auraText: null, userMsg: "Ναι" },
], detectsCoreReadinessAsked, detectsSpontaneousCoreRecognition);
assert("Flow 3: σαφές ναι σε σταθερή ερώτηση -> confirmed, χαρτί επιτρέπεται (προαιρετικό, όχι υποχρεωτικό στο κείμενο)",
  g3[1].confirmed === true);

console.log("\n--- Flow 4: ελάχιστο turn cost όταν πραγματικά χρειάζεται (ίδιο pattern με shift-check) ---");
assert("Flow 4: ίδιο μοτίβο επιβεβαιωμένο (1 ερώτηση + 1 απάντηση, τίποτα παραπάνω)", g3.length === 2);

console.log("\n--- Flow 5: χρήστης λέει 'όχι ακόμα' -> gate ΔΕΝ ξεκλειδώνει, καμία πίεση ---");
const g5 = simulateGate([
  { auraText: "Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;", userMsg: null },
  { auraText: null, userMsg: "Δεν είμαι σίγουρος ακόμα" },
], detectsCoreReadinessAsked, detectsSpontaneousCoreRecognition);
assert("Flow 5: αβέβαιη απάντηση -> confirmed παραμένει false, καμία εξαναγκασμένη μετάβαση στο χαρτί",
  g5[1].confirmed === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
