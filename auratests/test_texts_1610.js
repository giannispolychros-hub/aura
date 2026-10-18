// AURA — John, 16/10/2026 (ADR «16 Οκτωβρίου (β)»): an exception to the freeze, with his approval — ONLY fixed texts, before the
// first tester session. No change to logic, doors, telemetry or which button does what. Risk sessions stay as they are (no offer).
//   1  First screen: the header line in Greek («Βρίσκουμε την ερώτηση που μετράει. Τίποτα άλλο.»); under the AI line, John's
//      invitation («Γράψε ό,τι σε απασχολεί, όπως έρχεται. Μπερδεμένο είναι μια χαρά.») in the place of the old one; the input's
//      first placeholder «Γράψ' το όπως έρχεται…».
//   2  The offer after «Ναι» (normal sessions): John's text, line for line, with its blank lines.
//   3  The message after «Θέλω να συνεχίσω», before the one-tap question (the question and its options unchanged).
//   4  Door 4: «Πριν φύγεις: αν κάτι ξεκαθάρισε, …». The button «Δεν το βρήκα ακόμα» stays.
//   5  «Πες το λίγο πιο ολοκληρωμένα — όπως θα το έλεγες σε έναν φίλο.»
// And the guard for «no logic change»: every detector that reads an AURA message classifies the new texts as it did the old.

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
  const C = CODE;
  const a = C.indexOf('function ' + name + '('); if (a < 0) return null;
  let k = C.indexOf('(', a), depth = 0;
  for (; k < C.length; k++) { if (C[k] === '(') depth++; else if (C[k] === ')') { depth--; if (depth === 0) break; } }
  const b = C.indexOf('{', k); depth = 0;
  for (let j = b; j < C.length; j++) { if (C[j] === '{') depth++; else if (C[j] === '}') { depth--; if (depth === 0) return C.slice(a, j + 1); } }
  return null;
}
const constSrc = n => { const a = CODE.indexOf('const ' + n + ' = '); return a >= 0 ? CODE.slice(a, CODE.indexOf(';\n', a) + 1) : ''; };
const textsSrc = (() => { const a = CODE.indexOf('const STAGE_A_TEXTS = {'); return a >= 0 ? CODE.slice(a, CODE.indexOf('\n};', a) + 3) : ''; })();
const NAMES = ['buildRootEndLines', 'dropQuoteOnlyLines', 'replaceBareGoodbye', 'detectsContinuationPromiseAsked', 'parseRoadMap',
  'matchesClosingWord', 'isBareEmojiOrAcknowledgment', 'wasThirdTriggerAsked', 'detectsCoreReadinessAsked', 'stopOpenerKind',
  'detectsRiskClarification', 'parseThreeBeatShift'];
let F = {};
try {
  const consts = ['BARE_GOODBYE_TEXT', 'STOP_OPENER'].map(constSrc).join('\n');
  F = new Function(textsSrc + '\n' + consts + '\n' + NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') +
    '\nreturn {STAGE_A_TEXTS,' + NAMES.join(',') + '};')();
} catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const TX = F.STAGE_A_TEXTS || {};
const UI = CODE.slice(CODE.indexOf('{/* STAGE A UI — BEGIN */}'), CODE.indexOf('{/* STAGE A UI — END */}'));
// What a reader of the screen sees: JSX comments and <br/> removed, whitespace collapsed.
const visible = src => src.replace(/&nbsp;/g, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ── 1. First screen ───────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const HEAD = (() => { const a = CODE.indexOf('<header className="header"'); return a >= 0 ? CODE.slice(a, CODE.indexOf('<div className="header-right">', a)) : ''; })();
  assert('HEADER: located', HEAD.length > 50);
  assert('HEADER: «Βρίσκουμε την ερώτηση που μετράει.» then «Τίποτα άλλο.», in Greek', visible(HEAD) === 'Βρίσκουμε την ερώτηση που μετράει. Τίποτα άλλο.');
  assert('HEADER: the English line is gone from the screen', !/We find the question that matters|>\s*Nothing else\.\s*</.test(CODE));
  // UPDATED (17/10, ADR «17 Οκτωβρίου (στ)», John): every text colour 60% brighter — the grey of «Τίποτα άλλο.» #8a8680 → #ddd6cd.
  assert('HEADER: same look — the large line and the smaller grey «Τίποτα άλλο.» under it',
    /fontSize:"18px"[^>]*>Βρίσκουμε την ερώτηση που&nbsp;μετράει\.<br \/><span style=\{\{fontSize:"14px",color:"#ddd6cd"\}\}>Τίποτα άλλο\.<\/span><\/span>/.test(HEAD));
  // The Greek line is wider than the English one: on a phone it takes two lines. One non-breaking space keeps «που μετράει.»
  // together, so «μετράει.» is never alone: «Βρίσκουμε την ερώτηση / που μετράει.». On a wide screen it stays one line.
  assert('HEADER: «που μετράει.» is kept together (a non-breaking space), the rest wraps as usual',
    HEAD.includes('Βρίσκουμε την ερώτηση που&nbsp;μετράει.') && (HEAD.match(/&nbsp;/g) || []).length === 1);

  const ENTRY = (() => { const a = CODE.indexOf('{messages.length === 0 && !sessionStarted && introChoice === null && ('); return a >= 0 ? visible(CODE.slice(a, CODE.indexOf('{recMode.current && storedTelemetryCount()', a))) : ''; })();
  const AI_LINE = 'Είμαι τεχνητή νοημοσύνη. Δεν σου λέω τι να κάνεις πριν βρεις τι πραγματικά ρωτάς.';
  const INVITE = 'Γράψε ό,τι σε απασχολεί, όπως έρχεται. Μπερδεμένο είναι μια χαρά.';
  assert('ENTRY: the AI line is unchanged and comes first', ENTRY.indexOf(AI_LINE) >= 0 && ENTRY.indexOf(AI_LINE) < ENTRY.indexOf(INVITE));
  assert('ENTRY: John\'s line right under it', ENTRY.includes(AI_LINE + ' ' + INVITE));
  assert('ENTRY: it replaces the old line of the same meaning (not both)', !CODE.includes("Δεν χρειάζεται να το έχεις καθαρό. Γράψ' το όπως είναι."));
  assert('ENTRY: the start button is unchanged', ENTRY.includes('Ξεκίνα με το πρόβλημά σου'));

  assert('INPUT: the first placeholder is «Γράψ\' το όπως έρχεται…»; later turns keep «Γράψε...»',
    CODE.includes('placeholder={messages.length === 0 ? "Γράψ\' το όπως έρχεται…" : "Γράψε..."}'));
}

