// AURA — PER-TURN NOTES AND THE ROOT CARD (John, 15/11/2026, ADR «15 Νοεμβρίου», release-candidate). Only src/App.jsx and tests change;
// the prompt (b5f303cc9405aa21), api/aura.js, the screen filter and the safety path do not. One commit per item, each adds its part here.
// SYNTHETIC words only; no crisis phrase and no real session's words. Browser checks of the same: scripts/e2e_stage_a.cjs, section NQ.
//  (α) the root card arms ONLY when a plain «Ναι» answers the readiness question asked right before it (finding 161, the card's silent
//      arming): answersReadinessQuestion(msgs) — the message just before the user's last one is AURA's reply with the readiness question
//  (β) the «switch family» note is no longer sent off the safety path; on the safety path exactly as before (finding ζ, John decides)
//  (γ) level 3 of the escalation ladder says once, honestly, that it may not be found yet — no pretended attempt, no closing, no advice, no root
//  (Λ) every new note: an echo is taken off the screen whole, and the guard of api/aura.js accepts it as it is
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

// ── (β) the «switch family» note — off the safety path no longer sent ─────────────────────────────────────────────────────────────────
// Checked first (John's condition): the note named the code note that came LAST in the collision logger's order — in the stored runs #43–#70
// the gates note 118 times, the safety-path note 39 and the knowledge-state note 2, never one of the prompt's strategy families — and its
// instruction («consider a family not yet used») is the prompt's own EXPLORATION COVERAGE PRINCIPLE / WHICH FAMILY TO SWITCH TO, which stay.
{
  const B = load(['describeLastFiredFamilyCtx'], 'describeLastFiredFamilyCtx');
  const OLD = '\n[CODE-VERIFIED: "gatesCtx" has been the highest-attention signal (per the collision logger\'s own "highest = fired[fired.length-1]" rule) for 3 consecutive turns now. Per EXPLORATION COVERAGE PRINCIPLE/WHICH FAMILY TO SWITCH TO above, consider a family not yet used this session.]\n';
  assert('(β) the note builder loads', typeof B === 'function');
  if (typeof B === 'function') {
    assert('(β) off the safety path: no «switch family» note, whatever the family and the streak', B('gatesCtx', 3, true) === '' && B('safetyPathCtx', 5, true) === '' && B('premiseInversionCtx', 2, true) === '');
    assert('(β) on the safety path: the note exactly as before, word for word (finding ζ — John decides later)', B('gatesCtx', 3, false) === OLD);
    assert('(β) … and, as before, nothing below a streak of 2 or without a family', B('gatesCtx', 1, false) === '' && B(null, 0, false) === '');
  }
  const P = raw.slice(ci, ce);
  assert('(β) the strategy guidance it pointed to stays in the fixed prompt: EXPLORATION COVERAGE PRINCIPLE, WHICH FAMILY TO SWITCH TO (with its families), STRATEGY BY STATE',
    P.includes('EXPLORATION COVERAGE PRINCIPLE (non-negotiable') && P.includes('WHICH FAMILY TO SWITCH TO (specific to strategy-switching') &&
    P.includes('Contradiction Detection, Premise Inversion, VERBATIM COST COLLISION') && P.includes('If the last two questions of one strategy brought nothing new, change the strategy, not the wording.'));
  assert('(β) the notes that see a stall in the replies themselves are still built: AURA\'s self-repetition, the user\'s stagnation, the method failure',
    !!extract('detectAssistantSelfRepetition') && !!extract('detectUserStagnation') && !!extract('detectsMethodFailureSignal'));
}

