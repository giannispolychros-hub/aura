// AURA — JOHN'S DECISIONS, 18/10/2026 (ADR «18 Οκτωβρίου»), on the open points of the reports, before the real model:
//   1  CONSOLE: the diagnostic lines that printed AURA's text ([AURA outcome], [AURA VIOLATION] …, [AURA RAW]) print numbers only —
//      the length; nothing else in their logic changes.
//   2  «Δεν ξέρω ακόμα» under «Τότε ποιο είναι το πρώτο μικρό κομμάτι του;»: keeps the step as first written, goes on to «Πότε;»,
//      smaller_piece_written = 0.
//   3  «Αντίγραψε τη ρίζα» / «Κατέβασε τη ρίζα» → «Αντίγραψε την κάρτα» / «Κατέβασε την κάρτα».
//   4  TESTER_INVITATION.md: the sentence about the "memory" says what the code does.
//   5  360×640: each question of the step, «Δεν ξέρω ακόμα» and the box seen together, the root still seen after «Ναι» — John chose
//      a smaller box while a question of the step is open — «Α», ~2 lines instead of ~5 (the input area sits 2% of the screen over
//      the messages, so ~3 lines left the button half covered); the conversation's box is unchanged.
//   6  The intro: «ΞΕΚΙΝΑ» never lies on top of text — it follows the text instead of sticking to the bottom over it.
//   7  The intro: the emphasised words stand out again, in gold, and the rest stays bright.
// The phone-size checks (5, 6) are measured in the browser (scripts/e2e_stage_a.cjs, ST13 and TX1); here, the code that makes them.
const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name) {
  const C = CODE;
  const a = C.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = C.indexOf('(', a), depth = 0;
  for (; k < C.length; k++) { if (C[k] === '(') depth++; else if (C[k] === ')') { depth--; if (depth === 0) break; } }
  const b = C.indexOf('{', k); depth = 0;
  for (let j = b; j < C.length; j++) { if (C[j] === '{') depth++; else if (C[j] === '}') { depth--; if (depth === 0) return C.slice(a, j + 1); } }
  return null;
}
const textsSrc = (() => { const a = CODE.indexOf('const STAGE_A_TEXTS = {'); return a >= 0 ? CODE.slice(a, CODE.indexOf('\n};', a) + 3) : ''; })();
const NAMES = ['initialStageAState', 'stageAStep', 'stageAStepTelemetry', 'buildStepCardText', 'stageAStepOpen'];
let F = {};
try {
  F = new Function(textsSrc + '\n' + NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {STAGE_A_TEXTS,' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR: ' + e.message); }
const T = (name, ...args) => { try { return F[name](...args); } catch (e) { return 'THREW: ' + e.message; } };
const TX = F.STAGE_A_TEXTS || {};
const UI = CODE.slice(CODE.indexOf('const MessageBubble = memo('));
const css = (() => { const a = raw.indexOf('<style>{`'), b = raw.indexOf('`}</style>', a); return a >= 0 && b > a ? raw.slice(a, b) : ''; })();

// ── 1. Console: numbers only ─────────────────────────────────────────────────────────────────────────────────────────
{
  const calls = [];
  const re = /console\.(log|warn|info|error|debug)\(/g; let m;
  while ((m = re.exec(CODE))) {
    let k = m.index + m[0].length, depth = 1;
    for (; k < CODE.length && depth; k++) { if (CODE[k] === '(') depth++; else if (CODE[k] === ')') depth--; }
    calls.push(CODE.slice(m.index, k));
  }
  assert('CONSOLE: the console lines are found', calls.length >= 15);
  // the text of a reply may appear in a console line only as its length
  const asLength = c => c.replace(/String\(rawTextWithTags \|\| ''\)(?:\.replace\([^)]*\))?(?:\.trim\(\))?\.length/g, '#')
    .replace(/_clean\.trim\(\)\.length/g, '#').replace(/_threeBeat\.found\.trim\(\)\.length/g, '#');
  const leaks = calls.filter(c => /\.slice\(/.test(c) || /rawTextWithTags|_clean\b|_threeBeat|_saText|userText|\.content\b|\btext\b/.test(asLength(c).replace(/'[^']*'/g, '')));
  assert('CONSOLE: no console line prints a reply\'s (or the user\'s) text — at most its length' + (leaks.length ? ' — left: ' + leaks.map(c => c.slice(0, 70)).join(' ‖ ') : ''), !leaks.length);
  const lines = ['[AURA outcome]', '[AURA RAW]', '[AURA VIOLATION] UNSOURCED_OPTIONS', '[AURA VIOLATION] USER_CLAIM', '[AURA VIOLATION] UNVERIFIED_FOUND',
    '| First-WHY turn |'];
  assert('CONSOLE: the lines that printed text now print the length (outcome, RAW, the violations, the First-WHY ones)',
    lines.every(l => calls.some(c => c.includes(l) && /length/.test(c))) && calls.filter(c => /\[AURA VIOLATION\]/.test(c) && /length/.test(c)).length >= 7);
  assert('CONSOLE: nothing else changed in their logic — the counters are still counted where the lines are', /violationCounts\.current\[viol\] = \(violationCounts\.current\[viol\] \|\| 0\) \+ 1/.test(CODE) &&
    /unsourcedOptionOffers\.current \+= 1;\s*\n\s*console\.warn\('\[AURA VIOLATION\] UNSOURCED_OPTIONS/.test(CODE) && /claimsAboutUser\.current \+= 1;\s*\n\s*console\.warn\('\[AURA VIOLATION\] USER_CLAIM/.test(CODE));
}

// ── 2. «Δεν ξέρω ακόμα» under the smaller-piece question ─────────────────────────────────────────────────────────────
{
  const card = Object.assign(T('initialStageAState'), { phase: 'card', found: 'Ότι φοβάμαι', knew: 'Δεν ξέρω αν πρέπει να φύγω' });
  const y = T('stageAStep', card, { type: 'yes', riskKind: 0, step: true });
  const a = T('stageAStep', y, { type: 'stepText', text: 'Να αλλάξω δουλειά' });
  const big = T('stageAStep', a, { type: 'fitsNo' });
  const u = T('stageAStep', big, { type: 'smallerUnknown' });
  assert('SMALLER (2): «Δεν ξέρω ακόμα» keeps the step as first written and goes on to «Πότε;»', u && u.phase === 'when' && u.step === 'Να αλλάξω δουλειά');
  assert('SMALLER (2): smaller_piece_written is 0 (a typed smaller piece stays 1)', u.smallerWritten === 0 &&
    T('stageAStep', big, { type: 'smallerText', text: 'Να γράψω το βιογραφικό' }).smallerWritten === 1);
  assert('SMALLER (2): only under that question — anywhere else it does nothing',
    ['step', 'fits', 'when', 'card', 'clarity', 'stopped'].every(p => { const z = Object.assign({}, big, { phase: p }); return T('stageAStep', z, { type: 'smallerUnknown' }) === z; }));
  const w = T('stageAStep', u, { type: 'whenText', text: 'Αύριο' });
  const tel = T('stageAStepTelemetry', u, w, { type: 'whenText' });
  assert('SMALLER (2): the numbers, once, at the end — step_written 1, step_fits_day 0, smaller_piece_written 0, when_written 1',
    JSON.stringify(tel) === JSON.stringify([{ event: 'step_written', fields: { value: 1 } }, { event: 'step_fits_day', fields: { value: 0 } },
      { event: 'smaller_piece_written', fields: { value: 0 } }, { event: 'when_written', fields: { value: 1 } }]));
  assert('SMALLER (2): the card says what the user first wrote', T('buildStepCardText', w.knew, false, w.found, w.step, w.when).includes('Τι θα κάνεις: «Να αλλάξω δουλειά»'));
  assert('SMALLER (2): a question that did not appear still has no value (the size answered «Ναι»)', (() => {
    const yes = T('stageAStep', a, { type: 'fitsYes' }), end = T('stageAStep', yes, { type: 'whenText', text: 'x' });
    return !T('stageAStepTelemetry', yes, end, { type: 'whenText' }).some(r => r.event === 'smaller_piece_written'); })());
  assert('SMALLER (2): the button is under the step question, the smaller-piece question and «Πότε;», each with its own event',
    /\(stageAPhase === "step" \|\| stageAPhase === "smaller" \|\| stageAPhase === "when"\)/.test(UI) &&
    /\{ step: "stepUnknown", smaller: "smallerUnknown", when: "whenUnknown" \}\[stageAPhase\]/.test(UI));
}

// ── 3. The labels ─────────────────────────────────────────────────────────────────────────────────────────────────────
assert('LABELS (3): «Αντίγραψε την κάρτα» / «Κατέβασε την κάρτα»', TX.copy === 'Αντίγραψε την κάρτα' && TX.download === 'Κατέβασε την κάρτα');
assert('LABELS (3): the old labels are gone from the screen', !/"Αντίγραψε τη ρίζα"|"Κατέβασε τη ρίζα"/.test(CODE));

// ── 4. The invitation ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const INVF = findFile(['/../TESTER_INVITATION.md', '/TESTER_INVITATION.md']);
  const inv = INVF ? fs.readFileSync(INVF, 'utf8') : '';
  assert('INVITATION (4): the "memory" sentence, word for word', inv.includes('Τη "μνήμη" μην την ανοίξεις: αν την ανοίξεις, κρατά στο κινητό σου κομμάτια από όσα έγραψες, και μπορεί να τα ξαναστείλει στο μοντέλο σε επόμενη συνεδρία.'));
  assert('INVITATION (4): the old sentence is gone', !inv.includes('κρατά λίγες φράσεις σου στο κινητό σου (ποτέ σε server)'));
}

// ── 5. The box while a question of the step is open ──────────────────────────────────────────────────────────────────
{
  assert('BOX (5): while a question of the step is open the box is smaller (~2 lines, John\'s «Α»)', /\.textarea\.textarea-step\{max-height:88px;?\}/.test(css));
  assert('BOX (5): only then — the conversation\'s box keeps its size', /\.textarea\{[^}]*max-height:160px/.test(css) &&
    /className=\{`textarea\$\{stageAActive\.current && stageAStepOpen\(stageAPhase\) \? " textarea-step" : ""\}`\}/.test(UI));
}

// ── 6. «ΞΕΚΙΝΑ» never over text ──────────────────────────────────────────────────────────────────────────────────────────
{
  const rule = (/\.intro-actions\{[^}]*\}/.exec(css) || [''])[0];
  assert('INTRO (6): the buttons follow the text — no longer stuck to the bottom over it', rule.length > 10 && !/sticky/.test(rule));
}

// ── 7. The emphasised words of the intro ──────────────────────────────────────────────────────────────────────────────
{
  const a = UI.indexOf('<div className="intro-screen">'), intro = a >= 0 ? UI.slice(a, UI.indexOf('<div className="intro-actions">', a)) : '';
  const gold = '#ffd560';
  assert('INTRO (7): «άλλη ρίζα» and «τι κερδίζεις, τι πληρώνεις.» in gold', intro.includes(`<span style={{color:"${gold}"}}>άλλη ρίζα</span>`) &&
    intro.includes(`<span style={{color:"${gold}"}}>τι κερδίζεις, τι πληρώνεις.</span>`));
  assert('INTRO (7): «Στόχος είναι να βγεις από το χάος του μυαλού σου.» in gold', new RegExp(`color:"${gold}"\\}\\}>Στόχος είναι να βγεις από το χάος του μυαλού σου\\.`).test(intro));
  assert('INTRO (7): «δική σου ερώτηση» and the last line stay gold', intro.includes(`<span style={{color:"${gold}"}}>δική σου ερώτηση</span>`) && /color:"#ffd560",fontFamily:"'Cormorant Garamond',serif",fontSize:"20px"/.test(intro));
  const plain = (intro.match(/<div style=\{\{marginBottom:"\d+px",color:"(#[0-9a-f]{6})"\}\}>/g) || []).map(x => /#[0-9a-f]{6}/.exec(x)[0]);
  const lum = h => { const v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  assert('INTRO (7): the rest stays bright — not dim again', plain.length >= 4 && plain.every(h => lum(h) >= 200) && /\.intro-text\{[^}]*color:#fffaef/.test(css));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
