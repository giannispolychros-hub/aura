// AURA — John's answers of 12/10/2026 to «Τι θέλει απόφασή σου», the last round before the first tester session
// (ADR «12 Οκτωβρίου (γ)»). After it, the version of the 20 is this commit and the freeze holds (safety only).
//   1  No pressure to stay, in EVERY flow: never «Περίμενε λίγο», «δεν φτάσαμε ακόμα», «πριν φύγεις πρέπει…». It does not close
//      anything: a bare «ευχαριστώ» before the root opens no closing (decision λ) — the conversation goes on, one simple question.
//      ONLY after the safety path, the fixed sentence adds: if they thank you or want to leave, let them go warmly, no new
//      question; never the same question twice. The app's closing steps stay as they are.
//   2  A model reply that is ONLY «Καλή συνέχεια» (. ! … emoji) is shown as «Ευχαριστώ που το μοιράστηκες. Να είσαι καλά.» —
//      also on the crisis path.
//   3  Crisis B: the root button and card stay (6/10). No change.
//   4  When the app is not sure, it does not decide alone — the message goes to the model (NOT for crisis detection: there,
//      unsure = the safety path, as today; the crisis list and the detector are not touched):
//      a negation before a phrase that opens the card, a shift or a closing → nothing; the «Ναι» to a yes/no question only in
//      clear forms («νιώθω χάλια» is not a «Ναι»); an «I don't know» answer to the app's root question is not a root.
//   6  The stress test checks, after «ευχαριστώ» or leaving, that AURA used no pressure phrase.
// The texts are synthetic, or the real MODEL's replies from the stress runs — never John's words.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const PROMPT = raw.slice(_s, _e);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name, src) {
  const C = src || CODE;
  const a = C.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = C.indexOf('(', a), depth = 0;
  for (; k < C.length; k++) { if (C[k] === '(') depth++; else if (C[k] === ')') { depth--; if (depth === 0) break; } }
  const b = C.indexOf('{', k); depth = 0;
  for (let j = b; j < C.length; j++) { if (C[j] === '{') depth++; else if (C[j] === '}') { depth--; if (depth === 0) return C.slice(a, j + 1); } }
  return null;
}
const constSrc = n => { const a = CODE.indexOf('const ' + n + ' = '); return a >= 0 ? CODE.slice(a, CODE.indexOf(';\n', a) + 1) : ''; };
const NAMES = ['describeSafetyPathCtx', 'stripPressurePhrases', 'replaceBareGoodbye', 'detectsSpontaneousCoreRecognition',
  'detectsSpontaneousShiftRecognition', 'declaresClosing', 'detectsAffirmativeShort', 'rootAnswerIsUnsure', 'buildCrisisLine',
  'detectSafetySignal', 'classifyCrisisTier', 'isExplicitClosure', 'matchesClosingWord'];
