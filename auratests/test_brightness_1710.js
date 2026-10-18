// AURA — JOHN'S DECISION, 17/10/2026 (ADR «17 Οκτωβρίου (στ)»): with the background image gone, the text may use the freed space,
// and everything the screen shows as letters — inside the boxes too — is 60% brighter.
//
//   1  SPACE: the 90px on the left of `.root` was there for the image strip only. It goes; the text gets the same 18px each side.
//   2  BRIGHTER BY 60%: every text colour × 1.6. Where × 1.6 would pass white, the colour is brightened only as far as white allows,
//      keeping its hue (a warm white stays warm, gold stays gold) — never a bare #ffffff. Rule: factor = min(1.6, 255 / brightest channel).
//   3  LETTERS ONLY: lines, borders and backgrounds keep their colours. Where one variable served both (gold, gold-dim, green, red),
//      the letters get their own variable (`--gold-text` …) and the borders keep the old one.
//   4  The same for the colour #root gives inherited text (index.html) and for the error screen (main.jsx). The downloaded map
//      (its own page, not the screen) is not touched.
//   5  THE DIMMEST LETTERS (John, after seeing them: «Να φαίνονται καθαρά»): the near-black ones — «ΜΝΗΜΗ», «ΑΡΧΕΙΟ», «AURA»,
//      «1 ανταλλαγή» (--text-dim), «skip», the root card's «Τι ήξερες» / «Τι βρήκες» — get the light of the secondary letters, #8a8380.
const fs = require('fs');
const path = require('path');
function findFile(cands) {
  for (const c of cands) { const x = path.join(__dirname, c); if (fs.existsSync(x)) return x; }
  return null;
}
const APP = findFile(['/../src/App.jsx', '/App.jsx', '/src/App.jsx', '/../App.jsx']);
const raw = fs.readFileSync(APP, 'utf8');
const INDEX = findFile(['/../index.html', '/index.html']);
const MAIN = findFile(['/../src/main.jsx', '/main.jsx', '/src/main.jsx']);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// The rule, written out here independently of the app.
function brighten(c) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map(x => x + x).join('') : m[1];
  const rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const f = Math.min(1.6, 255 / Math.max(...rgb, 1));
  return '#' + rgb.map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('');
}
function brightenRgba(s) {
  const m = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(s.replace(/\s+/g, ''));
  if (!m) return null;
  const rgb = [m[1], m[2], m[3]].map(Number), f = Math.min(1.6, 255 / Math.max(...rgb, 1));
  return `rgba(${rgb.map(v => Math.round(v * f)).join(',')},${m[4]})`;
}
assert('RULE: × 1.6 for a dim colour', brighten('#565250') === '#8a8380');
assert('RULE: a bright colour stops at white with its hue kept (warm white, not #ffffff)', brighten('#dedad2') === '#fffaf1');
assert('RULE: gold stays gold', brighten('#c9a84c') === '#ffd560' && brightenRgba('rgba(201,168,76,0.9)') === 'rgba(255,213,96,0.9)');

const a = raw.indexOf('<style>{`'), b = raw.indexOf('`}</style>', a);
const CSS = a >= 0 && b > a ? raw.slice(a, b) : '';
const UI = raw.slice(raw.indexOf('const MessageBubble = memo('));
assert('LOCATED: the app\'s style block and its screen code', CSS.length > 10000 && UI.length > 100000);

// ── 1. Space ──────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const root = (/\.root\{[^}]*\}/.exec(CSS) || [''])[0];
  assert('SPACE: `.root` no longer keeps 90px on the left for the image strip — 18px each side', /padding:0 18px;/.test(root) && !/90px/.test(root));
  assert('SPACE: no background image anywhere on the screen (the image strip is gone for good)', !/you\.png|data:image/.test(raw));
}

