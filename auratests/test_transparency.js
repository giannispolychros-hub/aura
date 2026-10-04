// AURA — TRANSPARENCY: AI disclosure, where messages go, retention, and no Google fonts
//
// FOUNDER-APPROVED TEXTS (2026-10-04), each pinned verbatim so it cannot drift:
//
// (α) EU AI Act, Article 50: a person must be told they are interacting with an AI system. Before this
//     change the word «τεχνητή νοημοσύνη» appeared nowhere a user could read it. The entry screen —
//     the one screen shown at the start of EVERY new session (the intro can be skipped) — now opens
//     with it, above the existing invitation.
// (β) The memory texts said «Τα πάντα στη συσκευή σου». True of memory, false of the conversation:
//     every reply sends the whole session, through our server, to Anthropic. Both texts now say so,
//     and the panel states Anthropic's retention as the founder confirmed it (Anthropic Privacy
//     Center, updated 2026-07-01: deleted within 30 days unless flagged for a policy violation, up to
//     2 years; platform docs: never used for model training without express permission).
// (γ) The prompt's PRIVACY QUESTION line told the model to say «deleted within days». It now says the
//     same as the screen. This changes AURA_CORE_PERSONALITY: one cache write, paid knowingly
//     (digest pin updated in test_minimal_closing.js).
// (δ) Fonts were fetched from fonts.googleapis.com / fonts.gstatic.com on every visit, which hands the
//     visitor's IP to Google. They are now served from our own /fonts/ folder. Neither font has Greek
//     glyphs (only latin + latin-ext were ever loaded), so Greek text renders exactly as before.

