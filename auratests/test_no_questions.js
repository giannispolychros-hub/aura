const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
for (const name of ['detectsNoQuestionsRequest', 'detectsMethodFailureSignal']) {
  const startIdx = raw.indexOf('function ' + name);
  const endIdx = raw.indexOf('\n}', startIdx) + 2;
  eval(raw.slice(startIdx, endIdx));
}

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

assert("Detects 'χωρίς ερωτήσεις'", detectsNoQuestionsRequest("μπορείς να βοηθήσεις χωρίς ερωτήσεις;"));
assert("Detects 'χωρίς να με ρωτάς'", detectsNoQuestionsRequest("απάντησέ μου χωρίς να με ρωτάς"));
assert("Detects 'μη με ρωτάς'", detectsNoQuestionsRequest("μη με ρωτάς άλλο, πες μου"));
assert("Detects 'σταμάτα να ρωτάς'", detectsNoQuestionsRequest("σταμάτα να ρωτάς και άκου"));
assert("Detects 'βοηθήσεις χωρίς' (real transcript phrasing)", detectsNoQuestionsRequest("Μπορείς να βοηθήσεις χωρίς να ρωτάς;"));
assert("Does NOT false-fire on unrelated message", !detectsNoQuestionsRequest("δεν ξέρω τι να κάνω με αυτό το πρόβλημα"));
assert("Does NOT false-fire on normal question about the app", !detectsNoQuestionsRequest("γιατί μου κάνεις τόσες ερωτήσεις σήμερα, καλή η κουβέντα όμως"));

// F011: the 5 remaining detectsNoQuestionsRequest positives above must still fire after the split.
["μπορείς να βοηθήσεις χωρίς ερωτήσεις;", "απάντησέ μου χωρίς να με ρωτάς", "μη με ρωτάς άλλο, πες μου", "σταμάτα να ρωτάς και άκου", "Μπορείς να βοηθήσεις χωρίς να ρωτάς;"]
  .forEach(msg => assert(`F011: '${msg}' still fires detectsNoQuestionsRequest after split`, detectsNoQuestionsRequest(msg)));

// F011: the 8 method-failure phrases must now fire detectsMethodFailureSignal, and must NOT
// fire detectsNoQuestionsRequest (they were removed from it and routed to the new function instead).
const methodFailurePhrases = [
  "γυρίζουμε γύρω", "δεν πάμε πουθενά", "χάνω τον χρόνο μου", "το ίδιο λέμε",
  "δεν με βοηθάς", "με κούρασες", "ούτε εσύ βοηθάς", "δεν βοηθάει αυτό",
];
methodFailurePhrases.forEach(msg => {
  assert(`F011: '${msg}' fires detectsMethodFailureSignal`, detectsMethodFailureSignal(msg));
  assert(`F011: '${msg}' does NOT fire detectsNoQuestionsRequest`, !detectsNoQuestionsRequest(msg));
});

// WIDENED NET (real-transcript evidence: "δεν βρήκαμε και τίποτα... μια τρύπα στο νερό" and
// "τα αναλύσαμε όλα και δεν βγάζουμε κάτι" — genuine method-failure signals the original net
// missed). One accented and one unaccented variant per new pattern, since the existing patterns
// are accent-sensitive and this is the known weakness being addressed here.
const widenedNetPhrases = [
  "δεν βρήκαμε τίποτα", "δεν βρηκαμε τιποτα",
  "δεν βγάλαμε και τίποτα",
  "δεν βγάζουμε άκρη", "δεν βγαζουμε τιποτα",
  "τρύπα στο νερό", "τρυπα στο νερο",
  "δεν καταλήξαμε", "δεν καταληξαμε",
  "χάσαμε τον χρόνο μας", "χασαμε τον χρονο μας",
  "δεν προχωράμε", "δεν προχωραμε",
  "μάταια", "ματαια",
];
widenedNetPhrases.forEach(msg => {
  assert(`WIDENED NET: '${msg}' fires detectsMethodFailureSignal`, detectsMethodFailureSignal(msg));
  assert(`WIDENED NET: '${msg}' does NOT fire detectsNoQuestionsRequest`, !detectsNoQuestionsRequest(msg));
});

// The two real, full transcript sentences that motivated this widening.
const realTranscriptSentences = [
  "δεν βρήκαμε και τίποτα τι έπαθες με τι κάναμε τίποτα δεν καταλάβαμε μία τρύπα στο νερό",
  "δεν νομίζω ότι έχει κάποιο νόημα τα αναλύσαμε όλα και δεν βγάζουμε κάτι",
];
realTranscriptSentences.forEach(msg => {
  assert(`REAL TRANSCRIPT: '${msg}' fires detectsMethodFailureSignal`, detectsMethodFailureSignal(msg));
  assert(`REAL TRANSCRIPT: '${msg}' does NOT fire detectsNoQuestionsRequest`, !detectsNoQuestionsRequest(msg));
});

