// AURA — «συνομιλία v1» (John, 15/11/2026): four separate commits on the branch conversation-v1, from release-candidate e4b2ae6. Code only:
// the fixed prompt (7e52268becda7360), api/aura.js and the screen filter are not touched, and the safety path sends what it sent.
//  (1) commit 1 — the stagnation note no longer sends the model to ROAD DISCOVERY in Stage A before the root (code 8397 ↔ prompt STAGE A (1)).
//  (2) commit 2 — the two gates (Decision Space Anchors, Stakes Question) are not asked for in Stage A before the root.
//  (3) commit 3 — the ROUND TYPE note: after 5 replies in a row that end in a question, or two short «δεν ξέρω» in a row, this reply must not end with a question.
//  (4) commit 4 — the NEW MATERIAL note leaves room for ONE brief recognition (never the same recognition phrase twice); off the safety path only.
// The EXACT text each request carries is checked in the browser (scripts/e2e_stage_a.cjs, section NQ, «CV1»); here, the pure part and the wiring.

// UPDATED (19/11/2026, «συνομιλία v1», Package 1, John): the prompt changed on purpose in exactly three lines (912, 918, 927; auratests/package1_undo.json) — every prompt fingerprint below moved from b5f303cc9405aa21 to 7e52268becda7360 (313386 characters, was 311822), and api/aura.js carries the new core fingerprint (sha256 675564a7985438c8…, was e791b194…). Nothing else of the prompt moved: auratests/test_package1_prompt_1911.js (7.2)–(7.3).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '', 'utf8').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const load = n => { try { return new Function(fnSrc(n) + '\nreturn ' + n + ';')(); } catch (e) { console.log('LOAD ERROR ' + n + ' — ' + e.message); return null; } };
const OPENINGS = (() => { const i = api.indexOf('openings: ['); return JSON.parse('[' + api.slice(i + 11, api.indexOf('],', i)).trim().replace(/,\s*$/, '') + ']'); })();
const guardAccepts = block => OPENINGS.some(o => block.replace(/^\n/, '').startsWith(o));

// ── (1) the stagnation note ─────────────────────────────────────────────────────────────────────────────────────────────────────
// The note (older than Stage A) tells the model, among other things, that "THIS IS THE MOMENT FOR ROAD DISCOVERY — THE ONE NAMED EXCEPTION's
// PATH TWO" and that "showing them the actual shape of their decision space is the work". Stage A suspends exactly that (prompt STAGE A (1):
// "SUSPENDED: … ROAD DISCOVERY and the road-map format"). With the switch open, before a confirmed root, off the safety path, the two
// sentences are not in the note and one sentence says the roads come after the root. Everywhere else the text is the one that was written
// inline before: the old flow, Stage A after the root, the crisis turn and every turn after the crisis line.
const ORIGINAL_SHA = '29d59864cb6a84554649986dddfd33c0ef647236ae330410ae9037e50c4b9974'; // the inline text of e4b2ae6, as the model received it
const stag = load('describeUserStagnationCtx');
assert('(1.1) the note text is one pure function, describeUserStagnationCtx(stageAPreRoot)', typeof stag === 'function');
const safe = (...a) => { try { return stag(...a); } catch (e) { return 'THREW ' + e.message; } };
const ORIG = typeof stag === 'function' ? safe(false) : '';
const STAGEA = typeof stag === 'function' ? safe(true) : '';
assert('(1.2) outside Stage A before the root the text is exactly the inline text of e4b2ae6 (sha256 29d59864…), for false, nothing, null and a string «true»',
  typeof stag === 'function' && [ORIG, safe(), safe(null), safe('true')].every(t => sha(t) === ORIGINAL_SHA));
assert('(1.3) … and that text still points to ROAD DISCOVERY — the old flow and the safety path are not changed',
  ORIG.includes('THIS IS THE MOMENT FOR ROAD DISCOVERY — THE ONE NAMED EXCEPTION\'s PATH TWO') && ORIG.includes('Showing them the actual shape of their decision space is the work.'));
assert('(1.4) in Stage A before the root the note says nothing of ROAD DISCOVERY, PATH TWO, distinct directions, the decision space or QUALITY BAILOUT',
  STAGEA.length > 0 && !/ROAD DISCOVERY|PATH TWO|DISTINCT DIRECTIONS|distinct directions|decision space|QUALITY BAILOUT|THE ONE NAMED EXCEPTION/.test(STAGEA));
assert('(1.5) … and keeps what it observes and its two moves: the last 2 replies, (a) ask why it is still open, (b) question the frame only where their own words say so',
  STAGEA.includes('the user\'s own last 2 replies introduced almost no new material AND became markedly shorter') && STAGEA.includes('(a) ASK WHY IT IS STILL OPEN') &&
  STAGEA.includes('(b) QUESTION THE FRAME') && STAGEA.includes('HARD CONDITION on (b)') && STAGEA.includes('Offered as a question, never as an interpretation stated.'));
