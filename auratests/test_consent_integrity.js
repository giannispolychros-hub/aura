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
// THE ATTRIBUTION SPLIT IS GONE BECAUSE THE THING IT SPLIT IS GONE. This used to require the
// footer to separate the person's kept phrase from the three beats AURA formulated. The beats
// were removed from the sheet: they rendered whatever finalDistillation held, and that is the
// LAST SENTENCE of AURA's closing reply, so the three-beat parse always failed and one
// arbitrarily-cut sentence of AURA's prose was printed onto a file the person keeps. Nothing on
// the sheet is now AURA's formulation, so the footer must no longer claim there is.
assert('BLUEPRINT: no attribution to AURA\'s formulation survives — there is nothing left to attribute',
  !/(διατύπωσε η AURA|τρία βήματα)/i.test(BLUEPRINT));
assert('BLUEPRINT: the footer states what is true of the whole page — their words, AURA\'s headings',
  (() => {
    const f = BLUEPRINT.match(/class="footer">([^<]*)</);
    return !!f && /δικά σου λόγια/.test(f[1]) && /τίτλοι/.test(f[1]);
  })());
assert('BLUEPRINT: the beats block and the duplicate stamp are gone from the source',
  !/beatsHtml/.test(BLUEPRINT) && !/class="stamp"/.test(BLUEPRINT));
