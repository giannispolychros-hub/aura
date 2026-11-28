// ── THE HEAVINESS LATCH LEAVES A RECORD: «gravity_latched» — numbers only (John, 27/11/2026, ADR «27 Νοεμβρίου» (2)) ───────────────────────────────────
//
// WHY. The latch (riskSignalKind: 1 crisis A · 2 crisis B · 3 DISTRESS) cuts the step after «Ναι», the closing from code, the list of the user's own sentences, the «δικαίωμα ομιλίας» and the Thought Map. Until
// now it left NO trace in the numbers of a session: a session where it lit looked, in the tester's file, like one that simply did not reach the step. The measurement of 27/11/2026 found exactly that case (a
// real session cut at its 2nd message for a word that meant judgement) by reading text by hand. John's order: record the value of the latch and the round it lit, so that sessions with the latch can be told from the
// number «reached the step» — numbers only, no phrase of the user, no text.
//
// THE RULE (one sentence): ONE record when the latch lights for the first time in a session, and one more each time it gets HEAVIER (3 → 2 → 1); the same level again, or a lighter signal after a heavier one,
// leaves nothing — so a session leaves 0 to 3 records, never one per message. Fields: n = the level the latch went to (1, 2 or 3), turn = the number of messages the user has submitted in this session, the one in which
// the latch changed included (typed answers of Stage A included; «Νέα συνεδρία» starts again from 0), by = 1 when the user's own words lit it, 2 when AURA's own reply did (a referral to a mental-health professional —
// the second place that raises the latch, ADR «11 Οκτωβρίου (ε)»). Nothing else.
//
// WHERE IT GOES, AND WHEN IT REACHES US (the limit John asked to be stated, not promised): recordTelemetry keeps the record in the page's memory (window.__auraTelemetry) and, ONLY with ?rec=1 or ?debug=1,
// in the device's localStorage («aura_telemetry_log», the last 500). Nothing is sent out: REMOTE_TELEMETRY_ENABLED is false. It reaches us only if the tester presses «Στείλε τα στοιχεία της δοκιμής» (the file is downloaded
// and copied) and sends it. If the tester leaves without doing that, we have nothing — the record is NOT guaranteed to survive an abandoned session, and this test does not pretend it is.
//
// Fixtures are synthetic or generic phrases; no user text from a real session is stored.
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extract(name) {
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return CODE.slice(s, CODE.indexOf('\n}', s) + 2);
}
const lift = (names, ret, params) => { try { return new Function(...(params || []), names.map(extract).join('\n') + '\nreturn ' + ret + ';'); } catch (e) { return null; } };

