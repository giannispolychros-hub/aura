// AURA — THE FOOTBALL FALSE ALARM (John, 2/11/2026, a safety fix (α); ADR «2 Νοεμβρίου (δ)»). Branch `safety-detectors`.
// On 469e194 «Έχω μελανιές στα πόδια από τις κλωτσιές του μικρού στο ποδόσφαιρο.» read as danger from another person (line 112 / 15900):
// the `bruises` pattern of detectsDangerFromOther («από τις μπουνιές / κλωτσιές … του / της») is excused only by the `sport` words, and
// «ποδόσφαιρο» is not one of them. John chose the NARROW form of option A: the new sport / play-place words (ποδόσφαιρο, μπάσκετ, βόλεϊ,
// τένις, χάντμπολ, πόλο, γυμναστήριο, γήπεδο, παιδική χαρά) excuse the bruises ONLY when the one kicking is a child, from a closed list.
// An adult («του άντρα μου», «του συντρόφου μου» …) still alarms, sport word or not.
//  (lock) the 30 no-danger phrases of 31/10 and 20 new ones were written and locked (sha256 in the ADR) BEFORE the code changed
//  (Α) the 30 of 31/10: no alarm
//  (Β) the 20 new: no alarm, except the one outside the narrow fix («… παίζουμε μπάλα»: «μπάλα» is not in John's list) — kept as it is
//  (Γ) the other side: an adult kicking, any other blow, a child that is not alone in the phrase, two blows in one sentence — all still alarm
//  (Δ) the 69 danger phrases of test_safety_detectors_3110.js: 69/69; (Ε) its 65 everyday phrases: only the 2 that main already flags
//  (Ζ) nothing else moved: the old `sport` list, detectSafetySignal, the prompt and api/aura.js
// RED on 469e194: (Α) 1 alarm, (Β) 3 alarms. All text here is synthetic.
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
// an alarm = the crisis line or the danger line would show
const alarm = t => call(crisis, t) === 'CRISIS' || !!call(danger, t);

// ── (lock) ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const LOCK = { 'phrases_no_danger_3110.json': '977f5d02eaac8756cbb6a7b3d651498f8d00b36f0c5fe7a57eaf281c891f6bb5',
  'phrases_no_danger_0211.json': '7eccf724aa7a20fff0eb7cc3d7b8a762f1c20edd64eb4e709e75d6b84ebc4dcb' };
const ADR = fs.readFileSync(path.join(ROOT, 'ARCHITECTURE_DECISIONS.md'), 'utf8');
const adrEntry = ADR.slice(ADR.indexOf('## 2 Νοεμβρίου (δ)'));
const read = f => { try { return fs.readFileSync(path.join(__dirname, f)); } catch (e) { return null; } };
for (const [f, want] of Object.entries(LOCK)) {
  assert('(lock) ' + f + ' is byte for byte the file locked before the code changed (sha256 ' + want.slice(0, 8) + '…), and the ADR entry «2 Νοεμβρίου (δ)» names it',
    !!read(f) && sha(read(f)) === want && ADR.includes('## 2 Νοεμβρίου (δ)') && adrEntry.includes(want) && adrEntry.includes(f));
}
const phrases = f => { try { return JSON.parse(read(f).toString('utf8')).phrases; } catch (e) { return []; } };
const OLD30 = phrases('phrases_no_danger_3110.json'), NEW20 = phrases('phrases_no_danger_0211.json');
assert('(lock) 30 + 20 phrases, none twice', OLD30.length === 30 && NEW20.length === 20 && new Set(OLD30.concat(NEW20)).size === 50);

// ── (Α) the 30 of 31/10 ─────────────────────────────────────────────────────────────────────────────────────────────────────────
let a = 0;
for (const t of OLD30) { const x = alarm(t); if (x) a++; assert('(Α) no alarm: «' + t + '»', !x); }
assert('(Α) the 30 of 31/10: ' + a + '/30 alarms (469e194: 1 — the football phrase)', a === 0 && OLD30.length === 30);
assert('(Α) the phrase of 31/10 itself, by name: no alarm', OLD30.includes('Έχω μελανιές στα πόδια από τις κλωτσιές του μικρού στο ποδόσφαιρο.') &&
  !alarm('Έχω μελανιές στα πόδια από τις κλωτσιές του μικρού στο ποδόσφαιρο.'));