assert('BLUEPRINT: the keystone-is-verbatim guarantee in the code comment still holds',
  /ALWAYS the user's verbatim words, never AI-selected/.test(BLUEPRINT));
// zonesHtml joins the allow-list because the three Blueprint zones are assembled before the
// template, exactly like keystoneHtml and beatsHtml. This guard fired correctly when it appeared,
// which is the point of it. The escaping INSIDE that builder — where the person's own sentence
// actually enters markup — is held by test_signals, which checks the builder block itself; a
// mutation dropping esc() there fails that suite.
assert('BLUEPRINT: escaping is untouched — every interpolation still goes through esc()',
  !/\$\{(?!esc\(|dateStr|keystoneHtml|zonesHtml)/.test(BLUEPRINT.slice(BLUEPRINT.indexOf('<body>'))));

// ── P1 — PROFILING MUST NOT RUN, OR BE USED, WITHOUT CONSENT ────────────────
// The classification found the Silent Profile — twelve moving averages producing statements like
// "fear-driven decisions", "frequently seeks confirmation, handle refusals carefully" — running
// on two independent paths with no consent at all:
//
//   (1) PRODUCTION. updateProfile + setMemory ran unconditionally; only saveMemory was gated. And
//       getProfileSummary activates at profilingMaturity >= 30, which is totalSignals >= 9, one
//       signal per turn — so in ANY session of ten turns or more the profile matured and entered
//       the prompt WITHIN THAT SESSION, with storageEnabled false throughout.
//
//   (2) USE. getProfileSummary checked only profilingMaturity, never storageEnabled. Turning
//       memory off writes {storageEnabled:false} but leaves the profile object in localStorage,
//       so the next load read it back and kept injecting it. Switching memory off did not switch
//       profiling off — it only stopped new writes.
//
// This is a live compliance exposure (profiling without clear consent), not a design preference,
// which is why it was fixed ahead of the architecture work rather than inside it.
//
// The gate is NOT extended to recordTrajectory: that one deliberately runs before consent, with a
// documented reason — the consent prompt itself needs a detected stable pattern in order to have
// something to ask about. Gating it would make the consent mechanism unable to trigger. The
// assertions below hold that distinction so a later "consistency" pass does not collapse the two.

const _gpsStart = CODE.indexOf('function getProfileSummary');
const _gpsEnd = CODE.indexOf('\n}', _gpsStart);
const GPS = _gpsStart >= 0 ? CODE.slice(_gpsStart, _gpsEnd) : '';
assert('getProfileSummary located', GPS.includes('profilingMaturity'));

// BEHAVIOURAL, against the real function: a matured profile plus consent OFF must produce nothing.
let getProfileSummary = null;
try { eval('getProfileSummary = ' + GPS + '\n}'); } catch (err) {
  assert('getProfileSummary evaluates (it did not: ' + err.message + ')', false);
}
if (typeof getProfileSummary === 'function') {
  const maturedProfile = {
    impulsivity: 80, analyticalDepth: 20, riskAvoidance: 80, autonomyNeed: 80,
    ruminationTendency: 80, validationSeeking: 80, preferredPace: 80, orientation: 80,
    profilingMaturity: 95, totalSignals: 40,
  };
  const withConsent = getProfileSummary({ storageEnabled: true, profile: maturedProfile });
  const without     = getProfileSummary({ storageEnabled: false, profile: maturedProfile });
  assert('USE: a matured profile still works WITH consent (the fix is a gate, not a removal)',
    typeof withConsent === 'string' && withConsent.includes('SILENT PROFILE'));
  assert('USE: the SAME matured profile produces NOTHING with consent off',
    without === '');
  assert('USE: a profile stored before consent was withdrawn is not injected either',
    getProfileSummary({ storageEnabled: false, profile: { ...maturedProfile, profilingMaturity: 100 } }) === '');
  assert('USE: the maturity floor still applies independently of consent',
    getProfileSummary({ storageEnabled: true, profile: { ...maturedProfile, profilingMaturity: 10 } }) === '');
  assert('USE: a missing profile object is still handled without throwing',
    getProfileSummary({ storageEnabled: true }) === '' && getProfileSummary({ storageEnabled: false }) === '');
}

// PRODUCTION: the update block itself must be consent-gated in the source.
const _sigStart = CODE.indexOf('const crisisFired = detectCrisisMode');
const _sigEnd = CODE.indexOf('if (currentMode === "COMPRESSION")', _sigStart);
const SIGBLOCK = _sigStart >= 0 ? CODE.slice(_sigStart, _sigEnd) : '';
assert('Signal-update block located', SIGBLOCK.includes('updateProfile('));
// CONTAINMENT, by brace-matching the real gate, NOT by proximity. The first version of these
// three looked for `memory.storageEnabled` within N characters of each call — which the gate on a
// SIBLING branch satisfies from a distance. A mutation that moved only the shadow branch back
// outside the gate left that assertion green. These now extract the gated block and check that
// each call is inside it, and that nothing profiling-related survives outside.
const GATE = (() => {
  const open = SIGBLOCK.indexOf('if (memory.storageEnabled) {');
  if (open < 0) return null;
  let i = SIGBLOCK.indexOf('{', open), depth = 0;
  for (; i < SIGBLOCK.length; i++) {
    if (SIGBLOCK[i] === '{') depth++;
    else if (SIGBLOCK[i] === '}' && --depth === 0) return SIGBLOCK.slice(open, i + 1);
  }
  return null;
})();
assert('PRODUCTION: a consent gate exists in the signal block', GATE !== null);
if (GATE) {
  assert('PRODUCTION: updateProfile is INSIDE the gate', GATE.includes('updateProfile('));
  assert('PRODUCTION: setMemory(updatedWithProfile) is INSIDE the gate',
    GATE.includes('setMemory(updatedWithProfile)'));
  assert('PRODUCTION: the shadow-trigger branch is INSIDE the gate too — same system',
    GATE.includes('recordShadowFired(') && GATE.includes('setMemory(updatedWithShadow)'));
  const OUTSIDE = SIGBLOCK.split(GATE).join('');
  assert('PRODUCTION: NOTHING profiling-related survives outside the gate',
    !/updateProfile\(|recordShadowFired\(|setMemory\(updatedWith/.test(OUTSIDE));
}

// THE DISTINCTION THAT MUST SURVIVE: recordTrajectory stays ungated, on purpose.
assert('recordTrajectory is deliberately NOT gated — the consent prompt needs it to have something to ask about',
  /INTENTIONAL: recordTrajectory runs here regardless of storageEnabled/.test(CODE));
assert('…and its documented reason is still recorded next to it',
  /consent-offering mechanism itself can detect a stable pattern/.test(CODE));

// REGRESSION: consent still genuinely turns things on.
assert('REGRESSION: granting consent still sets storageEnabled true',
  /storageEnabled: true/.test(CODE));
assert('REGRESSION: the delete-everything action still clears local storage',
  /removeItem\(MEMORY_KEY\)/.test(CODE));

// ── ΜΠΗΚΕΣ ΜΕ — extractBeforeMessage must have a real contract ──────────────
// This feeds anchor.before, which the Αρχείο renders today and which the redesigned Blueprint's
// first zone is built on. It scanned for an assistant message containing "ψηφιακός καθρέφτης" and
// took the first user message AFTER it. That phrase appears ZERO times in the prompt, so the
// boundary stayed -1, the loop started at index 0, and the function returned the first user
// message of the session — the right answer, reached by accident. Two problems with an accident:
// it is not a contract anyone can rely on, and the moment any assistant text happens to contain
// that phrase the return value silently changes to a completely different message.
//
// The contract is now explicit: the first user message of the session. Verified correct on every
// path — the normal path only reaches First-WHY with messages.length === 0, and firstWhyMessage is
// set to the user's own userText, so messages[0] is always their genuine opening on every branch.
const _ebStart = CODE.indexOf('function extractBeforeMessage');
const _ebEnd = CODE.indexOf('\n}', _ebStart);
const EB_SRC = _ebStart >= 0 ? CODE.slice(_ebStart, _ebEnd + 2) : '';
assert('extractBeforeMessage located', EB_SRC.includes('function extractBeforeMessage'));
assert('ΜΠΗΚΕΣ ΜΕ: the phantom marker is gone from the function',
  !/ψηφιακός καθρέφτης/.test(EB_SRC));
assert('ΜΠΗΚΕΣ ΜΕ: the marker exists nowhere in the file at all — it never did in the prompt',
  (raw.match(/ψηφιακός καθρέφτης/g) || []).length === 0);

let extractBeforeMessage = null;
try { eval('extractBeforeMessage = ' + EB_SRC.slice(EB_SRC.indexOf('function'))); } catch (err) {
  assert('extractBeforeMessage evaluates (it did not: ' + err.message + ')', false);
}
if (typeof extractBeforeMessage === 'function') {
  const U = c => ({ role: 'user', content: c });
  const A = c => ({ role: 'assistant', content: c });
  const session = [U('Δεν ξέρω αν να αλλάξω δουλειά.'), A('Τι σε κρατάει;'), U('Ο μισθός.')];
  assert('ΜΠΗΚΕΣ ΜΕ: returns the first user message of the session',
    extractBeforeMessage(session) === 'Δεν ξέρω αν να αλλάξω δουλειά.');

  // THE DISCRIMINATING CASE. With the phantom scan in place this returned "Ο μισθός." — the
  // message AFTER the marker — instead of what they came in with. Nothing in the product produces
  // that phrase today, which is exactly why the bug was invisible; it is held here so that
  // reintroducing any such marker cannot silently change the first zone of the Blueprint.
  const withMarker = [U('Δεν ξέρω αν να αλλάξω δουλειά.'), A('Είμαι ένας ψηφιακός καθρέφτης.'), U('Ο μισθός.')];
  assert('ΜΠΗΚΕΣ ΜΕ: an assistant message containing that phrase does NOT move the boundary',
    extractBeforeMessage(withMarker) === 'Δεν ξέρω αν να αλλάξω δουλειά.');
  assert('ΜΠΗΚΕΣ ΜΕ: the user\'s own words are never skipped, whatever an assistant said',
    extractBeforeMessage([A('οτιδήποτε'), U('πρώτο δικό μου'), U('δεύτερο')]) === 'πρώτο δικό μου');
  assert('ΜΠΗΚΕΣ ΜΕ: a user message that happens to contain the phrase is returned normally',
    extractBeforeMessage([U('είσαι ψηφιακός καθρέφτης;'), U('β')]) === 'είσαι ψηφιακός καθρέφτης;');

  // Degenerate inputs — this runs at termination, where an exception would lose the anchor.
  assert('ΜΠΗΚΕΣ ΜΕ: no user message at all returns empty string',
    extractBeforeMessage([A('μόνο aura')]) === '');
  assert('ΜΠΗΚΕΣ ΜΕ: empty and non-array inputs are handled',
    extractBeforeMessage([]) === '' && extractBeforeMessage(null) === '' && extractBeforeMessage(undefined) === '');
  assert('ΜΠΗΚΕΣ ΜΕ: a message with no content field does not throw',
    extractBeforeMessage([{ role: 'user' }, U('β')]) !== undefined);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
