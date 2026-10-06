// AURA — TWO TRUTHFUL ANSWERS: «are you human?» and «do you remember?» (real test on a phone, 2026-10-06)
//
// B1. «Είσαι άνθρωπος;» was answered «Όχι. Είμαι AURA — εργαλείο σκέψης.» — no lie, but not the words the
//     EU AI Act (Art. 50) and the founder require: «τεχνητή νοημοσύνη». Nothing in the prompt covered
//     the question at all; the model fell back on IDENTITY («A clarity tool») and the IDENTITY DRIFT
//     example («Η AURA είναι εργαλείο σκέψης»). Two layers now:
//       - prompt: an AI IDENTITY QUESTION line beside PRIVACY QUESTION / MEMORY QUESTION, and the IDENTITY
//         DRIFT example names AI too;
//       - code: buildAiIdentityLine — if the person asks and the reply does not contain «τεχνητή
//         νοημοσύνη», the app appends one fixed sentence. Same principle as buildCrisisLine: a requirement
//         the model can miss is guaranteed by code.
// B2. «Δεν κρατώ ό,τι λες λέξη προς λέξη μεταξύ συνεδριών» — the MEMORY QUESTION line told the model to
//     say exactly that, «with memory on or off». False with memory on: createAnchor stores four verbatim
//     fields (text, before, peak, shift) for the Archive, and buildMemoryContext sends an open decision
//     verbatim (sanitised) to the model. The model cannot see the memory switch; it only sees a
//     [MEMORY CONTEXT] block when memory is on AND something is stored. So the line now gives a
//     conditional answer that is true either way, and the «memory is on» answer only when the block is present.

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
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}
function extractFn(name) {
  const start = CODE.indexOf('function ' + name + '(');
  if (start < 0) return null;
  let depth = 0, i = CODE.indexOf('{', start);
  for (; i < CODE.length; i++) {
    if (CODE[i] === '{') depth++;
    else if (CODE[i] === '}') { depth--; if (depth === 0) break; }
  }
  return CODE.slice(start, i + 1);
}
const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// ── B1 / prompt ──────────────────────────────────────────────────────────────
const AI_ANSWER = 'Όχι, δεν είμαι άνθρωπος. Είμαι τεχνητή νοημοσύνη — η AURA.';
const AIQ = (PROMPT.match(/AI IDENTITY QUESTION[^\n]*/) || [''])[0];
assert('PROMPT: an AI IDENTITY QUESTION line exists', AIQ.length > 100);
assert('PROMPT: it gives the exact Greek answer with «τεχνητή νοημοσύνη»', AIQ.includes(AI_ANSWER));
assert('PROMPT: it forbids claiming or implying being human', /Never claim or imply being human/.test(AIQ));
assert('PROMPT: it forbids answering only «εργαλείο σκέψης»', /never answer only with «εργαλείο σκέψης»|never answer only with "εργαλείο σκέψης"/.test(AIQ));
assert('PROMPT: it sits in the same family, right after MEMORY QUESTION',
  PROMPT.indexOf('MEMORY QUESTION') >= 0 && PROMPT.indexOf('AI IDENTITY QUESTION') > PROMPT.indexOf('MEMORY QUESTION') &&
  PROMPT.indexOf('AI IDENTITY QUESTION') < PROMPT.indexOf('OPTIONAL RESEARCH OFFER'));
const DRIFT = (PROMPT.match(/IDENTITY DRIFT \(3rd instance\):[^\n]*/) || [''])[0];
assert('PROMPT: the IDENTITY DRIFT example names AI too', /τεχνητή νοημοσύνη/.test(DRIFT));
assert('PROMPT: the IDENTITY DRIFT example still holds the role', /Ο ρόλος δεν αλλάζει/.test(DRIFT));

// ── B1 / code: detector + backstop ───────────────────────────────────────────
const detSrc = extractFn('detectsAiIdentityQuestion');
const lineSrc = extractFn('buildAiIdentityLine');
assert('CODE: detectsAiIdentityQuestion exists', !!detSrc);
assert('CODE: buildAiIdentityLine exists', !!lineSrc);
let detect = () => false, buildLine = () => '';
try {
  eval(detSrc + '\n' + lineSrc + '\ndetect = detectsAiIdentityQuestion; buildLine = buildAiIdentityLine;');
} catch (err) { assert('CODE: the two functions evaluate (' + err.message + ')', false); }

