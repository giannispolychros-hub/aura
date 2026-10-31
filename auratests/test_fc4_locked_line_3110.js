// AURA — FC4, OPTION Γ (John, 31/10/2026, a safety fix (α), Constitution §0.1; the FC4 characterisation of 26/10, ADR «26 Οκτωβρίου»).
// What was measured: when a call runs long (a slow error, then the app's one retry), the 30-second guard frees the input box while the
// earlier send still holds the one-at-a-time lock (submittingRef). A crisis message — or danger from another person — typed then and
// sent with «Go» did nothing at all: no request, no line, the text left in the box. Until the earlier call ended, no number on screen.
// The change, code only: in that case the app's line comes AT ONCE, from code, by the same rules as a failed call (buildCrisisLine for
// the tier, buildDangerLine), into the same separate line under the box (crisisFallback) — not marked as shown, so when the user sends
// the message again once the lock opens, its reply carries the line and the separate line goes (crisisFallbackAfterReply). The message
// itself is still NOT sent while the lock is closed (options Α and Β of 26/10 were not chosen). Nothing changes for any other text.
// Browser: section FL of scripts/e2e_stage_a.cjs (both flows), and FC4.
//  (Α) the line, as a pure function   (Β) where it is read: the first statement of handleSubmit   (Γ) once, never twice   (Δ) the rest

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
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
// the app's own functions, loaded the way test_danger_from_other_2310.js loads them (no copies of the rules here)
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const arr = n => { const a = CODE.indexOf('const ' + n + ' = ['); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n];', a) + 3); };
const NAMES = ['lockedSendSafetyLine', 'detectSafetySignal', 'classifyCrisisTier', 'buildCrisisLine', 'detectsDangerFromOther', 'buildDangerLine',
  'crisisFallbackAfterReply', 'lookBehind'];
