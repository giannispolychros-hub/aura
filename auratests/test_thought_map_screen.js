// AURA — THOUGHT MAP, phase 2: the screen (John, 2/11/2026; ADR «2 Νοεμβρίου (β)»). At the very END of the existing flow (phase "done":
// the step, the clarity question, the word and the closing are over), display only: the root on top, «Τα λόγια σου στη διαδρομή» (2–3
// branches from pickBranches, or nothing at all), «Πώς μπήκες», the step, and «Ωραία, το πρώτο επόμενο βήμα είναι αυτό.» only with a
// written step. No model call, nothing stored, sent, logged, copied or downloaded.
//  (Α) when it shows — and every place it must NOT (any safety stop)   (Β) what it shows, from where   (Γ) the screen block in the code
//  (Δ) every data path: messages / uiBubbles, telemetry, the tester export, copy / download, memory and consent, the API, console
//  (Ε) what did not change: safety, flow, telemetry, export and memory functions byte-identical to main 24aab8e; prompt; api/aura.js
// All text here is synthetic.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
const h16 = s => sha(s).slice(0, 16);
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1);
  const line = raw.slice(a + 1, eol); if (/;\s*(?:\/\/.*)?$/.test(line)) return line;
  const close = raw[raw.indexOf(' = ', a) + 3] === '{' ? '\n};' : '\n];'; return raw.slice(a + 1, raw.indexOf(close, a) + 3); };
const CONSTS = ['HELPLINES', 'KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_DISMISSALS', 'BRANCH_MAX', 'BRANCH_MAX_CHARS', 'BRANCH_JACCARD', 'BRANCH_ABBREVIATIONS',
  'BRANCH_DISMISS_START', 'BRANCH_HEAVY_WORDS', 'BRANCH_CONTENT_WORDS', 'THOUGHT_MAP_TEXTS'];
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'branchSentenceSpans', 'branchAuraEndsWithQuestion', 'branchWords', 'branchJaccard', 'branchSessionSafe',
  'pickBranches', 'thoughtMapView', 'thoughtMapCapFirst', 'thoughtMapRecFields', 'recordTelemetry', 'buildTesterExport'];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ', THOUGHT_MAP_TEXTS };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const view = o => { try { return F.thoughtMapView(o); } catch (e) { return 'threw: ' + e.message; } };

