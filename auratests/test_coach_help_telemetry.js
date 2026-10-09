// AURA — STAGE A, decision 6 of 8/10/2026 (ADR «8 Οκτωβρίου (δ)»): the ONE-TAP QUESTION after «Θέλω να συνεχίσω»
// («Τι θα σε βοηθούσε περισσότερο;») is the basic test of whether anyone would pay for the Coach. Until now the choice was
// kept only in the stats and written to the device telemetry at the END of the session (`session_completed`). A user who
// answered and then closed the app left nothing — and so did one who saw the question and left.
//   Now two passive records, counts only, written the moment it happens:
//     coach_help_asked   { asked: 1 }                 — the question was shown
//     coach_help_choice  { choice: 1 | 2 | 3 | 0 }    — which one; 0 = «Συνέχεια» (no choice)
//   «Asked» without a later «choice» = the user left without answering. They go through recordTelemetry (whitelisted keys,
//   small integers only — no text can pass), so they reach the device log and the ?debug=1 export («τηλεμετρία (.json)»).
//   Switch closed: the Stage A UI does not exist, nothing is written. `session_completed.coachHelpChoice` is unchanged.

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
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name) {
  const a = CODE.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = CODE.indexOf('(', a), depth = 0;
  for (; k < CODE.length; k++) { if (CODE[k] === '(') depth++; else if (CODE[k] === ')') { depth--; if (depth === 0) break; } }
  const b = CODE.indexOf('{', k); depth = 0;
  for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') depth++; else if (CODE[j] === '}') { depth--; if (depth === 0) return CODE.slice(a, j + 1); } }
  return null;
}
let F = {};
try {
  F = new Function(['initialStageAState', 'stageAStep', 'stageAHelpTelemetry', 'stageATelemetry'].map(n => fullFnSrc(n) || `function ${n}(){return undefined}`).join('\n') +
    '\nreturn { initialStageAState, stageAStep, stageAHelpTelemetry, stageATelemetry };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };

// walk the real state machine to the offer, then through the question
function toOffer() {
  let s = T('initialStageAState');
  for (const ev of [{ type: 'press' }, { type: 'open', door: 1, found: 'Φοβάμαι την απόρριψη', assistantReplies: 2, riskKind: 0 }, { type: 'yes', riskKind: 0 }]) s = T('stageAStep', s, ev);
  return s;
}
const step = (s, ev) => { const n = T('stageAStep', s, ev); return { next: n, tel: T('stageAHelpTelemetry', s, n, ev) }; };

// ── The pure rule ────────────────────────────────────────────────────────────
{
  const offer = toOffer();
  assert('FIXTURE: after «Ναι» the offer is open', offer.phase === 'offer');
  const w = step(offer, { type: 'want' });
  assert('ASKED: «Θέλω να συνεχίσω» opens the question and records that it was shown (nothing else)',
    w.next.phase === 'notReady' && w.tel && w.tel.event === 'coach_help_asked' && JSON.stringify(w.tel.fields) === '{"asked":1}');
  for (const c of [1, 2, 3]) {
    const h = step(w.next, { type: 'help', choice: c });
    assert(`CHOICE ${c}: the tap is recorded as choice ${c}, and the stats agree`,
      h.tel && h.tel.event === 'coach_help_choice' && h.tel.fields.choice === c && h.next.stats.coachHelpChoice === c && h.next.phase === 'clarity');
  }
  const none = step(w.next, { type: 'help', choice: 0 });
  assert('NO CHOICE: «Συνέχεια» is recorded as choice 0 (the question was seen, nothing chosen)', none.tel && none.tel.event === 'coach_help_choice' && none.tel.fields.choice === 0 && none.next.stats.coachHelpChoice === 0);
  const junk = step(w.next, { type: 'help', choice: 7 });
  assert('NO CHOICE: a value that is not 1–3 is recorded as 0, never as itself', junk.tel && junk.tel.fields.choice === 0);
  assert('NOT RECORDED: «Όχι τώρα», «Ναι, αυτό είναι», an event that does not fit the phase, a missing argument',
    step(offer, { type: 'notNow' }).tel === null && T('stageAHelpTelemetry', null, offer, { type: 'want' }) === null && T('stageAHelpTelemetry', offer, null, { type: 'want' }) === null &&
    step(offer, { type: 'help', choice: 2 }).tel === null && step(w.next, { type: 'want' }).tel === null);
  const sc = T('stageATelemetry', step(w.next, { type: 'help', choice: 2 }).next.stats, {});
  assert('UNCHANGED: session_completed still carries coachHelpChoice, coachOfferShown, coachOfferClicked', sc.coachHelpChoice === 2 && sc.coachOfferShown === 1 && sc.coachOfferClicked === 1);
}

// ── What reaches the device log: through the real recordTelemetry (whitelist) ─
{
  const src = fullFnSrc('recordTelemetry');
  const store = {};
  const win = { location: { search: '?stageA=1&debug=1' }, localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } } };
  let rec = null, rec2 = null, rec3 = null;
  try {
    const rt = new Function('window', 'console', 'URLSearchParams', src + '\nreturn recordTelemetry;')(win, { log() {} }, URLSearchParams);
    rec = rt('coach_help_asked', { asked: 1 });
    rec2 = rt('coach_help_choice', { choice: 2 });
    rec3 = rt('coach_help_choice', { choice: 0, text: 'το κείμενο του χρήστη', nested: { a: 1 } });
  } catch (e) { console.log('LOAD ERROR — ' + e.message); }
  assert('WHITELIST: the event names and the keys pass the existing schema (numbers only)', rec && rec.ev === 'coach_help_asked' && rec.asked === 1 && rec2 && rec2.choice === 2);
  assert('WHITELIST: text and objects cannot pass — only the number is kept', rec3 && rec3.choice === 0 && !('text' in rec3) && !('nested' in rec3));
  const log = JSON.parse(store['aura_telemetry_log'] || '[]');
  assert('DEBUG EXPORT: with ?debug=1 all three are in aura_telemetry_log — the file «τηλεμετρία (.json)» reads exactly this log',
    log.length === 3 && log[0].ev === 'coach_help_asked' && log[1].choice === 2 && log[2].choice === 0 && !JSON.stringify(log).includes('κείμενο'));
  assert('DEBUG EXPORT: exportTelemetry reads the same key', /window\.localStorage\.getItem\("aura_telemetry_log"\)/.test(fullFnSrc('exportTelemetry') || ''));
}

