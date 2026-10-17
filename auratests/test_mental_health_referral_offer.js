// AURA — SAFETY (§0.1, §25: no pressure, no dark patterns), found by the hard round of the stress test with the real model
// (11/10/2026, run 15, session 27; ADR «11 Οκτωβρίου (ε)»). A user described months of heaviness, tiredness before the day
// starts, no interest even in what they used to love, being alone with it. AURA rightly said «χρειάζεται έναν ειδικό…
// Ψυχολόγο ή ψυχίατρο». No crisis or DISTRESS word was typed, so the app saw no risk — and right after «Ναι» it showed the
// €6 Coach offer to that person.
//   Now: when AURA's OWN reply refers the user to mental-health help (ψυχολόγο / ψυχίατρο / ψυχοθεραπευτή / ειδικό ψυχικής
//   υγείας), the session's risk latch takes DISTRESS (3) — exactly what a DISTRESS message already does: the root card stays,
//   the €6 offer is not shown (Stage A), the old paywall is not shown (switch closed), the card says «Με το "Ναι"
//   ολοκληρώνεται αυτό το κομμάτι.». The heavier signals (crisis A, B) are never lowered. Nothing else changes; no prompt change.

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
const NAMES = ['detectsMentalHealthReferral', 'mergeRiskKind', 'stageAStep', 'initialStageAState'];
let F = {};
try { F = new Function(NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')(); }
catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));

// The two replies of session 27 (run 15), verbatim
const R1 = 'Νιώθεις μόνος με αυτό.\n\nΑυτό που περιγράφεις — μήνες βαρύτητας, κούραση πριν αρχίσει η μέρα, μοναξιά με αυτό — είναι κάτι που αξίζει να μιλήσεις με κάποιον ειδικό. Ψυχολόγο ή ψυχίατρο.\n\nΈχεις σκεφτεί κάτι τέτοιο;';
const R2 = 'Αυτό που περιγράφεις — μήνες βαρύτητας, κούραση, απώλεια όρεξης ακόμα και για αυτά που αγαπούσες — χρειάζεται έναν ειδικό, όχι γιατί είναι κάτι τρομερό, αλλά γιατί δεν πρέπει να το κουβαλάς μόνος.';
const D = t => T('detectsMentalHealthReferral', t);

// ── The rule ─────────────────────────────────────────────────────────────────
assert('27: AURA\'s referral to a psychologist or psychiatrist is recognised', D(R1) === true);
assert('the professions, in their usual forms (accusative, nominative, genitive, plural), with or without accents',
  ['να μιλήσεις με έναν ψυχολόγο', 'Ένας ψυχολόγος μπορεί να βοηθήσει.', 'ψυχίατρο', 'ο ψυχίατρος', 'ένας ψυχοθεραπευτής', 'με έναν ψυχοθεραπευτή',
    'κάποιον ειδικό ψυχικής υγείας', 'ΨΥΧΟΛΟΓΟ Ή ΨΥΧΙΑΤΡΟ', 'μιλησε με ψυχολογο'].every(t => D(t) === true));
assert('NOT a referral: the adjective or the field («ψυχολογικά», «ψυχολογία»), an ordinary question, nothing',
  ['Αυτό σε βαραίνει ψυχολογικά;', 'Σπούδασα ψυχολογία.', 'Τι σε κρατάει εκεί;', '', null, undefined, 42].every(t => D(t) === false));
assert('NOT a referral without a profession: «χρειάζεται έναν ειδικό» alone is not enough (a lawyer, a doctor, an accountant are «ειδικοί» too)',
  D(R2) === false && D('Για τα νομικά χρειάζεσαι έναν ειδικό.') === false);
// the latch: DISTRESS (3), never lowering a heavier signal
assert('LATCH: a referral makes an empty latch DISTRESS (3); crisis A (1) and B (2) stay as they are',
  T('mergeRiskKind', 0, 'DISTRESS', null) === 3 && T('mergeRiskKind', 1, 'DISTRESS', null) === 1 && T('mergeRiskKind', 2, 'DISTRESS', null) === 2 && T('mergeRiskKind', 3, 'DISTRESS', null) === 3);
{
  const card = Object.assign(T('initialStageAState'), { phase: 'card', door: 1, found: 'Όλα είναι βαριά.' });
  const y3 = T('stageAStep', card, { type: 'yes', riskKind: 3 }) || {};
  const y0 = T('stageAStep', card, { type: 'yes', riskKind: 0 }) || {};
  assert('THE OFFER: with the latch at 3 «Ναι» goes to the clarity scale, no €6 offer (counted as suppressed); with 0 the offer, as before',
    y3.phase === 'clarity' && y3.stats.coachOfferSuppressed === 1 && y3.stats.coachOfferShown === 0 && y0.phase === 'offer' && y0.stats.coachOfferShown === 1);
}

// ── Wiring ───────────────────────────────────────────────────────────────────
{
  const at = GEN.indexOf('if (detectsMentalHealthReferral(text)) riskSignalKind.current = mergeRiskKind(riskSignalKind.current, "DISTRESS", null);');
  assert('WIRING: every successful reply of the model is read — the latch is raised from THIS reply\'s text', at >= 0);
  assert('WIRING: right where the reply starts to be processed, before any early return of the turn (door 5, the leaving door)',
    at > GEN.indexOf('let displayText = text;') && at < GEN.indexOf('if (_saModelClose && !stageARef.current.phase) {') &&
    at < GEN.indexOf('if (stageALeavingDoorOpens({', GEN.indexOf('let displayText = text;')) && at < GEN.indexOf('if (displayText.trim()) setMessages('));
  assert('WIRING: it only ever RAISES the latch (through mergeRiskKind), never resets it', !/riskSignalKind\.current = 0;/.test(GEN));
  // UPDATED (17/10, ADR «17 Οκτωβρίου (δ)»): «Ναι» also asks for the step (the €6 offer is closed); the latch is read the same way.
  assert('UNCHANGED: the readers of the latch — the step / €6 offer (Stage A), the card line, the old paywall (switch closed)',
    CODE.includes('const _riskOffer = riskSignalKind.current === 2 || riskSignalKind.current === 3;') &&
    CODE.includes('stageADispatch({ type: "yes", riskKind: riskSignalKind.current, step: !STAGE_A_COACH_OFFER });') &&
    CODE.includes('{!stageAActive.current && riskSignalKind.current === 0 && sessionEnded && !loading && finalDistillation && !valueUnlocked && ('));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
