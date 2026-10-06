// AURA — STAGE A, steps 3.1–3.2: the pure functions of the root card, and the risk latch
// (SPEC_FREE_END.md §1.2, §1.3, §1.5, §2.1, §2.1α, §2.2, §4; ADR «6 Οκτωβρίου (β)»…«(στ)»)
//
// Pinned here, before any screen exists:
//   - isVerbatimUserText: a card line is shown only if it is, character for character, the user's own text.
//   - pickKnewSnippet: «Τι ήξερες» = the first SUBSTANTIAL sentence of the first 3 user messages, greetings
//     stripped, still verbatim; null (line hidden) when none has substance. Mechanical ~200-char cut.
//   - sameAsRootText: «λέξη που κρατάς» equal to «Τι βρήκες» → shown once.
//   - buildRootEndLines: the founder's texts. «Τι βρήκες» ALWAYS WHOLE (decision «(στ)» 1). Risk B/DISTRESS →
//     only the first two lines, nothing about Coach or price.
//   - buildRootCardLine: the line above «Ναι», normal and risk variants.
//   - mergeRiskKind: the session latch keeps the HEAVIEST signal (A > B > DISTRESS).
//   - stageARootButtonVisible: after the first AURA reply; never in tier A, while loading, once the closing
//     started, while the card flow is open, after the session ended.
//   - STAGE_A_TEXTS: every fixed text, verbatim as approved.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
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
function extractBlock(startToken) {
  const a = CODE.indexOf(startToken);
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1) + (CODE[k + 1] === ';' ? ';' : ''); }
  }
  return null;
}
const NAMES = ['isVerbatimUserText', 'pickKnewSnippet', 'rootTextHasSubstance', 'substanceOfSentence', 'splitSentences', 'sameAsRootText', 'buildRootEndLines', 'buildRootCardLine',
  'mergeRiskKind', 'stageARootButtonVisible', 'buildRootCopyText', 'normalizeVerbatim'];
const srcs = NAMES.map(n => extractBlock('function ' + n + '(') || `function ${n}(){return undefined}`);
const textsSrc = extractBlock('const STAGE_A_TEXTS = ') || 'const STAGE_A_TEXTS = {};';
const F = new Function(textsSrc + '\n' + srcs.join('\n') + '\nreturn {STAGE_A_TEXTS,' + NAMES.join(',') + '};')();

// ── STAGE_A_TEXTS: verbatim as approved ──────────────────────────────────────
const T = F.STAGE_A_TEXTS || {};
const APPROVED = {
  button: 'Νομίζω βρήκα τι με απασχολεί',
  ask: 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;',
  back: 'Δεν το βρήκα ακόμα, συνέχισε',
  knewLabel: 'Τι ήξερες',
  foundLabel: 'Τι βρήκες',
  yes: 'Ναι, αυτό είναι',
  correct: 'Διόρθωσε',
  correctAsk: 'Γράψε τη ρίζα όπως θα την έλεγες εσύ, ολόκληρη.',
  retry: "Γράψ' το λίγο πιο ολοκληρωμένα",
  cardLine: 'Με το "Ναι" ολοκληρώνεται το δωρεάν κομμάτι και σου δείχνω το επόμενο.',
  cardLineRisk: 'Με το "Ναι" ολοκληρώνεται αυτό το κομμάτι.',
  endSecond: 'Το πρώτο βήμα κάθε προβλήματος είναι ο πραγματικός ορισμός του — και τον βρήκες εσύ, χωρίς συμβουλές.',
  endThird: "Το επόμενο ερώτημα είναι: τι μπορείς να κάνεις γι' αυτό; Στο AURA Coach βλέπεις τι μπορείς να κάνεις, τι κοστίζει ο κάθε δρόμος, και ποιο είναι το πρώτο, μικρότερο βήμα.",
  price: 'AURA Coach · €6, μία φορά.',
  wantMore: 'Θέλω να συνεχίσω',
  notNow: 'Όχι τώρα',
  notReady: 'Το AURA Coach δεν είναι ακόμα έτοιμο.',
  helpQ: 'Τι θα σε βοηθούσε περισσότερο;',
  help1: 'Να βρω τώρα τι μπορώ να κάνω',
  help2: 'Να με ξαναρωτήσει σε λίγες μέρες τι έγινε',
  help3: 'Να κρατάω τη ρίζα και τα βήματά μου',
  clarityQ: 'Τώρα, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα, από το 1 έως το 10;',
  word: 'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.',
};
Object.entries(APPROVED).forEach(([k, v]) => assert(`TEXT ${k}: verbatim`, T[k] === v));
assert('TEXT: the old «Κρατήσαμε ότι θα το ήθελες» is nowhere in the app', !/Κρατήσαμε ότι θα το ήθελες/.test(CODE));
assert('TEXT: the clarity question is the prompt\'s own late wording (comparable with the early 1–10 baseline)',
  PROMPT.includes(APPROVED.clarityQ));
