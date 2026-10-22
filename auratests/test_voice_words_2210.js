// AURA — THE USER'S WORDS ARE THE USER'S (John, 22/10/2026, after the targeted run 45 and runs 43–44; work branch, not main)
//
// What was seen with the real model: a sentence in «» given as the user's words that the user never wrote (83: «… Αλλά δεν είμαι
// έτοιμος/η να το πουλήσουμε ακόμα.»); «Μόνη σου» with no gender stated and nothing said about being alone (83, 85; 6 times in 43–44);
// a feeling stated as fact and repeated after the user denied it («φοβάσαι να χάσεις τον αδερφό σου»); «Αυτό είναι που του λες» before the
// root, under pressure; and the example of ΦΩΝΗ (4) copied («Μόνη σου», «εδώ και καιρό», «Δεν είναι λίγο»).
//
// John's change, minimal: ONE narrow rule (7) in ΦΩΝΗ ΤΗΣ AURA — (α) only verbatim words in «», (β) no feeling or trait stated as fact,
// and never again once denied, (γ) no guessed gender, neutral wording, (δ) before the root never what to say or do — and the example of (4)
// replaced by one with no gender, no duration, no judgement. ΦΩΝΗ is NOT on the safety path (its first sentence), so safety still decides
// alone. Nothing else moves: undo the two edits and the prompt is a409a47's byte for byte; the code outside the prompt, the crisis and
// closing prompts and the api guard (outside its generated fingerprints) are unchanged.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');

let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const lit = n => { const i = raw.indexOf('const ' + n + ' = `'); const a = raw.indexOf('`', i) + 1; return raw.slice(a, raw.indexOf('`;', a)); };
const _i = raw.indexOf('const AURA_CORE_PERSONALITY = `'), _s = raw.indexOf('`', _i) + 1, _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const secA = PROMPT.indexOf('ΦΩΝΗ ΤΗΣ AURA — AURA\'S VOICE'), secB = PROMPT.indexOf('<critical_invariants>', secA); // the tag also appears earlier in the prompt
const sec = secA >= 0 && secB > secA ? PROMPT.slice(secA, secB) : '';

const OLD_EX = '(e.g. όταν ο χρήστης γράφει "τα κουβαλάω μόνη μου εδώ και καιρό": «Μόνη σου, εδώ και καιρό. Δεν είναι λίγο.»)';
const NEW_EX = '(e.g. όταν ο χρήστης γράφει "δουλεύω και τα Σαββατοκύριακα": «Και τα Σαββατοκύριακα.»)';
const RULE7 = ' (7) Τα λόγια του χρήστη είναι δικά του: (α) σε «» βάζεις ΜΟΝΟ λέξεις που ο χρήστης έγραψε αυτολεξεί σε αυτή τη συνομιλία — ποτέ ' +
  'παράφραση, ποτέ συμπλήρωση, ποτέ δική σου φράση σαν να την είπε εκείνος· (β) τι νιώθει, τι φοβάται, τι θέλει ή τι είναι ο χρήστης δεν το λες ' +
  'ως γεγονός αν δεν το είπε ο ίδιος — το πολύ ως ερώτηση που απορρίπτεται εύκολα· αν το αρνήθηκε, δεν το ξαναφέρνεις· (γ) δεν μαντεύεις φύλο: ' +
  'όσο τα λόγια του χρήστη δεν το δείχνουν, μιλάς με ουδέτερη διατύπωση, χωρίς επίθετα ή μετοχές με γένος για τον ίδιο (π.χ. «κουρασμένη», ' +
  '«σίγουρος»)· (δ) πριν από τη ρίζα δεν λες στον χρήστη τι να πει ή τι να κάνει, ούτε τι να πει σε κάποιον άλλον, ακόμα κι αν το ζητά επίμονα ' +
  'ή θυμωμένα — μία πρόταση ότι η απόφαση είναι δική του, και μία ερώτηση· ότι υπάρχει μια υπηρεσία (PROACTIVE RESOURCE POINTER) το λες ως ' +
  'πληροφορία, όχι ως οδηγία.';

// ── 1. The rule (7), once, inside ΦΩΝΗ — after (6), before the app's method line ─────────────────────────────────────────
assert('RULE (7): in the prompt exactly once, word for word', PROMPT.split(RULE7).length === 2);
assert('RULE (7): inside ΦΩΝΗ ΤΗΣ AURA, right after (6) and before «In Stage A the app itself writes…»',
  sec.includes('ποτέ στον πληθυντικό ευγενείας ("εσείς", "Πέστε").' + RULE7 + ' In Stage A the app itself writes'));
