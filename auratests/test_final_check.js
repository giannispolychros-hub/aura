// AURA — THE FINAL CHECK (John, 6/11/2026, round 3 of the branch hardening-2026-11, ADR «6 Νοεμβρίου»).
//
// Every text of AURA goes through ONE exit before it is shown: finishReply(text, ctx). It runs after every change a path makes (the scale
// question, the emptying of a closing before the root, the fixed goodbyes, the misfire and compression replies), applies the safety
// filters, adds the app's safety lines LAST, and checks the text AS IT WILL BE SHOWN (shownTextOf: the same changes the message bubble
// makes). If the check fails, or throws, the app shows a fixed text instead (SAFE_FAIL_TEXTS), with the line of the latch from HELPLINES.
// It is a net for the app's normal flow — the model's mistakes and our own (a new path that forgets a filter). It is not a protection
// against a third party: it runs on the user's device, and whoever changes the code in their own browser goes around it.
//
// One check for each case of the audit of 4/11 (A2, A5, A6, A6β, A7) and for each of the six failures (F1–F6). The same cases on the
// screen: scripts/e2e_stage_a.cjs, section FK. Written FIRST (commit (i)): on the code before the check they fail.
//  A2  the closing's reply goes through the safety filters (a claim about a line is cut, the rest stays)
//  A5  on the model's path, the goodbye after a crisis knows the line in the box (fallbackLine is passed)
//  A6  the crisis line is added AFTER the path's changes (a scale question in place of the reply still carries it)
//  A6β an emptied reply (a closing before the root) still carries the second line of defence
//  A7  the reply after «αυτό δεν ισχύει →» goes through the same exit (a claim is cut; «Είσαι άνθρωπος;» gets the app's line)
//  F1  a detector that throws: no call to the model, the fixed text, the line of tier A (the latch is unknown)
//  F2  the check itself throws: the fixed text, never the model's text
//  F3  a reply of an unexpected shape, or a body that is not JSON: an error with the app's own words, not a technical one (callAura)
//  F4  an empty reply, a reply far too long, a hidden tag: the check does not pass them
//  F5  the fallback fails too: the built-in «Κάτι δεν λειτούργησε. Σε άμεσο κίνδυνο, 112.»
//  F6  the history cap fails on an old phone (no Blob): it counts the bytes by hand — the same cap, never a failure (capMessageHistory)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

