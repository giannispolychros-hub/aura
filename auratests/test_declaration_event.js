// AURA — PROVENANCE: ΒΡΗΚΕΣ sourcing + DECLARATION_EVENT
//
// TWO FIXES, ONE COMMIT, because the first one invalidates the prompt cache and a second
// invalidation for the same area would be paid twice for nothing.
//
// ── 1. ΒΡΗΚΕΣ ──────────────────────────────────────────────────────────────
// The three beats had two sourcing requirements and a hole in the middle:
//   ΗΡΘΕΣ ΜΕ    "their own words/framing"
//   ΒΡΗΚΕΣ      — nothing, anywhere in the prompt
//   ΦΕΥΓΕΙΣ ΜΕ  the strictest of the three, added after a real session ended
//               "ΦΕΥΓΕΙΣ ΜΕ: το Φίατ" for a man who never said he would buy the Fiat
// ΦΕΥΓΕΙΣ ΜΕ's own text records WHY it got that rule: it was the beat with no sourcing
// requirement, and that is exactly where the substitution entered. ΒΡΗΚΕΣ is now the beat in
// that position, and it is the one that names what the person "actually found underneath" —
// the single most interpretive line the product ever writes about someone.
//
// ── 2. DECLARATION_EVENT ───────────────────────────────────────────────────
// SHIFT was deferred because its first declaration has no provenance: nothing proves that a
// given reply answers a given question. The obvious patch is one more hidden tag. ADR says do
// not: every future signal needing "this reply answers that question" would demand its own tag
// and we would end with N ad-hoc mechanisms for one problem.
//
// The generalized form: a question is ISSUED with an identity, and the reply that follows is
// LINKED to that identity — or, crucially, is not linked at all. The ledger's value is entirely
// in what it REFUSES to link: a reply with no issued question, a reply that predates the
// question, a second reply to an already-answered one. Those refusals are Zero Inference in
// code, and they are what the assertions below spend most of their time on.
//
// SCOPE, stated so it is not mistaken for more: EARLY_WORD is wired as the first consumer and
// nothing is built on top. No SHIFT, no new claim about anyone. Session-scoped, never persisted,
// so no new stored category and the consent disclosure is untouched.

const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();

const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extract(name) {
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  const e = CODE.indexOf('\n}', s);
  return e < 0 ? null : CODE.slice(s, e + 2);
}

// ══ PART 1 — ΒΡΗΚΕΣ carries a sourcing requirement ════════════════════════
const BEAT = (() => {
  const i = PROMPT.indexOf('\nΒΡΗΚΕΣ: [');
  if (i < 0) return '';
  return PROMPT.slice(i + 1, PROMPT.indexOf('\nΦΕΥΓΕΙΣ ΜΕ:', i));
})();
assert('The ΒΡΗΚΕΣ beat line was located in the prompt', BEAT.length > 20);
assert('ΒΡΗΚΕΣ no longer ends after four words — it carries a real requirement now',
  BEAT.length > 300);
assert('ΒΡΗΚΕΣ requires the words to be traceable to the person',
  /δικ[άή]|own words|their words|τα λόγια τους|είπε|said/i.test(BEAT));
assert('ΒΡΗΚΕΣ states what to do when nothing was actually found — no manufactured discovery',
  /δεν|not|never/i.test(BEAT));
// The line above the beats already forbids inventing a shift. The beat must not merely repeat
// it: the hole being closed is sourcing of the WORDS, not existence of the shift.
assert('ΒΡΗΚΕΣ forbids AURA naming the discovery in its own framing',
  /(δική μου|AURA|my own|interpretation|ερμηνεία|διάγνωση|diagnos)/i.test(BEAT));
assert('The three beats now ALL carry sourcing — no beat is the unsourced one any more',
  /own words\/framing/.test(PROMPT.slice(PROMPT.indexOf('ΗΡΘΕΣ ΜΕ: ['), PROMPT.indexOf('\nΒΡΗΚΕΣ:'))) &&
  BEAT.length > 300 &&
  /strictest sourcing/.test(PROMPT.slice(PROMPT.indexOf('ΦΕΥΓΕΙΣ ΜΕ: ['), PROMPT.indexOf('ΦΕΥΓΕΙΣ ΜΕ: [') + 1200)));
