const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');})();
function extract(name){const s=raw.indexOf('function '+name+'(');const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('detectsShiftCheckAsked'));
eval(extract('detectsAffirmativeShort'));

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { passed++; console.log("PASS —", label); }
  else { failed++; console.log("FAIL —", label); }
}

assert("Detects the exact canonical shift-check wording",
  detectsShiftCheckAsked("Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;") === true);
assert("Does NOT false-positive on the follow-up 'με τι μπήκες/φεύγεις' question itself",
  detectsShiftCheckAsked("Με τι μπήκες εδώ... και με τι φεύγεις τώρα;") === false);
assert("Does NOT false-positive on an unrelated mid-conversation question",
  detectsShiftCheckAsked("Τι σε κρατάει περισσότερο σε αυτό;") === false);
assert("Does NOT false-positive on the core-readiness question (different mechanism, similar topic)",
  detectsShiftCheckAsked("Από όσα είπαμε, νιώθεις ότι έχει αρχίσει να ξεκαθαρίζει τι είναι αυτό που πραγματικά σε απασχολεί;") === false);

function simulateShiftSequence(steps) {
  let asked = false, confirmed = false;
  const log = [];
  for (const { auraText, userReplyBefore } of steps) {
    if (!confirmed) {
      if (asked && userReplyBefore && detectsAffirmativeShort(userReplyBefore)) {
        confirmed = true;
      } else if (detectsShiftCheckAsked(auraText)) {
        asked = true;
      }
    }
    log.push({ asked, confirmed });
  }
  return log;
}

// CORRECTED UNDERSTANDING (second-pass self-correction): "Ναι" answers "Νιώθεις ότι κάτι
// άλλαξε" — a genuine yes/no question. This is CORRECT behavior, not a bug. The real
// false-clarity safeguard lives in the SEPARATE, later "με τι μπήκες/φεύγεις" question, which
// already requires substantive user words before the three-beat structure builds.
const s1 = simulateShiftSequence([
  { auraText: "Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;", userReplyBefore: null },
  { auraText: "Με τι μπήκες εδώ... και με τι φεύγεις τώρα;", userReplyBefore: "Ναι" },
]);
assert("Full sequence: shift-check asked -> user confirms (genuinely yes/no) -> three-beat follow-up now permitted",
  s1[0].asked === true && s1[0].confirmed === false && s1[1].confirmed === true);

const s2 = simulateShiftSequence([
  { auraText: "Νιώθεις ότι κάτι άλλαξε σε σχέση με το πώς έβλεπες αυτό στην αρχή;", userReplyBefore: null },
  { auraText: "Εντάξει, ας συνεχίσουμε τότε.", userReplyBefore: "Όχι, όχι ακόμα" },
]);
assert("User says no -> three-beat structure correctly NOT unlocked, session continues normally",
  s2[1].confirmed === false);

const s3 = simulateShiftSequence([
  { auraText: "Τι σε εμποδίζει περισσότερο;", userReplyBefore: null },
  { auraText: "Κατάλαβα.", userReplyBefore: "Ναι" },
]);
assert("CRITICAL: bare 'Ναι' to an unrelated question never confirms a shift without the real check having been asked first",
  s3[1].confirmed === false);

// ── deliverOnce: the emission budget that stops shiftCheckCtx repeating forever ──
// WHY HERE: this is the shift-check file, and shiftCheckCtx is the directive that caused the bug
// deliverOnce exists to fix — a live session produced the three-beat ΗΡΘΕΣ ΜΕ/ΒΡΗΚΕΣ/ΦΕΥΓΕΙΣ ΜΕ
// block TWICE, because shiftCheckConfirmed is (correctly) one-way for the whole session while the
// ctx built from it was re-sent every single turn still saying "the user JUST confirmed". The fact
// has to persist; the directive must not repeat. These tests pin the budget semantics themselves.
eval(extract('deliverOnce'));

const CTX = "[proceed now to the three-beat structure]";

// budget 2 — shiftCheckCtx's real value: its text commands two steps landing on two different
// turns (ask "με τι μπήκες... με τι φεύγεις", THEN compose the beats once answered). A budget of 1
// would cover the question and leave the three-beat itself unsupported.
const b2 = { current: 0 };
assert("budget 2: 1st emission returns the directive",
  deliverOnce(CTX, b2, 2) === CTX);
