const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();

// Extract matchesClosingWord + its helper deps aren't needed (self-contained)
const startIdx = raw.indexOf('function matchesClosingWord');
const endIdx = raw.indexOf('\n}', startIdx) + 2;
eval(raw.slice(startIdx, endIdx));

// Also pull in isBareEmojiOrAcknowledgment for the combined-logic test
const eStart = raw.indexOf('function isBareEmojiOrAcknowledgment');
const eEnd = raw.indexOf('\n}', eStart) + 2;
eval(raw.slice(eStart, eEnd));

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

// BUG 2 FIX: farewell words are now recognized as closing signals
assert("'Καληνύχτα' recognized as closing", matchesClosingWord("Καληνύχτα") === true);
assert("'Καληνύχτα.' with punctuation", matchesClosingWord("Καληνύχτα.") === true);
assert("'Επίσης' recognized as closing", matchesClosingWord("Επίσης") === true);
assert("'Παρομοίως' recognized as closing", matchesClosingWord("Παρομοίως") === true);
assert("'Κι εσένα' recognized as closing", matchesClosingWord("Κι εσένα") === true);
assert("'Και εσένα' recognized as closing", matchesClosingWord("Και εσένα") === true);
assert("'Αντίο' recognized as closing", matchesClosingWord("Αντίο") === true);
assert("'Γεια' recognized as closing", matchesClosingWord("Γεια") === true);

// Guard: real content is still NOT closing (no false positives that would cut sessions short)
assert("real question NOT closing", matchesClosingWord("Τι να κάνω με τη δουλειά μου;") === false);
assert("statement NOT closing", matchesClosingWord("Σκέφτομαι να φύγω") === false);
assert("'καληνύχτα' inside a sentence NOT closing", matchesClosingWord("Δεν μπορώ να πω καληνύχτα ακόμα γιατί έχω θέμα") === false);

// Combined logic (mirrors the render-time decision): farewell-aware emoji handling
function emojiAddition(lastUserMsg) {
  return matchesClosingWord(lastUserMsg) ? "Καληνύχτα." : "Τι σκέφτεσαι τώρα;";
}
assert("bare emoji after farewell → close, not reopen", emojiAddition("Καληνύχτα") === "Καληνύχτα.");
assert("bare emoji after 'Επίσης' → close", emojiAddition("Επίσης") === "Καληνύχτα.");
assert("bare emoji mid-conversation → forward question", emojiAddition("Σκέφτομαι κάτι") === "Τι σκέφτεσαι τώρα;");

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
