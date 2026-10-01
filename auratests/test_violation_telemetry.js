// ── ΟΙ ΜΕΤΡΗΤΕΣ ΠΑΡΑΒΙΑΣΕΩΝ ΜΠΑΙΝΟΥΝ ΣΤΟ EXPORT ΤΗΣ ΤΗΛΕΜΕΤΡΙΑΣ ──────────────────────────────────────────
//
// WHY. detectOutputViolation counts EVALUATION / ADVICE / ROLE / ROAD_MAP_MISSING / ADVICE_CASCADE per
// session in violationCounts — but that ref was read ONLY by the ?debug=1 on-screen panel and the console.
// The exported telemetry (session_completed) did not carry it. So the single most basic rule of the product
// (No-Evaluation / No-Advice) was measured on every reply and never reached the file the founder exports from
// a phone. This pins that the five counts now travel with session_completed — COUNTS ONLY, no reply text,
// no consumer.
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
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function extract(name) { const s = raw.indexOf('function ' + name + '('); return s < 0 ? null : raw.slice(s, raw.indexOf('\n}', s) + 2); }

const tele = CODE.slice(CODE.indexOf('recordTelemetry("session_completed"'));
const block = tele.slice(0, tele.indexOf('});'));
assert('NON-VACUITY: the session_completed block is findable', CODE.indexOf('recordTelemetry("session_completed"') > 0 && block.length > 200);

// Every category detectOutputViolation can return must have a field, so a new category cannot be silently left out.
const vsrc = extract('detectOutputViolation');
const cats = [...new Set([...(vsrc || '').matchAll(/return "([A-Z_]+)"/g)].map(m => m[1]))];
assert('NON-VACUITY: detectOutputViolation returns the five known categories (' + cats.join(', ') + ')',
  ['EVALUATION', 'ADVICE', 'ROLE', 'ROAD_MAP_MISSING', 'ADVICE_CASCADE'].every(c => cats.includes(c)));
const camel = c => 'viol' + c.toLowerCase().split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
for (const c of cats) {
  const f = camel(c);
  assert('session_completed carries ' + f + ' reading violationCounts.current.' + c + ', capped at 9999',
    new RegExp(f + ':\\s*Math\\.min\\(9999,\\s*\\(?violationCounts\\.current\\.' + c + '\\s*\\|\\|\\s*0\\)?\\)').test(block));
  assert(f + ' is a legal telemetry key (letters only, ≤24 chars), so recordTelemetry will not drop it', /^[a-zA-Z]{1,24}$/.test(f));
}

// Run the REAL recordTelemetry on the exact field shape: the integers must survive.
const rsrc = extract('recordTelemetry');
assert('recordTelemetry is defined', !!rsrc);
if (rsrc) {
  const g = { window: undefined };
  const rt = new Function('window', rsrc + '\nreturn recordTelemetry;')(undefined);
  const rec = rt('session_completed', Object.fromEntries(cats.map((c, i) => [camel(c), i + 1])));
  assert('every violation field survives recordTelemetry as an integer', rec && cats.every((c, i) => rec[camel(c)] === i + 1));
  const bad = rt('session_completed', { violEvaluation: 'Καλή επιλογή' });
  assert('and a string in that field would be DROPPED (counts only, by construction)', bad && !('violEvaluation' in bad));
}

assert('COUNTS ONLY: no reply text travels with them',
  !/viol[A-Z]\w*:[^\n]*(content|text|reply|message)/i.test(block));
assert('violationCounts is reset per session',
  /violationCounts\.current\s*=\s*\{\}/.test(CODE));
assert('NO CONSUMER: nothing reads the violation counts to decide anything (only the panel, the telemetry and the tally itself)',
  !/violationCounts\.current[^\n]*(displayText|setInput|setMessages)/.test(CODE) &&
  !/if\s*\([^)]*violationCounts\.current/.test(CODE));
assert('the telemetry fields are not mentioned in the prompt', !/violEvaluation|violAdvice|violRole/.test(PROMPT));
assert('the debug panel still reads the same ref (not replaced)', /Object\.keys\(violationCounts\.current\)\.length === 0/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
