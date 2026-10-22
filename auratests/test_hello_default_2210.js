// ADR «22 Οκτωβρίου (ε)» (John, 22/10, before the 20). Two changes, nothing else.
// 1. A bare «γεια» while nothing has been said yet is an OPENING, not an exit. The rehearsal of the 20 (run 44, session 8): «γεια» as the
//    first message was read as a goodbye — the root question of the leaving door came right after the first reply, and the next message
//    became a root card with no conversation at all (a fault that breaks the measurement of the root: freeze rule (β)). In the old flow the
//    same «γεια» opened the closing card. After a conversation, «γεια» is an exit exactly as before; no other exit phrase changes.
// 2. Stage A is the DEFAULT flow: one constant. The plain link and ?stageA=1 open Stage A, ?stageA=0 the old flow. The device log of
//    numbers is kept ONLY with ?rec=1 (and John's ?debug=1); nothing is ever sent off the device (the remote switch stays off).
// Fixtures are synthetic.
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce), PROMPT = raw.slice(cs, ce);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

// a top-level function with every top-level function and constant it reaches (the same walk as test_e2e_stress_harness.js)
function fnSrc(n) {
  const a = CODE.indexOf('\nfunction ' + n + '('); if (a < 0) return null;
  let k = CODE.indexOf('(', a), d = 0; for (; k < CODE.length; k++) { if (CODE[k] === '(') d++; else if (CODE[k] === ')') { d--; if (!d) break; } }
  const b = CODE.indexOf('{', k); d = 0; for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') d++; else if (CODE[j] === '}') { d--; if (!d) return CODE.slice(a + 1, j + 1); } }
  return null;
}
function load(name) {
  try {
    const seen = new Set(), order = [];
    (function walk(n) { if (seen.has(n)) return; seen.add(n); const x = fnSrc(n); if (!x) return;
      for (const m of new Set((x.match(/\b([a-zA-Z_]\w*)\(/g) || []).map(y => y.slice(0, -1)))) if (CODE.includes('\nfunction ' + m + '(')) walk(m); order.push(x); })(name);
    let code = order.join('\n');
    const consts = [];
    for (const k of new Set(code.match(/\b[A-Z][A-Z_0-9]{3,}\b/g) || [])) { const m = new RegExp('\\nconst ' + k + ' = ').exec(CODE); if (m) consts.push(CODE.slice(m.index + 1, CODE.indexOf(';\n', m.index + 1) + 1)); }
    return new Function(consts.join('\n') + '\n' + code + '\nreturn ' + name + ';')();
  } catch (e) { console.log('LOAD ERROR (' + name + ') — ' + e.message); return null; }
}
const opening = load('isOpeningGreeting');
const door = load('stageALeavingDoorOpens'), preRoot = load('stageAPreRootDecision'), decide = load('decideTermination');
const O = (t, e) => { try { return opening(t, e); } catch (e2) { return 'threw'; } };

// ── 1. The opening greeting itself ──────────────────────────────────────────────────────────────────────────────────────────
for (const t of ['γεια', 'Γεια', 'γεια!', 'Γεια.', 'γειά', 'Γειά!', 'ΓΕΙΑ', ' Γεια!! '])
  assert('OPENING: «' + t.trim() + '» as the first message is an opening, not an exit', O(t, []) === true);
assert('OPENING: «γεια» after nothing but greetings is still an opening (AURA has not answered anything yet)',
  O('γεια', ['Γεια']) === true && O('Γεια.', ['Γεια σου']) === true && O('γεια', ['Καλησπέρα', 'γεια']) === true);
assert('NOT OPENING: «γεια» after a conversation — an exit, as before', O('γεια', ['Δουλεύω νοσηλεύτρια και είμαι κουρασμένη.']) === false &&
  O('Γεια.', ['Γεια', 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει.', 'Γιατί κάθε μέρα είναι ίδια.']) === false);
assert('NOT OPENING: history unknown (no list passed) — an exit, as before (no caller loses an exit by forgetting the history)',
  O('γεια', undefined) === false && O('γεια', null) === false);
assert('NOT OPENING: only the bare «γεια» — «γεια σου», «Καλησπέρα», «Ευχαριστώ, γεια», «γεια, κλείνουμε» are not openings by this rule',
  ['γεια σου', 'Καλησπέρα', 'Ευχαριστώ, γεια', 'γεια, κλείνουμε', 'Καληνύχτα', 'αντίο', 'κουράστηκα', ''].every(t => O(t, []) === false));

// ── 2. The five examples, before and after: the leaving door (Stage A) and the old closing (decideTermination) ──────────────────
const CONV = ['Δουλεύω νοσηλεύτρια σε βάρδιες και είμαι συνέχεια κουρασμένη.', 'Τις νύχτες κυρίως.', 'Γυρνάω σπίτι και δεν έχω κουράγιο.',
  'Ίσως γιατί δεν λέω ποτέ όχι.', 'Μάλλον φοβάμαι τι θα πουν οι άλλοι.'];
const msgsFor = (earlier, t) => { const m = []; for (const u of earlier) m.push({ role: 'user', content: u }, { role: 'assistant', content: 'Τι εννοείς;' }); m.push({ role: 'user', content: t }); return m; };
const OPTS = { safetyMode: false, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0, modelJudgesEnd: false };
const EX = [['«γεια» 1ο', 'γεια', []], ['«Γεια.» 1ο', 'Γεια.', []], ['«γεια σου» 1ο', 'γεια σου', []], ['«Καλησπέρα» 1ο', 'Καλησπέρα', []], ['«γεια» 6ο, μετά από συζήτηση', 'γεια', CONV]];
const WANT = { '«γεια» 1ο': false, '«Γεια.» 1ο': false, '«γεια σου» 1ο': false, '«Καλησπέρα» 1ο': false, '«γεια» 6ο, μετά από συζήτηση': true };
for (const [label, t, earlier] of EX) {
  const st = { active: true, used: false, rootPhase: false, armed: false, rootConfirmed: false, closingStarted: false, riskKind: 0, safetyMode: false,
    lastUserText: t, earlierUserTexts: earlier };
  let d = null, p = null, dec = null;
  try { d = door(st); } catch (e) { d = 'threw'; }
  try { dec = decide(msgsFor(earlier, t), '', OPTS); } catch (e) { dec = 'threw:' + e.message; }
  try { p = preRoot('confirm', st); } catch (e) { p = 'threw'; }
  const exitNow = WANT[label];
  assert('EXAMPLE ' + label + ': Stage A leaving door ' + (exitNow ? 'OPENS (exit, as before)' : 'stays shut (not an exit)'), d === exitNow);
  assert('EXAMPLE ' + label + ': old-flow closing decision ' + (exitNow ? '«confirm» (exit, as before)' : 'is not an exit'), exitNow ? dec === 'confirm' : dec !== 'confirm' && typeof dec === 'string' && !dec.startsWith('threw'));
  assert('EXAMPLE ' + label + ': the pre-root decision keeps a closing only for an exit', p === (exitNow ? 'confirm' : 'none'));
}
assert('HISTORY UNKNOWN: a caller that passes no history keeps the exit (the door opens on «γεια» as before)',
  door({ active: true, riskKind: 0, lastUserText: 'γεια' }) === true && preRoot('confirm', { active: true, lastUserText: 'γεια' }) === 'confirm');

// ── 3. Wiring: every exit check that can fire before any conversation knows the history ────────────────────────────────────────
{
  const callsDoor = CODE.match(/stageALeavingDoorOpens\(\{[\s\S]{0,1400}?closingStarted:/g) || [];
  assert('WIRING: both calls of the leaving door pass the earlier user messages', callsDoor.length === 2 && callsDoor.every(c => /earlierUserTexts:/.test(c)));
  const callsPre = CODE.match(/stageAPreRootDecision\([\s\S]{0,1400}?lastUserText[\s\S]{0,300}?\}\)/g) || [];
  assert('WIRING: every call of the pre-root decision passes the earlier user messages', callsPre.length === 3 && callsPre.every(c => /earlierUserTexts:/.test(c)));
  const dt = fnSrc('decideTermination') || '';
  assert('WIRING: the old closing — a declared exit is never an opening greeting', /isOpeningGreeting\(/.test(dt));
  for (const [name, re] of [['the MASTER PRIORITY stage (GRACEFUL EXIT)', /const userSignalsClosing = [^\n]*isOpeningGreeting\(/],
    ['the gates suffix', /if \(\(isExplicitClosure\(lastUserMsgForGates\) \|\| declaresClosing\(lastUserMsgForGates\)\) && !isOpeningGreeting\(/],
    ['the «closing signal N messages ago» note', /userMsgs\.findIndex\(\(m, i\) => !isOpeningGreeting\(/],
    ['the session telemetry «explicitClosure»', /_declared[\s\S]{0,700}isOpeningGreeting\(/],
    ['the farewell after a bare-emoji reply', /const userWasClosing = [^\n]*isOpeningGreeting\(/]])
    assert('WIRING: ' + name + ' does not count an opening greeting as closing', re.test(CODE));
  const mc = fnSrc('stageAModelClosesBeforeRoot') || '';
  assert('WIRING: «the model closes before the root» — the user\'s own exit excluded, an opening greeting is not one', /isOpeningGreeting\(u, o\.earlierUserTexts\)/.test(mc));
  assert('UNCHANGED: the exit detectors themselves (isExplicitClosure, declaresClosing, matchesClosingWord) do not know about openings',
    ['isExplicitClosure', 'declaresClosing', 'matchesClosingWord'].every(n => !/isOpeningGreeting/.test(fnSrc(n) || 'isOpeningGreeting')));
}

// ── 4. Stage A is the default: one constant ─────────────────────────────────────────────────────────────────────────────────────
const stageA = load('isStageAActive'), remote = load('isRemoteTelemetryActive');
assert('DEFAULT: STAGE_A_ENABLED = true, declared once', /\nconst STAGE_A_ENABLED = true;/.test(CODE) && (CODE.match(/const STAGE_A_ENABLED\b/g) || []).length === 1);
for (const [q, want] of [['', true], ['?stageA=1', true], ['?stageA=1&rec=1', true], ['?stageA=0', false], ['?stageA=0&rec=1', false], ['?rec=1', true], ['?debug=1', true]])
  assert('ADDRESS «/' + q + '»: ' + (want ? 'Stage A' : 'the old flow'), !!stageA && stageA(q) === want);
assert('NOTHING STORED: the flow is read from the address once per visit — no localStorage, sessionStorage or cookie in the switch, no service worker in the app',
  !/localStorage|sessionStorage|document\.cookie/.test(fnSrc('isStageAActive') || 'localStorage') && !/serviceWorker|caches\.open/.test(raw) &&
  /const stageAActive = useRef\(typeof window !== 'undefined' && isStageAActive\(window\.location\.search\)\);/.test(CODE));
for (const q of ['', '?stageA=1', '?stageA=1&rec=1', '?stageA=0'])
  assert('NO SEND: «/' + q + '» — the off-device switch stays off, nothing leaves the device', !!remote && remote(q) === false);
assert('NO SEND: REMOTE_TELEMETRY_ENABLED = false; no sendBeacon, no telemetry endpoint; the only network call is /api/aura',
  /\nconst REMOTE_TELEMETRY_ENABLED = false;/.test(CODE) && !/sendBeacon|\/api\/telemetry/.test(CODE) && (CODE.match(/fetch\(/g) || []).length === 1 && /fetch\("\/api\/aura"/.test(CODE));
{
  // the device log of numbers: only with ?rec=1 (or ?debug=1), never otherwise
  const rt = fnSrc('recordTelemetry');
  const run = q => { const store = {}; const win = { location: { search: q }, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } } };
    const f = new Function('window', 'console', rt + '\nreturn recordTelemetry;')(win, { log() {} }); f('session_started', {}); return !!store.aura_telemetry_log; };
  assert('RECORDING: the device log of numbers is kept with «?stageA=1&rec=1» and «?rec=1»', !!rt && run('?stageA=1&rec=1') && run('?rec=1'));
  assert('RECORDING: nothing is kept on the plain link, «?stageA=1» or «?stageA=0»', !!rt && !run('') && !run('?stageA=1') && !run('?stageA=0'));
}
assert('PROMPT: untouched by both changes (the switch and the opening greeting live outside the prompt)', !/isOpeningGreeting|STAGE_A_ENABLED|stageA=0/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
