// AURA — THE ERROR SCREEN AND NO LOST MESSAGE (John, 6/11/2026, round 3, commit (iii), ADR «6 Νοεμβρίου (β)»).
//
// John's decisions of 6/11/2026, the texts of the decision (α) and the lines of the latch only from HELPLINES (no description, no hours,
// no promise of an answer):
//  (α) a failed call: «Κάτι δεν λειτούργησε από τη μεριά της εφαρμογής, όχι από τη δική σου. Το μήνυμά σου είναι πάλι στο κουτί· στείλ' το
//      ξανά όταν θέλεις.» — ONLY when the message really goes back to the box; otherwise «Δεν μπορώ να εμφανίσω απάντηση αυτή τη στιγμή.
//      Δοκίμασε ξανά όταν θέλεις.». Without «Σφάλμα:» in front of them.
//  NO LOST MESSAGE: when a failed call puts its message back in the box and the user has typed something new there meanwhile, the box
//      keeps BOTH — the first message first, a blank line, then the new text — each exactly as typed (keepBothTexts)
//  (β) β2: the short goodbye after a crisis «Είμαι εδώ όταν χρειαστεί να συνεχίσουμε.» stays as it is, with the line 1018 / 112 under it
//      (afterCrisisShown); the whole phrase stays alone
//  (γ1) Β: the end screen, when the session had a crisis or danger from another person, carries the line of the session (sessionLatchLine)
//  (γ2) Α: unchanged — nothing here
//  (γ3) Α: a closing call that fails keeps the app's own text, and the line of the session goes in the line box
// The same on the screen: scripts/e2e_stage_a.cjs, section LM.
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
const F = load(['keepBothTexts', 'afterCrisisShown', 'sessionLatchLine', 'SAFE_FAIL_TEXTS', 'STAGE_A_TEXTS', 'isSafeFailText']);
const call = (n, ...a) => { try { return typeof F[n] === 'function' ? F[n](...a) : undefined; } catch (e) { return { threw: e && e.message }; } };
const blockFrom = start => { const a = raw.indexOf(start); if (a < 0) return ''; let d = 0, s = false;
  for (let k = raw.indexOf('{', a); k < raw.length; k++) { if (raw[k] === '{') { d++; s = true; } else if (raw[k] === '}') { d--; if (s && !d) return raw.slice(a, k + 1); } } return ''; };
const L1018 = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const BOX = 'Κάτι δεν λειτούργησε από τη μεριά της εφαρμογής, όχι από τη δική σου. Το μήνυμά σου είναι πάλι στο κουτί· στείλ\' το ξανά όταν θέλεις.';
const NOBOX = 'Δεν μπορώ να εμφανίσω απάντηση αυτή τη στιγμή. Δοκίμασε ξανά όταν θέλεις.';

// ── NO LOST MESSAGE ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const A = 'Μήνυμα Α: δεν ξέρω αν πρέπει\nνα αλλάξω δουλειά.  ', B = '  Μήνυμα Β: και κάθε βράδυ σκέφτομαι τα λεφτά.';
assert('NO LOST: an empty box gets the failed message back, as before', call('keepBothTexts', A, '') === A && call('keepBothTexts', A, '   \n ') === A && call('keepBothTexts', A, undefined) === A);
assert('NO LOST: a box with a new text keeps BOTH — the failed message first, a blank line, then the new text', call('keepBothTexts', A, B) === A + '\n\n' + B);
assert('NO LOST: … each exactly as typed — nothing trimmed, cut or mixed inside either', (() => { const r = call('keepBothTexts', A, B); return typeof r === 'string' && r.startsWith(A) && r.endsWith(B) && r.length === A.length + 2 + B.length; })());
assert('NO LOST: the same text typed again is not doubled', call('keepBothTexts', A, A) === A && call('keepBothTexts', A, ' ' + A.trim() + ' ') === ' ' + A.trim() + ' ');
assert('NO LOST: the box already holding the failed message and more (it was typed again, then added to) is left as it is', call('keepBothTexts', A, A.trim() + ' και κάτι ακόμα') === A.trim() + ' και κάτι ακόμα');
assert('NO LOST: no failed message → the box as it is', call('keepBothTexts', null, B) === B && call('keepBothTexts', '', B) === B);
{ const G = blockFrom('const generateResponse = useCallback(');
  const c = G.indexOf('} catch(e) {\n      setError(e.message);'), f = G.indexOf('} finally {', c), CATCH = c > 0 && f > c ? G.slice(c, f) : '';
  // UPDATED (7/11/2026, ADR «7 Νοεμβρίου (β)», John's round 5, finding 143): what goes back is the user's own message (_mine) — never one
  // the app wrote in the user's place; still through keepBothTexts, still never «cur || restored»
  assert('NO LOST (wiring): the failed turn\'s message goes back to the box through keepBothTexts — never «cur || restored» again',
    /if \(_mine\) setInput\(cur => keepBothTexts\(_mine, cur\)\);/.test(CATCH) && !/setInput\(cur => cur \|\| _rb\.restored\)/.test(raw));
  // ── (α) the error screen ──────────────────────────────────────────────────────────────────────────────────────────────────────
  // UPDATED (7/11/2026, ADR «7 Νοεμβρίου (β)», John's round 5): «…πάλι στο κουτί…» exactly when the USER'S message went back there
  // (_mine, finding 143); on a timeout John's timeout text, under the same condition (checked in test_timeout_143.js)
  assert('(α) the main path\'s failed call: John\'s text, with «…πάλι στο κουτί…» exactly when the message went back there',
    /setError\(_mine \? \(e && e\.message === CALL_TIMEOUT_TEXT \? TIMEOUT_TEXT_SHOWN : SAFE_FAIL_TEXTS\.box\) : SAFE_FAIL_TEXTS\.noBox\);/.test(CATCH) && CATCH.indexOf('setError(_mine ?') > CATCH.indexOf('const _rb = rollbackFailedTurn(msgs);'));
  // UPDATED (7/11/2026, round 5): callAura's own timeout text is now only the app's signal that it was a timeout — it is not shown, so it
  // is not one of John's texts (John's timeout text is shown instead, where true: test_timeout_143.js)
  const TO = (raw.match(/const CALL_TIMEOUT_TEXT = "([^"]+)";/) || [])[1] || '';
  assert('(α) callAura\'s own timeout text «' + TO + '» — the very text it throws — is the app\'s signal of a timeout, not a text of John\'s',
    TO === 'Η σύνδεση έληξε. Έλεγξε το δίκτυό σου και δοκίμασε ξανά.' && raw.includes('throw new Error("' + TO + '")') && call('isSafeFailText', TO) === false); }