assert("budget 2: 2nd emission still returns it (the three-beat turn is the one that needs it)",
  deliverOnce(CTX, b2, 2) === CTX);
assert("budget 2: 3rd emission returns empty — this is exactly the repetition that produced the duplicate three-beat",
  deliverOnce(CTX, b2, 2) === "");
assert("budget 2: counter stops at the budget, never runs away",
  b2.current === 2);

// budget 1 — friendPerspectiveCtx and premiseInversionCtx: single-turn directives.
const b1 = { current: 0 };
assert("budget 1: 1st emission returns the directive", deliverOnce(CTX, b1, 1) === CTX);
assert("budget 1: 2nd emission returns empty",         deliverOnce(CTX, b1, 1) === "");
assert("budget 1: counter is exactly 1",               b1.current === 1);

// Empty input must NOT consume budget — the signal is inactive on this turn, and spending an
// emission here would silently steal it from the turn that actually needs it.
const bEmpty = { current: 0 };
assert("empty ctx returns empty",
  deliverOnce("", bEmpty, 2) === "");
assert("CRITICAL: empty ctx does NOT consume budget",
  bEmpty.current === 0);
assert("after an inactive turn, the full budget is still available",
  deliverOnce(CTX, bEmpty, 2) === CTX && bEmpty.current === 1);
assert("null ctx also returns empty without consuming",
  deliverOnce(null, { current: 0 }, 1) === "" );

// Independence: each ctx carries its own counter, so one exhausting its budget never silences
// another. All three wrapped ctx share this one function.
const refA = { current: 0 }, refB = { current: 0 };
deliverOnce(CTX, refA, 1);
assert("refs are independent — exhausting one leaves the other untouched",
  deliverOnce(CTX, refA, 1) === "" && deliverOnce(CTX, refB, 1) === CTX);

// resetSession sets the counters back to 0; a new session must get the directive again.
const reused = { current: 2 };
assert("an exhausted counter stays silent until reset",
  deliverOnce(CTX, reused, 2) === "");
reused.current = 0; // what resetSession() does
assert("after reset, the directive is delivered again for the new session",
  deliverOnce(CTX, reused, 2) === CTX);

// Default budget is 1 when omitted.
const bDef = { current: 0 };
assert("omitted budget defaults to 1",
  deliverOnce(CTX, bDef) === CTX && deliverOnce(CTX, bDef) === "");

// ── STRUCTURAL: the three ctx are actually wired to deliverOnce with the agreed budgets, and the
// facts feeding them stay one-way. A value test on deliverOnce alone cannot prove either.
const CODE = (() => {
  const i = raw.indexOf('const AURA_CORE_PERSONALITY');
  const s = raw.indexOf('`', i) + 1;
  return raw.slice(0, i) + raw.slice(raw.indexOf('`;', s));
})();
assert("shiftCheckCtx is wired through deliverOnce with budget 2",
  /const shiftCheckCtx = deliverOnce\(/.test(CODE) && /shiftCheckCtxDelivered,\s*2\)/.test(CODE));
assert("friendPerspectiveCtx is wired through deliverOnce with budget 1",
  /const friendPerspectiveCtx = deliverOnce\(/.test(CODE) && /friendPerspectiveCtxDelivered,\s*1\)/.test(CODE));
assert("premiseInversionCtx is wired through deliverOnce with budget 1",
  /const premiseInversionCtx = deliverOnce\(/.test(CODE) && /premiseInversionCtxDelivered,\s*1\)/.test(CODE));
assert("CRITICAL: shiftCheckConfirmed stays one-way — the FACT is not made one-shot, only the directive",
  (CODE.match(/shiftCheckConfirmed\.current = false/g) || []).length === 1);
assert("CRITICAL: friendPerspectiveConfirmed stays one-way too",
  (CODE.match(/friendPerspectiveConfirmed\.current = false/g) || []).length === 1);
assert("clarityPivotCtx and methodFailureCtx keep their own inline one-shot clears, not routed through deliverOnce",
  !/clarityPivotCtx = deliverOnce/.test(CODE) && !/methodFailureCtx = deliverOnce/.test(CODE) &&
  /clarityPivotHint\.current = null/.test(CODE) && /methodFailureHint\.current = false/.test(CODE));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
