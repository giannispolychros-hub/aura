// ADR «19 Οκτωβρίου (ζ)» (John, the last round before the 20): the «Άρα» clean-up removes ONLY a sentence that STARTS with the whole
// word «Άρα» — never «-άρα» inside a word. Real-model run 37, session 41: a reply showed «Βαρεμ» where the model wrote «Βαρεμάρα …»,
// because stripAraDeclarative matched the «άρα» at the end of «Βαρεμάρα» and deleted up to the period. On a crisis turn the same
// clean-up runs before the crisis line is added: it must never cut the line, a number, or the risk question.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.jsx'), 'utf8');
function extract(name) { const s = raw.indexOf('function ' + name + '('); const e = raw.indexOf('\n}', s) + 2; return s < 0 ? '' : raw.slice(s, e); }
let stripAraDeclarative = null, buildCrisisLine = null;
try { stripAraDeclarative = new Function(extract('stripAraDeclarative') + '\nreturn stripAraDeclarative;')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
try { buildCrisisLine = new Function(extract('buildCrisisLine') + '\nreturn buildCrisisLine;')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const S = t => { try { return stripAraDeclarative(t); } catch (e) { return 'threw:' + e.message; } };

// ── 1. The reproduction: session 41 of run 37 ──────────────────────────────────────────────────────────────────────────
const R41 = 'Βαρεμάρα και φόβος μαζί.\n\nΤι φαντάζεσαι για την καινούργια θέση όταν σε πιάνει αυτό το αίσθημα;';
assert('REPRODUCTION (run 37, 41): «Βαρεμάρα και φόβος μαζί.» stays whole — not «Βαρεμ»', S(R41) === R41 && !/Βαρεμ\s*\n/.test(S(R41)));

// ── 2. Never «-άρα» inside a word — lower case, capitals, with or without the accent ────────────────────────────────────
const WORDS = ['Βαρεμάρα', 'λαχτάρα', 'τρομάρα', 'φοβέρα', 'κατάρα', 'καμάρα', 'ΒΑΡΕΜΑΡΑ', 'ΛΑΧΤΑΡΑ', 'ΤΡΟΜΆΡΑ', 'βαρεμαρα', 'παράδειγμα', 'καραβάκι', 'Άραγε'];
for (const w of WORDS) {
  const t = 'Η ' + w + ' σου είναι εκεί. Τι κάνεις τότε;';
  assert('WORD INTACT: «' + w + '» inside a sentence — the sentence stays whole', S(t) === t);
  const t2 = w + ' είναι η πρώτη λέξη. Τι κάνεις τότε;';
  assert('WORD INTACT: «' + w + '» at the start of a sentence — not taken for «Άρα»', S(t2) === t2);
}
assert('WORD INTACT: «άρα» in the middle of a sentence is not a sentence that starts with «Άρα»',
  S('Δύο χρόνια το ίδιο, άρα πολύ καιρό. Τι λες;') === 'Δύο χρόνια το ίδιο, άρα πολύ καιρό. Τι λες;');

// ── 3. As before: a declarative sentence that starts with «Άρα» is removed ───────────────────────────────────────────────
assert('AS BEFORE: «Άρα …» at the start is removed, the question stays',
  S('Άρα το πραγματικό πρόβλημα είναι ο φόβος. Τι σε κρατάει περισσότερο;') === 'Τι σε κρατάει περισσότερο;');
assert('AS BEFORE: «Άρα …» after another sentence is removed, the rest stays',
  S('Δώδεκα ώρες. Άρα το θέμα είναι η κούραση. Τι λείπει από το σπίτι;') === 'Δώδεκα ώρες. Τι λείπει από το σπίτι;');
assert('AS BEFORE: «Άρα …» at the start of a new line is removed',
  S('Το είπες δύο φορές.\nΆρα αυτό σε βαραίνει.\nΠοιο από τα δύο;') === 'Το είπες δύο φορές.\n\nΠοιο από τα δύο;');
assert('AS BEFORE: «ΆΡΑ …» in capitals is still the word «Άρα»', S('ΆΡΑ το θέμα είναι η κούραση. Τι λες;') === 'Τι λες;');
assert('AS BEFORE: two «Άρα» sentences in a row are both removed', S('Άρα Α. Άρα Β. Τι λες;') === 'Τι λες;');
assert('AS BEFORE: a «Άρα, …» question with no period is untouched',
  S('Νιώθεις ότι κάτι άλλαξε; Άρα, τι θα ήθελες να κάνεις τώρα;') === 'Νιώθεις ότι κάτι άλλαξε; Άρα, τι θα ήθελες να κάνεις τώρα;');

// ── 4. A crisis reply: never the line, a number, or the risk question ────────────────────────────────────────────────────
const L_A = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';
const L_B = 'Υπάρχει η Γραμμή Ψυχοκοινωνικής Υποστήριξης, 10306 — δωρεάν και ανώνυμη.';
const CRISIS = [
  'Σε ακούω. Αυτή η τρομάρα είναι βαριά. Σκέφτεσαι να κάνεις κακό στον εαυτό σου;',
  'Η λαχτάρα να τελειώσει αυτό είναι μεγάλη. ' + L_A,
  'Άρα νιώθεις ότι δεν αντέχεις; Σκέφτεσαι να βλάψεις τον εαυτό σου;',
  'Άρα υπάρχει η γραμμή 1018, όποτε τη χρειαστείς.',
  'Άρα σκέφτεσαι να κάνεις κακό στον εαυτό σου; ' + L_A,
  'Άρα υπάρχει πάντα η γραμμή 10306 εκεί.',
  'Είμαι εδώ.\nΆρα ας μείνουμε σε αυτό που ζεις τώρα: είσαι ασφαλής;',
];
for (const t of CRISIS) assert('CRISIS REPLY untouched: «' + t.slice(0, 60) + '…»', S(t) === t);
assert('CRISIS: no number is ever removed — every digit of every crisis reply above survives',
  CRISIS.every(t => (S(t).match(/\d+/g) || []).join(',') === (t.match(/\d+/g) || []).join(',')));
assert('CRISIS: the risk question survives the clean-up in every case above', CRISIS.filter(t => /;/.test(t)).every(t => S(t).split(';').length === t.split(';').length));
// the app adds its own line AFTER the clean-up, on the cleaned text (generateResponse: text → buildCrisisLine(…, text, …) → displayText)
{
  const gr = raw.slice(raw.indexOf('const text = guardStopMoment(stripRepeatedThreeBeat(stripAraDeclarative('), raw.indexOf('if (detectsMentalHealthReferral(text)) riskSignalKind.current'));
  assert('CRISIS LINE: added after the clean-up, on the cleaned text — the clean-up never sees the app\'s own line',
    gr.length > 100 && /let displayText = text;/.test(gr) && /buildCrisisLine\(classifyCrisisTier\(lastUserMsg\), text, supportLineShown\.current\)/.test(gr) &&
    /if \(_crisisLine\.line\) displayText = text \+ "\\n\\n" \+ _crisisLine\.line;/.test(gr));
  const model = 'Η τρομάρα σου είναι εκεί. Σκέφτεσαι να βλάψεις τον εαυτό σου;';
  const text = S(model), line = buildCrisisLine ? buildCrisisLine('A', text, false).line : '';
  assert('CRISIS LINE: the whole path on a tier-A reply with «τρομάρα» — the reply whole, then the 1018 line',
    text === model && (text + '\n\n' + line) === model + '\n\n' + L_A);
}

// ── 5. Unchanged ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
  assert('UNCHANGED: buildCrisisLine (the crisis lines)', h(extract('buildCrisisLine')) === 'd359e22dd7cf9a95');
  assert('UNCHANGED: detectSafetySignal, classifyCrisisTier', h(extract('detectSafetySignal')) === 'dfaf34c6e1e44e6b' && h(extract('classifyCrisisTier')) === 'f724a0db0c1a5bf9');
  assert('UNCHANGED: the English «So, the real question…» clean-up', extract('stripAraDeclarative').includes(
    '.replace(/[ \\t]*\\bSo,?[ \\t]+(the[ \\t]+)?(real[ \\t]+)?(question|issue|problem)[^.\\n]*\\.[ \\t]*/gi, " ")'));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
