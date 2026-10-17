// AURA — the fingerprints of the app's own system prompts, for api/aura.js (ADR «17 Οκτωβρίου (β)»).
// The server accepts only these first blocks: AURA_CORE_PERSONALITY exactly, or a block that starts with SYSTEM_SUPPORTIVE (crisis) or
// SYSTEM_TERMINATION (closing). This script reads them from src/App.jsx and writes their length and SHA-256 into api/aura.js, between
// the BEGIN/END markers — never the prompt text itself. It runs in «npm run build» (Vercel's build command), so a prompt change is
// picked up with no hand edit; the committed values are kept in step by auratests/test_api_prompt_guard.js.
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
function blockFor(src) {
  const fp = {
    core: fingerprint(literal(src, 'AURA_CORE_PERSONALITY')),
    supportive: fingerprint(literal(src, 'SYSTEM_SUPPORTIVE')),
    termination: fingerprint(literal(src, 'SYSTEM_TERMINATION')),
  };
  const row = k => '  ' + k + ': { length: ' + fp[k].length + ', sha256: "' + fp[k].sha256 + '" },';
  return [BEGIN + ' — written by scripts/gen_prompt_fingerprints.cjs from src/App.jsx («npm run build»). Do not edit by hand.',
    'const PROMPT_FINGERPRINTS = {', row('core'), row('supportive'), row('termination'), '};', END].join('\n');
}

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