let F = {};
try {
  const consts = ['PRESSURE_SENTENCE', 'PRESSURE_OPENER', 'BARE_GOODBYE_TEXT'].map(constSrc).join('\n');
  F = new Function(consts + '\n' + NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 16);
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
const HS = CODE.slice(CODE.indexOf('const handleSubmit = useCallback('), CODE.indexOf('const handleSubmit = useCallback(') + 60000);
const sec = (() => { const a = PROMPT.indexOf("FOUNDER'S TEST, 2026-10-12 — RULES FOR EVERY SESSION"); const b = PROMPT.indexOf('<critical_invariants>', a); return a >= 0 && b > a ? PROMPT.slice(a, b) : ''; })();
const para = head => (sec.split('\n').find(l => l.startsWith(head)) || '');
const has = (head, ...parts) => { const p = para(head); return p.length > 0 && parts.every(x => p.includes(x)); };

// ── 0. Crisis detection is not touched (point 4: «unsure» there still means the safety path) ─────────────────────────────────
{
  const PIN = { detectSafetySignal: 'dfaf34c6e1e44e6b', classifyCrisisTier: 'f724a0db0c1a5bf9', buildCrisisLine: 'd359e22dd7cf9a95',
    crisisLineAfterFailedCall: 'c87733effcebde7e', mergeRiskKind: 'd3b56f5bad3ae14f', stageACaptureAllowed: 'e45f98e42434f208',
    detectsMentalHealthReferral: 'd03b71d681025b79' };
  for (const [n, h] of Object.entries(PIN)) assert(`UNCHANGED: ${n} is byte for byte the same function`, sha(fullFnSrc(n, raw)) === h);
  assert('UNCHANGED: a negated crisis phrase is still crisis tier A (unsure → the safety path, as today)',
    T('detectSafetySignal', 'δεν θέλω να κάνω κακό στον εαυτό μου') === 'CRISIS' && T('classifyCrisisTier', 'δεν θέλω να ζω') === 'A');
}

// ── 1. No pressure to stay — the prompt, the fixed sentence after the safety path, the display guard ─────────────────────────
assert('PROMPT: NO PRESSURE TO STAY, IN EVERY FLOW — the three phrases named, pressure or guilt',
  has('NO PRESSURE TO STAY, IN EVERY FLOW', '«Περίμενε λίγο»', '«δεν φτάσαμε ακόμα»', '«πριν φύγεις πρέπει…»', 'pressure or guilt'));
assert('PROMPT: … it closes nothing — a bare «ευχαριστώ» before the root opens no closing; the conversation goes on with one simple question',
  has('NO PRESSURE TO STAY, IN EVERY FLOW', 'This does not close the conversation', 'a bare «ευχαριστώ» before the root opens none',
    'one simple question, no pressure', 'the app\'s own closing steps are unchanged'));
assert('PROMPT: AFTER THE SAFETY PATH — let them go warmly with no new question; never the same question twice',
  has('AFTER THE SAFETY PATH', 'never the same question twice', 'if they thank you or want to leave, let them go warmly, with no new question'));
{
  const N = T('describeSafetyPathCtx', 1);
  const inner = (String(N).match(/^\n\[CODE-VERIFIED: ([^\]\n]+)\]\n$/) || [])[1] || '';
  assert('SAFETY NOTE: still ONE sentence, crisis A and B, nothing for 0 or DISTRESS',
    inner.length > 0 && (inner.match(/[.!?;](?=\s|$)/g) || []).length === 1 && N === T('describeSafetyPathCtx', 2) &&
    T('describeSafetyPathCtx', 0) === '' && T('describeSafetyPathCtx', 3) === '');
  assert('SAFETY NOTE: + «never the same question twice» + «if they thank you or want to leave, let them go warmly, with no new question»',
    /support only, in proportion to what the user actually said/.test(inner) && /never the same question twice/.test(inner) &&
    /if they thank you or want to leave, let them go warmly, with no new question/.test(inner));
  assert('SAFETY NOTE: still no helpline, no number, no organization',
    !/\d/.test(inner) && !/line|number|call|phone|hotline|γραμμ|τηλ|αριθμ|1018|10306|112/i.test(inner));
}
{
  const P = s => T('stripPressurePhrases', s);
  // The real model's reply to «ευχαριστώ» in run 26, session 34
  const RUN26 = 'Περίμενε λίγο — δεν φτάσαμε ακόμα εκεί που έχει νόημα.\n\nΔώδεκα χρόνια λογίστρια, δύο χρόνια με αυτή τη σκέψη. Τι είναι αυτό που η μαγειρική σου δίνει που το γραφείο δεν σου δίνει;';
  assert('PRESSURE (run 26, session 34): «Περίμενε λίγο — δεν φτάσαμε ακόμα…» goes; the rest of the reply stays',
    P(RUN26) === 'Δώδεκα χρόνια λογίστρια, δύο χρόνια με αυτή τη σκέψη. Τι είναι αυτό που η μαγειρική σου δίνει που το γραφείο δεν σου δίνει;');
  const GONE = ['Μη φύγεις ακόμα — έχουμε κάτι σημαντικό εδώ.', 'Πριν φύγεις, πρέπει να δούμε κάτι ακόμα.', 'Δεν τελειώσαμε ακόμα.',
    'Μην το κλείσεις τώρα, είμαστε κοντά.', 'Πριν φύγεις θέλω να σε ρωτήσω κάτι.', 'Δεν φτάσαμε ακόμα στο σημείο.'];
  const gone = GONE.filter(s => P('Σε ακούω. ' + s + '\n\nΤι σε κρατάει;') !== 'Σε ακούω.\n\nΤι σε κρατάει;');
  assert('PRESSURE: each pressure sentence goes' + (gone.length ? ' — kept: ' + gone.join(' | ') : ''), gone.length === 0);
  assert('PRESSURE: «Περίμενε, …» at the start of a sentence loses the opener; the question after it stays',
    P('Περίμενε, εννοείς ότι το θέλεις;') === 'Εννοείς ότι το θέλεις;' && P('Περίμενε λίγο. Τι εννοείς;') === 'Τι εννοείς;');
  const KEEP = ['Πριν φύγεις — μία λέξη, ή μια φράση που θέλεις να κρατήσεις. Όχι για εδώ. Για σένα, όταν ξαναβρεθείς σε αυτή τη σκέψη.',
    'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.', 'Για στάσου.\n\nΜόλις είπες: «είναι σωστή επιλογή». Το θέλεις αρκετά για να σηκώσεις κι αυτό;',
    'Ας σταθούμε λίγο εδώ.', 'Τι περιμένεις να γίνει;', 'Ο άντρας σου περίμενε να του το πεις;', 'Περιμένεις κάτι από αυτόν;',
    'Είπες «περίμενε λίγο» στον εαυτό σου. Τι σε κρατάει;', 'Μείνε λίγο με αυτή τη σκέψη: τι σε τρομάζει;', 'Τι σε κρατάει;',
    'Περίμενες κάτι διαφορετικό;', 'Είπες «δεν φτάσαμε ακόμα εκεί». Τι εννοείς;'];
  const changed = KEEP.filter(s => P(s) !== s);
  assert('PRESSURE: the app\'s own «Πριν φύγεις — μία λέξη…», the stop moment, «περιμένεις», the past «περίμενε», quoted words stay' + (changed.length ? ' — changed: ' + changed.join(' | ') : ''), changed.length === 0);
  assert('PRESSURE: a removed line leaves no gap inside a block of lines', P('Σε ακούω.\nΜη φύγεις ακόμα.\nΤι σε κρατάει;') === 'Σε ακούω.\nΤι σε κρατάει;');
  assert('PRESSURE: empty and null are safe', P('') === '' && P(null) === '');
}
assert('WIRING: the pressure guard runs inside cleanLabels — every model reply, before the screen and the history',
  /const cleanLabels = useCallback\(\(t\) => \{ const r = stripInternalLabels\(t\); if \(r\.count\) labelLeaks\.current \+= r\.count; return stripPressurePhrases\(stripRootDeclaration\(stripForeignHelplines\(r\.text\)\)\); \}, \[\]\);/.test(CODE));
