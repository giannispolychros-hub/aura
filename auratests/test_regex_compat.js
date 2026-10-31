// OLD iPHONES (final stress test before the 20, Γ3). Safari before iOS 16.4 cannot read a lookbehind, (?<=…) or (?<!…): a regex
// that has one throws «Invalid regular expression» and no message can be sent. So:
//   1. no lookbehind anywhere in the code of src/App.jsx (comments aside);
//   2. every place that had one gives, on every input, exactly what the old regex gave. The old regexes are written out below, in
//      the order their places appear in App.jsx; the new code is read from App.jsx itself (lookBehind and each call to it), so this
//      file tests what ships. The inputs: every string in the tests and the stress tools (as written, and folded the way the app
//      folds), plus 20.000 random strings built from the pieces these patterns care about.
// Run: node auratests/test_regex_compat.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const code = raw.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── 1. No lookbehind in the code ─────────────────────────────────────────────────────────────────────────────────────────────
const lb = code.split('\n').map((l, i) => [i, l]).filter(([, l]) => /\(\?<[=!]/.test(l));
assert('no lookbehind (?<= / (?<! in the code of App.jsx — found ' + lb.length + (lb.length ? ': «' + lb[0][1].trim().slice(0, 90) + '…»' : ''), lb.length === 0);

// ── 2. The helper, standalone ────────────────────────────────────────────────────────────────────────────────────────────────
function block(start) {
  const a = raw.indexOf(start); if (a < 0) return '';
  let d = 0, s = false;
  for (let k = raw.indexOf('{', a); k < raw.length; k++) {
    if (raw[k] === '{') { d++; s = true; } else if (raw[k] === '}') { d--; if (s && d === 0) return raw.slice(a, k + 1); }
  }
  return '';
}
let lookBehind = null;
try { lookBehind = new Function(block('function lookBehind(') + '\nreturn lookBehind;')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
assert('lookBehind exists in App.jsx and loads on its own', typeof lookBehind === 'function');

// Every call to it in the code, as written: lookBehind(…) and what is done with it (.test / .split / .replace).
function calls() {
  const out = [];
  for (let a = code.indexOf('lookBehind('); a >= 0; a = code.indexOf('lookBehind(', a + 1)) {
    if (/function $/.test(code.slice(a - 9, a))) continue;
    let d = 0, k = a + 'lookBehind'.length;
    for (; k < code.length; k++) { if (code[k] === '(') d++; else if (code[k] === ')') { d--; if (d === 0) break; } }
    const expr = code.slice(a, k + 1);
    const op = (code.slice(k + 1, k + 10).match(/^\.(test|split|replace)\(/) || [, 'test'])[1];
    out.push({ expr, op });
  }
  return out;
}
const CALLS = lookBehind ? calls() : [];

// The old regexes, in the order of the places in App.jsx (as on main, 6b3ddae).
const OLD = [
  { at: 'dropModelSentences', op: 'split', re: /(?<=[.!;?…])[ \t]+(?=[^\s\d])/ },
  { at: 'stripPressurePhrases', op: 'split', re: /(?<=[.!;?…])[ \t]+(?=[^\s\d])/ },
  { at: 'singularTellMe', op: 'replace', by: 'Πες μου', re: /(?<=(?:^|[.!;?…\u037e\u0387\n])[ \t]*)Π(?:έστε|είτε) μου(?![\p{L}\p{N}])/gu },
  { at: 'detectsIntentWithoutRoads, sentences', op: 'split', re: /(?<=[.;!?])\s+|\n+/ },
  { at: 'detectsIntentWithoutRoads, «σκέφτομαι να»', op: 'test', re: /(?<!δεν )σκεφτομαι να |μαλλον θα / },
  { at: 'declaresClosing, tier A', op: 'test', re: /(?<!(?:^|[^α-ω])(?:δεν|δε|μην|μη|ουτε)(?:\s+[^\s.,;!?…·]+){0,2}\s*)(?<!(?:^|[^α-ω])οχι\s*)(?:κλεινουμε|κλεινω|τελειωσαμε|(?:^|[^α-ω])τα λεμε(?![α-ω])|καλη συνεχεια|καληνυχτα|καλο βραδυ|(?:^|[^α-ω])αντιο(?![α-ω])|(?:^|[^α-ω])μπαι(?![α-ω])|bye|αρκετα για σημερα|ασ το αφησουμε εδω)/ },
  { at: 'detectsClaimAboutUser, «ξέρεις ότι»', op: 'test', re: /(?<!να )ξερεισ οτι[^.;!?]{0,60}(?![^.!]*;)/ },
  { at: 'stripAraDeclarative', op: 'replace', by: '', re: /(?<=(?:^|[.!;?…:\u037e\u0387\n])[ \t]*)Άρα(?![\p{L}\p{N}])(?![^.!;?…\u037e\n]*\d)[^.!;?…\u037e\n]*\.[ \t]*/giu },
  { at: 'detectsSpontaneousShiftRecognition', op: 'test', re: /(?:^|[^α-ωά-ώΐ])(?<!(?:^|[^α-ωά-ώΐ])(?:δεν|δε|μην|μη|ούτε|ουτε)(?:\s+[^\s.,;;!?…·]+){0,2}\s*)(?<!(?:^|[^α-ωά-ώΐ])(?:όχι|οχι)\s*)(τώρα κατάλαβα|τώρα το βλέπω|τώρα ξέρω|αυτό ήταν|τώρα καταλαβαίνω|άλλαξε κάτι|το βλέπω αλλιώς|το βλέπω τώρα|άλλαξε η οπτική|σκέφτομαι διαφορετικά)(?![α-ωά-ώΐ])/i },
  { at: 'detectsSpontaneousCoreRecognition', op: 'test', re: /(?:^|[^α-ωά-ώΐ])(?<!(?:^|[^α-ωά-ώΐ])(?:δεν|δε|μην|μη|ούτε|ουτε)(?:\s+[^\s.,;;!?…·]+){0,2}\s*)(?<!(?:^|[^α-ωά-ώΐ])(?:όχι|οχι)\s*)(ξέρω τι με απασχολεί|καταλαβαίνω τι είναι|νομίζω ξέρω τι|βρήκα τι με κρατάει|αυτό είναι το πρόβλημα|τώρα κατάλαβα|αυτό ήταν|το βρήκα|αυτό ακριβώς|μου βγάζει νόημα|κατάλαβα τι με κρατάει|ξέρω τι με κρατάει|αυτό με κρατάει)(?![α-ωά-ώΐ])/i },
  { at: 'detectOutputViolation, sentences', op: 'split', re: /(?<=[.!?;·])\s*/ },
  { at: 'detectOutputViolation, «είναι αρκετ…»', op: 'test', re: /(?<!δεν )ειναι αρκετ\S* για (?:να|τ)/ },
  { at: 'closing, finalDistillation', op: 'split', re: /(?<=[.!;])\s+/ },
];
// The three places where one letter before is all that mattered: written the usual way of this file, (?:^|[^…]), no helper.
const PLAIN = [
  // UPDATED (31/10/2026, ADR «31 Οκτωβρίου (δ)»): the same check, written the same way, also in stageADismissalGoodbye — count 2.
  { at: 'stageAAfterCrisisText and stageADismissalGoodbye, the numbers', old: /(?<!\d)(?:1018|10306|112)(?!\d)/, text: '/(?:^|\\D)(?:1018|10306|112)(?!\\d)/.test(m.content)', count: 2 },
];
const WORD = { old: w => new RegExp('(?<![a-zα-ω0-9])' + w + '(?![a-zα-ω0-9])', 'i'), text: 'new RegExp("(?:^|[^a-zα-ω0-9])" + escaped + "(?![a-zα-ω0-9])", "i")', count: 2,
  now: w => new RegExp('(?:^|[^a-zα-ω0-9])' + w + '(?![a-zα-ω0-9])', 'i') };

assert('lookBehind is called at ' + OLD.length + ' places in App.jsx — found ' + CALLS.length, CALLS.length === OLD.length);
for (const p of PLAIN) assert(p.at + ': written without a lookbehind, as «' + p.text + '»', code.split(p.text).length - 1 === p.count);
assert('detectsActionFailureStatement / detectsContinuationStatement: the word, written as «(?:^|[^a-zα-ω0-9])» (2 places)', code.split(WORD.text).length - 1 === WORD.count);

// ── 3. The inputs ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const fold = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/([a-zα-ω])\1+/g, '$1').replace(/ς/g, 'σ');
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js')).map(f => path.join(__dirname, f))
  .concat(['e2e_stress_lib.cjs', 'e2e_stage_a.cjs', 'e2e_stage_a_lib.cjs'].map(f => path.join(ROOT, 'scripts', f)).filter(f => fs.existsSync(f)));
const STR = /'((?:[^'\\\n]|\\.){3,600})'|"((?:[^"\\\n]|\\.){3,600})"|`((?:[^`\\]|\\.){3,600})`/g;
const seen = new Set();
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(STR)) {
    const s = (m[1] || m[2] || m[3]).replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\(.)/g, '$1');
    if ((s.match(/\p{L}/gu) || []).length < 2) continue;
    seen.add(s); seen.add(fold(s));
  }
}
let seed = 20261022; // mulberry32: every pair of pieces comes up (a plain LCG's low bits repeat — 149 of 5.184 pairs)
const rnd = n => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) % n; };
const PIECES = ['δεν ', 'δε ', 'μην ', 'μη ', 'ουτε ', 'ούτε ', 'οχι ', 'όχι ', 'Όχι ', 'ΔΕΝ ', 'κλεινω', 'κλεινουμε', 'τα λεμε', 'αντιο', 'μπαι',
  'bye', 'καλη συνεχεια', 'Άρα', 'άρα', 'ΆΡΑ', 'Άραγε', 'βαρεμάρα', 'Πέστε μου', 'Πείτε μου', 'σκεφτομαι να ', 'μαλλον θα ', 'να ', 'ξερεισ οτι ',
  'ειναι αρκετα για να ', 'ειναι αρκετ για τ', 'τώρα κατάλαβα', 'ΤΩΡΑ ΚΑΤΑΛΑΒΑ', 'το βρήκα', 'αυτό ήταν', 'αυτό ακριβώς', 'λέξη', 'το', 'x', 'α', 'Σ',
  '. ', '! ', '; ', '? ', '.', '!', ';', '?', '…', '·', '\u037e', '\u0387', ':', ',', ' ', '  ', '\t', ' \t ', '\n', '\n\n', ' \n ',
  '1018', '112', '10306', '2101234567', '5', '😞', '💀', '\ud83d', '«', '»', '"'];
