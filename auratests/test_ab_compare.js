// AURA — THE STRESS TOOL: an A/B of the SAME app, Stage A (the default) against the old flow (?stageA=0) (John, 14/11/2026, branch
// quality-diagnostics). A TOOL FOR COMPARISON ONLY: ?stageA=0 is never for real users. Only scripts/ and tests change; src/ and api/ do not.
// Two ordinary users of the mechanism set (146, 152): no risk, and not one of their fixed messages lights a safety detector of the app.
// Their first 8 fixed messages, then the tool's own EXIT_TEXT, once in each flow: 4 sessions, 201–204. Which number of a pair is the old
// flow is drawn at random each run and written ONLY to the key (ab-key.json). The blind file (ab-blind.md) pairs AURA's replies to the
// same user message with hidden labels A / B, drawn again for every pair; the closing is apart, with labels of its own (Γ / Δ).
//  (Α) the four sessions: the right messages, one old flow per pair, nothing in a name, no risk, no detector lit (in either flow the
//      detectors read the same functions; the fake-model run of both flows is scripts/ab_fake_check.cjs)
//  (Β) the draw: both assignments happen; a seed gives the same draw, another seed another
//  (Γ) the blind file: hidden labels, each pair's A / B as the key says, both orders over many pairs, the closing apart with its own
//      labels, a reply found in one flow only is not paired, no word that names a flow, no session number, the key not in it
//  (Δ) the wiring in the tool: the sessions can be asked for, the root never taken (so both flows talk to the last message), the judges
//      skip them, the two files are written; src/ and api/ untouched
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'));
const seeded = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const has = typeof SL.abPersonas === 'function' && typeof SL.abBlind === 'function';
assert('(load) the stress library has abPersonas and abBlind', has);
if (!has) { console.log(passed + ' passed, ' + failed + ' failed'); process.exit(1); }

// ── (Α) the four sessions ───────────────────────────────────────────────────────────────────────────────
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
const fn = n => { const m = CODE.match(new RegExp('^function ' + n + '\\(', 'm')); if (!m) return ''; let d = 0;
  for (let j = CODE.indexOf('{', m.index); j < CODE.length; j++) { const c = CODE[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return CODE.slice(m.index, j + 1); } } return ''; };
const D = new Function(['detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsAiIdentityQuestion', 'detectsNoQuestionsRequest',
  'detectsStatedMoneyFigure', 'detectsExplicitConstraint', 'detectsPermissionUncertainty'].map(fn).join('\n') +
  '\nreturn { crisis: detectSafetySignal, tier: classifyCrisisTier, danger: detectsDangerFromOther, ai: detectsAiIdentityQuestion, im: detectsNoQuestionsRequest,' +
  ' money: detectsStatedMoneyFigure, limit: detectsExplicitConstraint, perm: detectsPermissionUncertainty };')();
