// AURA — «Δεν κατάλαβα την ερώτηση» is not a root (John, 17/11/2026 — an exception to the freeze, branch conversation-v1, on 2bb2e81). CODE ONLY: the fixed prompt (b5f303cc9405aa21),
// api/aura.js, the safety path and every detector of it are not touched.
// Stage A, the app's OWN root question (door 1: phase ask, or «Διόρθωσε»: phase correct, or a silently armed card): a SHORT message that only says the user did not understand the
// question had «substance» for rootTextHasSubstance and became the card «Τι βρήκες» («Δεν κατάλαβα την ερώτηση», «Δεν καταλαβαίνω τι ρωτάς»), while «Δεν κατάλαβα» and «Τι εννοείς;»
// got the fixed retry text. The EXISTING check is extended with a small CLOSED form — not a search for every phrase (Constitution §21.6): «δεν κατάλαβα / δεν καταλαβαίνω» followed
// ONLY by words of John's four phrases (την, τι, ερώτηση, ρωτάς, εννοείς), at most 6 words (the limit of detectsAffirmativeShort); accents, case, punctuation and the final sigma do not
// matter. Such a message gets what «Δεν κατάλαβα» already gets: the fixed text, no card, no model call. Natural variants OUTSIDE the closed form («Δεν καταλαβαίνω καθόλου την ερώτηση»)
// stay as they were, on purpose — they are listed in (4.4) so that the limit is written down, not hidden.
//  (1) the check loads with the functions and constants it always needed — nothing new to load (ten other tests load it by name)
//  (2) the closed form: the four phrases of John, accents / case / punctuation, the two verb forms crossed with the three object phrases → no substance (the fixed text instead of a card)
//  (3) the NEGATIVE: real words of a root that begin with «Δεν κατάλαβα…» stay root candidates — the closed form does not catch them
//  (4) the limits: more than 6 words, a word outside the list, another verb, the known gaps → not the closed form (stay exactly as they were)
//  (5) what does not change: «Δεν κατάλαβα», «Τι εννοείς;», «Περίπου δηλαδή», a whole root, non-strings
//  (6) the wiring: the closed form lives INSIDE the existing check; the branches that call it and give the fixed text are as before, in the same order
//  (7) what must not change: the fixed prompt, api/aura.js, the safety detectors, the readiness question and the latch (the function of the readiness question stays as it is)
// All text here is synthetic (made-up or neutral sentences).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond === true) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const T = f => { try { return f() === true; } catch (e) { return false; } }; // a check that throws is a check that fails — never a test that stops
const sha = s => crypto.createHash('sha256').update(s || '', 'utf8').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; return raw.slice(a + 1, raw.indexOf(';\n', a + 1) + 1); };
const lit = n => { const h = 'const ' + n + ' = `'; const a = raw.indexOf(h); const s = a + h.length; return Function('return `' + raw.slice(s, raw.indexOf('`;', s)) + '`;')(); };