for (let i = 0; i < 20000; i++) { let s = ''; for (let k = 1 + rnd(12); k > 0; k--) s += PIECES[rnd(PIECES.length)]; seen.add(s); }
seen.add(''); seen.add(' '); seen.add('.'); seen.add('. '); seen.add('\n');
const CORPUS = [...seen];
console.log('inputs: ' + CORPUS.length);

// ── 4. Old and new, side by side ─────────────────────────────────────────────────────────────────────────────────────────────
const run = (f, s) => { try { return JSON.stringify(f(s)); } catch (e) { return 'threw ' + e.message; } };
for (let i = 0; i < OLD.length; i++) {
  const o = OLD[i], c = CALLS[i];
  if (!c) { assert(o.at + ': a lookBehind call in App.jsx', false); continue; }
  let made = null;
  try { made = new Function('lookBehind', 'return ' + c.expr + ';')(lookBehind); } catch (e) { console.log('ERROR — ' + o.at + ': ' + e.message); }
  assert(o.at + ': the place in App.jsx does ' + o.op + ' (' + c.expr.slice(0, 70) + '…)', made && c.op === o.op);
  if (!made) continue;
  const oldF = o.op === 'split' ? s => s.split(o.re) : o.op === 'replace' ? s => s.replace(o.re, o.by) : s => o.re.test(s);
  const newF = o.op === 'split' ? s => made.split(s) : o.op === 'replace' ? s => made.replace(s, o.by) : s => made.test(s);
  const diff = CORPUS.filter(s => run(oldF, s) !== run(newF, s));
  assert(o.at + ': same result as the old regex on all ' + CORPUS.length + ' inputs' + (diff.length ? ' — ' + diff.length + ' differ, first: ' + JSON.stringify(diff[0]).slice(0, 120) + ' old ' + run(oldF, diff[0]).slice(0, 80) + ' new ' + run(newF, diff[0]).slice(0, 80) : ''), diff.length === 0);
}
for (const p of PLAIN) {
  const now = new Function('return ' + p.text.replace('.test(m.content)', ''))();
  const diff = CORPUS.filter(s => p.old.test(s) !== now.test(s));
  assert(p.at + ': same result as the old regex on all inputs' + (diff.length ? ' — first difference ' + JSON.stringify(diff[0]) : ''), diff.length === 0);
}
{
  const words = ['γυμναστηριο', 'διαιτα', 'σχεδιο', 'το', 'να', 'δεν', 'κλεινω', 'α', 'x', 'a\\.b', '112'];
  let bad = null;
  for (const w of words) for (const s of CORPUS) if (WORD.old(w).test(s) !== WORD.now(w).test(s)) { bad = bad || [w, s]; }
  assert('the word (detectsActionFailureStatement / detectsContinuationStatement): same result for ' + words.length + ' words on all inputs' + (bad ? ' — first difference ' + JSON.stringify(bad) : ''), !bad);
}

