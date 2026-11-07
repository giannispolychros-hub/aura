// AURA — FINDING 130: A SPORT WORD NO LONGER EXCUSES AN ADULT PARTNER OR RELATIVE (John, 3/11/2026, a safety fix (α); ADR «3 Νοεμβρίου»).
// Branch `safety-detectors`. On 2dbda1b a sport or event word in the sentence (ματς, αγώνα, παιχνίδι, προπόνηση, μποξ, καράτε, ρινγκ …)
// excused every blow in detectsDangerFromOther — «Έχω μελανιές από τις μπουνιές του άντρα μου μετά το ματς.», «Με δέρνει ο άντρας μου
// κάθε φορά που χάνει η ομάδα του στο ματς.» read as nothing. John's NARROW fix: the excuse does not hold when the same sentence names
// an adult partner or relative from a closed list, with «μου / μας» (άντρας / σύζυγος, γυναίκα, σύντροφος / συντρόφισσα, φίλος / φίλη,
// πρώην, πατέρας, μητέρα, αδερφός / αδερφή). The sport lists, the child's-kicks rule of 2/11 and a game at a table (τάβλι, σκάκι …) stay.
//  (lock) the 15 + 15 phrases were written and locked (sha256 in the ADR) BEFORE the code changed
//  (Α) the 15 that must be caught are caught (RED on 2dbda1b: 0/15)
//  (Β) the 15 innocent ones: 12 clean; 2 already alarmed on 2dbda1b and on main (kept as they are); 1 is the false alarm this fix brings,
//      expected and kept by John's decision («μπουνιές του αδερφού μου στην προπόνηση μποξ, κάνουμε σπάρινγκ»)
//  (Γ) the edges: a person not in the list, a list word without «μου / μας», a table game — all as before
//  (Δ) nothing else moved
// All text here is synthetic.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
const ci = raw.indexOf('const AURA_CORE_PERSONALITY'), cs = raw.indexOf('`', ci) + 1, ce = raw.indexOf('`;', cs);
const CODE = raw.slice(0, ci) + raw.slice(ce);
function extract(name) { const s = CODE.indexOf('function ' + name + '('); const e = CODE.indexOf('\n}', s) + 2; return s < 0 ? '' : CODE.slice(s, e); }
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
const h = s => sha(s).slice(0, 16);

