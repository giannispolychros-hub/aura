// AURA — THE STRESS TOOL: conversation-quality aids Α, Δ, Ε (John, 13/11/2026, branch quality-diagnostics). READ ONLY: they count on
// the screen's turns for a person to read; they are never a brake and they change nothing in the app. Synthetic turns only.
//  Α  a question of AURA that repeats an earlier question of hers (same words, or most of the long words in common);
//  Δ  before a confirmed root: AURA declares a finding («αυτό είναι το κλειδί» kind), or a «μήπως» question that brings a cause;
//  Ε  from the first sign of an impasse, how many AURA replies until one says honestly that it may not have been found yet.
// Known limit, pinned here on purpose: a repeat in DIFFERENT words is not caught by Α — a person marks it.
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'));
const m = (t, o) => { try { return SL.qualityMetrics(t, o); } catch (e) { return null; } };
const user = text => ({ who: 'user', text }), aura = text => ({ who: 'aura', text });

assert('(load) the stress library has qualityMetrics and qualityReport', typeof SL.qualityMetrics === 'function' && typeof SL.qualityReport === 'function');

// Α — repeats
{
  const r = m([user('Με πιέζει η δουλειά.'), aura('Τι σε πιέζει περισσότερο στη δουλειά;'), user('Ο προϊστάμενος.'),
    aura('Ακούω. Τι κάνει ο προϊστάμενος;'), user('Φωνάζει.'), aura('Τι σε πιέζει περισσότερο στη δουλειά σου;')]);
  assert('Α: the same question again (one small word more) is a repeat, reply 3 ← reply 1', r && r.repeats.length === 1 && r.repeats[0].at === 3 && r.repeats[0].prevAt === 1);
  assert('Α: three questions counted', r && r.questions === 3);
}
{
  const r = m([user('Με πιέζει η δουλειά.'), aura('Τι σε πιέζει περισσότερο;'), user('Ο προϊστάμενος.'), aura('Πότε ξεκίνησε αυτό με τον προϊστάμενο;'),
    user('Πέρσι.'), aura('Ποιος άλλος το ξέρει στο σπίτι;')]);
  assert('Α: three different questions — no repeat', r && r.repeats.length === 0);
}
{
  const r = m([user('Λέω ναι σε όλα.'), aura('Αν έλεγες όχι στον προϊστάμενο — τι θα έβγαινε από αυτό;'), user('Δεν ξέρω.'),
    aura('Τι συμβαίνει όταν αρνείσαι κάτι στη δουλειά — πού καταλήγει;')]);
  assert('Α (known limit, as is): the same question in DIFFERENT words is NOT caught — a person marks it', r && r.repeats.length === 0);
}
{
  const r = m([user('Α.'), aura('Τι εννοείς; Και πότε συμβαίνει;'), user('Β.'), aura('Τι εννοείς;')]);
  assert('Α: two questions in one reply are counted apart; the same short question later is a repeat', r && r.questions === 3 && r.repeats.length === 1 && r.repeats[0].at === 2);
}
// Δ — declared finding / «μήπως» with a cause
{
  const r = m([user('Λέω ναι σε όλα.'), aura('Μήπως φοβάσαι την κριτική του;'), user('Ίσως.'), aura('Αυτό είναι το κλειδί — η κριτική.'),
    user('Δεν ξέρω.'), aura('Αυτό που βρέθηκε σήμερα: η κριτική.')]);
  assert('Δ: «μήπως φοβάσαι…» counted as a «μήπως» with a cause (after message 1)', r && r.leading.length === 1 && r.leading[0] === 1);
  assert('Δ: «Αυτό είναι το κλειδί» and «Αυτό που βρέθηκε» counted as declared findings (after messages 2 and 3)', r && r.declared.join() === '2,3');
}
{
  const r = m([user('Με πιέζει η δουλειά.'), aura('Μήπως θες να μου πεις λίγο ακόμα;'), user('Ναι.'), aura('Τι είναι το πιο δύσκολο εκεί;')]);
  assert('Δ: a plain «μήπως θες να μου πεις…» is NOT a «μήπως» with a cause; no declared finding', r && r.leading.length === 0 && r.declared.length === 0);
}
{
  const T = [user('Α.'), aura('Τι σε πιέζει;'), user('Β.'), aura('Αυτό είναι το κλειδί.')];
  const r = m(T, { rootAtUser: 1 });
  assert('Δ: after a confirmed root (rootAtUser) a declaration is not counted', r && r.declared.length === 0);
}
// Ε — impasse and honest acknowledgement
{
  const r = m([user('Με πιέζει η δουλειά.'), aura('Τι σε πιέζει;'), user('Δεν ξέρω'), aura('Πότε;'), user('Όχι'), aura('Πού;'),
    user('Δεν με καταλαβαίνεις.'), aura('Ίσως δεν το βρήκαμε ακόμα. Θέλεις να το δούμε αλλιώς;')]);
  assert('Ε: two plain non-answers in a row start the impasse (message 3)', r && r.impasse && r.impasse.start === 3);
  assert('Ε: the honest reply is the 2nd AURA reply after it', r && r.impasse && r.impasse.ackAfter === 2 && r.impasse.repliesAfter === 2);
}
{
  const r = m([user('Με πιέζει η δουλειά.'), aura('Τι σε πιέζει;'), user('Σου το ξαναείπα, τον προϊστάμενο.'), aura('Τι κάνει;'),
    user('Φωνάζει.'), aura('Και μετά;')]);
  assert('Ε: «σου το ξαναείπα» starts the impasse; no honest reply → ackAfter null, 2 replies after', r && r.impasse && r.impasse.start === 2 && r.impasse.ackAfter === null && r.impasse.repliesAfter === 2);
}
{
  const r = m([user('Με πιέζει η δουλειά.'), aura('Τι σε πιέζει;'), user('Δεν ξέρω'), aura('Πότε;'), user('Ο προϊστάμενος φωνάζει.'), aura('Και;')]);
  assert('Ε: one non-answer alone is not an impasse', r && r.impasse === null);
}
// read only, never a brake, in the report
{
  const T = [user('Α.'), aura('Τι σε πιέζει;'), user('Β.'), aura('Τι σε πιέζει;')], copy = JSON.stringify(T);
  m(T);
  assert('read only: the turns are not changed', JSON.stringify(T) === copy);
  const lib = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'), 'utf8');
  const brakeSrc = (n) => { const a = lib.indexOf('function ' + n + '('); return a < 0 ? '' : lib.slice(a, lib.indexOf('\nfunction ', a + 10)); };
  assert('never a brake: finalBrakeFindings and dangerLineFindings do not use it', !/qualityMetrics/.test(brakeSrc('finalBrakeFindings')) && !/qualityMetrics/.test(brakeSrc('dangerLineFindings')));
  const L = SL.qualityReport([{ label: '9', persona: { name: 'x' }, turns: T }]);
  assert('the report has its own section, marked «μόνο για ανάγνωση», with one row per session', L[0] && /μόνο για ανάγνωση/.test(L[0]) && L.filter(x => /^\| 9 \|/.test(x)).length === 1);
  assert('the final report includes it', /L\.push\(\.\.\.qualityReport\(S\)\)/.test(lib));
  assert('the app is not touched by it (no reference in src/App.jsx)', !/qualityMetrics|qualityReport/.test(fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8')));
}

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
