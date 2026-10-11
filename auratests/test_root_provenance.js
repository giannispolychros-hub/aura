// AURA — P4, approved by John (11/10/2026; ADR «11 Οκτωβρίου (ζ)»): PASSIVE measurement of a «planted» root.
// The stress test with the real model found 2 of 45 confirmed roots that were mostly AURA's words first («Δεν είναι «δεν θέλω να
// φύγω». Είναι «δεν θέλω να χάσω ποιος είμαι».» → the user's root: «Ναι, ακριβώς αυτό. Δεν θέλω να χάσω ποιος είμαι.»). The
// automatic check «the root is the user's words» passes them — the user typed it. §3: «not an AURA summary the user said yes to».
//   For every CONFIRMED root («Ναι, αυτό είναι»), one event, numbers only: root_provenance { auraShare, door }
//   - auraShare 0–100: of the root's content words (the app's own rule: no accents, 4+ letters, minus the small function words —
//     the same as detectsUnverifiedFoundClaim), the share whose FIRST appearance in the conversation was in a reply of the MODEL.
//     The app's fixed texts (the first WHY question, the root flow's own questions) are not the model's words; the root's own
//     capture is not an earlier appearance.
//   - door: the door of the card that was confirmed, as root_card_shown logged it (1 button · 2 readiness · 3 spontaneous ·
//     4 first exit · 5 the model's closing summary).
// Nothing the user sees changes, nothing sent to the model changes: no text is stored, only the two numbers.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _s = raw.indexOf('`', _i) + 1;
const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function fullFnSrc(name) {
  const a = CODE.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = CODE.indexOf('(', a), depth = 0;
  for (; k < CODE.length; k++) { if (CODE[k] === '(') depth++; else if (CODE[k] === ')') { depth--; if (depth === 0) break; } }
  const b = CODE.indexOf('{', k); depth = 0;
  for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') depth++; else if (CODE[j] === '}') { depth--; if (depth === 0) return CODE.slice(a, j + 1); } }
  return null;
}
const NAMES = ['rootAuraShare', 'buildTesterExport'];
let F = {};
try { F = new Function(NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {' + NAMES.join(',') + '};')(); }
catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const blk = (start, len) => { const a = CODE.indexOf(start); return a >= 0 ? CODE.slice(a, a + (len || 1500)) : ''; };

const U = c => ({ role: 'user', content: c });
const A = c => ({ role: 'assistant', content: c });
const WHY = A('Γιατί έχει σημασία αυτό για σένα τώρα;');
const ASK = { role: 'assistant', content: 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;', msgMode: 'STAGE_A' };

// ── The number ──────────────────────────────────────────────────────────────
{
  // 8.3 of the hard round, shortened: «χάσω» and «ποιος» came first from AURA; «θέλω», «είμαι», «ακριβώς» from the user
  const ROOT = 'Ναι, ακριβώς αυτό. Δεν θέλω να χάσω ποιος είμαι.';
  const M = [U('Έχω μια προαγωγή σε άλλη πόλη.'), WHY, U('Ναι, ακριβώς αυτό. Δεν θέλω να είμαι αυτός που την αφήνει.'),
    A('Ποιος είναι αυτός που δεν θέλεις να φανείς ότι την αφήνει;'), U('Εγώ ο ίδιος.'),
    A('Δεν είναι «δεν θέλω να φύγω». Είναι «δεν θέλω να χάσω ποιος είμαι».'), ASK, U(ROOT)];
  assert('8.3: 2 of the root\'s 5 content words came first from AURA → 40', T('rootAuraShare', ROOT, M) === 40);
}
assert('ALL the root\'s content words came first from the user → 0',
  T('rootAuraShare', 'Φοβάμαι ότι θα απογοητεύσω τους γονείς μου.', [U('Οι γονείς μου πλήρωσαν πολλά.'), A('Τι φοβάσαι;'), U('Φοβάμαι ότι θα τους απογοητεύσω.')]) === 0);
assert('ALL came first from AURA → 100', T('rootAuraShare', 'Δεν θέλω να χάσω ποιος είμαι.', [U('Έχω μια προαγωγή.'), A('Μήπως δεν θέλεις να χάσεις ποιος είσαι; Δεν θέλω να χάσω ποιος είμαι.')]) === 100);
assert('words that appear for the FIRST time in the root itself are the user\'s → 0', T('rootAuraShare', 'Ντρέπομαι να ζητήσω βοήθεια.', [U('Θέλω δάνειο.'), A('Τι σε κρατάει;')]) === 0);
assert('the app\'s FIXED texts are not the model\'s words: the first WHY question, the root flow\'s questions (STAGE_A)',
  T('rootAuraShare', 'Έχει σημασία τώρα, πραγματικά με απασχολεί.', [U('Γεια.'), WHY, U('Δεν ξέρω.'), ASK]) === 0);
assert('the root\'s own capture (the same text, already in the history) is not an earlier appearance',
  T('rootAuraShare', 'Ντρέπομαι να ζητήσω βοήθεια.', [U('Θέλω δάνειο.'), A('Τι σε κρατάει;'), ASK, U('Ντρέπομαι να ζητήσω βοήθεια.')]) === 0);
assert('each content word counts ONCE, even if the root repeats it («φοβάμαι, φοβάμαι» + «αλλαγή» from AURA → 1 of 2 → 50)',
  T('rootAuraShare', 'Φοβάμαι, φοβάμαι την αλλαγή.', [A('Η αλλαγή σε τρομάζει;'), U('Ναι.')]) === 50);
assert('an earlier appearance is found without accents and in any case', T('rootAuraShare', 'ΦΟΒΑΜΑΙ ΤΗΝ ΑΛΛΑΓΗ', [A('Φοβάσαι την αλλαγή; Φοβάμαι.'), U('Ναι.')]) === 100);
assert('ROBUST: no content words, no root, no history, a bad argument → 0, never a crash',
  T('rootAuraShare', 'Ναι, αυτό.', [A('αυτό')]) === 0 && T('rootAuraShare', '', []) === 0 && T('rootAuraShare', null, null) === 0 &&
  T('rootAuraShare', 'Φοβάμαι την αλλαγή', [null, 5, { role: 'assistant' }]) === 0);
{
  const n = T('rootAuraShare', 'Φοβάμαι την αλλαγή και τη μοναξιά', [A('Φοβάσαι την αλλαγή;')]);
  assert('an integer from 0 to 100 (here 1 of 3 → 33), so the device log keeps it', Number.isInteger(n) && n === 33);
}
assert('THE SAME RULE for content words as the app\'s other provenance counter (detectsUnverifiedFoundClaim): 4+ letters, same stop list',
  (fullFnSrc('rootAuraShare') || '').includes("w.length >= 4 && !STOP.has(w)") &&
  ((fullFnSrc('rootAuraShare') || '').match(/new Set\(\[([^\]]*)\]\)/) || [])[1] === ((fullFnSrc('detectsUnverifiedFoundClaim') || '').match(/new Set\(\[([^\]]*)\]\)/) || [])[1]);

// ── Wiring ───────────────────────────────────────────────────────────────────
{
  const disp = blk('const stageADispatch = useCallback((ev) => {', 900);
  assert('DOOR: the door of the card shown is kept from the root_card_shown record itself (same value as the log)',
    /if \(_r\.event === "root_card_shown"\) lastCardDoor\.current = _r\.fields\.door;/.test(disp) && /const lastCardDoor = useRef\(0\);/.test(CODE));
  const yes = blk('const handleStageAYes = useCallback(() => {', 900);
  assert('ON «Ναι»: one root_provenance record — the share of THIS root against the conversation so far, and the door',
    /const _found = stageARef\.current\.found;/.test(yes) &&
    /if \(stageARef\.current\.stats\.rootConfirmed === 1\) recordTelemetry\("root_provenance", \{ auraShare: rootAuraShare\(_found, messages\), door: lastCardDoor\.current \}\);/.test(yes) &&
    yes.indexOf('recordTelemetry("root_provenance"') > yes.indexOf('stageADispatch({ type: "yes", riskKind: riskSignalKind.current });'));
  assert('… with the CURRENT conversation (messages in the callback\'s dependencies)', /\}, \[stageADispatch, messages\]\);/.test(yes));
  assert('NOTHING ELSE CHANGES on «Ναι»: the same end lines, the same step', /setMessages\(prev => \[\.\.\.prev, \{ id: nextMsgId\(\), role: "assistant", content: buildRootEndLines\(stageARef\.current\.found, _riskOffer\)\.join\("\\n"\), msgMode: "STAGE_A", stageAEnd: true \}\]\);/.test(yes));
  assert('NEW SESSION: the door is forgotten', /lastCardDoor\.current = 0;/.test(blk('const resetSession = () => {', 4000)));
  assert('NEVER SENT, NEVER SHOWN: the number is computed only for the log (not in generateResponse, callAura or the screen)',
    (CODE.match(/rootAuraShare\(/g) || []).length === 2 && !/rootAuraShare/.test(blk('async function callAura(', 4000)) &&
    !/rootAuraShare/.test(CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('))));
}
// ── What leaves the device ───────────────────────────────────────────────────
{
  const out = T('buildTesterExport', [{ ev: 'root_provenance', t: 1700000000000, auraShare: 40, door: 4 }], '2026-10-11') || {};
  assert('THE TESTER FILE keeps the two numbers (and nothing else is there to keep)',
    out.events && out.events[0] && out.events[0].ev === 'root_provenance' && out.events[0].auraShare === 40 && out.events[0].door === 4);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