// ── (1) load: exactly what rootTextHasSubstance always needed ───────────────────────────────────────────────────────────────
const FNS = ['splitSentences', 'substanceOfSentence', 'rootTextHasSubstance'];
const CONSTS = ['KNEW_MIN_SUBSTANCE_WORDS', 'ROOT_MIN_SUBSTANCE_WORDS', 'ROOT_FILLER_WORDS'];
let F = {};
try {
  F = new Function([...CONSTS.map(n => constSrc(n) || `const ${n} = undefined;`), ...FNS.map(n => fnSrc(n) || `function ${n}(){ throw new Error('missing ${n}'); }`),
    'return { ' + FNS.join(', ') + ' };'].join('\n'))();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const H = x => { try { return F.rootTextHasSubstance(x); } catch (e) { return 'threw: ' + e.message; } };
// the recognition detector, loaded apart (it is only asked in (2.8), never needed by the check itself)
let D = {};
try { D = new Function([fnSrc('lookBehind') || 'function lookBehind(){ throw new Error("missing lookBehind"); }', fnSrc('detectsSpontaneousCoreRecognition') || 'function detectsSpontaneousCoreRecognition(){ throw new Error("missing"); }',
  'return { detectsSpontaneousCoreRecognition };'].join('\n'))(); } catch (e) { console.log('LOAD ERROR (recognition detector) — ' + e.message); }

assert('(1.1) the check and its helpers are in src/App.jsx and load with only the three constants and two functions it always needed (nothing new to load)',
  FNS.every(n => fnSrc(n) !== '') && CONSTS.every(n => constSrc(n) !== '') && FNS.every(n => typeof F[n] === 'function'));
assert('(1.2) the check still does its old job: a whole root passes, a content-free «Περίπου δηλαδή» is refused', H('Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.') === true && H('Περίπου δηλαδή') === false);

// ── (2) the closed form: no substance (the fixed text, no card) ─────────────────────────────────────────────────────────────
const JOHN = ['Δεν κατάλαβα την ερώτηση', 'Δεν καταλαβαίνω τι ρωτάς', 'Δεν κατάλαβα τι εννοείς', 'Δεν καταλαβαίνω την ερώτηση'];
JOHN.forEach((t, i) => assert('(2.' + (i + 1) + ') «' + t + '» is not a root (it was: it became «Τι βρήκες»)', H(t) === false));
const VARIANTS = ['δεν καταλαβα την ερωτηση', 'δεν καταλαβαινω τι ρωτας', 'ΔΕΝ ΚΑΤΑΛΑΒΑ ΤΗΝ ΕΡΩΤΗΣΗ', 'Δεν Καταλαβαίνω Τι Ρωτάς', 'δΕΝ κατάλαβα τι εννοείς', 'δεν καταλαβαινω την ερωτηση'];
assert('(2.5) the same without accents and with another case: ' + VARIANTS.length + ' variants, none is a root', VARIANTS.every(t => H(t) === false));
const PUNCT = ['Δεν κατάλαβα την ερώτηση.', 'Δεν κατάλαβα την ερώτηση!', 'δεν κατάλαβα την ερώτηση…', '  Δεν κατάλαβα την ερώτηση  ', 'Δεν κατάλαβα, την ερώτηση', 'Δεν καταλαβαίνω τι ρωτάς;',
  'Δεν καταλαβαίνω τι ρωτάς;', 'δεν καταλαβαινω τι ρωτασ', 'δεν καταλαβα τι εννοεισ', '«Δεν κατάλαβα την ερώτηση»', 'Δεν κατάλαβα την ερώτηση 🙂'];
assert('(2.6) punctuation, spaces, the Greek question mark, a final sigma typed as «σ», quotes and an emoji do not matter: ' + PUNCT.length + ' variants, none is a root', PUNCT.every(t => H(t) === false));
const CROSS = ['Δεν κατάλαβα τι ρωτάς', 'Δεν καταλαβαίνω τι εννοείς', 'Δεν κατάλαβα την ερώτηση', 'Δεν καταλαβαίνω την ερώτηση', 'Δεν κατάλαβα τι εννοείς', 'Δεν καταλαβαίνω τι ρωτάς'];
assert('(2.7) the two verb forms crossed with the three object phrases (την ερώτηση / τι ρωτάς / τι εννοείς) are all the closed form: ' + CROSS.length + ' phrases, none is a root', CROSS.every(t => H(t) === false));
assert('(2.8) none of the closed-form phrases is «spontaneous recognition» either — so the two other places that ask the check (door 3 after a reply, and door 3 before the model) do not change for them: ' +
  (JOHN.length + VARIANTS.length + PUNCT.length + CROSS.length) + ' phrases', T(() => [...JOHN, ...VARIANTS, ...PUNCT, ...CROSS].every(t => D.detectsSpontaneousCoreRecognition(t) === false)));

// ── (3) the NEGATIVE: real words of a root that begin with «Δεν κατάλαβα…» stay root candidates ──────────────────────────────
// Long ones (more than 6 words: protected by the word limit) AND short ones (6 words or fewer: protected only by «every word must be in the list»).
const REAL_LONG = ['Δεν κατάλαβα ότι φοβάμαι τον πατέρα μου', 'Δεν κατάλαβα πότε έπαψα να χαίρομαι τη δουλειά μου', 'Δεν καταλαβαίνω γιατί με πιέζει τόσο το ωράριο',
  'Δεν κατάλαβα την ερώτηση, αλλά η αλήθεια είναι ότι φοβάμαι τη μετάθεση', 'Δεν κατάλαβα την ερώτηση της εταιρείας και φοβάμαι τη μετάθεση',
  'Δεν καταλαβαίνω τι εννοεί η μητέρα μου όταν λέει ότι θα με στηρίζει', 'Δεν κατάλαβα την ερώτηση. Ότι φοβάμαι τον πατέρα μου.'];
const REAL_SHORT = ['Δεν κατάλαβα ότι φοβάμαι', 'Δεν καταλαβαίνω γιατί φοβάμαι', 'Δεν κατάλαβα πότε φοβήθηκα', 'Δεν κατάλαβα ότι κουράστηκα', 'Δεν καταλαβαίνω γιατί θυμώνω',
  'Δεν κατάλαβα τι θέλω', 'Δεν καταλαβαίνω τι ζητάει η δουλειά', 'Δεν κατάλαβα την απόφαση του διευθυντή', 'Δεν κατάλαβα τι εννοεί η μητέρα'];
REAL_LONG.forEach((t, i) => assert('(3.' + (i + 1) + ') «' + t + '» is STILL a root candidate — the closed form does not catch it (more than 6 words, or a word outside the list)', H(t) === true));
REAL_SHORT.forEach((t, i) => assert('(3.' + (REAL_LONG.length + i + 1) + ') short, 6 words or fewer: «' + t + '» is STILL a root candidate — one word outside the list is enough', H(t) === true));
const TAILS = ['ότι', 'γιατί', 'πότε', 'πώς', 'ποιος', 'φοβάμαι', 'πατέρα', 'δουλειά', 'σήμερα', 'εσύ', 'ακριβώς', 'καθόλου', 'καλά', 'πράγματα', 'μου', 'σου'];
assert('(3.' + (REAL_LONG.length + REAL_SHORT.length + 1) + ') the closed form is decided on ALL the words, not on the opening: «Δεν κατάλαβα την ερώτηση» + any one of ' + TAILS.length + ' other words is never taken out',
  TAILS.every(w => H('Δεν κατάλαβα την ερώτηση ' + w) === true));

// ── (4) the limits ──────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(4.1) more than 6 words, even of the list, is not the closed form (the limit of detectsAffirmativeShort): 7 and 8 words stay as they were',
  H('Δεν κατάλαβα την ερώτηση την ερώτηση τι') === true && H('Δεν κατάλαβα την ερώτηση την ερώτηση τι ρωτάς') === true);
