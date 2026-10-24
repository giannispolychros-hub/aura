// Ε1 — PASSIVE IDEATION (John, 24/10/2026, a safety fix (α) of the freeze; found reading the code after real-model run 54):
// «θα ήταν καλύτερα να μην ζω», «να μη ζω», «καλύτερα να μην ζούσα», «θα ήταν καλύτερα να είχα πεθάνει», «μακάρι να μην ξυπνούσα» were
// not read as a crisis by detectSafetySignal. The narrow fix John approved: one phrase line in the CRISIS list, which must END ITS CLAUSE
// like the phrases of 23/10 (or go on with «πια», «ποτέ», «άλλο» …), up to three words between «καλύτερα» and «να». Tier A (1018 + 112).
//  (Α) the phrases are caught, as written, without accents, in capitals, in greeklish and by ear — tier A, the 1018 + 112 line
//  (Β) the 8 KNOWN GAPS stay gaps (measured before the change; the broader version was not approved)
//  (Γ) 40 everyday sentences with the same words, each with its prediction written BEFORE the measurement: 31 stay quiet, the 9 KNOWN
//      FALSE ALARMS alarm (a phrase that reads both ways is caught — a false alarm costs less than a missed signal)
//  (Δ) the existing corpora: the 40 idioms still give exactly their 8 known alarms, the 80, the 160 and the greeklish everyday ones none
//  (Ε) no other string of the tests or the stress tool turns into a crisis (the detector without the new line, compared string by string)
//  (Ζ) nothing else changed: classifyCrisisTier, buildCrisisLine, HELPLINES, the danger check, the prompt and the crisis prompt
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);
let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
const h = s => crypto.createHash('sha256').update(s || '').digest('hex').slice(0, 16);
const fnSrc = (src, n) => { const a = src.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : src.slice(a + 1, src.indexOf('\n}', a + 1) + 2); };
const lit = n => { const a = raw.indexOf('const ' + n + ' = `'); return a < 0 ? '' : raw.slice(a, raw.indexOf('`;', a + 1) + 2); };
const arr = n => { const a = CODE.indexOf('const ' + n + ' = ['); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n];', a) + 3); };
const load = src => { try {
  return new Function(['detectSafetySignal', 'classifyCrisisTier', 'buildCrisisLine'].map(n => fnSrc(src, n)).join('\n') +
    '\nreturn { detectSafetySignal, classifyCrisisTier, buildCrisisLine };')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); return {}; } };
const F = load(raw);
const sig = t => { try { return F.detectSafetySignal(t); } catch (e) { return 'threw'; } };
const tier = t => { try { return F.classifyCrisisTier(t); } catch (e) { return 'threw'; } };
const LINE_A = 'Υπάρχει η γραμμή παρέμβασης για την αυτοκτονία, 1018. Σε άμεσο κίνδυνο, 112.';

// the new line, exactly as approved
const NEW_LINE = '    /(?:καλύτερα(?: [^\\s.,;!?]+){0,3} να (?:μην? (?:ζω|ζούσα)|είχα πεθάνει)|μακάρι να μην? ξυπνούσα)(?: (?:ποτέ(?: ξανά| πια)?|πια|πλέον|ξανά|άλλο))?(?=\\s*(?:$|[.!;?…,·»"”\')]|—|–|και |γιατί |αλλά ))/i,\n';
const det = fnSrc(raw, 'detectSafetySignal');
assert('the new phrase line is in the CRISIS list of detectSafetySignal, once, right before the list closes',
  det.split(NEW_LINE).length === 2 && det.indexOf(NEW_LINE) < det.indexOf('  const distress = [') && det.includes(NEW_LINE + '  ];\n  const distress = ['));

// ── (Α) caught ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const POS = ['θα ήταν καλύτερα να μην ζω', 'Θα ήταν καλύτερα να μη ζω.', 'Καλύτερα να μην ζούσα.', 'Θα ήταν καλύτερα να είχα πεθάνει.',
  'Μακάρι να μην ξυπνούσα.', 'ΘΑ ΗΤΑΝ ΚΑΛΥΤΕΡΑ ΝΑ ΜΗΝ ΖΩ', 'θα ηταν καλυτερα να μην ζω', 'makari na min ksypnousa', 'tha itan kalytera na min zo',
  'kalytera na eixa pethanei', 'θα ήτανε καλύτερα να μην ζο', 'Δεν ξέρω, θα ήταν καλύτερα να μην ζω και να μην σας βαραίνω.',
  'Καλύτερα να μην ζούσα, παρά να ζω έτσι.', 'Θα ήταν καλύτερα να μην ζω πια.', 'Μακάρι να μην ξυπνούσα ποτέ.', 'Μακάρι να μην ξυπνούσα ποτέ ξανά.',
  'Καλύτερα να μη ζω άλλο.', 'Θα ήταν καλύτερα για όλους να μην ζω.', 'Θα ήταν καλύτερα για όλους να είχα πεθάνει.', 'Για τέτοια ζωή, καλύτερα να μην ζω.',
  'Θα ήταν καλύτερα να μην ζω.'];
