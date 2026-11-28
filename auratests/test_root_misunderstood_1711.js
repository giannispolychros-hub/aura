// AURA — «Δεν κατάλαβα την ερώτηση» is not a root (John, 17/11/2026 — an exception to the freeze, branch conversation-v1: commit 8 on 2bb2e81, commit 9 on 4d6e626 = his second order). CODE ONLY: the fixed prompt (7e52268becda7360),
// api/aura.js, the safety path and every detector of it are not touched.
// Stage A, the app's OWN root question (door 1: phase ask, or «Διόρθωσε»: phase correct, or a silently armed card): a SHORT message that only says the user did not understand the
// question had «substance» for rootTextHasSubstance and became the card «Τι βρήκες» («Δεν κατάλαβα την ερώτηση», «Δεν καταλαβαίνω τι ρωτάς»), while «Δεν κατάλαβα» and «Τι εννοείς;»
// got the fixed retry text. The EXISTING check is extended with a small CLOSED form — not a search for every phrase (Constitution §21.6): «δεν κατάλαβα / δεν καταλαβαίνω» followed
// ONLY by words of John's four phrases (την, τι, ερώτηση, ρωτάς, εννοείς) and, since his second order of 17/11/2026 (commit 9), καθόλου, καλά, σου — at most 6 words (the limit of
// detectsAffirmativeShort); accents, case, punctuation and the final sigma do not matter. Such a message gets what «Δεν κατάλαβα» already gets: the fixed text, no card, no model call.
// Natural variants OUTSIDE the closed form («δε κατάλαβα την ερώτηση», «Δεν κατάλαβα αυτή την ερώτηση») stay as they were, on purpose — they are listed in (4.4) so that the limit is written down, not hidden.
//  (1) the check loads with the functions and constants it always needed — nothing new to load (ten other tests load it by name)
//  (2) the closed form: the four phrases of John and the three words of the second order (καθόλου, καλά, σου), accents / case / punctuation, the two verb forms crossed with the three object phrases → no substance (the fixed text instead of a card)
//  (3) the NEGATIVE: real words of a root that begin with «Δεν κατάλαβα…» (34 sentences, «Δεν κατάλαβα ότι φοβάμαι τον πατέρα μου» and «Δεν κατάλαβα καθόλου τον εαυτό μου» among them) stay root candidates — the closed form does not catch them
//  (4) the limits: more than 6 words, a word outside the list, another verb, the known gaps → not the closed form (stay exactly as they were)
//  (5) what does not change: «Δεν κατάλαβα», «Τι εννοείς;», «Περίπου δηλαδή», a whole root, non-strings
//  (6) the wiring: the closed form lives INSIDE the existing check; the branches that call it and give the fixed text are as before, in the same order
//  (7) what must not change: the fixed prompt, api/aura.js, the safety detectors, the readiness question and the latch (the function of the readiness question stays as it is)
// All text here is synthetic (made-up or neutral sentences).

// UPDATED (19/11/2026, «συνομιλία v1», Package 1, John): the prompt changed on purpose in exactly three lines (912, 918, 927; auratests/package1_undo.json) — every prompt fingerprint below moved from b5f303cc9405aa21 to 7e52268becda7360 (313386 characters, was 311822), and api/aura.js carries the new core fingerprint (sha256 675564a7985438c8…, was e791b194…). Nothing else of the prompt moved: auratests/test_package1_prompt_1911.js (7.2)–(7.3).
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
// commit 9 (John's second order, 17/11/2026): + καθόλου, καλά, σου — three words that make natural variants of the same four phrases
const NEWWORD_ALONE = ['Δεν κατάλαβα καθόλου', 'Δεν καταλαβαίνω καθόλου', 'Δεν κατάλαβα καλά', 'Δεν καταλαβαίνω καλά'];
const NEWWORD_MIX = ['Δεν καταλαβαίνω καθόλου την ερώτηση', 'Δεν κατάλαβα καλά την ερώτηση', 'Δεν κατάλαβα την ερώτησή σου', 'Δεν κατάλαβα καλά τι εννοείς', 'Δεν καταλαβαίνω καθόλου τι ρωτάς',
  'Δεν κατάλαβα καθόλου την ερώτησή σου', 'Δεν κατάλαβα τι εννοείς καθόλου'];
const NEWWORD_VARIANTS = ['δεν καταλαβα καθολου την ερωτηση', 'ΔΕΝ ΚΑΤΑΛΑΒΑ ΚΑΛΑ', 'Δεν Κατάλαβα Καθόλου!', 'Δεν κατάλαβα καλά…', 'δεν καταλαβαινω καθολου τι ρωτασ\u037e', '«Δεν κατάλαβα την ερώτησή σου»',
  'Δεν κατάλαβα καλά την ερώτηση 🙂', '  δεν  κατάλαβα   καθόλου  την  ερώτηση  '];