assert('TEXT: the word question is the app\'s existing alternative wording', CODE.split(APPROVED.word).length - 1 >= 1);
assert('TEXT: STAGE_A_TEXTS is defined once (all fixed texts in one place, for the experiment\'s mechanical removal)',
  (CODE.match(/const STAGE_A_TEXTS = /g) || []).length === 1);

// ── isVerbatimUserText ───────────────────────────────────────────────────────
const U = ['Γεια σου. Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου.', 'Με φοβίζει   η αλλαγή,\nόχι η δουλειά.'];
assert('VERBATIM: an exact substring of a user message passes', F.isVerbatimUserText('Δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου', U) === true);
assert('VERBATIM: surrounding quotes and spaces are ignored', F.isVerbatimUserText('  «Με φοβίζει η αλλαγή»  ', U) === true);
assert('VERBATIM: whitespace runs and newlines compare as one space', F.isVerbatimUserText('η αλλαγή, όχι η δουλειά', U) === true);
assert('VERBATIM: a paraphrase fails (one word changed)', F.isVerbatimUserText('Δεν ξέρω αν πρέπει να αφήσω τη δουλειά μου', U) === false);
assert('VERBATIM: word overlap is not enough (reordered)', F.isVerbatimUserText('η δουλειά, όχι η αλλαγή', U) === false);
assert('VERBATIM: accents matter (exact text, not a fuzzy match)', F.isVerbatimUserText('Δεν ξερω αν πρεπει', U) === false);
assert('VERBATIM: empty / only quotes fails', F.isVerbatimUserText('', U) === false && F.isVerbatimUserText(' «» ', U) === false);
assert('VERBATIM: non-strings never throw', F.isVerbatimUserText(null, U) === false && F.isVerbatimUserText('x', null) === false);
assert('VERBATIM: NFC-equivalent forms compare equal', F.isVerbatimUserText('Δεν ξέρω'.normalize('NFD'), U) === true);

// ── pickKnewSnippet ──────────────────────────────────────────────────────────
const K = msgs => F.pickKnewSnippet(msgs);
const k1 = K(['Γεια, δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου.']);
assert('KNEW: greeting stripped, the rest verbatim', k1 && k1.text === 'δεν ξέρω αν πρέπει να φύγω από τη δουλειά μου' && k1.truncated === false);
assert('KNEW: only a greeting → hidden (null)', K(['Γεια σου']) === null);
assert('KNEW: greeting + content-free intro → hidden', K(['Καλησπέρα, θέλω να μιλήσω για κάτι']) === null);
assert('KNEW: falls through to the 2nd/3rd message when the 1st has no substance',
  (K(['Γεια σου', 'Έχω ένα θέμα', 'Με πιέζει πολύ η μητέρα μου να γυρίσω στο χωριό.']) || {}).text === 'Με πιέζει πολύ η μητέρα μου να γυρίσω στο χωριό');
assert('KNEW: only the first 3 user messages are read', K(['Γεια', 'Οκ', 'Ναι', 'Με πιέζει πολύ η μητέρα μου να γυρίσω στο χωριό.']) === null);
assert('KNEW: a question about AURA itself is rejected', K(['Τι είσαι εσύ και πώς δουλεύεις ακριβώς εδώ μέσα;']) === null);
assert('KNEW: «δοκιμή» / «test» rejected', K(['δοκιμή']) === null && K(['test test test test']) === null);
assert('KNEW: fewer than 4 substance words rejected', K(['Δεν ξέρω τι να κάνω.']) === null);
assert('KNEW: exactly 3 substance words is still too few', K(['Φοβάμαι πολύ την αλλαγή δουλειάς.']) === null);
assert('KNEW: exactly 4 substance words is enough', (K(['Φοβάμαι πολύ την αλλαγή δουλειάς τώρα.']) || {}).text === 'Φοβάμαι πολύ την αλλαγή δουλειάς τώρα');
assert('KNEW: several greetings stripped in a row (accent-insensitive)',
  (K(['καλησπερα, λοιπόν, θέλω να αλλάξω πόλη αλλά φοβάμαι μήπως μείνω μόνος.']) || {}).text === 'θέλω να αλλάξω πόλη αλλά φοβάμαι μήπως μείνω μόνος');