// ── 1. THE HELPER: a pure function, numbers in, numbers out ─────────────────────────────────────────────────────────────────────────────────────────────
const SRC = extract('gravityLatchedFields');
assert('gravityLatchedFields is defined in App.jsx', !!SRC);
let G = null;
if (SRC) { try { G = eval('(' + SRC + ')'); } catch (e) { console.log('FAIL — evaluates standalone: ' + e.message); failed++; } }
assert('it evaluates standalone, so the suites can lift it without siblings', typeof G === 'function');
if (typeof G === 'function') {
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  assert('the latch lights for the first time (0 → 3) in round 2, by the user: {n:3, turn:2, by:1}', eq(G(0, 3, 2, 1), { n: 3, turn: 2, by: 1 }));
  assert('first activation by crisis A (0 → 1) and by crisis B (0 → 2)', eq(G(0, 1, 5, 1), { n: 1, turn: 5, by: 1 }) && eq(G(0, 2, 1, 1), { n: 2, turn: 1, by: 1 }));
  assert('it gets heavier (3 → 2, 3 → 1, 2 → 1): one more record each time', eq(G(3, 2, 4, 1), { n: 2, turn: 4, by: 1 }) && eq(G(3, 1, 6, 1), { n: 1, turn: 6, by: 1 }) && eq(G(2, 1, 7, 1), { n: 1, turn: 7, by: 1 }));
  assert('the same level again leaves nothing (1 → 1, 2 → 2, 3 → 3)', G(1, 1, 3, 1) === null && G(2, 2, 3, 1) === null && G(3, 3, 3, 2) === null);
  assert('a lighter signal after a heavier one leaves nothing — it cannot happen through the merge, and if it were asked it is not recorded (1 → 3, 2 → 3, 1 → 2)', G(1, 3, 3, 1) === null && G(2, 3, 3, 1) === null && G(1, 2, 3, 1) === null);
  assert('no signal (0 → 0) leaves nothing', G(0, 0, 1, 1) === null);
  assert('AURA\'s own reply lights it (by 2): {n:3, turn:3, by:2}', eq(G(0, 3, 3, 2), { n: 3, turn: 3, by: 2 }));
  assert('an unknown source is not recorded (by 0, 3, «1», undefined) — it never invents one', [0, 3, '1', undefined, null].every(b => G(0, 3, 2, b) === null));
  assert('an impossible level is not recorded (n 0, 4, «3», NaN, undefined)', [0, 4, '3', NaN, undefined].every(n => G(0, n, 2, 1) === null));
  assert('a missing latch before counts as none (undefined → 3)', eq(G(undefined, 3, 2, 1), { n: 3, turn: 2, by: 1 }));
  assert('the round is a whole number 0–9999: 12.5 → 0, -3 → 0, «4» → 0, 99999 → 9999', G(0, 3, 12.5, 1).turn === 0 && G(0, 3, -3, 1).turn === 0 && G(0, 3, '4', 1).turn === 0 && G(0, 3, 99999, 1).turn === 9999);
  assert('the fields are exactly n, turn, by — three numbers, nothing else', ['n', 'turn', 'by'].every(k => Number.isInteger(G(0, 3, 2, 1)[k])) && Object.keys(G(0, 3, 2, 1)).sort().join() === 'by,n,turn');
  assert('the helper reads no text: no string, no .content, no input in its body', !/\.content\b|\binput\b|\btext\b|\bmsg\b|\bmessages\b/.test(SRC));

  // ── 2. THROUGH THE REAL RECORDER: numbers pass, a text put in their place is dropped ─────────────────────────────────────────────────────────────────
  const REC = extract('recordTelemetry');
  let rec = null;
  if (REC) { try { rec = eval('(' + REC + ')'); } catch (e) { console.log('FAIL — recordTelemetry evaluates standalone: ' + e.message); failed++; } }
  if (typeof global.window === 'undefined') global.window = {};
  const log = () => global.window.__auraTelemetry || [];
  assert('the event name «gravity_latched» is accepted by the recorder\'s own name rule (a-z and _, up to 32)', /^[a-z_]{1,32}$/.test('gravity_latched'));
  if (typeof rec === 'function') {
    global.window.__auraTelemetry = [];
    const r1 = rec('gravity_latched', G(0, 3, 2, 1));
    assert('the record has the event, a time and the three numbers — and nothing else', !!r1 && Object.keys(r1).sort().join() === 'by,ev,n,t,turn' && r1.ev === 'gravity_latched' && r1.n === 3 && r1.turn === 2 && r1.by === 1);
    global.window.__auraTelemetry = [];
    const r2 = rec('gravity_latched', { n: 'Το πένθος για τη μητέρα μου', turn: ['Θέλω να πεθάνω'], by: { msg: 'ένα κείμενο' } });
    assert('TEXT in place of the numbers is dropped by the recorder: the record keeps no n, no turn, no by', !!r2 && !('n' in r2) && !('turn' in r2) && !('by' in r2));
    assert('… and no stored record anywhere contains the text', !JSON.stringify(log()).includes('πένθος') && !JSON.stringify(log()).includes('πεθάνω') && !JSON.stringify(log()).includes('κείμενο'));
  }

  // ── 3. THE EXPORT CARRIES IT (the tester's file) — numbers only ────────────────────────────────────────────────────────────────────────────────────────
  const EXP = extract('buildTesterExport');
  if (EXP) {
    const BE = eval('(' + EXP + ')');
    const out = BE([{ ev: 'session_started', t: 1 }, { ev: 'gravity_latched', t: 2, n: 3, turn: 2, by: 1 }, { ev: 'gravity_latched', t: 3, n: 'Το πένθος', turn: 4, by: 2 }, { ev: 'step_shown', t: 4, value: 0 }], '2026-11-27T00:00:00Z');
    const g = out.events.filter(e => e.ev === 'gravity_latched');
    assert('the tester export carries gravity_latched with n, turn and by', g.length === 2 && g[0].n === 3 && g[0].turn === 2 && g[0].by === 1);
    assert('… and a text in a field never reaches the file', !('n' in g[1]) && !JSON.stringify(out).includes('πένθος'));
  }

  // ── 4. A WHOLE SESSION, through the REAL detectors and the real merge — one record per change, never one per message ─────────────────────────────────
  const D = lift(['detectSafetySignal'], 'detectSafetySignal');
  const T = lift(['detectSafetySignal', 'classifyCrisisTier'], 'classifyCrisisTier');
  const M = lift(['mergeRiskKind'], 'mergeRiskKind');
  if (D && T && M) {
    const detect = D(), tier = T(), merge = M();
    // the call site, as written in handleSubmit: before = latch; latch = merge(...) [the unchanged line]; record = helper(before, latch, round, 1)
    const run = (msgs) => { let latch = 0; const recs = []; msgs.forEach((t, i) => { const before = latch; latch = merge(latch, detect(t), tier(t)); const r = G(before, latch, i + 1, 1); if (r) recs.push(r); }); return { latch, recs }; };
    const DIST = 'Το πένθος για τη μητέρα μου με έχει παραλύσει.', DIST2 = 'Και το πένθος δεν φεύγει.', B = 'Δεν αντέχω άλλο.', A = 'Θέλω να πεθάνω.', PLAIN = 'Έχω πολλή δουλειά αυτή την εβδομάδα.';
    let s = run([PLAIN, DIST, DIST2, PLAIN, B, A, A, B, DIST, PLAIN]);
    assert('a session of ten messages — DISTRESS (2), again (3), crisis B (5), crisis A (6), then A, B, DISTRESS again and plain — leaves exactly 3 records: {3,2}, {2,5}, {1,6}', JSON.stringify(s.recs.map(r => [r.n, r.turn])) === '[[3,2],[2,5],[1,6]]' && s.latch === 1);
    s = run([DIST, DIST, DIST, DIST]);
    assert('the same DISTRESS four times leaves ONE record (round 1), not four', s.recs.length === 1 && s.recs[0].n === 3 && s.recs[0].turn === 1);
    s = run([PLAIN, PLAIN, PLAIN]);
    assert('a session with no signal leaves no record', s.recs.length === 0 && s.latch === 0);
    s = run([A, DIST, B, A]);
    assert('crisis A first: one record (1, round 1); the lighter signals after it leave nothing', s.recs.length === 1 && s.recs[0].n === 1 && s.recs[0].turn === 1);
    s = run([B, A]);
    assert('crisis B, then A: two records (2 then 1)', s.recs.length === 2 && s.recs[0].n === 2 && s.recs[1].n === 1 && s.recs[1].turn === 2);
    // the property over many random sessions: at most 3 records, the levels strictly heavier each time, the rounds strictly later, and the last level is the latch
    const POOL = [PLAIN, DIST, DIST2, B, A, 'Η κόρη μου είναι σε κρίση.', 'Έχω κρίση πανικού.', 'Η κρίση του δικαστηρίου ήταν δίκαιη.', 'Ναι.'];
    let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let okAll = true, maxRecs = 0;
    for (let k = 0; k < 400; k++) {
      const msgs = Array.from({ length: 1 + Math.floor(rnd() * 12) }, () => POOL[Math.floor(rnd() * POOL.length)]); const r = run(msgs);
      maxRecs = Math.max(maxRecs, r.recs.length);
      const strictly = r.recs.every((x, i) => i === 0 || (x.n < r.recs[i - 1].n && x.turn > r.recs[i - 1].turn));
      const last = r.recs.length ? r.recs[r.recs.length - 1].n === r.latch : r.latch === 0;
      if (!(r.recs.length <= 3 && strictly && last)) okAll = false;
    }
    assert('400 random sessions: never more than 3 records (' + maxRecs + ' at most), each heavier and later than the one before, the last one equals the latch', okAll && maxRecs <= 3);
  }
}

