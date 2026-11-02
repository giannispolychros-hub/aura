// AURA — THOUGHT MAP × SAFETY DETECTORS (John, 2/11/2026, branch candidate-tm = main 24aab8e + safety-detectors 469e194 + thought-map
// bf93c7c). The cross-check that neither branch has alone:
//  (Α) EVERY danger phrase that safety-detectors now catches — the 69 of test_safety_detectors_3110.js: 40 danger to the person writing,
//      5 danger to a child, 24 passive ideation — HIDES the Thought Map, before the root card or after it, even when the app's own latch
//      was not set (the screen's re-check of the whole session, branchSessionSafe), and gives no branch at all.
//  (Β) the everyday phrases of the same test (65) give NO new error against main: the map is hidden for exactly the phrases that main's
//      detectors already flag (KNOWN_ON_MAIN of that test, 2) and shown for every other one.
// The phrases are READ from test_safety_detectors_3110.js — one source; this file holds no danger message of its own.
// RED: on thought-map bf93c7c alone (main's detectors) only 1 of the 69 hides the map.
// All text here is synthetic.

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1);
  const line = raw.slice(a + 1, eol); if (/;\s*(?:\/\/.*)?$/.test(line)) return line;
  const close = raw[raw.indexOf(' = ', a) + 3] === '{' ? '\n};' : '\n];'; return raw.slice(a + 1, raw.indexOf(close, a) + 3); };
// the same loader as test_thought_map_screen.js
const CONSTS = ['HELPLINES', 'KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_DISMISSALS', 'BRANCH_MAX', 'BRANCH_MAX_CHARS', 'BRANCH_JACCARD', 'BRANCH_ABBREVIATIONS',
  'BRANCH_DISMISS_START', 'BRANCH_HEAVY_WORDS', 'BRANCH_CONTENT_WORDS', 'THOUGHT_MAP_TEXTS'];
