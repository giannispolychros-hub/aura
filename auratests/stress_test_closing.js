const fs = require('fs');
// Self-contained: extract the functions this suite needs directly from App.jsx, so it no longer
// depends on a generated extracted.js sitting in the working directory.
(() => {
  const _p = require('path'), _f = require('fs');
  let raw = null;
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = _p.join(__dirname, c);
    if (_f.existsSync(x)) { raw = _f.readFileSync(x, 'utf8'); break; }
  }
  if (!raw) throw new Error('App.jsx not found. Put these files next to App.jsx, or in a tests/ folder beside src/');
  const names = ['isBareEmojiOrAcknowledgment','matchesClosingWord','endsWithClosingSignal','wasThirdTriggerAsked','isModelPreClosing','decideTermination','stripAraDeclarative','detectPattern','detectAssistantSelfRepetition','sanitizeForPromptContext','capMessageHistory','detectsBinaryOppositionPhrasing','parseThreeBeatShift','parseRoadMap','detectUserStagnation','normalizeGreekText'];
  let src = '';
  for (const n of names) {
    const s = raw.indexOf('function ' + n + '(');
    if (s < 0) continue;
    const e = raw.indexOf('\n}', s) + 2;
    src += raw.slice(s, e) + '\n';
  }
  eval(src);
  for (const n of names) { try { global[n] = eval(n); } catch (e) {} }
})();

let pass = 0, fail = 0;
function check(id, desc, cond) {
  if (cond) { pass++; }
  else { fail++; console.log("FAIL — " + id + " — " + desc); }
}

// Helper: build a msgs array with enough prior padding to satisfy userMsgsAll.length >= 4,
// where the padding message is deliberately LONG (this is exactly what the real bug was:
// a long message 2 turns back should never block a clean last-message signal).
function buildMsgs(lastUserMsg, opts = {}) {
  const pad = opts.longPad !== false
    ? "Αυτό είναι ένα σκόπιμα μεγάλο μήνυμα με πολλές λέξεις για να ελεγχθεί ότι δεν μπλοκάρει το closure πια."
    : "ok";
  return [
    { role: "user", content: "αρχικό μήνυμα" },
    { role: "assistant", content: "..." },
    { role: "user", content: "δεύτερο μήνυμα εισαγωγικό" },
    { role: "assistant", content: "..." },
    { role: "user", content: pad },
    { role: "assistant", content: "..." },
    { role: "user", content: lastUserMsg },
  ];
}

function fires(lastUserMsg, opts) {
  return decideTermination(buildMsgs(lastUserMsg, opts), "μια απλή απάντηση χωρίς ερωτηματικό", {
    safetyMode: false, currentMode: "ANSWER", warningIssued: false, compressionCount: 0, modelJudgesEnd: false
  }) === "confirm";
}

// ── 25 scenarios that SHOULD fire (genuine short closing signals) ──
const shouldFire = [
  ["ναι", "plain yes"],
  ["Ναι.", "yes with period"],
  ["ναι!", "yes with exclamation"],
  ["yes", "english yes"],
  ["σωστό", "correct"],
  ["ακριβώς", "exactly"],
  ["κατάλαβα", "understood"],
  ["εντάξει", "ok (greek)"],
  ["οκ", "ok (greek transliteration)"],
  ["ok", "ok (english)"],
  ["νομίζω ναι", "i think yes"],
  ["πιστεύω ναι", "i believe yes"],
  ["τέλος", "the end"],
  ["Τέλος;", "the end, as a question-punctuated closing (real transcript)"],
  ["τελειώσαμε", "we're done"],
  ["αυτό ήταν", "that was it"],
  ["πάω", "i'm going"],
  ["φεύγω", "i'm leaving"],
  ["φτάσαμε", "we've arrived (real transcript fix)"],
  ["Φτάσαμε.", "we've arrived, with period"],
  ["Φτάσαμε!", "we've arrived, with exclamation"],
  ["ΝΑΙ", "all caps yes"],
  ["Εντάξει.", "ok capitalized with period"],
  ["Κατάλαβα!", "understood, capitalized, exclamation"],
  ["τελος", "the end, no accent (common typo)"],
];
shouldFire.forEach(([msg, desc]) => check("SF-" + msg, `SHOULD fire: '${msg}' (${desc})`, fires(msg) === true));