// The top-level code of App.jsx (outside the component), with every function and constant a name uses — loaded as it is.
function load(names) {
  const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), ce = raw.indexOf('`;', raw.indexOf('`', ci) + 1);
  const code = raw.slice(0, ci) + 'const AURA_CORE_PERSONALITY = "";' + raw.slice(ce + 2);
  const end = code.indexOf('\nexport default function AURAv2');
  const top = code.slice(0, end < 0 ? code.length : end);
  const re = /^(?:async )?function ([A-Za-z_$][\w$]*)\(|^const ([A-Za-z_$][\w$]*) =/gm;
  const starts = []; let m; while ((m = re.exec(top))) starts.push({ name: m[1] || m[2], at: m.index });
  const blocks = Object.create(null); // no inherited names («toString», «constructor») mistaken for a block of App.jsx
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    const body = top.slice(s.at, i + 1 < starts.length ? starts[i + 1].at : top.length).replace(/(\n\/\/[^\n]*)+\s*$/, '\n');
    if (/return \(\s*</.test(body) || /^const [A-Za-z_$][\w$]* = memo\(/.test(body)) continue;   // React components are not loaded
    blocks[s.name] = body;
  }
  const seen = new Set(), order = [];
  const visit = n => { if (seen.has(n) || !blocks[n]) return; seen.add(n);
    for (const id of new Set(blocks[n].match(/\b[A-Za-z_$][\w$]*\b/g) || [])) if (id !== n && blocks[id]) visit(id);
    order.push(n); };
  names.forEach(visit);
  const found = names.filter(n => blocks[n]);
  try { return new Function(order.map(n => blocks[n]).join('\n') + '\nreturn {' + found.join(',') + '};')(); }
  catch (e) { console.log('LOAD ERROR — ' + e.message); return {}; }
}
const F = load(['finishReply', 'shownTextOf', 'finalReplyCheck', 'latchLine', 'safeFailFor', 'safetyProbe', 'replyTextOf', 'capHistorySafely',
  'SAFE_FAIL_TEXTS', 'HELPLINES', 'buildCrisisLine', 'detectSafetySignal', 'detectsDangerFromOther', 'classifyCrisisTier']);
const call = (n, ...a) => { try { return typeof F[n] === 'function' ? F[n](...a) : undefined; } catch (e) { return { threw: e && e.message }; } }; // a missing function fails, never crashes
const contentOf = r => (r && typeof r.content === 'string') ? r.content : '';

const L1018 = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const L10306 = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306.';
const IDENTITY = 'Είμαι τεχνητή νοημοσύνη, όχι άνθρωπος.';
const BOX = 'Κάτι δεν λειτούργησε από τη μεριά της εφαρμογής, όχι από τη δική σου. Το μήνυμά σου είναι πάλι στο κουτί· στείλ\' το ξανά όταν θέλεις.';
const NOBOX = 'Δεν μπορώ να εμφανίσω απάντηση αυτή τη στιγμή. Δοκίμασε ξανά όταν θέλεις.';
const LAST = 'Κάτι δεν λειτούργησε. Σε άμεσο κίνδυνο, 112.';
const THREE = 'ΗΡΘΕΣ ΜΕ: κούραση\nΒΡΗΚΕΣ: φόβο\nΦΕΥΓΕΙΣ ΜΕ: ένα βήμα';
const SCALE = 'Πριν προχωρήσουμε — τώρα, πόσο ξεκάθαρο είναι αυτό, από το 1 έως το 10;';
const CLAIM = 'Η γραμμή 10306 είναι ανοιχτή όλο το 24ωρο και θα σου απαντήσει σίγουρα.';
const ctx = o => Object.assign({ kind: 'model', mode: 'ANSWER', lastUserText: 'Δεν ξέρω.', modelText: '', safetyPath: false, danger: null, supportShown: false, dangerShown: [] }, o);

// ── the exit and its texts exist ─────────────────────────────────────────────────────────────────────────────────────────────────
assert('(0) the one exit finishReply, shownTextOf, finalReplyCheck, latchLine, safeFailFor exist as top-level functions of App.jsx',
  ['finishReply', 'shownTextOf', 'finalReplyCheck', 'latchLine', 'safeFailFor'].every(n => typeof F[n] === 'function'));
assert('(0) the fixed texts, word for word (John\'s decision (α), 6/11): with the message in the box / when it is not / the built-in one',
  !!F.SAFE_FAIL_TEXTS && F.SAFE_FAIL_TEXTS.box === BOX && F.SAFE_FAIL_TEXTS.noBox === NOBOX && F.SAFE_FAIL_TEXTS.last === LAST);
assert('(0) the lines of a latch are the app\'s own, from HELPLINES only: tier A (or unknown) 1018 / 112, tier B 10306, danger 112 + 15900 / 1056',
  call('latchLine', { tier: 'A' }) === L1018 && call('latchLine', { tier: 'unknown' }) === L1018 && call('latchLine', { tier: 'B' }) === L10306 &&
  call('latchLine', { danger: { self: true } }) === 'Σε άμεσο κίνδυνο, 112. Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.' &&
  call('latchLine', { danger: { child: true } }) === 'Σε άμεσο κίνδυνο, 112. Για παιδί, 1056, Χαμόγελο του Παιδιού.' && call('latchLine', {}) === '');

// ── the app's own lines are never changed by the exit (found in the browser on 6/11, before commit (ii) was final) ───────────────────
{ const B_LINE = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';
  const inB = 'Είμαι εδώ. Θέλεις να μου πεις λίγο περισσότερο;\n\n' + B_LINE;
  const r = call('finishReply', inB, ctx({ mode: 'SUPPORTIVE', lastUserText: 'Απελπισία. Δεν βλέπω νόημα σε τίποτα πια.', modelText: 'Είμαι εδώ. Θέλεις να μου πεις λίγο περισσότερο;', safetyPath: true }));
  assert('(0) the app\'s own 10306 line, already under a crisis reply, comes out word for word — a filter never judges the app\'s words', !!r && r.failed === false && contentOf(r) === inB);
  const SELF = 'Σε άμεσο κίνδυνο, 112. Για βία στο σπίτι, 15900, γραμμή SOS για τη βία κατά των γυναικών.';
  const inD = 'Σε ακούω. Τι γίνεται τώρα;\n\n' + SELF + '\n\n' + IDENTITY;
  const d = call('finishReply', inD, ctx({ lastUserText: 'Είσαι άνθρωπος;', danger: { self: true }, dangerShown: ['self', '112'], safetyPath: true }));
  assert('(0) … and so do the danger line and the AI-identity line', !!d && d.failed === false && contentOf(d) === inD); }

// ── a reply its path took away on purpose is not a failure (found in the browser on 6/11, section MC, before commit (ii) was final) ──
{ const SUMMARY = 'ΗΡΘΕΣ ΜΕ: έναν τσακωμό που δεν τελειώνει.\n\nΒΡΗΚΕΣ: κάτι δικό σου.\n\nΦΕΥΓΕΙΣ ΜΕ: μια φράση.';
  const r = call('finishReply', '', ctx({ mode: 'ANSWER', lastUserText: 'Ναι, άλλαξε.', modelText: SUMMARY }));
  assert('(0) Stage A, the model\'s closing before the root (emptied by its path, ADR «11 Οκτωβρίου (β)»): nothing is written and it is NOT a failure — door 1\'s question opens as before',
    !!r && r.failed === false && contentOf(r) === '');
  const e = call('finishReply', '', ctx({ mode: 'ANSWER', lastUserText: 'Ναι, άλλαξε.', modelText: '' }));
  const w = call('finishReply', '   ', ctx({ mode: 'ANSWER', lastUserText: 'Ναι, άλλαξε.', modelText: '  ' }));
  assert('(0) … but an empty reply of the model itself is still a failure (iv)', !!e && e.failed === true && !!w && w.failed === true);
  const SAFE = 'Θα είσαι ασφαλής εκεί.';
  const c = call('finishReply', SAFE, ctx({ mode: 'ANSWER', lastUserText: 'Δεν ξέρω.', modelText: SAFE, safetyPath: true, danger: { self: true }, dangerShown: ['self', '112'] }));
  assert('(0) … and a reply that came in WITH text is never dropped in silence: a promise of a safe outcome under danger (the line already shown) is shown as John\'s sentence, not as nothing',
    !!c && c.failed === false && contentOf(c) === 'Δεν μπορώ να σου υποσχεθώ τι θα γίνει. Για το πώς κρατιέται κάτι κρυφό, ρώτα απευθείας τη γραμμή. Οι αριθμοί που σου έδωσα είναι εκεί.'); }

// ── a reply the exit's OWN filter empties is a failure, never «emptied on purpose» (round 7, John's check of the mutation K27) ────
// On the safety path, a reply that is only a claim about a help line with no number is dropped whole by the filter. The reply of
// «αυτό δεν ισχύει →» reaches the exit unfiltered, so the exit is where this happens: it must fail (the correction back in its box, the
// failure text) — never show nothing in silence. Found in round 7: the clause «the path came here with no text» is what decides it.
{ const T = 'Η γραμμή είναι δωρεάν και ανώνυμη.';
  const r = call('finishReply', T, ctx({ mode: 'AUDIT', lastUserText: 'Δεν είναι αυτό.', modelText: T, safetyPath: true }));
  assert('(0) a reply that came in WITH text and that the exit\'s own filter empties (a numberless claim about a line, safety path) is a failure — never silently nothing',
    !!r && r.failed === true && r.why === 'empty' && r.empty !== true); }

// ── A2 — the closing ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
{ const r = call('finishReply', 'Η σκέψη σου μένει δική σου. ' + CLAIM, ctx({ kind: 'closing', mode: 'TERMINATION', safetyPath: true, lastUserText: 'αλλαγή' }));
  assert('A2: the closing\'s reply on the safety path — the claim about the line is cut, the rest of the closing stays',
    !contentOf(r).includes('θα σου απαντήσει σίγουρα') && contentOf(r).startsWith('Η σκέψη σου μένει δική σου.') && r && r.failed !== true); }

// ── A5 — the goodbye after a crisis, on the model's path ─────────────────────────────────────────────────────────────────────────
{ const calls = [...raw.matchAll(/stageAAfterCrisisText\(\{([^}]*)\}\)/g)].map(m => m[1]);
  assert('A5: both calls of stageAAfterCrisisText (the user\'s goodbye and the model\'s) pass the line in the box (fallbackLine)',
    calls.length === 2 && calls.every(c => /fallbackLine:/.test(c))); }