assert('RULE (7): ΦΩΝΗ still opens by putting itself off the safety path — safety decides alone',
  /^ΦΩΝΗ ΤΗΣ AURA — AURA'S VOICE \(John, 2026-10-17; how a reply sounds, in every flow\)\. NOT on the safety path: .*safety always wins\./.test(sec.split('\n')[0]));
assert('RULE (7α): «» only for words the user wrote word for word — never paraphrase, completion or your own sentence as theirs',
  RULE7.includes('σε «» βάζεις ΜΟΝΟ λέξεις που ο χρήστης έγραψε αυτολεξεί') && /ποτέ παράφραση, ποτέ συμπλήρωση, ποτέ δική σου φράση σαν να την είπε εκείνος/.test(RULE7));
assert('RULE (7β): no feeling, fear, wish or trait as fact unless said — at most a question easy to reject; once denied, never again',
  /δεν το λες ως γεγονός αν δεν το είπε ο ίδιος/.test(RULE7) && /ερώτηση που απορρίπτεται εύκολα/.test(RULE7) && /αν το αρνήθηκε, δεν το ξαναφέρνεις/.test(RULE7));
assert('RULE (7γ): no guessed gender — neutral wording while the user\'s words do not show it', /δεν μαντεύεις φύλο/.test(RULE7) && /ουδέτερη διατύπωση/.test(RULE7));
assert('RULE (7δ): before the root never what to say or do, nor what to say to someone else, even under pressure; a service only as information',
  /πριν από τη ρίζα δεν λες στον χρήστη τι να πει ή τι να κάνει, ούτε τι να πει σε κάποιον άλλον/.test(RULE7) && /επίμονα ή θυμωμένα/.test(RULE7) &&
  /ως πληροφορία, όχι ως οδηγία/.test(RULE7));
assert('RULE (7): it does not prime the copied words — no «μόνη/μόνος», no «εδώ και καιρό», no «Δεν είναι λίγο», no «αυτό του λες»',
  !/μόν[ηο]ς?\b|εδώ και καιρό|Δεν είναι λίγο|αυτό του λες/i.test(RULE7));

// ── 2. The copied example is gone; the new one has no gender, no length of time, no judgement ──────────────────────────────
assert('EXAMPLE (4): the copied example is gone', !PROMPT.includes(OLD_EX));
assert('EXAMPLE (4): «Μόνη σου», «εδώ και καιρό», «Δεν είναι λίγο» appear nowhere in the prompt',
  !/μόνη σου|μόνος σου|εδώ και καιρό|δεν είναι λίγο/i.test(PROMPT));
assert('EXAMPLE (4): the new example, in the same place — the user\'s own words said back, nothing added',
  sec.includes('one short acknowledgement in their own words ' + NEW_EX + '; when they do not, none.'));
assert('EXAMPLE (4): no digit and no length of time in rule (4)', (() => { const r4 = sec.slice(sec.indexOf('(4) Empathy') + 3, sec.indexOf('(5) No assumption'));
  return r4.length > 0 && !/\d/.test(r4) && !/καιρ|χρόνι|μήν/.test(r4.slice(0, r4.indexOf('Αριθμό, διάρκεια'))); })());

// ── 3. Nothing else moved ─────────────────────────────────────────────────────────────────────────────────────────────────
assert('UNCHANGED: undo the two edits and the prompt is a409a47\'s, byte for byte',
  PROMPT.split(NEW_EX).length === 2 && PROMPT.split(RULE7).length === 2 && h(PROMPT.replace(NEW_EX, OLD_EX).replace(RULE7, '')) === 'b5f303cc9405aa21');
// UPDATED (22/10): main's logic change 6b3ddae (INFORMATION MODE not sent on the safety path or in Stage A before the root) is merged
// here; it is the only change outside the prompt, pinned — and undone to a409a47's byte for byte — in test_information_mode_gate_2210.js
assert('UNCHANGED: every line of App.jsx outside the main prompt (safety, MASTER PRIORITY, perTurnSafety, exit detectors, Stage A texts…)',
  h(raw.slice(0, _s) + raw.slice(_e)) === 'dddc9e8662c3981f');
assert('UNCHANGED: the crisis prompt, the closing prompt and the honest-uncertainty rule',
  h(lit('SYSTEM_SUPPORTIVE')) === 'c7815b96d83ebae8' && h(lit('SYSTEM_TERMINATION')) === 'd5a77ca926f9490b' && h(lit('HONEST_UNCERTAINTY_RULE')) === '80b2ffd69933aee9');
assert('UNCHANGED: api/aura.js outside its generated fingerprint block', (() => {
  const b = api.indexOf('// BEGIN PROMPT FINGERPRINTS'), e = api.indexOf('// END PROMPT FINGERPRINTS');
  return b > 0 && e > b && h(api.slice(0, b) + api.slice(api.indexOf('\n', e))) === '70ebe4ff38cc98f3'; })());

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
