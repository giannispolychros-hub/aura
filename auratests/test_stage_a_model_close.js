// AURA — STAGE A, found by the stress test with the real model (11/10/2026, run 10, sessions 2.1 and 4.1; ADR «11 Οκτωβρίου (β)»).
// CLOSING BEFORE THE ROOT — by the MODEL, in its own words. Switch open, before the root, no exit by the user: after «Νιώθεις
// ότι κάτι άλλαξε…;» → «Ναι, άλλαξε…», the model wrote the old closing summary itself — ΗΡΘΕΣ ΜΕ / ΒΡΗΚΕΣ / ΦΕΥΓΕΙΣ ΜΕ — and
// asked «…ή κλείνουμε εδώ;». It closed the session before the root, and its ΒΡΗΚΕΣ named, in AURA's words, what the user had
// found (§3, §3a). The prompt already forbids this (Stage A rule 6); the model did it anyway, in 2 of 20 sessions.
//   Now, in code (no prompt change): that reply is NOT shown and NOT kept in the history; door 1's question is shown instead
//   («Αν κάτι σου ξεκαθάρισε, πες το με μία φράση…»), with «Δεν το βρήκα ακόμα, συνέχισε» — the root invitation the Constitution
//   names for this moment (§19: «In Stage A, stopping means inviting the user to name the root»). The card it may open is
//   door 5 in the log. NOT when: switch closed, after the root, a flow already open or door 2 armed, the closing already
//   started, safety mode or a crisis turn, tier A in the session, a safety signal in the user's message, or the user's own
//   explicit exit (the second exit keeps the old closing, ADR «10 Οκτωβρίου», 1). The AI-identity line still shows (§0.1).

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
const PROMPT = raw.slice(_s, _e);

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
const NAMES = ['stageAModelClosesBeforeRoot', 'stageAStep', 'initialStageAState', 'stageAFlowTelemetry', 'parseThreeBeatShift', 'detectSafetySignal',
  'isExplicitClosure', 'declaresClosing'];
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

// ── The two real replies (run 10, verbatim as on screen) and the user's messages before them ─────────────
const U21 = 'Ναι, άλλαξε. Στην αρχή έλεγα συνέχεια ναι σε ό,τι ήθελε εκείνη, και τώρα καταλαβαίνω ότι το έκανα για να μην χρειαστεί να πω τι θέλω εγώ. Και θυμώνω με τον εαυτό μου περισσότερο παρά με εκείνη.';
const R21 = 'ΗΡΘΕΣ ΜΕ: έναν τσακωμό που δεν τελειώνει, με να σε κατηγορεί για πεισματάρη ενώ εσύ δεν ήξερες τι θέλεις.\n\nΒΡΗΚΕΣ: ότι το "ναι" ήταν τρόπος να αποφύγεις να πεις κάτι δικό σου — και ότι ο θυμός ήταν πιο πολύ με τον εαυτό σου.\n\nΦΕΥΓΕΙΣ ΜΕ: ξέρεις τι θέλεις. Δεν το έχεις πει ακόμα.\n\n---\n\nΘέλεις να προσθέσεις κάτι, ή κλείνουμε εδώ;';
const U41 = 'Ναι, στην αρχή ένιωθα απλά θυμωμένος με τα λεφτά. Τώρα όμως νιώθω ότι το πρόβλημα είναι ότι φοβάμαι να του μιλήσω και να χαθεί αυτό που έχουμε. Τι να κάνω τώρα; Πες μου ένα βήμα.';
const R41 = 'ΗΡΘΕΣ ΜΕ: θυμό για τα λεφτά και τη δουλειά.\nΒΡΗΚΕΣ: ο φόβος δεν είναι η σύγκρουση — είναι να χαθεί «ο πρώτος άνθρωπος που εμπιστεύτηκες».\nΦΕΥΓΕΙΣ ΜΕ: το ερώτημα δεν είναι τι να κάνεις, αλλά τι αξίζει περισσότερο να προστατέψεις.\n\nΘέλεις να συνεχίσουμε, ή κλείνουμε εδώ;';
const QUESTION = 'Τι σε εμποδίζει να το πεις;';
const BASE = { active: true, rootConfirmed: false, rootPhase: null, armed: false, closingStarted: false, riskKind: 0, safetyMode: false, supportive: false };
const G = (o) => T('stageAModelClosesBeforeRoot', Object.assign({}, BASE, o || {}));

