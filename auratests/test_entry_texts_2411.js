// AURA — John, 24/11/2026 (order «Β»): FOUR FIXED TEXTS of the first screens, written word for word by John. Only texts. Nothing else of the app moves.
//   1. the entry screen, first block:   «Είμαι τεχνητή νοημοσύνη. Δεν δίνω συμβουλές· ρωτάω για να βρεις εσύ.»
//   2. the entry screen, under the button: «Τα μηνύματά σου στέλνονται στην Anthropic, την εταιρεία του μοντέλου, για να απαντήσει η AURA.»
//   3. the entry screen, under (2), only where the browser has a speech API: «Το 🎙 γράφει στο πεδίο ό,τι αναγνωρίζει ο browser· η AURA δεν παίρνει ήχο.»
//   4. the OLD first screen («Αύρα»), 4th line: «Μετά βρίσκεις εσύ ένα μικρό βήμα και πότε θα το κάνεις.» — it replaces BOTH sentences of the old line («Μετά βλέπεις τις επιλογές σου καθαρά:
//      τι κερδίζεις, τι πληρώνεις. Και αποφασίζεις τι κρατάς και τι αφήνεις.»), which described the options of the old flow. John changes decision 18/10 (7) (its gold words) on purpose.
//
// WHY the claims are safe to print (each one is tied to the code by a GUARD below, so that if the code changes the text has to be read again):
//   (2) the app has exactly ONE network call, fetch("/api/aura"), and api/aura.js forwards it to https://api.anthropic.com/v1/messages;
//   (3) the app never touches audio itself: no getUserMedia / MediaRecorder / AudioContext anywhere — it only listens to the browser's SpeechRecognition and writes the text it returns into the box (not sent until «Go»);
//   (1) «Δεν δίνω συμβουλές» holds because the paid Coach screen (where ways may be proposed, ADR 4/10) is closed (STAGE_A_COACH_OFFER = false);
//   (4) the default flow is Stage A (STAGE_A_ENABLED = true), which asks the smallest step, whether it fits in a day, and «Πότε;».
//
// WRITTEN FIRST — every assertion labelled NEW fails on the code of root-list 6ad4343 and passes after the change; GUARD assertions are green before and after on purpose (they pin what must not
// move: the invitation, the button, the old first screen's other six lines, the core prompt, api/aura.js, line 912). Code only: the core prompt (7e52268becda7360) and api/aura.js do not change.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
let passed = 0, failed = 0;
function assert(label, cond) { if (cond) { passed++; console.log('PASS — ' + label); } else { failed++; console.log('FAIL — ' + label); } }
const sha = s => crypto.createHash('sha256').update(s || '').digest('hex');
const count = (s, re) => (s.match(re) || []).length;
const countStr = (s, t) => s.split(t).length - 1;

// the prompt lives inside AURA_CORE_PERSONALITY (a big template string); the screens are in the JSX after it
const _i = raw.indexOf('const AURA_CORE_PERSONALITY');
const _e = raw.indexOf('`;', raw.indexOf('`', _i) + 1);
const CODE = raw.slice(0, _i) + raw.slice(_e);

// ── the exact words (John's, 24/11/2026) ─────────────────────────────────────────────────────────────────────────────────────────────
const AI_OLD = 'Είμαι τεχνητή νοημοσύνη. Δεν σου λέω τι να κάνεις πριν βρεις τι πραγματικά ρωτάς.';
const AI_NEW = 'Είμαι τεχνητή νοημοσύνη. Δεν δίνω συμβουλές· ρωτάω για να βρεις εσύ.';
const PRIVACY = 'Τα μηνύματά σου στέλνονται στην Anthropic, την εταιρεία του μοντέλου, για να απαντήσει η AURA.';
const MIC = 'Το \u{1F399} γράφει στο πεδίο ό,τι αναγνωρίζει ο browser· η AURA δεν παίρνει ήχο.';
const INVITE = 'Γράψε ό,τι σε απασχολεί, όπως έρχεται. Μπερδεμένο είναι μια χαρά.';
const BUTTON = 'Ξεκίνα με το πρόβλημά σου';
const L4_OLD = 'Μετά βλέπεις τις επιλογές σου καθαρά: <span style={{color:"#ffd560"}}>τι κερδίζεις, τι πληρώνεις.</span> Και αποφασίζεις τι κρατάς και τι αφήνεις.';
const L4_NEW_LINE = '<div style={{marginBottom:"16px",color:"#f6f0e6"}}>Μετά βρίσκεις εσύ <span style={{color:"#ffd560"}}>ένα μικρό βήμα</span> και πότε θα το κάνεις.</div>';

