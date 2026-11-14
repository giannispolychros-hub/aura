#!/usr/bin/env node
// AURA — the A/B of Stage A against the old flow (?stageA=0), checked with the FAKE model ($0, no key, no call to Anthropic).
// A TOOL FOR COMPARISON ONLY: ?stageA=0 is never for real users. John, 14/11/2026, branch quality-diagnostics. Unit tests:
// auratests/test_ab_compare.js. This runs the stress tool itself on 201–204 (both flows, in a real browser, the fake model answering
// with usage shaped like real calls: --fake-cost realistic, or worst) and checks, on what it wrote:
//  (1) the four sessions ran to the exit line, one Stage A and one old flow per pair, as the key says — seen in the requests themselves
//      (the Stage A marker in every main request of a Stage A session, in none of the old flow's); whether the old flow asked First-WHY is
//      written down (it asks only when the 1st message needs it)
//  (2) no safety path in either flow: no crisis or support request, no SAFETY stage, no help line on the screen, no safety finding
//  (3) the blind file against the key: every pair's A and B are the replies of the flows the key names (the fake replies carry a token
//      of their flow — the fake model only); both orders occur; no word that names a flow, no session number; the closing apart
//  (4) the money: the run's cap holds every call (no «ΣΤΑΜΑΤΗΣΕ»), and what was spent
// Usage: node scripts/ab_fake_check.cjs [--fake-cost realistic|worst] [--out <folder in the temp directory>]
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const REPO = path.join(__dirname, '..');
const SL = require('./e2e_stress_lib.cjs');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const COST = arg('--fake-cost', 'realistic');
const OUT = arg('--out', fs.mkdtempSync(path.join(os.tmpdir(), 'aura_ab_fake_')));
let passed = 0, failed = 0;
const ok = (label, cond) => { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } };

const env = Object.assign({}, process.env); delete env.ANTHROPIC_API_KEY; delete env.ANTHROPIC_API_KEY2; // never a key: the fake model only
const r = cp.spawnSync(process.execPath, [path.join(REPO, 'scripts', 'e2e_stage_a.cjs'), '--stress', '--sessions', '201,202,203,204', '--budget', '1.8',
  '--parallel', '1', '--fake-cost', COST, '--out', OUT], { cwd: REPO, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
ok('the stress tool ran with the fake model and ended (exit ' + r.status + ')', r.status === 0);
const read = f => { try { return fs.readFileSync(path.join(OUT, f), 'utf8'); } catch (e) { return null; } };
const rep = JSON.parse(read('stress-report.json') || '{"sessions":[],"meta":{}}'), md = read('ab-blind.md') || '', key = JSON.parse(read('ab-key.json') || '{}');
const main = read('stress-report.md') || '';
ok('the run wrote ab-blind.md, ab-key.json and the stress report', !!md && !!key.pairs && !!main);
const S = rep.sessions || [], M = rep.meta || {};
const whyNotes = [];
const flowOf = {}; for (const [id, name] of Object.entries(key.sessions || {})) flowOf[id] = name === SL.AB_FLOW_NAMES.stageA ? 'stageA' : name === SL.AB_FLOW_NAMES.old ? 'old' : '?';

// (1)
ok('(1) four sessions, 201–204', S.map(s => s.label).sort().join() === '201,202,203,204');
for (const base of [146, 152]) {
  const two = S.filter(s => s.persona && s.persona.ab === base);
  ok('(1) ' + base + ': one Stage A and one old flow, as the key says', two.length === 2 && two.map(s => flowOf[s.label]).sort().join() === 'old,stageA');
}
for (const s of S) {
  const mains = (s.calls || []).filter(c => c.kind === 'main'), flow = flowOf[s.label];
  const marked = mains.filter(c => (c.notes || []).includes('STAGE_A_MARKER')).length;
  ok('(1) ' + s.label + ': all 9 messages typed, the last the exit line', (s.typed || []).length === 9 && s.typed[8] === SL.EXIT_TEXT);
  ok('(1) ' + s.label + ': the requests are of the flow the key names (' + flow + '; Stage A marker in ' + marked + ' of ' + mains.length + ' main requests)',
    mains.length > 0 && (flow === 'stageA' ? marked === mains.length : marked === 0));
  // the old flow asks First-WHY only when the 1st message needs it (needsFirstWhy): written down, not assumed. Then the model has no reply
  // to the 1st message there, and the blind file leaves that message out of the pairs.
  if (flow === 'old') whyNotes.push(s.label + ': First-WHY ' + ((s.calls || []).some(c => c.typed === 1 && c.kind === 'main') ? 'όχι' : 'ναι'));
}
// (2)
for (const s of S) {
  const shown = (s.turns || []).filter(t => t.who === 'aura').map(t => t.text).join('\n');
  ok('(2) ' + s.label + ': no safety path — no crisis or support request, no SAFETY stage, no help line on the screen, no safety finding',
    !(s.calls || []).some(c => c.kind === 'supportive' || c.stage === 'SAFETY') && !/(?:^|\D)(?:1018|10306|15900|1056|112)(?!\d)/.test(shown) &&
    !((s.checks || {}).safety || []).length && !(s.crisisTurns || []).length && !s.dangerAt);
}
// (3)
const blocks = md.split(/\n(?=### )/);
let match = 0, aIsStageA = 0;
for (const x of key.pairs || []) {
  const blk = blocks.find(b => b.startsWith('### Σενάριο ' + x.scenario + ' · ζεύγος ' + x.pair + ' ')) || '';
  const a = (blk.match(/\*\*A\*\*\n([\s\S]*?)\n\n\*\*B\*\*/) || [])[1] || '', b = (blk.match(/\*\*B\*\*\n([\s\S]*?)(?:\n\n|$)/) || [])[1] || '';
  const fa = (a.match(/\[ψ:(\d)\]/g) || []), fb = (b.match(/\[ψ:(\d)\]/g) || []);
  const want = name => name === SL.AB_FLOW_NAMES.stageA ? '[ψ:1]' : '[ψ:0]';
  if (fa.length && fb.length && fa.every(t => t === want(x.A)) && fb.every(t => t === want(x.B))) match++;
  if (x.A === SL.AB_FLOW_NAMES.stageA) aIsStageA++;
}
const n = (key.pairs || []).length;
ok('(3) every pair\'s A and B are the replies of the flows the key names (' + match + '/' + n + ' pairs)', n > 0 && match === n);
ok('(3) both orders occur: Stage A is A in ' + aIsStageA + ' of ' + n + ' pairs', aIsStageA > 0 && aIsStageA < n);
ok('(3) no word that names a flow and no session number in the blind file', !/στάδιο\s*α|παλι[άα]\s*ρο[ήη]|stageA|closed|\bold\b|first-why|προεπιλογ/i.test(md) && !/\b20[1-4]\b/.test(md));
ok('(3) the closing is apart (Γ / Δ), and the key\'s closing names both flows', /## Κλείσιμο/.test(md) && (key.closing || []).length === 2 &&
  key.closing.every(c => [c.Γ, c.Δ].sort().join() === [SL.AB_FLOW_NAMES.old, SL.AB_FLOW_NAMES.stageA].sort().join()));
ok('(3) the main report says, right under its title, to read the blind file first', main.split('\n').slice(0, 4).join('\n').includes(SL.AB_REPORT_NOTE));
// (4)
const calls = S.reduce((x, s) => x + (s.calls || []).length, 0);
ok('(4) the $1.8 cap held every call: no «ΣΤΑΜΑΤΗΣΕ», spent $' + Number(M.spent || 0).toFixed(2) + ' over ' + calls + ' AURA calls (fake usage: ' + COST + ')',
  !M.stopped && !S.some(s => (s.notes || []).some(x => /ΣΤΑΜΑΤΗΣΕ|όριο δαπάνης/.test(x))) && Number(M.spent) <= 1.8);
console.log('NOTE — old flow, ' + whyNotes.join(' · '));
console.log('NOTE — pairs: ' + n + ' · AURA calls: ' + calls + ' (' + S.map(s => s.label + ' ' + (s.calls || []).length).join(', ') + ') · spent $' +
  Number(M.spent || 0).toFixed(2) + ' · out: ' + OUT);
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
