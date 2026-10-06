// AURA — the real-model browser test's PLUMBING (scripts/e2e_stage_a_lib.cjs). Test code only: nothing here
// changes how the app behaves. Founder's rules (2026-10-06): the real test runs on the app itself; no second
// copy of App.jsx's contexts; every request is described FROM THE REQUEST (context names, Stage A marker,
// closing calls) with names derived from App.jsx at run time; outputs only in %TEMP%; the API key never in
// any output; a spending limit.

const fs = require('fs');
const os = require('os');
const path = require('path');
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function attempt(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }

const LIB_PATH = path.join(__dirname, '..', 'scripts', 'e2e_stage_a_lib.cjs');
const L = attempt(() => require(LIB_PATH), {});
const APP_PATH = path.join(__dirname, '..', 'src', 'App.jsx');
const SRC = fs.readFileSync(APP_PATH, 'utf8');
const A = attempt(() => L.loadApp(SRC), null);
assert('LOAD: the library loads App.jsx', !!A);
const app = A || { catalog: {}, fns: {}, texts: {}, consts: {} };

// ── 1. Everything comes from App.jsx, read at run time ───────────────────────
const ci = SRC.indexOf('const AURA_CORE_PERSONALITY');
const CORE = SRC.slice(SRC.indexOf('`', ci) + 1, SRC.indexOf('`;', SRC.indexOf('`', ci) + 1));
assert('SOURCE: the core prompt is App.jsx\'s own, byte for byte', app.consts.core === CORE);
const arr = (SRC.match(/const dynamicSuffix = \[([\s\S]*?)\]\.filter\(Boolean\)/) || ['', ''])[1];
const NAMES = [...new Set([...arr.matchAll(/\b(\w+Ctx)\b/g)].map(m => m[1]))];
assert('CATALOG: every context named in App.jsx\'s dynamicSuffix is in the catalog (nothing hand-listed)',
  NAMES.length >= 25 && NAMES.every(n => Object.prototype.hasOwnProperty.call(app.catalog, n)));
const CRITICAL = ['coreReadinessCtx', 'userStagnationCtx', 'gatesCtx', 'shiftCheckCtx', 'friendPerspectiveCtx', 'firstReplyFloorCtx',
  'methodFailureCtx', 'selfRepetitionCtx', 'stageAMarkerCtx', 'roadQuestionCtx', 'postMapCloseCtx', 'closingDriftCtx', 'premiseInversionCtx',
  'clarityPivotCtx', 'informationModeCtx', 'memCtx', 'escalationCtx', 'tensionCtx', 'goalObstacleStakesCtx', 'materialEvidenceCtx',
  'masterPriorityStageCtx', 'coverageReportCtx', 'explicitPauseCtx', 'lastFiredFamilyCtx', 'profileCtx'];
CRITICAL.forEach(n => assert(`CATALOG: «${n}» has at least one signature`, (app.catalog[n] || []).length >= 1));
assert('CATALOG: demoCtx (always "" in App.jsx) is listed as having no signature, not invented',
  Array.isArray(app.catalog.demoCtx) && app.catalog.demoCtx.length === 0 && (app.unsignedCtx || []).includes('demoCtx'));
assert('CATALOG: the two extra prompt parts (First-WHY floor, misfire recovery) are catalogued',
  (app.catalog.firstWhyFloor || []).length >= 1 && (app.catalog.misfireRecovery || []).length >= 1);
const allSigs = Object.values(app.catalog).flat();
assert('CATALOG: every signature belongs to exactly ONE context (no ambiguous names)', allSigs.length === new Set(allSigs).size);
assert('CATALOG: no signature contains an unfilled template part', allSigs.every(s => !s.includes('${')));
assert('MARKER: taken from buildStageAMarker(true), not retyped', app.consts.marker === '\n[FREE PART: ENDS AT ROOT]\n' && (app.catalog.stageAMarkerCtx || [])[0] === '[FREE PART: ENDS AT ROOT]');
['detectsRootDeferral', 'detectsExplicitProductionRequest', 'detectsCoreReadinessAsked', 'parseRoadMap', 'parseThreeBeatShift',
 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord', 'buildStageAMarker', 'buildFirstWhyFloor'].forEach(n =>
  assert(`FNS: «${n}» is App.jsx's own function`, typeof app.fns[n] === 'function'));
