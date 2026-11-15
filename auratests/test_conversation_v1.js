// AURA — «συνομιλία v1» (John, 15/11/2026): four separate commits on the branch conversation-v1, from release-candidate e4b2ae6. Code only:
// the fixed prompt (b5f303cc9405aa21), api/aura.js and the screen filter are not touched, and the safety path sends what it sent.
//  (1) commit 1 — the stagnation note no longer sends the model to ROAD DISCOVERY in Stage A before the root (code 8397 ↔ prompt STAGE A (1)).
// The EXACT text each request carries is checked in the browser (scripts/e2e_stage_a.cjs, section NQ, «CV1»); here, the pure part and the wiring.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '', 'utf8').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const load = n => { try { return new Function(fnSrc(n) + '\nreturn ' + n + ';')(); } catch (e) { console.log('LOAD ERROR ' + n + ' — ' + e.message); return null; } };
const OPENINGS = (() => { const i = api.indexOf('openings: ['); return JSON.parse('[' + api.slice(i + 11, api.indexOf('],', i)).trim().replace(/,\s*$/, '') + ']'); })();
const guardAccepts = block => OPENINGS.some(o => block.replace(/^\n/, '').startsWith(o));

// ── (1) the stagnation note ─────────────────────────────────────────────────────────────────────────────────────────────────────
// The note (older than Stage A) tells the model, among other things, that "THIS IS THE MOMENT FOR ROAD DISCOVERY — THE ONE NAMED EXCEPTION's
// PATH TWO" and that "showing them the actual shape of their decision space is the work". Stage A suspends exactly that (prompt STAGE A (1):
// "SUSPENDED: … ROAD DISCOVERY and the road-map format"). With the switch open, before a confirmed root, off the safety path, the two
// sentences are not in the note and one sentence says the roads come after the root. Everywhere else the text is the one that was written
// inline before: the old flow, Stage A after the root, the crisis turn and every turn after the crisis line.
const ORIGINAL_SHA = '29d59864cb6a84554649986dddfd33c0ef647236ae330410ae9037e50c4b9974'; // the inline text of e4b2ae6, as the model received it
const stag = load('describeUserStagnationCtx');
assert('(1.1) the note text is one pure function, describeUserStagnationCtx(stageAPreRoot)', typeof stag === 'function');
const safe = (...a) => { try { return stag(...a); } catch (e) { return 'THREW ' + e.message; } };
const ORIG = typeof stag === 'function' ? safe(false) : '';
const STAGEA = typeof stag === 'function' ? safe(true) : '';
assert('(1.2) outside Stage A before the root the text is exactly the inline text of e4b2ae6 (sha256 29d59864…), for false, nothing, null and a string «true»',
  typeof stag === 'function' && [ORIG, safe(), safe(null), safe('true')].every(t => sha(t) === ORIGINAL_SHA));
assert('(1.3) … and that text still points to ROAD DISCOVERY — the old flow and the safety path are not changed',
  ORIG.includes('THIS IS THE MOMENT FOR ROAD DISCOVERY — THE ONE NAMED EXCEPTION\'s PATH TWO') && ORIG.includes('Showing them the actual shape of their decision space is the work.'));
assert('(1.4) in Stage A before the root the note says nothing of ROAD DISCOVERY, PATH TWO, distinct directions, the decision space or QUALITY BAILOUT',
  STAGEA.length > 0 && !/ROAD DISCOVERY|PATH TWO|DISTINCT DIRECTIONS|distinct directions|decision space|QUALITY BAILOUT|THE ONE NAMED EXCEPTION/.test(STAGEA));
assert('(1.5) … and keeps what it observes and its two moves: the last 2 replies, (a) ask why it is still open, (b) question the frame only where their own words say so',
  STAGEA.includes('the user\'s own last 2 replies introduced almost no new material AND became markedly shorter') && STAGEA.includes('(a) ASK WHY IT IS STILL OPEN') &&
  STAGEA.includes('(b) QUESTION THE FRAME') && STAGEA.includes('HARD CONDITION on (b)') && STAGEA.includes('Offered as a question, never as an interpretation stated.'));
const S2 = 'AND IF GENUINELY DISTINCT DIRECTIONS ARE ALREADY IMPLIED BY WHAT THEY HAVE SAID, THIS IS THE MOMENT FOR ROAD DISCOVERY — THE ONE NAMED EXCEPTION\'s PATH TWO, with all its output tests (distinctness, consequence, level, completeness) and their QUALITY BAILOUT clauses intact. ';
const S4 = 'Showing them the actual shape of their decision space is the work. If the material genuinely does not support distinct directions, say that plainly instead — that is also a real finding, never a reason to invent one. ';
const ADDED = 'Here, roads, a map, options and a step come only after the root: do not move toward them. ';
const S3 = 'A user who has stopped producing new material is not asking for another question; they have given what they have. ';
assert('(1.6) the Stage A text is the old text with exactly two sentences taken out and one added — nothing else moved',
  ORIG.split(S2).length === 2 && ORIG.split(S4).length === 2 && ORIG.indexOf(S2 + S3 + S4) > 0 &&
  STAGEA === ORIG.replace(S2 + S3 + S4, S3 + ADDED));
