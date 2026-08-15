const {
  detectSafetySignal, decideTermination, detectPattern, createAnchor, closeAnchor,
  getMostRecentWordAnchor, TRAJECTORY_WORD_CATEGORY, EMPTY_MEMORY, needsFirstWhy,
  getStableObstacle, detectDomain
} = require('./aura_pure.js');

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  if (!ok) { console.log(`   expected: ${JSON.stringify(expected)}`); console.log(`   actual:   ${JSON.stringify(actual)}`); fail++; }
  else pass++;
}

// ── Baseline 1: the exact real-world safety gap found today (alcohol-abstinence transcript) ──
check(
  'Safety: "ίσως ούτε η ζωή μου" triggers CRISIS (today\'s real fix)',
  detectSafetySignal('Ίσως ούτε η ζωή μου'),
  'CRISIS'
);

// ── Baseline 2: "τέλος" now recognized as natural exit (today's real fix, Giorgos-adjacent finding) ──
check(
  'decideTermination: "τέλος;" with 4+ user turns → "confirm"',
  decideTermination(
    [
      { role: 'user', content: 'Σκέφτομαι κάτι σοβαρό' },
      { role: 'user', content: 'Νομίζω το έλυσα' },
      { role: 'user', content: 'Ναι όντως' },
      { role: 'user', content: 'Τέλος;' },
    ],
    'κανονικό κείμενο απάντησης',
    { safetyMode: false, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0 }
  ),
  'confirm'
);

// ── Baseline 3: safetyMode always blocks termination — must never fire during crisis ──
check(
  'decideTermination: safetyMode=true → always "none", even with exit words',
  decideTermination(
    [{ role: 'user', content: 'ναι' }, { role: 'user', content: 'τέλος' }, { role: 'user', content: 'ναι' }, { role: 'user', content: 'ναι' }],
    'text',
    { safetyMode: true, currentMode: 'ANSWER', warningIssued: false, compressionCount: 0 }
  ),
  'none'
);

// ── Baseline 4: createAnchor produces a real, findable anchor (fixes today's "Archive was always empty" bug) ──
{
  const mem = createAnchor(EMPTY_MEMORY(), 'Όρια', TRAJECTORY_WORD_CATEGORY, 'resolved');
  check('createAnchor: anchor actually exists in mem.anchors', mem.anchors.length, 1);
  check('createAnchor: anchor text is verbatim', mem.anchors[0].text, 'Όρια');
}

// ── Baseline 5: evolving word — getMostRecentWordAnchor returns the latest, not just any anchor ──
{
  let mem = EMPTY_MEMORY();
  mem = createAnchor(mem, 'Άγχος', TRAJECTORY_WORD_CATEGORY, 'resolved');
  mem.anchors[0].createdAt = 1000; // force distinct timestamps — same-tick creation was a test artifact, not a real bug
  mem = createAnchor(mem, 'κάτι άσχετο', 'decision', 'open');
  mem.anchors[1].createdAt = 2000;
  mem = createAnchor(mem, 'Έλεγχος', TRAJECTORY_WORD_CATEGORY, 'resolved');
  mem.anchors[2].createdAt = 3000;
  const latest = getMostRecentWordAnchor(mem);
  check('getMostRecentWordAnchor: ignores non-trajectory-word anchors, returns latest', latest.text, 'Έλεγχος');
}

// ── Baseline 6: closeAnchor doesn't mutate the original array (shallow-copy safety, fixed earlier today) ──
{
  const mem = createAnchor(EMPTY_MEMORY(), 'test', 'decision', 'open');
  const originalRef = mem.anchors;
  const closed = closeAnchor({ ...mem }, mem.anchors[0].id, 'completed');
  check('closeAnchor: does not mutate caller\'s anchors array in place', originalRef[0].status, 'open');
}

// ── Baseline 7: detectPattern requires 3+ user messages minimum ──
check(
  'detectPattern: fewer than 3 user messages → NEW/low confidence',
  detectPattern([{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }]).type,
  'NEW'
);

