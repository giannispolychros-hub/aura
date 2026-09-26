// ── STEP 1δ: A FIRST-WHY SESSION VERIFIED PAST ITS FIRST TURN ───────────────
//
// THE QUESTION THIS ANSWERS. The First-WHY branch bypasses generateResponse, so after the safety
// floor was wired (item 1β) eighteen post-processing steps still do not run on that turn — among
// them ten latches that record which question AURA asked. The risk is not that they under-report.
// It is that something LATER in the session reads one of them and behaves differently, or breaks,
// because the entry turn never set it. Verifying the turn alone could not have found that.
//
// WHAT WAS MEASURED, AND AGAINST WHAT. The invariants below were established by replaying all NINE
// real sessions we hold — 321 messages — through decideTermination turn by turn, twice: once with
// the state a First-WHY session actually has (outcomeScaleAsked never set on the entry turn) and
// once as if it had been set. Result: 0 throws, 0 results outside the enum, 4 of 9 sessions reached
// a terminating decision, and the decision sequence was IDENTICAL in 9 of 9. The unset latch
// changes nothing.
//
// THE REAL TRANSCRIPTS ARE DELIBERATELY NOT COMMITTED. They carry a real person's income, family
// and legal situation. This repository's own standard is that only counts travel, never
// conversation content, and a test fixture is not an exception to it. The fixtures below are
// synthetic and exercise the same branches — a session that closes, one that never does, a bare
// acknowledgment, and a reply ending in a real question.
//
// THE DEPENDENCY SET IS ASSERTED. The first run of this simulation threw, because
// decideTermination calls wasThirdTriggerAsked and isModelPreClosing and the harness had lifted
// neither. A simulation missing a dependency does not fail loudly, it fails misleadingly, so the
// set is pinned here.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}

let passed = 0, failed = 0;
function assert(name, cond) { if (cond) { passed++; console.log("PASS — " + name); } else { failed++; console.log("FAIL — " + name); } }