let crisis = null, danger = null;
try {
  crisis = new Function(extract('detectSafetySignal') + '\nreturn detectSafetySignal;')();
  danger = new Function(extract('detectsDangerFromOther') + '\nreturn detectsDangerFromOther;')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
assert('(load) the two detectors load from src/App.jsx', typeof crisis === 'function' && typeof danger === 'function');
const call = (f, t) => { try { return f(t); } catch (e) { return 'threw: ' + e.message; } };
const alarm = t => call(crisis, t) === 'CRISIS' || !!call(danger, t);
const self = t => { const d = call(danger, t); return !!d && d.self === true; };

// ── (lock) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const FILE = 'phrases_kin_sport_0311.json', LOCKED = '259159ec60d6ca24b84f1ddcf1df59f3f0419e611d6cd2417bd733da1e586be7';
const ADR = fs.readFileSync(path.join(ROOT, 'ARCHITECTURE_DECISIONS.md'), 'utf8');
const entry = ADR.indexOf('## 3 Νοεμβρίου —') < 0 ? '' : ADR.slice(ADR.indexOf('## 3 Νοεμβρίου —'));
let buf = null; try { buf = fs.readFileSync(path.join(__dirname, FILE)); } catch (e) { }
assert('(lock) ' + FILE + ' is byte for byte the file locked before the code changed (sha256 259159ec…), and the ADR entry «3 Νοεμβρίου» names it',
  !!buf && sha(buf) === LOCKED && entry.includes(LOCKED) && entry.includes(FILE));
let J = { must_catch: [], no_danger: [] }; try { J = JSON.parse(buf.toString('utf8')); } catch (e) { }
const MUST = J.must_catch || [], INNOCENT = J.no_danger || [];
assert('(lock) 15 + 15 phrases, none twice; the first six are the six examples of the 2/11 report',
  MUST.length === 15 && INNOCENT.length === 15 && new Set(MUST.concat(INNOCENT)).size === 30 &&
  MUST[0] === 'Έχω μελανιές από τις μπουνιές του άντρα μου μετά το ματς.' && MUST[5] === 'Ο σύντροφός μου μου έριξε μπουνιές μετά τον αγώνα.');

// ── (Α) must be caught ──────────────────────────────────────────────────────────────────────────────────────────────────────────
let a = 0;
for (const t of MUST) { const x = self(t); if (x) a++; assert('(Α) danger to the person writing: «' + t + '»', x); }
assert('(Α) ' + a + '/15 caught (2dbda1b: 0/15)', a === 15 && MUST.length === 15);

// ── (Β) innocent ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// kept exactly as they read, by John's decision (3/11): «αν μια αθώα φράση πιάνεται λόγω αυτού, ΔΕΝ την αφαιρείς»
const ALREADY = {   // alarmed on 2dbda1b and on main 24aab8e too — not this fix
  'Η κόρη μου με κλωτσάει όταν παίζουμε μπάλα στο πάρκο.': '«με κλωτσάει» with a person named (the kick rule)',
  'Ο προπονητής μου στο μποξ μου έριξε μια μπουνιά στο σπάρινγκ.': '«μου έριξε … μπουνιά» (the blows rule; «μποξ» is not a game word)',
};
const BY_THIS_FIX = {   // the false alarm this fix brings, expected
  'Έχω μελανιές από τις μπουνιές του αδερφού μου στην προπόνηση μποξ, κάνουμε σπάρινγκ μαζί.': '«αδερφού μου» is on the list, so «προπόνηση / μποξ» no longer excuse',
};
let b = 0, bAlready = 0, bFix = 0;
for (const t of INNOCENT) {
  const x = alarm(t); if (x) b++;
  if (ALREADY[t]) { if (x) bAlready++; assert('(Β) an alarm already on 2dbda1b and main, kept (' + ALREADY[t] + '): «' + t + '»', x); }
  else if (BY_THIS_FIX[t]) { if (x) bFix++; assert('(Β) the expected false alarm of this fix, kept (' + BY_THIS_FIX[t] + '): «' + t + '»', x); }
  else assert('(Β) no alarm: «' + t + '»', !x);
}
assert('(Β) the innocent: ' + b + '/15 alarm — ' + bAlready + ' already on 2dbda1b and main, ' + bFix + ' expected from this fix; 12 clean',
  INNOCENT.length === 15 && b === 3 && bAlready === 2 && bFix === 1);

// ── (Γ) the edges: as before ────────────────────────────────────────────────────────────────────────────────────────────────────
const EDGE_CLEAN = [
  'Έχω μελανιές από τις μπουνιές του αντιπάλου μου στο μποξ.',                         // a person NOT on the list
  'Έχω μελανιές από τις μπουνιές του άντρα με τα κόκκινα γάντια στο ρινγκ.',           // a list word WITHOUT «μου / μας»
  'Ο άντρας μου με δέρνει πάντα στο τάβλι.', 'Η μητέρα μου με δέρνει στα χαρτιά κάθε Κυριακή.', // a game at a table still excuses
  'Έχω μελανιές από τις κλωτσιές του γιου μου στο ποδόσφαιρο.',                        // a child's kicks (2/11), unchanged
];
for (const t of EDGE_CLEAN) assert('(Γ) as before, no alarm: «' + t + '»', !alarm(t));
const EDGE_ALARM = [
  'Έχω μελανιές από τις μπουνιές της φίλης μου μετά το ματς.', 'Μου έριξε ξύλο ο αδελφός μου μετά τον αγώνα.',
  'Έχω μελανιές από τις μπουνιές του πρώην μας στην προπόνηση.', 'Η συντρόφισσά μου με έδειρε μετά το παιχνίδι.',
];
for (const t of EDGE_ALARM) assert('(Γ) a listed adult with «μου / μας» and a sport word: an alarm «' + t + '»', self(t));

// ── (Δ) nothing else moved ──────────────────────────────────────────────────────────────────────────────────────────────────────
const LINES_2DBDA1B = [
  '    sport: S(" (?:μποξ|πυγμαχια|πυγμαχιασ|καρατε|ταεκβοντο|προπονηση|προπονησησ|ρινγκ|αγωνα|αγωνασ|ματσ|παιχνιδι) "),\n',
  '    game: S(" (?:ταβλι|σκακι|χαρτια|πρεφα|ποκερ|μπιριμπα|ματσ|μπαλα|ποδοσφαιρο|μπασκετ|τενισ|βολει|παιχνιδι|παιχνιδια|αγωνα|αγωνασ|γκολ|σκορ|τρεξιμο|φιφα|πλαυστατιον|πλειστεισιον) "),\n',
  '    kidSport: S(" (?:ποδοσφαιρο|ποδοσφαιρου|μπασκετ|βολει|τενισ|χαντμπολ|πολο|γυμναστηριο|γυμναστηριου|γηπεδο|γηπεδου|παιδικη χαρα|παιδικησ χαρασ) "),\n',
];
assert('(Δ) the sport list, the game list and the 2/11 play-place list are unchanged, word for word (2dbda1b)', LINES_2DBDA1B.every(l => raw.includes(l)));
assert('(Δ) the 2/11 child\'s-kicks rule is unchanged (2dbda1b)', raw.includes('    kidKicks: S(" (?:απο|με) (?:τισ )?κλωτσιεσ (?:του|τησ|των) (?=(?:μικρου|μικρησ|μικρων|παιδιου|παιδιων|γιου|κορησ)(?: μου| μασ)? " +\n      "(?:$|(?:στο|στη|στην|στον|στα|στισ|στουσ|σε|μετα|οταν|ενω|καθωσ|παιζοντασ|χθεσ|χτεσ|σημερα) ))"),\n'));
assert('(Δ) detectSafetySignal is byte-identical to 2dbda1b', h(extract('detectSafetySignal')) === '1f7c3cb8fe568f31');
const cut = (s, n) => { const a0 = s.indexOf('\nfunction ' + n + '('); return a0 < 0 ? s : s.slice(0, a0) + s.slice(s.indexOf('\n}', a0 + 1) + 2); };
// RE-BASED (John, 3/11/2026, branch candidate-tm): the same cut, the same fingerprint — the reference is now src/App.jsx of candidate-tm
// 7c823c1 (2dbda1b + the Thought Map, exactly as approved), no longer of 2dbda1b
// RE-BASED (John, 7/11/2026, round 6, ADR «7 Νοεμβρίου (γ)», branch release-candidate): the same cut, the same check — the reference is now
  // release-candidate (candidate-tm 1f42762 + hardening-2026-11-a1-local 3a323ec, merged as approved). Proved first: the merged src/App.jsx
  // is exactly the hardening branch's plus candidate-tm's own changes, byte for byte — so outside the cut only the hardening branch moved.
assert('(Δ) src/App.jsx outside detectsDangerFromOther is byte-identical to release-candidate (before:  candidate-tm 7c823c1 (2dbda1b + the Thought Map)', h(cut(raw, 'detectsDangerFromOther')) === 'b8aeeda13a002933');
const coreS = raw.indexOf('`', raw.indexOf('const AURA_CORE_PERSONALITY')) + 1;
assert('(Δ) the prompt is unchanged (b5f303cc9405aa21)', h(raw.slice(coreS, raw.indexOf('`;', coreS))) === 'b5f303cc9405aa21');
assert('(Δ) no lookbehind in detectsDangerFromOther (old iPhones)', !/\(\?<[=!]/.test(extract('detectsDangerFromOther')));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