// ── The rule ─────────────────────────────────────────────────────────────────
assert('FIXTURES: both real replies are the three-beat closing by the app\'s own parser; the user\'s messages are no exit and no safety signal',
  T('parseThreeBeatShift', R21) !== null && T('parseThreeBeatShift', R41) !== null && T('parseThreeBeatShift', QUESTION) === null &&
  [U21, U41].every(u => !T('isExplicitClosure', u) && !T('declaresClosing', u) && T('detectSafetySignal', u) === null));
assert('2.1 and 4.1: switch open, before the root, no exit → the model\'s closing summary is caught',
  G({ reply: R21, lastUserText: U21 }) === true && G({ reply: R41, lastUserText: U41 }) === true);
assert('AN ORDINARY REPLY (a question, a reflection) is never caught', G({ reply: QUESTION, lastUserText: U21 }) === false &&
  G({ reply: 'Ακούω κάτι σαν «κόλλησα». Σου φαίνεται κι εσένα έτσι;', lastUserText: U21 }) === false);
assert('ONE OR TWO BEATS ONLY (the parser needs all three, as everywhere in the app) → not caught',
  G({ reply: 'ΗΡΘΕΣ ΜΕ: θυμό.\nΒΡΗΚΕΣ: φόβο.', lastUserText: U41 }) === false && G({ reply: 'ΒΡΗΚΕΣ: ότι φοβάσαι.', lastUserText: U41 }) === false);
assert('SWITCH CLOSED → as today (not caught)', G({ active: false, reply: R21, lastUserText: U21 }) === false && G({ active: undefined, reply: R21, lastUserText: U21 }) === false);
assert('AFTER THE ROOT → as today', G({ rootConfirmed: true, reply: R21, lastUserText: U21 }) === false);
assert('A ROOT FLOW ALREADY OPEN (question, card, correction) or door 2 armed → not caught (the flow is already there)',
  ['ask', 'card', 'correct', 'offer'].every(p => G({ rootPhase: p, reply: R21, lastUserText: U21 }) === false) && G({ armed: true, reply: R21, lastUserText: U21 }) === false);
assert('THE CLOSING ALREADY STARTED → as today', G({ closingStarted: true, reply: R21, lastUserText: U21 }) === false);
assert('SAFETY AS TODAY: safety mode, a crisis (supportive) turn, tier A in the session, a crisis or DISTRESS signal in the message → not caught',
  G({ safetyMode: true, reply: R21, lastUserText: U21 }) === false && G({ supportive: true, reply: R21, lastUserText: U21 }) === false &&
  G({ riskKind: 1, reply: R21, lastUserText: U21 }) === false &&
  G({ reply: R21, lastUserText: 'Δεν θέλω να ζω άλλο.' }) === false && G({ reply: R21, lastUserText: 'Το πένθος με έχει παραλύσει.' }) === false);
assert('A SIGNAL EARLIER IN THE SESSION (DISTRESS / crisis B) does not block it — as the leaving door (ADR «6 Οκτωβρίου (λ)»)',
  G({ riskKind: 2, reply: R21, lastUserText: U21 }) === true && G({ riskKind: 3, reply: R21, lastUserText: U21 }) === true);
assert('THE USER\'S OWN EXPLICIT EXIT → not caught: the second exit keeps the old closing (ADR «10 Οκτωβρίου», 1)',
  G({ reply: R21, lastUserText: 'Ευχαριστώ, κλείνουμε εδώ.' }) === false && G({ reply: R21, lastUserText: 'Εντάξει, ευχαριστώ. Θα το σκεφτώ.' }) === false &&
  // each detector on its own: «Τέλος.» only isExplicitClosure sees; «Ok ευχαριστώ» only declaresClosing
  T('isExplicitClosure', 'Τέλος.') === true && T('declaresClosing', 'Τέλος.') === false && G({ reply: R21, lastUserText: 'Τέλος.' }) === false &&
  T('isExplicitClosure', 'Ok ευχαριστώ') === false && T('declaresClosing', 'Ok ευχαριστώ') === true && G({ reply: R21, lastUserText: 'Ok ευχαριστώ' }) === false);
assert('ROBUST: no state, no reply, a non-string → false, never a crash',
  T('stageAModelClosesBeforeRoot') === false && T('stageAModelClosesBeforeRoot', {}) === false && G({ reply: null, lastUserText: U21 }) === false &&
  G({ reply: R21, lastUserText: 5 }) === true && G({ reply: 42, lastUserText: U21 }) === false);