// ── A6 — the crisis line comes after the path's changes ─────────────────────────────────────────────────────────────────────────
{ const r = call('finishReply', SCALE, ctx({ mode: 'SUPPORTIVE', lastUserText: 'Θέλω να πεθάνω.', modelText: THREE, safetyPath: true }));
  assert('A6: a crisis reply (tier A) replaced by the scale question still ends with the line 1018 / 112', contentOf(r).endsWith('\n\n' + L1018) && contentOf(r).startsWith(SCALE)); }
{ const r = call('finishReply', SCALE, ctx({ mode: 'SUPPORTIVE', lastUserText: 'Απελπισία. Δεν βλέπω νόημα σε τίποτα πια.', modelText: THREE, safetyPath: true }));
  assert('A6: … and on tier B the line 10306, once — and it counts as shown only because it is in the text', contentOf(r).endsWith('\n\nΥπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.') && r.supportShown === true); }
{ const r = call('finishReply', SCALE, ctx({ mode: 'SUPPORTIVE', lastUserText: 'Απελπισία. Δεν βλέπω νόημα σε τίποτα πια.', modelText: THREE, safetyPath: true, supportShown: true }));
  assert('A6: tier B when 10306 was already shown: no second line, and nothing counts as newly shown', contentOf(r) === SCALE); }