// ── (Β) the 20 new ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
// outside the narrow fix, kept exactly as 469e194 reads it: «μπάλα» is not one of the words John listed (ADR «2 Νοεμβρίου (δ)»)
const OUTSIDE = { 'Έχω μελανιές από τις κλωτσιές του μικρού μου όταν παίζουμε μπάλα στην αυλή.': '«μπάλα» is not in the list' };
let b = 0, bOut = 0;
for (const t of NEW20) {
  const x = alarm(t); if (x) b++; if (x && OUTSIDE[t]) bOut++;
  assert(OUTSIDE[t] ? '(Β) still an alarm, outside the narrow fix (' + OUTSIDE[t] + '): «' + t + '»' : '(Β) no alarm: «' + t + '»', OUTSIDE[t] ? x : !x);
}
assert('(Β) the 20 new: ' + b + '/20 alarms, the ' + bOut + ' outside the narrow fix (469e194: 3)', NEW20.length === 20 && b === 1 && bOut === 1);

// ── (Γ) the other side: still an alarm ──────────────────────────────────────────────────────────────────────────────────────────
const MUST = [
  // John's three
  'Έχω μελανιές από τις κλωτσιές του άντρα μου μετά το ποδόσφαιρο.', 'Έχω μελανιές από τις μπουνιές του.',
  'Έχω μελανιές από τις κλωτσιές του συντρόφου μου στο γήπεδο.',
  // an adult kicking, with each of the new words
  'Έχω μελανιές από τις κλωτσιές του πατέρα μου στο μπάσκετ.', 'Έχω μελανιές από τις κλωτσιές του αφεντικού μου μετά το βόλεϊ.',
  'Έχω μελανιές από τις κλωτσιές του πρώην μου στο τένις.', 'Έχω μελανιές από τις κλωτσιές του αδερφού μου στο χάντμπολ.',
  'Έχω μελανιές από τις κλωτσιές της γυναίκας μου μετά το πόλο.', 'Έχω μελανιές από τις κλωτσιές του θείου μου στο γυμναστήριο.',
  'Έχω μελανιές από τις κλωτσιές του φίλου μου στην παιδική χαρά.', 'Έχω μελανιές από τις κλωτσιές του άντρα μου στο ποδόσφαιρο.',
  // a child, but not kicks; a child word that is not the whole phrase; two blows in one sentence; a child's kicks with no sport word
  'Έχω μελανιές από τις μπουνιές του μικρού στο μπάσκετ.', 'Έχω μελανιές από τις κλωτσιές του μικρού μου αδερφού στο ποδόσφαιρο.',
  'Έχω μελανιές από τις κλωτσιές του μικρού στο ποδόσφαιρο και από τις μπουνιές του άντρα μου.', 'Έχω μελανιές από τις κλωτσιές του γιου μου.',
  // the same adult phrase without accents, in capitals, in greeklish
  'Εχω μελανιες απο τις κλωτσιες του αντρα μου στο γηπεδο.', 'ΕΧΩ ΜΕΛΑΝΙΕΣ ΑΠΟ ΤΙΣ ΚΛΩΤΣΙΕΣ ΤΟΥ ΣΥΝΤΡΟΦΟΥ ΜΟΥ ΣΤΟ ΓΗΠΕΔΟ.',
  'exw melanies apo tis klotsies tou antra mou sto gipedo',
];
let g = 0;
for (const t of MUST) { const d = call(danger, t); const x = !!d && d.self === true; if (x) g++; assert('(Γ) still danger to the person writing: «' + t + '»', x); }
assert('(Γ) the other side: ' + g + '/' + MUST.length + ' still alarm', g === MUST.length);