const run = SL.abPersonas(seeded(7));
const P = run.personas;
assert('(Α) four sessions, 201–204', P.length === 4 && P.map(p => p.id).join() === '201,202,203,204');
for (const [base, ids] of [[146, [201, 202]], [152, [203, 204]]]) {
  const src = SL.MECHANISM_PERSONAS.find(p => p.id === base), a = P.find(p => p.id === ids[0]), b = P.find(p => p.id === ids[1]);
  const want = src.fixed.slice(0, 8).map(x => x.say).concat([SL.EXIT_TEXT]);
  assert('(Α) ' + base + ': both sessions say the same 8 fixed messages of the scenario, then the tool\'s own EXIT_TEXT',
    [a, b].every(p => JSON.stringify(p.fixed.map(x => x.say)) === JSON.stringify(want) && p.fixed.every(x => Object.keys(x).join() === 'say')));
  assert('(Α) ' + base + ': exactly one of the two is the old flow (closed), and the key says which', (a.closed === true) !== (b.closed === true) &&
    run.flowOf[a.id] === (a.closed ? 'old' : 'stageA') && run.flowOf[b.id] === (b.closed ? 'old' : 'stageA'));
  assert('(Α) ' + base + ': ordinary — no risk, no offer of risk, not a mechanism session, 9 messages at most, no early exit', [a, b].every(p => !p.risk &&
    !p.offerRisk && !p.mechanism && p.maxTyped === 9 && p.exitAfter === 99 && p.runs === 1 && p.ab === base));
  const msgs = want.slice(0, 8);
  const lit = msgs.filter(t => D.crisis(t) !== null || D.tier(t) !== null || D.danger(t) !== null || D.ai(t) || D.im(t) || D.money(t).found ||
    D.limit(t).kinds.length || D.perm(t));
  assert('(Α) ' + base + ': not one of its 8 messages lights a detector — crisis, distress, tier, danger from another, «are you human», no-questions, money, limits, permission (' + lit.length + ')', lit.length === 0);
}
assert('(Α) the exit line lights no safety detector', D.crisis(SL.EXIT_TEXT) === null && D.danger(SL.EXIT_TEXT) === null);
assert('(Α) the names say nothing of the flow', P.every(p => !/στάδιο|παλι|ροή|stage|closed|old/i.test(p.name + ' ' + p.key)));

// ── (Β) the draw ─────────────────────────────────────────────────────────────────────────────────────────
{
  const seen = new Set();
  for (let s = 1; s <= 40; s++) { const r = SL.abPersonas(seeded(s)); seen.add([201, 203].map(id => r.flowOf[id]).join()); }
  assert('(Β) over 40 seeds every assignment of the two pairs happens (' + seen.size + ' of 4)', seen.size === 4);
  assert('(Β) the same seed draws the same', JSON.stringify(SL.abPersonas(seeded(11)).flowOf) === JSON.stringify(SL.abPersonas(seeded(11)).flowOf));
}