// ── 2. The offer after «Ναι» ──────────────────────────────────────────────────────────────────────────────────────────────────
const ROOT = 'Φοβάμαι ότι αν φύγω θα απογοητεύσω τον πατέρα μου.';
const JOHN = [
  `«${ROOT}»`,
  'Αυτό το βρήκες εσύ — χωρίς καμία συμβουλή.',
  '',
  'Το πρώτο μισό έγινε: ξέρεις πια τι πραγματικά ρωτάς.',
  'Μένει το δεύτερο: και τώρα;',
  '',
  'Στο AURA Coach ξεκινάμε από αυτή ακριβώς τη φράση σου. Φεύγεις με τρία πράγματα, γραμμένα με τα δικά σου λόγια:',
  '· τι ακριβώς έχεις να αποφασίσεις',
  '· τι κερδίζεις και τι χάνεις σε κάθε δρόμο',
  '· ένα μικρό πρώτο βήμα για να το δοκιμάσεις — και πότε',
  '',
  '€6, μία φορά. Όχι συνδρομή.',
  'Κι αν όχι τώρα, αυτό που βρήκες είναι ήδη δικό σου.',
];
const OLD_END = [`Η ρίζα σου: "${ROOT}".`, 'Το πρώτο μισό έγινε: βρήκες τι πραγματικά ρωτάς — εσύ, χωρίς συμβουλές.',
  'Στο AURA Coach συνεχίζουμε από αυτή τη φράση σου και φεύγεις με τρία πράγματα, γραμμένα με τα δικά σου λόγια:',
  '· τι ακριβώς έχεις να αποφασίσεις,', '· τι κερδίζεις και τι χάνεις σε κάθε δρόμο,',
  '· ένα μικρό πρώτο βήμα για να το δοκιμάσεις στην πράξη — και πότε.', 'AURA Coach · €6, μία φορά. Όχι συνδρομή.'].join('\n');
{
  const L = T('buildRootEndLines', ROOT, false);
  assert('OFFER: exactly John\'s text, line for line, with the three blank lines between its four parts',
    Array.isArray(L) && L.length === JOHN.length && L.every((x, k) => x === JOHN[k]));
  assert('OFFER: the root is the FIRST line, whole, in «» (what the phone shows first)',
    (() => { const long = 'Δεν ξέρω '.repeat(44).trim(); const x = T('buildRootEndLines', long, false); return Array.isArray(x) && x[0] === `«${long}»`; })());
  assert('OFFER: outer spaces of the root are trimmed, nothing else', (T('buildRootEndLines', '  φόβος  ', false) || [])[0] === '«φόβος»');
  assert('OFFER: the old sentences are gone («Η ρίζα σου» only in risk sessions, «συνεχίζουμε από αυτή τη φράση», «AURA Coach · €6»)',
    Array.isArray(L) && !/Η ρίζα σου|συνεχίζουμε από αυτή|AURA Coach ·|βρήκες τι πραγματικά ρωτάς/.test(L.join('\n')));

  const R = T('buildRootEndLines', ROOT, true);
  assert('RISK (B / DISTRESS): UNCHANGED — «Η ρίζα σου: "…".» and «Το πρώτο βήμα κάθε προβλήματος…», no offer, no price',
    Array.isArray(R) && R.length === 2 && R[0] === `Η ρίζα σου: "${ROOT}".` &&
    R[1] === 'Το πρώτο βήμα κάθε προβλήματος είναι ο πραγματικός ορισμός του — και τον βρήκες εσύ, χωρίς συμβουλές.' &&
    !/Coach|€|συνδρομή/.test(R.join(' ')));
  // UPDATED (17/10, ADR «17 Οκτωβρίου (δ)»): the normal card line is John's new text; the risk line stays.
  assert('RISK: the card line is unchanged too', TX.cardLineRisk === 'Με το "Ναι" ολοκληρώνεται αυτό το κομμάτι.' &&
    TX.cardLine === 'Με το "Ναι" κλείνει αυτό το κομμάτι και σου δείχνω τι ακολουθεί.');

  assert('SAME LOGIC: «Ναι» still writes these lines as ONE message marked as the end; the same two buttons, the same events',
    CODE.includes('content: buildRootEndLines(stageARef.current.found, _riskOffer).join("\\n"), msgMode: "STAGE_A", stageAEnd: true }') &&
    /onClick=\{\(\) => stageADispatch\(\{ type: "notNow" \}\)\}>\{STAGE_A_TEXTS\.notNow\}<\/button>/.test(UI) &&
    /onClick=\{\(\) => stageADispatch\(\{ type: "want" \}\)\}>\{STAGE_A_TEXTS\.wantMore\}<\/button>/.test(UI) &&
    TX.wantMore === 'Θέλω να συνεχίσω' && TX.notNow === 'Όχι τώρα');

  const NEW_END = Array.isArray(L) ? L.join('\n') : '';
  assert('SCREEN: every line is drawn — the blank lines stay, nothing is replaced as a farewell',
    T('dropQuoteOnlyLines', NEW_END) === NEW_END && T('replaceBareGoodbye', NEW_END) === NEW_END && NEW_END.split('\n').length === 13);
  assert('SCREEN: it is not read as a road map, the «Δες την πορεία» offer, a three-beat shift or a «διαύγεια» snapshot — as before',
    T('parseRoadMap', NEW_END) === null && T('detectsContinuationPromiseAsked', NEW_END) === false && T('parseThreeBeatShift', NEW_END) === null &&
    !(/αυτό που (φαίνεται πιο )?ξεκάθαρ\w*/i.test(NEW_END) && /παραμένει (ανοιχτό|αναπάντητο|ασαφές)/i.test(NEW_END)) &&
    T('parseRoadMap', OLD_END) === null && T('detectsContinuationPromiseAsked', OLD_END) === false);
}