// ── A6β — an emptied reply ───────────────────────────────────────────────────────────────────────────────────────────────────────
{ const r = call('finishReply', '', ctx({ modelText: THREE + '\n\nΣκέφτεσαι να κάνεις κακό στον εαυτό σου;', lastUserText: 'Δεν ξέρω τι θέλω τελικά.' }));
  assert('A6β: the model asked about self-harm and its closing was emptied — the second line of defence (1018 / 112) is still shown, alone', contentOf(r) === L1018); }

// ── A7 — the misfire reply goes through the same exit ───────────────────────────────────────────────────────────────────────────
{ const r = call('finishReply', 'Κατάλαβα. Τι λείπει από την εικόνα;', ctx({ mode: 'AUDIT', lastUserText: 'Είσαι άνθρωπος; Δεν είναι ο φόβος.' }));
  assert('A7: «Είσαι άνθρωπος;» in the correction → the reply carries the app\'s line «' + IDENTITY + '»', contentOf(r) === 'Κατάλαβα. Τι λείπει από την εικόνα;\n\n' + IDENTITY); }
{ const r = call('finishReply', 'Κατάλαβα. ' + CLAIM, ctx({ mode: 'AUDIT', safetyPath: true }));
  assert('A7: … and on the safety path its claim about a line is cut', contentOf(r).startsWith('Κατάλαβα.') && !contentOf(r).includes('σίγουρα')); }