const COMBOS = []; for (const j of JOHN) for (const c of ['καθόλου', 'καλά', 'σου']) COMBOS.push(j + ' ' + c);
assert('(2.9) each new word right after the verb: ' + NEWWORD_ALONE.map(t => '«' + t + '»').join(', ') + ' — none is a root (they were a card)', NEWWORD_ALONE.every(t => H(t) === false));
assert('(2.10) the new words with the old object phrases: ' + NEWWORD_MIX.map(t => '«' + t + '»').join(', ') + ' — none is a root', NEWWORD_MIX.every(t => H(t) === false));
assert('(2.11) the same with accents, capitals, punctuation, the Greek question mark, quotes, an emoji, extra spaces: ' + NEWWORD_VARIANTS.length + ' variants, none is a root', NEWWORD_VARIANTS.every(t => H(t) === false));
assert('(2.12) every one of the four phrases of John followed by each new word: ' + COMBOS.length + ' phrases, none is a root', COMBOS.every(t => H(t) === false));
assert('(2.8) none of the closed-form phrases is «spontaneous recognition» either — so the two other places that ask the check (door 3 after a reply, and door 3 before the model) do not change for them: ' +
  (JOHN.length + VARIANTS.length + PUNCT.length + CROSS.length + NEWWORD_ALONE.length + NEWWORD_MIX.length + NEWWORD_VARIANTS.length + COMBOS.length) + ' phrases',
  T(() => [...JOHN, ...VARIANTS, ...PUNCT, ...CROSS, ...NEWWORD_ALONE, ...NEWWORD_MIX, ...NEWWORD_VARIANTS, ...COMBOS].every(t => D.detectsSpontaneousCoreRecognition(t) === false)));

// ── (3) the NEGATIVE: real words of a root that begin with «Δεν κατάλαβα…» stay root candidates ──────────────────────────────
// Long ones (more than 6 words: protected by the word limit) AND short ones (6 words or fewer: protected only by «every word must be in the list»).
const REAL_LONG = ['Δεν κατάλαβα ότι φοβάμαι τον πατέρα μου', 'Δεν κατάλαβα πότε έπαψα να χαίρομαι τη δουλειά μου', 'Δεν καταλαβαίνω γιατί με πιέζει τόσο το ωράριο',
  'Δεν κατάλαβα την ερώτηση, αλλά η αλήθεια είναι ότι φοβάμαι τη μετάθεση', 'Δεν κατάλαβα την ερώτηση της εταιρείας και φοβάμαι τη μετάθεση',
  'Δεν καταλαβαίνω τι εννοεί η μητέρα μου όταν λέει ότι θα με στηρίζει', 'Δεν κατάλαβα την ερώτηση. Ότι φοβάμαι τον πατέρα μου.'];
const REAL_SHORT = ['Δεν κατάλαβα ότι φοβάμαι', 'Δεν καταλαβαίνω γιατί φοβάμαι', 'Δεν κατάλαβα πότε φοβήθηκα', 'Δεν κατάλαβα ότι κουράστηκα', 'Δεν καταλαβαίνω γιατί θυμώνω',
  'Δεν κατάλαβα τι θέλω', 'Δεν καταλαβαίνω τι ζητάει η δουλειά', 'Δεν κατάλαβα την απόφαση του διευθυντή', 'Δεν κατάλαβα τι εννοεί η μητέρα'];
REAL_LONG.forEach((t, i) => assert('(3.' + (i + 1) + ') «' + t + '» is STILL a root candidate — the closed form does not catch it (more than 6 words, or a word outside the list)', H(t) === true));
REAL_SHORT.forEach((t, i) => assert('(3.' + (REAL_LONG.length + i + 1) + ') short, 6 words or fewer: «' + t + '» is STILL a root candidate — one word outside the list is enough', H(t) === true));
// UPDATED (commit 9): «καθόλου», «καλά», «σου» are no longer «other words» — they belong to the closed form now (2.9–2.12); «αυτή», «ποτέ», «εδώ» take their place
const TAILS = ['ότι', 'γιατί', 'πότε', 'πώς', 'ποιος', 'φοβάμαι', 'πατέρα', 'δουλειά', 'σήμερα', 'εσύ', 'ακριβώς', 'πράγματα', 'μου', 'αυτή', 'ποτέ', 'εδώ'];
assert('(3.' + (REAL_LONG.length + REAL_SHORT.length + 1) + ') the closed form is decided on ALL the words, not on the opening: «Δεν κατάλαβα την ερώτηση» + any one of ' + TAILS.length + ' other words is never taken out',
  TAILS.every(w => H('Δεν κατάλαβα την ερώτηση ' + w) === true));
