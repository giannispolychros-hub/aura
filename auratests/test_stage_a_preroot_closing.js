// AURA — STAGE A, John's decision of 10/10/2026 (ADR «10 Οκτωβρίου», 1), an exception to the freeze so that the 20 sessions
// measure something: CLOSING BEFORE THE ROOT, switch open only.
//   Before the root is confirmed, the old closing (the «πριν κλείσουμε» card, the warning card, ΗΡΘΕΣ/ΒΡΗΚΕΣ/ΦΕΥΓΕΙΣ,
//   terminate) opens ONLY on the user's second explicit exit (T2 after «Δεν το βρήκα ακόμα»). No other trigger — T1 (a
//   short agreement), T3 (the third question answered), T4 (the model's own closing move), T5 ([[EXIT:yes]]), T6 (the
//   warning / terminate), T7 (the «Δες την πορεία» button) — opens a closing: the conversation goes on.
//   The first T2 → the root question, as today. After the root: as today. Safety: as today. Switch closed: no change.
// One pure gate (stageAPreRootDecision) applied where the decision is made, where GRACEFUL EXIT is decided, and where the
// empty-reply rule decides on a farewell; the «Δες την πορεία» button is hidden before the root.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
const sha = x => crypto.createHash('sha256').update(x || '', 'utf8').digest('hex').slice(0, 16);
const NAMES = ['decideTermination', 'stageAPreRootDecision', 'stageAKeepsGracefulExit', 'closingCardOpensNow', 'isExplicitClosure', 'declaresClosing',
  'matchesClosingWord', 'isModelPreClosing', 'isBareEmojiOrAcknowledgment', 'detectSafetySignal'];