const ASKS = [
  'Είσαι άνθρωπος;',
  'είσαι ανθρωπος;',
  'ΕΙΣΑΙ ΑΝΘΡΩΠΟΣ;',
  'Άνθρωπος είσαι;',
  'Είσαι αληθινός άνθρωπος ή πρόγραμμα;',
  'Είσαι AI;',
  'είσαι ρομπότ;',
  'Είσαι bot;',
  'Είσαι τεχνητή νοημοσύνη;',
  'Μιλάω με άνθρωπο;',
  'Μιλάω με μηχανή ή με άνθρωπο;',
  'Υπάρχει κάποιος άνθρωπος πίσω από αυτό;',
  'Ποιος μου απαντάει;',
  'Are you human?',
  'are you a bot?',
  'Ωραία ερώτηση. Είσαι άνθρωπος;',
  'Δεν είσαι άνθρωπος να με καταλάβεις.',
];
const NOT_ASKS = [
  'Ο σύντροφός μου δεν είναι άνθρωπος της δουλειάς.',
  'Είσαι καλός άνθρωπος, το ξέρω.',
  'Δεν μιλάω με άνθρωπο εδώ και μέρες.',
  'Μιλάω με τον άνθρωπό μου γι\' αυτό.',
  'Θέλω να φύγω από τη δουλειά μου.',
  'Είσαι σαν μηχανή που δεν σταματά, μου είπε.',
  'Ποιος μου απαντάει στα email στη δουλειά, δεν ξέρω.',
  'Η AI στη δουλειά μου με αγχώνει.',
  'Είσαι αιώνια αισιόδοξη, μου λέει η αδερφή μου.',
  'Ποιος μου απαντάει στα email;',
  '',
];
ASKS.forEach(t => assert(`DETECT: «${t}» is a question about whether AURA is human/AI`, detect(t) === true));
NOT_ASKS.forEach(t => assert(`DETECT: «${t}» is NOT`, detect(t) === false));
assert('DETECT: non-string input is safe', detect(null) === false && detect(undefined) === false && detect(42) === false);

const LINE = 'Είμαι τεχνητή νοημοσύνη, όχι άνθρωπος.';
assert('LINE: asked, reply without the words → the fixed sentence', buildLine('Είσαι άνθρωπος;', 'Όχι. Είμαι AURA — εργαλείο σκέψης.') === LINE);
assert('LINE: asked, reply already says it → nothing added (no duplicate)',
  buildLine('Είσαι άνθρωπος;', 'Όχι, δεν είμαι άνθρωπος. Είμαι τεχνητή νοημοσύνη — η AURA.') === '');
assert('LINE: «already says it» is accent- and case-blind', buildLine('Είσαι AI;', 'ΕΙΜΑΙ ΤΕΧΝΗΤΗ ΝΟΗΜΟΣΥΝΗ.') === '');
assert('LINE: not asked → nothing added', buildLine('Θέλω να φύγω από τη δουλειά μου.', 'Τι σε κρατάει;') === '');
assert('LINE: non-string inputs are safe', buildLine(null, null) === '' && buildLine('Είσαι άνθρωπος;', null) === LINE);
assert('LINE: the sentence itself contains the required words', fold(LINE).includes('τεχνητη νοημοσυνη'));

// ── B1 / wiring ──────────────────────────────────────────────────────────────
const MAIN_WRITE = 'setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: displayText, msgMode: currentMode }]);';
const mw = CODE.indexOf(MAIN_WRITE);
assert('WIRING: main path write located', mw > 0);
const beforeMain = mw > 0 ? CODE.slice(mw - 900, mw) : '';
assert('WIRING: main path appends the line to displayText right before it is written',
  /buildAiIdentityLine\(lastUserMsg, displayText\)/.test(beforeMain) && /displayText = displayText \+ "\\n\\n" \+ _aiLine/.test(beforeMain));