const S2 = 'AND IF GENUINELY DISTINCT DIRECTIONS ARE ALREADY IMPLIED BY WHAT THEY HAVE SAID, THIS IS THE MOMENT FOR ROAD DISCOVERY — THE ONE NAMED EXCEPTION\'s PATH TWO, with all its output tests (distinctness, consequence, level, completeness) and their QUALITY BAILOUT clauses intact. ';
const S4 = 'Showing them the actual shape of their decision space is the work. If the material genuinely does not support distinct directions, say that plainly instead — that is also a real finding, never a reason to invent one. ';
const ADDED = 'Here, roads, a map, options and a step come only after the root: do not move toward them. ';
const S3 = 'A user who has stopped producing new material is not asking for another question; they have given what they have. ';
assert('(1.6) the Stage A text is the old text with exactly two sentences taken out and one added — nothing else moved',
  ORIG.split(S2).length === 2 && ORIG.split(S4).length === 2 && ORIG.indexOf(S2 + S3 + S4) > 0 &&
  STAGEA === ORIG.replace(S2 + S3 + S4, S3 + ADDED));
assert('(1.7) it is one block, begins and ends as the model expects and the api guard accepts it (the opening is one the guard already lists: no change to api/aura.js)',
  STAGEA.startsWith('\n[CODE-VERIFIED: the user\'s own last 2 replies') && STAGEA.endsWith(']\n') && !/\n\[/.test(STAGEA.slice(1)) && guardAccepts(STAGEA) && guardAccepts(ORIG));
assert('(1.8) the wiring: the note is still built under the same condition, and gets the Stage A rule that already holds the money and road notes',
  /const userStagnationCtx = \(!_crisisTurn && !roadQuestionState\.current && detectUserStagnation\(msgs\)\.stagnant\)\s*\? describeUserStagnationCtx\(_saNotesHeld\)\s*: '';/.test(CODE) &&
  /const _saNotesHeld = stageAPreRootNotesHeld\(stageAActive\.current, stageARef\.current\.stats\.rootConfirmed === 1, _safetyPath\);/.test(CODE));
assert('(1.9) the detector and the ladder are untouched: detectUserStagnation as before, and «stuck» still combines the same three signals',
  /const stuckSignalFired = !!\(clarityPivotCtx \|\| selfRepetitionCtx \|\| userStagnationCtx\);/.test(CODE) && fnSrc('detectUserStagnation').includes('const NO_PROGRESS = /(δεν ξέρω|δεν έχω ιδέα|ό,?τι πεις|όπως θες|δεν ξέρω τι|άκυρο|δεν μπορώ να πω)/i;'));

// ── (2) commit 2 — the two gates are not asked for in Stage A before the root ───────────────────────────────────────────────────────────────
// [GATES DUE CHECK …] asks the model, from the 3rd user message on, to put Decision Space Anchors and the Stakes Question before «a closing move».
// The Stage A paragraph of the prompt says nothing of them, and a closing is not the model's there. In the stored real-model runs the note was
// in about 425 requests and the model followed it once (a stored-run count, not text). Nothing in the root flow reads the two flags: only this note,
// the gatesDue/gatesIgnored counters and the declaration ledger (telemetry only). With the switch open, before a confirmed root, off the safety
// path (the rule of 30/10, stageAPreRootNotesHeld) the note is not sent; everywhere else it is the note that was sent.
const gb = (() => { const a = CODE.indexOf('const gatesCtx = (() => {'); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n      })();', a) + '\n      })();'.length); })();
const HOLD = /        \/\/ «συνομιλία v1», commit 2[\s\S]*?\n        if \(_saNotesHeld\) \{ gatesHeldInStageA = due\.length > 0; return ''; \}\n/;
const iClear = gb.indexOf('gatesDueSnapshot.current = { anchors: false, stakes: false, scale: false };'), iStakes = gb.indexOf("if (!stakesAsked.current) due.push('Stakes Question"),
  iHold = gb.indexOf('if (_saNotesHeld) { gatesHeldInStageA = due.length > 0; return \'\'; }'), iSnap = gb.indexOf('gatesDueSnapshot.current = {\n          anchors:');
assert('(2.1) the hold is in the gates block, after the list of what is due is built and before the snapshot of it: in Stage A before the root, off the safety path, the block returns nothing',
  iClear > 0 && iStakes > iClear && iHold > iStakes && iSnap > iHold && HOLD.test(gb));