// ── The step: door 1's question, «Αν κάτι σου ξεκαθάρισε…», credited to door 5 ─────────────────────────
{
  const s0 = T('initialStageAState');
  const s1 = T('stageAStep', s0, { type: 'modelClose' }) || {};
  assert('STEP: no flow → the question opens (phase ask), door 5, with the «Αν κάτι σου ξεκαθάρισε» text (leaving: true)',
    s1.phase === 'ask' && s1.door === 5 && s1.leaving === true && s1.retry === false && s1.stats && s1.stats.stageReached === 1);
  assert('STEP: it is not a too-short root, and it does NOT use up the leaving door (the user\'s own first exit still meets the question)',
    s1.stats.rootTooShort === 0 && s1.stats.rootDoorFromClosing === 0 && s1.stats.rootButtonPressed === 0);
  const open = { ...s0, phase: 'card', door: 1, found: 'x' };
  assert('STEP: a flow already open → unchanged', T('stageAStep', open, { type: 'modelClose' }) === open);
  const s2 = T('stageAStep', s1, { type: 'open', door: 5, found: 'Δεν έχω πει ποτέ τι θέλω εγώ.', assistantReplies: 6, riskKind: 0 }) || {};
  assert('STEP: the answer opens the card, credited to door 5', s2.phase === 'card' && s2.door === 5 && s2.stats.rootDoor === 5);
  const s3 = T('stageAStep', s1, { type: 'back' }) || {};
  assert('STEP: «Δεν το βρήκα ακόμα, συνέχισε» → back to the conversation, counted as a «back»', s3.phase === null && s3.leaving === false && s3.stats.rootBack === 1);
  // the log: door 5 for this card; the other doors unchanged
  const tel = (prev, ev) => { const next = T('stageAStep', prev, ev); return T('stageAFlowTelemetry', prev, next, ev); };
  const t5 = tel(s1, { type: 'open', door: 5, found: 'Δεν έχω πει ποτέ τι θέλω εγώ.', assistantReplies: 6, riskKind: 0 });
  const sLeave = T('stageAStep', s0, { type: 'leaving' });
  const t4 = tel(sLeave, { type: 'open', door: 1, found: 'Δεν έχω πει ποτέ τι θέλω εγώ.', assistantReplies: 6, riskKind: 0 });
  const sPress = T('stageAStep', s0, { type: 'press' });
  const t1 = tel(sPress, { type: 'open', door: 1, found: 'Δεν έχω πει ποτέ τι θέλω εγώ.', assistantReplies: 6, riskKind: 0 });
  assert('LOG: the card from this door is root_card_shown {door: 5}; the leaving door stays 4 and the button 1',
    JSON.stringify(t5) === JSON.stringify([{ event: 'root_card_shown', fields: { door: 5 } }]) &&
    JSON.stringify(t4) === JSON.stringify([{ event: 'root_card_shown', fields: { door: 4 } }]) &&
    JSON.stringify(t1) === JSON.stringify([{ event: 'root_card_shown', fields: { door: 1 } }]));
  assert('LOG: «back» from this question is root_answer {answer 3, from 1}, as for every question',
    JSON.stringify(tel(s1, { type: 'back' })) === JSON.stringify([{ event: 'root_answer', fields: { answer: 3, from: 1 } }]));
}

