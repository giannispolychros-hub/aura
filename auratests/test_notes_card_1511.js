// AURA — PER-TURN NOTES AND THE ROOT CARD (John, 15/11/2026, ADR «15 Νοεμβρίου», release-candidate). Only src/App.jsx and tests change;
// the prompt (b5f303cc9405aa21), api/aura.js, the screen filter and the safety path do not. One commit per item, each adds its part here.
// SYNTHETIC words only; no crisis phrase and no real session's words. Browser checks of the same: scripts/e2e_stage_a.cjs, section NQ.
//  (α) the root card arms ONLY when a plain «Ναι» answers the readiness question asked right before it (finding 161, the card's silent
//      arming): answersReadinessQuestion(msgs) — the message just before the user's last one is AURA's reply with the readiness question
//  (Ω) nothing else changed: with this round's changes taken out, src/App.jsx is 50beff6's, byte for byte; prompt, api/aura.js, openings,
//      screen filter untouched
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
function extract(name) { const s = CODE.indexOf('function ' + name + '('); const e = CODE.indexOf('\n}', s) + 2; return s < 0 ? '' : CODE.slice(s, e); }
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const load = (names, ret) => { try { return new Function(names.map(extract).join('\n') + '\nreturn ' + ret + ';')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); return null; } };

// ── (α) the readiness «Ναι» ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const A = load(['detectsCoreReadinessAsked', 'detectsAffirmativeShort', 'answersReadinessQuestion'], '{ asked: detectsCoreReadinessAsked, yes: detectsAffirmativeShort, answers: answersReadinessQuestion }');
  assert('(α) answersReadinessQuestion exists and loads with the detectors it uses', !!A && typeof A.answers === 'function');
  if (A && typeof A.answers === 'function') {
    const RQ = 'Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;';
    const U = t => ({ role: 'user', content: t }), M = t => ({ role: 'assistant', content: t }), APPQ = t => ({ role: 'assistant', content: t, msgMode: 'STAGE_A' });
    const start = [U('Σκέφτομαι να αλλάξω δουλειά αλλά κάτι με κρατάει.'), M('Τι σε κρατάει περισσότερο;'), U('Η σταθερότητα του μισθού.')];
    assert('(α) the canonical readiness question is the one the app registers (the detector is unchanged)', A.asked(RQ) && A.asked('Καλά. ' + RQ));
    assert('(α) «Ναι» right after the readiness question → it answers it (door 2 still works)', A.answers([...start, M(RQ), U('Ναι')]) === true);
    assert('(α) … also when AURA\'s reply to it is already in the list (the shape after the reply)', A.answers([...start, M(RQ), U('Ναι, σωστά.'), M('Τι σου ήρθε πρώτο;')]) === true);
    assert('(α) a «Ναι» to ANOTHER question later in the session does NOT answer it (the silent arming, finding 161)',
      A.answers([...start, M(RQ), U('Ναι, νομίζω ότι φοβάμαι να το πω στον πατέρα μου.'), M('Του έχεις μιλήσει ποτέ;'), U('Ναι, σωστά.')]) === false);
    assert('(α) … nor many messages later', A.answers([...start, M(RQ), U('Ναι, και κάτι ακόμα.'), ...Array.from({ length: 20 }, (_, k) => k % 2 ? U('Μέρα ' + k + '.') : M('Τι άλλαξε;')), M('Το πρόσεξες;'), U('Ναι')]) === false);
    assert('(α) a «Ναι» to an ordinary question with no readiness question at all → no', A.answers([...start, M('Τι σε κρατάει;'), U('Ναι')]) === false);
    assert('(α) the app\'s own fixed message in between (STAGE_A) → the «Ναι» answers that, not the readiness question', A.answers([...start, M(RQ), APPQ('Γράψ\' το σε μία φράση.'), U('Ναι')]) === false);
    assert('(α) only AURA\'s own reply counts: an app fixed text (STAGE_A) carrying the same words is not the readiness question', A.answers([...start, APPQ(RQ), U('Ναι')]) === false);
    assert('(α) the readiness question broken by a line break is not registered — as before (known gap, unchanged)', A.answers([...start, M(RQ.replace('αρχίσει να ', 'αρχίσει\nνα ')), U('Ναι')]) === false);
    assert('(α) no history, a first message, or garbage → no', A.answers([]) === false && A.answers(null) === false && A.answers([U('Ναι')]) === false && A.answers([null, U('Ναι')]) === false);
    assert('(α) it reads only the order of the messages — whether the answer is a plain «Ναι» stays the job of detectsAffirmativeShort (unchanged)',
      A.answers([...start, M(RQ), U('Όχι ακόμα.')]) === true && A.yes('Ναι') === true && A.yes('Όχι ακόμα.') === false);
  }
}