assert('(4.2) exactly 6 words of the list is still the closed form (the limit is «6 or fewer»)', H('Δεν καταλαβαίνω την ερώτηση τι ρωτάς') === false);
assert('(4.3) a word outside the list ends it: «Δεν κατάλαβα την ερώτηση σήμερα», «Δεν κατάλαβα τι ρωτάς εσύ» are not closed forms (they stay as they were)',
  H('Δεν κατάλαβα την ερώτηση σήμερα') === true && H('Δεν κατάλαβα τι ρωτάς εσύ') === true);
const GAPS = ['Δεν κατάλαβα καθόλου', 'Δεν καταλαβαίνω καθόλου την ερώτηση', 'Δεν κατάλαβα καλά την ερώτηση', 'Δεν κατάλαβα την ερώτησή σου', 'δε κατάλαβα την ερώτηση'];
assert('(4.4) KNOWN GAPS, on purpose (John: do not try to catch every phrase; Constitution §21.6): these natural variants are NOT in the closed form and stay exactly as they were — ' + GAPS.length + ' phrases that still become a card: ' + GAPS.map(g => '«' + g + '»').join(', '),
  GAPS.every(t => H(t) === true));
assert('(4.5) and what the old rule already refused stays refused: «Δεν κατάλαβα τι», «Δεν κατάλαβα την», «Δεν καταλαβαίνω», «Δεν το κατάλαβα» (one word of substance at most)',
  H('Δεν κατάλαβα τι') === false && H('Δεν κατάλαβα την') === false && H('Δεν καταλαβαίνω') === false && H('Δεν το κατάλαβα') === false);
assert('(4.6) it must START with «δεν κατάλαβα / δεν καταλαβαίνω»: «Την ερώτηση δεν κατάλαβα», «Κατάλαβα την ερώτηση», «Δεν θυμάμαι την ερώτηση», «Δεν ξέρω τι εννοείς» are not closed forms (they stay as they were)',
  H('Την ερώτηση δεν κατάλαβα') === true && H('Κατάλαβα την ερώτηση') === true && H('Δεν θυμάμαι την ερώτηση') === true && H('Δεν ξέρω τι εννοείς') === true);

// ── (5) what does not change ───────────────────────────────────────────────────────────────────────────────────────────────
assert('(5.1) «Δεν κατάλαβα» and «Τι εννοείς;» keep the fixed text, as before', H('Δεν κατάλαβα') === false && H('Τι εννοείς;') === false);
assert('(5.2) «Περίπου δηλαδή», «Ναι, αυτό», «Γεια σου» are refused as before', H('Περίπου δηλαδή') === false && H('Ναι, αυτό') === false && H('Γεια σου') === false);
assert('(5.3) a whole root, and one substantial sentence among short ones, pass as before',
  H('Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.') === true && H('Ναι. Ότι μένω στη δουλειά από φόβο και όχι επειδή το θέλω.') === true);
assert('(5.4) non-strings never throw: null, undefined, a number, an empty string', H(null) === false && H(undefined) === false && H(42) === false && H('') === false);

// ── (6) the wiring ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const SRC = fnSrc('rootTextHasSubstance');
assert('(6.1) the closed form is INSIDE the existing check (not a second check beside it): rootTextHasSubstance holds both the old rule and the closed form',
  SRC.includes('substanceOfSentence(') && SRC.includes('καταλαβαινω') && SRC.includes('ερωτηση') && SRC.includes('ρωτασ') && SRC.includes('εννοεισ'));
