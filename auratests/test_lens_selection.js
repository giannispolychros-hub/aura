// ── THE LENS SELECTOR: BUILT, SHIPPED, AND REVERTED THE SAME DAY ──────────
//
// AURA has four system prompts and a working chooser, inferLensFallback, which was reached
// only from the First-WHY branch. Both real sessions ran end to end on SIMPLIFY while the
// chooser said EXPLORE and PERSPECTIVE, so b5db808 wired it to the main path.
//
// A REAL USER PAID FOR THAT, WITHIN A DAY. A teacher on 1300€ with four children opened a
// session that scores EXPLORE. SYSTEM_LENS_EXPLORE says, verbatim:
//
//     "Surface options the user has not considered or has dismissed too quickly."
//     "2–3 directions maximum."
//     "What are you ruling out before examining it?"
//
// AURA offered three directions he had not asked for — φροντιστήριο, online διδασκαλία,
// εκπαιδευτικό υλικό — then proposed a second public-sector post, then admitted it did not
// know whether that was legal. He answered: "Άρα μου προτείνεις κάτι που δεν ξέρεις αν
// επιτρέπεται και με βάζεις να το ψάξω?" That is a No-Advice violation, the product's first
// non-negotiable, and the lens produced it by doing exactly what it says.
//
// THE DEEPER MISTAKE, and the reason a straight re-land is forbidden: every lens prompt ends
// with "USE THIS LENS ONCE. Ask one question. Then stop and wait." But activeLens is
// SESSION-level, not turn-level. That was harmless while the lens was always SIMPLIFY, whose
// instruction is subtractive — "Never add complexity. Never introduce new considerations.
// Remove." Wiring the selector turned a one-shot instrument into a standing posture, and the
// posture chosen was "surface options" for a man who had just said he has none.
//
// WHAT THIS FILE NOW LOCKS: the selector is NOT wired, and the measured evidence for why it
// was attempted is kept so the next attempt starts from fact rather than from memory. What
// SURVIVED the revert is kept too — the async ref, which fixed a real pre-existing bug, and
// the telemetry, which keeps measuring what we could not see.
//
// BEFORE IT COMES BACK, the one-shot problem must be solved first: either the lens applies for
// a single turn, or the prompts are rewritten to survive standing use. Both touch prompt text.

