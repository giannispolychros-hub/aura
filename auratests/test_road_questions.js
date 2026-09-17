// AURA — ROAD QUESTIONS (Stage 1, textual) — MECHANISM AND VERBATIM CONTRACT
//
// WHAT THIS IS. After a Road Map is produced, AURA asks at most ONE question per road (hard cap 3
// per session) aimed at a parameter the user has not named yet. The user answers. At the end the
// code assembles an artifact containing ONLY the user's verbatim answers, grouped by road.
//
// THE ONE ARCHITECTURAL DECISION THIS FILE EXISTS TO PROTECT: the artifact is assembled BY CODE,
// never by the model. Three days of measurement in this repo established that "only what they
// named" cannot be verified after the fact — vocabulary overlap is anti-correlated with fabricated
// content (a fabricated line reuses the user's words by construction), and every string-matching
// provenance check produced errors in both directions. Assembling the artifact in code removes the
// question entirely: there is no path through which synthesis could enter. Provenance becomes a
// property of construction rather than a claim to be audited. Assertion #5 below is that contract;
// if it ever fails, "verbatim-only" has stopped being true.
//
// QUESTION SELECTION is the model's, under the priority order the founder approved:
//   (1) an unknown the user named themselves (prompt γρ.175) — always first, pure extraction
//   (2) a thin slot of THAT road (γρ.162) — derived from this road's real gaps, not a template
//   (3) the ΑΓΝΩΣΤΟ already attached to the map (γρ.171) — only if neither (1) nor (2) exists
// Every candidate must pass REVERSIBILITY CHECK + CALIBRATION QUESTION TEST (γρ.62). Those rules
// already exist in the prompt, so the ctx references them by name exactly as the other ctx blocks
// do — which is why this mechanism needs NO prompt text and leaves the cached prefix untouched.
//
// STRUCTURAL PARSING, NOT LEXICAL: same convention as every other suite here.

const fs = require('fs');
const path = require('path');
const raw = (() => {
  const candidates = ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx'];
  for (const c of candidates) { const p = path.join(__dirname, c); if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8'); }
  throw new Error('App.jsx not found.');
})();
let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }
function extract(name) { const s = raw.indexOf('function ' + name + '('); return s < 0 ? null : raw.slice(s, raw.indexOf('\n}', s) + 2); }

const SPLIT = (() => {
  const i = raw.indexOf('const AURA_CORE_PERSONALITY');
  const s = raw.indexOf('`', i) + 1, e = raw.indexOf('`;', s);
  return { PROMPT: raw.slice(s, e), CODE: raw.slice(0, i) + raw.slice(e) };
})();
assert('Structural sanity: CODE region is substantial', SPLIT.CODE.length > 100000);

// ── 11. CACHE: the whole mechanism lives outside the cached prefix ──
assert('#11 CACHE: buildRoadArtifact is defined in CODE, never inside the prompt literal',
  SPLIT.CODE.includes('function buildRoadArtifact(') && !SPLIT.PROMPT.includes('buildRoadArtifact'));
assert('#11 CACHE: no part of the mechanism leaked into the prompt literal',
  !SPLIT.PROMPT.includes('roadQuestionState') && !SPLIT.PROMPT.includes('ROAD QUESTION —'));