// PINNED, two-directionally. The keyword checks above are shallow by nature: a mutation that
// swapped the whole requirement for a style rule ("keep it short and clear") left three of the
// four green, because the surrounding sentences still contained the keywords. A prompt rule that
// quietly disappears is precisely the failure this file exists for, so the operative clause is
// pinned verbatim — and the sentence it replaced must NOT come back.
const BRIKES_PIN = 'the finding must be one the user themselves put into words at some point in the session, in their own vocabulary';
assert('ΒΡΗΚΕΣ: the operative sourcing clause is present, verbatim',
  BEAT.indexOf(BRIKES_PIN) !== -1);
assert('ΒΡΗΚΕΣ: the old unsourced one-liner is gone',
  PROMPT.indexOf('ΒΡΗΚΕΣ: [what they actually found underneath it]') === -1);
assert('ΒΡΗΚΕΣ: it says what to do when nothing was articulated, verbatim',
  BEAT.indexOf('do not manufacture one to fill the line') !== -1);
assert('The beat prefixes are untouched — parseThreeBeatShift still matches',
  /\nΗΡΘΕΣ ΜΕ: \[/.test(PROMPT) && /\nΒΡΗΚΕΣ: \[/.test(PROMPT) && /\nΦΕΥΓΕΙΣ ΜΕ: \[/.test(PROMPT));

// ══ PART 2 — DECLARATION_EVENT ════════════════════════════════════════════
const SRC_ISSUE = extract('issueDeclaration');
const SRC_LINK  = extract('linkDeclarationResponse');
const SRC_GET   = extract('getDeclaration');
assert('issueDeclaration is defined', !!SRC_ISSUE);
assert('linkDeclarationResponse is defined', !!SRC_LINK);
assert('getDeclaration is defined', !!SRC_GET);

let issueDeclaration = null, linkDeclarationResponse = null, getDeclaration = null;
try { if (SRC_ISSUE) issueDeclaration = eval('(' + SRC_ISSUE + ')'); } catch (e) { console.log('FAIL — issueDeclaration eval: ' + e.message); failed++; }
try { if (SRC_LINK)  linkDeclarationResponse = eval('(' + SRC_LINK + ')'); } catch (e) { console.log('FAIL — linkDeclarationResponse eval: ' + e.message); failed++; }
try { if (SRC_GET)   getDeclaration = eval('(' + SRC_GET + ')'); } catch (e) { console.log('FAIL — getDeclaration eval: ' + e.message); failed++; }
assert('All three evaluate standalone (self-contained, per the extraction convention)',
  [issueDeclaration, linkDeclarationResponse, getDeclaration].every(f => typeof f === 'function'));

if (typeof issueDeclaration === 'function' && typeof linkDeclarationResponse === 'function'
    && typeof getDeclaration === 'function') {
  const WORD = 'Ο χρόνος μου δεν είναι δικός μου.';

  // ── The happy path, which is the least interesting part ──────────────────
  let L = issueDeclaration([], 'early_word', 4);
  assert('An issued question is pending, not answered', getDeclaration(L, 'early_word') === null);
  L = linkDeclarationResponse(L, 'early_word', WORD, 5);
  const d = getDeclaration(L, 'early_word');
  assert('A reply AFTER the question links to it', !!d && d.text === WORD);
  assert('The link records both turns', !!d && d.askedAt === 4 && d.answeredAt === 5);
  assert('The id is carried on the record', !!d && d.id === 'early_word');

  // ── What it REFUSES. This is the whole point. ────────────────────────────
  const L0 = linkDeclarationResponse([], 'early_word', WORD, 5);
  assert('REFUSES: a reply with NO issued question is not linked — nothing to answer',
    getDeclaration(L0, 'early_word') === null);
  assert('REFUSES: …and nothing is fabricated in the ledger either', L0.length === 0);

  const L1 = linkDeclarationResponse(issueDeclaration([], 'early_word', 7), 'early_word', WORD, 7);
  assert('REFUSES: a reply on the SAME turn as the question is not an answer to it',
    getDeclaration(L1, 'early_word') === null);
  const L2 = linkDeclarationResponse(issueDeclaration([], 'early_word', 7), 'early_word', WORD, 3);
  assert('REFUSES: a reply that PREDATES the question is not an answer to it',
    getDeclaration(L2, 'early_word') === null);

  let L3 = issueDeclaration([], 'early_word', 1);
  L3 = linkDeclarationResponse(L3, 'early_word', 'πρώτη', 2);
  L3 = linkDeclarationResponse(L3, 'early_word', 'δεύτερη', 3);
  assert('REFUSES: a SECOND reply does not overwrite an answered declaration — one reply per asking',
    getDeclaration(L3, 'early_word').text === 'πρώτη');

  let L4 = issueDeclaration([], 'early_word', 1);
  L4 = issueDeclaration(L4, 'early_word', 6);
  L4 = linkDeclarationResponse(L4, 'early_word', 'στη δεύτερη ερώτηση', 7);
  const d4 = getDeclaration(L4, 'early_word');
  assert('RE-ASKING: the reply links to the LATEST asking, not the stale one',
    !!d4 && d4.askedAt === 6 && d4.text === 'στη δεύτερη ερώτηση');
  // The backwards scan alone already picks the latest asking, so the test above passes with or
  // without the supersede rule — measured, by mutation. What the rule actually prevents is this:
  // a LATER message being collected by the STALE asking that no one ever answered.
  const L4b = linkDeclarationResponse(L4, 'early_word', 'άσχετο επόμενο μήνυμα', 9);
  assert('RE-ASKING: a stale unanswered asking cannot collect a later message',
    getDeclaration(L4b, 'early_word').text === 'στη δεύτερη ερώτηση' &&
    !L4b.some(r => r && r.text === 'άσχετο επόμενο μήνυμα'));

  let L5 = issueDeclaration([], 'early_word', 1);
  L5 = linkDeclarationResponse(L5, 'other_question', WORD, 2);
  assert('REFUSES: a reply does not link across identities',
    getDeclaration(L5, 'early_word') === null && getDeclaration(L5, 'other_question') === null);

  // ── Hygiene ──────────────────────────────────────────────────────────────
  assert('An invalid id is rejected at issue time',
    issueDeclaration([], '', 1).length === 0 &&
    issueDeclaration([], 'Κάτι Ελληνικά', 1).length === 0 &&
    issueDeclaration([], null, 1).length === 0);
  assert('A non-integer or negative turn is rejected',
    issueDeclaration([], 'early_word', 1.5).length === 0 &&
    issueDeclaration([], 'early_word', -1).length === 0 &&
    issueDeclaration([], 'early_word', 'τρία').length === 0);
  assert('An empty reply is not a declaration',
    getDeclaration(linkDeclarationResponse(issueDeclaration([], 'early_word', 1), 'early_word', '   ', 2), 'early_word') === null);
  const base = issueDeclaration([], 'early_word', 1);
  linkDeclarationResponse(base, 'early_word', WORD, 2);
  assert('The ledger is never mutated in place — each step returns a new one',
    getDeclaration(base, 'early_word') === null);
  let big = [];
  // Distinct ids on purpose: repeating one id exercises the supersede rule, not the cap.
  for (let i = 0; i < 200; i++) big = issueDeclaration(big, 'q' + i, i);
  assert('The ledger is bounded — a long session cannot grow it without limit', big.length <= 64);
  assert('…and the newest entries are the ones kept',
    big.some(r => r && r.askedAt === 199));
  let threw = false;
  try {
    issueDeclaration(null, 'early_word', 1);
    linkDeclarationResponse(null, 'early_word', WORD, 2);
    getDeclaration(null, 'early_word');
    getDeclaration(undefined, undefined);
  } catch (e) { threw = true; }
  assert('None of the three throws on junk input', !threw);
}

// ── The first consumer: EARLY_WORD, wired without changing what it does ────
assert('A session-scoped ledger ref exists', /declarationLedger\s*=\s*useRef/.test(CODE));
assert('EARLY_WORD ISSUES a declaration where its tag is detected',
  /earlyWordTagMatch[\s\S]{0,400}issueDeclaration\(/.test(CODE));
assert('The issued id is the EARLY_WORD question, not an anonymous one',
  /issueDeclaration\([^)]*["']early_word["']/.test(CODE));
assert('The reply LINKS where the existing capture already happens',
  /awaitingEarlyWord\.current[\s\S]{0,600}linkDeclarationResponse\(/.test(CODE));
assert('The existing capture path still works — the ledger is additive, not a rewrite',
  /earlyCapturedWord\.current\s*=/.test(CODE));
assert('The ledger is cleared by resetSession',
  /const resetSession[\s\S]{0,3500}?declarationLedger\.current\s*=\s*\[\]/.test(CODE));

// ── SCOPE: nothing is built on top of it yet, and nothing is persisted ─────
assert('NOT PERSISTED: the ledger is never written to storage',
  !/saveMemory\([^)]*declarationLedger|declarationLedger[\s\S]{0,120}localStorage/.test(CODE));
assert('NOT PERSISTED: no declaration field was added to the memory schema',
  !/declarations?\s*:\s*\[\]/.test(CODE));
assert('SCOPE: SHIFT is still not built on it — no buildShiftSignal appeared',
  !/function buildShiftSignal/.test(CODE));
assert('SCOPE: the ledger is not wired into the prompt',
  !/declarationLedger|issueDeclaration|getDeclaration/.test(PROMPT));
for (const fn of [SRC_ISSUE, SRC_LINK, SRC_GET]) {
  if (!fn) continue;
  assert('The ledger functions touch no storage and no API',
    !/localStorage|sessionStorage|saveMemory|fetch\s*\(|callAura/.test(fn));
}

// ── THE LEDGER GAINS ITS SECOND THROUGH EIGHTH CONSUMERS ───────────────────
//
// WHY NOW. The ADR built this deliberately generalised — "κάθε μελλοντικό signal που χρειάζεται να
// αποδείξει «αυτή η απάντηση απαντά σε εκείνη την ερώτηση» θα ζητήσει το δικό του tag, και θα
// καταλήξουμε με N ad-hoc μηχανισμούς για ένα κοινό πρόβλημα" — and it named two first consumers,
// EARLY_WORD and [[EXIT]]. Only EARLY_WORD arrived. [[EXIT]] is documented-unreliable and was
// struck, so the ledger sat at one id for its whole life, and getDeclaration was never called in
// any of its 22 revisions.
//
// Measured need: seven mechanisms never fired in nine real sessions, and for two of them the code
// named them as due on 144 turns with nothing happening. Whether a mechanism was ASKED and whether
// it was ANSWERED is exactly what this ledger holds, and it is four of the seven numbers that
// session_completed could not report.
//
// DERIVED, NOT INTERLEAVED. The declarations are issued from one contiguous block that reads the
// latches already set above it, rather than from twelve insertions threaded through shared
// branching logic. Idempotent by construction: a latch is one-way, so re-running the block cannot
// double-issue. Nothing reads the ledger to decide anything - it is telemetry only.
const DECL_IDS = ['early_clarity','outcome_scale','core_readiness','shift_check','friend_perspective','stakes','anchors'];
for (const id of DECL_IDS) {
  assert('declaration id issued for: ' + id, new RegExp("'" + id + "'").test(CODE) || new RegExp('"' + id + '"').test(CODE));
}
assert('all ids satisfy the ledger\'s own identity contract',
  DECL_IDS.every(id => /^[a-z][a-z0-9_]{0,31}$/.test(id)));
// Anchored on the block's own `try {`, not on a character budget from its heading — the heading
// carries a long rationale and a fixed window would expire the moment that prose grew, which is the
// fixed-width-window failure this repo has now seen five times.
const DECL_BLOCK = (() => {
  const h = raw.indexOf('DECLARATION LEDGER');
  if (h < 0) return '';
  const t = raw.indexOf('try {', h);
  const c = raw.indexOf('catch (e) { /* observation must never affect the session */ }', t);
  return (t > h && c > t) ? raw.slice(t + 'try {'.length, c) : '';
})();
assert('the issuing block was located and is non-empty, so the checks below are real',
  DECL_BLOCK.length > 200 && /issueDeclaration/.test(DECL_BLOCK));
assert('the issuing block is wrapped so it can never break a turn — its body holds no nested try',
  !DECL_BLOCK.includes('try {'));
assert('getDeclaration finally has a consumer — the ledger is read, not only written',
  (CODE.match(/getDeclaration\s*\(/g) || []).length >= 2);
// The ANSWER side, not only the ask. A mutation deleting the link call left the suite green: it
// asserted the ids and the issuing and never that an answer can be recorded at all.
assert('the answer side is wired — a confirmation links back to its declaration',
  /linkDeclarationResponse\(declarationLedger\.current/.test(DECL_BLOCK));
assert('and it links the three mechanisms whose confirmation the app already detects',
  /coreReadinessConfirmed\.current/.test(DECL_BLOCK)
  && /shiftCheckConfirmed\.current/.test(DECL_BLOCK)
  && /friendPerspectiveConfirmed\.current/.test(DECL_BLOCK));
// The idempotence guard. Without it issueDeclaration re-issues every turn and askedAt drifts to the
// latest turn, at which point the answer can never postdate the question and every link is refused
// — a silent failure, since the refusals are supposed to mean something.
assert('issuing is guarded, so a one-way latch cannot re-issue on every turn',
  /if \(_asked && !getDeclaration\(/.test(DECL_BLOCK));

assert('a pure tally exists, in the tallyRoadTrace shape',
  /function tallyDeclarations\s*\(/.test(CODE));
const TALLY = (() => { const a = CODE.indexOf('function tallyDeclarations('); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n}', a) + 2); })();
// BEHAVIOURAL, not a source scan: a mutation made the tally return the ledger's text and every
// source-level purity check still passed. Called with a ledger that holds real text, it must return
// numbers and nothing else.
eval(TALLY);
const _probe = tallyDeclarations([
  { id: 'stakes', askedAt: 1, answeredAt: null, text: '' },
  { id: 'shift_check', askedAt: 2, answeredAt: 4, text: 'ΜΥΣΤΙΚΟ ΚΕΙΜΕΝΟ ΧΡΗΣΤΗ' },
]);
assert('the tally counts correctly', _probe.issued === 2 && _probe.answered === 1);
assert('the tally returns ONLY the two counts — no text can ride out on it',
  Object.keys(_probe).length === 2
  && Object.values(_probe).every(v => typeof v === 'number')
  && !JSON.stringify(_probe).includes('ΜΥΣΤΙΚΟ'));
assert('degenerate input is refused quietly',
  tallyDeclarations(null).issued === 0 && tallyDeclarations([null, 7, {}]).issued === 0);
assert('the tally is pure — no refs, no state, no storage',
  !!TALLY && !/\.current|set[A-Z]|localStorage|saveMemory/.test(TALLY));
const scAt = raw.indexOf('recordTelemetry("session_completed"');
const sc = scAt === -1 ? '' : raw.slice(scAt, raw.indexOf('});', scAt));
assert('session_completed was located, so the checks below are not vacuous', sc.length > 200 && /turns:/.test(sc));
assert('counts reach telemetry: how many were issued and how many answered',
  /declIssued:/.test(sc) && /declAnswered:/.test(sc));
assert('and they are counts only — no question text, no answer text ever travels',
  !/decl(Issued|Answered):[^\n]*(content|text|reply|message)/i.test(sc));
// The intent is that no PRODUCT decision branches on a declaration. Stated as containment rather
// than as a ban on `if`: the block's own idempotence guard must read the ledger, or it would
// double-issue. So the rule is that getDeclaration appears nowhere outside its definition and this
// one block — which is stricter than the crude version, and does not forbid the bookkeeping.
const GET_OUTSIDE = CODE.split(/\n/).filter(l => /getDeclaration\s*\(/.test(l))
  .filter(l => !/function getDeclaration\(/.test(l) && !DECL_BLOCK.includes(l.trim()));
assert('the ledger is read only inside its own block — no product decision branches on it'
  + (GET_OUTSIDE.length ? ' (found: ' + GET_OUTSIDE.length + ')' : ''),
  GET_OUTSIDE.length === 0);


console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