assert('TEXTS: STAGE_A_TEXTS is App.jsx\'s own', (app.texts || {}).button === 'Νομίζω βρήκα τι με απασχολεί');
(L.UI_STRINGS || []).forEach(s => assert(`UI: selector text «${s}» exists in App.jsx (fails loudly if the screen changes)`, SRC.includes(s)));
assert('UI: the selector list is not empty', (L.UI_STRINGS || []).length >= 10);

// ── 2. classifyRequest — from the request alone ──────────────────────────────
const lensSuffix = n => (SRC.match(new RegExp('const SYSTEM_LENS_' + n + ' = AURA_CORE_PERSONALITY \\+ `([\\s\\S]*?)`;')) || ['', ''])[1];
const sig = n => (app.catalog[n] || [''])[0];
const mainBody = (dyn) => ({ system: [{ type: 'text', text: CORE, cache_control: { type: 'ephemeral' } }, { type: 'text', text: lensSuffix('SIMPLIFY') + dyn }],
  messages: [{ role: 'user', content: 'Γεια.' }] });
const C1 = attempt(() => L.classifyRequest(mainBody('\n' + sig('firstReplyFloorCtx') + ' …\n' + '\n' + sig('gatesCtx') + ' …' + app.consts.marker), app), {});
assert('MAIN: kind main, lens SIMPLIFY', C1.kind === 'main' && C1.lens === 'SIMPLIFY');
assert('MAIN: names the contexts present, in order of appearance', JSON.stringify(C1.ctx) === JSON.stringify(['firstReplyFloorCtx', 'gatesCtx', 'stageAMarkerCtx']));
assert('MAIN: the Stage A marker is reported', C1.marker === true);
const C2 = attempt(() => L.classifyRequest(mainBody('\n' + sig('userStagnationCtx') + ' …'), app), {});
assert('MAIN: no marker → marker false; userStagnationCtx found', C2.marker === false && (C2.ctx || []).includes('userStagnationCtx'));
const C3 = attempt(() => L.classifyRequest(mainBody('\n[SOMETHING NEW THE CATALOG DOES NOT KNOW — appears here]\n' + sig('coreReadinessCtx')), app), {});
// A context whose opening words come from a ${…} hole inside a NESTED template (selfRepetitionCtx) — the shape a
// naive reader mis-split, so it showed up as «unknown» in the first engine check.
const C2b = attempt(() => L.classifyRequest(mainBody('\n[CODE-VERIFIED: your own last 2 replies were structurally similar (same opening phrase) — x]\n'), app), {});
assert('NESTED: a context built from a nested template is still named, and nothing is left «unknown»',
  (C2b.ctx || []).includes('selfRepetitionCtx') && (C2b.unknown || []).length === 0);
assert('UNKNOWN: a bracketed block no signature covers is listed, never silently dropped',
  (C3.unknown || []).length === 1 && C3.unknown[0].startsWith('[SOMETHING NEW') && (C3.ctx || []).includes('coreReadinessCtx'));
assert('DYNAMIC: only the per-turn part is kept, never the cached prompt', typeof C1.dynamic === 'string' && !C1.dynamic.includes(CORE.slice(0, 200)) && C1.dynamic.length < 20000);
const C4 = attempt(() => L.classifyRequest({ system: [{ type: 'text', text: CORE, cache_control: {} }, { type: 'text', text: lensSuffix('PERSPECTIVE') + '\n' + sig('firstWhyFloor') + ' …' }], messages: [] }, app), {});
assert('FIRST-WHY: recognised by its floor, lens PERSPECTIVE', C4.kind === 'firstWhy' && C4.lens === 'PERSPECTIVE');
const TERM = (SRC.match(/const SYSTEM_TERMINATION = `([\s\S]*?)`;/) || ['', ''])[1];
const C5 = attempt(() => L.classifyRequest({ system: [{ type: 'text', text: TERM, cache_control: {} }],
  messages: [{ role: 'user', content: 'x' }, { role: 'user', content: '[Deliver Part 1 now. DO NOT write a reflection summary: …' }] }, app), {});