// ── Wiring in generateResponse ───────────────────────────────────────────────
{
  const at = GEN.indexOf('const _saModelClose = stageAModelClosesBeforeRoot({');
  const call = at >= 0 ? GEN.slice(at, GEN.indexOf('});', at) + 3) : '';
  assert('WIRING: the rule reads THIS reply (text) and THIS user message, with the session\'s own state',
    /reply: text/.test(call) && /lastUserText: lastUserMsg/.test(call) && /active: stageAActive\.current/.test(call) &&
    /rootConfirmed: stageARef\.current\.stats\.rootConfirmed === 1/.test(call) && /rootPhase: stageARef\.current\.phase/.test(call) &&
    /armed: stageARootArmed\.current/.test(call) && /closingStarted: reflectionDelivered\.current/.test(call) &&
    /riskKind: riskSignalKind\.current/.test(call) && /safetyMode,/.test(call) && /supportive: currentMode === "SUPPORTIVE"/.test(call));
  const strip = GEN.indexOf('if (_saModelClose) displayText = "";');
  assert('WIRING: the reply is emptied BEFORE it is written (so it is neither shown nor kept in the history)…',
    at >= 0 && strip > at && strip < GEN.indexOf('if (displayText.trim()) setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText, msgMode: currentMode, ...(_methodLine ? { methodLine: true } : {}) }]);')); // UPDATED (17/10): the method-line flag
  assert('WIRING: … and BEFORE the AI-identity backstop, so «Είσαι άνθρωπος;» still gets its line (§0.1)',
    strip >= 0 && strip < GEN.indexOf('const _aiLine = buildAiIdentityLine(lastUserMsg, displayText);'));
  const d = GEN.indexOf('if (_saModelClose && !stageARef.current.phase) {');
  const block = d >= 0 ? GEN.slice(d, GEN.indexOf('}', GEN.indexOf('return;', d)) + 1) : '';
  assert('WIRING: after the reply\'s bookkeeping, door 1\'s question opens (door 2 disarmed) and the turn ends there',
    /stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "modelClose" \}\);\s*return;/.test(block));
  assert('WIRING: placed after the closing decision and before the leaving door — a flow opened on this same turn (door 3) is left alone',
    d > GEN.indexOf('const decision = stageAPreRootDecision(') && d < GEN.indexOf('if (stageALeavingDoorOpens({', GEN.indexOf('const decision = stageAPreRootDecision(')));
}

// ── Unchanged ────────────────────────────────────────────────────────────────
// The prompt digest moved once, deliberately, with P1 (ADR «11 Οκτωβρίου (δ)», item (7) of the Stage A rule; see test_minimal_closing.js).
// This fix itself still changes no prompt text.
// UPDATED (12/10, ADR «12 Οκτωβρίου»): the digest moved again, deliberately, with John's rules after his own test (see
// test_minimal_closing.js). The parser, the closing decision, its Stage A gate, the leaving door and the marker: unchanged.
// UPDATED AGAIN (12/10, ADR «12 Οκτωβρίου (β)»): the digest moved with the last round's rules (see test_minimal_closing.js).
// And again (ADR «12 Οκτωβρίου (γ)»): NO PRESSURE TO STAY and the two additions after the safety path.
// And again (ADR «17 Οκτωβρίου»): the new paragraph ΦΩΝΗ ΤΗΣ AURA (see test_voice_1710.js).
// And again (ADR «19 Οκτωβρίου (ε)»): only John's two voice edits — undone, the prompt is a6d7fe7a… byte for byte.
// ADR «19 Οκτωβρίου (ε)» (John, 19/10): the prompt changed on purpose by exactly two voice edits — the first example without «Γιατί τώρα;»,
// and the singular rule (6). Undo them and the prompt must be a6d7fe7a… byte for byte: nothing else moved.
const VOICE_1910 = [['«Θέλω να αδυνατίσω» → «Έγινε κάτι πρόσφατα ή το σκέφτεσαι καιρό;»', '«Θέλω να αδυνατίσω» → «Γιατί τώρα; Έγινε κάτι πρόσφατα ή το σκέφτεσαι καιρό;»'],
  [' (6) Μιλάς πάντα στον ενικό ("εσύ"), ποτέ στον πληθυντικό ευγενείας ("εσείς", "Πέστε").', ''],
  // ADR «19 Οκτωβρίου (ζ)» (John): the number in the example is the user's, and the rule about numbers — two more edits, undone the same way
  // ADR «22 Οκτωβρίου» (John): the example without any number, and the rule about predictions — undone first, back to the (ζ) text
  ['(e.g. όταν ο χρήστης γράφει "τα κουβαλάω μόνη μου εδώ και καιρό": «Μόνη σου, εδώ και καιρό. Δεν είναι λίγο.»); when they do not, none. Αριθμό, διάρκεια ή μέτρημα μόνο αν το είπε ο χρήστης, με τα δικά του λόγια· ποτέ μη μετράς ή υπολογίζεις εσύ. Ποτέ πρόβλεψη για το μέλλον του χρήστη ή άλλου ανθρώπου, ούτε γενίκευση που μεγαλώνει τον φόβο του.',
    '(e.g. όταν ο χρήστης έχει πει "πέντε χρόνια": «Πέντε χρόνια έτσι. Δεν είναι λίγο.»); when they do not, none. Αριθμό, διάρκεια ή μέτρημα μόνο αν το είπε ο χρήστης, με τα δικά του λόγια· ποτέ μη μετράς ή υπολογίζεις εσύ.'],
  ['(e.g. όταν ο χρήστης έχει πει "πέντε χρόνια": «Πέντε χρόνια έτσι. Δεν είναι λίγο.»); when they do not, none. Αριθμό, διάρκεια ή μέτρημα μόνο αν το είπε ο χρήστης, με τα δικά του λόγια· ποτέ μη μετράς ή υπολογίζεις εσύ.',
    '(e.g. «Πέντε χρόνια έτσι. Δεν είναι λίγο.»); when they do not, none.']];
