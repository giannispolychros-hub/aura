// AURA — INTERNAL LABELS NEVER REACH THE USER (ADR «8 Οκτωβρίου (β)», all users, switch open or closed).
// Real phone test 8/10, switch closed: the reply was «[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]\n\nΚαλή συνέχεια.» —
// the model echoed the header of one of our own per-turn contexts. The code now removes, before the screen and before the
// history, ONLY the known labels: the heads of our bracketed per-turn contexts and messages, and the hidden [[…]] tags.
// Any other text in brackets stays exactly as written. A passive counter (labelLeaks), numbers only. No prompt change.

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
function extractBlock(startToken, from) {
  const a = CODE.indexOf(startToken, from || 0);
  if (a < 0) return null;
  let depth = 0, started = false;
  for (let k = CODE.indexOf('{', a); k < CODE.length; k++) {
    if (CODE[k] === '{') { depth++; started = true; }
    else if (CODE[k] === '}') { depth--; if (started && depth === 0) return CODE.slice(a, k + 1); }
  }
  return null;
}
const headsSrc = (() => { const a = CODE.indexOf('const INTERNAL_LABEL_HEADS = '); return a < 0 ? 'const INTERNAL_LABEL_HEADS = [];' : CODE.slice(a, CODE.indexOf('];', a) + 2); })();
let F = {};
try { F = new Function(headsSrc + '\n' + (extractBlock('function stripInternalLabels(') || 'function stripInternalLabels(){return {text:"",count:-1}}') + '\nreturn { stripInternalLabels, INTERNAL_LABEL_HEADS };')(); }
catch (e) { console.log('LOAD ERROR — ' + e.message); }
const S = t => { try { return F.stripInternalLabels(t); } catch (e) { return { text: 'threw', count: -1 }; } };

// ── The phone test, exactly ──────────────────────────────────────────────────
{
  const r = S('[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]\n\nΚαλή συνέχεια.');
  assert('PHONE TEST: «[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]\\n\\nΚαλή συνέχεια.» → «Καλή συνέχεια.», counted once', r.text === 'Καλή συνέχεια.' && r.count === 1);
}
assert('ONLY A LABEL: nothing is left (the app then shows no empty bubble)', S('[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]').text === '' && S('  [FREE PART: ENDS AT ROOT]\n').text === '');
assert('A LABEL INSIDE THE TEXT: removed, the words around it kept, no double space left', S('Καταλαβαίνω. [STAGE: GRACEFUL EXIT] Τι σε κρατάει;').text === 'Καταλαβαίνω. Τι σε κρατάει;');
assert('AN UNCLOSED LABEL ON ITS OWN LINE: the line goes', S('[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT\nΚαλή συνέχεια.').text === 'Καλή συνέχεια.');
assert('HIDDEN TAGS anywhere in the text: [[EXIT:yes]], [[EXIT:no]], [[EARLY_WORD:yes]]',
  S('Τι κρατάς; [[EARLY_WORD:yes]] Και τι αφήνεις;').text.indexOf('[[') < 0 && S('Καλή συνέχεια. [[EXIT:yes]]').text === 'Καλή συνέχεια.' && S('[[EXIT:no]]\nΣυνέχισε.').text === 'Συνέχισε.');
assert('A LONG ECHO of a whole context block (several lines, one closing bracket) goes as one',
  S('[SESSION COVERAGE — COUNTED, NOT JUDGED, AND NOT AN INSTRUCTION. The numbers below.\n· Consecutive replies: 3.\n· Signal families: none.]\n\nΤι σε κρατάει;').text === 'Τι σε κρατάει;');

// ── Ordinary text in brackets stays exactly as written ───────────────────────
for (const t of ['Είπες [σε παρένθεση] «περισσότερα χρήματα».', '[1] Το πρώτο, [2] το δεύτερο.', '[ΣΗΜΕΙΩΣΗ: δική σου λέξη]', 'Ακούω [ό,τι είπες] — σου φαίνεται έτσι;',
  '[Ναι]', 'Το [STAGE] της ζωής σου', '[stage: κάτι]', 'Τι είναι [MASTER] για σένα;', 'Χωρίς αγκύλες καθόλου.', '']) {
  const r = S(t);
  assert(`UNTOUCHED: «${t || '(empty)'}» stays byte for byte, nothing counted`, r.text === t && r.count === 0);
}
assert('UNTOUCHED: non-strings never throw', S(null).text === '' && S(undefined).count === 0);

