// AURA — THE SHEET LEADS WITH WHAT ONLY AURA HAS
//
// The four things that make this product structurally different from a generic summary were all
// on the sheet already, and all rendered as equals: four cards among six, same size, same weight.
// Nothing told the reader which of them no other tool could produce.
//
//   Β1  Κ4 CONFIRMATION. The pattern zone printed ««χρόνος» — 3 φορές» and never said that the
//       PERSON confirmed it. Measured while building this: nothing recorded the «Ναι» at all —
//       «Όχι» persisted a refusal and «Μερικώς» held the pattern back, but the affirmative just
//       dismissed the card. So the confirmation had to be recorded before it could be printed.
//       It is a fact about an action the person took, never a claim about them.
//
//   Β2  ΤΟ ΑΓΝΩΣΤΟ leads. It already moved above the roads; now it is the largest thing on the
//       page. A generic summary never opens with what you do not know, because it reads as
//       failure. Here it is the finding — the prompt's own rule calls it a prerequisite.
//
//   Β3  peak REACHES THE SHEET. Every anchor already stores `peak`: the person's own verbatim
//       reply at the moment a Socratic Doubt or First Insight Mirror question tested their
//       assumption, with the triggering question identified by literal string. buildRecurringSignal
//       mapped occurrences to {text, at, before} and dropped it. The free Αρχείο has been showing
//       it all along; the paid sheet never did.
//
//   Β4  THE ORIGIN MARKS GET A LEGEND. The sheet already labels every road line SUPPORTED /
//       MILD / SEVERE. Unexplained, that is decoration; explained, it is the differentiator.
//
//   Β5  SESSION NUMBER, from the second session on. «1η συνεδρία» on a first sheet reads as
//       thin rather than as evidence, so it is conditional by design, not by accident.
//
// NOT `shift`. It is the last ASSISTANT message — AURA's words, not the person's. It stays off
// the sheet, and its unlabelled appearance in the Αρχείο is a separate, small correction.

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
function ex(n) {
  const s = CODE.indexOf('function ' + n + '(');
  if (s < 0) return null;
  const e = CODE.indexOf('\n}', s);
  return e < 0 ? null : CODE.slice(s, e + 2);
}
let buildBlueprintZones = null, buildRecurringSignal = null, patternKey = null;
for (const n of ['buildBlueprintZones', 'buildRecurringSignal', 'patternKey']) {
  const src = ex(n);
  assert(n + ' located', !!src);
  if (src) { try { eval(n + ' = ' + src.slice(src.indexOf('function'))); }
             catch (e) { console.log('FAIL — ' + n + ' eval: ' + e.message); failed++; } }
}
const renderSheet = (() => {
  const a = CODE.indexOf('function exportBlueprint');
  const b = CODE.indexOf('const blob = new Blob', a);
  if (a < 0 || b < 0) return null;
  const body = CODE.slice(CODE.indexOf('{', CODE.indexOf('(', a)) + 1, b);
  try { return eval('(function (ankerText, zones, meta) {' + body + ' return html; })'); }
  catch (err) { console.log('FAIL — renderer lift: ' + err.message); failed++; return null; }
})();
assert('The real sheet renderer was lifted', typeof renderSheet === 'function');

const anch = (text, at, before, peak) => ({
  category: 'trajectory_word', text, createdAt: at, before, peak: peak || null,
  shift: 'Η AURA ΕΚΛΕΙΣΕ ΕΤΣΙ', status: 'resolved',
});
const MEM = {
  anchors: [
    anch('χρόνος', 1000, 'Δεν ξέρω αν να αλλάξω δουλειά.', 'Μάλλον φοβάμαι να χάσω τη σταθερότητα.'),
    anch('χρόνος', 2000, 'Πάλι το ίδιο θέμα.', 'Τελικά δεν είναι ο χρόνος, είναι η άδεια.'),
  ],
  rejectedPatterns: [],
};
const KEY = typeof patternKey === 'function' ? patternKey({ kind: 'recurring', word: 'χρόνος' }) : null;
const REC = typeof buildRecurringSignal === 'function' ? buildRecurringSignal(MEM, 'χρόνος') : null;
assert('FIXTURE: the real signal builder produces two occurrences',
  !!REC && REC.count === 2);

// ══ Β3 — peak reaches the signal, then the sheet ══════════════════════════
if (REC) {
  assert('Β3: the signal carries peak — it used to be dropped here',
    REC.occurrences.every(o => 'peak' in o));
  assert('Β3: byte-for-byte, the person\'s own sentence',
    REC.occurrences[0].peak === 'Μάλλον φοβάμαι να χάσω τη σταθερότητα.');
  assert('Β3: it still carries before, unchanged',
    REC.occurrences[1].before === 'Πάλι το ίδιο θέμα.');
  assert('Β3: shift is NOT carried — those are AURA\'s words',
    REC.occurrences.every(o => !('shift' in o)));
  assert('Β3: an anchor with no peak yields null, never a filled blank',
    (() => { const r = buildRecurringSignal(
        { anchors: [anch('χρόνος', 1, 'α'), anch('χρόνος', 2, 'β')], rejectedPatterns: [] }, 'χρόνος');
      return r && r.occurrences.every(o => o.peak === null); })());
}

