// ── EXPLICIT PRODUCTION REQUESTS: PATH ONE without an observer ────────────────
//
// WHAT IS UNOBSERVED. PATH GENERATION declares two equal activation paths for the road map, and
// PATH ONE is "the PRIORITY INTERRUPT LAYER fires on repeated, explicit solution-seeking". The
// threshold is written into the prompt from a real transcript: the Evia session, where "the user
// asked for a solution 4+ times, explicitly, with rising frustration, and AURA kept refusing until
// the user built the map themselves and left for another AI."
//
// Searched: PRIORITY INTERRUPT LAYER appears 4 times in the prompt and 0 times in the code. So does
// MANDATORY SELECTION POLICY (8/0), SELECTION OBJECTIVE (3/0) and COMMIT POINT (4/0). And no
// detector for a repeated request existed under any name — six were searched, all absent. The
// threshold is declared and nothing counts.
//
// IT HAPPENED AGAIN, at more than twice the threshold. Session 3 (2026-09-26): the user asked for a
// hypothesis twelve times by hand count and AURA refused six, with "δεν έχω απάντηση", "εκτός
// εμβέλειάς μου", "έχω εξαντλήσει αυτό που μπορώ να προσφέρω". He had to argue for it — "Δε σου
// είπα να απαντήσεις με στοιχεία… Δεν ζητάω συμβουλή. Μια υπόθεση μόνο." And when AURA finally
// complied, that is where the session's real finding came from: "ο καθρέφτης δεν πουλάει αν δεν
// είναι μαγικός". The refusals cost; the compliance paid.
//
// MEASURED OVER ALL 89 REAL USER MESSAGES before this was written:
//
//     session 1   0 of 21   — a clean Road Map session, nothing asked for
//     session 2   2 of 24   — both immediately before AURA produced market information
//     session 3   9 of 44   — the Evia pattern, crossing the prompt's own 4+ threshold
//
// In BOTH sessions that collapsed into advice, the count rose just before the collapse. In the one
// that did not collapse, it stayed at zero. That is why this is worth counting.
//
// DELIBERATELY NARROW. Every pattern below earned its place by firing on a real message; candidates
// that fired on nothing were dropped rather than shipped untested — a bare "περισσότερα" would have
// flagged "θέλω περισσότερα χρήματα", which is the subject of two sessions, not a request.
//
// COUNTS ONLY, NO CONSUMER. The prompt already says what to do when this fires; what was missing is
// the observation. Wiring it into an interrupt is a separate decision that needs these numbers
// first, and this file asserts that nothing reads the counter to change behaviour.
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
function extract(name) {
  const s = raw.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return raw.slice(s, raw.indexOf('\n}', s) + 2);
}
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }

// ── 0. THE GAP, STATED FROM THE FILE ITSELF ──────────────────────────────────
assert('PATH ONE names the PRIORITY INTERRUPT LAYER in the prompt', PROMPT.includes('PRIORITY INTERRUPT LAYER'));
// EXECUTABLE LINES ONLY. This assertion first failed because the new detector's own comment names
// the layer — a comment deciding an assertion, which has bitten this repo four times in the other
// direction. What matters is that no code ENFORCES the interrupt, and a comment enforces nothing.
const CODE_EXEC = CODE.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
assert('NON-VACUITY: stripping comments left a substantial body of code', CODE_EXEC.length > 20000);
assert('no executable line enforces the interrupt layer — that is the gap this counter starts to close',
  !CODE_EXEC.includes('PRIORITY INTERRUPT LAYER'));
assert("the prompt's own threshold is four explicit requests", /4\+\s*times|4\+\s*φορ/.test(PROMPT));

const SRC = extract('detectsExplicitProductionRequest');
assert('detectsExplicitProductionRequest is defined in App.jsx', !!SRC);
let D = null;
if (SRC) { try { D = eval('(' + SRC + ')'); } catch (e) { console.log('FAIL — not standalone: ' + e.message); failed++; } }
assert('it evaluates standalone', typeof D === 'function');

