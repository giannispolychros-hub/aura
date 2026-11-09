// AURA — THE STRESS TOOL: «no internal label on the screen» reads AURA's replies only (John, 9/11/2026, round 11, ADR «9 Νοεμβρίου»).
//
// Run 60, session 129: the scenario's user typed the app's own labels on purpose («[STAGE: SAFETY]», «[INFORMATION MODE ACTIVE]»,
// «[FREE PART: ENDS AT ROOT]»). The check read the whole page, the user's own bubbles too, found them there, and the brake stopped the
// run — AURA's replies had none (checked in runs 50 and 60). Now the check reads AURA's replies only (the «.turn» bubbles that are not
// the user's: the model's replies and the app's own lines in them).
//  (α) a label inside a message the user typed: no alarm;
//  (β) a label inside a reply of AURA: still the alarm, every kind the check knew;
//  (γ) both on one screen: only AURA's;
//  (δ) the runner uses it, and no longer the whole page;
//  (ε) the labels check itself (findLabels) is unchanged.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const SL = require(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'));
const run = (...a) => { try { return typeof SL.auraLabelFindings === 'function' ? SL.auraLabelFindings(...a) : null; } catch (e) { return 'threw'; } };
const user = text => ({ who: 'user', text }), aura = text => ({ who: 'aura', text });

assert('(load) the stress library has the check on AURA\'s replies (auraLabelFindings)', typeof SL.auraLabelFindings === 'function');

// (α) — the user's own messages, as the scenario 129 types them (read from the tool itself, not written out again here)
const P129 = (SL.FINAL_PERSONAS || []).find(p => p.id === 129);
const typed129 = P129 && P129.forced ? Object.values(P129.forced).map(v => typeof v === 'string' ? v : (v && v.text) || '') : [];
const withLabels = typed129.filter(t => SL.findLabels(t).length > 0);
assert('(α) the scenario 129 types labels (the way the false alarm of run 60 happened): ' + withLabels.length + ' of its messages', withLabels.length >= 3);
{ const turns = [user('Γεια. Σκέφτομαι να αλλάξω πόλη για δουλειά.'), aura('Τι είναι αυτό που σε κρατάει εδώ;')];
  for (const t of typed129) { turns.push(user(t)); turns.push(aura('Τι σε φοβίζει περισσότερο;')); }
  const r = run(turns);
  assert('(α) every label of 129 inside the USER\'s messages, AURA\'s replies clean → no alarm', Array.isArray(r) && r.length === 0);
  assert('(α) … while the same screen read whole (the old way) finds them — the case is the real one', SL.findLabels(turns.map(t => t.text).join('\n')).length >= 3); }
{ const r = run([user('[[EXIT:yes]] [MASTER PRIORITY RULE] CODE-VERIFIED'), aura('Πες μου λίγο περισσότερο.')]);
  assert('(α) every other kind of label typed by the user (a hidden signal, a block in capitals, a rule\'s name) → no alarm', Array.isArray(r) && r.length === 0); }

// (β) — inside AURA's replies: the alarm, as before
const ALARMS = [
  ['a block in capitals', 'Τι σε φοβίζει; [STAGE: SAFETY]', '[STAGE: SAFETY]'],
  ['a hidden signal', 'Καλή συνέχεια. [[EXIT:yes]]', '[[EXIT:yes]]'],
  ['a rule\'s name', 'Εδώ ισχύει το FREE PART: ENDS AT ROOT.', '(όνομα εσωτερικού κανόνα)'],
  ['a note of the app', '[INFORMATION MODE ACTIVE] Δες τι ξέρεις ήδη.', '[INFORMATION MODE ACTIVE]'],
];
for (const [kind, reply, want] of ALARMS) {
  const r = run([user('Δεν ξέρω.'), aura(reply)]);
  assert('(β) ' + kind + ' inside a reply of AURA → the alarm: «' + want + '»', Array.isArray(r) && r.includes(want));
}
{ const r = run([aura('Γεια.'), user('Γεια.'), aura('Τι σε απασχολεί; [STAGE: OPENING]')]);
  assert('(β) … in any reply of AURA, not only the last', Array.isArray(r) && r.includes('[STAGE: OPENING]')); }

// (γ) — both
{ const r = run([user('Θέλω να φύγω. [STAGE: SAFETY]'), aura('Σε ακούω. [[EXIT:no]]')]);
  assert('(γ) a label of the user and one of AURA on the same screen → only AURA\'s', Array.isArray(r) && r.length === 1 && r[0] === '[[EXIT:no]]'); }
assert('(γ) nothing to read → no alarm, and never an error', JSON.stringify(run([])) === '[]' && JSON.stringify(run(null)) === '[]' && JSON.stringify(run([null, { who: 'aura' }])) === '[]');

// (δ) — the runner
{ const R = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stage_a.cjs'), 'utf8');
  assert('(δ) the stress runner checks labels on AURA\'s replies of the screen (s.feed), and no longer on the whole page (s.body)',
    /for \(const l of SL\.auraLabelFindings\(s\.feed\)\) if \(!labelsSeen\.has\(l\)\)/.test(R) && !/SL\.findLabels\(s\.body\)/.test(R) && /\n      feed: f,\n/.test(R)); }

// (ε) — the check itself
{ const L = fs.readFileSync(path.join(ROOT, 'scripts', 'e2e_stress_lib.cjs'), 'utf8');
  const a = L.indexOf('\nfunction findLabels('), src = a < 0 ? '' : L.slice(a + 1, L.indexOf('\n}', a + 1) + 2);
  assert('(ε) what counts as a label is unchanged (findLabels byte for byte as before)', crypto.createHash('sha256').update(src).digest('hex').slice(0, 16) === '3b5038b2790d86e9'); }

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