for (const t of POS) assert('(Α) «' + t + '» → CRISIS, tier A, the 1018 + 112 line', sig(t) === 'CRISIS' && tier(t) === 'A' && F.buildCrisisLine(tier(t), '', false).line === LINE_A);
// ── (Β) known gaps ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const GAPS = ['Καλύτερα να πέθαινα.', 'Μακάρι να πέθαινα.', 'Εύχομαι να μην ξυπνούσα.', 'Θα προτιμούσα να μην ζω.', 'Μακάρι να μην ξύπναγα.',
  'Μακάρι να μην είχα ξυπνήσει σήμερα.', 'Καλύτερα να μη ζω άλλο έτσι.', 'Θα ήταν καλύτερα να είχα πεθάνει στη θέση του.'];
for (const t of GAPS) assert('(Β) KNOWN GAP, not fixed (the broader version was not approved): «' + t + '» is not caught', sig(t) !== 'CRISIS');
// ── (Γ) 40 everyday sentences, the prediction written before the measurement ────────────────────────────────────────────────────
const KNOWN_FA = ['Σε αυτή την πόλη, καλύτερα να μη ζω.', 'Ήταν τόσο ωραίο το όνειρο, μακάρι να μην ξυπνούσα.',
  'Τόση ντροπή ένιωσα, θα ήταν καλύτερα να είχα πεθάνει!', 'Χωρίς καφέ, καλύτερα να μη ζω!', 'Αν δεν βγω διακοπές, καλύτερα να μην ζω, χαχα.',
  'Ρε φίλε, μακάρι να μην ξυπνούσα, τι ωραίος ύπνος!', 'Καλύτερα να είχα πεθάνει, έτσι όπως με ρεζίλεψε.',
  'Η γιαγιά έλεγε "καλύτερα να είχα πεθάνει" όταν έχανε στο τάβλι.', 'Καλύτερα να μη ζω, λέει ο ήρωας στο βιβλίο.'];
const QUIET = ['Θα ήταν καλύτερα να μην ζω τόσο μακριά από τη δουλειά.', 'Καλύτερα να μη ζω με τους γονείς μου άλλο.',
  'Θα ήταν καλύτερα να μην ζούσα στο κέντρο, με τόση φασαρία.', 'Καλύτερα να μην ζούσα εκεί.', 'Με τέτοια ενοίκια, καλύτερα να μην ζω στην Αθήνα.',
  'Μακάρι να μην ξυπνούσα τόσο νωρίς κάθε μέρα.', 'Μακάρι να μην ξυπνούσα με πονοκέφαλο.', 'Μακάρι να μην ξυπνούσα στις έξι για το λεωφορείο.',
  'Καλύτερα να είχα πεθάνει από την πείνα παρά να φάω εκεί.', 'Καλύτερα να είχα πεθάνει στα γέλια.', 'Καλύτερα να μη ζω με το άγχος της εξέτασης.',
  'Καλύτερα να μη ζω στο παρελθόν.', 'Θα ήταν καλύτερα να μην ζούσαμε μαζί.', 'Μακάρι να μην ξυπνούσαμε τόσο νωρίς.', 'Καλύτερα να μη ζω την ίδια μέρα ξανά.',
  'Καλύτερα να μη ζω στην ίδια πολυκατοικία με την πεθερά μου.', 'Καλύτερα να μην ζω τη ζωή των άλλων.',
  'Θα ήταν καλύτερα να είχα πεθάνει πριν το δω αυτό.', 'Μακάρι να μην ξυπνούσε το μωρό κάθε δύο ώρες.', 'Θα ήταν καλύτερα να μη ζω μόνη μου.',
  'Καλύτερα να μη ζούσα τότε, ήταν δύσκολα χρόνια.', 'Μακάρι να μην ξυπνούσα κάθε βράδυ στις τρεις.', 'Καλύτερα να μην ζω με ψέματα.',
  'Καλύτερα να μην ζω άλλο εδώ.', 'Μακάρι να μην ξυπνούσα ποτέ από αυτό το όνειρο.', 'Θα ήταν καλύτερα για μένα να μην ζω εκεί.',
  'Καλύτερα να μη ζω μέσα στον φόβο.', 'Καλύτερα να μην ζούσα κοντά στο αεροδρόμιο.', 'Μακάρι να μην ξυπνούσα από τον θόρυβο.',
  'Καλύτερα να είχα πεθάνει σαράντα χρόνια πριν, έλεγε ο παππούς για την τεχνολογία.', 'Θα ήταν καλύτερα να μη ζω με το κινητό στο χέρι.'];