// ── 3. After «Θέλω να συνεχίσω» ───────────────────────────────────────────────────────────────────────────────────────────────
{
  assert('NOT READY: John\'s text', TX.notReady === 'Σε ευχαριστώ. Το AURA Coach δεν είναι ακόμα έτοιμο — δεν χρεώθηκες τίποτα. Η απάντησή σου θα καθορίσει τι θα φτιαχτεί πρώτο:');
  assert('NOT READY: the question and the five choices are EXACTLY the same',
    TX.helpQ === 'Τι θα σε βοηθούσε περισσότερο τώρα;' && TX.help1 === 'Να δω καθαρά τι ακριβώς έχω να αποφασίσω' &&
    TX.help2 === 'Να δω τι κερδίζω και τι χάνω σε κάθε δρόμο' && TX.help3 === 'Να βρω ένα μικρό βήμα για να το δοκιμάσω στην πράξη' &&
    TX.help4 === 'Να με ξαναρωτήσει σε λίγες μέρες τι έγινε' && TX.helpSkip === 'Συνέχεια');
  assert('NOT READY: each button still records the same choice (1, 2, 3, 4, and 0 for «Συνέχεια»), in the same order',
    /\{STAGE_A_TEXTS\.notReady\}<\/div>\s*<div className="warning-text">\{STAGE_A_TEXTS\.helpQ\}<\/div>/.test(UI) &&
    [1, 2, 3, 4].every(n => UI.includes(`stageADispatch({ type: "help", choice: ${n} })}>{STAGE_A_TEXTS.help${n}}`)) &&
    UI.includes('stageADispatch({ type: "help", choice: 0 })}>{STAGE_A_TEXTS.helpSkip}') &&
    UI.indexOf('choice: 1 }') < UI.indexOf('choice: 2 }') && UI.indexOf('choice: 2 }') < UI.indexOf('choice: 3 }') &&
    UI.indexOf('choice: 3 }') < UI.indexOf('choice: 4 }') && UI.indexOf('choice: 4 }') < UI.indexOf('choice: 0 }'));
}