// a finished Stage A session (synthetic)
const U = t => ({ role: 'user', content: t });
const A = t => ({ role: 'assistant', msgMode: 'ANSWER', content: t });
const ASK = { role: 'assistant', msgMode: 'STAGE_A', content: 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;' };
const ENTRY = 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει.';
const ROOT_T = 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου.';
const B1 = 'Ο μισθός είναι καλός και φοβάμαι την αλλαγή.', B2 = 'Η μητέρα μου πιστεύει ότι πρέπει να μείνω εκεί για πάντα.',
  B3 = 'Κάθε πρωί σηκώνομαι με βάρος στο στομάχι για το γραφείο.';
const atCard = n => [U(ENTRY), ...[B1, B2, B3].slice(0, n).flatMap((b, i) => [A('Ερώτηση ' + (i + 1) + ';'), U(b)]), ASK, U(ROOT_T)];
const after = [{ role: 'assistant', msgMode: 'STAGE_A', content: 'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.' }, U('Θάρρος'),
  { role: 'assistant', msgMode: 'TERMINATION', isTermination: true, content: 'Καλή συνέχεια.' }];
const stage = (o) => Object.assign({ phase: 'done', found: ROOT_T, knew: 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει', knewTruncated: false,
  riskOffer: false, step: 'Να στείλω μήνυμα στη Μαρία για καφέ.', when: 'Αύριο το απόγευμα.', stepEnd: 'card', stats: { rootConfirmed: 1 } }, o || {});
const base = (n, o) => Object.assign({ active: true, phase: 'done', loading: false, stage: stage(), messagesAtCard: atCard(n), allMessages: atCard(n).concat(after),
  riskKind: 0, dangerFromOther: false, safetyMode: false, crisisFallback: null }, o || {});

assert('(load) the functions and John\'s texts load from src/App.jsx', FNS.every(n => typeof F[n] === 'function') && !!F.THOUGHT_MAP_TEXTS);
// CHANGED (John, 2/11/2026, the look of the screen): + the label «Η ΡΙΖΑ» over the root (kept as «Η ρίζα», drawn in capitals by the app's label style)
assert('(load) John\'s texts, word for word', JSON.stringify(F.THOUGHT_MAP_TEXTS) === JSON.stringify({ rootLabel: 'Η ρίζα', rootNote: 'Αυτή είναι η ρίζα που αναγνώρισες και επιβεβαίωσες.',
  branchesTitle: 'Τα λόγια σου στη διαδρομή', knewTitle: 'Πώς μπήκες', closing: 'Ωραία, το πρώτο επόμενο βήμα είναι αυτό.' }));

// ── (Α) when ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const v = view(base(3));
  assert('(Α) the end of a normal session with a written step → the screen', !!v && typeof v === 'object');
  assert('(Α) only at the very end (phase "done"): never on the step\'s questions, the clarity question or the word',
    ['step', 'fits', 'smaller', 'when', 'clarity', 'word', 'card', 'ask', null, 'stopped', 'offer', 'notReady'].every(ph => view(base(3, { phase: ph })) === null));
  assert('(Α) not while a reply is loading (the closing first, then the screen)', view(base(3, { loading: true })) === null);
  assert('(Α) not with the switch closed (old flow)', view(base(3, { active: false })) === null);
  assert('(Α) not without a confirmed root, nor without the step flow (stepEnd "card" or "none")',
    view(base(3, { stage: stage({ stats: { rootConfirmed: 0 } }) })) === null && view(base(3, { stage: stage({ stepEnd: '' }) })) === null);
  assert('(Α) SAFETY: never where the step is not allowed today — the risk end of «Ναι» (tier B / DISTRESS: riskOffer)', view(base(3, { stage: stage({ riskOffer: true }) })) === null);
  assert('(Α) SAFETY: never with the latch — crisis A (1), crisis B (2), DISTRESS (3), danger from another, safety mode, the failed-call crisis line',
    [{ riskKind: 1 }, { riskKind: 2 }, { riskKind: 3 }, { dangerFromOther: true }, { safetyMode: true }, { crisisFallback: { line: 'x' } }].every(o => view(base(3, o)) === null));
  assert('(Α) SAFETY: the crisis and danger messages used here ARE caught by the app\'s unchanged detectors',
    F.detectSafetySignal('Δεν θέλω να ζω άλλο.') === 'CRISIS' && !!F.detectsDangerFromOther('Ο σύντροφός μου με χτυπάει όταν πίνει.'));
  assert('(Α) SAFETY: never when ANY message of the session (also after the card) carries a crisis or danger signal',
    view(base(3, { allMessages: atCard(3).concat(after, [U('Δεν θέλω να ζω άλλο.')]) })) === null &&
    view(base(3, { allMessages: atCard(3).concat([U('Ο σύντροφός μου με χτυπάει όταν πίνει.')], after) })) === null);
  assert('(Α) SAFETY: never when AURA\'s own message refers to help (a help-line number, a psychologist, a supportive reply)',
    view(base(3, { allMessages: atCard(3).concat(after, [A('Αν χρειαστείς, υπάρχει το 10306.')]) })) === null &&
    view(base(3, { allMessages: atCard(3).concat(after, [A('Ένας ψυχολόγος ίσως βοηθούσε.')]) })) === null &&
    view(base(3, { allMessages: atCard(3).concat(after, [{ role: 'assistant', msgMode: 'SUPPORTIVE', content: 'Είμαι εδώ.' }]) })) === null);
  assert('(Α) any input → null or a view, never throws', [undefined, null, {}, { active: true }, base(3, { stage: null }), base(3, { messagesAtCard: null }), base(3, { allMessages: 5 })]
    .every(o => { const r = view(o); return r === null || (r && typeof r === 'object' && Array.isArray(r.branches)); }));
}

