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
// UPDATED (19/11/2026, «συνομιλία v1», Package 1, John): the prompt changed on purpose in exactly three lines (912, 918, 927; auratests/package1_undo.json) — every prompt fingerprint below moved from b5f303cc9405aa21 to 7e52268becda7360 (313386 characters, was 311822), and api/aura.js carries the new core fingerprint (sha256 675564a7985438c8…, was e791b194…). Nothing else of the prompt moved: auratests/test_package1_prompt_1911.js (7.2)–(7.3).
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
assert('(Δ) detectSafetySignal is byte-identical to 2dbda1b', h(extract('detectSafetySignal')) === '838fe96cf161fcae' /* UPDATED (14/11/2026, John, a safety package: white space at the detectors' input — proved first, auratests/test_detector_spaces_1411.js (Θ)) */);
const cut = (s, n) => { const a0 = s.indexOf('\nfunction ' + n + '('); return a0 < 0 ? s : s.slice(0, a0) + s.slice(s.indexOf('\n}', a0 + 1) + 2); };
// RE-BASED (John, 3/11/2026, branch candidate-tm): the same cut, the same fingerprint — the reference is now src/App.jsx of candidate-tm
// 7c823c1 (2dbda1b + the Thought Map, exactly as approved), no longer of 2dbda1b
// RE-BASED (John, 7/11/2026, round 6, ADR «7 Νοεμβρίου (γ)», branch release-candidate): the same cut, the same check — the reference is now
  // release-candidate (candidate-tm 1f42762 + hardening-2026-11-a1-local 3a323ec, merged as approved). Proved first: the merged src/App.jsx
  // is exactly the hardening branch's plus candidate-tm's own changes, byte for byte — so outside the cut only the hardening branch moved.
  // RE-BASED (John, 8/11/2026, round 9, ADR «8 Νοεμβρίου», branch release-candidate): the same cut, the same check — the reference is now
  // release-candidate after round 9 (the two counters and item 144). Proved first (test_counters_144.js (Ε3)–(Ε4)): with the round's 15
  // changes taken out, src/App.jsx is byte for byte 52f85dc, the reference before — so outside the cut only those changes moved.
assert('(Δ) src/App.jsx outside detectsDangerFromOther is byte-identical to release-candidate (before:  candidate-tm 7c823c1 (2dbda1b + the Thought Map)', h(cut(raw, 'detectsDangerFromOther')) === '16929a379d9a136a' /* UPDATED (24/11/2026, Β, John's order: only this value moved — the one change of the item (four fixed texts of the first screens: the 4th line of the old first screen, the second sentence of the AI line of the entry screen, and two new lines under the start button — the privacy line and the microphone line; texts only, no logic, no state) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 36 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as before) */ /* UPDATED (23/11/2026, Α, John's order: only this value moved — the one change of the item (the closing after the word of Stage A comes from CODE: the pure functions stageAEchoLine and stageAClosureFromCode, the Κ4 recognition cards written ONCE as armRecognitionCards inside deliverFinalClosure — moved, not removed — and the branch from code, the two new arguments of the caller; code only) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 33 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as before) */ /* UPDATED (22/11/2026, Ε, John's order: only this value moved — the one change of the item (a long sentence of the user is shown cut at the last whole word instead of being left out of the root question's list: rootPickCut, the loop of rootPickSentences, the state that says which items were cut, the effect, the button of the list; code only) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 28 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as before) */ /* UPDATED (22/11/2026, Δ, John's order ⚑4: only this value moved — the one change of the item (STAGE_A_TEXTS.stepWhy: the app's text after «Ναι, αυτό είναι», code only; the old two sentences are replaced by John's new two) lies outside the pieces this test cuts away or takes out; proved first: auratests/test_conversation_v1.js (Ω1) — with all 28 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged) */ /* UPDATED (22/11/2026, Λ1, John's corrections ⚑1–⚑2: only this value moved — the root list's changes lie outside the pieces this test cuts away or takes out: the list at the root question (a60045d), decisions 13–15 and now the new heading block and the writing-box rule (two pure functions, one reference, one effect, the handler of the tap, «Δεν το βρήκα ακόμα», the reset line, the screen without the separate line); this note also covers the two earlier moves of this value in e655c25 and 43ec58e, which carried no note of their own. Proved first: auratests/test_conversation_v1.js (Ω1) — with all 27 changes of the branch taken out src/App.jsx is release-candidate e4b2ae6 byte for byte — and auratests/test_notes_card_1511.js (Ω); the prompt (7e52268becda7360) and api/aura.js (sha256 675564a7985438c8…) are unchanged, and the safety detectors are byte for byte as in 6e4307d) */ /* UPDATED (19/11/2026, «συνομιλία v1», Package 1, John: only this value moved — the package's changes lie outside the pieces this test cuts away or takes out; the prompt's three lines and the api fingerprint are proved in auratests/test_package1_prompt_1911.js (7.2)–(7.3)) */ /* UPDATED (17/11/2026 (β), «συνομιλία v1», commit 9, John: only this value moved — the one change of the commit (rootTextHasSubstance: the closed form also takes «καθόλου», «καλά», «σου»; code only) lies outside this test's cut; proved first: auratests/test_conversation_v1.js (Ω1) — with all the branch's changes taken out src/App.jsx is release-candidate e4b2ae6 byte for byte, and auratests/test_notes_card_1511.js (Ω) — with all changes since 50beff6 taken out it is 50beff6 byte for byte) */ /* UPDATED (17/11/2026, «συνομιλία v1», commit 8, John: only this value moved — the one change of the commit (rootTextHasSubstance: a small closed form, so that «Δεν κατάλαβα την ερώτηση» is not a root; code only) lies outside this test's cut; proved first: auratests/test_conversation_v1.js (Ω1) — with all the branch's changes, this one included, taken out src/App.jsx is release-candidate e4b2ae6 byte for byte, and auratests/test_notes_card_1511.js (Ω) — with all changes since 50beff6 taken out it is 50beff6 byte for byte) */ /* UPDATED (16/11/2026, «ROUND TRACE», John: only this value moved — the changes of the branch conversation-v1 (per-turn notes, code only; the round trace of the ?debug=1 panel: numbers and yes/no for the panel, nothing sent) lie outside this test's cut; proved first: auratests/test_conversation_v1.js (Ω1) — with them taken out src/App.jsx is release-candidate e4b2ae6 byte for byte, and auratests/test_notes_card_1511.js (Ω) — with all changes since 50beff6 taken out it is 50beff6 byte for byte) */ /* UPDATED (14/11/2026, John, a safety package: white space at the detectors' input — proved first, auratests/test_detector_spaces_1411.js (Θ)) */);
const coreS = raw.indexOf('`', raw.indexOf('const AURA_CORE_PERSONALITY')) + 1;
assert('(Δ) the prompt is unchanged (7e52268becda7360)', h(raw.slice(coreS, raw.indexOf('`;', coreS))) === '7e52268becda7360');
assert('(Δ) no lookbehind in detectsDangerFromOther (old iPhones)', !/\(\?<[=!]/.test(extract('detectsDangerFromOther')));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
