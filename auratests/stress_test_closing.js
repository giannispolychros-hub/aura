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
  const names = ['isBareEmojiOrAcknowledgment','matchesClosingWord','endsWithClosingSignal','wasThirdTriggerAsked','isModelPreClosing','isExplicitClosure','decideTermination','stripAraDeclarative','detectPattern','detectAssistantSelfRepetition','sanitizeForPromptContext','capMessageHistory','detectsBinaryOppositionPhrasing','parseThreeBeatShift','parseRoadMap','detectUserStagnation','normalizeGreekText'];
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

// ── F015: explicit user closure must override AURA's own trailing question ──
// Real-transcript bug: user wrote "Θα το σκεφτώ... Κλείνουμε" and AURA answered with a new
// question instead of closing. Root cause: textAsksRealQuestion in decideTermination forced
// decision back to "none" whenever AURA's OWN reply ended in ;/?, with zero regard for how
// explicit the user's own closing request was. NONE of the 55 scenarios above exercise this
// path — fires() always passes a hardcoded text with no trailing question mark. This helper
// exists specifically to exercise it.
function firesWithQuestion(lastUserMsg, opts = {}) {
  const auraText = opts.auraText || "Τι σε κάνει να νιώθεις έτσι;";
  return decideTermination(buildMsgs(lastUserMsg, opts), auraText, {
    safetyMode: opts.safetyMode || false, currentMode: "ANSWER", warningIssued: false, compressionCount: 0, modelJudgesEnd: false
  });
}

// (a) POSITIVE: explicit closure + AURA's reply ends in a question → must still close.
["Κλείνουμε", "τέλος", "τα λέμε", "ευχαριστώ"].forEach(msg => {
  check("F015-POS-" + msg, `explicit closure '${msg}' + AURA question -> decision is "confirm" (does NOT get blocked)`, firesWithQuestion(msg) === "confirm");
});

// (b) NEGATIVE (safety): safetyMode must win regardless of explicit closure or trailing question.
check("F015-SAFETY", 'safetyMode=true + "Κλείνουμε" + AURA question -> decision is "none" (safety always wins)',
  firesWithQuestion("Κλείνουμε", { safetyMode: true }) === "none");

// (c) NEGATIVE (false positive guard): a message that merely contains closing-adjacent words
// inside a longer, still-open thought must NOT be treated as explicit closure.
check("F015-FALSEPOS", '"νομίζω τελειώσαμε προς το παρόν, αλλά θέλω να πω κάτι ακόμα" + AURA question -> does NOT close',
  firesWithQuestion("νομίζω τελειώσαμε προς το παρόν, αλλά θέλω να πω κάτι ακόμα") !== "confirm");

// (d) NEGATIVE (original rule preserved): a plain substantive message, not a closing signal at
// all, + AURA's reply ending in a real question -> must still NOT close. This is the exact
// scenario the original textAsksRealQuestion guard was built for (real-user evidence: a genuine
// question interrupted by the closure dialog on the same turn) — the narrowing must not break it.
check("F015-ORIGINAL-PROTECTED", 'plain substantive message + AURA question -> does NOT close (original evidence still protected)',
  firesWithQuestion("Δεν είμαι σίγουρος τι να κάνω με αυτό") !== "confirm");

// (e) isExplicitClosure unit tests — every termination/farewell word fires, every bare
// acknowledgement does not.
const explicitClosurePositives = ["Κλείνουμε", "κλεινω", "τέλος", "τελειώσαμε", "σταματάμε", "φεύγω", "παω",
  "αυτό ήταν", "αρκετά για σήμερα", "ας το αφήσουμε εδώ", "φτάνει", "αντίο", "γεια", "τα λέμε",
  "καληνύχτα", "καλή συνέχεια", "καλό βράδυ", "μπάι", "bye", "ευχαριστώ", "επίσης", "παρομοίως"];
explicitClosurePositives.forEach(msg => check("EXPLICIT-POS-" + msg, `isExplicitClosure('${msg}') is true`, isExplicitClosure(msg) === true));

const explicitClosureNegatives = ["ναι", "οκ", "ok", "κατάλαβα", "εντάξει", "σωστό", "ακριβώς", "νομίζω ναι", "πιστεύω ναι", "φτάσαμε"];
explicitClosureNegatives.forEach(msg => check("EXPLICIT-NEG-" + msg, `isExplicitClosure('${msg}') is false`, isExplicitClosure(msg) === false));

check("EXPLICIT-SUBSTRING-1", "isExplicitClosure('στο τέλος της μέρας θα δούμε') is false (substring, not the whole message)",
  isExplicitClosure("στο τέλος της μέρας θα δούμε") === false);
check("EXPLICIT-SUBSTRING-2", "isExplicitClosure('νομίζω τελειώσαμε προς το παρόν, αλλά θέλω να πω κάτι ακόμα') is false",
  isExplicitClosure("νομίζω τελειώσαμε προς το παρόν, αλλά θέλω να πω κάτι ακόμα") === false);

console.log(`\n${pass} passed, ${fail} failed (out of ${pass + fail} scenarios)`);