let F = {};
try {
  const need = new Set(NAMES);
  for (let pass = 0; pass < 4; pass++) {
    const src = [...need].map(n => fullFnSrc(n) || '').join('\n');
    (src.match(/\b([a-zA-Z_]\w*)\(/g) || []).map(x => x.slice(0, -1)).forEach(n => { if (!need.has(n) && CODE.includes('\nfunction ' + n + '(')) need.add(n); });
  }
  F = new Function([...need].map(n => fullFnSrc(n) || `function ${n}(){return undefined}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));

// Five user messages, every reply a question — then the trigger.
const H5 = [];
['Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου', 'Νιώθω ότι δεν πέτυχα όσα άξιζα', 'Περισσότερα χρήματα', 'Και λίγη αναγνώριση', 'Η σταθερότητα με κρατάει']
  .forEach((u, k) => { H5.push({ role: 'user', content: u }); H5.push({ role: 'assistant', content: ['Τι εννοείς;', 'Τι σημαίνει αυτό για σένα;', 'Και σήμερα;', 'Από ποιον;', 'Τι σε κρατάει πιο πολύ;'][k] }); });
const opts = (o) => Object.assign({ safetyMode: false, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0, modelJudgesEnd: false,
  concreteStepStated: false, outcomeScaleAsked: false, outcomeScaleBlockUsed: false, duringOnboarding: false, duringDeclineCooldown: false }, o || {});
const D = (hist, u, text, o) => T('decideTermination', [...hist, { role: 'user', content: u }], text, opts(o));
const P = (decision, u, o) => T('stageAPreRootDecision', decision, Object.assign({ active: true, rootConfirmed: false, lastUserText: u }, o || {}));
const STATEMENT = 'Η σταθερότητα μετράει πολύ για σένα.';

// ── The triggers, through the real decideTermination, then the gate ──────────
const CASES = [
  ['T1 — a bare «Ναι» after 5 user messages', H5, 'Ναι', STATEMENT, {}, 'confirm'],
  ['T1 — «Οκ» after 5 user messages', H5, 'Οκ', STATEMENT, {}, 'confirm'],
  ['T1 — the same message twice in a row (repeat)', [...H5, { role: 'user', content: 'Δεν ξέρω τι να πω' }, { role: 'assistant', content: 'Τι άλλο;' }], 'Δεν ξέρω τι να πω', STATEMENT, {}, 'confirm'],
  ['T3 — the third question (friend + orientation) answered', [...H5.slice(0, -1), { role: 'assistant', content: 'Αν το έλεγε ένας φίλος σου, τι θα του έλεγες; Χρειάζεσαι κάτι παραπάνω από αυτό;' }],
    'Θα του έλεγα να το ψάξει λίγο ακόμα', STATEMENT, {}, 'confirm'],
  ['T4 — the model\'s own closing move («Εντάξει.»)', H5, 'Μάλλον φοβάμαι την αλλαγή', 'Εντάξει.', {}, 'confirm'],
  ['T5 — [[EXIT:yes]] (modelJudgesEnd)', H5, 'Μάλλον φοβάμαι την αλλαγή', STATEMENT, { modelJudgesEnd: true }, 'confirm'],
  ['T6 — the model says the decision is the user\'s → warning', H5, 'Μάλλον φοβάμαι την αλλαγή', 'Η απόφαση είναι δική σου.', {}, 'warn'],
  ['T6 — after the warning → terminate', H5, 'Μάλλον φοβάμαι την αλλαγή', 'Η απόφαση είναι δική σου.', { warningIssued: true }, 'terminate'],
  ['outcome-scale hold (a stated step + T1)', H5, 'Ναι', STATEMENT, { concreteStepStated: true }, 'await_outcome_scale'],
];
for (const [name, hist, u, text, o, expect] of CASES) {
  const d = D(hist, u, text, o);
  assert(`${name}: today's decision is «${expect}» (the fixture really fires)`, d === expect);
  assert(`${name}: switch open, before the root → «none» — no card, no warning, the conversation goes on`, P(d, u) === 'none');
  assert(`${name}: switch CLOSED → unchanged («${expect}»)`, P(d, u, { active: false }) === expect);
  assert(`${name}: after the root is confirmed → unchanged`, P(d, u, { rootConfirmed: true }) === expect);
}
{
  const d = D(H5, 'Ευχαριστώ, κλείνουμε εδώ.', STATEMENT, {});
  assert('T2 — an explicit exit keeps its decision (the first meets the root question at the door, the second the old closing)', d === 'confirm' && P(d, 'Ευχαριστώ, κλείνουμε εδώ.') === 'confirm');
  assert('T2 — «Ευχαριστώ.» alone is T2 too', P('confirm', 'Ευχαριστώ.') === 'confirm');
  // both halves of userDeclaredExit count: «Τέλος.» is caught only by isExplicitClosure, «Ok ευχαριστώ» only by declaresClosing
  assert('T2 — either detector is enough: «Τέλος.» (isExplicitClosure only) and «Ok ευχαριστώ» (declaresClosing only) keep the closing',
    T('isExplicitClosure', 'Τέλος.') === true && T('declaresClosing', 'Τέλος.') === false && P('confirm', 'Τέλος.') === 'confirm' &&
    T('isExplicitClosure', 'Ok ευχαριστώ') === false && T('declaresClosing', 'Ok ευχαριστώ') === true && P('confirm', 'Ok ευχαριστώ') === 'confirm');
  const dis = 'Ευχαριστώ, κλείνουμε. Το πένθος για τη μητέρα μου με έχει παραλύσει.';
  assert('SAFETY as today — a closing message that carries DISTRESS keeps its old closing (decision of 8/10 (β), 4)',
    T('detectSafetySignal', dis) === 'DISTRESS' && P(D(H5, dis, STATEMENT, {}), dis) === 'confirm');
  assert('SAFETY as today — safety mode and a supportive turn are already «none» (nothing for the gate to do)',
    D(H5, 'Ναι', STATEMENT, { safetyMode: true }) === 'none' && P('none', 'Ναι') === 'none');
  assert('«none» stays «none»; anything unknown passes through', P('none', 'Ναι') === 'none' && P(undefined, 'Ναι') === undefined);
  assert('No switch information → unchanged (never closes a closing by accident)', T('stageAPreRootDecision', 'confirm', {}) === 'confirm' && T('stageAPreRootDecision', 'confirm') === 'confirm');
}

// ── GRACEFUL EXIT follows the same gate (a request never says «close now» when no closing opens) ─
{
  const open = o => Object.assign({ active: true, rootConfirmed: false, safetyMode: false, supportive: false, decision: 'none', armed: false, rootPhase: null, latchFlips: false }, o || {});
  assert('GRACEFUL: «Ναι» after 5 messages → the gated decision is none → GRACEFUL EXIT NOT sent (before: sent)',
    P(D(H5, 'Ναι', '', {}), 'Ναι') === 'none' && T('stageAKeepsGracefulExit', open({ decision: P(D(H5, 'Ναι', '', {}), 'Ναι') })) === false &&
    T('stageAKeepsGracefulExit', open({ decision: D(H5, 'Ναι', '', {}) })) === true);
  assert('GRACEFUL: a second exit → sent, as today', T('stageAKeepsGracefulExit', open({ decision: P(D(H5, 'Ευχαριστώ, κλείνουμε εδώ.', '', {}), 'Ευχαριστώ, κλείνουμε εδώ.') })) === true);
}

// ── Wiring ───────────────────────────────────────────────────────────────────
{
  assert('WIRING: the decision after a reply goes through the gate — same call, same options, this message as lastUserText',
    /const decision = stageAPreRootDecision\(currentMode === "SUPPORTIVE" \? "none" : decideTermination\(msgs, text, \{\s*safetyMode,\s*currentMode,/.test(GEN) &&
    /\}\), \{ active: stageAActive\.current, rootConfirmed: stageARef\.current\.stats\.rootConfirmed === 1, lastUserText: _saLastText \}\);/.test(GEN) &&
    /const _saLastText = msgs\.length && msgs\[msgs\.length - 1\]\.role === "user" \? String\(msgs\[msgs\.length - 1\]\.content \|\| ""\) : "";/.test(GEN));
  assert('WIRING: GRACEFUL EXIT uses the same gate on the user-side decision',
    /decision: stageAPreRootDecision\(decideTermination\(msgs, "", \{/.test(GEN) && /\}\), \{ active: true, rootConfirmed: stageARef\.current\.stats\.rootConfirmed === 1, lastUserText \}\),/.test(GEN));
  const at = GEN.indexOf('if (isBareEmojiOrAcknowledgment(displayText)) {');
  const blk = at >= 0 ? GEN.slice(at, GEN.indexOf('// EXPLICIT STYLE PREFERENCE', at)) : '';
  assert('WIRING: the empty-reply rule sees the same gated decision (a card that does not open does not count)',
    /decision: stageAPreRootDecision\(currentMode === "SUPPORTIVE" \? "none" : decideTermination\(msgs, text, \{/.test(blk) &&
    /\}\), \{ active: stageAActive\.current, rootConfirmed: stageARef\.current\.stats\.rootConfirmed === 1, lastUserText: lastUserMsg \}\),/.test(blk));
  assert('WIRING: before the root (switch open) a closing word with no closing opening gets NO farewell — the existing «Τι σκέφτεσαι τώρα;» (no new text)',
    /const _saNoGoodbye = stageAActive\.current && stageARef\.current\.stats\.rootConfirmed !== 1 && userWasClosing && !_closingCardOpens;/.test(blk) &&
    /if \(!_closingCardOpens\) displayText = \(displayText\.trim\(\) \? displayText\.trim\(\) \+ " " : ""\) \+ \(_saNoGoodbye \? "Τι σκέφτεσαι τώρα;" : addition\);/.test(blk) &&
    blk.includes('const addition = userWasClosing ? "Καλή συνέχεια." : "Τι σκέφτεσαι τώρα;";'));
  assert('WIRING: the card, the warning and the outcome-scale hold read `decision` exactly as before (so the gate covers all three)',
    /if \(decision === "confirm" \|\| decision === "terminate"\) \{/.test(GEN) && /if \(decision === "warn"\) \{\s*setWarningPending\(true\);/.test(GEN) &&
    /if \(decision === "await_outcome_scale"\) \{/.test(GEN));
  const mb = (CODE.match(/const MessageBubble = memo\(function MessageBubble\(\{[^}]*\}\) \{/) || [''])[0];
  assert('T7 — «Δες την πορεία»: the bubble takes a flag and does not draw the button when it is set',
    /hideReflection/.test(mb) && /\{isPromiseMsg && !hideReflection && \(/.test(CODE));
  assert('T7 — the flag is set with the switch open before the root, and the handler refuses too (belt and braces)',
    /hideReflection=\{stageAActive\.current && stageAView\.stats\.rootConfirmed !== 1\}/.test(CODE) &&
    /onContinueToReflection=\{\(\) => \{ if \(sessionEnded \|\| loading[^\n]*\|\| \(stageAActive\.current && stageARef\.current\.stats\.rootConfirmed !== 1\)\) return; handleClosureConfirm\(true\); \}\}/.test(CODE));
  assert('UNCHANGED: decideTermination and the leaving-door gate byte for byte (the T1–T8 logic itself is untouched)',
    sha(fullFnSrc('decideTermination')) === 'a8a8f403a2d5adb6' && sha(fullFnSrc('stageALeavingDoorOpens')) === 'c14e923cd0166b66');
  assert('UNCHANGED: the first T2 still opens the root question before the model (the door is not touched)',
    CODE.includes('// STAGE A — «Πριν φύγεις:» BEFORE the model') && /stageADispatch\(\{ type: "leaving" \}\);/.test(CODE));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
