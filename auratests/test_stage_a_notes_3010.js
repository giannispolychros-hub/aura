// AURA — IN STAGE A, BEFORE THE ROOT, NO NOTE THAT POINTS TOWARD MONEY OR ROADS (John, 30/10/2026: a safety exception (α),
// Constitution §0.1 — «no facts about law or money» is a safety limit; audits #3 and #4 of 30/10).
//
// What was seen: two per-turn notes built by the code, both older than Stage A and never asked for there by any ADR, go out with every
// Stage A request before the root: [STRUCTURAL EVIDENCE …] (App.jsx, materialEvidenceCtx: «Money amounts the user stated: …», «what they
// would gain or lose» — material for ROAD DISCOVERY, which Stage A suspends) and the line of [SESSION COVERAGE …] that counts «Replies
// since your last structural output (road map or three-beat)». In a real session (John's own, not one of the 20) the model gave lists of
// jobs with earnings, a percentage return and a plan, before any root, with both notes in every request from the 4th turn on.
// The change, code only: in Stage A before a confirmed root and OFF the safety path, the evidence note is not sent at all (its only
// consumer, ROAD DISCOVERY, is suspended there) and the coverage note is sent without its road-map line. Everywhere else — the old
// flow (?stageA=0), Stage A after the root, the crisis turn and every turn after the crisis line, danger from another person — the two
// notes are byte for byte what they were. The prompt, its fingerprints and the api guard are unchanged.
// The EXACT text each request carries is checked in the browser (scripts/e2e_stage_a.cjs, section NT); here, the pure part and the wiring.
//  (Α) the rule   (Β) the coverage note without its road-map line   (Γ) the wiring in generateResponse   (Δ) the rest unchanged

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const load = n => { try { return new Function(fnSrc(n) + '\nreturn ' + n + ';')(); } catch (e) { console.log('LOAD ERROR ' + n + ' — ' + e.message); return null; } };

// ── (Α) the rule ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const held = load('stageAPreRootNotesHeld');
assert('(Α) the rule exists as one pure function', typeof held === 'function');
const call = (...a) => { try { return held(...a); } catch (e) { return 'threw'; } };
for (const [label, args, expect] of [
  ['Stage A, no root yet, off the safety path → held', [true, false, false], true],
  ['Stage A after the root → sent as before', [true, true, false], false],
  ['Stage A on the safety path (crisis turn, after the crisis line, danger from another) → sent as before', [true, false, true], false],
  ['the old flow (?stageA=0) → sent as before', [false, false, false], false],
  ['the old flow on the safety path → sent as before', [false, false, true], false],
  ['only a real true opens it (a string "true" is not Stage A)', ['true', false, false], false],
  ['a missing value is not Stage A', [undefined, undefined, undefined], false],
]) assert('(Α) ' + label, call(...args) === expect);

// ── (Β) the coverage note ───────────────────────────────────────────────────────────────────────────────────────────────────────
const cover = load('buildCoverageReport');
assert('(Β) buildCoverageReport loads', typeof cover === 'function');
const ROAD_LINE = 'Replies since your last structural output (road map or three-beat)';
const msgs = [
  { role: 'user', content: 'α' }, { role: 'assistant', content: 'Τι σε κρατάει;' },
  { role: 'user', content: 'β' }, { role: 'assistant', content: 'Και τι άλλο;' },
  { role: 'user', content: 'γ' }, { role: 'assistant', content: 'ΔΡΟΜΟΣ: Χ\nΚΕΡΔΙΖΕΙΣ: Ψ' },
  { role: 'user', content: 'δ' }, { role: 'assistant', content: 'Πώς το βλέπεις;' },
];
const structural = t => /ΔΡΟΜΟΣ:/.test(t);
const fams = ['tensionCtx', 'gatesCtx'];
const before = cover ? cover(msgs, fams, structural) : '';
assert('(Β) three arguments, as every caller today: the road-map line is there (the note as it was)', before.includes(ROAD_LINE + ': 1.'));
assert('(Β) a fourth argument false or missing gives the very same string', cover && cover(msgs, fams, structural, false) === before && cover(msgs, fams, structural, undefined) === before);
const without = cover ? cover(msgs, fams, structural, true) : '';
assert('(Β) held: the road-map line is gone', without.length > 0 && !without.includes(ROAD_LINE) && !/road map/i.test(without.replace(/\[SESSION COVERAGE[^\]]*$/, '')));
assert('(Β) held: everything else is kept, byte for byte (the line removed and nothing else)',
  without === before.replace('\n· ' + ROAD_LINE + ': 1.', ''));
