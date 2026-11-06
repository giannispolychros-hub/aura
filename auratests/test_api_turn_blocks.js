// AURA — EVERY PER-TURN NOTE OF THE APP BEGINS THE WAY api/aura.js EXPECTS (ADR «4 Νοεμβρίου (β)», branch hardening-2026-11, local).
//
// api/aura.js now checks the shape of a request: after the app's own prompt, the per-turn part may hold only blocks that begin the way the
// app's own per-turn notes begin. The list of those beginnings («openings») is written into api/aura.js by scripts/gen_prompt_fingerprints.cjs
// from src/App.jsx. This test proves, from the source, that nothing the app sends would be refused:
//  (Α) the per-turn notes joined into `dynamicSuffix` are exactly the 31 known here — a new note fails until it is checked
//  (Β) each note's code (its definition and the top-level functions and constants it uses) holds at least one opening, and every opening in
//      it is on the list in api/aura.js — including the two of the old flow: the road question and the close after the map
//  (Γ) each note's value starts with «[» after any line breaks (a few inner fragments, e.g. a «·» list item inside ${…}, are named here)
//  (Δ) the other per-turn pieces (First-WHY floor, the misfire recovery text, the Stage A marker, memory, the profile) begin the same way
//  (Ε) built from the app's own builder functions, real per-turn parts pass the check of api/aura.js; a part with a line that is not one of
//      the app's notes does not
//  (Ζ) the list holds nothing more: read again here, from the app's code without the fixed prompts, the five per-mode texts and console.*
//      messages, the openings are exactly the list in api/aura.js; each «[» opening is 10–19 characters
// It checks the shape of requests the app makes. It is not user authentication and does not claim to be.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(__dirname, '..', 'api', 'aura.js'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