// UPDATED (7/11/2026, ADR «7 Νοεμβρίου», John's approval of finding 142, round 4): a written correction («αυτό δεν ισχύει →») now goes
// back to its card's box, so it left this list — checked, more strictly, in test_misfire_keep_142.js; «Συνέχισε» (nothing written) keeps
// the second text, checked here as before.
assert('(α) the other replies whose message is not put back (First-WHY, «Συνέχισε» of «αυτό δεν ισχύει →» with nothing written, the compression): the second text',
  /if \(_fdl\) setCrisisFallback\(_fdl\); setError\(SAFE_FAIL_TEXTS\.noBox\); \}/.test(raw) &&
  /\n      else setError\(SAFE_FAIL_TEXTS\.noBox\);\n    \}/.test(blockFrom('const handleMisfireResponse = useCallback(')) &&
  /setError\(SAFE_FAIL_TEXTS\.noBox\);/.test(blockFrom('const handlePivotChoice = useCallback(')));
assert('(α) the error line: John\'s texts without «Σφάλμα:»; any other error as before', /\{error && <div className="err">\{isSafeFailText\(error\) \? error : "Σφάλμα: " \+ error\}<\/div>\}/.test(raw) &&
  call('isSafeFailText', BOX) === true && call('isSafeFailText', NOBOX) === true && call('isSafeFailText', 'Η συσκευή σου δεν έχει άλλο χώρο') === false);

// ── (β) β2 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{ const T = F.STAGE_A_TEXTS || {};
  assert('(β) β2: the short goodbye «' + (T.afterCrisisNoNumbers || '') + '» stays word for word, with the line 1018 / 112 under it', call('afterCrisisShown', T.afterCrisisNoNumbers) === T.afterCrisisNoNumbers + '\n\n' + L1018 && T.afterCrisisNoNumbers === 'Είμαι εδώ όταν χρειαστεί να συνεχίσουμε.');
  assert('(β) … the whole phrase («…οι αριθμοί που σου έδωσα είναι εκεί») stays alone — «και τίποτα άλλο»', call('afterCrisisShown', T.afterCrisisWithNumbers || T.afterCrisis) === T.afterCrisis);
  assert('(β) … any other text unchanged', call('afterCrisisShown', 'Τι σε κρατάει;') === 'Τι σε κρατάει;' && call('afterCrisisShown', null) === null); }
assert('(β) wiring: the user\'s goodbye, the leaving door\'s dismissal and the model\'s path all show it through afterCrisisShown',
  (raw.match(/afterCrisisShown\(/g) || []).length >= 4);

// ── (γ1) Β, (γ3) Α ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(γ1) the line of the session: crisis A → 1018 / 112, crisis B → 10306, danger → 112 + 15900 / 1056; none → nothing (DISTRESS has no line)',
  call('sessionLatchLine', 1, null) === L1018 && call('sessionLatchLine', 2, null) === 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306.' &&
  call('sessionLatchLine', 0, { self: true, child: false }) === 'Σε άμεσο κίνδυνο, 112. Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.' &&
  call('sessionLatchLine', 0, null) === '' && call('sessionLatchLine', 3, null) === '');
assert('(γ1) Β: the end screen shows it under «Επίστρεψε όταν υπάρχει κάτι νέο να δούμε.», only when there is one',
  /<div className="end-note">Επίστρεψε όταν υπάρχει κάτι νέο να δούμε\.<\/div>\s*\{_endLine && <div role="alert" className="crisis-fallback" data-end-line="1">\{_endLine\}<\/div>\}/.test(raw));
assert('(γ1) Β: … and that line is the line of the session\'s latch, worked out on the end screen from the risk of the session and every user message',
  (raw.match(/const _endLine = sessionEnded \? sessionLatchLine\(riskSignalKind\.current, dangerInMessages\(messages\)\) : "";/g) || []).length === 1);
assert('(γ3) Α: a failed closing call keeps the app\'s own text, and the line of the session goes to the line box (Part 1 and Part 2)',
  (raw.match(/const _closeLine = sessionLatchLine\(riskSignalKind\.current, dangerInMessages\(msgs\)\); if \(_closeLine\) setCrisisFallback\(_closeLine\);/g) || []).length === 2);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
