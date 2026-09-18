// AURA — CONSENT & PROVENANCE INTEGRITY
//
// WHY THIS FILE EXISTS. A full classification of every point where AURA produces a claim about the
// user found two statements shown to the user that were factually wrong, and one mechanism running
// without consent. Wrong copy in a consent dialog is not a wording bug — it is the difference
// between informed consent and the appearance of it, and the Blueprint is a file the user keeps
// and shares.
//
// P2 — TWO FALSE STATEMENTS, both fixed by the commit this file first shipped with:
//   (a) The consent card and the memory panel both said "ποτέ κείμενο συνομιλίας" — never
//       conversation text. But createAnchor persists the phrase the user chose to keep, their
//       first message, one further message of theirs, and AURA's closing line, up to 100 entries,
//       and the Αρχείο renders them. Verbatim conversation text is exactly what is stored. The
//       true part of the claim — that the WHOLE conversation is never stored — survives; the
//       absolute was the lie.
//   (b) The Blueprint footer said "Είναι δικά σου λόγια" — these are your own words. The keystone
//       (the phrase they chose) genuinely is, and the code says so correctly. The three beats are
//       not: ΒΡΗΚΕΣ carries no sourcing requirement anywhere in the prompt, unlike ΦΕΥΓΕΙΣ ΜΕ
//       which carries the strictest one. The footer claimed a provenance the artifact cannot
//       guarantee for a third of its content.
//
// These assertions are about ACCURACY, so they are written as a coupling: what the code stores is
// pinned, and the copy must disclose it. If a later change adds a field to the anchor, the pin
// fails and the disclosure has to be revisited rather than silently drifting out of date again.

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
const CODE = raw.slice(0, _i) + raw.slice(_e);

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log('PASS — ' + label); }
  else { failed++; console.log('FAIL — ' + label); }
}

// ── WHAT IS ACTUALLY STORED — pinned, so the disclosure cannot drift ────────
const _caStart = CODE.indexOf('function createAnchor');
const _caEnd = CODE.indexOf('\n}', _caStart);
const ANCHOR_SRC = _caStart >= 0 ? CODE.slice(_caStart, _caEnd) : '';
assert('createAnchor located', ANCHOR_SRC.length > 100);
// [,:] not just : — `text` and `status` are ES6 shorthand properties with no colon, so a
// colon-only pin silently under-reports the two fields that matter most here.
const ANCHOR_FIELDS = [...ANCHOR_SRC.matchAll(/^\s{4}(\w+)[,:]/gm)].map(m => m[1]).sort();
assert(`ANCHOR SHAPE PINNED — exactly the known fields (found: ${ANCHOR_FIELDS.join(',')})`,
  ANCHOR_FIELDS.join(',') === 'before,category,closedAt,createdAt,id,peak,shift,status,text');
// Of those, four carry verbatim conversation content. This is the fact the copy must match.
assert('VERBATIM FIELDS CONFIRMED — text, before, peak and shift all hold conversation content',
  ['text', 'before', 'peak', 'shift'].every(f => ANCHOR_FIELDS.includes(f)));
assert('…and they are populated from real messages, not from labels',
  /extractBeforeMessage\(/.test(CODE) && /extractPeakMoment\(/.test(CODE) && /extractShiftSentence\(/.test(CODE));
assert('…and they are persisted only behind consent (every createAnchor save is gated)',
  (CODE.match(/createAnchor\(/g) || []).length - 1 ===
   (CODE.match(/createAnchor\([\s\S]{0,400}?(?:memory\.storageEnabled|willPersist)/g) || []).length);

// ── (a) THE CONSENT CARD ────────────────────────────────────────────────────
const _ccStart = CODE.indexOf('{memoryPromptPending && (');
const _ccEnd = CODE.indexOf('</div>\n          )}', _ccStart);
const CONSENT = _ccStart >= 0 ? CODE.slice(_ccStart, _ccEnd > _ccStart ? _ccEnd : _ccStart + 1400) : '';
assert('Consent card located', CONSENT.includes('Θέλεις να το κρατήσω'));
assert('CONSENT: the false absolute «ποτέ κείμενο συνομιλίας» is gone',
  !/ποτέ κείμενο συνομιλίας/i.test(CONSENT));
assert('CONSENT: the TRUE part survives — the whole conversation is still never stored',
  /ολόκληρη η συνομιλία|όλη η συνομιλία/i.test(CONSENT));
assert('CONSENT: it now discloses that some verbatim words ARE kept',
  /αυτούσι|δικά σου λόγια|λόγια σου/i.test(CONSENT));
assert('CONSENT: it still says where the data lives and that it is deletable',
  /συσκευή σου/i.test(CONSENT) && /(διαγρά|σβήσ)/i.test(CONSENT));

// ── (a) THE MEMORY PANEL — same claim, second place it was printed ──────────
const _mpStart = CODE.indexOf('{showMemoryPanel && (');
const _mpEnd = CODE.indexOf('Αρχείο: passive', _mpStart);
const PANEL = _mpStart >= 0 ? CODE.slice(_mpStart, _mpEnd > _mpStart ? _mpEnd : _mpStart + 3000) : '';
assert('Memory panel located', PANEL.includes('μνήμη —'));
assert('PANEL: the false absolute is gone here too',
  !/Ποτέ κείμενο συνομιλίας/i.test(PANEL));
assert('PANEL: it discloses the verbatim words the Αρχείο shows',
  /αυτούσι|δικά σου λόγια|λόγια σου|φράση που/i.test(PANEL));
assert('PANEL: the two statements do not contradict each other — both name the same limit',
  /ολόκληρη η συνομιλία|όλη η συνομιλία/i.test(PANEL));

// ── (b) THE BLUEPRINT FOOTER ────────────────────────────────────────────────
const _bpStart = CODE.indexOf('function exportBlueprint');
const _bpEnd = CODE.indexOf('const blob = new Blob', _bpStart);
const BLUEPRINT = _bpStart >= 0 ? CODE.slice(_bpStart, _bpEnd) : '';
assert('exportBlueprint located', BLUEPRINT.includes('class="footer"'));
assert('BLUEPRINT: the blanket claim «Είναι δικά σου λόγια» is gone',
  !/Είναι δικά σου λόγια, στη σειρά/.test(BLUEPRINT));
assert('BLUEPRINT: the keystone is still correctly claimed as verbatim — that part was true',
  /Η φράση που κρατάς/.test(BLUEPRINT));
assert('BLUEPRINT: the three beats are now attributed to AURA\'s formulation, not to the user',
  /(διατύπωσ|διατυπώθηκ)/i.test(BLUEPRINT));
assert('BLUEPRINT: the footer distinguishes the two — it does not attribute both alike',
  (() => {
    const f = BLUEPRINT.match(/class="footer">([^<]*)</);
    if (!f) return false;
    const t = f[1];
    return /φράση/.test(t) && /(διατύπωσ|διατυπώθηκ)/i.test(t);
  })());
assert('BLUEPRINT: the keystone-is-verbatim guarantee in the code comment still holds',
  /ALWAYS the user's verbatim words, never AI-selected/.test(BLUEPRINT));
assert('BLUEPRINT: escaping is untouched — every interpolation still goes through esc()',
  !/\$\{(?!esc\(|dateStr|keystoneHtml|beatsHtml|ankerText \?)/.test(BLUEPRINT.slice(BLUEPRINT.indexOf('<body>'))));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