// ── api/aura.js as it is ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const blockOf = (a, b) => { const i = api.indexOf(a), j = api.indexOf(b, i); return i >= 0 && j > i ? api.slice(i, j) : ''; };
const fnSrc = name => { const a = api.indexOf('function ' + name + '('); if (a < 0) return ''; let d = 0; for (let j = api.indexOf('{', a); j < api.length; j++) { if (api[j] === '{') d++; else if (api[j] === '}') { d--; if (!d) return api.slice(a, j + 1); } } return ''; };
let G = null;
try {
  G = new Function(blockOf('// BEGIN PROMPT FINGERPRINTS', '// END PROMPT FINGERPRINTS') + '\n' + blockOf('const REQUEST_LIMITS = ', ';\n') + ';\n' + fnSrc('checkAuraRequest') +
    '\nreturn { PROMPT_FINGERPRINTS, REQUEST_LIMITS, checkAuraRequest };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
assert('(load) api/aura.js: the fingerprints, the limits and checkAuraRequest load; the list of openings is there',
  !!G && Array.isArray(G.PROMPT_FINGERPRINTS.openings) && G.PROMPT_FINGERPRINTS.openings.length >= 20 && Array.isArray(G.PROMPT_FINGERPRINTS.modes) && G.PROMPT_FINGERPRINTS.modes.length === 5);
const OPENINGS = G && Array.isArray(G.PROMPT_FINGERPRINTS.openings) ? G.PROMPT_FINGERPRINTS.openings : [];
const accepted = op => OPENINGS.some(o => op.startsWith(o) || o.startsWith(op));
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
const check = (system, messages) => { try { return G.checkAuraRequest({ system, messages: messages || [{ role: 'user', content: 'Γεια.' }] }, G.PROMPT_FINGERPRINTS, G.REQUEST_LIMITS, sha); } catch (e) { return { status: 'threw: ' + e.message }; } };
const statusOf = r => (r === null ? 200 : r.status);

// ── the source, region by region ─────────────────────────────────────────────────────────────────────────────────────────────────
const topFn = n => { const a = CODE.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : CODE.slice(a + 1, CODE.indexOf('\n}', a + 1) + 2); };
const topConst = n => { const a = CODE.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; return CODE.slice(a + 1, CODE.indexOf(';\n', a + 1) + 1); };
const region = n => { const a = CODE.indexOf('const ' + n + ' = '); if (a < 0) return ''; const nx = CODE.slice(a + 1).search(/\n      (?:const |let |\/\/ )/); return CODE.slice(a, nx < 0 ? a + 3000 : a + 1 + nx); };
const expand = (text, depth) => { let all = text; const seen = new Set();
  for (let d = 0; d < depth; d++) for (const id of new Set([...all.matchAll(/\b([A-Za-z_]\w*)\b/g)].map(m => m[1]))) {
    if (seen.has(id)) continue; seen.add(id); const f = topFn(id) || (/^[A-Z_]+$/.test(id) ? topConst(id) : ''); if (f && !all.includes(f)) all += '\n' + f; }
  return all; };
// the same reading of openings as the generator: «[» + 9–18 characters, after «\n», after a quote, or on a line of its own
const OPEN = [/(?:\\n|[`'"])\[([A-ZΑ-Ω][^\]\n`'"$\\]{8,17})/g, /^\[([A-ZΑ-Ω][^\]\n`'"$\\]{8,17})/gm];
const openingsIn = text => [...new Set(OPEN.flatMap(re => [...text.matchAll(re)].filter(m => !/console\.\w+\(\s*$/.test(text.slice(Math.max(0, m.index - 24), m.index))).map(m => '[' + m[1])))];

// ── (Α) the notes ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const EXPECTED = ['memCtx', 'profileCtx', 'materialEvidenceCtx', 'goalObstacleStakesCtx', 'masterPriorityStageCtx', 'lastFiredFamilyCtx', 'coverageReportCtx',
  'demoCtx', 'informationModeCtx', 'explicitPauseCtx', 'coreReadinessCtx', 'shiftCheckCtx', 'premiseInversionCtx', 'friendPerspectiveCtx', 'clarityPivotCtx',
  'selfRepetitionCtx', 'repeatedElementsCtx', 'stopMomentCtx', 'riskClarificationCtx', 'methodFailureCtx', 'userStagnationCtx', 'escalationCtx', 'tensionCtx',
  'roadQuestionCtx', 'postMapCloseCtx', 'gatesCtx', 'closingDriftCtx', 'stageAFirstReplyCtx', 'firstReplyFloorCtx', 'safetyPathCtx', 'stageAMarkerCtx'];
const arr = (raw.match(/const dynamicSuffix = \[([\s\S]*?)\]\.filter\(Boolean\)/) || ['', ''])[1];
const NAMES = [...new Set([...arr.matchAll(/\b(\w+Ctx)\b/g)].map(m => m[1]))];
assert('(Α) dynamicSuffix joins exactly the 31 notes this test knows (a new note must be added here, with its opening checked)',
  NAMES.length === EXPECTED.length && EXPECTED.every(n => NAMES.includes(n)));
assert('(Α) the notes are joined with line breaks, so each one starts a block of its own', /\]\.filter\(Boolean\)\.join\('\\n'\)/.test(raw));

// ── (Β) openings, note by note ────────────────────────────────────────────────────────────────────────────────────────────────────
const EXTRA = { profileCtx: [region('profileSummary')] };   // profileCtx = profileSummary + HONEST_UNCERTAINTY_RULE; profileSummary is defined just above it
for (const n of EXPECTED) {
  const code = expand([region(n), ...(EXTRA[n] || [])].join('\n'), 2);
  const ops = openingsIn(code);
  if (n === 'demoCtx') { assert('(Β) demoCtx is the constant \'\' (the demo was removed) — nothing to check', /const demoCtx = '';/.test(raw)); continue; }
  assert(`(Β) ${n}: its code holds an opening and every opening in it is on the list in api/aura.js (${ops.length}: ${ops.slice(0, 3).join(' | ')})`,
    ops.length > 0 && ops.every(accepted));
}
assert('(Β) the old flow\'s road question begins «[ROAD QUESTION — …» and that opening is on the list', openingsIn(expand(region('roadQuestionCtx'), 2)).some(o => o.startsWith('[ROAD QUESTION')) && accepted('[ROAD QUESTION — one road'));
assert('(Β) the old flow\'s close after the map begins «[CODE-VERIFIED: a ΔΡΟΜΟΣ…» and that opening is on the list', openingsIn(expand(region('postMapCloseCtx'), 2)).some(o => o.startsWith('[CODE-VERIFIED: a Δ')) && accepted('[CODE-VERIFIED: a ΔΡΟΜΟΣ'));
assert('(Β) the second part of the profile note (HONEST_UNCERTAINTY_RULE, a line of its own) is on the list', accepted('[SILENT PROFILE USAGE — internal'));

// ── (Γ) each note's value starts with «[» ─────────────────────────────────────────────────────────────────────────────────────────
// inner fragments inside ${…} or a list, never the start of a block: named, one by one
const INNER = { materialEvidenceCtx: ['·'], coverageReportCtx: ['·'], methodFailureCtx: ['F'], selfRepetitionCtx: ['y'] };
for (const n of EXPECTED) {
  const code = expand([region(n), ...(EXTRA[n] || [])].join('\n'), 2);
  const starts = [...code.matchAll(/(?:\?|return|=|:)\s*`((?:\\n|\n)*)([^`]?)/g)].map(m => m[2]).filter(c => c !== '');
  const odd = starts.filter(c => c !== '[' && !(INNER[n] || []).includes(c));
  if (starts.length) assert(`(Γ) ${n}: every template value starts with «[» after its line breaks` + (INNER[n] ? ' (inner fragments named: ' + INNER[n].join(' ') + ')' : ''), odd.length === 0);
}
for (const [n, re] of [['methodFailureCtx', /const methodFailureCtx = [\s\S]{0,120}\? `\\n\[CODE-VERIFIED: /], ['selfRepetitionCtx', /const selfRepetitionCtx = [\s\S]{0,80}\? `\\n\[CODE-VERIFIED: /]])
  assert(`(Γ) ${n}: the note itself (the outer template) starts «\\n[CODE-VERIFIED: …»`, re.test(raw));

// ── (Δ) the other per-turn pieces ─────────────────────────────────────────────────────────────────────────────────────────────────
for (const [name, code] of [['buildFirstWhyFloor', topFn('buildFirstWhyFloor')], ['buildStageAMarker', topFn('buildStageAMarker')], ['buildMemoryContext', topFn('buildMemoryContext')],
  ['getProfileSummary', topFn('getProfileSummary')], ['HONEST_UNCERTAINTY_RULE', topConst('HONEST_UNCERTAINTY_RULE')]]) {
  const ops = openingsIn(code);
  assert(`(Δ) ${name}: begins with an opening on the list (${ops.join(' | ')})`, ops.length > 0 && ops.every(accepted));
}
assert('(Δ) the misfire recovery text begins «MISFIRE RECOVERY:» and that opening is on the list', /\\n\\nMISFIRE RECOVERY: /.test(raw) && OPENINGS.includes('MISFIRE RECOVERY:'));

// ── (Ε) real per-turn parts, built from the app's own builders, through the check ───────────────────────────────────────────────
const lit = name => { const h = 'const ' + name + ' = `'; const a = raw.indexOf(h); const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
const suffix = name => { const h = 'const ' + name + ' = AURA_CORE_PERSONALITY + `'; const a = raw.indexOf(h); const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
const CORE = lit('AURA_CORE_PERSONALITY'), SUP = lit('SYSTEM_SUPPORTIVE'), TERM = lit('SYSTEM_TERMINATION');
const load = n => { try { return new Function(topFn(n) + '\nreturn ' + n + ';')(); } catch (e) { return null; } };
const goal = load('describeGoalObstacleStakesCtx'), marker = load('buildStageAMarker'), floor = load('buildFirstWhyFloor'), escal = load('describeEscalationCtx');
const parts = [];
if (goal) for (const g of [false, true]) for (const o of [false, true]) for (const k of [false, true]) { const t = goal(g, o, k); if (t) parts.push(t); }
if (marker) parts.push(marker(true));
if (floor) parts.push(floor());
if (escal) for (const l of [1, 2, 3, 4]) { try { const t = escal(l); if (t) parts.push(t); } catch (e) { } }
parts.push('\n[ROAD QUESTION — one road at a time. Ask EXACTLY ONE question about ΔΡΟΜΟΣ 1: "Μένω στην τράπεζα".]\n');
assert('(Ε) builders found: the knowledge-state note (7 forms), the Stage A marker, the First-WHY floor, the escalation notes', !!goal && !!marker && !!floor && parts.length >= 10);
const join = ps => ps.filter(Boolean).join('\n');
const lensNames = ['SYSTEM_LENS_SIMPLIFY', 'SYSTEM_LENS_CHALLENGE', 'SYSTEM_LENS_PERSPECTIVE', 'SYSTEM_LENS_EXPLORE', 'SYSTEM_COMPRESSION'];
assert('(Ε) the core prompt + each of the five per-mode texts + all of these notes passes', lensNames.every(n => check([{ type: 'text', text: CORE }, { type: 'text', text: suffix(n) + join(parts) }]) === null));
assert('(Ε) the core prompt + the notes alone (misfire, First-WHY) passes', check([{ type: 'text', text: CORE }, { type: 'text', text: join(parts) + '\n\nMISFIRE RECOVERY: x' }]) === null);
assert('(Ε) the crisis prompt + its notes passes', check([{ type: 'text', text: SUP + join(parts.slice(0, 8)) }]) === null);
assert('(Ε) the closing prompt exactly passes', check([{ type: 'text', text: TERM }]) === null);
assert('(Ε) a part with a line that is not one of the app\'s notes is refused, after the core prompt and after the crisis prompt',
  statusOf(check([{ type: 'text', text: CORE }, { type: 'text', text: '\nnot a note\n' + join(parts) }])) === 403 && statusOf(check([{ type: 'text', text: SUP + '\nnot a note' }])) === 403);
assert('(Ε) anything after the closing prompt is refused', statusOf(check([{ type: 'text', text: TERM + '\n[FREE PART: ENDS AT ROOT]' }])) === 403);
assert('(Ε) a block that is not one of the app\'s notes is refused, even when it quotes the beginning of one',
  statusOf(check([{ type: 'text', text: CORE }, { type: 'text', text: '\nnot a note [CODE-VERIFIED: the rest]' + join(parts) }])) === 403 &&
  statusOf(check([{ type: 'text', text: SUP + '\nnot a note [FREE PART: ENDS AT ROOT]' }])) === 403);
assert('(Ε) every line that starts with «[» starts a block of its own: a foreign one right under a real note is refused',
  statusOf(check([{ type: 'text', text: CORE }, { type: 'text', text: '\n[FREE PART: ENDS AT ROOT]\n[NOT ONE OF THE APP NOTES]' }])) === 403 &&
  statusOf(check([{ type: 'text', text: SUP + '\n[FREE PART: ENDS AT ROOT]\n[NOT ONE OF THE APP NOTES]' }])) === 403);

// ── (Ζ) the list holds nothing more than the app's own notes ────────────────────────────────────────────────────────────────────────
const cut = (s, head) => { const a = s.indexOf(head); if (a < 0) return s; const e = s.indexOf('`;', a + head.length); return s.slice(0, a) + s.slice(e); };
let NOTES_CODE = raw;
for (const n of ['AURA_CORE_PERSONALITY', 'SYSTEM_SUPPORTIVE', 'SYSTEM_TERMINATION']) NOTES_CODE = cut(NOTES_CODE, 'const ' + n + ' = `');
for (const n of lensNames) NOTES_CODE = cut(NOTES_CODE, 'const ' + n + ' = AURA_CORE_PERSONALITY + `');
const OWN = new Set([...openingsIn(NOTES_CODE), ...[...NOTES_CODE.matchAll(/\\n\\n([A-Z][A-Z \-]{6,30}:)/g)].map(m => m[1])]);
const extra = OPENINGS.filter(o => !OWN.has(o)), missing = [...OWN].filter(o => !OPENINGS.includes(o));
assert(`(Ζ) the list in api/aura.js is exactly the openings of the app's own code (fixed prompts, per-mode texts and console.* left out)` +
  (extra.length || missing.length ? ` — extra: ${extra.join(' | ')}; missing: ${missing.join(' | ')}` : ` (${OPENINGS.length})`), OPENINGS.length > 0 && !extra.length && !missing.length);
assert('(Ζ) every «[» opening on the list is 10–19 characters (the check never accepts a block by a shorter beginning)',
  OPENINGS.length > 0 && OPENINGS.filter(o => o.startsWith('[')).every(o => o.length >= 10 && o.length <= 19));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