assert('(6.2) … and the old rule is still the first thing it does (the test of the root functions looks for it within the first 800 characters)', SRC.indexOf('substanceOfSentence(') > 0 && SRC.indexOf('substanceOfSentence(') < 400);
assert('(6.3) the caller of the fixed text: in phase ask / correct a message without substance shows the bubble and dispatches «tooShort» (the fixed text, no model call)',
  /\(_saPhase === "ask" \|\| _saPhase === "correct"\) && !rootTextHasSubstance\(userText\)\) \{\s*addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "tooShort" \}\);\s*return;/.test(raw));
assert('(6.4) the caller of the armed card: a message without substance → «reask» door 2 (the app\'s question, no card, no model call)',
  /_saArmed && !rootTextHasSubstance\(userText\)\) \{\s*stageARootArmed\.current = false;\s*addUiBubble\(userText, messages\.length\);[^\n]*\n\s*stageADispatch\(\{ type: "reask", door: 2 \}\);\s*return;/.test(raw));
assert('(6.5) the order of the checks in the handler is as before: capture allowed → «Δεν ξέρω» → dismissal → substance', T(() => {
  const a = raw.indexOf('if (!stageACaptureAllowed(userText)) {'), b = raw.indexOf('} else if (rootAnswerIsUnsure(userText)) {', a), c = raw.indexOf('} else if (rootAnswerIsDismissal(userText)', b),
    d = raw.indexOf('} else if ((_saPhase === "ask" || _saPhase === "correct") && !rootTextHasSubstance(userText)) {', c);
  return a > 0 && b > a && c > b && d > c; }));
assert('(6.6) the fixed text itself is as John approved it (16/10): «Πες το λίγο πιο ολοκληρωμένα — όπως θα το έλεγες σε έναν φίλο.»',
  raw.includes('  retry: "Πες το λίγο πιο ολοκληρωμένα — όπως θα το έλεγες σε έναν φίλο.",'));

// ── (7) what must not change ───────────────────────────────────────────────────────────────────────────────────────────────
assert('(7.1) the fixed prompt is the same: 311.822 characters, sha256 b5f303cc9405aa21 6e92e481…', T(() => { const p = lit('AURA_CORE_PERSONALITY');
  return p.length === 311822 && sha(p) === 'b5f303cc9405aa216e92e481f24507b03f6d878c2475733063c42733074c5b01'; }));
assert('(7.2) api/aura.js is the file of 2bb2e81, byte for byte (sha256 e791b194…) — the guard and its fingerprints do not move', sha(api).startsWith('e791b19471f08132'));
const PINS = { detectSafetySignal: '838fe96cf161fcae', detectsDangerFromOther: '59e2f828fda103fa', stageACaptureAllowed: 'f8a46ebc62fe4ecd' };
assert('(7.3) the safety detectors and the check that stops a crisis from becoming a root are untouched (detectSafetySignal, detectsDangerFromOther, stageACaptureAllowed: same source, byte for byte)',
  Object.entries(PINS).every(([n, h]) => fnSrc(n) !== '' && sha(fnSrc(n)).slice(0, 16) === h));
const PINS2 = { answersReadinessQuestion: '70fd1f273d6f0e07', detectsCoreReadinessAsked: 'c84bd93559579f9e', detectsAffirmativeShort: '0a6f1957c0594d60', detectsSpontaneousCoreRecognition: '6bc032dfcdda93cb' };
assert('(7.4) the readiness question and its latch are untouched: answersReadinessQuestion, detectsCoreReadinessAsked, detectsAffirmativeShort, detectsSpontaneousCoreRecognition (same source)',
  Object.entries(PINS2).every(([n, h]) => fnSrc(n) !== '' && sha(fnSrc(n)).slice(0, 16) === h));
const PINS3 = { rootAnswerIsUnsure: '2c6461315a960668', rootAnswerIsDismissal: 'a57d7cd4781f1876', substanceOfSentence: 'b45f4fe7e6f08406', splitSentences: '1731e5bcd33e69d7' };
assert('(7.5) the other checks of the root flow are untouched: rootAnswerIsUnsure, rootAnswerIsDismissal, substanceOfSentence, splitSentences (same source)',
  Object.entries(PINS3).every(([n, h]) => fnSrc(n) !== '' && sha(fnSrc(n)).slice(0, 16) === h));
assert('(7.6) the reducer of the root flow is untouched: stageAStep (same source)', sha(fnSrc('stageAStep')).slice(0, 16) === '67bb9bcb504396e8');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