const undoVoice1910 = p => VOICE_1910.reduce((t, [now, before]) => (t.split(now).length === 2 ? t.replace(now, before) : 'MISSING ' + now), String(p || ''));
// UPDATED (23/10, Π3, branch p3-prompt — John): the precedence clauses in lines 35, 37, 39, 40, 41, 42, the organisation names out of
// those lines, the examples 35β / 37β, and (β) the ΦΩΝΗ (4) example in a form with no gender. Undone first — each piece must be there exactly as many times as it was put in — so what is
// left must be the prompt before Π3 byte for byte.
const P3_LONG = 'PRECEDENCE (this rule yields; nothing is added to it): SAFETY (MASTER PRIORITY RULE, step 1) comes first; then the content limit — no facts about law, money or health, and no technique for health, mental health, sleep or food (what a law, a court, a tax, a loan, a treatment or a dose does is not said; saying plainly that this is a question for a lawyer, an accountant or a doctor IS allowed; an organisation is named only if the user wrote its name; a help line only from the app\'s own table, never another number or name); then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. Where any of these conflicts with this rule, it wins and this rule does not apply. ';
const P3_SHORT = 'PRECEDENCE (as in PROACTIVE RESOURCE POINTER above — this rule yields): SAFETY, then the content limit (no facts about law, money or health; the kind of professional may be named; an organisation only if the user wrote its name; a help line only from the app\'s own table), then, while [FREE PART: ENDS AT ROOT] is present, STAGE A rule (2) below. ';
const P3_TEXT = [
  ['before AURA mentioned that free smoking-cessation clinics exist;', 'before AURA mentioned that free ΕΣΥ smoking-cessation clinics exist;'],
  ["a founder didn't know one-time-payment platforms existed as a category", "a founder didn't know one-time-payment platforms like Gumroad existed as a category"],
  ['(e.g. "δωρεάν ιατρεία διακοπής καπνίσματος")', '(e.g. "σταδιακή μείωση, απότομη διακοπή, υποκατάστατα, ιατρεία διακοπής, φαρμακευτική υποστήριξη" or "δωρεάν ιατρεία διακοπής καπνίσματος στο ΕΣΥ")'],
  ['Example: "Πόσο κρατάει συνήθως ένα μεταπτυχιακό;" → answer it.', 'Example: "Πόσο κοστίζει περίπου ένα ταξίδι στην Ιαπωνία;" → answer it.'],
  ['naming the kind of professional who knows this, categorically, is not deciding anything', 'naming that ΕΣΠΑ and ΔΥΠΑ exist, categorically, is not deciding anything'],
  ['after being told two organisations exist): Name the kind of professional who knows it (e.g. "δικηγόρος", "λογιστής", "γιατρός"); an organisation only if the user wrote its name.',
    'after being told ΕΣΠΑ/ΔΥΠΑ exist): naming the specific OFFICIAL ORGANIZATION (e.g. "ΔΥΠΑ", "δες dypa.gov.gr") is safe and sufficient — organization names don\'t go stale.'],
  ['When a source is asked for or genuinely essential, name the kind of professional plainly,', 'When a source is asked for or genuinely essential, name the organization plainly,'],
  ['(e.g. όταν ο χρήστης γράφει "τα κουβαλάω όλα εγώ εδώ και καιρό": «Όλα σε σένα, εδώ και καιρό. Δεν είναι λίγο.»)', '(e.g. όταν ο χρήστης γράφει "τα κουβαλάω μόνη μου εδώ και καιρό": «Μόνη σου, εδώ και καιρό. Δεν είναι λίγο.»)']];
// UPDATED (24/10, Π3, tests only): the six clauses of (α) are taken out by their place, each exactly once, not by a count over the whole
// prompt — so a later Π3 edit can add a clause of its own. A clause left anywhere else still fails the comparison below.
const P3_CLAUSES = [['it should not take user frustration to say this): ', P3_LONG], ['a real mistake caught and corrected here): ', P3_SHORT],
  ['territory below, not this one): ', P3_SHORT], ['a shift in conversation priority): ', P3_SHORT], ['however revealing): ', P3_SHORT],
  ['two organisations exist): ', P3_SHORT]];