// ── 5. THE CODE: two call sites, one ref, one reset — and the lines that were there are unchanged ────────────────────────────────────────────────────
const SITES = CODE.split('recordTelemetry("gravity_latched"').length - 1;
assert('recordTelemetry("gravity_latched", …) is written exactly twice in App.jsx: the user\'s message and AURA\'s referral', SITES === 2);
const userSite = 'const _gravBefore = riskSignalKind.current;\n    riskSignalKind.current = mergeRiskKind(riskSignalKind.current, detectSafetySignal(userText), classifyCrisisTier(userText));\n';
assert('site 1 (handleSubmit): the latch is read, THEN the unchanged merge line, then the record with by = 1 and the round', CODE.includes(userSite) &&
  /const _gravBefore = riskSignalKind\.current;\n {4}riskSignalKind\.current = mergeRiskKind\(riskSignalKind\.current, detectSafetySignal\(userText\), classifyCrisisTier\(userText\)\);\n {4}\{ const _gr = gravityLatchedFields\(_gravBefore, riskSignalKind\.current, submitRound\.current, 1\); if \(_gr\) recordTelemetry\("gravity_latched", _gr\); \}/.test(CODE));
assert('site 2 (AURA\'s own referral): the latch is read, THEN the unchanged line, then the record with by = 2 and the round', /const _gravBefore2 = riskSignalKind\.current;\n {6}if \(detectsMentalHealthReferral\(text\)\) riskSignalKind\.current = mergeRiskKind\(riskSignalKind\.current, "DISTRESS", null\);\n {6}\{ const _gr2 = gravityLatchedFields\(_gravBefore2, riskSignalKind\.current, submitRound\.current, 2\); if \(_gr2\) recordTelemetry\("gravity_latched", _gr2\); \}/.test(CODE));
assert('these are the only two places that raise the live latch (mergeRiskKind is applied to riskSignalKind.current exactly twice)', (CODE.match(/riskSignalKind\.current = mergeRiskKind\(/g) || []).length === 2);
assert('no call site passes anything but the helper\'s result: no text, no word, no input box', ['_gr', '_gr2'].every(v => CODE.includes('recordTelemetry("gravity_latched", ' + v + ')')) && !/recordTelemetry\("gravity_latched",\s*\{/.test(CODE));
assert('the round is a ref of its own: const submitRound = useRef(0), once', (CODE.match(/const submitRound\s*=\s*useRef\(0\)/g) || []).length === 1);
assert('… added by one in handleSubmit, before the latch is read (once), and nowhere else', (CODE.match(/submitRound\.current \+= 1;/g) || []).length === 1 && CODE.indexOf('submitRound.current += 1;') < CODE.indexOf('const _gravBefore = riskSignalKind.current;') && CODE.indexOf('const _gravBefore = riskSignalKind.current;') - CODE.indexOf('submitRound.current += 1;') < 200);
assert('… and reset inside resetSession («Νέα συνεδρία» starts the round again), once, after the reset of the road answers and before the end of the function', (() => { const a = CODE.indexOf('const resetSession'), b = CODE.indexOf('submitRound.current = 0;'), c = CODE.indexOf('riskSignalKind.current = 0;', a); return (CODE.match(/submitRound\.current = 0;/g) || []).length === 1 && a > 0 && c > a && b > c && b - a < 6000 && CODE.indexOf('roadAnswersFinal.current = [];', a) < b; })());
assert('the old latch line of resetSession is the one it was', CODE.includes('riskSignalKind.current = 0; labelLeaks.current = 0; dangerFromOther.current = false; dangerLineShown.current = [];'));
assert('nothing leaves the device: REMOTE_TELEMETRY_ENABLED is false, and the device log is written only under ?rec=1 / ?debug=1', /const REMOTE_TELEMETRY_ENABLED = false;/.test(CODE) && /\["debug", "rec"\]\.some\(k => new URLSearchParams\(window\.location\.search\)\.get\(k\) === "1"\)/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