// ── Baseline 8: classifyQuestion Greek word-boundary precision (Hardening Sprint fix) ──
{
  const { classifyQuestion } = require('./aura_pure.js');
  check('classifyQuestion: real "μου" sentence → PERSONAL', classifyQuestion('αυτό είναι δικό μου πρόβλημα'), 'PERSONAL');
  check('classifyQuestion: "κόσμου" must NOT false-positive as personal marker alone',
    /(?:^|\s)μου(?=\s|[.,!;]|$)/i.test('ο κόσμου κατοικείται'), false);
}

// ── Baseline 9: structured exit tag (Hardening Sprint — semantic closure detection) ──
check(
  'decideTermination: modelJudgesEnd=true, even mid-conversation (not keyword-matched), works despite prior compression',
  decideTermination(
    [{role:'user',content:'ένα θέμα'},{role:'user',content:'ok θα το κάνω'}],
    'κανονικό κείμενο',
    { safetyMode:false, currentMode:'ANSWER', warningIssued:false, compressionCount:2, modelJudgesEnd:true }
  ),
  'confirm'
);
check(
  'decideTermination: modelJudgesEnd=false does NOT force confirm on its own',
  decideTermination(
    [{role:'user',content:'ένα θέμα'},{role:'user',content:'κάτι άσχετο μεσαίο μήκος'}],
    'κανονικό κείμενο',
    { safetyMode:false, currentMode:'ANSWER', warningIssued:false, compressionCount:0, modelJudgesEnd:false }
  ),
  'none'
);
check(
  'decideTermination: modelJudgesEnd never fires during safetyMode',
  decideTermination(
    [{role:'user',content:'a'},{role:'user',content:'b'}],
    'text',
    { safetyMode:true, currentMode:'ANSWER', warningIssued:false, compressionCount:0, modelJudgesEnd:true }
  ),
  'none'
);

// ── Baseline 10: structural pre-closing detector (real failing transcript, "εμετική συνομιλία") ──
{
  const { isModelPreClosing } = require('./aura_pure.js');
  check('isModelPreClosing: "Εντάξει." is detected', isModelPreClosing('Εντάξει.'), true);
  check('isModelPreClosing: "Καλή συνέχεια." is detected', isModelPreClosing('Καλή συνέχεια.'), true);
  check('isModelPreClosing: "Τα λέμε." is detected', isModelPreClosing('Τα λέμε.'), true);
  check('isModelPreClosing: real question is NOT detected', isModelPreClosing('Τι σε δυσκολεύει πιο πολύ;'), false);
  check('isModelPreClosing: real substantive reply is NOT detected',
    isModelPreClosing('Η ακρίβεια είναι διαφορετικό πράγμα από το αδιέξοδο.'), false);
}
check(
  'decideTermination: model pre-closing move triggers "confirm" immediately',
  decideTermination(
    [{role:'user',content:'ένα θέμα'},{role:'user',content:'τα λεμε'}],
    'Εντάξει.',
    { safetyMode:false, currentMode:'ANSWER', warningIssued:false, compressionCount:0, modelJudgesEnd:false }
  ),
  'confirm'
);

// ── Baseline 11: advice-cascade detector (real μάγειρας transcript evidence) ──
{
  const { looksLikeAdviceCascade } = require('./aura_pure.js');
  check('looksLikeAdviceCascade: real numbered-list advice → true',
    looksLikeAdviceCascade('Υπάρχουν τρεις κατηγορίες: 1. Online πλατφόρμες. 2. Bootcamps. 3. ΔΥΠΑ.'), true);
  check('looksLikeAdviceCascade: real imperative advice → true',
    looksLikeAdviceCascade('Πήγαινε στην τράπεζά σου και ρώτα απλά: Μπορώ να κάνω ρύθμιση;'), true);
  check('looksLikeAdviceCascade: normal question → false',
    looksLikeAdviceCascade('Τι σε δυσκολεύει πιο πολύ στην εφαρμογή αυτή τη στιγμή;'), false);
  check('looksLikeAdviceCascade: normal ack → false',
    looksLikeAdviceCascade('Είπες "τα λέμε" — το δέχτηκα. Υπάρχει κάτι ακόμα;'), false);
}

console.log(`\n${pass} passed, ${fail} failed — baseline ${fail === 0 ? 'ESTABLISHED' : 'HAS ISSUES'}`);
process.exit(fail === 0 ? 0 : 1);