// NEGATIVE CONTROLS: prove the A/B split still holds after widening the net. "τι προτείνεις"
// and "θέλω λύση" belong to detectsNoQuestionsRequest's own territory (information-request,
// not method-failure) — they must still fire there and must NOT fire the widened net.
assert("A/B split: 'τι προτείνεις' still fires detectsNoQuestionsRequest", detectsNoQuestionsRequest("τι προτείνεις"));
assert("A/B split: 'τι προτείνεις' does NOT fire detectsMethodFailureSignal", !detectsMethodFailureSignal("τι προτείνεις"));
assert("A/B split: 'θέλω λύση' still fires detectsNoQuestionsRequest", detectsNoQuestionsRequest("θέλω λύση"));
assert("A/B split: 'θέλω λύση' does NOT fire detectsMethodFailureSignal", !detectsMethodFailureSignal("θέλω λύση"));
// General neutral phrase — must not fire either detector.
assert("Neutral: 'δεν ξέρω τι να κάνω' does NOT fire detectsMethodFailureSignal", !detectsMethodFailureSignal("δεν ξέρω τι να κάνω"));
assert("Neutral: 'δεν ξέρω τι να κάνω' does NOT fire detectsNoQuestionsRequest", !detectsNoQuestionsRequest("δεν ξέρω τι να κάνω"));

// LEVEL 1 LEXICAL GAPS (structural audit finding: SPECIFICITY ORDERING's own worked examples for
// Level 1 "explicit user words" — CONVERSATION STRATEGY SWITCH's "γύρω γύρω"/"δεν βοηθήθηκα"/
// "αναμασάμε"/"δεν αλλάζει κάτι", and PRIORITY INTERRUPT LAYER's "σταμάτα τις ερωτήσεις" — were
// not actually caught by the detectors the prompt implies back them. Filling the gap so the
// prompt's own canonical examples are code-verified, not just asserted.)
const methodFailureLevel1Phrases = [
  "γύρω γύρω", "γυρω γυρω",
  "δεν βοηθήθηκα", "δεν βοηθηθηκα",
  "αναμασάμε", "αναμασαμε", "αναμασάς", "αναμασάει",
  "δεν αλλάζει κάτι", "δεν αλλαζει κατι", "δεν αλλάζει τίποτα",
];
methodFailureLevel1Phrases.forEach(msg => {
  assert(`LEVEL1 GAP: '${msg}' fires detectsMethodFailureSignal`, detectsMethodFailureSignal(msg));
  assert(`LEVEL1 GAP: '${msg}' does NOT fire detectsNoQuestionsRequest`, !detectsNoQuestionsRequest(msg));
});

// Negative controls for the 4 new detectsMethodFailureSignal patterns.
assert("LEVEL1 GAP negative: 'γύρισα γύρω από το τετράγωνο' does NOT fire (literal, not method failure)",
  !detectsMethodFailureSignal("γύρισα γύρω από το τετράγωνο"));
assert("LEVEL1 GAP negative: 'με βοήθησε πολύ αυτό' does NOT fire (positive, not a failure)",
  !detectsMethodFailureSignal("με βοήθησε πολύ αυτό"));
assert("LEVEL1 GAP negative: 'αναμασούσα το φαγητό μου' does NOT fire (literal chewing, different verb form)",
  !detectsMethodFailureSignal("αναμασούσα το φαγητό μου"));
// KNOWN BROAD MATCH, confirmed and reported per instructions, NOT silently fixed: the pattern is a
// plain substring test, so "δεν αλλάζει κάτι" inside a longer sentence still fires — same behavior
// class as every other pattern in this detector (substring match, no anchoring). Documented here
// as a known characteristic, not asserted as "correctly rejected".
assert("LEVEL1 GAP known-broad: 'δεν αλλάζει κάτι στη ζωή μου αυτή τη στιγμή' DOES fire (substring match — reported, not fixed, per instructions)",
  detectsMethodFailureSignal("δεν αλλάζει κάτι στη ζωή μου αυτή τη στιγμή"));

// New detectsNoQuestionsRequest pattern: "σταμάτα (τις) ερωτήσεις" (noun form — the existing
// pattern only caught the verb form "ρωτάς").
const noQuestionsLevel1Phrases = ["σταμάτα τις ερωτήσεις", "σταματα τις ερωτησεις", "σταμάτα ερωτήσεις"];
noQuestionsLevel1Phrases.forEach(msg => {
  assert(`LEVEL1 GAP: '${msg}' fires detectsNoQuestionsRequest`, detectsNoQuestionsRequest(msg));
  assert(`LEVEL1 GAP: '${msg}' does NOT fire detectsMethodFailureSignal`, !detectsMethodFailureSignal(msg));
});
assert("LEVEL1 GAP negative: 'θα σταματήσω τις ερωτήσεις που κάνω στον εαυτό μου' does NOT fire (different verb form, not a request to AURA)",
  !detectsNoQuestionsRequest("θα σταματήσω τις ερωτήσεις που κάνω στον εαυτό μου"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