assert('UNCHANGED: the app\'s closing steps — a bare «ευχαριστώ» before the root still opens nothing on its own (decision λ); the closing detectors read it as before',
  T('declaresClosing', 'ευχαριστώ') === true && T('isExplicitClosure', 'Ευχαριστώ, κλείνουμε εδώ.') === true);

// ── 2. A bare «Καλή συνέχεια» from the model is shown as the approved sentence ──────────────────────────────────────────────
{
  const R = s => T('replaceBareGoodbye', s);
  const NEW = 'Ευχαριστώ που το μοιράστηκες. Να είσαι καλά.';
  assert('BARE: «Καλή συνέχεια.», «Καλή συνέχεια», «Καλή συνέχεια!», «καλή συνέχεια!!», «Καλή συνέχεια 🙂», «Καλή συνέχεια…» → the approved sentence',
    ['Καλή συνέχεια.', 'Καλή συνέχεια', 'Καλή συνέχεια!', 'καλή συνέχεια!!', 'Καλή συνέχεια 🙂', 'Καλή συνέχεια…', '  Καλή συνέχεια.  ', 'ΚΑΛΗ ΣΥΝΕΧΕΙΑ'].every(s => R(s) === NEW));
  const B = T('buildCrisisLine', 'B', '', false).line, A = T('buildCrisisLine', 'A', '', false).line;
  assert('BARE, CRISIS PATH: the model\'s bare «Καλή συνέχεια.» above the app\'s line (10306 or 1018) → the approved sentence, the line unchanged',
    R('Καλή συνέχεια.\n\n' + B) === NEW + '\n\n' + B && R('Καλή συνέχεια!\n\n' + A) === NEW + '\n\n' + A);
  const KEEP = ['Καλή συνέχεια με τη σχολή.', 'Τα λέμε. Καλή συνέχεια.', 'Σου εύχομαι καλή συνέχεια.', 'ΗΡΘΕΣ ΜΕ: x\n\nΒΡΗΚΕΣ: y\n\nΚαλή συνέχεια.',
    'Καλή συνέχεια.\n\nΤι άλλο κρατάς;', 'Τι σε κρατάει;', ''];
  const changed = KEEP.filter(s => R(s) !== s);
  assert('BARE: only a WHOLE message — a sentence with more words, or more text after it, stays as written' + (changed.length ? ' — changed: ' + changed.join(' | ') : ''), changed.length === 0);
  const MB = CODE.slice(CODE.indexOf('const MessageBubble = memo(function MessageBubble('), CODE.indexOf('const MessageBubble = memo(function MessageBubble(') + 3000);
  assert('WIRING: on the SCREEN only, AURA\'s messages only (the history and the closing steps read what the model wrote)',
    /: \(isUser \? msg\.content : replaceBareGoodbye\(msg\.content\)\)\);/.test(MB) && !/replaceBareGoodbye/.test(GEN));
}

