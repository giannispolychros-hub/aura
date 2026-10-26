// SAFETY — the app's line after a failed crisis or danger call stays on screen (audit of 26/10/2026, finding Α1, a safety fix (α),
// Constitution §0.1). A failed crisis turn shows the line from code in its own box (`crisisFallback`: 1018 / 112, 10306, the danger
// line) and puts the message back in the input box. Until now EVERY successful reply cleared that box — so a reply to ANOTHER message
// (the failed one is no longer in the history, so nothing adds its line again) left no number on screen. Now the box goes only when the
// reply that is shown carries every number of the box (crisisFallbackAfterReply). Code only: the prompt, its fingerprints, the crisis
// check, the lines and the failure path are unchanged. Browser: section FC of scripts/e2e_stage_a.cjs.
//  (Α) the rule, case by case   (Β) the wiring in generateResponse   (Γ) «Νέα συνεδρία» still clears it   (Δ) the rest unchanged
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
let F = null;
try { F = new Function(fnSrc('crisisFallbackAfterReply') + '\nreturn crisisFallbackAfterReply;')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
const keep = (fb, shown) => { try { return F(fb, shown); } catch (e) { return 'threw ' + e.message; } };
const L1018 = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const L10306 = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';
const SELF = 'Σε άμεσο κίνδυνο, 112. Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.';
const CHILD = 'Σε άμεσο κίνδυνο, 112. Για παιδί, 1056, Χαμόγελο του Παιδιού.';
const BOTH = L1018 + '\n\n' + SELF;

// ── (Α) the rule ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Α) the rule exists as one function', typeof F === 'function');
for (const [label, fb, shown, expect] of [
  ['a reply to another message, no number → the box STAYS', L1018, 'Σε ακούω. Τι γίνεται αυτή τη στιγμή;', L1018],
  ['an empty reply (e.g. the model\'s closing hidden) → STAYS', L1018, '', L1018],
  ['a reply with 1018 but not 112 → STAYS (not every number)', L1018, 'Μπορείς να καλέσεις το 1018.', L1018],
  ['the retry\'s reply carries the app\'s line (1018 and 112) → goes', L1018, 'Είμαι εδώ μαζί σου.\n\n' + L1018, null],
  ['crisis B: the reply carries 10306 → goes', L10306, 'Είμαι εδώ.\n\n' + L10306, null],
  ['crisis B: a reply without 10306 → STAYS', L10306, 'Τι σε κουράζει περισσότερο;', L10306],
  ['danger: the reply carries 112 and 15900 → goes', SELF, 'Σε ακούω.\n\n' + SELF, null],
  ['danger: only 112 in the reply → STAYS', SELF, 'Σε άμεσο κίνδυνο, 112.', SELF],
  ['danger to a child: 112 and 1056 → goes', CHILD, 'Σε ακούω.\n\n' + CHILD, null],
  ['crisis line and danger line together: every number in the reply → goes', BOTH, 'Σε ακούω.\n\n' + L1018 + '\n\n' + SELF, null],
  ['crisis line and danger line together: the danger numbers missing → STAYS', BOTH, 'Σε ακούω.\n\n' + L1018, BOTH],
  ['a number inside a longer number is not the number (101800, 1120) → STAYS', L1018, 'Κωδικός 101800 και 1120.', L1018],
  ['…nor at the end of a longer number (21018, 9112) → STAYS', L1018, 'Κωδικός 21018 και 9112.', L1018],
  ['a number next to punctuation counts (1018. / (112)) → goes', L1018, 'Το 1018. Ή (112).', null],
  ['no box (null) → null', null, 'οτιδήποτε', null],
  ['an empty box ("") → null', '', 'οτιδήποτε', null],
  ['a missing reply (undefined) → the box STAYS', L1018, undefined, L1018],
]) assert('(Α) ' + label, keep(fb, shown) === expect);
assert('(Α) no lookbehind in the rule (old iPhones)', !/\(\?<[=!]/.test(fnSrc('crisisFallbackAfterReply')));

// ── (Β) the wiring ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const gr = (() => { const a = CODE.indexOf('const generateResponse = useCallback('); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n  }, [safetyMode, memory, currentDomain, activeLens]);', a)); })();
assert('(Β) generateResponse located', gr.length > 10000);
assert('(Β) generateResponse no longer clears the box unconditionally', !/\bsetCrisisFallback\(null\);/.test(gr));
const CALL = 'setCrisisFallback(prev => crisisFallbackAfterReply(prev, displayText));';
assert('(Β) the rule is called once, with the text that will be shown', (gr.split(CALL).length - 1) === 1);
const iCall = gr.indexOf(CALL), iAi = gr.indexOf('if (_aiLine) displayText = displayText + "\\n\\n" + _aiLine;'),
  iDanger = gr.indexOf('if (_dangerLine.line) displayText ='), iShow = gr.indexOf('if (displayText.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText');
assert('(Β) …after every line the app adds (danger line, AI-identity line) and before the reply is shown', iDanger > 0 && iAi > iDanger && iCall > iAi && iShow > iCall);
assert('(Β) the failure path still shows the line from code (unchanged)',
  gr.includes('if (_failLine.line || _failDangerLine) setCrisisFallback([_failLine.line, _failDangerLine].filter(Boolean).join("\\n\\n"));'));

// ── (Γ) «Νέα συνεδρία» ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const rs = (() => { const a = CODE.indexOf('const resetSession = () => {'); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n  };', a)); })();
assert('(Γ) resetSession still clears the box', /\bsetCrisisFallback\(null\);/.test(rs));
assert('(Γ) the only unconditional clear left in the file is the one in resetSession', (CODE.match(/\bsetCrisisFallback\(null\)/g) || []).length === 1);

// ── (Δ) the rest unchanged ──────────────────────────────────────────────────────────────────────────────────────────────────────
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
assert('(Δ) the prompt (AURA_CORE_PERSONALITY) is unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21');
let gen = ''; try { gen = cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { encoding: 'utf8' }); } catch (e) { gen = String(e.stdout || ''); }
assert('(Δ) the prompt fingerprints in api/aura.js are up to date', /up to date/.test(gen));
assert('(Δ) the failure helper is main\'s (17334b2), byte for byte, and the First-WHY failure still shows the danger line',
  h(fnSrc('crisisLineAfterFailedCall')) === 'c87733effcebde7e' &&
  CODE.includes('const _fdl = _fd ? buildDangerLine(_fd, "", dangerLineShown.current).line : ""; if (_fdl) setCrisisFallback(_fdl);'));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