// ── (Δ) the 69 danger phrases, (Ε) the 65 everyday phrases of test_safety_detectors_3110.js ─────────────────────────────────────────
const SD = fs.readFileSync(path.join(__dirname, 'test_safety_detectors_3110.js'), 'utf8');
const list = name => { const s = SD.indexOf('const ' + name + ' = ['); if (s < 0) return []; const e = SD.indexOf('\n];', s);
  try { return new Function('return ' + SD.slice(SD.indexOf('[', s), e + 2))(); } catch (err) { return []; } };
const DANGER_SELF = list('DANGER_SELF'), DANGER_CHILD = list('DANGER_CHILD'), PASSIVE = list('PASSIVE'), NO_DANGER = list('NO_DANGER');
const KNOWN_ON_MAIN = (() => { const m = SD.match(/\nconst KNOWN_ON_MAIN = (\{[^\n]*\});/); try { return m ? new Function('return ' + m[1])() : {}; } catch (e) { return {}; } })();
const nSelf = DANGER_SELF.filter(t => { const d = call(danger, t); return !!d && d.self === true; }).length;
const nChild = DANGER_CHILD.filter(t => { const d = call(danger, t); return !!d && d.child === true; }).length;
const nPassive = PASSIVE.filter(t => call(crisis, t) === 'CRISIS').length;
assert('(Δ) the danger phrases: ' + (nSelf + nChild + nPassive) + '/69 caught (' + nSelf + '/40 to the person writing, ' + nChild + '/5 to a child, ' +
  nPassive + '/24 passive ideation)', DANGER_SELF.length === 40 && DANGER_CHILD.length === 5 && PASSIVE.length === 24 && nSelf === 40 && nChild === 5 && nPassive === 24);
const everyday = NO_DANGER.filter(alarm);
assert('(Ε) the everyday phrases: ' + everyday.length + '/' + NO_DANGER.length + ' alarm — only the ' + Object.keys(KNOWN_ON_MAIN).length + ' that main already flags',
  NO_DANGER.length === 65 && Object.keys(KNOWN_ON_MAIN).length === 2 && everyday.length === 2 && everyday.every(t => KNOWN_ON_MAIN[t]));

// ── (Ζ) nothing else moved ──────────────────────────────────────────────────────────────────────────────────────────────────────
assert('(Ζ) the old `sport` list is unchanged, word for word (469e194)',
  raw.includes('    sport: S(" (?:μποξ|πυγμαχια|πυγμαχιασ|καρατε|ταεκβοντο|προπονηση|προπονησησ|ρινγκ|αγωνα|αγωνασ|ματσ|παιχνιδι) "),\n'));
assert('(Ζ) detectSafetySignal is byte-identical to 469e194', h(extract('detectSafetySignal')) === '1f7c3cb8fe568f31');
const cut = (s, n) => { const a0 = s.indexOf('\nfunction ' + n + '('); return a0 < 0 ? s : s.slice(0, a0) + s.slice(s.indexOf('\n}', a0 + 1) + 2); };
// RE-BASED (John, 2/11/2026, branch candidate-tm): the same cut, the same fingerprint — the reference is now src/App.jsx of candidate-tm
// 9c800af (469e194 + the Thought Map, exactly as approved), no longer of 469e194
assert('(Ζ) src/App.jsx outside detectsDangerFromOther is byte-identical to candidate-tm 9c800af (469e194 + the Thought Map)', h(cut(raw, 'detectsDangerFromOther')) === '44d6405126f85b5e');
const coreS = raw.indexOf('`', raw.indexOf('const AURA_CORE_PERSONALITY')) + 1;
assert('(Ζ) the prompt is unchanged (b5f303cc9405aa21)', h(raw.slice(coreS, raw.indexOf('`;', coreS))) === 'b5f303cc9405aa21');
assert('(Ζ) no lookbehind in detectsDangerFromOther (old iPhones)', !/\(\?<[=!]/.test(extract('detectsDangerFromOther')));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