// ── (Β) what ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const v = view(base(3));
  assert('(Β) the root is «Τι βρήκες», as confirmed, whole', v.root === ROOT_T);
  assert('(Β) 3 branches, in time order, the user\'s own words exactly', JSON.stringify(v.branches) === JSON.stringify([B1, B2, B3]));
  assert('(Β) 2 branches → both', JSON.stringify(view(base(2)).branches) === JSON.stringify([B1, B2]));
  assert('(Β) 0 or 1 → an empty list: the section is not shown at all', view(base(0)).branches.length === 0 && view(base(1)).branches.length === 0 && view(base(1)) !== null);
  assert('(Β) the branches come ONLY from the messages up to the card — nothing typed later (the word) is a branch',
    !view(base(3)).branches.includes('Θάρρος') && view(base(0, { allMessages: atCard(0).concat([A('Κι άλλη ερώτηση;'), U('Κάθε πρωί σηκώνομαι με βάρος στο στομάχι για το γραφείο.')], after) })).branches.length === 0);
  // isolated: two more question-and-answer pairs AFTER the card (the step's own words never reach `messages`, but anything that did must
  // not become a branch) — only the one branch before the card exists, so nothing is shown
  assert('(Β) answers typed after the card never become branches (only the messages up to the card count)',
    view(base(1, { allMessages: atCard(1).concat([A('Κι άλλη ερώτηση;'), U(B2), A('Και μια ακόμα;'), U(B3)], after) })).branches.length === 0);
  assert('(Β) «Πώς μπήκες» is the card\'s «Τι ήξερες», with «…» when it was cut; none → no section',
    v.knew === 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει' && view(base(3, { stage: stage({ knewTruncated: true }) })).knew.endsWith('…') &&
    view(base(3, { stage: stage({ knew: null }) })).knew === null);
  assert('(Β) the step and «Πότε» are the user\'s words as the flow kept them; the closing line only with a written step',
    v.step === 'Να στείλω μήνυμα στη Μαρία για καφέ.' && v.when === 'Αύριο το απόγευμα.' && v.closing === true);
  const none = view(base(3, { stage: stage({ stepEnd: 'none', step: '', when: '' }) }));
  assert('(Β) «Δεν ξέρω ακόμα» at the step → the screen without a step and without the closing line', !!none && none.step === '' && none.when === '' && none.closing === false);
  const odd = view(base(3, { stage: stage({ stepEnd: 'none', step: 'κάτι', when: 'κάποτε' }) }));
  assert('(Β) with «Δεν ξέρω ακόμα» at the step (stepEnd "none") no step, no «Πότε», no closing line — whatever else the state holds',
    !!odd && odd.step === '' && odd.when === '' && odd.closing === false);
  const noWhen = view(base(3, { stage: stage({ when: '' }) }));
  assert('(Β) a step with «Δεν ξέρω ακόμα» at «Πότε» → the step, no «Πότε», the closing line', noWhen.step !== '' && noWhen.when === '' && noWhen.closing === true);
  assert('(Β) the view carries only these fields', JSON.stringify(Object.keys(v)) === JSON.stringify(['root', 'branches', 'knew', 'step', 'when', 'closing']));
}