assert('(Β) held: the question streak and the families are still reported', /ending in a question, counting back from the last one: 1\./.test(without) && without.includes('tensionCtx, gatesCtx'));
assert('(Β) too early (fewer than 3 replies): nothing, held or not', cover && cover(msgs.slice(0, 4), fams, structural, true) === '' && cover(msgs.slice(0, 4), fams, structural) === '');

// ── (Γ) the wiring ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const gr = (() => { const a = CODE.indexOf('const generateResponse = useCallback('); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n  }, [safetyMode, memory, currentDomain, activeLens]);', a)); })();
assert('(Γ) generateResponse located', gr.length > 10000);
const DEF = 'const _saNotesHeld = stageAPreRootNotesHeld(stageAActive.current, stageARef.current.stats.rootConfirmed === 1, _safetyPath);';
const iSafety = gr.indexOf('const _crisisTurn = _turnSafety.crisisTurn, _safetyPath = _turnSafety.safetyPath;');
const iDef = gr.indexOf(DEF), iEv = gr.indexOf('const materialEvidenceCtx = (() => {'), iCov = gr.indexOf('const coverageReportCtx = ');
assert('(Γ) the rule is read once per turn, after the safety path is known and before both notes', iSafety > 0 && iDef > iSafety && iDef < iEv && iDef < iCov && (gr.split(DEF).length - 1) === 1);
const ev = iEv > 0 ? gr.slice(iEv, gr.indexOf('})();', iEv)) : '';
assert('(Γ) the evidence note: nothing at all while held (its first line returns empty)', /if \(userMsgs\.length === 0 \|\| _saNotesHeld\) return '';/.test(ev));
assert('(Γ) the evidence note is otherwise unchanged: the money line, the limits line and the disclaimer are still built as before',
  ev.includes('Money amounts the user stated: ${amounts.join(\', \')}') && ev.includes('Limits they named in their own words') && ev.includes("does not measure ROAD DISCOVERY's three criteria"));
assert('(Γ) the coverage note gets the rule as its fourth argument (the crisis turn still sends none)',
  /const coverageReportCtx = _crisisTurn \? '' : buildCoverageReport\(msgs, familiesUsed\.current,\s*t => \{ const l = structuralLabelsIn\(t\); return l\.road \|\| l\.beat; \}, _saNotesHeld\);/.test(gr));
assert('(Γ) both notes still reach the model through dynamicSuffix (only their content changes)',
  /const dynamicSuffix = \[[^\]]*materialEvidenceCtx/s.test(CODE) && /const dynamicSuffix = \[[^\]]*coverageReportCtx/s.test(CODE));
assert('(Γ) no other note reads the rule (gates, goal/obstacle/stakes, tension, the marker are untouched)', (CODE.split('_saNotesHeld').length - 1) === 3);

// ── (Δ) the rest unchanged ──────────────────────────────────────────────────────────────────────────────────────────────────────
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
assert('(Δ) the prompt (AURA_CORE_PERSONALITY) is unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21');
let gen = ''; try { gen = cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { encoding: 'utf8' }); } catch (e) { gen = String(e.stdout || ''); }
assert('(Δ) the prompt fingerprints in api/aura.js are up to date', /up to date/.test(gen));
assert('(Δ) the safety-path rule is the one of 19/10 (perTurnSafety unchanged)', h(fnSrc('perTurnSafety')) === h('function perTurnSafety(currentMode, riskKind, dangerFromOther) {\n  const crisisTurn = currentMode === "SUPPORTIVE";\n  return { crisisTurn, safetyPath: crisisTurn || riskKind === 1 || riskKind === 2 || dangerFromOther === true };\n}'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