let env = {};
try {
  env = new Function(arr('HELPLINES') + ';\n' + NAMES.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`).join('\n') +
    '\nreturn { ' + NAMES.join(', ') + ' };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const L = env.lockedSendSafetyLine;
const run = (...a) => { try { return L(...a); } catch (e) { return 'threw: ' + e.message; } };

// ── (Α) the line ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const L1018 = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const L10306 = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';
const SELF = 'Σε άμεσο κίνδυνο, 112. Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.';
const CHILD = 'Σε άμεσο κίνδυνο, 112. Για παιδί, 1056, Χαμόγελο του Παιδιού.';
assert('(Α) one pure function gives the line for a text typed while the lock is closed', typeof L === 'function');
assert('(Α) crisis, tier A → the 1018 / 112 line, word for word', run('Δεν θέλω να ζω άλλο.', false, []) === L1018);
assert('(Α) crisis, tier B → the 10306 line, as on a failed call', run('Δεν αντέχω άλλο.', false, []) === L10306);
assert('(Α) … and tier B only once a session, by the app\'s own rule (already shown → nothing more)', run('Δεν αντέχω άλλο.', true, []) === '');
assert('(Α) tier A is never held back by the 10306 rule', run('Δεν θέλω να ζω άλλο.', true, []) === L1018);
assert('(Α) danger from another person, to the person writing → 112 and 15900', run('Με χτυπάει ο άντρας μου. Φοβάμαι να φύγω.', false, []) === SELF);
assert('(Α) danger to a child → 112 and 1056', run('Ο σύντροφός μου χτυπάει το παιδί μου.', false, []) === CHILD);
assert('(Α) a crisis message that also tells of danger → both lines, 112 once',
  (() => { const r = run('Με χτυπάει ο άντρας μου και δεν θέλω να ζω άλλο.', false, []); return r.startsWith(L1018) && r.includes('15900') && (r.match(/(?:^|\D)112(?!\d)/g) || []).length === 1; })());
assert('(Α) the danger line already written this session → not again (the app\'s own once-a-session rule)', run('Με χτυπάει ο άντρας μου.', false, ['self', '112']) === '');
for (const t of ['Η δουλειά με κουράζει πολύ.', 'Γιατί δεν απαντάς;', 'Ευχαριστώ.', 'Χτύπησε το τηλέφωνο.', '']) assert('(Α) no signal → nothing: «' + t + '»', run(t, false, []) === '');
assert('(Α) DISTRESS («κρίση», panic) is not CRISIS → no number, as everywhere else (and the app does read these two as DISTRESS)',
  ['Είμαι σε κρίση.', 'Έπαθα κρίση πανικού.'].every(t => env.detectSafetySignal(t) === 'DISTRESS' && run(t, false, []) === ''));
assert('(Α) not a string → nothing, never throws', [undefined, null, 42, {}].every(v => run(v, false, []) === ''));
assert('(Α) the same rules as the failed call: the same builders are called, no line text of its own',
  (() => { const s = fnSrc('lockedSendSafetyLine'); return /buildCrisisLine\(classifyCrisisTier\(/.test(s) && /buildDangerLine\(/.test(s) && !/1018|10306|15900|1056/.test(s); })());

// ── (Β) where it is read ────────────────────────────────────────────────────────────────────────────────────────────────────────
const hsA = CODE.indexOf('const handleSubmit = useCallback(async () => {');
const HS = hsA < 0 ? '' : CODE.slice(hsA, CODE.indexOf('\n  }, [input, loading, sessionEnded,', hsA));
const LOCK = 'if (!input.trim() || loading || sessionEnded || submittingRef.current) return;';
const iLock = HS.indexOf(LOCK);
const head = iLock > 0 ? HS.slice(HS.indexOf('{') + 1, iLock) : '';
assert('(Β) the lock line itself is unchanged, and is still the first thing that can stop a send', iLock > 0 && (HS.split(LOCK).length - 1) === 1);
assert('(Β) before it, only while the lock is closed (loading, or the earlier send still running) and the session open, the line is read',
  /if \(input\.trim\(\) && !sessionEnded && \(loading \|\| submittingRef\.current\)\) \{/.test(head) &&
  /const _lockedLine = lockedSendSafetyLine\(input, supportLineShown\.current, dangerLineShown\.current\);/.test(head));
assert('(Β) … and goes into the app\'s separate line (crisisFallback) — the same place as the line of a failed call',
  head.includes('if (_lockedLine) setCrisisFallback(prev => !crisisFallbackAfterReply(_lockedLine, prev) ? prev : prev ? prev + "\\n\\n" + _lockedLine : _lockedLine);'));
assert('(Β) nothing is sent, stored or cleared there: no request, no history, the text stays in the box, nothing marked as shown',
  head.length > 0 && !/callAura|generateResponse|setMessages|setInput|submittingRef\.current =|supportLineShown\.current =|dangerLineShown\.current =|recordTelemetry|setSafetyMode|riskSignalKind|dangerFromOther\.current =/.test(head));
assert('(Β) the line is read at one place only', (CODE.split('lockedSendSafetyLine(').length - 1) === 2);

// ── (Γ) once, never twice ───────────────────────────────────────────────────────────────────────────────────────────────────────
// the update the app applies, run on the states it can meet
const upd = (prev, line) => { try { return !env.crisisFallbackAfterReply(line, prev) ? prev : prev ? prev + '\n\n' + line : line; } catch (e) { return 'threw'; } };
assert('(Γ) nothing on screen yet → the line', upd(null, L1018) === L1018);
assert('(Γ) «Go» again, the same line already there → unchanged (the line is on screen once)', upd(L1018, L1018) === L1018 && upd(upd(L1018, L1018), L1018) === L1018);
assert('(Γ) the line of a failed crisis call already there → nothing added', upd(L1018, L1018) === L1018);
assert('(Γ) a danger line there and now a crisis message → the crisis line is added under it, each number once',
  (() => { const r = upd(SELF, L1018); return r === SELF + '\n\n' + L1018 && (r.match(/1018/g) || []).length === 1 && (r.match(/15900/g) || []).length === 1; })());
assert('(Γ) a later reply that carries the numbers clears it, as for a failed call (unchanged rule)',
  env.crisisFallbackAfterReply && env.crisisFallbackAfterReply(L1018, 'Είμαι εδώ. ' + L1018) === null && env.crisisFallbackAfterReply(L1018, 'Σε ακούω.') === L1018);

// ── (Δ) the rest ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(raw.indexOf('`', a) + 1, raw.indexOf('`;', a + 1)); };
assert('(Δ) the prompt (AURA_CORE_PERSONALITY) is unchanged', h(lit('AURA_CORE_PERSONALITY')) === 'b5f303cc9405aa21');
let gen = ''; try { gen = cp.execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { encoding: 'utf8' }); } catch (e) { gen = String(e.stdout || ''); }
assert('(Δ) the prompt fingerprints in api/aura.js are up to date', /up to date/.test(gen));
assert('(Δ) the 30-second guard is not changed (options Α and Β were not chosen)', /30000/.test(CODE) && !/55000/.test(CODE));
assert('(Δ) the builders of the lines are the ones of 23/10–26/10 (unchanged)',
  h(fnSrc('buildCrisisLine')) === 'd359e22dd7cf9a95' && h(fnSrc('buildDangerLine')) === 'df6f7df2a56379a2' && h(fnSrc('crisisFallbackAfterReply')) === 'aa4bf043ee518d6c');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
