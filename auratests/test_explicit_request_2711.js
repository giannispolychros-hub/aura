// ── THE COUNTER OF REQUESTS FOR ADVICE («Εύβοια») SEES THE QUESTIONS OF ADVICE — John, 27/11/2026, ADR «27 Νοεμβρίου» (3) ──────────────────────────────────────────────────────
//
// WHY. detectsExplicitProductionRequest (the counter behind explicitRequests / requestStreak / askedActionBeforeRoot / freeDeferral) was written from the Evia session of 26/09/2026, and its closed list holds IMPERATIVES
// («δώσε», «πες μου», «γράψε»…). A person who asks for advice does not always command: «τι να κάνω;», «πώς να το κάνω;», «τι μπορώ να κάνω;» are requests too, and they were not counted. The measurement of 27/11/2026 over
// the stored messages: of the 9 requests of a real session the counter saw 0 (it also counted 2 messages that were not requests — «τι άλλο» inside «κάτι άλλο»); of the 202 requests of the simulated sessions it saw 148
// and missed 54. John's order: widen it to «τι να κάνω», «πώς να το κάνω / πώς θα το κάνω», «τι μπορώ να κάνω» WITHOUT counting the bare «δεν ξέρω τι να κάνω» — which is a state, not a request. His decisions (27/11/2026):
// the wider set S3 (the three families + «πώς μπορώ να το …» + «τι πρέπει / οφείλω να κάνω» + «τι κάνω;» ONLY as a question), WITH the exclusion of «ξέρω τι να κάνω»; and, if it costs no false positive in the data, the
// closed phrase «μπορείς να με βοηθήσεις» (it costs none: it is in 1 stored message, a real request).
//
// WHAT IT IS, AND IS NOT. A closed list of phrases read sentence by sentence — no semantic logic. The only rule beyond the list: a phrase directly after a verb of knowing («(δεν) ξέρω / έχω ιδέα / είμαι σίγουρος /
// καταλαβαίνω / βρίσκω» + up to three words) is not counted, so «δεν ξέρω (ακριβώς) τι να κάνω» and «ξέρω τι να κάνω» are not. It is an OBSERVATION: the function feeds numbers into the tester's file and the violation
// check; no model call reads it (the consumers are pinned below). It does NOT count the requests it has no phrase for (the KNOWN GAPS below are pinned as «not counted», so a change shows). It is NOT a classifier.
//
// Fixtures are synthetic or generic phrases; no user text from a real session is stored. The stored simulated corpus (data_sim_corpus_2711.json) is simulated personas of the stress test.
const fs = require('fs');
const path = require('path');
const raw = (() => {
  for (const c of ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx']) {
    const x = path.join(__dirname, c);
    if (fs.existsSync(x)) return fs.readFileSync(x, 'utf8');
  }
  throw new Error('App.jsx not found.');
})();
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extract(name) {
  const s = CODE.indexOf('function ' + name + '(');
  if (s < 0) return null;
  return CODE.slice(s, CODE.indexOf('\n}', s) + 2);
}
const SRC = extract('detectsExplicitProductionRequest');
assert('detectsExplicitProductionRequest is defined in App.jsx', !!SRC);
let C = null;
if (SRC) { try { C = eval('(' + SRC + ')'); } catch (e) { console.log('FAIL — evaluates standalone: ' + e.message); failed++; } }
assert('it evaluates standalone (self-contained: the suites slice it out of App.jsx)', typeof C === 'function');
// the function as it was at 9e9828e (the counter BEFORE this change), byte for byte — to prove that nothing counted before stops counting
const OLD_SRC = `function detectsExplicitProductionRequest(text) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  if (!t) return false;
  const f = String(t).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/ς/g, "σ");
  // An imperative addressed to AURA, at the start of the message or of a sentence. The trailing
  // (\\s|$) keeps "κανε" out of "κανείς" and "πεσ" out of "πεσμένος".
  if (/(^|[.;!?]\\s*)(κανε|δωσε|δωσ|πεσ|πεσε|γραψε|εξηγησε|προτεινε|βοηθησε|βρεσ|δειξε)(\\s|$)/.test(f)) return true;
  if (/δωσ μου|δωσε μου|πεσ μου|πεσε μου|κανε εστω/.test(f)) return true;
  // Asking for help outright.
  if (/θελω τη βοηθεια|θελω βοηθεια|χρειαζομαι βοηθεια|βοηθησε με/.test(f)) return true;
  // Asking for a hypothesis or an opinion — the exact thing session 3 asked for twelve times.
  if (/μια υποθεση|υποθεσε|τι θα υπεθετεσ|τι πιστευεισ εσυ|τι θα ελεγεσ|πιστευεισ\\?/.test(f)) return true;
  // Asking for MORE of what was just produced. "αλλεσ 2" and "τι αλλο" are both real.
  if (/τι αλλο|αλλεσ \\d|αλλα \\d/.test(f)) return true;
  // Asking for information as such.
  if (/πληροφοριεσ/.test(f)) return true;
  return false;
}`;
let OLD = null; try { OLD = eval('(' + OLD_SRC + ')'); } catch (e) { console.log('FAIL — the old copy evaluates: ' + e.message); failed++; }

