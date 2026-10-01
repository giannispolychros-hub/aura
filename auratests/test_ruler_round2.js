// ── Ο ΧΑΡΑΚΑΣ, ΔΕΥΤΕΡΟΣ ΓΥΡΟΣ: ό,τι έχασαν οι ανιχνευτές σε πέμπτη πραγματική συνεδρία (Ε) ────────────
//
// WHY. A fifth real session was replayed through the detectors and ALL thirteen AURA sentences that broke a
// written rule came back null/false. This adds only what a measurement against the prompt's own 442 quoted
// sentences showed to be safe. OBSERVATION ONLY, exactly like the detectors it extends: they feed a counter and
// a console warning, never a rewrite.
//
// DELIBERATELY NOT ADDED, and pinned so nobody "completes" the list later:
//   «Καλή τύχη» — the prompt itself calls "Καλή τύχη αύριο" a CLEAN, CORRECT goodbye (NO RETENTION HOOK).
//   «συμφωνώ»  — also on the prohibited list, but would also catch a mirrored «δεν συμφωνώ».
//   the market claim «δεν υπάρχει ακόμα ως προϊόν» — a content claim with endless wordings; a founder decision.
//
// Fixtures are synthetic, same grammatical shape as what was measured; no user text is stored.
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
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function extract(name) { const s = raw.indexOf('function ' + name + '('); return s < 0 ? null : raw.slice(s, raw.indexOf('\n}', s) + 2); }
eval(extract('parseRoadMap')); eval(extract('looksLikeAdviceCascade'));
const V = eval('(' + extract('detectOutputViolation') + ')');
const C = eval('(' + extract('detectsClaimAboutUser') + ')');

// ── 1. EVALUATION: the approvals UNIVERSAL NO-EVALUATION lists (or plainly equals) and the detector lacked ──
for (const [t, why] of [
  ['Καλή ερώτηση — και είναι πρόβλημα που υπάρχει.', 'the real reply'],
  ['Ωραία ερώτηση.', 'ωραία'], ['Εξαιρετική ερώτηση, πάμε παρακάτω.', 'εξαιρετική'], ['Καλό ερώτημα.', 'ερώτημα, neuter'],
  ['Εύλογο ερώτημα.', 'the real reply'], ['Εύλογη ερώτηση.', 'εύλογη'],
  ['Καλή ιδέα.', 'named on the prompt\'s own prohibited list'], ['Αυτό είναι μια καλή ιδέα για να ξεκινήσεις.', 'inside a longer sentence'],
  ['Ωραία ιδέα. Τι θα κάνεις πρώτα;', 'followed by a legitimate question'],
  ['ΚΑΛΗ ΙΔΕΑ', 'capitals, no accents'],
]) assert('EVALUATION: «' + t + '» — ' + why, V(t, {}) === 'EVALUATION');
for (const [t, why] of [
  ['Είναι καλή ερώτηση;', 'AURA asking'], ['Θεωρείς ότι είναι καλή ιδέα;', 'AURA asking'],
  ['Είπες ότι είναι καλή ιδέα.', 'attributed: Mirror Rule'], ['Λες ότι είναι ωραία ερώτηση.', 'attributed, present'],
  ['Έγραψες «καλή ιδέα» και μετά σταμάτησες.', 'the person\'s own words in « »'],
  ['Καλή τύχη αύριο.', 'the prompt\'s own CLEAN GOODBYE — must never flag'], ['Καλή τύχη με αυτό.', 'goodbye, same'],
  ['Καλή συνέχεια.', 'the closing phrase used everywhere'], ['Τι ιδέα έχεις;', 'unrelated'], ['Η ερώτηση ήταν καλή για εμένα.', 'no adjacent "καλή ερώτηση"'],
]) assert('NOT EVALUATION: «' + t + '» — ' + why, V(t, {}) !== 'EVALUATION');

