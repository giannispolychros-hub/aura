// ── intentNoRoads: ΠΑΘΗΤΙΚΟΣ ΜΕΤΡΗΤΗΣ (απόφαση ιδρυτή, 2026-10-01) ────────────────────────────────────────────
//
// WHY. In the fifth real session the user said "ίσως ασχοληθώ και το χτίσω", answered "Τίποτα" to "τι σε εμποδίζει",
// and AURA closed with a goodbye — no road was ever laid out. The founder agreed NOT to add a signal to the model; only
// to MEASURE how often this happens, so a future decision rests on data. This is that measurement and nothing else.
//
// ONE count per session, when ALL THREE hold:
//   (α) the user expressed UNCERTAIN INTENT in their own words: «ίσως» + an action verb, «σκέφτομαι να», «μάλλον θα»;
//   (β) no concrete step or commitment followed — read from the app's own existing records, never from a new detector;
//   (γ) the session closed with NO assistant reply that set two or more of the user's own phrases side by side, and
//       no road map was ever delivered.
//
// KNOWN LIMITS, pinned below rather than hidden:
//   • (β) inherits the blind spots of detectsConcreteStep and the COMMITMENT capture ("Το Claude" and "Θα το χτίσω"
//     are invisible to both). So it OVER-counts sessions in which the user did name a step in words those detectors
//     do not know. It is a measurement of "no step the app could see", not of "no step".
//   • (γ) reads FORM: quoted spans («…», “…», "…") and unquoted verbatim runs of 3+ consecutive user words. It cannot
//     tell a faithful mirror from a paraphrase that happens to reuse words.
//
// OBSERVATION ONLY: nothing reads the result, the prompt and the model never see it, and it adds no ref (it is computed
// from `messages` at the end, like roadMap). COMMITMENT is not modified. Fixtures are SYNTHETIC; no user text is stored.
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function extract(name) { const s = raw.indexOf('function ' + name + '('); return s < 0 ? null : raw.slice(s, raw.indexOf('\n}', s) + 2); }

const SRC = extract('detectsIntentWithoutRoads');
assert('detectsIntentWithoutRoads is defined in App.jsx', !!SRC);
let D = null;
try { D = eval('(' + SRC + ')'); } catch (e) { console.log('FAIL — evaluates standalone: ' + e.message); failed++; }
assert('it evaluates standalone (no sibling calls), so suites can lift it', typeof D === 'function');

const u = c => ({ role: 'user', content: c });
const a = c => ({ role: 'assistant', content: c });
// A generic session with no uncertain intent and nothing else.
const PLAIN = [u('Θέλω να καταλάβω γιατί αργώ'), a('Τι σε κρατά;'), u('Ο φόβος μου'), a('Τι θα έλεγες για αυτόν τον φόβο;')];