const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('lensCode'));
eval(extract('inferLensFallback'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

const NURSE = "έχω 4 παιδιά ζώα με 1.300€ και άλλα 1.000 συζύγου 20300€ χωρίς νίκαιο βέβαια θα τα λεφτά πλέον για την ελλάδα είναι πάρα πάρα πολύ λίγα και δεν ξέρω τι επιλογές έχω τι να κάνω δεύτερη δουλειά αλλά είμαι δημόσιος υπάλληλος και δεν ξέρω κατά πόσο περιορίζεται αυτό μην να ξανασπιβάσω αλλά σκέφτομαι και το εξωτερικό έντονα το βασικό μου πτυχίο είναι νοσηλευτική";
const GAMING = "Το πρόβλημα μου είναι πως χτίζω από το μηδέν ένα όνειρο που έχω εδώ και χρόνια απλά αποφάσισα να το υλοποιήσω τώρα. Μπήκα με τα όσα και νιώθω ότι είμαι φορτωμένος μέχρι πάνω. Χτίζω ένα κανάλι στο YouTube twitch tik tok discord τα έχω όλα σχεδόν έτοιμα αλλά τίποτα δεν εξελίσσεται σωστά. Οι viewers είναι σχεδόν 0 και κανένα βίντεο δεν βλέπει άσπρο φως. Έχω ξοδέψει χρόνο και χρήμα αλλά δεν αποδίδει όπως φανταζομουν.";
const TEACHER = "Είμαι εκπαιδευτικός στη νοσηλευτική στο τμήμα ειδικής αγωγής, νεοδιοριστος. Βλέπω πλέον ότι τα 1300 ευρώ δε φτάνουν για ποιοτητικη ζωηυ .. στα 41 έτη μου δεν έχω κ πολλές επιλογές για να αυξήσω το εισόδημα μου έχοντας 4 παιδιά";

// ── 1. THE EVIDENCE, KEPT ─────────────────────────────────────────────────
// Not a claim that the selector should run. These are the readings that made it look
// worth doing, and the third is the one that shows what it cost.
assert("the chooser still scores the nurse opening EXPLORE",
  inferLensFallback(NURSE, "") === "EXPLORE");
assert("the chooser still scores the gaming opening PERSPECTIVE",
  inferLensFallback(GAMING, "") === "PERSPECTIVE");
assert("the teacher opening — the session that broke — scores EXPLORE",
  inferLensFallback(TEACHER, "") === "EXPLORE");
// EXPLORE is the lens that tells the model to produce directions. SIMPLIFY tells it the
// opposite. That contrast is the whole finding and it is pinned, not paraphrased.
const RAW_EXPLORE = raw.slice(raw.indexOf("const SYSTEM_LENS_EXPLORE"), raw.indexOf("SYSTEM_COMPRESSION = AURA_CORE"));
const RAW_SIMPLIFY = raw.slice(raw.indexOf("const SYSTEM_LENS_SIMPLIFY"), raw.indexOf("const SYSTEM_LENS_CHALLENGE"));
assert("EXPLORE still instructs the model to surface options and cap them at 2-3 directions",
  /Surface options the user has not considered/.test(RAW_EXPLORE) && /2.3 directions maximum/.test(RAW_EXPLORE));
assert("SIMPLIFY still instructs the exact opposite — never add, never introduce, remove",
  /Never add complexity\. Never introduce new considerations\. Remove\./.test(RAW_SIMPLIFY));
// The one-shot contract every lens declares, and which session-level state cannot honour.
assert("every lens still declares itself single-use, which is why re-landing needs a fix first",
  (raw.match(/USE THIS LENS ONCE/g) || []).length >= 4);

// ── 2. THE LOCK: the selector is not wired ────────────────────────────────
assert("REVERTED: nothing calls decideOpeningLens on the main path",
  !/decideOpeningLens\(/.test(raw));
assert("REVERTED: the function itself is gone, not left uncalled",
  !/function decideOpeningLens/.test(raw));
assert("the default lens is still SIMPLIFY", /useState\("SIMPLIFY"\)/.test(raw));

// ── 3. WHAT SURVIVED THE REVERT ───────────────────────────────────────────
// The ref fixed a real pre-existing bug: the distress path set PERSPECTIVE and immediately
// awaited generateResponse, which read the OLD state, so the lens applied a turn late.
assert("KEPT: the synchronous mirror ref", /const activeLensRef\s*=\s*useRef\(/.test(raw));
assert("KEPT: the prompt is built from the ref, never from the state",
  /getLensPrompt\(activeLensRef\.current\)/.test(raw) && !/getLensPrompt\(activeLens\)/.test(raw));
assert("KEPT: every remaining lens change still updates the ref",
  (raw.match(/activeLensRef\.current\s*=/g) || []).length >= (raw.match(/setActiveLens\(/g) || []).length);
assert("KEPT: the ref is reset per session", /activeLensRef\.current\s*=\s*"SIMPLIFY"/.test(raw));

// ── 4. THE TELEMETRY CODE ─────────────────────────────────────────────────
// Telemetry takes booleans and small non-negative integers only, so the lens travels as
// a code. 4 means "not one of the four", never a silent collapse into SIMPLIFY.
assert("the four lenses map to 0-3 in a fixed order",
  [lensCode("SIMPLIFY"), lensCode("CHALLENGE"), lensCode("PERSPECTIVE"), lensCode("EXPLORE")].join(",") === "0,1,2,3");
assert("anything else is 4, never folded into 0",
  lensCode("NOPE") === 4 && lensCode(null) === 4 && lensCode(undefined) === 4 && lensCode(7) === 4);

// ── 5. WIRING ─────────────────────────────────────────────────────────────
// Anchored on the call itself, not on a neighbouring line: the block sits BEFORE nextMsgs,
// so slicing forward from that line would start past what is being asserted.
// lastIndexOf, not indexOf: the FUNCTION DEFINITION shares that signature, and slicing
// around it produced a window where the parameter is named `infer` — the assertion below
// was reading the declaration instead of the call site.
// THE ASYNC TRAP: state alone would be read stale by generateResponse on this same turn.
assert("WIRING: a ref mirrors the lens for synchronous access",
  /const activeLensRef\s*=\s*useRef\(/.test(raw));
assert("WIRING: the prompt is built from the ref, not from the state",
  /getLensPrompt\(activeLensRef\.current\)/.test(raw) && !/getLensPrompt\(activeLens\)/.test(raw));
assert("WIRING: every place that changes the lens updates the ref too",
  (raw.match(/activeLensRef\.current\s*=/g) || []).length >= (raw.match(/setActiveLens\(/g) || []).length);
assert("WIRING: the ref is reset per session", /activeLensRef\.current\s*=\s*"SIMPLIFY"/.test(raw));
// Sliced to the end of the call rather than a fixed window, for the reason test_telemetry
// just had to learn: a window is only ever big enough until the next field is added.
const TEL_AT = raw.indexOf('recordTelemetry("session_completed"');
const TEL = raw.slice(TEL_AT, raw.indexOf('});', TEL_AT) + 3);
assert("WIRING: the session reports which lens ran", /lens:\s*lensCode\(/.test(TEL));
assert("WIRING: and how many times it moved, so 'never switched' is visible",
  /lensSwitches:/.test(TEL));

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
