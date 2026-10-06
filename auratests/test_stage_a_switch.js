// AURA — STAGE A SWITCHES (SPEC_FREE_END.md §8, step 0.1; ADR «6 Οκτωβρίου (β)»)
//
// FOUNDER DECISION (2026-10-06): everything of Stage A is built on `main` behind a switch that stays
// CLOSED until John says otherwise. Off-device telemetry has its own, separate switch, and it turns on
// first, alone. For John's phone test, Stage A — and only Stage A — opens for one visit with ?stageA=1.
//
// What this pins:
//   1. Both switches exist and are false on main.
//   2. ?stageA=1 opens Stage A for the visit; nothing else does (no other value, no other parameter),
//      and the decision is never stored anywhere (no localStorage / sessionStorage / cookie).
//   3. ?stageA=1 can NEVER turn telemetry on, and ?debug=1 (John's test devices) never sends.
//   4. The switch is read once per visit in the component, the same way debugMode is.
//   5. No bypass: the constants are read only inside their two functions.
//   6. Nothing is sent off the device yet (step 2.2 will add the one, gated, send).
//   7. The switches live outside AURA_CORE_PERSONALITY, so the prompt (and its cache) is untouched.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');

const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);
// Code without // line comments, so a comment that names an identifier is not counted as a use.
const CODE_NC = CODE.split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n');

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

function extractFn(name) {
  const a = CODE.indexOf('function ' + name + '(');
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1); }
  }
  return null;
}
function constDecl(name) {
  const m = CODE.match(new RegExp('^const ' + name + ' = (true|false);', 'm'));
  return m ? m[1] : null;
}

// ── 1. The switches exist and are closed ─────────────────────────────────────
assert('SWITCH: STAGE_A_ENABLED is declared at top level', constDecl('STAGE_A_ENABLED') !== null);
assert('SWITCH: STAGE_A_ENABLED is false on main', constDecl('STAGE_A_ENABLED') === 'false');
assert('SWITCH: REMOTE_TELEMETRY_ENABLED is declared at top level', constDecl('REMOTE_TELEMETRY_ENABLED') !== null);
assert('SWITCH: REMOTE_TELEMETRY_ENABLED is false on main', constDecl('REMOTE_TELEMETRY_ENABLED') === 'false');
assert('SWITCH: each is declared exactly once',
  (CODE_NC.match(/const STAGE_A_ENABLED\b/g) || []).length === 1 &&
  (CODE_NC.match(/const REMOTE_TELEMETRY_ENABLED\b/g) || []).length === 1);

const stageSrc = extractFn('isStageAActive');
const telSrc = extractFn('isRemoteTelemetryActive');
assert('FUNCTIONS: isStageAActive exists', !!stageSrc);
assert('FUNCTIONS: isRemoteTelemetryActive exists', !!telSrc);

function build(stageOn, telOn) {
  const body = `const STAGE_A_ENABLED = ${stageOn}; const REMOTE_TELEMETRY_ENABLED = ${telOn};\n` +
    (stageSrc || 'function isStageAActive(){return null}') + '\n' +
    (telSrc || 'function isRemoteTelemetryActive(){return null}') + '\n' +
    'return { isStageAActive, isRemoteTelemetryActive };';
  return new Function(body)();
}
const OFF = build(false, false);

// ── 2. ?stageA=1 opens Stage A for the visit; nothing else does ──────────────
const opens = ['?stageA=1', '?debug=1&stageA=1', '?stageA=1&debug=1', '?x=2&stageA=1'];
const stays = ['', '?', '?stageA=0', '?stageA=true', '?stageA=11', '?stageA=', '?stagea=1', '?StageA=1',
  '?stage=1', '?debug=1', '?telemetry=1', 'stageA', '#stageA=1'];
opens.forEach(q => assert(`STAGE A (closed switch): opens for the visit with «${q}»`, OFF.isStageAActive(q) === true));
stays.forEach(q => assert(`STAGE A (closed switch): stays closed with «${q || '(empty)'}»`, OFF.isStageAActive(q) === false));
[undefined, null, 1, {}, []].forEach(v =>
  assert(`STAGE A: a non-string (${JSON.stringify(v)}) never opens it and never throws`, (() => {
    try { return OFF.isStageAActive(v) === false; } catch (e) { return false; }
  })()));