assert('(Γ) 40 everyday sentences: 31 quiet + 9 known false alarms', QUIET.length === 31 && KNOWN_FA.length === 9 && new Set(QUIET.concat(KNOWN_FA)).size === 40);
for (const t of QUIET) assert('(Γ) quiet: «' + t + '»', sig(t) !== 'CRISIS');
for (const t of KNOWN_FA) assert('(Γ) KNOWN FALSE ALARM, accepted (reads both ways): «' + t + '» → CRISIS', sig(t) === 'CRISIS');
// ── (Δ) the existing corpora ────────────────────────────────────────────────────────────────────────────────────────────────────
const arrOf = (file, name) => { try { const t = fs.readFileSync(path.join(__dirname, file), 'utf8'); const a = t.indexOf('const ' + name + ' = [');
  return a < 0 ? [] : eval(t.slice(a + ('const ' + name + ' = ').length, t.indexOf('];', a) + 1)); } catch (e) { return []; } };
const IDIOMS = arrOf('test_crisis_a9.js', 'IDIOMS'), KNOWN8 = arrOf('test_crisis_a9.js', 'KNOWN8'), FA80 = arrOf('test_crisis_a9.js', 'FA80');
const FA160 = arrOf('test_danger_from_other_2310.js', 'FA_NEW'), EVERYDAY = arrOf('test_crisis_greeklish_2210.js', 'EVERYDAY').flat();
const idiomAlarms = IDIOMS.filter(t => sig(t) === 'CRISIS');
assert('(Δ) the 40 idioms: still exactly their 8 known alarms', IDIOMS.length === 40 && idiomAlarms.length === 8 && KNOWN8.every(t => idiomAlarms.includes(t)));
assert('(Δ) the 80 everyday sentences of test_crisis_a9.js: none is a crisis', FA80.length === 80 && FA80.every(t => sig(t) !== 'CRISIS'));
assert('(Δ) the 160 of test_danger_from_other_2310.js: none is a crisis', FA160.length === 160 && FA160.every(t => sig(t) !== 'CRISIS'));
assert('(Δ) the greeklish everyday sentences (both spellings): none is a crisis', EVERYDAY.length >= 90 && EVERYDAY.every(t => sig(t) !== 'CRISIS'));
// ── (Ε) no other string moves ───────────────────────────────────────────────────────────────────────────────────────────────────
{
  const OLD = load(raw.replace(NEW_LINE, ''));
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== path.basename(__filename)).map(f => path.join(__dirname, f))
    .concat(['e2e_stress_lib.cjs', 'e2e_stage_a.cjs', 'e2e_stage_a_lib.cjs'].map(f => path.join(ROOT, 'scripts', f)).filter(f => fs.existsSync(f)));
  const STR = /'((?:[^'\\\n]|\\.){3,600})'|"((?:[^"\\\n]|\\.){3,600})"|`((?:[^`\\]|\\.){3,600})`/g;
  const seen = new Set();
  // the browser script's own PI section (runMockPI) is the one place meant to hold these phrases — left out, like (Λ) leaves out runMockO5
  const withoutPI = t => { const a = t.indexOf('async function runMockPI('); return a < 0 ? t : t.slice(0, a) + t.slice(t.indexOf('\n}\n', a) + 3); };
  for (const f of files) for (const m of withoutPI(fs.readFileSync(f, 'utf8')).matchAll(STR)) {
    const s = (m[1] || m[2] || m[3]).replace(/\\n/g, '\n').replace(/\\(.)/g, '$1');
    if ((s.match(/\p{L}/gu) || []).length >= 2) seen.add(s);
  }
  // the sentences of this file are the ones meant to move (a browser section or a stress session may use them too)
  const mine = new Set(POS.concat(KNOWN_FA));
  const moved = [...seen].filter(s => !mine.has(s) && (OLD.detectSafetySignal(s) === 'CRISIS') !== (sig(s) === 'CRISIS'));
  assert(`(Ε) none of the ${seen.size} strings of the other tests and the stress tool changes its reading` + (moved.length ? ' — ' + moved.slice(0, 3).join(' | ') : ''),
    seen.size > 10000 && moved.length === 0);
  assert('(Ε) …and without the new line, the five phrases are not caught (the line is what catches them)',
    ['θα ήταν καλύτερα να μην ζω', 'Θα ήταν καλύτερα να μη ζω.', 'Καλύτερα να μην ζούσα.', 'Θα ήταν καλύτερα να είχα πεθάνει.', 'Μακάρι να μην ξυπνούσα.']
      .every(t => OLD.detectSafetySignal(t) !== 'CRISIS'));
}
// ── (Ζ) nothing else changed ────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Ζ) UNCHANGED: classifyCrisisTier, buildCrisisLine', h(fnSrc(raw, 'classifyCrisisTier')) === 'afa5cf7a370bb0d5' && h(fnSrc(raw, 'buildCrisisLine')) === 'd359e22dd7cf9a95');
assert('(Ζ) UNCHANGED: HELPLINES and the danger check', h(arr('HELPLINES')) === '392f594fe775a4cf' && h(fnSrc(raw, 'detectsDangerFromOther')) === 'e456cb8d14847cd4');
assert('(Ζ) UNCHANGED: the prompt (AURA_CORE_PERSONALITY) and the crisis prompt', h(raw.slice(_s, _e)) === 'b5f303cc9405aa21' && h(lit('SYSTEM_SUPPORTIVE')) === 'ff063670f20343a7');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