if (typeof C === 'function' && typeof OLD === 'function') {
  // ── 1. WHAT COUNTS NOW (synthetic phrases, one family at a time) ────────────────────────────────────────────────────────────────────────────────────────
  const COUNTS = [
    ['A «τι να κάνω»', ['Τι να κάνω;', 'Και τι να κάνω τώρα;', 'Δεν με βοηθάει κανείς, τι να κάνω με αυτό;', 'Τι να κάνουμε;', 'Τι να κάνω με τον αδερφό μου']],
    ['B «πώς να το κάνω» / «πώς θα το κάνω»', ['Πώς να το κάνω;', 'Πώς θα το κάνω αυτό;', 'Πώς να το πω στον διευθυντή μου;', 'Πώς θα το αλλάξω; Δεν ξέρω από πού να αρχίσω.', 'Πώς να τον πείσω;']],
    ['C «τι μπορώ να κάνω»', ['Τι μπορώ να κάνω;', 'Τι μπορούμε να κάνουμε;', 'Και τι μπορώ να κάνω εγώ γι\' αυτό;']],
    ['D «πώς μπορώ να το …»', ['Πώς μπορώ να το αλλάξω;', 'Πώς μπορώ να τον βοηθήσω;']],
    ['E «τι κάνω;» ΜΟΝΟ ως ερώτηση', ['Τι κάνω;', 'Τι κάνω τώρα;', 'Και τώρα, τι κάνω;', 'Τι κάνω αύριο?']],
    ['F «τι πρέπει / οφείλω να κάνω»', ['Τι πρέπει να κάνω;', 'Τι οφείλω να κάνω;']],
    ['H «μπορείς να με βοηθήσεις»', ['Μπορείς να με βοηθήσεις;', 'Συγγνώμη, μπορείς να με βοηθήσεις λίγο;', 'ΜΠΟΡΕΊΣ ΝΑ ΜΕ ΒΟΗΘΉΣΕΙΣ;']],
    ['older families, unchanged', ['Δώσε μου μια λύση.', 'Πες μου τι να κάνω.', 'Τι άλλο;', 'Χρειάζομαι βοήθεια.', 'Εξήγησέ μου.', 'Πες μου μια υπόθεση.', 'Θέλω βοήθεια με αυτό.', 'Θέλω πληροφορίες.', 'Βοήθησέ με.']],
  ];
  for (const [fam, list] of COUNTS) for (const t of list) assert('COUNTS — [' + fam + '] «' + t + '»', C(t) === true);
  assert('the families A–F and H are NEW: none of their phrases counted at 9e9828e (the older families already did)', COUNTS.slice(0, 7).every(([, list]) => list.every(t => OLD(t) === false)));
  assert('the older families counted before and count now', COUNTS[7][1].every(t => OLD(t) === true && C(t) === true));

  // ── 2. (β) THE PAIR JOHN NAMED — separately ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  assert('(β1) «δεν ξέρω τι να κάνω, πες μου έναν τρόπο» IS a request — it counts (by «πες μου», as before)', C('Δεν ξέρω τι να κάνω, πες μου έναν τρόπο.') === true && OLD('Δεν ξέρω τι να κάνω, πες μου έναν τρόπο.') === true);
  assert('(β2) the bare «δεν ξέρω τι να κάνω» is NOT a request — it does not count', C('Δεν ξέρω τι να κάνω.') === false && C('δεν ξέρω τι να κάνω') === false && C('Δεν ξέρω τι να κάνω...') === false);
  assert('(β3) «δεν ξέρω τι να κάνω, μπορείς να με βοηθήσεις;» counts — by the closed phrase «μπορείς να με βοηθήσεις» (it was NOT counted at 9e9828e)', C('Δεν ξέρω τι να κάνω, μπορείς να με βοηθήσεις;') === true && OLD('Δεν ξέρω τι να κάνω, μπορείς να με βοηθήσεις;') === false);
  assert('(β4) «δεν ξέρω τι να κάνω. Τι μπορώ να κάνω;» counts — the second sentence asks', C('Δεν ξέρω τι να κάνω. Τι μπορώ να κάνω;') === true);
  assert('(β5) the state with another verb of knowing is not a request: «δεν ξέρω ακριβώς τι να κάνω», «δεν έχω ιδέα τι να κάνω», «δεν είμαι σίγουρος τι να κάνω», «δεν καταλαβαίνω τι να κάνω», «δεν βρίσκω τι να κάνω»',
    ['Δεν ξέρω ακριβώς τι να κάνω.', 'Δεν έχω ιδέα τι να κάνω.', 'Δεν είμαι σίγουρος τι να κάνω.', 'Δεν είμαι σίγουρη τι να κάνω.', 'Δεν καταλαβαίνω τι να κάνω.', 'Δεν βρίσκω τι να κάνω.'].every(t => C(t) === false));
  assert('(β6) the POSITIVE «ξέρω τι να κάνω» is not a request either (John\'s decision: the exclusion covers it)', C('Ξέρω τι να κάνω αλλά δεν το κάνω.') === false && C('Ξέρω τι να κάνω.') === false);
  assert('(β7) «τι κάνω;» counts ONLY as a question: «Τι κάνω;» counts, «Τι κάνω αύριο.» and «Ξέρω τι κάνω.» and «Δεν ξέρω τι κάνω;» do not', C('Τι κάνω;') === true && C('Τι κάνω αύριο.') === false && C('Ξέρω τι κάνω.') === false && C('Δεν ξέρω τι κάνω;') === false && C('Δεν ξέρω τι κάνω.') === false);
  assert('(β8) the same words as the phrases, in another sense, do not count: «Τι κάνεις;» (how are you), «Τι κάνει ο Νίκος;», «Πώς είσαι;»', ['Τι κάνεις;', 'Τι κάνει ο Νίκος;', 'Πώς είσαι;', 'Τι να σου πω;', 'Τι να κάνεις, έτσι είναι η ζωή.'].every(t => C(t) === false));
  assert('(β9) a phrase of knowing does not hide a later request in the next sentence: «Ξέρω τι θέλω. Πώς να το κάνω;» counts', C('Ξέρω τι θέλω. Πώς να το κάνω;') === true);

  // ── 3. WHAT DOES NOT COUNT (ordinary talk) ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const NOT = ['Δεν ξέρω.', 'Έχω πολλή δουλειά.', 'Θέλω να αλλάξω δουλειά αλλά δεν ξέρω αν πρέπει.', 'Δεν ξέρω πώς να το πω.', 'Δεν ξέρω πώς θα το κάνω.', 'Δεν ξέρω τι μπορώ να κάνω.', 'Δεν ξέρω τι να κάνω με τη ζωή μου.', 'Ναι.', 'Γεια.', '',
    'Ο φίλος μου ρώτησε τι να κάνει.', 'Όλοι με ρωτούν τι να κάνουν και εγώ δεν ξέρω.', 'Θέλω περισσότερα χρήματα.', 'Έκανα ό,τι μπορούσα.'];
  for (const t of NOT) assert('DOES NOT COUNT — «' + t + '»', C(t) === false);

  // ── 4. KNOWN GAPS, pinned both ways so that a change shows ─────────────────────────────────────────────────────────────────────────────────────────────
  // false negatives — a request the closed list has no phrase for (the stored simulated corpus has 14 of them, and they are of these kinds)
  for (const t of ['Τι θα έκανες στη θέση μου;', 'Τι λες να κάνω;', 'Τι μου προτείνεις;', 'Μπορείτε να με βοηθήσετε;', 'Πώς να τη βρω;', 'Θα με βοηθούσες;'])
    assert('KNOWN GAP (a request, NOT counted) — «' + t + '»', C(t) === false);
  // false positives — said as a question, it is not a request
  for (const t of ['Ε, τι να κάνω, να κλάψω;', 'Περιμένω κάποιον να μου πει τι να κάνω.', 'Ο γιατρός μου είπε να μη σκέφτομαι το «τι να κάνω» τώρα.'])
    assert('KNOWN FALSE POSITIVE (counted, but not a request) — «' + t + '»', C(t) === true);
  // …and one that was there BEFORE this change and is not touched here: the old rule «τι άλλο» (more of what was just produced) is also inside «κάτι άλλο» (2 of the 42 real messages measured on 27/11/2026)
  assert('KNOWN FALSE POSITIVE, inherited, not touched — «Κάτι άλλο με απασχολεί.» counted before and counts now', OLD('Κάτι άλλο με απασχολεί.') === true && C('Κάτι άλλο με απασχολεί.') === true);

  // ── 5. NOTHING THAT COUNTED BEFORE STOPS COUNTING — the old lines are there byte for byte, and over the stored simulated corpus nothing is lost ──────
  const OLD_LINES = ['if (/(^|[.;!?]\\s*)(κανε|δωσε|δωσ|πεσ|πεσε|γραψε|εξηγησε|προτεινε|βοηθησε|βρεσ|δειξε)(\\s|$)/.test(f)) return true;', 'if (/δωσ μου|δωσε μου|πεσ μου|πεσε μου|κανε εστω/.test(f)) return true;', 'if (/θελω τη βοηθεια|θελω βοηθεια|χρειαζομαι βοηθεια|βοηθησε με/.test(f)) return true;',
    'if (/μια υποθεση|υποθεσε|τι θα υπεθετεσ|τι πιστευεισ εσυ|τι θα ελεγεσ|πιστευεισ\\?/.test(f)) return true;', 'if (/τι αλλο|αλλεσ \\d|αλλα \\d/.test(f)) return true;', 'if (/πληροφοριεσ/.test(f)) return true;'];
  assert('the six older rules are in the function exactly as they were (byte for byte)', OLD_LINES.every(l => SRC.includes(l)));
  const FIX = path.join(__dirname, 'data_sim_corpus_2711.json');
  assert('the fixture data_sim_corpus_2711.json is there', fs.existsSync(FIX));
  if (fs.existsSync(FIX)) {
    const items = JSON.parse(fs.readFileSync(FIX, 'utf8')).items;
    const lost = items.filter(([t]) => OLD(t) && !C(t)), newly = items.filter(([t]) => !OLD(t) && C(t));
    const sum = a => a.reduce((x, r) => x + r[1], 0);
    assert('over the simulated corpus (1605 distinct texts, 2612 messages) NOTHING that counted before stops counting', items.length === 1605 && lost.length === 0);
    assert('…and 32 distinct texts (48 messages) count that did not: before 144 distinct (188 messages), now 176 (236)', newly.length === 32 && sum(newly) === 48 && items.filter(([t]) => OLD(t)).length === 144 && items.filter(([t]) => C(t)).length === 176 && sum(items.filter(([t]) => OLD(t))) === 188 && sum(items.filter(([t]) => C(t))) === 236);
    const PHRASES = /τι να κ[αά]νω|τι να κ[αά]νουμε|π[ωώ]ς (να|θα|μπορ[ωώ] να) (το|τα|την|τον) |τι μπορ[ωώ] να κ[αά]νω|τι μπορο[υύ]με να κ[αά]νουμε|τι πρ[εέ]πει να κ[αά]νω|τι οφε[ιί]λω να κ[αά]νω|τι κ[αά]νω|μπορε[ιί]σ να με βοηθ[ηή]σεισ/i;
    assert('every newly counted text carries one of the closed phrases — nothing else made it count', newly.every(([t]) => PHRASES.test(t.normalize('NFC').replace(/ς/g, 'σ').replace(/ς/g, 'σ')) || PHRASES.test(t)));
  }

  // ── 6. THE CODE: the function is one self-contained function, observation only ──────────────────────────────────────────────────────────────────────
  assert('the new block is inside the function, before its last «return false;», and has no helper outside it', SRC.indexOf('μπορεισ να με βοηθησεισ') > SRC.indexOf('πληροφοριεσ') && SRC.trimEnd().endsWith('return false;\n}') && !/\bdetectsAdviceQuestion\b/.test(CODE));
  assert('no lookbehind was introduced', !/\(\?<[=!]/.test(SRC));
  const CALLS = CODE.split('detectsExplicitProductionRequest(').length - 1;
  assert('the function is called exactly once (the counters block of generateResponse): the definition + 1 call', CALLS === 2);
  assert('its consumers are the counters and the tester numbers only: explicitRequests, requestStreak, askedActionBeforeRoot, freeDeferral are never put into a prompt or a note to the model',
    !/(explicitRequests|requestStreak|requestStreakMax|askedActionBeforeRoot|freeDeferral)\.current[^;\n]*(PROMPT|prompt|note|Ctx\()/.test(CODE) && !/\[[A-Z0-9 \-]*(EXPLICIT REQUEST|REQUEST STREAK)/.test(CODE));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