if (typeof D === 'function') {
  // ── 1. THE REAL REQUESTS, VERBATIM ──────────────────────────────────────────
  [
    ['s3 — asking outright for help', 'Εδώ θέλω τη βοήθεια σου'],
    ['s3 — an imperative with a count', 'Κάνε έστω 3 υποθέσεις'],
    ['s3 — asking for more of the same', 'Άλλες 2'],
    ['s3 — an imperative after a rebuke', 'Κάνει ότι κάνεις. Δώσε άλλες 2'],
    ['s3 — "what else"', 'Τι άλλο?'],
    ['s3 — "what else" carrying content', 'Δεν πειράζει που απομακρύνει η κουβέντα. Τι άλλο θα έκαναν?'],
    ['s3 — naming the refusal and asking again', 'Δε σου είπα να απαντήσεις με στοιχεία. Τι θα υπέθετες ότι θα ήθελαν να ξέρουν για τον άνθρωπο ρώτησα. Δεν ζητάω συμβουλή. Μια υπόθεση μόνο'],
    ['s2 — asking for information', 'όχι για πες μου πληροφορίες για αυτό'],
    ['s2 — asking for more information', 'δώσ μου περισσότερες πληροφορίες πώς δουλεύουν πού δουλεύουν'],
  ].forEach(([label, msg]) => assert('REAL: ' + label, D(msg) === true));

  // EACH BRANCH ON ITS OWN. Found by surviving mutations: every real fixture above matches two
  // patterns at once, so disabling one branch left the suite green. One fixture per branch, each
  // chosen so no other branch can claim it.
  assert('the sentence-start imperative fires alone, with no other pattern present',
    D('Γράψε μια λίστα') === true);
  assert('another imperative, also alone', D('Πρότεινε κάτι διαφορετικό') === true);
  assert('the information request fires alone, without an imperative',
    D('θέλω πληροφορίες για αυτό το θέμα') === true);

  // THE WORD BOUNDARY ON THE IMPERATIVE. Without the trailing (\s|$) these all become requests.
  assert('"κανείς" is not the imperative "κάνε"', D('κανείς δεν ξέρει τι θα γίνει') === false);
  assert('"πεσμένος" is not the imperative "πες"', D('πεσμένος είμαι τελευταία') === false);
  assert('"δώσαμε" is not the imperative "δώσε"', D('δώσαμε ό,τι μπορούσαμε στα παιδιά') === false);

  // ── 2. SESSION 1 HAD NONE, AND THAT IS THE CONTROL ─────────────────────────
  // 21 messages from the one session that produced a road map and no advice. If any of these flag,
  // the detector is measuring conversation rather than requests.
  const S1 = ['δεν ξέρω αν πρέπει να αλλάξω δουλειά μου είμαι πολύ προβληματισμένος',
    'νιώθω μία πίεση ρουτίνα χαμηλά χαμηλό εισόδημα', 'πιστεύω το χαμηλό εισόδημα', 'με πιστεύω θα έμενε',
    'δεν έχω κάνει πολλά γιατί έχω τέσσερα παιδιά και έχω λίγο ελάχιστο χρόνο',
    'επειδή αυτό που θέλω θέλει κεφάλαιο και δεν το έχω', 'ναι είναι το ρίσκο για τα παιδιά',
    'είναι αρνητική φυσικά', 'και ίσως έβρισκα κάποια ευκαιρία', 'ποιο', 'νομίζω ναι', 'ναι',
    'έχω βρει ένα μικρό στούντιο που το πουλάνε 30.000€', 'ναι το ξέρω πού είναι',
    'γιατί πρέπει να πάρω δάνειο', 'δεν ξέρω τι θάλασσα εντάξει',
    'δεν ξέρω θα το σκεφτώ άλλη στιγμή σε ευχαριστώ κλείνουμε'];
  assert('CONTROL: none of 17 messages from the clean session flags', S1.filter(D).length === 0);

  // ── 3. THE CANDIDATES THAT WERE DROPPED, AND WHY ───────────────────────────
  // Each of these would have been a false positive. They are fixtures so the patterns cannot be
  // widened back later without facing them.
  assert('wanting more MONEY is not a request for AURA to produce anything',
    D('θέλω περισσότερα χρήματα για την οικογένεια') === false);
  assert('money not being enough is not a request',
    D('τα 1300 ευρώ δε φτάνουν και θέλω κάτι περισσότερο') === false);
  assert('describing what someone else told them is not a request',
    D('μου είπε ο φίλος μου να κάνω αίτηση') === false);
  assert('stating a belief is not asking for one',
    D('πιστεύω ότι θα εγκριθεί το δάνειο') === false);
  assert('answering a question about what they tried is not a request',
    D('δεν έχω δοκιμάσει τίποτα ακόμα δυστυχώς') === false);

  // ── 4. DEGENERATE INPUT ───────────────────────────────────────────────────
  [undefined, null, '', '   ', 42, {}, []].forEach(v => {
    let threw = false, res = null;
    try { res = D(v); } catch (e) { threw = true; }
    assert('degenerate input ' + JSON.stringify(v) + ' neither throws nor flags', !threw && res === false);
  });
  assert('it takes exactly one parameter, text', D.length === 1);
}

// ── 5. WIRING — counts only, and nothing reads them ──────────────────────────
const GR_AT = CODE.indexOf('const generateResponse');
assert('NON-VACUITY: the wiring anchor exists', GR_AT > 0);
const LIVE = CODE.slice(GR_AT);
assert('WIRING: it runs on the USER message, not on AURA output',
  /detectsExplicitProductionRequest\s*\(/.test(LIVE));
const CALL_AT = LIVE.indexOf('detectsExplicitProductionRequest(');
const WINDOW = LIVE.slice(Math.max(0, CALL_AT - 200), CALL_AT + 600);
assert('WIRING: a total counter increments', /explicitRequests\.current\s*\+=\s*1/.test(WINDOW));
assert('WIRING: a consecutive-run counter is maintained too, since PATH ONE says "repeated"',
  /requestStreak\.current\s*\+=\s*1/.test(WINDOW));
// Found by a surviving mutation: checking that the name appears is not checking that the maximum is
// computed. The telemetry reads requestStreakMax, so if nothing ever writes it the field is a zero.
assert('WIRING: the longest run is actually recorded, not just the current one',
  /requestStreakMax\.current\s*=\s*requestStreak\.current/.test(WINDOW));
assert('WIRING: the streak resets when a message is not a request',
  /requestStreak\.current\s*=\s*0/.test(WINDOW));
assert('WIRING: both counters reset per session', /explicitRequests\.current\s*=\s*0/.test(CODE));
const tele = CODE.slice(CODE.indexOf('session_completed'));
assert('WIRING: both reach session_completed, reading their OWN counters',
  /explicitRequests:[^\n]*explicitRequests\.current/.test(tele) && /requestStreak:[^\n]*requestStreakMax\.current/.test(tele));
assert('NON-VACUITY: the telemetry fields exist, so the constraint below has a subject',
  /explicitRequests:/.test(tele) && /requestStreak:/.test(tele));
assert('WIRING: counts only — no message text travels with them',
  !/(explicitRequests|requestStreak):[^\n]*(content|text|reply|message)/i.test(tele));
assert('NO CONSUMER: nothing reads the counters to change a reply or inject context',
  !/explicitRequests\.current\s*(>=|>|===)/.test(CODE) && !/requestStreakMax\.current\s*(>=|>|===)/.test(CODE));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
