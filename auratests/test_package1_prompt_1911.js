// AURA — PACKAGE 1, the prompt (John, 19/11/2026; an exception to the freeze for THIS package only; branch conversation-v1). Three lines of AURA_CORE_PERSONALITY and nothing else:
//   912 (3): the honest sentence without a promise of «later» (Δ-1);  918: one sentence — AURA never ranks, the ranking is the user's;  927 (7): the misunderstanding protocol, John's correction included.
// Test-first (John): every assertion labelled NEW fails on the code before this commit (the prompt of 4ec72b0, sha256 b5f303cc…, 311822 characters) and passes after; the GUARD one is green before and after.
// The code of the package is proved in auratests/test_package1_1911.js. All text here is synthetic: no word of any real session.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
const fnSrc = n => { const a = raw.indexOf('\nfunction ' + n + '('); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n}', a + 1) + 2); };
const constSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = '); if (a < 0) return ''; const eol = raw.indexOf('\n', a + 1);
  const line = raw.slice(a + 1, eol); if (/;\s*(?:\/\/.*)?$/.test(line)) return line; return raw.slice(a + 1, raw.indexOf('\n];', a) + 3); };
const objSrc = n => { const a = raw.indexOf('\nconst ' + n + ' = {'); return a < 0 ? '' : raw.slice(a + 1, raw.indexOf('\n};', a) + 3); };


// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 7. the prompt — AURA_CORE_PERSONALITY, three lines, nothing else
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const h = 'const AURA_CORE_PERSONALITY = `';
  const cs = raw.indexOf(h) + h.length, ce = raw.indexOf('`;', cs);
  const lit = x => Function('return `' + x + '`;')();
  const CORE = lit(raw.slice(cs, ce));
  let PAIRS = [];
  try { PAIRS = JSON.parse(fs.readFileSync(path.join(__dirname, 'package1_undo.json'), 'utf8')); } catch (e) { PAIRS = []; }
  let back = raw; for (const [nw, old] of PAIRS) back = back.split(nw).join(old);
  const hb = back.indexOf(h) + h.length, BCORE = lit(back.slice(hb, back.indexOf('`;', hb)));
  // The three changes are IN the file (each new text exactly once). Every assertion below that compares "with the three taken out" to the old prompt
  // needs this first: on 4ec72b0 nothing is taken out, so the comparison would hold by itself and prove nothing (it failed to fail — fixed 19/11).
  const APPLIED = PAIRS.length === 3 && PAIRS.every(([nw]) => raw.split(nw).length === 2);
  assert('NEW — (7.1) the list of the prompt\'s three changes exists (auratests/package1_undo.json, new → old) and each one is in the file exactly once', APPLIED);
  assert('NEW — (7.2) with the three taken out the prompt is the one of 4ec72b0 (311822 characters, sha256 b5f303cc…) — no other character of the prompt moved',
    APPLIED && BCORE.length === 311822 && sha(BCORE).startsWith('b5f303cc9405aa21'));
  const coreLines = CORE.split('\n'), backLines = BCORE.split('\n');
  const startLine = raw.slice(0, cs).split('\n').length; // the file line where the prompt starts
  const diff = []; for (let i = 0; i < Math.max(coreLines.length, backLines.length); i++) if (coreLines[i] !== backLines[i]) diff.push(startLine + i);
  assert('NEW — (7.3) the prompt changed ONLY in lines 912, 918 and 927 of src/App.jsx, and has the same number of lines (' + coreLines.length + ')',
    APPLIED && coreLines.length === backLines.length && JSON.stringify(diff) === JSON.stringify([912, 918, 927]));
  const L912 = coreLines[912 - startLine], L918 = coreLines[918 - startLine], L927 = coreLines[927 - startLine];
  // 912 (3) — Δ-1
  const p3 = (L912 || '').slice((L912 || '').indexOf('(3) '), (L912 || '').indexOf(' (4) '));
  assert('NEW — (7.4) 912 (3): asked for a way, a tactic, advice, what to say — one honest sentence, once per request, no apology; say what you do instead; the example is the Δ-1 sentence',
    /^\(3\) If the user asks what to do, or asks for a way, a tactic, a method, advice, or what to say or how to handle something/.test(p3) && p3.includes('do not ignore the request and do not answer it')
    && p3.includes('acknowledge it with ONE honest sentence, once per request and without apology') && p3.includes('"Συμβουλές ή τρόπους δεν δίνω· αυτό που κάνω είναι να βοηθάω να φανεί τι πραγματικά σε απασχολεί."')
    && p3.includes('(vary the wording, never the meaning)') && p3.endsWith('Then ask ONE question toward the root (ONE REPLY, NOT A PROCEDURE).'));
  assert('NEW — (7.5) 912 (3): no promise of «later», no tactic of its own — and the old promise is gone',
    p3.includes('Never promise or hint at a later part, a later step or a later answer («μετά», «αργότερα», «πρώτα», «θα σου πω»)') && p3.includes('add no way, tactic, wording or step of your own, not even as a hint or an example')
    && !/comes after the root/.test(L912 || '') && !/έρχεται μετά τη ρίζα/.test(L912 || ''));
  const ex3 = 'Συμβουλές ή τρόπους δεν δίνω· αυτό που κάνω είναι να βοηθάω να φανεί τι πραγματικά σε απασχολεί.';
  assert('NEW — (7.6) the example sentence — which is in the prompt — carries no promise («μετά», «αργότερα», «πρώτα», «θα σου πω», «έρχεται») and is one sentence',
    (L912 || '').includes(ex3) && !/μετά|αργότερα|πρώτα|θα σου πω|έρχεται/i.test(ex3) && (ex3.match(/[.;!?]/g) || []).length === 1);
  const line912Rest = (L912 || '').replace(p3, '');
  const old912Rest = (BCORE.split('\n')[912 - startLine] || '').replace(/\(3\) If the user asks what to do, say honestly[\s\S]*?\(ONE REPLY, NOT A PROCEDURE\)\./, '');
  assert('NEW — (7.7) the rest of paragraph 912 — the marker condition and parts (1), (2), (4), (5), (6), (7) — is untouched, character for character',
    APPLIED && line912Rest === old912Rest && line912Rest.includes('[FREE PART: ENDS AT ROOT]') && line912Rest.includes('(1) SUSPENDED:') && line912Rest.includes('(7) Μην λες ποτέ ποια είναι η ρίζα'));
  // 918 — one sentence
  const added918 = (L918 || '').replace(/^[\s\S]*?\(forbidden: «μήπως είναι φόβος αποτυχίας;»\)\. /, '').replace(/ There is no fixed number of exchanges[\s\S]*$/, '');
  assert('NEW — (7.8) 918: ONE added sentence — AURA never ranks, orders or compares the options itself; the question only asks the user what weighs more on them; the ranking is theirs',
    added918 === 'You never rank, order or compare the options yourself: the question only asks the user what weighs more on them, and the ranking is theirs.' && (added918.match(/\./g) || []).length === 1);
  assert('GUARD — (7.9) 918: the choice question itself — its tone example, its limits, «ή κάτι άλλο;», the closing sentence — is as it was',
    (L918 || '').startsWith('CHOICE QUESTION: when the user circles') && (L918 || '').includes('The tone: «Από όσα είπες, τι βαραίνει πιο πολύ: τα δύο χρόνια χωρίς μισθό, το ωράριο με τα παιδιά, ή κάτι άλλο;».')
    && (L918 || '').includes('Never an option with new content or a psychological interpretation') && (L918 || '').endsWith('There is no fixed number of exchanges to the root: as fast as honesty allows, and no faster.'));
  // 927 (7) — the misunderstanding protocol, John's correction included
  const i6 = (L927 || '').indexOf('(6) Μιλάς πάντα στον ενικό'), i7 = (L927 || '').indexOf('(7) Misunderstanding:'), iS = (L927 || '').indexOf('In Stage A the app itself writes one fixed line');
  const p7 = i7 >= 0 ? (L927 || '').slice(i7, iS) : '';
  assert('NEW — (7.10) 927 (7) sits right after (6) and before «In Stage A the app itself writes one fixed line…»', i6 > 0 && i7 > i6 && iS > i7 && (L927 || '').slice(i6, i7).endsWith('"Πέστε"). '));
  assert('NEW — (7.11) 927 (7): when the user says they did not understand — never the same words again; plainer, shorter words, straight to the plainer version; no apology, no explanation, no remark about the user',
    p7.includes('«δεν κατάλαβα», «τι εννοείς;», «δεν κατάλαβα την ερώτηση» or the like') && p7.includes('never repeat it in the same words') && p7.includes('in plainer, shorter words, going straight to the plainer version')
    && p7.includes('no apology, no explanation of why it was unclear, no remark about the user'));
  assert('NEW — (7.12) 927 (7): John\'s correction — an example only from words the user wrote, never an example of its own; if none of their words fits, simplify WITHOUT an example',
    p7.includes('it comes only from words the user has already written, quoted in «»; never an example of your own') && p7.includes('if none of their words fits as an example, simplify without an example'));
  assert('NEW — (7.13) 927 (7): John\'s correction — the question is dropped ONLY if they say again that they did not understand; then the approach changes (their own words, the last thing or another thing they said) — and no word of theirs missing is NOT a reason to drop it',
    p7.includes('Only if they say again that they do not understand, drop that question for good and change the approach') && p7.includes('reflect, in their own words, the last thing they said, or ask about another thing they said')
    && !/no word of theirs can carry an example/.test(p7) && !/or no word of theirs/.test(p7));
  assert('NEW — (7.14) 927 (7): not on the safety path and not for a risk check; the one case where new wording for the same question is right, so STRATEGY BY STATE stays for a user who is circling',
    p7.includes('Not on the safety path and not for a risk check: their own rules decide') && p7.includes('the one case where new wording for the same question is right') && p7.includes('STRATEGY BY STATE stays as it is for a user who is circling'));
  assert('NEW — (7.15) 927: the safety preamble, rules (1)–(6) and the rest of the line are as they were; (Β) «at most one question» and (Γ) a length limit were NOT added',
    APPLIED && (L927 || '').replace(p7, '') === (BCORE.split('\n')[927 - startLine] || '') && (L927 || '').startsWith('ΦΩΝΗ ΤΗΣ AURA — AURA\'S VOICE') && (L927 || '').includes('safety always wins')
    && (L927 || '').includes('(1) Short: 1–3 lines; no lists, no bullet points, no emoji, no exclamation marks. (2) One question.') && !/at most one question|at most 1 question|no more than one question/i.test(CORE.split('\n').slice(910 - startLine, 930 - startLine).join('\n')));
  // the filters the model's text goes through leave the Δ-1 sentence alone
  const chain = ['stripRootDeclaration', 'stripPressurePhrases', 'lookBehind', 'dropModelSentences'].every(n => fnSrc(n)) && ['ROOT_DECLARATION', 'PRESSURE_SENTENCE', 'PRESSURE_OPENER'].every(n => constSrc(n));
  let kept = null;
  if (chain) { try { const G = new Function([...['ROOT_DECLARATION', 'PRESSURE_SENTENCE', 'PRESSURE_OPENER'].map(constSrc), ...['lookBehind', 'dropModelSentences', 'stripRootDeclaration', 'stripPressurePhrases'].map(fnSrc)].join('\n') + '\nreturn { stripRootDeclaration, stripPressurePhrases };')();
    kept = G.stripPressurePhrases(G.stripRootDeclaration(ex3)); } catch (e) { kept = 'threw: ' + e.message; } }
  assert('NEW — (7.16) the Δ-1 sentence — the one that is IN the prompt — passes the screen filters (stripRootDeclaration, stripPressurePhrases) unchanged', (L912 || '').includes(ex3) && kept === ex3);
}


console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