assert('KNEW: the Greek question mark splits sentences', (K(['Να φύγω ή να μείνω στη δουλειά μου τώρα\u037e Δεν ξέρω.']) || {}).text === 'Να φύγω ή να μείνω στη δουλειά μου τώρα');
const longS = 'Εδώ και πολλούς μήνες σκέφτομαι συνέχεια αν πρέπει να αφήσω τη δουλειά μου στην τράπεζα, να μετακομίσω σε άλλη πόλη με τη σύντροφό μου, να ξεκινήσω κάτι δικό μου που ονειρεύομαι χρόνια, χωρίς να ξέρω αν θα τα βγάλω πέρα οικονομικά τους πρώτους μήνες';
const kl = K([longS + '.']);
assert('KNEW: a long sentence is cut mechanically at a word boundary ≤ 200 chars, and marked truncated',
  kl && kl.truncated === true && kl.text.length <= 200 && longS.startsWith(kl.text) && longS[kl.text.length] === ' ');
for (const pre of ['', 'Ναι ', 'Ε, ναι, ', 'Κι όμως ', 'Όχι ακριβώς, ']) {
  const s2 = pre + longS;
  const k2 = K([s2 + '.']);
  assert(`KNEW: the cut never splits a word (prefix «${pre}»)`, !!k2 && k2.truncated === true && k2.text.length <= 200 &&
    s2.includes(k2.text) && /\s/.test(s2[s2.indexOf(k2.text) + k2.text.length]));
}
assert('KNEW: whatever it returns is still verbatim user text', !!kl && F.isVerbatimUserText(kl.text, [longS]) === true);
assert('KNEW: non-array → null, never throws', K(null) === null && K([null, 5]) === null);

// ── rootTextHasSubstance (6/10 phone test: «Περίπου δηλαδή» became the whole root) ──
// THE SAME RULE as «Τι ήξερες» (founder): greeting stripped, no content-free introduction, not about AURA,
// at least 4 substance words — in at least one sentence of the text.
const H = x => F.rootTextHasSubstance(x);
assert('ROOT TEXT: «Περίπου δηλαδή» (talking to AURA, not a root) is rejected', H('Περίπου δηλαδή') === false);
assert('ROOT TEXT: «Ναι, αυτό» rejected', H('Ναι, αυτό') === false);
assert('ROOT TEXT: «Γεια σου» rejected', H('Γεια σου') === false);
assert('ROOT TEXT: a content-free introduction is rejected', H('Θέλω να μιλήσω για κάτι') === false);
assert('ROOT TEXT: a question about AURA is rejected', H('Τι είσαι εσύ και πώς δουλεύεις ακριβώς εδώ μέσα;') === false);
assert('ROOT TEXT: a whole root passes', H('Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.') === true);
assert('ROOT TEXT: one substantial sentence among short ones is enough', H('Ναι. Ότι μένω στη δουλειά από φόβο και όχι επειδή το θέλω.') === true);
assert('ROOT TEXT: the same rule as «Τι ήξερες» — a text passes exactly when pickKnewSnippet would accept it',
  ['Περίπου δηλαδή', 'Φοβάμαι πολύ την αλλαγή δουλειάς.', 'Φοβάμαι πολύ την αλλαγή δουλειάς τώρα.', 'Καλησπέρα, θέλω να μιλήσω για κάτι', 'Ότι μένω από φόβο, όχι επειδή το θέλω.']
    .every(x => H(x) === (F.pickKnewSnippet([x]) !== null)));