// ── Every label we send can be removed — found by scanning App.jsx, so a new one cannot slip through ─
{
  // (a) the bracketed per-turn contexts, from the e2e harness's own catalogue of App.jsx (the same source the real-model
  //     test uses to name what a request carried)
  let catalog = {};
  try { catalog = require(path.join(__dirname, '..', 'scripts', 'e2e_stage_a_lib.cjs')).loadApp(raw).catalog; } catch (e) { catalog = {}; }
  const sigs = [];
  for (const [name, v] of Object.entries(catalog)) for (const sig of (Array.isArray(v) ? v : [v])) if (typeof sig === 'string' && sig.startsWith('[')) sigs.push([name, sig]);
  assert('SCAN: the catalogue was read (at least 20 bracketed context signatures)', sigs.length >= 20);
  const missed = sigs.filter(([, sig]) => S(sig.includes(']') ? sig : sig + ' …]').text !== '');
  assert('SCAN: every bracketed context in App.jsx is removed when echoed whole' + (missed.length ? ' — missed: ' + missed.map(x => x[0]).join(', ') : ''), missed.length === 0);
  // the short echo form the phone test showed: just the head, closed at once
  const shortMissed = sigs.map(([n, sig]) => [n, '[' + sig.slice(1).split(/\s\(|[.(:]\s|\]/)[0].trim() + ']']).filter(([, s]) => S(s).text !== '');
  assert('SCAN: every context head is removed in its short form too («[HEAD]»)' + (shortMissed.length ? ' — missed: ' + shortMissed.map(x => x[1]).join(', ') : ''), shortMissed.length === 0);
  // (b) bracketed messages the app itself sends to the model in the user's place
  const userHeads = [...CODE.matchAll(/content: [`'"]\[([^\]`'"$]{3,40})/g)].map(m => m[1]);
  assert('SCAN: the app\'s own bracketed messages to the model were found (refresh, Part 1/2, compression…)', userHeads.length >= 5);
  const uMissed = userHeads.filter(h => S('[' + h + ' …]').text !== '');
  assert('SCAN: every one of them is removed when echoed' + (uMissed.length ? ' — missed: ' + uMissed.join(' | ') : ''), uMissed.length === 0);
  // (c) the Stage A marker, taken from the function that builds it
  assert('SCAN: the Stage A marker «[FREE PART: ENDS AT ROOT]» is removed', S('[FREE PART: ENDS AT ROOT]\nΤι σε απασχολεί;').text === 'Τι σε απασχολεί;');
}

// ── Wiring: before the screen, before the history, at every place a model reply is shown ─
const GEN = CODE.slice(CODE.indexOf('const generateResponse = useCallback('), CODE.indexOf('const handleSubmit = useCallback('));
assert('WIRING: one helper counts and cleans (labelLeaks ref)', /const labelLeaks\s*= useRef\(0\);/.test(CODE) &&
  /const cleanLabels = useCallback\(\(t\) => \{ const r = stripInternalLabels\(t\); if \(r\.count\) labelLeaks\.current \+= r\.count; return r\.text; \}, \[\]\);/.test(CODE));
assert('WIRING: main reply — cleaned right after the hidden tags are read, before every check, the screen and the history',
  /const text = stripAraDeclarative\(cleanLabels\(rawText\.replace\(\/\\s\*\\\[\\\[EXIT:\(yes\|no\)\\\]\\\]\\s\*\$\/i, ""\)\)\);/.test(GEN) &&
  GEN.indexOf('const exitTagMatch = rawTextWithTags.match(') < GEN.indexOf('const text = stripAraDeclarative(cleanLabels('));
assert('WIRING: main reply — no empty bubble', /if \(displayText\.trim\(\)\) setMessages\(prev => \[\.\.\.prev, \{ id: nextMsgId\(\), role: "assistant", content: displayText, msgMode: currentMode \}\]\);/.test(GEN));
assert('WIRING: every other model reply is cleaned too (closing Part 1, Part 2, early word, misfire, compression, First-WHY)',
  (CODE.match(/stripAraDeclarative\(cleanLabels\(/g) || []).length === 7 && !/stripAraDeclarative\((?!cleanLabels\()(?:await callAura|rawText\.replace)/.test(CODE));
assert('WIRING: a closing message left empty is not shown', /const appendClosingMessage = useCallback\(\(content\) => \{\s*if \(!String\(content \|\| ""\)\.trim\(\)\) return;/.test(CODE));
assert('WIRING: misfire / compression / First-WHY replies left empty are not shown', (CODE.match(/if \(text\.trim\(\)\) setMessages\(prev => \[\.\.\.prev, \{ id: nextMsgId\(\), role: "assistant", content: text,/g) || []).length >= 2);
assert('MEASURE: session_completed carries labelLeaks (a number, capped)', /labelLeaks: Math\.min\(9999, labelLeaks\.current\),/.test(CODE));
assert('MEASURE: reset with a new session', /labelLeaks\.current = 0;/.test(extractBlock('const resetSession = () =>') || ''));
// ── The hidden tags are READ before the cleaning removes them (founder's check, 8/10/2026, ADR «8 Οκτωβρίου (γ)») ─
// stripInternalLabels removes [[EXIT:…]] and [[EARLY_WORD:yes]] too, so the order is the whole contract: the T5 closing
// (modelJudgesEnd) and the early word (awaitingEarlyWord) must read the model's RAW reply, and only then is it cleaned.
{
  const at = GEN.indexOf('const exitTagMatch = rawTextWithTags.match(');
  const end = GEN.indexOf('\n', GEN.indexOf('const text = stripAraDeclarative(cleanLabels(rawText.replace('));
  const seg = at >= 0 && end > at ? GEN.slice(at, end) : '';
  assert('TAGS BEFORE CLEANING: the raw reply comes straight from callAura — nothing cleans it on the way in',
    /const rawTextWithTags = await callAura\(\[\.\.\.contextRefresh, \.\.\.msgs\], system\);/.test(GEN) &&
    !/cleanLabels|stripInternalLabels/.test(extractBlock('async function callAura(') || 'cleanLabels'));
  assert('TAGS BEFORE CLEANING: both tags are matched on rawTextWithTags, BEFORE the one line that cleans',
    seg.length > 0 && /const exitTagMatch = rawTextWithTags\.match\(/.test(seg) && /const earlyWordTagMatch = rawTextWithTags\.match\(/.test(seg) &&
    seg.indexOf('const earlyWordTagMatch') < seg.indexOf('cleanLabels(') && (seg.match(/cleanLabels\(/g) || []).length === 1 &&
    GEN.slice(GEN.indexOf('const rawTextWithTags = await callAura('), at).indexOf('cleanLabels') < 0);
  // The same lines, run: a fake raw reply in, what the app would read and show out.
  const run = rawReply => { try {
    return new Function('rawTextWithTags', 'cleanLabels', 'stripAraDeclarative', 'awaitingEarlyWord', 'declarationLedger', 'issueDeclaration', 'turnCount',
      seg + '\nreturn { modelJudgesEnd, awaiting: awaitingEarlyWord.current, text };')(rawReply, t => S(t).text, t => t, { current: false }, { current: [] }, () => [], { current: 0 });
  } catch (e) { return { error: e.message }; } };
  const r1 = run('Αυτό που περιέγραψες έχει πια όνομα. [[EXIT:yes]]');
  assert('TAGS BEFORE CLEANING (run): «… [[EXIT:yes]]» → the T5 signal is read, the text shown has no tag',
    r1.modelJudgesEnd === true && r1.awaiting === false && r1.text === 'Αυτό που περιέγραψες έχει πια όνομα.');
  const r2 = run('Αυτό που περιέγραψες έχει πια όνομα. [[EXIT:no]]');
  assert('TAGS BEFORE CLEANING (run): «… [[EXIT:no]]» → no T5, no tag shown', r2.modelJudgesEnd === false && r2.text === 'Αυτό που περιέγραψες έχει πια όνομα.');
  const r3 = run('Αν κρατούσες μία λέξη από όλο αυτό, ποια θα ήταν; [[EARLY_WORD:yes]]');
  assert('TAGS BEFORE CLEANING (run): «… [[EARLY_WORD:yes]]» → the next answer will be kept as the word, no tag shown',
    r3.awaiting === true && r3.modelJudgesEnd === false && r3.text === 'Αν κρατούσες μία λέξη από όλο αυτό, ποια θα ήταν;');
  const r4 = run('[MASTER PRIORITY RULE — STAGE: GRACEFUL EXIT]\n\nΚαλή συνέχεια. [[EXIT:yes]]');
  assert('TAGS BEFORE CLEANING (run): a label AND a tag in one reply → the tag still read, the label still removed',
    r4.modelJudgesEnd === true && r4.text === 'Καλή συνέχεια.');
}
assert('NO PROMPT CHANGE: the prompt does not mention the cleaning', !raw.slice(_s, _e).includes('stripInternalLabels') && !raw.slice(_s, _e).includes('labelLeaks'));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