// ── 4. When the app is not sure, it does not decide alone ──────────────────────────────────────────────────────────────────
{
  const core = t => T('detectsSpontaneousCoreRecognition', t), shift = t => T('detectsSpontaneousShiftRecognition', t), dc = t => T('declaresClosing', t);
  assert('NEGATION, card: «δεν μου βγάζει νόημα» does not open the root card; «μου βγάζει νόημα» still does',
    core('δεν μου βγάζει νόημα όλο αυτό') === false && core('Αυτό μου βγάζει νόημα') === true);
  assert('NEGATION, card: «δεν ξέρω τι με απασχολεί», «δεν το βρήκα ακόμα», «δεν νομίζω ότι το βρήκα» open nothing; without the negation they do',
    core('Δεν ξέρω τι με απασχολεί.') === false && core('δεν το βρήκα ακόμα') === false && core('δεν νομίζω ότι το βρήκα') === false &&
    core('Ξέρω τι με απασχολεί.') === true && core('Το βρήκα!') === true);
  assert('NEGATION, card: «όχι αυτό ακριβώς» (όχι right before) opens nothing; «Ναι, αυτό ακριβώς» and a negation AFTER the phrase still do',
    core('όχι αυτό ακριβώς') === false && core('Ναι, αυτό ακριβώς') === true && core('Το βρήκα, δεν το περίμενα') === true);
  assert('NEGATION, shift: «δεν άλλαξε κάτι», «δεν το βλέπω αλλιώς» are not a shift; «Άλλαξε κάτι», «Τώρα κατάλαβα, δεν είναι αυτό που νόμιζα» are',
    shift('δεν άλλαξε κάτι') === false && shift('δεν το βλέπω αλλιώς') === false && shift('Άλλαξε κάτι μέσα μου') === true &&
    shift('Τώρα κατάλαβα, δεν είναι αυτό που νόμιζα.') === true);
  assert('NEGATION, closing: «δεν τα λέμε αυτά», «δεν κλείνουμε ακόμα», «μην κλείνουμε» do not close; «Τα λέμε!», «Κλείνουμε, δεν έχω κάτι άλλο» still do',
    dc('Με τη μάνα μου δεν τα λέμε αυτά.') === false && dc('δεν κλείνουμε ακόμα') === false && dc('μην κλείνουμε') === false &&
    dc('Τα λέμε!') === true && dc('Κλείνουμε, δεν έχω κάτι άλλο') === true && dc('Ευχαριστώ, κλείνουμε εδώ.') === true);
  assert('NEGATION, other clause: a comma ends the negation («Δεν αντέχω άλλο, κλείνουμε εδώ.» still closes; «δεν ξέρω, αλλά το βρήκα» still opens)',
    dc('Δεν αντέχω άλλο, κλείνουμε εδώ.') === true && core('δεν ξέρω, αλλά το βρήκα') === true);
  assert('NEGATION, other sentence: a negation in the PREVIOUS sentence does not count («Δεν ξέρω. Το βρήκα!»)',
    core('Δεν ξέρω. Το βρήκα!') === true && dc('Δεν ξέρω. Τα λέμε.') === true);
  const yes = t => T('detectsAffirmativeShort', t);
  assert('CLEAR «ΝΑΙ»: «νιώθω χάλια», «Ναι, νιώθω χάλια», «Ναι αλλά φοβάμαι», «νιώθω ότι όχι», «ναι μάλλον», «Νιώθω το ίδιο» are NOT a «Ναι»',
    ['νιώθω χάλια', 'Ναι, νιώθω χάλια', 'Ναι αλλά φοβάμαι', 'νιώθω ότι όχι', 'ναι μάλλον', 'Νιώθω το ίδιο', 'ναι δεν ξέρω', 'Νιώθω άσχημα'].every(t => yes(t) === false));
  assert('CLEAR «ΝΑΙ»: the clear forms still are — «Ναι», «ναι!», «Ναιιι», «Ναι 🙂», «Ναι, νομίζω», «Νομίζω ναι», «Ακριβώς», «Σωστά», «Όντως», «Νιώθω», «Νιώθω κάπως έτσι», «Ναι, αρχίζει να ξεκαθαρίζει»',
    ['Ναι', 'ναι!', 'Ναιιι', 'Ναι 🙂', 'Ναι, νομίζω', 'Νομίζω ναι', 'Ακριβώς', 'Σωστά', 'Όντως', 'Νιώθω', 'Νιώθω κάπως έτσι', 'Ναι, αρχίζει να ξεκαθαρίζει',
     'Έτσι νομίζω', 'Κάπως έτσι', 'ναι ε', 'Ναι, κάτι ξεκαθαρίζει', 'Ναι, το βλέπω', 'Ναιναι'].every(t => yes(t) === true));
  assert('CLEAR «ΝΑΙ»: as before, «Όχι», «Δεν είμαι σίγουρος», empty and more than 6 words are not',
    yes('Όχι') === false && yes('Δεν είμαι σίγουρος') === false && yes('') === false && yes('Ναι ναι ναι ναι ναι ναι ναι') === false);
  const u = t => T('rootAnswerIsUnsure', t);
  assert('ROOT: «Δεν ξέρω», «δεν ξέρω ακόμα», «Δεν ξέρω τι με απασχολεί», «Δεν είμαι σίγουρη», «Δεν μπορώ να το πω.» are not a root — the model takes the message',
    ['Δεν ξέρω', 'δεν ξέρω ακόμα', 'Δεν ξέρω τι με απασχολεί.', 'Δεν είμαι σίγουρη', 'Δεν μπορώ να το πω.', 'ε δεν ξέρω ακριβώς'].every(t => u(t) === true));
  assert('ROOT: an answer that says something stays a root («Δεν ξέρω αν θέλω να μείνω στη δουλειά», «Φοβάμαι ότι θα αποτύχω»)',
    ['Δεν ξέρω αν θέλω να μείνω στη δουλειά', 'Φοβάμαι ότι θα αποτύχω', 'Ότι δεν ξέρω τι θέλω από τη ζωή μου', '', null].every(t => u(t) === false));
  assert('WIRING (root): right after the crisis check of a typed root — an «I don\'t know» that passed the substance rule is no card: the flow steps aside, the model takes it',
    /if \(!stageACaptureAllowed\(userText\)\) \{\s*stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "cancel" \}\);\s*\} else if \(rootTextHasSubstance\(userText\) && rootAnswerIsUnsure\(userText\)\) \{(?:\s*\/\/[^\n]*)+\s*stageARootArmed\.current = false;\s*stageADispatch\(\{ type: "cancel" \}\);\s*\} else if \(\(_saPhase === "ask"/.test(HS));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