// ── 12. No new hidden tag — the [[EXIT]]/[[EARLY_WORD]] contract stays closed ──
const newTags = (SPLIT.CODE.match(/\[\[[A-Z_]+:/g) || []).map(t => t.replace(/[\[\]:]/g, ''));
assert('#12 TAGS: the mechanism introduces no new [[TAG:value]] parse site',
  new Set(newTags).size <= 2 && newTags.every(t => t === 'EXIT' || t === 'EARLY_WORD'));

// ── 10. ONE ref, reset in resetSession, no EXCEPTIONS entry needed ──
assert('#10 STATE: exactly one new ref, roadQuestionState',
  (SPLIT.CODE.match(/const roadQuestionState = useRef\(/g) || []).length === 1);
assert('#10 STATE: it is cleared in resetSession',
  /roadQuestionState\.current = null;/.test(SPLIT.CODE.slice(SPLIT.CODE.indexOf('const resetSession'))));

// ── 3 & 4. The ctx carries the approved priority order and the two gate tests ──
const ctxStart = SPLIT.CODE.indexOf('const roadQuestionCtx');
assert('roadQuestionCtx exists', ctxStart >= 0);
const CTX = ctxStart >= 0 ? SPLIT.CODE.slice(ctxStart, SPLIT.CODE.indexOf('})();', ctxStart) + 5) : '';
// Asserted by SECTION NAME, not by line number: a raw "γρ.175" inside model-facing text points at
// nothing the model can look up, and line numbers shift with every edit. The names are stable and
// findable in the prompt, which is how every other ctx block already cross-references it.
assert('#3 PRIORITY: all three selectors are named, in the approved order',
  (() => { const a = CTX.indexOf('UNKNOWNS THE USER THEMSELVES NAMED'),
                 b = CTX.indexOf('COMPLETENESS'), c = CTX.indexOf('ΑΓΝΩΣΤΟ');
           return a >= 0 && b > a && c > b; })());
assert('#3 PRIORITY: (3) is explicitly conditional on neither (1) nor (2) existing',
  /only if neither/i.test(CTX));
assert('#4 GATES: the ctx invokes REVERSIBILITY CHECK and CALIBRATION QUESTION TEST by name',
  /REVERSIBILITY CHECK/.test(CTX) && /CALIBRATION QUESTION TEST/.test(CTX));
assert('#4 GATES: the ctx demands exactly one question and forbids a summary',
  /exactly one question/i.test(CTX) && /no summary/i.test(CTX));
assert('#2 ONE PER ROAD: the "nothing significant is missing" bailout is offered, so a road with no real gap is skipped without a question',
  /NOTHING SIGNIFICANT IS MISSING/.test(CTX));

// ── Suppression of the three colliding ctx while questions are pending ──
for (const [name, idx] of [['gatesCtx', SPLIT.CODE.indexOf('const gatesCtx')],
                           ['closingDriftCtx', SPLIT.CODE.indexOf('const closingDriftCtx')],
                           ['userStagnationCtx', SPLIT.CODE.indexOf('const userStagnationCtx')]]) {
  const win = idx >= 0 ? SPLIT.CODE.slice(idx, idx + 700) : '';
  assert(`SUPPRESSION: ${name} stands down while road questions are pending`,
    /roadQuestionState\.current/.test(win));
}

// ── 1, 2, 5, 6, 7, 8, 9 — BEHAVIOURAL, against the real assembler ──
const art = extract('buildRoadArtifact');
assert('buildRoadArtifact extracted for evaluation', art !== null);
if (art) {
  eval(art);
  const ST = (n, answered) => ({
    roads: ['Παράλληλη εργασία', 'Gig economy', 'Νέες σπουδές'].slice(0, n),
    asked: answered,
    qa: Array.from({ length: answered }, (_, i) => ({
      road: i + 1,
      name: ['Παράλληλη εργασία', 'Gig economy', 'Νέες σπουδές'][i],
      q: `ΕΡΩΤΗΣΗ${i + 1}`,
      a: `ΑΠΑΝΤΗΣΗ${i + 1} με δικά μου λόγια`,
    })),
  });

  const full = buildRoadArtifact(ST(3, 3), false);
  assert('#1 CAP: a full 3-road run renders all three', 
    full && ['ΑΠΑΝΤΗΣΗ1', 'ΑΠΑΝΤΗΣΗ2', 'ΑΠΑΝΤΗΣΗ3'].every(x => full.includes(x)));
  assert('#1 CAP: a single-road map renders exactly one entry',
    (() => { const one = buildRoadArtifact(ST(1, 1), false);
             return one && one.includes('ΑΠΑΝΤΗΣΗ1') && !one.includes('ΑΠΑΝΤΗΣΗ2'); })());

  // THE CONTRACT. Every line of the artifact is either a fixed label the code owns, or a verbatim
  // fragment the user wrote. Nothing else may appear — no synthesis, no ordering by importance, no
  // closing remark. Checked by removing the known-fixed vocabulary and every supplied string, then
  // asserting nothing with letters survives.
  assert('#5 VERBATIM CONTRACT: the artifact contains ONLY fixed labels and the user\'s own answers',
    (() => {
      let residue = full;
      for (const s of ['ΑΠΑΝΤΗΣΗ1 με δικά μου λόγια', 'ΑΠΑΝΤΗΣΗ2 με δικά μου λόγια', 'ΑΠΑΝΤΗΣΗ3 με δικά μου λόγια',
                       'ΕΡΩΤΗΣΗ1', 'ΕΡΩΤΗΣΗ2', 'ΕΡΩΤΗΣΗ3',
                       'Παράλληλη εργασία', 'Gig economy', 'Νέες σπουδές',
                       'Η ΣΚΕΨΗ ΣΟΥ, ΑΝΑ ΔΡΟΜΟ', 'ΔΡΟΜΟΣ']) residue = residue.split(s).join('');
      return !/[Α-Ωα-ωA-Za-z]/.test(residue);
    })());
  assert('#5 VERBATIM CONTRACT: the answer is reproduced byte-for-byte, not trimmed or reworded',
    full.includes('ΑΠΑΝΤΗΣΗ2 με δικά μου λόγια'));

  // #7 PARTIAL
  const partial = buildRoadArtifact(ST(3, 2), true);
  assert('#7 PARTIAL: an explicit incompleteness marker is present', /ημιτελ/.test(partial));
  assert('#7 PARTIAL: it states how many of how many were answered', /2\s*απ[όο]\s*3/.test(partial));
  assert('#7 PARTIAL: the unanswered road is OMITTED, never filled in from general knowledge',
    !partial.includes('Νέες σπουδές') && !partial.includes('ΑΠΑΝΤΗΣΗ3'));
  assert('#7 PARTIAL: a complete run carries no incompleteness marker', !/ημιτελ/.test(full));

  // #8 nothing answered
  assert('#8 EMPTY: zero answers produces no artifact at all',
    buildRoadArtifact(ST(3, 0), true) === null);
  assert('#8 EMPTY: a null/garbage state does not throw and produces nothing',
    buildRoadArtifact(null, false) === null && buildRoadArtifact({}, false) === null);
}

// ── 6. The artifact is assembled WITHOUT a model call ──
assert('#6 NO MODEL CALL: buildRoadArtifact makes no API call of any kind',
  art !== null && !/callAura|fetch\(/.test(art));
// Deliberately skips past the DEFINITION to reach the CALL site: a bare indexOf lands on
// `function buildRoadArtifact(` and would then assert things about the assembler's own body
// instead of about how it is wired — an earlier version of this file did exactly that and reported
// three failures that were the test's imprecision, not the code's.
const defIdx = SPLIT.CODE.indexOf('function buildRoadArtifact(');
// `defIdx + 1` is not enough: defIdx points at "function ", so the name itself starts nine
// characters later and the search would re-find the very same occurrence. Skip the whole
// declaration instead.
const emitIdx = SPLIT.CODE.indexOf('buildRoadArtifact(', defIdx + 'function buildRoadArtifact('.length);
assert('Emit site located, distinct from the definition', defIdx >= 0 && emitIdx > defIdx);
const emitWin = emitIdx >= 0 ? SPLIT.CODE.slice(Math.max(0, emitIdx - 900), emitIdx + 900) : '';
assert('#6 NO MODEL CALL: the emit site appends a message directly, with no callAura between',
  /setMessages\(/.test(emitWin) && !/callAura\(/.test(emitWin));

// ── 9. Explicit closure during the sequence stops the mechanism and yields a partial ──
assert('#9 EARLY EXIT: the emit site keys on isExplicitClosure and on safetyMode',
  /isExplicitClosure\(/.test(emitWin) && /safetyMode/.test(emitWin));
assert('#9 EARLY EXIT: the state is cleared once the artifact is emitted, so it cannot re-fire',
  /roadQuestionState\.current = null/.test(emitWin));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\n⚠ Αν έπεσε το #5: το artifact έπαψε να είναι αποκλειστικά τα λόγια του χρήστη.');
  console.log('  Αυτό ΔΕΝ είναι λεπτομέρεια — είναι ο λόγος που ο μηχανισμός δεν χρειάζεται ανιχνευτή.');
}
process.exit(failed > 0 ? 1 : 0);
