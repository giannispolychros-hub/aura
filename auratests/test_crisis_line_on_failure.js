// AURA — SAFETY (§0.1), found by the stress test with the real model on 10/10/2026 (ADR «10 Οκτωβρίου (γ)»).
// The crisis line (1018 + 112 for tier A, 10306 once for tier B) was added ONLY to the model's reply. When the call failed —
// bad mobile signal, a rate limit, a timeout, an outage, a rejected key — a person who had just written «Δεν θέλω να ζω
// άλλο» saw only «Σφάλμα: Κάτι δεν λειτούργησε. Δοκίμασε ξανά.», and no number at all.
//   Now, on a crisis (SUPPORTIVE) turn whose call fails, the SAME line, chosen by the SAME rule (buildCrisisLine with the
//   tier of the message, as if the model had said nothing), is shown on screen by code. The failed message is still rolled
//   back into the input box so the person can send it again; a later successful reply clears the line (the reply carries
//   its own — so the once-per-session 10306 is not marked as shown on a failure). Any other failed turn: unchanged. All
//   users, switch open or closed.

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
const NAMES = ['crisisLineAfterFailedCall', 'buildCrisisLine', 'classifyCrisisTier', 'detectSafetySignal'];
let F = {};
try {
  const need = new Set(NAMES);
  for (let pass = 0; pass < 4; pass++) {
    const src = [...need].map(n => fullFnSrc(n) || '').join('\n');
    (src.match(/\b([a-zA-Z_]\w*)\(/g) || []).map(x => x.slice(0, -1)).forEach(n => { if (!need.has(n) && CODE.includes('\nfunction ' + n + '(')) need.add(n); });
  }
  const consts = (CODE.match(/^const (CRISIS_[A-Z_]+|DISTRESS_[A-Z_]+|SAFETY_[A-Z_]+) = [^\n]*$/gm) || []).join('\n');
  F = new Function(consts + '\n' + [...need].map(n => fullFnSrc(n) || `function ${n}(){return undefined}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));

const A = 'Δεν θέλω να ζω άλλο.', B = 'Δεν αντέχω άλλο, κλείνουμε εδώ.', PLAIN = 'Η δουλειά με κουράζει.';
const L1018 = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const L10306 = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';
const msgs = u => [{ role: 'user', content: 'Γεια' }, { role: 'assistant', content: 'Τι σε φέρνει;' }, { role: 'user', content: u }];

// ── The rule ─────────────────────────────────────────────────────────────────
assert('FIXTURES: the two sentences are crisis A and crisis B by the app\'s own detector',
  T('classifyCrisisTier', A) === 'A' && T('classifyCrisisTier', B) === 'B' && T('classifyCrisisTier', PLAIN) === null);
{
  const a = T('crisisLineAfterFailedCall', 'SUPPORTIVE', msgs(A), false) || {};
  assert('TIER A: a failed crisis call still shows 1018 and 112', a.line === L1018);
  const b = T('crisisLineAfterFailedCall', 'SUPPORTIVE', msgs(B), false) || {};
  assert('TIER B: a failed call shows 10306 the first time, and marks it as shown', b.line === L10306 && b.supportShown === true);
  const b2 = T('crisisLineAfterFailedCall', 'SUPPORTIVE', msgs(B), true) || {};
  assert('TIER B: once per session, as in a normal reply — already shown → nothing more', b2.line === '' && b2.supportShown === true);
  const n = T('crisisLineAfterFailedCall', 'ANSWER', msgs(A), false) || {};
  assert('NOT A CRISIS TURN (any other mode): nothing — a failed ordinary turn is unchanged', n.line === '');
  assert('SAME RULE as the reply path: for every case, exactly buildCrisisLine(tier of the last user message, "", shown)',
    [[A, false], [A, true], [B, false], [B, true], [PLAIN, false]].every(([u, s]) =>
      JSON.stringify(T('crisisLineAfterFailedCall', 'SUPPORTIVE', msgs(u), s)) === JSON.stringify(T('buildCrisisLine', T('classifyCrisisTier', u), '', s))));
  assert('ROBUST: no messages, no user message, a bad argument — never a crash, never a line for a non-crisis mode',
    (T('crisisLineAfterFailedCall', 'ANSWER', null, false) || {}).line === '' && typeof (T('crisisLineAfterFailedCall', 'SUPPORTIVE', [], false) || {}).line === 'string' &&
    typeof (T('crisisLineAfterFailedCall', 'SUPPORTIVE', [{ role: 'assistant', content: 'x' }], false) || {}).line === 'string');
}

// ── Wiring ───────────────────────────────────────────────────────────────────
{
  // the catch of generateResponse itself: the one that rolls the failed turn back
  const at = GEN.lastIndexOf('} catch(e) {', GEN.indexOf('const _rb = rollbackFailedTurn(msgs);'));
  const cat = at >= 0 ? GEN.slice(at, GEN.indexOf('} finally {', at)) : '';
  assert('WIRING: the failure path of generateResponse computes the line from the turn\'s mode, messages and the once-per-session flag',
    /const _failLine = crisisLineAfterFailedCall\(currentMode, msgs, supportLineShown\.current\);/.test(cat));
  // the once-per-session flag is NOT set here: the retry's successful reply must still carry the 10306 when it clears this line
  assert('WIRING: … shows it on screen and still rolls the message back for a retry; the 10306 stays «not yet shown» for the reply',
    /if \(_failLine\.line\) setCrisisFallback\(_failLine\.line\);/.test(cat) && !/supportLineShown\.current = true/.test(cat) &&
    cat.indexOf('_failLine') < cat.indexOf('rollbackFailedTurn(msgs)') && /setError\(e\.message\);/.test(cat));
  assert('WIRING: a successful reply clears it (the reply carries its own line); a new session clears it',
    /let displayText = text;\s*setCrisisFallback\(null\);/.test(GEN) && /setCrisisFallback\(null\);/.test(fullFnSrc('resetSession') || CODE.slice(CODE.indexOf('const resetSession = () =>'), CODE.indexOf('const resetSession = () =>') + 4000)));
  assert('STATE: one string or null', /const \[crisisFallback, setCrisisFallback\] = useState\(null\);/.test(CODE));
  assert('SCREEN: drawn as its own readable line (role alert), not inside the 10px error text, right above the error',
    /\{crisisFallback && <div role="alert" className="crisis-fallback"[^>]*>\{crisisFallback\}<\/div>\}\s*\{error && <div className="err">Σφάλμα: \{error\}<\/div>\}/.test(CODE) &&
    /\.crisis-fallback\{[^}]*font-size:13px/.test(CODE));
  assert('UNCHANGED: the reply path still adds the line to the model\'s text exactly as before',
    /const _crisisLine = buildCrisisLine\(classifyCrisisTier\(lastUserMsg\), text, supportLineShown\.current\);/.test(GEN) &&
    /if \(_crisisLine\.line\) displayText = text \+ "\\n\\n" \+ _crisisLine\.line;/.test(GEN));
  assert('UNCHANGED: the crisis line texts themselves', (fullFnSrc('buildCrisisLine') || '').includes(L1018) && (fullFnSrc('buildCrisisLine') || '').includes(L10306));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
