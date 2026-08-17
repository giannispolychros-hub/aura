const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsCoreReadinessAsked'));
eval(extract('detectsShiftCheckAsked'));
eval(extract('detectsFriendPerspectiveAsked'));
eval(extract('detectsBinaryOppositionPhrasing'));
eval(extract('detectsSpontaneousShiftRecognition'));
eval(extract('detectsSpontaneousCoreRecognition'));
eval(extract('detectsAffirmativeShort'));
eval(extract('matchesClosingWord'));
eval(extract('isBareEmojiOrAcknowledgment'));

let passed = 0, failed = 0, results = [];
function assert(session, label, cond, turnsToWake) {
  if (cond) { passed++; results.push(`✓ [${session}] ${label} — ξύπνησε στο turn ${turnsToWake}`); }
  else { failed++; results.push(`✗ [${session}] ${label} — ΔΕΝ ΞΥΠΝΗΣΕ`); }
}

// ===== SESSION 1: Career dilemma, binary phrasing + named costs =====
console.log("\n=== SESSION 1: Καριέρα, δυαδική διατύπωση ===");
const s1_turns = [
  "Δεν ξέρω αν να αλλάξω δουλειά.",
  "Ή μένω με σιγουριά ή φεύγω με ρίσκο.",
  "Πάλι το ίδιο - ή σιγουριά ή ρίσκο, δεν βγαίνει άκρη."
];
let s1_count = 0, s1_wake = null;
s1_turns.forEach((t, i) => { if (detectsBinaryOppositionPhrasing(t)) { s1_count++; if (s1_count >= 2 && !s1_wake) s1_wake = i+1; } });
assert("S1", "PREMISE INVERSION (binaryOppositionCount>=2)", s1_wake !== null, s1_wake);

// ===== SESSION 2: Core-readiness flow =====
console.log("=== SESSION 2: Core-readiness ===");
const s2_aura = "Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;";
const s2_user = "Ναι";
assert("S2", "coreReadinessAsked detector", detectsCoreReadinessAsked(s2_aura), 1);
assert("S2", "coreReadinessConfirmed (user Ναι after ask)", detectsAffirmativeShort(s2_user), 2);

// ===== SESSION 3: Spontaneous shift recognition (no question needed) =====
console.log("=== SESSION 3: Αυθόρμητη αναγνώριση shift ===");
const s3_user = "Τώρα κατάλαβα, δεν είναι αυτό που νόμιζα.";
assert("S3", "detectsSpontaneousShiftRecognition (no prompt needed)", detectsSpontaneousShiftRecognition(s3_user), 1);

// ===== SESSION 4: Friend-perspective confirmation flow =====
console.log("=== SESSION 4: Friend-perspective ===");
const s4_aura = "Αυτό που θα έλεγες στον φίλο σου είναι διαφορετικό από αυτό που επιτρέπεις στον εαυτό σου;";
const s4_user = "Ναι";
assert("S4", "detectsFriendPerspectiveAsked", detectsFriendPerspectiveAsked(s4_aura), 1);
assert("S4", "friendPerspectiveConfirmed (Ναι after ask)", detectsAffirmativeShort(s4_user), 2);

// ===== SESSION 5: Bare emoji reply edge case =====
console.log("=== SESSION 5: Bare emoji ===");
assert("S5", "isBareEmojiOrAcknowledgment catches bare emoji", isBareEmojiOrAcknowledgment("👍"), 1);
assert("S5", "isBareEmojiOrAcknowledgment does NOT false-positive on real content",
  !isBareEmojiOrAcknowledgment("Νομίζω ότι αυτό είναι σημαντικό για μένα"), "n/a");

// ===== SESSION 6: Closing word detection variety =====
console.log("=== SESSION 6: Λέξεις κλεισίματος, ποικιλία ===");
["Καλή συνέχεια.", "Τα λέμε.", "Καληνύχτα", "Εντάξει, ευχαριστώ"].forEach((w, i) => {
  assert("S6", `matchesClosingWord("${w}")`, matchesClosingWord(w), i+1);
});

// ===== SESSION 7: Shift-check full flow =====
console.log("=== SESSION 7: Shift-check ===");
const s7_aura = "Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;";
assert("S7", "detectsShiftCheckAsked", detectsShiftCheckAsked(s7_aura), 1);
assert("S7", "user Ναι confirms", detectsAffirmativeShort("Ναι"), 2);

// ===== SESSION 8: Spontaneous core recognition, no prompt needed =====
console.log("=== SESSION 8: Αυθόρμητη αναγνώριση core ===");
const s8_user = "Νομίζω ξέρω τι με απασχολεί τώρα.";
assert("S8", "detectsSpontaneousCoreRecognition", detectsSpontaneousCoreRecognition(s8_user), 1);

// ===== SESSION 9: Real transcript wording variant (μπρος γκρεμός) =====
console.log("=== SESSION 9: Πραγματική διατύπωση transcript ===");
const s9_user1 = "Μπρος γκρεμός και πίσω ρέμα.";
const s9_user2 = "Ή πας και το ανέχεσαι ή μένεις σπίτι και τέλος.";
let s9_count = 0;
[s9_user1, s9_user2].forEach(t => { if (detectsBinaryOppositionPhrasing(t)) s9_count++; });
assert("S9", "PREMISE INVERSION fires on REAL transcript wording (2 variants)", s9_count >= 2, 2);

// ===== SESSION 10: Negative control - none should fire on plain conversation =====
console.log("=== SESSION 10: Αρνητικός έλεγχος - τίποτα δεν πρέπει να πυροδοτήσει ===");
const s10_plain = "Πόσο κοστίζει ένα ταξίδι στην Ιαπωνία;";
assert("S10", "NEGATIVE: binaryOpposition does NOT fire on plain question", !detectsBinaryOppositionPhrasing(s10_plain), "n/a");
assert("S10", "NEGATIVE: shiftCheck does NOT fire on plain question", !detectsShiftCheckAsked(s10_plain), "n/a");
assert("S10", "NEGATIVE: coreReadiness does NOT fire on plain question", !detectsCoreReadinessAsked(s10_plain), "n/a");

console.log("\n" + results.join("\n"));
console.log("\n" + passed + " passed, " + failed + " failed (out of " + (passed+failed) + " checks across 10 sessions)");
process.exit(failed > 0 ? 1 : 0);