// ══ Β1 — the Κ4 confirmation is recorded, then printed ════════════════════
if (typeof buildBlueprintZones === 'function' && REC) {
  const zones = k => buildBlueprintZones(MEM, REC, 'Αν επιτρέπεται δεύτερη εργασία', null, 'Μπήκα έτσι.', null, k);
  const zc = zones(KEY).find(z => z.key === 'recurring');
  const zu = zones(null).find(z => z.key === 'recurring');
  assert('Β1: a confirmed pattern is marked confirmed', !!zc && zc.confirmed === true);
  assert('Β1: an unconfirmed one is NOT — silence is not consent',
    !!zu && zu.confirmed === false);
  assert('Β1: a confirmation for a DIFFERENT word does not transfer',
    (() => { const z = zones('recurring:άλλο').find(x => x.key === 'recurring');
             return !!z && z.confirmed === false; })());
  assert('Β1: the confirmation is compared against the key the builder derives itself',
    (() => { const src = ex('buildBlueprintZones') || ''; return /confirmedKey\s*===\s*recurKey/.test(src); })());
}

// ── It has to be recorded before it can be printed ────────────────────────
const GATE = (() => {
  const i = CODE.indexOf('{recognitionPending && !memoryPromptPending && (');
  return i < 0 ? '' : CODE.slice(i, CODE.indexOf('{memoryPromptPending && (', i));
})();
assert('Β1: the gate card was located', GATE.length > 400);
assert('Β1: «Ναι» now records the confirmation instead of only dismissing the card',
  /confirmedPattern\.current\s*=\s*patternKey\(/.test(GATE));
assert('Β1: «Όχι» and «Μερικώς» record no confirmation',
  (GATE.match(/confirmedPattern\.current\s*=\s*patternKey\(/g) || []).length === 1);
assert('Β1: the confirmation is session-scoped — no new stored category',
  /const confirmedPattern\s*=\s*useRef\(null\)/.test(CODE) &&
  !/confirmedPattern[\s\S]{0,120}saveMemory/.test(CODE));
assert('Β1: it is cleared by resetSession',
  /const resetSession[\s\S]{0,4500}?confirmedPattern\.current\s*=\s*null/.test(CODE));

// ══ Β2 / Β4 / Β5 — on the page ════════════════════════════════════════════
if (renderSheet && typeof buildBlueprintZones === 'function' && REC) {
  const z = buildBlueprintZones(MEM, REC, 'Αν επιτρέπεται δεύτερη εργασία', null, 'Μπήκα έτσι.',
    { map: { roads: [{ name: 'Δρόμος Α', gain: 'κ', cost: 'κο' }], unknown: null },
      provenance: null, answers: null }, KEY);
  const html = renderSheet('χρόνος', z, { session: 3 });

  assert('Β2: the unknown has its own headline rendering, not another equal card',
    /class="unknown-lead"/.test(html));
  assert('Β2: and it carries the person\'s own words',
    html.indexOf('Αν επιτρέπεται δεύτερη εργασία') !== -1);
  assert('Β3: the peak lines are on the sheet',
    html.indexOf('Μάλλον φοβάμαι να χάσω τη σταθερότητα.') !== -1);
  assert('Β1: the confirmation is visible to the reader',
    /αναγνώρισες/.test(html));
  assert('Β4: the origin marks are explained where they are used',
    /class="legend"/.test(html) && /λόγια σου/.test(html));
  assert('Β5: the session number appears from the second session on',
    html.indexOf('3η συνεδρία') !== -1);

  const first = renderSheet('χρόνος', z, { session: 1 });
  assert('Β5: and NOT on a first sheet, where it would read as thin',
    first.indexOf('1η συνεδρία') === -1 && first.indexOf('συνεδρία') === -1);
  const none = renderSheet('χρόνος', z);
  assert('Β5: a caller with no session meta renders no session line',
    none.indexOf('συνεδρία') === -1);

  const noRoads = renderSheet('χρόνος',
    buildBlueprintZones(MEM, REC, null, null, 'Μπήκα έτσι.', null, KEY), { session: 3 });
  assert('Β4: no legend when there are no marks to explain',
    !/class="legend"/.test(noRoads));
  assert('Β3: peak is escaped like everything else',
    (() => {
      const m = { anchors: [anch('χ', 1, 'α', '<img src=x onerror=alert(1)>'), anch('χ', 2, 'β', 'ν')],
                  rejectedPatterns: [] };
      const r = buildRecurringSignal(m, 'χ');
      return renderSheet(null, buildBlueprintZones(m, r, null, null, 'α', null, null))
        .indexOf('<img src=x') === -1; })());
}

// ══ SCOPE ═════════════════════════════════════════════════════════════════
assert('SCOPE: shift never reaches the sheet',
  !/z\.shift|occ\.shift|\.shift\b/.test((ex('buildBlueprintZones') || '') + (ex('buildRecurringSignal') || '')));
assert('SCOPE: no refusal count was added — Ε2 stays out until it is tested',
  !/rejectedPatterns\.length/.test(CODE));
assert('PASSIVE: none of this is wired into the prompt',
  !/confirmedPattern|unknown-lead|confirmedKey/.test(PROMPT));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