assert('(2.2) … so the snapshot (the gatesDue/gatesIgnored counters) stays all false for a gate that was never injected, and the flag gatesHeldInStageA says the note was due',
  /\n      let gatesHeldInStageA = false;\n      const gatesCtx = \(\(\) => \{/.test(CODE) && iHold > iClear);
assert('(2.3) with the hold taken out, the gates block is the block of e4b2ae6, byte for byte (sha256 c148adcf…): the text, the conditions and the three kinds of gate are as before',
  gb.length > 0 && gb.includes('[GATES DUE CHECK') && sha(gb.replace(HOLD, '')) === 'c148adcfb5a9771cef2c50ed36727a16cf98b04d16d71bd5ec5b592c6c720936');
const firedLit = (() => { const a = CODE.indexOf('const fired = Object.entries({'); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('}).filter(([, v]) => v).map(([k]) => k);', a)); })();
assert('(2.4) the family bookkeeping counts the held note as fired, as before — same keys, same order (sha256 of the list with that one entry spelled as before: e4b2ae6\'s). This is what keeps the later requests, the safety path\'s included, byte for byte',
  firedLit.includes('postMapCloseCtx, gatesCtx: gatesCtx || gatesHeldInStageA, closingDriftCtx,') && sha(firedLit.replace('gatesCtx: gatesCtx || gatesHeldInStageA', 'gatesCtx')) === 'f948ebcae9fe9f4e6d41bb7a4ce9f95193c260875bf34e4db196818df9fce315');
const cnt = s => CODE.split(s).length - 1;
assert('(2.5) nothing new reads the two flags: anchorsInvited 6, stakesAsked 6, stakesCallbackDelivered 3, gatesDueSnapshot 4 uses — as in e4b2ae6',
  cnt('anchorsInvited.current') === 6 && cnt('stakesAsked.current') === 6 && cnt('stakesCallbackDelivered.current') === 3 && cnt('gatesDueSnapshot.current') === 4);
assert('(2.6) the latches still follow what the model asks, and the ledger still records it (telemetry): the detectors and the ledger rows are untouched',
  CODE.includes('if (!stakesAsked.current && detectsStakesAsked(text)) {\n        stakesAsked.current = true;') && CODE.includes('if (!anchorsInvited.current && detectsAnchorsInvited(text)) {\n        anchorsInvited.current = true;') &&
  CODE.includes("['stakes',             stakesAsked.current,               false],") && CODE.includes("['anchors',            anchorsInvited.current,            false],"));

// (2.7) the block, evaluated: held in Stage A before the root, it returns nothing and leaves the snapshot all false; and the flag says "the note was due" for
// exactly the inputs on which the block (not held) returns the note — over all the combinations below. (The closing detectors are stubs here: they are not under test.)
{
  const evalGates = o => new Function('ctx', `
    const msgs = ctx.msgs, msgCount = ctx.msgCount, _safetyPath = ctx.safety, _saNotesHeld = ctx.held, roadQuestionState = { current: ctx.road ? { roads: ['Χ'] } : null };
    const stageAActive = { current: true }, concreteStepStated = { current: false }, outcomeScaleAsked = { current: true }, anchorsInvited = { current: ctx.anchors }, stakesAsked = { current: ctx.stakes };
    const gatesDueSnapshot = { current: { anchors: true, stakes: true, scale: true } }, _earlierUserTexts = [];
    const isExplicitClosure = () => false, declaresClosing = () => false, isOpeningGreeting = () => false;
    let gatesHeldInStageA = false;
    ${gb}
    return { text: gatesCtx, snap: gatesDueSnapshot.current, held: gatesHeldInStageA };`)(o);
  const msgs = [{ role: 'user', content: 'Με φοβίζει ότι θα χάσω τη σταθερότητά μου.' }];
  let cases = 0, flagDiffers = 0, heldSendsText = 0, heldSnapNotClear = 0, unheldFlag = 0, unheldSnapMissing = 0, errors = 0;
  for (const msgCount of [1, 2, 3, 5, 12]) for (const road of [false, true]) for (const anchors of [false, true]) for (const stakes of [false, true]) for (const safety of [false, true]) {
    try {
      const base = { msgs, msgCount, road, anchors, stakes, safety }, free = evalGates({ ...base, held: false }), held = evalGates({ ...base, held: !safety });
      cases++;
      if (held.held !== (free.text !== '')) flagDiffers++;                                      // the flag = "the note would have been sent"
      if (held.text !== '' && !safety) heldSendsText++;                                          // held → nothing is sent
      if (!safety && (held.snap.anchors || held.snap.stakes || held.snap.scale)) heldSnapNotClear++; // held → the counters see nothing
      if (free.held !== false) unheldFlag++;                                                     // not held → the flag stays false
      if (free.text !== '' && !(free.snap.anchors === !anchors && free.snap.stakes === !stakes)) unheldSnapMissing++; // not held → the snapshot as before
    } catch (e) { errors++; console.log('GRID ERROR ' + e.message); }
  }
  assert('(2.7) the block, evaluated over ' + cases + ' combinations (message count, road question pending, each gate asked or not, safety path): held, it sends nothing and the counters see nothing; the flag is true exactly when the unheld block sends the note; unheld, as before',
    cases === 80 && errors === 0 && flagDiffers === 0 && heldSendsText === 0 && heldSnapNotClear === 0 && unheldFlag === 0 && unheldSnapMissing === 0);
  const sample = evalGates({ msgs, msgCount: 5, road: false, anchors: false, stakes: false, safety: false, held: false });
  assert('(2.7) … and the grid is not vacuous: the unheld block does send the gates note on the plain case (Anchors and Stakes due)', sample.text.includes('[GATES DUE CHECK') && sample.text.includes('Decision Space Anchors') && sample.text.includes('Stakes Question'));
}

// ── (3) commit 3 — the ROUND TYPE note: a constraint, not a strategy ───────────────────────────────────────────────────────────────────────
// Stored real-model runs #43–#70 (counts only, 574 replies of 78 ordinary sessions): 83% of the replies end in a question, the longest run of
// question-ending replies in a row is 14, and SESSION COVERAGE reports that very count every turn without directing. The note says one thing:
// this reply must not end with a question. It is lit by (1) the last 5 replies of AURA each ending in a question (the counter of SESSION COVERAGE) or
// (2) the user's last two messages each a short «δεν ξέρω» or the like (the words and the 6-word limit of detectUserStagnation); only in Stage A before a
// confirmed root, off the safety path, and not while the readiness question is the most recent question AURA asked. Code only: it begins with an opening
// the guard already lists, so api/aura.js and the fixed prompt are not touched.
const ldr = (...names) => { try { return new Function(names.map(fnSrc).join('\n') + '\nreturn {' + names.join(',') + '};')(); } catch (e) { console.log('LOAD ERROR ' + names + ' — ' + e.message); return {}; } };
const safely = (label, fn) => { try { fn(); } catch (e) { assert(label + ' — the check itself threw: ' + e.message, false); } };
const RT = ldr('trailingQuestionReplies', 'userSaysDontKnowTwice', 'describeRoundTypeCtx');
const CR = ldr('buildCoverageReport');
const A = t => ({ role: 'assistant', content: t }), U = t => ({ role: 'user', content: t });
const Q = i => A('Τι σημαίνει αυτό για σένα, μέρος ' + i + ';'), SENT = i => A('Άκουσα το μέρος ' + i + '.');
const convo = (n, mk) => { const m = []; for (let i = 0; i < n; i++) { m.push(U('Κάτι που έγινε ' + i)); m.push(mk(i)); } m.push(U('Και κάτι ακόμα')); return m; };
assert('(3.1) three pure functions: trailingQuestionReplies, userSaysDontKnowTwice, describeRoundTypeCtx(stageAPreRoot, readinessPending, messages, streakLimit)',
  ['trailingQuestionReplies', 'userSaysDontKnowTwice', 'describeRoundTypeCtx'].every(n => typeof RT[n] === 'function') && typeof CR.buildCoverageReport === 'function');
// (3.2) the counter is the counter of SESSION COVERAGE: same answer as buildCoverageReport on 600 generated conversations (seeded)
safely('(3.2)', () => {
  let seed = 20261115; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const ENDS = ['?', '?', '?', '?', ';', ';', ' ?', '?  \n', '.', '!', '…', '?»', '\u037e', ' ', '', ':)'];
  let diff = 0, nonZero = 0, over5 = 0;
  for (let c = 0; c < 600; c++) {
    const list = [], n = Math.floor(rnd() * 16);
    if (c % 3 === 1) { // a third of them are talkers that mostly ask: user, reply, user, reply … (9 of 10 replies end in a question mark or a semicolon)
      for (let i = 0; i < 6 + Math.floor(rnd() * 8); i++) { list.push(U('μήνυμα ' + i)); list.push(A('απάντηση ' + i + (rnd() < 0.9 ? ['?', ';', '?  \n'][Math.floor(rnd() * 3)] : '.'))); }
    } else for (let i = 0; i < n; i++) {
      const r = rnd();
      if (r < 0.18) list.push(U('μήνυμα ' + i));
      else if (r < 0.34) list.push({ role: 'assistant', content: 'Κλείσιμο' + ENDS[Math.floor(rnd() * ENDS.length)], msgMode: 'TERMINATION' });
      else if (r < 0.38) list.push({ role: 'assistant', content: 'Κλείσιμο;', isTermination: true });
      else if (r < 0.40) list.push({ role: 'assistant', content: 12345 });
      else if (r < 0.42) list.push(null);
      else list.push(A('απάντηση ' + i + ENDS[Math.floor(rnd() * ENDS.length)]));
    }
    const rep = CR.buildCoverageReport(list, [], () => false, true), m = /counting back from the last one: (\d+)/.exec(rep), want = m ? Number(m[1]) : 0, got = RT.trailingQuestionReplies(list);
    if (got !== want) diff++; if (want > 0) nonZero++; if (want >= 5) over5++;
  }
  assert('(3.2) trailingQuestionReplies gives the number SESSION COVERAGE reports (nothing under 3 replies; closing messages left out) on 600 generated conversations — ' + nonZero + ' with a run, ' + over5 + ' of 5 or more, ' + diff + ' differences', diff === 0 && nonZero > 100 && over5 > 20);
});
// (3.3) the «δεν ξέρω» words are the words of detectUserStagnation, letter for letter
safely('(3.3)', () => {
  const lit = s => { const m = /const NO_PROGRESS = (\/\(δεν ξέρω[^\n]*?\/i);/.exec(s); return m ? m[1] : null; };
  assert('(3.3) the «δεν ξέρω» words of the note are those of detectUserStagnation, letter for letter', lit(fnSrc('userSaysDontKnowTwice')) !== null && lit(fnSrc('userSaysDontKnowTwice')) === lit(fnSrc('detectUserStagnation')));
});
// (3.4) two «δεν ξέρω» in a row
safely('(3.4)', () => {
  const f = RT.userSaysDontKnowTwice, ok2 = (...t) => f(t.map(U));
  assert('(3.4) two short «δεν ξέρω»/equivalents in a row → yes; one, a long one, one apart, or a different short answer → no',
    ok2('δεν ξέρω', 'Δεν ξέρω.') && ok2('Δεν έχω ιδέα', 'ό,τι πεις') && ok2('όπως θες', 'άκυρο') && ok2('κάτι άλλο', 'δεν μπορώ να πω', 'δεν ξέρω τι') &&
    !ok2('δεν ξέρω') && !ok2('Δεν ξέρω', 'Ναι') && !ok2('Ναι', 'Δεν ξέρω') && !ok2('δεν ξέρω', 'Δεν ξέρω αν θα το κάνω ποτέ τελικά αυτό') && !ok2('Δεν ξέρω', 'Εντάξει', 'Δεν ξέρω') &&
    f([U('δεν ξέρω'), A('Τι;'), U('δεν ξέρω')]) === true && f(null) === false && f([]) === false && f([{ role: 'user', content: 7 }, U('δεν ξέρω')]) === false);
});
// (3.5) when the note is due
safely('(3.5)', () => {
  const f = RT.describeRoundTypeCtx, L = (n, mk) => convo(n, mk), L5 = L(5, Q), L4 = L(4, Q), L6 = L(6, Q);
  const rows = [
    ['5 question-ending replies in a row, Stage A before the root → the note', f(true, false, L5) !== '' && /your last 5 replies each ended with a question/.test(f(true, false, L5))],
    ['… 6 and 9 → the note says so (6 / 9)', /your last 6 replies/.test(f(true, false, L6)) && /your last 9 replies/.test(f(true, false, L(9, Q)))],
    ['4 in a row → nothing', f(true, false, L4) === ''],
    ['5 questions but a statement in between (the run is 2) → nothing', f(true, false, L(5, i => i === 3 ? SENT(i) : Q(i))) === ''],
    ['the run is cut by a statement as the LAST reply → nothing', f(true, false, [...L5.slice(0, -1), SENT(9), U('και')]) === ''],
    ['the limit is a parameter: 4 questions with a limit of 4 → the note; 5 with a limit of 6 → nothing; a bad limit → 5', f(true, false, L4, 4) !== '' && f(true, false, L5, 6) === '' && f(true, false, L4, 'x') === '' && f(true, false, L4, 2) === ''],
    ['two «δεν ξέρω» in a row, no run → the note, with that reason only', (() => { const m = [U('Έχω ένα θέμα με τη δουλειά'), SENT(1), U('δεν ξέρω'), SENT(2), U('Δεν ξέρω')], n = f(true, false, m); return /last two messages were each «δεν ξέρω»/.test(n) && !/replies each ended/.test(n); })()],
    ['both reasons → both are named', (() => { const m = [...L5.slice(0, -1), U('δεν ξέρω'), Q(7), U('δεν ξέρω')], n = f(true, false, m); return /replies each ended with a question/.test(n) && /last two messages were each/.test(n); })()],
    ['not Stage A before the root (old flow, after the root, safety path) → nothing, whatever the run', [false, undefined, null, 'true', 1].every(v => f(v, false, L6) === '')],
    ['the readiness question is the most recent question → nothing', f(true, true, L6) === '' && f(true, true, [U('δεν ξέρω'), SENT(1), U('δεν ξέρω')]) === ''],
    ['fewer than 3 replies, or nothing, → nothing', f(true, false, [U('α'), Q(1), U('β'), Q(2), U('γ')]) === '' && f(true, false, []) === '' && f(true, false, null) === ''],
  ];
  for (const [label, cond] of rows) assert('(3.5) ' + label, cond === true);
});
// (3.6) what the note says — and what it never says
safely('(3.6)', () => {
  const N = RT.describeRoundTypeCtx ? RT.describeRoundTypeCtx(true, false, convo(5, Q)) : '';
  assert('(3.6) it is one block that begins and ends as the model expects, and the api guard accepts it (the opening is one the guard already lists)',
    N.startsWith('\n[CODE-VERIFIED: this reply must not end with a question.') && N.endsWith(']\n') && !/\n\[/.test(N.slice(1)) && guardAccepts(N) && N.length < 1600);
  assert('(3.6) it is a constraint, with the five things the model may choose between: a recognition not used before, one observation from their own words, a short summary in their own words, a change of angle from two things already said, an honest «may not have been found yet» only if not said',
    /brief recognition/.test(N) && /you have not used before in this conversation/.test(N) && /ONLY from their own words/.test(N) && /short summary of what they have said so far, in their own words/.test(N) &&
    /only sets side by side two things they already said/.test(N) && /only if they have not already said what really concerns them and you have not already said so in this conversation/.test(N));
  assert('(3.6) … and always: no interpretation, no advice, no road or step, no naming of the root, no supposition; it takes precedence over «ask one question» for this reply only',
    /no interpretation, no advice, no road or step, do not name the root or suggest what it is, no supposition about them or their situation/.test(N) && /takes precedence over any instruction to end with a question or to ask one question, for this reply only: the next reply is free again/.test(N));
  assert('(3.6) it proposes nothing: no «you should», no option for the user, no ROAD DISCOVERY, no question mark in its own instructions',
    N.length > 0 && !/you should|try to|ROAD DISCOVERY|PATH TWO|\?|first step|next step|you may (?:also )?(?:suggest|offer|propose)|(?:suggest|propose|recommend|offer) (?:a|an|the|that|they)\b/i.test(N.replace('end with a question.', '')));
});
// (3.7) wiring
// UPDATED (15/11/2026, «συνομιλία v1», commit 5, John): the slot holds one function now, describeSpeakRightCtx — the offer, its follow-up, and, when neither is due, the ROUND TYPE note
// itself (describeRoundTypeCtx with the Stage A rule and the readiness rule): same slot, same name, same order. Proved: auratests/test_speak_right.js (6.7) — byte for byte the same note, on 300 generated conversations.
assert('(3.7) the wiring: built from the Stage A rule, the readiness rule and the messages (through describeSpeakRightCtx, which hands the note back when no offer is due); sent in the hard-constraint tier, right after the gates note and before the closing-drift, first-reply and safety-path notes and the Stage A marker, which stays last',
  /const _srAsked = answersReadinessQuestion\(msgs\);/.test(CODE) && /const roundTypeCtx = describeSpeakRightCtx\(_sr, msgs, _srAsked\);/.test(CODE) && /const _sr = speakRightDecision\(_saNotesHeld, _srAsked, msgs, /.test(CODE) &&
  /return describeRoundTypeCtx\(x\.held === true, readinessPending, messages\)/.test(CODE) && /gatesCtx, roundTypeCtx, closingDriftCtx, stageAFirstReplyCtx, firstReplyFloorCtx, safetyPathCtx, stageAMarkerCtx,\n      \]\.filter\(Boolean\)\.join\('\\n'\);/.test(CODE));
assert('(3.7) the collision logger and the families are not told about it (it adds no state: a function of the messages)', !/const fired = Object\.entries\(\{[^}]*roundTypeCtx/.test(CODE));

// ── (4) commit 4 — the NEW MATERIAL note leaves room for ONE brief recognition (never the same recognition twice) ─────────────────────────────
// The note (off the safety path) said «do not say them back again … ask for what they have NOT said yet» and nothing about recognizing what they just said;
// the stored runs show the model filling that gap with the same stock phrase turn after turn. Now, off the safety path, one more sentence: one brief
// recognition is allowed — one plain sentence in the model's own words, not a stock phrase, never the same recognition phrase used earlier in the conversation.
// On the safety path the text is the one that was sent, word for word. The prompt's NEW MATERIAL rule is not touched; Context Refresh and the knowledge-state
// (GOS) note are not touched either (they wait for John's decision).
{
  const D = ldr('describeRepeatedElementsCtx').describeRepeatedElementsCtx, L = ['δώδεκα χρόνια', 'ωράριο εργασίας'];
  const ADD = 'One brief recognition of what they just said is allowed: one plain sentence in your own words, not a stock phrase, and never the same recognition phrase you already used earlier in this conversation. ';
  const OFF_BEFORE = 'ec9b9b227327e8a7dbe57be4e513f0eadf38c6bf540db489cea84a0d0c0ecb37', ON_BEFORE = 'd5f4c57297b769669df4389832338e67e9bdef4a6402e7d6ccce52694323b5f1';
  const off = typeof D === 'function' ? D(L, true) : '', on = typeof D === 'function' ? D(L, false) : '';
  assert('(4.1) off the safety path the note is the note of e4b2ae6 (sha256 ec9b9b22…) with exactly one sentence added: one brief recognition is allowed, never the same recognition phrase twice',
    typeof D === 'function' && off.includes(ADD) && sha(off.replace(ADD, '')) === OFF_BEFORE);
  assert('(4.2) … the sentence sits right after «Do not say them back again as an echo, a recap or a quote (NEW MATERIAL).», so the rule it softens is read first',
    off.includes('(NEW MATERIAL). ' + ADD + 'As NEW MATERIAL allows reorganizing'));
  assert('(4.3) on the safety path (false, nothing) the note is exactly as before, word for word (sha256 d5f4c572…)', typeof D === 'function' && sha(on) === ON_BEFORE && sha(D(L)) === ON_BEFORE && !on.includes('brief recognition'));
  assert('(4.4) everything the (δ) tests pin is still there: the words named, «do not say them back again», the choice question with their words, the other two exceptions, «ask for what they have NOT said yet», one bracket',
    off.includes('«δώδεκα χρόνια», «ωράριο εργασίας»') && /a CHOICE QUESTION may offer these words as its options, in their own words/.test(off) && /the one-time closing summary/.test(off) && /STOP MOMENT/.test(off) &&
    /Ask for what they have NOT said yet\./.test(off) && off.split('[').length === 2 && !/ΗΡΘΕΣ ΜΕ|ΒΡΗΚΕΣ|ΦΕΥΓΕΙΣ ΜΕ/.test(off));
  assert('(4.5) nothing when no words were said back, on either path; one block that the api guard accepts', typeof D === 'function' && D([], true) === '' && D(null, true) === '' && D([], false) === '' && guardAccepts(off) && off.startsWith('\n[CODE-VERIFIED: these words') && off.endsWith(']\n'));
  assert('(4.6) the wiring is the one of the (δ) commit (the call passes !_safetyPath), and the prompt\'s two rules it follows are unchanged',
    CODE.includes("let repeatedElementsCtx = _notSupportive ? describeRepeatedElementsCtx(repeatedUserElements(msgs), !_safetyPath) : ''; // ADR «15 Νοεμβρίου» (δ)") /* UPDATED (19/11/2026, «συνομιλία v1», Package 1, item 3, John: const → let — the NEW MATERIAL note is withdrawn right after the ROUND TYPE note is known, so exactly one of the two is sent; the note, its call and its arguments are as before) */ &&
    raw.includes('Reorganizing or connecting what they said counts only if their answer will be new.') && raw.includes('two or three options built ONLY from what they already said, in their words'));
}

// ── (Ω1) nothing else changed. Each change of the branch conversation-v1, new → old, exactly as written (between the BEGIN/END marks; each commit
// adds its own, in auratests/conversation_v1_undo.json). With them taken out, src/App.jsx must be the file of release-candidate e4b2ae6, byte for byte — this is the proof behind the UPDATED
// fingerprint values of the older tests (John, 15/11/2026: only those values move). And the things this branch must not touch: the fixed prompt
// (7e52268becda7360), api/aura.js, the openings its guard accepts, the screen filter, and the safety code (the 19 functions below, as in e4b2ae6).
{
  // the list (new → old, one entry per change of the branch) is the data file auratests/conversation_v1_undo.json; test_notes_card_1511.js (Ω2) reads the same file
  // UPDATED (22/11/2026, Λ1, John's corrections ⚑1–⚑2): the data file holds one change more (27 now: the two lines of handleStageABack — «Δεν το βρήκα ακόμα» clears the writing box only when it holds exactly the sentence the app put in), and five entries are the regions as they are now:
  // the list's constants and the two new pure functions (the pair that starts with the PACKAGE 1 comment), the state and the new reference, the effect and the handlers, the reset line, the screen block (without decision 15's separate line). The check is the same and its value is the same:
  // with all of them taken out src/App.jsx is release-candidate e4b2ae6 byte for byte (sha256 1860c046…) — nothing else changed.
  // UPDATED (22/11/2026, Δ, John's order ⚑4): the data file holds one change more (28 now): the two lines of STAGE_A_TEXTS.stepWhy — the app's text after «Ναι, αυτό είναι» (the comment line and John's new two sentences; the old text is the line of e4b2ae6).
  // The check is the same and its value is the same: with all of them taken out src/App.jsx is release-candidate e4b2ae6 byte for byte (sha256 1860c046…) — nothing else changed, so the text is the only thing this item changed.
  // UPDATED (22/11/2026, Ε, John's order): four entries of the data file are the regions as they are now — the pair that starts with the PACKAGE 1 comment (the list's constants and pure functions, now with rootPickCut and the cut of a long sentence in the loop of rootPickSentences),
  // the state (+ the new reference that says which items were cut), the effect and the screen block (the button of an item draws «…» after a cut one). The old texts of the pairs are as they were; still 28 changes. The check and its value are the same:
  // with all of them taken out src/App.jsx is release-candidate e4b2ae6 byte for byte (sha256 1860c046…) — nothing else changed, so these are the only changes of the item.
  // UPDATED (23/11/2026, Α, John's order): the data file holds five more entries (33 changes now) — the closing after the word of Stage A from CODE, new → old (the old text is HEAD's, 3e2a0e4): (1) the two pure functions
  // stageAEchoLine and stageAClosureFromCode (a pure addition), (2) the head of deliverFinalClosure (the Κ4 cards written once as armRecognitionCards, the branch from code), (3) and (4) the two places where the same 60 lines of the arming stood
  // (the model's closing, its failure path), told apart by what follows them, (5) the caller in handleSubmit (the phase read before the dispatch, the two new arguments). The check and its value are the same: with all of them taken out
  // src/App.jsx is release-candidate e4b2ae6, byte for byte (sha256 1860c046…) — so these are the only changes of the item (proved first: applying only the five to the new file gives 3e2a0e4 byte for byte).
  // UPDATED (24/11/2026, Β, John's order): the data file holds three more entries (36 changes now) — the four fixed texts of the first screens, new → old (the old text is HEAD's, 6ad4343): (1) the 4th line of the old first screen
  // (both old sentences → «Μετά βρίσκεις εσύ ένα μικρό βήμα και πότε θα το κάνεις.»), (2) the second sentence of the AI line of the entry screen, (3) the two new lines under the start button (the privacy line and the microphone line — a pure addition,
  // the old text is empty). The check and its value are the same: with all of them taken out src/App.jsx is release-candidate e4b2ae6, byte for byte (sha256 1860c046…) — so these are the only changes of the item (proved first: applying only
  // the three to the new file gives 6ad4343 byte for byte).
  // UPDATED (27/11/2026, John's explicit order, ADR «27 Νοεμβρίου»): the data file holds two more entries (38 changes now) — the DISTRESS word «κρίση», new → old (the old texts are HEAD's, 9e9828e): the bare word in the Greek DISTRESS pattern becomes four
  // patterns (a crisis the person is in or has, or one relative of a closed list has), and the lists of their words stand at the top of detectSafetySignal (a pure addition: its old text is empty). The check and its value are the same: with all of them taken out
  // src/App.jsx is release-candidate e4b2ae6, byte for byte (sha256 1860c046…) — so these are the only changes of the item (proved first: applying only these two to the new file gives 9e9828e byte for byte). The safety-code check below moves for ONE function on
  // purpose — detectSafetySignal (see its UPDATED line).
  // UPDATED (27/11/2026, John's order, ADR «27 Νοεμβρίου» (2)): the data file holds seven more entries (45 changes now) — the record of the heaviness latch («gravity_latched», numbers only): the helper gravityLatchedFields, the ref submitRound, its increment and
  // its reset, and the two call sites (new → old: a pure addition, the old text is empty or the one line it was). The check and its value are the same: with all of them taken out src/App.jsx is release-candidate e4b2ae6, byte for byte (sha256 1860c046…) — so these
  // are the only changes of the item (proved first: applying only these seven to the new file gives fe46925 byte for byte).
  // UPDATED (27/11/2026, John's order, ADR «27 Νοεμβρίου» (3)): the data file holds one more entry (46 changes now) — the counter of requests for advice (detectsExplicitProductionRequest): the block that sees «τι να κάνω», «πώς να το κάνω»,
  // «τι μπορώ να κάνω» (new → old: a pure addition, the old text is empty). The check and its value are the same: with all of them taken out src/App.jsx is release-candidate e4b2ae6, byte for byte (sha256 1860c046…) — so these are the only changes of
  // the item (proved first: applying only this one to the new file gives 55cc781 byte for byte).
  const UNDO = JSON.parse(fs.readFileSync(path.join(__dirname, 'conversation_v1_undo.json'), 'utf8'));
  const present = UNDO.filter(([nw]) => raw.split(nw).length === 2).length;
  let back = raw; for (const [nw, old] of UNDO) back = back.split(nw).join(old);
  assert('(Ω1) each of the ' + UNDO.length + ' changes of the branch is in src/App.jsx exactly once', present === UNDO.length);
  assert('(Ω1) … and with them taken out, src/App.jsx is byte for byte the file of release-candidate e4b2ae6 (sha256 1860c046…) — nothing else changed',
    present === UNDO.length && sha(back) === '1860c0465872482bd5a3bf4cbbf8dd962aeba92001a4ed774e3b4b7b7f9f077e');
  const lit = n => { const h = 'const ' + n + ' = `'; const a = raw.indexOf(h); const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };
  assert('(Ω1) the fixed prompt is 7e52268becda7360, the crisis and closing prompts as before',
    sha(lit('AURA_CORE_PERSONALITY')).startsWith('7e52268becda7360') && sha(lit('SYSTEM_SUPPORTIVE')).startsWith('c7815b96d83ebae8') && sha(lit('SYSTEM_TERMINATION')).startsWith('d5a77ca926f9490b'));
  assert('(Ω1) api/aura.js is the file of e4b2ae6, byte for byte (sha256 e791b194…)', sha(api) === '675564a7985438c86f068d9e475adffcce24b43488cf1e962b1de2b7b827c077');
  let same = false, count = 0;
  try { const G = require(path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs')); same = JSON.stringify(G.openingsFor(raw)) === JSON.stringify(OPENINGS); count = OPENINGS.length; } catch (e) { console.log('LOAD ERROR openings — ' + e.message); }
  assert('(Ω1) the build would write the same list of openings: every note of the app still begins the way the guard expects (' + count + ')', same && count === 33);
  assert('(Ω1) the screen filter (the internal label heads and stripInternalLabels) is as in e4b2ae6, byte for byte',
    sha(raw.slice(raw.indexOf('const INTERNAL_LABEL_HEADS'), raw.indexOf('function stripAraDeclarative'))).startsWith('f3f9a30b63578889'));
  const SAFETY = {
    // UPDATED (27/11/2026, John's explicit order, ADR «27 Νοεμβρίου»): the DISTRESS word «κρίση» of detectSafetySignal became four patterns (a crisis the person is in or has, or one relative of a closed list has) — proved first by auratests/test_krisi_narrowing_2711.js; no other function or line moved. Only the value below moved (838fe96c→f3746eee×1); the check itself is the same.
    detectSafetySignal: 'f3746eeee8392a34',
    detectsDangerFromOther: '59e2f828fda103fa',
    classifyCrisisTier: 'afa5cf7a370bb0d5',
    perTurnSafety: '42c868d331e2229a',
    informationModeNoteDue: 'd30dffdd6d827df3',
    stageAPreRootNotesHeld: '7b65f3bd71532cfc',
    computeEscalationLevel: 'b447d5bbaac2a19f',
    describeSafetyPathCtx: 'edb4d97939656976',
    describeStopMomentCtx: '71e44f923e2e143f',
    stopMomentGentleOnly: 'e15f2fd1c1e77d28',
    stageASafetyHold: 'f1fbe27ef7643815',
    describeMasterPriorityStageCtx: 'b9ec012473adece6',
    describeRiskClarificationCtx: '130061e8af62413d',
    detectsNoQuestionsRequest: '0dcfcc7bf50b5d99',
    stageACaptureAllowed: 'f8a46ebc62fe4ecd',
    detectsAffirmativeShort: '0a6f1957c0594d60',
    detectsCoreReadinessAsked: 'c84bd93559579f9e',
    detectsSpontaneousCoreRecognition: '6bc032dfcdda93cb',
    describeEscalationCtx: '1c4712957da99ab7'
  };
  const moved = Object.keys(SAFETY).filter(n => !fnSrc(n) || sha(fnSrc(n)).slice(0, 16) !== SAFETY[n]);
  assert('(Ω1) the safety code is as in e4b2ae6, byte for byte: the ' + Object.keys(SAFETY).length + ' detector, rule and note functions of the safety path (moved: ' + (moved.join(', ') || 'none') + ')', moved.length === 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