// ── 4. Door 4 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const OLD_LEAVING = 'Αν κάτι σου ξεκαθάρισε, πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;';
{
  // UPDATED (17/10, ADR «17 Οκτωβρίου»): John removed «Πριν φύγεις:» (test_voice_1710.js).
  assert('DOOR 4: John\'s text', TX.askLeaving === "Αν κάτι ξεκαθάρισε, γράψ' το σε μία φράση. Τι είναι αυτό που πραγματικά σε απασχολεί;");
  assert('DOOR 4: «Δεν το βρήκα ακόμα, συνέχισε» stays, and the button\'s question (door 1) is unchanged',
    TX.back === 'Δεν το βρήκα ακόμα, συνέχισε' && TX.ask === 'Πες το με μία φράση: τι είναι αυτό που πραγματικά σε απασχολεί;');
  assert('DOOR 4: shown where it was — the same choice between the two questions, the same «back» button',
    UI.includes('<div className="warning-text">{stageAView.leaving ? STAGE_A_TEXTS.askLeaving : STAGE_A_TEXTS.ask}</div>') &&
    UI.includes('<button className="choice-btn" onClick={handleStageABack}>{STAGE_A_TEXTS.back}</button>'));
  // The question goes into the history (as an AURA message) once the user answers it. Every detector that reads the last AURA
  // message must read the new text as it read the old one.
  const N = TX.askLeaving || '';
  const same = f => { const a = T(f, N), b = T(f, OLD_LEAVING); return !/^threw|^missing/.test(String(a)) && JSON.stringify(a) === JSON.stringify(b); };
  assert('NO LOGIC CHANGE: the closing-word, acknowledgment, readiness, stop-opener and risk-question detectors read it as the old text',
    ['matchesClosingWord', 'isBareEmojiOrAcknowledgment', 'detectsCoreReadinessAsked', 'stopOpenerKind', 'detectsRiskClarification',
      'detectsContinuationPromiseAsked', 'parseThreeBeatShift', 'parseRoadMap'].every(same));
  assert('NO LOGIC CHANGE: it is not the third trigger (friend question), as before',
    T('wasThirdTriggerAsked', [{ role: 'assistant', content: N }]) === false && T('wasThirdTriggerAsked', [{ role: 'assistant', content: OLD_LEAVING }]) === false);
  assert('NO LOGIC CHANGE: «Πριν φύγεις:» is not the word question («Πριν φύγεις — μία λέξη…») nor its step-2 form',
    !/Πριν φύγεις[\s—–-]*μία\s+(λέξη|σύντομη)/i.test(N) && !/ποια λέξη ή φράση θέλεις να κρατήσεις/i.test(N) &&
    !/ποια λέξη ή ποια σύντομη φράση θα ήθελες να κρατήσεις/i.test(N));
  assert('NO LOGIC CHANGE: it still ends with a question mark, like the old one (the question-streak count)',
    /[;?]\s*$/.test(N) && /[;?]\s*$/.test(OLD_LEAVING));
}

// ── 5. The retry ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
assert('RETRY: John\'s text', TX.retry === 'Πες το λίγο πιο ολοκληρωμένα — όπως θα το έλεγες σε έναν φίλο.');
assert('RETRY: shown in the same two places (under the root question, under the correction)',
  (UI.match(/\{stageAView\.retry && <div className="warning-text" style=\{\{opacity:0\.85\}\}>\{STAGE_A_TEXTS\.retry\}<\/div>\}/g) || []).length === 2);

// ── Nothing else in STAGE_A_TEXTS changed ─────────────────────────────────────────────────────────────────────────────────────
assert('UNCHANGED: the other fixed texts of Stage A',
  TX.button === 'Νομίζω βρήκα τι με απασχολεί' && TX.yes === 'Ναι, αυτό είναι' && TX.correct === 'Διόρθωσε' &&
  TX.correctAsk === 'Γράψε τη ρίζα όπως θα την έλεγες εσύ, ολόκληρη.' && TX.knewLabel === 'Τι ήξερες' && TX.foundLabel === 'Τι βρήκες' &&
  TX.endSecond === 'Το πρώτο βήμα κάθε προβλήματος είναι ο πραγματικός ορισμός του — και τον βρήκες εσύ, χωρίς συμβουλές.' &&
  TX.clarityQ === 'Τώρα, πόσο ξεκάθαρο είναι ποιο ακριβώς είναι το πρόβλημα, από το 1 έως το 10;' &&
  TX.word === 'Πριν φύγεις — μία λέξη, ή μια σύντομη φράση που θέλεις να κρατήσεις.');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