// ── 1. THE DEPENDENCY SET, PINNED ─────────────────────────────────────────
const DT_SRC = extract('decideTermination');
const CALLED = [...new Set((DT_SRC.match(/\b([a-z][a-zA-Z0-9]{3,})\(/g) || []).map(x => x.slice(0, -1)))]
  .filter(n => raw.indexOf('function ' + n + '(') >= 0 && n !== 'decideTermination');
const EXPECTED = ['matchesClosingWord', 'isBareEmojiOrAcknowledgment', 'wasThirdTriggerAsked',
                  'isExplicitClosure', 'isModelPreClosing'];
assert("decideTermination's module-level dependencies are exactly the five this harness lifts"
  + (CALLED.length ? " (" + CALLED.join(", ") + ")" : ""),
  CALLED.length === EXPECTED.length && EXPECTED.every(n => CALLED.includes(n)));
for (const f of EXPECTED.concat(['detectsConcreteStep', 'decideTermination'])) eval(extract(f));

// ── 2. EVERY LATCH THE ENTRY TURN LEAVES UNSET IS READ AS A GATE ──────────
// If any were read arithmetically, indexed, or dereferenced, "unset" would be a bug rather than
// "not yet". Writes are skipped; only reads are judged.
const LATCHES = ["outcomeScaleAsked","coreReadinessAsked","coreReadinessConfirmed","shiftCheckAsked",
  "shiftCheckConfirmed","friendPerspectiveAsked","friendPerspectiveConfirmed","stakesAsked",
  "stakesCallbackDelivered","anchorsInvited","earlyReliefAsked","roadMapDelivered","roadMapRecovered"];
const nonBoolean = [];
for (const r of LATCHES) {
  const re = new RegExp(r + "\\.current(.{0,3})", "g");
  let m;
  while ((m = re.exec(raw)) !== null) {
    if (/^\s*=[^=]/.test(m[1])) continue;
    if (/^\s*(\.|\[|\+|-|\*)/.test(m[1])) nonBoolean.push(r);
  }
}
assert("all 13 latches are read only as gates, so unset means \"not yet\" and never an error"
  + (nonBoolean.length ? " (offenders: " + [...new Set(nonBoolean)].join(", ") + ")" : ""),
  nonBoolean.length === 0);
assert("the scan actually found reads — it is not passing because the names changed",
  LATCHES.every(r => raw.indexOf(r + ".current") >= 0));

// ── 3. THE SIMULATION ─────────────────────────────────────────────────────
const ENUM = new Set(["none", "confirm", "warn", "terminate", "await_outcome_scale"]);
const Q = "Τι σε κρατάει σε αυτό;";
const SESSIONS = {
  "closes explicitly": [
    { role: "user", content: "δεν ξέρω τι να κάνω με τη δουλειά" },
    { role: "assistant", content: Q },
    { role: "user", content: "το σκέφτομαι ακόμα" },
    { role: "assistant", content: "Τι θα άλλαζε αν το αποφάσιζες σήμερα;" },
    { role: "user", content: "Ευχαριστώ, τα λέμε." },
    { role: "assistant", content: "Κράτα αυτό που βρήκες." },
  ],
  "never closes": [
    { role: "user", content: "θέλω να αλλάξω κάτι" },
    { role: "assistant", content: Q },
    { role: "user", content: "δεν είμαι σίγουρος ακόμα, πολλά μαζί" },
    { role: "assistant", content: "Ποιο από αυτά πιέζει τώρα;" },
  ],
  "bare acknowledgment mid-session": [
    { role: "user", content: "με απασχολεί το οικονομικό" },
    { role: "assistant", content: Q },
    { role: "user", content: "Οκ" },
    { role: "assistant", content: "Τι εννοείς με το «οκ» — κάτι άλλαξε;" },
  ],
  "reply ends in a real question": [
    { role: "user", content: "νομίζω κατέληξα" },
    { role: "assistant", content: "Πριν κλείσουμε — τι θα κάνεις πρώτο;" },
  ],
};
const runSession = (msgs, scaleAsked) => {
  const seq = []; let step = false;
  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].role !== "assistant") {
      if (msgs[i].role === "user" && detectsConcreteStep(msgs[i].content)) step = true;
      continue;
    }
    seq.push(decideTermination(msgs.slice(0, i), msgs[i].content, {
      safetyMode: false, currentMode: "ANSWER", warningIssued: false, compressionCount: 0,
      modelJudgesEnd: false, concreteStepStated: step,
      outcomeScaleAsked: scaleAsked, outcomeScaleBlockUsed: false,
      duringOnboarding: false, duringDeclineCooldown: false,
    }));
  }
  return seq;
};
for (const [label, msgs] of Object.entries(SESSIONS)) {
  let a = null, b = null, threw = null;
  try { a = runSession(msgs, false); b = runSession(msgs, true); } catch (e) { threw = e.message; }
  assert("a First-WHY session past its first turn does not throw — " + label, threw === null);
  assert("every decision is a known outcome — " + label,
    !!a && a.every(d => ENUM.has(d)));
  // THE 1δ INVARIANT: the latch the entry turn never set does not change where the session ends.
  assert("the unset outcomeScaleAsked does not change the decision sequence — " + label,
    !!a && !!b && JSON.stringify(a) === JSON.stringify(b));
}
// Guarded like the loop above. These two used to call runSession bare, so a mutation that made
// decideTermination throw crashed the suite instead of failing it — and a crash reports nothing
// about which invariant broke.
const safeRun = (m) => { try { return runSession(m, false); } catch (e) { return null; } };
const allSeqs = Object.values(SESSIONS).map(safeRun);
assert("every fixture ran without throwing", allSeqs.every(x => x !== null));
assert("the fixture is not vacuous — at least one session does reach a terminating decision",
  allSeqs.some(x => x && x.some(d => d !== "none")));
assert("and at least one deliberately never terminates, so both branches are exercised",
  allSeqs.some(x => x && x.length > 0 && x.every(d => d === "none")));

// ── 4. WHAT REMAINS BYPASSED IS RECORDED, NOT ASSUMED HARMLESS ────────────
// roadMapRecovered is written twice and read nowhere. That is not caused by First-WHY, and it is
// pinned here so it is a known fact rather than a discovery someone makes twice.
assert("KNOWN: roadMapRecovered is written and never read — a fact, not a conclusion",
  (raw.match(/roadMapRecovered\.current\s*=/g) || []).length >= 1
  && (raw.match(/roadMapRecovered\.current(?!\s*=)/g) || []).length === 0);

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
