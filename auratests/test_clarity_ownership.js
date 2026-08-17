const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('extractReliefNumber'));
eval(extract('extractTwoNumbers'));
eval(extract('detectsEarlyReliefAsked'));
eval(extract('detectsOutcomeScaleAsked'));
eval(extract('matchesClosingWord'));
eval(extract('parseThreeBeatShift'));
eval(extract('isBareEmojiOrAcknowledgment'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

// Work-type variants — early question, all three
assert("early: decide variant detected", detectsEarlyReliefAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10;") === true);
assert("early: solve variant detected", detectsEarlyReliefAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα που πρέπει να λύσεις, από το 1 έως το 10;") === true);
assert("early: understand variant detected", detectsEarlyReliefAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι τι πραγματικά προσπαθείς να καταλάβεις, από το 1 έως το 10;") === true);

// Work-type variants — late question, all three
assert("late: decide variant detected", detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις, από το 1 έως το 10;") === true);
assert("late: solve variant detected", detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα, από το 1 έως το 10;") === true);
assert("late: understand variant detected", detectsOutcomeScaleAsked("Τώρα, πόσο ξεκάθαρο είναι αυτό που προσπαθούσες να καταλάβεις, από το 1 έως το 10;") === true);

// Early/late detectors stay properly distinguished (different opening phrase)
assert("early detector does NOT match late phrasing", detectsEarlyReliefAsked("Τώρα, πόσο ξεκάθαρο είναι τι θέλεις να κάνεις;") === false);
assert("late detector does NOT match early phrasing", detectsOutcomeScaleAsked("Αυτή τη στιγμή, πόσο ξεκάθαρο είναι τι πρέπει να κάνεις;") === false);

// Disambiguated ownership wording present in the actual prompt text (not just old wording)
assert("prompt contains disambiguated ownership wording, not old confidence-ambiguous version",
  raw.includes("πόσο αισθάνεσαι ότι αυτό που βρήκες είναι δική σου σκέψη ή επιλογή") && !raw.includes("πόσο δικό σου νιώθεις αυτό που βρήκες"));

// SAFETY FIX simulation: the hard gate must NOT override when the user's own message was a closing word
function simulateGate(displayText, concreteStepStated, outcomeScaleAsked, lastUserMsg) {
  if (concreteStepStated && !outcomeScaleAsked && parseThreeBeatShift(displayText) !== null && !matchesClosingWord(lastUserMsg)) {
    return { intercepted: true };
  }
  return { intercepted: false };
}
const shiftText = "ΗΡΘΕΣ ΜΕ: ένα δίλημμα\nΒΡΗΚΕΣ: την αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρή σκέψη";
assert("gate still fires normally when user's message is NOT a closing word",
  simulateGate(shiftText, true, false, "Θα το κάνω αυτή την εβδομάδα.").intercepted === true);
assert("SAFETY: gate does NOT override when user's message IS a closing word (prevents repeat of the Anchors/Stakes bug)",
  simulateGate(shiftText, true, false, "Τα λέμε.").intercepted === false);
assert("SAFETY: gate does NOT override on plain 'Ναι' close either",
  simulateGate(shiftText, true, false, "Ναι").intercepted === false);

// NEW TEST (critical bug fix): the suppression check must distinguish "first closing signal,
// Reflection Summary never delivered" from "already delivered once, genuinely redundant repeat".
// Real transcript showed the ENTIRE Reflection Summary sequence silently skipped because the
// old check suppressed on closing-word-text ALONE, regardless of whether it had ever fired.
function simulateSuppressionCheck(text, reflectionAlreadyDelivered) {
  const suppressCard = matchesClosingWord(text) && !isBareEmojiOrAcknowledgment(text) && reflectionAlreadyDelivered;
  return { cardShown: !suppressCard };
}
assert("CRITICAL FIX: first-time 'Καλή συνέχεια' (reflection never delivered) -> card MUST show, triggering the real sequence",
  simulateSuppressionCheck("Καλή συνέχεια.", false).cardShown === true);
assert("Second, genuinely redundant 'Καλή συνέχεια' (reflection already delivered once) -> card correctly suppressed",
  simulateSuppressionCheck("Καλή συνέχεια.", true).cardShown === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