const STAGE_ON = build(true, false);
assert('STAGE A: the constant really drives it — with STAGE_A_ENABLED = true it is open with no parameter',
  STAGE_ON.isStageAActive('') === true && STAGE_ON.isStageAActive(undefined) === true);
assert('STAGE A: the decision is never stored (no localStorage / sessionStorage / cookie in the function)',
  !!stageSrc && !/localStorage|sessionStorage|document\.cookie|indexedDB/.test(stageSrc));

// ── 3. Telemetry: only its own switch, never ?stageA=1, never on test devices ─
['', '?stageA=1', '?telemetry=1', '?remoteTelemetry=1', '?debug=0'].forEach(q =>
  assert(`TELEMETRY (closed switch): off with «${q || '(empty)'}»`, OFF.isRemoteTelemetryActive(q) === false));
const TEL_ON = build(false, true);
assert('TELEMETRY: the constant really drives it — with REMOTE_TELEMETRY_ENABLED = true it is on',
  TEL_ON.isRemoteTelemetryActive('') === true && TEL_ON.isRemoteTelemetryActive('?stageA=1') === true);
assert('TELEMETRY: ?debug=1 (John\'s and testers\' devices) never sends, even with the switch on',
  TEL_ON.isRemoteTelemetryActive('?debug=1') === false && TEL_ON.isRemoteTelemetryActive('?stageA=1&debug=1') === false);
assert('TELEMETRY: Stage A being open does not turn telemetry on',
  build(true, false).isRemoteTelemetryActive('') === false);
// [[1]] makes URLSearchParams throw (a pair must have two items): both gates must FAIL CLOSED.
assert('FAIL CLOSED: if reading the URL throws, telemetry stays off even with its switch on', (() => {
  try { return TEL_ON.isRemoteTelemetryActive([[1]]) === false; } catch (e) { return false; }
})());
assert('FAIL CLOSED: if reading the URL throws, Stage A stays closed', (() => {
  try { return OFF.isStageAActive([[1]]) === false; } catch (e) { return false; }
})());
assert('TELEMETRY: a non-string never throws', (() => {
  try { return TEL_ON.isRemoteTelemetryActive(undefined) === true && OFF.isRemoteTelemetryActive(null) === false; }
  catch (e) { return false; }
})());

// ── 4. Read once per visit in the component ──────────────────────────────────
assert('COMPONENT: the switch is read once, from the URL, into a ref (like debugMode)',
  /const stageAActive = useRef\(typeof window !== 'undefined' && isStageAActive\(window\.location\.search\)\);/.test(CODE));

// ── 5. No bypass ─────────────────────────────────────────────────────────────
const usesOf = name => (CODE_NC.match(new RegExp('\\b' + name + '\\b', 'g')) || []).length;
assert('NO BYPASS: STAGE_A_ENABLED is read only inside isStageAActive (declaration + 1 use)',
  usesOf('STAGE_A_ENABLED') === 2 && !!stageSrc && /STAGE_A_ENABLED/.test(stageSrc));
assert('NO BYPASS: REMOTE_TELEMETRY_ENABLED is read only inside isRemoteTelemetryActive (declaration + 1 use)',
  usesOf('REMOTE_TELEMETRY_ENABLED') === 2 && !!telSrc && /REMOTE_TELEMETRY_ENABLED/.test(telSrc));

// ── 6. Nothing leaves the device yet ─────────────────────────────────────────
assert('NO SEND YET: no sendBeacon and no /api/telemetry anywhere in the app (step 2.2 adds the gated send)',
  !/sendBeacon/.test(CODE_NC) && !/\/api\/telemetry/.test(CODE_NC));

// ── 7. The prompt is untouched ───────────────────────────────────────────────
assert('PROMPT: the switches live outside AURA_CORE_PERSONALITY',
  !/STAGE_A_ENABLED|REMOTE_TELEMETRY_ENABLED|isStageAActive|stageA=1/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