// ── 2–3. Text 60% brighter; borders and backgrounds unchanged ──────────────────────────────────────────────────────────
const OLD_TEXT_VARS = { 'text-primary': '#dedad2', 'text-secondary': '#565250', 'text-dim': '#252320', 'text-user': '#68645e' };
const SECONDARY = brighten('#565250');                                   // #8a8380
const DIMMEST = { '#252320': SECONDARY, '#3a3632': SECONDARY, '#3a3a3a': SECONDARY };
const want1 = h => DIMMEST[h] || brighten(h);
const SHARED = { 'gold': '#c9a84c', 'gold-dim': '#6b5a28', 'green': '#4a7a4a', 'red': '#7a4a4a' };
{
  for (const [k, v] of Object.entries(OLD_TEXT_VARS))
    assert(`TEXT: --${k} (letters only) is ${v} → ${want1(v)}`, CSS.includes(`--${k}:${want1(v)};`));
  assert('DIMMEST: «ΜΝΗΜΗ», «ΑΡΧΕΙΟ», «AURA», «1 ανταλλαγή» have the secondary letters\' light — clearly visible', CSS.includes(`--text-dim:${SECONDARY};`) && CSS.includes(`--text-secondary:${SECONDARY};`));
  assert('DIMMEST: «skip» and the root card\'s labels too', new RegExp(`\\.intro-skip\\{[^}]*color:${SECONDARY}`).test(CSS) && new RegExp(`\\.warning-label\\{[^}]*color:${SECONDARY}`).test(CSS));
  for (const [k, v] of Object.entries(SHARED)) {
    assert(`SHARED: --${k} stays ${v} for lines, borders and backgrounds`, CSS.includes(`--${k}:${v};`));
    assert(`SHARED: the letters have their own --${k}-text: ${brighten(v)}`, CSS.includes(`--${k}-text:${brighten(v)};`));
  }
  const textVarUse = new RegExp(`(?<![\\w-])color:\\s*"?var\\(--(${Object.keys(SHARED).join('|')})\\)`, 'g');
  assert('SHARED: no letters left on a shared variable (style block and screen code)', !(raw.match(textVarUse) || []).length);
  // Lines and backgrounds on a shared variable, counted before the change: gold 4, gold-dim 5, green 3, red 3 — all still there.
  const LINES = { 'gold': 4, 'gold-dim': 5, 'green': 3, 'red': 3 };
  const lineUse = k => (raw.match(new RegExp(`(?<![\\w-])(?:border[\\w-]*|background[\\w-]*|borderColor|backgroundColor|box-shadow|boxShadow|outline[\\w-]*)\\s*:[^;}]*var\\(--${k}\\)`, 'g')) || []).length;
  assert('SHARED: every line and background on them is still there, unchanged', Object.entries(LINES).every(([k, n]) => lineUse(k) === n));
  assert('SHARED: the brighter --*-text variables colour letters only — never a line or a background',
    !/(?<![\w-])(?:border[\w-]*|background[\w-]*|borderColor|backgroundColor|box-shadow|boxShadow|outline[\w-]*)\s*:[^;}]*var\(--(?:gold|gold-dim|green|red)-text\)/.test(raw));
  assert('UNCHANGED: the line colours', CSS.includes('--border:#141414;') && CSS.includes('--border-mid:#1e1e1e;'));
}
// Every text colour that was on the screen before, by value: none may be left on a `color:`, and its brightened value must be there.
const OLD_HEX = ['#ddd8d0', '#888', '#3a3632', '#5a5650', '#1d1b18', '#ddd8cf', '#c9c4ba', '#c9a84c', '#b8a8a8', '#7a8a7a', '#3a3a3a',
  '#7a5a5a', '#8a8680', '#9a958c', '#7a7670', '#4a4845', '#e8d890', '#c4c0b8', '#6a6660', '#8a7a52', '#e8e4dc', '#e8a0a0',
  '#d8d4cc', '#a8a49c', '#9a9690', '#c9c5bc'];
const OLD_RGBA = ['rgba(201,168,76,0.9)', 'rgba(201,168,76,0.85)', 'rgba(201,168,76,0.75)'];
{
  const colorDecls = s => (s.match(/(?<![\w-])color:\s*["']?(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\))/g) || []).map(x => x.replace(/^color:\s*["']?/, '').toLowerCase());
  const css = colorDecls(CSS), ui = colorDecls(UI);
  const leftCss = OLD_HEX.filter(h => css.includes(h)), leftUi = [...OLD_HEX, ...OLD_RGBA].filter(h => ui.includes(h));
  assert('TEXT: no text colour of before is left in the style block' + (leftCss.length ? ' — left: ' + leftCss.join(' ') : ''), !leftCss.length);
  assert('TEXT: no text colour of before is left in the screen code' + (leftUi.length ? ' — left: ' + leftUi.join(' ') : ''), !leftUi.length);
  const want = OLD_HEX.map(want1), missing = want.filter(h => !css.includes(h) && !ui.includes(h));
  assert('TEXT: each one is there 60% brighter (or as bright as white allows)' + (missing.length ? ' — missing: ' + missing.join(' ') : ''), !missing.length);
  assert('TEXT: the gold of the screen code with its transparency kept', OLD_RGBA.every(x => ui.includes(brightenRgba(x))));
  assert('INSIDE THE BOXES: the placeholder «Γράψε...», the box texts (warning cards, the step card) and the buttons\' letters too',
    CSS.includes(`.textarea::placeholder{color:${brighten('#4a4845')};`) && new RegExp(`\\.warning-text\\{[^}]*color:${brighten('#9a958c')}`).test(CSS) &&
    new RegExp(`\\.choice-btn\\{[^}]*color:var\\(--text-secondary\\)`).test(CSS));
  assert('UNCHANGED: the lines of the boxes (a border colour of before is still there)', /border:"1px solid rgba\(201,168,76,0\.22\)"/.test(UI));
}

// ── 4. Inherited text and the error screen ─────────────────────────────────────────────────────────────────────────────
{
  const idx = INDEX ? fs.readFileSync(INDEX, 'utf8') : '', main = MAIN ? fs.readFileSync(MAIN, 'utf8') : '';
  assert('INHERITED: #root\'s text colour (index.html) is brighter too, its background unchanged',
    idx.includes(`html, body, #root { height: 100%; background: #080808; color: ${brighten('#c4c0b8')}; }`));
  assert('ERROR SCREEN: main.jsx letters brighter too, background unchanged', main.includes(`background: '#080808', color: '${brighten('#c4c0b8')}'`));
  const exp = raw.indexOf('body{background:#141414;color:#dedad2;');
  assert('NOT THE SCREEN: the downloaded map keeps its own colours', exp > 0);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
