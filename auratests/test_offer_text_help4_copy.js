// AURA — John, 11/10/2026, before the link goes to the 20 testers (ADR «11 Οκτωβρίου (η)»). 0 of the 20 sessions had been
// measured, so nothing that is compared later changes. Everything here is only with the switch open (?stageA=1) or ?rec=1;
// the normal app does not change.
//   1  THE TEXT AFTER «Ναι» (normal case), verbatim:
//        Η ρίζα σου: "{τι βρήκες}".
//        Το πρώτο μισό έγινε: βρήκες τι πραγματικά ρωτάς — εσύ, χωρίς συμβουλές.
//        Στο AURA Coach συνεχίζουμε από αυτή τη φράση σου και φεύγεις με τρία πράγματα, γραμμένα με τα δικά σου λόγια:
//        · τι ακριβώς έχεις να αποφασίσεις,
//        · τι κερδίζεις και τι χάνεις σε κάθε δρόμο,
//        · ένα μικρό πρώτο βήμα για να το δοκιμάσεις στην πράξη — και πότε.
//        AURA Coach · €6, μία φορά. Όχι συνδρομή.
//      Same buttons, no new logic. With a risk signal (B / DISTRESS) it stays exactly as it was. On the phone «Η ρίζα σου» is
//      seen first.
//   2  THE ONE-TAP QUESTION after «Το AURA Coach δεν είναι ακόμα έτοιμο.»: «Τι θα σε βοηθούσε περισσότερο τώρα;» with four
//      options — 1 decide · 2 gain/lose · 3 small step · 4 «ask me again in a few days». The measurement is the same: which one
//      was tapped, or 0 («Συνέχεια», none).
//   3  «Στείλε τα στοιχεία της δοκιμής»: next to the button the result of the copy — «Αντιγράφηκε ✓ — κάνε επικόλληση σε μήνυμα
//      σε μένα» or «Δεν αντιγράφηκε — στείλε μου το αρχείο που κατέβηκε». Where the newer clipboard is missing or refused
//      (in-app browsers), the old copy command is tried, inside the same tap. The download still always runs. No network.

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
function extractBlock(startToken) {
  const a = CODE.indexOf(startToken); if (a < 0) return null;
  const b = CODE.indexOf('{', a); let depth = 0;
  for (let j = b; j < CODE.length; j++) { if (CODE[j] === '{') depth++; else if (CODE[j] === '}') { depth--; if (depth === 0) return CODE.slice(a, j + 2); } }
  return null;
}
const textsSrc = extractBlock('const STAGE_A_TEXTS = ') || 'const STAGE_A_TEXTS = {};';
const testerSrc = extractBlock('const TESTER_TEXTS = ') || 'const TESTER_TEXTS = {};';
const NAMES = ['buildRootEndLines', 'stageAStep', 'initialStageAState', 'stageAHelpTelemetry'];
let F = {};
try { F = new Function(textsSrc + '\n' + testerSrc + '\n' + NAMES.map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n') + '\nreturn {STAGE_A_TEXTS, TESTER_TEXTS,' + NAMES.join(',') + '};')(); }
catch (e) { console.log('LOAD ERROR — ' + e.message); }
const T = (f, ...a) => { try { return F[f](...a); } catch (e) { return 'threw:' + e.message; } };
const TX = F.STAGE_A_TEXTS || {};
const UI = CODE.slice(CODE.indexOf('{/* STAGE A UI — BEGIN */}'), CODE.indexOf('{/* STAGE A UI — END */}'));

// ── 1: the text after «Ναι» ─────────────────────────────────────────────────
const ROOT = 'Φοβάμαι ότι αν φύγω θα απογοητεύσω τον πατέρα μου.';
// UPDATED (16/10, ADR «16 Οκτωβρίου (β)»): John's text of 16/10 replaces the 11/10 one (test_texts_1610.js); the risk text is unchanged.
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
const RISK_ROOT = `Η ρίζα σου: "${ROOT}".`;
{
  const L = T('buildRootEndLines', ROOT, false);
  assert('END: exactly John\'s lines, in his order, character for character', Array.isArray(L) && L.length === JOHN.length && L.every((x, k) => x === JOHN[k]));
  assert('END: the root is the FIRST line (what the phone shows first)', Array.isArray(L) && L[0] === `«${ROOT}»`);
  assert('END: the root is whole, never cut (a long root of 400 characters)',
    (() => { const long = 'Δεν ξέρω '.repeat(44).trim(); const x = T('buildRootEndLines', long, false); return x[0] === `«${long}»`; })());
  assert('END: the price line says one payment and no subscription', TX.price === '€6, μία φορά. Όχι συνδρομή.');
  assert('END: the old sentences are gone from the normal text («Το πρώτο βήμα κάθε προβλήματος…», «Το επόμενο ερώτημα είναι…»)',
    Array.isArray(L) && !/Το πρώτο βήμα κάθε προβλήματος|Το επόμενο ερώτημα είναι/.test(L.join('\n')) && !/Το επόμενο ερώτημα είναι/.test(CODE));
  const R = T('buildRootEndLines', ROOT, true);
  assert('RISK (B / DISTRESS): UNCHANGED — the root and «Το πρώτο βήμα κάθε προβλήματος…», nothing about Coach or price',
    Array.isArray(R) && R.length === 2 && R[0] === RISK_ROOT &&
    R[1] === 'Το πρώτο βήμα κάθε προβλήματος είναι ο πραγματικός ορισμός του — και τον βρήκες εσύ, χωρίς συμβουλές.' && !/Coach|€|συνδρομή/.test(R.join(' ')));
  assert('SAME LOGIC: «Ναι» still writes these lines as one message marked as the end; the buttons are the same two',
    CODE.includes('content: buildRootEndLines(stageARef.current.found, _riskOffer).join("\\n"), msgMode: "STAGE_A", stageAEnd: true }') &&
    /onClick=\{\(\) => stageADispatch\(\{ type: "notNow" \}\)\}>\{STAGE_A_TEXTS\.notNow\}<\/button>/.test(UI) &&
    /onClick=\{\(\) => stageADispatch\(\{ type: "want" \}\)\}>\{STAGE_A_TEXTS\.wantMore\}<\/button>/.test(UI));
  assert('PHONE: the end message is scrolled to its START (not the bottom), so «Η ρίζα σου» is seen before the price',
    /messages\[messages\.length - 1\]\.stageAEnd\s*\?\s*document\.querySelector\('\[data-stage-a-end="1"\]'\) : null;\s*if \(_saEnd\) \{\s*_saEnd\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\);\s*return;/.test(CODE) &&
    /data-stage-a-end=\{msg\.stageAEnd \? "1" : undefined\}/.test(CODE));
}

// ── 2: the one-tap question ──────────────────────────────────────────────────
{
  assert('QUESTION: verbatim', TX.helpQ === 'Τι θα σε βοηθούσε περισσότερο τώρα;');
  assert('OPTION 1: verbatim', TX.help1 === 'Να δω καθαρά τι ακριβώς έχω να αποφασίσω');
  assert('OPTION 2: verbatim', TX.help2 === 'Να δω τι κερδίζω και τι χάνω σε κάθε δρόμο');
  assert('OPTION 3: verbatim', TX.help3 === 'Να βρω ένα μικρό βήμα για να το δοκιμάσω στην πράξη');
  assert('OPTION 4: verbatim', TX.help4 === 'Να με ξαναρωτήσει σε λίγες μέρες τι έγινε');
  assert('THE OLD OPTIONS are gone («Να βρω τώρα τι μπορώ να κάνω», «Να κρατάω τη ρίζα και τα βήματά μου»)',
    !/Να βρω τώρα τι μπορώ να κάνω|Να κρατάω τη ρίζα και τα βήματά μου/.test(CODE));
  const nr = Object.assign(T('initialStageAState'), { phase: 'notReady' });
  const tap = c => { const n = T('stageAStep', nr, { type: 'help', choice: c }); return { n, tel: T('stageAHelpTelemetry', nr, n, { type: 'help', choice: c }) }; };
  [1, 2, 3, 4].forEach(c => {
    const x = tap(c);
    assert(`CHOICE ${c}: recorded as ${c} — in the event and in the session's numbers — then the clarity scale`,
      x.n && x.n.phase === 'clarity' && x.n.stats.coachHelpChoice === c && x.tel && x.tel.event === 'coach_help_choice' && x.tel.fields.choice === c);
  });
  {
    const s = tap(0), j = tap(5), str = tap('4');
    assert('NONE: «Συνέχεια» is 0; a value that is not 1–4 (5, the text "4") is 0, never itself',
      s.n.stats.coachHelpChoice === 0 && s.tel.fields.choice === 0 && j.n.stats.coachHelpChoice === 0 && j.tel.fields.choice === 0 &&
      str.n.stats.coachHelpChoice === 0 && str.tel.fields.choice === 0 && j.n.phase === 'clarity');
  }
  const card = UI.slice(UI.indexOf('{stageAPhase === "notReady" && ('), UI.indexOf('{stageAPhase === "clarity" && ('));
  const order = ['help1', 'help2', 'help3', 'help4', 'helpSkip'].map(k => card.indexOf('{STAGE_A_TEXTS.' + k + '}'));
  assert('SCREEN: the question, then the four options in order 1–4, then «Συνέχεια» last', card.indexOf('{STAGE_A_TEXTS.helpQ}') >= 0 &&
    order.every((p, k) => p > card.indexOf('{STAGE_A_TEXTS.helpQ}') && (k === 0 || p > order[k - 1])));
  // Found in the browser at phone size (390×844): the question opens without a new message, so the screen stayed where it was
  // and options 3, 4 and «Συνέχεια» were below the fold — the measurement would lean to the first two options.
  assert('PHONE: when the question opens, the screen is brought down to it — all four options and «Συνέχεια» are seen',
    /if \(!stageAActive\.current \|\| \(stageAPhase !== "ask" && stageAPhase !== "correct" && stageAPhase !== "notReady"\)\) return;\s*bottomRef\.current\?\.scrollIntoView\(\{ behavior: "smooth", block: "end" \}\);/.test(CODE));
  assert('SCREEN: each option sends ITS number (help1 → 1 … help4 → 4, «Συνέχεια» → 0)',
    [1, 2, 3, 4].every(c => card.includes(`onClick={() => stageADispatch({ type: "help", choice: ${c} })}>{STAGE_A_TEXTS.help${c}}</button>`)) &&
    card.includes('onClick={() => stageADispatch({ type: "help", choice: 0 })}>{STAGE_A_TEXTS.helpSkip}</button>') &&
    (card.match(/<button /g) || []).length === 5);
}

// ── 3: the copy result next to the button ────────────────────────────────────
const TT = F.TESTER_TEXTS || {};
assert('TEXTS: the two approved lines, plus the two results, verbatim',
  TT.line === 'Μόνο αριθμοί — κανένα κείμενο της συζήτησης.' && TT.button === 'Στείλε τα στοιχεία της δοκιμής' &&
  TT.copied === 'Αντιγράφηκε ✓ — κάνε επικόλληση σε μήνυμα σε μένα' && TT.notCopied === 'Δεν αντιγράφηκε — στείλε μου το αρχείο που κατέβηκε' &&
  Object.keys(TT).length === 4);

// A fake browser: localStorage with one record, a download link, a clipboard and the old copy command, each settable.
function browser(opts) {
  const o = Object.assign({ clip: 'ok', exec: true, download: true }, opts || {});
  const log = { writes: [], execs: 0, selected: null, clicks: 0, appended: 0, removed: 0, syncExec: null };
  const store = { aura_telemetry_log: JSON.stringify([{ ev: 'root_card_shown', t: 1, door: 2 }, { ev: 'coach_help_choice', t: 2, choice: 4 }]) };
  const mkEl = tag => {
    const el = { tag, style: {}, attrs: {}, value: '', setAttribute(k, v) { this.attrs[k] = v; }, remove() { log.removed++; },
      click() { log.clicks++; }, select() { log.selected = this.value; }, setSelectionRange(a, b) { log.range = [a, b]; log.selected = this.value; } };
    if (tag === 'textarea') log.textarea = el;
    return el;
  };
  const document = {
    createElement: mkEl,
    body: { appendChild() { log.appended++; } },
    execCommand(cmd) { log.execs++; if (cmd !== 'copy') return false; if (o.exec === 'throw') throw new Error('no'); if (o.exec) log.copied = log.selected; return !!o.exec; },
  };
  let clipboard;
  if (o.clip === 'none') clipboard = undefined;
  else clipboard = { writeText(t) {
    log.writes.push(t);
    if (o.clip === 'ok') { log.copied = t; return Promise.resolve(); }
    if (o.clip === 'reject') return Promise.reject(new Error('NotAllowedError'));
    if (o.clip === 'throw') throw new Error('TypeError');
    return new Promise(() => {}); // 'hang': never answers
  } };
  const navigator = { clipboard };
  const window = { localStorage: { getItem: k => (k in store ? store[k] : null) } };
  const URL_ = { createObjectURL() { if (!o.download) throw new Error('blocked'); return 'blob:x'; }, revokeObjectURL() {} };
  const fast = o.clip === 'hang' ? (fn) => setImmediate(fn) : setTimeout; // the hang case: let the time limit pass at once
  let exportFn = null;
  try {
    const src = ['copyTextLegacy', 'exportTesterData', 'buildTesterExport'].map(n => fullFnSrc(n) || `function ${n}(){return 'missing'}`).join('\n');
    exportFn = new Function('window', 'navigator', 'document', 'URL', 'Blob', 'setTimeout', src + '\nreturn exportTesterData;')(window, navigator, document, URL_, function Blob() {}, fast);
  } catch (e) { console.log('LOAD ERROR — ' + e.message); }
  return { log, run() {
    try {
      const p = exportFn();
      log.syncExec = log.execs; // what ran INSIDE the tap, before any await
      return Promise.resolve(p).then(v => v, () => 'rejected');
    } catch (e) { return Promise.resolve('threw:' + e.message); }
  } };
}

(async () => {
  {
    const b = browser({ clip: 'ok' }); const r = await b.run();
    assert('COPIED (normal browser): the newer clipboard took it → true; the old command was not needed', r === true && b.log.writes.length === 1 && b.log.execs === 0);
    const sent = JSON.parse(b.log.copied || '{}');
    assert('WHAT IS COPIED is the numbers-only file (the same as the download) — the choice 4 is in it, nothing typed',
      sent.records === 2 && sent.events[1].choice === 4 && /counts and flags only/.test(sent.note));
    assert('THE DOWNLOAD still runs (the file is the other way to send it)', b.log.clicks === 1);
  }
  {
    const b = browser({ clip: 'none' }); const r = await b.run();
    assert('NO CLIPBOARD (old or in-app browser): the old copy command, INSIDE the tap → true', r === true && b.log.syncExec === 1 && JSON.parse(b.log.copied || '{}').records === 2);
    const ta = b.log.textarea || { attrs: {}, style: {}, value: '' };
    assert('… through a hidden, read-only field (no keyboard on the phone), all of its text selected, removed again (nothing left on the page)',
      'readonly' in ta.attrs && ta.style.opacity === '0' && ta.style.position === 'fixed' && b.log.range && b.log.range[0] === 0 && b.log.range[1] === ta.value.length &&
      b.log.appended === 2 && b.log.removed === 2);
  }
  {
    const b = browser({ clip: 'reject' }); const r = await b.run();
    assert('REFUSED (e.g. an in-app browser on Android): the old copy command is tried → true', r === true && b.log.writes.length === 1 && b.log.execs === 1);
  }
  {
    const b = browser({ clip: 'throw' }); const r = await b.run();
    assert('THE CLIPBOARD THROWS: the old copy command, inside the tap → true', r === true && b.log.syncExec === 1);
  }
  {
    const b = browser({ clip: 'reject', exec: false }); const r = await b.run();
    assert('BOTH FAIL → false (the screen says «Δεν αντιγράφηκε…»); the download has run', r === false && b.log.clicks === 1);
    const b2 = browser({ clip: 'none', exec: 'throw' }); const r2 = await b2.run();
    assert('THE OLD COMMAND THROWS → false, never a crash', r2 === false);
  }
  {
    const b = browser({ clip: 'hang' }); const r = await b.run();
    assert('A CLIPBOARD THAT NEVER ANSWERS → false after a short time limit (the tester is never left without an answer)', r === false);
  }
  {
    const b = browser({ clip: 'ok', download: false }); const r = await b.run();
    assert('NO DOWNLOAD possible: the copy result still comes back → true', r === true);
  }
  {
    const ex = (fullFnSrc('exportTesterData') || '') + (fullFnSrc('copyTextLegacy') || '');
    assert('NO NETWORK: neither function sends anything anywhere', ex.length > 100 && !/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(ex));
    assert('TIME LIMIT is short and fixed (3 seconds)', /setTimeout\(\(\) => resolve\(false\), 3000\)/.test(fullFnSrc('exportTesterData') || ''));
  }
  // the screen
  {
    const end = CODE.slice(CODE.indexOf('{/* Session end */}'), CODE.indexOf('{/* Session end */}') + 2000);
    const intro = CODE.slice(CODE.indexOf('{messages.length === 0 && !sessionStarted && introChoice === null && ('), CODE.indexOf('{/* ── Intro overlay'));
    const RES = /\{TESTER_TEXTS\.button\}<\/button>\s*\{testerCopy && <(div|span) role="status"[^>]*>\{testerCopy === "ok" \? TESTER_TEXTS\.copied : TESTER_TEXTS\.notCopied\}<\/\1>\}/;
    assert('END SCREEN: the result right after the button (only inside the ?rec=1 block)', /\{recMode\.current && \(/.test(end) && RES.test(end) && /onClick=\{handleTesterExport\}/.test(end));
    assert('START SCREEN: the same', /\{recMode\.current && storedTelemetryCount\(\) > 0 && \(/.test(intro) && RES.test(intro) && /onClick=\{handleTesterExport\}/.test(intro));
    assert('THE TAP: the old result is cleared, then the new one is shown — "ok" only when the copy worked',
      /const handleTesterExport = useCallback\(\(\) => \{\s*setTesterCopy\(null\);\s*exportTesterData\(\)\.then\(ok => setTesterCopy\(ok === true \? "ok" : "fail"\), \(\) => setTesterCopy\("fail"\)\);\s*\}, \[\]\);/.test(CODE) &&
      /const \[testerCopy, setTesterCopy\] = useState\(null\);/.test(CODE));
    assert('NEW SESSION: the result is forgotten', /setTesterCopy\(null\);/.test(extractBlock('const resetSession = () =>') || ''));
    assert('ONLY ?rec=1: the result exists only next to the two tester buttons; exportTesterData has no other caller',
      (CODE.match(/TESTER_TEXTS\.copied/g) || []).length === 2 && (CODE.match(/handleTesterExport\}/g) || []).length === 2 && (CODE.match(/exportTesterData\(/g) || []).length === 2);
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