const FNS = ['lookBehind', 'detectSafetySignal', 'classifyCrisisTier', 'detectsDangerFromOther', 'detectsMentalHealthReferral', 'mergeRiskKind',
  'stageASafetyHold', 'rootAnswerIsDismissal', 'rootAnswerIsUnsure', 'isExplicitClosure', 'declaresClosing', 'matchesClosingWord',
  'substanceOfSentence', 'branchSentenceSpans', 'branchAuraEndsWithQuestion', 'branchWords', 'branchJaccard', 'branchSessionSafe',
  'pickBranches', 'thoughtMapView'];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`),
    ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ' };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const call = (n, ...a) => { try { return F[n](...a); } catch (e) { return 'threw: ' + e.message; } };

// the phrase lists of safety-detectors, read from its own test (one source)
const SD = fs.readFileSync(path.join(__dirname, 'test_safety_detectors_3110.js'), 'utf8');
const list = (name, open, close) => { const a = SD.indexOf('const ' + name + ' = ' + open); if (a < 0) return null; const b = SD.indexOf('\n' + close + ';', a);
  try { return new Function('return ' + SD.slice(SD.indexOf(open, a), b + 2))(); } catch (e) { return null; } };
const DANGER_SELF = list('DANGER_SELF', '[', ']'), DANGER_CHILD = list('DANGER_CHILD', '[', ']'), PASSIVE = list('PASSIVE', '[', ']');
const NO_DANGER = list('NO_DANGER', '[', ']');
const KNOWN_ON_MAIN = (() => { const m = SD.match(/\nconst KNOWN_ON_MAIN = (\{[^\n]*\});/); try { return m ? new Function('return ' + m[1])() : null; } catch (e) { return null; } })();

// a finished Stage A session (synthetic) — the same shape as test_thought_map_screen.js
const U = t => ({ role: 'user', content: t });
const A = t => ({ role: 'assistant', msgMode: 'ANSWER', content: t });
const ASK = { role: 'assistant', msgMode: 'STAGE_A', content: 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;' };
const ENTRY = 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει.';
const ROOT_T = 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου.';
const KNEW = 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει';
const B1 = 'Ο μισθός είναι καλός και φοβάμαι την αλλαγή.', B2 = 'Η μητέρα μου πιστεύει ότι πρέπει να μείνω εκεί για πάντα.',
  B3 = 'Κάθε πρωί σηκώνομαι με βάρος στο στομάχι για το γραφείο.';
// the phrase as one of the answers BEFORE the root card (in place of B2), or as the word AFTER it
const atCard = mid => [U(ENTRY), A('Ερώτηση 1;'), U(B1), A('Ερώτηση 2;'), U(mid || B2), A('Ερώτηση 3;'), U(B3), ASK, U(ROOT_T)];
const after = word => [{ role: 'assistant', msgMode: 'STAGE_A', content: 'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.' },
  U(word || 'Θάρρος'), { role: 'assistant', msgMode: 'TERMINATION', isTermination: true, content: 'Καλή συνέχεια.' }];
const stage = { phase: 'done', found: ROOT_T, knew: KNEW, knewTruncated: false, riskOffer: false, step: 'Να στείλω μήνυμα στη Μαρία για καφέ.',
  when: 'Αύριο το απόγευμα.', stepEnd: 'card', stats: { rootConfirmed: 1 } };
// the app's latch NOT set (riskKind 0, no danger from another, no safety mode): only the screen's own re-check can hide it
const viewOf = (msgsAtCard, all) => call('thoughtMapView', { active: true, phase: 'done', loading: false, stage, messagesAtCard: msgsAtCard, allMessages: all,
  riskKind: 0, dangerFromOther: false, safetyMode: false, crisisFallback: null });
// hidden = the map does not show, and no branch could come from that session — the phrase before the card and, separately, after it
const hidden = t => {
  const before = atCard(t), afterCard = atCard().concat(after(t));
  return viewOf(before, before.concat(after())) === null && viewOf(atCard(), afterCard) === null &&
    call('branchSessionSafe', before.concat(after()), {}) === false && call('branchSessionSafe', afterCard, {}) === false &&
    Array.isArray(call('pickBranches', before, ROOT_T, KNEW, {})) && call('pickBranches', before, ROOT_T, KNEW, {}).length === 0;
};
const shown = t => {
  const v1 = viewOf(atCard(t), atCard(t).concat(after())), v2 = viewOf(atCard(), atCard().concat(after(t)));
  return !!v1 && typeof v1 === 'object' && !!v2 && typeof v2 === 'object';
};

// ── (load) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(load) the functions load from src/App.jsx — every one found in the file, none a stand-in', FNS.every(n => fnSrc(n) !== '' && typeof F[n] === 'function'));
assert('(load) the lists of safety-detectors are read from its test: 40 + 5 + 24 = 69 danger phrases, 65 everyday, 2 known on main',
  Array.isArray(DANGER_SELF) && DANGER_SELF.length === 40 && Array.isArray(DANGER_CHILD) && DANGER_CHILD.length === 5 && Array.isArray(PASSIVE) &&
  PASSIVE.length === 24 && Array.isArray(NO_DANGER) && NO_DANGER.length === 65 && !!KNOWN_ON_MAIN && Object.keys(KNOWN_ON_MAIN).length === 2 &&
  Object.keys(KNOWN_ON_MAIN).every(t => NO_DANGER.includes(t)) && [...DANGER_SELF, ...DANGER_CHILD, ...PASSIVE, ...NO_DANGER].every(t => typeof t === 'string' && t.length > 2));
// not vacuous: the same session without a danger phrase shows the map, with its three branches
{
  const v = viewOf(atCard(), atCard().concat(after()));
  assert('(control) the same session without a danger phrase shows the map, with three branches',
    !!v && typeof v === 'object' && v.root === ROOT_T && Array.isArray(v.branches) && v.branches.length === 3);
}

// ── (Α) every danger phrase of safety-detectors hides the map ────────────────────────────────────────────────────────────────────
const LISTS = [['danger to the person writing', DANGER_SELF || []], ['danger to a child', DANGER_CHILD || []], ['passive ideation', PASSIVE || []]];
let allDanger = 0, allHidden = 0;
for (const [kind, L] of LISTS) {
  let n = 0;
  for (const t of L) { const h = hidden(t); if (h) n++; assert('(Α) ' + kind + ' — no map, no branch (before the card and after it): «' + t + '»', h); }
  assert('(Α) ' + kind + ': ' + n + '/' + L.length + ' hide the map', L.length > 0 && n === L.length);
  allDanger += L.length; allHidden += n;
}
assert('(Α) all together: ' + allHidden + '/' + allDanger + ' danger phrases hide the map (69 expected)', allDanger === 69 && allHidden === 69);

// ── (Β) the everyday phrases: no new error against main ─────────────────────────────────────────────────────────────────────────
let newErr = 0, hiddenKnown = 0;
for (const t of NO_DANGER || []) {
  const known = !!(KNOWN_ON_MAIN && KNOWN_ON_MAIN[t]);
  const ok = known ? hidden(t) : shown(t);
  if (!ok) newErr++; if (known && ok) hiddenKnown++;
  assert('(Β) ' + (known ? 'hidden, as main already flags it (' + KNOWN_ON_MAIN[t] + ')' : 'the map shows') + ': «' + t + '»', ok);
}
assert('(Β) everyday phrases: ' + newErr + ' new errors; hidden only the ' + hiddenKnown + ' that main already flags', (NO_DANGER || []).length === 65 && newErr === 0 && hiddenKnown === 2);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
