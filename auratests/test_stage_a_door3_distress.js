// AURA — STAGE A, decisions of 8/10/2026 (ADR «8 Οκτωβρίου (β)»), switch open only:
//   2  the door at the first closing reads «Αν κάτι σου ξεκαθάρισε, πες το με μία φράση: τι είναι αυτό που πραγματικά σε
//      απασχολεί;» — in a real test «Ευχαριστώ» meant «I found the root», not «I am leaving».
//   3  door 3 without substance («Ναι, αυτό ακριβώς είναι!»): the root question INSTEAD of a model reply — never a model
//      question with the root question under it. With substance: the card after the reply, as before. Crisis / DISTRESS:
//      the safety path as today. The «Νομίζω βρήκα» button: unchanged.
//   4  a closing message that itself carries DISTRESS (or crisis): no door — the same as with the switch closed. The root
//      button stays available.

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

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name) { // the WHOLE function — its parameters may themselves contain braces
  const a = CODE.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = CODE.indexOf('(', a), depth = 0;
  for (; k < CODE.length; k++) { if (CODE[k] === '(') depth++; else if (CODE[k] === ')') { depth--; if (depth === 0) break; } }
  const b = CODE.indexOf('{', k); depth = 0;
  for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') depth++; else if (CODE[j] === '}') { depth--; if (depth === 0) return CODE.slice(a, j + 1); } }
  return null;
}
function extractBlock(startToken, from) {
  const a = CODE.indexOf(startToken, from || 0);
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1); }
  }
  return null;
}
const sha = x => crypto.createHash('sha256').update(x || '', 'utf8').digest('hex').slice(0, 16);
const NAMES = ['stageALeavingDoorOpens', 'detectSafetySignal', 'classifyCrisisTier', 'detectsSpontaneousCoreRecognition', 'rootTextHasSubstance'];
let F = {};
try {
  const need = new Set(NAMES);
  for (let pass = 0; pass < 4; pass++) {
    const src = [...need].map(n => fullFnSrc(n) || '').join('\n');
    (src.match(/\b([a-zA-Z_]\w*)\(/g) || []).map(x => x.slice(0, -1)).forEach(n => { if (!need.has(n) && CODE.includes('\nfunction ' + n + '(')) need.add(n); });
  }
  const consts = ['KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS'].map(n => { const a = CODE.indexOf('const ' + n + ' = '); return CODE.slice(a, CODE.indexOf(';\n', a) + 1); });
  F = new Function(consts.join('\n') + '\n' + [...need].map(n => fullFnSrc(n)).join('\n') + '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const textsSrc = (extractBlock('const STAGE_A_TEXTS = ') || 'const STAGE_A_TEXTS = {}') + ';';
const T = new Function(textsSrc + '\nreturn STAGE_A_TEXTS;')();
const SUB = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleStageAPress = useCallback('));
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));

// ── 2: the new text ──────────────────────────────────────────────────────────
assert('2: the door at the first closing — the new text, exactly',
  T.askLeaving === 'Αν κάτι σου ξεκαθάρισε, πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;');
assert('2: the old «Πριν φύγεις:» text is gone from the code (the closing word question «Πριν φύγεις — …» is another text and stays)',
  !CODE.includes('Πριν φύγεις: πες το με μία φράση') && T.word === 'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.');
assert('2: the door 1 question and «Δεν το βρήκα ακόμα» are unchanged',
  T.ask === 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;' && T.back === 'Δεν το βρήκα ακόμα, συνέχισε');

// ── 4: a closing message with DISTRESS / crisis opens no door ────────────────
{
  const base = p => Object.assign({ active: true, decision: 'confirm', lastUserText: 'Ευχαριστώ', used: false, rootPhase: null, armed: false,
    rootConfirmed: false, closingStarted: false, riskKind: 0, safetyMode: false }, p || {});
  const DIS = 'Ευχαριστώ, κλείνουμε. Το πένθος για τη μητέρα μου με έχει παραλύσει.';
  const CRB = 'Ευχαριστώ, κλείνουμε. Δεν βλέπω νόημα σε τίποτα πια.';
  assert('4: the fixture is a real closing carrying DISTRESS', F.detectSafetySignal(DIS) === 'DISTRESS');
  assert('4: closing + DISTRESS in the same message → no door (the old closing runs, as with the switch closed)',
    F.stageALeavingDoorOpens(base({ lastUserText: DIS, riskKind: 3 })) === false);
  assert('4: closing + crisis B in the same message → no door either', F.stageALeavingDoorOpens(base({ lastUserText: CRB, riskKind: 2 })) === false);
  assert('4: a DISTRESS / crisis B signal EARLIER in the session, a plain «Ευχαριστώ» now → the door as decided in (λ)',
    F.stageALeavingDoorOpens(base({ riskKind: 3 })) === true && F.stageALeavingDoorOpens(base({ riskKind: 2 })) === true);
  assert('4: one rule in one place — the gate itself refuses a closing message with any safety signal',
    /!detectSafetySignal\(u\)/.test(fullFnSrc('stageALeavingDoorOpens') || ''));
  const btn = fullFnSrc('stageARootButtonVisible') || '';
  assert('4: the root button is untouched (its rule reads no closing message and no DISTRESS)', btn.length > 0 && !/detectSafetySignal|DISTRESS/.test(btn));
}

// ── 3: door 3 without substance — the root question instead of the model ─────
{
  assert('3: the fixture — «Ναι, αυτό ακριβώς είναι!» is a recognition without substance',
    F.detectsSpontaneousCoreRecognition('Ναι, αυτό ακριβώς είναι!') === true && F.rootTextHasSubstance('Ναι, αυτό ακριβώς είναι!') === false);
  const pre = SUB.indexOf('// STAGE A — door 3 without substance BEFORE the model');
  const leave = SUB.indexOf('// STAGE A — «Πριν φύγεις:» BEFORE the model');
  const next = SUB.indexOf('const nextMsgs  = [...messages, { id: nextMsgId(), role: "user", content: userText }];');
  const dis = SUB.indexOf('if (safetySignal === "DISTRESS") {');
  const blk = pre >= 0 ? SUB.slice(pre, next) : '';
  assert('3: placed after the crisis and DISTRESS branches (safety path first, as today) and before anything is sent',
    pre > dis && dis > 0 && pre > leave && leave > 0 && next > pre);
  assert('3: the same conditions as door 3 after a reply — switch open, a reply already, latch not flipped, no flow, no closing, not tier A',
    /if \(stageAActive\.current && messages\.some\(m => m\.role === "assistant" && m\.msgMode !== "STAGE_A"\) &&\s*!coreReadinessConfirmed\.current && !stageARef\.current\.phase && !reflectionDelivered\.current && riskSignalKind\.current !== 1 &&\s*detectsSpontaneousCoreRecognition\(userText\) && !rootTextHasSubstance\(userText\)\) \{/.test(blk));
  assert('3: the latch flips as it would have after the reply, door 1\'s question opens (door 3 kept), the turn ENDS — nothing sent',
    /coreReadinessConfirmed\.current = true;[^\n]*\n\s*stageADispatch\(\{ type: "reask", door: 3 \}\);\s*return;\s*\}/.test(blk) && !/generateResponse|callAura|setMessages/.test(blk));
  assert('3: door 3 WITH substance still opens the card after the reply, as before (unchanged)',
    /else if \(_saSpont && rootTextHasSubstance\(_saLastUser\.content\)\) stageAOpen\(3, _saLastUser\.content, msgs\);/.test(GEN));
  assert('3: the «Νομίζω βρήκα» button is unchanged', /const handleStageAPress = useCallback\(\(\) => \{\s*if \(loading\) return;\s*stageADispatch\(\{ type: "press" \}\);\s*\}, \[loading, stageADispatch\]\);/.test(CODE));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