assert('(3.' + (REAL_LONG.length + REAL_SHORT.length + 2) + ') … and after a NEW word too: «Δεν κατάλαβα καθόλου / καλά / την ερώτησή σου» + any one of ' + TAILS.length + ' other words is never taken out (' + (3 * TAILS.length) + ' sentences)',
  TAILS.every(w => H('Δεν κατάλαβα καθόλου ' + w) === true && H('Δεν κατάλαβα καλά ' + w) === true && H('Δεν κατάλαβα την ερώτησή σου ' + w) === true));
// commit 9 — the NEGATIVE of John's second order: 18 more sentences with a real root, many of them with a new word inside; the first one is John's own
const REAL_NEW = ['Δεν κατάλαβα καθόλου τον εαυτό μου', 'Δεν κατάλαβα καλά γιατί φοβάμαι τη μετάθεση', 'Δεν καταλαβαίνω καθόλου γιατί θυμώνω με τη δουλειά', 'Δεν κατάλαβα ποτέ τι θέλω από τη ζωή μου',
  'Δεν κατάλαβα καθόλου πότε άλλαξε η σχέση μου με τον αδελφό μου', 'Δεν καταλαβαίνω καλά τι ζητάει από μένα ο διευθυντής', 'Δεν κατάλαβα καθόλου γιατί σου το λέω τώρα, αλλά με βαραίνει η δουλειά',
  'Δεν καταλαβαίνω καθόλου γιατί κουράζομαι τόσο', 'Δεν κατάλαβα καλά τι με πιέζει στο σπίτι', 'Δεν καταλαβαίνω τι σημαίνει για μένα η προαγωγή', 'Δεν κατάλαβα την ερώτηση, αλλά φοβάμαι ότι θα με απολύσουν',
  'Δεν κατάλαβα καθόλου ότι κουράστηκα τόσο', 'Δεν κατάλαβα καλά την ερώτηση, αλλά θέλω να φύγω από τη δουλειά', 'Δεν κατάλαβα τι εννοείς, γιατί φοβάμαι να μιλήσω στον πατέρα μου',
  'Δεν κατάλαβα καθόλου τι θέλω', 'Δεν κατάλαβα καλά τι θέλω', 'Δεν καταλαβαίνω καθόλου τον λόγο που μένω εδώ', 'Δεν κατάλαβα την ερώτησή σου, γιατί με απασχολεί το ενοίκιο'];
REAL_NEW.forEach((t, i) => assert('(3.N' + (i + 1) + ') «' + t + '» is STILL a root candidate (second order, commit 9) — the closed form does not catch it', H(t) === true));
assert('(3.N) the second-order negatives are ' + REAL_NEW.length + ' sentences (John asked for 15 and the two he named)', REAL_NEW.length >= 17 && REAL_NEW.includes('Δεν κατάλαβα καθόλου τον εαυτό μου') && REAL_LONG.includes('Δεν κατάλαβα ότι φοβάμαι τον πατέρα μου'));

// ── (4) the limits ──────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(4.1) more than 6 words, even of the list, is not the closed form (the limit of detectsAffirmativeShort): 7 and 8 words stay as they were — with the old words and with the new ones',
  H('Δεν κατάλαβα την ερώτηση την ερώτηση τι') === true && H('Δεν κατάλαβα την ερώτηση την ερώτηση τι ρωτάς') === true &&
  H('Δεν κατάλαβα καθόλου καλά την ερώτηση σου') === true && H('Δεν κατάλαβα καθόλου καλά την ερώτηση σου τι') === true);
assert('(4.2) exactly 6 words of the list is still the closed form (the limit is «6 or fewer») — with the old words and with the new ones',
  H('Δεν καταλαβαίνω την ερώτηση τι ρωτάς') === false && H('Δεν κατάλαβα καθόλου καλά την ερώτηση') === false && H('Δεν καταλαβαίνω καθόλου καλά την ερώτηση') === false);
assert('(4.3) a word outside the list ends it: «Δεν κατάλαβα την ερώτηση σήμερα», «Δεν κατάλαβα τι ρωτάς εσύ» are not closed forms (they stay as they were)',
  H('Δεν κατάλαβα την ερώτηση σήμερα') === true && H('Δεν κατάλαβα τι ρωτάς εσύ') === true);