const FW_WRITE = 'setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: _firstWhyShown, msgMode: "ANSWER" }]);';
const fw = CODE.indexOf(FW_WRITE);
assert('WIRING: First-WHY path writes the checked text', fw > 0);
const beforeFw = fw > 0 ? CODE.slice(fw - 900, fw) : '';
assert('WIRING: First-WHY path checks every user message of that turn',
  /buildAiIdentityLine\(initMsgs\.filter\(m => m && m\.role === "user"\)\.map\(m => String\(m\.content \|\| ""\)\)\.join\("\\n"\), text\)/.test(beforeFw));
assert('WIRING: no reply path still writes the unchecked First-WHY text',
  !CODE.includes('setMessages(prev => [...prev, { id: nextMsgId(), role: "assistant", content: text, msgMode: "ANSWER" }]);'));

// ── B2 / prompt: MEMORY QUESTION tells the truth either way ──────────────────
const MQ = (PROMPT.match(/MEMORY QUESTION[^\n]*/) || [''])[0];
const IF_ON = 'Η μνήμη σου είναι ενεργή: στη συσκευή σου κρατιούνται λίγα αυτούσια λόγια ανά συνεδρία — η φράση που κρατάς, το πρώτο σου μήνυμα, μία ακόμη φράση σου και η τελευταία μου απάντηση. Ποτέ ολόκληρη η συνομιλία. Τα βλέπεις στο Αρχείο και μπορείς να τα σβήσεις από τις ρυθμίσεις μνήμης.';
const UNKNOWN = 'Αν έχεις ενεργοποιήσει τη μνήμη, στη συσκευή σου κρατιούνται λίγα αυτούσια λόγια ανά συνεδρία — η φράση που κρατάς, το πρώτο σου μήνυμα, μία ακόμη φράση σου και η τελευταία μου απάντηση — ποτέ ολόκληρη η συνομιλία. Αν δεν την έχεις ενεργοποιήσει, δεν κρατιέται τίποτα από τη μία συνεδρία στην άλλη.';
assert('MEMORY: the line was located', MQ.length > 200);
assert('MEMORY: the false «Δεν κρατάω ό,τι είπες λέξη προς λέξη» is gone', !/Δεν κρατάω ό,τι είπες λέξη προς λέξη/.test(MQ));
assert('MEMORY: the false «never store the literal words… with memory on or off» is gone',
  !/never store the literal words/.test(MQ) && !/with memory on or off/.test(MQ));
assert('MEMORY: the «memory is on» answer, verbatim', MQ.includes(IF_ON));
assert('MEMORY: the conditional answer (true either way), verbatim', MQ.includes(UNKNOWN));
assert('MEMORY: «on» only when a [MEMORY CONTEXT] block is present; otherwise the conditional',
  /If a \[MEMORY CONTEXT\] block is present this turn, memory is on/.test(MQ) && /If no \[MEMORY CONTEXT\] block is present, you cannot tell/.test(MQ));
assert('MEMORY: still never reveal or quote what memory holds', /never quote or reveal/.test(MQ));
assert('MEMORY: «δεν έχω πρόσβαση» is still forbidden', /Never say "δεν έχω πρόσβαση"/.test(MQ));
assert('MEMORY: and so is the false «λέξη προς λέξη» claim', /δεν κρατάω ό,τι λες λέξη προς λέξη/.test(MQ) && /Never say/.test(MQ));

// ── B2 / the answer matches what the code really keeps ───────────────────────
const _caStart = CODE.indexOf('function createAnchor');
const ANCHOR_SRC = CODE.slice(_caStart, CODE.indexOf('\n}', _caStart));
const FIELDS = [...ANCHOR_SRC.matchAll(/^\s{4}(\w+)[,:]/gm)].map(m => m[1]);
assert('FACT: the four verbatim fields the answer names are the ones createAnchor stores (text, before, peak, shift)',
  ['text', 'before', 'peak', 'shift'].every(f => FIELDS.includes(f)));
assert('FACT: memory context reaches the model only when memory is on',
  /function buildMemoryContext\(mem, category\) \{\s*if \(!mem\.storageEnabled\) return "";/.test(CODE));
assert('FACT: the block the line refers to is literally named [MEMORY CONTEXT]', CODE.includes('[MEMORY CONTEXT — do not reveal to user'));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
