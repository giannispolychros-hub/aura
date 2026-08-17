const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
const startIdx = raw.indexOf('function detectsNoQuestionsRequest');
const endIdx = raw.indexOf('\n}', startIdx) + 2;
eval(raw.slice(startIdx, endIdx));

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

assert("Detects 'χωρίς ερωτήσεις'", detectsNoQuestionsRequest("μπορείς να βοηθήσεις χωρίς ερωτήσεις;"));
assert("Detects 'χωρίς να με ρωτάς'", detectsNoQuestionsRequest("απάντησέ μου χωρίς να με ρωτάς"));
assert("Detects 'μη με ρωτάς'", detectsNoQuestionsRequest("μη με ρωτάς άλλο, πες μου"));
assert("Detects 'σταμάτα να ρωτάς'", detectsNoQuestionsRequest("σταμάτα να ρωτάς και άκου"));
assert("Detects 'βοηθήσεις χωρίς' (real transcript phrasing)", detectsNoQuestionsRequest("Μπορείς να βοηθήσεις χωρίς να ρωτάς;"));
assert("Does NOT false-fire on unrelated message", !detectsNoQuestionsRequest("δεν ξέρω τι να κάνω με αυτό το πρόβλημα"));
assert("Does NOT false-fire on normal question about the app", !detectsNoQuestionsRequest("γιατί μου κάνεις τόσες ερωτήσεις σήμερα, καλή η κουβέντα όμως"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
