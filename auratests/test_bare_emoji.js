const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
const startIdx = raw.indexOf('function isBareEmojiOrAcknowledgment');
const endIdx = raw.indexOf('\n}', startIdx) + 2;
eval(raw.slice(startIdx, endIdx));

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

// Must be caught (bare emoji/symbols only — the real recurring bug)
assert("bare thumbs-up caught", isBareEmojiOrAcknowledgment("👍") === true);
assert("bare handshake caught", isBareEmojiOrAcknowledgment("🤝") === true);
assert("bare pray caught", isBareEmojiOrAcknowledgment("🙏") === true);
assert("emoji + spaces caught", isBareEmojiOrAcknowledgment("  😊  ") === true);
assert("multiple emoji caught", isBareEmojiOrAcknowledgment("👍🤝") === true);
assert("emoji + punctuation caught", isBareEmojiOrAcknowledgment("👍.") === true);
assert("empty string caught", isBareEmojiOrAcknowledgment("") === true);
assert("only punctuation caught", isBareEmojiOrAcknowledgment("...") === true);
assert("only whitespace caught", isBareEmojiOrAcknowledgment("   ") === true);

// Must NOT be caught (real content, including content that happens to contain emoji)
assert("greek text not caught", isBareEmojiOrAcknowledgment("Τι σκέφτεσαι;") === false);
assert("greek + emoji not caught", isBareEmojiOrAcknowledgment("Κατάλαβα 👍 τι άλλο;") === false);
assert("english not caught", isBareEmojiOrAcknowledgment("What are you thinking?") === false);
assert("single greek word not caught", isBareEmojiOrAcknowledgment("Ναι") === false);
assert("number present not caught", isBareEmojiOrAcknowledgment("10306") === false);
assert("emoji then real question not caught", isBareEmojiOrAcknowledgment("😊 Πες μου περισσότερα.") === false);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
