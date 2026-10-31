// SAFETY — the correction box (audit of 26/10/2026, finding Α2, a safety fix (α), Constitution §0.1; a separate commit John may leave
// out). The box under «αυτό δεν ισχύει →» sent its text to the model with the ordinary prompt and no safety check, and kept it out of
// the history. Now a crisis message (detectSafetySignal → "CRISIS") or danger from another person (detectsDangerFromOther) typed there
// goes into the input box and is sent by the normal path (handleSubmit, through one effect), so it gets the crisis prompt, the line
// from code and the history. Anything else is the correction as before. Browser: section MF of scripts/e2e_stage_a.cjs.
//  (Α) the check in handleMisfireResponse, before anything else   (Β) the effect after handleSubmit   (Γ) the correction unchanged
//  (Δ) «Νέα συνεδρία» clears it   (Ε) the prompt unchanged
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
const cb = name => { const a = CODE.indexOf('const ' + name + ' = useCallback('); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n  }, [', a)); };

// ── (Α) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const MR = cb('handleMisfireResponse');
assert('(Α) handleMisfireResponse located', MR.length > 300);
const CHECK = 'if (_mt && (detectSafetySignal(_mt) === "CRISIS" || detectsDangerFromOther(_mt))) {';
assert('(Α) a crisis message or danger from another person is checked — the same two checks as the input box', MR.includes(CHECK));
const iCheck = MR.indexOf(CHECK), iCall = MR.indexOf('callAura('), iMem = MR.indexOf('recordCorrection(');
assert('(Α) …before the correction is recorded or sent to the model', iCheck > 0 && iCheck < iCall && iCheck < iMem);
const branch = iCheck > 0 ? MR.slice(iCheck, MR.indexOf('\n    }\n', iCheck)) : '';
assert('(Α) …and then: the box closes, the text goes into the input box to be sent, nothing goes to the model from here',
  /setMisfirePending\(false\);/.test(branch) && /misfireToSubmit\.current = _mt; setInput\(_mt\);/.test(branch) && /return;/.test(branch) && !/callAura|generateResponse/.test(branch));
assert('(Α) DISTRESS alone is not routed (the box keeps its correction for it, as before)', !/detectSafetySignal\(_mt\)\s*\)/.test(MR) && !/=== "DISTRESS"/.test(MR));

// ── (Β) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const END_HS = '  }, [input, loading, sessionEnded, messages, mode, generateResponse, awaitingRememberedWord, deliverFinalClosure, memory, currentDomain, stageAStepEvent, crisisFallback]);\n';
const iHs = CODE.indexOf(END_HS);
const EFFECT = 'useEffect(() => {\n    if (misfireToSubmit.current === null || misfirePending || input !== misfireToSubmit.current) return;\n    misfireToSubmit.current = null;\n    handleSubmit();\n  }, [input, misfirePending, handleSubmit]);';
assert('(Β) one effect, right after handleSubmit, sends it once by the normal path (handleSubmit itself unchanged)',
  iHs > 0 && CODE.indexOf(EFFECT) > iHs && CODE.indexOf(EFFECT) - iHs < 400 && (CODE.split(EFFECT).length - 1) === 1);
// UPDATED (31/10, FC4 option Γ, ADR «31 Οκτωβρίου» — John): one check now comes before the lock line — while the lock holds, a crisis or
// danger line from code (test_fc4_locked_line_3110.js). The signature and the lock line itself are unchanged, and nothing before it sends.
assert('(Β) handleSubmit keeps its signature and its lock line (after option Γ\'s line-only check)',
  CODE.includes('const handleSubmit = useCallback(async () => {\n    // FC4, option Γ') &&
  CODE.includes('\n    }\n    if (!input.trim() || loading || sessionEnded || submittingRef.current) return;'));

// ── (Γ) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Γ) without a signal: the correction prompt and the call as before',
  MR.includes('MISFIRE RECOVERY: The user has indicated your previous observation was inaccurate or incomplete.') &&
  MR.includes('const text = stripAraDeclarative(cleanLabels(await callAura(correctionMsgs, recoveryPrompt)));'));

// ── (Δ) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const rs = (() => { const a = CODE.indexOf('const resetSession = () => {'); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n  };', a)); })();
assert('(Δ) «Νέα συνεδρία» clears the pending text', /misfireToSubmit\.current = null;/.test(rs));

// ── (Ε) ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
assert('(Ε) the prompt (AURA_CORE_PERSONALITY) is unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21');
let gen = ''; try { gen = cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { encoding: 'utf8' }); } catch (e) { gen = String(e.stdout || ''); }
assert('(Ε) the prompt fingerprints in api/aura.js are up to date', /up to date/.test(gen));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