assert('CLOSING: a SYSTEM_TERMINATION call is recognised as a closing call', C5.kind === 'termination');
assert('CLOSING: the instruction that came with it is reported (Part 1)', C5.closing && C5.closing.part === 'Part 1' && /^\[Deliver Part 1 now/.test(C5.closing.instruction));
const C6 = attempt(() => L.classifyRequest({ system: [{ type: 'text', text: TERM }], messages: [{ role: 'user', content: '[Deliver Part 2 now: Perceptual Closure Layer…' }] }, app), {});
assert('CLOSING: Part 2 too', C6.kind === 'termination' && C6.closing && C6.closing.part === 'Part 2');
const SUP = (SRC.match(/const SYSTEM_SUPPORTIVE = `([\s\S]*?)`;/) || ['', ''])[1];
const C7 = attempt(() => L.classifyRequest({ system: [{ type: 'text', text: SUP + '\n' + sig('memCtx') + ' x' + app.consts.marker }], messages: [] }, app), {});
assert('SUPPORTIVE (crisis reply): recognised, with its contexts and marker', C7.kind === 'supportive' && (C7.ctx || []).includes('memCtx') && C7.marker === true);
const C8 = attempt(() => L.classifyRequest({ system: [{ type: 'text', text: CORE }, { type: 'text', text: lensSuffix('SIMPLIFY') }],
  messages: [{ role: 'user', content: '[SYSTEM CONTEXT REFRESH: You are AURA…' }, { role: 'assistant', content: 'Understood. Continuing.' }, { role: 'user', content: 'x' }] }, app), {});
assert('REFRESH: the every-10th-turn context refresh is reported', C8.contextRefresh === true && C1.contextRefresh === false);
assert('ROBUST: a malformed body never throws', attempt(() => L.classifyRequest({}, app).kind === 'other', false) && attempt(() => L.classifyRequest(null, app).kind === 'other', false));

// ── 3. flagReply — heuristics, always labelled as needing a human ────────────
const F = (r, u) => attempt(() => L.flagReply(r, u, app), null) || [];
assert('FLAGS: a clean question → no flags', F('Τι είναι αυτό που σε κρατάει εκεί;', 'Με πιέζει η δουλειά').length === 0);
assert('FLAGS: a road map', F('**ΔΡΟΜΟΣ 1: Μένεις**\n**ΚΕΡΔΙΖΕΙΣ:** σταθερότητα\n**ΚΟΣΤΙΖΕΙ:** χρόνο\n**ΔΡΟΜΟΣ 2: Φεύγεις**\n**ΚΕΡΔΙΖΕΙΣ:** αέρα\n**ΚΟΣΤΙΖΕΙ:** ασφάλεια', 'x').some(f => /χάρτης/i.test(f)));
assert('FLAGS: a list of 2+ points', F('Μπορείς:\n- να ρωτήσεις\n- να περιμένεις', 'x').some(f => /λίστα/.test(f)));
assert('FLAGS: structure the user did not give («δύο δρόμους»)', F('Ανέφερες δύο δρόμους: να μείνεις ή να φύγεις.', 'Ή μένω ή φεύγω').some(f => /δομή/.test(f)));
assert('FLAGS: the same word used by the user is not flagged', F('Είπες «δύο επιλογές» — ποια σε βαραίνει;', 'Έχω δύο επιλογές').every(f => !/δομή/.test(f)));
assert('FLAGS: a step / obstacle / date question', F('Τι σε εμποδίζει να το κάνεις;', 'x').some(f => /βήμα|εμπόδι|ημερομην/.test(f)));
assert('FLAGS: asked for a solution, no honest deferral', F('Τι σε κρατάει εκεί;', 'Πες μου τι να κάνω').some(f => /αναβολή/.test(f)));
assert('FLAGS: asked, and deferred honestly → no deferral flag', F('Εδώ βρίσκουμε πρώτα τι σε απασχολεί· το «τι κάνω» έρχεται μετά τη ρίζα. Τι σε βαραίνει;', 'Πες μου τι να κάνω').every(f => !/αναβολή/.test(f)));
assert('FLAGS: asks again to name the root in one phrase (coreReadinessCtx loop sign)', F('Πες το μου με μία φράση: τι είναι αυτό που σε κρατάει;', 'x').some(f => /ξανά/.test(f)));
assert('FLAGS: the three-beat of the old closing', F('ΗΡΘΕΣ ΜΕ: α\nΒΡΗΚΕΣ: β\nΦΕΥΓΕΙΣ ΜΕ: γ', 'x').some(f => /ΗΡΘΕΣ/.test(f)));
assert('FLAGS: every flag says it needs human confirmation', (L.FLAG_NOTE || '').includes('χρειάζεται ανθρώπινη επιβεβαίωση'));

// ── 4. inferEnding — only what the screen and the requests show ──────────────
const E = o => attempt(() => L.inferEnding(o, app), {}) || {};
assert('ENDING: root confirmed → the Stage A end', /ΚΑΡΤΑ ΡΙΖΑΣ/.test(E({ rootConfirmed: true }).label || ''));
assert('ENDING: the «παρατήρηση» card → T6', /T6/.test(E({ warningCard: true }).label || ''));
assert('ENDING: closing card after «Ευχαριστώ, κλείνουμε» → T2', /T2/.test(E({ closureCard: true, lastUser: 'Ευχαριστώ, κλείνουμε εδώ.' }).label || ''));
assert('ENDING: closing card after a bare «Ναι» → T1 (probable)', /T1/.test(E({ closureCard: true, lastUser: 'Ναι' }).label || ''));
assert('ENDING: closing card after a three-beat → T7 (probable)', /T7/.test(E({ closureCard: true, lastUser: 'Μάλλον το είπα πριν, ας δούμε τι μένει να συζητήσουμε', threeBeatSeen: true }).label || ''));
assert('ENDING: closing card with friendPerspectiveCtx in the last request → T8 (probable)', /T8/.test(E({ closureCard: true, lastUser: 'Θα έλεγε ότι φοβάμαι υπερβολικά την αλλαγή', lastCtx: ['friendPerspectiveCtx'] }).label || ''));
assert('ENDING: otherwise honest — T3–T5 cannot be told apart on screen', /T3–T5/.test(E({ closureCard: true, lastUser: 'Ναι, αυτό με απασχολεί εδώ και καιρό πολύ' }).label || ''));
assert('ENDING: nothing happened → says so', /καμία/i.test(E({}).label || ''));

// ── 5. Report, outputs, key, budget ──────────────────────────────────────────
const REC = [{ name: 'Σ1', rootShown: true, rootConfirmed: true, ending: { label: 'ΚΑΡΤΑ ΡΙΖΑΣ — «Ναι»' }, cost: 0.4,
  turns: [{ user: 'Πες μου | τι να κάνω', aura: 'Γραμμή 1\nΓραμμή 2', flags: ['λίστα'], requests: [{ kind: 'main', lens: 'SIMPLIFY', ctx: ['gatesCtx'], marker: true, unknown: [] }] }] }];
const MD = attempt(() => L.buildReport(REC, { budget: 6, spent: 0.4, mode: 'real' }), '');
assert('REPORT: main criterion stated per session', /έφτασε σε ρίζα που επιβεβαίωσε ο χρήστης/i.test(MD) && /ΝΑΙ/.test(MD));
assert('REPORT: the per-turn table has the founder\'s columns', ['Χρήστης', 'AURA', 'Έλεγχος', 'Context', 'Σήμανση', 'Κάρτα', '«Ναι»', 'Τέλος'].every(h => MD.includes(h)));
assert('REPORT: table-safe (pipes and newlines escaped in cells)', MD.includes('Πες μου \\| τι να κάνω') && MD.includes('Γραμμή 1 ⏎ Γραμμή 2'));
assert('REPORT: never contains the cached prompt', !MD.includes(CORE.slice(0, 120)));
const TMP = os.tmpdir();
assert('OUTPUT: a folder inside the temp dir is accepted', attempt(() => L.outDirInTemp(path.join(TMP, 'aura_x'), TMP), '') === path.resolve(TMP, 'aura_x'));
assert('OUTPUT: a folder inside the repo is refused', attempt(() => { L.outDirInTemp(path.join(__dirname, 'x'), TMP); return false; }, true));
assert('OUTPUT: «..» cannot escape the temp dir', attempt(() => { L.outDirInTemp(path.join(TMP, '..', 'evil'), TMP); return false; }, true));
assert('OUTPUT: a sibling whose name only starts like the temp dir is refused', attempt(() => { L.outDirInTemp(TMP + '_evil', TMP); return false; }, true));
const KEY = 'sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ';
assert('KEY: redact removes every occurrence', attempt(() => L.redact('a ' + KEY + ' b ' + KEY, KEY), '') === 'a [REDACTED] b [REDACTED]');
assert('KEY: assertNoSecret throws if the key is present, passes otherwise',
  attempt(() => { L.assertNoSecret('x ' + KEY, KEY); return false; }, true) && attempt(() => { L.assertNoSecret('clean', KEY); return true; }, false));
assert('KEY: a missing/short key never redacts everything', attempt(() => L.redact('abc', ''), '') === 'abc' && attempt(() => L.redact('abc', 'ab'), '') === 'abc');
const U = { input_tokens: 1000000, output_tokens: 1000000, cache_creation_input_tokens: 1000000, cache_read_input_tokens: 1000000 };
assert('COST: Sonnet 4.6 prices (input 3, output 15, cache write 5m 3.75, cache read 0.30 per million)', Math.abs(attempt(() => L.costOf(U), 0) - 22.05) < 1e-9);
assert('COST: missing usage counts as 0', attempt(() => L.costOf({}), -1) === 0 && attempt(() => L.costOf(undefined), -1) === 0);
const G = attempt(() => L.makeBudget(1.0), null);
assert('BUDGET: allows spending under the limit', !!G && G.canSpend() === true);
if (G) { G.add({ input_tokens: 200000 }); G.add({ input_tokens: 200000 }); }
assert('BUDGET: stops at or over the limit', !!G && Math.abs(G.spent() - 1.2) < 1e-9 && G.canSpend() === false);

// ── 6. The scenarios cover the founder's six risks ───────────────────────────
const S = L.SCENARIOS || [];
assert('SCENARIOS: exactly six', S.length === 6);
['solution', 'bareYes', 'thanks', 'door1', 'door2back', 'ownStep'].forEach(k => assert(`SCENARIOS: covers «${k}»`, S.some(s => s.risk === k)));
assert('SCENARIOS: the repeated-request one repeats short requests (userStagnationCtx conditions)',
  (() => { const s = S.find(x => x.risk === 'solution'); return !!s && s.steps.filter(t => t.say && t.say.length < 30).length >= 3; })());
assert('SCENARIOS: the bare-yes one says a bare «Ναι» before any root step', (() => { const s = S.find(x => x.risk === 'bareYes'); const i = s ? s.steps.findIndex(t => t.say === 'Ναι') : -1; const j = s ? s.steps.findIndex(t => t.press) : -1; return i >= 0 && (j < 0 || i < j); })());
assert('SCENARIOS: the thanks one says «Ευχαριστώ» before any root step', (() => { const s = S.find(x => x.risk === 'thanks'); const i = s ? s.steps.findIndex(t => /^Ευχαριστώ/.test(t.say || '')) : -1; const j = s ? s.steps.findIndex(t => t.press) : -1; return i >= 0 && (j < 0 || i < j); })());
assert('SCENARIOS: door 2 answers the readiness question with «Ναι» and presses «Δεν το βρήκα ακόμα» on the card',
  (() => { const s = S.find(x => x.risk === 'door2back'); return !!s && s.steps.some(t => t.untilReadiness) && s.steps.some(t => t.card === 'back'); })());
assert('SCENARIOS: every root typed into the flow passes the app\'s own substance rule (else the card would never open)',
  attempt(() => { const src = SRC; const s = src.indexOf('function substanceOfSentence('); const r = src.indexOf('function rootTextHasSubstance('); const sp = src.indexOf('function splitSentences(');
    const blk = i => { let d = 0, st = false; for (let k = src.indexOf('{', i); ; k++) { if (src[k] === '{') { d++; st = true; } else if (src[k] === '}') { d--; if (st && d === 0) return src.slice(i, k + 1); } } };
    const H = new Function(blk(s) + '\n' + blk(sp) + '\n' + blk(r) + '\nreturn rootTextHasSubstance;')();
    return S.every(sc => sc.steps.every(t => !t.root || H(t.root))); }, false));
assert('SCENARIOS: no synthetic message trips the crisis detector (it would end in the crisis path, not the test)',
  attempt(() => S.every(s => s.steps.every(t => ['say', 'root', 'word'].every(k => !t[k] || app.fns.detectSafetySignal(t[k]) === null))), false));

// ── 7. The two scripts: structure that keeps the test honest and safe ────────
const E2E = attempt(() => fs.readFileSync(path.join(__dirname, '..', 'scripts', 'e2e_stage_a.cjs'), 'utf8'), '');
const RPL = attempt(() => fs.readFileSync(path.join(__dirname, '..', 'scripts', 'replay_stage_a.js'), 'utf8'), '');
assert('E2E: never calls Anthropic itself — only through the repo\'s own api/aura.js', !/api\.anthropic\.com/.test(E2E) && /path\.join\(REPO, 'api', 'aura\.js'\)/.test(E2E));
assert('E2E: builds and previews WITHOUT vite.config.js (no dev proxy, no second path to Anthropic)',
  (E2E.match(/configFile: false/g) || []).length === 2);
assert('E2E: the output folder goes through outDirInTemp', /const OUT = LIB\.outDirInTemp\(/.test(E2E));
assert('E2E: every file it writes is redacted and checked for the key first',
  /function writeOut\(name, text\) \{\s*const t = LIB\.redact\(text, KEY\);\s*LIB\.assertNoSecret\(t, KEY\);/.test(E2E) &&
  (E2E.match(/fs\.writeFileSync\(/g) || []).length === 1);
assert('E2E: the key is read only from the environment and is never printed', /const KEY = process\.env\.ANTHROPIC_API_KEY \|\| '';/.test(E2E) && !/console\.(log|error)\([^)]*\bKEY\b(?!\s*\?)/.test(E2E.replace(/KEY \? 'βρέθηκε'/, '')));
assert('E2E: the real model needs --yes, and stops at the budget', /MODE === 'real' && !has\('--yes'\)/.test(E2E) && /if \(!budget\.canSpend\(\)\)/.test(E2E));
assert('E2E: calls are spaced so api/aura.js\'s 20/minute limit can never be hit by the test', /lastCall \+ 3400 - Date\.now\(\)/.test(E2E));
assert('E2E: a fresh model per scenario', /await runScenario\(scen, await makeModel\(\), budget\)/.test(E2E));
assert('E2E: every request is classified from the request itself', /const cls = LIB\.classifyRequest\(body, APP\);/.test(E2E));
assert('E2E: only model-written text is flagged (steps with no request show the app\'s own texts)', /const flags = stepReqs\.length \?/.test(E2E));
assert('E2E: the switch is opened only for the test visit (?stageA=1), never in code', /page\.goto\(BASE \+ '\/\?stageA=1'\)/.test(E2E) && !/STAGE_A_ENABLED/.test(E2E));
assert('REPLAY: reads the marker from App.jsx (buildStageAMarker), no retyped copy',
  /buildStageAMarker/.test(RPL) && !/const MARKER = '\\n\[FREE PART/.test(RPL));
assert('REPLAY: says at the top that it is NOT used for decisions', /ΔΕΝ ΧΡΗΣΙΜΟΠΟΙΕΙΤΑΙ ΓΙΑ ΑΠΟΦΑΣΕΙΣ/.test(RPL.slice(0, 400)));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