// ── 4b. The helper itself, beyond the places that use it today: empty matches, emoji under the u flag, overlapping matches ────
// Each line: a lookbehind regex, and the same thing through lookBehind. Inputs: every short string of the pieces below.
const SPEC = [
  [/(?<=a)\s*/g, { after: /a/, match: /\s*/ }],
  [/(?<!b)x*/g, { notAfter: /b/, match: /x*/ }],
  [/(?<=x|a)aa/g, { after: /x|a/, match: /aa/ }],
  // under u, an empty match steps a whole emoji (V8's own lookbehind, failing right before an emoji, tries the middle of it — the
  // standard does not, and lookBehind follows the standard; no place in the app can match empty, or start, inside an emoji)
  [/\p{Extended_Pictographic}*/gu, { notAfter: /(?!)/u, match: /\p{Extended_Pictographic}*/u }],
  [/x*/gu, { notAfter: /(?!)/u, match: /x*/u }],
  [/(?<!a)\p{Extended_Pictographic}+/gu, { notAfter: /a/u, match: /\p{Extended_Pictographic}+/u }],
  [/(?<=\p{Extended_Pictographic})./gu, { after: /\p{Extended_Pictographic}/u, match: /./u }],
  [/(?<=^|\s)a|b+/g, [{ after: /^|\s/, match: /a/ }, { match: /b+/ }]],
];
{
  const P = ['a', 'b', 'x', ' ', '\n', '.', '😞', '\ud83d'];
  const short = [''];
  for (let n = 1; n <= 5; n++) for (let k = 0; k < Math.pow(P.length, n); k += n > 3 ? 7 : 1) { let s = '', v = k; for (let j = 0; j < n; j++) { s += P[v % P.length]; v = Math.floor(v / P.length); } short.push(s); }
  for (const [re, spec] of SPEC) {
    const one = new RegExp(re.source, re.flags.replace('g', ''));
    let m = null;
    try { m = lookBehind(...[].concat(spec)); } catch (e) {}
    const bad = !m ? ['no matcher'] : short.filter(s =>
      run(x => x.split(re), s) !== run(x => m.split(x), s) || run(x => x.replace(re, '<>'), s) !== run(x => m.replace(x, '<>'), s) || one.test(s) !== m.test(s));
    assert('the helper, as the standard: ' + re + ' — split, replace and test on ' + short.length + ' short strings' + (bad.length ? ' — ' + bad.length + ' differ, first ' + JSON.stringify(bad[0]) : ''), bad.length === 0);
  }
}

// ── 5. Fast enough on the longest message the app sends (4.000 characters) ───────────────────────────────────────────────────
if (CALLS.length) {
  const long = Array.from({ length: 4000 }, (_, i) => PIECES[(i * 7) % PIECES.length]).join('').slice(0, 4000);
  const t0 = Date.now();
  for (const c of CALLS) { const m = new Function('lookBehind', 'return ' + c.expr + ';')(lookBehind); m.test(long); m.split(long); m.replace(long, ''); }
  const ms = Date.now() - t0;
  assert('every place, on a 4.000-character text: test, split and replace in ' + ms + ' ms (< 1500)', ms < 1500);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