// UPDATED (commit 9): the first four gaps of commit 8 are closed (καθόλου, καλά, σου — see 2.9–2.12); these remain, on purpose
const GAPS = ['δε κατάλαβα την ερώτηση', 'Δεν έχω καταλάβει την ερώτηση', 'Δεν κατάλαβα αυτή την ερώτηση', 'Δεν κατάλαβα ακριβώς την ερώτηση', 'Δεν κατάλαβα την ερώτηση, εξήγησέ την'];
assert('(4.4) KNOWN GAPS, on purpose (John: do not try to catch every phrase; Constitution §21.6): these natural variants are NOT in the closed form and stay exactly as they were — ' + GAPS.length + ' phrases that still become a card: ' + GAPS.map(g => '«' + g + '»').join(', '),
  GAPS.every(t => H(t) === true));
assert('(4.5) and what the old rule already refused stays refused: «Δεν κατάλαβα τι», «Δεν κατάλαβα την», «Δεν καταλαβαίνω», «Δεν το κατάλαβα», «Δεν κατάλαβα σου» (one word of substance at most)',
  H('Δεν κατάλαβα τι') === false && H('Δεν κατάλαβα την') === false && H('Δεν καταλαβαίνω') === false && H('Δεν το κατάλαβα') === false && H('Δεν κατάλαβα σου') === false);
assert('(4.6) it must START with «δεν κατάλαβα / δεν καταλαβαίνω»: «Την ερώτηση δεν κατάλαβα», «Κατάλαβα την ερώτηση», «Δεν θυμάμαι την ερώτηση», «Δεν ξέρω τι εννοείς», «Καλά, δεν κατάλαβα την ερώτηση» are not closed forms (they stay as they were)',
  H('Την ερώτηση δεν κατάλαβα') === true && H('Κατάλαβα την ερώτηση') === true && H('Δεν θυμάμαι την ερώτηση') === true && H('Δεν ξέρω τι εννοείς') === true && H('Καλά, δεν κατάλαβα την ερώτηση') === true);

// ── (5) what does not change ───────────────────────────────────────────────────────────────────────────────────────────────
assert('(5.1) «Δεν κατάλαβα» and «Τι εννοείς;» keep the fixed text, as before', H('Δεν κατάλαβα') === false && H('Τι εννοείς;') === false);
assert('(5.2) «Περίπου δηλαδή», «Ναι, αυτό», «Γεια σου» are refused as before', H('Περίπου δηλαδή') === false && H('Ναι, αυτό') === false && H('Γεια σου') === false);
assert('(5.3) a whole root, and one substantial sentence among short ones, pass as before',
  H('Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.') === true && H('Ναι. Ότι μένω στη δουλειά από φόβο και όχι επειδή το θέλω.') === true);
assert('(5.4) non-strings never throw: null, undefined, a number, an empty string', H(null) === false && H(undefined) === false && H(42) === false && H('') === false);

// ── (6) the wiring ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const SRC = fnSrc('rootTextHasSubstance');
assert('(6.1) the closed form is INSIDE the existing check (not a second check beside it): rootTextHasSubstance holds both the old rule and the closed form',
  SRC.includes('substanceOfSentence(') && SRC.includes('καταλαβαινω') && SRC.includes('ερωτηση') && SRC.includes('ρωτασ') && SRC.includes('εννοεισ') && SRC.includes('"καθολου"') && SRC.includes('"καλα"') && SRC.includes('"σου"'));
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
assert('(7.1) the fixed prompt is the same: 313.386 characters, sha256 7e52268becda7360 6e92e481…', T(() => { const p = lit('AURA_CORE_PERSONALITY');
  return p.length === 313386 && sha(p) === '7e52268becda7360d060ac9448480616ada5a879f6c992e618d4c527977052c3'; }));
assert('(7.2) api/aura.js is the file of 2bb2e81, byte for byte (sha256 e791b194…) — the guard and its fingerprints do not move', sha(api).startsWith('675564a7985438c8'));
// UPDATED (27/11/2026, John's explicit order, ADR «27 Νοεμβρίου»): the DISTRESS word «κρίση» of detectSafetySignal became four patterns (a crisis the person is in or has, or one relative of a closed list has) — proved first by auratests/test_krisi_narrowing_2711.js; no other function or line moved. Only the value below moved (838fe96c→f3746eee×1); the check itself is the same.
const PINS = { detectSafetySignal: 'f3746eeee8392a34', detectsDangerFromOther: '59e2f828fda103fa', stageACaptureAllowed: 'f8a46ebc62fe4ecd' };
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
