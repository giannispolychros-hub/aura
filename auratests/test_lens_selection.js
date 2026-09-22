// ── THE LENS SELECTOR ACTUALLY SELECTS ─────────────────────────────────────
//
// AURA has four system prompts — SIMPLIFY, CHALLENGE, PERSPECTIVE, EXPLORE — and a
// working client-side chooser, inferLensFallback. Measured on the two real sessions we
// have:
//
//   nurse   needsFirstWhy: false   lens it would get: EXPLORE      lens it got: SIMPLIFY
//   gaming  needsFirstWhy: false   lens it would get: PERSPECTIVE  lens it got: SIMPLIFY
//
// Both ran end to end on SIMPLIFY. The chooser was only ever reached from the First-WHY
// branch, which needs an opening of 60 words or fewer (RT-08's threshold, added so a long
// first message would not have its context discarded). Everyone with a substantial opening
// silently got the default, and three of the four prompts were unreachable for them.
//
// This is not dead code. It is a strategy selector that does not select, and when it does
// not run, every session gets the same strategy.
//
// THE ASYNC TRAP, which is why a ref exists here. setActiveLens is React state: calling it
// and then awaiting generateResponse in the same tick leaves the callback reading the OLD
// value, so the lens would apply from the NEXT turn — on the very turn it matters most.
// The distress path at App.jsx:5710 already has exactly this bug. A ref, set synchronously
// at each change site and read where the prompt is built, fixes both.
const fs = require('fs');
const raw = (()=>{const _p=require('path'),_f=require('fs');for(const c of ['/App.jsx','/../src/App.jsx','/src/App.jsx','/../App.jsx','/../../src/App.jsx']){const x=_p.join(__dirname,c);if(_f.existsSync(x))return _f.readFileSync(x,'utf8');}throw new Error('App.jsx not found');})();
function extract(name){const s=raw.indexOf('function '+name+'(');if(s<0)throw new Error('missing function '+name);const e=raw.indexOf('\n}',s)+2;return raw.slice(s,e);}
eval(extract('decideOpeningLens'));
eval(extract('lensCode'));
eval(extract('inferLensFallback'));

let passed = 0, failed = 0;
function assert(desc, cond) { if (cond) { console.log('PASS —', desc); passed++; } else { console.log('FAIL —', desc); failed++; } }

const INFER = t => inferLensFallback(t, "");
const NURSE = "έχω 4 παιδιά ζώα με 1.300€ και άλλα 1.000 συζύγου 20300€ χωρίς νίκαιο βέβαια θα τα λεφτά πλέον για την ελλάδα είναι πάρα πάρα πολύ λίγα και δεν ξέρω τι επιλογές έχω τι να κάνω δεύτερη δουλειά αλλά είμαι δημόσιος υπάλληλος και δεν ξέρω κατά πόσο περιορίζεται αυτό μην να ξανασπιβάσω αλλά σκέφτομαι και το εξωτερικό έντονα το βασικό μου πτυχίο είναι νοσηλευτική";
const GAMING = "Το πρόβλημα μου είναι πως χτίζω από το μηδέν ένα όνειρο που έχω εδώ και χρόνια απλά αποφάσισα να το υλοποιήσω τώρα. Μπήκα με τα όσα και νιώθω ότι είμαι φορτωμένος μέχρι πάνω. Χτίζω ένα κανάλι στο YouTube twitch tik tok discord τα έχω όλα σχεδόν έτοιμα αλλά τίποτα δεν εξελίσσεται σωστά. Οι viewers είναι σχεδόν 0 και κανένα βίντεο δεν βλέπει άσπρο φως. Έχω ξοδέψει χρόνο και χρήμα αλλά δεν αποδίδει όπως φανταζομουν.";

// ── 1. THE TWO REAL SESSIONS NOW GET THEIR OWN LENS ───────────────────────
assert("the nurse session's opening now selects EXPLORE, not the default",
  decideOpeningLens([], NURSE, INFER) === "EXPLORE");
assert("the gaming session's opening now selects PERSPECTIVE, not the default",
  decideOpeningLens([], GAMING, INFER) === "PERSPECTIVE");
assert("both openings are longer than the 60-word First-WHY threshold that used to skip this",
  NURSE.trim().split(/\s+/).length > 60 && GAMING.trim().split(/\s+/).length > 60);

// ── 2. ONLY THE SESSION'S FIRST USER MESSAGE ──────────────────────────────
// The lens is chosen once from the opening. Re-choosing every turn would let it thrash
// on a single stray word, and the existing switch points (compression, distress) stay
// the only other places it moves.
assert("a session that already has a user message does not re-choose",
  decideOpeningLens([{ role: "user", content: "παλιό" }, { role: "assistant", content: "x" }], GAMING, INFER) === null);
assert("assistant-only history still counts as no user message yet",
  decideOpeningLens([{ role: "assistant", content: "x" }], GAMING, INFER) === "PERSPECTIVE");

// ── 3. IT REFUSES RATHER THAN GUESSES ─────────────────────────────────────
assert("an empty opening chooses nothing", decideOpeningLens([], "   ", INFER) === null);
assert("a non-string opening chooses nothing", decideOpeningLens([], null, INFER) === null);
assert("a missing inferrer chooses nothing rather than defaulting",
  decideOpeningLens([], GAMING) === null && decideOpeningLens([], GAMING, "not a function") === null);
assert("an inferrer returning something outside the four known lenses is refused",
  decideOpeningLens([], GAMING, () => "SOMETHING_ELSE") === null &&
  decideOpeningLens([], GAMING, () => null) === null);
assert("malformed messages never throw",
  decideOpeningLens(null, GAMING, INFER) === "PERSPECTIVE" &&
  decideOpeningLens([null, 7, {}], GAMING, INFER) === "PERSPECTIVE");
assert("each of the four lenses is accepted when the inferrer returns it",
  ["SIMPLIFY","CHALLENGE","PERSPECTIVE","EXPLORE"].every(L => decideOpeningLens([], "κάτι", () => L) === L));

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
const SUBMIT_AT = raw.lastIndexOf("decideOpeningLens(messages, userText");
const SUBMIT = SUBMIT_AT === -1 ? "" : raw.slice(SUBMIT_AT - 600, SUBMIT_AT + 600);
assert("WIRING: the opening lens is decided on the main path, not only in First-WHY",
  /decideOpeningLens\(/.test(SUBMIT));
assert("WIRING: it is handed the real inferrer",
  /decideOpeningLens\([^)]*inferLensFallback/.test(SUBMIT));
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