if (typeof D === 'function') {
  // ── 1. THE MEASURED SHAPE (synthetic) ─────────────────────────────────────────────────────────
  const E_SHAPE = [
    u('Με ενδιαφέρει να δω πώς δουλεύουν τα εργαλεία'), a('Τι ψάχνεις να ξεκαθαρίσεις;'),
    u('Ίσως ασχοληθώ και το χτίσω'), a('Τι σε εμποδίζει να ξεκινήσεις;'),
    u('Τίποτα'), a('Τότε τι είναι το πρώτο βήμα;'),
    u('Το πρώτο εργαλείο'), a('Έχεις ήδη την ιδέα. Καλή τύχη με αυτό.'),
    u('Οκ'), a('Καλή συνέχεια.'),
  ];
  assert('FIRES on the measured shape: uncertain intent, no step the app saw, no juxtaposition', D(E_SHAPE, false) === true);

  // ── 2. (α) THE FORMS OF UNCERTAIN INTENT ──────────────────────────────────────────────────────
  for (const [t, why] of [
    ['Ίσως ασχοληθώ και το χτίσω', 'ίσως + action verb'], ['Ίσως το κάνω αύριο', 'ίσως + κάνω'], ['ίσως φύγω από τη δουλειά', 'lowercase'],
    ['ΙΣΩΣ ΦΥΓΩ', 'capitals'], ['Ισως το ψαξω', 'no accents'], ['Ίσως θα το δοκιμάσω', 'ίσως θα'], ['Ίσως να το χτίσω', 'ίσως να'],
    ['Σκέφτομαι να το χτίσω', 'σκέφτομαι να'], ['Σκεφτομαι να φύγω', 'no accents'],
    ['Μάλλον θα το κάνω', 'μάλλον θα'], ['μαλλον θα φύγω', 'no accents'], ['Ίσως μετακομίσουμε του χρόνου', 'first person plural'],
    ['Ίσως εγγράφομαι στο μάθημα', 'a deponent verb in -ομαι'],
  ]) assert('(α) uncertain intent: «' + t + '» — ' + why, D([u(t), a('Τι σε εμποδίζει;')], false) === true);
  for (const [t, why] of [
    ['Θα το κάνω αύριο', 'a commitment, not uncertainty'], ['Ίσως έχεις δίκιο', 'ίσως + a second-person state'],
    ['Ίσως είναι αργά', 'ίσως + είναι (not an action)'], ['Ίσως ξέρω την απάντηση', 'ίσως + stative verb'], ['Ίσως νομίζω ότι φταίω', 'ίσως + stative verb'],
    ['Δεν σκέφτομαι να φύγω', 'negated'], ['Ίσως ασχοληθώ;', 'a question (conservative: not counted)'], ['Σκέφτεσαι να το χτίσεις;', 'AURA-style question about them'],
    ['Μάλλον έχει δίκιο ο διευθυντής', 'μάλλον without θα'], ['Θέλω να το δοκιμάσω', 'desire, not uncertainty'],
    ['Ένα σκέφτομαι συνέχεια', 'σκέφτομαι without να'], ['Ίσως ασχοληθώ?', 'a Latin question mark'],
    ['Ίσως πιστεύω ότι φταίω', 'stative: πιστεύω'], ['Ίσως νιώθω ότι φταίω', 'stative: νιώθω'], ['Ίσως αισθάνομαι ότι φταίω', 'stative: αισθάνομαι'],
    ['Ίσως μπορώ να φύγω', 'stative: μπορώ'], ['Ίσως θέλω να φύγω', 'stative: θέλω'], ['Ίσως ξέρουμε την απάντηση', 'stative: ξέρουμε'],
    ['Η εξίσωση δεν λύνεται αν φύγω', '«ίσως» only as a fragment of another word (εξίσωση)'],
    ['Ίσως να έχει δίκιο ο διευθυντής μου αλλά εγώ θα φύγω', 'the verb is beyond the 25-character window'],
    ['Ίσως εδώ', 'ίσως + a 2-letter-stem word ending in ω (not a verb)'], ['Ίσως πάντως έχει δίκιο', 'a word that only STARTS like a verb ending (πάντως)'],
    ['Ίσως ασχοληθώ? Δεν ξέρω.', 'a question followed by another sentence'],
  ]) assert('(α) NOT uncertain intent: «' + t + '» — ' + why, D([u(t), a('Τι σε εμποδίζει;')], false) === false);
  assert('(α) a session with no uncertain intent never counts', D(PLAIN, false) === false);
  assert('(α) only the USER\'s words count: AURA saying «ίσως ασχοληθώ» does not',
    D([u('Θέλω να καταλάβω'), a('Ίσως ασχοληθώ και εγώ με αυτό.')], false) === false);

  // ── 3. (β) A STEP OR COMMITMENT THE APP ALREADY RECORDED ──────────────────────────────────────
  assert('(β) a step the app recorded (second argument true) means NO count', D(E_SHAPE, true) === false);
  assert('(β) the second argument is read as a boolean: undefined behaves as no step', D(E_SHAPE) === true);

  // ── 4. (γ) JUXTAPOSITION OF THE USER'S OWN PHRASES ────────────────────────────────────────────
  const mk = reply => [u('Ίσως ασχοληθώ και το χτίσω'), a('Τι σε εμποδίζει;'), u('Μου αρέσει ο ρυθμός της Κυριακής'), u('Θέλω ησυχία για να γράφω'), a(reply)];
  assert('(γ) two QUOTED user phrases in one sentence → NOT counted',
    D(mk('Είπες «ο ρυθμός της Κυριακής» και «ησυχία για να γράφω». Ποιο από τα δύο πρώτα;'), false) === false);
  assert('(γ) …with typographic quotes “…”',
    D(mk('Είπες “ο ρυθμός της Κυριακής” και “ησυχία για να γράφω”.'), false) === false);
  assert('(γ) …with straight quotes',
    D(mk('Είπες "ο ρυθμός της Κυριακής" και "ησυχία για να γράφω".'), false) === false);
  assert('(γ) two UNQUOTED verbatim runs of 3+ user words in one sentence → NOT counted',
    D(mk('Το ένα φέρνει ο ρυθμός της Κυριακής και το άλλο ησυχία για να γράφω.'), false) === false);
  assert('(γ) accents and case do not hide a verbatim run',
    D(mk('Το ένα φέρνει Ο ΡΥΘΜΟΣ ΤΗΣ ΚΥΡΙΑΚΗΣ και το άλλο ησυχια για να γραφω.'), false) === false);
  assert('(γ) ONE quoted user phrase is not a juxtaposition → counted',
    D(mk('Είπες «ο ρυθμός της Κυριακής». Τι σημαίνει;'), false) === true);
  assert('(γ) two quoted phrases in DIFFERENT sentences are not side by side → counted',
    D(mk('Είπες «ο ρυθμός της Κυριακής». Μετά είπες «ησυχία για να γράφω».'), false) === true);
  assert('(γ) a quoted span the user never wrote is not the user\'s phrase → counted',
    D(mk('Είπες «ένα ήσυχο δωμάτιο» και «μια καθαρή ανάσα».'), false) === true);
  assert('(γ) one user phrase plus one invented quote → counted',
    D(mk('Είπες «ο ρυθμός της Κυριακής» και «μια καθαρή ανάσα».'), false) === true);
  assert('(γ) a run of only 2 shared words is too short unquoted → counted',
    D(mk('Μιλάς για ρυθμός Κυριακής και ησυχία γράφω.'), false) === true);
  const mk2 = reply => [u('Θέλω ησυχία'), u('Μου αρέσει ο ρυθμός'), u('Θέλω να γράφω'), u('Ίσως ασχοληθώ'), a(reply)];
  assert('(γ) two SHORT quoted phrases (1 word each, too short to be unquoted runs) → NOT counted', D(mk2('Είπες «ησυχία» και «ρυθμός».'), false) === false);
  assert('(γ) …typographic quotes', D(mk2('Είπες “ησυχία” και “ρυθμός”.'), false) === false);
  assert('(γ) …straight quotes', D(mk2('Είπες "ησυχία" και "ρυθμός".'), false) === false);
  assert('(γ) …« » on one side and curly on the other', D(mk2('Είπες «ησυχία» και “ρυθμός”.'), false) === false);
  assert('(γ) quoted fragments shorter than 4 letters are not phrases → counted', D(mk2('Είπες «ο» και «να».'), false) === true);
  assert('(γ) a quoted PART of a word is not the user\'s phrase → counted', D(mk2('Είπες «ησυχ» και «ρυθμ».'), false) === true);
  assert('(γ) a quoted phrase inside a longer verbatim run is ONE phrase, not two → counted',
    D(mk('Είπες «ρυθμός» και μετά ο ρυθμός της Κυριακής.'), false) === true);
  assert('(γ) a run made only of short words is not a phrase, so two such runs do not count → counted',
    D([u('Δεν ξέρω τι να κάνω με αυτό. Θα δω τι να κάνω μετά.'), u('Ίσως ασχοληθώ'), a('Δεν ξέρω τι να κάνω και θα δω τι να κάνω.')], false) === true);
  assert('(γ) the SAME phrase twice is one fragment, not two → counted',
    D(mk('Είπες «ο ρυθμός της Κυριακής» και ξανά «ο ρυθμός της Κυριακής».'), false) === true);
  assert('(γ) a juxtaposition in ANY assistant reply is enough, even the first',
    D([u('Μου αρέσει ο ρυθμός της Κυριακής'), u('Θέλω ησυχία για να γράφω'), a('Είπες «ο ρυθμός της Κυριακής» και «ησυχία για να γράφω».'), u('Ίσως ασχοληθώ'), a('Τι σε εμποδίζει;')], false) === false);
  assert('(γ) only ASSISTANT replies are inspected: a short user message quoting two of their own words is not a juxtaposition by AURA → counted',
    D([u('Ίσως ασχοληθώ'), u('«ησυχία» «ρυθμός»'), a('Τι σε εμποδίζει;')], false) === true);
  assert('(γ) only ASSISTANT replies are inspected: the user quoting themselves does not help',
    D([u('Μου αρέσει ο ρυθμός της Κυριακής'), u('Είπα «ο ρυθμός της Κυριακής» και «ησυχία για να γράφω»'), u('Ίσως ασχοληθώ'), a('Τι σε εμποδίζει;')], false) === true);

  // ── 5. INPUT HYGIENE ──────────────────────────────────────────────────────────────────────────
  assert('non-array, empty and malformed input is false, never a throw',
    D(null, false) === false && D(undefined, false) === false && D([], false) === false && D('x', false) === false &&
    D([null, {}, { role: 'user' }, { role: 'user', content: null }, { role: 'assistant', content: 5 }], false) === false);
  assert('a non-string content after an uncertain intent does not throw and does not change the verdict',
    D([u('Ίσως ασχοληθώ'), { role: 'assistant', content: 5 }, { role: 'assistant', content: null }], false) === true);
  assert('a message without a role is ignored', D([{ content: 'Ίσως ασχοληθώ' }], false) === false);
  assert('the result is a strict boolean', D(E_SHAPE, false) === true && D(PLAIN, false) === false);
}