// ── (Ω) nothing else changed. Each change of this round, new → old, exactly as written (between the BEGIN/END marks; each commit of the
// round adds its own). With them taken out, src/App.jsx must be the file of release-candidate 50beff6, byte for byte. This is the proof
// behind the UPDATED fingerprint values of the earlier rounds' tests (John, 15/11/2026: only those values move). And the four things this
// round must not touch: the fixed prompt (b5f303cc9405aa21), api/aura.js, the openings its guard accepts, the screen filter.
{
  const UNDO = /* BEGIN UNDO */ [
    ["}\n// ADR «15 Νοεμβρίου» (α) (John, finding 161 — the root card's silent arming): in Stage A a plain «Ναι» confirms readiness only when it\n// answers the readiness question asked RIGHT BEFORE it — the message just before the user's last one is AURA's own reply (not one of the\n// app's fixed STAGE_A texts) with that question. A «Ναι» to any other question later in the session no longer arms door 2, so the next\n// message is not taken as the root. Pure: it reads only the order of the messages; whether the answer is a plain «Ναι» stays the job of\n// detectsAffirmativeShort. auratests/test_notes_card_1511.js; browser: section NQ.\nfunction answersReadinessQuestion(msgs) {\n  const list = Array.isArray(msgs) ? msgs : [];\n  let u = list.length - 1;\n  while (u >= 0 && !(list[u] && list[u].role === \"user\")) u--;\n  const prev = u > 0 ? list[u - 1] : null;\n  return !!prev && prev.role === \"assistant\" && prev.msgMode !== \"STAGE_A\" && typeof prev.content === \"string\" && detectsCoreReadinessAsked(prev.content);\n}\n// ADR «12 Οκτωβρίου (γ)» (John): the «Ναι» to a yes/no question counts only in a CLEAR form — the same start words as before,\n", "}\n// ADR «12 Οκτωβρίου (γ)» (John): the «Ναι» to a yes/no question counts only in a CLEAR form — the same start words as before,\n"],
    ["          latchFlips: !coreReadinessConfirmed.current && !stageARef.current.phase && !reflectionDelivered.current && riskSignalKind.current !== 1 &&\n            (detectsSpontaneousCoreRecognition(lastUserText) || (coreReadinessAsked.current && detectsAffirmativeShort(lastUserText) && answersReadinessQuestion(msgs))),\n        })));\n", "          latchFlips: !coreReadinessConfirmed.current && !stageARef.current.phase && !reflectionDelivered.current && riskSignalKind.current !== 1 &&\n            (detectsSpontaneousCoreRecognition(lastUserText) || (coreReadinessAsked.current && detectsAffirmativeShort(lastUserText))),\n        })));\n"],
    ["        } else if (coreReadinessAsked.current && lastUserMsgForReadiness &&\n            detectsAffirmativeShort(lastUserMsgForReadiness.content) &&\n            // ADR «15 Νοεμβρίου» (α): in Stage A only a «Ναι» to the readiness question asked right before it (the old flow as before)\n            (!stageAActive.current || answersReadinessQuestion(msgs))) {\n          coreReadinessConfirmed.current = true;\n", "        } else if (coreReadinessAsked.current && lastUserMsgForReadiness &&\n            detectsAffirmativeShort(lastUserMsgForReadiness.content)) {\n          coreReadinessConfirmed.current = true;\n"],
  ] /* END UNDO */;
  const present = UNDO.filter(([nw]) => raw.split(nw).length === 2).length;
  let back = raw; for (const [nw, old] of UNDO) back = back.split(nw).join(old);
  assert('(Ω) each of the ' + UNDO.length + ' changes of this round is in src/App.jsx exactly once', present === UNDO.length);
  assert('(Ω) … and with them taken out, src/App.jsx is byte for byte the file of release-candidate 50beff6 (sha256 86a8da15…) — nothing else changed',
    present === UNDO.length && crypto.createHash('sha256').update(back).digest('hex') === '86a8da154de46773b59a9f0a45fcd15ef9cc56ac943b2ba3fd6b00293f2bbc01');
  const lit = n => { const h = 'const ' + n + ' = `'; const a = raw.indexOf(h), b = a + h.length; return Function('return `' + raw.slice(b, raw.indexOf('`;', b)) + '`;')(); };
  const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
  assert('(Ω) the fixed prompt is b5f303cc9405aa21, the crisis and closing prompts as before', sha(lit('AURA_CORE_PERSONALITY')).startsWith('b5f303cc9405aa21') &&
    sha(lit('SYSTEM_SUPPORTIVE')).startsWith('c7815b96d83ebae8') && sha(lit('SYSTEM_TERMINATION')).startsWith('d5a77ca926f9490b'));
  const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
  assert('(Ω) api/aura.js is the file of 50beff6, byte for byte', sha(api).startsWith('e791b19471f08132'));
  const G = require(path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'));
  const listed = JSON.parse('[' + api.slice(api.indexOf('openings: [') + 11, api.indexOf('],', api.indexOf('openings: ['))).trim().replace(/,\s*$/, '') + ']');
  assert('(Ω) the build would write the same list of openings: every note of the app still begins the way the guard expects (' + listed.length + ')',
    JSON.stringify(G.openingsFor(raw)) === JSON.stringify(listed));
  assert('(Ω) the screen filter (the internal label heads and stripInternalLabels) is as in 50beff6, byte for byte',
    sha(raw.slice(raw.indexOf('const INTERNAL_LABEL_HEADS'), raw.indexOf('function stripAraDeclarative'))).startsWith('f3f9a30b63578889'));
}

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