// the entry screen, from its gate to the tester block (the block of ?rec=1 comes after everything that is new)
const ENTRY_AT = CODE.indexOf('{messages.length === 0 && !sessionStarted && introChoice === null && (');
const ENTRY_END = CODE.indexOf('{recMode.current && storedTelemetryCount() > 0 && (', ENTRY_AT);
const ENTRY = ENTRY_AT >= 0 && ENTRY_END > ENTRY_AT ? CODE.slice(ENTRY_AT, ENTRY_END) : '';
// the old first screen, from its gate to its buttons
const INTRO_AT = CODE.indexOf('<div className="intro-screen">');
const INTRO_END = CODE.indexOf('<div className="intro-actions">', INTRO_AT);
const INTRO = INTRO_AT >= 0 && INTRO_END > INTRO_AT ? CODE.slice(INTRO_AT, INTRO_END) : '';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 0. set-up — the regions were found (never an empty-string trap)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
assert('TEST SETUP — the entry screen was located (from its gate to the ?rec=1 block) and the old first screen too', ENTRY.length > 1000 && INTRO.length > 1000);

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1. the entry screen, first block — John's text 1
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const BLOCK = '<div style={{fontSize:"13px",color:"#fffaef",lineHeight:1.6,marginBottom:"10px",textAlign:"left"}}>';
  const m = ENTRY.indexOf(BLOCK);
  const el = m >= 0 ? ENTRY.slice(m, ENTRY.indexOf('</div>', m) + 6) : '';
  assert('NEW — (1.1) the first block of the entry screen says, word for word, «' + AI_NEW + '» (13px, #fffaef, the same box as before)',
    el.replace(/\s+/g, ' ') === BLOCK + ' ' + AI_NEW + ' </div>');
  assert('NEW — (1.2) the old second sentence «Δεν σου λέω τι να κάνεις πριν βρεις τι πραγματικά ρωτάς.» is gone from the whole file (replaced, not added)', !CODE.includes('Δεν σου λέω τι να κάνεις') && !raw.includes(AI_OLD));
  assert('GUARD — (1.3) «Είμαι τεχνητή νοημοσύνη.» (the AI disclosure, EU AI Act Art. 50) appears exactly once in the app and it is the first words of the entry screen',
    countStr(CODE, 'Είμαι τεχνητή νοημοσύνη.') === 1 && ENTRY.replace(/\s+/g, ' ').indexOf('Είμαι τεχνητή νοημοσύνη.') === ENTRY.replace(/\s+/g, ' ').indexOf('<div style={{fontSize:"13px"') + '<div style={{fontSize:"13px",color:"#fffaef",lineHeight:1.6,marginBottom:"10px",textAlign:"left"}}> '.length);
  assert('GUARD — (1.4) the invitation under it is unchanged («' + INVITE + '») and the start button is unchanged («' + BUTTON + '»)',
    ENTRY.replace(/\s+/g, ' ').includes('textAlign:"left"}}> ' + INVITE + ' </div>') && ENTRY.replace(/\s+/g, ' ').includes(BUTTON + ' </button>'));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 2. the entry screen, under the button — John's text 2 (privacy) and text 3 (microphone)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const BTN_END = ENTRY.indexOf('</button>');