const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const ROOT = path.dirname(path.dirname(APP)); // repo root (App.jsx lives in src/)
const INDEX = path.join(ROOT, 'index.html');
const FONTS_DIR = path.join(ROOT, 'public', 'fonts');

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
// What a reader of the screen sees: JSX comments and <br/> removed, whitespace collapsed.
function visible(src) {
  return src.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
            .replace(/<br\s*\/?>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
}
function region(startMarker, endMarker) {
  const a = CODE.indexOf(startMarker);
  if (a < 0) return '';
  const b = CODE.indexOf(endMarker, a);
  return b > a ? CODE.slice(a, b) : '';
}

// ── (α) ENTRY SCREEN: the AI disclosure ──────────────────────────────────────
const AI_LINE = 'Είμαι τεχνητή νοημοσύνη. Δεν σου λέω τι να κάνεις πριν βρεις τι πραγματικά ρωτάς.';
const INVITE = "Δεν χρειάζεται να το έχεις καθαρό. Γράψ' το όπως είναι.";
const ENTRY = visible(region('{messages.length === 0 && !sessionStarted && introChoice === null && (', 'setIntroChoice("direct")'));
assert('ENTRY: the entry screen was located', ENTRY.length > 50);
assert('ENTRY: it states, word for word, that the person is talking to an AI', ENTRY.includes(AI_LINE));
assert('ENTRY: the existing invitation is still there', ENTRY.includes(INVITE));
assert('ENTRY: the AI line comes BEFORE the invitation',
  ENTRY.indexOf(AI_LINE) >= 0 && ENTRY.indexOf(AI_LINE) < ENTRY.indexOf(INVITE));
assert('ENTRY: it is the entry screen of every new session (gated only on an empty, unstarted session)',
  /\{messages\.length === 0 && !sessionStarted && introChoice === null && \(/.test(CODE));
assert('ENTRY: the disclosure appears exactly once in the app', CODE.split(AI_LINE).length - 1 === 1);

// ── (β) MEMORY PANEL ─────────────────────────────────────────────────────────
const PANEL_TEXT = [
  'Τα μηνύματά σου, μαζί με την υπόλοιπη συζήτηση της συνεδρίας, στέλνονται μέσω του διακομιστή μας στην Anthropic, την εταιρεία του μοντέλου που απαντά.',
  'Ο διακομιστής μας δεν τα αποθηκεύει.',
  'Η Anthropic δεν τα χρησιμοποιεί για εκπαίδευση μοντέλων και κατά κανόνα τα διαγράφει μέσα σε 30 ημέρες.',
  'Αν ενεργοποιήσεις τη μνήμη, αποθηκεύονται μόνο στη συσκευή σου μοτίβα, μετρητές και, για το Αρχείο, λίγα αυτούσια λόγια ανά συνεδρία.',
  'Ποτέ ολόκληρη η συνομιλία.',
  'Μπορείς να τα διαγράψεις οποιαδήποτε στιγμή.',
];
const PANEL = visible(region('{showMemoryPanel && (', 'mem-panel-actions'));
assert('PANEL: the memory panel was located', PANEL.length > 50);
PANEL_TEXT.forEach((t, k) => assert(`PANEL: sentence ${k + 1} is present verbatim («${t.slice(0, 40)}…»)`, PANEL.includes(t)));
assert('PANEL: the order is the approved one (Anthropic, then retention, then device)',
  PANEL_TEXT.every((t, k) => k === 0 || PANEL.indexOf(PANEL_TEXT[k - 1]) < PANEL.indexOf(t)));
assert('PANEL: the false absolute «Τα πάντα στη συσκευή σου» is gone', !/Τα πάντα στη συσκευή σου/.test(PANEL));

// ── (β) CONSENT CARD ─────────────────────────────────────────────────────────
const CONSENT_TEXT = 'Αν πεις ναι, κρατιούνται στη συσκευή σου μοτίβα και μετρητές, και για το Αρχείο λίγα αυτούσια λόγια ανά συνεδρία. ' +
  'Ποτέ ολόκληρη η συνομιλία. Σε επόμενες συνεδρίες, μικρά κομμάτια τους (π.χ. μια ανοιχτή απόφαση) στέλνονται μαζί με τα μηνύματά σου ' +
  'στο μοντέλο, για να συνεχίσει από εκεί. Μπορείς να τα διαγράψεις οποιαδήποτε στιγμή.';
const CONSENT = visible(region('{memoryPromptPending && (', 'choice-btns'));
assert('CONSENT: the consent card was located', CONSENT.includes('Θέλεις να το κρατήσω'));
assert('CONSENT: the approved text is present verbatim', CONSENT.includes(CONSENT_TEXT));
assert('CONSENT: the false absolute «Τα πάντα παραμένουν στη συσκευή σου» is gone',
  !/Τα πάντα παραμένουν στη συσκευή σου/.test(CONSENT));
assert('CONSENT: what it says is sent to the model is what the code sends (an open decision from a past session)',
  /Open decision from previous session/.test(CODE));

// ── (γ) PROMPT: the PRIVACY QUESTION says what the screen says ───────────────
const PQ = (PROMPT.match(/PRIVACY QUESTION[^\n]*/) || [''])[0];
assert('PROMPT: the PRIVACY QUESTION line was located', PQ.length > 100);
assert('PROMPT: retention is stated as 30 days', /30 days/.test(PQ));
assert('PROMPT: the unverified «deleted within days» is gone', !/deleted within days/.test(PQ));
assert('PROMPT: the flagged-data exception (up to 2 years) is stated, not hidden', /2 years/.test(PQ));
assert('PROMPT: no training without express permission', /not used to train[\s\S]{0,80}express permission/.test(PQ));
assert('PROMPT: the line is still asked-only, never volunteered', /do not repeat it unprompted/.test(PQ));

// ── (δ) FONTS: served by us, never by Google ─────────────────────────────────
const indexHtml = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, 'utf8') : '';
assert('FONTS: index.html located', indexHtml.length > 100);
assert('FONTS: index.html no longer contacts Google Fonts', !/fonts\.(googleapis|gstatic)\.com/.test(indexHtml));
assert('FONTS: App.jsx no longer contacts Google Fonts (app and exported Blueprint)', !/fonts\.(googleapis|gstatic)\.com/.test(raw));
assert('FONTS: index.html loads our own stylesheet', /<link[^>]+href="\/fonts\/fonts\.css"/.test(indexHtml));
const cssPath = path.join(FONTS_DIR, 'fonts.css');
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
assert('FONTS: public/fonts/fonts.css exists', css.length > 100);
const faces = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map(m => m[1]);
const urls = faces.map(f => (f.match(/url\(['"]?\/fonts\/([^'")]+)['"]?\)/) || [])[1]).filter(Boolean);
assert(`FONTS: every @font-face points to a file that exists (${urls.length} faces)`,
  urls.length === faces.length && urls.length > 0 && urls.every(u => fs.existsSync(path.join(FONTS_DIR, u))));
// Exactly what the Google URL used to load: Cormorant Garamond 300/400 × normal/italic, DM Mono 300/400.
const need = [
  ['Cormorant Garamond', '300', 'normal'], ['Cormorant Garamond', '300', 'italic'],
  ['Cormorant Garamond', '400', 'normal'], ['Cormorant Garamond', '400', 'italic'],
  ['DM Mono', '300', 'normal'], ['DM Mono', '400', 'normal'],
];
for (const [fam, w, st] of need) {
  const has = sub => faces.some(f => f.includes(`'${fam}'`) && new RegExp(`font-weight:\\s*${w}\\b`).test(f) &&
    new RegExp(`font-style:\\s*${st}\\b`).test(f) && f.includes(`-${sub}-${w}-${st}.woff2`));
  assert(`FONTS: ${fam} ${w} ${st} — latin and latin-ext both served`, has('latin') && has('latin-ext'));
}
assert('FONTS: exactly 12 faces — 6 styles × (latin, latin-ext)', faces.length === 12);
assert('FONTS: every face swaps in (no invisible text while loading)', faces.length === 12 && faces.every(f => /font-display:\s*swap/.test(f)));
assert('FONTS: every face is limited to its subset (unicode-range), so Greek still uses the device font',
  faces.length === 12 && faces.every(f => /unicode-range:/.test(f)));
assert('FONTS: the SIL Open Font License travels with each font',
  fs.existsSync(path.join(FONTS_DIR, 'OFL-cormorant-garamond.txt')) && fs.existsSync(path.join(FONTS_DIR, 'OFL-dm-mono.txt')));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