// ── 15 scenarios that should NOT fire (real open content, not closing) ──
const shouldNotFire = [
  ["ναι αλλά θέλω να ρωτήσω κάτι ακόμα", "yes but more to ask — longer, not a clean agreement word"],
  ["Δεν ξέρω τι εννοείς", "confusion, not closing"],
  ["Τι εννοείς με αυτό;", "a real question"],
  ["Έχω κι άλλο θέμα να συζητήσουμε", "explicitly opening new topic"],
  ["Ναι, αλλά υπάρχει και κάτι άλλο που με απασχολεί βαθύτερα", "agreement word present but clearly continuing"],
  ["όχι", "no — not an agreement word at all"],
  ["Δεν έχει νόημα η κουβέντα", "dismissive but long, not a short agreement word — should rely on EXIT tag, not this gate"],
  ["μπορεί", "maybe — ambiguous, not closing"],
  ["ας δούμε", "let's see — not closing"],
  ["Θέλω να συνεχίσουμε", "explicit request to continue"],
  ["ίσως όχι", "maybe not"],
  ["Αυτό με μπερδεύει ακόμα περισσότερο", "confusion increasing"],
  ["συνέχισε", "continue"],
  ["περίμενε", "wait"],
  ["δεν καταλαβαίνω", "i don't understand"],
];
shouldNotFire.forEach(([msg, desc]) => check("NF-" + msg, `should NOT fire: '${msg}' (${desc})`, fires(msg) === false));

// ── 10 edge cases: whitespace, punctuation combos, mixed signals ──
const edgeCases = [
  ["  ναι  ", true, "yes with surrounding whitespace (trimmed)"],
  ["ναι;", true, "yes with question mark punctuation — still matches the trailing-punct group"],
  ["ναι ναι ναι", true, "repeated word — unified matchesClosingWord (global strip) now correctly treats this as clear emphatic agreement, not a defect"],
  ["", false, "empty string — must not crash or false-fire"],
  ["ναι.", true, "yes with single trailing period"],
  ["ναι..", true, "yes with double trailing period — unified matcher strips all punctuation, reasonably still clear agreement"],
  ["Καλά ναι", false, "yes preceded by another word — not an exact match"],
  ["Οκκ", true, "real-transcript: casual letter-doubling emphasis ('Οκκ' instead of 'Οκ') now correctly matches via letter-repetition collapsing"],
  ["ναιιι", true, "casual letter-doubling on 'ναι' — same fix, general case"],
  ["φτασαμε", true, "φτάσαμε without accent (common typing pattern)"],
  ["ΦΤΑΣΑΜΕ", true, "all caps φτάσαμε"],
  ["τέλος.", true, "τέλος with trailing period"],
];
edgeCases.forEach(([msg, expected, desc]) => check("EC-" + msg, `edge case '${msg}' (${desc}) -> expected ${expected}`, fires(msg) === expected));

// Confirm the actual real-bug regression: long pad message must NOT block a clean last message
check("REGRESSION-1", "long message 2 turns back does NOT block clean last-message closing (the real bug)", fires("φτάσαμε", { longPad: true }) === true);
check("REGRESSION-2", "same check with short pad too, for comparison", fires("φτάσαμε", { longPad: false }) === true);
check("REGRESSION-3", "'Τα λέμε.' — real transcript, second missing-word finding, same category as φτάσαμε", fires("Τα λέμε.") === true);

console.log(`\n${pass} passed, ${fail} failed (out of ${pass + fail} scenarios)`);
