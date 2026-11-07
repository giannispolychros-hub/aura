// AURA — FINDING 142: A CORRECTION IS NOT LOST WHEN ITS REPLY FAILS (John, 7/11/2026, round 4 of the branch hardening-2026-11,
// ADR «7 Νοεμβρίου»).
//
// «αυτό δεν ισχύει →» opens the card «διόρθωση» with its own box. «Αποστολή» empties that box and closes the card, then calls the model.
// Before: if that call failed (the call and its retry), the correction was gone — nothing put it back — and the screen said «Δεν μπορώ να
// εμφανίσω απάντηση…». Now:
//  - a correction that was written goes back to the card's own box, and the card opens again (with anything already in that box, both
//    kept: keepBothTexts — nothing lost, nothing mixed);
//  - the card says so in John's words (α) — «…Το μήνυμά σου είναι πάλι στο κουτί…» — which is true there: the correction IS in the
//    card's box, right above; a timeout: John's timeout text (round 5), true there too;
//  - the main box is not touched (while the call runs it is locked and the card is closed: nothing new can be typed anywhere; a text
//    already in the main box stays exactly as it was);
//  - «Συνέχισε» (nothing written): as before — the second text on the main line, nothing to put back;
//  - sending again clears the card's failure text first; a new session clears the card's box and text.
// The same on the screen: scripts/e2e_stage_a.cjs, section MK.
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const blockFrom = start => { const a = raw.indexOf(start); if (a < 0) return ''; let d = 0, s = false;
  for (let k = raw.indexOf('{', a); k < raw.length; k++) { if (raw[k] === '{') { d++; s = true; } else if (raw[k] === '}') { d--; if (s && !d) return raw.slice(a, k + 1); } } return ''; };
const H = blockFrom('const handleMisfireResponse = useCallback(');
const CATCH = (() => { const a = H.indexOf('} catch(e) {'); const b = H.indexOf('finally { setLoading(false); }', a); return a > 0 && b > a ? H.slice(a, b) : ''; })();

assert('142: the handler is there, with its catch', H.length > 0 && CATCH.length > 0);
assert('142: a written correction whose reply fails goes back to the card\'s own box, with anything already there (keepBothTexts), and the card opens again',
  /const _back = typeof userCorrection === "string" && userCorrection\.trim\(\) \? userCorrection : "";/.test(CATCH) &&
  /if \(_back\) \{ _reopen = true; setMisfireInput\(cur => keepBothTexts\(_back, cur\)\); setMisfirePending\(true\);/.test(CATCH));
// UPDATED (7/11/2026, ADR «7 Νοεμβρίου (β)», John's round 5): a timeout now shows John's timeout text — true here too, the correction is
// back in the card's box (was: the timeout's own text)
assert('142: the card says John\'s text (α) — true there, the correction IS in the card\'s box — and on a timeout John\'s timeout text',
  /setMisfireFail\(e && e\.message === CALL_TIMEOUT_TEXT \? TIMEOUT_TEXT_SHOWN : SAFE_FAIL_TEXTS\.box\); \}/.test(CATCH));
assert('142: «Συνέχισε» (nothing written): the second text on the main line, as before — nothing to put back',
  /else setError\(SAFE_FAIL_TEXTS\.noBox\);/.test(CATCH) && !/setError\(SAFE_FAIL_TEXTS\.box\)/.test(CATCH));
assert('142: the main box is not touched by the correction\'s failure (no setInput in the catch)', CATCH.length > 0 && !/setInput\(/.test(CATCH));
assert('142: the card keeps its type when it opens again (the type is cleared only when it does not)',
  /let _reopen = false;/.test(H) && /\n    if \(!_reopen\) setMisfireType\(null\);\n/.test(H) && !/\n    setMisfireType\(null\);\n  \}, \[messages, memory, misfireType\]\);/.test(H));
assert('142: sending again clears the card\'s failure text first — before anything else in the handler',
  H.indexOf('setMisfireFail(null);') > 0 && H.indexOf('setMisfireFail(null);') < H.indexOf('const _mt = '));
{ const card = blockFrom('{misfirePending && (');
  assert('142: the card shows its failure text under its buttons — John\'s texts without «Σφάλμα:», any other text as before',
    /<\/div>\n\s*\{misfireFail && <div className="err" data-misfire-fail="1">\{isSafeFailText\(misfireFail\) \? misfireFail : "Σφάλμα: " \+ misfireFail\}<\/div>\}\n\s*<\/div>/.test(card)); }
assert('142: the state of the card\'s failure text exists, empty at the start',
  /const \[misfireFail, setMisfireFail\] = useState\(null\);/.test(raw));
{ const R = blockFrom('const resetSession = () => {');
  assert('142: a new session clears the card\'s box and its failure text — nothing of a correction crosses into a new session',
    /setMisfirePending\(false\);\n\s*setMisfireInput\(""\); setMisfireFail\(null\);/.test(R)); }
// what stays exactly as it was
assert('142: unchanged — the crisis or danger branch of a correction (it takes the normal path through the main box)',
  H.includes('if (_mt && (detectSafetySignal(_mt) === "CRISIS" || detectsDangerFromOther(_mt))) {\n      setMisfirePending(false); setMisfireType(null);\n      misfireToSubmit.current = _mt; setInput(_mt);\n      return;\n    }'));
assert('142: unchanged — the call, the one exit and the reply written on success',
  H.includes('const text = stripAraDeclarative(cleanLabels(await callAura(correctionMsgs, recoveryPrompt)));') &&
  H.includes('if (_fkMis.failed) throw finalCheckError(correctionMsgs, false);') &&
  H.includes('if (text.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: text, msgMode: "AUDIT" }]); }'));

console.log(`\n${passed} passed, ${failed} failed`);