assert('ROOT TEXT: non-strings never throw', H(null) === false && H(undefined) === false && H('') === false);
assert('ONE RULE: pickKnewSnippet and rootTextHasSubstance both go through substanceOfSentence (no second copy of the rule)',
  /substanceOfSentence\(/.test(CODE.slice(CODE.indexOf('function pickKnewSnippet('), CODE.indexOf('function pickKnewSnippet(') + 3000)) &&
  /substanceOfSentence\(/.test(CODE.slice(CODE.indexOf('function rootTextHasSubstance('), CODE.indexOf('function rootTextHasSubstance(') + 800)));

// ── sameAsRootText ───────────────────────────────────────────────────────────
assert('SAME: case, accents, edge punctuation and spaces ignored', F.sameAsRootText('  Φόβος! ', 'φοβος') === true);
assert('SAME: a trailing Greek question mark is edge punctuation too', F.sameAsRootText('Γιατί φοβάμαι\u037e', 'γιατι φοβαμαι') === true);
assert('SAME: different words differ', F.sameAsRootText('φόβος', 'φόβος αλλαγής') === false);
assert('SAME: empty never equal', F.sameAsRootText('', '') === false && F.sameAsRootText(null, 'x') === false);

// ── buildRootEndLines / buildRootCardLine ────────────────────────────────────
const FOUND = 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά. Και ότι το αναβάλλω χρόνια επειδή δεν θέλω να το παραδεχτώ ούτε στον εαυτό μου, πόσο μάλλον σε εκείνον, που πίστεψε σε μένα από την αρχή και πλήρωσε τις σπουδές μου.';
const L = F.buildRootEndLines(FOUND, false) || [];
assert('END: four lines in the normal case', L.length === 4);
assert('END: line 1 is «Η ρίζα σου: "{τι βρήκες}".» with the WHOLE text (no cut, decision «(στ)» 1)',
  L[0] === 'Η ρίζα σου: "' + FOUND + '".');
assert('END: lines 2–4 are the approved texts, in order', L[1] === APPROVED.endSecond && L[2] === APPROVED.endThird && L[3] === APPROVED.price);
const LR = F.buildRootEndLines(FOUND, true) || [];
assert('END (risk B/DISTRESS): only the first two lines', LR.length === 2 && LR[0] === L[0] && LR[1] === APPROVED.endSecond);
assert('END (risk): nothing about Coach or price', !/Coach|€/.test(LR.join(' ')));
assert('END: the found text is trimmed of outer spaces only', (F.buildRootEndLines('  φόβος  ', false) || [])[0] === 'Η ρίζα σου: "φόβος".');
assert('CARD LINE: normal', F.buildRootCardLine(false) === APPROVED.cardLine);
assert('CARD LINE: risk B/DISTRESS', F.buildRootCardLine(true) === APPROVED.cardLineRisk);

// ── buildRootCopyText ────────────────────────────────────────────────────────
const C = F.buildRootCopyText('δεν ξέρω αν να φύγω', FOUND, '2026-10-06');
assert('COPY: both lines, whole, plus the date', C === 'Τι ήξερες: «δεν ξέρω αν να φύγω»\nΤι βρήκες: «' + FOUND + '»\n2026-10-06');
assert('COPY: without «Τι ήξερες» the line is omitted, never invented',
  F.buildRootCopyText(null, 'φόβος', '2026-10-06') === 'Τι βρήκες: «φόβος»\n2026-10-06');

// ── mergeRiskKind (0 none · 1 crisis A · 2 crisis B · 3 DISTRESS) ────────────
assert('RISK: none stays none', F.mergeRiskKind(0, null, null) === 0);
assert('RISK: DISTRESS → 3', F.mergeRiskKind(0, 'DISTRESS', null) === 3);
assert('RISK: CRISIS tier B → 2', F.mergeRiskKind(0, 'CRISIS', 'B') === 2);
assert('RISK: CRISIS tier A → 1', F.mergeRiskKind(0, 'CRISIS', 'A') === 1);
assert('RISK: CRISIS of unknown tier → treated as A', F.mergeRiskKind(0, 'CRISIS', null) === 1);
assert('RISK: the heaviest is kept (A then DISTRESS stays A)', F.mergeRiskKind(1, 'DISTRESS', null) === 1);
assert('RISK: a heavier later signal wins (DISTRESS then B → B)', F.mergeRiskKind(3, 'CRISIS', 'B') === 2);
assert('RISK: a quiet message never clears the latch', F.mergeRiskKind(2, null, null) === 2);

// ── stageARootButtonVisible ──────────────────────────────────────────────────
const base = { active: true, assistantReplies: 1, loading: false, riskKind: 0, closingStarted: false, rootPhase: null, sessionEnded: false };
const V = o => F.stageARootButtonVisible({ ...base, ...o });
assert('BUTTON: visible after the first AURA reply', V({}) === true);
assert('BUTTON: not before the first AURA reply', V({ assistantReplies: 0 }) === false);
assert('BUTTON: never with the switch closed', V({ active: false }) === false);
assert('BUTTON: hidden in crisis tier A', V({ riskKind: 1 }) === false);
assert('BUTTON: still visible with tier B / DISTRESS (the card is allowed there)', V({ riskKind: 2 }) === true && V({ riskKind: 3 }) === true);
assert('BUTTON: hidden while waiting for a reply', V({ loading: true }) === false);
assert('BUTTON: hidden once the closing has started', V({ closingStarted: true }) === false);
assert('BUTTON: hidden while the ask/card flow is open', V({ rootPhase: 'ask' }) === false && V({ rootPhase: 'card' }) === false);
assert('BUTTON: hidden after the session ended', V({ sessionEnded: true }) === false);

// ── Wiring that belongs to this step ─────────────────────────────────────────
assert('LATCH: riskSignalKind ref exists and resets with the session',
  /const riskSignalKind\s*= useRef\(0\)/.test(CODE) && /riskSignalKind\.current = 0;/.test(CODE));
assert('LATCH: every submitted user message updates it, only with Stage A open',
  /if \(stageAActive\.current\) riskSignalKind\.current = mergeRiskKind\(riskSignalKind\.current, detectSafetySignal\(userText\), classifyCrisisTier\(userText\)\);/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