// ── (Γ) the blind file, on made-up sessions ──────────────────────────────────────────────────────────────────
// a made-up reply carries its flow and message in a token only this test reads: [ψ:1:k] Stage A, [ψ:0:k] the old flow
const METHOD = 'ΓΡΑΜΜΗ ΜΕΘΟΔΟΥ ΤΗΣ ΕΦΑΡΜΟΓΗΣ';
const fakeSession = (p, flow) => {
  const turns = [], typed = [];
  p.fixed.forEach((x, i) => {
    const k = i + 1; typed.push(x.say); turns.push({ who: 'user', text: x.say });
    if (x.say === SL.EXIT_TEXT) { turns.push({ who: 'aura', text: 'Κλείσιμο ' + (flow === 'old' ? 'δρόμοι' : 'ερώτηση') }); turns.push({ who: 'app', text: '[κουμπί]' }); return; }
    if (flow === 'old' && k === 1) return; // the old flow: the app's own question after the 1st message, no reply of the model
    turns.push({ who: 'aura', text: (flow === 'stageA' && k === 1 ? METHOD + '\n' : '') + 'Απάντηση [ψ:' + (flow === 'stageA' ? 1 : 0) + ':' + k + ']' });
  });
  return { label: String(p.id), persona: { id: p.id, ab: p.ab }, turns, typed };
};
const S = P.map(p => fakeSession(p, run.flowOf[p.id]));
const out = SL.abBlind(S, run.flowOf, seeded(3), { strip: [METHOD] });
const md = out.md, key = out.key;
assert('(Γ) the blind file and the key are made', typeof md === 'string' && md.length > 0 && key && Array.isArray(key.pairs) && Array.isArray(key.closing));
assert('(Γ) 7 pairs per scenario (messages 2–8: the 1st has a reply in one flow only and is not paired)', key.pairs.filter(x => x.scenario === 146).length === 7 &&
  key.pairs.filter(x => x.scenario === 152).length === 7 && key.pairs.every(x => x.message >= 2 && x.message <= 8));
{
  // every pair: the text shown under A is the reply of the flow the key names for A, and B the other
  const blocks = md.split(/\n(?=### )/);
  let ok = 0;
  for (const x of key.pairs) {
    const blk = blocks.find(b => b.startsWith('### Σενάριο ' + x.scenario + ' · ζεύγος ' + x.pair + ' ')) || '';
    const a = (blk.match(/\*\*A\*\*\n([\s\S]*?)\n\*\*B\*\*/) || [])[1] || '', b = (blk.match(/\*\*B\*\*\n([\s\S]*?)(?:\n\n|$)/) || [])[1] || '';
    const flag = t => (t.match(/\[ψ:(\d):(\d+)\]/) || []);
    const fa = flag(a), fb = flag(b);
    if (fa[1] === (x.A === SL.AB_FLOW_NAMES.stageA ? '1' : '0') && fb[1] === (x.B === SL.AB_FLOW_NAMES.stageA ? '1' : '0') && fa[2] === String(x.message) && fb[2] === String(x.message) && x.A !== x.B) ok++;
  }
  assert('(Γ) in every pair A and B are the replies the key names, to the same message (' + ok + '/' + key.pairs.length + ')', ok === key.pairs.length && ok === 14);
}
{
  let aFirst = 0, n = 0;
  for (let s = 1; s <= 30; s++) { const o = SL.abBlind(S, run.flowOf, seeded(s)); for (const x of o.key.pairs) { n++; if (x.A === SL.AB_FLOW_NAMES.stageA) aFirst++; } }
  assert('(Γ) over 30 draws, Stage A is A in some pairs and B in others (' + aFirst + ' of ' + n + ')', aFirst > n * 0.3 && aFirst < n * 0.7);
  const o1 = SL.abBlind(S, run.flowOf, seeded(5)), o2 = SL.abBlind(S, run.flowOf, seeded(5)), o3 = SL.abBlind(S, run.flowOf, seeded(6));
  assert('(Γ) the same seed gives the same file and key; another seed another key', o1.md === o2.md && JSON.stringify(o1.key) === JSON.stringify(o2.key) &&
    JSON.stringify(o1.key.pairs) !== JSON.stringify(o3.key.pairs));
}
assert('(Γ) the closing is apart, after the pairs, with labels of its own (Γ / Δ), one per scenario', /## Κλείσιμο/.test(md) && md.indexOf('## Κλείσιμο') > md.lastIndexOf('· ζεύγος ') &&
  key.closing.length === 2 && key.closing.every(x => x.Γ && x.Δ && x.Γ !== x.Δ) && /\*\*Γ\*\*/.test(md) && /\*\*Δ\*\*/.test(md));
assert('(Γ) no closing text in the pairs, and no pair text in the closing', !md.slice(0, md.indexOf('## Κλείσιμο')).includes('Κλείσιμο δρόμοι') &&
  !md.slice(md.indexOf('## Κλείσιμο')).includes('[ψ:'));
assert('(Γ) the app\'s own method line is taken out', !md.includes(METHOD));
assert('(Γ) no word that names a flow, no session number, nothing of the key in the blind file', !/στάδιο\s*α|παλι[άα]\s*ρο[ήη]|stageA|closed|\bold\b|first-why|προεπιλογ/i.test(md) &&
  !/\b20[1-4]\b/.test(md) && !md.includes(SL.AB_FLOW_NAMES.stageA) && !md.includes(SL.AB_FLOW_NAMES.old));
assert('(Γ) the blind file tells the reader to leave the key closed until the opinion is written', /ab-key\.json/.test(md) && /πριν|μόνο αφού/i.test(md));
assert('(Γ) the key names every session\'s flow', Object.keys(key.sessions).sort().join() === '201,202,203,204');
{
  const S3 = S.filter(s => s.label !== '204');
  const o = SL.abBlind(S3, run.flowOf, seeded(3));
  assert('(Γ) a pair with a session missing is not compared, and says so', o.key.pairs.every(x => x.scenario === 146) && /152[\s\S]*δεν συγκρίνεται/.test(o.md));
}

// ── (Δ) the wiring in the tool ────────────────────────────────────────────────────────────────────────────────
{
  const T = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
  assert('(Δ) the four sessions can be asked for with --sessions (and only then are they made)', /SL\.isAbId\(/.test(T) && /AB_RUN = SL\.abPersonas\(/.test(T) && /PEOPLE\.push\(\.\.\.AB_RUN\.personas\)/.test(T));
  assert('(Δ) the draw uses crypto, not Math.random', /AB_RNG = \(\) => crypto\.randomInt\(/.test(T));
  assert('(Δ) the root question gets «not yet» and the root card «not yet» in an A/B session — both flows talk to the last message',
    /\} else if \(p\.ab && s\.ask && st && st\.say !== undefined\) \{/.test(T) && /if \(p\.ab\) verdict = 'notyet';/.test(T) &&
    /\} else if \(p\.mechanism && s\.ask && st && st\.say !== undefined && !st\.rootOk\) \{/.test(T));
  const top = n => { const i = T.indexOf('async function ' + n + '('); return i < 0 ? '' : T.slice(i, T.indexOf('\n', T.indexOf('\n', i) + 1) + 1); };
  assert('(Δ) no judge reads an A/B session: the session and voice judges return at once; the loop, mechanism and crisis judges skip it by their own first line',
    /if \(s\.persona && s\.persona\.ab\) return \{ introduced_causes: \[\], root_match: 'none'/.test(T.slice(T.indexOf('async function judgeSession('), T.indexOf('async function judgeSession(') + 600)) &&
    /\n  if \(s\.persona && s\.persona\.ab\) return;/.test(top('judgeVoice')) && /if \(!s\.persona\.loop /.test(top('judgeLoop')) &&
    /if \(!s\.persona\.mechanism /.test(top('judgeMechanism')) && /if \(!s\.crisisReply /.test(top('judgeCrisis')));
  assert('(Δ) the two files are written, the blind one and the key apart, and meta.ab set before the report is built',
    /writeOut\('ab-blind\.md', ab\.md\)/.test(T) && /writeOut\('ab-key\.json', JSON\.stringify\(ab\.key, null, 2\)\)/.test(T) &&
    T.indexOf('meta.ab = {') > 0 && T.indexOf('meta.ab = {') < T.indexOf("writeOut('stress-report.md', SL.buildStressReport(sessions, meta));"));
  {
    let withNote = '', without = '';
    try { withNote = SL.buildStressReport([], { mode: 'x', spent: 0, budget: 1, ab: { blind: 'ab-blind.md', key: 'ab-key.json', pairs: 0 } }); } catch (e) { withNote = 'ERR ' + e.message; }
    try { without = SL.buildStressReport([], { mode: 'x', spent: 0, budget: 1 }); } catch (e) { without = 'ERR ' + e.message; }
    assert('(Δ) the main report says, right under its title, to read the blind file first — only in an A/B run',
      withNote.split('\n').slice(0, 4).join('\n').includes(SL.AB_REPORT_NOTE) && !without.includes('Σύγκριση A/B') && !/^ERR/.test(withNote));
  }
  assert('(Δ) the key is never printed to the console', !/console\.log\([^)]*ab\.key/.test(T) && !/console\.log\([^)]*flowOf/.test(T));
}
{
  const h = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 16);
  const ci2 = raw.indexOf('const AURA_CORE_PERSONALITY'), cs2 = raw.indexOf('`', ci2) + 1, ce2 = raw.indexOf('`;', cs2);
  assert('(Δ) the prompt is still b5f303cc9405aa21 and api/aura.js is the one of release-candidate c85259c (e791b19471f08132)',
    crypto.createHash('sha256').update(raw.slice(cs2, ce2)).digest('hex').slice(0, 16) === 'b5f303cc9405aa21' && h('api/aura.js') === 'e791b19471f08132');
}

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