// ── 2. FORM 9: AURA's own label / need / inner state put on the person ────────────────────────────
for (const [t, why] of [
  ['Και το "όλα γίνονται" — αυτό το κουβαλάς ήδη μαζί σου.', 'the real closing sentence (quote stripped, but the claim is outside it)'],
  ['Αυτό το κουβαλάς ήδη μέσα σου.', 'μέσα'], ['Την απάντηση την έχεις ήδη μέσα σου.', 'έχεις … ήδη … μέσα σου'],
  ['Αυτό που περιγράφεις μοιάζει περισσότερο με ανάγκη για δομή παρά για παρέα.', 'real'],
  ['Αυτό μοιάζει περισσότερο με ανάγκη να βάλεις τάξη στις σκέψεις σου.', 'real'],
  ['Μοιάζει να ψάχνεις αν υπάρχει κάτι εδώ που αξίζει τον χρόνο σου.', 'real'], ['Μοιάζει να φοβάσαι την αλλαγή.', 'φοβάσαι'],
  ['Μοιάζει να θέλεις βεβαιότητα.', 'θέλεις'], ['Μοιάζει να αναζητάς ησυχία.', 'αναζητάς'], ['Μοιάζει να νιώθεις κολλημένος.', 'νιώθεις'],
  ['Κουβαλάς όλο αυτό ήδη μέσα σου.', 'words between «κουβαλάς» and «ήδη»'],
  ['Αυτό που ψάχνεις δεν είναι AI φίλος.', 'a negation label'], ['Αυτό που θέλεις δεν είναι συμβουλή.', 'θέλεις'],
  ['Αυτό που περιγράφεις δεν είναι πρόβλημα χρόνου.', 'περιγράφεις'],
]) assert('CLAIM: «' + t + '» — ' + why, C(t) === true);
for (const [t, why] of [
  ['Τι κουβαλάς ήδη μέσα σου;', 'a question'],
  ['Κουβαλάς μαζί σου ένα σακίδιο.', 'literal carrying, no «ήδη»'], ['Αυτό που ψάχνεις δεν είναι συμβουλή;', 'the negation label as a QUESTION'], ['Μοιάζει να ψάχνεις κάτι;', 'a question'],
  ['Αυτό που περιγράφεις είναι συγκεκριμένο.', 'no negation label (not this form)'],
  ['Μοιάζει με το πρόβλημα που είπες.', 'μοιάζει without an inner-state claim'],
  ['Η ανάγκη για δομή ήταν δική σου λέξη.', 'ανάγκη without μοιάζει'],
  ['Το δωμάτιο μοιάζει να έχει ανάγκη από βαφή.', 'about a room'],
  ['Το κουβαλάει ήδη η εταιρεία.', 'third person'],
  ['Έγραψες «μοιάζει να φοβάμαι» και σταμάτησες.', 'the person\'s own words in « »'],
  ['Τι ψάχνεις να ξεκαθαρίσεις;', 'AURA\'s standard question'],
]) assert('NOT CLAIM: «' + t + '» — ' + why, C(t) === false);
assert('EXISTING: FORM 7 still flags', C('Κάνεις κάτι, αλλά ξέρεις ότι δεν αγγίζει τη ρίζα.') === true);
assert('EXISTING: FORM 8 still flags', C('Εδώ υπάρχει μία τάση: την πρόταση την βλέπεις ως παγίδα.') === true);

// ── 3. THE PROMPT'S OWN QUOTED SENTENCES — the false-positive corpus ──────────────────────────────
const set = new Set();
for (const m of PROMPT.matchAll(/["«]([^"«»\n]{12,300})["»]/g)) if (/[α-ωά-ώΑ-Ω]/.test(m[1])) set.add(m[1].trim());
const corpus = [...set];
assert('NON-VACUITY: the corpus has hundreds of prescribed/prohibited sentences (' + corpus.length + ')', corpus.length > 300);
const vFlag = corpus.filter(t => V(t, {})), cFlag = corpus.filter(t => C(t));
// Everything flagged must be a PROHIBITED example, never a prescribed one. Counted rather than listed, so a
// prompt edit that adds a flagged sentence fails here and is looked at by a person (before this change: 12 and 1).
assert('the detectors flag exactly the sentences they flagged before this change, in the prompt (' + vFlag.length + ' evaluation/advice, ' + cFlag.length + ' claim)',
  vFlag.length === 12 && cFlag.length === 1);
assert('none of the new phrases appears in the corpus as a PRESCRIBED sentence',
  !corpus.some(t => /καλη (ερωτηση|ιδεα)|ευλογο ερωτημα|κουβαλασ ηδη|μοιαζει να (ψαχνεισ|φοβασαι)/.test(t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ'))));
assert('"Καλή τύχη αύριο" really is in the prompt as a CLEAN goodbye (why it was NOT added)', /clean, correct goodbye — "Καλή τύχη αύριο"/.test(PROMPT));
assert('the quoted-sentence corpus does not contain «Καλή τύχη» flagged by the evaluation detector',
  !corpus.filter(t => /καλη τυχη/i.test(t.normalize('NFD').replace(/[̀-ͯ]/g, ''))).some(t => V(t, {}) === 'EVALUATION'));

// ── 4. NOT ADDED, PINNED ────────────────────────────────────────────────────────────────────────
assert('NOT ADDED: «Καλή τύχη με αυτό» is not an evaluation', V('Έχεις ήδη την εργαλειοθήκη και την ιδέα.\n\nΚαλή τύχη με αυτό.', {}) !== 'EVALUATION');
assert('NOT ADDED: «συμφωνώ» is not flagged (would also catch a mirrored «δεν συμφωνώ»)', V('Συμφωνώ.', {}) === null);
assert('NOT ADDED: the market claim «δεν υπάρχει ακόμα ως προϊόν» is not detected (a content claim, founder decision)',
  C('Αυτό που περιγράφεις δεν υπάρχει ακόμα ως προϊόν.') === false && V('Αυτό που περιγράφεις δεν υπάρχει ακόμα ως προϊόν.', {}) === null);
assert('OBSERVATION ONLY: nothing rewrites a reply on these verdicts',
  !/detectOutputViolation\([^)]*\)[^\n]*displayText\s*=/.test(raw) && !/detectsClaimAboutUser\([^)]*\)[^\n]*displayText\s*=/.test(raw));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