// ── Wiring ───────────────────────────────────────────────────────────────────
{
  const d = (CODE.match(/const stageADispatch = useCallback\(\(ev\) => \{[\s\S]*?\n  \}, \[\]\);/) || [''])[0];
  assert('WIRING: every Stage A step goes through stageADispatch; the record is made right there, from the state before and after',
    /const _prev = stageARef\.current;\s*stageARef\.current = stageAStep\(_prev, ev\);\s*setStageAPhase\(stageARef\.current\.phase\);\s*const _tel = stageAHelpTelemetry\(_prev, stageARef\.current, ev\);[^\n]*\n\s*if \(_tel\) recordTelemetry\(_tel\.event, _tel\.fields\);/.test(d));
  const ui = CODE.slice(CODE.indexOf('{/* STAGE A UI — BEGIN */}'), CODE.indexOf('{/* STAGE A UI — END */}'));
  assert('SWITCH CLOSED: the buttons that make these steps exist only inside the Stage A UI, which renders only with the switch open',
    ui.includes('{stageAActive.current && (') && ui.includes('type: "want"') && ui.includes('type: "help", choice: 1') && ui.includes('type: "help", choice: 0') &&
    (CODE.match(/stageADispatch\(\{ type: "want"/g) || []).length === 1 && (CODE.match(/stageADispatch\(\{ type: "help"/g) || []).length === 4 &&
    (ui.match(/stageADispatch\(\{ type: "(want|help)"/g) || []).length === 5);
  assert('NO CONTENT: the pure rule builds the record from the step and the number only, never from text',
    !/found|knew|content|userText/.test(fullFnSrc('stageAHelpTelemetry') || 'found'));
  assert('SCOPE: no new off-device flow — recordTelemetry stays local, the remote switch stays closed',
    /const REMOTE_TELEMETRY_ENABLED = false;/.test(CODE) && !/fetch\(["']\/api\/telemetry/.test(CODE));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