const AFTER_BTN = BTN_END >= 0 ? ENTRY.slice(BTN_END + 9) : '';
const PRIV_DIV = '<div style={{marginTop:"14px",fontSize:"11px",color:"#ddd6cd",lineHeight:1.5,textAlign:"left"}}>' + PRIVACY + '</div>';
const MIC_DIV = '{speechSupported && (<div style={{marginTop:"8px",fontSize:"11px",color:"#ddd6cd",lineHeight:1.5,textAlign:"left"}}>' + MIC + '</div>)}';
{
  assert('NEW — (2.1) under the start button there is the line «' + PRIVACY + '» (11px, #ddd6cd, 14px below the button, left)', AFTER_BTN.includes(PRIV_DIV));
  assert('NEW — (2.2) it is the FIRST thing after the button (nothing between the button and the privacy line)', AFTER_BTN.replace(/^\s+/, '').startsWith(PRIV_DIV));
  assert('NEW — (2.3) the privacy line exists exactly once in the app (the memory panel and the consent card keep their own approved texts)', countStr(CODE, PRIVACY) === 1);
  assert('NEW — (3.1) under the privacy line there is the line «' + MIC + '» (11px, #ddd6cd, 8px below it, left)', AFTER_BTN.includes(MIC_DIV));
  assert('NEW — (3.2) it is shown ONLY where the browser has a speech API — the same condition (`speechSupported`) that shows the 🎙 button — and it comes right after the privacy line',
    AFTER_BTN.replace(/^\s+/, '').startsWith(PRIV_DIV) && AFTER_BTN.replace(/^\s+/, '').slice(PRIV_DIV.length).replace(/^\s+/, '').startsWith(MIC_DIV));
  assert('NEW — (3.3) the line exists exactly once in the app', countStr(CODE, MIC) === 1);
  assert('GUARD — (3.4) the symbol in the text is the very symbol of the button (U+1F399, the same code point), so the person sees the same sign', (() => {
    const b = CODE.match(/\{isListening\?"◉":"([^"]+)"\}/); return !!b && b[1] === '\u{1F399}' && MIC.includes(b[1]) && b[1].codePointAt(0) === 0x1F399 && [...b[1]].length === 1;
  })());
  assert('GUARD — (3.5) the 🎙 button itself is untouched: still rendered only when speechSupported, still next to «Go»', /\{speechSupported && <button className=\{`mic-btn \$\{isListening\?"active":""\}`\} onClick=\{isListening\?stopListening:startListening\} disabled=\{loading\}>/.test(CODE));
  assert('GUARD — (3.6) `speechSupported` is still declared once, by the same test of the browser (the standard and the webkit API, safe without a window)',
    count(CODE, /const speechSupported = /g) === 1 && /const speechSupported = typeof window !== "undefined" && !!\(window\.SpeechRecognition \|\| window\.webkitSpeechRecognition\);/.test(CODE));
  assert('NEW — (3.6b) `speechSupported` is now used in exactly two places — the 🎙 button and this line — plus its declaration (3 mentions; before: 2)', count(CODE, /speechSupported/g) === 3);
  assert('NEW — (3.7) the order on the screen is: AI line → invitation → button → privacy → microphone → (?rec=1 block, only for testers)', (() => {
    const t = ENTRY.replace(/\s+/g, ' '); const k = [AI_NEW, INVITE, BUTTON, PRIVACY, MIC].map(s => t.indexOf(s));
    return k.every(x => x >= 0) && k.every((x, n) => n === 0 || k[n - 1] < x);
  })());
  assert('GUARD — (3.8) the tester block of ?rec=1 is still there, still gated by recMode and the stored count, and it is the last thing of the entry screen (after everything new)', ENTRY_END > ENTRY_AT && CODE.slice(ENTRY_END, ENTRY_END + 300).includes('{TESTER_TEXTS.line}'));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 3. the claims of (2) and (3) are TRUE in the code — a change of the code means the text has to be read again
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'), 'utf8');
  assert('GUARD — (4.1) (2) the app has exactly ONE network call, fetch("/api/aura"), and no beacon, XHR or socket', count(CODE, /fetch\(/g) === 1 && CODE.includes('fetch("/api/aura"') && !/sendBeacon|new XMLHttpRequest|new WebSocket/.test(CODE));
  assert('GUARD — (4.2) (2) api/aura.js sends it to Anthropic (https://api.anthropic.com/v1/messages) and to no other host', count(api, /https:\/\/[a-z0-9.-]+/g) >= 1 &&
    [...new Set(api.match(/https:\/\/[a-z0-9.-]+/g) || [])].every(h => h === 'https://api.anthropic.com') && api.includes('https://api.anthropic.com/v1/messages'));
  assert('GUARD — (4.3) (3) the app never touches audio: no getUserMedia, MediaRecorder, AudioContext, webkitAudioContext, createMediaStreamSource, AudioWorklet or mediaDevices anywhere in the source',
    !/getUserMedia|MediaRecorder|AudioContext|webkitAudioContext|createMediaStreamSource|AudioWorklet|mediaDevices/.test(raw));
  const SL = (() => { const a = CODE.indexOf('const startListening = useCallback('); return a < 0 ? '' : CODE.slice(a, CODE.indexOf('\n', a)); })();
  assert('GUARD — (4.4) (3) what the 🎙 does: it asks the browser (SpeechRecognition / webkitSpeechRecognition, Greek), takes ONLY the text of the result into the box, and sends nothing',
    SL.length > 200 && /window\.SpeechRecognition \|\| window\.webkitSpeechRecognition/.test(SL) && /r\.lang="el-GR"/.test(SL) && /r\.onresult=/.test(SL) && /setInput\(/.test(SL) &&
    !/fetch\(|handleSubmit|callAura|sendBeacon|Blob|FileReader|\.audio|audioTrack/.test(SL));
  assert('GUARD — (4.5) (1) «Δεν δίνω συμβουλές»: the paid screen where ways may be proposed (the Coach, ADR 4/10) is closed — STAGE_A_COACH_OFFER = false. If it is opened, this sentence must be read again',
    /const STAGE_A_COACH_OFFER = false;/.test(CODE));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 4. the OLD first screen, 4th line — John's text 4 (changes decision 18/10 (7): the gold words)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const lines = INTRO.split('\n').map(s => s.trim()).filter(s => s.startsWith('<div style={{marginBottom:') || s.startsWith('<div style={{color:"#ffd560"'));
  assert('TEST SETUP — the old first screen has its 7 lines (tagline excluded)', lines.length === 7);
  assert('NEW — (5.1) the 4th line is exactly «Μετά βρίσκεις εσύ ένα μικρό βήμα και πότε θα το κάνεις.» — «ένα μικρό βήμα» in gold (#ffd560), the rest in the bright colour of the line (#f6f0e6)', lines[3] === L4_NEW_LINE);
  assert('NEW — (5.2) both old sentences are gone from the whole file («Μετά βλέπεις τις επιλογές σου καθαρά…», «Και αποφασίζεις τι κρατάς και τι αφήνεις.», «τι κερδίζεις, τι πληρώνεις.»)',
    !raw.includes('Μετά βλέπεις τις επιλογές') && !raw.includes('Και αποφασίζεις τι κρατάς') && !raw.includes('τι κερδίζεις, τι πληρώνεις'));
  assert('NEW — (5.3) the gold words of the intro are now: «δική σου ερώτηση», «άλλη ρίζα», «ένα μικρό βήμα», the goal line and the last line — and «τι κερδίζεις, τι πληρώνεις.» is not among them',
    (INTRO.match(/<span style=\{\{color:"#ffd560"\}\}>([^<]+)<\/span>/g) || []).map(x => x.replace(/<[^>]+>/g, '')).join('|') === 'δική σου ερώτηση|άλλη ρίζα|ένα μικρό βήμα');
  // GUARD — the other six lines are word for word what they were (only the 4th changes)
  assert('GUARD — (5.4) line 1: «Πολλές φορές έχεις ένα πρόβλημα, ένα δίλημμα, ή κάτι που δεν μπορείς να εκφράσεις ακριβώς.» is unchanged',
    lines[0] === '<div style={{marginBottom:"16px",color:"#f6f0e6"}}>Πολλές φορές έχεις ένα πρόβλημα, ένα δίλημμα, ή κάτι που δεν μπορείς να εκφράσεις ακριβώς.</div>');
  assert('GUARD — (5.5) line 2: «Κάθε ερώτηση της εφαρμογής είναι δική σου ερώτηση — …» is unchanged',
    lines[1] === '<div style={{marginBottom:"16px"}}>Κάθε ερώτηση της εφαρμογής είναι <span style={{color:"#ffd560"}}>δική σου ερώτηση</span> — μία που δεν έχεις κάνει ακόμα στον εαυτό σου, ή δεν σκέφτηκες να την κάνεις.</div>');
  assert('GUARD — (5.6) line 3: «Γιατί πολλές φορές το πρόβλημα έχει άλλη ρίζα από αυτό που ζούμε και εκφράζουμε.» is unchanged',
    lines[2] === '<div style={{marginBottom:"16px",color:"#f6f0e6"}}>Γιατί πολλές φορές το πρόβλημα έχει <span style={{color:"#ffd560"}}>άλλη ρίζα</span> από αυτό που ζούμε και εκφράζουμε.</div>');
  assert('GUARD — (5.7) lines 5–7: «Στόχος δεν είναι η μασημένη λύση…», «Στόχος είναι να βγεις από το χάος…», «Εσύ στο τιμόνι, στα δικά σου προβλήματα.» are unchanged',
    lines[4] === '<div style={{marginBottom:"6px",color:"#f6f0e6"}}>Στόχος δεν είναι η μασημένη λύση που δίνουν όλοι.</div>' &&
    lines[5] === '<div style={{marginBottom:"18px",color:"#ffd560"}}>Στόχος είναι να βγεις από το χάος του μυαλού σου.</div>' &&
    lines[6].startsWith('<div style={{color:"#ffd560",fontFamily:"\'Cormorant Garamond\',serif",fontSize:"20px",lineHeight:1.35,marginTop:"22px"}}>Εσύ στο τιμόνι,<br/>στα δικά σου προβλήματα.</div>'));
  assert('GUARD — (5.8) the line is true of the DEFAULT flow: Stage A is on (STAGE_A_ENABLED = true) and it asks the smallest step, whether it fits in a day, and «Πότε;» — if the default changes, this line must be read again',
    /const STAGE_A_ENABLED = true;/.test(CODE) && /stepQ: "Ποιο είναι το πιο μικρό πράγμα που μπορείς να κάνεις γι' αυτό;"/.test(CODE) && /fitsQ: "Είναι τόσο μικρό που χωράει σε μία μέρα;"/.test(CODE) && /whenQ: "Πότε;"/.test(CODE));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 5. nothing else moved
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
{
  const api = fs.readFileSync(path.join(ROOT, 'api', 'aura.js'));
  const fp = api.toString('utf8').match(/core: \{ length: \d+, sha256: "([0-9a-f]{16})/);
  assert('GUARD — (6.1) the core prompt is still 7e52268becda7360 and api/aura.js is byte for byte the same (sha256 675564a7985438c8…): this item is texts of the screens only', !!fp && fp[1] === '7e52268becda7360' && sha(api).startsWith('675564a7985438c8'));
  assert('GUARD — (6.2) line 912 of src/App.jsx is the same (sha256 of the line)', sha(raw.split('\n')[911]).startsWith('287fb3ce5ee3c1fb'));
  assert('GUARD — (6.3) the entry screen keeps its gate (an empty, unstarted session) and its start button calls the same functions', /\{messages\.length === 0 && !sessionStarted && introChoice === null && \(/.test(CODE) &&
    ENTRY.includes('setIntroChoice("direct");setSessionStarted(true);recordTelemetry("session_started");setTimeout(()=>textareaRef.current?.focus(),50);'));
  assert('GUARD — (6.4) the old first screen still ends with the same two buttons and remembers the visit in the same place («aura_intro_seen»)',
    (INTRO + CODE.slice(INTRO_END, INTRO_END + 700)).includes('className="intro-continue"') && CODE.slice(INTRO_END, INTRO_END + 700).includes('localStorage.setItem("aura_intro_seen","1")'));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
