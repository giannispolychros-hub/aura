// AURA — John, 22/11/2026 (order of the real session, item Δ / ⚑4): the app's fixed text after «Ναι, αυτό είναι» — the two sentences
// «Το πρώτο βήμα είναι το πιο δύσκολο. Γι' αυτό δεν θέλω το τέλειο ούτε το πιο γενναίο. Θέλω το πιο εύκολό σου.» are replaced by
// «Δεν θα σου πω τι να κάνεις· θα σε ρωτήσω, ώστε να το βρεις εσύ. Δεν θέλω το τέλειο ούτε το πιο γενναίο — το πιο εύκολό σου.»
// The question below stays as it was. WITHOUT «μαζί» (John's word: the app does not say it asks «together» — it asks).
// WRITTEN FIRST — it must FAIL on the code of root-list 6494129 (the old two sentences), and pass after the change.
// CODE ONLY: the core prompt and api/aura.js are not touched by this item — that is checked here too, so nobody can "fix" it there.
// Scope: STAGE_A_TEXTS.stepWhy and the message built by buildRootStepLines. Nothing else of the step flow is read or changed here.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const APP = [path.join(ROOT, 'src', 'App.jsx'), path.join(__dirname, 'App.jsx')].find(p => fs.existsSync(p));
const raw = fs.readFileSync(APP, 'utf8');
const _i = raw.indexOf('const AURA_CORE_PERSONALITY'); const _s = raw.indexOf('`', _i) + 1; const _e = raw.indexOf('`;', _s);
const CODE = raw.slice(0, _i) + raw.slice(_e); // the app without the core prompt (the prompt is checked on its own, below)
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
function fullFnSrc(name) {
  const C = CODE; const a = C.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = C.indexOf('(', a), depth = 0;
  for (; k < C.length; k++) { if (C[k] === '(') depth++; else if (C[k] === ')') { depth--; if (depth === 0) break; } }
  const b = C.indexOf('{', k); depth = 0;
  for (let j = b; j < C.length; j++) { if (C[j] === '{') depth++; else if (C[j] === '}') { depth--; if (depth === 0) return C.slice(a, j + 1); } }
  return null;
}
const textsSrc = (() => { const a = CODE.indexOf('const STAGE_A_TEXTS = {'); return a >= 0 ? CODE.slice(a, CODE.indexOf('\n};', a) + 3) : ''; })();
let F = {};
try { F = new Function(textsSrc + '\n' + fullFnSrc('buildRootStepLines') + '\nreturn {STAGE_A_TEXTS, buildRootStepLines};')(); } catch (e) { console.log('LOAD ERROR — ' + e.message); }
const TX = F.STAGE_A_TEXTS || {};

// John's text, character for character: the middle dot is U+00B7 («·», as in the app's other texts), the dash is U+2014 («—»).
const NEW_WHY = 'Δεν θα σου πω τι να κάνεις· θα σε ρωτήσω, ώστε να το βρεις εσύ. Δεν θέλω το τέλειο ούτε το πιο γενναίο — το πιο εύκολό σου.';
const FOUND = 'Αυτό το βρήκες εσύ — χωρίς καμία συμβουλή. Τώρα ξέρεις τι γίνεται.';
const QUESTION = 'Ποιο είναι το πιο μικρό πράγμα που μπορείς να κάνεις γι\' αυτό;';
const ROOTS = 'Ότι φοβάμαι να απογοητεύσω τον πατέρα μου, όχι τη δουλειά.';

// ── 1. the text itself ────────────────────────────────────────────────────────────────────────────────
assert('(1) the text: John\'s two sentences, word for word (the dot «·» U+00B7 and the dash «—» U+2014 as he wrote them)', TX.stepWhy === NEW_WHY);
assert('(2) WITHOUT «μαζί» — in none of the three texts of the message (the root line aside)', ![TX.stepFound, TX.stepWhy, TX.stepQ].some(t => /μαζί/i.test(String(t))));
assert('(3) the old sentences are gone from the app — «Το πρώτο βήμα είναι το πιο δύσκολο», «Γι\' αυτό δεν θέλω», «Θέλω το πιο εύκολό σου»',
  !raw.includes('Το πρώτο βήμα είναι το πιο δύσκολο') && !raw.includes('Γι\' αυτό δεν θέλω') && !raw.includes('Θέλω το πιο εύκολό σου'));
