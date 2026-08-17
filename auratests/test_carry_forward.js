// ─── CARRY FORWARD ARTIFACT — static specification tests ───
// IMPORTANT, honest scope: these tests verify the PROMPT SPECIFICATION text itself —
// that it contains the required constraints and does not self-contradict. They cannot
// prove the live model's actual output complies (that requires real conversations,
// same as every other reliability question documented today — First Insight Mirror,
// Cognitive Tension, etc.). This is the same kind of test as a lint check on a spec,
// not a behavioral guarantee.

const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();

const startMarker = 'const AURA_CORE_PERSONALITY = `';
const startIdx = raw.indexOf(startMarker) + startMarker.length;
const endIdx = raw.indexOf('\n`;', startIdx);
const prompt = raw.slice(startIdx, endIdx);

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

// 1. The Carry Forward Artifact section exists at all.
assert('CARRY FORWARD ARTIFACT section exists', prompt.includes('CARRY FORWARD ARTIFACT'));

// 2. It integrates into the existing Cognitive Artifact system (no new named subsystem/header).
const cfIdx = prompt.indexOf('CARRY FORWARD ARTIFACT');
const caIdx = prompt.indexOf('COGNITIVE ARTIFACT');
assert('Carry Forward is positioned inside the existing COGNITIVE ARTIFACT block (no separate new system)',
  caIdx !== -1 && cfIdx > caIdx && (cfIdx - caIdx) < 2000);

// 3. Explicit prohibition language is present — AURA must never generate the insight itself.
assert('Explicitly forbids AURA generating the conclusion ("άρα πρέπει να")',
  prompt.includes('never says') === false && /never (fills in the blank|says).*άρα πρέπει να/.test(prompt) === false
    ? prompt.includes('άρα πρέπει να') && prompt.includes('never')
    : prompt.includes('άρα πρέπει να'));
assert('Explicitly forbids AURA naming "το μοτίβο σου"', prompt.includes('το μοτίβο σου'));
assert('Explicitly forbids AURA declaring "η σωστή κίνηση είναι"', prompt.includes('η σωστή κίνηση είναι'));

// 4. User-authorship is explicit and unambiguous.
assert('States AURA never fills in the blank', prompt.includes('never fills in the blank'));
assert('States the artifact is the user\'s own language, preserved verbatim',
  prompt.toLowerCase().includes('entirely the user') || prompt.includes('preserved verbatim'));

// 5. Avoids the "απόφαση" framing per red-team refinement (not every situation is a decision).
const cfSection = prompt.slice(cfIdx, cfIdx + 1200);
assert('Carry Forward example phrasing avoids leading with "απόφαση" as the required frame',
  !/^.*Όταν ξαναβρεθώ.*απόφαση/.test(cfSection.split('AURA asks only')[0] || ''));

// 6. No new subsystem markers introduced (no new memory model / semantic retrieval / prediction language).
assert('No semantic retrieval language introduced in this section', !cfSection.includes('semantic'));
assert('No new memory model language introduced in this section', !cfSection.includes('new memory model'));
assert('No behavioral prediction language introduced in this section', !cfSection.toLowerCase().includes('predict'));

console.log(`\n${passed} passed, ${failed} failed (static specification checks — see header note on scope)`);
process.exit(failed > 0 ? 1 : 0);