assert('A7: the misfire path, the compression path and the closings call finishReply (no reply of the model reaches setMessages without it)',
  (raw.match(/finishReply\(/g) || []).length >= 6);

// ── F1 — a detector throws ───────────────────────────────────────────────────────────────────────────────────────────────────────
{ const p = call('safetyProbe', 'Δεν ξέρω.', { detectSafetySignal: () => { throw new Error('boom'); } });
  const ok = call('safetyProbe', 'Θέλω να πεθάνω.');
  assert('F1: safetyProbe — a detector that throws gives { ok: false }; a working one gives its answer', !!p && p.ok === false && !!ok && ok.ok === true && ok.signal === 'CRISIS' && ok.tier === 'A');
  const f = call('safeFailFor', { inBox: true, latch: { tier: 'unknown' } });
  assert('F1: what the user sees then — the fixed text with the message in the box, and the line of tier A (the latch is unknown)', !!f && f.error === BOX && f.line === L1018);
  const g = call('safeFailFor', { inBox: false, latch: {} });
  assert('(α) «…πάλι στο κουτί…» only when it is true: a path that does not put the message back gets the second text, and no latch → no line', !!g && g.error === NOBOX && g.line === '');
  assert('F1: the send handler asks safetyProbe first, before any other detector, and stops there when it fails (no call to the model)',
    /const _probe = safetyProbe\(userText\);\s*\n\s*if \(!_probe\.ok\)/.test(raw)); }

// ── F2 — the check itself throws ─────────────────────────────────────────────────────────────────────────────────────────────────
{ const bad = ctx({}); Object.defineProperty(bad, 'mode', { get() { throw new Error('boom'); } });
  const r = call('finishReply', 'Ο μοντέλου λόγος.', bad);
  assert('F2: finishReply throws inside → { failed: true }, and nothing of the model\'s text is in what it returns', !!r && r.failed === true && !contentOf(r).includes('μοντέλου')); }

// ── F3 — a reply of an unexpected shape ──────────────────────────────────────────────────────────────────────────────────────────
// CHANGED IN COMMIT (ii), the way, not the rule: commit (i) named a helper, replyTextOf. The fix went inline in callAura instead, so that
// two older tests that pin callAura's lines byte for byte (test_api_cost.js, test_api_prompt_guard.js) and the tests that run callAura on
// its own (test_call_lock_retry.js, test_failure_recovery.js) stay as they are. The same rule is checked here on callAura itself: it is
// run from App.jsx with a fake fetch, as test_call_lock_retry.js runs it.
const fnText = n => { const a = raw.indexOf('\nfunction ' + n + '(') >= 0 ? raw.indexOf('\nfunction ' + n + '(') + 1 : raw.indexOf('\nasync function ' + n + '(') + 1; if (a <= 0) return '';
  let d = 0; for (let j = raw.indexOf('{', a); j < raw.length; j++) { if (raw[j] === '{') d++; else if (raw[j] === '}') { d--; if (!d) return raw.slice(a, j + 1); } } return ''; };
const runCall = async (reply) => {
  const env = { fetch: async () => reply, setTimeout: (f) => { f(); return 0; }, clearTimeout: () => {}, AbortController: class { constructor() { this.signal = {}; } abort() {} },
    recordTelemetry: () => {}, window: {}, console: { log() {}, warn() {} }, AURA_CORE_PERSONALITY: 'CORE', Blob };
  const src = ['let _activeCall = false;', ...['apiErrorReasonCode', 'friendlyApiError', 'isEmptyModelResponse', 'capMessageHistory', 'callAura'].map(fnText), 'return { callAura };'].join('\n');
  try { const M = new Function(...Object.keys(env), src)(...Object.values(env)); return await M.callAura([{ role: 'user', content: 'Γεια.' }], 'CORE x').then(t => ({ text: t }), e => ({ threw: e && e.message })); }
  catch (e) { return { threw: 'load: ' + e.message }; }
};
const okReply = body => ({ ok: true, status: 200, json: async () => body });
const asyncChecks = [];
asyncChecks.push((async () => {
  const good = await runCall(okReply({ content: [{ type: 'text', text: 'Τι σε ' }, { type: 'text', text: 'κρατάει;' }] }));
  assert('F3: callAura joins the text of a normal reply', good.text === 'Τι σε κρατάει;');
  const bad = await Promise.all([okReply({ content: {} }), okReply({ content: 'x' }), okReply(null), okReply({ content: [{ type: 'image' }] }),
    { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token < in JSON'); } }].map(runCall));
  assert('F3: a reply of an unexpected shape, or a body that is not JSON → an error in the app\'s own words, never a technical one',
    bad.every(b => typeof b.threw === 'string' && /^Κάτι δεν λειτούργησε/.test(b.threw) && !/function|undefined|null|map|JSON|token/.test(b.threw)));
})());

// ── F4 — empty, far too long, a hidden tag ───────────────────────────────────────────────────────────────────────────────────────
{ const chk = t => call('finalReplyCheck', t, {});
  assert('F4: the check passes an ordinary reply', !!chk('Τι σε κρατάει εκεί;') && chk('Τι σε κρατάει εκεί;').ok === true);
  assert('F4: the check does not pass an empty reply, a reply over 6,000 characters, or a hidden tag', [chk(''), chk('   '), chk('α'.repeat(6001)), chk('Τι σε κρατάει; [[EXIT:yes]]')].every(r => !!r && r.ok === false));
  const r = call('finishReply', 'α'.repeat(7000), ctx({}));
  assert('F4: finishReply on a reply far too long → { failed: true }', !!r && r.failed === true); }

// ── F5 — the fallback fails too ──────────────────────────────────────────────────────────────────────────────────────────────────
{ const f = call('safeFailFor', { inBox: true, latch: { tier: 'A' } }, null);
  assert('F5: when the fixed text cannot be built (no HELPLINES) → the built-in «' + LAST + '», nothing else', !!f && f.error === LAST && f.line === ''); }

// ── F6 — the history cap fails ───────────────────────────────────────────────────────────────────────────────────────────────────
// CHANGED IN COMMIT (ii), the way, not the rule: commit (i) named a wrapper, capHistorySafely, with a plain cap. The one call in the cap
// that fails on an old phone is Blob; capMessageHistory now counts the bytes by hand when there is no Blob — so it never fails and it is
// the SAME cap (a stricter rule than a plain one). callAura's line that calls it stays byte for byte (test_api_prompt_guard.js pins it).
{ const capWith = blob => { try { return new Function('Blob', fnText('capMessageHistory') + '\nreturn capMessageHistory;')(blob); } catch (e) { return null; } };
  const withBlob = capWith(Blob), noBlob = capWith(undefined);
  const prompt = 'Ελληνικό prompt με τόνους — ά έ ή ί ό ύ ώ 😀 '.repeat(4000);
  const msgs = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: (i % 2 ? 'α' : 'χ').repeat(i === 25 ? 9000 : 700) }));
  let a = null, b = null; try { a = withBlob(msgs, prompt); b = noBlob(msgs, prompt); } catch (e) { b = { threw: e.message }; }
  assert('F6: without Blob (an old phone) the cap does not fail — the message still goes', Array.isArray(b) && b.length > 0 && b[b.length - 1].content === msgs[29].content && b.every(m => m.content.length <= 4000));
  assert('F6: … and it is the same cap as with Blob (the bytes counted by hand are the bytes Blob counts)', Array.isArray(a) && Array.isArray(b) && JSON.stringify(a) === JSON.stringify(b));
  assert('F6: callAura still calls capMessageHistory, the same line as before', raw.includes('messages: capMessageHistory(messages, systemPrompt).map(m => ({ role: m.role, content: m.content })),')); }

Promise.all(asyncChecks).then(() => {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
});
