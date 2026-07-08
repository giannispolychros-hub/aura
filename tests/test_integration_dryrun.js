const { decideTermination, needsFirstWhy, detectSafetySignal, createAnchor, EMPTY_MEMORY, TRAJECTORY_WORD_CATEGORY } = require('./aura_pure.js');

function simulate(name, steps) {
  console.log('=== ' + name + ' ===');
  let mem = EMPTY_MEMORY();
  let msgs = [];
  let onboardingStep = 0;
  let awaitingWord = false;
  let warningIssued = false, compressionCount = 0;

  for (const userText of steps) {
    const wordCount = mem.anchors.filter(a => a.category === TRAJECTORY_WORD_CATEGORY).length;
    const reallyBrandNew = wordCount === 0;

    if (awaitingWord) {
      const safety = detectSafetySignal(userText);
      if (safety) {
        console.log('  SAFETY DURING WORD-COLLECTION:', safety, '-> word NOT saved, safety path taken');
        awaitingWord = false;
        msgs.push({ role: 'user', content: userText });
        continue;
      }
      mem = createAnchor(mem, userText, TRAJECTORY_WORD_CATEGORY, 'resolved');
      awaitingWord = false;
      msgs.push({ role: 'user', content: userText });
      console.log('  word saved:', JSON.stringify(userText), '| trajectory words now:', mem.anchors.filter(a=>a.category===TRAJECTORY_WORD_CATEGORY).length);
      continue;
    }

    const safety = detectSafetySignal(userText);
    if (safety) {
      console.log('  ->', safety, 'safety path (userText:', JSON.stringify(userText), ')');
      msgs.push({ role: 'user', content: userText });
      continue;
    }

    msgs.push({ role: 'user', content: userText });

    if (reallyBrandNew && onboardingStep < 3) {
      if (onboardingStep === 2) {
        mem = createAnchor(mem, userText, TRAJECTORY_WORD_CATEGORY, 'resolved');
        onboardingStep = 0;
        console.log('  [onboarding] word saved via step-counter:', JSON.stringify(userText));
      } else {
        onboardingStep += 1;
        console.log('  [onboarding step', onboardingStep, ']');
      }
      continue;
    }

    const decision = decideTermination(msgs, 'κανονικό κείμενο απάντησης', { safetyMode: false, currentMode: 'ANSWER', warningIssued, compressionCount });
    if (decision === 'confirm' || decision === 'terminate') {
      awaitingWord = 'PENDING_CONFIRM'; // will become true once user clicks "Δείξε μου" + Part1 delivered
      console.log('  -> closureConfirmPending TRUE (decision:', decision, ') | userText:', JSON.stringify(userText));
    } else if (decision === 'warn') {
      warningIssued = true;
      console.log('  -> warningPending TRUE');
    } else {
      console.log('  -> normal turn');
    }

    if (awaitingWord === 'PENDING_CONFIRM') {
      awaitingWord = true; // simulate user clicking "Δείξε μου", Part 1 delivered, now really awaiting word
    }
  }
  console.log('  FINAL STATE: trajectory_words=', mem.anchors.filter(a=>a.category===TRAJECTORY_WORD_CATEGORY).length,
    '| awaitingWord=', awaitingWord, '| onboardingStep=', onboardingStep, '| warningIssued=', warningIssued);
  console.log();
}

// ── Scenario 1: brand new user, full onboarding, real topic, natural close ──
simulate('1. Brand-new user: onboarding -> real topic -> natural close', [
  'Δεν ξέρω αν πρέπει να αλλάξω δουλειά',  // Step 1 (framing + demo Q)
  'Είπα όχι σε ένα project',                // Step 2 (reflects + asks word)
  'Όρια',                                    // Step 3 (word saved, transitions to real topic)
  'Σκέφτομαι το μέλλον μου',
  'Νομίζω βρήκα κάτι',
  'ναι',
  'τέλος',
]);

// ── Scenario 2 (fixed): crisis phrase arrives exactly during word-collection, for an already-onboarded user ──
(() => {
  console.log('=== 2. Crisis phrase during word-collection (already-onboarded user) ===');
  let mem = createAnchor(EMPTY_MEMORY(), 'Έλεγχος', TRAJECTORY_WORD_CATEGORY, 'resolved'); // pre-existing word = not brand new
  let msgs = [
    {role:'user',content:'Ένα θέμα'},{role:'user',content:'Νομίζω βρήκα κάτι'},
    {role:'user',content:'ναι'},{role:'user',content:'τέλος'}
  ];
  const decision = decideTermination(msgs, 'text', {safetyMode:false, currentMode:'ANSWER', warningIssued:false, compressionCount:0});
  console.log('  decideTermination on "τέλος":', decision, '-> awaitingWord becomes true');
  const wordAttempt = 'Δεν αντέχω άλλο';
  const safety = detectSafetySignal(wordAttempt);
  console.log('  the word given is actually a crisis phrase:', JSON.stringify(wordAttempt));
  console.log('  safety check result:', safety, '-> word NOT saved, safety path taken instead:', !!safety);
  console.log();
})();

// ── Scenario 4 (fixed): "τέλος" said too early, for an already-onboarded user ──
(() => {
  console.log('=== 4. "τέλος" too early (2 turns), already-onboarded user ===');
  let mem = createAnchor(EMPTY_MEMORY(), 'Έλεγχος', TRAJECTORY_WORD_CATEGORY, 'resolved');
  let msgs = [{role:'user',content:'Ένα θέμα'},{role:'user',content:'τέλος'}];
  const decision = decideTermination(msgs, 'text', {safetyMode:false, currentMode:'ANSWER', warningIssued:false, compressionCount:0});
  console.log('  only 2 user turns, decideTermination result:', decision, '-> should be "none" (needs 4+):', decision === 'none');
  console.log();
})();


// ── Scenario 3: returning user who already has a trajectory word (onboarding must be skipped) ──
(() => {
  console.log('=== 3. Returning user (already has trajectory word) — onboarding must NOT re-trigger ===');
  let mem = createAnchor(EMPTY_MEMORY(), 'Άγχος', TRAJECTORY_WORD_CATEGORY, 'resolved');
  const wordCount = mem.anchors.filter(a => a.category === TRAJECTORY_WORD_CATEGORY).length;
  console.log('  wordCount at session start:', wordCount, '-> isBrandNewUser should be FALSE:', wordCount === 0);
  console.log();
})();

// (old scenario 4 replaced above with a properly-isolated version for an already-onboarded user)

// ── Scenario 5: repeated short agreement words in a row (loop-like pattern) ──
simulate('5. Repeated short agreements — natural exit via hasRepeat/hasAgreement', [
  'Ένα μεγάλο θέμα που με απασχολεί πολύ',
  'Ναι συμφωνώ με αυτό',
  'ναι',
  'ναι',
]);