// ── (Γ) the screen block in the code ────────────────────────────────────────────────────────────────────────────────────────────
const blockA = raw.indexOf('{/* THOUGHT MAP (John, 2/11/2026');
const blockB = raw.indexOf('{/* ADR «17 Οκτωβρίου (δ)», (ε): not while the step\'s questions are open', blockA);
const JSX = blockA > 0 && blockB > blockA ? raw.slice(blockA, blockB) : '';
const VIEW = fnSrc('thoughtMapView') + fnSrc('branchSessionSafe') + fnSrc('pickBranches');
{
  assert('(Γ) one screen block, inside Stage A\'s own UI, right before the copy / download buttons', !!JSX && raw.indexOf('{/* STAGE A UI — BEGIN */}') < blockA && blockA < raw.indexOf('{/* STAGE A UI — END */}'));
  // CHANGED (John, 2/11/2026, the look): the root is a card of its own — a frame and a gold tint — with the label «Η ΡΙΖΑ» over it, the
  // root in the app's serif at 22px (was 17px, no card), John's line under it
  const rootCard = JSX.slice(JSX.indexOf('data-tm-root="1"'), JSX.indexOf('{thoughtMap.branches.length'));
  assert('(Γ) the root first, a card of its own and the strongest thing on the screen: «Η ΡΙΖΑ», the root (22px, the gold of the app), John\'s line',
    JSX.indexOf('data-tm-root') < JSX.indexOf('data-tm-branches') && /data-tm-root="1" style=\{\{border:"1px solid rgba\(201,168,76,0\.5\)",background:"rgba\(201,168,76,\.08\)"/.test(JSX) &&
    rootCard.indexOf('THOUGHT_MAP_TEXTS.rootLabel') < rootCard.indexOf('{thoughtMap.root}') && rootCard.indexOf('{thoughtMap.root}') < rootCard.indexOf('THOUGHT_MAP_TEXTS.rootNote') &&
    /data-tm-root-text="1" style=\{\{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px"[^}]*color:"var\(--gold-text\)"/.test(JSX) &&
    Math.max(...(JSX.match(/fontSize:"(\d+)px"/g) || []).map(x => +x.match(/\d+/)[0])) === 22);
  assert('(Γ) the heading «Τα λόγια σου στη διαδρομή» and the branches only with 2 or more — otherwise nothing (no empty box, no dash)',
    /\{thoughtMap\.branches\.length >= 2 && \(\s*<div data-tm-branches="1"/.test(JSX) && !/[—–-]\s*<\/div>|>\s*[—–]\s*</.test(JSX));
  // CHANGED (John, 2/11/2026, the look): the root card and each branch now have a frame of their own — still NO line, arrow or trunk
  // between them: no svg, no arrow sign, no one-sided border (a line), no frame or fill on the branches' own container, no pseudo-element
  const mid = JSX.slice(JSX.indexOf('data-tm-root'), JSX.indexOf('data-tm-step')).replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  assert('(Γ) no line, arrow or trunk ties a branch to the root: frames only around the root card and around each branch, nothing between',
    !/<svg|<img|<canvas|→|←|↑|↓|➝|⟶|▶/i.test(mid) && !/border(?:Left|Right|Top|Bottom)|::before|::after|linear-gradient/.test(JSX) &&
    (mid.match(/border:/g) || []).length === 2 && /data-tm-branches="1" style=\{\{marginBottom:"24px"\}\}/.test(JSX) &&
    /data-tm-branch="1" style=\{\{border:"1px solid #2a2a2a",borderRadius:"4px"/.test(JSX));
  // CHANGED (John, 2/11/2026, the look): «Πώς μπήκες» a block of its own; «Τι θα κάνεις» / «Πότε» inside one frame (was: below a rule); the
  // closing line after that frame, larger and calmer, without a frame (it still shows only with a written step)
  assert('(Γ) order: root, branches, «Πώς μπήκες», the step, the closing line', ['data-tm-root', 'data-tm-branches', 'data-tm-knew', 'data-tm-step', 'data-tm-closing']
    .map(k => JSX.indexOf(k)).every((x, i, a) => x > 0 && (i === 0 || x > a[i - 1])));
  assert('(Γ) «Πώς μπήκες» a block of its own (a filled block, no frame), after the branches',
    /data-tm-knew="1" style=\{\{background:"var\(--border-mid\)",borderRadius:"4px"/.test(JSX) && JSX.indexOf('data-tm-knew') > JSX.indexOf('data-tm-branches'));
  const stepBox = JSX.slice(JSX.indexOf('data-tm-step="1"'), JSX.indexOf('{thoughtMap.closing &&'));
  assert('(Γ) «Τι θα κάνεις» and «Πότε» inside ONE frame, apart from the exploration',
    /data-tm-step="1" style=\{\{border:"1px solid rgba\(201,168,76,0\.25\)",borderRadius:"4px"/.test(JSX) && stepBox.includes('STAGE_A_TEXTS.doLabel') && stepBox.includes('STAGE_A_TEXTS.whenLabel') &&
    (stepBox.match(/<\/div>/g) || []).length === (stepBox.match(/<div[\s>]/g) || []).length + 1); // the frame is closed BEFORE the closing line
  assert('(Γ) the closing line: after the frame, without a frame, larger (20px, the app\'s serif) and calmer',
    /\{thoughtMap\.closing && <div data-tm-closing="1" style=\{\{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px"/.test(JSX) &&
    !/border|background/.test((JSX.match(/data-tm-closing="1" style=\{\{[^}]*\}\}/) || [''])[0]));
  assert('(Γ) the closing line only with a written step', /\{thoughtMap\.closing && <div data-tm-closing="1"/.test(JSX));
  assert('(Γ) in the normal flow of the page — no fixed / absolute / sticky position, no z-index — so it can never cover the crisis or danger box',
    !/position|zIndex|z-index|transform/.test(JSX.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')));
  assert('(Γ) long words wrap (no horizontal scroll on a small phone)', (JSX.match(/overflowWrap:"anywhere"/g) || []).length >= 5);
  // NEW (John, 2/11/2026, the look): ONLY the app's existing colours, fonts and label styles — every colour, font and class of the screen
  // is found in the app outside the Thought Map pieces
  const code = JSX.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const rest = raw.replace(JSX, '').replace(raw.slice(raw.indexOf('// THOUGHT MAP, phase 1'), raw.indexOf("// A root typed into the flow (door 1's answer")), '');
  const colours = [...new Set(code.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|var\(--[a-z-]+\)/g) || [])];
  const fonts = [...new Set((code.match(/fontFamily:"([^"]+)"/g) || []).map(x => x.slice(12, -1)))];
  const classes = [...new Set((code.match(/className="([^"]+)"/g) || []).map(x => x.slice(11, -1)))];
  const missing = [...colours.filter(c => !rest.includes(c.startsWith('var(') ? c.slice(4, -1) + ':' : c)), ...fonts.filter(f => !rest.includes('font-family:' + f)),
    ...classes.filter(c => !rest.includes('.' + c + '{'))];
  assert('(Γ) only the app\'s existing colours, fonts and label styles' + (missing.length ? ' — new: ' + missing.join(', ') : ''),
    colours.length >= 8 && fonts.length === 1 && classes.length >= 2 && missing.length === 0);
  assert('(Γ) «Πώς μπήκες» goes through thoughtMapCapFirst on the screen — and nothing else does (the root, the branches and the step as typed)',
    (code.match(/thoughtMapCapFirst\(/g) || []).length === 1 && /«\{thoughtMapCapFirst\(thoughtMap\.knew\)\}»/.test(code) && !/thoughtMapCapFirst/.test(fnSrc('thoughtMapView')) &&
    (raw.match(/thoughtMapCapFirst\(/g) || []).length === 2);
}
// NEW (John, 2/11/2026): «Πώς μπήκες» starts with a capital on the screen, only where the user's text allows it without changing content
{
  const C = t => { try { return F.thoughtMapCapFirst(t); } catch (e) { return 'threw'; } };
  assert('(Γ) a small Greek first letter becomes its capital — with or without its accent', C('θέλω να αλλάξω δουλειά') === 'Θέλω να αλλάξω δουλειά' &&
    C('άλλο ήθελα') === 'Άλλο ήθελα' && C('ήξερα από πριν…') === 'Ήξερα από πριν…' && C('ωραία') === 'Ωραία');
  assert('(Γ) … only the first letter; nothing else changes (length, the rest of the text)', ['θέλω ΚΑΙ θέλω', 'έτσι.', 'α'].every(t => { const r = C(t); return r.length === t.length && r.slice(1) === t.slice(1); }));
  assert('(Γ) anything else stays exactly as typed: a capital already, a Latin word, a number, a quote, ΐ / ΰ, a final ς, empty or not text',
    ['Θέλω', 'iPhone χαλασμένο', 'eBay πάλι', '3 χρόνια', '«λέω»', '…και μετά', 'ΐσως', 'ΰ', 'ς', ' θέλω', ''].every(t => C(t) === t) &&
    C(null) === null && C(undefined) === undefined && C(5) === 5);
}

// ── (Δ) data paths ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const sinks = /setMessages|addUiBubble|setUiBubbles|recordTelemetry|localStorage|sessionStorage|indexedDB|saveMemory|_writeMemoryNow|setMemory|console\.|fetch\(|callAura|generateResponse|navigator\.|clipboard|createObjectURL|download|sendBeacon|XMLHttpRequest/;
  assert('(Δ) the screen block and its functions write NOWHERE: no messages or UI bubbles, telemetry, storage, memory, console, network, clipboard or download',
    !sinks.test(JSX) && !sinks.test(VIEW));
  // CHANGED (John, 2/11/2026, branchCount): besides the screen, the view is read by the map's ONE record (the effect below) — and nowhere else
  const uses = (raw.match(/\bthoughtMap\b/g) || []).length, defs = raw.indexOf('const thoughtMap = thoughtMapView(');
  const outside = raw.replace(JSX, '').split('\n').filter(l => /\bthoughtMap\b/.test(l)).map(l => l.trim());
  assert('(Δ) the view is read only by the screen block and by the one record (computed on render, used nowhere else)',
    defs > 0 && (raw.match(/thoughtMapView\(/g) || []).length === 2 && uses > 3 && JSON.stringify(outside) === JSON.stringify([
      'const thoughtMap = thoughtMapView({ active: stageAActive.current, phase: stageAPhase, loading, stage: stageAView,',
      'const thoughtMapShown = thoughtMap !== null;', 'const f = thoughtMapRecFields(thoughtMap, recMode.current);']));
  assert('(Δ) the number kept for the screen: set only when the card opens, reset with the session, read only to cut `messages`',
    (raw.match(/rootCardMsgCount\.current = /g) || []).length === 2 && /if \(stageARef\.current\.phase === "card"\) rootCardMsgCount\.current = \(msgsNow \|\| \[\]\)\.length;/.test(raw) &&
    /rootCardMsgCount\.current = 0;/.test(raw) && (raw.match(/rootCardMsgCount\.current\b/g) || []).length === 3 && /messages\.slice\(0, rootCardMsgCount\.current\)/.test(raw));
  assert('(Δ) the copy and the download carry the step card\'s text exactly as on main (buildStageAShareText unchanged; it never sees the screen)',
    h16(fnSrc('buildStageAShareText')) === '9a8af7bdebab8fae' && h16(fnSrc('buildStepCardText')) === 'a2a9b53459dff368' && !/thoughtMap/.test(fnSrc('buildStageAShareText')));
  // CHANGED (John, 2/11/2026): the map may record ONE integer, branchCount, with ?rec=1 only — recordTelemetry and the tester export
  // themselves stay byte-identical (they are what drops anything else); the map has exactly one record call, fed only by thoughtMapRecFields
  assert('(Δ) telemetry and the tester export unchanged (counts only; rec=1 keeps no text); the map\'s only record is branchCount',
    h16(fnSrc('recordTelemetry')) === 'bc79a4b2654cf306' && h16(fnSrc('buildTesterExport')) === 'd73e0a9179c9a751' && h16(fnSrc('exportTesterData')) === 'd3ee9ebe10c78f7a' &&
    (raw.match(/recordTelemetry\("thought/g) || []).length === 1 && /const f = thoughtMapRecFields\(thoughtMap, recMode\.current\);\s*if \(f\) recordTelemetry\("thought_map", f\);/.test(raw) &&
    !/recordTelemetry/.test(JSX) && !/recordTelemetry/.test(VIEW) &&
    /const recMode = useRef\(typeof window !== 'undefined' && new URLSearchParams\(window\.location\.search\)\.get\('rec'\) === '1'\);/.test(raw));
  assert('(Δ) … once per session: a latch set on the first showing, reset with the session',
    /if \(!thoughtMapShown \|\| thoughtMapLogged\.current\) return;\s*thoughtMapLogged\.current = true;/.test(raw) &&
    (raw.match(/thoughtMapLogged\.current = /g) || []).length === 2 && /thoughtMapLogged\.current = false; \/\/ Thought Map/.test(raw) && /\}, \[thoughtMapShown\]\);/.test(raw));
  assert('(Δ) memory and its consent unchanged (aura_v2_memory, the consent toggle): the screen never reaches them',
    h16(fnSrc('saveMemory')) === 'd609850541386c09' && h16(fnSrc('_writeMemoryNow')) === 'c141fc2423719aea' && h16(fnSrc('loadMemory')) === '5b173dba223a13d5' && h16(fnSrc('exportMemory')) === '6e4e47cfab7f0f4d');
}

// ── (Ε) unchanged ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  // RE-BASED (John, 2/11/2026, branch candidate-tm): the base is now 469e194 = main 24aab8e + safety-detectors, exactly as approved. Only
  // the reference moves: the two detectors that safety-detectors changed carry ITS fingerprints (computed from 469e194, not from this
  // branch); the other 19 are the same as on main. Same list, same check (each function byte for byte), same purpose.
  // RE-BASED again (John, 2/11/2026, ADR «2 Νοεμβρίου (δ)»): safety-detectors moved to 75a2aa9 (the football fix). Only the reference
  // moves, computed from 75a2aa9 itself; same list, same check, same purpose.
  // RE-BASED again (John, 3/11/2026, ADR «3 Νοεμβρίου»): safety-detectors moved to ca18f58 (finding 130). Only the reference moves,
  // computed from ca18f58 itself; same list, same check, same purpose.
  const MAIN = { detectSafetySignal: '1f7c3cb8fe568f31', classifyCrisisTier: 'afa5cf7a370bb0d5', detectsDangerFromOther: '7fa664b7741f3c46',
    detectsMentalHealthReferral: 'd03b71d681025b79', mergeRiskKind: 'd3b56f5bad3ae14f', stageASafetyHold: 'f1fbe27ef7643815', stageACaptureAllowed: 'f8a46ebc62fe4ecd',
    initialStageAState: '514233db37b55461', stageAStep: '67bb9bcb504396e8', buildRootStepLines: 'a7f337a9d5e18db5', buildRootEndLines: 'd8486e581871a4fb',
    buildRootCopyText: 'df52b00bf523b132', stageAFlowTelemetry: '92646b9fff31a68f', stageAStepTelemetry: '4962b5c6625fbcd7', stageAHelpTelemetry: 'bb9ea23634eab049',
    stripForeignHelplines: '1230688f6654ee84', buildCrisisLine: 'd359e22dd7cf9a95', buildDangerLine: 'df6f7df2a56379a2', pickKnewSnippet: '0d82ae28ee73256e',
    isVerbatimUserText: '17f490c8ee4ba990', storedTelemetryCount: '905d5655bd54bf28' };
  const diff = Object.keys(MAIN).filter(n => h16(fnSrc(n)) !== MAIN[n]);
  assert('(Ε) the safety, flow, line, telemetry and memory functions are byte-identical to the base ca18f58 (main 24aab8e + safety-detectors with the fixes of 2/11 and 3/11)' + (diff.length ? ' — changed: ' + diff.join(', ') : ''), diff.length === 0);
  const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
  assert('(Ε) the prompt is b5f303cc9405aa21', h16(raw.slice(cs, ce)) === 'b5f303cc9405aa21');
const stripThoughtMap = t => {
    const cut = (s, a, b) => { const i = s.indexOf(a); const j = i < 0 ? -1 : s.indexOf(b, i); return i < 0 || j < 0 ? s : s.slice(0, i) + s.slice(j); };
    let s = cut(t, '// THOUGHT MAP, phase 1', "// A root typed into the flow (door 1's answer");
    s = cut(s, '              {/* THOUGHT MAP (John, 2/11/2026', '              {/* ADR «17 Οκτωβρίου (δ)», (ε): not while');
    for (const line of ['  // THOUGHT MAP (John, 2/11/2026, ADR «2 Νοεμβρίου (β)»): how many messages there were when the root card opened — a number only, page\n' +
        '  // memory only; the screen reads `messages` up to it. Never stored, sent or logged.\n  const rootCardMsgCount = useRef(0);\n',
      '    if (stageARef.current.phase === "card") rootCardMsgCount.current = (msgsNow || []).length; // Thought Map (2/11): a number only\n',
      '    rootCardMsgCount.current = 0; // Thought Map (2/11)\n',
      // UPDATED (John, 2/11/2026, branchCount): the map's one record — the latch, its reset and the effect
      '  // THOUGHT MAP (John, 2/11/2026): the map\'s one record (branchCount, ?rec=1 only) is written once per session — reset with the session\n' +
        '  const thoughtMapLogged = useRef(false);\n',
      '    thoughtMapLogged.current = false; // Thought Map (2/11): the map\'s one record, once per session\n',
      '  // THOUGHT MAP (John, 2/11/2026): when the map first shows in a session and ?rec=1 is on — ONE integer, branchCount (0, 2 or 3).\n' +
        '  // Nothing without ?rec=1; nothing else ever (thoughtMapRecFields builds the only fields; recordTelemetry drops anything else).\n' +
        '  const thoughtMapShown = thoughtMap !== null;\n  useEffect(() => {\n    if (!thoughtMapShown || thoughtMapLogged.current) return;\n' +
        '    thoughtMapLogged.current = true;\n    const f = thoughtMapRecFields(thoughtMap, recMode.current);\n' +
        '    if (f) recordTelemetry("thought_map", f);\n  }, [thoughtMapShown]); // eslint-disable-line react-hooks/exhaustive-deps\n',
      '  // THOUGHT MAP (2/11): computed on every render from what the page already holds; nothing is kept\n' +
        '  const thoughtMap = thoughtMapView({ active: stageAActive.current, phase: stageAPhase, loading, stage: stageAView,\n' +
        '    messagesAtCard: messages.slice(0, rootCardMsgCount.current), allMessages: messages, riskKind: riskSignalKind.current,\n' +
        '    dangerFromOther: dangerFromOther.current, safetyMode, crisisFallback });\n']) s = s.split(line).join('');
    return s;
  };
  // RE-BASED (John, 2/11/2026, branch candidate-tm): the same strip, the same full sha256 — the reference is now src/App.jsx of 469e194
  // (main 24aab8e + safety-detectors), no longer of 24aab8e
  // RE-BASED again (John, 2/11/2026, ADR «2 Νοεμβρίου (δ)»): safety-detectors moved to 75a2aa9 (the football fix). Only the reference
  // moves, computed from 75a2aa9 itself; same list, same check, same purpose.
  // RE-BASED again (John, 3/11/2026, ADR «3 Νοεμβρίου»): safety-detectors moved to ca18f58 (finding 130). Only the reference moves,
  // computed from ca18f58 itself; same list, same check, same purpose.
  assert('(Ε) without the Thought Map pieces (the block of functions, the screen, the one number, the view) src/App.jsx is byte-identical to the base ca18f58 (main 24aab8e + safety-detectors with the fixes of 2/11 and 3/11)',
    sha(stripThoughtMap(raw)) === '6935907210dd84a8d11e3fc1c04bca9404fc1bd6e6e58babadbdfc3555943633');
  assert('(Ε) api/aura.js is byte-identical to main (c2ce3892c094224d)', h16(fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8')) === 'c2ce3892c094224d');
}

// ── (ΣΤ) branchCount — the map's ONE record (John, 2/11/2026) ────────────────────────────────────────────────────────────────────
{
  const R = (v, on) => { try { return F.thoughtMapRecFields(v, on); } catch (e) { return 'threw'; } };
  const T = (ev, f) => { try { return F.recordTelemetry(ev, f); } catch (e) { return 'threw'; } };
  const v3 = view(base(3)), v2 = view(base(2)), v0 = view(base(0));
  const keys = o => JSON.stringify(Object.keys(o || {}).sort());
  // (α) the number is recorded
  assert('(ΣΤ α) with ?rec=1 the map gives ONE field, branchCount = 3 / 2 / 0 — and the record is the event, its time and that integer only',
    JSON.stringify(R(v3, true)) === '{"branchCount":3}' && JSON.stringify(R(v2, true)) === '{"branchCount":2}' && JSON.stringify(R(v0, true)) === '{"branchCount":0}' &&
    (() => { const r = T('thought_map', R(v3, true)); return r && r.ev === 'thought_map' && r.branchCount === 3 && keys(r) === '["branchCount","ev","t"]'; })());
  // (β) nothing without ?rec=1
  assert('(ΣΤ β) without ?rec=1 nothing at all (only true counts — not "1", not 1, not missing); no map → nothing',
    [false, undefined, null, '1', 1, 'true'].every(on => R(v3, on) === null) && R(null, true) === null && R(undefined, true) === null && R({}, true) === null);
  assert('(ΣΤ β) … only the counts 0, 2, 3 — any other shape of the view gives nothing; the root, the words and the step never come out',
    [{ branches: ['a'] }, { branches: ['a', 'b', 'c', 'd'] }, { branches: 'abc' }].every(v => R(v, true) === null) &&
    keys(R({ root: 'Ρίζα', branches: ['x', 'y'], knew: 'κ', step: 'σ', when: 'π' }, true)) === '["branchCount"]');
  // (γ) text in the field is dropped by the (unchanged) mechanism
  const TXT = 'Ο μισθός είναι καλός και φοβάμαι την αλλαγή.';
  assert('(ΣΤ γ) text passed in branchCount is DROPPED by recordTelemetry — and so are fractions, negatives, too-large numbers, lists and objects',
    [TXT, '3', 2.5, -1, 10000, [3], { n: 3 }, null, undefined].every(x => { const r = T('thought_map', { branchCount: x }); return r && !('branchCount' in r); }));
  assert('(ΣΤ γ) … and any other field with text is dropped too; a bad event name records nothing',
    (() => { const r = T('thought_map', { branchCount: 2, root: TXT, branchText: TXT }); return keys(r) === '["branchCount","ev","t"]' && !JSON.stringify(r).includes('μισθός'); })() &&
    T('thought map', { branchCount: 2 }) === null && T('Χάρτης', { branchCount: 2 }) === null);
  // (δ) the tester export shows only the integer
  assert('(ΣΤ δ) the tester export shows the map\'s record as its event name, its time and the integer only — no text',
    (() => { const x = F.buildTesterExport([T('thought_map', R(v3, true))], '2026-11-02'); const e = x.events[0];
      return x.records === 1 && e.ev === 'thought_map' && e.branchCount === 3 && keys(e) === '["branchCount","ev","t"]' && !/[α-ωά-ώΑ-Ω]/.test(JSON.stringify(x.events)); })());
  assert('(ΣΤ δ) … even a tampered record in the device log (text in branchCount, a text field) leaves the export with no text',
    (() => { const x = F.buildTesterExport([{ ev: 'thought_map', t: 5, branchCount: TXT, root: TXT }], '2026-11-02');
      return keys(x.events[0]) === '["ev","t"]' && !JSON.stringify(x).includes('μισθός'); })());
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
