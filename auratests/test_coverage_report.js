// ── SESSION COVERAGE REPORT ────────────────────────────────────────────────
//
// The product sends the model twenty ctx signals a turn and almost all of them are
// INSTRUCTIONS — "use that specific response", "these take priority", "switch now".
// Exactly one, materialEvidenceCtx, is framed as an observation: counted from the
// user's own messages, "surfaced here so they do not have to be recalled", with the
// header OBSERVATION ONLY, NOT A SUFFICIENCY JUDGMENT.
//
// An instruction tells the model what to do this turn. A report tells it where it is.
// Only the second lets it choose to go deeper, to reflect, or to move past something.
// This is a sibling of that one report, and it carries the two facts the model has
// never had:
//
//   (A) which signal families have already fired this session. EXPLORATION COVERAGE
//       PRINCIPLE asks for exactly this — "prefer whichever of these you have not yet
//       used this session" — and no variable has ever remembered it. The collision
//       logger already computes the list every single turn and drops it on `window`.
//   (B) how densely it has been asking. A live session produced eleven replies and all
//       eleven ended in a question, with no structural output at all. PROBLEM STRUCTURE
//       MAP already says what to do — "once 1-2 detecting questions have surfaced
//       enough… reflect that shape back" — so the rule exists and its trigger is blind.
//
// IT REPORTS, IT NEVER DIRECTS. No new rule, no new detector, no semantic judgment:
// both fields are arithmetic over data that already exists. A high number is not a
// verdict and a low one is not permission — the rules that act on these live in the
// prompt and are unchanged.
//
// DELIBERATELY INDEPENDENT OF THE ROAD-MAP EXIT CONTRACT. It counts labels present in
// the text and reads no state from that work, so either can be rolled back alone.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('buildCoverageReport'));
eval(extract('structuralLabelsIn'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

const Q = t => ({ role: "assistant", content: t + " τι νομίζεις;" });
const S = t => ({ role: "assistant", content: t });
const U = () => ({ role: "user", content: "κάτι είπα" });
const weave = (...a) => { const out=[]; a.forEach(m=>{ out.push(U()); out.push(m); }); return out; };
// The predicate the app injects, built from the one place the label patterns live.
const STRUCT = t => { const l = structuralLabelsIn(t); return l.road || l.beat; };
const MAP = "ΔΡΟΜΟΣ: Α\nΚΕΡΔΙΖΕΙΣ: Β\nΚΟΣΤΙΖΕΙ: Γ";
const BEAT = "ΗΡΘΕΣ ΜΕ: χάος\nΒΡΗΚΕΣ: αιτία\nΦΕΥΓΕΙΣ ΜΕ: καθαρό";

// ── 1. It stays silent until there is anything to report ──────────────────
assert("silent on an empty session", buildCoverageReport([], [], STRUCT) === "");
assert("silent with fewer than three replies", buildCoverageReport(weave(Q("α"), Q("β")), [], STRUCT) === "");
assert("malformed input never throws", buildCoverageReport(null, null, STRUCT) === "" && buildCoverageReport([{}, 7, "x"], ["a"], STRUCT) === "");

// ── 2. FIELD B — the question streak ──────────────────────────────────────
const streak3 = buildCoverageReport(weave(Q("α"), Q("β"), Q("γ")), [], STRUCT);
assert("three consecutive questions are reported as three", /ending in a question[^\n]*: 3\b/.test(streak3));
const live = buildCoverageReport(weave(Q("α"),Q("β"),Q("γ"),Q("δ"),Q("ε"),Q("ζ"),Q("η"),Q("θ"),Q("ι"),Q("κ"),Q("λ")), [], STRUCT);
assert("the live 11-question session is reported as eleven", /ending in a question[^\n]*: 11\b/.test(live));
assert("a reply that does not end in a question breaks the streak",
  /ending in a question[^\n]*: 2\b/.test(buildCoverageReport(weave(Q("α"), S("μια δήλωση."), Q("β"), Q("γ")), [], STRUCT)));
assert("a streak of zero is still reported honestly, not hidden",
  /ending in a question[^\n]*: 0\b/.test(buildCoverageReport(weave(Q("α"), Q("β"), S("τέλος.")), [], STRUCT)));
assert("the Greek question mark ano teleia counts as a question",
  /ending in a question[^\n]*: 3\b/.test(buildCoverageReport(weave(S("ποιο;"), S("γιατί;"), S("πώς;")), [], STRUCT)));

// ── 3. FIELD B — distance from the last structural output ─────────────────
assert("a session with no structural output at all says so",
  /no structural output|: none/i.test(buildCoverageReport(weave(Q("α"), Q("β"), Q("γ")), [], STRUCT)));
assert("a road map counts as a structural output",
  /since your last structural output[^\n]*: 2\b/.test(buildCoverageReport(weave(S(MAP), Q("α"), Q("β")), [], STRUCT)));
assert("the three-beat counts as a structural output too",
  /since your last structural output[^\n]*: 1\b/.test(buildCoverageReport(weave(Q("α"), S(BEAT), Q("β")), [], STRUCT)));
assert("the most RECENT structural output is the one measured from",
  /since your last structural output[^\n]*: 1\b/.test(buildCoverageReport(weave(S(MAP), Q("α"), S(BEAT), Q("β")), [], STRUCT)));
assert("a structural output on this very reply reads as zero",
  /since your last structural output[^\n]*: 0\b/.test(buildCoverageReport(weave(Q("α"), Q("β"), S(MAP)), [], STRUCT)));

// ── 4. LOCKSTEP with the single source of truth for labels ────────────────
// structuralLabelsIn is where the label patterns live. This function cannot call it —
// the suites lift and eval each function alone — so the patterns are duplicated and
// held character-identical here, the same discipline detectsConcreteStep uses.
// NO DUPLICATION AT ALL, which is stronger than lockstep. A first version spelled the label
// patterns out inside this function and test_format_compliance caught it — structuralLabelsIn
// is the single place they may appear. The predicate is injected instead.
const SRC = extract('buildCoverageReport');
assert("the function spells out no label pattern of its own",
  !/ΔΡ|ΚΕΡΔ|ΚΟΣΤ|ΗΡΘΕΣ|ΒΡΗΚΕΣ|ΦΕΥΓΕΙΣ/.test(SRC));
assert("it takes the structural predicate as an argument",
  /function buildCoverageReport\(messages, families, structural\)/.test(SRC));
// Found by mutation: every fixture above passes its OWN predicate, so none of them can
// see what the APP actually injects. Halving it there — road only, three-beat dropped —
// left the whole suite green while the report stopped seeing half of what it counts.
// Boundary note: the lazy match must not stop at the ");" inside structuralLabelsIn(t);
// it ends at the arrow function's own closing "});".
const injected = (raw.match(/buildCoverageReport\(msgs, familiesUsed\.current,([\s\S]{0,240}?)\}\);/) || [])[1] || "";
assert("the app injects the shared structuralLabelsIn as that predicate",
  /structuralLabelsIn\(/.test(injected));
assert("the injected predicate covers BOTH structural forms, road map and three-beat",
  /\.road/.test(injected) && /\.beat/.test(injected));
// This one deliberately passes NO predicate — the whole point is the safe default.
assert("a missing predicate reports none rather than guessing",
  /: none this session/.test(buildCoverageReport(weave(S(MAP), Q("α"), Q("β")), [])));
assert("agrees with structuralLabelsIn on a real map",
  structuralLabelsIn(MAP).road === true &&
  /since your last structural output[^\n]*: 0\b/.test(buildCoverageReport(weave(Q("α"), Q("β"), S(MAP)), [], STRUCT)));
assert("prose that merely mentions roads is not a structural output",
  structuralLabelsIn("Δύο δρόμοι φαίνονται στο τραπέζι.").road === false &&
  /: none/i.test(buildCoverageReport(weave(Q("α"), Q("β"), S("Δύο δρόμοι φαίνονται στο τραπέζι.")), [], STRUCT)));

// ── 5. FIELD A — families already used ────────────────────────────────────
const fam = buildCoverageReport(weave(Q("α"), Q("β"), Q("γ")), ["tensionCtx", "friendPerspectiveCtx"], STRUCT);
assert("families already used are named", /tensionCtx/.test(fam) && /friendPerspectiveCtx/.test(fam));
assert("no families means no families line, not an empty one",
  !/already used/i.test(buildCoverageReport(weave(Q("α"), Q("β"), Q("γ")), [], STRUCT)));
assert("duplicates are collapsed",
  (buildCoverageReport(weave(Q("α"),Q("β"),Q("γ")), ["tensionCtx","tensionCtx","tensionCtx"], STRUCT).match(/tensionCtx/g)||[]).length === 1);
assert("non-string entries are dropped rather than printed",
  !/\[object|null|undefined|,\s*,/.test(buildCoverageReport(weave(Q("α"),Q("β"),Q("γ")), ["tensionCtx", null, 7, undefined], STRUCT)));

// ── 6. IT IS A REPORT, NOT AN INSTRUCTION ─────────────────────────────────
// This is the whole point of the thing. If it acquires imperatives it becomes the
// twenty-first order in a prompt that already carries twenty.
const body = buildCoverageReport(weave(Q("α"),Q("β"),Q("γ")), ["tensionCtx"], STRUCT);
assert("declares itself counted, not judged", /COUNTED, NOT JUDGED/.test(body));
assert("states explicitly that it is not an instruction", /NOT AN INSTRUCTION/i.test(body));
// The bare word "never" was a bad proxy: it appears in the disclaimer itself ("never what
// should happen next"), which is the OPPOSITE of an imperative. Targets verb phrases aimed
// at the model instead, and a mutation that injects one proves it still bites.
assert("contains no imperative directed at the model",
  !/\b(you must|you should|switch to |stop gathering|take priority|reflect the shape back|do not ask|never ask|ask instead)/i.test(body));
// A regex over prose cannot prove the absence of instruction, so the structural property
// carries the weight: every line the block adds is a counted number, nothing else.
assert("every reported line is a count, not a sentence about what to do",
  body.split('\n\u00b7 ').slice(1).every(l => /:\s*(\d+|none this session|[A-Za-z]+Ctx)/.test(l)));
assert("says a high number is not a verdict", /not a verdict/i.test(body));

// ── 7. WIRING ─────────────────────────────────────────────────────────────
const sfx = raw.slice(raw.indexOf("const dynamicSuffix"), raw.indexOf("].filter(Boolean).join"));
assert("WIRING: the report is in dynamicSuffix", /coverageReportCtx/.test(sfx));
assert("WIRING: it sits in tier 1 — informational background, beside materialEvidenceCtx",
  sfx.indexOf("coverageReportCtx") < sfx.indexOf("coreReadinessCtx") &&
  sfx.indexOf("coverageReportCtx") > sfx.indexOf("memCtx"));
// Found by mutation: a SECOND copy appended to the hard-constraint tier left every
// indexOf-based assertion green while the report silently became a final-position
// instruction — the exact thing tier 1 exists to prevent.
assert("WIRING: it appears in dynamicSuffix exactly once",
  (sfx.match(/coverageReportCtx/g) || []).length === 1);
assert("WIRING: it is NOT placed among the hard constraints at the end",
  sfx.indexOf("coverageReportCtx") < sfx.indexOf("firstReplyFloorCtx"));
// "PROMPT CACHING" also appears ~900 lines EARLIER in the file, so the end index has to be
// searched from the logger onward or the slice comes back empty and the assertion is vacuous.
const accStart = raw.indexOf("PROTOCOL COLLISION LOGGER");
const acc = raw.slice(accStart, raw.indexOf("PROMPT CACHING", accStart));
assert("WIRING: the already-computed `fired` list is accumulated instead of only logged",
  /familiesUsed\.current/.test(acc) && /fired/.test(acc));
assert("WIRING: the accumulator is reset per session", /familiesUsed\.current\s*=\s*\[\]/.test(raw));
assert("WIRING: no model call is introduced", !/callAura/.test(SRC));
// The logger observes families that COMPETE for a turn. A passive report is not one of
// them, and listing it there would have the report name itself as a used family.
assert("WIRING: the report is deliberately absent from the collision logger's family list",
  !/coverageReportCtx/.test(acc.slice(acc.indexOf("Object.entries"), acc.indexOf("filter(([, v])"))));
assert("INDEPENDENCE: reads no state from the road-map exit contract",
  !/roadMapDelivered|roadMapRecovered|extractRoadMapFromProse/.test(SRC));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
