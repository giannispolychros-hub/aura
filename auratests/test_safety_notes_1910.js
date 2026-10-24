// AURA — JOHN'S DECISION, 19/10/2026 (ADR «19 Οκτωβρίου (δ)»), a safety exception (α): the per-turn notes put safety first.
// Found by the read-only audit of 19/10 (ε, στ), reproduced with a fake model: on the crisis turn itself the MASTER PRIORITY note was
// never SAFETY — it said OPENING, «PERSPECTIVE SWAP … none of SAFETY … apply», or «GRACEFUL EXIT … governs now» — because it read
// `safetyMode`, a React state that changes only after the call returns (crisis B never sets it at all); and the crisis prompt went out
// with the loop notes (ESCALATION LEVEL 3, GATES DUE CHECK, «switch strategy») beside it.
//   1  The safety state is read from the session's risk latch, updated before any branch — crisis A and crisis B.
//   2  The crisis turn: SAFETY, and no GRACEFUL EXIT, loop, escalation, gates, strategy or self-repetition note.
//   3  Every turn after the crisis line: SAFETY; no escalation, no AUTO-KILL, no GRACEFUL EXIT (nor a note that pushes the closing or
//      asks for the root — they pull against the safety path the same way).
//   4  Switch open, before a confirmed root: never AUTO-KILL — the escalation stops at level 3.
//   5  Switch open, the first reply only: a note that the app does not ask First-WHY here.
// Only code: the fixed prompt, the detectors, the crisis lines and the crisis prompt are pinned unchanged below. The EXACT text each
// request carries is checked in the browser (scripts/e2e_stage_a.cjs, section SN); here, the pure parts and the wiring.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
const ROOT = path.join(__dirname, '..');

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name, C = CODE) {
  const a = C.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = C.indexOf('(', a), depth = 0;
  for (; k < C.length; k++) { if (C[k] === '(') depth++; else if (C[k] === ')') { depth--; if (depth === 0) break; } }
  const b = C.indexOf('{', k); depth = 0;
  for (let j = b; j < C.length; j++) { if (C[j] === '{') depth++; else if (C[j] === '}') { depth--; if (depth === 0) return C.slice(a, j + 1); } }
  return null;
}
const NAMES = ['perTurnSafety', 'computeEscalationLevel', 'describeEscalationCtx', 'describeStageAFirstReplyCtx', 'computeMasterPriorityStage', 'describeMasterPriorityStageCtx'];
let F = {};
try { F = new Function(NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')(); }
catch (e) { console.log('LOAD ERROR: ' + e.message); }
const T = (name, ...a) => { try { return F[name](...a); } catch (e) { return 'THREW: ' + e.message; } };
const SAFETY = '\n[MASTER PRIORITY RULE — STAGE: SAFETY (code-verified). Per MASTER PRIORITY RULE step 1 above, all other protocols pause; this is absolute and unconditional.]\n';
const FIRST_REPLY = '\n[STAGE A, FIRST REPLY — CODE-VERIFIED: in this flow the app does NOT ask First-WHY, so ENTRY — FIRST-WHY PROTOCOL and First-WHY above do not apply to this reply. Do not ask «Γιατί έχει σημασία αυτό για σένα τώρα;» and no generic «γιατί» question («Γιατί;», «Γιατί τώρα;», «Γιατί σε απασχολεί;»). Your first question stands on something specific from the user\'s own message.]\n';

// ── 1. Which turn: the risk latch, crisis A and crisis B ───────────────────────────────────────────────────────────────
{
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  assert('1: the crisis turn (SUPPORTIVE) is the safety path, whatever the latch says', eq(T('perTurnSafety', 'SUPPORTIVE', 0), { crisisTurn: true, safetyPath: true }));
  assert('1: after crisis A (latch 1) — the safety path', eq(T('perTurnSafety', 'ANSWER', 1), { crisisTurn: false, safetyPath: true }));
  assert('1: after crisis B (latch 2) — the safety path too (crisis B never set safetyMode)', eq(T('perTurnSafety', 'ANSWER', 2), { crisisTurn: false, safetyPath: true }));
  assert('1: DISTRESS (latch 3) shows no crisis line — not the safety path', eq(T('perTurnSafety', 'ANSWER', 3), { crisisTurn: false, safetyPath: false }));
  assert('1: no signal — not the safety path', eq(T('perTurnSafety', 'ANSWER', 0), { crisisTurn: false, safetyPath: false }) && eq(T('perTurnSafety', 'COMPRESSION', undefined), { crisisTurn: false, safetyPath: false }));
}
// ── 2–3. The stage on the safety path is SAFETY, never GRACEFUL EXIT / OPENING / PERSPECTIVE SWAP ──────────────────────
{
  assert('2: SAFETY wins over a closing word and over the first message', T('computeMasterPriorityStage', true, 1, true) === 'SAFETY' && T('computeMasterPriorityStage', true, 5, true) === 'SAFETY');
  assert('2: the SAFETY note, word for word', T('describeMasterPriorityStageCtx', 'SAFETY') === SAFETY);
}
// ── 4. Before the root with the switch open: the escalation stops at 3 ────────────────────────────────────────────────
{
  assert('4: capped at 3 — level 3, still stuck → stays 3, never AUTO-KILL', T('computeEscalationLevel', 3, true, 3) === 3 && T('computeEscalationLevel', 2, true, 3) === 3);
  assert('4: capped at 3 — even from a 4 left over', T('computeEscalationLevel', 4, true, 3) === 3);
  assert('4: capped at 3 — climbs one level at a time below it, back to 0 when movement resumes', T('computeEscalationLevel', 0, true, 3) === 1 && T('computeEscalationLevel', 3, false, 3) === 0);
  assert('4: without the cap (switch closed, or after the root) — as before: 3 → 4 (AUTO-KILL)', T('computeEscalationLevel', 3, true) === 4 && T('computeEscalationLevel', 3, true, 4) === 4);
  assert('4: level 3 is still the Perspective Swap note; 4 is still AUTO-KILL', /^\n\[ESCALATION LEVEL 3 \(Perspective Swap\)/.test(T('describeEscalationCtx', 3)) && /^\n\[AUTO-KILL/.test(T('describeEscalationCtx', 4)));
}
// ── 5. The first reply with the switch open ────────────────────────────────────────────────────────────────────────────
{
  assert('5: the note, word for word', T('describeStageAFirstReplyCtx', true, 1, false) === FIRST_REPLY);
  assert('5: only the first reply', T('describeStageAFirstReplyCtx', true, 2, false) === '' && T('describeStageAFirstReplyCtx', true, 0, false) === '');
  assert('5: never with the switch closed (the normal flow keeps its First-WHY)', T('describeStageAFirstReplyCtx', false, 1, false) === '');
  assert('5: never on a crisis turn (safety first)', T('describeStageAFirstReplyCtx', true, 1, true) === '');
}
// ── Wiring inside generateResponse ─────────────────────────────────────────────────────────────────────────────────────
{
  const gs = CODE.indexOf('const generateResponse = useCallback(async'), ge = CODE.indexOf('\n  }, [', gs);
  const G = gs >= 0 && ge > gs ? CODE.slice(gs, ge) : '';
  const at = re => { const m = re.exec(G); return m ? m.index : -1; };
  const def = at(/const _turnSafety = perTurnSafety\(currentMode, riskSignalKind\.current, stageAActive\.current && dangerFromOther\.current\);\n\s*const _crisisTurn = _turnSafety\.crisisTurn, _safetyPath = _turnSafety\.safetyPath;/); // UPDATED (23/10, Ο5): + the danger latch (danger from another person, test_danger_from_other_2310.js)
  assert('1: the safety state is computed from the latch before the first per-turn note is built', def > 0 && def < G.indexOf('const memCtx = ') && def < G.indexOf('const masterPriorityStageCtx'));
  assert('2/3: the MASTER PRIORITY stage reads it — SAFETY on the crisis turn and after the line, crisis A and B',
    /return describeMasterPriorityStageCtx\(_safetyPath \? 'SAFETY' : stage\);/.test(G) && G.indexOf("_safetyPath ? 'SAFETY' : stage") > G.indexOf('const masterPriorityStageCtx'));
  // held on the whole safety path (the crisis turn and every turn after the line)
  const HELD = {
    escalationCtx: /const escalationCtx = _safetyPath \? '' : describeEscalationCtx\(escalationLevel\.current\);/,
    gatesCtx: /gatesDueSnapshot\.current = \{ anchors: false, stakes: false, scale: false \};[\s\S]{0,500}?if \(roadQuestionState\.current\) return '';\n\s*if \(_safetyPath\) return '';/,
    closingDriftCtx: /const closingDriftCtx = \(\(\) => \{\n(?:\s*\/\/[^\n]*\n)*\s*if \(_safetyPath\) return '';/,
    coreReadinessCtx: /const coreReadinessCtx = \(coreReadinessConfirmed\.current && !concreteStepStated\.current\) && !_safetyPath/,
    shiftCheckCtx: /const shiftCheckCtx = deliverOnce\(shiftCheckConfirmed\.current && !_safetyPath/,
    friendPerspectiveCtx: /const friendPerspectiveCtx = deliverOnce\(friendPerspectiveConfirmed\.current && !_safetyPath/,
    roadQuestionCtx: /const roadQuestionCtx = \(\(\) => \{\n(?:\s*\/\/[^\n]*\n)*\s*if \(_safetyPath\) return '';/,
    postMapCloseCtx: /const postMapCloseCtx = deliverOnce\(\(\(\) => \{\n(?:\s*\/\/[^\n]*\n)*\s*if \(_safetyPath\) return '';/,
  };
  for (const [n, re] of Object.entries(HELD)) assert(`2/3: ${n} is held on the safety path`, re.test(G));
  // held on the crisis turn itself
  const CRISIS = {
    clarityPivotCtx: /const clarityPivotCtx = clarityPivotHint\.current && !_crisisTurn/,
    selfRepetitionCtx: /const selfRepetitionCtx = selfRepCheck\.repeated && !_crisisTurn/,
    userStagnationCtx: /const userStagnationCtx = \(!_crisisTurn && !roadQuestionState\.current && detectUserStagnation\(msgs\)\.stagnant\)/,
    methodFailureCtx: /const methodFailureCtx = methodFailureHint\.current && !_crisisTurn/,
    lastFiredFamilyCtx: /const lastFiredFamilyCtx = _crisisTurn \? '' : describeLastFiredFamilyCtx\(/,
    coverageReportCtx: /const coverageReportCtx = _crisisTurn \? '' : buildCoverageReport\(/,
    premiseInversionCtx: /const premiseInversionCtx = deliverOnce\(\(binaryOppositionCount\.current >= 2\) && !_crisisTurn/,
    tensionCtx: /const tensionCtx = detectSelfMarkedTension\([\s\S]{0,500}?\) && !_crisisTurn\n\s*\? `\\n\[CODE-VERIFIED: the user placed an opposition marker/,
    firstReplyFloorCtx: /const firstReplyFloorCtx = firstReplyFloorActive && !_crisisTurn/,
  };
  for (const [n, re] of Object.entries(CRISIS)) assert(`2: ${n} is held on the crisis turn`, re.test(G));
  assert('4: the escalation is capped at 3 with the switch open before a confirmed root',
    /escalationLevel\.current = computeEscalationLevel\(escalationLevel\.current, stuckSignalFired, stageAActive\.current && stageARef\.current\.stats\.rootConfirmed !== 1 \? 3 : 4\);/.test(G));
  assert('4: the stuck composition is unchanged', /const stuckSignalFired = !!\(clarityPivotCtx \|\| selfRepetitionCtx \|\| userStagnationCtx\);/.test(G));
  assert('5: the first-reply note is built from the switch, the turn and the crisis turn',
    /const stageAFirstReplyCtx = describeStageAFirstReplyCtx\(stageAActive\.current, msgCount, _crisisTurn\);/.test(G));
  const arr = (G.match(/const dynamicSuffix = \[([\s\S]*?)\]\.filter\(Boolean\)/) || ['', ''])[1];
  assert('5: … and goes with the hard constraints, right before the first-reply floor', /closingDriftCtx, stageAFirstReplyCtx, firstReplyFloorCtx, safetyPathCtx, stageAMarkerCtx,/.test(arr));
  // not in the collision log: that list feeds the families-used count of SESSION COVERAGE, so adding it changed the later notes of
  // a Stage A session with no crisis (caught by SN's recorded fingerprints)
  assert('5: … and NOT in the collision log, so the later notes of the session stay byte for byte as before',
    /\n\s*firstReplyFloorCtx, safetyPathCtx,\n\s*\}\)\.filter/.test(G) && !/stageAFirstReplyCtx[^\n]*\n\s*\}\)\.filter/.test(G));
  assert('5: … and an echo of its head is removed from the screen like every other context head', /"STAGE A, FIRST REPLY"/.test(CODE.slice(CODE.indexOf('const INTERNAL_LABEL_HEADS'), CODE.indexOf('function stripInternalLabels'))));
  assert('not deleted: every note of before is still in the list (held only where it conflicts)',
    ['memCtx', 'profileCtx', 'materialEvidenceCtx', 'goalObstacleStakesCtx', 'masterPriorityStageCtx', 'lastFiredFamilyCtx', 'coverageReportCtx', 'demoCtx', 'informationModeCtx',
      'explicitPauseCtx', 'coreReadinessCtx', 'shiftCheckCtx', 'premiseInversionCtx', 'friendPerspectiveCtx', 'clarityPivotCtx', 'selfRepetitionCtx', 'repeatedElementsCtx',
      'stopMomentCtx', 'riskClarificationCtx', 'methodFailureCtx', 'userStagnationCtx', 'escalationCtx', 'tensionCtx', 'roadQuestionCtx', 'postMapCloseCtx', 'gatesCtx',
      'closingDriftCtx', 'firstReplyFloorCtx', 'safetyPathCtx', 'stageAMarkerCtx'].every(n => new RegExp('\\b' + n + '\\b').test(arr)));
}
// ── Unchanged, by John's word: the fixed prompt, the crisis prompt, the detectors, the crisis lines ──────────────────────
// ADR «19 Οκτωβρίου (ε)» (John, 19/10): the prompt changed on purpose by exactly two voice edits — the first example without «Γιατί τώρα;»,
// and the singular rule (6). Undo them and the prompt must be a6d7fe7a… byte for byte: nothing else moved.
const VOICE_1910 = [['«Θέλω να αδυνατίσω» → «Έγινε κάτι πρόσφατα ή το σκέφτεσαι καιρό;»', '«Θέλω να αδυνατίσω» → «Γιατί τώρα; Έγινε κάτι πρόσφατα ή το σκέφτεσαι καιρό;»'],
  [' (6) Μιλάς πάντα στον ενικό ("εσύ"), ποτέ στον πληθυντικό ευγενείας ("εσείς", "Πέστε").', ''],
  // ADR «19 Οκτωβρίου (ζ)» (John): the number in the example is the user's, and the rule about numbers — two more edits, undone the same way
  // ADR «22 Οκτωβρίου» (John): the example without any number, and the rule about predictions — undone first, back to the (ζ) text
  ['(e.g. όταν ο χρήστης γράφει "τα κουβαλάω μόνη μου εδώ και καιρό": «Μόνη σου, εδώ και καιρό. Δεν είναι λίγο.»); when they do not, none. Αριθμό, διάρκεια ή μέτρημα μόνο αν το είπε ο χρήστης, με τα δικά του λόγια· ποτέ μη μετράς ή υπολογίζεις εσύ. Ποτέ πρόβλεψη για το μέλλον του χρήστη ή άλλου ανθρώπου, ούτε γενίκευση που μεγαλώνει τον φόβο του.',
    '(e.g. όταν ο χρήστης έχει πει "πέντε χρόνια": «Πέντε χρόνια έτσι. Δεν είναι λίγο.»); when they do not, none. Αριθμό, διάρκεια ή μέτρημα μόνο αν το είπε ο χρήστης, με τα δικά του λόγια· ποτέ μη μετράς ή υπολογίζεις εσύ.'],
  ['(e.g. όταν ο χρήστης έχει πει "πέντε χρόνια": «Πέντε χρόνια έτσι. Δεν είναι λίγο.»); when they do not, none. Αριθμό, διάρκεια ή μέτρημα μόνο αν το είπε ο χρήστης, με τα δικά του λόγια· ποτέ μη μετράς ή υπολογίζεις εσύ.',
    '(e.g. «Πέντε χρόνια έτσι. Δεν είναι λίγο.»); when they do not, none.']];
const undoVoice1910 = p => VOICE_1910.reduce((t, [now, before]) => (t.split(now).length === 2 ? t.replace(now, before) : 'MISSING ' + now), String(p || ''));
{
  const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
  // UPDATED (19/10, ADR «19 Οκτωβρίου (ε)»): commit A changed no prompt; commit B moved it only by John's two voice edits
  assert('UNCHANGED: the fixed prompt (as in 013a4de), apart from John\'s voice edits of 19/10 (ε) and (ζ)', h(undoVoice1910(raw.slice(_s, _e))) === 'a6d7fe7ae33515a0' && h(raw.slice(_s, _e)) !== 'a6d7fe7ae33515a0');
  const sup = (raw.match(/const SYSTEM_SUPPORTIVE = `([\s\S]*?)`;/) || ['', ''])[1];
  assert('UNCHANGED: the crisis prompt (SYSTEM_SUPPORTIVE)', h(sup) === 'c7815b96d83ebae8' && sup.length === 851);
  // UPDATED (22/10, ADR «22 Οκτωβρίου (β)», SAFETY): detectSafetySignal and classifyCrisisTier changed on purpose — Greeklish and spelling by
  // ear, additive; the phrase list, the crisis lines and the numbers are unchanged (pinned in test_crisis_greeklish_2210.js).
  const PIN = { detectSafetySignal: '6fd4d4b09ab6ed21' /* UPDATED (24/10, Ε1, a safety fix (α)): + the passive-ideation phrases — auratests/test_passive_ideation_2410.js */ /* UPDATED (22/10, final stress test A9): the message is also tried made plain, new phrases and a third person; tier B blanked inside — auratests/test_crisis_a9.js */, classifyCrisisTier: 'afa5cf7a370bb0d5', buildCrisisLine: 'd359e22dd7cf9a95',
    crisisLineAfterFailedCall: 'c87733effcebde7e' };
  for (const [n, v] of Object.entries(PIN)) assert(`UNCHANGED: ${n}`, h(fullFnSrc(n, raw)) === v);
  assert('UNCHANGED: the stage note texts (SAFETY / GRACEFUL EXIT / OPENING / PERSPECTIVE SWAP)', h(fullFnSrc('describeMasterPriorityStageCtx', raw)) === 'b9ec012473adece6');
  assert('UNCHANGED: the risk latch and the safety-path note', h(fullFnSrc('mergeRiskKind', raw)) === 'd3b56f5bad3ae14f' && h(fullFnSrc('describeSafetyPathCtx', raw)) === 'edb4d97939656976'); // UPDATED (23/10, Ο5): describeSafetyPathCtx changed on purpose — danger from another person (test_danger_from_other_2310.js).
}
// ── The browser section that checks the exact text of every request ─────────────────────────────────────────────────────
{
  const R = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
  assert('BROWSER: section SN, in the full run and alone', /async function runMockSN\(\)/.test(R) && /await runMockSN\(\);/.test(R) && /--only', ''\) === 'SN'\) await runMockSN\(\)/.test(R));
  assert('BROWSER: SN checks the exact SAFETY note and the exact first-reply note', R.includes(SAFETY.trim()) && R.includes(FIRST_REPLY.trim().replace("user's", "user\\'s")));
  assert('BROWSER: SN covers Α–Ζ, 4, 5 and the flow with no crisis', ["okCrisis('Α (", "okAfter('Β (", "okCrisis('Γ (", "okCrisis('Δ (", "okCrisis('Ε (", "okCrisis('ΣΤ (",
    'okCrisis(`Ζ (', '`SN 4 (switch open', "'SN 5 (switch open", '`SN normal flow (switch closed', '`SN normal flow (switch open'].every(t => R.includes(t)));
  assert('BROWSER: the flow with no crisis is compared with what 013a4de sent (recorded fingerprints)', /const SN_BASELINE = \{ closed: '[0-9a-f]{16}( [0-9a-f]{16}){5}',\n\s*open: '[0-9a-f]{16}( [0-9a-f]{16}){4}' \};/.test(R));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
