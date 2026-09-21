// AURA — THE ΑΡΧΕΙΟ SAYS WHOSE WORDS ARE WHOSE
//
// THE FINDING. Each card in the free Αρχείο renders four things from one anchor:
//
//   before  the person's opening message      «…»   verbatim, theirs
//   peak    their reply at the moment a question tested their assumption   «…»  theirs
//   shift   THE LAST ASSISTANT MESSAGE — AURA's own words
//   text    the phrase they chose to keep     theirs
//
// Three of the four are the person's. The fourth is AURA's, and it was rendered among them with
// no label — only a slightly different colour, reusing the `gallery-before` class meant for
// their opening line. A reader has no way to tell which sentence they wrote.
//
// This is the same class of error corrected twice already in this codebase — the consent copy
// that claimed no conversation text is stored, and the Blueprint footer that claimed every line
// was the person's own words. Both said something about the page that had stopped being true.
// Here nothing is claimed in words at all, which is how it survived: the page simply presents
// AURA's sentence as if it were one of theirs.
//
// FIXED BY LABELLING, NOT BY REMOVING. The sentence is not wrong to keep — it is the end of that
// session and the person may well want it. What was wrong was the silence about its author.

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

const CARD = (() => {
  const i = CODE.indexOf('className="gallery-card"');
  if (i < 0) return '';
  const j = CODE.indexOf('</div>', CODE.indexOf('gallery-kept">', i));
  return j < 0 ? '' : CODE.slice(i, j);
})();
assert('The archive card was located', CARD.length > 200);

// ── The person's own lines stay as they are ───────────────────────────────
assert('THEIRS: the opening line is still quoted, unchanged',
  /gallery-before">«\{a\.before\}»/.test(CARD));
assert('THEIRS: the peak line is still quoted, unchanged',
  /gallery-peak">«\{a\.peak\}»/.test(CARD));
assert('THEIRS: the kept phrase is still there', /gallery-kept">\{a\.text\}/.test(CARD));

// ── AURA's line is named as AURA's ────────────────────────────────────────
assert('AURA: the closing sentence is labelled, not presented among their words',
  /gallery-aura-label/.test(CARD));
// MEASURED: `/AURA/.test(CARD)` was satisfied by the explanatory COMMENT above the label, so
// renaming the label to «η σκέψη σου» — actively claiming AURA's sentence as the person's —
// left the suite green. Checked inside the label element's own text instead.
const LABEL_TEXT = (() => {
  const m = CARD.match(/gallery-aura-label">([^<]*)</);
  return m ? m[1] : '';
})();
assert('AURA: the label has text', LABEL_TEXT.trim().length > 0);
assert('AURA: that text names AURA, not the person', /AURA/.test(LABEL_TEXT));
assert('AURA: and it never calls the sentence theirs',
  !/σου\b|δικ[ήάό]/i.test(LABEL_TEXT));
assert('AURA: it no longer borrows the class meant for the person\'s opening line',
  !/\{a\.shift && <div className="gallery-before"/.test(CARD));
assert('AURA: it has its own class instead', /className="gallery-aura"/.test(CARD));
assert('AURA: the sentence itself is still shown — labelled, not deleted',
  /\{a\.shift\}/.test(CARD));
assert('AURA: the label appears only when there is a sentence to label',
  /\{a\.shift && </.test(CARD));

// ── Styling exists for the new class ──────────────────────────────────────
assert('CSS: the new class is defined', /\.gallery-aura\{/.test(CODE));
assert('CSS: its label is defined', /\.gallery-aura-label\{/.test(CODE));
assert('CSS: no inline style is left behind doing the job a label should do',
  !/\{a\.shift && <div[^>]*style=\{\{/.test(CARD));

// ── Scope ─────────────────────────────────────────────────────────────────
assert('SCOPE: nothing was removed from the archive — this is a labelling fix',
  /a\.before/.test(CARD) && /a\.peak/.test(CARD) && /a\.shift/.test(CARD) && /a\.text/.test(CARD));
assert('SCOPE: the sheet is untouched — shift still never reaches it',
  !/shift/.test((() => {
    const i = CODE.indexOf('function buildBlueprintZones');
    return i < 0 ? '' : CODE.slice(i, CODE.indexOf('\n}', i));
  })()));
assert('PASSIVE: not wired into the prompt', !/gallery-aura/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