// ── (γ) level 3 of the escalation ladder: honest, once — no pretended new attempt, no closing, no advice, no root ───────────────────────
{
  const E = load(['describeEscalationCtx'], 'describeEscalationCtx');
  const C = load(['computeEscalationLevel'], 'computeEscalationLevel');
  assert('(γ) the escalation note builder and the level function load', typeof E === 'function' && typeof C === 'function');
  if (typeof E === 'function' && typeof C === 'function') {
    const t = E(3);
    assert('(γ) level 3 keeps its head — the opening the guard knows and the label head the screen filter knows', t.startsWith('\n[ESCALATION LEVEL 3 (Perspective Swap) — CODE-VERIFIED: '));
    assert('(γ) it no longer presents another try as «the final attempt»', !/final attempt/i.test(t) && /instead of presenting another try as new/.test(t));
    assert('(γ) it asks for ONE honest sentence, once in the conversation: what really concerns them may not have been found yet',
      /if you have not already said it in this conversation, say once, in one plain sentence, that what really concerns them may not have been found yet/.test(t));
    assert('(γ) no forced question: at most one, from their own words; never the same question in other words',
      /at most one short question, built only from their own words/.test(t) && /never the same question again in other words/.test(t));
    assert('(γ) no advice, road or step; no root named or pushed for; no closing suggested',
      /No advice, road or step/.test(t) && /do not name the root or push toward naming it/.test(t) && /do not suggest ending the conversation/.test(t));
    assert('(γ) when the note of a sign of heaviness or risk is there, that note governs', /note that a sign of heaviness or risk was seen, follow that note instead/.test(t));
    assert('(γ) no name of the app\'s code, not the Stage A marker, one bracket only (its own head)', !/\b[a-z][A-Za-z]+Ctx\b/.test(t) && !t.includes('FREE PART') && t.split('[').length === 2 && t.trim().endsWith(']'));
    assert('(γ) levels 0, 1, 2 and AUTO-KILL are word for word as before', E(0) === '' && E(1) === "\n[ESCALATION LEVEL 1 (Pivot) — CODE-VERIFIED: a stuck pattern (loop/avoidance/repetition/stagnation) was just detected this turn. Per ESCALATION above, this is the first attempt.]\n" && E(2) === "\n[ESCALATION LEVEL 2 (targeted follow-up) — CODE-VERIFIED: the stuck pattern has now persisted through Level 1. Per ESCALATION above, do not repeat Level 1's move — ask a sharper, targeted follow-up that builds on the previous answer.]\n" &&
      E(4) === "\n[AUTO-KILL — CODE-VERIFIED: escalation attempts produced no movement. Per ESCALATION and GENERAL EXIT CRITERIA above, offer Graceful Exit now rather than a further attempt.]\n");
    assert('(γ) the ladder itself is unchanged: before the root the level stops at 3 (never AUTO-KILL); otherwise 4; no signal → 0',
      C(2, true, 3) === 3 && C(3, true, 3) === 3 && C(3, true, 4) === 4 && C(3, false, 3) === 0 && C(0, true, 3) === 1);
  }
}

// ── (Λ) every new note text of this round: if the model echoes it, the screen filter takes it off whole (only the reply stays); and a
// request carrying it after the fixed prompt passes the guard of api/aura.js as it is (no new opening needed). Each commit adds its own.
{
  const LBL = (() => { try { const a = CODE.indexOf('const INTERNAL_LABEL_HEADS'), b = CODE.indexOf('function stripAraDeclarative'); return new Function(CODE.slice(a, b) + '\nreturn stripInternalLabels;')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); return null; } })();
  const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
  const blockOf = (a, b) => { const i = api.indexOf(a), j = api.indexOf(b, i); return i >= 0 && j > i ? api.slice(i, j) : ''; };
  const fnSrc = name => { const a = api.indexOf('function ' + name + '('); if (a < 0) return ''; let d = 0; for (let j = api.indexOf('{', a); j < api.length; j++) { if (api[j] === '{') d++; else if (api[j] === '}') { d--; if (!d) return api.slice(a, j + 1); } } return ''; };
  let GD = null;
  try { GD = new Function(blockOf('// BEGIN PROMPT FINGERPRINTS', '// END PROMPT FINGERPRINTS') + '\n' + blockOf('const REQUEST_LIMITS = ', ';\n') + ';\n' + fnSrc('checkAuraRequest') + '\nreturn { PROMPT_FINGERPRINTS, REQUEST_LIMITS, checkAuraRequest };')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
  const shaHex = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
  const core = (() => { const h = 'const AURA_CORE_PERSONALITY = `'; const a = raw.indexOf(h), b = a + h.length; return Function('return `' + raw.slice(b, raw.indexOf('`;', b)) + '`;')(); })();
  const guard = note => GD.checkAuraRequest({ system: [{ type: 'text', text: core }, { type: 'text', text: '\n' + note.replace(/^\n+/, '') }], messages: [{ role: 'user', content: 'Γεια.' }] }, GD.PROMPT_FINGERPRINTS, GD.REQUEST_LIMITS, shaHex);
  assert('(Λ) the screen filter and the guard of api/aura.js load', typeof LBL === 'function' && !!GD);
  assert('(Λ) controls: a block that is not one of the app\'s notes is refused (403), and a bracket that is no label stays on the screen',
    !!GD && (guard('[NOT ONE OF THE APP NOTES] x') || {}).status === 403 && typeof LBL === 'function' && LBL('[σημείωση] Τι σου ήρθε πρώτο;').text === '[σημείωση] Τι σου ήρθε πρώτο;');
  const NEW_NOTES = [
    ['(γ) level 3', (load(['describeEscalationCtx'], 'describeEscalationCtx') || (() => ''))(3)],
  ];
  const REPLY = 'Τι σου ήρθε πρώτο;';
  if (typeof LBL === 'function' && GD) for (const [k, n] of NEW_NOTES) {
    const r = LBL(n.trim() + '\n\n' + REPLY);
    assert('(Λ) ' + k + ': echoed above a reply, the filter takes it off whole — only the reply is shown', r.text === REPLY && r.count === 1);
    assert('(Λ) ' + k + ': a request carrying it passes the guard of api/aura.js unchanged', guard(n) === null);
  }
}

