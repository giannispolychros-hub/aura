// AURA — the fingerprints of the app's own system prompts, for api/aura.js (ADR «17 Οκτωβρίου (β)»).
// The server accepts only these first blocks: AURA_CORE_PERSONALITY exactly, or a block that starts with SYSTEM_SUPPORTIVE (crisis) or
// SYSTEM_TERMINATION (closing). This script reads them from src/App.jsx and writes their length and SHA-256 into api/aura.js, between
// the BEGIN/END markers — never the prompt text itself. It runs in «npm run build» (Vercel's build command), so a prompt change is
// picked up with no hand edit; the committed values are kept in step by auratests/test_api_prompt_guard.js.
// It also writes (ADR «4 Νοεμβρίου (β)») the fingerprints of the five per-mode texts that may follow the core prompt, and the list of
// how the app's own per-turn notes begin («openings»): api/aura.js takes after the fixed prompt only blocks that begin that way.
//   node scripts/gen_prompt_fingerprints.cjs           write
//   node scripts/gen_prompt_fingerprints.cjs --check   only say whether api/aura.js is up to date (exit 1 if not)
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'src', 'App.jsx');
const API = path.join(ROOT, 'api', 'aura.js');
const BEGIN = '// BEGIN PROMPT FINGERPRINTS';
const END = '// END PROMPT FINGERPRINTS';

// The runtime value of a prompt constant: its template literal, evaluated exactly as JavaScript would (escapes, line endings).
function literal(src, name) {
  const head = 'const ' + name + ' = `';
  const a = src.indexOf(head);
  if (a < 0) throw new Error(name + ' not found in src/App.jsx');
  const s = a + head.length;
  const e = src.indexOf('`;', s);
  const raw = src.slice(s, e);
  if (raw.includes('${')) throw new Error(name + ' has an ${…} expression: its fingerprint cannot be computed here');
  return Function('return `' + raw + '`;')();
}
function fingerprint(text) {
  return { length: text.length, sha256: crypto.createHash('sha256').update(text, 'utf8').digest('hex') };
}
// The five per-mode texts: `const NAME = AURA_CORE_PERSONALITY + \`…\`;` — the part after the core prompt, as the app sends it at the
// start of the second block.
const MODE_TEXTS = ['SYSTEM_LENS_SIMPLIFY', 'SYSTEM_LENS_CHALLENGE', 'SYSTEM_LENS_PERSPECTIVE', 'SYSTEM_LENS_EXPLORE', 'SYSTEM_COMPRESSION'];
function modeText(src, name) {
  const head = 'const ' + name + ' = AURA_CORE_PERSONALITY + `';
  const a = src.indexOf(head);
  if (a < 0) throw new Error(name + ' not found in src/App.jsx');
  const s = a + head.length;
  const raw = src.slice(s, src.indexOf('`;', s));
  if (raw.includes('${')) throw new Error(name + ' has an ${…} expression: its fingerprint cannot be computed here');
  return Function('return `' + raw + '`;')();
}
// How each per-turn note of the app begins: «[» and the next 9–18 characters (up to the first «]», quote, «$», «\\» or line end), from
// the app's own code with the fixed prompts left out. A note may begin after an escaped line break («\\n[»), right after a quote, or on a
// line of its own inside a template; a console.* message is not a note. Also the few notes that begin without «[» («MISFIRE RECOVERY:»).
function openingsFor(src) {
  let code = src;
  for (const n of ['AURA_CORE_PERSONALITY', 'SYSTEM_SUPPORTIVE', 'SYSTEM_TERMINATION']) { const t = src.indexOf('const ' + n + ' = `'); const e = src.indexOf('`;', t); code = code.replace(src.slice(t, e), ''); }
  for (const n of MODE_TEXTS) { const t = src.indexOf('const ' + n + ' = AURA_CORE_PERSONALITY + `'); const e = src.indexOf('`;', t); code = code.replace(src.slice(t, e), ''); }
  const out = new Set();
  const take = (re) => { for (const m of code.matchAll(re)) { if (/console\.\w+\(\s*$/.test(code.slice(Math.max(0, m.index - 24), m.index))) continue; out.add('[' + m[1]); } };
  take(/(?:\\n|[`'"])\[([A-ZΑ-Ω][^\]\n`'"$\\]{8,17})/g);
  take(/^\[([A-ZΑ-Ω][^\]\n`'"$\\]{8,17})/gm);
  for (const m of code.matchAll(/\\n\\n([A-Z][A-Z \-]{6,30}:)/g)) out.add(m[1]);
  return [...out].sort();
}
function blockFor(src) {
  const fp = {
    core: fingerprint(literal(src, 'AURA_CORE_PERSONALITY')),
    supportive: fingerprint(literal(src, 'SYSTEM_SUPPORTIVE')),
    termination: fingerprint(literal(src, 'SYSTEM_TERMINATION')),
  };
  const row = k => '  ' + k + ': { length: ' + fp[k].length + ', sha256: "' + fp[k].sha256 + '" },';
  const lenses = MODE_TEXTS.map(n => fingerprint(modeText(src, n)));
  return [BEGIN + ' — written by scripts/gen_prompt_fingerprints.cjs from src/App.jsx («npm run build»). Do not edit by hand.',
    'const PROMPT_FINGERPRINTS = {', row('core'), row('supportive'), row('termination'),
    '  // the per-mode texts that may follow the core prompt (' + MODE_TEXTS.join(', ') + ')',
    '  modes: [', ...lenses.map(l => '    { length: ' + l.length + ', sha256: "' + l.sha256 + '" },'), '  ],',
    '  // how the app\'s own per-turn notes begin',
    '  openings: [', ...openingsFor(src).map(o => '    ' + JSON.stringify(o) + ','), '  ],',
    '};', END].join('\n');
}
module.exports = { openingsFor, modeText, MODE_TEXTS };

if (require.main !== module) return;

const src = fs.readFileSync(APP, 'utf8');
const api = fs.readFileSync(API, 'utf8');
const a = api.indexOf(BEGIN), b = api.indexOf(END);
if (a < 0 || b < a) { console.error('api/aura.js: the PROMPT FINGERPRINTS markers are missing'); process.exit(1); }
const next = api.slice(0, a) + blockFor(src) + api.slice(b + END.length);
if (process.argv.includes('--check')) {
  if (next === api) { console.log('api/aura.js: prompt fingerprints up to date'); process.exit(0); }
  console.log('api/aura.js: prompt fingerprints OUT OF DATE — run: node scripts/gen_prompt_fingerprints.cjs'); process.exit(1);
}
if (next !== api) fs.writeFileSync(API, next);
console.log('api/aura.js: prompt fingerprints ' + (next === api ? 'already up to date' : 'written'));