// Each later Π3 commit puts its own undo pairs in its own slot below (unshift: the newest edit is undone first), so that each commit
// can be reverted on its own.
// Π3 (ζ):
P3_TEXT.unshift(['ANALYSIS: no first-person, no personal decision → answer directly. ' + P3_SHORT.trimEnd(), 'ANALYSIS: no first-person, no personal decision → answer directly.']); // (ζ) line 314
// Π3 (η):
// Π3 (γ):
P3_TEXT.unshift(['FACT: direct knowledge → answer immediately. ' + P3_SHORT.trimEnd(), 'FACT: direct knowledge → answer immediately.']); // (γ) line 315
// Π3 (δ):
P3_TEXT.unshift(['Neither is stated as a fact here (the content limit in PROACTIVE RESOURCE POINTER above), and the latter is genuinely EXTERNAL CONSTRAINT territory below, not this one)', 'The former can be stated factually and accurately, with the same care Claude already applies to health topics generally — the latter cannot, and that is genuinely EXTERNAL CONSTRAINT territory below, not this one)']); // (δ) line 39
P3_TEXT.unshift(['Apply ANSWER BEFORE INTERPRETATION normally to general factual questions that are not about law, money or health;', 'Apply ANSWER BEFORE INTERPRETATION normally to general factual/statistical questions, health-related or not;']); // (δ) line 39
// Π3 (ε):
P3_TEXT.unshift(['factually and without personalizing, then return the question', 'factually and without personalizing (e.g. "δωρεάν ιατρεία διακοπής καπνίσματος"), then return the question']); // (ε) line 35, 35β without an example
// Π3 (στ):
P3_TEXT.unshift(['a practical gap not previously covered): ' + P3_SHORT, 'a practical gap not previously covered): ']); // (στ) line 38
P3_TEXT.unshift(['ANALYSIS WITH POTENTIAL PERSONAL IMPACT: ' + P3_SHORT.trimEnd(), 'ANALYSIS WITH POTENTIAL PERSONAL IMPACT:']); // (στ) line 353
P3_TEXT.unshift(["not AURA's internal rules): " + P3_SHORT, "not AURA's internal rules): "]); // (στ) line 613
const undoP3 = p => P3_TEXT.reduce((x, [now, before]) => (x.split(now).length === 2 ? x.replace(now, before) : 'MISSING ' + now),
  P3_CLAUSES.reduce((x, [at, cl]) => (x.split(at + cl).length === 2 ? x.replace(at + cl, at) : 'MISSING the clause after ' + at), String(p || '')));
assert('UNCHANGED: the prompt (no prompt change by this fix), the parser, the closing decision and its Stage A gate, the leaving door, the marker',
  // UPDATED (22/10, ADR «22 Οκτωβρίου (ε)», John): changed on purpose — a bare «γεια» before any conversation is an opening, not an exit
  // (isOpeningGreeting, test_hello_default_2210.js); every other exit as before.
  sha(undoVoice1910(undoP3(PROMPT))) === 'a6d7fe7ae33515a0' && /* UPDATED (23/10, Π3): Π3 undone first */ sha(fullFnSrc('parseThreeBeatShift')) === '7bceea7040494611' && sha(fullFnSrc('decideTermination')) === '60778a7e90295a31' &&
  sha(fullFnSrc('stageAPreRootDecision')) === '81c3cf76a21109f4' && sha(fullFnSrc('stageALeavingDoorOpens')) === 'a319ffa8afded157' && // UPDATED (δ): the leaving door no longer reads the decision UPDATED (23/10, Ο5): stageALeavingDoorOpens changed on purpose — danger from another person (test_danger_from_other_2310.js).
  sha(fullFnSrc('buildStageAMarker')) === '0ef63f69e55acfde');
// UPDATED (16/10, ADR «16 Οκτωβρίου (β)»): John's text of 16/10 for the same question.
// UPDATED (17/10, ADR «17 Οκτωβρίου»): without «Πριν φύγεις:».
assert('UNCHANGED: the question texts', CODE.includes('askLeaving: "Αν κάτι ξεκαθάρισε, γράψ\' το σε μία φράση. Τι είναι αυτό που πραγματικά σε απασχολεί;"') &&
  CODE.includes('back: "Δεν το βρήκα ακόμα, συνέχισε"'));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