// ── (Ω) nothing else changed. Each change of this round, new → old, exactly as written (between the BEGIN/END marks; each commit of the
// round adds its own). With them taken out, src/App.jsx must be the file of release-candidate 50beff6, byte for byte. This is the proof
// behind the UPDATED fingerprint values of the earlier rounds' tests (John, 15/11/2026: only those values move). And the four things this
// round must not touch: the fixed prompt (b5f303cc9405aa21), api/aura.js, the openings its guard accepts, the screen filter.
{
  const UNDO = /* BEGIN UNDO */ [
    ["    case 2: return `\\n[ESCALATION LEVEL 2 (targeted follow-up) — CODE-VERIFIED: the stuck pattern has now persisted through Level 1. Per ESCALATION above, do not repeat Level 1's move — ask a sharper, targeted follow-up that builds on the previous answer.]\\n`;\n    // ADR «15 Νοεμβρίου» (γ) (John): level 3 no longer calls each turn «the final attempt» — with the switch open, before the root, it holds\n    // turn after turn (never AUTO-KILL, unchanged), and the same «last try» was asked again and again. Now: once, honestly, «it may not be\n    // found yet»; no pretended new try, no closing, no advice, no root. The ladder (computeEscalationLevel) and the other levels are unchanged.\n    case 3: return `\\n[ESCALATION LEVEL 3 (Perspective Swap) — CODE-VERIFIED: the stuck pattern has persisted through Levels 1 and 2. Be honest instead of presenting another try as new: if you have not already said it in this conversation, say once, in one plain sentence, that what really concerns them may not have been found yet. Then at most one short question, built only from their own words — Perspective Swap (ESCALATION above) only if it has not been tried in this stall; never the same question again in other words. No advice, road or step; do not name the root or push toward naming it; do not suggest ending the conversation. If this message also carries the note that a sign of heaviness or risk was seen, follow that note instead.]\\n`;\n    default: return `\\n[AUTO-KILL — CODE-VERIFIED: escalation attempts produced no movement. Per ESCALATION and GENERAL EXIT CRITERIA above, offer Graceful Exit now rather than a further attempt.]\\n`;\n", "    case 2: return `\\n[ESCALATION LEVEL 2 (targeted follow-up) — CODE-VERIFIED: the stuck pattern has now persisted through Level 1. Per ESCALATION above, do not repeat Level 1's move — ask a sharper, targeted follow-up that builds on the previous answer.]\\n`;\n    case 3: return `\\n[ESCALATION LEVEL 3 (Perspective Swap) — CODE-VERIFIED: the stuck pattern has persisted through Levels 1 and 2. Per ESCALATION above, this is the final attempt — apply Perspective Swap.]\\n`;\n    default: return `\\n[AUTO-KILL — CODE-VERIFIED: escalation attempts produced no movement. Per ESCALATION and GENERAL EXIT CRITERIA above, offer Graceful Exit now rather than a further attempt.]\\n`;\n"],
    ["}\n// ADR «15 Νοεμβρίου» (β) (John): OFF the safety path this note is no longer sent. It named the code note that came last in the collision\n// logger's order — in the stored runs #43–#70 the gates note 118 times, the safety-path note 39, the knowledge-state note 2, never a\n// strategy family of the prompt — and told the model to leave it while the gates note said it was still due. Its instruction is the\n// prompt's own EXPLORATION COVERAGE PRINCIPLE / WHICH FAMILY TO SWITCH TO, which stay, as do the notes that see a stall in the replies\n// themselves (self-repetition, stagnation, method failure). ON the safety path it stays exactly as it was until John decides (finding ζ).\nfunction describeLastFiredFamilyCtx(family, streak, offSafetyPath) {\n  if (offSafetyPath === true) return '';\n  if (!family || streak < 2) return ''; // nothing worth flagging until the SAME family has won twice or more\n", "}\nfunction describeLastFiredFamilyCtx(family, streak) {\n  if (!family || streak < 2) return ''; // nothing worth flagging until the SAME family has won twice or more\n"],
    ["}\n// ADR «15 Νοεμβρίου» (α) (John, finding 161 — the root card's silent arming): in Stage A a plain «Ναι» confirms readiness only when it\n// answers the readiness question asked RIGHT BEFORE it — the message just before the user's last one is AURA's own reply (not one of the\n// app's fixed STAGE_A texts) with that question. A «Ναι» to any other question later in the session no longer arms door 2, so the next\n// message is not taken as the root. Pure: it reads only the order of the messages; whether the answer is a plain «Ναι» stays the job of\n// detectsAffirmativeShort. auratests/test_notes_card_1511.js; browser: section NQ.\nfunction answersReadinessQuestion(msgs) {\n  const list = Array.isArray(msgs) ? msgs : [];\n  let u = list.length - 1;\n  while (u >= 0 && !(list[u] && list[u].role === \"user\")) u--;\n  const prev = u > 0 ? list[u - 1] : null;\n  return !!prev && prev.role === \"assistant\" && prev.msgMode !== \"STAGE_A\" && typeof prev.content === \"string\" && detectsCoreReadinessAsked(prev.content);\n}\n// ADR «12 Οκτωβρίου (γ)» (John): the «Ναι» to a yes/no question counts only in a CLEAR form — the same start words as before,\n", "}\n// ADR «12 Οκτωβρίου (γ)» (John): the «Ναι» to a yes/no question counts only in a CLEAR form — the same start words as before,\n"],
    ["          latchFlips: !coreReadinessConfirmed.current && !stageARef.current.phase && !reflectionDelivered.current && riskSignalKind.current !== 1 &&\n            (detectsSpontaneousCoreRecognition(lastUserText) || (coreReadinessAsked.current && detectsAffirmativeShort(lastUserText) && answersReadinessQuestion(msgs))),\n        })));\n", "          latchFlips: !coreReadinessConfirmed.current && !stageARef.current.phase && !reflectionDelivered.current && riskSignalKind.current !== 1 &&\n            (detectsSpontaneousCoreRecognition(lastUserText) || (coreReadinessAsked.current && detectsAffirmativeShort(lastUserText))),\n        })));\n"],
    ["      // try/catch, after this turn's `fired` array exists.\n      const lastFiredFamilyCtx = _crisisTurn ? '' : describeLastFiredFamilyCtx(lastFiredFamily.current.family, lastFiredFamily.current.streak, !_safetyPath); // ADR «15 Νοεμβρίου» (β)\n\n", "      // try/catch, after this turn's `fired` array exists.\n      const lastFiredFamilyCtx = _crisisTurn ? '' : describeLastFiredFamilyCtx(lastFiredFamily.current.family, lastFiredFamily.current.streak);\n\n"],
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