// ── 6. WIRING — one integer in session_completed, no new state, no consumer ─────────────────────
const teleAt = CODE.indexOf('recordTelemetry("session_completed"');
const tele = CODE.slice(teleAt, CODE.indexOf('});', teleAt));
const beforeTele = CODE.slice(Math.max(0, teleAt - 1800), teleAt);
assert('NON-VACUITY: the session_completed block is findable', teleAt > 0 && tele.length > 200);
assert('session_completed carries intentNoRoads as 0/1, an integer recordTelemetry keeps', /intentNoRoads:\s*_intentNoRoads\s*\?\s*1\s*:\s*0/.test(tele));
assert('intentNoRoads is a legal telemetry key', /^[a-zA-Z]{1,24}$/.test('intentNoRoads'));
assert('it is computed from the real parser\'s map flag: a delivered road map means NO count',
  /const _intentNoRoads\s*=\s*!_roadMap\s*&&\s*detectsIntentWithoutRoads\(/.test(beforeTele));
assert('(β) reads the app\'s EXISTING records only: concreteStepStated and the COMMITMENT capture\'s committed entry',
  /detectsIntentWithoutRoads\(messages,\s*concreteStepStated\.current\s*\|\|\s*!!\(commitmentPair\.current\s*&&\s*commitmentPair\.current\.committed\)\)/.test(beforeTele));
assert('no new ref was added for it', !/intentNoRoads\w*\s*=\s*useRef/.test(CODE) && !/(?:const|let)\s+\w*[iI]ntentNoRoads\w*\s*=\s*useRef/.test(CODE));
assert('COUNTS ONLY: no text travels with it', !/intentNoRoads:[^\n]*(content|text|reply|message)/i.test(tele));
assert('NO CONSUMER: nothing reads it to decide anything',
  (CODE.match(/intentNoRoads:/g) || []).length === 1 && (CODE.match(/_intentNoRoads/g) || []).length === 2 && (CODE.match(/intentNoRoads/g) || []).length === 3);
assert('the model never sees it: absent from the prompt', !/intentNoRoads/.test(PROMPT));
assert('the function is called from exactly one place', (CODE.match(/detectsIntentWithoutRoads\(/g) || []).length === 2); // definition + the one call
assert('OBSERVATION ONLY: nothing assigns a reply or a ctx from it', !/(displayText|Ctx|dynamicSuffix)[^\n]*detectsIntentWithoutRoads/.test(CODE));

// ── 7. COMMITMENT AND THE LIVE STEP GATE ARE UNTOUCHED ──────────────────────────────────────────
const cs = extract('classifyStepIntent'), bc = extract('buildCommitmentSignal'), dc = extract('detectsConcreteStep');
assert('classifyStepIntent still returns null for the hesitation without «θα» (its documented blind spot is not "fixed")',
  !!cs && eval('(' + cs + ')')('Ίσως ασχοληθώ και το χτίσω') === null);
assert('detectsConcreteStep still reads its documented case and still misses «Το Claude»',
  !!dc && eval('(' + dc + ')')('Θα το κάνω') === true && eval('(' + dc + ')')('Το Claude') === false);
assert('buildCommitmentSignal is still defined and unchanged in shape', !!bc && /function buildCommitmentSignal\(pair\)/.test(bc));
assert('the Outcome Scale override is untouched',
  /if \(concreteStepStated\.current && !outcomeScaleAsked\.current && parseThreeBeatShift\(displayText\) !== null && !matchesClosingWord\(lastUserMsg\) && !declaresClosing\(lastUserMsg\)\)/.test(CODE));

// ── 8. THE OTHER COUNTERS ALREADY REACH THE EXPORT (founder asked to check) ─────────────────────
for (const f of ['violEvaluation', 'violAdvice', 'violRole', 'violRoadMapMissing', 'violAdviceCascade', 'unsourcedOptions', 'userClaims', 'unverifiedFoundClaims', 'gatesDue', 'gatesIgnored'])
  assert('session_completed already carries ' + f, new RegExp('\\b' + f + ':').test(tele));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
