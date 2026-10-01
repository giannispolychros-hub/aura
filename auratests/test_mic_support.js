// ── ΤΟ ΚΟΥΜΠΙ ΜΙΚΡΟΦΩΝΟΥ ΔΕΝ ΕΜΦΑΝΙΖΕΤΑΙ ΟΠΟΥ ΔΕΝ ΥΠΟΣΤΗΡΙΖΕΤΑΙ ──────────────────────────────────────────
//
// WHY. startListening returns silently when the browser has no SpeechRecognition (`if (!SR) return;`), but the
// button was always rendered, so on such a browser it looked like a feature and did nothing. Now it is rendered
// only when the browser really has the API. Nothing else changes: the send button, the dictation logic and the
// consent/privacy texts are untouched.
// KNOWN, NOT CHANGED: where it IS supported, the transcription is done by the browser's own service and no text
// of ours says so. That is a text decision, listed in AURA_UNFINISHED_INVENTORY.md (#13).
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _e = raw.indexOf('`;', raw.indexOf('`', _i) + 1);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

const decl = CODE.match(/const speechSupported\s*=\s*([^;]+);/);
assert('speechSupported is declared', !!decl);
if (decl) {
  const expr = decl[1];
  assert('it checks BOTH the standard and the webkit-prefixed API', /window\.SpeechRecognition/.test(expr) && /window\.webkitSpeechRecognition/.test(expr));
  assert('it is safe without a window (no throw when window is undefined)', /typeof window !== "undefined"/.test(expr));
  const f = new Function('window', 'return ' + expr.replace(/typeof window/g, 'typeof window'));
  assert('behaviour: false with no API', f({}) === false);
  assert('behaviour: true with webkitSpeechRecognition', f({ webkitSpeechRecognition: function () {} }) === true);
  assert('behaviour: true with SpeechRecognition', f({ SpeechRecognition: function () {} }) === true);
  assert('behaviour: false when there is no window at all', f(undefined) === false);
}
const micAt = CODE.indexOf('className={`mic-btn');
assert('NON-VACUITY: the mic button is findable', micAt > 0);
const before = CODE.slice(Math.max(0, micAt - 60), micAt);
assert('the mic button is rendered only when speechSupported', /\{speechSupported\s*&&\s*<button\s*$/.test(before));
const after = CODE.slice(micAt, micAt + 420);
assert('the send button is NOT inside the condition (always rendered)', /<\/button>\}?\s*<button className=\{`send-btn/.test(after));
assert('the dictation logic is unchanged: startListening still returns silently without the API',
  /const startListening = useCallback\(\(\) => \{ const SR = window\.SpeechRecognition \|\| window\.webkitSpeechRecognition; if \(!SR\) return;/.test(CODE));
assert('the language stays Greek', /r\.lang="el-GR"/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