assert('(4) the new first sentence is written once in the whole file (one source, no copy beside it)', raw.split('Δεν θα σου πω τι να κάνεις').length - 1 === 1);
assert('(5) the shape: two sentences, the app promises no advice and asks — a statement, no question mark, no exclamation, no praise',
  typeof TX.stepWhy === 'string' && (TX.stepWhy.match(/\./g) || []).length === 2 && !/[;!?;]/.test(TX.stepWhy) && !/μπράβο|συγχαρητήρια|τέλεια!|εξαιρετικ/i.test(TX.stepWhy));

// ── 2. the message after «Ναι, αυτό είναι» ────────────────────────────────────────────────────────────────
// (α) John's message of 17/10 with only the middle part replaced: the root whole in «», the line «Αυτό το βρήκες εσύ…», a blank line, the new
// text, then the question — as before.
const ALPHA = '«' + ROOTS + '»\n' + FOUND + '\n\n' + NEW_WHY + '\n' + QUESTION;
{
  const lines = F.buildRootStepLines ? F.buildRootStepLines('  ' + ROOTS + ' ') : null;
  assert('(6) the message after «Ναι»: the root whole in «», John\'s line, a blank line, the NEW text, then the question — five lines in this order', Array.isArray(lines) && lines.length === 5 && lines.join('\n') === ALPHA);
  assert('(7) the question below stays word for word and is still the last line', Array.isArray(lines) && lines[4] === QUESTION && TX.stepQ === QUESTION);
  assert('(8) «Αυτό το βρήκες εσύ — χωρίς καμία συμβουλή. Τώρα ξέρεις τι γίνεται.» stays as it was, the blank line stays', Array.isArray(lines) && lines[1] === FOUND && TX.stepFound === FOUND && lines[2] === '');
}

// ── 3. nothing else moved ────────────────────────────────────────────────────────────────────────────────
assert('(9) the other texts of the step are as they were — «Δεν ξέρω ακόμα», the size question and its buttons, the smaller piece, «Πότε;»',
  TX.stepUnknown === 'Δεν ξέρω ακόμα' && TX.fitsQ === 'Είναι τόσο μικρό που χωράει σε μία μέρα;' && TX.fitsYes === 'Ναι' && TX.fitsNo === 'Όχι, είναι μεγάλο' &&
  TX.smallerQ === 'Τότε ποιο είναι το πρώτο μικρό κομμάτι του;' && TX.whenQ === 'Πότε;');
assert('(10) the step message is still built in ONE place (buildRootStepLines) and shown by the app itself, no model call: the UI bubble and the final-check allowance (fkPassApp) both take it from there',
  (CODE.match(/function buildRootStepLines\(/g) || []).length === 1 && /addUiBubble\(buildRootStepLines\(_found\)\.join\("\\n"\)/.test(CODE) && /fkPassApp\(buildRootStepLines\(_found\)\.join\("\\n"\)\)/.test(CODE));
{
  // the core prompt and api/aura.js — this item is code only
  const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'));
  const apiSha = crypto.createHash('sha256').update(api).digest('hex');
  const fp = api.toString('utf8').match(/core: \{ length: \d+, sha256: "([0-9a-f]{16})/);
  assert('(11) the core prompt fingerprint is still 7e52268becda7360 and api/aura.js is byte for byte the same (sha256 675564a7985438c8…)', !!fp && fp[1] === '7e52268becda7360' && apiSha.startsWith('675564a7985438c8'));
  let guard = false;
  try { execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'gen_prompt_fingerprints.cjs'), '--check'], { cwd: ROOT, stdio: 'pipe' }); guard = true; } catch (e) { guard = false; }
  assert('(12) the prompt guard of api/aura.js still accepts the prompt of the app (gen_prompt_fingerprints --check, no change to the prompt)', guard);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
