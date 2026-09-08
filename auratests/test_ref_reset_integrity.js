// WHY THIS TEST EXISTS: session state left unreset between sessions has already caused multiple
// real bugs in this codebase — _activeCall (RT-fix #1, a stalled call could lock out the next
// session), firstWhyMessage (RT-fix #2, stale message content survived past its flag), the
// window.__auraLastCollision global (fixed alongside the ?debug=1 panel — carried a previous
// session's collision data forward forever), and methodFailureHint (fixed alongside this test —
// could leak a stale "switch strategy" signal into the very first reply of a brand-new session,
// where it collides with firstReplyFloorCtx's explicit prohibition on exactly the families
// methodFailureCtx recommends switching to). Each was found by manual audit, one at a time, after
// the fact. This test makes the invariant structural and automatic instead of relying on the next
// manual audit to catch the next one: every useRef declared inside AURAv2 must either be reset in
// resetSession(), or be named in the EXCEPTIONS list below with an explicit, reviewed reason. A
// new ref that is neither reset nor excepted fails this test immediately.
//
// STRUCTURAL PARSING, NOT LEXICAL: no AST parser is available in this environment (no
// node_modules installed), so this uses reliable string/regex-based structural extraction —
// the same convention every other test in this folder already uses (raw.indexOf('function X'))
// — rather than a full JS parser. The boundary-finding assumptions are checked explicitly below
// (not silently assumed), so a future refactor that breaks one of them fails loudly here instead
// of this test quietly stopping to check anything.

const fs = require('fs');
const path = require('path');

const raw = (() => {
  const candidates = ['/App.jsx', '/../src/App.jsx', '/src/App.jsx', '/../App.jsx', '/../../src/App.jsx'];
  for (const c of candidates) {
    const p = path.join(__dirname, c);
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }
  throw new Error('App.jsx not found. Put these files either next to App.jsx, or in a tests/ folder beside src/');
})();

let passed = 0, failed = 0;
function assert(desc, cond) {
  if (cond) { console.log('PASS —', desc); passed++; }
  else { console.log('FAIL —', desc); failed++; }
}

// ── Locate the AURAv2 component boundary ──
const componentStart = raw.indexOf('export default function AURAv2()');
if (componentStart < 0) {
  throw new Error('Could not find "export default function AURAv2()" — file shape changed, this test needs updating.');
}

// Structural assumption this test depends on: AURAv2 is the last component in the file, so
// everything from componentStart to EOF belongs to it. Checked here, not assumed silently —
// if MessageBubble (or anything else before AURAv2) ever declares its own useRef, that ref
// would be invisible to this test, so this must stay zero.
const messageBubbleStart = raw.indexOf('const MessageBubble');
const refsBeforeAURAv2 = messageBubbleStart >= 0
  ? (raw.slice(messageBubbleStart, componentStart).match(/\buseRef\(/g) || []).length
  : (raw.slice(0, componentStart).match(/\buseRef\(/g) || []).length;
assert('Nothing before AURAv2 (e.g. MessageBubble) declares its own useRef — otherwise this test\'s scoping assumption is wrong', refsBeforeAURAv2 === 0);

const aura2Body = raw.slice(componentStart);

// ── Enumerate every useRef declared inside AURAv2 ──
const refDeclPattern = /const\s+(\w+)\s*=\s*useRef\(/g;
const declaredRefs = [];
let m;
while ((m = refDeclPattern.exec(aura2Body)) !== null) {
  declaredRefs.push(m[1]);
}
assert('Found a substantial number of useRef declarations inside AURAv2 (sanity check the scan actually ran)', declaredRefs.length >= 30);

// ── Locate resetSession's own body ──
const resetStart = aura2Body.indexOf('const resetSession = () => {');
if (resetStart < 0) {
  throw new Error('Could not find "const resetSession = () => {" — file shape changed, this test needs updating.');
}
const resetEndMarker = aura2Body.indexOf('\n  };', resetStart);
if (resetEndMarker < 0) {
  throw new Error('Could not find resetSession\'s closing "  };" — file shape changed, this test needs updating.');
}
const resetSessionBody = aura2Body.slice(resetStart, resetEndMarker);

// ── Documented exceptions — refs intentionally NOT reset in resetSession, each with a reason ──
const EXCEPTIONS = {
  isListeningRef: 'mic hardware state, outside session scope',
  recognitionRef: 'mic hardware state, outside session scope',
  submittingRef: 'call guard, always released in a finally block — never left dangling across a session boundary',
  debugMode: 'URL-derived, read once — resetting it would break the debug panel on every new session',
  onboardingStepRef: 'harmless — permanently stuck at 0 because showDemo is hardcoded false (demo removed)',
  introChoiceRef: 'self-heals via its own useEffect, mirroring introChoice state which IS reset',
  // Found while writing this test (not in the original 5-item list) — both are plain DOM refs
  // (`ref={bottomRef}` / `ref={textareaRef}` in the JSX), attached and detached by React itself.
  // They hold a DOM node, never conversation state, so there is nothing session-scoped to reset.
  bottomRef: 'DOM ref (scroll anchor), managed by React\'s ref={} attribute — never manually reset',
  textareaRef: 'DOM ref (input element), managed by React\'s ref={} attribute — never manually reset',
};

const missing = [];
for (const ref of declaredRefs) {
  const isReset = new RegExp('\\b' + ref + '\\b').test(resetSessionBody);
  const isExcepted = Object.prototype.hasOwnProperty.call(EXCEPTIONS, ref);
  if (!isReset && !isExcepted) missing.push(ref);
  assert(`${ref}: reset in resetSession() or in the documented EXCEPTIONS list`, isReset || isExcepted);
}

if (missing.length > 0) {
  console.log('\nRefs missing a reset AND missing from EXCEPTIONS:', missing.join(', '));
}

// An exception for a ref that no longer exists (renamed/deleted) is stale documentation, not a
// legitimate exclusion — catch that too, so EXCEPTIONS can't silently drift from reality.
for (const ref of Object.keys(EXCEPTIONS)) {
  assert(`Exception "${ref}" still refers to a real useRef in AURAv2 (not stale)`, declaredRefs.includes(ref));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
