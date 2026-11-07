// AURA — ROUND 5 (John, 7/11/2026, ADR «7 Νοεμβρίου (β)»): FINDING 143 AND THE TEXT OF THE TIMEOUT.
//
// 143: «Ένα ακόμα πέρασμα» (the old flow) sends the model a message the app writes in the user's place («[Final compression pass. …]»).
// When that call failed, the rollback put the app's message back in the USER'S box, and the screen said «Το μήνυμά σου είναι πάλι στο
// κουτί» — not true: it was not the user's message. Now a message the app wrote (bracketed, with one of the app's own heads,
// INTERNAL_LABEL_HEADS) is never put in the user's box; the box stays as it was, and the screen says the second text of (α),
// «Δεν μπορώ να εμφανίσω απάντηση αυτή τη στιγμή. Δοκίμασε ξανά όταν θέλεις.» — true.
// THE TIMEOUT: John's text «Η απάντηση άργησε και η προσπάθεια έληξε. Το μήνυμά σου παραμένει στο κουτί· μπορείς να δοκιμάσεις ξανά όταν
// θέλεις.» — shown ONLY where the message really is in a box: the main path when the user's own message went back to the box, and the
// card «διόρθωση» (finding 142) where the correction is back in the card's box. Without «Σφάλμα:». Where no message of the user's is in
// a box, the second text of (α). callAura still throws its own text («Η σύνδεση έληξε…»): it is how the app knows it was a timeout,
// and it no longer reaches the screen.
// The same on the screen: scripts/e2e_stage_a.cjs, section TO.
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function load(names) {
  const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), ce = raw.indexOf('`;', raw.indexOf('`', ci) + 1);
  const code = raw.slice(0, ci) + 'const AURA_CORE_PERSONALITY = "";' + raw.slice(ce + 2);
  const top = code.slice(0, code.indexOf('\nexport default function AURAv2'));
  const re = /^(?:async )?function ([A-Za-z_$][\w$]*)\(|^(?:const|let) ([A-Za-z_$][\w$]*) =/gm;
  const starts = []; let m; while ((m = re.exec(top))) starts.push({ name: m[1] || m[2], at: m.index });
  const blocks = Object.create(null);
  for (let i = 0; i < starts.length; i++) { const b = top.slice(starts[i].at, i + 1 < starts.length ? starts[i + 1].at : top.length).replace(/(\n\/\/[^\n]*)+\s*$/, '\n');
    if (/return \(\s*</.test(b) || /^const [A-Za-z_$][\w$]* = memo\(/.test(b)) continue; blocks[starts[i].name] = b; }
  const seen = new Set(), order = [];
  const visit = n => { if (seen.has(n) || !blocks[n]) return; seen.add(n); for (const id of new Set(blocks[n].match(/\b[A-Za-z_$][\w$]*\b/g) || [])) if (id !== n && blocks[id]) visit(id); order.push(n); };
  names.forEach(visit);
  try { return new Function(order.map(n => blocks[n]).join('\n') + '\nreturn {' + names.filter(n => blocks[n]).join(',') + '};')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); return {}; }
}
const F = load(['isAppWrittenMessage', 'isSafeFailText', 'TIMEOUT_TEXT_SHOWN', 'CALL_TIMEOUT_TEXT', 'SAFE_FAIL_TEXTS']);
const call = (n, ...a) => { try { return typeof F[n] === 'function' ? F[n](...a) : undefined; } catch (e) { return { threw: e && e.message }; } };
const blockFrom = start => { const a = raw.indexOf(start); if (a < 0) return ''; let d = 0, s = false;
  for (let k = raw.indexOf('{', a); k < raw.length; k++) { if (raw[k] === '{') { d++; s = true; } else if (raw[k] === '}') { d--; if (s && !d) return raw.slice(a, k + 1); } } return ''; };
const JOHN = 'Η απάντηση άργησε και η προσπάθεια έληξε. Το μήνυμά σου παραμένει στο κουτί· μπορείς να δοκιμάσεις ξανά όταν θέλεις.';
const NOBOX = 'Δεν μπορώ να εμφανίσω απάντηση αυτή τη στιγμή. Δοκίμασε ξανά όταν θέλεις.';
const OLD = 'Η σύνδεση έληξε. Έλεγξε το δίκτυό σου και δοκίμασε ξανά.';

// ── 143: what the app writes in the user's place ───────────────────────────────────────────────────────────────────────────────
// the three messages, read from App.jsx exactly as the code writes them
const FINAL = (raw.match(/content: "(\[Final compression pass\.[^"]*\])"/) || [])[1] || '';
const MISF = (raw.match(/userCorrection \|\| "(\[User indicated the observation[^"]*\])"/) || [])[1] || '';
const SIGNAL = '[Signal: REPETITION. Context: κάτι / κάτι άλλο. Apply Compression. Surface friction. Do not diagnose or pressure.]';
assert('143: the app\'s own messages are found in App.jsx, as the code writes them', !!FINAL && !!MISF && raw.includes('content: `[Signal: ${pivotType}. Context: ${ctxSummary}. Apply Compression.'));
assert('143: a message the app wrote in the user\'s place is recognised — «Ένα ακόμα πέρασμα», «Συνέχισε» of a correction, the pivot signal',
  call('isAppWrittenMessage', FINAL) === true && call('isAppWrittenMessage', MISF) === true && call('isAppWrittenMessage', SIGNAL) === true);