assert('(1.7) it is one block, begins and ends as the model expects and the api guard accepts it (the opening is one the guard already lists: no change to api/aura.js)',
  STAGEA.startsWith('\n[CODE-VERIFIED: the user\'s own last 2 replies') && STAGEA.endsWith(']\n') && !/\n\[/.test(STAGEA.slice(1)) && guardAccepts(STAGEA) && guardAccepts(ORIG));
assert('(1.8) the wiring: the note is still built under the same condition, and gets the Stage A rule that already holds the money and road notes',
  /const userStagnationCtx = \(!_crisisTurn && !roadQuestionState\.current && detectUserStagnation\(msgs\)\.stagnant\)\s*\? describeUserStagnationCtx\(_saNotesHeld\)\s*: '';/.test(CODE) &&
  /const _saNotesHeld = stageAPreRootNotesHeld\(stageAActive\.current, stageARef\.current\.stats\.rootConfirmed === 1, _safetyPath\);/.test(CODE));
assert('(1.9) the detector and the ladder are untouched: detectUserStagnation as before, and «stuck» still combines the same three signals',
  /const stuckSignalFired = !!\(clarityPivotCtx \|\| selfRepetitionCtx \|\| userStagnationCtx\);/.test(CODE) && fnSrc('detectUserStagnation').includes('const NO_PROGRESS = /(δεν ξέρω|δεν έχω ιδέα|ό,?τι πεις|όπως θες|δεν ξέρω τι|άκυρο|δεν μπορώ να πω)/i;'));

// ── (Ω1) nothing else changed. Each change of the branch conversation-v1, new → old, exactly as written (between the BEGIN/END marks; each commit
// adds its own, in auratests/conversation_v1_undo.json). With them taken out, src/App.jsx must be the file of release-candidate e4b2ae6, byte for byte — this is the proof behind the UPDATED
// fingerprint values of the older tests (John, 15/11/2026: only those values move). And the things this branch must not touch: the fixed prompt
// (b5f303cc9405aa21), api/aura.js, the openings its guard accepts, the screen filter, and the safety code (the 19 functions below, as in e4b2ae6).
{
  // the list (new → old, one entry per change of the branch) is the data file auratests/conversation_v1_undo.json; test_notes_card_1511.js (Ω2) reads the same file
  const UNDO = JSON.parse(fs.readFileSync(path.join(__dirname, 'conversation_v1_undo.json'), 'utf8'));
  const present = UNDO.filter(([nw]) => raw.split(nw).length === 2).length;
  let back = raw; for (const [nw, old] of UNDO) back = back.split(nw).join(old);
  assert('(Ω1) each of the ' + UNDO.length + ' changes of the branch is in src/App.jsx exactly once', present === UNDO.length);
  assert('(Ω1) … and with them taken out, src/App.jsx is byte for byte the file of release-candidate e4b2ae6 (sha256 1860c046…) — nothing else changed',
    present === UNDO.length && sha(back) === '1860c0465872482bd5a3bf4cbbf8dd962aeba92001a4ed774e3b4b7b7f9f077e');
  const lit = n => { const h = 'const ' + n + ' = `'; const a = raw.indexOf(h); const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
  assert('(Ω1) the fixed prompt is b5f303cc9405aa21, the crisis and closing prompts as before',
    sha(lit('AURA_CORE_PERSONALITY')).startsWith('b5f303cc9405aa21') && sha(lit('SYSTEM_SUPPORTIVE')).startsWith('c7815b96d83ebae8') && sha(lit('SYSTEM_TERMINATION')).startsWith('d5a77ca926f9490b'));
  assert('(Ω1) api/aura.js is the file of e4b2ae6, byte for byte (sha256 e791b194…)', sha(api) === 'e791b19471f0813246550e9d5a47bf7d95e46b4385814e4758d4abf8dea66053');
  let same = false, count = 0;
  try { const G = require(path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs')); same = JSON.stringify(G.openingsFor(raw)) === JSON.stringify(OPENINGS); count = OPENINGS.length; } catch (e) { console.log('LOAD ERROR openings — ' + e.message); }
  assert('(Ω1) the build would write the same list of openings: every note of the app still begins the way the guard expects (' + count + ')', same && count === 33);
  assert('(Ω1) the screen filter (the internal label heads and stripInternalLabels) is as in e4b2ae6, byte for byte',
    sha(raw.slice(raw.indexOf('const INTERNAL_LABEL_HEADS'), raw.indexOf('function stripAraDeclarative'))).startsWith('f3f9a30b63578889'));
  const SAFETY = {
    detectSafetySignal: '838fe96cf161fcae',
    detectsDangerFromOther: '59e2f828fda103fa',
    classifyCrisisTier: 'afa5cf7a370bb0d5',
    perTurnSafety: '42c868d331e2229a',
    informationModeNoteDue: 'd30dffdd6d827df3',
    stageAPreRootNotesHeld: '7b65f3bd71532cfc',
    computeEscalationLevel: 'b447d5bbaac2a19f',
    describeSafetyPathCtx: 'edb4d97939656976',
    describeStopMomentCtx: '71e44f923e2e143f',
    stopMomentGentleOnly: 'e15f2fd1c1e77d28',
    stageASafetyHold: 'f1fbe27ef7643815',
    describeMasterPriorityStageCtx: 'b9ec012473adece6',
    describeRiskClarificationCtx: '130061e8af62413d',
    detectsNoQuestionsRequest: '0dcfcc7bf50b5d99',
    stageACaptureAllowed: 'f8a46ebc62fe4ecd',
    detectsAffirmativeShort: '0a6f1957c0594d60',
    detectsCoreReadinessAsked: 'c84bd93559579f9e',
    detectsSpontaneousCoreRecognition: '6bc032dfcdda93cb',
    describeEscalationCtx: '1c4712957da99ab7'
  };
  const moved = Object.keys(SAFETY).filter(n => !fnSrc(n) || sha(fnSrc(n)).slice(0, 16) !== SAFETY[n]);
  assert('(Ω1) the safety code is as in e4b2ae6, byte for byte: the ' + Object.keys(SAFETY).length + ' detector, rule and note functions of the safety path (moved: ' + (moved.join(', ') || 'none') + ')', moved.length === 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