assert('143: … and nothing the user writes is taken for one — ordinary texts, brackets of the user\'s own, a head in the middle',
  ['Δεν ξέρω αν πρέπει να φύγω.', '[κάτι δικό μου] και μετά τα υπόλοιπα', 'Μου είπε «Final compression pass» στα αγγλικά.', '  ', '', null, 'Signal: δεν ξέρω',
   '[Δεν είναι ο φόβος]', 'Θέλω να πεθάνω.', '«Signal: δεν ξέρω» μου είπε', '"Final compression pass" λέει το βιβλίο'].every(t => call('isAppWrittenMessage', t) === false));
{ const H = blockFrom('const generateResponse = useCallback(');
  const CATCH = (() => { const a = H.lastIndexOf('} catch(e) {'); const b = H.indexOf('} finally {', a); return a > 0 && b > a ? H.slice(a, b) : ''; })();
  assert('143: the main path puts back in the box only a message of the user\'s — never one the app wrote; the rollback itself as before',
    /const _rb = rollbackFailedTurn\(msgs\);\n\s*setMessages\(_rb\.messages\);/.test(CATCH) &&
    /const _mine = _rb\.restored && !isAppWrittenMessage\(_rb\.restored\) \? _rb\.restored : null;/.test(CATCH) &&
    /if \(_mine\) setInput\(cur => keepBothTexts\(_mine, cur\)\);/.test(CATCH) && !/setInput\(cur => keepBothTexts\(_rb\.restored, cur\)\)/.test(CATCH));
  assert('143 + TIMEOUT: the screen — a message of the user\'s in the box: John\'s timeout text on a timeout, (α) otherwise; none: the second text of (α)',
    /setError\(_mine \? \(e && e\.message === CALL_TIMEOUT_TEXT \? TIMEOUT_TEXT_SHOWN : SAFE_FAIL_TEXTS\.box\) : SAFE_FAIL_TEXTS\.noBox\);/.test(CATCH) &&
    CATCH.lastIndexOf('setError(') === CATCH.indexOf('setError(_mine ?')); }

// ── THE TIMEOUT ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('TIMEOUT: John\'s text, word for word', F.TIMEOUT_TEXT_SHOWN === JOHN);
assert('TIMEOUT: shown without «Σφάλμα:» (one of John\'s texts)', call('isSafeFailText', JOHN) === true && call('isSafeFailText', OLD) === false);
assert('TIMEOUT: callAura still throws its own text — how the app knows it was a timeout (the lock and the retry are untouched)',
  F.CALL_TIMEOUT_TEXT === OLD && raw.includes('throw new Error("' + OLD + '")') && (raw.match(/Η σύνδεση έληξε/g) || []).length === 2);
{ const H = blockFrom('const handleMisfireResponse = useCallback(');
  assert('TIMEOUT: the card «διόρθωση» (142) shows John\'s timeout text — true there, the correction is back in the card\'s box',
    /setMisfireFail\(e && e\.message === CALL_TIMEOUT_TEXT \? TIMEOUT_TEXT_SHOWN : SAFE_FAIL_TEXTS\.box\); \}/.test(H)); }
assert('TIMEOUT: the old text no longer reaches the screen — no setError or card text shows a caught error\'s own words at the end',
  !/setError\(e && e\.message === CALL_TIMEOUT_TEXT \? e\.message/.test(raw) && !/setMisfireFail\(e && e\.message === CALL_TIMEOUT_TEXT \? e\.message/.test(raw));

console.log(`\n${passed} passed, ${failed} failed`);
